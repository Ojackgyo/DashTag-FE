import { api } from './client';

export interface IdealPreferenceRequest {
  faceType?: string | null;
  skinTone?: string | null;
  mbtiPattern?: string | null;
  maxAgeDiff?: number | null;
  tattooPreference?: string | null;
  smokingPreference?: string | null;
  militaryPreference?: string | null;
}

export type IdealPreferenceResponse = IdealPreferenceRequest;

export function getIdealPreference(): Promise<IdealPreferenceResponse> {
  return api.get<IdealPreferenceResponse>('/api/members/me/ideal-preference');
}

export function saveIdealPreference(body: IdealPreferenceRequest): Promise<IdealPreferenceResponse> {
  return api.put<IdealPreferenceResponse>('/api/members/me/ideal-preference', body);
}
