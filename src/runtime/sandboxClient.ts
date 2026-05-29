/**
 * Minimal sandbox API client — pure fetch, no SDK dependency.
 *
 * Endpoints confirmed against:
 *   agent-sandbox-platform/api/openapi.yaml
 *
 *   POST   /v1/sandboxes                              → CreateSandboxRequest / Sandbox
 *   PUT    /v1/sandboxes/{id}/fs/{path}               → write file (octet-stream body)
 *   POST   /v1/sandboxes/{id}/processes               → StartProcessRequest / Process
 *   GET    /v1/sandboxes/{id}/processes               → ProcessList (poll for state)
 *   GET    /v1/sandboxes/{id}/processes/{id}/logs     → text/plain tail (byte-offset polling)
 *   POST   /v1/sandboxes/{id}/expose                  → ExposeRequest / ExposeResponse
 *   DELETE /v1/sandboxes/{id}                         → kill sandbox
 *
 * Log streaming note: the OpenAPI spec (v1.0.0) has no WebSocket/SSE/follow
 * endpoint for process logs — only a snapshot GET with optional ?tail= bytes.
 * We implement "streaming" as incremental polling: track byteOffset, fetch
 * only new bytes on each tick (200 ms while running, 1 s after exit check).
 * The server does not support Range headers per the spec, so we fetch the full
 * log and slice client-side, using ?tail=<remaining_cap> to bound response size.
 */

import type { ProjectFile } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

// BFF 代理路径：前端请求同源 /playground/api/*，由服务器侧注入 Authorization 后转发。
// 本地开发可通过 VITE_PLAYGROUND_API_BASE 指向本地或远程 BFF 地址。
const API_BASE: string =
  (import.meta.env['VITE_PLAYGROUND_API_BASE'] as string | undefined) ?? '/playground/api';

// ─── Errors ──────────────────────────────────────────────────────────────────

export class SandboxError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Sandbox API error ${status}: ${body}`);
    this.name = 'SandboxError';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// 前端不再持有 API Key，Authorization 由后端 BFF 层注入。
// 此函数保留以维持调用点结构，仅返回空对象。
function authHeaders(): Record<string, string> {
  return {};
}

async function checkResponse(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await res.text().catch(() => '');
  throw new SandboxError(res.status, body);
}

async function jsonPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
    signal,
  });
  await checkResponse(res);
  return res.json() as Promise<T>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SandboxInfo {
  id: string;
  /** Base preview URL from the sandbox DTO (may be empty if not yet ready). */
  previewBase: string;
}

/**
 * Create a new sandbox.
 * Uses v2 style: image_id omitted (server uses default), network open so npm/pip
 * can reach the internet, ttl 30m to avoid orphaned containers.
 */
export async function createSandbox(signal?: AbortSignal): Promise<SandboxInfo> {
  const data = await jsonPost<{ id: string; preview_url?: string }>(
    '/v1/sandboxes?wait=running&wait_timeout=60s',
    {
      network: 'open',
      ttl: '30m',
    },
    signal,
  );
  return { id: data.id, previewBase: data.preview_url ?? '' };
}

/**
 * Write all project files into the sandbox via individual PUT requests.
 * The OpenAPI spec has PUT /v1/sandboxes/{id}/fs/{path} with octet-stream body.
 */
export async function writeFiles(
  id: string,
  files: ProjectFile[],
  signal?: AbortSignal,
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const encodedPath = file.path
        .replace(/^\/+/, '')
        .split('/')
        .map(encodeURIComponent)
        .join('/');

      const res = await fetch(`${API_BASE}/v1/sandboxes/${id}/fs/${encodedPath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          ...authHeaders(),
        },
        body: file.content,
        signal,
      });
      await checkResponse(res);
    }),
  );
}

export interface ProcessResult {
  processId: string;
  exitCode: number;
  output: string;
}

/**
 * Run a command inside the sandbox and wait for it to exit.
 *
 * Log streaming strategy (OpenAPI has no follow/SSE/WS for logs):
 * - Poll GET /processes/{id}/logs every 200 ms
 * - Track byteOffset client-side; slice new bytes from full response
 * - Use ?tail=<cap> to bound the initial response (max 32 MiB per spec)
 * - Simultaneously poll GET /processes (list) every 1 s to detect exit
 */
export async function runCommand(
  id: string,
  cmd: string,
  onLog?: (line: string) => void,
  signal?: AbortSignal,
): Promise<ProcessResult> {
  const args = splitCommand(cmd);

  const proc = await jsonPost<{
    id: string;
    state: string;
    exit_code: number;
    exited_at: number;
  }>(
    `/v1/sandboxes/${id}/processes`,
    { command: args, cwd: '/workspace' },
    signal,
  );

  const procId = proc.id;

  let byteOffset = 0;
  let lastStateCheck = 0;

  for (let tick = 0; tick < 3000; tick++) {
    // Log poll every 200 ms
    await sleep(200, signal);

    const logText = await fetchLogsTail(id, procId, signal);
    if (logText !== null && logText.length > byteOffset) {
      const newText = logText.slice(byteOffset);
      byteOffset = logText.length;
      if (onLog) {
        newText.split('\n').filter(Boolean).forEach(onLog);
      }
    }

    // State check every 1 s (every 5 ticks)
    const now = Date.now();
    if (now - lastStateCheck >= 1000) {
      lastStateCheck = now;
      const current = await findProcess(id, procId, signal);
      if (!current) break; // process gone from list
      if (current.state !== 'running') {
        // Drain any remaining log bytes
        const finalLog = await fetchLogsTail(id, procId, signal);
        if (finalLog !== null && finalLog.length > byteOffset) {
          const tail = finalLog.slice(byteOffset);
          if (onLog) tail.split('\n').filter(Boolean).forEach(onLog);
        }
        return { processId: procId, exitCode: current.exit_code, output: '' };
      }
    }
  }

  return { processId: procId, exitCode: -1, output: '' };
}

