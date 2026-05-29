import { useEffect, useRef, useState } from 'react';
import { TerminalChrome, Button } from '@talon-sandbox/react';
import { useStore } from '../store';

export function Terminal() {
  const { logs, sandbox, dismissError } = useStore((s) => ({
    logs: s.sandbox.logs,
    sandbox: s.sandbox,
    dismissError: s.dismissError,
  }));

  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    isAtBottomRef.current = atBottom;
    setUserScrolledUp(!atBottom);
  };

  useEffect(() => {
    if (!isAtBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setUserScrolledUp(false);
  };

  const sandboxMeta = { id: sandbox.sandboxId ?? 'local', name: 'Playground' };

  const bottomStatus = sandbox.status === 'error' && sandbox.errorMessage ? (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2 bg-err-soft border-t border-err text-fg-0 text-xs"
    >
      <span className="flex-1 break-all">
        <span className="font-semibold text-err">Run failed: </span>
        {sandbox.errorMessage}
      </span>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={dismissError}
        aria-label="Dismiss error"
        className="shrink-0"
      >
        &times;
      </Button>
    </div>
  ) : undefined;

  const topActions = userScrolledUp ? (
    <Button variant="ghost" size="sm" onClick={scrollToBottom} aria-label="Scroll to bottom">
      scroll to bottom
    </Button>
  ) : undefined;

  return (
    <TerminalChrome
      sandbox={sandboxMeta}
      topActions={topActions}
      bottomStatus={bottomStatus}
      className="h-full"
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-xs"
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
      >
        {logs.length === 0 ? (
          <span className="text-fg-4">No output yet. Press Run to execute.</span>
        ) : (
          logs.map((line, i) => {
            const isError = line.startsWith('[error]');
            return (
              <div
                key={i}
                className={[
                  'whitespace-pre-wrap break-all',
                  isError ? 'text-err' : 'text-ok',
                ].join(' ')}
              >
                {line}
              </div>
            );
          })
        )}
        <div />
      </div>
    </TerminalChrome>
  );
}
