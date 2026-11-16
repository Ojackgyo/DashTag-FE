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
const deployedSpec = JSON.parse(
  await readFile(new URL("./fixtures/openapi.json", import.meta.url), "utf8"),
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
function validate(schema, value, document = spec) {
  if (schema.$ref)
    return validate(
      document.components.schemas[schema.$ref.split("/").at(-1)],
      value,
      document,
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
      if (
        entry === null &&
        document === deployedSpec &&
        !(schema.required ?? []).includes(key)
      )
        continue;
      if (schema.properties[key])
        validate(schema.properties[key], entry, document);
    }
  }
  if (schema.type === "array") {
    assert.ok(Array.isArray(value));
    for (const entry of value) validate(schema.items, entry, document);
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
    const document = Object.entries(deployedSpec.paths).some(
      ([path, methods]) =>
        methods[method] &&
        new RegExp("^" + path.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(
          u.pathname,
        ),
    )
      ? deployedSpec
      : spec;
    const route = Object.keys(document.paths).find((path) =>
      new RegExp("^" + path.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(
        u.pathname,
      ),
    );
    const operation = document.paths[route]?.[method];
    if (operation?.requestBody)
      validate(
        operation.requestBody.content["application/json"].schema,
        JSON.parse(init.body),
        document,
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
      validate(Object.values(success.content)[0].schema, body, document);
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
  assert.equal(changed.status, "RECRUITING");
  await api.community.setCommunityStatus(created.id, false);
  assert.equal((await api.community.getCommunity(created.id)).active, false);
  assert.equal(
    (await api.chat.getChatRoomDetail(created.chatRoomId)).room.name,
    "새 책모임",
  );
});
test("community joins link the exact room, preserve chances and block duplicate joins", async () => {
  const joined = await api.community.joinCommunity(101);
  assert.equal(joined.joined, true);
  assert.ok(joined.chatRoomId);
  await assert.rejects(
    api.community.joinCommunity(101),
    (e) => e.status === 409,
  );
  assert.throws(() => api.community.leaveCommunity(101), /서버 연결/);
  assert.equal((await api.client.api.get("/api/chances")).remainingCount, 2);
});
test("community removal and recruitment status preserve existing chat and allow reopening", async () => {
  const before = await api.community.getCommunityDashboard(100);
  assert.equal(before.members.length, 3);
  await api.community.removeCommunityMember(100, 8);
  const after = await api.community.getCommunityDashboard(100);
  assert.equal(after.members.length, 2);
  await assert.rejects(
    api.community.removeCommunityMember(100, 7),
    (e) => e.status === 403,
  );
  const closed = await api.community.closeCommunity(100);
  assert.equal(closed.status, "PAUSED");
  assert.equal(
    (await api.chat.getChatRooms()).some((r) => r.id === closed.chatRoomId),
    true,
  );
  assert.equal(
    (await api.community.getCommunities()).items.some((g) => g.id === 100),
    false,
  );
  assert.equal(
    (await api.community.setCommunityStatus(100, true)).active,
    true,
  );
});
test("community deployed limits reject invalid fields and omit unsupported capacity and status fields", async () => {
  const input = {
    emoji: "☕",
    title: "모임",
    description: "",
    tags: [],
    gender: "ANY",
    maxMembers: 10,
  };
  for (const patch of [
    { title: " " },
    { title: "a".repeat(25) },
    { description: "a".repeat(501) },
    { gender: "ALL" },
    { tags: ["a", "b", "c", "d", "e", "f"] },
  ])
    assert.throws(() => api.community.createCommunity({ ...input, ...patch }));
  assert.equal(calls.length, 0);
  await api.community.updateCommunity(100, { ...input, active: false });
  assert.deepEqual(Object.keys(JSON.parse(calls[0].body)).sort(), [
    "description",
    "emoji",
    "tags",
    "title",
  ]);
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
test("review targets come from accepted requests and creation uses ten-point units without a target member field", async () => {
  const targets = await api.review.getReviewTargets();
  assert.deepEqual(targets.map((t) => t.datingRequestId).sort(), [300, 301]);
  const input = {
    reviewedMemberId: 11,
    datingRequestId: 301,
    rating: 5,
    content: "좋았어요",
  };
  const created = await api.review.createReview(input);
  assert.equal(created.rating, 5);
  const body = JSON.parse(calls.find((c) => c.path === "/api/reviews").body);
  assert.deepEqual(body, {
    datingRequestId: 301,
    rating: 50,
    content: "좋았어요",
  });
  await assert.rejects(
    api.review.createReview(input),
    (e) => e.status === 409 && e.code === "REVIEW_DUPLICATE",
  );
  const received = await api.review.getReviews("received");
  assert.equal(received.totalCount, 1);
  assert.equal(received.averageRating, 4);
  assert.equal(received.items[0].rating, 4);
});
test("reviews preserve eligibility failures and block undeployed editing and deletion", async () => {
  await assert.rejects(
    api.review.createReview({
      reviewedMemberId: 8,
      datingRequestId: 300,
      rating: 5,
      content: "",
    }),
    (e) => e.status === 403,
  );
  assert.throws(
    () => api.review.updateReview(500, { rating: 3, content: "" }),
    /서버 연결/,
  );
  assert.throws(() => api.review.deleteReview(500), /서버 연결/);
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
test("schedule save uses Korea local time, room permissions and the deployed home routes", async () => {
  const future = new Date(Date.now() + 172800000);
  const date = api.schedule.koreanDate(future);
  const scheduledAt = `${date}T18:30:00+09:00`;
  await api.schedule.saveSchedule(42, {
    title: "카페 약속",
    scheduledAt,
    location: "후문",
  });
  assert.deepEqual(JSON.parse(calls[0].body), {
    scheduledAt: `${date}T18:30:00`,
  });
  const read = await api.schedule.getSchedule(42);
  assert.equal(read.scheduledAt, scheduledAt);
  assert.equal(read.canEdit, true);
  const calendar = await api.schedule.getSchedules(date, date);
  assert.equal(calendar.find((s) => s.roomId === 42).scheduledAt, scheduledAt);
  assert.ok(
    (await api.schedule.getUpcomingSchedules()).some((s) => s.roomId === 42),
  );
  assert.throws(() => api.schedule.deleteSchedule(42), /서버 연결/);
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