/**
 * Stream logs from a long-running process (dev server, etc.) until the
 * AbortSignal fires. Calls onChunk with each new text chunk as it arrives.
 *
 * Implementation: incremental polling GET /processes/{id}/logs every 500 ms.
 * No WebSocket/SSE endpoint exists in the current OpenAPI spec for process logs.
 * The PTY endpoint (/pty) is for interactive bidirectional terminals, not
 * stdout/stderr capture.
 */
export async function streamLogs(
  sandboxId: string,
  procId: string,
  onChunk: (line: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let byteOffset = 0;

  while (!signal.aborted) {
    await sleep(500, signal).catch(() => null);
    if (signal.aborted) break;

    const text = await fetchLogsTail(sandboxId, procId, signal).catch(() => null);
    if (text !== null && text.length > byteOffset) {
      const newText = text.slice(byteOffset);
      byteOffset = text.length;
      newText.split('\n').filter(Boolean).forEach(onChunk);
    }
  }
}

/**
 * Spawn a long-running command (dev server, node server, flask).
 * POST to processes and return immediately — do NOT wait for exit.
 *
 * exposePorts 声明进程对外暴露的端口。这一步至关重要:它让 runc adapter 在进程
 * 启动时建立 DNAT 映射(127.0.0.1:<hostPort> → sandbox:<port>),preview 反代才
 * 能连到 dev server。不声明 → preview 502 "upstream unavailable"。
 */
export async function spawnCommand(
  id: string,
  cmd: string,
  exposePorts?: number[],
  signal?: AbortSignal,
): Promise<string> {
  const args = splitCommand(cmd);
  const body: Record<string, unknown> = { command: args, cwd: '/workspace' };
  if (exposePorts && exposePorts.length > 0) {
    body['expose_ports'] = exposePorts;
  }
  const proc = await jsonPost<{ id: string }>(
    `/v1/sandboxes/${id}/processes`,
    body,
    signal,
  );
  return proc.id;
}

/**
 * Expose a port via POST /v1/sandboxes/{id}/expose.
 *
 * 后端开了 subdomain preview 模式(SANDBOX_PREVIEW_DOMAIN_SUFFIX)时,返回的 URL
 * 是 `https://<port>-<sandbox-id>.preview.<域名>` —— 每个 sandbox+端口一个独立子
 * 域名(行业标准,CodeSandbox/Gitpod 同款)。子域名下 dev server 用默认 base="/"
 * 跑,资源绝对路径天然正确;泛域名证书由 Caddy 自动签发。
 *
 * 这个 URL 已是完整可直接 iframe 的地址,前端不需要再改写。
 */
export async function exposePort(
  id: string,
  port: number,
  signal?: AbortSignal,
): Promise<{ url: string }> {
  const data = await jsonPost<{ port: number; url: string; signed: boolean; expires_at: string }>(
    `/v1/sandboxes/${id}/expose`,
    { port },
    signal,
  );
  return { url: data.url };
}

/**
 * Kill (destroy) a sandbox.
 */
export async function killSandbox(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/sandboxes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  // 404 is fine — already gone
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => '');
    throw new SandboxError(res.status, body);
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Fetch the full log text for a process (returns null on error).
 * Uses ?tail=33554432 (32 MiB, the spec max) to avoid silent truncation.
 */
async function fetchLogsTail(
  sandboxId: string,
  procId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE}/v1/sandboxes/${sandboxId}/processes/${procId}/logs?tail=33554432`,
      { headers: authHeaders(), signal },
    );
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/**
 * Find a process by ID in the process list. Returns null if not found.
 */
async function findProcess(
  sandboxId: string,
  procId: string,
  signal?: AbortSignal,
): Promise<{ id: string; state: string; exit_code: number } | null> {
  try {
    const res = await fetch(
      `${API_BASE}/v1/sandboxes/${sandboxId}/processes`,
      { headers: authHeaders(), signal },
    );
    if (!res.ok) return null;
    const list = await res.json() as { processes: Array<{ id: string; state: string; exit_code: number }> };
    return list.processes.find((p) => p.id === procId) ?? null;
  } catch {
    return null;
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Naive shell split: handles quoted strings and plain tokens. */
function splitCommand(cmd: string): string[] {
  const args: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  for (const ch of cmd) {
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (ch === ' ' && !inSingle && !inDouble) {
      if (current) { args.push(current); current = ''; }
      continue;
    }
    current += ch;
  }
  if (current) args.push(current);
  return args;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
  });
}
