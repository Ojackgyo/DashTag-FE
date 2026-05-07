import { api } from './client';

export type GroupGender = '남' | '여' | '혼성';

export interface Group {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  tags: string[];
  gender: GroupGender;
  maxMembers: number;
  currentMembers: number;
  active: boolean;
  isMine: boolean;
}

export interface GroupMember {
  userId: string;
  nickname: string;
  emoji: string;
  location: string;
  info: string;          // ex. "99년생 남"
}

export interface GroupSchedule {
  id: string;
  title: string;
  time: string;          // ex. "토 오후 3:00"
  enrolled: number;
  max: number;
  isRecruiting: boolean;
  isEnded?: boolean;
}

export interface GroupDetail extends Group {
  location: string;
  openedAt: string;
  ageRange: string;
  description: string;
  members: GroupMember[];
  schedules: GroupSchedule[];
  leader: {
    userId: string;
    nickname: string;
    emoji: string;
    temp: string;
    duration: string;
  };
  recentJoins: number;
}

export interface CreateGroupBody {
  emoji: string;
  title: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  gender: GroupGender;
  category: string;
  location: string;
}

export interface GroupFilters {
  gender?: '남' | '여';
  tag?: string;
  search?: string;
}

export interface AddScheduleBody {
  title: string;
  time: string;
  max: number;
}

// GET /groups?gender=&tag=&search=
export function getGroups(filters?: GroupFilters): Promise<Group[]> {
  const params = new URLSearchParams();
  if (filters?.gender) params.set('gender', filters.gender);
  if (filters?.tag)    params.set('tag', filters.tag);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return api.get<Group[]>(`/groups${qs ? `?${qs}` : ''}`);
}

// GET /groups/:id
// 소모임 상세 (멤버, 일정, 방장 정보 포함)
export function getGroupDetail(id: string): Promise<GroupDetail> {
  return api.get<GroupDetail>(`/groups/${id}`);
}

// POST /groups
// 소모임 개설
export function createGroup(body: CreateGroupBody): Promise<Group> {
  return api.post<Group>('/groups', body);
}

// POST /groups/:id/join
// 소모임 참여 신청
export function joinGroup(id: string): Promise<{ status: 'joined' | 'pending' }> {
  return api.post<{ status: 'joined' | 'pending' }>(`/groups/${id}/join`);
}

// PATCH /groups/:id/active
// 활성화/비활성화 토글 (방장만)
export function toggleGroupActive(id: string, active: boolean): Promise<Group> {
  return api.patch<Group>(`/groups/${id}/active`, { active });
}

// DELETE /groups/:id
// 소모임 삭제 (방장만)
export function deleteGroup(id: string): Promise<void> {
  return api.delete<void>(`/groups/${id}`);
}

/* ── 방장 전용 ── */

// GET /groups/:id/members/pending
// 가입 신청 대기 목록
export function getPendingMembers(id: string): Promise<GroupMember[]> {
  return api.get<GroupMember[]>(`/groups/${id}/members/pending`);
}

// POST /groups/:id/members/:userId/approve
// 가입 신청 수락
export function approveMember(groupId: string, userId: string): Promise<void> {
  return api.post<void>(`/groups/${groupId}/members/${userId}/approve`);
}

// POST /groups/:id/members/:userId/reject
// 가입 신청 거절
export function rejectMember(groupId: string, userId: string): Promise<void> {
  return api.post<void>(`/groups/${groupId}/members/${userId}/reject`);
}

// DELETE /groups/:id/members/:userId
// 멤버 내보내기
export function kickMember(groupId: string, userId: string): Promise<void> {
  return api.delete<void>(`/groups/${groupId}/members/${userId}`);
}

// POST /groups/:id/schedules
// 일정 추가
export function addSchedule(groupId: string, body: AddScheduleBody): Promise<GroupSchedule> {
  return api.post<GroupSchedule>(`/groups/${groupId}/schedules`, body);
}

// DELETE /groups/:id/schedules/:scheduleId
// 일정 삭제
export function deleteSchedule(groupId: string, scheduleId: string): Promise<void> {
  return api.delete<void>(`/groups/${groupId}/schedules/${scheduleId}`);
}
