import { api } from './client';
import { hairStyleAvailable } from './profileOptions';

export interface IdealPreferenceRequest {
  faceType?: string | null;
  skinTone?: string | null;
  mbtiPattern?: string | null;
  maxYoungerAgeDiff?: number | null;
  maxOlderAgeDiff?: number | null;
  tattooPreference?: string | null;
  smokingPreference?: string | null;
  militaryPreference?: string | null;
  topSize?: string | null;
  minHeight?: number | null;
  maxHeight?: number | null;
  hairStyle?: string | null;
}

export type IdealPreferenceResponse = IdealPreferenceRequest;

export function getIdealPreference(): Promise<IdealPreferenceResponse> {
  return api.get<IdealPreferenceResponse>('/api/members/me/ideal-preference');
}

export function saveIdealPreference(body: IdealPreferenceRequest, gender?: string | null): Promise<IdealPreferenceResponse> {
  if (body.hairStyle && !hairStyleAvailable(body.hairStyle)) throw new Error('남성 장발 항목은 준비 중이에요');
  const request = gender?.toUpperCase() === 'MALE' ? { ...body, militaryPreference: 'ANY' } : body;
  return api.put<IdealPreferenceResponse>('/api/members/me/ideal-preference', request);
}
