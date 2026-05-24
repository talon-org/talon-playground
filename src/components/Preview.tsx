import { useRef } from 'react';
import { Button, StatusBadge } from '@talon-sandbox/react';
import { useStore } from '../store';
import { TEMPLATE_LABELS } from '../templates';

export function Preview() {
  const { sandbox, project } = useStore((s) => ({
    sandbox: s.sandbox,
    project: s.project,
  }));

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isIdle = sandbox.status === 'idle';
  const isStarting = sandbox.status === 'starting';
  const hasUrl = Boolean(sandbox.previewUrl);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const statusMap: Record<string, 'running' | 'pending' | 'error'> = {
    running: 'running',
    starting: 'pending',
    error: 'error',
  };

  return (
    <div className="h-full flex flex-col bg-bg-1">
      <div className="px-3 py-1 bg-bg-2 border-b border-line text-xs text-fg-3 shrink-0 flex items-center gap-2">
        <span className="text-fg-2">Preview</span>
        {sandbox.status !== 'idle' && (
          <StatusBadge status={statusMap[sandbox.status] ?? 'pending'}>
            {sandbox.status}
          </StatusBadge>
        )}
        {sandbox.status !== 'idle' && sandbox.phase && (
          <span className="text-fg-4 text-[10px]">{sandbox.phase}</span>
        )}
      </div>

      {hasUrl && sandbox.previewUrl && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-2 border-b border-line shrink-0">
          <span
            className="flex-1 text-[11px] text-acc font-mono truncate select-all"
            title={sandbox.previewUrl}
          >
            {sandbox.previewUrl}
          </span>
          <a
            href={sandbox.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-fg-3 hover:text-acc transition-colors shrink-0"
            aria-label="Open preview in new tab"
            title="Open in new tab"
          >
            &#8599;
          </a>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={handleRefresh}
            aria-label="Reload preview iframe"
            title="Reload"
          >
            &#8635;
          </Button>
        </div>
      )}

      <div className="flex-1 relative">
        {isIdle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-fg-4">
            <div className="text-4xl font-bold text-fg-3">
              {TEMPLATE_LABELS[project.template]}
            </div>
            <div className="text-sm">Press Run to start preview</div>
          </div>
        )}

        {isStarting && !hasUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-fg-3">
            <div className="w-8 h-8 rounded-full border-2 border-acc border-t-transparent animate-spin" />
            <div className="text-sm">{sandbox.phase ?? 'Starting...'}</div>
          </div>
        )}

        {hasUrl && (
          <iframe
            ref={iframeRef}
            key={sandbox.previewUrl}
            src={sandbox.previewUrl ?? 'about:blank'}
            title="Preview"
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />
        )}
      </div>
    </div>
  );
}
