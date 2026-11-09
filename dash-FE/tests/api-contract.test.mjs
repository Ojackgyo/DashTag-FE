import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const schema = JSON.parse(await readFile(new URL('./fixtures/openapi.json', import.meta.url), 'utf8'));
const server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
after(() => server.close());
const modules = {};
for (const name of ['client', 'auth', 'home', 'date', 'chat', 'chance', 'user', 'college', 'idealPreference', 'studentVerification', 'onboarding', 'meeting']) {
  modules[name] = await server.ssrLoadModule(`/src/api/${name}.ts`);
}
const birthdateHelpers = await server.ssrLoadModule('/src/lib/birthdate.ts');
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.window = new EventTarget();
let calls = [];
let reply;
beforeEach(() => {
  storage.clear(); calls = [];
  reply = () => ({ result: undefined });
  globalThis.fetch = async (url, init = {}) => {
    const request = { path: new URL(url).pathname, query: new URL(url).searchParams, method: init.method ?? 'GET', headers: new Headers(init.headers), body: init.body };
    calls.push(request);
    const result = await reply(request);
    return new Response(result.status === 204 ? null : result.raw ?? JSON.stringify({ isSuccess: true, code: 'SUCCESS', message: '성공', result: result.result }), { status: result.status ?? 200 });
  };
});
function documented(request) {
  const route = Object.keys(schema.paths).find(path => new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(request.path));
  assert.ok(route, `Undocumented route ${request.method} ${request.path}`);
  assert.ok(schema.paths[route][request.method.toLowerCase()], `Undocumented method ${request.method} ${route}`);
}
function matches(name, value) {
  const contract = schema.components.schemas[name];
  for (const key of contract.required ?? []) assert.ok(value[key] !== undefined && value[key] !== null, `${name}.${key} required`);
  for (const [key, entry] of Object.entries(value)) {
    const field = contract.properties[key];
    assert.ok(field, `${name}.${key} undocumented`);
    if (entry == null) continue;
    if (field.enum) assert.ok(field.enum.includes(entry), `${name}.${key}: ${entry}`);
    if (field.pattern) assert.match(entry, new RegExp(`^(?:${field.pattern})$`));
    if (field.type === 'integer') assert.ok(Number.isInteger(entry));
    if (field.minLength != null) assert.ok(entry.length >= field.minLength);
    if (field.maxLength != null) assert.ok(entry.length <= field.maxLength);
    if (field.maxItems != null) assert.ok(entry.length <= field.maxItems);
  }
}
const answers = { nickname: 'Ryan', gender: '남성', birthdate: '2000-01-02', majorId: '1', faceType: '말상', height: '180', topSize: '2XL', skinTone: '매우 밝음', hairStyle: '중간 머리', mbti: 'I,N,T,J', smoking: '가끔 피워요', tattoo: '없어요', military: '군필', charmPoints: '친절,유머', idealFaceType: '상관없어요', idealSkinTone: '밝음', idealMbti: '?,N,?,J', idealAge: '1,7', idealTattoo: '없었으면 해요', idealSmoking: '비흡연만', idealMilitary: '군필 선호해요' };
const profile = { ...modules.onboarding.buildOnboardingPayload(answers).profile, memberId: 7, completedAt: '2026-10-28T00:00:00Z' };

