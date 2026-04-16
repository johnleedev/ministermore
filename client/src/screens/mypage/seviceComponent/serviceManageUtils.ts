export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function normalizeBulletinDateKey(raw: string): string | null {
  const t = String(raw || '').trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const kr = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(t);
  if (kr) return `${kr[1]}-${pad2(Number(kr[2]))}-${pad2(Number(kr[3]))}`;
  return null;
}

export function parsePartsFromDateKey(key: string): { y: number; m: number; d: number } | null {
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(key);
  if (!p) return null;
  return { y: +p[1], m: +p[2], d: +p[3] };
}

export function formatKoreanFromDateKey(key: string | null): string {
  if (!key) return '날짜 미지정';
  const parts = parsePartsFromDateKey(key);
  if (!parts) return '날짜 미지정';
  return `${parts.y}년 ${parts.m}월 ${parts.d}일`;
}

export function shortDateFromDateKey(key: string | null): string {
  if (!key) return '--/--';
  const parts = parsePartsFromDateKey(key);
  if (!parts) return '--/--';
  return `${pad2(parts.m)}/${pad2(parts.d)}`;
}

export type CalCell = { kind: 'blank' } | { kind: 'day'; day: number; iso: string };

export function buildCalendarCells(year: number, month: number): CalCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ kind: 'blank' });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      kind: 'day',
      day: d,
      iso: `${year}-${pad2(month)}-${pad2(d)}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: 'blank' });
  return cells;
}
