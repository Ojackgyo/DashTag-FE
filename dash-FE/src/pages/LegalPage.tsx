import { useNavigate, useParams } from 'react-router-dom';

const TERMS = [
  ['서비스 이용', 'DashTag는 인하대학교 구성원의 안전한 교류를 돕는 서비스입니다. 타인을 사칭하거나 불쾌감·위협을 주는 콘텐츠를 게시할 수 없습니다.'],
  ['계정과 인증', '회원은 본인의 학교 이메일과 학생증으로만 가입해야 하며 계정과 인증 정보를 타인에게 양도할 수 없습니다.'],
  ['신고와 제한', '운영정책 위반, 스팸, 괴롭힘 또는 불법 행위가 확인되면 콘텐츠 삭제나 이용 제한 조치가 적용될 수 있습니다.'],
  ['책임', '오프라인 만남은 이용자의 판단과 책임으로 진행되며, 안전한 공개 장소를 이용하고 개인정보 공유에 주의해야 합니다.'],
];

const PRIVACY = [
  ['수집 항목', '학교 이메일, 학생 인증 정보, 프로필 및 이상형 정보, 서비스 이용 기록을 수집할 수 있습니다. 비밀번호는 서버에서 안전한 방식으로 처리되어야 합니다.'],
  ['이용 목적', '회원 식별, 학생 인증, 매칭·미팅 제공, 부정 이용 방지, 신고 처리와 서비스 개선을 위해 이용합니다.'],
  ['보관과 파기', '관련 법령상 보관 의무가 없는 정보는 회원 탈퇴 또는 목적 달성 후 지체 없이 안전하게 파기합니다.'],
  ['이용자 권리', '이용자는 자신의 개인정보 열람·정정·삭제 및 처리 정지를 요청할 수 있습니다. 구체적인 담당자와 보관 기간은 운영 전 확정해야 합니다.'],
];

export default function LegalPage() {
  const navigate = useNavigate();
  const { type } = useParams();
  const privacy = type === 'privacy';
  const sections = privacy ? PRIVACY : TERMS;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 40 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card2)', color: 'var(--text)', fontSize: 20 }}>‹</button>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>{privacy ? '개인정보 처리방침' : '이용약관'}</h1>
      </header>
      <main style={{ padding: '24px 20px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>시행 예정일: 운영 정책 확정일</p>
        {sections.map(([title, body], index) => (
          <section key={title} style={{ padding: '18px', borderRadius: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{index + 1}. {title}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-sub)' }}>{body}</p>
          </section>
        ))}
        <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)', marginTop: 20 }}>현재 문안은 서비스 초기 안내용 초안입니다. 출시 전 실제 사업자 정보, 개인정보 보호책임자, 보관 기간 및 문의처를 반드시 확정해야 합니다.</p>
      </main>
    </div>
  );
}
