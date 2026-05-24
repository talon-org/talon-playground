import MonacoEditor from '@monaco-editor/react';
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

export function Editor() {
  const { project, updateFileContent } = useStore((s) => ({
    project: s.project,
    updateFileContent: s.updateFileContent,
  }));

  const activeFile = project.files.find((f) => f.path === project.entry);
  const language = guessLanguage(project.entry);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateFileContent(project.entry, value);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-950">
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
