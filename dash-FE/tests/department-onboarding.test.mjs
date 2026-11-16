import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  cacheDir: '/private/tmp/dashtag-department-tests-cache',
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  define: { 'import.meta.env.VITE_ENABLED_FEATURES': JSON.stringify('departmentMeetings,studentVerificationMajor,hairLengthCategories,accountWithdrawal') },
  appType: 'custom',
});
after(() => server.close());
const api = {};
for (const name of ['client', 'meeting', 'studentVerification', 'profileOptions', 'account']) api[name] = await server.ssrLoadModule(`/src/api/${name}.ts`);
const { createPreviewBackend } = await server.ssrLoadModule('/src/preview/server.ts');
const storage = new Map();
globalThis.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) };
globalThis.window = new EventTarget();
let backend;
let calls;
beforeEach(() => {
  storage.clear();
  backend = createPreviewBackend();
  calls = [];
  api.client.setTokens('preview-session');
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), ...init });
    return backend.response(new URL(url).pathname + new URL(url).search, init);
  };
});
const future = '2099-12-01T18:00:00';
const create = { title: '컴공 × 기계 과팅', required_male: 2, required_female: 2, scheduled_at: future, meeting_type: 'DEPARTMENT', host_major_id: 1, target_major_id: 2 };
function fixture(hostMajorId, targetMajorId) {
  const state = backend.snapshot();
  state.meetings[0].meetingType = 'DEPARTMENT';
  state.meetings[0].hostMajorId = hostMajorId;
  state.meetings[0].targetMajorId = targetMajorId;
  state.members.find(m => m.memberId === state.meetings[0].creatorId).majorId = hostMajorId;
  backend = createPreviewBackend(state);
  return state.meetings[0];
}

test('department creation preserves classification and two departments; normal meeting clears department fields', async () => {
  const result = await api.meeting.createMeeting(create);
  assert.equal(result.meeting_type, 'DEPARTMENT');
  assert.equal(result.host_major_name, '컴퓨터공학과');
  assert.equal(result.target_major_id, 2);
  const body = JSON.parse(calls[0].body);
  assert.equal(body.meetingType, 'DEPARTMENT');
  assert.equal(body.hostMajorId, 1);
  assert.equal(body.targetMajorId, 2);
  await api.meeting.createMeeting({ ...create, meeting_type: 'MEETING' });
  assert.equal(JSON.parse(calls[1].body).targetMajorId, null);
});

test('department creation rejects missing, same, and forged owner departments without spending chances', async () => {
  for (const target_major_id of [undefined, 0, 1]) await assert.rejects(() => api.meeting.createMeeting({ ...create, target_major_id }));
  assert.equal(calls.length, 0);
  const before = backend.snapshot();
  await assert.rejects(() => api.meeting.createMeeting({ ...create, host_major_id: 3 }), e => e.status === 403 && e.code === 'MAJOR_NOT_ALLOWED');
  assert.deepEqual(backend.snapshot().chanceUses, before.chanceUses);
  assert.deepEqual(backend.snapshot().meetings, before.meetings);
});

test('unrelated departments are disabled and rejected through both ID and invite-code entry', async () => {
  const original = fixture(2, 3);
  const before = backend.snapshot();
  const meeting = await api.meeting.getMeeting(original.id);
  assert.equal(meeting.can_join, false);
  assert.match(api.meeting.meetingJoinBlock(meeting, { gender: 'male', major_id: 1 }), /해당 학과/);
  for (const join of [() => api.meeting.joinMeeting(original.id), () => api.meeting.joinMeetingByCode(original.inviteCode)]) await assert.rejects(join, e => e.status === 403 && e.code === 'MAJOR_NOT_ALLOWED');
  assert.deepEqual(backend.snapshot().chanceUses, before.chanceUses);
  assert.deepEqual(backend.snapshot().rooms, before.rooms);
  assert.deepEqual(backend.snapshot().meetings, before.meetings);
});

test('both designated departments can join while unknown majors, full teams, and closed rooms remain blocked', async () => {
  const original = fixture(2, 1);
  const meeting = await api.meeting.getMeeting(original.id);
  const block = api.meeting.meetingJoinBlock;
  assert.equal(block(meeting, { gender: 'male', major_id: 1 }), null);
  assert.equal(block(meeting, { gender: 'male', major_id: 2 }), null);
  assert.match(block(meeting, { gender: 'male' }), /학과 확인/);
  assert.match(block({ ...meeting, male_count: meeting.required_male }, { gender: 'male', major_id: 1 }), /정원/);
  assert.match(block({ ...meeting, is_active: false }, { gender: 'male', major_id: 1 }), /마감/);
  assert.equal(block({ ...meeting, is_joined: true, is_active: false }, { gender: 'male', major_id: 1 }), null);
  assert.equal(block({ ...meeting, meeting_type: 'MEETING' }, { gender: 'male', major_id: 3 }), null);
  const joined = await api.meeting.joinMeetingByCode(original.inviteCode);
  assert.equal(joined.is_joined, true);
  assert.ok(joined.chat_room_id);
});

test('student verification submits major ID with original image and restores authoritative department on resume', async () => {
  const file = new File(['original'], 'student.png', { type: 'image/png' });
  assert.throws(() => api.studentVerification.verifyStudent('12345678', '홍길동', file), /학과/);
  assert.equal(calls.length, 0);
  const result = await api.studentVerification.verifyStudent('12345678', '홍길동', file, 2);
  assert.deepEqual([...calls[0].body.keys()].sort(), ['majorId', 'name', 'studentCardImage', 'studentNumber']);
  assert.equal(calls[0].body.get('majorId'), '2');
  assert.equal(await calls[0].body.get('studentCardImage').text(), 'original');
  assert.equal(result.majorId, 2);
  const status = await api.studentVerification.getStudentVerificationStatus();
  assert.equal(status.verified, true);
  assert.equal(status.majorName, '기계공학과');
});

test('proposed profile endpoint rejects changing verified department even with a manually crafted request', async () => {
  const before = backend.snapshot().members.find(m => m.memberId === 7);
  const response = await backend.response('/api/members/me/profile', { method: 'PUT', body: JSON.stringify({ ...before, majorId: 2 }) });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, 'VERIFIED_MAJOR_IMMUTABLE');
  assert.deepEqual(backend.snapshot().members.find(m => m.memberId === 7), before);
});

test('new male long-hair category remains distinct from the female long-hair category', () => {
  const p = api.profileOptions;
  assert.equal(p.hairStyleValue(p.hairStylesFor('MALE'), '장발'), 'VERY_LONG');
  assert.equal(p.hairStyleValue(p.hairStylesFor('FEMALE'), '장발'), 'LONG');
  assert.equal(p.hairStyleValue(p.hairStylesFor('FEMALE'), '중단발'), 'MEDIUM_LENGTH');
  assert.equal(p.hairStyleValue(p.idealHairStylesFor('FEMALE'), '긴 기장 머리'), 'LONG');
});

test('withdrawal requires a password and leaves authentication blocked after server success', async () => {
  assert.throws(() => api.account.withdrawAccount(''), /비밀번호/);
  assert.equal(calls.length, 0);
  await api.account.withdrawAccount('preview-password');
  assert.deepEqual(JSON.parse(calls[0].body), { password: 'preview-password', confirmation: 'WITHDRAW' });
  assert.equal(backend.snapshot().withdrawn, true);
  for (const path of ['/api/members/me/profile', '/api/auth/login', '/api/auth/refresh']) {
    assert.equal((await backend.response(path, { method: 'POST' })).status, 401);
  }
});
