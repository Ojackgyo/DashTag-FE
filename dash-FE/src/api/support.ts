import { api } from "./client";
import { requireCapability } from "./capabilities";
import { nextCursor, pageQuery, textValue, type CursorPage } from "./contracts";
export interface Notice {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  pinned: boolean;
}
export interface Faq {
  id: number;
  category: string;
  question: string;
  answer: string;
}
export interface Inquiry {
  id: number;
  category:
    "ACCOUNT" | "VERIFICATION" | "DATING" | "COMMUNITY" | "CHAT" | "OTHER";
  title: string;
  content: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}
export const inquiryCategories = {
  ACCOUNT: "계정",
  VERIFICATION: "인증",
  DATING: "소개팅 / 미팅",
  COMMUNITY: "소모임",
  CHAT: "채팅",
  OTHER: "기타",
} as const;
export async function getNotices(cursor?: number) {
  requireCapability("support");
  const page = await api.get<CursorPage<Notice>>(
    `/api/support/notices?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return page;
}
export function getFaqs() {
  requireCapability("support");
  return api.get<Faq[]>("/api/support/faqs");
}
export async function getInquiries(cursor?: number) {
  requireCapability("support");
  const page = await api.get<CursorPage<Inquiry>>(
    `/api/support/inquiries/me?${pageQuery({ cursor })}`,
  );
  nextCursor(page, cursor);
  return page;
}
export function createInquiry(body: {
  category: Inquiry["category"];
  title: string;
  content: string;
}) {
  requireCapability("support");
  if (!(body.category in inquiryCategories))
    throw new Error("문의 유형을 선택해주세요");
  return api.post<Inquiry>("/api/support/inquiries", {
    category: body.category,
    title: textValue(body.title, "제목", 1, 100),
    content: textValue(body.content, "문의 내용", 1, 3000),
  });
}
export function sendFeedback(content: string) {
  requireCapability("support");
  return api.post<{ id: number; createdAt: string }>("/api/support/feedback", {
    content: textValue(content, "의견", 1, 2000),
  });
}
