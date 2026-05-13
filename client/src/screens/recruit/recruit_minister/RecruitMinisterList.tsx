import React, { useEffect, useState } from 'react';
import '../../ForListPage.scss';
import '../RecruitList.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import { useRecoilValue } from 'recoil';
import { recoilLoginState } from '../../../RecoilStore';
import { religiousbodyList, locationList, sortList, citydata } from '../../../DefaultData';
import Pagination from '../../../components/Pagination';
import Loading from '../../../components/Loading';



interface ListProps {
  title : string,
  source : string,
  writer : string,
  date : string,
  church : string,
  religiousbody : string,
  location : string,
  locationDetail : string,
  address : string,
  mainpastor : string,
  homepage : string,
  school : string,
  career : string,
  sort : string,
  part : string,
  partDetail : string,
  recruitNum : string,
  workday : string,
  workTimeSunDay : string,
  workTimeWeek : string,
  dawnPray : string,
  pay : string,
  welfare : string,
  insurance : string,
  severance : string,
  applydoc : string,
  applyhow : string,
  applytime : string,
  etcNotice : string,
  inquiry : string,
  churchLogo : string,
  customInput : string,
}

export default function RecruitList (props:any) {

  let navigate = useNavigate();
  const location = useLocation();
  const [restoredFromRouterState, setRestoredFromRouterState] = useState(false);

  const isLogin = useRecoilValue(recoilLoginState);

  const [refresh, setRefresh] = useState<boolean>(false); 
  const [listSort, setListSort] = useState('크롤링');
  const [listView, setListView] = useState<ListProps[]>([]);
  const [searchResult, setSearchResult] = useState<ListProps[] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listAllLength, setListAllLength] = useState<number>(0);
  const [listAllLengthOrigin, setListAllLengthOrigin] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 게시글 가져오기
  const fetchPosts = async () => {
    if (searchResult) return; // 검색 중이면 전체 데이터 fetch X
    setIsLoading(true);
    try {
      const res = await axios.get(`${MainURL}/recruitminister/getrecruitdata/${currentPage}`)
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
  // 라우터 state로 검색/필터 상태 복원
  useEffect(() => {
    if (restoredFromRouterState) return;
    const state: any = (location && (location as any).state) || {};
    const recruitState = state?.recruitState;
    if (recruitState) {
      setSelectedSort(recruitState.selectedSort || []);
      setSelectedLocation(recruitState.selectedLocation || []);
      setSelectedReligiousbody(recruitState.selectedReligiousbody || []);
      setSearchWord(recruitState.searchWord || '');
      setCurrentPage(recruitState.currentPage || 1);
      const hasFilters = (recruitState.searchWord && recruitState.searchWord.trim()) ||
        (recruitState.selectedSort && recruitState.selectedSort.length) ||
        (recruitState.selectedLocation && recruitState.selectedLocation.length) ||
        (recruitState.selectedReligiousbody && recruitState.selectedReligiousbody.length);
      if (hasFilters) {
        // 필터가 있을 경우, 복원된 값으로 통합 검색 실행 (로컬 상태 의존성 제거)
        performUnifiedSearch({
          searchWord: recruitState.searchWord || '',
          selectedSort: recruitState.selectedSort || [],
          selectedLocation: recruitState.selectedLocation || [],
          selectedReligiousbody: recruitState.selectedReligiousbody || [],
        });
      }
      setRestoredFromRouterState(true);
    }
  }, [location, restoredFromRouterState]);


  
  // State 변수 추가
  const itemsPerPage = 10; // 한 페이지당 표시될 게시글 수
  const totalPages = Math.ceil((searchResult ? searchResult.length : listAllLength) / itemsPerPage);

  // 지역 선택 리스트: citydata의 city 필드 사용
  const cityNames: string[] = citydata.map((c: any) => c.city);

  // 글자수 제한
  const renderPreview30 = (content : string) => {
    if (content?.length > 30) {
      return content.substring(0, 30) + '...';
    }
    return content;
  };

  const renderPreview50 = (content : string) => {
    if (content?.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content;
  };

  // 검색어 하이라이트 함수
  const highlightSearchText = (text: string, searchTerms: string[]) => {
    if (!searchTerms || searchTerms.length === 0 || !text) {
      return text;
    }

    let highlightedText = text;
    searchTerms.forEach(term => {
      if (term && term.trim()) {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span style="color:rgb(30, 0, 199); font-weight: bold;">$1</span>');
      }
    });

    return highlightedText;
  };

  // 현재 검색 조건들을 배열로 가져오기
  const getCurrentSearchTerms = () => {
    const terms = [...selectedSort, ...selectedLocation, ...selectedReligiousbody];
    if (searchWord.trim()) {
      terms.push(searchWord.trim());
    }
    return terms;
  };



  const [activeTab, setActiveTab] = useState('직무');
  const [searchWord, setSearchWord] = useState('');
  const [selectedSort, setSelectedSort] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);
  const [selectedReligiousbody, setSelectedReligiousbody] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  
  const handleSelect = (item: string, type: string) => {
    let selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    let newSelected: string[];
    
    if (type === '직무') {
      selected = selectedSort;
      setSelected = setSelectedSort;
    } else if (type === '지역') {
      selected = selectedLocation;
      setSelected = setSelectedLocation;
    } else {
      selected = selectedReligiousbody;
      setSelected = setSelectedReligiousbody;
    }
    
    if (selected.includes(item)) {
      newSelected = selected.filter(i => i !== item);
    } else {
      newSelected = [...selected, item];
    }
    
    setSelected(newSelected);
    
    // 라우터 state 방식으로 유지하므로 별도 저장 제거
  };

  // 교집합 필터링 함수
  const filterByAllConditions = (data: any[]) => {
    return data.filter((item: any) => {
      // sort 조건
      const sortOk = selectedSort.length === 0 || selectedSort.some(s => item.sort && item.sort.includes(s));
      // location 조건 - 선택된 지역이 포함된 모든 지역을 검색
      const locationOk = selectedLocation.length === 0 || selectedLocation.some(selectedLoc => {
        // 정확히 일치하거나, 선택된 지역이 포함된 경우 (예: '강원' 선택시 '강원특별자치도'도 포함)
        return item.location === selectedLoc || item.location.includes(selectedLoc);
      });
      // religiousbody 조건
      const religiousbodyOk = selectedReligiousbody.length === 0 || selectedReligiousbody.includes(item.religiousbody);
      return sortOk && locationOk && religiousbodyOk;
    });
  };

  const handleSearch = async () => {
    // 디버깅: 검색 요청 데이터 확인
    console.log('검색 요청 데이터:', {
      sort: selectedSort,
      location: selectedLocation,
      religiousbody: selectedReligiousbody,
    });
    
    const res = await axios.post(`${MainURL}/recruitminister//recruitsearchlist`, {
      sort: selectedSort,
      location: selectedLocation,
      religiousbody: selectedReligiousbody,
    })
    if (res.data.resultData) {
      // 교집합 필터링
      const filtered = filterByAllConditions(res.data.resultData);
      
      // 최신순으로 정렬 (id 기준 내림차순)
      const sorted = filtered.sort((a: any, b: any) => b.id - a.id);
      
      setSearchResult(sorted);
      setCurrentPage(1);
      setListAllLength(sorted.length);
      
      // 라우터 state 방식으로 유지하므로 localStorage 저장 제거
    }
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setCurrentPage(1);
    setSelectedSort([]);
    setSelectedLocation([]);
    setSelectedReligiousbody([]);
    setSearchWord('');
    setIsSearching(false);
    setListAllLength(listAllLengthOrigin);
    
    // 라우터 state 방식으로 유지하므로 별도 저장 제거
  };

  // 통합 검색 함수
  const handleUnifiedSearch = async () => {
    if (!searchWord && selectedSort.length === 0 && selectedLocation.length === 0 && selectedReligiousbody.length === 0) {
      alert('검색 조건을 입력/선택해주세요');
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);
    
    const res = await axios.post(`${MainURL}/recruitminister//recruitsearchunified`, {
      searchWord: searchWord || '',
      sort: selectedSort,
      location: selectedLocation,
      religiousbody: selectedReligiousbody,
    });

    if (res.data.resultData) {
      // 교집합 필터링
      const filtered = filterByAllConditions(res.data.resultData);
      
      // 최신순으로 정렬 (id 기준 내림차순)
      const sorted = filtered.sort((a: any, b: any) => b.id - a.id);
      
      setSearchResult(sorted);
      setListAllLength(sorted.length);
      
      // 라우터 state 방식으로 유지하므로 localStorage 저장 제거
    } else {
      setSearchResult([]);
      setListAllLength(0);
    }
  };

  // 복원용: 전달받은 값으로 바로 검색 수행 (알림 없이)
  const performUnifiedSearch = async ({
    searchWord: sw,
    selectedSort: ss,
    selectedLocation: sl,
    selectedReligiousbody: sr,
  }: { searchWord: string; selectedSort: string[]; selectedLocation: string[]; selectedReligiousbody: string[]; }) => {
    const res = await axios.post(`${MainURL}/recruitminister//recruitsearchunified`, {
      searchWord: sw || '',
      sort: ss,
      location: sl,
      religiousbody: sr,
    });
    if (res.data.resultData) {
      // 교집합 필터링: 현재 필터 상태로 판단해야 하므로, 전달받은 필터 기준으로 재평가
      const filtered = res.data.resultData.filter((item: any) => {
        const sortOk = ss.length === 0 || ss.some(s => item.sort && item.sort.includes(s));
        const locationOk = sl.length === 0 || sl.some(selectedLoc => item.location === selectedLoc || (item.location && item.location.includes(selectedLoc)));
        const religiousbodyOk = sr.length === 0 || sr.includes(item.religiousbody);
        return sortOk && locationOk && religiousbodyOk;
      });
      const sorted = filtered.sort((a: any, b: any) => b.id - a.id);
      setSearchResult(sorted);
      setListAllLength(sorted.length);
      setCurrentPage(1);
    } else {
      setSearchResult([]);
      setListAllLength(0);
      setCurrentPage(1);
    }
  };

  // 실제로 보여줄 데이터
  const pagedList = searchResult
    ? searchResult.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : listView;

  const handleRemoveSelected = (item: string) => {
    if (selectedSort.includes(item)) {
      const newSelectedSort = selectedSort.filter(i => i !== item);
      setSelectedSort(newSelectedSort);
      
      // 라우터 state 방식으로 유지하므로 별도 저장 제거
    } else if (selectedLocation.includes(item)) {
      const newSelectedLocation = selectedLocation.filter(i => i !== item);
      setSelectedLocation(newSelectedLocation);
      
      // 라우터 state 방식으로 유지하므로 별도 저장 제거
    } else if (selectedReligiousbody.includes(item)) {
      const newSelectedReligiousbody = selectedReligiousbody.filter(i => i !== item);
      setSelectedReligiousbody(newSelectedReligiousbody);
      
      // 라우터 state 방식으로 유지하므로 별도 저장 제거
    }
  };

  // 상세 페이지로 이동하는 함수
  const handleItemClick = (itemId: string) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    axios.post(`${MainURL}/admin/countup`, { date, type: 'recruitview' });
    
    // 라우터 state로 검색 상태 전달 (localStorage 미사용)
    const recruitState = {
      searchWord,
      selectedSort,
      selectedLocation,
      selectedReligiousbody,
      currentPage,
    };
    navigate(`/recruit/recruitministerdetail?id=${itemId}`, { state: { recruitState } });
    window.scrollTo(0, 0);
  };

  return (
    <div className="recruit">

      <div className="inner">

        <div className="subpage__main">
          
          <div className="subpage__main__title">
            <h3>사역자구인</h3>
            <div className='postBtn'
              onClick={()=>{
                if (isLogin) {
                  navigate('/recruit/recruitministerpost');
                } else {
                  alert('로그인이 필요합니다.');
                }
              }}
            >
              <p>공고등록</p>
            </div>
          </div>
        

          <div className="subpage__main__tabrow">
            {['직무', '지역', '교단'].map(tab => (
              <button
                key={tab}
                className={`subpage__main__tabbtn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className='checkInputCover Recruit'>
            {(activeTab === '직무' ? sortList : activeTab === '지역' ? cityNames : religiousbodyList).map((item:any, index:any) => (
              <div
                className={`checkInputbox ${
                  (activeTab === '직무' && selectedSort.includes(item)) ||
                  (activeTab === '지역' && selectedLocation.includes(item)) ||
                  (activeTab === '교단' && selectedReligiousbody.includes(item))
                    ? 'selected'
                    : ''
                }`}
                key={index}
                onClick={() => handleSelect(item, activeTab)}
              >
                {activeTab === '교단' ? (
                  <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
                    <img src={`${MainURL}/siteimages/religiousbody/${item}.jpg`} alt={item} style={{width: '15px', height: '15px', objectFit: 'contain'}} />
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
              {[...selectedSort, ...selectedLocation, ...selectedReligiousbody].length === 0 ? (
                <span className="subpage__main__selectedwords__none">없음</span>
              ) : (
                [...selectedSort, ...selectedLocation, ...selectedReligiousbody].map((item, idx) => (
                  <span
                    key={idx}
                    className="subpage__main__selectedwords__item"
                  >
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
              placeholder='교회명, 제목으로 검색'
              value={searchWord} 
              onChange={(e)=>{setSearchWord(e.target.value)}}
              style={{margin:'0', outline:'none', paddingLeft:'10px', border: '1px solid #ccc'}}
              onKeyDown={(e)=>{if (e.key === 'Enter') {handleUnifiedSearch();}}}
            />
            <div className="buttons">
              <div className="btn search" 
                onClick={handleUnifiedSearch}
              >
                <p>검색</p>
              </div>
              <div className="btn reset"
                onClick={handleClearSearch}
              >
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
                    <div className='recruit_menu_box'>
                      <p className='recruit_menu_text'>교회명</p>
                    </div>
                    <div className='recruit_menu_box'>
                      <p className='recruit_menu_text'>구인정보/교단/지원자격/사례</p> 
                    </div>
                    <div className='recruit_menu_box'>
                      <p className='recruit_menu_text'>사역조건/지역</p> 
                    </div>
                    <div className='recruit_menu_box'>
                      <p className='recruit_menu_text'>등록일/모집기간</p> 
                    </div>
                  </div>

                  <div className="recruit__wrap--item">
                  {
                    pagedList.length === 0 ? (
                      <div style={{
                        width: '100%',
                        textAlign: 'center',
                        color: '#888',
                        fontSize: '18px',
                        padding: '60px 0',
                        background: '#f9f9f9',
                        borderRadius: '10px',
                        border: '1px solid #eee',
                        margin: '30px 0'
                      }}>
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      pagedList.map((item:any, index:any) => {

                      const part = item.part ? JSON.parse(item.part) : [{sort: '전임', content: ''}]
                      const pay = item.pay ? JSON.parse(item.pay) : [{sort: '전임', paySort: 'select', selectCost: '', inputCost: ''}]
                      const applytime = item.applytime ? JSON.parse(item.applytime) : {startDay: '', endDay: '', daySort: ''}

                      return (
                        <div key={index} className="recruit__item" 
                             onClick={() => handleItemClick(item.id)}
                             style={{cursor: 'pointer'}}
                        >
                          <div className="recruit__name">
                            <p dangerouslySetInnerHTML={{ 
                              __html: searchResult ? highlightSearchText(item.church, getCurrentSearchTerms()) : item.church 
                            }} />
                           
                          </div>
                          <div className="recruit__content">
                            <div className='recruit__title_box' style={{lineHeight:'1.5'}}>
                              <p className='recruit__title' dangerouslySetInnerHTML={{ 
                                __html: searchResult ? highlightSearchText(item.title, getCurrentSearchTerms()) : item.title 
                              }} />
                            </div>
                            <div className='recruit__sort_box'>
                              <div className='recruit__religiousbody_box'>
                                <img src={`${MainURL}/siteimages/religiousbody/${item.religiousbody}.jpg`} />
                                <p className='recruit__religiousbody' dangerouslySetInnerHTML={{ 
                                  __html: searchResult ? highlightSearchText(item.religiousbody, getCurrentSearchTerms()) : item.religiousbody 
                                }} />
                              </div>
                              <p style={{margin:'0 10px', color:'#ccc'}}>|</p>
                              <div className='recruit__religiousbody_box'>
                                {
                                  item.source !== '사역자모아' &&
                                  <img src={`${MainURL}/siteimages/schoolround/${item.source}.jpg`} />
                                }
                               <p className='recruit__religiousbody' dangerouslySetInnerHTML={{ 
                                 __html: searchResult ? highlightSearchText(item.source, getCurrentSearchTerms()) : item.source 
                               }} />
                              </div>
                            </div>
                            <div className='recruit__detail_box'>
                              {
                                (pay[0].inputCost === '교회내규에따라' || pay[0].inputCost === '협의후결정')
                                ?
                                <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                  __html: searchResult ? highlightSearchText(renderPreview50(pay[0].inputCost), getCurrentSearchTerms()) : renderPreview50(pay[0].inputCost) 
                                }} />
                                :
                                <>
                                {
                                  (pay[0].selectCost == '' && pay[0].inputCost !== '' )
                                  ?
                                  <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                    __html: searchResult ? highlightSearchText(renderPreview50(`${pay[0].sort} : ${pay[0].inputCost}`), getCurrentSearchTerms()) : renderPreview50(`${pay[0].sort} : ${pay[0].inputCost}`) 
                                  }} />
                                  :
                                  <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                    __html: searchResult ? highlightSearchText(renderPreview50(`${pay[0].sort} : ${pay[0].paySort} ${pay[0].selectCost}`), getCurrentSearchTerms()) : renderPreview50(`${pay[0].sort} : ${pay[0].paySort} ${pay[0].selectCost}`) 
                                  }} />
                                }
                                </>
                              }
                              {
                                pay.length > 1 
                                &&
                                <>
                                {
                                  (pay[1].inputCost === '교회내규에따라' || pay[1].inputCost === '협의후결정')
                                  ?
                                  <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                    __html: searchResult ? highlightSearchText(renderPreview50(pay[1].inputCost), getCurrentSearchTerms()) : renderPreview50(pay[1].inputCost) 
                                  }} />
                                  :
                                  <>
                                    {
                                      (pay[1].selectCost == '' && pay[1].inputCost !== '' )
                                      ?
                                      <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                        __html: searchResult ? highlightSearchText(renderPreview50(`${pay[1].sort} : ${pay[1].inputCost}`), getCurrentSearchTerms()) : renderPreview50(`${pay[1].sort} : ${pay[1].inputCost}`) 
                                      }} />
                                      :
                                      <p style={{color:'#333'}} dangerouslySetInnerHTML={{ 
                                        __html: searchResult ? highlightSearchText(renderPreview50(`${pay[1].sort} : ${pay[1].paySort} ${pay[1].selectCost}`), getCurrentSearchTerms()) : renderPreview50(`${pay[1].sort} : ${pay[1].paySort} ${pay[1].selectCost}`) 
                                      }} />
                                    }
                                  </>
                                }
                                </>
                              }
                            </div>
                            <div className='recruit__detail_box'>
                              {
                                (item.part !== '' && item.part !== null) &&
                                <p style={{fontSize:'14px'}}
                                  dangerouslySetInnerHTML={{ 
                                  __html: searchResult ? highlightSearchText(renderPreview30(part[0].content), getCurrentSearchTerms()) : renderPreview30(part[0].content) 
                                }} />
                              }
                            </div>
                          </div>
                          <div className="recruit__etc_box">  
                            <div className="recruit__etc sortPay">
                              <p dangerouslySetInnerHTML={{ 
                                __html: searchResult ? highlightSearchText(item.sort, getCurrentSearchTerms()) : item.sort 
                              }} />
                              <p dangerouslySetInnerHTML={{ 
                                __html: searchResult ? highlightSearchText(`${item.location} ${item.locationDetail}`, getCurrentSearchTerms()) : `${item.location} ${item.locationDetail}` 
                              }} />
                            </div>
                            <div className="recruit__etc dateTime">
                              <p dangerouslySetInnerHTML={{ 
                                __html: searchResult ? highlightSearchText(item.date, getCurrentSearchTerms()) : item.date 
                              }} />
                              {
                                applytime.daySort !== ""
                                ?
                                <p dangerouslySetInnerHTML={{ 
                                  __html: searchResult ? highlightSearchText(applytime.daySort, getCurrentSearchTerms()) : applytime.daySort 
                                }} />
                                :
                                <>
                                {
                                  applytime.startDay !== "" &&
                                  <p dangerouslySetInnerHTML={{ 
                                    __html: searchResult ? highlightSearchText(`~ ${applytime.endDay}`, getCurrentSearchTerms()) : `~ ${applytime.endDay}` 
                                  }} />
                                }
                                </>
                              }
                            </div>
                          </div>
                        </div>    
                      )
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

    </div>
  )
}



