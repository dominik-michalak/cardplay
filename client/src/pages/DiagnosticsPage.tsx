// pages/DiagnosticsPage.tsx
// Strona diagnostyczna dostępna na /diagnostics.
// Zawiera: status połączenia z API (GET /health) i Socket.IO.
// Usuwana lub ukrywana przed deployem produkcyjnym.
// Pozwala każdej osobie zweryfikować że środowisko jest poprawnie skonfigurowane.

import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function DiagnosticsPage() {
  const { socket, connected } = useSocket();
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000';
    fetch(`${base}/health`)
      .then((r) => (r.ok ? setApiStatus('ok') : setApiStatus('error')))
      .catch(() => setApiStatus('error'));
  }, []);

  const statusColor = (s: string) =>
    s === 'ok' || s === 'connected' ? 'green' : s === 'error' ? 'red' : 'gray';

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>CardPlay — Diagnostics</h1>
      <table style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem 1rem' }}>REST API (/health)</td>
            <td style={{ padding: '0.5rem 1rem', color: statusColor(apiStatus) }}>
              {apiStatus === 'checking' ? '…' : apiStatus === 'ok' ? '✓ online' : '✗ offline'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem 1rem' }}>Socket.IO</td>
            <td style={{ padding: '0.5rem 1rem', color: connected ? 'green' : 'gray' }}>
              {connected ? '✓ połączono' : '○ niepołączono (wymagane logowanie)'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem 1rem' }}>Socket ID</td>
            <td style={{ padding: '0.5rem 1rem' }}>{socket?.id ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
