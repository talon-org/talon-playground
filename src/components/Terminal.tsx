import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

export function Terminal() {
  const { logs, sandbox, dismissError } = useStore((s) => ({
    logs: s.sandbox.logs,
    sandbox: s.sandbox,
    dismissError: s.dismissError,
  }));

  const scrollRef = useRef<HTMLDivElement>(null);
  // Track whether the user has manually scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "at bottom" if within 8 px
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    isAtBottomRef.current = atBottom;
    setUserScrolledUp(!atBottom);
  };

  // Auto-scroll when new logs arrive, only if user hasn't scrolled up
  useEffect(() => {
    if (!isAtBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setUserScrolledUp(false);
  };

  return (
    <div
      className="h-full flex flex-col bg-gray-950 font-mono text-xs"
      role="log"
      aria-label="Terminal output"
      aria-live="polite"
    >
      <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 text-gray-400 shrink-0 flex items-center justify-between">
        <span>Terminal</span>
        {userScrolledUp && (
          <button
            onClick={scrollToBottom}
            className="text-[10px] text-blue-400 hover:text-blue-300 underline"
            aria-label="Scroll to bottom"
          >
            scroll to bottom
          </button>
        )}
      </div>

      {/* Error banner */}
      {sandbox.status === 'error' && sandbox.errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 py-2 bg-red-900/80 border-b border-red-700 text-red-200 text-xs shrink-0"
        >
          <span className="flex-1 break-all">
            <span className="font-semibold text-red-100">Run failed: </span>
            {sandbox.errorMessage}
          </span>
          <button
            onClick={dismissError}
            className="text-red-300 hover:text-white ml-2 shrink-0 text-base leading-none"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
      >
        {logs.length === 0 ? (
          <span className="text-gray-600">No output yet. Press Run to execute.</span>
        ) : (
          logs.map((line, i) => {
            const isError = line.startsWith('[error]');
            return (
              <div
                key={i}
                className={[
                  'whitespace-pre-wrap break-all',
                  isError ? 'text-red-400' : 'text-green-400',
                ].join(' ')}
              >
                {line}
              </div>
            );
          })
        )}
        <div />
      </div>
    </div>
  );
}
