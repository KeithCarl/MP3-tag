import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, AlertTriangle } from 'lucide-react';
import { filesApi } from '../../api/filesApi';
import type { FolderNode } from '../../types/mp3File';

interface NodeState {
  checked: boolean;
  indeterminate: boolean;
  expanded: boolean;
  children: FolderNode[] | null;
  loadingChildren: boolean;
}

interface FolderTreeProps {
  rootPath: string;
  rootNodes: FolderNode[];
  onScan: (paths: string[]) => void;
  isScanning?: boolean;
}

export function FolderTree({ rootNodes, onScan, isScanning }: FolderTreeProps) {
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>(() => {
    const init: Record<string, NodeState> = {};
    for (const n of rootNodes) {
      init[n.path] = { checked: false, indeterminate: false, expanded: false, children: null, loadingChildren: false };
    }
    return init;
  });

  const totalSelected = Object.entries(nodeStates)
    .filter(([, s]) => s.checked)
    .reduce((sum, [path]) => {
      const node = findNode(rootNodes, nodeStates, path);
      return sum + (node?.mp3_count ?? 0);
    }, 0);

  function findNode(nodes: FolderNode[], states: Record<string, NodeState>, path: string): FolderNode | null {
    for (const n of nodes) {
      if (n.path === path) return n;
      const children = states[n.path]?.children;
      if (children) {
        const found = findNode(children, states, path);
        if (found) return found;
      }
    }
    return null;
  }

  const toggleExpand = useCallback(async (node: FolderNode) => {
    const state = nodeStates[node.path];
    if (!state) return;
    if (!state.expanded && !state.children && node.has_subdirs) {
      setNodeStates((prev) => ({ ...prev, [node.path]: { ...prev[node.path], loadingChildren: true } }));
      try {
        const children = await filesApi.tree(node.path);
        const childStates: Record<string, NodeState> = {};
        for (const c of children) {
          childStates[c.path] = { checked: false, indeterminate: false, expanded: false, children: null, loadingChildren: false };
        }
        setNodeStates((prev) => ({
          ...prev,
          ...childStates,
          [node.path]: { ...prev[node.path], expanded: true, children, loadingChildren: false },
        }));
      } catch {
        setNodeStates((prev) => ({ ...prev, [node.path]: { ...prev[node.path], loadingChildren: false } }));
      }
    } else {
      setNodeStates((prev) => ({ ...prev, [node.path]: { ...prev[node.path], expanded: !state.expanded } }));
    }
  }, [nodeStates]);

  const toggleCheck = useCallback((path: string) => {
    setNodeStates((prev) => ({ ...prev, [path]: { ...prev[path], checked: !prev[path]?.checked } }));
  }, []);

  const selectedPaths = Object.entries(nodeStates)
    .filter(([, s]) => s.checked)
    .map(([p]) => p);

  const renderNode = (node: FolderNode, depth = 0) => {
    const state = nodeStates[node.path];
    if (!state) return null;
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-700 cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <button
            onClick={() => toggleExpand(node)}
            className="p-0.5 text-gray-400 hover:text-gray-200"
            disabled={!node.has_subdirs}
          >
            {node.has_subdirs ? (
              state.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="w-4 h-4 inline-block" />
            )}
          </button>
          <input
            type="checkbox"
            checked={state.checked}
            onChange={() => toggleCheck(node.path)}
            className="h-4 w-4 rounded border-gray-500 accent-blue-500"
          />
          {state.expanded ? <FolderOpen className="h-4 w-4 text-blue-400" /> : <Folder className="h-4 w-4 text-blue-400" />}
          <span className="text-sm text-gray-200 ml-1">{node.name}</span>
          {node.mp3_count > 0 && (
            <span className="text-xs text-gray-400 ml-auto">({node.mp3_count} mp3s)</span>
          )}
        </div>
        {state.expanded && state.children && state.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {rootNodes.map((n) => renderNode(n))}
      </div>
      <div className="border-t border-gray-700 pt-3 mt-2">
        {totalSelected > 5000 && (
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span>~{totalSelected.toLocaleString()} files selected — scan may be slow</span>
          </div>
        )}
        <button
          disabled={selectedPaths.length === 0 || isScanning}
          onClick={() => onScan(selectedPaths)}
          className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isScanning ? 'Scanning...' : `Scan Selected (${selectedPaths.length} folder${selectedPaths.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
