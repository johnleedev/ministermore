import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import { themesList } from '../../../DefaultData';
import './ContiMaker.scss';
import altImage from '../../../images/altImage.jpeg';

interface SongData {
  id: number;
  title: string;
  stateSort: string;
  keySort: string;
  theme: string;
  tempoSort: string;
  image: string;
  lyrics: string;
}

export default function ContiMaker() {
  const navigate = useNavigate();
  
  const [allSongs, setAllSongs] = useState<SongData[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<SongData[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<SongData[]>([]);
  
  // 필터 조건
  const [selectedStateSort, setSelectedStateSort] = useState<string>('');
  const [selectedKeySort, setSelectedKeySort] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedTempoSort, setSelectedTempoSort] = useState<string>('');
  const [songCount, setSongCount] = useState<number>(5);
  
  // 단계별 선택을 위한 상태
  const [step, setStep] = useState<number>(1); // 1: 곡수 선택, 2: 세부 조건 선택
  const [songConditions, setSongConditions] = useState<Array<{
    stateSort: string;
    keySort: string;
    theme: string;
    tempoSort: string;
  }>>([]);
  
  // 드롭다운 옵션들
  const [stateSortOptions, setStateSortOptions] = useState<string[]>([]);
  const [keySortOptions, setKeySortOptions] = useState<string[]>([]);
  const [themeOptions, setThemeOptions] = useState<string[]>([]);
  const [tempoSortOptions, setTempoSortOptions] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [songsPerRow, setSongsPerRow] = useState<number>(3); // 한 줄에 표시할 곡 개수
  const [paperSize, setPaperSize] = useState<string>('A4 가로'); // 용지 크기
  const contiGridRef = useRef<HTMLDivElement>(null); // 캡처할 영역 ref
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // 용지 크기에 따른 width/height 계산 (mm to px, 96 DPI 기준)
  const getPaperDimensions = (size: string): { width: string; height: string } => {
    const mmToPx = (mm: number) => `${(mm * 96) / 25.4}px`;
    switch (size) {
      case 'A4 가로': return { width: mmToPx(297), height: mmToPx(210) }; // 가로 297mm × 세로 210mm
      case 'A4 세로': return { width: mmToPx(210), height: mmToPx(297) }; // 가로 210mm × 세로 297mm
      default: return { width: mmToPx(297), height: mmToPx(210) };
    }
  };

  // 모든 곡 불러오기
  useEffect(() => {
    fetchAllSongs();
  }, []);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAllSongs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${MainURL}/worshipsongs/getsongsall`);
      if (response.data) {
        const songs = response.data.result;
        setAllSongs(songs);
        console.log(songs);
        // 드롭다운 옵션들 추출
        const states = Array.from(new Set(songs.map((song: SongData) => song.stateSort).filter(Boolean))) as string[];
        const keys = Array.from(new Set(songs.map((song: SongData) => song.keySort).filter(Boolean))) as string[];
        const tempos = Array.from(new Set(songs.map((song: SongData) => song.tempoSort).filter(Boolean))) as string[];
        
        setStateSortOptions(states.sort());
        setKeySortOptions(keys.sort());
        setThemeOptions(themesList); 
        console.log(themesList);
        setTempoSortOptions(tempos.sort());
      }
    } catch (error) {
      console.error('곡을 불러오는 중 오류가 발생했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 조건에 따라 곡 필터링
  const filterSongs = () => {
    let filtered = allSongs;

    if (selectedStateSort) {
      filtered = filtered.filter(song => song.stateSort === selectedStateSort);
    }
    if (selectedKeySort) {
      filtered = filtered.filter(song => song.keySort === selectedKeySort);
    }
    if (selectedTheme) {
      filtered = filtered.filter(song => song.theme && song.theme.includes(selectedTheme));
    }
    if (selectedTempoSort) {
      filtered = filtered.filter(song => song.tempoSort === selectedTempoSort);
    }

    setFilteredSongs(filtered);
  };

  // 필터 조건이 변경될 때마다 곡 필터링
  useEffect(() => {
    filterSongs();
  }, [selectedStateSort, selectedKeySort, selectedTheme, selectedTempoSort, allSongs]);

  // 곡수 변경 시 자동으로 2단계 활성화
  useEffect(() => {
    if (songCount > 0) {
      // 선택한 곡수만큼 빈 조건 배열 생성
      const conditions = Array(songCount).fill(null).map(() => ({
        stateSort: '',
        keySort: '',
        theme: '',
        tempoSort: ''
      }));
      
      setSongConditions(conditions);
      setStep(2);
    }
  }, [songCount]);

  // 두 번째 단계 완료 (세부 조건 선택)
  const completeStep2 = () => {
    // 선택하지 않은 조건들을 랜덤으로 채우기
    const updatedConditions = songConditions.map(condition => ({
      stateSort: condition.stateSort || getRandomOption(stateSortOptions),
      keySort: condition.keySort || getRandomOption(keySortOptions),
      theme: condition.theme || getRandomOption(themeOptions),
      tempoSort: condition.tempoSort || getRandomOption(tempoSortOptions)
    }));
    
    setSongConditions(updatedConditions);
    generateConti();
  };

  // 랜덤 옵션 선택 함수
  const getRandomOption = (options: string[]): string => {
    if (options.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };

  // 자동 콘티 생성
  const generateConti = () => {
    const selected: SongData[] = [];
    
    // 각 곡의 조건에 맞는 곡을 선택
    for (let i = 0; i < songConditions.length; i++) {
      const condition = songConditions[i];
      
      // 해당 조건에 맞는 곡들 필터링
      let availableSongs = allSongs.filter(song => {
        if (condition.theme && (!song.theme || !song.theme.includes(condition.theme))) {
          return false;
        }
        if (condition.stateSort && song.stateSort !== condition.stateSort) {
          return false;
        }
        if (condition.keySort && song.keySort !== condition.keySort) {
          return false;
        }
        if (condition.tempoSort && song.tempoSort !== condition.tempoSort) {
          return false;
        }
        return true;
      });
      
      // 이미 선택된 곡 제외
      availableSongs = availableSongs.filter(song => 
        !selected.some(selectedSong => selectedSong.id === song.id)
      );
      
      if (availableSongs.length === 0) {
        alert(`${i + 1}번째 곡의 조건에 맞는 곡이 없습니다.`);
        return;
      }
      
      // 랜덤하게 선택
      const randomIndex = Math.floor(Math.random() * availableSongs.length);
      selected.push(availableSongs[randomIndex]);
    }
    
    setSelectedSongs(selected);
    setIsGenerated(true);
  };

  // 특정 곡만 재생성 (동일 조건 내에서 다른 곡으로 변경)
  const regenerateSong = (songIndex: number) => {
    const condition = songConditions[songIndex];
    
    // 해당 조건에 맞는 곡들 필터링
    let availableSongs = allSongs.filter(song => {
      if (condition.theme && (!song.theme || !song.theme.includes(condition.theme))) {
        return false;
      }
      if (condition.stateSort && song.stateSort !== condition.stateSort) {
        return false;
      }
      if (condition.keySort && song.keySort !== condition.keySort) {
        return false;
      }
      if (condition.tempoSort && song.tempoSort !== condition.tempoSort) {
        return false;
      }
      return true;
    });
    
    // 현재 선택된 곡들(변경 대상 제외) 제외
    availableSongs = availableSongs.filter(song => 
      !selectedSongs.some((selectedSong, idx) => idx !== songIndex && selectedSong.id === song.id)
    );
    
    if (availableSongs.length === 0) {
      alert(`${songIndex + 1}번째 곡의 조건에 맞는 다른 곡이 없습니다.`);
      return;
    }
    
    // 현재 곡이 아닌 다른 곡 중에서 랜덤 선택
    const currentSongId = selectedSongs[songIndex].id;
    const otherSongs = availableSongs.filter(song => song.id !== currentSongId);
    
    if (otherSongs.length === 0) {
      alert('조건에 맞는 다른 곡이 없습니다.');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * otherSongs.length);
    const newSong = otherSongs[randomIndex];
    
    // 해당 인덱스의 곡만 교체
    const updatedSongs = [...selectedSongs];
    updatedSongs[songIndex] = newSong;
    setSelectedSongs(updatedSongs);
  };

  // 초기화
  const resetConti = () => {
    setSelectedStateSort('');
    setSelectedKeySort('');
    setSelectedTheme('');
    setSelectedTempoSort('');
    setSelectedSongs([]);
    setIsGenerated(false);
    // songConditions의 모든 값 초기화
    const resetConditions = songConditions.map(condition => ({
      stateSort: '',
      keySort: '',
      theme: '',
      tempoSort: ''
    }));
    setSongConditions(resetConditions);
  };

  // 조건 업데이트
  const updateSongCondition = (index: number, field: string, value: string) => {
    const newConditions = [...songConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setSongConditions(newConditions);
  };


  return (
    <div className="conti-maker">
      <div className="conti-maker__inner">
        {/* 섹션 헤더 (ContiMain / 5.html 스타일) */}
        <header className="conti-maker__header">
          {/* <div className="conti-maker__title-bar" /> */}
          <h1 className="conti-maker__title">찬양 콘티 만들기</h1>
          <p className="conti-maker__subtitle">곡 수와 조건을 선택한 뒤 콘티 작성 버튼으로 완성하세요</p>
        </header>

        {isLoading ? (
          <div className="conti-maker__loading">
            <p>곡을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 설정 영역 */}
            <section className="conti-maker__setup">
              <div className="conti-maker__search">
                <label className="conti-maker__label">곡 개수</label>
                <select
                  className="conti-maker__select"
                  value={songCount}
                  onChange={(e) => setSongCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                    <option key={count} value={count}>{count}곡</option>
                  ))}
                </select>
              </div>
              {step >= 2 && (
                <>
                  <div className="conti-maker__conditions">
                    {songConditions.map((condition, index) => (
                      <div key={index} className="conti-maker__condition-row">
                        <span className="conti-maker__condition-num">{index + 1}번째</span>
                        <select
                          className="conti-maker__select"
                          value={condition.stateSort}
                          onChange={(e) => updateSongCondition(index, 'stateSort', e.target.value)}
                        >
                          <option value="">구분</option>
                          {stateSortOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <select
                          className="conti-maker__select"
                          value={condition.keySort}
                          onChange={(e) => updateSongCondition(index, 'keySort', e.target.value)}
                        >
                          <option value="">조성</option>
                          {keySortOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <select
                          className="conti-maker__select"
                          value={condition.theme}
                          onChange={(e) => updateSongCondition(index, 'theme', e.target.value)}
                        >
                          <option value="">주제</option>
                          {themeOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <select
                          className="conti-maker__select"
                          value={condition.tempoSort}
                          onChange={(e) => updateSongCondition(index, 'tempoSort', e.target.value)}
                        >
                          <option value="">템포</option>
                          {tempoSortOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="conti-maker__notice">
                    <p>* 선택하지 않은 항목은 자동으로 랜덤 선택됩니다.</p>
                  </div>
                  <div className="conti-maker__actions">
                    <button type="button" className="conti-maker__btn conti-maker__btn--primary" onClick={completeStep2}>
                      콘티 작성
                    </button>
                    <button type="button" className="conti-maker__btn conti-maker__btn--secondary" onClick={resetConti}>
                      초기화
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* 결과물 예시 (악보 포함) 레이아웃: 왼쪽 페이퍼 카드 + 오른쪽 기능 카드 */}
            {isGenerated && selectedSongs.length > 0 && (
              <section className="conti-maker__result">
                <div className="conti-maker__result-header">
                  <div className="conti-maker__result-title-bar" />
                  <h2 className="conti-maker__result-title">결과물 예시 (악보 포함)</h2>
                  <p className="conti-maker__result-subtitle">악보, 가사, 멘트 가이드까지 완벽하게 통합된 콘티</p>
                </div>
                <div className="conti-maker__result-body">
                  {/* 왼쪽: 페이퍼 스타일 콘티 카드 */}
                  <div className="conti-maker__paper-wrap">
                    <div className="conti-maker__paper conti-maker__paper--back" />
                    <div className="conti-maker__paper conti-maker__paper--front" ref={contiGridRef}>
                      <div className="conti-maker__paper-header">
                        {!isMobile && (
                          <div className="conti-maker__paper-options">
                            <div className="conti-maker__paper-option">
                              <label>용지</label>
                              <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="conti-maker__select conti-maker__select--sm">
                                <option value="A4 가로">A4 가로</option>
                                <option value="A4 세로">A4 세로</option>
                              </select>
                            </div>
                            <div className="conti-maker__paper-option">
                              <label>한 줄 곡 수</label>
                              <select value={songsPerRow} onChange={(e) => setSongsPerRow(Number(e.target.value))} className="conti-maker__select conti-maker__select--sm">
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                  <option key={n} value={n}>{n}곡</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className="conti-maker__songs-grid"
                        style={{
                          gridTemplateColumns: `repeat(${isMobile ? 1 : songsPerRow}, 1fr)`,
                        }}
                      >
                        {selectedSongs.map((song, index) => (
                          <div
                            key={song.id}
                            className="conti-maker__song-card"
                            onClick={() => {
                              const url = `/worship/detail?id=${song.id}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <div className="conti-maker__song-card-head">
                              <span className="conti-maker__song-card-title">{index + 1}. {song.title}</span>
                              <span className="conti-maker__song-pill">{song.keySort} | {song.tempoSort}</span>
                            </div>
                            <div className="conti-maker__song-card-actions">
                              <button
                                type="button"
                                className="conti-maker__regenerate-btn"
                                onClick={(e) => { e.stopPropagation(); regenerateSong(index); }}
                              >
                                변경
                              </button>
                            </div>
                            <div className="conti-maker__song-score">
                              {song.image ? (
                                <img
                                  src={song.image}
                                  alt={song.title}
                                  onError={(e) => {
                                    e.currentTarget.src = altImage;
                                    e.currentTarget.onerror = null;
                                  }}
                                />
                              ) : (
                                <span className="conti-maker__no-score">악보 없음</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="conti-maker__paper-footer">
                        <p>Generated by PraiseMaker</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}