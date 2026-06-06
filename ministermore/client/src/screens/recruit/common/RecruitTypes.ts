export type RecruitFilterTab = '직무' | '지역' | '교단';

export interface RecruitListItem {
  id: number | string;
  title: string;
  source: string;
  writer?: string;
  date: string;
  church: string;
  religiousbody: string;
  location: string;
  locationDetail: string;
  address?: string;
  mainpastor?: string;
  homepage?: string;
  school?: string;
  career?: string;
  sort: string;
  part?: string;
  partDetail?: string;
  recruitNum?: string;
  workday?: string;
  workTimeSunDay?: string;
  workTimeWeek?: string;
  dawnPray?: string;
  pay?: string;
  welfare?: string;
  insurance?: string;
  severance?: string;
  applydoc?: string;
  applyhow?: string;
  applytime?: string;
  etcNotice?: string;
  inquiry?: string;
  churchLogo?: string;
  customInput?: string;
  link?: string;
}

export interface RecruitBoardConfig {
  boardTitle: string;
  apiBase: string;
  listPath: string;
  postPath: string;
  detailPath: string;
  filterTabs: RecruitFilterTab[];
  /** 직무 탭 옵션 (미지정 시 DefaultData.sortList) */
  sortOptions?: string[];
  /** 직무 필터 대상 필드 */
  sortFilterField: 'sort' | 'title';
  showPayInList: boolean;
  showSortInListEtc: boolean;
  etcColumnLabel: string;
  showMinistryDetail: boolean;
  churchLogoImagePath: string;
  religiousbodyDetailImagePath: string;
  /** church / institute 공고등록 폼용 */
  simplePostType?: 'church' | 'institute';
}
