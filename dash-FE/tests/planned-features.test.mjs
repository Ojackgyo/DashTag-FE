import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
const features =
  "profileDiscovery,communities,reviews,chatDetails,chatSchedule,chatReports,support,account";
const server = await createServer({
  cacheDir: "/private/tmp/dashtag-planned-tests-cache",
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  define: {
    "import.meta.env.VITE_ENABLED_FEATURES": JSON.stringify(features),
    "import.meta.env.VITE_CHAT_WS_URL": JSON.stringify(
      "wss://preview.invalid/chat",
    ),
  },
  appType: "custom",
});
after(() => server.close());
const api = {};
for (const name of [
  "client",
  "community",
  "review",
  "chat",
  "schedule",
  "support",
  "account",
  "date",
  "auth",
  "chatSocket",
])
  api[name] = await server.ssrLoadModule(`/src/api/${name}.ts`);
const { createPreviewBackend } = await server.ssrLoadModule(
  "/src/preview/server.ts",
);
const spec = JSON.parse(
  await readFile(
    new URL("../contracts/proposed.openapi.json", import.meta.url),
    "utf8",
  ),
);
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
globalThis.window = new EventTarget();
let backend;
let calls;
function validate(schema, value) {
  if (schema.$ref)
    return validate(
      spec.components.schemas[schema.$ref.split("/").at(-1)],
      value,
    );
  if (value === null) {
    assert.ok(schema.nullable, "unexpected null");
    return;
  }
  if (schema.enum)
    assert.ok(schema.enum.includes(value), `invalid enum ${value}`);
  if (schema.type === "object") {
    for (const key of schema.required ?? [])
      assert.ok(Object.hasOwn(value, key), `missing ${key}`);
    for (const [key, entry] of Object.entries(value)) {
      if (schema.additionalProperties === false)
        assert.ok(schema.properties[key], `undocumented ${key}`);
      if (schema.properties[key]) validate(schema.properties[key], entry);
    }
  }
  if (schema.type === "array") {
    assert.ok(Array.isArray(value));
    for (const entry of value) validate(schema.items, entry);
    if (schema.maxItems != null) assert.ok(value.length <= schema.maxItems);
  }
  if (schema.type === "string") {
    assert.equal(typeof value, "string");
    if (schema.minLength != null) assert.ok(value.length >= schema.minLength);
    if (schema.maxLength != null) assert.ok(value.length <= schema.maxLength);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern));
    if (schema.format === "date-time")
      assert.ok(Number.isFinite(Date.parse(value)));
  }
  if (schema.type === "integer") {
    assert.ok(Number.isSafeInteger(value));
    if (schema.minimum != null) assert.ok(value >= schema.minimum);
    if (schema.maximum != null) assert.ok(value <= schema.maximum);
  }
  if (schema.type === "number") {
    assert.equal(typeof value, "number");
    if (schema.minimum != null) assert.ok(value >= schema.minimum);
    if (schema.maximum != null) assert.ok(value <= schema.maximum);
  }
  if (schema.type === "boolean") assert.equal(typeof value, "boolean");
}
beforeEach(() => {
  storage.clear();
  backend = createPreviewBackend();
  calls = [];
  api.client.setTokens("preview-session");
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = (init.method ?? "GET").toLowerCase();
    const route = Object.keys(spec.paths).find((path) =>
      new RegExp("^" + path.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(
        u.pathname,
      ),
    );
    const operation = spec.paths[route]?.[method];
    if (operation?.requestBody)
      validate(
        operation.requestBody.content["application/json"].schema,
        JSON.parse(init.body),
      );
    calls.push({
      path: u.pathname,
      method,
      body: init.body,
      headers: new Headers(init.headers),
    });
    const response = await backend.response(u.pathname + u.search, init);
    if (response.ok && operation) {
      const body = await response.clone().json();
      const success = operation.responses["200"] ?? operation.responses["201"];
      validate(success.content["application/json"].schema, body);
    }
    return response;
  };
});

