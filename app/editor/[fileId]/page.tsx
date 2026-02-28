'use client';

/**
 * Scenario Editor Page — JSON editor with live preview and validation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

type SaveStatus = 'saved' | 'modified' | 'saving' | 'error';

export default function ScenarioEditorPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;

  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const [validationErrors, setValidationErrors] = useState<readonly ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<readonly ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  const scrollToRef = useRef<((searchText: string) => void) | null>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    hasUnsavedChanges.current = content !== originalContent;
  }, [content, originalContent]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent): void {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/scenarios/${fileId}`);
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to load');
        }
        const json = await res.json();
        setContent(json.raw);
        setOriginalContent(json.raw);
        setTitle(json.meta?.title || fileId);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load scenario');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fileId]);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaveStatus('modified');
    setHasValidated(false);
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

  const handleSave = useCallback(async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      setSaveStatus('error');
      alert('Cannot save: invalid JSON syntax');
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/scenarios/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });
      const json = await res.json();

      if (!res.ok) {
        setSaveStatus('error');
        if (json.errors) {
          setValidationErrors(json.errors);
          setValidationWarnings(json.warnings || []);
          setHasValidated(true);
        }
        alert(json.error || 'Save failed');
        return;
      }

      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setOriginalContent(formatted);
      setSaveStatus('saved');
      setValidationWarnings(json.warnings || []);
      setHasValidated(true);
      setValidationErrors([]);
    } catch {
      setSaveStatus('error');
      alert('Network error while saving');
    }
  }, [content, fileId]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, fileId]);

  if (loading) {
    return <div className={styles.loading}>Loading scenario...</div>;
  }

  if (loadError) {
    return <div className={styles.error}>{loadError}</div>;
  }

  const statusLabel: Record<SaveStatus, string> = {
    saved: 'Saved',
    modified: 'Modified',
    saving: 'Saving...',
    error: 'Error',
  } as const;

  const statusClass: Record<SaveStatus, string> = {
    saved: styles.statusSaved ?? '',
    modified: styles.statusModified ?? '',
    saving: styles.statusModified ?? '',
    error: styles.statusError ?? '',
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button onClick={() => router.push('/')} className={styles.backLink}>
          ← Back
        </button>
        <h1 className={styles.toolbarTitle}>{title}</h1>
        <span className={`${styles.statusIndicator} ${statusClass[saveStatus]}`}>
          {statusLabel[saveStatus]}
        </span>
        <div className={styles.toolbarActions}>
          <button className={styles.downloadButton} onClick={handleDownload}>
            Download
          </button>
          <button className={styles.validateButton} onClick={handleValidate} disabled={isValidating}>
            Validate
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || content === originalContent}
          >
            Save
          </button>
        </div>
      </div>

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
