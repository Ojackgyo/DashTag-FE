import QueryStatus from "../components/QueryStatus";
import { useQuery } from "@tanstack/react-query";
import { capabilities } from "../api/capabilities";
import { getSchedules, koreanDate, displaySchedule } from "../api/schedule";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChance } from "../hooks/useChance";
import { useMe } from "../hooks/useMe";
import { useDatingRequests } from "../hooks/useDatingRequests";

export default function HomePage() {
  const navigate = useNavigate();
  const {
    hasChance,
    chanceLoading,
    remainingCount,
    maxCount,
    rechargeAt,
    error: chanceError,
  } = useChance();
  const { data: user } = useMe();
  const { data: requests, isLoading, error, refetch } = useDatingRequests();

  const myId = user?.id;
  const received =
    requests?.filter((r) => r.status === "pending" && r.to_user_id === myId) ??
    [];
  const sent = requests?.filter((r) => r.from_user_id === myId) ?? [];

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const changeMonth = (offset: number) => {
    const next = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + offset,
      1,
    );
    setViewMonth(next);
    setSelectedDate(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
    );
  };
  const todayStr = koreanDate();

  const calYear = viewMonth.getFullYear();
  const calMonth = viewMonth.getMonth();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const from = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
  const to = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const schedules = useQuery({
    queryKey: ["schedules", "month", from, to],
    queryFn: () => getSchedules(from, to),
    enabled: capabilities.chatSchedule,
  });
  const selectedSchedules = (schedules.data ?? [])
    .filter((s) => koreanDate(new Date(s.scheduledAt)) === selectedDate)
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));

  return (
    <div
      style={{
        background: "var(--bg)",
        paddingBottom: "max(24px, var(--safe-bottom))",
      }}
    >
      <div className="home-content" style={{ padding: "16px 20px 0" }}>
        <QueryStatus
          error={error ?? chanceError}
          retry={() => {
            void refetch();
          }}
        />

        {/* ── 받은 대쉬 / 보낸 대쉬 카드 ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* 받은 대쉬 */}
          <button
            onClick={() => navigate("/received-dashes")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "18px 16px",
              textAlign: "left",
              boxShadow: "var(--shadow-card)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {received.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--gradient)",
                  boxShadow: "var(--shadow-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "white",
                }}
              >
                {received.length}
              </div>
            )}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                background:
                  "linear-gradient(135deg, rgba(255,128,171,0.22) 0%, rgba(255,179,204,0.12) 100%)",
                border: "1.5px solid var(--primary-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
                boxShadow: "var(--shadow-avatar-pink)",
              }}
            >
              💌
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--text)",
                marginBottom: 4,
                letterSpacing: "-1px",
              }}
            >
              {isLoading ? "—" : received.length}
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-sub)",
              }}
            >
              받은 대쉬
            </p>
            <p
              style={{
                fontSize: 11,
                color:
                  received.length > 0 ? "var(--primary)" : "var(--text-muted)",
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              {isLoading
                ? "불러오는 중..."
                : received.length > 0
                  ? `${received.length}개 새 요청`
                  : "새 요청 없음"}
            </p>
          </button>

          {/* 보낸 대쉬 */}
          <button
            onClick={() => navigate("/sent-dashes")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "18px 16px",
              textAlign: "left",
              boxShadow: "var(--shadow-card)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                background: "var(--bg-card2)",
                border: "1.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              📤
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--text)",
                marginBottom: 4,
                letterSpacing: "-1px",
              }}
            >
              {isLoading ? "—" : sent.length}
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-sub)",
              }}
            >
              보낸 대쉬
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              대기 중
            </p>
          </button>
        </div>

        {/* ── 오늘의 기회 ── */}
        <div
          style={{
            background:
              !chanceLoading && hasChance
                ? "linear-gradient(135deg, rgba(255,128,171,0.15) 0%, rgba(255,179,204,0.08) 100%)"
                : "var(--bg-card)",
            border: `1.5px solid ${!chanceLoading && hasChance ? "var(--primary-border)" : "var(--border)"}`,
            borderRadius: 20,
            padding: "16px 20px",
            marginBottom: 12,
            boxShadow:
              !chanceLoading && hasChance
                ? "var(--shadow-primary)"
                : "var(--shadow-card)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              flexShrink: 0,
              background:
                !chanceLoading && hasChance
                  ? "var(--gradient)"
                  : "var(--bg-card2)",
              border:
                !chanceLoading && hasChance
                  ? "none"
                  : "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow:
                !chanceLoading && hasChance
                  ? "var(--shadow-primary)"
                  : "var(--shadow-sm)",
            }}
          >
            ⚡
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: 3,
              }}
            >
              오늘의 기회
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {chanceLoading
                ? "확인 중..."
                : chanceError
                  ? "기회를 불러오지 못했어요"
                  : hasChance
                    ? `최대 ${maxCount}회 · 사용 후 24시간마다 회복돼요`
                    : "기회가 회복되면 다시 신청할 수 있어요"}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p
              style={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: "-1px",
                lineHeight: 1,
                color:
                  !chanceLoading && hasChance
                    ? "var(--primary)"
                    : "var(--text-muted)",
              }}
            >
              {chanceLoading || chanceError ? "—" : remainingCount}
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              /{maxCount ?? "—"} 남음
            </p>
          </div>
        </div>

        {rechargeAt.length > 0 && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            기회 회복:{" "}
            {rechargeAt
              .map((t) => new Date(t).toLocaleString("ko-KR"))
              .join(" / ")}
          </p>
        )}
        {/* ── 캘린더 ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "18px",
            marginBottom: 12,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.3px",
              }}
            >
              {calYear}년 {calMonth + 1}월 일정
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="icon-button"
                aria-label="이전 달"
                onClick={() => changeMonth(-1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-card2)",
                  border: "1px solid var(--border)",
                  fontSize: 16,
                  color: "var(--text-sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ‹
              </button>
              <button
                className="icon-button"
                aria-label="다음 달"
                onClick={() => changeMonth(1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-card2)",
                  border: "1px solid var(--border)",
                  fontSize: 16,
                  color: "var(--text-sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ›
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: 6,
            }}
          >
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  paddingBottom: 8,
                  color:
                    i === 0
                      ? "#FF6B6B"
                      : i === 6
                        ? "#5B8DEF"
                        : "var(--text-muted)",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              rowGap: 4,
            }}
          >
            {calCells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const dow = idx % 7;
              return (
                <button
                  type="button"
                  aria-label={`${ds} 일정`}
                  aria-pressed={isSelected}
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 33,
                      height: 33,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isSelected
                        ? "var(--gradient)"
                        : isToday
                          ? "var(--primary-bg)"
                          : "transparent",
                      border:
                        isToday && !isSelected
                          ? "1.5px solid var(--primary-border)"
                          : "none",
                      boxShadow: isSelected ? "var(--shadow-primary)" : "none",
                      fontSize: 13,
                      fontWeight: isSelected || isToday ? 700 : 400,
                      color: isSelected
                        ? "white"
                        : dow === 0
                          ? "#FF6B6B"
                          : dow === 6
                            ? "#5B8DEF"
                            : "var(--text)",
                    }}
                  >
                    {day}
                  </div>
                  <div
                    style={{
                      height: 6,
                      width: 6,
                      borderRadius: "50%",
                      background: schedules.data?.some(
                        (s) => koreanDate(new Date(s.scheduledAt)) === ds,
                      )
                        ? "var(--primary)"
                        : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 다가오는 일정 ── */}
        <div style={{ marginBottom: 0 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 12,
              letterSpacing: "-0.3px",
            }}
          >
            {selectedDate} 일정
          </p>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <QueryStatus
              loading={schedules.isLoading}
              error={schedules.error}
              retry={() => {
                void schedules.refetch();
              }}
            />
            {!capabilities.chatSchedule ? (
              <p className="feature-notice">일정 연결을 준비하고 있어요.</p>
            ) : !schedules.isLoading &&
              !schedules.error &&
              selectedSchedules.length === 0 ? (
              <p
                style={{
                  padding: 28,
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                선택한 날짜에 일정이 없어요.
              </p>
            ) : (
              selectedSchedules.map((item) => (
                <button
                  key={item.id}
                  style={{
                    width: "100%",
                    padding: 16,
                    textAlign: "left",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                  onClick={() =>
                    navigate("/chat", {
                      state: {
                        openRoom: {
                          type: item.roomType.toLowerCase(),
                          roomId: item.roomId,
                        },
                      },
                    })
                  }
                >
                  <strong>{item.title}</strong>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {displaySchedule(item.scheduledAt)}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <footer
          style={{
            padding: "24px 0 8px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/legal/terms")}
              style={{ background: "none", color: "inherit", padding: 4 }}
            >
              이용약관
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => navigate("/legal/privacy")}
              style={{ background: "none", color: "inherit", padding: 4 }}
            >
              개인정보 처리방침
            </button>
          </div>
          <p style={{ fontSize: 11, marginTop: 8 }}>© DashTag</p>
        </footer>
      </div>
    </div>
  );
}
