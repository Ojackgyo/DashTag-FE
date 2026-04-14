import { useNavigate } from 'react-router-dom';

const DASH_ITEMS = [
  { label: 'MBTI', value: null as string | null, color: '#FF80AB' },
  { label: '얼굴상', value: null as string | null, color: '#FFB3CC' },
  { label: '흡연', value: null as string | null, color: '#F06292' },
  { label: '키', value: null as string | null, color: '#FF80AB' },
  { label: '학과', value: null as string | null, color: '#FFB3CC' },
  { label: '연애스타일', value: null as string | null, color: '#F06292' },
];

function DashCircle() {
  const filled = DASH_ITEMS.filter(i => i.value !== null).length;
  const total = DASH_ITEMS.length;
  const R = 62;
  const STROKE = 8;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - filled / total);

  return (
    <div className="flex flex-col items-center gap-[18px]">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--bg-card2)" strokeWidth={STROKE} />
        <circle
          cx="80" cy="80" r={R} fill="none"
          stroke="url(#dashGrad)" strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF80AB" />
            <stop offset="100%" stopColor="#FFB3CC" />
          </linearGradient>
        </defs>
        <text x="80" y="74" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">{filled}/{total}</text>
        <text x="80" y="92" textAnchor="middle" fontSize="10" fill="var(--text-muted)">완성도</text>
      </svg>

      <div className="grid grid-cols-2 gap-2 w-full">
        {DASH_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2 rounded-[12px] px-3 py-2.5" style={{ background: item.value ? 'var(--primary-bg)' : 'var(--bg-card2)' }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.value ? item.color : 'var(--border)' }} />
            <div className="flex flex-col gap-[1px] min-w-0">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <span className="text-[12px] truncate" style={{ color: item.value ? 'var(--text)' : 'var(--text-muted)', fontWeight: item.value ? 700 : 400 }}>
                {item.value ?? '미설정'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyInfoPage() {
  const navigate = useNavigate();

  return (
    <div className="px-[18px] pb-6">
      <div className="pt-6 pb-[18px]">
        <h1 className="text-[clamp(20px,6vw,24px)] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>내 정보</h1>
      </div>

      {/* 아바타 */}
      <div className="flex flex-col items-center gap-[13px] pb-5">
        <div className="w-[84px] h-[84px] rounded-[26px] flex items-center justify-center text-[40px] border-2" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>🙂</div>
        <button
          className="text-[13px] font-semibold px-5 py-[9px] rounded-[20px] min-h-[38px] border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-sub)' }}
          onClick={() => navigate('/signup')}
        >
          프로필 편집
        </button>
      </div>

      {/* 대시서클 */}
      <div className="rounded-[20px] p-[18px] border mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[15px] font-extrabold mb-1" style={{ color: 'var(--text)' }}>대시서클</p>
        <p className="text-[12px] mb-[18px]" style={{ color: 'var(--text-muted)' }}>프로필을 채울수록 더 많은 사람과 연결돼요</p>
        <DashCircle />
      </div>

      {/* 정보 그룹 */}
      {[
        { title: '기본 정보', rows: ['닉네임', '나이', '학과', 'MBTI'] },
        { title: '외모 정보', rows: ['얼굴상', '키 / 몸무게', '피부톤'] },
        { title: '라이프스타일', rows: ['흡연', '연애 스타일'] },
      ].map(group => (
        <div key={group.title} className="rounded-[18px] overflow-hidden border mb-3.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] px-4 py-3 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            {group.title}
          </h3>
          <div className="py-1">
            {group.rows.map((label, i) => (
              <div key={label} className={`flex items-center justify-between px-4 py-[13px] min-h-[48px] ${i > 0 ? 'border-t' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <span className="text-[14px]" style={{ color: 'var(--text-sub)' }}>{label}</span>
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>미설정</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        className="w-full text-[15px] font-bold py-4 rounded-[16px] min-h-[52px] text-white active:opacity-85 active:scale-[0.98]"
        style={{ background: 'var(--gradient)', boxShadow: '0 4px 20px rgba(255,128,171,0.3)' }}
        onClick={() => navigate('/signup')}
      >
        프로필 작성 시작하기
      </button>
    </div>
  );
}
