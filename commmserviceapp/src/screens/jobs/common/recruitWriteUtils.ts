/** 채용 등록 폼 — 직무(sort) 선택에 따른 배열 초기화 등 */

export type SortContent = { sort: string; content: string };
export type WorkTimeSunDay = {
  sort: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
export type WorkTimeWeek = WorkTimeSunDay & { day: string };
export type PayItem = { sort: string; paySort: string; selectCost: string; inputCost: string };
export type ApplyTime = { startDay: string; endDay: string; daySort: string };

export function pad2(n: number) {
  const s = String(n);
  return s.length > 1 ? s : `0${s}`;
}

export function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toggleCommaSeparated(current: string, item: string) {
  const list = current ? current.split(', ').filter(Boolean) : [];
  if (list.includes(item)) {
    return list.filter(v => v !== item).join(', ');
  }
  return [...list, item].join(', ');
}

/** @see RecruitMinisterPost — 직무 선택 시 하위 sort 키 목록 */
export function resolveEmploymentSorts(sort: string): string[] {
  if (!sort) return ['전임'];
  if (sort === '전임&준전임') return ['전임', '준전임'];
  if (sort === '전임&파트') return ['전임', '파트'];
  if (sort === '준전임&파트') return ['준전임', '파트'];
  return [sort];
}

export function buildSortContent(sorts: string[]): SortContent[] {
  return sorts.map(s => ({ sort: s, content: '' }));
}

export function buildWorkTimeSunDay(sorts: string[]): WorkTimeSunDay[] {
  return sorts.map(s => ({
    sort: s,
    startHour: '09',
    startMinute: '00',
    endHour: '16',
    endMinute: '00',
  }));
}

export function buildWorkTimeWeek(sorts: string[]): WorkTimeWeek[] {
  return sorts.map(s => ({
    sort: s,
    startHour: '09',
    startMinute: '00',
    endHour: '17',
    endMinute: '00',
    day: '평일',
  }));
}

export function buildPayItems(sorts: string[]): PayItem[] {
  return sorts.map(s => ({ sort: s, paySort: '월', selectCost: '', inputCost: '' }));
}

export function applyWorkdayPreset(preset: string): string {
  if (preset === '주6일(화~일)') return '화,수,목,금,토,일';
  if (preset === '주4일(수금토일)') return '수,금,토,일';
  if (preset === '주3일(수토일)') return '수,토,일';
  if (preset === '주3일(금토일)') return '금,토,일';
  if (preset === '주말(토일)') return '토,일';
  return '';
}

export type MinisterSortArrays = {
  part: SortContent[];
  partDetail: SortContent[];
  school: SortContent[];
  career: SortContent[];
  workday: SortContent[];
  workTimeSunDay: WorkTimeSunDay[];
  workTimeWeek: WorkTimeWeek[];
  dawnPray: SortContent[];
  pay: PayItem[];
  insurance: SortContent[];
  severance: SortContent[];
  welfare: SortContent[];
  applydoc: SortContent[];
};

export function buildMinisterArraysForSort(sort: string): MinisterSortArrays {
  const sorts = resolveEmploymentSorts(sort);
  return {
    part: buildSortContent(sorts),
    partDetail: buildSortContent(sorts),
    school: buildSortContent(sorts),
    career: buildSortContent(sorts),
    workday: buildSortContent(sorts),
    workTimeSunDay: buildWorkTimeSunDay(sorts),
    workTimeWeek: buildWorkTimeWeek(sorts),
    dawnPray: buildSortContent(sorts),
    pay: buildPayItems(sorts),
    insurance: buildSortContent(sorts),
    severance: buildSortContent(sorts),
    welfare: buildSortContent(sorts),
    applydoc: buildSortContent(sorts),
  };
}

export function buildSimpleArraysForSort(sort: string): { school: SortContent[]; career: SortContent[]; applydoc: SortContent[] } {
  const key = sort || '지휘';
  return {
    school: [{ sort: key, content: '' }],
    career: [{ sort: key, content: '' }],
    applydoc: [{ sort: key, content: '' }],
  };
}

export function updateSortContentRow<T extends SortContent>(
  rows: T[],
  index: number,
  patch: Partial<T>,
): T[] {
  const copy = [...rows];
  copy[index] = { ...copy[index], ...patch };
  return copy;
}

export function addSortContentRow<T extends SortContent>(rows: T[], defaultRow: T): T[] {
  return [...rows, defaultRow];
}

export function removeRowAt<T>(rows: T[], index: number): T[] {
  if (rows.length <= 1) return rows;
  return rows.filter((_, i) => i !== index);
}

export function removeSortContentRow<T extends SortContent>(rows: T[], index: number): T[] {
  return removeRowAt(rows, index);
}
