import type { RetreatInfoForm, RetreatProgramRow } from './types';

export const EMPTY_RETREAT_INFO: RetreatInfoForm = {
  eventName: '',
  eventNameEn: '',
  date: '',
  place: '',
  superViser: '',
  address: '',
  quiry: '',
  placeNaver: '',
  placeKakao: '',
  programType: 'concert',
  visibleTabs: 'info,program,apply',
  applyNote: '',
  eventGreeting: '',
  imageMain: '',
};

export function createEmptyProgramRow(order = 0): RetreatProgramRow {
  return {
    showOrder: String(order),
    subTitle: '',
    title: '',
    dateTime: '',
    career: '',
    postImage: '',
    showDateTime: true,
  };
}

/** API/MySQL tinyint(1) → boolean */
export function normalizeShowDateTime(value: boolean | number | undefined | null): boolean {
  return value !== false && value !== 0;
}

export function normalizeProgramRow(
  row: Partial<RetreatProgramRow> & { showDateTime?: boolean | number },
): RetreatProgramRow {
  return {
    id: row.id,
    showOrder: row.showOrder ?? '0',
    subTitle: row.subTitle ?? '',
    title: row.title ?? '',
    dateTime: row.dateTime ?? '',
    career: row.career ?? '',
    postImage: row.postImage ?? '',
    showDateTime: normalizeShowDateTime(row.showDateTime),
  };
}

export function mapInfoToForm(
  info: (RetreatInfoForm & { id?: number; bookletId?: string }) | null,
): RetreatInfoForm {
  if (!info) return { ...EMPTY_RETREAT_INFO };
  return {
    eventName: info.eventName ?? '',
    eventNameEn: info.eventNameEn ?? '',
    date: info.date ?? '',
    place: info.place ?? '',
    superViser: info.superViser ?? '',
    address: info.address ?? '',
    quiry: info.quiry ?? '',
    placeNaver: info.placeNaver ?? '',
    placeKakao: info.placeKakao ?? '',
    programType: info.programType ?? 'concert',
    visibleTabs: info.visibleTabs ?? 'info,program,apply',
    applyNote: info.applyNote ?? '',
    eventGreeting: info.eventGreeting ?? '',
    imageMain: info.imageMain ?? '',
  };
}
