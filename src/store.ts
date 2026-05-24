import { create } from 'zustand';
import LZString from 'lz-string';
import type { Project, SandboxState, TemplateId } from './types';
import { TEMPLATES } from './templates';
import {
  SandboxError,
  createSandbox,
  writeFiles,
  runCommand,
  spawnCommand,
  exposePort,
  streamLogs,
  killSandbox,
} from './runtime/sandboxClient';

interface StoreState {
  project: Project;
  sandbox: SandboxState;
  /** True when editor has unsaved (un-run) changes. Reset on successful run. */
  dirty: boolean;
  /** Autosave pending (debounce in flight) */
  autosavePending: boolean;
  /** Open file tabs (ordered list of file paths) */
  openTabs: string[];
  /** Currently active tab (= editor entry) */
  activeTab: string;

  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  selectTemplate: (id: TemplateId) => void;
  loadProject: (project: Project) => void;
  serializeForShare: () => string;
  run: () => void;
  stop: () => void;
  dismissError: () => void;
  appendLog: (line: string) => void;

  // Tab management
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
}

// Keep the active AbortController so Stop can cancel ongoing work
let activeController: AbortController | null = null;

// Debounce timer for autosave
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

const DRAFT_KEY = 'talon-playground:draft';

function resetSandboxState(): SandboxState {
  return {
    status: 'idle',
    previewUrl: null,
    sandboxId: null,
    logs: [],
    phase: undefined,
    errorMessage: undefined,
  };
}

const initialProject = TEMPLATES.static;
const initialEntry = initialProject.entry;

export const useStore = create<StoreState>((set, get) => ({
  project: initialProject,
  dirty: false,
  autosavePending: false,
  openTabs: [initialEntry],
  activeTab: initialEntry,
  sandbox: resetSandboxState(),

  setActiveFile: (path: string) => {
    set((state) => ({ project: { ...state.project, entry: path } }));
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      dirty: true,
      autosavePending: true,
      project: {
        ...state.project,
        files: state.project.files.map((f) =>
          f.path === path ? { ...f, content } : f,
        ),
      },
    }));

    // Debounced autosave
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      const { project } = get();
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(project));
      } catch {
        // Ignore quota errors silently
      }
      set({ autosavePending: false });
      autosaveTimer = null;
    }, 1000);
  },

  selectTemplate: (id: TemplateId) => {
    const tpl = TEMPLATES[id];
    set({
      project: tpl,
      dirty: false,
      autosavePending: false,
      openTabs: [tpl.entry],
      activeTab: tpl.entry,
      sandbox: resetSandboxState(),
    });
  },

  loadProject: (project: Project) => {
    set({
      project,
      dirty: false,
      autosavePending: false,
      openTabs: [project.entry],
      activeTab: project.entry,
      sandbox: resetSandboxState(),
    });
  },

  serializeForShare: () => {
    const { project } = get();
    return JSON.stringify(project);
  },

  // Tab management
  openFile: (path: string) => {
    set((state) => {
      const alreadyOpen = state.openTabs.includes(path);
      return {
        project: { ...state.project, entry: path },
        activeTab: path,
        openTabs: alreadyOpen ? state.openTabs : [...state.openTabs, path],
      };
    });
  },

  closeTab: (path: string) => {
    set((state) => {
      const tabs = state.openTabs.filter((t) => t !== path);
      if (tabs.length === 0) {
        return { openTabs: [], activeTab: '' };
      }
      // If the closed tab was active, switch to the last remaining tab
      const nextActive =
        state.activeTab === path ? tabs[tabs.length - 1] : state.activeTab;
      return {
        openTabs: tabs,
        activeTab: nextActive,
        project: { ...state.project, entry: nextActive },
      };
    });
  },

  setActiveTab: (path: string) => {
    set((state) => ({
      activeTab: path,
      project: { ...state.project, entry: path },
    }));
  },

  run: () => {
    const { project, sandbox } = get();

    // Cancel any previous run
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    // If there's an active sandbox, destroy it first (fire-and-forget)
    if (sandbox.sandboxId) {
      void killSandbox(sandbox.sandboxId);
    }

    if (project.template === 'static') {
      const htmlFile = project.files.find((f) => f.path === 'index.html');
      const cssFile = project.files.find((f) => f.path === 'style.css');
      const jsFile = project.files.find((f) => f.path === 'script.js');

      let html = htmlFile?.content ?? '<h1>No index.html found</h1>';
      if (cssFile) {
        html = html.replace(
          /<link[^>]*href=["']style\.css["'][^>]*\/?>/i,
          `<style>\n${cssFile.content}\n</style>`,
        );
      }
      if (jsFile) {
        html = html.replace(
          /<script[^>]*src=["']script\.js["'][^>]*><\/script>/i,
          `<script>\n${jsFile.content}\n</script>`,
        );
      }

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      set({
        dirty: false,
        sandbox: {
          status: 'running',
          previewUrl: url,
          sandboxId: null,
          logs: ['[static] preview rendered via Blob URL'],
          phase: 'Ready',
          errorMessage: undefined,
        },
      });
      return;
    }

    // Non-static: real sandbox
    const controller = new AbortController();
    activeController = controller;

    set({
      dirty: false,
      sandbox: {
        status: 'starting',
        previewUrl: null,
        sandboxId: null,
        logs: [],
        phase: 'Creating sandbox...',
        errorMessage: undefined,
      },
    });

    const appendLog = (line: string) => {
      set((state) => ({
        sandbox: { ...state.sandbox, logs: [...state.sandbox.logs, line] },
      }));
    };

    const setPhase = (phase: string) => {
      appendLog(`[talon] ${phase}`);
      set((state) => ({
        sandbox: { ...state.sandbox, phase },
      }));
    };

    const setSandboxField = (partial: Partial<SandboxState>) => {
      set((state) => ({
        sandbox: { ...state.sandbox, ...partial },
      }));
    };

    void runSandbox(project, appendLog, setPhase, setSandboxField, controller);
  },

  stop: () => {
    // Abort in-flight requests
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    const { sandbox } = get();
    // Destroy the sandbox (fire-and-forget)
    if (sandbox.sandboxId) {
      void killSandbox(sandbox.sandboxId);
    }
    set((state) => ({
      sandbox: {
        ...state.sandbox,
        status: 'idle',
        previewUrl: null,
        sandboxId: null,
        phase: undefined,
        errorMessage: undefined,
      },
    }));
  },

  dismissError: () => {
    set((state) => ({
      sandbox: { ...state.sandbox, errorMessage: undefined },
    }));
  },

  appendLog: (line: string) => {
    set((state) => ({
      sandbox: {
        ...state.sandbox,
        logs: [...state.sandbox.logs, line],
      },
    }));
  },
}));

