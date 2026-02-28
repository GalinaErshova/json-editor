/**
 * Scenarios list page — browse all scenarios.
 */

import Link from 'next/link';
import { listScenariosWithMeta } from '@/lib/scenario-loader';

export default async function ScenariosPage() {
  const scenarios = listScenariosWithMeta();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ marginRight: '1rem', padding: '0.5rem', textDecoration: 'none' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Scenarios</h1>
      </div>

      {scenarios.length === 0 && (
        <p style={{ opacity: 0.6 }}>No scenarios found. Create your first scenario.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {scenarios.map((scenario) => (
          <Link
            key={scenario.fileId}
            href={`/editor/${scenario.fileId}`}
            style={{
              display: 'block',
              padding: '1.5rem',
              background: '#0a0a0a',
              border: '1px solid #333',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{scenario.title}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>{scenario.subtitle}</p>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>
              <span>{scenario.epoch}</span>
              <span>•</span>
              <span>{scenario.difficulty}</span>
              <span>•</span>
              <span>{scenario.turnCount} turns</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
