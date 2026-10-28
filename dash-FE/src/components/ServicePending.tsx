export default function ServicePending({ name, available, children }: { name: string; available: boolean; children: React.ReactNode }) {
  if (available) return <>{children}</>;
  return <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text)' }}>
    <p style={{ fontSize: 32 }}>🛠️</p>
    <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0' }}>{name} 준비 중이에요</h1>
    <p style={{ color: 'var(--text-muted)' }}>서비스가 준비되면 이용할 수 있어요.</p>
  </div>;
}
