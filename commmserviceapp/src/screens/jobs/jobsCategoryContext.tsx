import { ScreenCategoryTabs } from '../shared/ScreenCategoryTabs';
import { createScreenCategoryContext } from '../shared/screenCategoryContext';

export type JobCategory = 'minister' | 'church' | 'institute';

export const JOB_CATEGORY_TABS = [
  { key: 'minister' as const, label: '사역자' },
  { key: 'church' as const, label: '찬양대/방송/직원' },
  { key: 'institute' as const, label: '학교/기관/단체' },
];

const { Provider, useScreenCategory } = createScreenCategoryContext<JobCategory>();

export const JobsCategoryProvider = Provider;
export const useJobsCategory = useScreenCategory;

export function JobsCategoryTabs() {
  const { category, setCategory } = useJobsCategory();
  return (
    <ScreenCategoryTabs tabs={JOB_CATEGORY_TABS} active={category} onChange={setCategory} />
  );
}
