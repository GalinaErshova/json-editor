/**
 * Home page — Scenario Editor landing.
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Scenario Editor</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.7 }}>
        Standalone JSON editor for History's Edge scenarios.
        Create, edit, and validate scenario files.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          href="/scenarios"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#0ea5e9',
            color: '#000',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Browse Scenarios
        </Link>
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Features</h2>
        <ul style={{ lineHeight: 1.8, opacity: 0.8 }}>
          <li>JSON editor with syntax highlighting (CodeMirror 6)</li>
          <li>Live preview of scenario structure</li>
          <li>JSON Schema validation with AJV</li>
          <li>ID reference checking and turn routing validation</li>
          <li>File management (create, edit, save, delete)</li>
        </ul>
      </div>
    </div>
  );
}
