import { useStore } from '../store';
import { TEMPLATE_LABELS } from '../templates';

export function Preview() {
  const { sandbox, project } = useStore((s) => ({
    sandbox: s.sandbox,
    project: s.project,
  }));

  const isIdle = sandbox.status === 'idle';

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
            ].join(' ')}
          >
            {sandbox.status}
          </span>
        )}
      </div>

      <div className="flex-1 relative">
        {isIdle ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600">
            <div className="text-4xl font-bold text-gray-700">
              {TEMPLATE_LABELS[project.template]}
            </div>
            <div className="text-sm">Press Run to start preview</div>
          </div>
        ) : (
          <iframe
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
