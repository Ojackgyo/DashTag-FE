import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { capabilities } from "../api/capabilities";
import {
  getReviews,
  getUserReviewSummary,
  getReviewTargets,
  createReview,
  updateReview,
  deleteReview,
} from "../api/review";
import type { ReviewResponse, ReviewTarget } from "../api/review";
import { nextCursor } from "../api/contracts";
import {
  Action,
  Sheet,
  Confirm,
  ConnectionNotice,
} from "../components/FeatureUI";
import { fieldStyle, cardStyle } from "../components/featureStyles";
import QueryStatus from "../components/QueryStatus";

function ReviewForm({
  target,
  review,
  onClose,
  onSaved,
}: {
  target?: ReviewTarget;
  review?: ReviewResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [content, setContent] = useState(review?.content ?? "");
  const save = useMutation({
    mutationFn: () =>
      review
        ? updateReview(review.id, { rating, content })
        : createReview({
            reviewedMemberId: target!.memberId,
            datingRequestId: target!.datingRequestId,
            rating,
            content,
          }),
    onSuccess: onSaved,
  });
  return (
    <Sheet
      title={review ? "리뷰 수정" : `${target?.nickname}님 리뷰`}
      onClose={onClose}
      busy={save.isPending}
    >
      <form
        className="feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <ConnectionNotice available={capabilities.reviews} />
        <fieldset>
          <legend>별점 (필수)</legend>
          <div className="feature-row" role="radiogroup" aria-label="리뷰 별점">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n}점`}
                disabled={save.isPending}
                onClick={() => setRating(n)}
                style={{
                  fontSize: 30,
                  minWidth: 44,
                  minHeight: 44,
                  color: n <= rating ? "#eda535" : "var(--text-muted)",
                }}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          리뷰 내용 (선택)
          <textarea
            style={fieldStyle}
            rows={5}
            maxLength={1000}
            value={content}
            disabled={save.isPending}
            onChange={(e) => setContent(e.target.value)}
            placeholder="함께한 만남은 어땠나요?"
          />
          <small>{content.length}/1,000</small>
        </label>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
          상대에게 공개되는 리뷰예요. 연락처나 개인 정보는 적지 말아주세요.
        </p>
        <QueryStatus error={save.error} />
        <Action
          type="submit"
          disabled={!capabilities.reviews || rating === 0 || save.isPending}
        >
          {save.isPending ? "저장 중…" : "리뷰 저장"}
        </Action>
      </form>
    </Sheet>
  );
}
export default function ReviewsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const memberId =
    params.memberId == null ? undefined : Number(params.memberId);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"received" | "written" | "eligible">(
    searchParams.get("tab") === "eligible" ? "eligible" : "received",
  );
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [editing, setEditing] = useState<ReviewResponse | null>(null);
  const [remove, setRemove] = useState<ReviewResponse | null>(null);
  const [success, setSuccess] = useState("");
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["reviews", "page", memberId ?? "me", tab],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) =>
      memberId
        ? getUserReviewSummary(memberId, pageParam)
        : getReviews(tab === "written" ? "written" : "received", pageParam),
    getNextPageParam: (page, _pages, previous) => nextCursor(page, previous),
    enabled:
      capabilities.reviews &&
      tab !== "eligible" &&
      (memberId == null || (Number.isSafeInteger(memberId) && memberId > 0)),
  });
  const eligible = useQuery({
    queryKey: ["reviews", "eligible"],
    queryFn: getReviewTargets,
    enabled: capabilities.reviews && tab === "eligible" && memberId == null,
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["reviews"] });
    setTarget(null);
    setEditing(null);
    setRemove(null);
    setSuccess("반영됐어요.");
  };
  const deletion = useMutation({
    mutationFn: deleteReview,
    onSuccess: refresh,
  });
  const reviews = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) ?? []).map((r) => [r.id, r]),
    ).values(),
  ];
  const summary = query.data?.pages[0];
  return (
    <div className="page-container px-[18px] pb-6">
      <div className="feature-row">
        <button
          className="icon-button"
          aria-label="뒤로"
          onClick={() => navigate(-1)}
        >
          ‹
        </button>
        <h1 className="feature-title">
          {memberId ? "회원 리뷰" : "대쉬서클 · 리뷰"}
        </h1>
      </div>
      <ConnectionNotice available={capabilities.reviews} />
      {success && (
        <p role="status" className="feature-notice">
          {success}
        </p>
      )}
      {memberId != null &&
      (!Number.isSafeInteger(memberId) || memberId <= 0) ? (
        <QueryStatus error={new Error("회원을 다시 선택해주세요")} />
      ) : (
        <>
          {memberId == null && (
            <div className="feature-tabs" role="tablist" aria-label="리뷰 목록">
              {(
                [
                  { key: "received", label: "받은 리뷰" },
                  { key: "written", label: "쓴 리뷰" },
                  { key: "eligible", label: "작성하기" },
                ] as const
              ).map((t) => (
                <button
                  role="tab"
                  aria-selected={tab === t.key}
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setSuccess("");
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {tab === "eligible" ? (
            <>
              <QueryStatus
                loading={eligible.isLoading}
                error={eligible.error}
                retry={() => {
                  void eligible.refetch();
                }}
              />
              {eligible.data?.map((t) => (
                <div key={t.datingRequestId} style={cardStyle}>
                  <strong>{t.nickname}</strong>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      margin: "8px 0",
                    }}
                  >
                    {t.unavailableReason ?? "소개팅에서 만난 상대예요"}
                  </p>
                  <Action disabled={!t.canReview} onClick={() => setTarget(t)}>
                    {t.reviewId ? "이미 작성했어요" : "리뷰 작성"}
                  </Action>
                </div>
              ))}
              {eligible.data?.length === 0 && (
                <p className="feature-notice">
                  작성할 리뷰가 없어요. 만남이 끝나면 여기에 표시돼요.
                </p>
              )}
            </>
          ) : (
            <>
              <QueryStatus
                loading={query.isLoading}
                error={query.error ?? deletion.error}
                retry={() => {
                  void query.refetch();
                }}
              />
              {summary && (
                <div style={cardStyle}>
                  <strong style={{ fontSize: 22 }}>
                    ★{" "}
                    {summary.averageRating == null
                      ? "—"
                      : summary.averageRating.toFixed(1)}
                  </strong>
                  <span style={{ marginLeft: 12 }}>
                    총 {summary.totalCount}개
                  </span>
                </div>
              )}
              {reviews.map((r) => (
                <article key={r.id} style={cardStyle}>
                  <div
                    className="feature-row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <strong>
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </strong>
                    <small>
                      {new Date(r.updatedAt ?? r.createdAt).toLocaleDateString(
                        "ko-KR",
                      )}
                    </small>
                  </div>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      margin: "12px 0",
                    }}
                  >
                    {r.content || "별점만 남긴 리뷰예요."}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {r.reviewerNickname}
                  </p>
                  {tab === "written" && (
                    <div className="feature-row" style={{ marginTop: 12 }}>
                      {r.canEdit && (
                        <Action onClick={() => setEditing(r)}>수정</Action>
                      )}
                      {r.canDelete && (
                        <Action
                          disabled={deletion.isPending}
                          onClick={() => setRemove(r)}
                          style={{
                            background: "var(--bg-card2)",
                            color: "#dc5467",
                          }}
                        >
                          삭제
                        </Action>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {summary && reviews.length === 0 && (
                <p className="feature-notice">아직 리뷰가 없어요.</p>
              )}
              {query.hasNextPage && (
                <Action
                  disabled={query.isFetchingNextPage}
                  onClick={() => {
                    void query.fetchNextPage();
                  }}
                >
                  더 보기
                </Action>
              )}
            </>
          )}
        </>
      )}
      {(target || editing) && (
        <ReviewForm
          target={target ?? undefined}
          review={editing ?? undefined}
          onClose={() => {
            setTarget(null);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      )}
      {remove && (
        <Confirm
          error={deletion.error}
          title="리뷰를 삭제할까요?"
          description="삭제한 리뷰는 복구할 수 없어요. 평점 집계에서도 제외돼요."
          busy={deletion.isPending}
          onClose={() => setRemove(null)}
          onConfirm={() => deletion.mutate(remove.id)}
        />
      )}
    </div>
  );
}