test('onboarding matches deployed enums, required topSize and separate age limits', () => {
  const result = modules.onboarding.buildOnboardingPayload(answers);
  matches('MemberProfileRequest', result.profile); matches('IdealPreferenceRequest', result.ideal);
  assert.equal(result.profile.topSize, 'XXL'); assert.equal(result.profile.hairStyle, 'MEDIUM_LENGTH');
  assert.equal(result.profile.militaryStatus, 'COMPLETED'); assert.equal(result.ideal.tattooPreference, 'NONE_ONLY');
  assert.equal(result.ideal.maxYoungerAgeDiff, 1); assert.equal(result.ideal.maxOlderAgeDiff, 7);
  assert.equal(result.ideal.militaryPreference, 'COMPLETED_PREFERRED');
});
test('unlimited and zero age preferences survive, female military is not applicable', () => {
  const result = modules.onboarding.buildOnboardingPayload({ ...answers, gender: '여성', idealAge: 'any,0', idealMilitary: '' });
  assert.equal(result.ideal.maxYoungerAgeDiff, null); assert.equal(result.ideal.maxOlderAgeDiff, 0);
  assert.equal(result.profile.militaryStatus, 'NOT_APPLICABLE');
  assert.equal(modules.onboarding.buildOnboardingPayload({ ...answers, military: '미필' }).profile.militaryStatus, 'NOT_SERVED');
});
test('birthdate adds separators while typing and supports deletion and pasting', () => {
  const cases = [['2','2'], ['2000','2000'], ['20000','2000-0'], ['200001','2000-01'], ['2000010','2000-01-0'], ['20000102','2000-01-02'], ['2000-01-0','2000-01-0'], ['2000.01.02','2000-01-02']];
  for (const [input, expected] of cases) assert.equal(birthdateHelpers.formatBirthdateInput(input), expected);
});
test('birthdate accepts common user formats and sends ISO date only', () => {
  for (const birthdate of ['2000.1.2', '2000/01/02', '20000102', '2000-01-02']) {
    assert.equal(modules.onboarding.buildOnboardingPayload({ ...answers, birthdate }).profile.birthdate, '2000-01-02');
  }
});
test('invalid dates, incomplete MBTI and unsupported profile enums fail before sending', () => {
  for (const change of [{ birthdate: '2000-02-30' }, { mbti: 'I,,,J' }, { topSize: '' }, { faceType: '새상' }, { hairStyle: 'PERM' }, { majorId: '' }]) {
    assert.throws(() => modules.onboarding.buildOnboardingPayload({ ...answers, ...change }));
  }
});
test('email request, confirmation, signup and login use documented bodies and public auth', async () => {
  modules.client.setTokens('old-session');
  reply = req => ({ result: req.path.endsWith('/confirm') ? { verificationToken: 'verified' } : req.path.endsWith('/signup') || req.path.endsWith('/login') ? { accessToken: 'new-session' } : null });
  await modules.auth.requestEmailVerification(' test@inha.edu ');
  await modules.auth.confirmEmailVerification('test@inha.edu', '123456');
  await modules.auth.signup('verified', 'lowercase123');
  await modules.auth.login('test@inha.edu', 'example-password');
  const names = ['EmailVerificationRequest', 'EmailVerificationConfirmRequest', 'SignupRequest', 'LoginRequest'];
  calls.forEach((call, i) => { documented(call); matches(names[i], JSON.parse(call.body)); assert.equal(call.headers.has('Authorization'), false); });
  assert.equal(modules.client.getToken(), 'new-session');
});
test('auth endpoint 401 preserves session; protected 401 clears it and retains typed status', async () => {
  modules.client.setTokens('session'); reply = () => ({ status: 401, raw: JSON.stringify({ message: '인증 오류', code: 'AUTH_FAIL' }) });
  await assert.rejects(modules.auth.signup('expired', 'password'), e => e.status === 401 && e.code === 'AUTH_FAIL');
  assert.equal(modules.client.getToken(), 'session');
  await assert.rejects(modules.chance.getChance(), e => e.status === 401);
  assert.equal(modules.client.getToken(), null);
});
test('an old failing request cannot clear a newer login', async () => {
  modules.client.setTokens('old');
  reply = () => { modules.client.setTokens('new'); return { status: 401 }; };
  await assert.rejects(modules.chance.getChance()); assert.equal(modules.client.getToken(), 'new');
});
test('profile 404 remains distinct from auth failure for onboarding routing', async () => {
  modules.client.setTokens('session'); reply = () => ({ status: 404, raw: JSON.stringify({ message: '완료된 프로필이 없음', code: 'PROFILE_NOT_FOUND' }) });
  await assert.rejects(modules.user.getMe(), e => e.status === 404 && e.code === 'PROFILE_NOT_FOUND');
  assert.equal(modules.client.getToken(), 'session');
});
test('profile load resolves major ID; edits preserve all other required fields including topSize', async () => {
  reply = req => ({ result: req.path === '/api/colleges' ? [{ id: 1, name: '공대', majors: [{ id: 1, name: '컴퓨터공학과' }, { id: 2, name: '기계공학과' }] }] : req.method === 'PUT' ? { ...JSON.parse(req.body), memberId: 7 } : profile });
  const me = await modules.user.getMe(); assert.equal(me.major, '컴퓨터공학과'); assert.equal(me.top_size, '2XL');
  await modules.user.updateMe({ nickname: 'Updated', major_id: 2, charm_points: [] });
  const body = JSON.parse(calls.find(c => c.method === 'PUT').body);
  matches('MemberProfileRequest', body); assert.equal(body.topSize, 'XXL'); assert.equal(body.majorId, 2); assert.deepEqual(body.charmPoints, []);
  assert.equal(body.smokingStatus, 'OCCASIONAL'); calls.forEach(documented);
});
test('student verification sends original file and exact multipart fields, no JSON content type', async () => {
  modules.client.setTokens('session');
  reply = req => ({ result: req.method === 'GET' ? { verified: true } : { verifiedAt: '2026-10-28T00:00:00Z' } });
  const file = new File(['original-bytes'], 'student.png', { type: 'image/png' });
  await modules.studentVerification.verifyStudent('12345678', '홍길동', file);
  assert.equal(calls[0].body.get('studentNumber'), '12345678'); assert.equal(calls[0].body.get('name'), '홍길동');
  assert.equal(await calls[0].body.get('studentCardImage').text(), 'original-bytes');
  assert.equal(calls[0].headers.has('Content-Type'), false); assert.equal(calls[0].headers.get('Authorization'), 'Bearer session');
  assert.equal((await modules.studentVerification.getStudentVerificationStatus()).verified, true); calls.forEach(documented);
});
function datingItem(id, direction) { return { id, senderId: direction === 'sent' ? 7 : 8, receiverId: direction === 'sent' ? 8 : 7, counterpart: { memberId: 8, nickname: 'Partner', age: 24, majorName: '컴퓨터공학과', faceType: 'DOG', mbti: 'ENFP' }, message: 'hello', status: 'PENDING', createdAt: '2026-10-20T00:00:00Z', respondedAt: null }; }
test('sent and received requests paginate and adapt counterpart profiles without fabricated expiry', async () => {
  reply = req => {
    const direction = req.path.endsWith('/sent') ? 'sent' : 'received';
    return { result: { items: [datingItem(req.query.has('cursor') ? 10 : 20, direction)], hasNext: !req.query.has('cursor'), nextCursor: req.query.has('cursor') ? null : 20 } };
  };
  const items = await modules.home.getDatingRequests(); assert.equal(items.length, 4); assert.equal(calls.length, 4);
  assert.equal(items.find(i => i.from_user)?.from_user.nickname, 'Partner'); assert.equal(items.find(i => i.to_user)?.to_user.major, '컴퓨터공학과');
  assert.ok(items.every(i => i.status === 'pending' && !('expires_at' in i))); calls.forEach(documented);
});
test('dating create uses receiverId; accept returns exact chatRoomId; reject has no body', async () => {
  reply = req => ({ result: req.path.endsWith('/accept') ? { requestId: 3, status: 'ACCEPTED', chatRoomId: 42 } : { id: 3, status: 'PENDING' } });
  await modules.date.sendDateRequest(8, '안녕하세요'); matches('DatingRequestCreateRequest', JSON.parse(calls[0].body));
  assert.equal(JSON.parse(calls[0].body).receiverId, 8);
  assert.equal((await modules.home.acceptDatingRequest(3)).chatRoomId, 42);
  await modules.home.rejectDatingRequest(4); assert.equal(calls[2].body, undefined); calls.forEach(documented);
});
test('chance preserves both remaining count and recovery timestamps', async () => {
  const expected = { hasChance: true, remainingCount: 2, maxCount: 2, rechargeAt: [] };
  reply = () => ({ result: expected }); assert.deepEqual(await modules.chance.getChance(), expected); calls.forEach(documented);
});
function message(id) { return { id, roomId: 42, senderId: 7, content: `message ${id}`, clientMessageId: '550e8400-e29b-41d4-a716-446655440000', createdAt: '2026-10-28T00:00:00Z' }; }
test('chat retry keeps the same clientMessageId and server message identity', async () => {
  reply = () => ({ result: message(100) });
  const id = '550e8400-e29b-41d4-a716-446655440000';
  const first = await modules.chat.sendMessage(42, '안녕', id); const second = await modules.chat.sendMessage(42, '안녕', id);
  assert.equal(first.id, second.id); assert.equal(first.sender_id, 7); assert.equal(first.client_message_id, id);
  for (const req of calls) { documented(req); matches('SendMessageRequest', JSON.parse(req.body)); assert.equal(JSON.parse(req.body).clientMessageId, id); }
});
test('chat catches up across pages instead of dropping messages between polls', async () => {
  reply = req => ({ result: req.query.has('cursor') ? { messages: [message(49), message(50), message(51)], nextCursor: 49, hasNext: true } : { messages: [message(52), message(53)], nextCursor: 52, hasNext: true } });
  assert.deepEqual((await modules.chat.getNewChatMessages(42, 50)).map(m => m.id), [51, 52, 53]);
  assert.equal(calls[1].query.get('cursor'), '52'); calls.forEach(documented);
});
test('chat rooms and ideal preference use deployed contracts', async () => {
  const ideal = modules.onboarding.buildOnboardingPayload(answers).ideal;
  reply = req => ({ result: req.path === '/api/chat-rooms' ? [{ id: 42, roomType: 'DATING', name: '소개팅', createdAt: '2026-10-28T00:00:00Z' }] : ideal });
  assert.equal((await modules.chat.getChatRooms())[0].room_type, 'dating');
  assert.deepEqual(await modules.idealPreference.getIdealPreference(), ideal);
  await modules.idealPreference.saveIdealPreference(ideal); matches('IdealPreferenceRequest', JSON.parse(calls[2].body)); calls.forEach(documented);
});
test('non-progressing pagination fails instead of looping indefinitely', async () => {
  reply = () => ({ result: { messages: [message(52)], nextCursor: 52, hasNext: true } });
  await assert.rejects(modules.chat.getNewChatMessages(42, 1), /다음 페이지/); assert.equal(calls.length, 2);
});

