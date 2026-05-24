import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TopBar } from './components/TopBar';
import { FileTree } from './components/FileTree';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { Preview } from './components/Preview';

export default function App() {
  const [terminalVisible, setTerminalVisible] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
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

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

        {/* Middle: Editor + Terminal */}
        <Panel defaultSize={44} minSize={20} className="min-h-0 min-w-0">
          <PanelGroup direction="vertical" className="h-full">
            <Panel defaultSize={terminalVisible ? 70 : 100} minSize={30} className="min-h-0">
              <Editor />
            </Panel>

            {terminalVisible && (
              <>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-row-resize" />
                <Panel defaultSize={30} minSize={15} maxSize={60} className="min-h-0">
                  <Terminal />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />

        {/* Right: Preview */}
        <Panel defaultSize={40} minSize={20} className="min-h-0 min-w-0">
          <Preview />
        </Panel>
      </PanelGroup>
    </div>
  );
}
