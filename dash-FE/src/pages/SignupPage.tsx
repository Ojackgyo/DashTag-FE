import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

/* ─── Step types ─── */
type Step =
  | { type: 'text';          key: string; question: string; placeholder: string; sub?: string }
  | { type: 'choice';        key: string; question: string; options: { label: string; emoji: string }[]; sub?: string }
  | { type: 'range';         key: string; question: string; sub?: string }
  | { type: 'intro';         key: string; question: string }
  | { type: 'tags';          key: string; question: string; placeholder: string; sub?: string; max: number }
  | { type: 'mbti-selector'; key: string; question: string; ideal?: boolean; sub?: string };

/* ─── Hair style options ─── */
const MALE_HAIR = [
  { label: '짧은 머리', emoji: '💈' },
  { label: '중단발',   emoji: '✂️' },
  { label: '투블럭',   emoji: '🧑' },
  { label: '파마',     emoji: '🌀' },
  { label: '염색',     emoji: '🎨' },
  { label: '스포츠 컷', emoji: '⚡' },
  { label: '민머리',   emoji: '🥚' },
];

const FEMALE_HAIR = [
  { label: '짧은 머리',    emoji: '💈' },
  { label: '중단발',      emoji: '✂️' },
  { label: '긴 머리',     emoji: '💁' },
  { label: '파마',        emoji: '🌀' },
  { label: '웨이브',      emoji: '🌊' },
  { label: '염색',        emoji: '🎨' },
  { label: '단발 (쇼트컷)', emoji: '✨' },
];

