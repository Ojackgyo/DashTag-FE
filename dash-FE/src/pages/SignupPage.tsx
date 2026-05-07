import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import rawNicknames from '../data/nicknames.csv?raw';
import inhaMajorsRaw from '../data/inha_majors.json';

/* ─── 닉네임 목록 (CSV) ─── */
const NICKNAMES: string[] = rawNicknames
  .split('\n')
  .flatMap(line => line.split(','))
  .map(n => n.trim())
  .filter(Boolean);

/* ─── 인하대 학과 목록 (inha_majors.json) ─── */
const INHA_DEPARTMENTS: string[] = (inhaMajorsRaw as { college: string; majors?: string[]; major?: string[] }[])
  .flatMap(c => c.majors ?? c.major ?? []);

/* ─── 금지어 목록 ─── */
const BLOCKED_WORDS = [
  '섹스', '섹', '야동', '음란', '포르노', '성인', '자살', '살인', '마약',
  '욕설', '씨발', '개새', '병신', '지랄', '꺼져', 'fuck', 'shit', 'sex',
  '강간', '폭행', '테러', '폭탄',
];

function isCleanTag(tag: string): boolean {
  const lower = tag.toLowerCase();
  return !BLOCKED_WORDS.some(w => lower.includes(w));
}

/* ─── 비밀번호 강도 ─── */
interface PwStrength { level: 0 | 1 | 2 | 3; label: string; color: string }

function getPwStrength(pw: string): PwStrength {
  if (!pw) return { level: 0, label: '', color: 'transparent' };
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw),
  ];
  const passed = checks.filter(Boolean).length;
  if (passed <= 2) return { level: 1, label: '약함', color: '#FF6B6B' };
  if (passed === 3) return { level: 2, label: '보통', color: '#F5A623' };
  if (passed === 4) return { level: 2, label: '양호', color: '#7ED321' };
  return { level: 3, label: '강함', color: '#2ECC71' };
}

function isPasswordStrong(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw)
  );
}

/* ─── Step types ─── */
type Step =
  | { type: 'text';            key: string; question: string; placeholder: string; sub?: string }
  | { type: 'password';        key: string; question: string; placeholder: string; sub?: string }
  | { type: 'email-verify';    key: string; question: string; sub?: string }
  | { type: 'nickname-picker'; key: string; question: string; sub?: string }
  | { type: 'major-select';    key: string; question: string; sub?: string }
  | { type: 'choice';          key: string; question: string; options: { label: string; emoji: string }[]; sub?: string }
  | { type: 'range';           key: string; question: string; sub?: string }
  | { type: 'intro';           key: string; question: string }
  | { type: 'tags';            key: string; question: string; placeholder: string; sub?: string; max: number }
  | { type: 'mbti-selector';   key: string; question: string; ideal?: boolean; sub?: string };

