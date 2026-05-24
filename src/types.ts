export type TemplateId = 'static' | 'react-vite' | 'vue-vite' | 'node-express' | 'flask';

export interface ProjectFile {
  path: string; // e.g. "src/App.tsx"
  content: string;
}

export interface Project {
  template: TemplateId;
  files: ProjectFile[];
  entry: string; // path of file currently open in editor
}

export interface SandboxState {
  status: 'idle' | 'starting' | 'running' | 'error';
  previewUrl: string | null;
  logs: string[];
  /** Current human-readable phase label shown in the UI during run. */
  phase?: string;
}
