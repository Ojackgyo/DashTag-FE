import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getColleges, type MajorResponse } from '../api/college';
import QueryStatus from './QueryStatus';
import { fieldStyle } from './featureStyles';

export default function MajorPicker({ value, onChange, disabled, label = '학과', excludeId }: {
  value: MajorResponse | null;
  onChange: (major: MajorResponse | null) => void;
  disabled?: boolean;
  label?: string;
  excludeId?: number;
}) {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['colleges'], queryFn: getColleges, staleTime: 300000 });
  const majors = (query.data ?? []).flatMap(c => c.majors).filter(m => m.id !== excludeId);
  return <div>
    <label>{label} 검색
      <input aria-label={`${label} 검색`} style={fieldStyle} placeholder="예: 컴퓨터" value={search} disabled={disabled} onChange={e => setSearch(e.target.value)} />
    </label>
    <label>{label}
      <select aria-label={label} required style={fieldStyle} value={value?.id ?? ''} disabled={disabled || query.isLoading || !!query.error} onChange={e => onChange(majors.find(m => m.id === Number(e.target.value)) ?? null)}>
        <option value="">학과를 선택해주세요</option>
        {majors.filter(m => m.id === value?.id || m.name.includes(search.trim())).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </label>
    <QueryStatus loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }} />
    {!query.isLoading && !query.error && !majors.some(m => m.name.includes(search.trim())) && <p role="status">검색 결과가 없어요.</p>}
  </div>;
}
