import type { EventOrderItem } from '../../bookletEvent/BookletEventTemplates/TemplateEventOrder';
import type { RetreatProgramRow } from '../../../screens/retreat/lib/types';

export function programRowHasContent(row: RetreatProgramRow): boolean {
  return !!(
    row.title.trim()
    || row.subTitle.trim()
    || row.dateTime.trim()
    || row.career.trim()
  );
}

export function careerLines(career: string): string[] {
  return career
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function programsToOrderRows(rows: RetreatProgramRow[]): EventOrderItem[] {
  return rows.map((row, index) => ({
    showOrder: row.showOrder || String(index),
    subTitle: row.subTitle,
    title: row.title,
    charger: row.dateTime,
    notice: row.career,
  }));
}

export function parseRetreatDateStart(dateRaw: string) {
  const value = (dateRaw || '').trim();
  if (!value) return { y: '', m: '', d: '' };
  const start = value.includes('~') ? value.split('~')[0].trim() : value;
  const full = start.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return { y: full[1], m: full[2], d: full[3] };
  return { y: '', m: '', d: '' };
}