test("proposed OpenAPI is internally resolvable and every endpoint has auth, response and path parameters", () => {
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value.$ref)
      assert.ok(
        spec.components.schemas[value.$ref.split("/").at(-1)],
        `missing ${value.$ref}`,
      );
    for (const v of Object.values(value)) visit(v);
  };
  visit(spec);
  assert.equal(
    Object.values(spec.paths).reduce((n, p) => n + Object.keys(p).length, 0),
    36,
  );
  for (const [path, methods] of Object.entries(spec.paths))
    for (const op of Object.values(methods)) {
      assert.ok(op.responses["200"] || op.responses["201"]);
      assert.ok(Array.isArray(op.security));
      for (const name of path.matchAll(/\{([^}]+)\}/g))
        assert.ok(
          op.parameters.some(
            (p) => p.name === name[1] && p.in === "path" && p.required,
          ),
        );
    }
});
test("community creation and updates preserve fields, permissions and linked room", async () => {
  const input = {
    emoji: "📚",
    title: "책모임",
    description: "함께 읽어요",
    tags: ["독서"],
    gender: "ANY",
    maxMembers: 5,
  };
  const created = await api.community.createCommunity(input);
  assert.equal(created.memberCount, 1);
  assert.equal(created.joined, true);
  assert.equal(created.canEdit, true);
  assert.ok(created.chatRoomId);
  assert.equal(created.status, "RECRUITING");
  const changed = await api.community.updateCommunity(created.id, {
    ...input,
    title: "새 책모임",
    active: false,
  });
  assert.equal(changed.title, "새 책모임");
  assert.equal(changed.status, "PAUSED");
  assert.equal(
    (await api.chat.getChatRoomDetail(created.chatRoomId)).room.name,
    "새 책모임",
  );
});
test("community join and leave update memberships and room access together", async () => {
  const joined = await api.community.joinCommunity(101);
  assert.equal(joined.joined, true);
  assert.equal(joined.canJoin, false);
  assert.ok(joined.chatRoomId);
  await assert.rejects(
    api.community.joinCommunity(101),
    (e) => e.status === 409,
  );
  const roomId = joined.chatRoomId;
  await api.community.leaveCommunity(101);
  assert.equal((await api.community.getCommunity(101)).joined, false);
  await assert.rejects(
    api.chat.getChatRoomDetail(roomId),
    (e) => e.status === 403,
  );
  assert.equal((await api.client.api.get("/api/chances")).remainingCount, 2);
});
test("community owner removal, counts, self-removal denial and closure are authoritative", async () => {
  const before = await api.community.getCommunityDashboard(100);
  assert.equal(before.members.length, 3);
  await api.community.removeCommunityMember(100, 8);
  const after = await api.community.getCommunityDashboard(100);
  assert.equal(after.members.length, 2);
  assert.equal(after.maleCount, 0);
  await assert.rejects(
    api.community.removeCommunityMember(100, 7),
    (e) => e.status === 403,
  );
  await assert.rejects(
    api.community.leaveCommunity(100),
    (e) => e.status === 409,
  );
  await api.community.closeCommunity(100);
  const group = await api.community.getCommunity(100);
  assert.equal(group.status, "CLOSED");
  assert.equal(group.canLeave, true);
  assert.equal(group.canEdit, false);
  await api.community.leaveCommunity(100);
  assert.equal((await api.community.getCommunity(100)).joined, false);
});
test("community validation rejects invalid fields before a network request and capacity reductions on server", async () => {
  const input = {
    emoji: "☕",
    title: "모임",
    description: "소개",
    tags: [],
    gender: "ANY",
    maxMembers: 10,
  };
  for (const patch of [
    { title: " " },
    { maxMembers: 1 },
    { maxMembers: 101 },
    { gender: "ALL" },
    { tags: ["a", "b", "c", "d", "e", "f"] },
  ])
    assert.throws(() => api.community.createCommunity({ ...input, ...patch }));
  assert.equal(calls.length, 0);
  await assert.rejects(
    api.community.updateCommunity(100, {
      ...input,
      maxMembers: 2,
      active: true,
    }),
    (e) => e.status === 409,
  );
});
test("community filtering and cursor continuation return distinct pages", async () => {
  const first = await api.community.getCommunities({ keyword: "달려" });
  assert.deepEqual(
    first.items.map((g) => g.id),
    [101],
  );
  const page = await api.client.api.get("/api/communities?size=1");
  assert.equal(page.hasNext, true);
  const next = await api.community.getCommunities({ cursor: page.nextCursor });
  assert.deepEqual(
    next.items.map((g) => g.id),
    [100],
  );
});
test("review eligibility, create, duplicate prevention, edit, received/public aggregation and delete", async () => {
  const targets = await api.review.getReviewTargets();
  assert.equal(targets.find((t) => t.datingRequestId === 301).canReview, true);
  assert.equal(targets.find((t) => t.datingRequestId === 300).canReview, false);
  const input = {
    reviewedMemberId: 11,
    datingRequestId: 301,
    rating: 5,
    content: "좋았어요",
  };
  const created = await api.review.createReview(input);
  await assert.rejects(
    api.review.createReview(input),
    (e) => e.status === 409 && e.code === "REVIEW_DUPLICATE",
  );
  assert.equal(
    (await api.review.getReviewTargets()).find((t) => t.datingRequestId === 301)
      .canReview,
    false,
  );
  const updated = await api.review.updateReview(created.id, {
    rating: 3,
    content: "수정했어요",
  });
  assert.equal(updated.rating, 3);
  const summary = await api.review.getUserReviewSummary(11);
  assert.equal(summary.totalCount, 1);
  assert.equal(summary.averageRating, 3);
  assert.equal(
    (await api.review.getReviews("written")).items[0].content,
    "수정했어요",
  );
  assert.equal((await api.review.getReviews("received")).totalCount, 1);
  await api.review.deleteReview(created.id);
  const empty = await api.review.getUserReviewSummary(11);
  assert.equal(empty.totalCount, 0);
  assert.equal(empty.averageRating, null);
});
test("reviews enforce eligibility, authorship and rating bounds", async () => {
  await assert.rejects(
    api.review.createReview({
      reviewedMemberId: 8,
      datingRequestId: 300,
      rating: 5,
      content: "",
    }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    api.review.updateReview(500, { rating: 3, content: "" }),
    (e) => e.status === 403,
  );
  assert.throws(() =>
    api.review.createReview({
      reviewedMemberId: 11,
      datingRequestId: 301,
      rating: 0,
      content: "",
    }),
  );
  assert.throws(() =>
    api.review.createReview({
      reviewedMemberId: 11,
      datingRequestId: 301,
      rating: 5,
      content: "a".repeat(1001),
    }),
  );
});
test("schedule save, Korea date boundaries, calendar lookup and cancellation share one record", async () => {
  const future = new Date(Date.now() + 172800000);
  const date = api.schedule.koreanDate(future);
  const scheduledAt = `${date}T18:30:00+09:00`;
  const saved = await api.schedule.saveSchedule(42, {
    title: "카페 약속",
    scheduledAt,
    location: "후문",
  });
  assert.equal(saved.title, "카페 약속");
  const read = await api.schedule.getSchedule(42);
  assert.equal(read.id, saved.id);
  assert.equal(read.scheduledAt, scheduledAt);
  const calendar = await api.schedule.getSchedules(date, date);
  assert.equal(calendar[0].id, saved.id);
  await api.schedule.deleteSchedule(42);
  assert.equal(await api.schedule.getSchedule(42), null);
  assert.throws(() =>
    api.schedule.saveSchedule(42, {
      title: "약속",
      scheduledAt: "2000-01-01T10:00:00+09:00",
      location: "",
    }),
  );
  assert.equal(
    api.schedule.koreanDate(new Date("2026-12-01T15:30:00Z")),
    "2026-12-02",
  );
});
test("report can target a silent participant, rejects self and duplicate reports", async () => {
  const detail = await api.chat.getChatRoomDetail(44);
  assert.ok(detail.participants.some((p) => p.memberId === 9));
  const receipt = await api.chat.reportRoom(44, 9, "OTHER", "신고 내용");
  assert.equal(receipt.status, "RECEIVED");
  await assert.rejects(
    api.chat.reportRoom(44, 9, "OTHER", "신고 내용"),
    (e) => e.status === 409,
  );
  await assert.rejects(
    api.chat.reportRoom(44, 7, "ABUSE", ""),
    (e) => e.status === 400,
  );
  assert.throws(() => api.chat.reportRoom(44, 9, "OTHER", " "));
});
test("support content, inquiry receipt/history and feedback persist through typed contracts", async () => {
  assert.equal((await api.support.getNotices()).items[0].pinned, true);
  assert.ok((await api.support.getFaqs()).length);
  const receipt = await api.support.createInquiry({
    category: "CHAT",
    title: "채팅 문의",
    content: "확인 부탁해요",
  });
  assert.equal(receipt.status, "OPEN");
  assert.equal(receipt.answer, null);
  assert.equal((await api.support.getInquiries()).items[0].id, receipt.id);
  assert.ok((await api.support.sendFeedback("의견입니다")).id);
  assert.throws(() => api.support.sendFeedback(" "));
});
test("discovery returns public profile adapters and successful requests disappear from fresh recommendations", async () => {
  const first = await api.date.getDateProfilePage();
  assert.ok(first.items.every((p) => p.id !== 7));
  const partner = first.items.find((p) => p.id === 12);
  assert.equal(partner.major, "컴퓨터공학과");
  await api.date.sendDateRequest(12, "반가워요");
  assert.ok(
    !(await api.date.getDateProfilePage()).items.some((p) => p.id === 12),
  );
});
test("preview persistence restores joins, messages and read positions without real network", async () => {
  await api.community.joinCommunity(101);
  const snapshot = backend.snapshot();
  backend = createPreviewBackend(snapshot);
  assert.equal((await api.community.getCommunity(101)).joined, true);
  const sent = await api.chat.sendMessage(
    42,
    "메시지",
    "550e8400-e29b-41d4-a716-446655440000",
  );
  const duplicate = await api.chat.sendMessage(
    42,
    "메시지",
    "550e8400-e29b-41d4-a716-446655440000",
  );
  assert.equal(sent.id, duplicate.id);
  await api.chat.updateReadPosition(42, sent.id);
  assert.equal(
    (await api.chat.getChatRoomDetail(42)).participants.find(
      (p) => p.memberId === 7,
    ).lastReadMessageId,
    sent.id,
  );
});
test("password reset validates code and match, clears local session only after successful change", async () => {
  await api.account.requestPasswordReset("preview@inha.edu");
  await assert.rejects(
    api.account.confirmPasswordReset("preview@inha.edu", "654321"),
    (e) => e.status === 400,
  );
  const token = await api.account.confirmPasswordReset(
    "preview@inha.edu",
    "123456",
  );
  await api.account.resetPassword(token.resetToken, "lowercase123");
  assert.equal(api.client.getToken(), null);
});
test("concurrent expired protected requests share one refresh and retry without clearing a new session", async () => {
  const base = globalThis.fetch;
  let refresh = 0;
  const seen = new Map();
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/auth/refresh") {
      refresh++;
      await Promise.resolve();
      return base(url, init);
    }
    const count = seen.get(path) ?? 0;
    seen.set(path, count + 1);
    if (count === 0)
      return new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
      });
    return base(url, init);
  };
  await Promise.all([
    api.community.getCommunity(100),
    api.chat.getChatRoomDetail(42),
  ]);
  assert.equal(refresh, 1);
  assert.match(api.client.getToken(), /^preview-session-/);
});

class FakeSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];
  readyState = 0;
  sent = [];
  constructor(url) {
    this.url = url;
    FakeSocket.instances.push(this);
  }
  send(value) {
    this.sent.push(JSON.parse(value));
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(event) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}
test("WebSocket authenticates, subscribes, confirms UUID delivery and rejects cross-room events", async () => {
  globalThis.WebSocket = FakeSocket;
  FakeSocket.instances = [];
  const events = [];
  const states = [];
  const connection = api.chatSocket.connectChat(
    42,
    () => 100,
    (event) => events.push(event),
    (state) => states.push(state),
  );
  const socket = FakeSocket.instances[0];
  socket.open();
  assert.equal(socket.sent[0].type, "AUTH");
  assert.equal(socket.sent[0].payload.accessToken, "preview-session");
  assert.ok(!socket.url.includes("preview-session"));
  socket.receive({ type: "AUTHENTICATED", payload: {} });
  assert.deepEqual(socket.sent[1], {
    type: "SUBSCRIBE",
    roomId: 42,
    payload: { afterMessageId: 100 },
  });
  socket.receive({ type: "SUBSCRIBED", roomId: 42, payload: {} });
  assert.equal(states.at(-1), "connected");
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  const pending = connection.send("반가워요", uuid);
  assert.equal(socket.sent.at(-1).type, "SEND_MESSAGE");
  socket.receive({
    type: "MESSAGE_CREATED",
    roomId: 43,
    payload: {
      id: 101,
      roomId: 43,
      senderId: 7,
      content: "반가워요",
      clientMessageId: uuid,
      createdAt: new Date().toISOString(),
    },
  });
  assert.equal(events.length, 0);
  socket.receive({
    type: "MESSAGE_CREATED",
    roomId: 42,
    payload: {
      id: 101,
      roomId: 42,
      senderId: 7,
      content: "반가워요",
      clientMessageId: uuid,
      createdAt: new Date().toISOString(),
    },
  });
  assert.equal((await pending).id, 101);
  assert.equal(events.length, 1);
  connection.close();
});
test("WebSocket server errors retain retry identity and closing cancels pending work", async () => {
  globalThis.WebSocket = FakeSocket;
  FakeSocket.instances = [];
  const connection = api.chatSocket.connectChat(
    42,
    () => 0,
    () => {},
    () => {},
  );
  const socket = FakeSocket.instances[0];
  socket.open();
  socket.receive({ type: "AUTHENTICATED", payload: {} });
  socket.receive({ type: "SUBSCRIBED", roomId: 42, payload: {} });
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  const pending = connection.send("테스트", uuid);
  socket.receive({
    type: "ERROR",
    roomId: 42,
    payload: {
      code: "MESSAGE_TOO_LONG",
      message: "너무 길어요",
      clientMessageId: uuid,
    },
  });
  await assert.rejects(pending, /너무 길어요/);
  const retry = connection.send("테스트", uuid);
  assert.equal(socket.sent.at(-1).payload.clientMessageId, uuid);
  connection.close();
  await assert.rejects(retry, /다시 시도/);
});
