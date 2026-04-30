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

export interface CreateGroupBody {
  emoji: string;
  title: string;
  subtitle: string;
  tags: string[];
  gender: GroupGender;
}

export interface GroupFilters {
  gender?: '남' | '여';   // 없으면 전체
  tag?: string;
  search?: string;
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

// POST /groups
// 소모임 개설
export function createGroup(body: CreateGroupBody): Promise<Group> {
  return api.post<Group>('/groups', body);
}

// POST /groups/:id/join
// 소모임 참여
export function joinGroup(id: string): Promise<Group> {
  return api.post<Group>(`/groups/${id}/join`);
}

// PATCH /groups/:id/active
// 활성화/비활성화 토글 (본인 소모임만)
export function toggleGroupActive(id: string, active: boolean): Promise<Group> {
  return api.patch<Group>(`/groups/${id}/active`, { active });
}

// DELETE /groups/:id
// 소모임 삭제 (본인만)
export function deleteGroup(id: string): Promise<void> {
  return api.delete<void>(`/groups/${id}`);
}
