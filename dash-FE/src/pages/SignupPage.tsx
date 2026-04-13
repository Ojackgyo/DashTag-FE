import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

/* ─── Step definitions ─── */
type Step =
  | { type: 'text'; key: string; question: string; placeholder: string }
  | { type: 'choice'; key: string; question: string; options: { label: string; emoji: string }[] }
  | { type: 'range'; key: string; question: string; sub?: string }
  | { type: 'mbti'; key: string; question: string };

const STEPS: Step[] = [
  {
    type: 'text',
    key: 'name',
    question: '이름이 뭐예요? 👋',
    placeholder: '실명을 입력해주세요',
  },
  {
    type: 'text',
    key: 'userId',
    question: '아이디를 정해주세요 🆔',
    placeholder: '영문/숫자 조합 (ex. dasher01)',
  },
  {
    type: 'text',
    key: 'nickname',
    question: '영어 닉네임을 골라봐요 ✨',
    placeholder: 'ex. Aria, Nova, Zack…',
  },
  {
    type: 'choice',
    key: 'faceType',
    question: '내 얼굴상은? 🐾',
    options: [
      { label: '늑대상', emoji: '🐺' },
      { label: '강아지상', emoji: '🐶' },
      { label: '여우상', emoji: '🦊' },
      { label: '고양이상', emoji: '🐱' },
      { label: '곰상', emoji: '🐻' },
      { label: '토끼상', emoji: '🐰' },
      { label: '사슴상', emoji: '🦌' },
      { label: '공룡상', emoji: '🦕' },
      { label: '새상', emoji: '🦅' },
      { label: '물개상', emoji: '🦭' },
    ],
  },
  {
    type: 'range',
    key: 'height',
    question: '키가 어떻게 돼요? 📏',
  },
  {
    type: 'range',
    key: 'weight',
    question: '몸무게는요? 🏋️',
    sub: '공개 여부는 나중에 설정할 수 있어요',
  },
  {
    type: 'choice',
    key: 'skinTone',
    question: '피부톤은 어때요? 🎨',
    options: [
      { label: '매우 밝음', emoji: '🌟' },
      { label: '밝음', emoji: '☀️' },
      { label: '중간', emoji: '🌤️' },
      { label: '어두운 편', emoji: '🌙' },
      { label: '매우 어두움', emoji: '🌑' },
    ],
  },
  {
    type: 'mbti',
    key: 'mbti',
    question: 'MBTI가 뭐예요? 🧠',
  },
  {
    type: 'text',
    key: 'age',
    question: '몇 살이에요? 🎂',
    placeholder: '나이를 숫자로 입력 (ex. 24)',
  },
  {
    type: 'text',
    key: 'major',
    question: '학과가 어떻게 돼요? 🎓',
    placeholder: 'ex. 경영학과, 컴퓨터공학과',
  },
  {
    type: 'choice',
    key: 'military',
    question: '군대는 다녀왔나요? 🪖',
    options: [
      { label: '현역 복무', emoji: '✅' },
      { label: '사회복무', emoji: '🏥' },
      { label: '미필', emoji: '⏳' },
      { label: '면제', emoji: '📋' },
      { label: '해당 없음', emoji: '👩' },
    ],
  },
  {
    type: 'choice',
    key: 'hairStyle',
    question: '헤어스타일은요? 💇',
    options: [
      { label: '짧은 머리', emoji: '💈' },
      { label: '중단발', emoji: '✂️' },
      { label: '긴 머리', emoji: '💁' },
      { label: '투블럭', emoji: '🧑' },
      { label: '파마', emoji: '🌀' },
      { label: '염색', emoji: '🎨' },
      { label: '스포츠 컷', emoji: '⚡' },
      { label: '민머리', emoji: '🥚' },
    ],
  },
  {
    type: 'choice',
    key: 'tattoo',
    question: '타투가 있나요? 🖊️',
    options: [
      { label: '없어요', emoji: '❌' },
      { label: '작은 타투', emoji: '✨' },
      { label: '큰 타투', emoji: '🎭' },
      { label: '많아요', emoji: '🌈' },
    ],
  },
  {
    type: 'choice',
    key: 'smoking',
    question: '흡연 여부를 알려주세요 🚬',
    options: [
      { label: '비흡연', emoji: '🚭' },
      { label: '가끔 피워요', emoji: '🌬️' },
      { label: '흡연자예요', emoji: '🚬' },
      { label: '금연 중이에요', emoji: '💪' },
    ],
  },
];

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];

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
        type="range"
        min={min}
        max={max}
        value={num}
        className="range-slider"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="range-minmax">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const progress = ((currentStep) / STEPS.length) * 100;

  // slide-up animation trigger
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [currentStep]);

  // auto-focus text inputs
  useEffect(() => {
    if (step.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentStep, step.type]);

  const currentValue = answers[step.key] || '';

  const handleNext = () => {
    if (!currentValue) return;
    if (isLast) {
      navigate('/');
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setCurrentStep((s) => s + 1);
    }, 220);
  };

  const handleBack = () => {
    if (currentStep === 0) { navigate('/'); return; }
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setCurrentStep((s) => s - 1);
    }, 220);
  };

  const select = (val: string) => {
    setAnswers((prev) => ({ ...prev, [step.key]: val }));
    if (step.type !== 'text') {
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setExiting(false);
          if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
          else navigate('/');
        }, 220);
      }, 180);
    }
  };

  return (
    <div className="signup-page">
      {/* Top bar */}
      <div className="signup-topbar">
        <button className="back-btn" onClick={handleBack}>
          ‹
        </button>
        <div className="step-counter">{currentStep + 1} / {STEPS.length}</div>
      </div>

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-thumb" style={{ width: `${progress}%` }} />
      </div>

      {/* Content */}
      <div className={`signup-content ${visible && !exiting ? 'slide-in' : 'slide-out'}`}>
        <h2 className="signup-question">{step.question}</h2>

        {step.type === 'text' && (
          <>
            {'sub' in step && step.sub && (
              <p className="signup-sub">{step.sub}</p>
            )}
            <input
              ref={inputRef}
              className="signup-input"
              type={step.key === 'age' ? 'number' : 'text'}
              placeholder={'placeholder' in step ? step.placeholder : ''}
              value={currentValue}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [step.key]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
          </>
        )}

        {step.type === 'choice' && (
          <div className="choice-grid">
            {'options' in step && step.options.map((opt) => (
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

        {step.type === 'range' && (
          <RangeInput
            stepKey={step.key}
            value={currentValue}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [step.key]: v }))}
          />
        )}

        {step.type === 'mbti' && (
          <div className="mbti-grid">
            {MBTI_TYPES.map((m) => (
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
      </div>

      {/* Next button (for text and range) */}
      {(step.type === 'text' || step.type === 'range') && (
        <div className="signup-footer">
          <button
            className={`next-btn ${currentValue ? 'active' : ''}`}
            onClick={handleNext}
            disabled={!currentValue}
          >
            {isLast ? '완료! 시작하기 🎉' : '다음으로 →'}
          </button>
        </div>
      )}
    </div>
  );
}
