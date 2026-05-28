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

    // Step 2: OCR — 원본 + 전처리본 두 번 시도, 결과 합산
    setStatus('ocr');
    try {
      const { default: Tesseract } = await import('tesseract.js');

      // 이미지 전처리: 그레이스케일 + 대비 강화 + 스케일업
      const enhanced = await preprocessImage(dataUrl);

      const ocrConfig = {
        logger: () => {},
        tessedit_pageseg_mode: '6',       // uniform block of text
        preserve_interword_spaces: '1',
        tessedit_char_blacklist: '`~@#$%^&*()_+=[]{}\\|<>/',
      };

      // 전처리본으로 먼저 인식
      const { data: { text: textEnhanced } } = await Tesseract.recognize(enhanced, 'kor+eng', ocrConfig);
      // 원본으로도 인식해서 보완
      const { data: { text: textRaw } } = await Tesseract.recognize(dataUrl, 'kor+eng', ocrConfig);
      const text = textEnhanced + '\n' + textRaw;

      // 학번 (바코드 실패 시)
      if (!studentId) {
        // 학번/학생번호 레이블 근처 숫자 우선
        const byLabel = text.match(/(?:학번|학생번호|student\s*id|no\.?)\s*[:\s]?\s*(\d{7,12})/i);
        const anyNum = text.match(/\b(\d{8,10})\b/);
        studentId = byLabel?.[1] ?? anyNum?.[1] ?? '';
      }

      // 이름
      const nameByLabel = text.match(/(?:이름|성명|name)\s*[:\s]\s*([가-힣]{2,5})/i);
      // 2~4자 한글, 숫자·영문 혼합 없는 것만
      const nameMatches = [...text.matchAll(/([가-힣]{2,5})/g)].map(m => m[1]);
      // 흔한 레이블 단어 제외
      const skipWords = new Set(['인하대', '대학교', '학생증', '인하대학교', '재학생', '발급일', '이름', '성명', '학번', '생년월일']);
      const nameAny = nameMatches.find(n => !skipWords.has(n));
      name = nameByLabel?.[1] ?? nameAny ?? '';

      // 생년월일 — 여러 패턴 시도
      const birthPatterns = [
        /(\d{4})[.\-년]\s*(\d{1,2})[.\-월]\s*(\d{1,2})/,
        /생년월일[:\s]*(\d{2,4})[.\-](\d{1,2})[.\-](\d{1,2})/,
        /(\d{2})(\d{2})(\d{2})/,  // YYMMDD 형태
      ];
      for (const pat of birthPatterns) {
        const m = text.match(pat);
        if (m) {
          const y = m[1].length === 2 ? `19${m[1]}` : m[1];
          birthDate = `${y}.${m[2].padStart(2, '0')}.${m[3].padStart(2, '0')}`;
          break;
        }
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

// OCR 정확도 향상을 위한 이미지 전처리
// 그레이스케일 변환 + 대비 강화 + 최소 해상도 보장
async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const MIN_WIDTH = 1200;
      const scale = img.width < MIN_WIDTH ? MIN_WIDTH / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // 흰 배경 먼저
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        // 그레이스케일
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // 대비 강화 (contrast factor 1.8)
        const contrasted = Math.min(255, Math.max(0, 1.8 * (gray - 128) + 128));
        d[i] = d[i + 1] = d[i + 2] = contrasted;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl); // 실패 시 원본 그대로
    img.src = dataUrl;
  });
}
