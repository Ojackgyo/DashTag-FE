import { api } from "./client";
import { capabilities, requireCapability } from "./capabilities";
import { getDatingRequests } from "./home";
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
  const valid = validateReview(body);
  return api
    .post<ReviewResponse>("/api/reviews", {
      datingRequestId: valid.datingRequestId,
      rating: valid.rating * 10,
      content: valid.content,
    })
    .then(adaptReview);
}
export function updateReview(
  id: number,
  body: { rating: number; content: string },
) {
  requireCapability("reviewManagement");
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
  requireCapability("reviewManagement");
  return api.delete<void>(`/api/reviews/${positiveId(id)}`);
}
function adaptReview(review: ReviewResponse): ReviewResponse {
  return {
    ...review,
    rating: review.rating >= 10 ? review.rating / 10 : review.rating,
    canEdit: capabilities.reviewManagement && review.canEdit,
    canDelete: capabilities.reviewManagement && review.canDelete,
  };
}
export async function getReviews(
  kind: "received" | "written",
  cursor?: number,
): Promise<ReviewSummary> {
  requireCapability(kind === "written" ? "reviewManagement" : "reviews");
  const [page, summary] = await Promise.all([
    api.get<CursorPage<ReviewResponse>>(
      `/api/reviews/${kind}?${pageQuery({ cursor })}`,
    ),
    kind === "received"
      ? api.get<{ averageRating: number; totalCount: number }>(
          "/api/reviews/received/summary",
        )
      : Promise.resolve(null),
  ]);
  nextCursor(page, cursor);
  const average = summary?.averageRating ?? null;
  return {
    ...page,
    items: page.items.map(adaptReview),
    averageRating: average == null ? null : average / 10,
    totalCount: summary?.totalCount ?? page.items.length,
  };
}
export async function getReceivedReviews() {
  return (await getReviews("received")).items;
}
export async function getUserReviewSummary(memberId: number, cursor?: number) {
  requireCapability("publicReviews");
  const page = await api.get<ReviewSummary>(
    `/api/reviews/users/${positiveId(memberId)}?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return page;
}
export async function getReviewTargets(): Promise<ReviewTarget[]> {
  requireCapability("reviews");
  const requests = await getDatingRequests();
  return requests
    .filter((r) => r.status === "accepted")
    .map((r) => {
      const counterpart = r.from_user ?? r.to_user;
      return {
        datingRequestId: r.id,
        memberId: counterpart!.id,
        nickname: counterpart!.nickname,
        roomId: 0,
        scheduledAt: null,
        canReview: true,
        reviewId: null,
        unavailableReason:
          "약속 시각이 지난 소개팅만 작성할 수 있어요. 작성 가능 여부와 중복 리뷰는 저장 시 확인해요.",
      };
    });
}
