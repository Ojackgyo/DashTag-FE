import { useEffect, useState } from 'react';
import { verifyStudent } from '../api/studentVerification';

type Props = {
  onChange: (studentId: string) => void;
  onPreFill: (name: string, birthDate: string) => void;
};

export default function StudentIdVerify({ onChange, onPreFill }: Props) {
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (next: File | undefined) => {
    if (!next) return;
    setError('');
    if (!['image/jpeg', 'image/png'].includes(next.type)) {
      setFile(null);
      setError('JPEG 또는 PNG 이미지만 업로드할 수 있어요');
      return;
    }
    setFile(next);
    onChange('');
  };

  const confirm = async () => {
    if (submitting || verified) return;
    if (!/^\d{8}$/.test(studentNumber)) { setError('숫자 8자리 학번을 입력해주세요'); return; }
    if (name.trim().length < 2 || name.trim().length > 20) { setError('학생증에 표시된 이름을 2~20자로 입력해주세요'); return; }
    if (!file) { setError('모바일 학생증 이미지를 선택해주세요'); return; }
    setSubmitting(true);
    setError('');
    try {
      await verifyStudent(studentNumber, name.trim(), file);
      setVerified(true);
      onPreFill(name.trim(), '');
      onChange(studentNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : '학생 인증에 실패했어요. 다시 시도해주세요');
    } finally { setSubmitting(false); }
  };

  if (verified) return <div role="status" style={{ padding: 24, marginTop: 20, textAlign: 'center', background: 'var(--primary-bg)', borderRadius: 16 }}>
    <p style={{ fontSize: 32 }}>✅</p>
    <p style={{ fontWeight: 700, color: 'var(--text)' }}>학생 인증이 완료됐어요</p>
    <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>다음 단계에서 프로필을 작성해주세요.</p>
  </div>;

  return <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-sub)' }}>모바일 학생증에 표시된 학번과 이름을 입력해주세요.<br />학번·이름·바코드가 잘 보이는 원본 이미지를 선택해주세요.</p>
    <label style={{ color: 'var(--text)', fontWeight: 700 }}>
      학번
      <input className="signup-input" aria-label="학번" inputMode="numeric" autoComplete="off" placeholder="숫자 8자리 학번" maxLength={8} value={studentNumber} disabled={submitting} onChange={e => setStudentNumber(e.target.value.replace(/\D/g, '').slice(0, 8))} />
    </label>
    <label style={{ color: 'var(--text)', fontWeight: 700 }}>
      이름
      <input className="signup-input" aria-label="이름" autoComplete="name" placeholder="학생증에 표시된 이름" maxLength={20} value={name} disabled={submitting} onChange={e => setName(e.target.value)} />
    </label>
    <label style={{ color: 'var(--text)', fontWeight: 700 }}>
      모바일 학생증 (JPEG / PNG)
      <input aria-label="모바일 학생증 이미지" type="file" accept="image/jpeg,image/png" disabled={submitting} style={{ display: 'block', width: '100%', marginTop: 12, fontSize: 13 }} onChange={e => selectFile(e.target.files?.[0])} />
    </label>
    {preview && <img src={preview} alt="선택한 학생증 미리보기" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 12 }} />}
    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>인증하기를 누르면 입력 정보와 이미지가 학생 인증을 위해 서버로 전송돼요.</p>
    {error && <p role="alert" style={{ color: '#FF6B6B', fontSize: 13 }}>{error}</p>}
    <button className="action-button" type="button" onClick={confirm} disabled={submitting || !file || !studentNumber || !name.trim()} style={{ padding: 16, borderRadius: 16, background: 'var(--gradient)', color: 'white', fontWeight: 700, opacity: submitting || !file ? 0.6 : 1 }}>
      {submitting ? '학생증 인증 중…' : '학생 인증하기'}
    </button>
  </div>;
}
