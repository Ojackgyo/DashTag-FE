import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/user';
import { faceTypeToEmoji } from '../api/user';
import { clearTokens } from '../api/client';
import type { UserResponse } from '../api/user';

/* ── 내 정보 상세 시트 ── */
function MyProfileSheet({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const navigate = useNavigate();
  const INFO_GROUPS = [
    {
      title: '기본 정보',
      rows: [
        { label: '닉네임',  value: user?.nickname ?? '미설정' },
        { label: '나이',    value: user?.age != null ? `${user.age}세` : '미설정' },
        { label: '학과',    value: user?.major ?? '미설정' },
        { label: 'MBTI',   value: user?.mbti ?? '미설정' },
      ],
    },
    {
      title: '외모 정보',
      rows: [
        { label: '얼굴상',      value: user?.face_type ?? '미설정' },
        { label: '키 / 몸무게', value: (user?.height != null && user?.weight != null) ? `${user.height}cm / ${user.weight}kg` : '미설정' },
        { label: '피부톤',      value: user?.skin_tone ?? '미설정' },
        { label: '헤어스타일',  value: user?.hair_style ?? '미설정' },
      ],
    },
    {
      title: '라이프스타일',
      rows: [
        { label: '흡연',     value: user?.smoking != null ? (user.smoking ? '흡연' : '비흡연') : '미설정' },
        { label: '타투',     value: user?.tattoo != null ? (user.tattoo ? '있어요' : '없어요') : '미설정' },
        { label: '매력포인트', value: user?.charm_points?.join(', ') ?? '미설정' },
      ],
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'var(--text)',
          }}
        >‹</button>
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>내 정보</p>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 40px', scrollbarWidth: 'none' }}>
        {/* 아바타 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'var(--bg-card2)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
          }}>{faceTypeToEmoji(user?.face_type)}</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{user?.nickname ?? '닉네임 미설정'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email ?? ''}</p>
        </div>

        {/* 정보 그룹 */}
        {INFO_GROUPS.map(group => (
          <div key={group.title} style={{
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)', marginBottom: 12,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase', padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)', background: 'var(--bg-card2)',
            }}>{group.title}</div>
            {group.rows.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px', minHeight: 48,
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>{row.label}</span>
                <span style={{ fontSize: 13, color: row.value === '미설정' ? 'var(--text-muted)' : 'var(--text)', fontWeight: row.value === '미설정' ? 400 : 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        ))}

        <button
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            fontSize: 15, fontWeight: 800, color: 'white',
            background: 'var(--gradient)', boxShadow: '0 4px 20px rgba(255,128,171,0.3)',
            marginTop: 4,
          }}
          onClick={() => navigate('/signup')}
        >
          내 정보 수정하기
        </button>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function MyInfoPage() {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
  }, []);

  const MENU_ITEMS = [
    { section: '고객지원', items: [
      { label: '공지사항', icon: '📢' },
      { label: '자주 묻는 질문', icon: '❓' },
      { label: '1:1 문의', icon: '💬' },
      { label: '의견 보내기', icon: '✉️' },
    ]},
    { section: '약관 및 정책', items: [
      { label: '이용약관', icon: '📄' },
      { label: '개인정보 처리방침', icon: '🔒' },
    ]},
  ];

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  return (
    <div className="px-[18px] pb-6">
      <div className="pt-6 pb-4">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>마이페이지</h1>
      </div>

      {/* 아바타 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 18px', borderRadius: 20,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        marginBottom: 12,
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, flexShrink: 0,
          background: 'var(--bg-card2)', border: '2px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>{faceTypeToEmoji(user?.face_type)}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{user?.nickname ?? '닉네임 미설정'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.major ?? '인하대학교'}</p>
        </div>
        <button
          style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--primary)', background: 'var(--primary-bg)',
            border: '1px solid var(--primary-border)', padding: '7px 14px', borderRadius: 20,
          }}
          onClick={() => setShowProfile(true)}
        >내 정보</button>
      </div>

      {/* 대쉬서클 영역 (리뷰 - 백엔드 미지원, 향후 추가 예정) */}
      <div style={{
        borderRadius: 20, padding: '18px 18px 20px',
        border: '1px solid var(--border)', background: 'var(--bg-card)',
        marginBottom: 12,
      }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>대쉬서클</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>매칭 상대가 남긴 솔직한 리뷰예요</p>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <span style={{ fontSize: 36 }}>💌</span>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>아직 받은 리뷰가 없어요</p>
        </div>
      </div>

      {/* 고객지원 + 약관 */}
      {MENU_ITEMS.map(group => (
        <div key={group.section} style={{
          borderRadius: 18, overflow: 'hidden',
          border: '1px solid var(--border)', background: 'var(--bg-card)',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>
            {group.section}
          </div>
          <div>
            {group.items.map((item, i) => (
              <button
                key={item.label}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', minHeight: 50,
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 로그아웃 */}
      <button
        style={{
          width: '100%', padding: '14px', borderRadius: 16, marginTop: 4, marginBottom: 12,
          fontSize: 14, fontWeight: 700, color: '#FF6B6B',
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)',
        }}
        onClick={handleLogout}
      >
        로그아웃
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '4px 0 24px' }}>DashTag v1.0.0</p>

      {showProfile && <MyProfileSheet user={user} onClose={() => setShowProfile(false)} />}
    </div>
  );
}
