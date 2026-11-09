import type { ChatEvent } from "../api/chatSocket";
import type {
  CommunityResponse,
  CommunityCreate,
  CommunityMemberInfo,
} from "../api/community";
import { validateCommunity } from "../api/community";
import { validateReview, type ReviewResponse } from "../api/review";
import { validateSchedule, type Schedule } from "../api/schedule";
import type { Inquiry } from "../api/support";

type Member = {
  memberId: number;
  nickname: string;
  gender: "MALE" | "FEMALE";
  birthdate: string;
  majorId: number;
  faceType: string;
  height: number;
  topSize: string;
  skinTone: string;
  hairStyle: string;
  mbti: string;
  smokingStatus: string;
  tattooStatus: string;
  militaryStatus: string;
  charmPoints: string[];
};
type Message = {
  id: number;
  roomId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  clientMessageId: string;
  createdAt: string;
};
type Membership = {
  memberId: number;
  role: "OWNER" | "MEMBER";
  active: boolean;
  lastReadMessageId: number | null;
  joinedAt: string;
};
type Room = {
  id: number;
  roomType: "DATING" | "MEETING" | "COMMUNITY";
  name: string;
  createdAt: string;
  creatorId: number | null;
  datingRequestId: number | null;
  meetingId: number | null;
  communityId: number | null;
  active: boolean;
  members: Membership[];
};
type Group = Omit<
  CommunityResponse,
  | "memberCount"
  | "joined"
  | "chatRoomId"
  | "canEdit"
  | "canJoin"
  | "canLeave"
  | "canManageMembers"
  | "status"
