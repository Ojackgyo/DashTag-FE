interface Props {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ChanceModal({ label, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[320px] rounded-[28px] p-6 text-center"
        style={{ background: 'var(--bg-card)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 아이콘 */}
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center text-[38px] mx-auto mb-4"
          style={{ background: 'var(--gradient)', boxShadow: '0 8px 24px rgba(255,128,171,0.45)' }}
        >
          ⚡
        </div>

        <h3 className="text-[19px] font-extrabold mb-2" style={{ color: 'var(--text)' }}>
          오늘의 기회 사용
        </h3>
        <p className="text-[14px] leading-relaxed mb-1" style={{ color: 'var(--text-sub)' }}>
          {label}
        </p>
        <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
          기회는 하루에 딱 1번만 사용할 수 있어요
        </p>

        {/* 버튼 */}
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-[14px] rounded-[16px] text-[15px] font-bold active:opacity-75"
            style={{ background: 'var(--bg-card2)', color: 'var(--text-sub)' }}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="flex-1 py-[14px] rounded-[16px] text-[15px] font-bold text-white active:opacity-80"
            style={{ background: 'var(--gradient)', boxShadow: '0 4px 16px rgba(255,128,171,0.4)' }}
            onClick={onConfirm}
          >
            사용하기 ⚡
          </button>
        </div>
      </div>
    </div>
  );
}
