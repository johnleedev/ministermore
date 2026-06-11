import { useEffect, useRef, useState } from 'react';
import './PraiseMain.scss';
import '../../ForListPage.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { themesList } from '../../../DefaultData';
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";
import type { PraiseListLocationState, PraiseReturnState } from './praiseNavigation';
import {
  PRAISE_LIST_PATH,
  clearPraiseListRestore,
  praiseReturnHasThemeFilters,
  praiseReturnHasUnifiedFilters,
  praiseReturnShouldRestoreScroll,
  resolveInitialPraiseReturn,
  restoreScroll,
  savePraiseListRestore,
} from './praiseNavigation';

export default function PraiseMain (props:any) {

  let navigate = useNavigate();
  let location = useLocation();
  const initialRestoreRef = useRef<PraiseReturnState | null | undefined>(undefined);
  if (initialRestoreRef.current === undefined) {
    initialRestoreRef.current = resolveInitialPraiseReturn(location.state as PraiseListLocationState | null);
  }
  const initialRestore = initialRestoreRef.current;
  const pendingScrollYRef = useRef<number | null>(
    initialRestore && praiseReturnShouldRestoreScroll(initialRestore)
      ? (initialRestore.scrollY ?? 0)
      : null,
  );
  const skipNextUrlEffectRef = useRef(Boolean(initialRestore));
  const hasRestoredRef = useRef(false);

  interface ListProps {
    id : number,
    bookletId: string;
    
  }
  
  const [listView, setListView] = useState<ListProps[]>([]);
  const [searchWord, setSearchWord] = useState(initialRestore?.searchWord ?? '');
  const [currentPage, setCurrentPage] = useState<number>(initialRestore?.currentPage ?? 1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(initialRestore?.selectedThemes ?? []);
  const [isSearching, setIsSearching] = useState(initialRestore?.isSearching ?? false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortFilter, setSortFilter] = useState<string>(initialRestore?.sortFilter ?? '');
  const [keyFilter, setKeyFilter] = useState<string>(initialRestore?.keyFilter ?? '');
  const [tempoFilter, setTempoFilter] = useState<string>(initialRestore?.tempoFilter ?? '');

  const PAGE_SIZE = 15;

  const normalizeTempo = (t: string) => {
    if (t === '느린') return '느림';
    if (t === '빠른') return '빠름';
    return t;
  };

  // 게시글 가져오기
  const fetchPosts = async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await axios.get(`${MainURL}/worshipsongs/getsongs/${page}`);
      const resultData = res.data?.resultData;

      if (resultData && Array.isArray(resultData)) {
        const newItems = [...resultData];
        setListView((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(newItems.length >= PAGE_SIZE);
      } else {
        if (!append) {
          setListView([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
      if (!append) {
        setListView([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const finishRestore = () => {
    if (pendingScrollYRef.current !== null) {
      restoreScroll(pendingScrollYRef.current);
      pendingScrollYRef.current = null;
    }
    clearPraiseListRestore();
    navigate(PRAISE_LIST_PATH, { replace: true, state: {} });
  };

  const restoreListPages = async (targetPage: number) => {
    setIsLoading(true);
    try {
      let allItems: ListProps[] = [];
      let lastPageHasMore = true;

      for (let page = 1; page <= targetPage; page++) {
        const res = await axios.get(`${MainURL}/worshipsongs/getsongs/${page}`);
        const resultData = res.data?.resultData;

        if (resultData && Array.isArray(resultData)) {
          const newItems = [...resultData];
          allItems = [...allItems, ...newItems];
          lastPageHasMore = newItems.length >= PAGE_SIZE;
        } else {
          lastPageHasMore = false;
          break;
        }
      }

      setListView(allItems);
      setHasMore(lastPageHasMore);
      setCurrentPage(targetPage);
    } catch (error) {
      console.error(error);
      setListView([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const buildReturnState = (): PraiseReturnState => ({
    scrollY: window.scrollY,
    currentPage,
    isSearching,
    searchWord,
    sortFilter,
    keyFilter,
    tempoFilter,
    selectedThemes,
  });

  const openPraiseDetail = (id: number) => {
    const returnState = buildReturnState();
    savePraiseListRestore(returnState);
    window.scrollTo(0, 0);
    navigate(`/worship/detail?id=${id}`, { state: { praiseReturn: returnState } });
  };

  useEffect(() => {
    if (!initialRestore || hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restored = initialRestore;

    if (praiseReturnHasThemeFilters(restored)) {
      void (async () => {
        setIsSearching(true);
        setIsLoading(true);
        const res = await axios.post(`${MainURL}/worshipsongs/getsongssearchtheme`, {
          theme: restored.selectedThemes,
        });
        if (res.data.resultData) {
          setListView([...res.data.resultData]);
          setHasMore(false);
        } else {
          setListView([]);
          setHasMore(false);
        }
        setIsLoading(false);
        finishRestore();
      })();
      return;
    }

    if (praiseReturnHasUnifiedFilters(restored)) {
      void (async () => {
        setIsSearching(true);
        setIsLoading(true);
        const res = await axios.post(`${MainURL}/worshipsongs/getsongsfilter`, {
          word: restored.searchWord || '',
          stateSort: restored.sortFilter || '',
          keySort: restored.keyFilter || '',
          tempoSort: normalizeTempo(restored.tempoFilter || ''),
        });
        if (res.data.resultData) {
          setListView([...res.data.resultData]);
          setHasMore(false);
        } else {
          setListView([]);
          setHasMore(false);
        }
        setIsLoading(false);
        finishRestore();
      })();
      return;
    }

    if (praiseReturnShouldRestoreScroll(restored)) {
      void restoreListPages(restored.currentPage ?? 1).then(finishRestore);
      return;
    }

    clearPraiseListRestore();
    navigate(PRAISE_LIST_PATH, { replace: true, state: {} });
    fetchPosts(1);
  }, []);

  // URL 파라미터에서 검색 조건 복원
  useEffect(() => {
    if (skipNextUrlEffectRef.current) {
      skipNextUrlEffectRef.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const savedSearchWord = searchParams.get('searchWord');
    const savedThemes = searchParams.get('themes');
    const savedSort = searchParams.get('sort');
    const savedKey = searchParams.get('key');
    const savedTempo = searchParams.get('tempo');
    
    if (savedSearchWord || savedSort || savedKey || savedTempo) {
      if (savedSearchWord) setSearchWord(savedSearchWord);
      if (savedSort) setSortFilter(savedSort);
      if (savedKey) setKeyFilter(savedKey);
      if (savedTempo) setTempoFilter(savedTempo);
      // 통합 검색 실행
      (async () => {
        setIsSearching(true);
        setIsLoading(true);
        const res = await axios.post(`${MainURL}/worshipsongs/getsongsfilter`, {
          word: savedSearchWord || '',
          stateSort: savedSort || '',
          keySort: savedKey || '',
          tempoSort: normalizeTempo(savedTempo || ''),
        });
        if (res.data.resultData) {
          setListView([...res.data.resultData]);
          setHasMore(false);
        } else {
          setListView([]);
          setHasMore(false);
        }
        setIsLoading(false);
      })();
    } else if (savedThemes) {
      const themesArray = savedThemes.split(',');
      setSelectedThemes(themesArray);
      handleThemeSearching(themesArray);
    } else {
      setIsSearching(false);
      setCurrentPage(1);
      setHasMore(true);
      fetchPosts(1);
    }
  }, [location.search]);



  // 통합 검색 ------------------------------------------------------
	const handleUnifiedSearching = async () => {
    if (!searchWord && !sortFilter && !keyFilter && !tempoFilter) {
      alert('검색 조건을 입력/선택해주세요')
    } else {
      setIsSearching(true);
      setIsLoading(true);
      // URL 업데이트
      const newSearchParams = new URLSearchParams();
      if (searchWord) newSearchParams.set('searchWord', searchWord);
      if (sortFilter) newSearchParams.set('sort', sortFilter);
      if (keyFilter) newSearchParams.set('key', keyFilter);
      if (tempoFilter) newSearchParams.set('tempo', tempoFilter);
      navigate(`?${newSearchParams.toString()}`, { replace: true });
      
      const res = await axios.post(`${MainURL}/worshipsongs/getsongsfilter`, {
        word: searchWord || '',
        stateSort: sortFilter || '',
        keySort: keyFilter || '',
        tempoSort: normalizeTempo(tempoFilter || '')
      })
      if (res.data.resultData) {
        let copy: any = [...res.data.resultData];
        setListView(copy);
        setHasMore(false);
      } else {
        setListView([]);
        setHasMore(false);
      }
      setIsLoading(false);
    }
	};

   // 주제 선택 검색 ------------------------------------------------------
	const handleThemeSearching = async (selectedThemesCopy:any) => {
    setIsSearching(true);
    setIsLoading(true);
    // URL 업데이트
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('themes', selectedThemesCopy.join(','));
    navigate(`?${newSearchParams.toString()}`, { replace: true });
    
    const res = await axios.post(`${MainURL}/worshipsongs/getsongssearchtheme`, {
      theme: selectedThemesCopy
    })
    if (res.data.resultData) {
      setListView([...res.data.resultData]);
      setHasMore(false);
    } else {
      setListView([]);
      setHasMore(false);
    }
    setIsLoading(false);
	};

 

  return (
    <div className="Wopship">

      <div className="inner">

        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>적용찬양찾기</h3>
          </div>
          
          <div className="subpage__main__search">
            <div className="buttons">
              <select className="inputdefault width" style={{padding:'0 10px'}} value={sortFilter} onChange={(e)=>setSortFilter(e.target.value)}>
                <option value="">구분</option>
                <option value="찬송가">찬송가</option>
                <option value="복음송">복음송</option>
              </select>
              <select className="inputdefault width" style={{padding:'0 10px'}} value={keyFilter} onChange={(e)=>setKeyFilter(e.target.value)}>
                <option value="">KEY</option>
                <option value="C">C</option>
                <option value="Db">Db</option>
                <option value="D">D</option>
                <option value="Eb">Eb</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="Ab">Ab</option>
                <option value="A">A</option>
                <option value="Bb">Bb</option>
                <option value="B">B</option>
              </select>
              <select className="inputdefault width" style={{padding:'0 10px'}} value={tempoFilter} onChange={(e)=>setTempoFilter(e.target.value)}>
                <option value="">TEMPO</option>
                <option value="느린">느린</option>
                <option value="빠른">빠른</option>
              </select>
            </div>
            <input className="inputdefault width" type="text" placeholder='곡명 검색'
              value={searchWord} onChange={(e)=>{setSearchWord(e.target.value)}}
              style={{margin:'0', outline:'none'}}
              onKeyDown={(e)=>{if (e.key === 'Enter') {handleUnifiedSearching();}}}
              />
            <div className="buttons">
              <div className="btn search" 
                onClick={handleUnifiedSearching}
                >
                <p>검색</p>
              </div>
              <div className="btn reset"
                onClick={()=>{
                  clearPraiseListRestore();
                  setSearchWord('');
                  setListView([]);
                  setSelectedThemes([]);
                  setCurrentPage(1);
                  setHasMore(true);
                  setIsSearching(false);
                  setSortFilter(''); setKeyFilter(''); setTempoFilter('');
                  navigate('', { replace: true });
                }}
                >
                <p>초기화</p>
              </div>
            </div>
           
          </div>
          
          <div className='subpage__main__tabrow_notice'>
            <p>설교 후 부를 찬양을 찾으시려면, 설교 주제와 동일한 주제어를 아래에서 찾아 누르면, 해당 주제의 찬양이 나옵니다.</p>
          </div>
          
          <div className='checkInputCover Worship'>
            {
              themesList.map((item:any, index:any)=>{
                return (
                  <div className={`checkInputbox ${selectedThemes.includes(item) ? 'selected': ""}`} key={index}
                       onClick={() => {
                        setSelectedThemes((prevTheme: string[]) => {

                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          const date = `${yyyy}-${mm}-${dd}`;
                          axios.post(`${MainURL}/admin/countup`, { date, type: 'praisewordclick' });

                          const isRemoving = prevTheme.includes(item);
                          
                          if (isRemoving) {
                            clearPraiseListRestore();
                            setIsSearching(false);
                            setListView([]);
                            setCurrentPage(1);
                            setHasMore(true);
                            navigate('', { replace: true });
                            return [];
                          } else {
                            // 새로운 항목을 선택하는 경우 (하나만 선택)
                            const updatedThemes = [item];
                            handleThemeSearching(updatedThemes);
                            return updatedThemes;
                          }
                        });
                      }}
                  >
                    <p>{item}</p>
                  </div>
                )
              })
            }
          </div>

          <div className="subpage__main__content">
            <div className="main__content">
              <div className="praise__wrap--category">
                <div className="praise__wrap--menu">
                  <div className='praise_menu_box sort-column'>
                    <p className='praise_menu_text'>구분</p>
                  </div>
                  <div className='praise_menu_box sort-column'>
                    <p className='praise_menu_text'>KEY</p>
                  </div>
                  <div className='praise_menu_box sort-column'>
                    <p className='praise_menu_text'>TEMPO</p>
                  </div>
                  <div className='praise_menu_box title-column' >
                    <p className='praise_menu_text'>제목</p> 
                  </div>
                  <div className='praise_menu_box theme-column' >
                    <p className='praise_menu_text'>주제</p> 
                  </div>
                  <div className='praise_menu_box detail-column'>
                    <p className='praise_menu_text'>자세히보기</p> 
                  </div>
                </div>

                <div className="praise__wrap--item">
                  {isLoading && !isLoadingMore ? (
                    <div style={{
                      width: '100%',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '18px',
                      padding: '60px 0',
                      background: '#fafafa',
                      borderRadius: '10px',
                      border: '1px solid #eee',
                      margin: '30px 0'
                    }}>
                      불러오는 중입니다...
                    </div>
                  ) : listView.length === 0 ? (
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
                    listView.map((item: any, index: number) => {

                      return (
                        <div 
                          key={item.id} 
                          className="praise__item"
                          onClick={() => openPraiseDetail(item.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* PC 레이아웃 (한 줄) */}
                          <div className="praise__desktop-layout">
                            <div className="praise__sort">
                              <p>{item.stateSort}</p>
                            </div>
                            <div className="praise__sort">
                              <p>{item.keySort}</p>
                            </div>
                            <div className="praise__sort">
                              <p>{item.tempoSort}</p>
                            </div>
                            <div className="praise__content">
                              <p className='praise__title'>{item.title}</p>
                            </div>
                            <div className="praise__theme">
                              {item.theme ? item.theme.split(',').map((t: string, i: number) => {
                                const trimmedTheme = t.trim();
                                const isSelected = selectedThemes.includes(trimmedTheme);
                                return (
                                  <span 
                                    key={i} 
                                    style={{ 
                                      marginRight: 6,
                                      color: isSelected ? 'rgb(30, 0, 199)' : '#666',
                                      fontWeight: isSelected ? 'bold' : 'normal',
                                      padding: isSelected ? '2px 6px' : '0',
                                      borderRadius: isSelected ? '4px' : '0'
                                    }}
                                  >
                                    {trimmedTheme}
                                  </span>
                                );
                              }) : ''}
                            </div>
                            <div className="praise__detail">
                              <button 
                                className="detail-btn" 
                                title="자세히보기"
                              >
                                자세히보기
                              </button>
                            </div>
                          </div>
                          
                          {/* 모바일 레이아웃 (두 줄) */}
                          <div className="praise__mobile-layout">
                            {/* 첫 번째 줄: 구분, KEY, TEMPO, 제목 */}
                            <div className="praise__first-row">
                              <div className="praise__sort">
                                <p>{item.stateSort}</p>
                              </div>
                              <div className="praise__sort">
                                <p>{item.keySort}</p>
                              </div>
                              <div className="praise__sort">
                                <p>{item.tempoSort}</p>
                              </div>
                              <div className="praise__content">
                                <p className='praise__title'>{item.title}</p>
                              </div>
                            </div>
                            
                            {/* 두 번째 줄: 주제와 화살표 버튼 */}
                            <div className="praise__second-row">
                              <div className="praise__theme">
                                {item.theme ? item.theme.split(',').map((t: string, i: number) => {
                                  const trimmedTheme = t.trim();
                                  const isSelected = selectedThemes.includes(trimmedTheme);
                                  return (
                                    <span 
                                      key={i} 
                                      style={{ 
                                        marginRight: 6,
                                        color: isSelected ? 'rgb(30, 0, 199)' : '#666',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        padding: isSelected ? '2px 6px' : '0',
                                        borderRadius: isSelected ? '4px' : '0'
                                      }}
                                    >
                                      {trimmedTheme}
                                    </span>
                                  );
                                }) : ''}
                              </div>
                              <div className="praise__mobile-detail">
                                <button 
                                  className="mobile-arrow-btn" 
                                  title="자세히보기"
                                >
                                  &gt;&gt;
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                { !isSearching && hasMore && listView.length > 0 && (
                  <div
                    className='addFetchBtn'
                    onClick={isLoadingMore ? undefined : handleLoadMore}
                    style={isLoadingMore ? { opacity: 0.6, cursor: 'wait' } : undefined}
                  >
                    <p>{isLoadingMore ? '불러오는 중...' : '더보기'}</p>
                    {!isLoadingMore && <MdOutlineKeyboardDoubleArrowDown color='#9c9c9c'/>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <ScrollToTopButton />
    </div>
  )
}



