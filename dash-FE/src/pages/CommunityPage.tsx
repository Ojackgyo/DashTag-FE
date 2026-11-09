import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { capabilities } from "../api/capabilities";
import {
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  joinCommunity,
  leaveCommunity,
  closeCommunity,
  getCommunityDashboard,
  removeCommunityMember,
  validateCommunity,
} from "../api/community";
import type {
  CommunityResponse,
  CommunityCreate,
  CommunityGender,
} from "../api/community";
import { nextCursor } from "../api/contracts";
import { queryKeys } from "../lib/queryKeys";
import { useDebounce } from "../lib/hooks";
import QueryStatus from "../components/QueryStatus";
import {
  Action,
  Sheet,
  Confirm,
  ConnectionNotice,
} from "../components/FeatureUI";
import { fieldStyle, cardStyle } from "../components/featureStyles";

const genderLabel = { ANY: "누구나", MALE: "남성", FEMALE: "여성" };
const blank: CommunityCreate = {
  emoji: "🌟",
  title: "",
  description: "",
  tags: [],
  gender: "ANY",
  maxMembers: 20,
};
function CommunityForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CommunityResponse;
  onClose: () => void;
  onSaved: (value: CommunityResponse) => void;
}) {
  const [value, setValue] = useState<CommunityCreate>(
    initial
      ? {
          emoji: initial.emoji,
          title: initial.title,
          description: initial.description,
          tags: initial.tags,
          gender: initial.gender,
          maxMembers: initial.maxMembers,
        }
      : blank,
  );
  const [tagInput, setTagInput] = useState(value.tags.join(", "));
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<Error | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      const body = validateCommunity({
        ...value,
        tags: tagInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      return initial
        ? updateCommunity(initial.id, { ...body, active })
        : createCommunity(body);
    },
    onSuccess: onSaved,
  });
  return (
    <Sheet
      title={initial ? "소모임 수정" : "소모임 개설"}
      onClose={onClose}
      busy={save.isPending}
    >
      <ConnectionNotice available={capabilities.communities} />
      <form
        className="feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          try {
            validateCommunity({
              ...value,
              tags: tagInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
            save.mutate();
          } catch (e) {
            setError(e as Error);
          }
        }}
      >
        <label>
          이모지
          <select
            aria-label="소모임 이모지"
            style={fieldStyle}
            value={value.emoji}
            disabled={save.isPending}
            onChange={(e) => setValue((v) => ({ ...v, emoji: e.target.value }))}
          >
            {[
              "🌟",
              "🎸",
              "🧗",
              "📚",
              "📸",
              "🎮",
              "🍜",
              "🎨",
              "⚽",
              "🏃",
              "🎤",
              "🌿",
            ].map((emoji) => (
              <option key={emoji}>{emoji}</option>
            ))}
          </select>
        </label>
        <label>
          제목
          <input
            style={fieldStyle}
            required
            maxLength={100}
            value={value.title}
            disabled={save.isPending}
            onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))}
          />
        </label>
        <label>
          소개
          <textarea
            style={fieldStyle}
            required
            maxLength={2000}
            rows={4}
            value={value.description}
            disabled={save.isPending}
            onChange={(e) =>
              setValue((v) => ({ ...v, description: e.target.value }))
            }
          />
          <small>{value.description.length}/2,000</small>
        </label>
        <label>
          태그 (쉼표로 구분, 최대 5개)
          <input
            style={fieldStyle}
            value={tagInput}
            disabled={save.isPending}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="독서, 카페"
          />
        </label>
        <label>
          가입 성별
          <select
            style={fieldStyle}
            value={value.gender}
            disabled={save.isPending}
            onChange={(e) =>
              setValue((v) => ({
                ...v,
                gender: e.target.value as CommunityGender,
              }))
            }
          >
            {Object.entries(genderLabel).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          정원 (개설자 포함)
          <input
            style={fieldStyle}
            required
            type="number"
            min={2}
            max={100}
            value={value.maxMembers}
            disabled={save.isPending}
            onChange={(e) =>
              setValue((v) => ({ ...v, maxMembers: Number(e.target.value) }))
            }
          />
        </label>
        {initial && (
          <label>
            <span>모집 상태</span>
            <select
              style={fieldStyle}
              value={String(active)}
              disabled={save.isPending}
              onChange={(e) => setActive(e.target.value === "true")}
            >
              <option value="true">모집 중</option>
              <option value="false">모집 중단</option>
            </select>
          </label>
        )}
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          가입하면 소모임 채팅방에 함께 참여해요.
        </p>
        <QueryStatus error={error ?? save.error} />
        <Action
          type="submit"
          disabled={!capabilities.communities || save.isPending}
        >
          {save.isPending ? "저장 중…" : initial ? "수정 저장" : "개설하기"}
        </Action>
      </form>
    </Sheet>
  );
}
function Dashboard({
  id,
  onClose,
  onChanged,
}: {
  id: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const query = useQuery({
    queryKey: [...queryKeys.communities, id, "dashboard"],
    queryFn: () => getCommunityDashboard(id),
  });
  const [remove, setRemove] = useState<{ id: number; name: string } | null>(
    null,
  );
  const mutation = useMutation({
    mutationFn: (memberId: number) => removeCommunityMember(id, memberId),
    onSuccess: () => {
      setRemove(null);
      onChanged();
      void query.refetch();
    },
  });
  return (
    <Sheet title="소모임 운영" onClose={onClose} busy={mutation.isPending}>
      <QueryStatus
        loading={query.isLoading}
        error={query.error ?? mutation.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data && (
        <>
          <div style={cardStyle}>
            <strong>전체 {query.data.community.memberCount}명</strong>
            <p>
              남성 {query.data.maleCount} · 여성 {query.data.femaleCount}
            </p>
          </div>
          {query.data.members.map((member) => (
            <div key={member.memberId} style={cardStyle}>
              <div
                className="feature-row"
                style={{ justifyContent: "space-between" }}
              >
                <div>
                  <strong>
                    {member.nickname}{" "}
                    {member.role === "OWNER" ? "· 개설자" : ""}
                  </strong>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {member.majorName} · {member.age}세
                  </p>
                </div>
                {member.role !== "OWNER" &&
                  query.data.community.canManageMembers && (
                    <Action
                      onClick={() =>
                        setRemove({
                          id: member.memberId,
                          name: member.nickname,
                        })
                      }
                      style={{
                        background: "var(--bg-card2)",
                        color: "#dc5467",
                      }}
                    >
                      내보내기
                    </Action>
                  )}
              </div>
            </div>
          ))}
        </>
      )}
      {remove && (
        <Confirm
          error={mutation.error}
          title="멤버를 내보낼까요?"
          description={`${remove.name}님은 소모임과 채팅방에서 나가게 돼요.`}
          busy={mutation.isPending}
          onClose={() => setRemove(null)}
          onConfirm={() => mutation.mutate(remove.id)}
        />
      )}
    </Sheet>
  );
}
function CommunityDetail({
  id,
  onClose,
  onChanged,
}: {
  id: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...queryKeys.communities, id],
    queryFn: () => getCommunity(id),
    refetchOnWindowFocus: true,
  });
  const [editing, setEditing] = useState(false);
  const [dashboard, setDashboard] = useState(false);
  const [confirm, setConfirm] = useState<"leave" | "close" | null>(null);
  const mutation = useMutation({
    mutationFn: async (action: "join" | "leave" | "close") => {
      if (action === "join") return joinCommunity(id);
      if (action === "close") return closeCommunity(id);
      await leaveCommunity(id);
      return getCommunity(id);
    },
    onSuccess: (result) => {
      client.setQueryData([...queryKeys.communities, id], result);
      setConfirm(null);
      onChanged();
    },
  });
  const group = query.data;
  return (
    <Sheet
      title={group ? `${group.emoji} ${group.title}` : "소모임 상세"}
      onClose={onClose}
      busy={mutation.isPending}
    >
      <QueryStatus
        loading={query.isLoading}
        error={query.error ?? mutation.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {group && (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
            {genderLabel[group.gender]} · {group.memberCount}/{group.maxMembers}
            명 ·{" "}
            {
              { RECRUITING: "모집 중", PAUSED: "모집 중단", CLOSED: "종료" }[
                group.status
              ]
            }
          </p>
          <p
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              lineHeight: 1.7,
              marginBottom: 16,
            }}
          >
            {group.description}
          </p>
          <p style={{ color: "var(--primary)", marginBottom: 20 }}>
            {group.tags.map((tag) => `#${tag}`).join(" ")}
          </p>
          <div className="feature-form">
            {!group.joined && (
              <Action
                disabled={!group.canJoin || mutation.isPending}
                onClick={() => mutation.mutate("join")}
              >
                {group.canJoin
                  ? "가입하고 채팅 참여"
                  : "지금은 가입할 수 없어요"}
              </Action>
            )}
            {group.joined && group.chatRoomId != null && (
              <Action
                onClick={() =>
                  navigate("/chat", {
                    state: {
                      openRoom: { type: "community", roomId: group.chatRoomId },
                    },
                  })
                }
              >
                💬 채팅방으로 이동
              </Action>
            )}
            {group.canEdit && (
              <Action onClick={() => setEditing(true)}>소모임 수정</Action>
            )}
            {group.canManageMembers && (
              <Action onClick={() => setDashboard(true)}>멤버 관리</Action>
            )}
            {group.canLeave && (
              <Action
                style={{
                  background: "var(--bg-card2)",
                  color: "var(--text-sub)",
                }}
                disabled={mutation.isPending}
                onClick={() => setConfirm("leave")}
              >
                소모임 나가기
              </Action>
            )}
            {group.canManageMembers && group.active && (
              <Action
                style={{ background: "var(--bg-card2)", color: "#dc5467" }}
                disabled={mutation.isPending}
                onClick={() => setConfirm("close")}
              >
                소모임 종료
              </Action>
            )}
            {group.joined && !group.canLeave && (
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
                개설자는 소모임을 종료한 뒤 나갈 수 있어요.
              </p>
            )}
          </div>
          {editing && (
            <CommunityForm
              initial={group}
              onClose={() => setEditing(false)}
              onSaved={(result) => {
                client.setQueryData([...queryKeys.communities, id], result);
                setEditing(false);
                onChanged();
              }}
            />
          )}
          {dashboard && (
            <Dashboard
              id={id}
              onClose={() => setDashboard(false)}
              onChanged={onChanged}
            />
          )}
          {confirm && (
            <Confirm
              error={mutation.error}
              title={
                confirm === "leave"
                  ? "소모임에서 나갈까요?"
                  : "소모임을 종료할까요?"
              }
              description={
                confirm === "leave"
                  ? "소모임과 채팅방에서 나가게 돼요."
                  : "새 가입과 채팅 전송이 중단돼요. 종료한 소모임은 다시 열 수 없어요."
              }
              busy={mutation.isPending}
              onClose={() => setConfirm(null)}
              onConfirm={() => mutation.mutate(confirm)}
            />
          )}
        </>
      )}
    </Sheet>
  );
}
export default function CommunityPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [gender, setGender] = useState<CommunityGender>("ANY");
  const [joinedOnly, setJoinedOnly] = useState(false);
  const [create, setCreate] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const changeSearch = useDebounce((text: string) => setKeyword(text), 300);
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.communities, "list", keyword, gender, joinedOnly],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) =>
      getCommunities({
        cursor: pageParam,
        keyword,
        gender: gender === "ANY" ? undefined : gender,
        joinedOnly: joinedOnly ? "true" : undefined,
      }),
    getNextPageParam: (page, _pages, previous) => nextCursor(page, previous),
    enabled: capabilities.communities,
  });
  const changed = () => {
    void client.invalidateQueries({ queryKey: queryKeys.communities });
    void client.invalidateQueries({ queryKey: queryKeys.chatRooms });
  };
  const groups = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) ?? []).map((g) => [g.id, g]),
    ).values(),
  ];
  return (
    <div className="page-container px-[18px] pb-6">
      <div className="feature-row" style={{ justifyContent: "space-between" }}>
        <h1 className="feature-title">소모임 🌟</h1>
        <Action onClick={() => setCreate(true)}>＋ 개설</Action>
      </div>
      <ConnectionNotice available={capabilities.communities} />
      <input
        aria-label="소모임 검색"
        style={fieldStyle}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          changeSearch(e.target.value);
        }}
        placeholder="소모임 이름·소개 검색"
      />
      <div className="feature-tabs" role="tablist" aria-label="가입 조건">
        {(Object.keys(genderLabel) as CommunityGender[]).map((code) => (
          <button
            key={code}
            role="tab"
            aria-selected={gender === code}
            onClick={() => setGender(code)}
          >
            {genderLabel[code]}
          </button>
        ))}
      </div>
      <label
        className="feature-row"
        style={{ color: "var(--text-sub)", marginBottom: 16 }}
      >
        <input
          type="checkbox"
          checked={joinedOnly}
          onChange={(e) => setJoinedOnly(e.target.checked)}
        />
        내가 가입한 소모임
      </label>
      <QueryStatus
        loading={query.isLoading}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {groups.map((g) => (
        <button
          key={g.id}
          style={{ ...cardStyle, width: "100%", textAlign: "left" }}
          onClick={() => setId(g.id)}
        >
          <div className="feature-row">
            <span style={{ fontSize: 28 }}>{g.emoji}</span>
            <strong>{g.title}</strong>
            {g.joined && (
              <span style={{ color: "var(--primary)", fontSize: 12 }}>
                참여 중
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-sub)",
              margin: "10px 0",
              overflowWrap: "anywhere",
            }}
          >
            {g.description.slice(0, 90)}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {genderLabel[g.gender]} · {g.memberCount}/{g.maxMembers}명 ·{" "}
            {g.tags.map((t) => `#${t}`).join(" ")}
          </p>
        </button>
      ))}
      {capabilities.communities &&
        !query.isLoading &&
        !query.error &&
        groups.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 32,
            }}
          >
            조건에 맞는 소모임이 없어요.
          </p>
        )}
      {query.hasNextPage && (
        <Action
          disabled={query.isFetchingNextPage}
          onClick={() => {
            void query.fetchNextPage();
          }}
        >
          {query.isFetchingNextPage ? "불러오는 중…" : "더 보기"}
        </Action>
      )}
      {create && (
        <CommunityForm
          onClose={() => setCreate(false)}
          onSaved={(value) => {
            changed();
            setCreate(false);
            setId(value.id);
          }}
        />
      )}
      {id != null && (
        <CommunityDetail
          id={id}
          onClose={() => setId(null)}
          onChanged={changed}
        />
      )}
    </div>
  );
}
