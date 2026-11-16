import { capabilities } from './capabilities';

// Keep legacy values readable; only the length categories are offered for new selections.
export const faceTypes = { WOLF: '늑대상', DOG: '강아지상', FOX: '여우상', CAT: '고양이상', BEAR: '곰상', RABBIT: '토끼상', DEER: '사슴상', DINOSAUR: '공룡상', HORSE: '말상' } as const;
export const skinTones = { VERY_LIGHT: '매우 밝음', LIGHT: '밝음', MEDIUM: '중간', DARK: '어두운 편', VERY_DARK: '매우 어두움' } as const;
export const hairStyles = { SHORT: '짧은 머리', BOB: '단발', MEDIUM_LENGTH: '중간 머리', LONG: '긴 머리', WAVY: '웨이브', CURLY: '곱슬', TWO_BLOCK: '투블럭' } as const;
export const maleHairStyles = { SHORT: '짧은 기장 머리', MEDIUM_LENGTH: '중간 기장 머리', LONG: '긴 기장 머리', VERY_LONG: '장발' } as const;
export const femaleHairStyles = { BOB: '단발', MEDIUM_LENGTH: '중단발', LONG: '장발' } as const;
export function hairStylesFor(gender?: string | null): Record<string, string> {
  return gender === '남성' || gender?.toUpperCase() === 'MALE' ? maleHairStyles : femaleHairStyles;
}
export function idealHairStylesFor(gender: string): Record<string, string> {
  return hairStylesFor(gender === '남성' || gender.toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE');
}
export function hairStyleAvailable(code: string) { return code !== 'VERY_LONG' || capabilities.hairLengthCategories; }
export function hairStyleValue(options: Record<string, string>, value: string) {
  const code = optionValue(options, value);
  const resolved = Object.prototype.hasOwnProperty.call(options, code) ? code : optionValue(hairStyles, value);
  if (!Object.prototype.hasOwnProperty.call(options, resolved) && !Object.prototype.hasOwnProperty.call(hairStyles, resolved)) throw new Error('헤어스타일을 다시 선택해주세요');
  if (!hairStyleAvailable(resolved)) throw new Error('남성 장발 항목은 준비 중이에요. 잠시 후 다시 이용해주세요.');
  return resolved;
}
export function hairStyleLabel(gender: string | null | undefined, value?: string | null) {
  return optionLabel({ ...hairStyles, ...hairStylesFor(gender) }, value);
}
export const smokingStatuses = { NON_SMOKER: '비흡연', OCCASIONAL: '가끔 피워요', SMOKER: '흡연자예요', QUITTING: '금연 중이에요' } as const;
export const tattooStatuses = { NONE: '없어요', SMALL: '작은 타투', LARGE: '큰 타투', MANY: '많아요' } as const;
export const militaryStatuses = { COMPLETED: '군필', ACTIVE_DUTY: '현역', SOCIAL_SERVICE: '사회복무', NOT_SERVED: '미필', EXEMPT: '면제', NOT_APPLICABLE: '해당 없음' } as const;
export const tattooPreferences = { NONE_ONLY: '없었으면 해요', SMALL_OK: '작은 건 괜찮아요', ANY: '상관없어요' } as const;
export const smokingPreferences = { NON_SMOKER_ONLY: '비흡연만', OCCASIONAL_OK: '가끔은 괜찮아요', ANY: '상관없어요' } as const;
export const militaryPreferences = { COMPLETED_PREFERRED: '군필 선호해요', ANY: '상관없어요' } as const;

export function optionValue(options: Record<string, string>, value: string): string {
  return Object.keys(options).find(key => key === value || options[key] === value) ?? value;
}
export function optionLabel(options: Record<string, string>, value?: string | null): string {
  return value ? options[value] ?? value : '';
}
