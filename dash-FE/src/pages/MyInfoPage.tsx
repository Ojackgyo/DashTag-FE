import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── 리뷰 목 데이터 ── */
const REVIEWS = [
  { id: 1, emoji: '🐱', rating: 5, text: '대화가 정말 즐거웠어요 😊 또 얘기하고 싶어요!', daysAgo: 2 },
  { id: 2, emoji: '🦊', rating: 4, text: '매너가 좋고 배려심이 넘쳐요', daysAgo: 7 },
  { id: 3, emoji: '🐶', rating: 5, text: '시간 가는 줄 몰랐어요! 재밌었어요', daysAgo: 14 },
];

/* ── 별점 표시 ── */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? '#FFCC00' : 'var(--border)', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

/* ── 대쉬서클 (리뷰) ── */
function ReviewSection() {
  const [showAll, setShowAll] = useState(false);
  const avg = REVIEWS.length > 0
    ? REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length
    : 0;
  const R = 56, STROKE = 9, C = 2 * Math.PI * R;
  const offset = C * (1 - avg / 5);
  const displayed = showAll ? REVIEWS : REVIEWS.slice(0, 2);

  if (REVIEWS.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <span style={{ fontSize: 40 }}>💌</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginTop: 10 }}>아직 받은 리뷰가 없어요</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>매칭 상대가 리뷰를 남기면 여기에 표시돼요</p>
      </div>
    );
  }

  return (
    <div>
      {/* 원형 평점 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--bg-card2)" strokeWidth={STROKE} />
          <circle
            cx="70" cy="70" r={R} fill="none"
            stroke="url(#ratingGrad)" strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
          <defs>
            <linearGradient id="ratingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFCC00" />
              <stop offset="100%" stopColor="#FF80AB" />
            </linearGradient>
          </defs>
          <text x="70" y="63" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">{avg.toFixed(1)}</text>
          <text x="70" y="81" textAnchor="middle" fontSize="10" fill="var(--text-muted)">평균 별점</text>
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Stars rating={Math.round(avg)} size={16} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>({REVIEWS.length}개 리뷰)</span>
        </div>
      </div>

      {/* 리뷰 카드 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayed.map(r => (
          <div key={r.id} style={{
            padding: '12px 14px', borderRadius: 14,
            background: 'var(--bg-card2)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Stars rating={r.rating} size={13} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.daysAgo}일 전</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
              <span style={{ marginRight: 4 }}>{r.emoji}</span>{r.text}
            </p>
          </div>
        ))}
      </div>

      {REVIEWS.length > 2 && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            width: '100%', marginTop: 10, padding: '10px',
            borderRadius: 12, border: '1px solid var(--border)',
            background: 'transparent', fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          {showAll ? '접기' : `리뷰 ${REVIEWS.length - 2}개 더보기 ›`}
        </button>
      )}
    </div>
  );
}

/* ── 내 정보 상세 시트 ── */
function MyProfileSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const INFO_GROUPS = [
    { title: '기본 정보', rows: ['닉네임', '나이', '학과', 'MBTI'] },
    { title: '외모 정보', rows: ['얼굴상', '키 / 몸무게', '피부톤'] },
    { title: '라이프스타일', rows: ['흡연', '연애 스타일', '매력포인트'] },
    { title: '이상형', rows: ['이상형 얼굴상', '선호 MBTI', '나이차', '흡연 여부'] },
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
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>내 정보 수정</p>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 40px', scrollbarWidth: 'none' }}>
        {/* 아바타 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'var(--bg-card2)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
          }}>🙂</div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>닉네임 미설정</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>미설정 · 인하대학교</p>
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
            {group.rows.map((label, i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px', minHeight: 48,
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>미설정</span>
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
  const [showProfile, setShowProfile] = useState(false);

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
        }}>🙂</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>닉네임 미설정</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>인하대학교</p>
        </div>
        <button
          style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--primary)', background: 'var(--primary-bg)',
            border: '1px solid var(--primary-border)', padding: '7px 14px', borderRadius: 20,
          }}
          onClick={() => setShowProfile(true)}
        >내 정보 수정</button>
      </div>

      {/* 대쉬서클 (리뷰) */}
      <div style={{
        borderRadius: 20, padding: '18px 18px 20px',
        border: '1px solid var(--border)', background: 'var(--bg-card)',
        marginBottom: 12,
      }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>대쉬서클</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>매칭 상대가 남긴 솔직한 리뷰예요</p>
        </div>
        <ReviewSection />
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

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '12px 0 24px' }}>DashTag v1.0.0</p>

      {showProfile && <MyProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  );
}
