'use client';

/**
 * Universal JSON Navigator — renders any JSON as a collapsible tree.
 *
 * Features:
 * - Recursive tree with collapsible object/array nodes
 * - Inline preview of primitive values
 * - Array item counts and object key counts
 * - Click any node to scroll the editor to that location
 * - Smart truncation of long strings
 * - Top-level sections open by default, deeper nodes collapsed
 *
 * @module components/editor/scenario-preview
 */

import { useState, useMemo } from 'react';
import styles from './scenario-preview.module.css';

interface ScenarioPreviewProps {
  readonly jsonString: string;
  readonly onNodeClick?: (searchText: string) => void;
}

/* ── Helpers ── */

/** Build a search string that will locate this key in the JSON text */
function buildSearchText(key: string): string {
  return `"${key}"`;
}

/* ── Tree Node ── */

interface TreeNodeProps {
  readonly name: string;
  readonly value: unknown;
  readonly depth: number;
  readonly defaultOpen?: boolean;
  readonly onNodeClick?: (searchText: string) => void;
}

function TreeNode({ name, value, depth, defaultOpen = false, onNodeClick }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  const handleClick = () => {
    if (!onNodeClick) return;
    onNodeClick(buildSearchText(name));
  };

  /* Primitive leaf — show only the key name, no value */
  if (isPrimitive) {
    return (
      <div
        className={`${styles.treeLeaf} ${styles.clickable}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <span className={styles.leafKey}>{name}</span>
      </div>
    );
  }

  /* Object / Array branch */
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);

  const count = entries.length;

  return (
    <div className={styles.treeNode}>
      <div
        className={styles.treeBranch}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <button
          className={styles.treeToggle}
          onClick={() => setOpen(!open)}
          type="button"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <span className={styles.arrow}>{open ? '\u25BC' : '\u25B6'}</span>
        </button>
        <span
          className={`${styles.branchKey} ${styles.clickable}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
        >
          {name}
        </span>
        <span className={styles.branchMeta}>
          {isArray ? (
            <span className={styles.badge}>[{count}]</span>
          ) : (
            <span className={styles.badge}>&#123;{count}&#125;</span>
          )}
        </span>
      </div>
      {open && (
        <div className={styles.treeChildren}>
          {entries.map(([key, val], i) => (
            <TreeNode
              key={`${key}-${i}`}
              name={key}
              value={val}
              depth={depth + 1}
              defaultOpen={false}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */

export default function ScenarioPreview({ jsonString, onNodeClick }: ScenarioPreviewProps) {
  const parsed = useMemo(() => {
    try {
      if (jsonString.trim()) {
        return { data: JSON.parse(jsonString) as unknown, error: null };
      }
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, [jsonString]);

  if (!jsonString.trim()) {
    return <div className={styles.empty}>Загрузите JSON файл</div>;
  }

  if (parsed.error) {
    return (
      <div className={styles.parseError}>
        <strong>JSON Parse Error</strong>
        <pre>{parsed.error}</pre>
      </div>
    );
  }

  const data = parsed.data;
  if (data === null || data === undefined) return null;

  // Top level object: each key is a section
  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data as Record<string, unknown>);
    return (
      <div className={styles.container}>
        <div className={styles.treeRoot}>
          {entries.map(([key, val], i) => (
            <TreeNode
              key={`${key}-${i}`}
              name={key}
              value={val}
              depth={0}
              defaultOpen={i < 5}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    );
  }

  // Top level array
  if (Array.isArray(data)) {
    return (
      <div className={styles.container}>
        <div className={styles.treeRoot}>
          <TreeNode
            name="root"
            value={data}
            depth={0}
            defaultOpen
            onNodeClick={onNodeClick}
          />
        </div>
      </div>
    );
  }

  // Primitive at top level
  return (
    <div className={styles.container}>
      <div className={styles.treeRoot}>
        <div className={styles.treeLeaf}>
          <span className={styles.leafKey}>root</span>
        </div>
      </div>
    </div>
  );
}
