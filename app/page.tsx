'use client';

/**
 * Scenario Editor — single-page JSON editor.
 * Upload a scenario file, edit, validate, and download.
 */

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import ScenarioPreview from '@/components/editor/scenario-preview';
import ValidationPanel from '@/components/editor/validation-panel';
import styles from './editor.module.css';

const JsonEditor = dynamic(
  () => import('@/components/editor/json-editor'),
  { ssr: false, loading: () => <div className={styles.loading}>Loading editor...</div> }
);

interface ValidationError {
  readonly path: string;
  readonly message: string;
}

const EMPTY_SCENARIO = JSON.stringify({
  meta: {
    id: "new-scenario",
    version: "1.0",
    title: "New Scenario",
    subtitle: "",
    description: "",
    epoch: "modern",
    region: "",
    character: { name: "", role: "" },
    conflictType: "war-vs-diplomacy",
    difficulty: "medium",
    turnCount: 1,
    estimatedMinutes: 10,
    tags: [],
    locale: "ru",
    author: { id: "author", name: "Author", verified: false }
  },
  briefing: { text: "", maxLength: 500 },
  params: [],
  turns: [],
  triggers: [],
  endings: [],
  realHistory: []
}, null, 2);

export default function EditorPage() {
  const [content, setContent] = useState(EMPTY_SCENARIO);
  const [fileName, setFileName] = useState('scenario.json');
  const [isModified, setIsModified] = useState(false);

  const [validationErrors, setValidationErrors] = useState<readonly ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<readonly ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  const scrollToRef = useRef<((searchText: string) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setIsModified(true);
    setHasValidated(false);
  }, []);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Try to pretty-print if valid JSON
      try {
        const parsed = JSON.parse(text);
        setContent(JSON.stringify(parsed, null, 2));
      } catch {
        setContent(text);
      }
      setFileName(file.name);
      setIsModified(false);
      setHasValidated(false);
      setValidationErrors([]);
      setValidationWarnings([]);
    };
    reader.readAsText(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleValidate = useCallback(async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      setValidationErrors([{ path: 'root', message: 'Invalid JSON syntax' }]);
      setValidationWarnings([]);
      setHasValidated(true);
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/scenarios/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });
      const json = await res.json();
      setValidationErrors(json.errors || []);
      setValidationWarnings(json.warnings || []);
      setHasValidated(true);
    } catch {
      setValidationErrors([{ path: 'api', message: 'Validation request failed' }]);
    } finally {
      setIsValidating(false);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const handleNew = useCallback(() => {
    if (isModified && !confirm('You have unsaved changes. Create a new scenario?')) return;
    setContent(EMPTY_SCENARIO);
    setFileName('scenario.json');
    setIsModified(false);
    setHasValidated(false);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, [isModified]);

  return (
    <div className={styles.container}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <h1 className={styles.toolbarTitle}>
          Scenario Editor
          <span style={{ fontSize: '0.75rem', opacity: 0.5, marginLeft: '0.75rem', fontWeight: 400 }}>
            {fileName}
          </span>
        </h1>
        {isModified && (
          <span className={`${styles.statusIndicator} ${styles.statusModified}`}>
            Modified
          </span>
        )}
        <div className={styles.toolbarActions}>
          <button className={styles.downloadButton} onClick={handleNew}>
            New
          </button>
          <button className={styles.downloadButton} onClick={handleUpload}>
            Upload
          </button>
          <button className={styles.validateButton} onClick={handleValidate} disabled={isValidating}>
            Validate
          </button>
          <button className={styles.saveButton} onClick={handleDownload}>
            Download
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className={styles.splitContainer}>
        <div className={styles.editorPane}>
          <JsonEditor
            value={content}
            onChange={handleChange}
            onEditorReady={(fn) => { scrollToRef.current = fn; }}
          />
        </div>

        <div className={styles.previewPane}>
          <div className={styles.previewScroll}>
            <ScenarioPreview
              jsonString={content}
              onNodeClick={(text) => scrollToRef.current?.(text)}
            />
          </div>
          <div className={styles.validationScroll}>
            <ValidationPanel
              errors={validationErrors}
              warnings={validationWarnings}
              isValidating={isValidating}
              hasValidated={hasValidated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
