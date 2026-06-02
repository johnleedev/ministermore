export type SortContentItem = { sort?: string; content?: string };
export type PayItem = {
  sort?: string;
  paySort?: string;
  selectCost?: string;
  inputCost?: string;
};
export type WorkTimeItem = {
  sort?: string;
  content?: string;
  startHour?: string;
  startMinute?: string;
  endHour?: string;
  endMinute?: string;
  day?: string;
};
export type ApplyTime = { startDay?: string; endDay?: string; daySort?: string };
export type InquiryInfo = { inquiryName?: string; email?: string; phone?: string };

export function safeParse<T>(raw: unknown, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

/** API가 JSON 문자열·단일 객체·배열 중 어떤 형태로 와도 배열로 정규화 */
export function safeParseArray<T>(raw: unknown, fallback: T[] = []): T[] {
  const parsed = safeParse<unknown>(raw, fallback);
  if (Array.isArray(parsed)) return parsed as T[];
  if (parsed && typeof parsed === 'object') return [parsed as T];
  return fallback;
}

/** inquiry, applytime 등 단일 객체 필드 */
export function safeParseObject<T extends Record<string, unknown>>(
  raw: unknown,
  fallback: T,
): T {
  const parsed = safeParse<unknown>(raw, fallback);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as T;
  }
  return fallback;
}

/** 웹 RecruitMinisterDetail — sort 접두어 포함 다중 항목 */
export function formatSortContentLines(items: SortContentItem[] | null | undefined): string[] {
  if (!Array.isArray(items) || !items.length) return [];
  const multi = items.length > 1;
  return items
    .filter(item => item?.content)
    .map((item, index) => {
      if (multi && item.sort) return `${item.sort} : ${item.content}`;
      if (index === 0 || !multi) return String(item.content);
      return item.sort ? `${item.sort} : ${item.content}` : String(item.content);
    });
}

export function formatPayLines(items: PayItem[] | null | undefined): string[] {
  if (!Array.isArray(items) || !items.length) return [];
  const multi = items.length > 1;
  return items.map((item, index) => {
    const value =
      item.inputCost && String(item.inputCost).trim() !== ''
        ? String(item.inputCost)
        : `${item.paySort || ''} ${item.selectCost || ''}`.trim();
    if (!value) return '';
    if (multi && item.sort) return `${item.sort} : ${value}`;
    return value;
  }).filter(Boolean);
}

export function formatWorkTimeSunDayLines(items: WorkTimeItem[] | null | undefined): string[] {
  if (!Array.isArray(items) || !items.length) return [];
  const lines: string[] = [];
  const first = items[0];
  if (
    first?.startHour &&
    first?.startMinute &&
    first?.endHour &&
    first?.endMinute
  ) {
    const prefix = first.sort ? `${first.sort} : ` : '';
    lines.push(
      `${prefix}${first.startHour}:${first.startMinute} - ${first.endHour}:${first.endMinute}`,
    );
  }
  if (items.length > 1 && items[1]?.content) {
    const second = items[1];
    lines.push(second.sort ? `${second.sort} : ${second.content}` : String(second.content));
  }
  return lines;
}

export function formatWorkTimeWeekLines(items: WorkTimeItem[] | null | undefined): string[] {
  if (!Array.isArray(items) || !items.length) return [];
  const first = items[0];
  if (
    !first?.startHour ||
    !first?.startMinute ||
    !first?.endHour ||
    !first?.endMinute
  ) {
    return [];
  }
  const prefix = first.sort ? `${first.sort} : ` : '';
  const daySuffix = first.day ? ` (${first.day})` : '';
  return [
    `${prefix}${first.startHour}:${first.startMinute} - ${first.endHour}:${first.endMinute}${daySuffix}`,
  ];
}

export function formatApplyPeriod(applytime: ApplyTime): string {
  if (applytime.startDay && applytime.endDay) {
    const sort = applytime.daySort ? ` (${applytime.daySort})` : '';
    return `${applytime.startDay} ~ ${applytime.endDay}${sort}`;
  }
  return applytime.daySort || '-';
}

export function normalizeHomepageUrl(homepage: string): string {
  if (!homepage) return '';
  return homepage.includes('http') ? homepage : `http://${homepage}`;
}
