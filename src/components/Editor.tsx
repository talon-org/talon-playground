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
  if (path.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

// Monaco KeyCode / KeyMod constants (from monaco-editor source, stable values)
// CtrlCmd = 2048 (platform-aware: Ctrl on Win/Linux, Cmd on Mac)
// KeyS    = 49
const CTRL_CMD = 2048;
const KEY_S = 49;

export function Editor() {
  const { project, updateFileContent, run, openTabs, activeTab, closeTab, setActiveTab, autosavePending } =
    useStore((s) => ({
      project: s.project,
      updateFileContent: s.updateFileContent,
      run: s.run,
      openTabs: s.openTabs,
      activeTab: s.activeTab,
      closeTab: s.closeTab,
      setActiveTab: s.setActiveTab,
      autosavePending: s.autosavePending,
    }));

  const activeFile = project.files.find((f) => f.path === activeTab);
  const language = activeTab ? guessLanguage(activeTab) : 'plaintext';

  const handleChange = (value: string | undefined) => {
    if (value !== undefined && activeTab) {
      updateFileContent(activeTab, value);
    }
  };

  const handleMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorInstance.addCommand(CTRL_CMD | KEY_S, () => {
      run();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
    }
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-full w-full flex flex-col bg-bg-0">
        <div className="flex-1 flex items-center justify-center text-fg-4 text-sm select-none">
          选一个文件开始编辑
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col bg-bg-0"
      onKeyDown={handleKeyDown}
    >
      {/* Tab bar */}
      <div
        className="flex items-end bg-bg-1 border-b border-line shrink-0 overflow-x-auto"
        role="tablist"
        aria-label="Open file tabs"
      >
        {openTabs.map((tabPath) => {
          const isActive = tabPath === activeTab;
          const fileName = tabPath.split('/').pop() ?? tabPath;
          return (
            <div
              key={tabPath}
              role="tab"
              aria-selected={isActive}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-line shrink-0 max-w-[160px] group',
                isActive
                  ? 'bg-bg-0 text-fg-0 border-t-2 border-t-acc'
                  : 'bg-bg-1 text-fg-3 hover:bg-bg-hover hover:text-fg-1',
              ].join(' ')}
              onClick={() => setActiveTab(tabPath)}
              title={tabPath}
            >
              {isActive && autosavePending && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-warn shrink-0"
                  aria-label="Unsaved"
                  title="Saving..."
                />
              )}
              <span className="truncate">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabPath);
                }}
                className="ml-auto shrink-0 text-fg-4 hover:text-fg-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity leading-none"
                aria-label={`Close tab ${fileName}`}
                tabIndex={0}
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <MonacoEditor
            key={activeTab}
            height="100%"
            language={language}
            theme="vs-dark"
            value={activeFile.content}
            onChange={handleChange}
            onMount={handleMount}
            options={{
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Geist Mono", "Fira Code", monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'line',
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-fg-4 text-sm select-none">
            选一个文件开始编辑
          </div>
        )}
      </div>
    </div>
  );
}

void loader;
