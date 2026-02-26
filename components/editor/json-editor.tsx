'use client';

/**
 * JSON editor component using CodeMirror 6.
 *
 * Features: JSON syntax highlighting, dark theme, line numbers,
 * bracket matching, error linting, and onChange callback.
 */

import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import styles from './json-editor.module.css';

interface JsonEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly readOnly?: boolean;
  readonly onEditorReady?: (scrollTo: (searchText: string) => void) => void;
}

/** Lint JSON syntax errors. */
function jsonLinter(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  if (!text.trim()) return [];

  try {
    JSON.parse(text);
    return [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    const posMatch = message.match(/position (\d+)/);
    const pos = posMatch?.[1] ? parseInt(posMatch[1], 10) : 0;
    const safePos = Math.min(pos, text.length);

    return [{
      from: safePos,
      to: Math.min(safePos + 1, text.length),
      severity: 'error',
      message,
    }];
  }
}

export default function JsonEditor({ value, onChange, readOnly = false, onEditorReady }: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onEditorReadyRef = useRef(onEditorReady);

  onChangeRef.current = onChange;
  onEditorReadyRef.current = onEditorReady;

  const handleChange = useCallback(() => {
    if (viewRef.current) {
      onChangeRef.current(viewRef.current.state.doc.toString());
    }
  }, []);

  const scrollToText = useCallback((searchText: string) => {
    const view = viewRef.current;
    if (!view) return;

    const doc = view.state.doc.toString();
    const pos = doc.indexOf(searchText);
    if (pos === -1) return;

    view.dispatch({
      selection: { anchor: pos, head: pos + searchText.length },
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    });
    view.focus();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        oneDark,
        lintGutter(),
        linter(jsonLinter),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...closeBracketsKeymap,
          ...searchKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleChange();
          }
        }),
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    onEditorReadyRef.current?.(scrollToText);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div ref={containerRef} className={styles.editorContainer} />
  );
}
