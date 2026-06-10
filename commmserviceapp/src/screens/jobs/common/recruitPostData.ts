/** @see client recruit_* PostData — 모바일 채용 등록 옵션 */

export const RELIGIOUSBODY_OPTIONS = [
  '구세군대한본영',
  '기독교대한감리회',
  '기독교대한성결교회',
  '기독교대한하나님의성회',
  '기독교한국침례회',
  '대한기독교나사렛성결회',
  '대한예수교장로회고신',
  '대한예수교장로회통합',
  '대한예수교장로회합동',
  '대한예수교장로회합신',
  '예수교대한성결교회',
  '한국기독교장로회',
  '기타교단',
] as const;

export const MINISTER_SORT_OPTIONS = [
  '전임',
  '준전임',
  '파트',
  '전임or준전임',
  '전임or파트',
  '준전임or파트',
  '전임&준전임',
  '전임&파트',
  '준전임&파트',
  '담임',
] as const;

export const SIMPLE_SORT_OPTIONS = ['지휘', '반주', '솔리스트'] as const;

export const MINISTER_SCHOOL_PRESETS = ['교단 인준 신학교 재학 및 졸업자'];
export const MINISTER_CAREER_PRESETS = ['관련 사역 경험자 우대'];

export const SIMPLE_SCHOOL_PRESETS = ['음대/음악대학원 재학 및 졸업자', '관련 전공자 우대'];
export const SIMPLE_CAREER_PRESETS = ['관련 사역 경험자 우대', '찬양 사역 경험자'];

export const PART_PRESETS = ['담임', '교구', '행정', '주일학교', '교육부서', '양육사역', '심방사역', '찬양사역', '특수사역'];
export const PART_DETAIL_PRESETS = [
  '영아부',
  '유아부',
  '영유아부',
  '유치부',
  '초등부',
  '중등부',
  '고등부',
  '대학부',
  '청년부',
  '특수부',
];

export const RECRUIT_NUM_OPTIONS = ['1명', '2명', '3명', '4명', '5명', '각1명', '각2명'] as const;
export const WEEKDAY_OPTIONS = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const WORKDAY_PRESETS = ['주6일(화~일)', '주4일(수금토일)', '주3일(수토일)', '주3일(금토일)', '주말(토일)'] as const;
export const DAWN_PRAY_PRESETS = ['주1회', '주2회', '주3회', '주4회', '주5회', '주6회', '매일'] as const;

export const PAY_PRESETS = ['교회내규에따라', '협의후결정'];
export const INSURANCE_PRESETS = ['건강보험', '고용보험', '국민연금', '산재보험'];
export const SEVERANCE_PRESETS = ['사례의10%', '교회내규에따라', '협의후결정'];
export const WELFARE_PRESETS = [
  '사택제공',
  '공과금',
  '통신비',
  '월차제도',
  '유연근무제',
  '칼퇴권장',
  '건강검진',
  '상여금',
  '휴가비',
  '출산휴가',
];

export const MINISTER_APPLYDOC_PRESETS = [
  '이력서',
  '자기소개서',
  '추천서',
  '졸업증명서',
  '설교영상',
  '가족관계증명서',
];
export const SIMPLE_APPLYDOC_PRESETS = [
  '이력서',
  '자기소개서',
  '가족관계증명서',
  '지휘영상',
  '반주영상',
  '찬양영상',
  '음악영상',
];

export const APPLYHOW_OPTIONS = ['e-메일', '홈페이지', '우편', '방문', 'Fax'] as const;

export const HOUR_OPTIONS = [
  '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23',
];
export const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];
export const WORKDAY_WEEK_OPTIONS = ['평일', '토요일', '수요일', '금요일'];

export const SORT_LABEL_OPTIONS = [
  '전임',
  '준전임',
  '파트',
  '전임or준전임',
  '전임or파트',
  '준전임or파트',
  '전임&준전임',
  '전임&파트',
  '준전임&파트',
  '담임',
];

export const SIMPLE_SORT_LABEL_OPTIONS = [
  '지휘자',
  '솔리스트',
  '반주자',
  '찬양인도자',
  '지휘자or솔리스트',
  '지휘자or반주자',
  '솔리스트or반주자',
  '지휘자&솔리스트',
  '지휘자&반주자',
  '솔리스트&반주자',
];
