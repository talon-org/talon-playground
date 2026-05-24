import { useStore } from '../store';
import { TEMPLATE_LABELS } from '../templates';

export function Preview() {
  const { sandbox, project } = useStore((s) => ({
    sandbox: s.sandbox,
    project: s.project,
  }));

  const isIdle = sandbox.status === 'idle';
  const isStarting = sandbox.status === 'starting';
  const hasUrl = Boolean(sandbox.previewUrl);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 text-xs text-gray-400 shrink-0 flex items-center gap-2">
        <span>Preview</span>
        {sandbox.status !== 'idle' && (
          <span
            className={[
              'px-1.5 py-0.5 rounded text-[10px] font-semibold',
              sandbox.status === 'running' ? 'bg-green-800 text-green-200' : '',
              sandbox.status === 'starting' ? 'bg-yellow-800 text-yellow-200' : '',
              sandbox.status === 'error' ? 'bg-red-800 text-red-200' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {sandbox.status}
          </span>
        )}
        {sandbox.status !== 'idle' && sandbox.phase && (
          <span className="text-gray-500 text-[10px]">{sandbox.phase}</span>
        )}
      </div>

      <div className="flex-1 relative">
        {isIdle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
            <div className="text-4xl font-bold text-gray-700">
              {TEMPLATE_LABELS[project.template]}
            </div>
            <div className="text-sm">Press Run to start preview</div>
          </div>
        )}

        {isStarting && !hasUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-500">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin" />
            <div className="text-sm">{sandbox.phase ?? 'Starting...'}</div>
          </div>
        )}

        {/* Iframe shown once we have a URL */}
        {hasUrl && (
          <iframe
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
