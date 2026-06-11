import React, { useEffect, useState } from 'react';
import './PraiseMain.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import altImage from '../../../images/altImage.jpeg';
import { MdArrowBack } from "react-icons/md";
import axios from 'axios';
import MainURL from '../../../MainURL';
import type { PraiseDetailLocationState } from './praiseNavigation';
import { PRAISE_LIST_PATH } from './praiseNavigation';

interface SongProps {
  id: number;
  title: string;
  theme: string;
  image: string;
  source: string;
  lyrics: string;
  keySort: string;
  date: string;
  stateSort: string;
  pptlist?: string;
  youtubelist?: string;
}

export default function PraiseDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const praiseReturn = (location.state as PraiseDetailLocationState | null)?.praiseReturn;
  const url = new URL(window.location.href);
  const ID = url.searchParams.get("id");
  const [songData, setSongData] = useState<SongProps | null>(null);

  const goBackToList = () => {
    if (praiseReturn) {
      navigate(PRAISE_LIST_PATH, { state: { praiseReturn } });
      return;
    }

    navigate(PRAISE_LIST_PATH);
  };

  
  // 게시글 가져오기
  const fetchPosts = async () => {
    const resMinister = await axios.post(`${MainURL}/worshipsongs/getsongdatapart`, {
      id : ID
    })
    const data = resMinister?.data;
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0];
      const mapped: SongProps = {
        id: Number(row?.id ?? row?._id ?? ''),
        title: String(row?.title ?? ''),
        theme: String(row?.theme ?? ''),
        image: String(row?.image ?? ''),
        source: String(row?.source ?? ''),
        lyrics: String(row?.lyrics ?? ''),
        keySort: String(row?.keySort ?? ''),
        date: String(row?.date ?? ''),
        stateSort: String(row?.stateSort ?? ''),
        pptlist: String(row?.pptlist ?? ''),
        youtubelist: String(row?.youtubelist ?? ''),
      };
      setSongData(mapped);
    }
  };


  useEffect(() => {
    fetchPosts();
  }, []);  

  
  // pptlist 파싱 (안전하게 처리)
  const pptlist = React.useMemo(() => {
    try {
      if (songData?.pptlist) {
        return JSON.parse(songData.pptlist);
      }
      return [];
    } catch (error) {
      console.error('pptlist 파싱 오류:', error);
      return [];
    }
  }, [songData?.pptlist]);

  // youtube 리스트 파싱 (안전하게 처리)
  const youtubelist = React.useMemo(() => { 
    try {
      if (songData?.youtubelist) {
        return JSON.parse(songData.youtubelist);
      }
      return [];
    } catch (error) {
      console.error('youtube 리스트 파싱 오류:', error);
      return [];
    }
  }, [songData?.youtubelist]);

  // HTML 태그 제거 함수 (줄바꿈 유지)
  const removeHtmlTags = (text: string) => {
    // <br> 태그를 줄바꿈 문자로 변환
    let processedText = text.replace(/<br\s*\/?>/gi, '\n');
    // 나머지 HTML 태그 제거
    processedText = processedText.replace(/<[^>]*>/g, '');
    return processedText;
  };

  // 가사 복사 함수
  const copyLyrics = () => {
    const lyricsText = songData?.lyrics ? removeHtmlTags(songData.lyrics) : '가사 정보가 없습니다.';
    navigator.clipboard.writeText(lyricsText).then(() => {
      alert('가사가 클립보드에 복사되었습니다.');
    }).catch(() => {
      alert('복사에 실패했습니다.');
    });
  };

  // 출처 링크 이동 함수
  const openSourceLink = () => {
    if (songData?.source) {
      window.open(songData.source, '_blank');
    }
  };

  // 악보 링크 이동 함수
  const openScoreLink = () => {
    if (songData?.image) {
      window.open(songData.source, '_blank');
    }
  };

  if (!songData) {
    return (
      <div className="Wopship">
        <div className="inner">
          <div className="subpage__main">
            <div className="error">찬양곡을 찾을 수 없습니다.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Wopship">
      <div className="inner">
        <div className="subpage__main">
          
          <section className="praise-detail-header">
            <div className="main_title_row praise-detail-title-row">
              <h3 className='main_title'>
                {songData.title}
              </h3>
              <div className="back-button" onClick={goBackToList}>
                  <MdArrowBack className="back-icon" />
                  <span>목록</span>
                </div>
            </div>
          </section>
          
          <section>
            <div className="praise-detail-layout">
              {/* 왼쪽: 찬양 정보와 가사 */}
              <div className="praise-left-section">
                <h1 className='section_title'>찬양 정보</h1>
                <div className='summaryBx'>
                  <div className='tbCol praise-info-col'>
                    <div className='tbList'>
                      <div className='tbLabel'>구분</div>
                      <div className='tbValue'>{songData.stateSort}</div>
                      <div className='tbLabel'>출처</div>
                        <div className='tbValue source-with-button'>
                         {songData.source ? 
                           (songData.source.length > 40 ? `${songData.source.substring(0, 40)}...` : songData.source) 
                           : '정보 없음'}
                         {songData.source && (
                           <button className="source-link-btn" onClick={openSourceLink}>
                             바로가기
                           </button>
                         )}
                       </div>
                      <div className='tbLabel'>조성</div>
                      <div className='tbValue'>{songData.keySort || '정보 없음'}</div>
                      <div className='tbLabel'>주제어</div>
                      <div className='tbValue'>
                        {songData.theme ? songData.theme.split(',').map((theme, index) => (
                          <span key={index} className="theme-tag">
                            {theme.trim()}
                          </span>
                        )) : '정보 없음'}
                      </div>
                    </div>
                  </div>
                   
                </div>

                <div className="lyrics-header">
                  <h1 className='section_title'>가사</h1>
                  <button className="copy-lyrics-btn" onClick={copyLyrics}>
                    복사하기
                  </button>
                </div>
                <div className='praiseBx'>
                  <div className="praiseBx-cover">
                    <div className='praise lyrics-content'>
                      <div className='lyrics-text'>
                        {songData.lyrics ? removeHtmlTags(songData.lyrics) : '가사 정보가 없습니다.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 악보 */}
              <div className="praise-right-section">
                <h1 className='section_title'>악보</h1>
                <div className='praiseBx'>
                  <div className="praiseBx-cover">
                    <div className='praise score-content'>
                      <div className='value image-container' onClick={openScoreLink}>
                        <img
                          src={songData.image}
                          alt="악보"
                          className="score-image"
                          onError={(e) => {
                            e.currentTarget.src = altImage;
                            e.currentTarget.onerror = null;
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                          }}
                        />
                        <div className="hover-button">
                          <button className="score-link-btn" onClick={(e) => {
                            e.stopPropagation();
                            openScoreLink();
                          }}>
                            바로가기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

                     {/* PPT 자료 섹션 */}
           {pptlist && pptlist.length > 0 && (
             <section>
               <div className="section-header">
                 <h1 className='section_title'>PPT 자료</h1>
                   <button className="google-search-btn" onClick={() => {
                    const searchQuery = `${songData.title} PPT`;
                    const encodedQuery = encodeURIComponent(searchQuery);
                    window.open(`https://www.google.com/search?q=${encodedQuery}&tbm=isch&hl=ko`, '_blank');
                  }}>
                   더보기
                  </button>
               </div>
              <div className='praiseBx'>
                <div className="praiseBx-cover">
                  <div className='praise materials-content'>
                      <div className="materials-grid">
                        {pptlist.map((item: any, index: number) => (
                          <a key={index} 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="material-card"
                          >
                            <img
                              src={item.img_src}
                              alt="PPT 썸네일"
                              className="material-thumbnail"
                              onError={(e) => {
                                e.currentTarget.src = altImage;
                                e.currentTarget.onerror = null;
                              }}
                            />
                            <div className="material-info">
                              <h4 className="material-title">
                                {item.page_name}
                              </h4>
                              <p className="material-site">
                                <img 
                                  src={item.source_img} 
                                  alt="사이트 아이콘" 
                                  className="site-icon"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <p className='site-name'>{item.site_name}</p>
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                  </div>
                </div>
              </div>
            </section>
          )}

           {/* YouTube 자료 섹션 */}
           {youtubelist && youtubelist.length > 0 && (
             <section>
               <div className="section-header">
                 <h1 className='section_title'>YouTube 자료</h1>
                   <button className="youtube-search-btn" onClick={() => {
                    const searchQuery = songData.title;
                    const encodedQuery = encodeURIComponent(searchQuery);
                    window.open(`https://www.youtube.com/results?search_query=${encodedQuery}`, '_blank');
                  }}>
                    더보기
                  </button>
               </div>
              <div className='praiseBx'>
                <div className="praiseBx-cover">
                  <div className='praise materials-content'>
                    
                      <div className="materials-grid">
                        {youtubelist.map((item: any, index: number) => (
                          <a key={index} 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="material-card"
                          >
                            <img
                              src={item.img_src}
                              alt="YouTube 썸네일"
                              className="material-thumbnail"
                              onError={(e) => {
                                e.currentTarget.src = altImage;
                                e.currentTarget.onerror = null;
                              }}
                            />
                            <div className="material-info">
                              <h4 className="material-title">
                                {item.title_name}
                              </h4>
                              <p className="material-site">
                                <img 
                                  src={item.source_img} 
                                  alt="채널 아이콘" 
                                  className="site-icon"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <p className='site-name'>{item.channel_name}</p>
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
              
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 하단 뒤로가기 버튼 */}
          <div className="bottom-back-button-container">
            <div className="back-button bottom-back-button" onClick={goBackToList}>
              <MdArrowBack className="back-icon" />
              <span>목록</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 