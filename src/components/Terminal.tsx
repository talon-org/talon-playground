import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function Terminal() {
  const logs = useStore((s) => s.sandbox.logs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className="h-full flex flex-col bg-gray-950 font-mono text-xs"
      role="log"
      aria-label="Terminal output"
      aria-live="polite"
    >
      <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 text-gray-400 shrink-0">
        Terminal
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {logs.length === 0 ? (
          <span className="text-gray-600">No output yet. Press Run to execute.</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="text-green-400 whitespace-pre-wrap break-all">
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
