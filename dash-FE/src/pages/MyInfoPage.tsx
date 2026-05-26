import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faceTypeToEmoji, updateMe } from '../api/user';
import { clearTokens, isLoggedIn } from '../api/client';
import { getReceivedReviews } from '../api/review';
import { useMe } from '../hooks/useMe';
import { queryKeys } from '../lib/queryKeys';
import type { UserResponse, UserUpdate } from '../api/user';
import inhaMajorsRaw from '../data/inha_majors.json';

const INHA_DEPARTMENTS: string[] = (inhaMajorsRaw as { college: string; majors?: string[]; major?: string[] }[])
  .flatMap(c => c.majors ?? c.major ?? []);

const FACE_TYPES = ['늑대상', '강아지상', '여우상', '고양이상', '곰상', '토끼상', '사슴상', '공룡상', '새상', '물개상'];
const SKIN_TONES = ['밝은편', '중간', '어두운편'];
const HAIR_STYLES = ['짧은머리', '단발', '중단발', '긴머리', '웨이브', '곱슬', '투블럭'];
const CHARM_OPTIONS = ['유머있는', '감성적인', '활발한', '조용한', '섬세한', '솔직한', '애교있는', '카리스마있는', '배려심있는', '지적인', '운동좋아하는', '음악좋아하는'];
const MBTI_AXES = [['E', 'I'], ['N', 'S'], ['T', 'F'], ['J', 'P']];

interface FieldRow {
  key: keyof UserUpdate;
  label: string;
  displayValue: (u: UserResponse | null) => string;
  editorType: 'text' | 'number' | 'choice' | 'boolean' | 'mbti' | 'major-select' | 'tags';
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
}

const FIELD_GROUPS: { title: string; rows: FieldRow[] }[] = [
  {
    title: '기본 정보',
    rows: [
      { key: 'nickname', label: '닉네임', displayValue: u => u?.nickname ?? '미설정', editorType: 'text' },
      { key: 'age', label: '나이', displayValue: u => u?.age != null ? `${u.age}세` : '미설정', editorType: 'number', min: 18, max: 35, unit: '세' },
      { key: 'major', label: '학과', displayValue: u => u?.major ?? '미설정', editorType: 'major-select' },
      { key: 'mbti', label: 'MBTI', displayValue: u => u?.mbti ?? '미설정', editorType: 'mbti' },
    ],
  },
  {
    title: '외모 정보',
    rows: [
      { key: 'face_type', label: '얼굴상', displayValue: u => u?.face_type ? `${faceTypeToEmoji(u.face_type)} ${u.face_type}` : '미설정', editorType: 'choice', options: FACE_TYPES },
      { key: 'height', label: '키', displayValue: u => u?.height != null ? `${u.height}cm` : '미설정', editorType: 'number', min: 150, max: 200, unit: 'cm' },
      { key: 'weight', label: '몸무게', displayValue: u => u?.weight != null ? `${u.weight}kg` : '미설정', editorType: 'number', min: 40, max: 120, unit: 'kg' },
      { key: 'skin_tone', label: '피부톤', displayValue: u => u?.skin_tone ?? '미설정', editorType: 'choice', options: SKIN_TONES },
      { key: 'hair_style', label: '헤어스타일', displayValue: u => u?.hair_style ?? '미설정', editorType: 'choice', options: HAIR_STYLES },
    ],
  },
  {
    title: '라이프스타일',
    rows: [
      { key: 'smoking', label: '흡연', displayValue: u => u?.smoking != null ? (u.smoking ? '흡연' : '비흡연') : '미설정', editorType: 'boolean' },
      { key: 'tattoo', label: '타투', displayValue: u => u?.tattoo != null ? (u.tattoo ? '있어요' : '없어요') : '미설정', editorType: 'boolean' },
      { key: 'charm_points', label: '매력포인트', displayValue: u => u?.charm_points?.join(', ') ?? '미설정', editorType: 'tags' },
    ],
  },
];

