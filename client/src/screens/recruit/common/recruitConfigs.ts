import { religiousbodyList, sortList } from '../../../DefaultData';
import type { RecruitBoardConfig } from './RecruitTypes';

const CHURCH_JOB_SORTS = ['찬양대', '방송', '직원'];

export const MINISTER_RECRUIT_CONFIG: RecruitBoardConfig = {
  boardTitle: '사역자구인',
  apiBase: 'recruitminister',
  listPath: '/recruit',
  postPath: '/recruit/recruitministerpost',
  detailPath: '/recruit/recruitministerdetail',
  filterTabs: ['직무', '지역', '교단'],
  sortOptions: sortList,
  sortFilterField: 'sort',
  showPayInList: true,
  showSortInListEtc: true,
  etcColumnLabel: '사역조건/지역',
  showMinistryDetail: true,
  churchLogoImagePath: 'images/recruit/churchlogo',
  religiousbodyDetailImagePath: 'siteimages/religiousbody',
};

export const CHURCH_RECRUIT_CONFIG: RecruitBoardConfig = {
  boardTitle: '찬양대/방송/직원 구인',
  apiBase: 'recruitchurch',
  listPath: '/recruit/recruitchurchlist',
  postPath: '/recruit/recruitchurchpost',
  detailPath: '/recruit/recruitchurchdetail',
  filterTabs: ['직무', '지역'],
  sortOptions: CHURCH_JOB_SORTS,
  sortFilterField: 'title',
  showPayInList: false,
  showSortInListEtc: false,
  etcColumnLabel: '지역',
  showMinistryDetail: false,
  churchLogoImagePath: 'siteimages/churchlogos',
  religiousbodyDetailImagePath: 'images/recruit/religiousbody',
  simplePostType: 'church',
};

export const INSTITUTE_RECRUIT_CONFIG: RecruitBoardConfig = {
  boardTitle: '학교/기관/단체 구인',
  apiBase: 'recruitinstitute',
  listPath: '/recruit/recruitinstitutelist',
  postPath: '/recruit/recruitinstitutepost',
  detailPath: '/recruit/recruitinstitutedetail',
  filterTabs: ['지역'],
  sortFilterField: 'title',
  showPayInList: false,
  showSortInListEtc: false,
  etcColumnLabel: '지역',
  showMinistryDetail: false,
  churchLogoImagePath: 'siteimages/churchlogos',
  religiousbodyDetailImagePath: 'images/recruit/religiousbody',
  simplePostType: 'institute',
};

/** 교단 필터 탭 옵션 */
export const RECRUIT_RELIGIOUSBODY_OPTIONS = religiousbodyList;
