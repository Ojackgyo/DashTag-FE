import type { MemberProfileRequest } from './user';
import type { IdealPreferenceRequest } from './idealPreference';
import { normalizeBirthdate } from '../lib/birthdate';
import { faceTypes, skinTones, hairStyles, smokingStatuses, tattooStatuses, tattooPreferences, smokingPreferences, militaryPreferences, optionValue } from './profileOptions';

function select(options: Record<string, string>, value: string, label: string) {
  const code = optionValue(options, value);
  if (!Object.prototype.hasOwnProperty.call(options, code)) throw new Error(`${label} 항목을 다시 선택해주세요`);
  return code;
}
function ageDiff(value: string) {
  if (value === 'any') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error('나이 차이를 다시 선택해주세요');
  return number;
}
export function buildOnboardingPayload(values: Record<string, string>): { profile: MemberProfileRequest; ideal: IdealPreferenceRequest } {
  const majorId = Number(values.majorId);
  const birthdate = normalizeBirthdate(values.birthdate ?? '');
  if (!Number.isInteger(majorId) || majorId <= 0) throw new Error('학과를 목록에서 다시 선택해주세요');
  if (!values.nickname?.trim() || values.nickname.trim().length > 30) throw new Error('닉네임은 1~30자로 입력해주세요');
  if (!['남성', '여성'].includes(values.gender)) throw new Error('성별을 선택해주세요');
  const topSize = values.topSize === '2XL' ? 'XXL' : values.topSize;
  if (!['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(topSize)) throw new Error('상의 사이즈를 선택해주세요');
  const height = Number(values.height);
  if (!Number.isInteger(height) || height <= 0) throw new Error('키를 입력해주세요');
  const mbti = (values.mbti ?? '').replace(/,/g, '');
  const mbtiPattern = (values.idealMbti ?? '').replace(/,/g, '');
  if (!/^[EI][NS][FT][JP]$/.test(mbti)) throw new Error('MBTI의 네 항목을 모두 선택해주세요');
  if (!/^[EI?][NS?][FT?][JP?]$/.test(mbtiPattern)) throw new Error('이상형 MBTI의 네 항목을 모두 선택해주세요');
  if (values.gender === '남성' && !['군필', '미필'].includes(values.military)) throw new Error('군필 여부를 선택해주세요');
  const [younger = '2', older = '2'] = (values.idealAge || '2,2').split(',');
  const idealTopSize = values.idealTopSize === '2XL' ? 'XXL' : values.idealTopSize;
  if (idealTopSize && idealTopSize !== '상관없어요' && !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(idealTopSize)) throw new Error('이상형 상의 사이즈를 다시 선택해주세요');
  const minHeight = values.idealMinHeight ? Number(values.idealMinHeight) : null;
  const maxHeight = values.idealMaxHeight ? Number(values.idealMaxHeight) : null;
  if ([minHeight, maxHeight].some(n => n != null && (!Number.isInteger(n) || n <= 0))) throw new Error('이상형 키는 0보다 큰 정수로 입력해주세요');
  if (minHeight != null && maxHeight != null && minHeight > maxHeight) throw new Error('이상형 최소 키는 최대 키보다 클 수 없어요');
  return {
    profile: {
      nickname: values.nickname.trim(), gender: values.gender === '남성' ? 'MALE' : 'FEMALE', birthdate, majorId,
      faceType: select(faceTypes, values.faceType, '얼굴상'), height, topSize,
      skinTone: select(skinTones, values.skinTone, '피부톤'), hairStyle: select(hairStyles, values.hairStyle, '헤어스타일'), mbti,
      smokingStatus: select(smokingStatuses, values.smoking, '흡연'), tattooStatus: select(tattooStatuses, values.tattoo, '타투'),
      militaryStatus: values.gender === '남성' ? (values.military === '군필' ? 'COMPLETED' : 'NOT_SERVED') : 'NOT_APPLICABLE',
      charmPoints: (values.charmPoints || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, 3),
    },
    ideal: {
      faceType: values.idealFaceType === '상관없어요' ? null : select(faceTypes, values.idealFaceType, '이상형 얼굴상'),
      skinTone: values.idealSkinTone === '상관없어요' ? null : select(skinTones, values.idealSkinTone, '이상형 피부톤'),
      mbtiPattern, maxYoungerAgeDiff: ageDiff(younger), maxOlderAgeDiff: ageDiff(older),
      tattooPreference: select(tattooPreferences, values.idealTattoo, '이상형 타투'),
      smokingPreference: select(smokingPreferences, values.idealSmoking, '이상형 흡연'),
      militaryPreference: select(militaryPreferences, values.idealMilitary || '상관없어요', '이상형 군필'),
      topSize: !idealTopSize || idealTopSize === '상관없어요' ? null : idealTopSize,
      minHeight, maxHeight,
      hairStyle: !values.idealHairStyle || values.idealHairStyle === '상관없어요' ? null : select(hairStyles, values.idealHairStyle, '이상형 헤어스타일'),
    },
  };
}