/* ─── Steps ─── */
function getSteps(gender: string): Step[] {
  const isMale   = gender === '남성';
  const isFemale = gender === '여성';

  const steps: Step[] = [
    {
      type: 'choice', key: 'gender', question: '성별을 선택해주세요 👤',
      options: [{ label: '남성', emoji: '👨' }, { label: '여성', emoji: '👩' }],
    },
    {
      type: 'text', key: 'email', question: '인하대 이메일을 입력해주세요 📧',
      placeholder: '22000000@inha.edu',
      sub: '포털 이메일(@inha.edu)만 사용할 수 있어요',
    },
    {
      type: 'email-verify', key: 'emailCode', question: '이메일 인증을 완료해주세요 📬',
      sub: '인증번호 6자리를 입력해주세요',
    },
    {
      type: 'password', key: 'password', question: '비밀번호를 설정해주세요 🔒',
      placeholder: '8자 이상, 대/소문자·숫자·특수문자 포함',
      sub: '보안을 위해 강력한 비밀번호를 설정해주세요',
    },
    { type: 'text', key: 'name', question: '이름이 뭐예요? 👋', placeholder: '실명을 입력해주세요' },
    { type: 'nickname-picker', key: 'nickname', question: '영어 닉네임을 골라봐요 ✨', sub: '앱에서 사용할 닉네임이에요' },
    {
      type: 'choice', key: 'faceType', question: '내 얼굴상은? 🐾',
      options: [
        { label: '늑대상', emoji: '🐺' }, { label: '강아지상', emoji: '🐶' },
        { label: '여우상', emoji: '🦊' }, { label: '고양이상', emoji: '🐱' },
        { label: '곰상', emoji: '🐻' },   { label: '토끼상', emoji: '🐰' },
        { label: '사슴상', emoji: '🦌' }, { label: '공룡상', emoji: '🦕' },
        { label: '새상', emoji: '🦅' },   { label: '물개상', emoji: '🦭' },
      ],
    },
    { type: 'range', key: 'height', question: '키가 어떻게 돼요? 📏' },
    { type: 'range', key: 'weight', question: '몸무게는요? 🏋️', sub: '공개 여부는 나중에 설정할 수 있어요' },
    {
      type: 'choice', key: 'skinTone', question: '피부톤은 어때요? 🎨',
      options: [
        { label: '매우 밝음', emoji: '🌟' }, { label: '밝음', emoji: '☀️' },
        { label: '중간', emoji: '🌤️' },     { label: '어두운 편', emoji: '🌙' },
        { label: '매우 어두움', emoji: '🌑' },
      ],
    },
    { type: 'mbti-selector', key: 'mbti', question: 'MBTI가 뭐예요? 🧠', sub: '각 항목에서 해당하는 쪽을 선택해주세요' },
    { type: 'text', key: 'age', question: '몇 살이에요? 🎂', placeholder: '나이를 숫자로 입력 (ex. 24)' },
    { type: 'major-select', key: 'major', question: '학과가 어떻게 돼요? 🎓', sub: '인하대학교 학과를 선택해주세요' },
  ];

  if (isMale) {
    steps.push({
      type: 'choice', key: 'military', question: '군대는 다녀왔나요? 🪖',
      options: [
        { label: '현역 복무', emoji: '✅' }, { label: '사회복무', emoji: '🏥' },
        { label: '미필', emoji: '⏳' },      { label: '면제', emoji: '📋' },
        { label: '해당 없음', emoji: '👩' },
      ],
    });
  }

  steps.push(
    {
      type: 'choice', key: 'tattoo', question: '타투가 있나요? 🖊️',
      options: [
        { label: '없어요', emoji: '❌' }, { label: '작은 타투', emoji: '✨' },
        { label: '큰 타투', emoji: '🎭' }, { label: '많아요', emoji: '🌈' },
      ],
    },
    {
      type: 'choice', key: 'smoking', question: '흡연 여부를 알려주세요 🚬',
      options: [
        { label: '비흡연', emoji: '🚭' },       { label: '가끔 피워요', emoji: '🌬️' },
        { label: '흡연자예요', emoji: '🚬' },   { label: '금연 중이에요', emoji: '💪' },
      ],
    },
    {
      type: 'tags', key: 'charmPoints', question: '나의 매력포인트는? ✨',
      placeholder: 'ex. 유머러스, 요리 잘함…',
      sub: '최대 3개까지 입력할 수 있어요',
      max: 3,
    },
  );

  steps.push({ type: 'intro', key: 'idealIntro', question: '이상형' });

  steps.push(
    {
      type: 'choice', key: 'idealFaceType', question: '이상형의 얼굴상은? 💕',
      options: [
        { label: '늑대상', emoji: '🐺' }, { label: '강아지상', emoji: '🐶' },
        { label: '여우상', emoji: '🦊' }, { label: '고양이상', emoji: '🐱' },
        { label: '곰상', emoji: '🐻' },   { label: '토끼상', emoji: '🐰' },
        { label: '사슴상', emoji: '🦌' }, { label: '공룡상', emoji: '🦕' },
        { label: '새상', emoji: '🦅' },   { label: '물개상', emoji: '🦭' },
        { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealSkinTone', question: '선호하는 피부톤은? 🎨',
      options: [
        { label: '매우 밝음', emoji: '🌟' }, { label: '밝음', emoji: '☀️' },
        { label: '중간', emoji: '🌤️' },     { label: '어두운 편', emoji: '🌙' },
        { label: '매우 어두움', emoji: '🌑' }, { label: '상관없어요', emoji: '🤷' },
      ],
    },
    { type: 'mbti-selector', key: 'idealMbti', question: '선호하는 MBTI는? 🧠', ideal: true, sub: '상관없으면 🤷를 선택해주세요' },
    {
      type: 'choice', key: 'idealAge', question: '나이 차이는 얼마나 괜찮아요? 🎂',
      sub: '내 나이 기준으로 선택해주세요',
      options: [
        { label: '±1살', emoji: '🎯' }, { label: '±2살', emoji: '💕' },
        { label: '±3살', emoji: '🌸' }, { label: '±5살', emoji: '✨' },
        { label: '±7살', emoji: '🌈' }, { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealTattoo', question: '타투는 괜찮나요? 🖊️',
      options: [
        { label: '없었으면 해요', emoji: '❌' }, { label: '작은 건 괜찮아요', emoji: '✨' },
        { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealSmoking', question: '흡연 여부는 괜찮나요? 🚬',
      options: [
        { label: '비흡연만', emoji: '🚭' }, { label: '가끔은 괜찮아요', emoji: '🌬️' },
        { label: '상관없어요', emoji: '🤷' },
      ],
    },
  );

  if (isFemale) {
    steps.push({
      type: 'choice', key: 'idealMilitary', question: '군필 여부가 중요한가요? 🪖',
      options: [
        { label: '군필 선호해요', emoji: '✅' }, { label: '상관없어요', emoji: '🤷' },
      ],
    });
  }

  return steps;
}

/* ─── MBTI 선택기 ─── */
const MBTI_DIMS = [
  { idx: 0, left: 'E', leftLabel: '외향형', right: 'I', rightLabel: '내향형', desc: '에너지 방향' },
  { idx: 1, left: 'S', leftLabel: '감각형', right: 'N', rightLabel: '직관형', desc: '인식 방식' },
  { idx: 2, left: 'T', leftLabel: '사고형', right: 'F', rightLabel: '감정형', desc: '판단 방식' },
  { idx: 3, left: 'J', leftLabel: '계획형', right: 'P', rightLabel: '즉흥형', desc: '생활 방식' },
];

function MbtiSelector({ value, onChange, ideal }: { value: string; onChange: (v: string) => void; ideal?: boolean }) {
  const parts = value ? value.split(',') : Array(4).fill('');
  const pick = (idx: number, letter: string) => {
    const next = [...parts];
    while (next.length < 4) next.push('');
    next[idx] = next[idx] === letter ? '' : letter;
    onChange(next.join(','));
  };
  const btnStyle = (sel: string, letter: string) => ({
    flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const,
    padding: '10px 4px', borderRadius: 12, gap: 3,
    background: sel === letter ? 'var(--gradient)' : 'var(--bg-card2)',
    border: sel === letter ? 'none' : '1.5px solid var(--border)',
    color: sel === letter ? 'white' : 'var(--text-sub)', cursor: 'pointer',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {MBTI_DIMS.map(({ idx, left, leftLabel, right, rightLabel, desc }) => {
        const sel = parts[idx] ?? '';
        return (
          <div key={idx} style={{ borderRadius: 16, padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{desc}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={btnStyle(sel, left)} onClick={() => pick(idx, left)}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{left}</span>
                <span style={{ fontSize: 10 }}>{leftLabel}</span>
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>vs</span>
              <button style={btnStyle(sel, right)} onClick={() => pick(idx, right)}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{right}</span>
                <span style={{ fontSize: 10 }}>{rightLabel}</span>
              </button>
              {ideal && (
                <>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>or</span>
                  <button
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 4px', borderRadius: 12, gap: 3,
                      background: sel === '?' ? 'var(--primary-bg)' : 'var(--bg-card2)',
                      border: sel === '?' ? '1.5px solid var(--primary-border)' : '1.5px solid var(--border)',
                      color: sel === '?' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
                    }}
                    onClick={() => pick(idx, '?')}
                  >
                    <span style={{ fontSize: 16 }}>🤷</span>
                    <span style={{ fontSize: 9 }}>상관없음</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 슬라이더 ─── */
function RangeInput({ stepKey, value, onChange }: { stepKey: string; value: string; onChange: (v: string) => void }) {
  const isHeight = stepKey === 'height';
  const min = isHeight ? 140 : 40;
  const max = isHeight ? 200 : 120;
  const unit = isHeight ? 'cm' : 'kg';
  const num = parseInt(value) || (isHeight ? 170 : 65);
  return (
    <div className="range-wrap">
      <div className="range-display">
        <span className="range-value">{num}</span>
        <span className="range-unit">{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={num} className="range-slider" onChange={e => onChange(e.target.value)} />
      <div className="range-minmax"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

/* ─── 태그 입력 (매력포인트) ─── */
function TagsInput({ value, onChange, placeholder, max }: { value: string; onChange: (v: string) => void; placeholder: string; max: number }) {
  const [input, setInput] = useState('');
  const [tagError, setTagError] = useState('');
  const tags = value ? value.split(',').filter(Boolean) : [];

  const add = () => {
    const t = input.trim();
    if (!t || tags.includes(t) || tags.length >= max) return;
    if (!isCleanTag(t)) {
      setTagError('사용할 수 없는 단어가 포함되어 있어요');
      return;
    }
    if (t.length > 10) {
      setTagError('10자 이내로 입력해주세요');
      return;
    }
    setTagError('');
    onChange([...tags, t].join(','));
    setInput('');
  };

  const remove = (t: string) => onChange(tags.filter(x => x !== t).join(','));

  return (
    <div className="tags-input-wrap">
      <div className="tags-input-row">
        <input
          className="signup-input tags-input-field"
          value={input}
          onChange={e => { setInput(e.target.value); setTagError(''); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }}
          placeholder={tags.length >= max ? `최대 ${max}개까지 입력할 수 있어요` : placeholder}
          disabled={tags.length >= max}
          style={tags.length >= max ? { opacity: 0.45 } : {}}
        />
        <button
          className="tags-add-btn"
          onClick={add}
          disabled={!input.trim() || tags.length >= max}
          style={input.trim() && tags.length < max ? { background: 'var(--gradient)', color: 'white' } : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
        >추가</button>
      </div>
      {tagError && <p style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 600, marginTop: 4 }}>{tagError}</p>}
      {tags.length > 0 && (
        <div className="tags-list">
          {tags.map(t => (
            <span key={t} className="tag-chip">
              #{t}
              <button className="tag-chip-remove" onClick={() => remove(t)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 닉네임 피커 ─── */
function NicknamePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [pool, setPool] = useState<string[]>([]);
  const shuffle = () => {
    const shuffled = [...NICKNAMES].sort(() => Math.random() - 0.5);
    setPool(shuffled.slice(0, 8));
  };
  useEffect(() => { shuffle(); }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {pool.map(name => (
          <button
            key={name}
            onClick={() => onChange(name)}
            style={{
              padding: '14px 12px', borderRadius: 16,
              background: value === name ? 'var(--gradient)' : 'var(--bg-card)',
              border: value === name ? 'none' : '2px solid var(--border)',
              color: value === name ? 'white' : 'var(--text)',
              fontSize: 16, fontWeight: 700,
              boxShadow: value === name ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
              transition: 'all 0.16s',
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <button
        onClick={shuffle}
        style={{
          marginTop: 14, width: '100%', padding: '12px',
          borderRadius: 14, border: '1.5px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-sub)',
          fontSize: 14, fontWeight: 600, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        🔀 다른 닉네임 보기
      </button>
      {value && (
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
          선택됨: {value} ✓
        </p>
      )}
    </div>
  );
}

/* ─── SVG 눈 아이콘 ─── */
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── 이메일 인증 입력 ─── */
function EmailVerifyInput({ email, value, onChange }: {
  email: string; value: string; onChange: (v: string) => void;
}) {
  const [cooldown, setCooldown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
    // TODO: API call to resend verification email
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        background: 'rgba(255,128,171,0.08)', border: '1px solid var(--primary-border)',
        borderRadius: 14, padding: '12px 14px', marginBottom: 16,
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7 }}>
          📧 <b style={{ color: 'var(--text)' }}>{email}</b>으로<br />인증번호를 발송했어요
        </p>
      </div>
      <input
        ref={inputRef}
        className="signup-input"
        style={{ marginTop: 0, letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 800 }}
        type="text"
        inputMode="numeric"
        placeholder="000000"
        value={value}
        maxLength={6}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        style={{
          marginTop: 12, width: '100%', padding: '12px',
          borderRadius: 14, border: '1.5px solid var(--border)',
          background: 'var(--bg-card)',
          color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
          fontSize: 14, fontWeight: 600,
          opacity: cooldown > 0 ? 0.7 : 1,
          cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {cooldown > 0 ? `재전송 (${cooldown}초 후 가능)` : '인증번호 재전송'}
      </button>
    </div>
  );
}

/* ─── 학과 선택 (자동완성) ─── */
function MajorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState(value || '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? INHA_DEPARTMENTS.filter(d => d.includes(search.trim())).slice(0, 10)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (dept: string) => {
    onChange(dept);
    setSearch(dept);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ marginTop: 20, position: 'relative' }}>
      <input
        className="signup-input"
        style={{ marginTop: 0 }}
        placeholder="학과 검색 (예: 컴퓨터)"
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
          if (value && value !== e.target.value) onChange('');
        }}
        onFocus={() => { if (search.trim()) setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          borderRadius: 16, overflow: 'hidden', maxHeight: 260, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', scrollbarWidth: 'none',
        }}>
          {filtered.map((dept, i) => (
            <button
              key={dept}
              onMouseDown={e => { e.preventDefault(); handleSelect(dept); }}
              style={{
                width: '100%', padding: '13px 16px', textAlign: 'left',
                background: value === dept ? 'var(--primary-bg)' : 'transparent',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                color: value === dept ? 'var(--primary)' : 'var(--text)',
                fontSize: 15, fontWeight: value === dept ? 700 : 500,
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      )}
      {open && search.trim() && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          borderRadius: 16, padding: '16px', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>검색 결과가 없어요</p>
        </div>
      )}
      {value && (
        <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginTop: 10 }}>
          ✓ {value}
        </p>
      )}
    </div>
  );
}

/* ─── 비밀번호 강도 표시 ─── */
function PasswordStrengthBar({ pw }: { pw: string }) {
  const strength = getPwStrength(pw);
  const checks = [
    { label: '8자 이상', ok: pw.length >= 8 },
    { label: '대문자 포함', ok: /[A-Z]/.test(pw) },
    { label: '소문자 포함', ok: /[a-z]/.test(pw) },
    { label: '숫자 포함', ok: /[0-9]/.test(pw) },
    { label: '특수문자 포함', ok: /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw) },
  ];
  if (!pw) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[1, 2, 3].map(l => (
          <div key={l} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: strength.level >= l ? strength.color : 'var(--bg-card2)',
            transition: 'background 0.3s',
          }} />
        ))}
        <span style={{ fontSize: 11, fontWeight: 700, color: strength.color, marginLeft: 6 }}>
          {strength.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: 11, fontWeight: 600, color: c.ok ? '#2ECC71' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── 이상형 인트로 ─── */
function IntroScreen() {
  return (
    <div className="intro-wrap">
      <div className="intro-card-scene">
        <div className="intro-card-3d"><span className="intro-main-emoji">💕</span></div>
        <span className="float-heart" style={{ left: '12%', animationDelay: '0s' }}>💗</span>
        <span className="float-heart" style={{ left: '48%', animationDelay: '0.8s' }}>💖</span>
        <span className="float-heart" style={{ left: '78%', animationDelay: '1.5s' }}>💝</span>
        <span className="float-heart" style={{ left: '30%', animationDelay: '2.1s', fontSize: '14px' }}>✨</span>
        <span className="float-heart" style={{ left: '65%', animationDelay: '0.4s', fontSize: '14px' }}>🌸</span>
      </div>
      <div className="intro-text-block">
        <p className="intro-ddk">두근두근</p>
        <h2 className="intro-title">이제 이상형을<br />선택해볼까요?</h2>
        <p className="intro-sub-text">입력한 정보로 딱 맞는 사람을 매칭해드려요 💘</p>
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const advancingRef = useRef(false);

  const gender = answers['gender'] || '';
  const steps  = useMemo(() => getSteps(gender), [gender]);
  const step   = steps[currentStep] ?? steps[0];
  const isLast = currentStep === steps.length - 1;
  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    setVisible(false);
    setError('');
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [currentStep]);

  useEffect(() => {
    if (step.type === 'text' || step.type === 'password') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentStep, step.type]);

  const currentValue = answers[step.key] || '';

  const advance = () => {
    advancingRef.current = true;
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      advancingRef.current = false;
      if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
      else navigate('/');
    }, 220);
  };

  const validate = (): string | null => {
    if (step.key === 'email') {
      if (!currentValue.endsWith('@inha.edu')) return '인하대 이메일(@inha.edu)만 사용할 수 있어요';
    }
    if (step.key === 'emailCode') {
      if (currentValue.length !== 6) return '6자리 인증번호를 입력해주세요';
    }
    if (step.type === 'password') {
      if (!isPasswordStrong(currentValue)) return '비밀번호 요건을 모두 충족해주세요';
    }
    if (step.key === 'name') {
      if (currentValue.trim().length < 2) return '이름을 올바르게 입력해주세요 (2자 이상)';
    }
    if (step.key === 'age') {
      const age = parseInt(currentValue);
      if (isNaN(age) || age < 18 || age > 35) return '18~35세 사이의 나이를 입력해주세요';
    }
    return null;
  };

  const mbtiAllSelected = (val: string, ideal?: boolean) => {
    const parts = val ? val.split(',') : [];
    if (parts.length < 4) return false;
    return parts.every(p => p === 'E' || p === 'I' || p === 'S' || p === 'N' ||
      p === 'T' || p === 'F' || p === 'J' || p === 'P' || (ideal && p === '?'));
  };

  const handleNext = () => {
    if (advancingRef.current) return;
    if (step.type === 'mbti-selector') {
      const ideal = 'ideal' in step ? step.ideal : false;
      if (!mbtiAllSelected(currentValue, ideal)) return;
    } else if (step.type !== 'intro' && step.type !== 'tags' && step.type !== 'nickname-picker' && step.type !== 'major-select' && step.type !== 'email-verify' && !currentValue) {
      return;
    }
    const err = validate();
    if (err) { setError(err); return; }
    if (isLast) { navigate('/'); return; }
    advance();
  };

  const handleBack = () => {
    if (advancingRef.current) return;
    if (currentStep === 0) { navigate('/login'); return; }
    setExiting(true);
    setTimeout(() => { setExiting(false); setCurrentStep(s => s - 1); }, 220);
  };

  const select = (val: string) => {
    if (advancingRef.current) return;
    setAnswers(prev => ({ ...prev, [step.key]: val }));
    if (step.type !== 'text') {
      advancingRef.current = true;
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setExiting(false);
          advancingRef.current = false;
          if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
          else navigate('/');
        }, 220);
      }, 180);
    }
  };

  const showFooter =
    step.type === 'text' ||
    step.type === 'password' ||
    step.type === 'email-verify' ||
    step.type === 'nickname-picker' ||
    step.type === 'major-select' ||
    step.type === 'range' ||
    step.type === 'tags' ||
    step.type === 'intro' ||
    step.type === 'mbti-selector';

  const isNextEnabled = (() => {
    if (step.type === 'intro') return true;
    if (step.type === 'tags') return true;
    if (step.type === 'email-verify') return currentValue.length === 6;
    if (step.type === 'nickname-picker') return !!currentValue;
    if (step.type === 'major-select') return !!currentValue;
    if (step.type === 'mbti-selector') return mbtiAllSelected(currentValue, 'ideal' in step ? step.ideal : false);
    if (step.type === 'password') return isPasswordStrong(currentValue);
    return !!currentValue;
  })();

  return (
    <div className="signup-page">
      <div className="signup-topbar">
        <button className="back-btn" onClick={handleBack}>‹</button>
        <div className="step-counter">{currentStep + 1} / {steps.length}</div>
      </div>

      <div className="progress-track">
        <div className="progress-thumb" style={{ width: `${progress}%` }} />
      </div>

      <div className={`signup-content ${visible && !exiting ? 'slide-in' : 'slide-out'} ${step.type === 'intro' ? 'intro-mode' : ''}`}>
        {step.type !== 'intro' && (
          <h2 className="signup-question">{step.question}</h2>
        )}
        {'sub' in step && step.sub && (
          <p className="signup-sub">{step.sub}</p>
        )}

        {/* 인하대 이메일 튜토리얼 */}
        {step.key === 'email' && (
          <div style={{
            background: 'rgba(255,128,171,0.08)', border: '1px solid var(--primary-border)',
            borderRadius: 14, padding: '12px 14px', marginBottom: 4,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>📌 인하대 포털 이메일 확인 방법</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              1. 인하대 포털 <b style={{ color: 'var(--text)' }}>portal.inha.edu</b> 로그인<br />
              2. 마이페이지 → 기본정보 → 이메일 확인<br />
              3. 형식: <b style={{ color: 'var(--primary)' }}>학번@inha.edu</b>
            </p>
          </div>
        )}

        {/* 텍스트 입력 */}
        {step.type === 'text' && (
          <input
            ref={inputRef}
            className="signup-input"
            type={step.key === 'age' ? 'number' : step.key === 'email' ? 'email' : 'text'}
            placeholder={'placeholder' in step ? step.placeholder : ''}
            value={currentValue}
            onChange={e => { setAnswers(prev => ({ ...prev, [step.key]: e.target.value })); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleNext(); }}
          />
        )}

        {/* 비밀번호 입력 */}
        {step.type === 'password' && (
          <div style={{ marginTop: 24 }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                className="signup-input"
                style={{ marginTop: 0, paddingRight: 50 }}
                type={showPw ? 'text' : 'password'}
                placeholder={'placeholder' in step ? step.placeholder : ''}
                value={currentValue}
                onChange={e => { setAnswers(prev => ({ ...prev, [step.key]: e.target.value })); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleNext(); }}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <PasswordStrengthBar pw={currentValue} />
          </div>
        )}

        {/* 이메일 인증 */}
        {step.type === 'email-verify' && (
          <EmailVerifyInput
            email={answers['email'] || ''}
            value={currentValue}
            onChange={v => { setAnswers(prev => ({ ...prev, [step.key]: v })); setError(''); }}
          />
        )}

        {/* 닉네임 피커 */}
        {step.type === 'nickname-picker' && (
          <NicknamePicker
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

        {/* 학과 선택 */}
        {step.type === 'major-select' && (
          <MajorSelect
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

        {/* 태그 */}
        {step.type === 'tags' && (
          <TagsInput
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
            placeholder={'placeholder' in step ? step.placeholder : ''}
            max={'max' in step ? step.max : 3}
          />
        )}

        {/* 선택지 */}
        {step.type === 'choice' && (
          <div className="choice-grid">
            {'options' in step && step.options.map(opt => (
              <button
                key={opt.label}
                className={`choice-btn ${currentValue === opt.label ? 'selected' : ''}`}
                onClick={() => select(opt.label)}
              >
                <span className="choice-emoji">{opt.emoji}</span>
                <span className="choice-label">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 슬라이더 */}
        {step.type === 'range' && (
          <RangeInput
            stepKey={step.key}
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

        {/* MBTI */}
        {step.type === 'mbti-selector' && (
          <MbtiSelector
            value={currentValue}
            ideal={'ideal' in step ? step.ideal : false}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

        {/* 이상형 인트로 */}
        {step.type === 'intro' && <IntroScreen />}

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 12,
          }}>
            <p style={{ fontSize: 13, color: '#FF6B6B', fontWeight: 600 }}>⚠️ {error}</p>
          </div>
        )}
      </div>

      {showFooter && (
        <div className="signup-footer">
          <button
            className={`next-btn ${isNextEnabled ? 'active' : ''}`}
            onClick={handleNext}
            disabled={!isNextEnabled}
          >
            {step.type === 'intro' ? '시작하기! 💕' : isLast ? '완료! 시작하기 🎉' : '다음으로 →'}
          </button>
        </div>
      )}
    </div>
  );
}
