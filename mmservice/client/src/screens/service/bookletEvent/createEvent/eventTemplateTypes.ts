/** 행사 전단지 상단 탭 (공개 페이지·편집기 공통) */
export type EventVisibleTabId = 'info' | 'greeting' | 'program' | 'profile' | 'order' | 'apply';

export const EVENT_VISIBLE_TAB_ORDER: EventVisibleTabId[] = [
  'info',
  'greeting',
  'program',
  'profile',
  'order',
  'apply',
];

/** 템플릿 선택 화면: 소개 → 초대의글 → 프로그램 → 순서 → 프로필 → 신청하기 순 나열 */
export const EVENT_TAB_PICKER_ORDER: EventVisibleTabId[] = [
  'info',
  'greeting',
  'program',
  'order',
  'profile',
  'apply',
];

const LEGACY_VISIBLE_TAB_MAP: Record<string, EventVisibleTabId> = {
  cast: 'profile',
  worship: 'order',
};

/** 레거시 `cast`/`worship` 문자열을 현재 탭 id로 치환해 알려진 id만 반환 */
export function normalizeLegacyTabIdString(id: string): EventVisibleTabId | null {
  const mapped = LEGACY_VISIBLE_TAB_MAP[id] ?? id;
  return EVENT_VISIBLE_TAB_ORDER.includes(mapped as EventVisibleTabId) ? (mapped as EventVisibleTabId) : null;
}

/** 공개 탭 id를 `EVENT_VISIBLE_TAB_ORDER` 순으로 정렬. `info`는 항상 포함. DB·URL의 레거시 id도 수용 */
export function orderVisibleTabIds(
  ids: Set<EventVisibleTabId> | readonly EventVisibleTabId[] | readonly string[],
): EventVisibleTabId[] {
  const set = new Set<EventVisibleTabId>();
  const arr = ids instanceof Set ? Array.from(ids) : ids;
  for (let i = 0; i < arr.length; i++) {
    const n = normalizeLegacyTabIdString(String(arr[i]));
    if (n) set.add(n);
  }
  set.add('info');
  return EVENT_VISIBLE_TAB_ORDER.filter((id) => set.has(id));
}

/** 소개 포함 최대 선택 가능 탭 개수 */
export const MAX_EVENT_VISIBLE_TAB_COUNT = 4;

export const EVENT_VISIBLE_TAB_LABELS: Record<EventVisibleTabId, string> = {
  info: '소개',
  greeting: '초대의글',
  program: '프로그램',
  profile: '프로필',
  order: '순서',
  apply: '신청하기',
};

/** 템플릿 선택 화면 등 — 탭 이름 아래 짧은 안내 */
export const EVENT_VISIBLE_TAB_HINTS: Record<EventVisibleTabId, string> = {
  info: '행사명·일정·장소·오시는 길·문의 등 기본 안내',
  greeting: '새신자 초청 카드형 초대 메시지(일시·장소는 소개 탭과 연동)',
  program: '시간표와 순서, 연사·내용을 항목별로 정리',
  profile: '임명·출연·봉사 등 이름·역할·사진을 카드로 표시',
  order: '찬양·기도·말씀 등 예배·행사 순서를 단계별로',
  apply: '참가 안내 문구와 신청(버튼) 영역을 한 탭에 구성',
};

/**
 * 템플릿 선택 화면 — 탭 제목 옆 화살표로 펼치는 설명.
 * 프로그램 vs 순서: 프로그램은 행마다 이미지+텍스트, 순서는 텍스트만.
 */
export const EVENT_TAB_PICKER_DETAIL: Record<EventVisibleTabId, string> = {
  info: '행사명, 일시·기간, 장소, 오시는 길(지도), 문의처 등 행사 기본 정보를 한 탭에 모읍니다.',
  greeting: '새신자 초청에 맞춘 카드형 초대 문구를 넣을 수 있습니다. 일시·장소는 소개 탭과 연동됩니다.',
  program:
    '프로그램 탭은 각 항목마다 이미지와 텍스트가 함께 표시됩니다. 시간표·연사·내용 등을 항목별로 구성할 때 사용합니다.',
  order:
    '순서 탭은 각 행이 텍스트만 표시됩니다. 진행 순서를 제목·부제·담당·안내 등으로 단계별로 정리할 때 사용합니다.',
  profile: '임명·출연·봉사 등 이름·역할·사진을 카드 형태로 나열합니다.',
  apply: '참가 안내 문구와 신청(버튼) 영역을 한 탭에 구성합니다.',
};

