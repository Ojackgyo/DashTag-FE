export interface DashPerson {
  id: string;
  name: string;
  emoji: string;
  mbti: string;
  face: string;
  major: string;
  age: number;
  studentId: string;
  height: number;
  weight: number;
  skinTone: string;
  hairStyle: string;
  tattoo: string;
  smoking: string;
  charmPoints: string[];
  requestMsg?: string;
  sentAt?: string;
}

export const RECEIVED_DASHES: DashPerson[] = [
  {
    id: 'jeff', name: 'Jeff', emoji: '🐺',
    mbti: 'INTJ', face: '늑대상', major: '컴퓨터공학과', age: 25, studentId: '19학번',
    height: 180, weight: 73, skinTone: '밝음', hairStyle: '짧은 머리', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['논리적', '운동 잘함', '과묵한 매력'],
    requestMsg: '안녕하세요! 프로필 보고 연락드려요 😊',
    sentAt: '방금',
  },
  {
    id: 'michael', name: 'Michael', emoji: '🐶',
    mbti: 'ENFP', face: '강아지상', major: '경영학과', age: 24, studentId: '20학번',
    height: 176, weight: 68, skinTone: '매우 밝음', hairStyle: '중단발', tattoo: '없어요', smoking: '비흡연',
    charmPoints: ['유머러스', '애교 많음', '추진력 있음'],
    requestMsg: '혹시 한번 만나볼 수 있을까요? 잘 부탁드려요 💌',
    sentAt: '5분 전',
  },
];

export const SENT_DASHES: DashPerson[] = [
  {
    id: 'john', name: 'John', emoji: '🐻',
    mbti: 'ISTJ', face: '곰상', major: '기계공학과', age: 26, studentId: '18학번',
    height: 178, weight: 75, skinTone: '중간', hairStyle: '스포츠 컷', tattoo: '없어요', smoking: '금연 중이에요',
    charmPoints: ['믿음직함', '요리 잘함'],
    sentAt: '1시간 전',
  },
];

export const DETAIL_ROWS = (p: DashPerson) => [
  { label: '🎂 나이',        value: `${p.age}세 (${p.studentId})` },
  { label: '🎓 학과',        value: p.major },
  { label: '📏 키 / 몸무게', value: `${p.height}cm / ${p.weight}kg` },
  { label: '🎨 피부톤',      value: p.skinTone },
  { label: '💇 헤어스타일',  value: p.hairStyle },
  { label: '🖊️ 타투',       value: p.tattoo },
  { label: '🚬 흡연',        value: p.smoking },
];
