import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChance } from '../hooks/useChance';
import { useAcceptedDashes } from '../context/AcceptedDashContext';
import { RECEIVED_DASHES, SENT_DASHES } from '../data/dashes';

const SCHEDULES = [
  { date: '2026-05-13', label: '영화 모임' },
  { date: '2026-05-19', label: 'Michael' },
  { date: '2026-05-25', label: '미팅' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { hasChance } = useChance();
  const { acceptedDashes } = useAcceptedDashes();

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const calYear = viewMonth.getFullYear();
  const calMonth = viewMonth.getMonth();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const scheduleDates = new Set(SCHEDULES.map(s => s.date));
  const upcomingSchedules = SCHEDULES
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const newDashCount = RECEIVED_DASHES.filter(p => !acceptedDashes.some(d => d.id === p.id)).length;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── 헤더 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 0 var(--border), var(--shadow-sm)',
      }}>
        <span style={{
          fontSize: 26, fontWeight: 900, letterSpacing: '-1px',
          background: 'var(--gradient)', WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>DashTag</span>
        <button style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: 'var(--shadow-sm)',
        }}>🔔</button>
      </div>

      <div style={{ padding: '16px 20px 0' }}>

        {/* ── 받은 대쉬 / 보낸 대쉬 카드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

          {/* 받은 대쉬 */}
          <button
            onClick={() => navigate('/received-dashes')}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '18px 16px', textAlign: 'left',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
              position: 'relative',
            }}
          >
            {newDashCount > 0 && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--gradient)', boxShadow: 'var(--shadow-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: 'white',
              }}>{newDashCount}</div>
            )}
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'linear-gradient(135deg, rgba(255,128,171,0.22) 0%, rgba(255,179,204,0.12) 100%)',
              border: '1.5px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 14,
              boxShadow: 'var(--shadow-avatar-pink)',
            }}>💌</div>
            <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-1px' }}>
              {RECEIVED_DASHES.length}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)' }}>받은 대쉬</p>
            <p style={{ fontSize: 11, color: newDashCount > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              {newDashCount > 0 ? `${newDashCount}개 새 요청` : '새 요청 없음'}
            </p>
          </button>

          {/* 보낸 대쉬 */}
          <button
            onClick={() => navigate('/sent-dashes')}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '18px 16px', textAlign: 'left',
              boxShadow: 'var(--shadow-card)', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'var(--bg-card2)', border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 14, boxShadow: 'var(--shadow-sm)',
            }}>📤</div>
            <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 4, letterSpacing: '-1px' }}>
              {SENT_DASHES.length}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)' }}>보낸 대쉬</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>대기 중</p>
          </button>
        </div>

        {/* ── 오늘의 기회 ── */}
        <div style={{
          background: hasChance
            ? 'linear-gradient(135deg, rgba(255,128,171,0.15) 0%, rgba(255,179,204,0.08) 100%)'
            : 'var(--bg-card)',
          border: `1.5px solid ${hasChance ? 'var(--primary-border)' : 'var(--border)'}`,
          borderRadius: 20, padding: '16px 20px', marginBottom: 12,
          boxShadow: hasChance ? 'var(--shadow-primary)' : 'var(--shadow-card)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
            background: hasChance ? 'var(--gradient)' : 'var(--bg-card2)',
            border: hasChance ? 'none' : '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: hasChance ? 'var(--shadow-primary)' : 'var(--shadow-sm)',
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>오늘의 기회</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {hasChance ? '오늘 사용할 수 있는 기회가 있어요' : '오늘의 기회를 이미 사용했어요'}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, color: hasChance ? 'var(--primary)' : 'var(--text-muted)' }}>
              {hasChance ? '1' : '0'}
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>/1 남음</p>
          </div>
        </div>

        {/* ── 캘린더 ── */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '18px', marginBottom: 12,
          boxShadow: 'var(--shadow-card)',
        }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {calYear}년 {calMonth + 1}월 일정
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  fontSize: 16, color: 'var(--text-sub)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>
              <button
                onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  fontSize: 16, color: 'var(--text-sub)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700, paddingBottom: 8,
                color: i === 0 ? '#FF6B6B' : i === 6 ? '#5B8DEF' : 'var(--text-muted)',
              }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 4 }}>
            {calCells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const hasEvent = scheduleDates.has(ds);
              const dow = idx % 7;
              return (
                <div
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 33, height: 33, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--gradient)' : isToday ? 'var(--primary-bg)' : 'transparent',
                    border: isToday && !isSelected ? '1.5px solid var(--primary-border)' : 'none',
                    boxShadow: isSelected ? 'var(--shadow-primary)' : 'none',
                    fontSize: 13,
                    fontWeight: isSelected || isToday ? 700 : 400,
                    color: isSelected ? 'white' : dow === 0 ? '#FF6B6B' : dow === 6 ? '#5B8DEF' : 'var(--text)',
                  }}>{day}</div>
                  {hasEvent
                    ? <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 2, background: isSelected ? 'white' : 'var(--primary)', opacity: isSelected ? 0.8 : 1 }} />
                    : <div style={{ height: 6 }} />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 다가오는 일정 ── */}
        <div style={{ marginBottom: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.3px' }}>
            다가오는 일정
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
          }}>
            {upcomingSchedules.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: 28 }}>📅</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>다가오는 일정이 없어요</p>
              </div>
            ) : (
              upcomingSchedules.map((s, i) => {
                const [y, mo, d] = s.date.split('-').map(Number);
                const dateObj = new Date(y, mo - 1, d);
                const dow = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
                const isToday = s.date === todayStr;
                return (
                  <div key={s.date} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: isToday ? 'var(--gradient)' : 'var(--primary-bg)',
                      border: `1.5px solid ${isToday ? 'transparent' : 'var(--primary-border)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isToday ? 'var(--shadow-primary)' : 'none',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3, color: isToday ? 'rgba(255,255,255,0.85)' : 'var(--primary)' }}>{mo}월</span>
                      <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.2, color: isToday ? 'white' : 'var(--primary)' }}>{d}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1.3, color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{dow}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.label}</p>
                      {isToday
                        ? <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>오늘</p>
                        : <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>예정</p>
                      }
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