/** 템플릿 선택 단계 「유형선택」 */
export type EventBookletTypeId = 'ordination' | 'newcomer' | 'concert' | 'retreat';

export const EVENT_BOOKLET_TYPE_DEFS: {
  id: EventBookletTypeId;
  title: string;
  description: string;
  tabs: EventVisibleTabId[];
}[] = [
  {
    id: 'ordination',
    title: '임직식',
    description: '소개 · 프로필 · 순서',
    tabs: ['info', 'profile', 'order'],
  },
  {
    id: 'newcomer',
    title: '새신자초청',
    description: '소개 · 초대의글 · 프로그램',
    tabs: ['info', 'greeting', 'program'],
  },
  {
    id: 'concert',
    title: '음악회',
    description: '소개 · 순서 · 프로필',
    tabs: ['info', 'profile', 'order'],
  },
  {
    id: 'retreat',
    title: '수련회&집회',
    description: '소개 · 순서 · 신청하기',
    tabs: ['info', 'order', 'apply'],
  },
];

/** `EVENT_BOOKLET_TYPE_DEFS[].tabs` 그대로 (정렬 전). 알 수 없는 id면 첫 유형(임직식)과 동일 */
export function visibleTabsForBookletType(typeId: EventBookletTypeId): EventVisibleTabId[] {
  const row = EVENT_BOOKLET_TYPE_DEFS.find((t) => t.id === typeId);
  const fallback = EVENT_BOOKLET_TYPE_DEFS[0]?.tabs ?? (['info', 'profile', 'order'] as EventVisibleTabId[]);
  return row ? [...row.tabs] : [...fallback];
}

/**
 * 템플릿 선택「유형」클릭 시 자동으로 켜질 탭 — 위 `tabs`를 공통 탭 순서로 정렬.
 */
export function presetVisibleTabsForBookletType(typeId: EventBookletTypeId): EventVisibleTabId[] {
  return orderVisibleTabIds(visibleTabsForBookletType(typeId));
}

/** API `bookletType` / DB eventMain.eventBookletType(VARCHAR) 파싱 */
export function parseEventBookletTypeId(v: unknown): EventBookletTypeId | null {
  const s = v == null ? '' : String(v).trim();
  return EVENT_BOOKLET_TYPE_DEFS.some((t) => t.id === s) ? (s as EventBookletTypeId) : null;
}

/** 순서 탭 표시 형식 — MySQL `eventOrder.orderStyle`(행마다 동일 값) */
export type EventOrderStyleId = 'schedule' | 'worship' | 'concert' | 'retreat';

export function parseEventOrderStyleId(v: unknown): EventOrderStyleId {
  const s = v == null ? '' : String(v).trim();
  if (s === 'schedule' || s === 'worship' || s === 'concert' || s === 'retreat') return s;
  return 'worship';
}

/**
 * BookletEventDetail.tsx 구조 기준
 * - eventInfo: noticebox-sub (행사명, 날짜, 장소, 주소, 주관/주최, 문의)
 * - map: noticebox-mapBox (오시는길)
 * - program: programbox (프로그램 목록)
 */
export type EventBlockId = 'eventInfo' | 'map' | 'program';

export const EVENT_BLOCK_LABELS: Record<EventBlockId, string> = {
  eventInfo: '행사 정보',
  map: '오시는길',
  program: '프로그램',
};

/** 행사 블록 표시 순서 (BookletEventDetail: noticebox-sub → map → program) */
export const EVENT_BLOCK_ORDER: EventBlockId[] = ['eventInfo', 'map', 'program'];
