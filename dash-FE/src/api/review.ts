import { api } from "./client";
import { requireCapability } from "./capabilities";
import {
  nextCursor,
  pageQuery,
  positiveId,
  textValue,
  type CursorPage,
} from "./contracts";
export interface ReviewResponse {
  id: number;
  reviewerId: number;
  reviewerNickname: string;
  reviewedMemberId: number;
  datingRequestId: number;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}
export interface ReviewCreate {
  reviewedMemberId: number;
  datingRequestId: number;
  rating: number;
  content: string;
}
export interface ReviewSummary extends CursorPage<ReviewResponse> {
  averageRating: number | null;
  totalCount: number;
}
export interface ReviewTarget {
  datingRequestId: number;
  memberId: number;
  nickname: string;
  roomId: number;
  scheduledAt: string | null;
  canReview: boolean;
  unavailableReason: string | null;
  reviewId: number | null;
}
export function validateReview(body: ReviewCreate) {
  positiveId(body.reviewedMemberId);
  positiveId(body.datingRequestId);
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)
    throw new Error("별점을 1~5점으로 선택해주세요");
  return { ...body, content: textValue(body.content, "리뷰", 0, 1000) };
}
export function createReview(body: ReviewCreate) {
  requireCapability("reviews");
  return api.post<ReviewResponse>("/api/reviews", validateReview(body));
}
export function updateReview(
  id: number,
  body: { rating: number; content: string },
) {
  requireCapability("reviews");
  const valid = validateReview({
    ...body,
    reviewedMemberId: 1,
    datingRequestId: 1,
  });
  return api.put<ReviewResponse>(`/api/reviews/${positiveId(id)}`, {
    rating: valid.rating,
    content: valid.content,
  });
}
export function deleteReview(id: number) {
  requireCapability("reviews");
  return api.delete<void>(`/api/reviews/${positiveId(id)}`);
}
export async function getReviews(
  kind: "received" | "written",
  cursor?: number,
) {
  requireCapability("reviews");
  const page = await api.get<ReviewSummary>(
    `/api/reviews/${kind}?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return page;
}
export async function getReceivedReviews() {
  return (await getReviews("received")).items;
}
export async function getUserReviewSummary(memberId: number, cursor?: number) {
  requireCapability("reviews");
  const page = await api.get<ReviewSummary>(
    `/api/reviews/users/${positiveId(memberId)}?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return page;
}
export function getReviewTargets() {
  requireCapability("reviews");
  return api.get<ReviewTarget[]>("/api/reviews/eligible");
}