function meeting(id = 20, joined = false) {
  return { id, creatorId: 7, title: '카페 미팅', requiredMale: 2, requiredFemale: 3,
    scheduledAt: '2099-12-01T18:30:00', active: true, createdAt: '2026-11-09T12:00:00',
    participantCount: 1, maleCount: 1, femaleCount: 0, joined,
    inviteCode: joined ? '0123456789ABCDEF0123456789ABCDEF' : null, chatRoomId: joined ? 42 : null };
}
test('meeting cursor pages, details and public participants adapt camelCase fields', async () => {
  reply = req => ({ result: req.path.endsWith('/participants') ? [{ memberId: 7, nickname: '개설자', gender: 'MALE', faceType: 'DOG', mbti: 'INTJ', charmPoints: ['친절'], joinedAt: '2026-11-09T12:00:00' }]
    : req.path === '/api/meetings' ? { items: [meeting(req.query.has('cursor') ? 10 : 20)], nextCursor: req.query.has('cursor') ? null : 20, hasNext: !req.query.has('cursor') }
    : meeting(20, true) });
  const first = await modules.meeting.getMeetingPage();
  assert.equal(first.items[0].required_female, 3); assert.equal(first.items[0].male_count, 1);
  assert.equal(first.items[0].is_joined, false); assert.equal(first.items[0].invite_code, null);
  assert.equal(first.items[0].chat_room_id, null); assert.deepEqual(first.items[0].keywords, []);
  const second = await modules.meeting.getMeetingPage(first.nextCursor);
  assert.equal(second.items[0].id, 10); assert.equal(second.hasNext, false); assert.equal(calls[1].query.get('cursor'), '20');
  const detail = await modules.meeting.getMeeting(20); assert.equal(detail.chat_room_id, 42); assert.equal(detail.creator_id, 7);
  const participants = await modules.meeting.getMeetingParticipants(20);
  assert.equal(participants[0].user_id, 7); assert.equal(participants[0].gender, 'male'); assert.equal(participants[0].face_type, 'DOG'); assert.deepEqual(participants[0].charm_points, ['친절']);
  calls.forEach(documented);
});
test('meeting creation sends only the new required contract and Korean local schedule', async () => {
  const { participantCount, maleCount, femaleCount, joined, ...created } = meeting(21, true);
  reply = () => ({ status: 201, result: created });
  const result = await modules.meeting.createMeeting({ title: ' 카페 미팅 ', required_male: 2, required_female: 3, scheduled_at: '2099-12-01T18:30:00' });
  assert.equal(result.id, 21); assert.equal(result.chat_room_id, 42);
  assert.deepEqual(JSON.parse(calls[0].body), { title: '카페 미팅', requiredMale: 2, requiredFemale: 3, scheduledAt: '2099-12-01T18:30:00' });
  matches('MeetingCreateRequest', JSON.parse(calls[0].body)); calls.forEach(documented);
});
test('meeting join, normalized invite code and leave use documented operations', async () => {
  reply = req => req.method === 'DELETE' ? { status: 204, raw: '' } : { result: meeting(20, true) };
  assert.equal((await modules.meeting.joinMeeting(20)).is_joined, true); assert.equal(calls[0].body, undefined);
  const result = await modules.meeting.joinMeetingByCode('  0123456789abcdef0123456789abcdef  ');
  assert.equal(result.chat_room_id, 42);
  assert.deepEqual(JSON.parse(calls[1].body), { inviteCode: '0123456789ABCDEF0123456789ABCDEF' });
  matches('MeetingJoinByCodeRequest', JSON.parse(calls[1].body));
  await modules.meeting.leaveMeeting(20); assert.equal(calls[2].method, 'DELETE'); calls.forEach(documented);
});
test('invalid meeting inputs and non-progressing cursors fail without a mutation', async () => {
  for (const code of ['bad', 'G'.repeat(32), 'A'.repeat(31)]) await assert.rejects(modules.meeting.joinMeetingByCode(code), /초대코드/);
  for (const patch of [{ title: ' ' }, { required_male: 1 }, { required_female: 6 }, { scheduled_at: '2000-01-01T18:00:00' }, { scheduled_at: '2099-12-01T18:30:00Z' }]) {
    await assert.rejects(modules.meeting.createMeeting({ title: '카페', required_male: 2, required_female: 2, scheduled_at: '2099-12-01T18:30:00', ...patch }));
  }
  assert.equal(calls.length, 0);
  reply = () => ({ result: { items: [], nextCursor: 20, hasNext: true } });
  await assert.rejects(modules.meeting.getMeetingPage(20), /다음 페이지/);
});
test('meeting capacity and chance errors preserve server messages and session', async () => {
  modules.client.setTokens('session');
  reply = () => ({ status: 409, raw: JSON.stringify({ code: 'MEETING_FULL', message: '성별 정원이 찼어요' }) });
  await assert.rejects(modules.meeting.joinMeeting(20), e => e.status === 409 && e.code === 'MEETING_FULL' && e.message === '성별 정원이 찼어요');
  assert.equal(modules.client.getToken(), 'session');
});
test('chat room preview and unread count retain server values including empty rooms', async () => {
  reply = () => ({ result: [
    { id: 42, roomType: 'MEETING', name: '카페', createdAt: '2026-11-09T12:00:00', lastMessageId: 100, lastMessageContent: '반가워요', lastMessageAt: '2026-11-09T13:00:00', unreadCount: 3 },
    { id: 43, roomType: 'DATING', name: '대쉬', createdAt: '2026-11-09T12:00:00', lastMessageId: null, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 },
  ] });
  const rooms = await modules.chat.getChatRooms();
  assert.equal(rooms[0].room_type, 'meeting'); assert.equal(rooms[0].last_message, '반가워요'); assert.equal(rooms[0].unread_count, 3); assert.equal(rooms[0].last_message_id, 100);
  assert.equal(rooms[1].last_message, null); assert.equal(rooms[1].unread_count, 0); calls.forEach(documented);
});
test('chat read position uses PATCH and accepts a higher stored position from the server', async () => {
  reply = () => ({ result: { roomId: 42, lastReadMessageId: 110 } });
  assert.deepEqual(await modules.chat.updateReadPosition(42, 100), { roomId: 42, lastReadMessageId: 110 });
  assert.equal(calls[0].method, 'PATCH'); assert.equal(calls[0].path, '/api/chat-rooms/42/read-position');
  matches('UpdateReadPositionRequest', JSON.parse(calls[0].body)); calls.forEach(documented);
});
test('new ideal preferences normalize XXL, retain fields on save and clear limits with null', async () => {
  const ideal = modules.onboarding.buildOnboardingPayload({ ...answers, idealTopSize: '2XL', idealMinHeight: '160', idealMaxHeight: '185', idealHairStyle: '긴 머리' }).ideal;
  assert.equal(ideal.topSize, 'XXL'); assert.equal(ideal.hairStyle, 'LONG'); assert.equal(ideal.minHeight, 160); assert.equal(ideal.maxHeight, 185); matches('IdealPreferenceRequest', ideal);
  reply = req => ({ result: req.method === 'PUT' ? JSON.parse(req.body) : ideal });
  assert.deepEqual(await modules.idealPreference.saveIdealPreference(await modules.idealPreference.getIdealPreference()), ideal);
  const cleared = modules.onboarding.buildOnboardingPayload({ ...answers, idealTopSize: '상관없어요', idealHairStyle: '상관없어요', idealMinHeight: '', idealMaxHeight: '' }).ideal;
  for (const key of ['topSize', 'hairStyle', 'minHeight', 'maxHeight']) assert.equal(cleared[key], null);
  for (const extra of [{ idealMinHeight: '190', idealMaxHeight: '150' }, { idealMinHeight: '-1' }, { idealMaxHeight: 'NaN' }, { idealTopSize: '3XL' }]) assert.throws(() => modules.onboarding.buildOnboardingPayload({ ...answers, ...extra }));
  calls.forEach(documented);
});
