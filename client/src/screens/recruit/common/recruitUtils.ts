import type { RecruitBoardConfig, RecruitListItem } from './RecruitTypes';

export function renderPreview30(content: string) {
  if (content?.length > 30) return `${content.substring(0, 30)}...`;
  return content;
}

export function renderPreview50(content: string) {
  if (content?.length > 50) return `${content.substring(0, 50)}...`;
  return content;
}

export function highlightSearchText(text: string, searchTerms: string[]) {
  if (!searchTerms?.length || !text) return text;

  let highlightedText = text;
  searchTerms.forEach((term) => {
    if (term?.trim()) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<span style="color:rgb(30, 0, 199); font-weight: bold;">$1</span>',
      );
    }
  });
  return highlightedText;
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

export function matchesSortFilter(
  item: { sort?: string; title?: string },
  selectedSort: string[],
  config: RecruitBoardConfig,
) {
  if (selectedSort.length === 0) return true;
  const field = config.sortFilterField === 'title' ? item.title : item.sort;
  return selectedSort.some((s) => field && field.includes(s));
}

export function matchesLocationFilter(
  item: { location?: string },
  selectedLocation: string[],
) {
  if (selectedLocation.length === 0) return true;
  return selectedLocation.some(
    (selectedLoc) =>
      item.location === selectedLoc ||
      (item.location && item.location.includes(selectedLoc)),
  );
}

export function matchesReligiousbodyFilter(
  item: { religiousbody?: string },
  selectedReligiousbody: string[],
) {
  if (selectedReligiousbody.length === 0) return true;
  return selectedReligiousbody.includes(item.religiousbody || '');
}

export function filterRecruitItems(
  data: RecruitListItem[],
  selectedSort: string[],
  selectedLocation: string[],
  selectedReligiousbody: string[],
  config: RecruitBoardConfig,
): RecruitListItem[] {
  return data.filter(
    (item) =>
      matchesSortFilter(item, selectedSort, config) &&
      matchesLocationFilter(item, selectedLocation) &&
      matchesReligiousbodyFilter(item, selectedReligiousbody),
  );
}
