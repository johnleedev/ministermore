import { ScreenCategoryTabs } from '../shared/ScreenCategoryTabs';
import { createScreenCategoryContext } from '../shared/screenCategoryContext';

export type RetreatCategory = 'place' | 'review' | 'casting' | 'upgrade';

export const RETREAT_CATEGORY_TABS = [
  { key: 'place' as const, label: '수련회장소' },
  { key: 'review' as const, label: '장소후기' },
  { key: 'casting' as const, label: '수련회강사' },
  { key: 'upgrade' as const, label: '등업신청' },
];

const { Provider, useScreenCategory } = createScreenCategoryContext<RetreatCategory>();

export const RetreatCategoryProvider = Provider;
export const useRetreatCategory = useScreenCategory;

export function RetreatCategoryTabs() {
  const { category, setCategory } = useRetreatCategory();
  return (
    <ScreenCategoryTabs tabs={RETREAT_CATEGORY_TABS} active={category} onChange={setCategory} />
  );
}
