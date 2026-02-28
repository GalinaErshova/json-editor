'use client';

/**
 * JSON Editor — single-page editor for any JSON file.
 * Upload a file, edit, validate (optionally with JSON Schema), and download.
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

const EMPTY_JSON = '{}';

export default function EditorPage() {
  const [content, setContent] = useState(EMPTY_JSON);
  const [fileName, setFileName] = useState('document.json');
  const [isModified, setIsModified] = useState(false);

  // JSON Schema (optional, loaded by user)
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [schemaName, setSchemaName] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<readonly ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<readonly ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  const scrollToRef = useRef<((searchText: string) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schemaInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setIsModified(true);
    setHasValidated(false);
  }, []);

  /* ── File upload ── */

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
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
    e.target.value = '';
  }, []);

  /* ── Schema upload ── */

  const handleSchemaUpload = useCallback(() => {
    schemaInputRef.current?.click();
  }, []);

  const handleSchemaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        setSchema(parsed);
        setSchemaName(file.name);
        setHasValidated(false);
      } catch {
        alert('Failed to parse schema file. Make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleSchemaClear = useCallback(() => {
    setSchema(null);
    setSchemaName(null);
    setHasValidated(false);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, []);

  /* ── Validation ── */

  const handleValidate = useCallback(async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
      setValidationErrors([{ path: 'root', message: msg }]);
      setValidationWarnings([]);
      setHasValidated(true);
      return;
    }

    // No schema — syntax is valid, done
    if (!schema) {
      setValidationErrors([]);
      setValidationWarnings([]);
      setHasValidated(true);
      return;
    }

    // Validate against schema via API
    setIsValidating(true);
    try {
      const res = await fetch('/api/scenarios/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed, schema }),
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
  }, [content, schema]);

  /* ── Download ── */

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  /* ── New ── */

  const handleNew = useCallback(() => {
    if (isModified && !confirm('There are unsaved changes. Create a new file?')) return;
    setContent(EMPTY_JSON);
    setFileName('document.json');
    setIsModified(false);
    setHasValidated(false);
    setValidationErrors([]);
    setValidationWarnings([]);
  }, [isModified]);

  return (
    <div className={styles.container}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={schemaInputRef}
        type="file"
        accept=".json,.schema.json"
        style={{ display: 'none' }}
        onChange={handleSchemaSelect}
      />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <h1 className={styles.toolbarTitle}>
          JSON Editor
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

      {/* Schema bar */}
      <div className={styles.schemaBar}>
        <span className={styles.schemaLabel}>Schema:</span>
        {schemaName ? (
          <>
            <span className={styles.schemaName}>{schemaName}</span>
            <button className={styles.schemaClear} onClick={handleSchemaClear} type="button">
              &times;
            </button>
          </>
        ) : (
          <button className={styles.schemaUpload} onClick={handleSchemaUpload} type="button">
            Load JSON Schema...
          </button>
        )}
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
