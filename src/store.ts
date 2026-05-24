import { create } from 'zustand';
import type { Project, SandboxState, TemplateId } from './types';
import { TEMPLATES } from './templates';
import {
  SandboxError,
  createSandbox,
  writeFiles,
  runCommand,
  spawnCommand,
  exposePort,
} from './runtime/sandboxClient';

interface StoreState {
  project: Project;
  sandbox: SandboxState;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  selectTemplate: (id: TemplateId) => void;
  run: () => void;
  appendLog: (line: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  project: TEMPLATES.static,
  sandbox: {
    status: 'idle',
    previewUrl: null,
    logs: [],
    phase: undefined,
  },

  setActiveFile: (path: string) => {
    set((state) => ({ project: { ...state.project, entry: path } }));
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      project: {
        ...state.project,
        files: state.project.files.map((f) =>
          f.path === path ? { ...f, content } : f,
        ),
      },
    }));
  },

  selectTemplate: (id: TemplateId) => {
    set({
      project: TEMPLATES[id],
      sandbox: { status: 'idle', previewUrl: null, logs: [], phase: undefined },
    });
  },

  run: () => {
    const { project } = get();

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
        sandbox: {
          status: 'running',
          previewUrl: url,
          logs: ['[static] preview rendered via Blob URL'],
          phase: 'Ready',
        },
      });
      return;
    }

    // Non-static: real sandbox
    set({
      sandbox: {
        status: 'starting',
        previewUrl: null,
        logs: [],
        phase: 'Creating sandbox...',
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

    void runSandbox(project, appendLog, setPhase, setSandboxField);
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

// ─── Async sandbox orchestration ─────────────────────────────────────────────

async function runSandbox(
  project: Project,
  appendLog: (line: string) => void,
  setPhase: (phase: string) => void,
  setSandboxField: (partial: Partial<SandboxState>) => void,
): Promise<void> {
  const controller = new AbortController();
  const { signal } = controller;

  try {
    // 1. Create sandbox
    setPhase('Creating sandbox...');
    const { id } = await createSandbox(signal);
    appendLog(`[talon] sandbox id: ${id}`);

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
        await spawnCommand(id, 'npm run dev -- --host 0.0.0.0 --port 5173', signal);
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
        await spawnCommand(id, 'node index.js', signal);
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
        await spawnCommand(id, 'python app.py', signal);
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
    setSandboxField({ status: 'error', phase: 'Error' });
  }
}
