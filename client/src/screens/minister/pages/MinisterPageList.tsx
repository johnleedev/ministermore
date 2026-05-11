import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../ForListPage.scss';
import './MinisterPageList.scss';
import axios from 'axios';
import MainURL from '../../../MainURL';


type MinisterListItem = {
  id: string;
  isView: string;
  sort: string;
  name: string;
  mainImage: string;
  phone: string;
  porfile: string;
  images: string;
  date: string;
};

// Sample filter options (similar to RecruitList)
const ministryFieldsList = ['청년부', '예배', '교육', '찬양', '전도', '상담', '행정', '미디어'];
const denominationList = ['대한예수교장로회', '기독교대한감리회', '기독교대한하나님의성회', '기독교대한성결교회'];
const locationList = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export default function MinisterPageList() {
  const navigate = useNavigate();
  const [list, setList] = useState<MinisterListItem[]>([]);
  const [searchWord, setSearchWord] = useState('');
  const [activeTab, setActiveTab] = useState('사역분야');
  const [selectedMinistryFields, setSelectedMinistryFields] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string[]>([]);
  const [selectedDenomination, setSelectedDenomination] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<MinisterListItem[] | null>(null);

  // 게시글 가져오기 (API → ViewModel 매핑)
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${MainURL}/minister/getdataministers`);
      const rows = res?.data?.data;
      console.log(rows);
      if (!rows || rows === false) {
        setSearchResult(null);
        return;
      }

      const mapped: MinisterListItem[] = rows.map((row: any, idx: number) => ({
        id: String(row?.id ?? row?._id ?? idx),
        isView: String(row?.isView ?? row?.title ?? ''),
        sort: String(row?.sort ?? ''),
        name: String(row?.name ?? ''),
        mainImage: String(row?.mainImage ?? ''),
        phone: String(row?.phone ?? ''),
        porfile: String(row?.porfile ?? row?.profile ?? row?.profileImage ?? ''),
        images: String(row?.images ?? row?.imageUrl ?? ''),
        date: String(row?.date ?? row?.createdAt ?? ''),
      }));

      setList(mapped);
      setSearchResult(mapped);
    } catch (e) {
      setSearchResult(null);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);  


  // 검색 상태를 localStorage에서 복원
  useEffect(() => {
    const savedSearchState = localStorage.getItem('ministerSearchState');
    if (savedSearchState) {
      const parsedState = JSON.parse(savedSearchState);
      setSelectedMinistryFields(parsedState.selectedMinistryFields || []);
      setSelectedLocation(parsedState.selectedLocation || []);
      setSelectedDenomination(parsedState.selectedDenomination || []);
      setSearchResult(parsedState.searchResult || null);
    }
    
    // 컴포넌트 언마운트 시 localStorage 정리 (선택사항)
    return () => {
      // 필요에 따라 여기서 localStorage를 정리할 수 있습니다
      // localStorage.removeItem('ministerSearchState');
    };
  }, []);

  // API에서 가져온 리스트 사용
  const items: MinisterListItem[] = list;

  // Handle filter selection
  const handleSelect = (item: string, type: string) => {
    let selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    let newSelected: string[];
    
    if (type === '사역분야') {
      selected = selectedMinistryFields;
      setSelected = setSelectedMinistryFields;
    } else if (type === '지역') {
      selected = selectedLocation;
      setSelected = setSelectedLocation;
    } else {
      selected = selectedDenomination;
      setSelected = setSelectedDenomination;
    }
    
    if (selected.includes(item)) {
      newSelected = selected.filter(i => i !== item);
    } else {
      newSelected = [...selected, item];
    }
    
    setSelected(newSelected);
    
    // 검색 상태가 있을 때 localStorage 업데이트
    if (searchResult) {
      const searchState = {
        selectedMinistryFields: type === '사역분야' ? newSelected : selectedMinistryFields,
        selectedLocation: type === '지역' ? newSelected : selectedLocation,
        selectedDenomination: type === '교단' ? newSelected : selectedDenomination,
        searchResult
      };
      localStorage.setItem('ministerSearchState', JSON.stringify(searchState));
    }
  };

  // Filter by all conditions (현재 데이터 구조에서는 상세 필드 부재 → 패스)
  const filterByAllConditions = (data: MinisterListItem[]) => data;

  const handleSearch = () => {
    const filtered = filterByAllConditions(items);
    setSearchResult(filtered);
    
    // 검색 상태를 localStorage에 저장
    const searchState = {
      selectedMinistryFields,
      selectedLocation,
      selectedDenomination,
      searchResult: filtered
    };
    localStorage.setItem('ministerSearchState', JSON.stringify(searchState));
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setSelectedMinistryFields([]);
    setSelectedLocation([]);
    setSelectedDenomination([]);
    
    // localStorage에서 검색 상태 제거
    localStorage.removeItem('ministerSearchState');
  };

  const handleRemoveSelected = (item: string) => {
    if (selectedMinistryFields.includes(item)) {
      const newSelectedMinistryFields = selectedMinistryFields.filter(i => i !== item);
      setSelectedMinistryFields(newSelectedMinistryFields);
      
      // 검색 상태가 있을 때 localStorage 업데이트
      if (searchResult) {
        const searchState = {
          selectedMinistryFields: newSelectedMinistryFields,
          selectedLocation,
          selectedDenomination,
          searchResult
        };
        localStorage.setItem('ministerSearchState', JSON.stringify(searchState));
      }
    } else if (selectedLocation.includes(item)) {
      const newSelectedLocation = selectedLocation.filter(i => i !== item);
      setSelectedLocation(newSelectedLocation);
      
      // 검색 상태가 있을 때 localStorage 업데이트
      if (searchResult) {
        const searchState = {
          selectedMinistryFields,
          selectedLocation: newSelectedLocation,
          selectedDenomination,
          searchResult
        };
        localStorage.setItem('ministerSearchState', JSON.stringify(searchState));
      }
    } else if (selectedDenomination.includes(item)) {
      const newSelectedDenomination = selectedDenomination.filter(i => i !== item);
      setSelectedDenomination(newSelectedDenomination);
      
      // 검색 상태가 있을 때 localStorage 업데이트
      if (searchResult) {
        const searchState = {
          selectedMinistryFields,
          selectedLocation,
          selectedDenomination: newSelectedDenomination,
          searchResult
        };
        localStorage.setItem('ministerSearchState', JSON.stringify(searchState));
      }
    }
  };

  // Text search filter
  const textFiltered = useMemo(() => {
    const q = searchWord.trim().toLowerCase();
    if (!q) return searchResult || items;
    const dataToFilter = searchResult || items;
    return dataToFilter.filter(it =>
      (it.isView || '').toLowerCase().includes(q) ||
      (it.name || '').toLowerCase().includes(q)
    );
  }, [items, searchWord, searchResult]);

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
    return [...selectedMinistryFields, ...selectedLocation, ...selectedDenomination];
  };

  return (
    <div className="minister">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>프로필 페이지</h3>
            <div className='postBtn'
              onClick={() => navigate('/minister/edit')}
            >
              <p>내 페이지 만들기</p>
            </div>
          </div>

          <div className="subpage__main__search">
            <input
              type="text"
              placeholder="사역자명, 담당부서, 사역분야로 검색하세요"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
            />
          </div>

          <div className="subpage__main__tabrow">
            {['사역분야', '지역', '교단'].map(tab => (
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
            {(activeTab === '사역분야' ? ministryFieldsList : activeTab === '지역' ? locationList : denominationList).map((item:any, index:any) => (
              <div
                className={`checkInputbox ${
                  (activeTab === '사역분야' && selectedMinistryFields.includes(item)) ||
                  (activeTab === '지역' && selectedLocation.includes(item)) ||
                  (activeTab === '교단' && selectedDenomination.includes(item))
                    ? 'selected'
                    : ''
                }`}
                key={index}
                onClick={() => handleSelect(item, activeTab)}
              >
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="subpage__main__selectedwords">
            <b>선택된 단어:</b>
            <div className="subpage__main__selectedwords__list">
              {[...selectedMinistryFields, ...selectedLocation, ...selectedDenomination].length === 0 ? (
                <span className="subpage__main__selectedwords__none">없음</span>
              ) : (
                [...selectedMinistryFields, ...selectedLocation, ...selectedDenomination].map((item, idx) => (
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

          <div className='subpage__main__search__btn'>
            <button onClick={handleSearch}>
              선택된 조건 검색하기
            </button>
            <button onClick={handleClearSearch}>
              검색 초기화
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {list.map((it:any, idx:any) => {


              return  (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fff', cursor: 'pointer' }}
                  onClick={() => {
                    navigate(`/ministerpage?id=${it.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '4/3', background: '#f4f4f4' }}>
                    <img src={`${MainURL}/images/minister/mainimage/${it.mainImage}`} alt={it.isView} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ color: '#666' }}>{it.sort}</div>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{it.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


