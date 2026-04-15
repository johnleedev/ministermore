import React, { useEffect, useState } from 'react';
import '../Admin.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import altImage from '../../images/altImage.jpeg'
import { themesList } from '../../DefaultData';
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import pptIcon from '../../images/pptlogo.png';
import youtubeIcon from '../../images/youtubelogo.png';

export default function PraiseMain (props:any) {

  let navigate = useNavigate();
  let location = useLocation();

  interface ListProps {
    id : number,
    bookletId: string;
    
  }
  
  const [listView, setListView] = useState<ListProps[]>([]);
  const [searchWord, setSearchWord] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const PAGE_SIZE = 15;

  // 게시글 가져오기
  const fetchPosts = async (currentPageCopy:any) => {
    const res = await axios.get(`${MainURL}/worshipsongswork/getsongs/${currentPageCopy}`);
    if (res.data) {
      const newItems = [...res.data.resultData];
      setListView(newItems);
    } else {
      setListView([]);
    }
  };

  const handleLoadMore = () => {
    const currentPageCopy = currentPage + 1;
    setCurrentPage(currentPageCopy);
    fetchPosts(currentPageCopy);
  };

  // URL 파라미터에서 검색 조건 복원
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const savedSearchWord = searchParams.get('searchWord');
    const savedThemes = searchParams.get('themes');
    
    if (savedSearchWord) {
      setSearchWord(savedSearchWord);
      // 검색어가 있으면 검색 실행
      handleWordSearchingWithWord(savedSearchWord);
    } else if (savedThemes) {
      const themesArray = savedThemes.split(',');
      setSelectedThemes(themesArray);
      // 주제가 있으면 검색 실행
      handleThemeSearching(themesArray);
    } else {
      fetchPosts(1); // 검색 조건이 없으면 기본 로딩
    }
  }, [location.search]);

  // 검색어로 검색하는 함수 (URL 파라미터용)
  const handleWordSearchingWithWord = async (word: string) => {
    if (word.length < 2) {
      fetchPosts(1);
      return;
    }
    setIsSearching(true);
    const res = await axios.post(`${MainURL}/worshipsongs/getsongssearchword`, {
      word: word
    });
    if (res.data.resultData) {
      let copy: any = [...res.data.resultData];
      setListView(copy);
    }
  };


  // 글자 검색 ------------------------------------------------------
	const handleWordSearching = async () => {
    if (searchWord.length < 2) {
      alert('2글자이상 입력해주세요')
    } else {
      setIsSearching(true);
      // URL 업데이트
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('searchWord', searchWord);
      navigate(`?${newSearchParams.toString()}`, { replace: true });
      
      const res = await axios.post(`${MainURL}/worshipsongs/getsongssearchword`, {
        word: searchWord
      })
      if (res.data.resultData) {
        let copy: any = [...res.data.resultData];
        setListView(copy);
      } 
    }
	};

   // 주제 선택 검색 ------------------------------------------------------
	const handleThemeSearching = async (selectedThemesCopy:any) => {
    setIsSearching(true);
    // URL 업데이트
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('themes', selectedThemesCopy.join(','));
    navigate(`?${newSearchParams.toString()}`, { replace: true });
    
    const res = await axios.post(`${MainURL}/worshipsongs/getsongssearchtheme`, {
      theme: selectedThemesCopy
    })
    if (res.data.resultData) {
      let copy: any = [...res.data.resultData];
      setListView(copy);
    } else {
      setListView([]);
    }
	};


  // 글자수 제한
  const renderPreview = (content : string) => {
    if (content?.length > 40) {
      return content.substring(0, 40) + '...';
    }
    return content;
  };

 

  return (
    <div className="Wopship">

      <div className="inner">

        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>적용찬양찾기</h3>
          </div>
          
          <div className="subpage__main__search">

            <input className="inputdefault width" type="text" placeholder='곡명 검색'
              value={searchWord} onChange={(e)=>{setSearchWord(e.target.value)}} 
              onKeyDown={(e)=>{if (e.key === 'Enter') {handleWordSearching();}}}
              />
            <div className="buttons">
              <div className="btn search" 
                onClick={handleWordSearching}
                >
                <p>검색</p>
              </div>
              <div className="btn reset"
                onClick={()=>{
                  setSearchWord('');
                  setListView([]);
                  setSelectedThemes([]);
                  setCurrentPage(1);
                  setIsSearching(false);
                  // URL 클리어
                  navigate('', { replace: true });
                  fetchPosts(1);
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
                            // 선택 해제하는 경우
                            setIsSearching(false);
                            setListView([]);
                            setCurrentPage(1);
                            // URL 클리어
                            navigate('', { replace: true });
                            fetchPosts(1);
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
                  <div className='praise_menu_box' >
                    <p className='praise_menu_text'>곡정보</p> 
                  </div>
                  <div className='praise_menu_box' >
                    <p className='praise_menu_text'>주제</p> 
                  </div>
                  <div className='praise_menu_box  detail-column' >
                    <p className='praise_menu_text'>
                      <img src={pptIcon} alt="PPT" style={{width:'20px', height:'20px'}}/>
                    </p> 
                  </div>
                  <div className='praise_menu_box  detail-column'>
                    <p className='praise_menu_text'>
                      <img src={youtubeIcon} alt="Youtube" style={{width:'20px', height:'20px'}}/>
                    </p> 
                  </div>
                  <div className='praise_menu_box'>
                    <p className='praise_menu_text'>자세히보기</p> 
                  </div>
                </div>

                <div className="praise__wrap--item">
                  {listView.length === 0 ? (
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

                      // const pptListNumber = JSON.parse(item.pptlist).length;
                      // const youtubeListNumber = JSON.parse(item.youtubelist).length;

                      return (
                        <div 
                          key={index} 
                          className="praise__item"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/admin/worshipmanageadmin', { state: { 
                              id: item.id,
                              title: item.title,
                              keySort: item.keySort,
                              theme: item.theme ? item.theme.split(',').map((t: string) => t.trim()) : [],
                              image: item.image,
                              source: item.source,
                              lyrics: item.lyrics || '',
                              pptlist: item.pptlist || '',
                              youtubelist: item.youtubelist || ''
                            }});
                            window.scrollTo(0, 0);
                          }}
                        >
                          <div className="praise__sort">
                            <p>{item.stateSort}</p>
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
                          <div className="praise__ppt">
                            {/* {pptListNumber} */}
                          </div>
                          <div className="praise__youtube">
                            {/* {youtubeListNumber} */}
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
                      )
                    })
                  )}
                </div>
                { !isSearching && hasMore && listView.length > 0 && (
                  <div className='addFetchBtn' onClick={handleLoadMore}>
                    <p>더보기</p>
                    <MdOutlineKeyboardDoubleArrowDown color='#9c9c9c'/>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}



