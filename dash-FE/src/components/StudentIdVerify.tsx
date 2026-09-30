import { useState } from 'react';
import { verifyStudent } from '../api/studentVerification';

type OCRStatus = 'idle' | 'ocr' | 'done' | 'error';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const processFile = async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setServerError('JPEG 또는 PNG 이미지만 업로드할 수 있어요');
      return;
    }
    setSelectedFile(file);
    setServerError('');
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setConfirmed(false);
    onChange('');

    let studentId = '';
    let name = '';
    let birthDate = '';

    // 프런트는 바코드를 해석하지 않는다. 원본 이미지를 그대로 전송하면
    // 백엔드가 바코드 난수 2자리를 제거한 뒤 OCR/입력 학번과 비교한다.
    // 여기의 OCR은 사용자가 입력값을 확인하기 위한 보조 기능일 뿐이다.
    setStatus('ocr');
    try {
      const { default: Tesseract } = await import('tesseract.js');

      // 전체 화면의 버튼·날짜·QR·하단 문구가 OCR 결과에 섞이지 않도록
      // 학부/학과, 학번, 성명, 생년월일이 있는 영역만 비율로 자른다.
      const infoRegion = await cropStudentInfoRegion(dataUrl);
      const enhanced = await preprocessImage(infoRegion);

      const ocrConfig = {
        logger: () => {},
        tessedit_pageseg_mode: '6',       // uniform block of text
        preserve_interword_spaces: '1',
        tessedit_char_blacklist: '`~@#$%^&*()_+=[]{}\\|<>/',
      };

      // 전처리본으로 먼저 인식
      const { data: { text: textEnhanced } } = await Tesseract.recognize(enhanced, 'kor+eng', ocrConfig);
      // 잘라낸 컬러 원본으로도 인식해서 보완
      const { data: { text: textRaw } } = await Tesseract.recognize(infoRegion, 'kor+eng', ocrConfig);
      const text = textEnhanced + '\n' + textRaw;

      const byLabel = text.match(/(?:학번|학생번호|student\s*id|no\.?)\s*[:\s]?\s*(\d{8})/i);
      const anyNum = text.match(/\b(\d{8})\b/);
      studentId = byLabel?.[1] ?? anyNum?.[1] ?? '';

      // 이름
      const nameByLabel = text.match(/(?:이름|성명|name)\s*[:\s]\s*([가-힣]{2,5})/i);
      // 2~4자 한글, 숫자·영문 혼합 없는 것만
      const nameMatches = [...text.matchAll(/([가-힣]{2,5})/g)].map(m => m[1]);
      // 흔한 레이블 단어 제외
      const skipWords = new Set(['인하대', '대학교', '학생증', '인하대학교', '재학생', '발급일', '이름', '성명', '학번', '생년월일']);
      const nameAny = nameMatches.find(n => !skipWords.has(n));
      name = nameByLabel?.[1] ?? nameAny ?? '';

      // 학번 일부를 생일로 오인하지 않도록 YYYY/MM/DD처럼 구분자가 있는
      // 4자리 연도 형식만 허용하고 실제 달력 날짜인지도 검증한다.
      const birthCandidates = [...text.matchAll(/\b((?:19|20)\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})\b/g)];
      for (const match of birthCandidates) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const candidate = new Date(year, month - 1, day);
        const valid = candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day;
        if (valid) {
          birthDate = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
          break;
        }
      }

      setExtracted({ studentId, name, birthDate });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const confirm = async () => {
    if (!selectedFile || !/^\d{8}$/.test(extracted.studentId)) {
      setServerError('숫자 8자리 학번을 입력해주세요');
      return;
    }
    if (extracted.name.trim().length < 2 || extracted.name.trim().length > 20) {
      setServerError('학생증에 표시된 이름을 입력해주세요');
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      await verifyStudent(extracted.studentId, extracted.name.trim(), selectedFile);
      onChange(extracted.studentId);
      onPreFill(extracted.name.trim(), extracted.birthDate);
      setConfirmed(true);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : '학생 인증에 실패했어요');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setConfirmed(false);
    setStatus('idle');
    setPreview('');
    setSelectedFile(null);
    setServerError('');
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
      <label style={{ display: 'block', cursor: status === 'ocr' ? 'default' : 'pointer' }}>
        <input
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          disabled={status === 'ocr'}
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
      {status === 'ocr' && (
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div className="student-id-spinner" />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
            학생 정보 영역 인식 중... (최대 20초)
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
            placeholder="ex. 2002.07.10"
            onChange={v => setExtracted(p => ({ ...p, birthDate: v }))}
          />
          <button
            onClick={confirm}
            disabled={!extracted.studentId || submitting}
            style={{
              marginTop: 14, width: '100%', padding: '15px', borderRadius: 16,
              background: extracted.studentId && !submitting ? 'var(--gradient)' : 'var(--bg-card2)',
              color: extracted.studentId && !submitting ? 'white' : 'var(--text-muted)',
              fontSize: 15, fontWeight: 700, border: 'none',
              cursor: extracted.studentId && !submitting ? 'pointer' : 'default',
              boxShadow: extracted.studentId && !submitting ? '0 4px 16px rgba(255,128,171,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? '서버에서 인증 중...' : '확인하기'}
          </button>
          {serverError && (
            <p style={{ marginTop: 10, fontSize: 13, color: '#FF6B6B', textAlign: 'center', fontWeight: 600 }}>
              {serverError}
            </p>
          )}
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

// 인하대 모바일 학생증의 정보 영역(우측 상단)을 비율 기반으로 자른다.
// 기기 해상도가 달라도 동일한 학생증 레이아웃이면 같은 부분이 선택된다.
async function cropStudentInfoRegion(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const sourceX = Math.round(img.width * 0.42);
      const sourceY = Math.round(img.height * 0.14);
      const sourceWidth = Math.round(img.width * 0.57);
      const sourceHeight = Math.round(img.height * 0.30);

      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
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
