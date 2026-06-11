import type { RetreatProgramRow } from './types';

export const ORDER_DATE_PREFIX = 'orderDate:';
const ORDER_GROUP_SEP = '|g:';

export type YmdParts = { y: string; m: string; d: string };

export type OrderDayMarker = {
  dateKey: string;
  groupId: string;
};

export type OrderDayGroup = {
  dateKey: string;
  groupId: string;
  dateParts: YmdParts;
  startIndex: number;
  rowCount: number;
};

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(y: string, m: string): number {
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  if (!Number.isFinite(yi) || !Number.isFinite(mi) || mi < 1 || mi > 12) return 31;
  return new Date(yi, mi, 0).getDate();
}

export function parseYmdToken(token: string, defaultYear?: string): YmdParts | null {
  const t = token.trim();
  if (!t) return null;
  const full = t.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
  if (full) {
    return { y: full[1], m: pad2(full[2]), d: pad2(full[3]) };
  }
  const ym = t.match(/^(\d{4})[-.](\d{1,2})$/);
  if (ym) {
    return { y: ym[1], m: pad2(ym[2]), d: '' };
  }
  const yOnly = t.match(/^(\d{4})$/);
  if (yOnly) {
    return { y: yOnly[1], m: '', d: '' };
  }
  const short = t.match(/^(\d{1,2})[-.](\d{1,2})$/);
  if (short && defaultYear) {
    return { y: defaultYear, m: pad2(short[1]), d: pad2(short[2]) };
  }
  return null;
}

export function serializeYmdParts(parts: YmdParts): string {
  if (!parts.y && !parts.m && !parts.d) return '';
  if (parts.y && parts.m && parts.d) return `${parts.y}-${parts.m}-${parts.d}`;
  if (parts.y && parts.m) return `${parts.y}-${parts.m}`;
  if (parts.y) return parts.y;
  return '';
}

export function isOrderDayDateComplete(parts: YmdParts): boolean {
  return Boolean(parts.y && parts.m && parts.d);
}

export function normalizeYmdParts(parts: YmdParts): YmdParts {
  if (!parts.y || !parts.m || !parts.d) return parts;
  const maxDay = daysInMonth(parts.y, parts.m);
  const dayNum = parseInt(parts.d, 10);
  if (!Number.isFinite(dayNum) || dayNum <= maxDay) return parts;
  return { ...parts, d: pad2(maxDay) };
}

function createOrderDayGroupId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseOrderDayMarker(postImage: string): OrderDayMarker | null {
  const pi = (postImage || '').trim();
  if (!pi.startsWith(ORDER_DATE_PREFIX)) return null;

  const rest = pi.slice(ORDER_DATE_PREFIX.length).trim();
  if (!rest) return null;

  const groupIdx = rest.indexOf(ORDER_GROUP_SEP);
  if (groupIdx >= 0) {
    return {
      dateKey: rest.slice(0, groupIdx),
      groupId: rest.slice(groupIdx + ORDER_GROUP_SEP.length),
    };
  }
  return { dateKey: rest, groupId: '' };
}

function serializeOrderDayMarker(marker: OrderDayMarker): string {
  if (!marker.dateKey) return '';
  if (marker.groupId) {
    return `${ORDER_DATE_PREFIX}${marker.dateKey}${ORDER_GROUP_SEP}${marker.groupId}`;
  }
  return `${ORDER_DATE_PREFIX}${marker.dateKey}`;
}

function boxGroupKey(marker: OrderDayMarker): string {
  return `${marker.dateKey}::${marker.groupId}`;
}

export function getRowOrderDayMarker(
  row: RetreatProgramRow,
  fallbackDate: YmdParts,
): OrderDayMarker {
  const parsed = parseOrderDayMarker(row.postImage || '');
  if (parsed?.dateKey) return parsed;
  return { dateKey: serializeYmdParts(fallbackDate), groupId: '' };
}

export function withRowOrderDayMarker(
  row: RetreatProgramRow,
  marker: OrderDayMarker,
): RetreatProgramRow {
  if (!marker.dateKey) {
    const pi = row.postImage || '';
    if (pi.startsWith(ORDER_DATE_PREFIX)) {
      return { ...row, postImage: '' };
    }
    return row;
  }
  return { ...row, postImage: serializeOrderDayMarker(marker) };
}

export function groupProgramsByOrderDay(
  programs: RetreatProgramRow[],
  fallbackDate: YmdParts,
): OrderDayGroup[] {
  if (programs.length === 0) {
    const dateKey = serializeYmdParts(fallbackDate);
    return [{
      dateKey,
      groupId: '',
      dateParts: { ...fallbackDate },
      startIndex: 0,
      rowCount: 0,
    }];
  }

  const groups: OrderDayGroup[] = [];
  let currentKey = '';
  let groupStart = 0;

  for (let i = 0; i < programs.length; i += 1) {
    const marker = getRowOrderDayMarker(programs[i], fallbackDate);
    const key = boxGroupKey(marker);
    if (!groups.length || key !== currentKey) {
      if (groups.length) {
        groups[groups.length - 1].rowCount = i - groupStart;
      }
      currentKey = key;
      groupStart = i;
      groups.push({
        dateKey: marker.dateKey,
        groupId: marker.groupId,
        dateParts: parseYmdToken(marker.dateKey) || { ...fallbackDate },
        startIndex: groupStart,
        rowCount: 0,
      });
    }
  }
  groups[groups.length - 1].rowCount = programs.length - groupStart;
  return groups;
}

