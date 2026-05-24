import { create } from 'zustand';
import type { Project, SandboxState, TemplateId } from './types';
import { TEMPLATES } from './templates';

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
      sandbox: { status: 'idle', previewUrl: null, logs: [] },
    });
  },

  run: () => {
    const { project } = get();

    if (project.template === 'static') {
      // Build a Blob URL from all static files so the preview works without a server.
      const htmlFile = project.files.find((f) => f.path === 'index.html');
      const cssFile = project.files.find((f) => f.path === 'style.css');
      const jsFile = project.files.find((f) => f.path === 'script.js');

      // Inline CSS and JS into the HTML for Blob rendering.
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
        },
      });
    } else {
      // W3 will implement real sandbox execution for other templates.
      set((state) => ({
        sandbox: {
          ...state.sandbox,
          status: 'running',
          previewUrl: 'about:blank',
          logs: [
            ...state.sandbox.logs,
            `[${project.template}] sandbox execution not yet implemented (W3)`,
          ],
        },
      }));
    }
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
