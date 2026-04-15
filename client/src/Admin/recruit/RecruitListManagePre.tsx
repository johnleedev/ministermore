import React, { useCallback, useEffect, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import { citydata, religiousbodyList } from '../../DefaultData';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
// import { toast } from 'react-toastify';

export const sortSubSort = ['전임','준전임','파트', '전임or준전임','전임or파트','준전임or파트', '전임&준전임','전임&파트','준전임&파트','담임'];

function DetailModal({ open, onClose, content }: { open: boolean, onClose: () => void, content: string }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
          padding: '32px 28px',
          minWidth: '320px',
          maxWidth: '70vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{fontSize: '17px', fontWeight: 500, marginBottom: 18}}>상세내용</div>
        <div style={{fontSize: '15px', color: '#222', wordBreak: 'break-all', lineHeight: '1.5'}}>
          <div
            className="custom-html-content"
            style={{whiteSpace: 'pre-line', fontSize: '15px', color: '#222', wordBreak: 'break-all', lineHeight: '1.5'}}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        <button onClick={onClose} style={{position: 'absolute', top: 16, right: 16, background: '#eee', border: 'none', borderRadius: 4, padding: '4px 14px', fontSize: 15, cursor: 'pointer'}}>닫기</button>
      </div>
    </div>,
    document.body
  );
}

