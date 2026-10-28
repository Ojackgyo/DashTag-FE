export default function QueryStatus({ loading, error, retry }: { loading?: boolean; error?: Error | null; retry?: () => void }) {
  if (loading) return <p role="status" style={{ padding: 20, color: 'var(--text-muted)' }}>불러오는 중…</p>;
  if (!error) return null;
  return <div role="alert" style={{ padding: 16, color: 'var(--text)', background: 'var(--bg-card2)', borderRadius: 12, margin: '12px 0' }}>
    <p>{error.message}</p>
    {retry && <button onClick={retry} style={{ marginTop: 8, color: 'var(--primary)' }}>다시 시도</button>}
  </div>;
}