// ─── Share URL helpers ────────────────────────────────────────────────────────

export const SHARE_URL_WARN_LENGTH = 2000;

export function buildShareUrl(serialized: string): string {
  const compressed = LZString.compressToEncodedURIComponent(serialized);
  const base =
    import.meta.env.PROD
      ? 'https://playground.sandbox.talon.net.cn'
      : window.location.origin;
  return `${base}/?p=${compressed}`;
}

export function parseShareParam(search: string): Project | null {
  const params = new URLSearchParams(search);
  const p = params.get('p');
  if (!p) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(p);
    if (!json) return null;
    const parsed = JSON.parse(json) as Project;
    // Basic validation
    if (!parsed.template || !Array.isArray(parsed.files) || !parsed.entry) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ─── localStorage draft helpers ───────────────────────────────────────────────

export const DRAFT_STORAGE_KEY = DRAFT_KEY;

export function loadDraft(): Project | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Project;
    if (!parsed.template || !Array.isArray(parsed.files) || !parsed.entry) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore
  }
}

// ─── Async sandbox orchestration ─────────────────────────────────────────────

async function runSandbox(
  project: Project,
  appendLog: (line: string) => void,
  setPhase: (phase: string) => void,
  setSandboxField: (partial: Partial<SandboxState>) => void,
  controller: AbortController,
): Promise<void> {
  const { signal } = controller;

  try {
    // 1. Create sandbox
    setPhase('Creating sandbox...');
    const { id } = await createSandbox(signal);
    appendLog(`[talon] sandbox id: ${id}`);
    setSandboxField({ sandboxId: id });

    // 2. Write files
    setPhase('Writing files...');
    await writeFiles(id, project.files, signal);
    appendLog(`[talon] ${project.files.length} file(s) written`);

    // 3. Template-specific run plan
    let port: number;

    switch (project.template) {
      case 'react-vite':
      case 'vue-vite': {
        port = 5173;
        setPhase('Installing deps...');
        const installResult = await runCommand(
          id,
          'npm install',
          (line) => appendLog(`[npm] ${line}`),
          signal,
        );
        if (installResult.exitCode !== 0) {
          throw new Error(`npm install failed (exit ${installResult.exitCode})`);
        }
        setPhase('Starting dev server...');
        const devProcId = await spawnCommand(id, 'npm run dev -- --host 0.0.0.0 --port 5173', signal);
        // Stream dev-server logs until stop is called
        void streamLogs(id, devProcId, (line) => appendLog(`[dev] ${line}`), signal);
        break;
      }

      case 'node-express': {
        port = 3000;
        setPhase('Installing deps...');
        const installResult = await runCommand(
          id,
          'npm install',
          (line) => appendLog(`[npm] ${line}`),
          signal,
        );
        if (installResult.exitCode !== 0) {
          throw new Error(`npm install failed (exit ${installResult.exitCode})`);
        }
        setPhase('Starting server...');
        const nodeProcId = await spawnCommand(id, 'node index.js', signal);
        void streamLogs(id, nodeProcId, (line) => appendLog(`[server] ${line}`), signal);
        break;
      }

      case 'flask': {
        port = 5000;
        setPhase('Installing deps...');
        const pipResult = await runCommand(
          id,
          'pip install -r requirements.txt',
          (line) => appendLog(`[pip] ${line}`),
          signal,
        );
        if (pipResult.exitCode !== 0) {
          throw new Error(`pip install failed (exit ${pipResult.exitCode})`);
        }
        setPhase('Starting Flask app...');
        const flaskProcId = await spawnCommand(id, 'python app.py', signal);
        void streamLogs(id, flaskProcId, (line) => appendLog(`[flask] ${line}`), signal);
        break;
      }

      default: {
        throw new Error(`Unknown template: ${project.template}`);
      }
    }

    // 4. Expose port
    setPhase('Exposing port...');
    const { url } = await exposePort(id, port, signal);
    appendLog(`[talon] preview URL: ${url}`);

    // 5. Done
    setSandboxField({ status: 'running', previewUrl: url, phase: 'Ready' });
    appendLog('[talon] Ready');
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') return;

    const message =
      err instanceof SandboxError
        ? `SandboxError ${err.status}: ${err.body}`
        : err instanceof Error
          ? err.message
          : String(err);

    appendLog(`[error] ${message}`);
    setSandboxField({ status: 'error', phase: 'Error', errorMessage: message });
  }
}
