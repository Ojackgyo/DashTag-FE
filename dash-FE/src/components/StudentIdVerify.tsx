import { useState } from 'react';

type OCRStatus = 'idle' | 'barcode' | 'ocr' | 'done' | 'error';
type Extracted = { studentId: string; name: string; birthDate: string };

type Props = {
  onChange: (studentId: string) => void;
  onPreFill: (name: string, birthDate: string) => void;
};

export default function StudentIdVerify({ onChange, onPreFill }: Props) {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [preview, setPreview] = useState('');
  const [extracted, setExtracted] = useState<Extracted>({ studentId: '', name: '', birthDate: '' });
  const [confirmed, setConfirmed] = useState(false);

  const processFile = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setConfirmed(false);
    onChange('');

    let studentId = '';
    let name = '';
    let birthDate = '';

    // Step 1: 바코드 인식
    setStatus('barcode');
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(dataUrl);
      const code = result.getText().trim();
      if (/^\d{8,10}$/.test(code)) studentId = code;
    } catch { /* 바코드 없음 */ }

    // Step 2: OCR 텍스트 인식
    setStatus('ocr');
    try {
      const { default: Tesseract } = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'kor+eng', {
        logger: () => {},
      });

      // 학번 (바코드 실패 시 텍스트에서 추출)
      if (!studentId) {
        const m = text.match(/\b(\d{8,10})\b/);
        if (m) studentId = m[1];
      }

      // 이름 (이름/성명 레이블 근처 한글 우선, 없으면 첫 번째 한글 2~4자)
      const nameByLabel = text.match(/(?:이름|성명)\s*[:\s]\s*([가-힣]{2,4})/);
      const nameAny = text.match(/([가-힣]{2,4})/);
      name = (nameByLabel ?? nameAny)?.[1] ?? '';

      // 생년월일
      const birthMatch = text.match(/(\d{4})[.년\-]\s*(\d{1,2})[.월\-]\s*(\d{1,2})/);
      if (birthMatch) {
        birthDate = `${birthMatch[1]}.${birthMatch[2].padStart(2, '0')}.${birthMatch[3].padStart(2, '0')}`;
      }

      setExtracted({ studentId, name, birthDate });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const confirm = () => {
    onChange(extracted.studentId || 'skipped');
    onPreFill(extracted.name, extracted.birthDate);
    setConfirmed(true);
  };

  const reset = () => {
    setConfirmed(false);
    setStatus('idle');
    setPreview('');
    setExtracted({ studentId: '', name: '', birthDate: '' });
    onChange('');
  };

  if (confirmed) {
    return (
      <div style={{
        marginTop: 24, padding: '24px 20px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255,128,171,0.12), rgba(255,179,204,0.06))',
        border: '1.5px solid var(--primary-border)', borderRadius: 20,
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
          {extracted.studentId && extracted.studentId !== 'skipped' ? '학생증 인식 완료' : '건너뜀'}
        </p>
        {extracted.studentId && extracted.studentId !== 'skipped' && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            학번: {extracted.studentId}
          </p>
        )}
        <button
          onClick={reset}
          style={{ marginTop: 12, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          다시 인식하기
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>

      {/* 이미지 업로드 영역 */}
      <label style={{ display: 'block', cursor: status === 'barcode' || status === 'ocr' ? 'default' : 'pointer' }}>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          disabled={status === 'barcode' || status === 'ocr'}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
        <div style={{
          border: `2px dashed ${preview ? 'var(--primary-border)' : 'var(--border)'}`,
          borderRadius: 20, overflow: 'hidden',
          background: preview ? 'var(--bg-card)' : 'var(--primary-bg)',
          minHeight: 148, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {preview ? (
            <img src={preview} alt="학생증" style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
          ) : (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🪪</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                학생증 이미지 업로드
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                모바일 학생증 캡처본을 올려주세요
              </p>
            </div>
          )}
        </div>
      </label>

      {/* 처리 중 상태 */}
      {(status === 'barcode' || status === 'ocr') && (
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div className="student-id-spinner" />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
            {status === 'barcode' ? '바코드 인식 중...' : '텍스트 인식 중... (최대 20초)'}
          </p>
        </div>
      )}

      {/* 오류 */}
      {status === 'error' && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#FF6B6B', textAlign: 'center', fontWeight: 600 }}>
          인식에 실패했어요. 더 선명한 이미지로 다시 시도해주세요.
        </p>
      )}

      {/* 인식 결과 */}
      {status === 'done' && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
            인식된 정보를 확인해주세요 (수정 가능)
          </p>
          <ResultField
            label="학번"
            value={extracted.studentId}
            placeholder="인식 실패 — 직접 입력"
            onChange={v => setExtracted(p => ({ ...p, studentId: v }))}
          />
          <ResultField
            label="이름"
            value={extracted.name}
            placeholder="인식 실패 — 직접 입력"
            onChange={v => setExtracted(p => ({ ...p, name: v }))}
          />
          <ResultField
            label="생년월일"
            value={extracted.birthDate}
            placeholder="ex. 1999.03.15"
            onChange={v => setExtracted(p => ({ ...p, birthDate: v }))}
          />
          <button
            onClick={confirm}
            disabled={!extracted.studentId}
            style={{
              marginTop: 14, width: '100%', padding: '15px', borderRadius: 16,
              background: extracted.studentId ? 'var(--gradient)' : 'var(--bg-card2)',
              color: extracted.studentId ? 'white' : 'var(--text-muted)',
              fontSize: 15, fontWeight: 700, border: 'none',
              cursor: extracted.studentId ? 'pointer' : 'default',
              boxShadow: extracted.studentId ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            확인하기
          </button>
        </div>
      )}
    </div>
  );
}

function ResultField({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>
        {label}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'var(--bg-card)', border: '1.5px solid var(--border)',
          color: 'var(--text)', fontSize: 14, fontWeight: 600,
          padding: '10px 14px', borderRadius: 12, outline: 'none',
          WebkitAppearance: 'none' as const,
        }}
      />
    </div>
  );
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target!.result as string);
    reader.readAsDataURL(file);
  });
}
