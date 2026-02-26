'use client';

/**
 * Scenario preview panel — displays parsed scenario structure.
 *
 * Shows meta info, parameters, turns with choices, endings, and triggers
 * in collapsible sections. Updates live as JSON is edited.
 *
 * @module components/editor/scenario-preview
 */

import { useState } from 'react';
import styles from './scenario-preview.module.css';

interface ScenarioPreviewProps {
  readonly jsonString: string;
  readonly onNodeClick?: (searchText: string) => void;
}

interface CollapsibleProps {
  readonly title: string;
  readonly count?: number;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
}

function Collapsible({ title, count, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button
        className={styles.sectionHeader}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className={styles.arrow}>{open ? '\u25BC' : '\u25B6'}</span>
        <span className={styles.sectionTitle}>{title}</span>
        {count !== undefined && (
          <span className={styles.count}>{count}</span>
        )}
      </button>
      {open && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

export default function ScenarioPreview({ jsonString, onNodeClick }: ScenarioPreviewProps) {
  // Try to parse JSON
  let data: Record<string, unknown> | null = null;
  let parseError: string | null = null;

  try {
    if (jsonString.trim()) {
      data = JSON.parse(jsonString);
    }
  } catch (err) {
    parseError = err instanceof Error ? err.message : 'Invalid JSON';
  }

  if (!jsonString.trim()) {
    return <div className={styles.empty}>Введите JSON сценария</div>;
  }

  if (parseError) {
    return (
      <div className={styles.parseError}>
        <strong>JSON Parse Error:</strong>
        <pre>{parseError}</pre>
      </div>
    );
  }

  if (!data) return null;

  const meta = data.meta as Record<string, unknown> | undefined;
  const params = data.params as Array<Record<string, unknown>> | undefined;
  const turns = data.turns as Array<Record<string, unknown>> | undefined;
  const endings = data.endings as Array<Record<string, unknown>> | undefined;
  const triggers = data.triggers as Array<Record<string, unknown>> | undefined;
  const sources = data.sources as Array<Record<string, unknown>> | undefined;

  return (
    <div className={styles.container}>
      {/* Meta */}
      {meta && (
        <Collapsible title="Meta" defaultOpen>
          <div className={styles.metaCard} onClick={() => onNodeClick?.('"meta":')} role="button" tabIndex={0}>
            <h3 className={styles.metaTitle}>{String(meta.title || '—')}</h3>
            {meta.subtitle ? <p className={styles.metaSubtitle}>{String(meta.subtitle)}</p> : null}
            <div className={styles.metaGrid}>
              <div><span className={styles.label}>ID:</span> <code>{String(meta.id || '—')}</code></div>
              <div><span className={styles.label}>Version:</span> {String(meta.version || '—')}</div>
              <div><span className={styles.label}>Epoch:</span> {String(meta.epoch || '—')}</div>
              <div><span className={styles.label}>Difficulty:</span> {String(meta.difficulty || '—')}</div>
              <div><span className={styles.label}>Turns:</span> {String(meta.turnCount || '—')}</div>
              <div><span className={styles.label}>Region:</span> {String(meta.region || '—')}</div>
              {meta.character != null && typeof meta.character === 'object' && (
                <div>
                  <span className={styles.label}>Character:</span>{' '}
                  {String((meta.character as Record<string, unknown>).name || '—')} —{' '}
                  {String((meta.character as Record<string, unknown>).role || '')}
                </div>
              )}
            </div>
          </div>
        </Collapsible>
      )}

      {/* Parameters */}
      {params && Array.isArray(params) && (
        <Collapsible title="Parameters" count={params.length}>
          {params.map((p, i) => (
            <div key={i} className={`${styles.paramItem} ${styles.clickable}`} onClick={() => onNodeClick?.(`"id": "${String(p.id || '')}"`)}>

              <span
                className={styles.paramColor}
                style={{ background: String(p.color || '#888') }}
              />
              <span className={styles.paramName}>
                {String(p.icon || '')} {String(p.name || `param_${i}`)}
              </span>
              <span className={styles.paramValue}>
                start: {String(p.startValue ?? '?')}
              </span>
              <span className={styles.paramId}>
                <code>{String(p.id || '')}</code>
              </span>
            </div>
          ))}
        </Collapsible>
      )}

      {/* Turns */}
      {turns && Array.isArray(turns) && (
        <Collapsible title="Turns" count={turns.length}>
          {turns
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((t, i) => {
              const choices = t.choices as Array<Record<string, unknown>> | undefined;
              const event = t.event as Record<string, unknown> | undefined;
              return (
                <div key={i} className={`${styles.turnItem} ${styles.clickable}`} onClick={() => onNodeClick?.(`"id": "${String(t.id || '')}"`)}>
                  <div className={styles.turnHeader}>
                    <span className={styles.turnOrder}>#{String(t.order || i + 1)}</span>
                    <span className={styles.turnTitle}>
                      {event ? String(event.title || '—') : '—'}
                    </span>
                    {t.isCulmination ? <span className={styles.culminationBadge}>CULMINATION</span> : null}
                  </div>
                  {choices && Array.isArray(choices) && (
                    <div className={styles.choicesList}>
                      {choices.map((c, j) => (
                        <div key={j} className={`${styles.choiceItem} ${styles.clickable}`} onClick={(e) => { e.stopPropagation(); onNodeClick?.(`"id": "${String(c.id || '')}"`) }}>
                          <span className={styles.choiceTitle}>{String(c.title || `choice_${j}`)}</span>
                          {c.deltas != null && typeof c.deltas === 'object' && (
                            <span className={styles.choiceDeltas}>
                              {Object.entries(c.deltas as Record<string, number>)
                                .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
                                .join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </Collapsible>
      )}

      {/* Endings */}
      {endings && Array.isArray(endings) && (
        <Collapsible title="Endings" count={endings.length}>
          {endings.map((e, i) => (
            <div key={i} className={`${styles.endingItem} ${styles.clickable}`} onClick={() => onNodeClick?.(`"id": "${String(e.id || '')}"`)}>
              <div className={styles.endingTitle}>{String(e.title || `ending_${i}`)}</div>
              <div className={styles.endingSubtitle}>{String(e.subtitle || '')}</div>
              <code className={styles.endingId}>{String(e.id || '')}</code>
            </div>
          ))}
        </Collapsible>
      )}

      {/* Triggers */}
      {triggers && Array.isArray(triggers) && (
        <Collapsible title="Triggers" count={triggers.length}>
          {triggers.map((t, i) => {
            const condition = t.condition as Record<string, unknown> | undefined;
            return (
              <div key={i} className={`${styles.triggerItem} ${styles.clickable}`} onClick={() => onNodeClick?.(`"id": "${String(t.id || '')}"`)}>

                <code className={styles.triggerId}>{String(t.id || '')}</code>
                {condition && (
                  <span className={styles.triggerCondition}>
                    {String(condition.param || '?')} {String(condition.operator || '?')} {String(condition.value || '?')}
                  </span>
                )}
                <span className={styles.triggerEffect}>{String(t.effect || '')}</span>
              </div>
            );
          })}
        </Collapsible>
      )}

      {/* Sources */}
      {sources && Array.isArray(sources) && sources.length > 0 && (
        <Collapsible title="Sources" count={sources.length}>
          {sources.map((s, i) => (
            <div key={i} className={`${styles.sourceItem} ${styles.clickable}`} onClick={() => onNodeClick?.(`"id": "${String(s.id || '')}"`)}>
              <span className={styles.sourceType}>{String(s.type || '')}</span>
              <span>{String(s.citation || '')}</span>
            </div>
          ))}
        </Collapsible>
      )}
    </div>
  );
}
