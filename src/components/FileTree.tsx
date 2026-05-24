import { useStore } from '../store';

function fileIcon(path: string): string {
  if (path.endsWith('.html')) return 'H';
  if (path.endsWith('.css')) return 'C';
  if (path.endsWith('.js')) return 'J';
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'T';
  if (path.endsWith('.vue')) return 'V';
  if (path.endsWith('.py')) return 'P';
  if (path.endsWith('.md')) return 'M';
  return 'F';
}

export function FileTree() {
  const { project, openFile, activeTab } = useStore((s) => ({
    project: s.project,
    openFile: s.openFile,
    activeTab: s.activeTab,
  }));

  return (
    <nav
      className="h-full flex flex-col bg-bg-1 text-fg-2 overflow-y-auto"
      aria-label="File tree"
    >
      <div className="px-3 py-2 text-xs text-fg-3 uppercase tracking-widest font-semibold border-b border-line">
        Files
      </div>
      <ul className="flex-1 py-1">
        {project.files.map((file) => {
          const isActive = file.path === activeTab;
          return (
            <li key={file.path}>
              <button
                onClick={() => openFile(file.path)}
                className={[
                  'w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs truncate transition-colors',
                  isActive
                    ? 'bg-bg-active text-fg-0'
                    : 'hover:bg-bg-hover text-fg-3 hover:text-fg-1',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
                title={file.path}
              >
                <span
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold bg-bg-2 text-fg-2"
                  aria-hidden="true"
                >
                  {fileIcon(file.path)}
                </span>
                <span className="truncate">{file.path}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
