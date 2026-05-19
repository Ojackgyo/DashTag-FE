import { api } from './client';

export interface CommunityResponse {
  id: number;
  creator_id: number;
  emoji: string;
  title: string;
  description?: string | null;
  tags: string[];
  gender: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
  is_joined: boolean;
}

export interface CommunityCreate {
  emoji?: string;
  title: string;
  description?: string | null;
  tags?: string[];
  gender?: string;
}

export interface CommunityUpdate {
  emoji?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  gender?: string | null;
  is_active?: boolean | null;
}

// GET /api/communities
export function getCommunities(): Promise<CommunityResponse[]> {
  return api.get<CommunityResponse[]>('/api/communities');
}

// POST /api/communities
export function createCommunity(body: CommunityCreate): Promise<CommunityResponse> {
  return api.post<CommunityResponse>('/api/communities', body);
}

// GET /api/communities/{id}
export function getCommunity(id: number): Promise<CommunityResponse> {
  return api.get<CommunityResponse>(`/api/communities/${id}`);
}

// PUT /api/communities/{id}
export function updateCommunity(id: number, body: CommunityUpdate): Promise<CommunityResponse> {
  return api.put<CommunityResponse>(`/api/communities/${id}`, body);
}

// POST /api/communities/{id}/join
export function joinCommunity(id: number): Promise<CommunityResponse> {
  return api.post<CommunityResponse>(`/api/communities/${id}/join`);
}

export interface CommunityMemberInfo {
  user_id: number;
  nickname: string;
  age?: number | null;
  major?: string | null;
  gender?: string | null;
  joined_at: string;
}

export interface CommunityDashboard {
  id: number;
  title: string;
  emoji: string;
  member_count: number;
  male_count: number;
  female_count: number;
  is_active: boolean;
  members: CommunityMemberInfo[];
}

// GET /api/communities/{id}/dashboard
export function getCommunityDashboard(id: number): Promise<CommunityDashboard> {
  return api.get<CommunityDashboard>(`/api/communities/${id}/dashboard`);
}

// DELETE /api/communities/{id}/members/{userId}
export function removeCommunityMember(communityId: number, userId: number): Promise<void> {
  return api.delete<void>(`/api/communities/${communityId}/members/${userId}`);
}