export default function RecruitListManagePre ( props: any) {

  interface ListProps {
    id: any,
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
    editingUser?: string; // 작업중 표시를 위한 필드 추가
    [key: string]: any;
  }

  

  // key별 input width 설정
  const inputWidths: { [key: string]: string } = {
    id : '50px',
    source: '80px',
    title: '400px',
    writer: '150px',
    date: '100px',
    link: '100px',
    church: '200px',
    religiousbody: '150px',
    location: '100px',
    locationDetail: '100px',
    address: '400px',
    mainpastor: '100px',
    homepage: '300px',
    churchLogo: '120px',
    school: '300px',
    career: '300px',
    sort: '300px',
    part: '300px',
    partDetail: '300px',
    recruitNum: '200px',
    workday: '300px',
    workTimeSunDay: '600px',
    workTimeWeek: '600px',
    dawnPray: '300px',
    pay: '1000px',
    welfare: '300px',
    insurance: '300px',
    severance: '300px',
    applydoc: '500px',
    applyhow: '200px',
    applytime: '300px',
    etcNotice: '200px',
    inquiry: '700px',
  };




  // 상단에 상수로 고정
  const SOURCE_WIDTH = 80;
  const TITLE_WIDTH = 200;

  const [refresh, setRefresh] = useState<boolean>(false); 
  const [listSort, setListSort] = useState('크롤링');
  const [list, setList] = useState<ListProps[]>([]);
  const [listAllLength, setListAllLength] = useState<number>(0);
  const [preEditList, setPreEditList] = useState<ListProps[]>([]);
  const [clickedRow, setClickedRow] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  // 일괄저장 로딩 상태
  const [bulkLoading, setBulkLoading] = useState(false);
  // 저장 거절 교회 목록
  const [denySaveList, setDenySaveList] = useState<string[]>([]);
  // religiousbody 드롭다운 열림 상태 (rowIdx -> boolean)
  const [religiousbodyDropdownOpen, setReligiousbodyDropdownOpen] = useState<{ [key: number]: boolean }>({});

  // 교단-대학 매핑
  const denominationMap: { [key: string]: string } = {
    '기독교대한감리회': '감신대',
    '기독교대한성결교회': '성결총회',
    '기독교대한하나님의성회': '한세대',
    '기독교한국침례회': '기독교한국침례회총회',
    '대한기독교나사렛성결회': '',
    '대한예수교장로회고신': '고신대',
    '대한예수교장로회통합': '장신대, 영신대, 한일장신대, 부산장신대, 호신대',
    '대한예수교장로회합동': '총신대, 대신대, 광신대',
    '대한예수교장로회합신': '합신대',
    '예수교대한성결교회': '',
    '한국기독교장로회': '기장총회',
    '기타교단': '',
  };
  // 대학/키워드 → 교단명 역매핑
  const universityToDenomination: { [keyword: string]: string } = {};
  Object.entries(denominationMap).forEach(([denom, unis]) => {
    unis.split(',').map(u => u.trim()).filter(Boolean).forEach(u => {
      universityToDenomination[u] = denom;
    });
  });

  // 저장 거절 교회 목록 가져오기
  const fetchDenySaveList = async () => {
    try {
      const res = await axios.get(`${MainURL}/recruitwork/getsavedenylist`);
      if (res.data.resultData) {
        const churchNames = res.data.resultData.map((item: any) => item.church);
        setDenySaveList(churchNames);
      }
    } catch (error) {
      console.error('저장 거절 목록 가져오기 실패:', error);
    }
  };

  // 타이틀에서 키워드 추출 함수
  const extractKeywords = (title: string): string[] => {
    if (!title) return [];
    const keywords = ['반주', '지휘', '방송', '학교', '직원'];
    const foundKeywords: string[] = [];
    keywords.forEach(keyword => {
      if (title.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    });
    return foundKeywords;
  };

  // 교회 이름 추출 함수
  const extractChurchName = (title: string): string => {
    if (!title) return '';
    
    // 일반적인 패턴들로 교회 이름 추출
    const patterns = [
      /^(.+?)(?:에서|에서\s+전도사|에서\s+사역자|에서\s+목사|에서\s+청빙|에서\s+구인|에서\s+채용|에서\s+모집|에서\s+구함|에서\s+구합니다|에서\s+구인합니다|에서\s+채용합니다|에서\s+모집합니다|에서\s+구함니다|에서\s+구합니다\.|에서\s+구인합니다\.|에서\s+채용합니다\.|에서\s+모집합니다\.|에서\s+구함니다\.)/,
      /^(.+?)(?:교회|교회에서|교회에서\s+전도사|교회에서\s+사역자|교회에서\s+목사|교회에서\s+청빙|교회에서\s+구인|교회에서\s+채용|교회에서\s+모집|교회에서\s+구함|교회에서\s+구합니다|교회에서\s+구인합니다|교회에서\s+채용합니다|교회에서\s+모집합니다|교회에서\s+구함니다|교회에서\s+구합니다\.|교회에서\s+구인합니다\.|교회에서\s+채용합니다\.|교회에서\s+모집합니다\.|교회에서\s+구함니다\.)/,
      /^(.+?)(?:에서\s+구합니다|에서\s+구인합니다|에서\s+채용합니다|에서\s+모집합니다|에서\s+구함니다)/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 패턴에 맞지 않는 경우 제목의 처음 부분을 반환 (최대 20자)
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  };

  // 게시글 가져오기 (임시 저장글)
  const fetchPosts = async () => {
    try {
      const user = sessionStorage.getItem('user');
      const limit = user === 'johnleedev' ? 50 : 50;
      const url = `${MainURL}/recruitwork/getrecruitmanagepre?limit=${limit}`;
      const res = await axios.get(url)
      if (res.data.resultData && Array.isArray(res.data.resultData) && res.data.resultData.length > 0) {
      let copy = res.data.resultData;
      
      // 저장 거절 목록에 있는 교회들 필터링
      copy = copy.filter((item: any) => {
        const churchName = item.church || extractChurchName(item.title);
        return !denySaveList.includes(churchName);
      });
      
      // church가 비어있는 경우 title에서 교회 이름 추출하여 자동 입력
      copy = copy.map((item: any) => {
        if (!item.church || item.church.trim() === '') {
          let churchName = extractChurchName(item.title);
          // 괄호와 내용 제거
          churchName = churchName.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
          // 모든 공백 제거
          churchName = churchName.replace(/\s+/g, '').trim();
          // '교회'가 없으면 추가
          if (churchName && !churchName.includes('교회')) {
            churchName = churchName + '교회';
          }
          return {
            ...item,
            church: churchName
          };
        } else {
          // church가 이미 있는 경우에도 정리 (괄호 제거, 공백 제거, 교회 추가)
          let churchName = item.church;
          // 괄호와 내용 제거
          churchName = churchName.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
          // 모든 공백 제거
          churchName = churchName.replace(/\s+/g, '').trim();
          // '교회'가 없으면 추가
          if (churchName && !churchName.includes('교회')) {
            churchName = churchName + '교회';
          }
          return {
            ...item,
            church: churchName
          };
        }
      });
      
      // pay.inputCost가 비어있는 경우 "교회내규에따라" 자동 입력
      copy = copy.map((item: any) => {
        if (item.pay) {
          try {
            const payData = JSON.parse(item.pay);
            if (Array.isArray(payData) && payData.length > 0) {
              // 각 pay 항목에 대해 inputCost가 비어있으면 "교회내규에따라" 입력
              const updatedPayData = payData.map((payItem: any) => {
                if (!payItem.inputCost || payItem.inputCost.trim() === '') {
                  return { ...payItem, inputCost: '교회내규에따라' };
                }
                return payItem;
              });
              return { ...item, pay: JSON.stringify(updatedPayData) };
            }
          } catch (e) {
            // JSON 파싱 실패 시 기본값으로 설정
            const defaultPayData = [{ sort: '전임', paySort: '월', selectCost: '', inputCost: '교회내규에따라' }];
            return { ...item, pay: JSON.stringify(defaultPayData) };
          }
        }
        return item;
      });
      
      // sort가 비어있는 경우 제목에 따라 자동 입력
      copy = copy.map((item: any) => {
        if (!item.sort || item.sort.trim() === '') {
          // 제목에 '파트'가 포함되어 있으면 '파트'로 설정, 그 외에는 '전임'으로 설정
          const sortValue = (item.title || '').includes('파트') ? '파트' : '전임';
          return { ...item, sort: sortValue };
        }
        return item;
      });
      
      // religiousbody 자동 세팅 (source에 대학/키워드가 포함되어 있으면 해당 교단명으로)
      copy = copy.map((item: any) => {
        let found = '';
        Object.keys(universityToDenomination).forEach(keyword => {
          if ((item.source || '').includes(keyword)) {
            found = universityToDenomination[keyword];
          }
        });
        if (found) {
          return { ...item, religiousbody: found };
        }
        return item;
      });
      
      // address가 비어있는 경우 customInput에서 주소 추출하여 자동 입력
      copy = copy.map((item: any) => {
        if (!item.address || item.address.trim() === '') {
          const extractedAddress = extractAddressFromCustomInput(item.customInput || '');
          if (extractedAddress) {
            // address 변경 시 location과 locationDetail도 자동 설정
            const { location, locationDetail } = extractLocationFromAddress(extractedAddress);
            return {
              ...item,
              address: extractedAddress,
              location: location,
              locationDetail: locationDetail
            };
          }
        }
        return item;
      });
      
      // inquiry.email이 비어있는 경우 customInput에서 이메일 추출하여 자동 입력
      copy = copy.map((item: any) => {
        try {
          let inquiryData: any = {};
          if (item.inquiry) {
            inquiryData = JSON.parse(item.inquiry);
          }
          
          // inquiry.email이 비어있거나 없으면 추출
          if (!inquiryData.email || inquiryData.email.trim() === '') {
            const extractedEmail = extractEmailFromCustomInput(item.customInput || '');
            if (extractedEmail) {
              inquiryData.email = extractedEmail;
              return {
                ...item,
                inquiry: JSON.stringify(inquiryData)
              };
            }
          }
        } catch (e) {
          // JSON 파싱 실패 시 새로 생성
          const extractedEmail = extractEmailFromCustomInput(item.customInput || '');
          if (extractedEmail) {
            return {
              ...item,
              inquiry: JSON.stringify({ inquiryName: item.writer || '', email: extractedEmail, phone: '' })
            };
          }
        }
        return item;
      });
      
      // workday, workTimeSunDay, workTimeWeek, dawnPray를 빈 배열로 설정
      copy = copy.map((item: any) => {
        let updatedItem: any = { ...item };
        const emptyArrayFields = ['workday', 'workTimeSunDay', 'workTimeWeek', 'dawnPray'];
        
        emptyArrayFields.forEach(field => {
          updatedItem[field] = '[]';
        });
        
        return updatedItem;
      });
      
      setList(copy);
      setListAllLength(res.data.totalCount);
      setPreEditList(copy);
      // DB에도 editingUser='작업중'으로 업데이트
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const editingAt = `${yyyy}-${mm}-${dd}`;
      await Promise.all(copy.map((item: any) =>
        axios.post(`${MainURL}/recruitwork/setrecruitediting`, {
          postID: item.id,
          editingUser: user || '',
          editingAt,
        })
      ));
    } else {
      setList([]);
      setListAllLength(0);
      setPreEditList([]);
    }
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      setList([]);
      setListAllLength(0);
      setPreEditList([]);
    }
   };

  // 지역명 정규화 매핑
  const LOCATION_MAP: Record<string, string> = {
    '서울': '서울특별시', '서울시': '서울특별시',
    '인천': '인천광역시', '인천시': '인천광역시',
    '경기': '경기도', '경기도': '경기도',
    '강원': '강원특별자치도', '강원도': '강원특별자치도',
    '대전': '대전광역시', '대전시': '대전광역시',
    '세종': '세종특별자치시', '세종시': '세종특별자치시',
    '광주': '광주광역시', '광주시': '광주광역시',
    '대구': '대구광역시', '대구시': '대구광역시',
    '울산': '울산광역시', '울산시': '울산광역시',
    '부산': '부산광역시', '부산시': '부산광역시',
    '전북': '전북특별자치도', '전라북도': '전북특별자치도',
    '전남': '전라남도', '전라남도': '전라남도',
    '경북': '경상북도', '경상북도': '경상북도',
    '경남': '경상남도', '경상남도': '경상남도',
    '충북': '충청북도', '충청북도': '충청북도',
    '충남': '충청남도', '충청남도': '충청남도',
    '제주': '제주특별자치도', '제주도': '제주특별자치도',
  };

  // 지역명 정규화 함수
  const normalizeLocationName = (loc: string): string => {
    return LOCATION_MAP[loc] || loc;
  };

  // 주소에서 지역 정보 자동 추출 함수
  const extractLocationFromAddress = (address: string): { location: string, locationDetail: string } => {
    if (!address || address.trim() === '') {
      return { location: '', locationDetail: '' };
    }
    
    // 주소를 공백으로 분리
    const addressParts = address.trim().split(/\s+/);
    
    if (addressParts.length >= 2) {
      // 첫 번째 단어는 location, 두 번째 단어는 locationDetail
      return {
        location: normalizeLocationName(addressParts[0]),
        locationDetail: addressParts[1]
      };
    } else if (addressParts.length === 1) {
      // 단어가 하나만 있는 경우
      return {
        location: normalizeLocationName(addressParts[0]),
        locationDetail: ''
      };
    }
    
    return { location: '', locationDetail: '' };
  };

  // citydata를 기반으로 지역명 패턴 생성
  const getAllLocationNames = () => {
    const cityNames: string[] = [];
    const subareaNames: string[] = [];
    
    citydata.forEach(city => {
      cityNames.push(city.city);
      // 약칭 추가 (서울특별시 -> 서울, 서울시 등)
      if (city.city.includes('특별시') || city.city.includes('광역시') || city.city.includes('특별자치시') || city.city.includes('도')) {
        const shortName = city.city
          .replace('특별시', '')
          .replace('광역시', '')
          .replace('특별자치시', '')
          .replace('도', '')
          .replace('특별자치도', '');
        cityNames.push(shortName);
        cityNames.push(shortName + '시');
      }
      subareaNames.push(...city.subarea);
    });
    
    // 중복 제거 및 정규식 이스케이프
    const uniqueCities = Array.from(new Set(cityNames)).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const uniqueSubareas = Array.from(new Set(subareaNames)).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    return { cityPattern: uniqueCities, subareaPattern: uniqueSubareas };
  };

  // customInput에서 주소 형식 텍스트 추출 함수 (citydata 기반으로 개선)
  const extractAddressFromCustomInput = (customInput: string): string => {
    if (!customInput) return '';
    
    // HTML 태그 제거
    const text = customInput.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 먼저 "주소:" 키워드 주변 텍스트 찾기 (가장 확실함, URL주소 제외)
    // "주소:" 다음에 나오는 모든 텍스트를 가져오되, 괄호나 특수문자 전까지
    const addressKeywordPatterns = [
      /주소[:\s]*([^\(\)\n\r]+?)(?:\s*\(|$|\n|\r|주소|담임|교회|홈페이지|문의|제출)/i,
      /주소[:\s]*([가-힣\s\d-]+(?:\([^)]*\))?)/i,
    ];
    
    for (const pattern of addressKeywordPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let addr = match[1].trim();
        // "URL주소" 같은 것은 제외
        if (!addr.includes('URL') && !addr.includes('링크') && !addr.includes('http')) {
          // 괄호 안의 전화번호 제거
          addr = addr.replace(/\s*\([^)]*tel[^)]*\)/i, '').replace(/\s*\([^)]*전화[^)]*\)/i, '');
          // tel. 제거
          addr = addr.split(/tel\./i)[0].trim();
          // 쉼표나 줄바꿈 전까지
          const cleanAddr = addr.split(/[,\n\r]/)[0].trim();
          // 다음 키워드 전까지
          const keywords = ['담임', '교회', '홈페이지', '문의', '제출', '접수', '사례', '대우'];
          let finalAddr = cleanAddr;
          for (const keyword of keywords) {
            const keywordIndex = cleanAddr.indexOf(keyword);
            if (keywordIndex > 0) {
              finalAddr = cleanAddr.substring(0, keywordIndex).trim();
              break;
            }
          }
          if (finalAddr.length > 5) {
            return finalAddr;
          }
        }
      }
    }
    
    // citydata 기반 패턴 생성
    const { cityPattern, subareaPattern } = getAllLocationNames();
    
    // 한국 주소 패턴들 (citydata 기반)
    const sidoPattern = `(?:${cityPattern})`;
    
    // citydata의 실제 지역명 사용하여 패턴 생성 (더 정확한 매칭)
    const subareaPatternRegex = `(?:${subareaPattern})`;
    
    // 패턴 1: 시/도 + 실제 지역명(subarea) + 도로명 + 번지 (가장 정확)
    // 예: "서울특별시 강남구 삼성로 150"
    const precisePattern = new RegExp(
      `(${sidoPattern}\\s+${subareaPatternRegex}\\s+[가-힣]+(?:로|길|거리|대로)\\s+[0-9-]+)`,
      'g'
    );
    const preciseMatches = text.match(precisePattern);
    if (preciseMatches && preciseMatches.length > 0) {
      const longest = preciseMatches.sort((a, b) => b.length - a.length)[0].trim();
      const cleanAddr = longest.replace(/\s*\([^)]*\)/g, '').replace(/\s*tel\./i, '').trim();
      if (cleanAddr.length > 5) {
        return cleanAddr;
      }
    }
    
    // 패턴 2: 시/도 + 실제 지역명(subarea) + 도로명 + 숫자길 + 번지
    // 예: "서울특별시 중구 청구로22길21", "전북 전주시 완산구 삼천천변 3길 60"
    const detailedPattern = new RegExp(
      `(${sidoPattern}\\s+${subareaPatternRegex}(?:\\s+[가-힣]+)*\\s+[가-힣]+(?:로|길|거리|대로)[0-9]*(?:길|로|거리|대로)?\\s*[0-9-]+)`,
      'g'
    );
    const detailedMatches = text.match(detailedPattern);
    if (detailedMatches && detailedMatches.length > 0) {
      const longest = detailedMatches.sort((a, b) => b.length - a.length)[0].trim();
      const cleanAddr = longest.replace(/\s*\([^)]*\)/g, '').replace(/\s*tel\./i, '').trim();
      if (cleanAddr.length > 5) {
        return cleanAddr;
      }
    }
    
    // 패턴 3: 시/도 + 실제 지역명(subarea) + 도로명 (공백 없이 붙어있는 경우)
    // 예: "서울특별시 중구 청구로22길21"
    const compactPattern = new RegExp(
      `(${sidoPattern}\\s+${subareaPatternRegex}\\s+[가-힣]+(?:로|길|거리|대로)[0-9]+(?:길|로|거리|대로)?[0-9-]+)`,
      'g'
    );
    const compactMatches = text.match(compactPattern);
    if (compactMatches && compactMatches.length > 0) {
      const longest = compactMatches.sort((a, b) => b.length - a.length)[0].trim();
      const cleanAddr = longest.replace(/\s*\([^)]*\)/g, '').replace(/\s*tel\./i, '').trim();
      if (cleanAddr.length > 5) {
        return cleanAddr;
      }
    }
    
    // 패턴 4: 시/도 + 일반 시/군/구 패턴 (fallback)
    const roadNamePattern = new RegExp(
      `(${sidoPattern}\\s+[가-힣]+(?:시|군|구)(?:\\s+[가-힣]+(?:구|읍|면|동|리))?\\s+[가-힣]+(?:로|길|거리|대로)\\s+[0-9-]+)`,
      'g'
    );
    const roadNameMatches = text.match(roadNamePattern);
    if (roadNameMatches && roadNameMatches.length > 0) {
      const longest = roadNameMatches.sort((a, b) => b.length - a.length)[0].trim();
      const cleanAddr = longest.replace(/\s*\([^)]*\)/g, '').replace(/\s*tel\./i, '').trim();
      if (cleanAddr.length > 5) {
        return cleanAddr;
      }
    }
    
    // 패턴 5: 시/도 + 실제 지역명만 (최소한의 정보라도 추출)
    const simpleLocationPattern = new RegExp(
      `(${sidoPattern}\\s+${subareaPatternRegex})`,
      'g'
    );
    const simpleLocationMatches = text.match(simpleLocationPattern);
    if (simpleLocationMatches && simpleLocationMatches.length > 0) {
      return simpleLocationMatches[0].trim();
    }
    
    return '';
  };

  // customInput에서 교회명 추출 및 정리 함수
  const extractAndFormatChurchName = (customInput: string, title: string): string => {
    // 먼저 title에서 교회명 추출 시도 (이미 있는 함수 활용)
    let churchName = extractChurchName(title || '');
    
    // customInput에서 교회명 찾기 시도
    if (!churchName || churchName.trim() === '') {
      const text = customInput.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // "교회" 키워드 주변 텍스트 찾기
      const churchPatterns = [
        /([가-힣a-zA-Z0-9\s]+교회)/g,
        /교회[:\s]*([가-힣a-zA-Z0-9\s]+)/g,
        /교회명[:\s]*([가-힣a-zA-Z0-9\s]+)/g,
      ];
      
      for (const pattern of churchPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          churchName = matches[0].replace(/교회[:\s]*/g, '').replace(/교회명[:\s]*/g, '').trim();
          break;
        }
      }
    }
    
    if (!churchName || churchName.trim() === '') {
      return '';
    }
    
    // 괄호 안의 텍스트 제거 (소괄호와 대괄호) - 모든 괄호와 내용 제거
    churchName = churchName.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
    
    // 모든 공백 제거 (앞뒤뿐만 아니라 중간 공백도)
    churchName = churchName.replace(/\s+/g, '').trim();
    
    // '교회'가 없으면 추가
    if (churchName && !churchName.includes('교회')) {
      churchName = churchName + '교회';
    }
    
    return churchName;
  };

  // customInput에서 이메일 추출 함수
  const extractEmailFromCustomInput = (customInput: string): string => {
    if (!customInput) return '';
    
    // HTML 태그 제거
    const text = customInput.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 이메일 패턴: 일반적인 이메일 형식
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // 먼저 "이메일:", "E-mail:", "Email:" 등의 키워드 뒤에서 찾기
    const emailKeywordPatterns = [
      /(?:이메일|E-mail|Email|e-mail|email|E-Mail)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /(?:접수|제출|문의)[:\s]*(?:방법|처)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    ];
    
    for (const pattern of emailKeywordPatterns) {
      const match = text.match(pattern);
      if (match && match.length > 0) {
        // 패턴에서 이메일 부분만 추출
        const emailMatch = match[0].match(emailPattern);
        if (emailMatch && emailMatch.length > 0) {
          return emailMatch[0].trim();
        }
      }
    }
    
    // 키워드 없이 이메일 패턴만 찾기 (여러 개가 있을 수 있으므로 첫 번째 것 선택)
    const allEmails = text.match(emailPattern);
    if (allEmails && allEmails.length > 0) {
      // 일반적으로 접수나 문의용 이메일이므로 첫 번째 이메일 반환
      return allEmails[0].trim();
    }
    
    return '';
  };

  // input 변경 핸들러 (임시저장글)
  const handlePreInputChange = (rowIdx: number, key: keyof ListProps, value: string) => {
    setPreEditList(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      let updatedRow = { ...row, [key]: value };
      
      if (key === 'address') {
        // address 변경 시, location과 locationDetail 자동 입력
        const { location, locationDetail } = extractLocationFromAddress(value);
        updatedRow.location = location;
        updatedRow.locationDetail = locationDetail;
      }
      
      if (key === 'source') {
        // source 변경 시, 대학/키워드가 포함되어 있으면 해당 교단명으로 religiousbody 자동 세팅
        let found = '';
        Object.keys(universityToDenomination).forEach(keyword => {
          if (value.includes(keyword)) {
            found = universityToDenomination[keyword];
          }
        });
        if (found) {
          updatedRow.religiousbody = found;
        }
      }
      if (key === 'sort') {
        // 자동으로 sort를 맞춰줄 필드들 (모두 적용)
        const arrayFields = [
          'part', 'partDetail', 'school', 'career',
          'workday', 'workTimeSunDay', 'workTimeWeek', 'dawnPray',
          'pay', 'welfare', 'insurance', 'severance', 'applydoc', 'applytime'
        ];
        arrayFields.forEach(field => {
          try {
            const arr = JSON.parse(row[field] as any) || [];
            const newArr = arr.map((obj: any) => ({ ...obj, sort: value }));
            updatedRow[field] = JSON.stringify(newArr);
          } catch {
            // 파싱 실패시 무시
          }
        });
      }
      return updatedRow;
    }));
  };

  // JSON 배열 content 전용 핸들러 (school, career, part, partDetail, applydoc)
  const handleJsonArrayContentInputChange = (e: React.ChangeEvent<HTMLInputElement>, rowIdx: number, key: string) => {
    setPreEditList(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      let updatedRow = { ...row };
      try {
        const arr = JSON.parse(row[key] || '[]');
        if (arr.length > 0) {
          arr[0].content = e.target.value;
          updatedRow[key] = JSON.stringify(arr);
        }
      } catch {
        // 파싱 실패시 무시
      }
      return updatedRow;
    }));
  };

  // applytime 전용 핸들러
  const handleApplytimeInputChange = (e: React.ChangeEvent<HTMLInputElement>, rowIdx: number, key: string) => {
    setPreEditList(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      let updatedRow = { ...row };
      try {
        let arr = [];
        if (row[key]) {
          arr = JSON.parse(row[key]);
        }
        if (!Array.isArray(arr) || arr.length === 0) {
          arr = [{ startDay: row.date || '', daySort: '채용시까지' }];
        }
        arr[0].daySort = e.target.value;
        updatedRow[key] = JSON.stringify(arr);
      } catch {
        // 파싱 실패시 무시
      }
      return updatedRow;
    }));
  };

  // inquiry 전용 핸들러
  const handleInquiryInputChange = (e: React.ChangeEvent<HTMLInputElement>, rowIdx: number, key: string, field: string) => {
    setPreEditList(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      let updatedRow = { ...row };
      try {
        let arr: any;
        if (row[key]) {
          arr = JSON.parse(row[key]);
        }
        arr[field] = e.target.value;
        updatedRow[key] = JSON.stringify(arr);
      } catch {
        // 파싱 실패시 무시
      }
      return updatedRow;
    }));
  };

  // input 이동용 key 배열 (source, title, id, ... 제외, 실제 렌더 순서와 맞춰야 함)
  const editableKeys = [
    'writer', 'date', 'link', 'church', 'religiousbody', 'location', 'locationDetail', 'address', 'mainpastor', 'homepage', 'churchLogo',
    'school', 'career', 'sort', 'part', 'partDetail', 'recruitNum', 'pay', 'applydoc', 'applyhow', 'applytime', 'etcNotice', 'inquiry'
  ];

  // 방향키 이동 핸들러
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIdx: number, colKey: string) => {
    // location과 locationDetail 필드에서는 화살표 키 이동 비활성화
    if (colKey === 'location' || colKey === 'locationDetail') {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        return;
      }
    }
    
    const colIdx = editableKeys.indexOf(colKey);
    let nextRow = rowIdx, nextCol = colIdx;
    let isArrow = false;
    if (e.key === 'ArrowRight') { nextCol++; isArrow = true; }
    if (e.key === 'ArrowLeft') { nextCol--; isArrow = true; }
    if (e.key === 'ArrowDown') { nextRow++; isArrow = true; }
    if (e.key === 'ArrowUp') { nextRow--; isArrow = true; }
    if (isArrow) {
      if (nextCol < 0 || nextCol >= editableKeys.length || nextRow < 0 || nextRow >= preEditList.length) return;
      const nextKey = editableKeys[nextCol];
      const selector = `input[data-row='${nextRow}'][data-col='${nextKey}'], select[data-row='${nextRow}'][data-col='${nextKey}']`;
      const nextInput = document.querySelector(selector) as HTMLElement | null;
      if (nextInput) {
        nextInput.focus();
        e.preventDefault();
      }
    }
    // Arrow 키가 아닐 때는 e.preventDefault()를 호출하지 않음!
  };

  

  // 페이지 로드 시 저장 거절 목록 가져오기
  useEffect(() => {
    fetchDenySaveList();
  }, []);

  // 바깥 클릭 시 모달 닫기
  useEffect(() => {
    if (clickedRow !== null) {
      const handleClick = (e: MouseEvent) => {
        setClickedRow(null);
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [clickedRow]);

  // 일괄저장 핸들러
  const handleBulkSave = async () => {
    if (!window.confirm('현재 입력된 모든 임시저장글을 한 번에 저장하시겠습니까?')) return;
    setBulkLoading(true);
    try {
      // 오늘 날짜 (YYYY-MM-DD)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const saveDate = `${yyyy}-${mm}-${dd}`;
      const saveUser = sessionStorage.getItem('user') || '';
      // 모든 항목에 saveDate, saveUser 적용 및 workday, workTimeSunDay, workTimeWeek, dawnPray를 빈 배열로 설정
      const sendList = preEditList.map(item => {
        let updatedItem: any = { ...item, saveDate, saveUser };
        const emptyArrayFields = ['workday', 'workTimeSunDay', 'workTimeWeek', 'dawnPray'];
        
        emptyArrayFields.forEach(field => {
          updatedItem[field] = '[]';
        });
        
        return updatedItem;
      });
      const res = await axios.post(`${MainURL}/recruitwork/bulkupdaterecruitpre`, { list: sendList });
              if (res.data.success) {
          let message = res.data.message || '일괄 저장이 완료되었습니다.';
          window.alert(message);
          setRefresh(r => !r);
          setPreEditList([]);
        } else {
          window.alert('일괄 저장에 실패했습니다.');
        }
    } catch (err) {
      window.alert('서버 오류로 저장에 실패했습니다.');
    } finally {
      setBulkLoading(false);
    }
  };

  // 삭제 핸들러
  const handleDeleteRow = async (id: any) => {
    try {
      const res = await axios.post(`${MainURL}/recruitwork/deleterecruitpre`, { id });
      if (res.data.success) {
        setPreEditList(prev => prev.filter(item => item.id !== id));
        setList(prev => prev.filter(item => item.id !== id));
      } else {
        window.alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      window.alert('서버 오류로 삭제에 실패했습니다.');
    }
  };

  // 교회 테이블에 저장 핸들러
  const handleSaveToChoir = async (item: ListProps) => {
    try {
      const userAccount = sessionStorage.getItem('user') || '';
      const res = await axios.post(`${MainURL}/recruitwork/postsrecruitchurch`, {
        postID: item.id,
        userAccount,
        source: item.source || '',
        title: item.title || '',
        writer: item.writer || '',
        date: item.date || '',
        link: item.link || '',
        church: item.church || '',
        religiousbody: item.religiousbody || '',
        location: item.location || '',
        locationDetail: item.locationDetail || '',
        address: item.address || '',
        mainpastor: item.mainpastor || '',
        homepage: item.homepage || '',
        churchLogo: item.churchLogo || '',
        school: item.school || '',
        career: item.career || '',
        sort: item.sort || '',
        part: item.part || '',
        partDetail: item.partDetail || '',
        recruitNum: item.recruitNum || '',
        workday: item.workday || '',
        workTimeSunDay: item.workTimeSunDay || '',
        workTimeWeek: item.workTimeWeek || '',
        dawnPray: item.dawnPray || '',
        pay: item.pay || '',
        welfare: item.welfare || '',
        insurance: item.insurance || '',
        severance: item.severance || '',
        applydoc: item.applydoc || '',
        applyhow: item.applyhow || '',
        applytime: item.applytime || '',
        etcNotice: item.etcNotice || '',
        inquiry: item.inquiry || '',
        customInput: item.customInput || ''
      });
      if (res.data.success) {
        window.alert('교회 테이블에 저장되었습니다.');
        // 저장 후 recruitDataPre에서 삭제하거나 상태 업데이트
        setPreEditList(prev => prev.filter(i => i.id !== item.id));
        setList(prev => prev.filter(i => i.id !== item.id));
      } else {
        window.alert('저장에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('교회 저장 오류:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '서버 오류로 저장에 실패했습니다.';
      window.alert(errorMessage);
    }
  };

  // 기관 테이블에 저장 핸들러
  const handleSaveToInstitute = async (item: ListProps) => {
    try {
      const userAccount = sessionStorage.getItem('user') || '';
      const res = await axios.post(`${MainURL}/recruitwork/postsrecruitinstitute`, {
        postID: item.id,
        userAccount,
        source: item.source || '',
        title: item.title || '',
        writer: item.writer || '',
        date: item.date || '',
        link: item.link || '',
        church: item.church || '',
        religiousbody: item.religiousbody || '',
        location: item.location || '',
        locationDetail: item.locationDetail || '',
        address: item.address || '',
        mainpastor: item.mainpastor || '',
        homepage: item.homepage || '',
        churchLogo: item.churchLogo || '',
        school: item.school || '',
        career: item.career || '',
        sort: item.sort || '',
        part: item.part || '',
        partDetail: item.partDetail || '',
        recruitNum: item.recruitNum || '',
        workday: item.workday || '',
        workTimeSunDay: item.workTimeSunDay || '',
        workTimeWeek: item.workTimeWeek || '',
        dawnPray: item.dawnPray || '',
        pay: item.pay || '',
        welfare: item.welfare || '',
        insurance: item.insurance || '',
        severance: item.severance || '',
        applydoc: item.applydoc || '',
        applyhow: item.applyhow || '',
        applytime: item.applytime || '',
        etcNotice: item.etcNotice || '',
        inquiry: item.inquiry || '',
        customInput: item.customInput || ''
      });
      if (res.data.success) {
        window.alert('기관 테이블에 저장되었습니다.');
        // 저장 후 recruitDataPre에서 삭제하거나 상태 업데이트
        setPreEditList(prev => prev.filter(i => i.id !== item.id));
        setList(prev => prev.filter(i => i.id !== item.id));
      } else {
        window.alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('기관 저장 오류:', err);
      window.alert('서버 오류로 저장에 실패했습니다.');
    }
  };

  // schoolSubSort 옵션 정의 (예시, 실제 옵션은 RecruitPost.tsx 참고)
  const schoolSubSort = [
    '신학대학원 졸업',
    '신학대학원 재학',
    '신학대학 졸업',
    '신학대학 재학',
    '일반대학 졸업',
    '일반대학 재학',
    '기타'
  ];

  const multiInputFields = [
    'school', 'career', 'part', 'partDetail', 'workday', 'workTimeSunDay', 'workTimeWeek', 'dawnPray', 'pay', 'welfare', 'insurance', 'severance', 'applydoc', 'inquiry'
  ];

  // 필드별 subSort 옵션 매핑
  const fieldSubSortMap: { [key: string]: string[] } = {
    career: [
      '담임', '부목', '전도사', '교육전도사', '파트', '준전임', '전임', '기타'
    ],
    part: [
      '찬양', '청년', '아동', '중고등부', '행정', '미디어', '기타'
    ],
    partDetail: [
      '찬양인도', '반주', '음향', '영상', '기타'
    ],
    workday: [
      '주일', '평일', '토요일', '수요일', '금요일', '기타'
    ],
    dawnPray: [
      '월', '화', '수', '목', '금', '토', '일'
    ],
    pay: [
      '월급', '연봉', '사례비', '기타'
    ],
    welfare: [
      '4대보험', '식사제공', '숙소제공', '기타'
    ],
    insurance: [
      '국민연금', '건강보험', '고용보험', '산재보험', '기타'
    ],
    severance: [
      '퇴직금', '없음', '기타'
    ],
    applydoc: [
      '이력서', '자기소개서', '추천서', '졸업증명서', '기타'
    ],
    inquiry: [
      '이메일', '전화', '문자', '카카오톡', '기타'
    ],
  };

  // 빨간색 강조 컬럼
  const redKeys = ['church', 'religiousbody', 'location', 'locationDetail', 'address', 'sort', 'pay'];

  return (
    <div className="admin-register" style={{width: '100vw', maxWidth: '1800px'}}>
      <div className="inner" style={{width: '100vw', maxWidth: '1800px'}}>
        <h2 style={{marginBottom: '20px', fontSize: '24px', fontWeight: 'bold'}}>일괄 관리 (입력)</h2>
        {/* 일괄저장 버튼 추가 */}
        <div style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
          <button
            onClick={handleBulkSave}
            disabled={bulkLoading}
            style={{
              width: '150px',
              height: '50px',
              background: '#4a90e2',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 24px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: bulkLoading ? 'not-allowed' : 'pointer',
              opacity: bulkLoading ? 0.6 : 1
            }}
          >
            {bulkLoading ? '저장중...' : '일괄저장'}
          </button>
          {/* 불러오기 버튼 추가 */}
          <button
            onClick={fetchPosts}
            disabled={bulkLoading}
            style={{
              width: '150px',
              height: '50px',
              background: '#fff',
              color: '#4a90e2',
              border: '1px solid #4a90e2',
              borderRadius: '5px',
              padding: '8px 24px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: bulkLoading ? 'not-allowed' : 'pointer',
              opacity: bulkLoading ? 0.6 : 1
            }}
          >
            불러오기
          </button>
          {/* 주소일괄클릭 버튼 추가 */}
          <button
            onClick={() => {
              preEditList.forEach((item, idx) => {
                const extractedAddress = extractAddressFromCustomInput(item.customInput || '');
                
                if (extractedAddress) {
                  handlePreInputChange(idx, 'address', extractedAddress);
                }
              });
            }}
            disabled={bulkLoading}
            style={{
              width: '150px',
              height: '50px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 24px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: bulkLoading ? 'not-allowed' : 'pointer',
              opacity: bulkLoading ? 0.6 : 1
            }}
          >
            주소일괄클릭
          </button>
        </div>
        <div className="table-container" style={{overflowX: 'auto', maxWidth: '100vw'}}>
          <table className="recruit-table" style={{borderCollapse: 'collapse', width: '100vw'}}>
          {preEditList.length > 0 && (
            <thead>
              <tr>
                {/* 가장 왼쪽에 source, title 고정 */}
                <th style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  background: '#fff',
                  borderRight: '2px solid #eee',
                  minWidth: `${SOURCE_WIDTH}px`,
                  maxWidth: `${SOURCE_WIDTH}px`,
                }}>소스</th>
                <th style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  position: 'sticky',
                  left: `${SOURCE_WIDTH}px`,
                  zIndex: 3,
                  background: '#fff',
                  borderRight: '2px solid #eee',
                  minWidth: `${TITLE_WIDTH}px`,
                  maxWidth: `${TITLE_WIDTH}px`,
                }}>제목</th>
                <th style={{
                  textAlign: 'center',
                  padding: '0 10px',
                  position: 'sticky',
                  left: `${SOURCE_WIDTH + TITLE_WIDTH}px`,
                  zIndex: 2,
                  background: '#fff',
                  borderRight: '2px solid #eee',
                }}>링크</th>
                {/* 나머지 헤더 (source, title, link 제외) */}
                {['writer','date','church','religiousbody','location','locationDetail','address','mainpastor','homepage','churchLogo','school','career','sort','part','partDetail','recruitNum','pay','applydoc','applyhow','applytime','etcNotice','inquiry'].map((key) => (
                  <th
                    key={key}
                    style={{
                      textAlign: 'center',
                      padding: '0 10px',
                      color: redKeys.includes(key) ? '#e74c3c' : undefined
                    }}
                  >
                    {key === 'writer' ? '작성자'
                      : key === 'date' ? '날짜'
                      : key === 'church' ? '교회명'
                      : key === 'religiousbody' ? '교단'
                      : key === 'location' ? '지역'
                      : key === 'locationDetail' ? '상세지역'
                      : key === 'address' ? '주소'
                      : key === 'mainpastor' ? '담임목사'
                      : key === 'homepage' ? '홈페이지'
                      : key === 'churchLogo' ? '로고'
                      : key === 'school' ? '학력'
                      : key === 'career' ? '경력'
                      : key === 'sort' ? '구분'
                      : key === 'part' ? '파트'
                      : key === 'partDetail' ? '파트상세'
                      : key === 'recruitNum' ? '모집인원'
                      : key === 'pay' ? '사례'
                      : key === 'applydoc' ? '지원서류'
                      : key === 'applyhow' ? '지원방법'
                      : key === 'applytime' ? '모집기간'
                      : key === 'etcNotice' ? '기타사항'
                      : key === 'inquiry' ? '문의'
                      : key
                    }
                  </th>
                ))}
                <th style={{textAlign: 'center', padding: '0 10px'}}>상세내용</th>
                <th style={{textAlign: 'center', padding: '0 10px'}}></th>
                <th style={{textAlign: 'center', padding: '0 10px'}}></th>
                <th style={{textAlign: 'center', padding: '0 10px'}}></th>
              </tr>
            </thead>
            )}
            <tbody>
              {preEditList.length > 0 ? (
                preEditList.map((item, idx) => (
                  <tr key={idx} style={{margin: '0', gap: '0'}}>
                    {/* 가장 왼쪽에 source, title, link 고정 */}
                    <td style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      background: '#fff',
                      borderRight: '2px solid #eee',
                      fontWeight: 600,
                      color: '#4a90e2',
                      textAlign: 'center',
                      padding: '0 10px',
                    }}>{item.source}</td>
                    <td style={{
                      position: 'sticky',
                      left: `100px`,
                      height: '70px',
                      zIndex: 2,
                      background: '#fff',
                      borderRight: '2px solid #eee',
                      fontWeight: 600,
                      color: '#222',
                      textAlign: 'center',
                      padding: '0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      width: '200px',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{width: '100%', textAlign: 'center'}}>{item.title}</div>
                      {extractKeywords(item.title || '').length > 0 && (
                        <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center'}}>
                          {extractKeywords(item.title || '').map((keyword, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#4a90e2',
                                color: '#fff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{
                      position: 'sticky',
                      width: '100px',
                      zIndex: 1,
                      background: '#fff',
                      borderRight: '2px solid #eee',
                      fontWeight: 600,
                      color: '#222',
                      textAlign: 'center',
                      padding: '0 10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      left: `300px`,
                    }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1a0dab',
                          textDecoration: 'underline',
                          display: 'inline-block',
                          width: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.link}
                      </a>
                    </td>
                    {/* 나머지 셀 렌더링 (source, title, link 제외) */}
                    {Object.keys(item).map((key) => {
                      if (key === 'source' || key === 'title' || key === 'link' || key === 'customInput' || key === 'workday' || key === 'workTimeSunDay' || key === 'workTimeWeek' || key === 'dawnPray' || key === 'welfare' || key === 'insurance' || key === 'severance') return null;

                      return (
                        (key !== 'customInput' && key !== 'id') ? (
                          <td style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14, textAlign: 'center', padding: '0 10px'}}>
                            {/* {
                              idx === 0 &&
                              <p>{key as keyof ListProps}</p>
                            } */}
                            {key === 'link' ? (
                              item[key as keyof ListProps] ? (
                                <a
                                  href={item[key as keyof ListProps] as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-block',
                                    width: '100px',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    padding: '2px 4px',
                                    border: '1px solid #ddd',
                                    borderRadius: '3px',
                                    color: '#1a0dab',
                                    textDecoration: 'underline',
                                    background: '#f9f9f9',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {item[key as keyof ListProps]}
                                </a>
                              ) : null
                            ) : key === 'sort' ? (
                              <select
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                 
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  background: '#fff',
                                  color: redKeys.includes(key) ? '#e74c3c' : undefined
                                }}
                                value={item[key as keyof ListProps] ?? ''}
                                onChange={e => handlePreInputChange(idx, key as keyof ListProps, e.target.value)}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              >
                                <option value="">선택</option>
                                {sortSubSort.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : key === 'school' || key === 'career' || key === 'part' || key === 'partDetail' ? (
                              <input
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                }}
                                value={(() => {
                                  try {
                                    const arr = JSON.parse(item[key] || '[]');
                                    return arr[0]?.content || '';
                                  } catch {
                                    return '';
                                  }
                                })()}
                                onChange={e => handleJsonArrayContentInputChange(e, idx, key)}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              />
                            ) : key === 'applydoc' ? (
                              <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center'}}>
                                <input
                                  style={{
                                    width: inputWidths[key] || '100px',
                                    height: '30px',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    padding: '2px 4px',
                                    border: '1px solid #ddd',
                                    borderRadius: '3px',
                                  }}
                                  value={(() => {
                                    try {
                                      const arr = JSON.parse(item[key] || '[]');
                                      return arr[0]?.content || '';
                                    } catch {
                                      return '';
                                    }
                                  })()}
                                  onChange={e => handleJsonArrayContentInputChange(e, idx, key)}
                                  data-row={idx}
                                  data-col={key}
                                  onKeyDown={e => handleInputKeyDown(e, idx, key)}
                                />
                                <div style={{display: 'flex', gap: '8px'}}>
                                  {['이력서', '자기소개서', '추천서', '졸업증명서', '설교영상', '가족관계증명서'].map(doc => (
                                    <button
                                      key={doc}
                                      type="button"
                                      style={{
                                        background: '#f5f5f5',
                                        border: '1px solid #bbb',
                                        borderRadius: '4px',
                                        padding: '2px 10px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => {
                                        setPreEditList(prev => prev.map((row, rowIdx) => {
                                          if (rowIdx !== idx) return row;
                                          let updatedRow = { ...row };
                                          try {
                                            const arr = JSON.parse(row[key] || '[]');
                                            if (arr.length > 0) {
                                              let current = arr[0].content || '';
                                              let list = current ? current.split(',').map((v:string) => v.trim()) : [];
                                              if (!list.includes(doc)) {
                                                list.push(doc);
                                                arr[0].content = list.join(', ');
                                                updatedRow[key] = JSON.stringify(arr);
                                              }
                                            }
                                          } catch {
                                            updatedRow[key] = JSON.stringify([{ content: doc }]);
                                          }
                                          return updatedRow;
                                        }));
                                      }}
                                    >{doc}</button>
                                  ))}
                                </div>
                              </div>
                            ) : key === 'applytime' ? (
                              <input
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                }}
                                value={(() => {
                                  try {
                                    let arr = [];
                                    if (item[key]) {
                                      arr = JSON.parse(item[key]);
                                    }
                                    if (!Array.isArray(arr) || arr.length === 0) {
                                      arr = [{ startDay: item.date || '', daySort: '채용시까지' }];
                                    }
                                    return arr[0]?.daySort || '채용시까지';
                                  } catch {
                                    return '채용시까지';
                                  }
                                })()}
                                onChange={e => handleApplytimeInputChange(e, idx, key)}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              />
                            ) : key === 'pay' ? (
                              (() => {
                                let paySort = '';
                                let inputCost = '';
                                try {
                                  const arr = JSON.parse(item[key] || '[]');
                                  paySort = arr[0]?.paySort || '월';
                                  inputCost = arr[0]?.inputCost || '';
                                } catch {}
                                return (
                                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center'}}>
                                    <div style={{display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center'}}>
                                      <select
                                        style={{
                                          width: '70px',
                                          height: '30px',
                                          fontSize: 14,
                                          textAlign: 'center',
                                          border: '1px solid #ddd',
                                          borderRadius: '3px',
                                        }}
                                        value={paySort}
                                        onChange={e => {
                                          setPreEditList(prev => prev.map((row, rowIdx) => {
                                            if (rowIdx !== idx) return row;
                                            let updatedRow = { ...row };
                                            try {
                                              const arr = JSON.parse(row[key] || '[]');
                                              if (arr.length > 0) {
                                                arr[0].paySort = e.target.value || '월';
                                                updatedRow[key] = JSON.stringify(arr);
                                              }
                                            } catch {}
                                            return updatedRow;
                                          }));
                                        }}
                                      >
                                        <option value="월">월</option>
                                        <option value="연">연</option>
                                      </select>
                                      <input
                                        style={{
                                          width: '200px',
                                          height: '30px',
                                          fontSize: 14,
                                          textAlign: 'center',
                                          padding: '2px 4px',
                                          border: '1px solid #ddd',
                                          borderRadius: '3px',
                                        }}
                                        value={inputCost}
                                        onChange={e => {
                                          setPreEditList(prev => prev.map((row, rowIdx) => {
                                            if (rowIdx !== idx) return row;
                                            let updatedRow = { ...row };
                                            try {
                                              const arr = JSON.parse(row[key] || '[]');
                                              if (arr.length > 0) {
                                                arr[0].inputCost = e.target.value;
                                                updatedRow[key] = JSON.stringify(arr);
                                              }
                                            } catch {}
                                            return updatedRow;
                                          }));
                                        }}
                                      />
                                    </div>
                                    {/* Quick input buttons below pay input */}
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <button
                                        type="button"
                                        style={{
                                          background: '#f5f5f5',
                                          border: '1px solid #bbb',
                                          borderRadius: '4px',
                                          padding: '2px 10px',
                                          fontSize: '13px',
                                          cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                          setPreEditList(prev => prev.map((row, rowIdx) => {
                                            if (rowIdx !== idx) return row;
                                            let updatedRow = { ...row };
                                            try {
                                              const arr = JSON.parse(row[key] || '[]');
                                              if (arr.length > 0) {
                                                let current = arr[0].inputCost || '';
                                                let list = current ? current.split(',').map((v:string) => v.trim()) : [];
                                                if (!list.includes('협의후결정')) {
                                                  list.push('협의후결정');
                                                  arr[0].inputCost = list.join(', ');
                                                  updatedRow[key] = JSON.stringify(arr);
                                                }
                                              }
                                            } catch {
                                              updatedRow[key] = JSON.stringify([{ paySort: paySort || '월', inputCost: '협의후결정' }]);
                                            }
                                            return updatedRow;
                                          }));
                                        }}
                                      >협의후결정</button>
                                      <button
                                        type="button"
                                        style={{
                                          background: '#f5f5f5',
                                          border: '1px solid #bbb',
                                          borderRadius: '4px',
                                          padding: '2px 10px',
                                          fontSize: '13px',
                                          cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                          setPreEditList(prev => prev.map((row, rowIdx) => {
                                            if (rowIdx !== idx) return row;
                                            let updatedRow = { ...row };
                                            try {
                                              const arr = JSON.parse(row[key] || '[]');
                                              if (arr.length > 0) {
                                                let current = arr[0].inputCost || '';
                                                let list = current ? current.split(',').map((v:string) => v.trim()) : [];
                                                if (!list.includes('교회내규에따라')) {
                                                  list.push('교회내규에따라');
                                                  arr[0].inputCost = list.join(', ');
                                                  updatedRow[key] = JSON.stringify(arr);
                                                }
                                              }
                                            } catch {
                                              updatedRow[key] = JSON.stringify([{ paySort: paySort || '월', inputCost: '교회내규에따라' }]);
                                            }
                                            return updatedRow;
                                          }));
                                        }}
                                      >교회내규에따라</button>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : key === 'inquiry' ? (
                              (() => {

                                let arr: any;
                                try {
                                  arr = JSON.parse(item[key] || '[]');
                                } catch {
                                  arr = [{ inquiryName: '', email: '', phone: '' }];
                                }
                                const inquiryName = arr.inquiryName === '' ? item.writer : arr.inquiryName;
                                const email = arr.email || '';
                                const phone = arr.phone || '';
                                return (
                                  <div style={{display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center'}}>
                                    <input
                                      style={{ width: '150px', height: '30px', fontSize: 14, textAlign: 'center', border: '1px solid #ddd', borderRadius: '3px' }}
                                      value={inquiryName}
                                      placeholder="이름"
                                      onChange={e => handleInquiryInputChange(e, idx, key, 'inquiryName')}
                                    />
                                    <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                      <input
                                        style={{ width: '200px', height: '30px', fontSize: 14, textAlign: 'center', border: '1px solid #ddd', borderRadius: '3px' }}
                                        value={email}
                                        placeholder="이메일"
                                        onChange={e => handleInquiryInputChange(e, idx, key, 'email')}
                                      />
                                      <button
                                        type="button"
                                        style={{
                                          height: '30px',
                                          padding: '0 10px',
                                          borderRadius: '3px',
                                          background: '#4a90e2',
                                          color: '#fff',
                                          border: 'none',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          fontWeight: 500,
                                          whiteSpace: 'nowrap'
                                        }}
                                        onClick={() => {
                                          const extractedEmail = extractEmailFromCustomInput(item.customInput || '');
                                          if (extractedEmail) {
                                            handleInquiryInputChange(
                                              { target: { value: extractedEmail } } as React.ChangeEvent<HTMLInputElement>,
                                              idx,
                                              key,
                                              'email'
                                            );
                                          } else {
                                            alert('상세내용에서 이메일을 찾을 수 없습니다.');
                                          }
                                        }}
                                        title="상세내용에서 이메일 가져오기"
                                      >
                                        가져오기
                                      </button>
                                    </div>
                                    <input
                                      style={{ width: '150px', height: '30px', fontSize: 14, textAlign: 'center', border: '1px solid #ddd', borderRadius: '3px' }}
                                      value={phone}
                                      placeholder="연락처"
                                      onChange={e => handleInquiryInputChange(e, idx, key, 'phone')}
                                    />
                                  </div>
                                );
                              })()
                            ) : key === 'religiousbody' ? (
                              <div style={{ position: 'relative', width: inputWidths[key] || '150px' }}>
                                <input
                                  style={{
                                    width: '100%',
                                    height: '30px',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    padding: '2px 4px',
                                    border: '1px solid #ddd',
                                    borderRadius: '3px',
                                    color: redKeys.includes(key) ? '#e74c3c' : undefined,
                                    cursor: 'pointer'
                                  }}
                                  value={item[key as keyof ListProps] ?? ''}
                                  onChange={e => handlePreInputChange(idx, key as keyof ListProps, e.target.value)}
                                  onClick={() => {
                                    setReligiousbodyDropdownOpen(prev => ({
                                      ...prev,
                                      [idx]: !prev[idx]
                                    }));
                                  }}
                                  onBlur={() => {
                                    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
                                    setTimeout(() => {
                                      setReligiousbodyDropdownOpen(prev => ({
                                        ...prev,
                                        [idx]: false
                                      }));
                                    }, 200);
                                  }}
                                  data-row={idx}
                                  data-col={key}
                                  onKeyDown={e => handleInputKeyDown(e, idx, key)}
                                  placeholder="교단 선택"
                                />
                                {religiousbodyDropdownOpen[idx] && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      background: '#fff',
                                      border: '1px solid #ddd',
                                      borderRadius: '3px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      zIndex: 1000,
                                      maxHeight: '200px',
                                      overflowY: 'auto',
                                      marginTop: '2px'
                                    }}
                                  >
                                    {religiousbodyList.map((denomination) => (
                                      <div
                                        key={denomination}
                                        style={{
                                          padding: '8px 12px',
                                          fontSize: '14px',
                                          cursor: 'pointer',
                                          borderBottom: '1px solid #f0f0f0',
                                          color: redKeys.includes(key) ? '#e74c3c' : '#222'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#f5f5f5';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = '#fff';
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handlePreInputChange(idx, key as keyof ListProps, denomination);
                                          setReligiousbodyDropdownOpen(prev => ({
                                            ...prev,
                                            [idx]: false
                                          }));
                                        }}
                                      >
                                        {denomination}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : key === 'location' ? (
                              <select
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                  border: (!item.location || item.location.trim() === '' || item.location === '선택') ? '2px solid #e74c3c' : '1px solid #ddd',
                                  borderRadius: '3px',
                                  background: '#fff',
                                  color: redKeys.includes(key) ? '#e74c3c' : undefined
                                }}
                                value={item[key as keyof ListProps] ?? ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  setPreEditList(prev => prev.map((row, rowIdx) => {
                                    if (rowIdx !== idx) return row;
                                    return { ...row, location: value, locationDetail: '' };
                                  }));
                                }}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              >
                                <option value="">선택</option>
                                {citydata.map(c => (
                                  <option key={c.city} value={c.city}>{c.city}</option>
                                ))}
                              </select>
                            ) : key === 'locationDetail' ? (
                              <select
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                  background: '#fff',
                                  color: redKeys.includes(key) ? '#e74c3c' : undefined
                                }}
                                value={item[key as keyof ListProps] ?? ''}
                                onChange={e => setPreEditList(prev => prev.map((row, rowIdx) => (rowIdx !== idx ? row : { ...row, locationDetail: e.target.value })))}
                                disabled={!item.location}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              >
                                <option value="">{item.location ? '선택' : '지역 먼저 선택'}</option>
                                {(citydata.find(c => c.city === item.location)?.subarea || []).map((sub: string) => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            ) : key === 'address' ? (
                              <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                <input
                                  style={{
                                    width: inputWidths[key] || '100px',
                                    height: '30px',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    padding: '2px 4px',
                                    border: '1px solid #ddd',
                                    borderRadius: '3px',
                                  }}
                                  value={item[key as keyof ListProps] ?? ''}
                                  onChange={e => handlePreInputChange(idx, key as keyof ListProps, e.target.value)}
                                  data-row={idx}
                                  data-col={key}
                                  onKeyDown={e => handleInputKeyDown(e, idx, key)}
                                />
                                <button
                                  type="button"
                                  style={{
                                    height: '30px',
                                    padding: '0 10px',
                                    borderRadius: '3px',
                                    background: '#4a90e2',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={() => {
                                    const extractedAddress = extractAddressFromCustomInput(item.customInput || '');
                                    const extractedChurchName = extractAndFormatChurchName(item.customInput || '', item.title || '');
                                    
                                    if (extractedAddress) {
                                      handlePreInputChange(idx, 'address', extractedAddress);
                                    }
                                    
                                    if (extractedChurchName) {
                                      handlePreInputChange(idx, 'church', extractedChurchName);
                                    }
                                    
                                    if (!extractedAddress && !extractedChurchName) {
                                      alert('상세내용에서 주소나 교회명을 찾을 수 없습니다.');
                                    }
                                  }}
                                  title="상세내용에서 주소 가져오기"
                                >
                                  가져오기
                                </button>
                              </div>
                            ) : (
                              <input
                                style={{
                                  width: inputWidths[key] || '100px',
                                  height: '30px',
                                  fontSize: 14,
                                  textAlign: 'center',
                                  padding: '2px 4px',
                                 
                                  border: '1px solid #ddd',
                                  borderRadius: '3px',
                                }}
                                value={item[key as keyof ListProps] ?? ''}
                                onChange={e => handlePreInputChange(idx, key as keyof ListProps, e.target.value)}
                                data-row={idx}
                                data-col={key}
                                onKeyDown={e => handleInputKeyDown(e, idx, key)}
                              />
                            )}
                          </td>
                        ) : null
                      )
                    })}
                    {/* 상세내용 버튼 및 모달 */}
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '0 10px',
                        position: 'sticky',
                        right: 0,
                        zIndex: 2,
                        background: '#fff',
                        boxShadow: '-2px 0 6px -2px rgba(0,0,0,0.04)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        style={{
                          width: '50px',
                          height: '30px',
                          padding: '0',
                          borderRadius: '5px',
                          background: '#333',
                          color: '#fff',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        onClick={() => { setModalContent(item.customInput || ''); setModalOpen(true); }}
                      >
                        상세
                      </button>
                      <button
                        style={{
                          width: '50px',
                          height: '30px',
                          padding: '0',
                          borderRadius: '5px',
                          background: '#4a90e2',
                          color: '#fff',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        onClick={() => handleSaveToChoir(item)}
                      >
                        교회
                      </button>
                      <button
                        style={{
                          width: '50px',
                          height: '30px',
                          padding: '0',
                          borderRadius: '5px',
                          background: '#2ecc71',
                          color: '#fff',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        onClick={() => handleSaveToInstitute(item)}
                      >
                        기관
                      </button>
                      <button
                        style={{
                          width: '50px',
                          height: '30px',
                          padding: '0',
                          borderRadius: '5px',
                          background: '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        onClick={() => handleDeleteRow(item.id)}
                      >
                        삭제
                      </button>
                    </td>
                    {clickedRow === idx && (
                      <div
                        style={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          minWidth: '300px',
                          maxWidth: '600px',
                          background: '#fff',
                          color: '#222',
                          border: '1px solid #aaa',
                          borderRadius: '8px',
                          boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
                          padding: '24px',
                          zIndex: 9999,
                          whiteSpace: 'pre-line',
                          fontSize: '15px',
                          fontWeight: 400,
                          wordBreak: 'break-all',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {item.customInput ? (
                          <div style={{whiteSpace: 'pre-line', fontSize: '15px', color: '#222', wordBreak: 'break-all', lineHeight: '1.5'}}>
                            {item.customInput.replace(/<p>/gi, '\n').replace(/<[^>]+>/g, '').trim()}
                          </div>
                        ) : '상세내용이 없습니다.'}
                        <div style={{textAlign: 'right', marginTop: '18px'}}>
                          <button onClick={() => setClickedRow(null)} style={{padding: '6px 18px', borderRadius: '4px', background: '#eee', border: 'none', cursor: 'pointer', fontSize: '15px'}}>닫기</button>
                        </div>
                      </div>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={32} style={{textAlign: 'center'}}>등록된 글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DetailModal open={modalOpen} onClose={() => setModalOpen(false)} content={modalContent} />
      <div style={{height:'200px'}}></div>
    </div>
  );
}

