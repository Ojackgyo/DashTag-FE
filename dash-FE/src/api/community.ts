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
