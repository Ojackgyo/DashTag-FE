import { api } from './client';

export interface MajorResponse {
  id: number;
  name: string;
}

export interface CollegeResponse {
  id: number;
  name: string;
  majors: MajorResponse[];
}

export function getColleges(): Promise<CollegeResponse[]> {
  return api.get<CollegeResponse[]>('/api/colleges');
}
