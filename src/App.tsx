import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ToastViewport } from '@talon-sandbox/react';
import { TopBar } from './components/TopBar';
import { FileTree } from './components/FileTree';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { Preview } from './components/Preview';
import { useStore, parseShareParam, loadDraft, clearDraft } from './store';

export default function App() {
  const [terminalVisible, setTerminalVisible] = useState(true);
  const { loadProject, appendLog } = useStore((s) => ({
    loadProject: s.loadProject,
    appendLog: s.appendLog,
  }));

  useEffect(() => {
    // 1. Try share URL first
    const shared = parseShareParam(window.location.search);
    if (shared) {
      loadProject(shared);
      // Clean up the URL without reload
      const clean = window.location.origin + window.location.pathname;
      window.history.replaceState(null, '', clean);
      return;
    }

    // 2. Check for draft in localStorage (only if no share param)
    const draft = loadDraft();
    if (draft) {
      const restore = window.confirm('发现未保存的草稿,是否恢复?');
      if (restore) {
        loadProject(draft);
      } else {
        clearDraft();
        // Keep default template (already loaded)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Report share URL parse failures via terminal log
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p');
    if (p) {
      const shared = parseShareParam(window.location.search);
      if (!shared) {
        appendLog('[error] share link invalid');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-0 text-fg-1">
      <TopBar
        terminalVisible={terminalVisible}
        onToggleTerminal={() => setTerminalVisible((v) => !v)}
      />

      {/* Horizontal three-pane split */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left: FileTree */}
        <Panel defaultSize={16} minSize={13} maxSize={30} className="min-w-0">
          <FileTree />
        </Panel>

        <PanelResizeHandle className="w-px bg-line hover:bg-acc transition-colors cursor-col-resize" />

        {/* Middle: Editor + Terminal */}
        <Panel defaultSize={44} minSize={20} className="min-h-0 min-w-0">
          <PanelGroup direction="vertical" className="h-full">
            <Panel defaultSize={terminalVisible ? 70 : 100} minSize={30} className="min-h-0">
              <Editor />
            </Panel>

            {terminalVisible && (
              <>
                <PanelResizeHandle className="h-px bg-line hover:bg-acc transition-colors cursor-row-resize" />
                <Panel defaultSize={30} minSize={15} maxSize={60} className="min-h-0">
                  <Terminal />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-px bg-line hover:bg-acc transition-colors cursor-col-resize" />

        {/* Right: Preview */}
        <Panel defaultSize={40} minSize={20} className="min-h-0 min-w-0">
          <Preview />
        </Panel>
      </PanelGroup>
      <ToastViewport />
    </div>
  );
}
