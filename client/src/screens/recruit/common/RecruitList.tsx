import React, { useEffect, useState } from 'react';
import '../../ForListPage.scss';
import './RecruitList.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import { fetchScrapStatusMap, scrapKeyOf, toggleScrap } from '../../mypage/scrapApi';
import { sortList, citydata } from '../../../DefaultData';
import Pagination from '../../../components/Pagination';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import type { RecruitBoardConfig, RecruitFilterTab, RecruitListItem } from './RecruitTypes';
import { RECRUIT_RELIGIOUSBODY_OPTIONS } from './recruitConfigs';
import {
  filterRecruitItems,
  highlightSearchText,
  renderPreview30,
  renderPreview50,
  safeJsonParse,
} from './recruitUtils';

type PayEntry = {
  sort: string;
  paySort: string;
  selectCost: string;
  inputCost: string;
};

type PartEntry = {
  sort: string;
  content: string;
};

type ApplyTime = {
  startDay: string;
  endDay: string;
  daySort: string;
};

export default function RecruitList({ config }: { config: RecruitBoardConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [restoredFromRouterState, setRestoredFromRouterState] = useState(false);

  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [scrapMap, setScrapMap] = useState<Record<string, boolean>>({});

  const hasSortTab = config.filterTabs.includes('직무');
  const hasLocationTab = config.filterTabs.includes('지역');
  const hasReligiousbodyTab = config.filterTabs.includes('교단');

  const [refresh, setRefresh] = useState<boolean>(false);
  const [listSort, setListSort] = useState('크롤링');
  const [listView, setListView] = useState<RecruitListItem[]>([]);
  const [searchResult, setSearchResult] = useState<RecruitListItem[] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listAllLength, setListAllLength] = useState<number>(0);
  const [listAllLengthOrigin, setListAllLengthOrigin] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<RecruitFilterTab>(config.filterTabs[0]);
  const [searchWord, setSearchWord] = useState('');
  const [selectedSort, setSelectedSort] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);
  const [selectedReligiousbody, setSelectedReligiousbody] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil((searchResult ? searchResult.length : listAllLength) / itemsPerPage);
  const cityNames: string[] = citydata.map((c: { city: string }) => c.city);
  const sortOptions = config.sortOptions ?? sortList;

  const getTabOptions = (tab: RecruitFilterTab): string[] => {
    if (tab === '직무') return sortOptions;
    if (tab === '지역') return cityNames;
    if (tab === '교단') return RECRUIT_RELIGIOUSBODY_OPTIONS;
    return [];
  };

  const getCurrentSearchTerms = () => {
    const terms = [
      ...(hasSortTab ? selectedSort : []),
      ...(hasLocationTab ? selectedLocation : []),
      ...(hasReligiousbodyTab ? selectedReligiousbody : []),
    ];
    if (searchWord.trim()) {
      terms.push(searchWord.trim());
    }
    return terms;
  };

  const getSelectedChips = () => [
    ...(hasSortTab ? selectedSort : []),
    ...(hasLocationTab ? selectedLocation : []),
    ...(hasReligiousbodyTab ? selectedReligiousbody : []),
  ];

  const fetchPosts = async () => {
    if (searchResult) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${MainURL}/${config.apiBase}/getrecruitdata/${currentPage}`);
      if (res.data.resultData) {
        setListView(res.data.resultData);
        setListAllLength(res.data.totalCount);
        setListAllLengthOrigin(res.data.totalCount);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refresh, currentPage, listSort]);

  useEffect(() => {
    if (restoredFromRouterState) return;
    const state: { recruitState?: {
      searchWord?: string;
      selectedSort?: string[];
      selectedLocation?: string[];
      selectedReligiousbody?: string[];
      currentPage?: number;
    } } = (location && location.state) || {};
    const recruitState = state?.recruitState;
    if (recruitState) {
      if (hasSortTab) setSelectedSort(recruitState.selectedSort || []);
      if (hasLocationTab) setSelectedLocation(recruitState.selectedLocation || []);
      if (hasReligiousbodyTab) setSelectedReligiousbody(recruitState.selectedReligiousbody || []);
      setSearchWord(recruitState.searchWord || '');
      setCurrentPage(recruitState.currentPage || 1);
      const hasFilters =
        (recruitState.searchWord && recruitState.searchWord.trim()) ||
        (hasSortTab && recruitState.selectedSort && recruitState.selectedSort.length) ||
        (hasLocationTab && recruitState.selectedLocation && recruitState.selectedLocation.length) ||
        (hasReligiousbodyTab && recruitState.selectedReligiousbody && recruitState.selectedReligiousbody.length);
      if (hasFilters) {
        performUnifiedSearch({
          searchWord: recruitState.searchWord || '',
          selectedSort: hasSortTab ? recruitState.selectedSort || [] : [],
          selectedLocation: hasLocationTab ? recruitState.selectedLocation || [] : [],
          selectedReligiousbody: hasReligiousbodyTab ? recruitState.selectedReligiousbody || [] : [],
        });
      }
      setRestoredFromRouterState(true);
    }
  }, [location, restoredFromRouterState]);

  const handleSelect = (item: string, type: RecruitFilterTab) => {
    let selected: string[];
    let setSelected: React.Dispatch<React.SetStateAction<string[]>>;

    if (type === '직무') {
      selected = selectedSort;
      setSelected = setSelectedSort;
    } else if (type === '지역') {
      selected = selectedLocation;
      setSelected = setSelectedLocation;
    } else if (type === '교단') {
      selected = selectedReligiousbody;
      setSelected = setSelectedReligiousbody;
    } else {
      return;
    }

    const newSelected = selected.includes(item)
      ? selected.filter((i) => i !== item)
      : [...selected, item];
    setSelected(newSelected);
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setCurrentPage(1);
    if (hasSortTab) setSelectedSort([]);
    if (hasLocationTab) setSelectedLocation([]);
    if (hasReligiousbodyTab) setSelectedReligiousbody([]);
    setSearchWord('');
    setIsSearching(false);
    setListAllLength(listAllLengthOrigin);
  };

  const handleUnifiedSearch = async () => {
    const noFilters =
      !searchWord &&
      (!hasSortTab || selectedSort.length === 0) &&
      (!hasLocationTab || selectedLocation.length === 0) &&
      (!hasReligiousbodyTab || selectedReligiousbody.length === 0);
    if (noFilters) {
      alert('검색 조건을 입력/선택해주세요');
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);

    const res = await axios.post(`${MainURL}/${config.apiBase}/recruitsearchunified`, {
      searchWord: searchWord || '',
      sort: hasSortTab ? selectedSort : [],
      location: hasLocationTab ? selectedLocation : [],
      religiousbody: hasReligiousbodyTab ? selectedReligiousbody : [],
    });

    if (res.data.resultData) {
      const filtered = filterRecruitItems(
        res.data.resultData,
        hasSortTab ? selectedSort : [],
        hasLocationTab ? selectedLocation : [],
        hasReligiousbodyTab ? selectedReligiousbody : [],
        config,
      );
      const sorted = filtered.sort((a, b) => Number(b.id) - Number(a.id));
      setSearchResult(sorted);
      setListAllLength(sorted.length);
    } else {
      setSearchResult([]);
      setListAllLength(0);
    }
  };

  const performUnifiedSearch = async ({
    searchWord: sw,
    selectedSort: ss,
    selectedLocation: sl,
    selectedReligiousbody: sr,
  }: {
    searchWord: string;
    selectedSort: string[];
    selectedLocation: string[];
    selectedReligiousbody: string[];
  }) => {
    const res = await axios.post(`${MainURL}/${config.apiBase}/recruitsearchunified`, {
      searchWord: sw || '',
      sort: ss,
      location: sl,
      religiousbody: sr,
    });
    if (res.data.resultData) {
      const filtered = filterRecruitItems(res.data.resultData, ss, sl, sr, config);
      const sorted = filtered.sort((a, b) => Number(b.id) - Number(a.id));
      setSearchResult(sorted);
      setListAllLength(sorted.length);
      setCurrentPage(1);
    } else {
      setSearchResult([]);
      setListAllLength(0);
      setCurrentPage(1);
    }
  };

  const pagedList = searchResult
    ? searchResult.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : listView;

  useEffect(() => {
    if (!userData.userAccount || pagedList.length === 0) {
      setScrapMap({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const targets = pagedList.map(item => ({
          targetType: 'recruit' as const,
          targetId: String(item.id),
          tableType:
            config.simplePostType === 'church'
              ? 'church'
              : config.simplePostType === 'institute'
                ? 'institute'
                : 'minister',
        }));
        const map = await fetchScrapStatusMap(userData.userAccount, targets);
        if (!cancelled) setScrapMap(map);
      } catch {
        if (!cancelled) setScrapMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userData.userAccount, pagedList, config.simplePostType]);

  const handleToggleScrap = async (item: RecruitListItem) => {
    if (!isLogin || !userData.userAccount) {
      alert('로그인이 필요합니다.');
      return;
    }
    const tableType =
      config.simplePostType === 'church'
        ? 'church'
        : config.simplePostType === 'institute'
          ? 'institute'
          : 'minister';
    const payload = {
      targetType: 'recruit' as const,
      targetId: String(item.id),
      tableType,
      title: String(item.title || ''),
      subtitle: String(item.church || ''),
      meta: `${item.location || ''} ${item.locationDetail || ''}`.trim(),
      linkPath: config.detailPath ? `${config.detailPath}?id=${item.id}` : '',
    };
    const key = scrapKeyOf(payload);
    const before = Boolean(scrapMap[key]);
    setScrapMap(prev => ({ ...prev, [key]: !before }));
    try {
      const res = await toggleScrap(userData.userAccount, payload);
      setScrapMap(prev => ({ ...prev, [key]: res.scrapped }));
    } catch {
      setScrapMap(prev => ({ ...prev, [key]: before }));
      alert('스크랩 처리에 실패했습니다.');
    }
  };

  const handleRemoveSelected = (item: string) => {
    if (hasSortTab && selectedSort.includes(item)) {
      setSelectedSort(selectedSort.filter((i) => i !== item));
    } else if (hasLocationTab && selectedLocation.includes(item)) {
      setSelectedLocation(selectedLocation.filter((i) => i !== item));
    } else if (hasReligiousbodyTab && selectedReligiousbody.includes(item)) {
      setSelectedReligiousbody(selectedReligiousbody.filter((i) => i !== item));
    }
  };

  const handleItemClick = (itemId: string | number) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    axios.post(`${MainURL}/admin/countup`, { date, type: 'recruitview' });

    const recruitState = {
      searchWord,
      selectedSort: hasSortTab ? selectedSort : [],
      selectedLocation: hasLocationTab ? selectedLocation : [],
      selectedReligiousbody: hasReligiousbodyTab ? selectedReligiousbody : [],
      currentPage,
    };
    navigate(`${config.detailPath}?id=${itemId}`, { state: { recruitState } });
    window.scrollTo(0, 0);
  };

  const renderHighlighted = (text: string) =>
    searchResult ? highlightSearchText(text, getCurrentSearchTerms()) : text;

  const renderPayLine = (payEntry: PayEntry) => {
    if (payEntry.inputCost === '교회내규에따라' || payEntry.inputCost === '협의후결정') {
      return (
        <p
          style={{ color: '#333' }}
          dangerouslySetInnerHTML={{ __html: renderHighlighted(renderPreview50(payEntry.inputCost)) }}
        />
      );
    }
    if (payEntry.selectCost === '' && payEntry.inputCost !== '') {
      return (
        <p
          style={{ color: '#333' }}
          dangerouslySetInnerHTML={{
            __html: renderHighlighted(renderPreview50(`${payEntry.sort} : ${payEntry.inputCost}`)),
          }}
        />
      );
    }
    return (
      <p
        style={{ color: '#333' }}
        dangerouslySetInnerHTML={{
          __html: renderHighlighted(
            renderPreview50(`${payEntry.sort} : ${payEntry.paySort} ${payEntry.selectCost}`),
          ),
        }}
      />
    );
  };

  const isTabItemSelected = (item: string, tab: RecruitFilterTab) => {
    if (tab === '직무') return selectedSort.includes(item);
    if (tab === '지역') return selectedLocation.includes(item);
    if (tab === '교단') return selectedReligiousbody.includes(item);
    return false;
  };

  return (
    <div className="recruit">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>{config.boardTitle}</h3>
            <div
              className="postBtn"
              onClick={() => {
                if (isLogin) {
                  navigate(config.postPath);
                } else {
                  alert('로그인이 필요합니다.');
                }
              }}
            >
              <p>공고등록</p>
            </div>
          </div>

          <div className="subpage__main__tabrow">
            {config.filterTabs.map((tab) => (
              <button
                key={tab}
                className={`subpage__main__tabbtn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="checkInputCover Recruit">
            {getTabOptions(activeTab).map((item, index) => (
              <div
                className={`checkInputbox ${isTabItemSelected(item, activeTab) ? 'selected' : ''}`}
                key={index}
                onClick={() => handleSelect(item, activeTab)}
              >
                {activeTab === '교단' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img
                      src={`${MainURL}/${config.religiousbodyDetailImagePath}/${item}.jpg`}
                      alt={item}
                      style={{ width: '15px', height: '15px', objectFit: 'contain' }}
                    />
                    <p>{item}</p>
                  </span>
                ) : (
                  <p>{item}</p>
                )}
              </div>
            ))}
          </div>

          <div className="subpage__main__selectedwords">
            <b>선택된 단어:</b>
            <div className="subpage__main__selectedwords__list">
              {getSelectedChips().length === 0 ? (
                <span className="subpage__main__selectedwords__none">없음</span>
              ) : (
                getSelectedChips().map((item, idx) => (
                  <span key={idx} className="subpage__main__selectedwords__item">
                    {item}
                    <button
                      className="subpage__main__selectedwords__remove"
                      onClick={() => handleRemoveSelected(item)}
                      aria-label="삭제"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="subpage__main__search">
            <input
              className="inputdefault width"
              type="text"
              placeholder="교회명, 제목으로 검색"
              value={searchWord}
              onChange={(e) => {
                setSearchWord(e.target.value);
              }}
              style={{ margin: '0', outline: 'none', paddingLeft: '10px', border: '1px solid #ccc' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnifiedSearch();
                }
              }}
            />
            <div className="buttons">
              <div className="btn search" onClick={handleUnifiedSearch}>
                <p>검색</p>
              </div>
              <div className="btn reset" onClick={handleClearSearch}>
                <p>초기화</p>
              </div>
            </div>
          </div>

          <div className="subpage__main__content">
            {isLoading ? (
              <div className="list-loading">
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                <div className="recruit__wrap--category">
                  <div className="recruit__wrap--menu">
                    <div className="recruit_menu_box">
                      <p className="recruit_menu_text">교회명</p>
                    </div>
                    <div className="recruit_menu_box">
                      <p className="recruit_menu_text">구인정보/교단/지원자격/사례</p>
                    </div>
                    <div className="recruit_menu_box">
                      <p className="recruit_menu_text">{config.etcColumnLabel}</p>
                    </div>
                    <div className="recruit_menu_box">
                      <p className="recruit_menu_text">등록일/모집기간</p>
                    </div>
                  </div>

                  <div className="recruit__wrap--item">
                    {pagedList.length === 0 ? (
                      <div
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          color: '#888',
                          fontSize: '18px',
                          padding: '60px 0',
                          background: '#f9f9f9',
                          borderRadius: '10px',
                          border: '1px solid #eee',
                          margin: '30px 0',
                        }}
                      >
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      pagedList.map((item, index) => {
                        const part = safeJsonParse<PartEntry[]>(item.part, [
                          { sort: '전임', content: '' },
                        ]);
                        const pay = safeJsonParse<PayEntry[]>(item.pay, [
                          { sort: '전임', paySort: 'select', selectCost: '', inputCost: '' },
                        ]);
                        const applytime = safeJsonParse<ApplyTime>(item.applytime, {
                          startDay: '',
                          endDay: '',
                          daySort: '',
                        });
                        const scrapActive = scrapMap[scrapKeyOf({
                          targetType: 'recruit',
                          targetId: String(item.id),
                          tableType:
                            config.simplePostType === 'church'
                              ? 'church'
                              : config.simplePostType === 'institute'
                                ? 'institute'
                                : 'minister',
                        })];

                        return (
                          <div
                            key={index}
                            className="recruit__item"
                            onClick={() => handleItemClick(item.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div
                              className="recruit__name"
                              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: renderHighlighted(item.church),
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleToggleScrap(item);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  padding: 0,
                                  margin: 0,
                                  fontSize: 20,
                                  lineHeight: 1,
                                  cursor: 'pointer',
                                  color: scrapActive ? '#ef4444' : '#9ca3af',
                                }}
                                aria-label="스크랩">
                                {scrapActive ? '♥' : '♡'}
                              </button>
                            </div>
                            <div className="recruit__content">
                              <div className="recruit__title_box" style={{ lineHeight: '1.5' }}>
                                <p
                                  className="recruit__title"
                                  dangerouslySetInnerHTML={{
                                    __html: renderHighlighted(item.title),
                                  }}
                                />
                              </div>
                              <div className="recruit__sort_box">
                                <div className="recruit__religiousbody_box">
                                  <img
                                    src={`${MainURL}/siteimages/religiousbody/${item.religiousbody}.jpg`}
                                  />
                                  <p
                                    className="recruit__religiousbody"
                                    dangerouslySetInnerHTML={{
                                      __html: renderHighlighted(item.religiousbody),
                                    }}
                                  />
                                </div>
                                <p style={{ margin: '0 10px', color: '#ccc' }}>|</p>
                                <div className="recruit__religiousbody_box">
                                  {item.source !== '사역자모아' && (
                                    <img src={`${MainURL}/siteimages/schoolround/${item.source}.jpg`} />
                                  )}
                                  <p
                                    className="recruit__religiousbody"
                                    dangerouslySetInnerHTML={{
                                      __html: renderHighlighted(item.source),
                                    }}
                                  />
                                </div>
                              </div>
                              {config.showPayInList && (
                                <div className="recruit__detail_box">
                                  {renderPayLine(pay[0])}
                                  {pay.length > 1 && renderPayLine(pay[1])}
                                </div>
                              )}
                              <div className="recruit__detail_box">
                                {item.part !== '' && item.part != null && (
                                  <p
                                    style={{ fontSize: '14px' }}
                                    dangerouslySetInnerHTML={{
                                      __html: renderHighlighted(renderPreview30(part[0].content)),
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="recruit__etc_box">
                              <div className="recruit__etc sortPay">
                                {config.showSortInListEtc && (
                                  <p
                                    dangerouslySetInnerHTML={{
                                      __html: renderHighlighted(item.sort),
                                    }}
                                  />
                                )}
                                <p
                                  dangerouslySetInnerHTML={{
                                    __html: renderHighlighted(
                                      `${item.location} ${item.locationDetail}`,
                                    ),
                                  }}
                                />
                              </div>
                              <div className="recruit__etc dateTime">
                                <p
                                  dangerouslySetInnerHTML={{
                                    __html: renderHighlighted(item.date),
                                  }}
                                />
                                {applytime.daySort !== '' ? (
                                  <p
                                    dangerouslySetInnerHTML={{
                                      __html: renderHighlighted(applytime.daySort),
                                    }}
                                  />
                                ) : (
                                  <>
                                    {applytime.startDay !== '' && (
                                      <p
                                        dangerouslySetInnerHTML={{
                                          __html: renderHighlighted(`~ ${applytime.endDay}`),
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onAfterChange={() => window.scrollTo(0, 500)}
            />
          </div>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
}
