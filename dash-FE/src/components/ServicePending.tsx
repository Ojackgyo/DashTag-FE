export default function ServicePending({ name, available, children }: { name: string; available: boolean; children: React.ReactNode }) {
  return <>
    {!available && <p role="status" style={{ margin: '16px 18px 0', padding: 14, borderRadius: 14, color: 'var(--text-sub)', background: 'var(--bg-card2)', fontSize: 13 }}>
      {name} 연결을 준비하고 있어요. 준비가 끝나면 이용할 수 있어요.
    </p>}
    {children}
  </>;
}
