import { useState } from 'react';
import { analyzeGoal } from '../ai/goalAnalysis';
import { demoGoal } from '../constants/mockData';
import type { GoalAnalysisResponse } from '../ai/schemas/goalAnalysis.schema';

export default function AITest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoalAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await analyzeGoal(demoGoal);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PlacementPilot AI Test</h1>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
      >
        {loading ? 'Analyzing...' : 'Analyze Demo Goal'}
      </button>

      {/* Success */}
      {result && result.success && (
        <div style={styles.resultBox}>
          <p style={styles.statusSuccess}>✅ Success</p>
          <pre style={styles.pre}>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}

      {/* AI returned success: false */}
      {result && !result.success && !error && (
        <div style={styles.resultBox}>
          <p style={styles.statusError}>❌ Failed</p>
          <p style={styles.errorText}>The AI returned an unsuccessful response.</p>
        </div>
      )}

      {/* Caught exception */}
      {error && (
        <div style={styles.resultBox}>
          <p style={styles.statusError}>❌ Failed</p>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0B1120',
    color: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 600,
    marginBottom: '32px',
    color: '#F8FAFC',
  },
  button: {
    padding: '12px 28px',
    fontSize: '1rem',
    fontWeight: 500,
    backgroundColor: '#6366F1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  resultBox: {
    marginTop: '32px',
    width: '100%',
    maxWidth: '720px',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '24px',
  },
  statusSuccess: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#22C55E',
    marginBottom: '16px',
  },
  statusError: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#EF4444',
    marginBottom: '16px',
  },
  errorText: {
    color: '#94A3B8',
    fontSize: '0.9rem',
  },
  pre: {
    margin: 0,
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#94A3B8',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};
