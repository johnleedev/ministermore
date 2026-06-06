/** churchInfo / eventInfo `imageMainName`: 레거시 단일 파일명 또는 JSON 배열 `["a.jpg","",…]` (최대 5) · 슬롯별 `{ name }` 허용 */

export const MAIN_IMAGE_SLOT_COUNT = 5;

function slotNameFromParsed(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'name' in v && typeof (v as { name: unknown }).name === 'string') {
    return (v as { name: string }).name;
  }
  return '';
}

/** DB 문자열 → 고정 5슬롯 (레거시 3요소 배열은 뒤를 빈 문자열로 패딩) */
export function parseMainImageNameFromDb(raw: string | undefined | null): [string, string, string, string, string] {
  const empty: [string, string, string, string, string] = ['', '', '', '', ''];
  if (raw == null || !String(raw).trim()) return empty;
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) {
        return [
          slotNameFromParsed(p[0]),
          slotNameFromParsed(p[1]),
          slotNameFromParsed(p[2]),
          slotNameFromParsed(p[3]),
          slotNameFromParsed(p[4]),
        ];
      }
    } catch {
      /* ignore */
    }
    return empty;
  }
  return [s, '', '', '', ''];
}

export function serializeMainImageNameForDb(slots: readonly string[]): string {
  const a = Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, (_, i) => (slots[i] != null ? String(slots[i]) : '').trim() || '');
  if (a.every((x) => !x)) return '';
  return JSON.stringify(a);
}

/** dirty 스냅샷 비교용 — DB 레거시와 클라이언트 상태를 동일 문자열로 맞춤 */
export function normalizeImageMainNameForSnapshot(raw: string | undefined | null): string {
  return serializeMainImageNameForDb(parseMainImageNameFromDb(raw));
}
