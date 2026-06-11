import {
  type EventVisibleTabId,
  EVENT_VISIBLE_TAB_LABELS,
  EVENT_VISIBLE_TAB_ORDER,
  orderVisibleTabIds,
} from '../../service/bookletEvent/createEvent/eventTemplateTypes';

/** 수련회 편집기에서 지원하는 탭 (프로필 등 미지원 탭 제외) */
export const RETREAT_SUPPORTED_TAB_IDS = new Set<EventVisibleTabId>([
  'info',
  'greeting',
  'program',
  'order',
  'apply',
]);

export type RetreatEditTabId = 'info' | 'greeting' | 'program' | 'order' | 'apply';

const DEFAULT_RETREAT_TABS: RetreatEditTabId[] = ['info', 'order', 'apply'];

/** 편집기 UI용 탭 라벨 (목업 기준) */
export const RETREAT_EDITOR_TAB_LABELS: Record<RetreatEditTabId, string> = {
  info: '기본 정보',
  greeting: '초대의 글',
  program: '프로그램',
  order: '일정 & 순서',
  apply: '신청 설정',
};

export function parseRetreatVisibleTabs(raw: unknown): RetreatEditTabId[] {
  if (raw == null || raw === '') return [...DEFAULT_RETREAT_TABS];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [...DEFAULT_RETREAT_TABS];
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) {
          return filterRetreatTabs(parsed.map(String));
        }
      } catch {
        /* fall through */
      }
    }
    if (t.includes(',')) {
      return filterRetreatTabs(t.split(',').map((s) => s.trim()));
    }
    return filterRetreatTabs([t]);
  }
  if (Array.isArray(raw)) return filterRetreatTabs(raw.map(String));
  return [...DEFAULT_RETREAT_TABS];
}

function filterRetreatTabs(ids: string[]): RetreatEditTabId[] {
  const ordered = orderVisibleTabIds(ids).filter((id) => RETREAT_SUPPORTED_TAB_IDS.has(id));
  if (ordered.length === 0) return [...DEFAULT_RETREAT_TABS];
  return ordered as RetreatEditTabId[];
}

/** 미리보기 상단 탭 라벨 (공개 전단지 탭명) */
const RETREAT_PREVIEW_TAB_LABELS: Partial<Record<RetreatEditTabId, string>> = {
  order: '프로그램',
};

export function retreatTabLabel(id: RetreatEditTabId): string {
  return RETREAT_PREVIEW_TAB_LABELS[id] ?? EVENT_VISIBLE_TAB_LABELS[id] ?? id;
}

export function retreatEditorTabLabel(id: RetreatEditTabId): string {
  return RETREAT_EDITOR_TAB_LABELS[id] ?? retreatTabLabel(id);
}

export function retreatEditorTabStep(list: RetreatEditTabId[], id: RetreatEditTabId): number {
  const idx = list.indexOf(id);
  return idx >= 0 ? idx + 1 : 1;
}

export function nextRetreatTab(
  list: RetreatEditTabId[],
  current: RetreatEditTabId,
): RetreatEditTabId | null {
  const idx = list.indexOf(current);
  if (idx < 0 || idx >= list.length - 1) return null;
  return list[idx + 1];
}

export function prevRetreatTab(
  list: RetreatEditTabId[],
  current: RetreatEditTabId,
): RetreatEditTabId | null {
  const idx = list.indexOf(current);
  if (idx <= 0) return null;
  return list[idx - 1];
}

export const RETREAT_TAB_DEFS = EVENT_VISIBLE_TAB_ORDER.filter((id) =>
  RETREAT_SUPPORTED_TAB_IDS.has(id),
).map((id) => ({ id: id as RetreatEditTabId, label: retreatTabLabel(id as RetreatEditTabId) }));
