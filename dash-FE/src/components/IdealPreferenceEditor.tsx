import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { getIdealPreference, saveIdealPreference, type IdealPreferenceRequest } from '../api/idealPreference';
import { faceTypes, skinTones, idealHairStylesFor, hairStyleAvailable, tattooPreferences, smokingPreferences, militaryPreferences } from '../api/profileOptions';
import QueryStatus from './QueryStatus';
import { useMe } from '../hooks/useMe';

const fieldStyle = { width: '100%', padding: 12, marginTop: 8, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card2)', color: 'var(--text)' };
function PreferenceForm({ initial, gender, onClose }: { initial: IdealPreferenceRequest; gender: string; onClose: () => void }) {
  const [value, setValue] = useState<IdealPreferenceRequest>({ ...initial });
  const [validation, setValidation] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: (body: IdealPreferenceRequest) => saveIdealPreference(body, gender), onSuccess: result => {
    queryClient.setQueryData(['idealPreference'], result);
    void queryClient.invalidateQueries({ queryKey: ['dateProfiles'] });
    onClose();
  } });
  const selectFields = [
    { key: 'faceType', label: '얼굴상', options: faceTypes },
    { key: 'skinTone', label: '피부톤', options: skinTones },
    { key: 'tattooPreference', label: '타투', options: tattooPreferences },
    { key: 'smokingPreference', label: '흡연', options: smokingPreferences },
    { key: 'militaryPreference', label: '군필 여부', options: militaryPreferences },
    { key: 'topSize', label: '상의 사이즈', options: { XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', XXL: '2XL' } },
    { key: 'hairStyle', label: '헤어스타일', options: idealHairStylesFor(gender) },
  ] as const;
  return <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={event => {
    event.preventDefault();
    if (save.isPending) return;
    setValidation(null);
    if (value.mbtiPattern && !/^[EI?][NS?][FT?][JP?]$/.test(value.mbtiPattern)) { setValidation(new Error('MBTI는 네 자리로 입력해주세요. 상관없는 자리는 ?를 사용할 수 있어요.')); return; }
    if ([value.maxYoungerAgeDiff, value.maxOlderAgeDiff].some(n => n != null && (!Number.isInteger(n) || n < 0))) { setValidation(new Error('나이 차이는 0 이상의 정수로 입력해주세요')); return; }
    if ([value.minHeight, value.maxHeight].some(n => n != null && (!Number.isInteger(n) || n <= 0))) { setValidation(new Error('키는 0보다 큰 정수로 입력해주세요')); return; }
    if (value.minHeight != null && value.maxHeight != null && value.minHeight > value.maxHeight) { setValidation(new Error('최소 키는 최대 키보다 클 수 없어요')); return; }
    save.mutate({ faceType: value.faceType ?? null, skinTone: value.skinTone ?? null,
      mbtiPattern: value.mbtiPattern || null,
      maxYoungerAgeDiff: value.maxYoungerAgeDiff ?? null, maxOlderAgeDiff: value.maxOlderAgeDiff ?? null,
      tattooPreference: value.tattooPreference ?? null, smokingPreference: value.smokingPreference ?? null, militaryPreference: value.militaryPreference ?? null,
      topSize: value.topSize ?? null, minHeight: value.minHeight ?? null, maxHeight: value.maxHeight ?? null, hairStyle: value.hairStyle ?? null,
    });
  }}>
    {selectFields.filter(field => field.key !== 'militaryPreference' || gender.toUpperCase() === 'FEMALE').map(field => <label key={field.key} style={{ color: 'var(--text)', fontWeight: 700 }}>
      {field.label}
      <select style={fieldStyle} disabled={save.isPending} value={value[field.key] ?? ''} onChange={e => setValue(v => ({ ...v, [field.key]: e.target.value || null }))}>
        <option value="">조건 없음</option>
        {Object.entries(field.options).map(([code, label]) => <option value={code} key={code} disabled={field.key === 'hairStyle' && !hairStyleAvailable(code)}>{label}{field.key === 'hairStyle' && !hairStyleAvailable(code) ? ' (준비 중)' : ''}</option>)}
      </select>
    </label>)}
    {([{ key: 'minHeight', label: '최소 키 (cm)' }, { key: 'maxHeight', label: '최대 키 (cm)' }] as const).map(field => <label key={field.key} style={{ color: 'var(--text)', fontWeight: 700 }}>
      {field.label}
      <input aria-label={field.label} type="number" min={1} step={1} style={fieldStyle} placeholder="제한 없음" disabled={save.isPending} value={value[field.key] ?? ''} onChange={e => setValue(v => ({ ...v, [field.key]: e.target.value === '' ? null : Number(e.target.value) }))} />
    </label>)}
    <label style={{ color: 'var(--text)', fontWeight: 700 }}>MBTI
      <input aria-label="이상형 MBTI" style={fieldStyle} placeholder="예: I?F? (빈칸은 조건 없음)" maxLength={4} disabled={save.isPending} value={value.mbtiPattern ?? ''} onChange={e => setValue(v => ({ ...v, mbtiPattern: e.target.value.toUpperCase() }))} />
    </label>
    {([{ key: 'maxYoungerAgeDiff', label: '연하 나이 차이' }, { key: 'maxOlderAgeDiff', label: '연상 나이 차이' }] as const).map(field => <label key={field.key} style={{ color: 'var(--text)', fontWeight: 700 }}>
      {field.label}
      <input aria-label={field.label} type="number" min={0} step={1} style={fieldStyle} placeholder="제한 없음" disabled={save.isPending} value={value[field.key] ?? ''} onChange={e => setValue(v => ({ ...v, [field.key]: e.target.value === '' ? null : Number(e.target.value) }))} />
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>0 입력 가능 (동갑까지) · 빈칸은 제한 없음</span>
    </label>)}
    <QueryStatus error={validation ?? save.error} />
    <button className="action-button" type="submit" disabled={save.isPending} style={{ padding: 16, borderRadius: 14, background: 'var(--gradient)', color: 'white', fontWeight: 700 }}>{save.isPending ? '저장 중…' : '이상형 저장'}</button>
  </form>;
}
export default function IdealPreferenceEditor({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const query = useQuery({ queryKey: ['idealPreference'], queryFn: getIdealPreference, retry: false });
  const missing = query.error instanceof ApiError && query.error.status === 404;
  const gender = me.data?.gender;
  const knownGender = gender === 'male' || gender === 'female';
  return <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
    <div className="mobile-sheet" role="dialog" aria-modal="true" aria-label="이상형 수정" style={{ width: '100%', maxWidth: 'var(--app-max-width)', maxHeight: '90dvh', overflowY: 'auto', padding: '24px 20px', background: 'var(--bg-card)', borderRadius: '24px 24px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, color: 'var(--text)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>이상형 수정</h2><button aria-label="닫기" onClick={onClose}>✕</button>
      </div>
      <QueryStatus loading={query.isLoading || me.isLoading} error={me.error ?? (missing ? null : query.error) ?? (!me.isLoading && !knownGender ? new Error('회원 성별을 확인할 수 없어요. 다시 시도해주세요.') : null)} retry={() => { void query.refetch(); void me.refetch(); }} />
      {!query.isLoading && !me.isLoading && !me.error && knownGender && (!query.error || missing) && <PreferenceForm initial={query.data ?? {}} gender={gender} onClose={onClose} />}
    </div>
  </div>;
}
