import { api } from './client';

export interface StudentVerificationResponse {
  verifiedAt: string;
}

export interface StudentVerificationStatusResponse {
  verified: boolean;
}

export function verifyStudent(studentNumber: string, name: string, studentCardImage: File) {
  const body = new FormData();
  body.append('studentNumber', studentNumber);
  body.append('name', name);
  body.append('studentCardImage', studentCardImage);
  return api.postForm<StudentVerificationResponse>('/api/student-verifications', body);
}

export function getStudentVerificationStatus() {
  return api.get<StudentVerificationStatusResponse>('/api/student-verifications/status');
}
