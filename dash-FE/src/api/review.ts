import { api } from './client';

export interface ReviewCreate {
  reviewed_user_id: number;
  rating: number;
  dating_request_id?: number | null;
  content?: string | null;
}

export interface ReviewResponse {
  id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  dating_request_id?: number | null;
  rating: number;
  content?: string | null;
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_count: number;
  reviews: ReviewResponse[];
}

// POST /api/reviews
export function createReview(body: ReviewCreate): Promise<ReviewResponse> {
  return api.post<ReviewResponse>('/api/reviews', body);
}

// GET /api/reviews/received
export function getReceivedReviews(): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>('/api/reviews/received');
}

// GET /api/reviews/users/{userId}
export function getUserReviewSummary(userId: number): Promise<ReviewSummary> {
  return api.get<ReviewSummary>(`/api/reviews/users/${userId}`);
}
