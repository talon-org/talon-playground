import { useState, useCallback, type ChangeEvent } from 'react';
import { Button, Select, Dialog, toast } from '@talon-sandbox/react';
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateId | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleTemplateChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value as TemplateId;
    if (dirty) {
      setPendingTemplate(newId);
      setConfirmOpen(true);
    } else {
      selectTemplate(newId);
    }
  }, [dirty, selectTemplate]);

  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplate) {
      selectTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
    setConfirmOpen(false);
  }, [pendingTemplate, selectTemplate]);

  const handleShare = useCallback(async () => {
    const json = serializeForShare();
    const url = buildShareUrl(json);

    if (url.length > SHARE_URL_WARN_LENGTH) {
      appendLog(`[warn] share URL is long (${url.length} chars), may not work in all browsers`);
    }

    try {
      await navigator.clipboard.writeText(url);
      toast('已复制到剪贴板');
    } catch {
      toast('复制失败,请手动复制');
    }
  }, [serializeForShare, appendLog]);

  const handleReset = useCallback(() => {
    setResetConfirmOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    clearDraft();
    loadProject(TEMPLATES[project.template]);
    setResetConfirmOpen(false);
  }, [loadProject, project.template]);

  const isStarting = sandbox.status === 'starting';
  const isRunning = sandbox.status === 'running';
  const isError = sandbox.status === 'error';
  const isBusy = isStarting || isRunning;

  return (
    <>
      <header
        className="flex items-center gap-3 px-4 h-12 bg-bg-1 border-b border-line shrink-0"
        role="banner"
      >
        <span className="text-fg-0 font-semibold text-sm tracking-wide select-none">
          Talon Sandbox Playground
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <label htmlFor="template-select" className="text-fg-3 text-xs shrink-0">
            Template:
          </label>
          <Select
            id="template-select"
            value={project.template}
            onChange={handleTemplateChange}
            disabled={isBusy}
            size="sm"
          >
            {TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {TEMPLATE_LABELS[id]}
              </option>
            ))}
          </Select>
        </div>

        {isStarting && sandbox.phase && (
          <span className="text-warn text-xs animate-pulse select-none">
            {sandbox.phase}
          </span>
        )}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleTerminal}
          aria-pressed={terminalVisible}
          aria-label="Toggle terminal"
        >
          Terminal {terminalVisible ? '[hide]' : '[show]'}
        </Button>

        {isBusy ? (
          <Button
            variant="danger"
            size="sm"
            onClick={stop}
            aria-label="Stop sandbox"
          >
            <span className="inline-block w-2 h-2 bg-current mr-1" aria-hidden="true" />
            Stop
          </Button>
        ) : isError ? (
          <Button
            variant="primary"
            size="sm"
            onClick={run}
            aria-label="Retry run"
          >
            <span aria-hidden="true" className="mr-1">&#8635;</span>
            Retry
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={run}
            aria-label="Run project"
          >
            <span aria-hidden="true" className="mr-1">&#9654;</span>
            Run
          </Button>
        )}

        <Button
          variant="default"
          size="sm"
          aria-label="Reset project to template default"
          onClick={handleReset}
        >
          Reset
        </Button>

        <Button
          variant="default"
          size="sm"
          aria-label="Share project URL"
          onClick={() => void handleShare()}
        >
          Share
        </Button>
      </header>

      {/* Template switch confirmation */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="切换模板"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="danger" size="sm" onClick={confirmTemplateSwitch}>
              继续切换
            </Button>
          </div>
        }
      >
        <p className="text-fg-1 text-sm">切换模板会丢失当前修改，确认继续？</p>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="重置项目"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setResetConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="danger" size="sm" onClick={confirmReset}>
              确认重置
            </Button>
          </div>
        }
      >
        <p className="text-fg-1 text-sm">重置会丢弃当前所有文件，确认？</p>
      </Dialog>
    </>
  );
}
