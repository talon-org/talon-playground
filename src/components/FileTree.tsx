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
      className="h-full flex flex-col bg-gray-900 text-gray-300 overflow-y-auto"
      aria-label="File tree"
    >
      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-widest font-semibold border-b border-gray-700">
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
                    ? 'bg-gray-700 text-white'
                    : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
                title={file.path}
              >
                <span
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold bg-gray-700 text-gray-300"
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
