export interface CursorPage<T> {
  items: T[];
  nextCursor: number | null;
  hasNext: boolean;
}
export function pageQuery(
  options: Record<string, string | number | undefined | null> = {},
) {
  const query = new URLSearchParams({ size: "20" });
  for (const [key, value] of Object.entries(options))
    if (value != null && value !== "") query.set(key, String(value));
  return query;
}
export function nextCursor<T>(page: CursorPage<T>, previous?: number) {
  if (!page.hasNext) return undefined;
  if (
    page.nextCursor == null ||
    (previous != null && page.nextCursor >= previous)
  )
    throw new Error("다음 페이지 정보를 확인할 수 없어요");
  return page.nextCursor;
}
export function textValue(
  value: string,
  label: string,
  min: number,
  max: number,
) {
  const clean = value.trim();
  if (clean.length < min || clean.length > max)
    throw new Error(`${label}: ${min}~${max}자로 입력해주세요`);
  return clean;
}
export function positiveId(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error("대상을 다시 선택해주세요");
  return value;
}