/* ─── Dynamic steps based on gender ─── */
function getSteps(gender: string): Step[] {
  const isMale   = gender === '남성';
  const isFemale = gender === '여성';
  const ownHair  = isMale ? MALE_HAIR   : isFemale ? FEMALE_HAIR : MALE_HAIR;
  const idealHair = isMale ? FEMALE_HAIR : MALE_HAIR;

  const steps: Step[] = [
    /* 0 – 성별 */
    {
      type: 'choice', key: 'gender', question: '성별을 선택해주세요 👤',
      options: [{ label: '남성', emoji: '👨' }, { label: '여성', emoji: '👩' }],
    },

    /* ─── 내 정보 ─── */
    { type: 'text',   key: 'name',     question: '이름이 뭐예요? 👋',          placeholder: '실명을 입력해주세요' },
    { type: 'text',   key: 'userId',   question: '아이디를 정해주세요 🆔',      placeholder: '영문/숫자 조합 (ex. dasher01)' },
    { type: 'text',   key: 'nickname', question: '영어 닉네임을 골라봐요 ✨',   placeholder: 'ex. Aria, Nova, Zack…' },
    {
      type: 'choice', key: 'faceType', question: '내 얼굴상은? 🐾',
      options: [
        { label: '늑대상',  emoji: '🐺' }, { label: '강아지상', emoji: '🐶' },
        { label: '여우상',  emoji: '🦊' }, { label: '고양이상', emoji: '🐱' },
        { label: '곰상',    emoji: '🐻' }, { label: '토끼상',   emoji: '🐰' },
        { label: '사슴상',  emoji: '🦌' }, { label: '공룡상',   emoji: '🦕' },
        { label: '새상',    emoji: '🦅' }, { label: '물개상',   emoji: '🦭' },
      ],
    },
    { type: 'range', key: 'height', question: '키가 어떻게 돼요? 📏' },
    { type: 'range', key: 'weight', question: '몸무게는요? 🏋️', sub: '공개 여부는 나중에 설정할 수 있어요' },
    {
      type: 'choice', key: 'skinTone', question: '피부톤은 어때요? 🎨',
      options: [
        { label: '매우 밝음', emoji: '🌟' }, { label: '밝음',     emoji: '☀️' },
        { label: '중간',     emoji: '🌤️' }, { label: '어두운 편', emoji: '🌙' },
        { label: '매우 어두움', emoji: '🌑' },
      ],
    },
    {
      type: 'mbti-selector', key: 'mbti', question: 'MBTI가 뭐예요? 🧠',
      sub: '각 항목에서 해당하는 쪽을 선택해주세요',
    },
    { type: 'text', key: 'age',   question: '몇 살이에요? 🎂',        placeholder: '나이를 숫자로 입력 (ex. 24)' },
    { type: 'text', key: 'major', question: '학과가 어떻게 돼요? 🎓', placeholder: 'ex. 경영학과, 컴퓨터공학과' },
  ];

  /* 군대 (남성만) */
  if (isMale) {
    steps.push({
      type: 'choice', key: 'military', question: '군대는 다녀왔나요? 🪖',
      options: [
        { label: '현역 복무', emoji: '✅' }, { label: '사회복무', emoji: '🏥' },
        { label: '미필',     emoji: '⏳' }, { label: '면제',     emoji: '📋' },
        { label: '해당 없음', emoji: '👩' },
      ],
    });
  }

  /* 헤어 / 타투 / 흡연 */
  steps.push(
    { type: 'choice', key: 'hairStyle', question: '헤어스타일은요? 💇', options: ownHair },
    {
      type: 'choice', key: 'tattoo', question: '타투가 있나요? 🖊️',
      options: [
        { label: '없어요', emoji: '❌' }, { label: '작은 타투', emoji: '✨' },
        { label: '큰 타투', emoji: '🎭' }, { label: '많아요',   emoji: '🌈' },
      ],
    },
    {
      type: 'choice', key: 'smoking', question: '흡연 여부를 알려주세요 🚬',
      options: [
        { label: '비흡연',      emoji: '🚭' }, { label: '가끔 피워요',  emoji: '🌬️' },
        { label: '흡연자예요',  emoji: '🚬' }, { label: '금연 중이에요', emoji: '💪' },
      ],
    },
  );

  /* 매력포인트 */
  steps.push({
    type: 'tags', key: 'charmPoints',
    question: '나의 매력포인트는? ✨',
    placeholder: 'ex. 유머러스, 요리 잘함…',
    sub: '최대 3개까지 입력할 수 있어요',
    max: 3,
  });

  /* ─── 이상형 인트로 ─── */
  steps.push({ type: 'intro', key: 'idealIntro', question: '이상형' });

  /* ─── 이상형 설정 (반대 성별 기준) ─── */
  steps.push(
    {
      type: 'choice', key: 'idealFaceType', question: '이상형의 얼굴상은? 💕',
      options: [
        { label: '늑대상',  emoji: '🐺' }, { label: '강아지상', emoji: '🐶' },
        { label: '여우상',  emoji: '🦊' }, { label: '고양이상', emoji: '🐱' },
        { label: '곰상',    emoji: '🐻' }, { label: '토끼상',   emoji: '🐰' },
        { label: '사슴상',  emoji: '🦌' }, { label: '공룡상',   emoji: '🦕' },
        { label: '새상',    emoji: '🦅' }, { label: '물개상',   emoji: '🦭' },
        { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealSkinTone', question: '선호하는 피부톤은? 🎨',
      options: [
        { label: '매우 밝음', emoji: '🌟' }, { label: '밝음',     emoji: '☀️' },
        { label: '중간',     emoji: '🌤️' }, { label: '어두운 편', emoji: '🌙' },
        { label: '매우 어두움', emoji: '🌑' }, { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'mbti-selector', key: 'idealMbti', question: '선호하는 MBTI는? 🧠',
      ideal: true, sub: '상관없으면 🤷를 선택해주세요',
    },
    {
      type: 'choice', key: 'idealAge', question: '나이 차이는 얼마나 괜찮아요? 🎂',
      sub: '내 나이 기준으로 선택해주세요',
      options: [
        { label: '±1살', emoji: '🎯' },
        { label: '±2살', emoji: '💕' },
        { label: '±3살', emoji: '🌸' },
        { label: '±5살', emoji: '✨' },
        { label: '±7살', emoji: '🌈' },
        { label: '상관없어요', emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealHairStyle', question: '선호하는 헤어스타일은? 💇',
      options: [...idealHair, { label: '상관없어요', emoji: '🤷' }],
    },
    {
      type: 'choice', key: 'idealTattoo', question: '타투는 괜찮나요? 🖊️',
      options: [
        { label: '없었으면 해요', emoji: '❌' }, { label: '작은 건 괜찮아요', emoji: '✨' },
        { label: '상관없어요',   emoji: '🤷' },
      ],
    },
    {
      type: 'choice', key: 'idealSmoking', question: '흡연 여부는 괜찮나요? 🚬',
      options: [
        { label: '비흡연만',     emoji: '🚭' }, { label: '가끔은 괜찮아요', emoji: '🌬️' },
        { label: '상관없어요',   emoji: '🤷' },
      ],
    },
  );

  /* 여성 → 이상형 군필 여부 추가 */
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

/* ─── MBTI 한 페이지 선택 ─── */
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {MBTI_DIMS.map(({ idx, left, leftLabel, right, rightLabel, desc }) => {
        const sel = parts[idx] ?? '';
        return (
          <div
            key={idx}
            style={{
              borderRadius: 16, padding: '10px 12px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{desc}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Left */}
              <button
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 4px', borderRadius: 12, gap: 3,
                  background: sel === left ? 'var(--gradient)' : 'var(--bg-card2)',
                  border: sel === left ? 'none' : '1.5px solid var(--border)',
                  color: sel === left ? 'white' : 'var(--text-sub)',
                  cursor: 'pointer',
                }}
                onClick={() => pick(idx, left)}
              >
                <span style={{ fontSize: 18, fontWeight: 800 }}>{left}</span>
                <span style={{ fontSize: 10 }}>{leftLabel}</span>
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>vs</span>
              {/* Right */}
              <button
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 4px', borderRadius: 12, gap: 3,
                  background: sel === right ? 'var(--gradient)' : 'var(--bg-card2)',
                  border: sel === right ? 'none' : '1.5px solid var(--border)',
                  color: sel === right ? 'white' : 'var(--text-sub)',
                  cursor: 'pointer',
                }}
                onClick={() => pick(idx, right)}
              >
                <span style={{ fontSize: 18, fontWeight: 800 }}>{right}</span>
                <span style={{ fontSize: 10 }}>{rightLabel}</span>
              </button>
              {/* 상관없어요 (ideal only) */}
              {ideal && (
                <>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>or</span>
                  <button
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 4px', borderRadius: 12, gap: 3,
                      background: sel === '?' ? 'var(--primary-bg)' : 'var(--bg-card2)',
                      border: sel === '?' ? '1.5px solid var(--primary-border)' : '1.5px solid var(--border)',
                      color: sel === '?' ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
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

/* ─── Height/Weight slider ─── */
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
      <input
        type="range" min={min} max={max} value={num}
        className="range-slider"
        onChange={e => onChange(e.target.value)}
      />
      <div className="range-minmax">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ─── Tags input (매력포인트 등) ─── */
function TagsInput({
  value, onChange, placeholder, max,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; max: number;
}) {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').filter(Boolean) : [];

  const add = () => {
    const t = input.trim();
    if (!t || tags.includes(t) || tags.length >= max) return;
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }}
          placeholder={tags.length >= max ? `최대 ${max}개까지 입력할 수 있어요` : placeholder}
          disabled={tags.length >= max}
          style={tags.length >= max ? { opacity: 0.45 } : {}}
        />
        <button
          className="tags-add-btn"
          onClick={add}
          disabled={!input.trim() || tags.length >= max}
          style={input.trim() && tags.length < max
            ? { background: 'var(--gradient)', color: 'white' }
            : { background: 'var(--bg-card2)', color: 'var(--text-muted)' }
          }
        >추가</button>
      </div>
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

/* ─── Ideal intro screen ─── */
function IntroScreen() {
  return (
    <div className="intro-wrap">
      <div className="intro-card-scene">
        <div className="intro-card-3d">
          <span className="intro-main-emoji">💕</span>
        </div>
        <span className="float-heart" style={{ left: '12%',  animationDelay: '0s' }}>💗</span>
        <span className="float-heart" style={{ left: '48%',  animationDelay: '0.8s' }}>💖</span>
        <span className="float-heart" style={{ left: '78%',  animationDelay: '1.5s' }}>💝</span>
        <span className="float-heart" style={{ left: '30%',  animationDelay: '2.1s', fontSize: '14px' }}>✨</span>
        <span className="float-heart" style={{ left: '65%',  animationDelay: '0.4s', fontSize: '14px' }}>🌸</span>
      </div>
      <div className="intro-text-block">
        <p className="intro-ddk">두근두근</p>
        <h2 className="intro-title">이제 이상형을<br/>선택해볼까요?</h2>
        <p className="intro-sub-text">입력한 정보로 딱 맞는 사람을 매칭해드려요 💘</p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visible, setVisible]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const gender = answers['gender'] || '';
  const steps  = useMemo(() => getSteps(gender), [gender]);

  const step   = steps[currentStep] ?? steps[0];
  const isLast = currentStep === steps.length - 1;
  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [currentStep]);

  useEffect(() => {
    if (step.type === 'text') setTimeout(() => inputRef.current?.focus(), 300);
  }, [currentStep, step.type]);

  const currentValue = answers[step.key] || '';

  const advance = () => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
      else navigate('/');
    }, 220);
  };

  const handleNext = () => {
    if (step.type === 'mbti-selector') {
      const ideal = 'ideal' in step ? step.ideal : false;
      if (!mbtiAllSelected(currentValue, ideal)) return;
    } else if (step.type !== 'intro' && step.type !== 'tags' && !currentValue) {
      return;
    }
    if (isLast) { navigate('/'); return; }
    advance();
  };

  const handleBack = () => {
    if (currentStep === 0) { navigate('/'); return; }
    setExiting(true);
    setTimeout(() => { setExiting(false); setCurrentStep(s => s - 1); }, 220);
  };

  const select = (val: string) => {
    setAnswers(prev => ({ ...prev, [step.key]: val }));
    if (step.type !== 'text') {
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setExiting(false);
          if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
          else navigate('/');
        }, 220);
      }, 180);
    }
  };

  const mbtiAllSelected = (val: string, ideal?: boolean) => {
    const parts = val ? val.split(',') : [];
    if (parts.length < 4) return false;
    return parts.every(p => p === 'E' || p === 'I' || p === 'S' || p === 'N' ||
      p === 'T' || p === 'F' || p === 'J' || p === 'P' || (ideal && p === '?'));
  };

  const showFooter =
    step.type === 'text' ||
    step.type === 'range' ||
    step.type === 'tags' ||
    step.type === 'intro' ||
    step.type === 'mbti-selector';

  const isNextEnabled =
    step.type === 'intro' ||
    step.type === 'tags' ||
    (step.type === 'mbti-selector' && mbtiAllSelected(currentValue, 'ideal' in step ? step.ideal : false)) ||
    !!(step.type !== 'mbti-selector' && currentValue);

  return (
    <div className="signup-page">
      {/* Top bar */}
      <div className="signup-topbar">
        <button className="back-btn" onClick={handleBack}>‹</button>
        <div className="step-counter">{currentStep + 1} / {steps.length}</div>
      </div>

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-thumb" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className={`signup-content ${visible && !exiting ? 'slide-in' : 'slide-out'} ${step.type === 'intro' ? 'intro-mode' : ''}`}>
        {step.type !== 'intro' && (
          <h2 className="signup-question">{step.question}</h2>
        )}

        {'sub' in step && step.sub && (
          <p className="signup-sub">{step.sub}</p>
        )}

        {/* ── Intro ── */}
        {step.type === 'intro' && <IntroScreen />}

        {/* ── Text ── */}
        {step.type === 'text' && (
          <input
            ref={inputRef}
            className="signup-input"
            type={step.key === 'age' ? 'number' : 'text'}
            placeholder={step.placeholder}
            value={currentValue}
            onChange={e => setAnswers(prev => ({ ...prev, [step.key]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleNext(); }}
          />
        )}

        {/* ── Tags ── */}
        {step.type === 'tags' && (
          <TagsInput
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
            placeholder={step.placeholder}
            max={step.max}
          />
        )}

        {/* ── Choice ── */}
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

        {/* ── Range ── */}
        {step.type === 'range' && (
          <RangeInput
            stepKey={step.key}
            value={currentValue}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

        {/* ── MBTI Selector ── */}
        {step.type === 'mbti-selector' && (
          <MbtiSelector
            value={currentValue}
            ideal={'ideal' in step ? step.ideal : false}
            onChange={v => setAnswers(prev => ({ ...prev, [step.key]: v }))}
          />
        )}

      </div>

      {/* Footer button */}
      {showFooter && (
        <div className="signup-footer">
          <button
            className={`next-btn ${isNextEnabled ? 'active' : ''}`}
            onClick={handleNext}
            disabled={!isNextEnabled}
          >
            {step.type === 'intro'
              ? '시작하기! 💕'
              : isLast
                ? '완료! 시작하기 🎉'
                : '다음으로 →'}
          </button>
        </div>
      )}
    </div>
  );
}
