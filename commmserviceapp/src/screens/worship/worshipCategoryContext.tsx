import { ScreenCategoryTabs } from '../shared/ScreenCategoryTabs';
import { createScreenCategoryContext } from '../shared/screenCategoryContext';

export type WorshipCategory = 'songs' | 'conti';

export const WORSHIP_CATEGORY_TABS = [
  { key: 'songs' as const, label: '적용찬양' },
  { key: 'conti' as const, label: '콘티작성' },
];

const { Provider, useScreenCategory } = createScreenCategoryContext<WorshipCategory>();

export const WorshipCategoryProvider = Provider;
export const useWorshipCategory = useScreenCategory;

export function WorshipCategoryTabs() {
  const { category, setCategory } = useWorshipCategory();
  return (
    <ScreenCategoryTabs tabs={WORSHIP_CATEGORY_TABS} active={category} onChange={setCategory} />
  );
}
