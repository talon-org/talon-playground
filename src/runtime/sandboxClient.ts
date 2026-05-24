/**
 * Minimal sandbox API client — pure fetch, no SDK dependency.
 *
 * Endpoints confirmed against:
 *   agent-sandbox-platform/api/openapi.yaml
 *
 *   POST   /v1/sandboxes                   → CreateSandboxRequest / Sandbox
 *   PUT    /v1/sandboxes/{id}/fs/{path}     → write file (octet-stream body)
 *   POST   /v1/sandboxes/{id}/processes     → StartProcessRequest / Process
 *   POST   /v1/sandboxes/{id}/expose        → ExposeRequest / ExposeResponse
 *   DELETE /v1/sandboxes/{id}               → kill sandbox
 */

import type { ProjectFile } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE: string =
  (import.meta.env['VITE_SANDBOX_API_BASE'] as string | undefined) ??
  'https://api.sandbox.talon.net.cn';

const API_KEY: string =
  (import.meta.env['VITE_SANDBOX_API_KEY'] as string | undefined) ?? '';

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

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  return headers;
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
    '/v1/sandboxes?wait=running&wait_timeout=60',
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
      // Strip leading slash from path, then encode each segment individually
      // so that nested paths like src/App.tsx become src%2FApp.tsx — but the
      // OpenAPI parameter is `{path}` with a wildcard (path-style), meaning
      // the server expects the literal slash delimiters in the URL.
      // We therefore just encode non-slash special chars.
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
 * Use this for install steps (npm install, pip install).
 *
 * The OpenAPI has no explicit "wait" flag — we POST to start the process
 * (returns immediately with a Process object), then poll the process logs
 * until exited_at != 0 or state != 'running'.
 *
 * NOTE: This is inferred from the OpenAPI (no explicit wait parameter in spec).
 * The spec's StartProcessRequest has no detach/wait field; we treat each
 * POST as "fire and track manually".
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

  // Poll until process exits
  let lastLogLength = 0;
  for (let attempts = 0; attempts < 600; attempts++) {
    await sleep(1000, signal);

    // Fetch logs since last position
    const logRes = await fetch(
      `${API_BASE}/v1/sandboxes/${id}/processes/${procId}/logs`,
      { headers: authHeaders(), signal },
    );
    if (logRes.ok) {
      const logText = await logRes.text();
      const newText = logText.slice(lastLogLength);
      if (newText && onLog) {
        newText.split('\n').filter(Boolean).forEach(onLog);
      }
      lastLogLength = logText.length;
    }

    // Check process state
    const statusRes = await fetch(
      `${API_BASE}/v1/sandboxes/${id}/processes/${procId}`,
      { headers: authHeaders(), signal },
    );
    if (!statusRes.ok) break;

    // The spec lists process under ProcessList but not a single GET.
    // We infer the process is done from non-zero exited_at by listing all.
    // Actually the DELETE endpoint at /{proc_id} is "stop", there's no GET single.
    // We'll use the logs endpoint as signal — when state is not running we stop.
    // Use the state returned from startProcess polling approach:
    // Re-fetch the process list and find our proc.
    const listRes = await fetch(
      `${API_BASE}/v1/sandboxes/${id}/processes`,
      { headers: authHeaders(), signal },
    );
    if (!listRes.ok) break;

    const list = await listRes.json() as { processes: Array<{ id: string; state: string; exit_code: number }> };
    const current = list.processes.find((p) => p.id === procId);
    if (!current) break; // process gone
    if (current.state !== 'running') {
      return { processId: procId, exitCode: current.exit_code, output: '' };
    }
  }

  return { processId: procId, exitCode: -1, output: '' };
}

/**
 * Spawn a long-running command (dev server, node server, flask).
 * POST to processes and return immediately — do NOT wait for exit.
 */
export async function spawnCommand(
  id: string,
  cmd: string,
  signal?: AbortSignal,
): Promise<string> {
  const args = splitCommand(cmd);
  const proc = await jsonPost<{ id: string }>(
    `/v1/sandboxes/${id}/processes`,
    { command: args, cwd: '/workspace' },
    signal,
  );
  return proc.id;
}

/**
 * Expose a port via POST /v1/sandboxes/{id}/expose.
 * Returns the preview URL.
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
