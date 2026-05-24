import type { editor } from 'monaco-editor';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { useStore } from '../store';

function guessLanguage(path: string): string {
  if (path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.jsx')) return 'javascript';
  if (path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.vue')) return 'html';
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.json')) return 'json';
  return 'plaintext';
}

// Monaco KeyCode / KeyMod constants (from monaco-editor source, stable values)
// CtrlCmd = 2048 (platform-aware: Ctrl on Win/Linux, Cmd on Mac)
// KeyS    = 49
const CTRL_CMD = 2048;
const KEY_S = 49;

export function Editor() {
  const { project, updateFileContent, run } = useStore((s) => ({
    project: s.project,
    updateFileContent: s.updateFileContent,
    run: s.run,
  }));

  const activeFile = project.files.find((f) => f.path === project.entry);
  const language = guessLanguage(project.entry);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateFileContent(project.entry, value);
    }
  };

  const handleMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    // Task 5: Cmd+S (Mac) / Ctrl+S (Win/Linux) → trigger run.
    // addCommand uses Monaco's built-in key binding; the browser save dialog
    // is suppressed because Monaco intercepts keydown at the editor level.
    editorInstance.addCommand(CTRL_CMD | KEY_S, () => {
      run();
    });
  };

  // Prevent beforeunload from treating Ctrl+S as a browser save shortcut
  // when focus is outside Monaco. (Monaco itself handles this inside its canvas.)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col bg-gray-950"
      onKeyDown={handleKeyDown}
    >
      <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 text-xs text-gray-400 shrink-0">
        {project.entry}
      </div>
      <div className="flex-1 min-h-0">
        <MonacoEditor
          key={project.entry}
          height="100%"
          language={language}
          theme="vs-dark"
          value={activeFile?.content ?? ''}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            tabSize: 2,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

// Suppress unused import warning — loader is used indirectly by MonacoEditor
void loader;