/* ── 필드별 편집 시트 ── */
function FieldEditorSheet({ field, user, onSave, onClose }: {
  field: FieldRow;
  user: UserResponse | null;
  onSave: (key: keyof UserUpdate, value: unknown) => Promise<void>;
  onClose: () => void;
}) {
  const rawVal = user ? (user as unknown as Record<string, unknown>)[field.key] : null;

  const [textVal, setTextVal] = useState<string>(typeof rawVal === 'string' ? rawVal : '');
  const [numVal, setNumVal] = useState<number>(typeof rawVal === 'number' ? rawVal : (field.min ?? 20));
  const [choiceVal, setChoiceVal] = useState<string>(typeof rawVal === 'string' ? rawVal : '');
  const [boolVal, setBoolVal] = useState<boolean | null>(typeof rawVal === 'boolean' ? rawVal : null);
  const [mbtiVal, setMbtiVal] = useState<string[]>(() => {
    if (typeof rawVal === 'string' && rawVal.length === 4) return rawVal.split('');
    return ['E', 'N', 'T', 'J'];
  });
  const [tagsVal, setTagsVal] = useState<string[]>(Array.isArray(rawVal) ? rawVal : []);
  const [majorSearch, setMajorSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filteredMajors = useMemo(
    () => majorSearch ? INHA_DEPARTMENTS.filter(m => m.includes(majorSearch)) : INHA_DEPARTMENTS,
    [majorSearch]
  );

  const handleSave = async () => {
    setSaving(true);
    setError('');
    let value: unknown;
    switch (field.editorType) {
      case 'text': value = textVal.trim() || null; break;
      case 'number': value = numVal; break;
      case 'choice': value = choiceVal || null; break;
      case 'major-select': value = choiceVal || null; break;
      case 'boolean': value = boolVal; break;
      case 'mbti': value = mbtiVal.join(''); break;
      case 'tags': value = tagsVal.length > 0 ? tagsVal : null; break;
    }
    try {
      await onSave(field.key, value);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요.');
    }
    setSaving(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 520, borderRadius: '24px 24px 0 0', background: 'var(--bg-card)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{field.label} 수정</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card2)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', scrollbarWidth: 'none' }}>

          {field.editorType === 'text' && (
            <input
              style={{ width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 16, background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)', boxSizing: 'border-box' }}
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              placeholder={field.label}
              autoFocus
            />
          )}

          {field.editorType === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '20px 0' }}>
              <button
                onClick={() => setNumVal(v => Math.max(field.min ?? 0, v - 1))}
                style={{ width: 52, height: 52, borderRadius: 16, fontSize: 26, fontWeight: 700, background: 'var(--bg-card2)', border: '1.5px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--primary)' }}>{numVal}</span>
                <span style={{ fontSize: 18, color: 'var(--text-muted)', marginLeft: 4 }}>{field.unit ?? ''}</span>
              </div>
              <button
                onClick={() => setNumVal(v => Math.min(field.max ?? 999, v + 1))}
                style={{ width: 52, height: 52, borderRadius: 16, fontSize: 26, fontWeight: 700, background: 'var(--bg-card2)', border: '1.5px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>
          )}

          {field.editorType === 'choice' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(field.options ?? []).map(opt => (
                <button
                  key={opt}
                  onClick={() => setChoiceVal(opt)}
                  style={{
                    padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: choiceVal === opt ? 'var(--gradient)' : 'var(--bg-card2)',
                    color: choiceVal === opt ? 'white' : 'var(--text-sub)',
                    border: choiceVal === opt ? '1.5px solid transparent' : '1.5px solid var(--border)',
                    boxShadow: choiceVal === opt ? '0 3px 10px rgba(255,128,171,0.3)' : 'none',
                  }}
                >
                  {field.key === 'face_type' ? `${faceTypeToEmoji(opt)} ${opt}` : opt}
                </button>
              ))}
            </div>
          )}

          {field.editorType === 'boolean' && (
            <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
              {(field.key === 'smoking'
                ? [{ label: '비흡연', value: false }, { label: '흡연', value: true }]
                : [{ label: '없어요', value: false }, { label: '있어요', value: true }]
              ).map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setBoolVal(opt.value)}
                  style={{
                    flex: 1, padding: '18px', borderRadius: 14, fontSize: 16, fontWeight: 800,
                    background: boolVal === opt.value ? 'var(--gradient)' : 'var(--bg-card2)',
                    color: boolVal === opt.value ? 'white' : 'var(--text-sub)',
                    border: boolVal === opt.value ? '1.5px solid transparent' : '1.5px solid var(--border)',
                    boxShadow: boolVal === opt.value ? '0 3px 10px rgba(255,128,171,0.3)' : 'none',
                  }}
                >{opt.label}</button>
              ))}
            </div>
          )}

          {field.editorType === 'mbti' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MBTI_AXES.map((axis, axisIdx) => (
                <div key={axisIdx} style={{ display: 'flex', gap: 10 }}>
                  {axis.map(letter => (
                    <button
                      key={letter}
                      onClick={() => setMbtiVal(prev => { const next = [...prev]; next[axisIdx] = letter; return next; })}
                      style={{
                        flex: 1, padding: '16px', borderRadius: 14, fontSize: 18, fontWeight: 900,
                        background: mbtiVal[axisIdx] === letter ? 'var(--gradient)' : 'var(--bg-card2)',
                        color: mbtiVal[axisIdx] === letter ? 'white' : 'var(--text-sub)',
                        border: mbtiVal[axisIdx] === letter ? '1.5px solid transparent' : '1.5px solid var(--border)',
                        boxShadow: mbtiVal[axisIdx] === letter ? '0 3px 10px rgba(255,128,171,0.3)' : 'none',
                      }}
                    >{letter}</button>
                  ))}
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 8, padding: '10px', borderRadius: 14, background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', letterSpacing: 6 }}>{mbtiVal.join('')}</span>
              </div>
            </div>
          )}

          {field.editorType === 'major-select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 4, boxSizing: 'border-box' }}
                placeholder="학과 검색..."
                value={majorSearch}
                onChange={e => setMajorSearch(e.target.value)}
                autoFocus
              />
              <div style={{ maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredMajors.map(m => (
                  <button
                    key={m}
                    onClick={() => setChoiceVal(m)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: 'left',
                      background: choiceVal === m ? 'var(--primary-bg)' : 'transparent',
                      color: choiceVal === m ? 'var(--primary)' : 'var(--text-sub)',
                      border: choiceVal === m ? '1px solid var(--primary-border)' : '1px solid transparent',
                    }}
                  >{m}</button>
                ))}
              </div>
            </div>
          )}

          {field.editorType === 'tags' && (
            <div>
              {tagsVal.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16, padding: '12px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                  {tagsVal.map(tag => (
                    <span
                      key={tag}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, background: 'var(--primary-bg)', border: '1.5px solid var(--primary-border)', color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}
                    >
                      {tag}
                      <button onClick={() => setTagsVal(prev => prev.filter(t => t !== tag))} style={{ fontSize: 14, opacity: 0.6, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>선택하기 (최대 5개)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CHARM_OPTIONS.map(opt => {
                  const selected = tagsVal.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        if (selected) setTagsVal(prev => prev.filter(t => t !== opt));
                        else if (tagsVal.length < 5) setTagsVal(prev => [...prev, opt]);
                      }}
                      style={{
                        padding: '9px 15px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                        background: selected ? 'var(--gradient)' : 'var(--bg-card2)',
                        color: selected ? 'white' : 'var(--text-sub)',
                        border: selected ? '1.5px solid transparent' : '1.5px solid var(--border)',
                        opacity: (!selected && tagsVal.length >= 5) ? 0.4 : 1,
                        boxShadow: selected ? '0 2px 8px rgba(255,128,171,0.3)' : 'none',
                      }}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p style={{ marginTop: 14, fontSize: 13, color: '#FF6B6B', textAlign: 'center', fontWeight: 600 }}>{error}</p>}
        </div>

        {/* 저장 버튼 */}
        <div style={{ padding: '12px 20px 40px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 800,
              background: 'var(--gradient)', color: 'white',
              boxShadow: '0 4px 16px rgba(255,128,171,0.35)',
              opacity: saving ? 0.7 : 1,
            }}
          >{saving ? '저장 중...' : '저장하기'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── 내 정보 시트 ── */
function MyProfileSheet({ user, onClose, onSave }: {
  user: UserResponse | null;
  onClose: () => void;
  onSave: (key: keyof UserUpdate, value: unknown) => Promise<void>;
}) {
  const [editField, setEditField] = useState<FieldRow | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'slideInFromRight 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text)' }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>내 정보</p>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>항목을 눌러 수정하세요</span>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 48px', scrollbarWidth: 'none' }}>
        {/* 아바타 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--bg-card2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
            {faceTypeToEmoji(user?.face_type)}
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{user?.nickname ?? '닉네임 미설정'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email ?? ''}</p>
        </div>

        {/* 필드 그룹 */}
        {FIELD_GROUPS.map(group => (
          <div key={group.title} style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>
              {group.title}
            </div>
            {group.rows.map((row, i) => {
              const val = row.displayValue(user);
              const isEmpty = val === '미설정';
              return (
                <button
                  key={row.key}
                  onClick={() => setEditField(row)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', minHeight: 52, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-sub)', fontWeight: 500 }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '60%' }}>
                    <span style={{
                      fontSize: 13, fontWeight: isEmpty ? 400 : 600,
                      color: isEmpty ? 'var(--text-muted)' : 'var(--text)',
                      textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{val}</span>
                    <span style={{ fontSize: 16, color: isEmpty ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}>›</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {editField && (
        <FieldEditorSheet
          field={editField}
          user={user}
          onSave={onSave}
          onClose={() => setEditField(null)}
        />
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 13, color: i <= rating ? '#FFCC00' : 'var(--border)', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

/* ── 메인 ── */
export default function MyInfoPage() {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const queryClient = useQueryClient();

  const { data: user = null } = useMe();
  const { data: reviews = [] } = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: getReceivedReviews,
    enabled: isLoggedIn(),
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: doUpdate } = useMutation({
    mutationFn: (body: UserUpdate) => updateMe(body),
    onSuccess: () => queryClient.refetchQueries({ queryKey: queryKeys.me }),
  });

  const handleSaveField = async (key: keyof UserUpdate, value: unknown) => {
    await doUpdate({ [key]: value } as UserUpdate);
  };

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
        marginBottom: 12, boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, flexShrink: 0, background: 'var(--bg-card2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          {faceTypeToEmoji(user?.face_type)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{user?.nickname ?? '닉네임 미설정'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.major ?? '인하대학교'}</p>
        </div>
        <button
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', padding: '7px 14px', borderRadius: 20 }}
          onClick={() => setShowProfile(true)}
        >내 정보</button>
      </div>

      {/* 대쉬서클 */}
      <div style={{ borderRadius: 20, padding: '18px 18px 20px', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>대쉬서클</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>매칭 상대가 남긴 솔직한 리뷰예요</p>
        </div>
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: 36 }}>💌</span>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>아직 받은 리뷰가 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ borderRadius: 14, padding: '12px 14px', background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.content ? 6 : 0 }}>
                  <Stars rating={r.rating} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                {r.content && <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{r.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 고객지원 + 약관 */}
      {MENU_ITEMS.map(group => (
        <div key={group.section} style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '10px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>
            {group.section}
          </div>
          <div>
            {group.items.map((item, i) => (
              <button
                key={item.label}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', minHeight: 50, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
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
        style={{ width: '100%', padding: '14px', borderRadius: 16, marginTop: 4, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#FF6B6B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)' }}
        onClick={handleLogout}
      >로그아웃</button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '4px 0 24px' }}>DashTag v1.0.0</p>

      {showProfile && (
        <MyProfileSheet
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={handleSaveField}
        />
      )}
    </div>
  );
}
