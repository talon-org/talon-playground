import { useState, useCallback, type ChangeEvent } from 'react';
import { useStore, buildShareUrl, clearDraft, SHARE_URL_WARN_LENGTH } from '../store';
import { TEMPLATES, TEMPLATE_LABELS } from '../templates';
import type { TemplateId } from '../types';

interface TopBarProps {
  terminalVisible: boolean;
  onToggleTerminal: () => void;
}

const TEMPLATE_IDS = Object.keys(TEMPLATE_LABELS) as TemplateId[];

export function TopBar({ terminalVisible, onToggleTerminal }: TopBarProps) {
  const { project, selectTemplate, run, stop, sandbox, dirty, serializeForShare, loadProject, appendLog } =
    useStore((s) => ({
      project: s.project,
      selectTemplate: s.selectTemplate,
      run: s.run,
      stop: s.stop,
      sandbox: s.sandbox,
      dirty: s.dirty,
      serializeForShare: s.serializeForShare,
      loadProject: s.loadProject,
      appendLog: s.appendLog,
    }));

  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(null), 3000);
    return t;
  }, []);

  const handleTemplateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value as TemplateId;
    if (dirty) {
      const ok = window.confirm('切换模板会丢失当前修改，继续？');
      if (!ok) return;
    }
    selectTemplate(newId);
  };

  const handleShare = async () => {
    const json = serializeForShare();
    const url = buildShareUrl(json);

    if (url.length > SHARE_URL_WARN_LENGTH) {
      appendLog(
        `[warn] share URL is long (${url.length} chars), may not work in all browsers`,
      );
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('已复制到剪贴板');
    } catch {
      showToast('复制失败,请手动复制');
    }
  };

  const handleReset = () => {
    const ok = window.confirm('重置会丢弃当前所有文件,确认?');
    if (!ok) return;
    clearDraft();
    loadProject(TEMPLATES[project.template]);
  };

  const isStarting = sandbox.status === 'starting';
  const isRunning = sandbox.status === 'running';
  const isError = sandbox.status === 'error';
  const isBusy = isStarting || isRunning;

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
    <header className="flex items-center gap-3 px-4 h-12 bg-gray-900 border-b border-gray-700 shrink-0 relative">
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
        aria-label="Reset project to template default"
        onClick={handleReset}
      >
        Reset
      </button>

      <button
        className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
        aria-label="Share project URL"
        onClick={() => void handleShare()}
      >
        Share
      </button>

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-4 top-14 z-50 bg-green-700 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none select-none"
        >
          {toast}
        </div>
      )}
    </header>
  );
}
