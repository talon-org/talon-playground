import type { ChangeEvent } from 'react';
import { useStore } from '../store';
import { TEMPLATE_LABELS } from '../templates';
import type { TemplateId } from '../types';

interface TopBarProps {
  terminalVisible: boolean;
  onToggleTerminal: () => void;
}

const TEMPLATE_IDS = Object.keys(TEMPLATE_LABELS) as TemplateId[];

export function TopBar({ terminalVisible, onToggleTerminal }: TopBarProps) {
  const { project, selectTemplate, run, stop, sandbox, dirty } = useStore((s) => ({
    project: s.project,
    selectTemplate: s.selectTemplate,
    run: s.run,
    stop: s.stop,
    sandbox: s.sandbox,
    dirty: s.dirty,
  }));

  const handleTemplateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value as TemplateId;
    // Task 6: confirm if editor has unsaved changes
    if (dirty) {
      const ok = window.confirm('切换模板会丢失当前修改，继续？');
      if (!ok) {
        // Reset select value visually by re-rendering (React controlled)
        return;
      }
    }
    selectTemplate(newId);
  };

  const isStarting = sandbox.status === 'starting';
  const isRunning = sandbox.status === 'running';
  const isError = sandbox.status === 'error';
  const isBusy = isStarting || isRunning;

  // Determine button mode
  let runButton: React.ReactNode;
  if (isBusy) {
    runButton = (
      <button
        onClick={stop}
        className="flex items-center gap-1 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
        aria-label="Stop sandbox"
      >
        <span className="inline-block w-2 h-2 bg-white" aria-hidden="true" />
        Stop
      </button>
    );
  } else if (isError) {
    runButton = (
      <button
        onClick={run}
        className="flex items-center gap-1 text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors"
        aria-label="Retry run"
      >
        <span aria-hidden="true">&#8635;</span>
        Retry
      </button>
    );
  } else {
    runButton = (
      <button
        onClick={run}
        className="flex items-center gap-1 text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
        aria-label="Run project"
      >
        <span aria-hidden="true">&#9654;</span>
        Run
      </button>
    );
  }

  return (
    <header className="flex items-center gap-3 px-4 h-12 bg-gray-900 border-b border-gray-700 shrink-0">
      <span className="text-white font-semibold text-sm tracking-wide select-none">
        Talon Playground
      </span>

      <div className="flex items-center gap-1 ml-2">
        <label htmlFor="template-select" className="text-gray-400 text-xs">
          Template:
        </label>
        <select
          id="template-select"
          value={project.template}
          onChange={handleTemplateChange}
          disabled={isBusy}
          className="bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          {TEMPLATE_IDS.map((id) => (
            <option key={id} value={id}>
              {TEMPLATE_LABELS[id]}
            </option>
          ))}
        </select>
      </div>

      {/* Phase label shown while starting */}
      {isStarting && sandbox.phase && (
        <span className="text-yellow-400 text-xs animate-pulse select-none">
          {sandbox.phase}
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onToggleTerminal}
        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
        aria-pressed={terminalVisible}
        aria-label="Toggle terminal"
      >
        Terminal {terminalVisible ? '[hide]' : '[show]'}
      </button>

      {runButton}

      <button
        className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded transition-colors"
        aria-label="Share project"
        onClick={() => alert('Share: W5 feature')}
      >
        Share
      </button>
    </header>
  );
}
