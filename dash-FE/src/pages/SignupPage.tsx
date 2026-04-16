import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

/* ─── Step types ─── */
type Step =
  | { type: 'text';       key: string; question: string; placeholder: string; sub?: string }
  | { type: 'choice';     key: string; question: string; options: { label: string; emoji: string }[]; sub?: string }
  | { type: 'range';      key: string; question: string; sub?: string }
  | { type: 'mbti';       key: string; question: string; sub?: string }
  | { type: 'mbti-multi'; key: string; question: string; sub?: string }
  | { type: 'intro';      key: string; question: string }
  | { type: 'tags';       key: string; question: string; placeholder: string; sub?: string; max: number };

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
    { type: 'mbti', key: 'mbti', question: 'MBTI가 뭐예요? 🧠' },
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
      type: 'mbti-multi', key: 'idealMbti',
      question: '선호하는 MBTI를 골라봐요 🧠',
      sub: '최대 3개까지 선택할 수 있어요',
    },
    { type: 'text', key: 'idealAge', question: '선호하는 나이대는? 🎂', placeholder: 'ex. 21~27' },
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

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                    'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

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

  const toggleMbtiMulti = (val: string) => {
    const current = currentValue ? currentValue.split(',').filter(Boolean) : [];
    if (current.includes(val)) {
      setAnswers(prev => ({ ...prev, [step.key]: current.filter(v => v !== val).join(',') }));
    } else if (current.length < 3) {
      setAnswers(prev => ({ ...prev, [step.key]: [...current, val].join(',') }));
    }
  };

  const advance = () => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
      else navigate('/');
    }, 220);
  };

  const handleNext = () => {
    if (step.type !== 'intro' && step.type !== 'tags' && !currentValue) return;
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
    if (step.type !== 'text' && step.type !== 'mbti-multi') {
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

  const showFooter =
    step.type === 'text' ||
    step.type === 'range' ||
    step.type === 'mbti-multi' ||
    step.type === 'tags' ||
    step.type === 'intro';

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

        {'sub' in step && step.sub && step.type !== 'intro' && (
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

        {/* ── MBTI (single) ── */}
        {step.type === 'mbti' && (
          <div className="mbti-grid">
            {MBTI_TYPES.map(m => (
              <button
                key={m}
                className={`mbti-btn ${currentValue === m ? 'selected' : ''}`}
                onClick={() => select(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* ── MBTI multi (max 3) ── */}
        {step.type === 'mbti-multi' && (() => {
          const selected = currentValue ? currentValue.split(',').filter(Boolean) : [];
          return (
            <div className="mbti-grid">
              {MBTI_TYPES.map(m => {
                const isSelected = selected.includes(m);
                const maxed = selected.length >= 3 && !isSelected;
                return (
                  <button
                    key={m}
                    className={`mbti-btn ${isSelected ? 'selected' : ''} ${maxed ? 'opacity-30' : ''}`}
                    onClick={() => toggleMbtiMulti(m)}
                    disabled={maxed}
                  >
                    {m}
                    {isSelected && <span style={{ fontSize: '9px', display: 'block', marginTop: '2px' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Footer button */}
      {showFooter && (
        <div className="signup-footer">
          <button
            className={`next-btn ${(currentValue || step.type === 'intro' || step.type === 'tags') ? 'active' : ''}`}
            onClick={handleNext}
            disabled={step.type !== 'intro' && step.type !== 'tags' && !currentValue}
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
