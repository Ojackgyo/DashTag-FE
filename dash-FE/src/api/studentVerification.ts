import { api } from './client';
import { capabilities } from './capabilities';

export interface StudentVerificationResponse {
  verifiedAt: string;
  majorId?: number;
  majorName?: string;
}

export interface StudentVerificationStatusResponse {
  verified: boolean;
  majorId?: number;
  majorName?: string;
}

export function verifyStudent(studentNumber: string, name: string, studentCardImage: File, majorId?: number) {
  const body = new FormData();
  body.append('studentNumber', studentNumber);
  body.append('name', name);
  body.append('studentCardImage', studentCardImage);
  if (capabilities.studentVerificationMajor) {
    if (!Number.isInteger(majorId) || majorId! <= 0) throw new Error('학과를 선택해주세요');
    body.append('majorId', String(majorId));
  }
  return api.postForm<StudentVerificationResponse>('/api/student-verifications', body);
}

export function getStudentVerificationStatus() {
  return api.get<StudentVerificationStatusResponse>('/api/student-verifications/status');
}
