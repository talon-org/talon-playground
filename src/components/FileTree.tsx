import { useMemo, useState } from 'react';
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

interface FileNode {
  kind: 'file';
  name: string;
  path: string;
}
interface DirNode {
  kind: 'dir';
  name: string;
  path: string;
  children: TreeNode[];
}
type TreeNode = FileNode | DirNode;

function buildTree(paths: string[]): TreeNode[] {
  const root: DirNode = { kind: 'dir', name: '', path: '', children: [] };

  for (const p of paths) {
    const parts = p.split('/').filter(Boolean);
    let cursor: DirNode = root;
    parts.forEach((part, idx) => {
      const isLeaf = idx === parts.length - 1;
      if (isLeaf) {
        cursor.children.push({ kind: 'file', name: part, path: p });
        return;
      }
      const dirPath = parts.slice(0, idx + 1).join('/');
      let next = cursor.children.find(
        (c): c is DirNode => c.kind === 'dir' && c.name === part,
      );
      if (!next) {
        next = { kind: 'dir', name: part, path: dirPath, children: [] };
        cursor.children.push(next);
      }
      cursor = next;
    });
  }

  // dirs first, then files, both alpha
  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.kind === 'dir') sort(n.children);
    return nodes;
  };
  return sort(root.children);
}

interface RowProps {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  toggle: (path: string) => void;
  activeTab: string;
  openFile: (path: string) => void;
}

function Row({ node, depth, collapsed, toggle, activeTab, openFile }: RowProps) {
  const indent = { paddingLeft: `${depth * 12 + 12}px` };

  if (node.kind === 'dir') {
    const isCollapsed = collapsed.has(node.path);
    return (
      <li>
        <button
          type="button"
          onClick={() => toggle(node.path)}
          style={indent}
          className="w-full text-left flex items-center gap-2 pr-3 py-1 text-xs text-fg-2 hover:bg-bg-hover hover:text-fg-0 transition-colors"
          aria-expanded={!isCollapsed}
        >
          <span
            className="shrink-0 w-3 text-fg-3 text-[10px] leading-none select-none"
            aria-hidden="true"
          >
            {isCollapsed ? '▸' : '▾'}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {!isCollapsed && (
          <ul>
            {node.children.map((child) => (
              <Row
                key={child.path}
                node={child}
                depth={depth + 1}
                collapsed={collapsed}
                toggle={toggle}
                activeTab={activeTab}
                openFile={openFile}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const isActive = node.path === activeTab;
  return (
    <li>
      <button
        type="button"
        onClick={() => openFile(node.path)}
        style={indent}
        className={[
          'w-full text-left flex items-center gap-2 pr-3 py-1 text-xs truncate transition-colors',
          isActive
            ? 'bg-bg-active text-fg-0'
            : 'hover:bg-bg-hover text-fg-3 hover:text-fg-1',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
        title={node.path}
      >
        <span className="shrink-0 w-3" aria-hidden="true" />
        <span
          className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold bg-bg-2 text-fg-2"
          aria-hidden="true"
        >
          {fileIcon(node.path)}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

export function FileTree() {
  const { project, openFile, activeTab } = useStore((s) => ({
    project: s.project,
    openFile: s.openFile,
    activeTab: s.activeTab,
  }));

  const tree = useMemo(
    () => buildTree(project.files.map((f) => f.path)),
    [project.files],
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <nav
      className="h-full flex flex-col bg-bg-1 text-fg-2 overflow-y-auto"
      aria-label="File tree"
    >
      <div className="px-3 py-2 text-xs text-fg-3 uppercase tracking-widest font-semibold border-b border-line">
        Files
      </div>
      <ul className="flex-1 py-1" role="tree">
        {tree.map((node) => (
          <Row
            key={node.path}
            node={node}
            depth={0}
            collapsed={collapsed}
            toggle={toggle}
            activeTab={activeTab}
            openFile={openFile}
          />
        ))}
      </ul>
    </nav>
  );
}
