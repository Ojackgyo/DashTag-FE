export function formatBirthdateInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function normalizeBirthdate(input: string): string {
  const value = input.trim();
  const match = value.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
    ?? value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) throw new Error('생년월일을 YYYY-MM-DD 형식으로 입력해주세요');
  const iso = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso || date >= new Date()) {
    throw new Error('생년월일을 실제 날짜로 입력해주세요');
  }
  return iso;
}