/** 기존 데이터에 orderDate 마커가 없으면 fallback 날짜로 표시용 키를 붙입니다 (이미지 파일명은 유지). */
export function ensureOrderDateKeysOnPrograms(
  programs: RetreatProgramRow[],
  fallbackDate: YmdParts,
): RetreatProgramRow[] {
  const fallbackKey = serializeYmdParts(fallbackDate);
  return programs.map((row) => {
    const pi = (row.postImage || '').trim();
    if (pi.startsWith(ORDER_DATE_PREFIX)) return row;
    if (pi) return row;
    return withRowOrderDayMarker(row, { dateKey: fallbackKey, groupId: '' });
  });
}

function markerForGroup(group: OrderDayGroup, dateKey?: string): OrderDayMarker {
  return {
    dateKey: dateKey ?? group.dateKey,
    groupId: group.groupId,
  };
}

export function patchProgramsOrderDayDate(
  programs: RetreatProgramRow[],
  dayIndex: number,
  patch: Partial<YmdParts>,
  fallbackDate: YmdParts,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  const group = groups[dayIndex];
  if (!group) return programs;

  const nextParts = normalizeYmdParts({ ...group.dateParts, ...patch });
  const nextKey = serializeYmdParts(nextParts);
  const marker = markerForGroup(group, nextKey);
  const next = [...programs];
  for (let i = group.startIndex; i < group.startIndex + group.rowCount; i += 1) {
    next[i] = withRowOrderDayMarker(next[i], marker);
  }
  return next;
}

export function addProgramsOrderDayBox(
  programs: RetreatProgramRow[],
  fallbackDate: YmdParts,
  createRow: (order: number) => RetreatProgramRow,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  const lastGroup = groups[groups.length - 1];
  const marker: OrderDayMarker = {
    dateKey: lastGroup?.dateKey || serializeYmdParts(fallbackDate),
    groupId: createOrderDayGroupId(),
  };
  const newRow = withRowOrderDayMarker(createRow(programs.length), marker);
  return [...programs, newRow];
}

export function removeProgramsOrderDayBox(
  programs: RetreatProgramRow[],
  dayIndex: number,
  fallbackDate: YmdParts,
  createRow: (order: number) => RetreatProgramRow,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  if (groups.length <= 1) return programs;

  const group = groups[dayIndex];
  if (!group) return programs;

  let next = programs.filter(
    (_, i) => i < group.startIndex || i >= group.startIndex + group.rowCount,
  );
  if (next.length === 0) {
    next = [withRowOrderDayMarker(createRow(0), markerForGroup(groups[0]))];
  }
  return next;
}

export function addProgramsOrderDayRow(
  programs: RetreatProgramRow[],
  dayIndex: number,
  fallbackDate: YmdParts,
  createRow: (order: number) => RetreatProgramRow,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  const group = groups[dayIndex];
  if (!group) return programs;

  const lastIndexInDay = group.startIndex + group.rowCount - 1;
  const lastTime = lastIndexInDay >= 0 ? programs[lastIndexInDay]?.dateTime ?? '' : '';
  const insertAt = group.startIndex + group.rowCount;
  const newRow = withRowOrderDayMarker(
    { ...createRow(insertAt), dateTime: lastTime },
    markerForGroup(group),
  );
  return [...programs.slice(0, insertAt), newRow, ...programs.slice(insertAt)];
}

export function removeProgramsOrderDayRow(
  programs: RetreatProgramRow[],
  dayIndex: number,
  localRowIndex: number,
  fallbackDate: YmdParts,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  const group = groups[dayIndex];
  if (!group || group.rowCount <= 1) return programs;

  const globalIndex = group.startIndex + localRowIndex;
  return programs.filter((_, i) => i !== globalIndex);
}

export function updateProgramsOrderDayRow(
  programs: RetreatProgramRow[],
  dayIndex: number,
  localRowIndex: number,
  key: 'subTitle' | 'title' | 'dateTime' | 'career',
  value: string,
  fallbackDate: YmdParts,
  createRow: (order: number) => RetreatProgramRow,
): RetreatProgramRow[] {
  const groups = groupProgramsByOrderDay(programs, fallbackDate);
  const group = groups[dayIndex];
  if (!group) return programs;

  const globalIndex = group.startIndex + localRowIndex;
  const marker = markerForGroup(group);
  const next = [...programs];
  while (next.length <= globalIndex) {
    next.push(withRowOrderDayMarker(createRow(next.length), marker));
  }
  next[globalIndex] = { ...next[globalIndex], [key]: value };
  return next;
}
