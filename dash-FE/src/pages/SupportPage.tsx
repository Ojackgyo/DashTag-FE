import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotices,
  getFaqs,
  getInquiries,
  createInquiry,
  sendFeedback,
  inquiryCategories,
  type Inquiry,
} from "../api/support";
import { nextCursor } from "../api/contracts";
import { capabilities } from "../api/capabilities";
import { Action, Sheet, ConnectionNotice } from "../components/FeatureUI";
import { fieldStyle, cardStyle } from "../components/featureStyles";
import QueryStatus from "../components/QueryStatus";
function InquiryList() {
  const query = useInfiniteQuery({
    queryKey: ["support", "inquiries"],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => getInquiries(pageParam),
    getNextPageParam: (p, _ps, prev) => nextCursor(p, prev),
    enabled: capabilities.support,
  });
  return (
    <>
      <QueryStatus
        loading={query.isLoading}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data?.pages
        .flatMap((p) => p.items)
        .map((i) => (
          <details key={i.id} style={cardStyle}>
            <summary style={{ cursor: "pointer" }}>
              {i.title} ·{" "}
              {
                { OPEN: "접수", ANSWERED: "답변 완료", CLOSED: "종료" }[
                  i.status
                ]
              }
            </summary>
            <p
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 12,
                overflowWrap: "anywhere",
              }}
            >
              {i.content}
            </p>
            <p
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 12,
                color: "var(--primary)",
              }}
            >
              {i.answer ?? "답변을 기다리고 있어요."}
            </p>
          </details>
        ))}
      {query.data?.pages[0].items.length === 0 && (
        <p className="feature-notice">접수한 문의가 없어요.</p>
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
  );
}
function NoticeList() {
  const query = useInfiniteQuery({
    queryKey: ["support", "notices"],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => getNotices(pageParam),
    getNextPageParam: (p, _ps, prev) => nextCursor(p, prev),
    enabled: capabilities.support,
  });
  return (
    <>
      <QueryStatus
        loading={query.isLoading}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data?.pages
        .flatMap((p) => p.items)
        .map((n) => (
          <details key={n.id} style={cardStyle}>
            <summary style={{ cursor: "pointer" }}>
              {n.pinned ? "📌 " : ""}
              {n.title}
            </summary>
            <p
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 12,
                overflowWrap: "anywhere",
              }}
            >
              {n.content}
            </p>
            <small>{new Date(n.createdAt).toLocaleDateString("ko-KR")}</small>
          </details>
        ))}
      {query.data?.pages[0].items.length === 0 && (
        <p className="feature-notice">등록된 공지가 없어요.</p>
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
  );
}
function FaqList() {
  const query = useQuery({
    queryKey: ["support", "faqs"],
    queryFn: getFaqs,
    enabled: capabilities.support,
  });
  const [search, setSearch] = useState("");
  return (
    <>
      <input
        aria-label="FAQ 검색"
        style={{ ...fieldStyle, marginBottom: 16 }}
        placeholder="궁금한 내용을 검색하세요"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <QueryStatus
        loading={query.isLoading}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data
        ?.filter((f) => (f.question + " " + f.answer).includes(search))
        .map((f) => (
          <details style={cardStyle} key={f.id}>
            <summary>{f.question}</summary>
            <p
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 12,
                overflowWrap: "anywhere",
              }}
            >
              {f.answer}
            </p>
          </details>
        ))}
      {query.data &&
        !query.data.some((f) =>
          (f.question + " " + f.answer).includes(search),
        ) && <p className="feature-notice">검색 결과가 없어요.</p>}
    </>
  );
}
export default function SupportPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "notices";
  const [compose, setCompose] = useState(false);
  const [category, setCategory] = useState<Inquiry["category"]>("OTHER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [receipt, setReceipt] = useState<number | null>(null);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () =>
      tab === "feedback"
        ? sendFeedback(content)
        : createInquiry({ category, title, content }),
    onSuccess: (r) => {
      setReceipt(r.id);
      setCompose(false);
      setTitle("");
      setContent("");
      void client.invalidateQueries({ queryKey: ["support", "inquiries"] });
    },
  });
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
        <h1 className="feature-title">고객지원</h1>
      </div>
      <ConnectionNotice available={capabilities.support} />
      <div className="feature-tabs" role="tablist" aria-label="고객지원">
        {[
          { key: "notices", label: "공지" },
          { key: "faq", label: "FAQ" },
          { key: "inquiries", label: "내 문의" },
          { key: "feedback", label: "의견" },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setParams({ tab: t.key });
              setReceipt(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {receipt != null && (
        <p role="status" className="feature-notice">
          접수됐어요. 접수 번호: {receipt}
        </p>
      )}
      {tab === "faq" ? (
        <FaqList />
      ) : tab === "inquiries" ? (
        <>
          <Action
            onClick={() => {
              mutation.reset();
              setCompose(true);
            }}
            style={{ marginBottom: 16 }}
          >
            1:1 문의하기
          </Action>
          <InquiryList />
        </>
      ) : tab === "feedback" ? (
        <>
          <p style={{ color: "var(--text-sub)", marginBottom: 16 }}>
            더 나은 DashTag를 위한 의견을 들려주세요.
          </p>
          <Action
            onClick={() => {
              mutation.reset();
              setCompose(true);
            }}
          >
            의견 보내기
          </Action>
        </>
      ) : (
        <NoticeList />
      )}
      {compose && (
        <Sheet
          title={tab === "feedback" ? "의견 보내기" : "1:1 문의"}
          onClose={() => setCompose(false)}
          busy={mutation.isPending}
        >
          <form
            className="feature-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!mutation.isPending) mutation.mutate();
            }}
          >
            <ConnectionNotice available={capabilities.support} />
            {tab !== "feedback" && (
              <>
                <label>
                  문의 유형
                  <select
                    style={fieldStyle}
                    value={category}
                    disabled={mutation.isPending}
                    onChange={(e) =>
                      setCategory(e.target.value as Inquiry["category"])
                    }
                  >
                    {Object.entries(inquiryCategories).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  제목
                  <input
                    style={fieldStyle}
                    required
                    maxLength={100}
                    disabled={mutation.isPending}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              내용
              <textarea
                style={fieldStyle}
                required
                maxLength={tab === "feedback" ? 2000 : 3000}
                rows={6}
                disabled={mutation.isPending}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <small>
                {content.length}/{tab === "feedback" ? "2,000" : "3,000"}
              </small>
            </label>
            <QueryStatus error={mutation.error} />
            <Action
              disabled={
                !capabilities.support || mutation.isPending || !content.trim()
              }
            >
              {mutation.isPending ? "접수 중…" : "접수하기"}
            </Action>
          </form>
        </Sheet>
      )}
    </div>
  );
}
