import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchedule,
  saveSchedule,
  deleteSchedule,
  koreanDate,
  koreanTime,
} from "../api/schedule";
import {
  getChatRoomDetail,
  reportRoom,
  type ChatParticipant,
} from "../api/chat";
import { capabilities } from "../api/capabilities";
import { useMe } from "../hooks/useMe";
import {
  Sheet,
  Action,
  Confirm,
  ConnectionNotice,
} from "../components/FeatureUI";
import { fieldStyle } from "../components/featureStyles";
import QueryStatus from "../components/QueryStatus";
import { queryKeys } from "../lib/queryKeys";
import type { Schedule } from "../api/schedule";
function ScheduleForm({
  roomId,
  initial,
  onClose,
  canEdit,
}: {
  roomId: number;
  initial: Schedule | null;
  onClose: () => void;
  canEdit: boolean;
}) {
  const client = useQueryClient();
  const later = new Date(Date.now() + 3600000);
  const [title, setTitle] = useState(initial?.title ?? "함께하는 약속");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [date, setDate] = useState(
    koreanDate(initial ? new Date(initial.scheduledAt) : later),
  );
  const [time, setTime] = useState(
    koreanTime(initial ? new Date(initial.scheduledAt) : later),
  );
  const [remove, setRemove] = useState(false);
  const done = () => {
    void client.invalidateQueries({ queryKey: ["schedules"] });
    void client.invalidateQueries({ queryKey: queryKeys.chatRooms });
    onClose();
  };
  const save = useMutation({
    mutationFn: () =>
      saveSchedule(roomId, {
        title,
        location,
        scheduledAt: `${date}T${time}:00+09:00`,
      }),
    onSuccess: done,
  });
  const deletion = useMutation({
    mutationFn: () => deleteSchedule(roomId),
    onSuccess: done,
  });
  return (
    <>
      <ConnectionNotice available={capabilities.chatSchedule} />
      {!canEdit && (
        <p className="feature-notice">일정을 변경할 권한이 없어요.</p>
      )}
      <form
        className="feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <label>
          일정 제목
          <input
            style={fieldStyle}
            required
            maxLength={100}
            disabled={!canEdit || save.isPending}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          날짜 (한국 시간)
          <input
            style={fieldStyle}
            type="date"
            required
            min={koreanDate()}
            disabled={!canEdit || save.isPending}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          시간 (한국 시간)
          <input
            style={fieldStyle}
            type="time"
            required
            disabled={!canEdit || save.isPending}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          장소 (선택)
          <input
            style={fieldStyle}
            maxLength={200}
            disabled={!canEdit || save.isPending}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <QueryStatus error={save.error ?? deletion.error} />
        <Action
          disabled={
            !canEdit ||
            !capabilities.chatSchedule ||
            save.isPending ||
            deletion.isPending
          }
        >
          {save.isPending ? "저장 중…" : "일정 저장"}
        </Action>
        {initial && canEdit && (
          <Action
            type="button"
            disabled={save.isPending || deletion.isPending}
            style={{ background: "var(--bg-card2)", color: "#dc5467" }}
            onClick={() => setRemove(true)}
          >
            일정 취소
          </Action>
        )}
      </form>
      {remove && (
        <Confirm
          error={deletion.error}
          title="일정을 취소할까요?"
          description="채팅 참여자와 홈 달력에서도 일정이 취소돼요."
          busy={deletion.isPending}
          onClose={() => setRemove(false)}
          onConfirm={() => deletion.mutate()}
        />
      )}
    </>
  );
}
export function ScheduleSheet({
  roomId,
  onClose,
  canEdit,
}: {
  roomId: number;
  onClose: () => void;
  canEdit: boolean;
}) {
  const query = useQuery({
    queryKey: ["schedules", "room", roomId],
    queryFn: () => getSchedule(roomId),
    enabled: capabilities.chatSchedule,
  });
  return (
    <Sheet title="만나는 날 정하기" onClose={onClose}>
      <QueryStatus
        loading={query.isLoading}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {!query.isLoading && !query.error && (
        <ScheduleForm
          roomId={roomId}
          initial={query.data ?? null}
          onClose={onClose}
          canEdit={query.data?.canEdit ?? canEdit}
        />
      )}
    </Sheet>
  );
}
const reportReasons = {
  ABUSE: "욕설 / 비하",
  INAPPROPRIATE: "부적절한 내용",
  SPAM: "스팸 / 광고",
  FRAUD: "사기 의심",
  OTHER: "기타",
} as const;
export function ReportSheet({
  roomId,
  onClose,
}: {
  roomId: number;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const query = useQuery({
    queryKey: [...queryKeys.chatRooms, "detail", roomId],
    queryFn: () => getChatRoomDetail(roomId),
    enabled: capabilities.chatDetails,
  });
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const mutation = useMutation({
    mutationFn: () => reportRoom(roomId, Number(target), reason, detail),
  });
  const participants: ChatParticipant[] = (
    query.data?.participants ?? []
  ).filter((p) => p.memberId !== me?.id);
  return (
    <Sheet title="신고하기" onClose={onClose} busy={mutation.isPending}>
      {mutation.isSuccess ? (
        <div>
          <p role="status" className="feature-notice">
            신고가 접수됐어요. 접수 번호: {mutation.data.id}
          </p>
          <Action onClick={onClose}>확인</Action>
        </div>
      ) : (
        <form
          className="feature-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mutation.isPending) mutation.mutate();
          }}
        >
          <ConnectionNotice
            available={capabilities.chatReports && capabilities.chatDetails}
          />
          <QueryStatus
            loading={query.isLoading}
            error={query.error ?? mutation.error}
            retry={() => {
              void query.refetch();
            }}
          />
          <label>
            신고할 상대
            <select
              style={fieldStyle}
              required
              value={target}
              disabled={mutation.isPending}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">상대를 선택해주세요</option>
              {participants.map((p) => (
                <option value={p.memberId} key={p.memberId}>
                  {p.nickname}
                  {p.active ? "" : " (나간 회원)"}
                </option>
              ))}
            </select>
          </label>
          <label>
            신고 사유
            <select
              style={fieldStyle}
              required
              value={reason}
              disabled={mutation.isPending}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">사유를 선택해주세요</option>
              {Object.entries(reportReasons).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            상세 내용 {reason === "OTHER" ? "(필수)" : "(선택)"}
            <textarea
              style={fieldStyle}
              rows={4}
              required={reason === "OTHER"}
              maxLength={1000}
              value={detail}
              disabled={mutation.isPending}
              onChange={(e) => setDetail(e.target.value)}
            />
            <small>{detail.length}/1,000</small>
          </label>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            신고 내용은 상대에게 공개되지 않아요.
          </p>
          <Action
            disabled={
              !capabilities.chatReports ||
              !capabilities.chatDetails ||
              !target ||
              !reason ||
              mutation.isPending
            }
          >
            {mutation.isPending ? "접수 중…" : "신고 제출"}
          </Action>
        </form>
      )}
    </Sheet>
  );
}