> & { roomId: number; members: Membership[]; closed: boolean };
type Meeting = {
  id: number;
  creatorId: number;
  title: string;
  requiredMale: number;
  requiredFemale: number;
  scheduledAt: string;
  active: boolean;
  createdAt: string;
  inviteCode: string;
  roomId: number;
  members: Membership[];
};
type Dating = {
  id: number;
  senderId: number;
  receiverId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  roomId: number | null;
  completed: boolean;
};
interface State {
  version: 1;
  id: number;
  members: Member[];
  groups: Group[];
  rooms: Room[];
  messages: Message[];
  meetings: Meeting[];
  dating: Dating[];
  reviews: ReviewResponse[];
  schedules: Schedule[];
  inquiries: Inquiry[];
  chanceUses: string[];
  reports: unknown[];
  feedback: unknown[];
  ideal: Record<string, unknown>;
  withdrawn: boolean;
}
const KEY = "dashtag_preview_v1";
class PreviewError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "VALIDATION_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (
  message: string,
  status = 400,
  code = "VALIDATION_ERROR",
): never => {
  throw new PreviewError(message, status, code);
};
function seed(): State {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const member = (
    id: number,
    nickname: string,
    gender: "MALE" | "FEMALE",
  ): Member => ({
    memberId: id,
    nickname,
    gender,
    birthdate: "2000-01-01",
    majorId: 1,
    faceType: gender === "MALE" ? "DOG" : "CAT",
    height: 174,
    topSize: "M",
    skinTone: "LIGHT",
    hairStyle: "LONG",
    mbti: "ENFP",
    smokingStatus: "NON_SMOKER",
    tattooStatus: "NONE",
    militaryStatus: gender === "MALE" ? "COMPLETED" : "NOT_APPLICABLE",
    charmPoints: ["친절", "유머"],
  });
  const membership = (memberId: number, owner = false): Membership => ({
    memberId,
    role: owner ? "OWNER" : "MEMBER",
    active: true,
    lastReadMessageId: null,
    joinedAt: now,
  });
  const rooms: Room[] = [
    {
      id: 42,
      roomType: "DATING",
      name: "하늘님과의 소개팅",
      createdAt: now,
      creatorId: null,
      datingRequestId: 300,
      meetingId: null,
      communityId: null,
      active: true,
      members: [membership(7), membership(8)],
    },
    {
      id: 43,
      roomType: "DATING",
      name: "지난 만남",
      createdAt: yesterday,
      creatorId: null,
      datingRequestId: 301,
      meetingId: null,
      communityId: null,
      active: true,
      members: [membership(7), membership(11)],
    },
    {
      id: 44,
      roomType: "COMMUNITY",
      name: "주말 카페 탐방",
      createdAt: now,
      creatorId: 7,
      datingRequestId: null,
      meetingId: null,
      communityId: 100,
      active: true,
      members: [membership(7, true), membership(8), membership(9)],
    },
    {
      id: 45,
      roomType: "COMMUNITY",
      name: "같이 달려요",
      createdAt: now,
      creatorId: 8,
      datingRequestId: null,
      meetingId: null,
      communityId: 101,
      active: true,
      members: [membership(8, true)],
    },
    {
      id: 46,
      roomType: "MEETING",
      name: "함께하는 카페 미팅",
      createdAt: now,
      creatorId: 8,
      datingRequestId: null,
      meetingId: 20,
      communityId: null,
      active: true,
      members: [membership(8, true)],
    },
  ];
  return {
    version: 1,
    id: 1000,
    members: [
      member(7, "미리보기회원", "FEMALE"),
      member(8, "하늘", "MALE"),
      member(9, "봄날", "FEMALE"),
      member(11, "가을", "MALE"),
      member(12, "새봄", "MALE"),
    ],
    rooms,
    groups: [
      {
        id: 100,
        creatorId: 7,
        emoji: "☕",
        title: "주말 카페 탐방",
        description:
          "인하대 근처 카페를 함께 찾아다녀요. 편하게 이야기하고 취향을 나눠요.",
        tags: ["카페", "맛집"],
        gender: "ANY",
        active: true,
        createdAt: now,
        maxMembers: 10,
        roomId: 44,
        members: rooms[2].members,
        closed: false,
      },
      {
        id: 101,
        creatorId: 8,
        emoji: "🏃",
        title: "같이 달려요",
        description: "처음 달리는 분도 환영해요. 가볍게 함께 운동해요.",
        tags: ["운동"],
        gender: "ANY",
        active: true,
        createdAt: now,
        maxMembers: 20,
        roomId: 45,
        members: rooms[3].members,
        closed: false,
      },
    ],
    messages: [
      {
        id: 100,
        roomId: 42,
        senderId: 8,
        senderNickname: "하늘",
        content: "안녕하세요! 만나서 반가워요 😊",
        clientMessageId: "00000000-0000-4000-8000-000000000100",
        createdAt: now,
      },
      {
        id: 101,
        roomId: 44,
        senderId: 8,
        senderNickname: "하늘",
        content: "이번 주 카페는 어디가 좋을까요?",
        clientMessageId: "00000000-0000-4000-8000-000000000101",
        createdAt: now,
      },
    ],
    meetings: [
      {
        id: 20,
        creatorId: 8,
        title: "함께하는 카페 미팅",
        requiredMale: 2,
        requiredFemale: 2,
        scheduledAt: tomorrow,
        active: true,
        createdAt: now,
        inviteCode: "0123456789ABCDEF0123456789ABCDEF",
        roomId: 46,
        members: rooms[4].members,
      },
    ],
    dating: [
      {
        id: 300,
        senderId: 8,
        receiverId: 7,
        status: "ACCEPTED",
        message: "함께 이야기해요",
        createdAt: now,
        respondedAt: now,
        roomId: 42,
        completed: false,
      },
      {
        id: 301,
        senderId: 11,
        receiverId: 7,
        status: "ACCEPTED",
        message: null,
        createdAt: yesterday,
        respondedAt: yesterday,
        roomId: 43,
        completed: true,
      },
      {
        id: 302,
        senderId: 9,
        receiverId: 7,
        status: "PENDING",
        message: "반가워요",
        createdAt: now,
        respondedAt: null,
        roomId: null,
        completed: false,
      },
    ],
    reviews: [
      {
        id: 500,
        reviewerId: 11,
        reviewerNickname: "가을",
        reviewedMemberId: 7,
        datingRequestId: 301,
        rating: 4,
        content: "즐겁게 이야기했어요!",
        createdAt: yesterday,
        updatedAt: yesterday,
        canEdit: false,
        canDelete: false,
      },
    ],
    schedules: [
      {
        id: 600,
        roomId: 42,
        roomType: "DATING",
        title: "카페에서 만나요",
        scheduledAt: tomorrow,
        location: "인하대 후문",
        updatedAt: now,
        canEdit: true,
      },
    ],
    inquiries: [],
    chanceUses: [],
    reports: [],
    feedback: [],
    ideal: {
      faceType: null,
      skinTone: null,
      mbtiPattern: "????",
      maxYoungerAgeDiff: null,
      maxOlderAgeDiff: null,
      tattooPreference: "ANY",
      smokingPreference: "ANY",
      militaryPreference: "ANY",
      topSize: "XXL",
      minHeight: 160,
      maxHeight: 185,
      hairStyle: "LONG",
    },
    withdrawn: false,
  };
}
export function createPreviewBackend(
  initial?: State,
  onPersist?: (state: State) => void,
) {
  const state = initial ?? seed();
  const listeners = new Set<(event: ChatEvent) => void>();
  const me = 7;
  const now = () => new Date().toISOString();
  const id = () => ++state.id;
  const emit = (
    type: string,
    roomId: number,
    payload: Record<string, unknown> = {},
  ) => {
    for (const listener of listeners) listener({ type, roomId, payload });
  };
  const member = (memberId: number) =>
    state.members.find((m) => m.memberId === memberId) ??
    fail("회원이 없어요", 404, "MEMBER_NOT_FOUND");
  const active = (members: Membership[]) => members.filter((m) => m.active);
  const joined = (members: Membership[]) =>
    members.some((m) => m.active && m.memberId === me);
  const room = (roomId: number) => {
    const r =
      state.rooms.find((r) => r.id === roomId) ??
      fail("채팅방이 없어요", 404, "ROOM_NOT_FOUND");
    if (!joined(r.members))
      fail("채팅방 참여자가 아니에요", 403, "ROOM_ACCESS_DENIED");
    return r;
  };
  const page = <T extends { id: number }>(items: T[], url: URL) => {
    const size = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("size") ?? 20)),
    );
    const cursor = Number(
      url.searchParams.get("cursor") ?? Number.MAX_SAFE_INTEGER,
    );
    const sorted = items
      .filter((i) => i.id < cursor)
      .sort((a, b) => b.id - a.id);
    const result = sorted.slice(0, size);
    return {
      items: result,
      hasNext: sorted.length > size,
      nextCursor: sorted.length > size ? result[result.length - 1]!.id : null,
    };
  };
  const summary = (r: Room) => {
    const messages = state.messages
      .filter((m) => m.roomId === r.id)
      .sort((a, b) => a.id - b.id);
    const last = messages[messages.length - 1];
    const mine = r.members.find((m) => m.memberId === me)!;
    return {
      ...r,
      members: undefined,
      participants: r.members.map((p) => ({
        memberId: p.memberId,
        role: p.role,
        active: p.active,
        lastReadMessageId: p.lastReadMessageId,
        nickname: member(p.memberId).nickname,
        gender: member(p.memberId).gender,
      })),
      lastMessageId: last?.id ?? null,
      lastMessageContent: last?.content ?? null,
      lastMessageAt: last?.createdAt ?? null,
      unreadCount: messages.filter(
        (m) => m.senderId !== me && m.id > (mine?.lastReadMessageId ?? 0),
      ).length,
      scheduledAt:
        state.schedules.find((s) => s.roomId === r.id)?.scheduledAt ?? null,
      canSetSchedule:
        r.active && (r.roomType === "DATING" || r.creatorId === me),
      canLeave: !(r.roomType === "COMMUNITY" && r.creatorId === me && r.active),
      canClose: r.active && (r.roomType === "DATING" || r.creatorId === me),
    };
  };
  const group = (g: Group): CommunityResponse => ({
    id: g.id,
    creatorId: g.creatorId,
    emoji: g.emoji,
    title: g.title,
    description: g.description,
    tags: g.tags,
    gender: g.gender,
    active: g.active,
    createdAt: g.createdAt,
    maxMembers: g.maxMembers,
    status: g.closed ? "CLOSED" : g.active ? "RECRUITING" : "PAUSED",
    memberCount: active(g.members).length,
    joined: joined(g.members),
    chatRoomId: joined(g.members) ? g.roomId : null,
    canEdit: g.creatorId === me && !g.closed,
    canJoin:
      g.active &&
      !g.closed &&
      !joined(g.members) &&
      active(g.members).length < g.maxMembers &&
      (g.gender === "ANY" || g.gender === member(me).gender),
    canLeave: joined(g.members) && (g.creatorId !== me || g.closed),
    canManageMembers: g.creatorId === me && !g.closed,
  });
  const meeting = (m: Meeting) => ({
    id: m.id,
    creatorId: m.creatorId,
    title: m.title,
    requiredMale: m.requiredMale,
    requiredFemale: m.requiredFemale,
    scheduledAt: m.scheduledAt,
    active: m.active,
    createdAt: m.createdAt,
    participantCount: active(m.members).length,
    maleCount: active(m.members).filter(
      (p) => member(p.memberId).gender === "MALE",
    ).length,
    femaleCount: active(m.members).filter(
      (p) => member(p.memberId).gender === "FEMALE",
    ).length,
    joined: joined(m.members),
    inviteCode: joined(m.members) ? m.inviteCode : null,
    chatRoomId: joined(m.members) ? m.roomId : null,
  });
  const getGroup = (groupId: number) =>
    state.groups.find((g) => g.id === groupId) ??
    fail("소모임이 없어요", 404, "COMMUNITY_NOT_FOUND");
  const spendChance = () => {
    state.chanceUses = state.chanceUses.filter(
      (t) => Date.parse(t) + 86400000 > Date.now(),
    );
    if (state.chanceUses.length >= 2)
      fail("남은 기회가 없어요", 409, "CHANCE_EXHAUSTED");
    state.chanceUses.push(now());
  };
  const add = (members: Membership[], memberId = me, owner = false) => {
    const entry = members.find((p) => p.memberId === memberId);
    if (entry?.active) fail("이미 참여 중이에요", 409, "ALREADY_JOINED");
    if (entry) {
      entry.active = true;
      entry.joinedAt = now();
    } else
      members.push({
        memberId,
        role: owner ? "OWNER" : "MEMBER",
        active: true,
        lastReadMessageId: null,
        joinedAt: now(),
      });
  };
  const newRoom = (
    type: Room["roomType"],
    name: string,
    creatorId: number | null,
    relatedId: number,
    members: Membership[],
  ) => {
    const r: Room = {
      id: id(),
      roomType: type,
      name,
      creatorId,
      datingRequestId: type === "DATING" ? relatedId : null,
      meetingId: type === "MEETING" ? relatedId : null,
      communityId: type === "COMMUNITY" ? relatedId : null,
      createdAt: now(),
      active: true,
      members,
    };
    state.rooms.push(r);
    return r;
  };
  const removeMember = (g: Group, memberId: number) => {
    for (const list of [
      g.members,
      state.rooms.find((r) => r.id === g.roomId)!.members,
    ]) {
      const entry = list.find((p) => p.memberId === memberId);
      if (entry) entry.active = false;
    }
    emit("MEMBER_REMOVED", g.roomId, { memberId });
  };
  const dispatch = async (path: string, init: RequestInit = {}) => {
    const url = new URL(path, "http://preview.invalid");
    const p = url.pathname;
    const method = init.method ?? "GET";
    const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
    if (state.withdrawn && !p.startsWith("/api/auth/"))
      fail("탈퇴한 계정이에요", 401, "AUTH_INVALID");
    if (p === "/api/auth/refresh")
      return { accessToken: `preview-session-${id()}` };
    if (p === "/api/auth/login" || p === "/api/auth/signup")
      return { accessToken: "preview-session" };
    if (p === "/api/auth/logout") return null;
    if (p === "/api/auth/password-resets" && method === "POST") return null;
    if (p === "/api/auth/password-resets/confirm") {
      if (body.code !== "123456") fail("미리보기 인증번호는 123456이에요");
      return {
        resetToken: "preview-reset",
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };
    }
    if (p === "/api/auth/password-resets" && method === "PUT") {
      if (body.resetToken !== "preview-reset" || body.password?.length < 8)
        fail("비밀번호를 확인해주세요");
      return null;
    }
    if (p === "/api/members/me/withdrawal") {
      if (!body.password || body.confirmation !== "WITHDRAW")
        fail("탈퇴 확인이 필요해요");
      state.withdrawn = true;
      return null;
    }
    if (p === "/api/auth/email-verifications/confirm")
      return { verificationToken: "preview-verification" };
    if (p === "/api/auth/email-verifications") return null;
    if (p === "/api/student-verifications/status") return { verified: true };
    if (p === "/api/student-verifications") return { verifiedAt: now() };
    if (p === "/api/members/me/profile") {
      if (method === "PUT") Object.assign(member(me), body);
      return member(me);
    }
    if (p === "/api/colleges")
      return [
        {
          id: 1,
          name: "공과대학",
          majors: [
            { id: 1, name: "컴퓨터공학과" },
            { id: 2, name: "기계공학과" },
          ],
        },
      ];
    if (p === "/api/members/me/ideal-preference") {
      if (method === "PUT") state.ideal = body;
      return state.ideal;
    }
    if (p === "/api/chances") {
      const rechargeAt = state.chanceUses
        .map((t) => new Date(Date.parse(t) + 86400000).toISOString())
        .filter((t) => Date.parse(t) > Date.now());
      return {
        hasChance: rechargeAt.length < 2,
        remainingCount: 2 - rechargeAt.length,
        maxCount: 2,
        rechargeAt,
      };
    }
    if (p === "/api/profiles") {
      const profiles = state.members
        .filter(
          (m) =>
            m.memberId !== me &&
            !state.dating.some(
              (d) =>
                d.status !== "REJECTED" &&
                [d.senderId, d.receiverId].includes(me) &&
                [d.senderId, d.receiverId].includes(m.memberId),
            ),
        )
        .map((m) => ({
          ...m,
          age: 26,
          majorName: "컴퓨터공학과",
          canRequest: true,
        }));
      const result = page(
        profiles.map((m) => ({ ...m, id: m.memberId })),
        url,
      );
      return {
        ...result,
        items: result.items.map(
          ({ id: _id, birthdate: _birthdate, ...profile }) => {
            void _id;
            void _birthdate;
            return profile;
          },
        ),
      };
    }
    if (p === "/api/dating/requests" && method === "POST") {
      if (body.receiverId === me) fail("본인에게 신청할 수 없어요");
      member(body.receiverId);
      if (
        state.dating.some(
          (d) =>
            d.status !== "REJECTED" &&
            [d.senderId, d.receiverId].includes(me) &&
            [d.senderId, d.receiverId].includes(body.receiverId),
        )
      )
        fail("이미 신청한 상대예요", 409, "DATING_DUPLICATE");
      spendChance();
      const d: Dating = {
        id: id(),
        senderId: me,
        receiverId: body.receiverId,
        status: "PENDING",
        message: body.message ?? null,
        createdAt: now(),
        respondedAt: null,
        roomId: null,
        completed: false,
      };
      state.dating.push(d);
      return d;
    }
    if (
      p === "/api/dating/requests/sent" ||
      p === "/api/dating/requests/received"
    ) {
      const sent = p.endsWith("sent");
      return page(
        state.dating
          .filter((d) => (sent ? d.senderId === me : d.receiverId === me))
          .map((d) => {
            const m = member(sent ? d.receiverId : d.senderId);
            return {
              ...d,
              counterpart: { ...m, age: 26, majorName: "컴퓨터공학과" },
            };
          }),
        url,
      );
    }
    let match = p.match(/^\/api\/dating\/requests\/(\d+)\/(accept|reject)$/);
    if (match) {
      const d =
        state.dating.find((d) => d.id === Number(match![1])) ??
        fail("신청이 없어요", 404);
      if (d.receiverId !== me) fail("수신자만 처리할 수 있어요", 403);
      if (d.status !== "PENDING") fail("이미 처리된 신청이에요", 409);
      d.status = match[2] === "accept" ? "ACCEPTED" : "REJECTED";
      d.respondedAt = now();
      if (d.status === "ACCEPTED") {
        const members: Membership[] = [];
        add(members, me);
        add(members, d.senderId);
        d.roomId = newRoom(
          "DATING",
          `${member(d.senderId).nickname}님과의 소개팅`,
          null,
          d.id,
          members,
        ).id;
      }
      return { ...d, requestId: d.id, chatRoomId: d.roomId };
    }
    if (p === "/api/meetings" && method === "GET")
      return page(
        state.meetings
          .filter((m) => m.active && Date.parse(m.scheduledAt) > Date.now())
          .map(meeting),
        url,
      );
    if (p === "/api/meetings" && method === "POST") {
      if (
        !body.title?.trim() ||
        ![body.requiredMale, body.requiredFemale].every(
          (n) => Number.isInteger(n) && n >= 2 && n <= 5,
        )
      )
        fail("미팅 입력값을 확인해주세요");
      const scheduledAt = /(Z|[+-]\d{2}:\d{2})$/.test(body.scheduledAt)
        ? body.scheduledAt
        : `${body.scheduledAt}+09:00`;
      if (Date.parse(scheduledAt) <= Date.now())
        fail("미래 일정을 선택해주세요");
      spendChance();
      const members: Membership[] = [];
      add(members, me, true);
      const meetingId = id();
      const r = newRoom("MEETING", body.title, me, meetingId, members);
      const m: Meeting = {
        id: meetingId,
        creatorId: me,
        title: body.title,
        requiredMale: body.requiredMale,
        requiredFemale: body.requiredFemale,
        scheduledAt,
        active: true,
        createdAt: now(),
        inviteCode: meetingId.toString(16).toUpperCase().padStart(32, "0"),
        roomId: r.id,
        members,
      };
      state.meetings.push(m);
      return meeting(m);
    }
    match = p.match(/^\/api\/meetings\/(\d+)(?:\/(join|leave|participants))?$/);
    if (match || p === "/api/meetings/join-by-code") {
      const action =
        match?.[2] ?? (p.endsWith("join-by-code") ? "join" : undefined);
      const m =
        state.meetings.find((m) =>
          match ? m.id === Number(match![1]) : m.inviteCode === body.inviteCode,
        ) ?? fail("미팅이 없어요", 404);
      if (action === "participants")
        return active(m.members).map((p) => ({
          ...member(p.memberId),
          joinedAt: p.joinedAt,
        }));
      if (action === "leave") {
        if (m.creatorId === me && Date.parse(m.scheduledAt) > Date.now())
          fail("개설자는 예정 시각부터 나갈 수 있어요", 409);
        const entry = m.members.find((p) => p.memberId === me);
        if (entry) entry.active = false;
        const r = state.rooms.find((r) => r.id === m.roomId);
        const membership = r?.members.find((p) => p.memberId === me);
        if (membership) membership.active = false;
        return null;
      }
      if (action === "join") {
        if (joined(m.members)) fail("이미 참여 중이에요", 409);
        if (!m.active || Date.parse(m.scheduledAt) <= Date.now())
          fail("마감된 미팅이에요", 409);
        const male = member(me).gender === "MALE";
        const count = active(m.members).filter(
          (p) => member(p.memberId).gender === member(me).gender,
        ).length;
        if (count >= (male ? m.requiredMale : m.requiredFemale))
          fail("성별 정원이 찼어요", 409, "MEETING_FULL");
        spendChance();
        add(m.members);
        const r = state.rooms.find((r) => r.id === m.roomId)!;
        if (!joined(r.members)) add(r.members);
        emit("ROOM_UPDATED", r.id);
      }
      return meeting(m);
    }
    if (p === "/api/communities" && method === "GET") {
      const keyword = url.searchParams.get("keyword")?.toLowerCase() ?? "";
      const gender = url.searchParams.get("gender");
      return page(
        state.groups
          .filter(
            (g) =>
              !g.closed &&
              (!gender || g.gender === gender) &&
              (g.title + " " + g.description).toLowerCase().includes(keyword) &&
              (url.searchParams.get("joinedOnly") !== "true" ||
                joined(g.members)),
          )
          .map(group),
        url,
      );
    }
    if (p === "/api/communities" && method === "POST") {
      const valid = validateCommunity(body as CommunityCreate);
      const members: Membership[] = [];
      add(members, me, true);
      const groupId = id();
      const r = newRoom("COMMUNITY", valid.title, me, groupId, members);
      const g: Group = {
        ...valid,
        id: groupId,
        creatorId: me,
        active: true,
        createdAt: now(),
        roomId: r.id,
        members,
        closed: false,
      };
      state.groups.push(g);
      return group(g);
    }
    match = p.match(
      /^\/api\/communities\/(\d+)(?:\/(join|leave|close|dashboard|members)(?:\/(\d+))?)?$/,
    );
    if (match) {
      const g = getGroup(Number(match[1]));
      const action = match[2];
      if (action === "dashboard") {
        if (!group(g).canManageMembers) fail("개설자만 볼 수 있어요", 403);
        return {
          community: group(g),
          maleCount: active(g.members).filter(
            (p) => member(p.memberId).gender === "MALE",
          ).length,
          femaleCount: active(g.members).filter(
            (p) => member(p.memberId).gender === "FEMALE",
          ).length,
          members: active(g.members).map(
            (p) =>
              ({
                memberId: p.memberId,
                role: p.role,
                joinedAt: p.joinedAt,
                nickname: member(p.memberId).nickname,
                gender: member(p.memberId).gender,
                age: 26,
                majorName: "컴퓨터공학과",
              }) satisfies CommunityMemberInfo,
          ),
        };
      }
      if (action === "members" && method === "DELETE") {
        const target = Number(match[3]);
        if (!group(g).canManageMembers || target === g.creatorId)
          fail("내보낼 권한이 없어요", 403);
        if (!active(g.members).some((p) => p.memberId === target))
          fail("가입한 회원이 아니에요", 404);
        removeMember(g, target);
        return null;
      }
      if (action === "join") {
        if (!group(g).canJoin)
          fail(
            "가입할 수 없는 소모임이에요",
            409,
            "COMMUNITY_JOIN_UNAVAILABLE",
          );
        add(g.members);
        const r = state.rooms.find((r) => r.id === g.roomId)!;
        if (!joined(r.members)) add(r.members);
        emit("ROOM_UPDATED", g.roomId);
        return group(g);
      }
      if (action === "leave") {
        if (!group(g).canLeave)
          fail("지금은 나갈 수 없어요", 409, "OWNER_CANNOT_LEAVE");
        removeMember(g, me);
        return null;
      }
      if (action === "close") {
        if (!group(g).canManageMembers) fail("종료할 권한이 없어요", 403);
        g.closed = true;
        g.active = false;
        state.rooms.find((r) => r.id === g.roomId)!.active = false;
        emit("ROOM_CLOSED", g.roomId);
        return group(g);
      }
      if (method === "PUT") {
        if (!group(g).canEdit) fail("수정 권한이 없어요", 403);
        const valid = validateCommunity(body);
        if (valid.maxMembers < active(g.members).length)
          fail("현재 인원보다 작은 정원은 설정할 수 없어요", 409);
        Object.assign(g, valid, { active: body.active });
        state.rooms.find((r) => r.id === g.roomId)!.name = g.title;
        emit("ROOM_UPDATED", g.roomId);
      }
      return group(g);
    }
    if (p === "/api/reviews/eligible")
      return state.dating
        .filter(
          (d) =>
            d.status === "ACCEPTED" && [d.senderId, d.receiverId].includes(me),
        )
        .map((d) => {
          const other = member(d.senderId === me ? d.receiverId : d.senderId);
          const written = state.reviews.find(
            (r) => r.datingRequestId === d.id && r.reviewerId === me,
          );
          return {
            datingRequestId: d.id,
            memberId: other.memberId,
            nickname: other.nickname,
            roomId: d.roomId,
            scheduledAt: null,
            canReview: d.completed && !written,
            unavailableReason: written
              ? "이미 작성한 리뷰예요"
              : !d.completed
                ? "만남이 완료되면 작성할 수 있어요"
                : null,
            reviewId: written?.id ?? null,
          };
        });
    match = p.match(/^\/api\/reviews\/(received|written|users\/\d+)$/);
    if (match) {
      const kind = match[1];
      const target = kind.startsWith("users/")
        ? Number(kind.split("/")[1])
        : me;
      const reviews = state.reviews
        .filter((r) =>
          kind === "written"
            ? r.reviewerId === me
            : r.reviewedMemberId === target,
        )
        .map((r) => ({
          ...r,
          canEdit: r.reviewerId === me,
          canDelete: r.reviewerId === me,
        }));
      return {
        ...page(reviews, url),
        averageRating: reviews.length
          ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
          : null,
        totalCount: reviews.length,
      };
    }
    if (p === "/api/reviews" && method === "POST") {
      const input = validateReview(body);
      const dating =
        state.dating.find((d) => d.id === input.datingRequestId) ??
        fail("소개팅이 없어요", 404);
      if (
        !dating.completed ||
        ![dating.senderId, dating.receiverId].includes(me) ||
        ![dating.senderId, dating.receiverId].includes(
          input.reviewedMemberId,
        ) ||
        input.reviewedMemberId === me
      )
        fail("리뷰를 작성할 수 없는 상대예요", 403, "REVIEW_NOT_ELIGIBLE");
      if (
        state.reviews.some(
          (r) =>
            r.datingRequestId === input.datingRequestId && r.reviewerId === me,
        )
      )
        fail("이미 작성한 리뷰예요", 409, "REVIEW_DUPLICATE");
      const review: ReviewResponse = {
        ...input,
        id: id(),
        reviewerId: me,
        reviewerNickname: member(me).nickname,
        createdAt: now(),
        updatedAt: now(),
        canEdit: true,
        canDelete: true,
      };
      state.reviews.push(review);
      return review;
    }
    match = p.match(/^\/api\/reviews\/(\d+)$/);
    if (match) {
      const review =
        state.reviews.find((r) => r.id === Number(match![1])) ??
        fail("리뷰가 없어요", 404);
      if (review.reviewerId !== me)
        fail("내가 쓴 리뷰만 수정할 수 있어요", 403);
      if (method === "DELETE") {
        state.reviews = state.reviews.filter((r) => r.id !== review.id);
        return null;
      }
      const input = validateReview({
        ...review,
        rating: body.rating,
        content: body.content,
      });
      Object.assign(review, {
        rating: input.rating,
        content: input.content,
        updatedAt: now(),
      });
      return review;
    }
    if (p === "/api/members/me/schedules") {
      const from = url.searchParams.get("from") ?? "";
      const to = url.searchParams.get("to") ?? "";
      return state.schedules.filter((s) => {
        const date = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Asia/Seoul",
        }).format(new Date(s.scheduledAt));
        return (
          date >= from &&
          date <= to &&
          state.rooms.some((r) => r.id === s.roomId && joined(r.members))
        );
      });
    }
    if (p === "/api/chat-rooms")
      return state.rooms
        .filter((r) => r.active && joined(r.members))
        .map(summary)
        .sort(
          (a, b) =>
            Date.parse(b.lastMessageAt ?? b.createdAt) -
            Date.parse(a.lastMessageAt ?? a.createdAt),
        );
    match = p.match(
      /^\/api\/chat-rooms\/(\d+)(?:\/(messages|read-position|schedule|reports|leave|close))?$/,
    );
    if (match) {
      const r = room(Number(match[1]));
      const action = match[2];
      if (!action) return summary(r);
      if (!r.active && method !== "GET")
        fail("종료된 채팅방이에요", 409, "ROOM_CLOSED");
      if (action === "messages" && method === "GET") {
        const result = page(
          state.messages.filter((m) => m.roomId === r.id),
          url,
        );
        return {
          messages: result.items.reverse(),
          hasNext: result.hasNext,
          nextCursor: result.nextCursor,
        };
      }
      if (action === "messages" && method === "POST") {
        if (
          typeof body.content !== "string" ||
          !body.content.trim() ||
          body.content.length > 2000 ||
          !/^[0-9a-f-]{36}$/i.test(body.clientMessageId)
        )
          fail("메시지를 확인해주세요");
        const existing = state.messages.find(
          (m) =>
            m.roomId === r.id &&
            m.senderId === me &&
            m.clientMessageId === body.clientMessageId,
        );
        if (existing) {
          if (existing.content !== body.content)
            fail(
              "동일한 메시지 ID로 다른 내용을 보낼 수 없어요",
              409,
              "MESSAGE_ID_CONFLICT",
            );
          return existing;
        }
        const message: Message = {
          id: id(),
          roomId: r.id,
          senderId: me,
          senderNickname: member(me).nickname,
          content: body.content,
          clientMessageId: body.clientMessageId,
          createdAt: now(),
        };
        state.messages.push(message);
        emit(
          "MESSAGE_CREATED",
          r.id,
          message as unknown as Record<string, unknown>,
        );
        return message;
      }
      if (action === "read-position") {
        if (
          !state.messages.some(
            (m) => m.roomId === r.id && m.id === body.lastReadMessageId,
          )
        )
          fail("해당 방의 메시지가 아니에요", 404);
        const mine = r.members.find((m) => m.memberId === me)!;
        mine.lastReadMessageId = Math.max(
          mine.lastReadMessageId ?? 0,
          body.lastReadMessageId,
        );
        emit("READ_POSITION_UPDATED", r.id, {
          memberId: me,
          lastReadMessageId: mine.lastReadMessageId,
        });
        return { roomId: r.id, lastReadMessageId: mine.lastReadMessageId };
      }
      if (action === "schedule") {
        const initial = state.schedules.find((s) => s.roomId === r.id);
        if (method === "GET") return initial ?? null;
        if (!summary(r).canSetSchedule)
          fail("일정을 변경할 권한이 없어요", 403);
        if (method === "DELETE") {
          state.schedules = state.schedules.filter((s) => s.roomId !== r.id);
          emit("SCHEDULE_DELETED", r.id);
          return null;
        }
        const valid = validateSchedule(body);
        const schedule: Schedule = {
          ...valid,
          id: initial?.id ?? id(),
          roomId: r.id,
          roomType: r.roomType,
          updatedAt: now(),
          canEdit: true,
        };
        state.schedules = state.schedules.filter((s) => s.roomId !== r.id);
        state.schedules.push(schedule);
        if (r.meetingId != null) {
          state.meetings.find((m) => m.id === r.meetingId)!.scheduledAt =
            schedule.scheduledAt;
        }
        emit(
          "SCHEDULE_UPDATED",
          r.id,
          schedule as unknown as Record<string, unknown>,
        );
        return schedule;
      }
      if (action === "reports") {
        if (
          body.reportedMemberId === me ||
          !r.members.some((m) => m.memberId === body.reportedMemberId)
        )
          fail("신고 대상을 확인해주세요");
        if (
          !["ABUSE", "INAPPROPRIATE", "SPAM", "FRAUD", "OTHER"].includes(
            body.reason,
          )
        )
          fail("신고 사유를 확인해주세요");
        if (
          state.reports.some((value) => {
            const report = value as {
              roomId: number;
              reportedMemberId: number;
              reason: string;
            };
            return (
              report.roomId === r.id &&
              report.reportedMemberId === body.reportedMemberId &&
              report.reason === body.reason
            );
          })
        )
          fail("이미 접수한 신고예요", 409, "REPORT_DUPLICATE");
        const report = {
          ...body,
          id: id(),
          roomId: r.id,
          status: "RECEIVED",
          createdAt: now(),
        };
        state.reports.push(report);
        return {
          id: report.id,
          status: report.status,
          createdAt: report.createdAt,
        };
      }
      if (action === "leave") {
        if (!summary(r).canLeave) fail("지금은 나갈 수 없어요", 409);
        if (r.communityId != null) removeMember(getGroup(r.communityId), me);
        r.members.find((m) => m.memberId === me)!.active = false;
        return null;
      }
      if (action === "close") {
        if (!summary(r).canClose) fail("종료 권한이 없어요", 403);
        r.active = false;
        emit("ROOM_CLOSED", r.id);
        return null;
      }
    }
    if (p === "/api/support/notices")
      return page(
        [
          {
            id: 1,
            title: "미리보기 이용 안내",
            content:
              "이 화면은 프론트 계약 검증용 예시 데이터입니다. 실제 계정·메시지·신고는 생성되지 않습니다.",
            pinned: true,
            createdAt: now(),
          },
        ],
        url,
      );
    if (p === "/api/support/faqs")
      return [
        {
          id: 1,
          category: "이용",
          question: "기회는 언제 회복되나요?",
          answer: "기회는 최대 2회이며 사용한 각 기회는 24시간 뒤 회복돼요.",
        },
        {
          id: 2,
          category: "인증",
          question: "미리보기 인증번호가 무엇인가요?",
          answer:
            "미리보기 모드의 인증번호는 123456입니다. 실제 서버와는 무관해요.",
        },
      ];
    if (p === "/api/support/inquiries/me") return page(state.inquiries, url);
    if (p === "/api/support/inquiries" && method === "POST") {
      if (!body.title?.trim() || !body.content?.trim())
        fail("제목과 내용을 입력해주세요");
      const inquiry: Inquiry = {
        ...body,
        id: id(),
        status: "OPEN",
        answer: null,
        createdAt: now(),
        answeredAt: null,
      };
      state.inquiries.push(inquiry);
      return inquiry;
    }
    if (p === "/api/support/feedback" && method === "POST") {
      if (!body.content?.trim()) fail("의견을 입력해주세요");
      const feedback = { id: id(), content: body.content, createdAt: now() };
      state.feedback.push(feedback);
      return { id: feedback.id, createdAt: feedback.createdAt };
    }
    fail(
      `미리보기에서 지원하지 않는 요청: ${method} ${p}`,
      404,
      "PREVIEW_ROUTE_NOT_FOUND",
    );
  };
  return {
    subscribe(listener: (event: ChatEvent) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => structuredClone(state),
    simulateIncoming(roomId: number) {
      const r = room(roomId);
      if (!r.active) fail("종료된 채팅방이에요", 409, "ROOM_CLOSED");
      const other =
        r.members.find((p) => p.active && p.memberId !== me) ??
        fail("상대가 없어요");
      const message: Message = {
        id: id(),
        roomId,
        senderId: other.memberId,
        senderNickname: member(other.memberId).nickname,
        content: "좋아요! 그때 만나요 😊",
        clientMessageId: crypto.randomUUID(),
        createdAt: now(),
      };
      state.messages.push(message);
      onPersist?.(state);
      emit(
        "MESSAGE_CREATED",
        roomId,
        message as unknown as Record<string, unknown>,
      );
    },
    simulateRead(roomId: number) {
      const r = room(roomId);
      const latest = Math.max(
        0,
        ...state.messages.filter((m) => m.roomId === roomId).map((m) => m.id),
      );
      for (const p of r.members.filter((p) => p.active && p.memberId !== me)) {
        p.lastReadMessageId = latest;
        emit("READ_POSITION_UPDATED", roomId, {
          memberId: p.memberId,
          lastReadMessageId: latest,
        });
      }
      onPersist?.(state);
    },
    async response(path: string, init: RequestInit = {}) {
      try {
        const result = await dispatch(path, init);
        onPersist?.(state);
        return new Response(
          JSON.stringify({
            isSuccess: true,
            code: "SUCCESS",
            message: "성공",
            result,
          }),
          { status: 200 },
        );
      } catch (error) {
        const e = error as PreviewError;
        return new Response(
          JSON.stringify({
            isSuccess: false,
            code: e.code ?? "VALIDATION_ERROR",
            message: e.message,
            result: null,
          }),
          { status: e.status ?? 400 },
        );
      }
    },
  };
}
let backend: ReturnType<typeof createPreviewBackend> | undefined;
function getBackend() {
  if (!backend) {
    let initial: State | undefined;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version === 1) initial = parsed;
      }
    } catch {
      /* Invalid preview storage starts a fresh isolated fixture. */
    }
    backend = createPreviewBackend(initial, (state) =>
      localStorage.setItem(KEY, JSON.stringify(state)),
    );
  }
  return backend;
}
export function previewResponse(path: string, init: RequestInit = {}) {
  return getBackend().response(path, init);
}
export function subscribePreview(listener: (event: ChatEvent) => void) {
  return getBackend().subscribe(listener);
}
export function resetPreview() {
  backend = undefined;
  localStorage.removeItem(KEY);
  localStorage.setItem("dashtag_access_token", "preview-session");
  window.location.assign("/");
}

export function simulateIncoming(roomId: number) {
  getBackend().simulateIncoming(roomId);
}
export function simulateRead(roomId: number) {
  getBackend().simulateRead(roomId);
}
