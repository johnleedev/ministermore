import React, { useCallback, useEffect, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { format, formatDate } from "date-fns";
import { DropdownBox } from '../../components/DropdownBox';
import { applydocSubSort, applyhowSubSort, careerSubSort, dawnPraySubMenu, hourSortOption, insuranceSubSort, minuteSortOption, 
        partDetailSubSort, 
        partSubSort, paySubSort, recruitNumSubSort, religiousbodySubSort, schoolSubSort, 
        severanceSubSort, 
        sortSortOption, sortSubSort, SubTitleControl, weekdaySubSort, 
        welfareSubSort, 
        workdaySubMenu, workDayWeekSortOption } from '../../screens/recruit/recruit_minister/RecruitMinisterPostData';
import { citydata } from '../../DefaultData';
import { DateBoxSingle } from '../../components/DateBoxSingle';
import { EditorTinymce } from '../../components/EditorTinymce';



export default function RegisterRecruit( props: any) {


  interface ListProps {
    id?: string,
    title : string,
    source : string,
    writer : string,
    date : string,
    link? : string,
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
    editingUser? : string,
    editingAt? : string,
  }

  const navigate = useNavigate();

  const currentdate = new Date();
  const today = formatDate(currentdate, 'yyyy-MM-dd');
  const [refresh, setRefresh] = useState<boolean>(false); 
  const [listSort, setListSort] = useState('크롤링');
  const [list, setList] = useState<ListProps[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listAllLength, setListAllLength] = useState<number>(0);

  // 작업내역 데이터 상태 추가
  const [workHistory, setWorkHistory] = useState<any[]>([]);

  // 검색 관련 상태 추가
  const [searchWord, setSearchWord] = useState('');
  const [searchResult, setSearchResult] = useState<ListProps[] | null>(null);

  // 게시글 가져오기
  const fetchPosts = async () => {
    if (searchResult) return; // 검색 중이면 전체 데이터 fetch X
    
    try {
      if (listSort === '크롤링') {
        const res = await axios.get(`${MainURL}/recruitwork/getrecruitpre/${currentPage}`)
        if (res.data.resultData && Array.isArray(res.data.resultData) && res.data.resultData.length > 0) {
          const copy = res.data.resultData;
          setList(copy);
          setListAllLength(res.data.totalCount);
        } else {
          setList([]);
          setListAllLength(0);
        }
      } else if (listSort === '저장') {
        const res = await axios.get(`${MainURL}/recruitwork/getrecruit/${currentPage}`)
        if (res.data.resultData && Array.isArray(res.data.resultData) && res.data.resultData.length > 0) {
          const copy = res.data.resultData;
          setList(copy);
          setListAllLength(res.data.totalCount);
        } else {
          setList([]);
          setListAllLength(0);
        }
      } else if (listSort === '작업내역') {
        const res = await axios.get(`${MainURL}/recruitwork/getrecruitcount`)
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const copy = [...res.data];
          setWorkHistory(copy);
        } else {
          setWorkHistory([]);
        }
      }
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      setList([]);
      setListAllLength(0);
      setWorkHistory([]);
    }
   };

  useEffect(() => {
    fetchPosts();
  }, [refresh, currentPage, listSort]); 
  


  // State 변수 추가
  const itemsPerPage = 10; // 한 페이지당 표시될 게시글 수
  const totalPages = Math.ceil((searchResult ? searchResult.length : listAllLength) / itemsPerPage);

  // 실제로 보여줄 데이터
  const displayList = searchResult || list;

  // 페이지 변경 함수
  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 페이지네이션 범위 계산
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 4;
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);
    if (currentPage - half < 1) {
      end = Math.min(totalPages, end + (half - currentPage + 1));
    }
    if (currentPage + half > totalPages) {
      start = Math.max(1, start - (currentPage + half - totalPages));
    }
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };
 
  const [postID, setPostID] = useState('');
  
  const userData = sessionStorage.getItem('user');

  const [source, setSource] = useState('');
  const [title, setTitle] = useState('');
  const [writer, setWriter] = useState('');
  const [date, setDate] = useState('');
  const [link, setLink] = useState('');

  const originDate = new Date();
  const todayDate = format(originDate, 'yyyy-MM-dd');

  const [church, setChurch] = useState('');
  const [religiousbody, setReligiousbody] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [mainpastor, setMainpastor] = useState('');
  const [homepage, setHomepage] = useState('');
  const [churchLogo, setChurchLogo] = useState<File | null>(null);
  
  const [sort, setSort] = useState('');
  const [part, setPart] = useState([{sort:"전임", content:""}]);
  const [partDetail, setPartDetail] = useState([{sort:"전임", content:""}]);
  const [school, setSchool] = useState([{sort:"전임", content:""}]);
  const [career, setCareer] = useState([{sort:"전임", content:""}]);
  const [recruitNum, setRecruitNum] = useState('');

  const [workday, setWorkday] = useState([{sort:"전임", content:""}]);
  const [workTimeSunDay, setWorkTimeSunDay] = useState([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
  const [workTimeWeek, setWorkTimeWeek] = useState([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
  const [dawnPray, setDawnPray] = useState([{sort:"전임", content:""}]);

  const [pay, setPay] = useState([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
  const [insurance, setInsurance] = useState([{sort:"전임", content:""}]);
  const [severance, setSeverance] = useState([{sort:"전임", content:""}]);
  const [welfare, setWelfare] = useState([{sort:"전임", content:""}]);

  const [applytime, setApplytime] = useState({startDay:"", endDay:"", daySort:""});
  const [applydoc, setApplydoc] = useState([{sort:"전임", content:""}]);
  const [applyhow, setApplyhow] = useState('');
  const [inquiry, setInquiry] = useState({inquiryName:"", email:"", phone:""});
  const [etcNotice, setEtcNotice] = useState('');
  
  const [isViewAddress, setIsViewAddress] = useState(false);
  const [workdayMenu, setWorkdayMenu] = useState(['','']);
  const [dawnPrayMenu, setDawnPrayMenu] = useState(['','']);
  const [payInputType, setPayInputType] = useState('select');

  const [customInput, setCustomInput] = useState('');
  
  // Add state for tracking fixed position
  const [isCustomInputFixed, setIsCustomInputFixed] = useState(false);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const customInputSection = document.getElementById('customInputSection');
      if (customInputSection) {
        const rect = customInputSection.getBoundingClientRect();
        const scrollY = window.scrollY;
        const elementTop = customInputSection.offsetTop;
        
        // 고정 조건: 요소가 화면 상단을 지날 때
        if (rect.top <= -200 && !isCustomInputFixed) {
          setIsCustomInputFixed(true);
        } 
        // 복원 조건: 스크롤이 요소의 원래 위치보다 위로 올라갔을 때
        else if (scrollY < 700 && isCustomInputFixed) {
          setIsCustomInputFixed(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCustomInputFixed]);

  // 주소 입력 함수
  const onCompletePost = (data:any) => {
    const copy = data.address;
    const sido = `${data.sido} ${data.sigungu}`
    setLocation(sido);
    setAddress(copy);
    setIsViewAddress(false);
  };

  // 이미지 첨부 함수 ----------------------------------------------
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  
  const resetForm = () => {
    setTitle('');
    setWriter('');
    setChurch('');
    setReligiousbody('');
    setLocation('');
    setLocationDetail('');
    setAddress('');
    setMainpastor('');
    setHomepage('');
    setSort('');
    setPart([{sort:"전임", content:""}]);
    setPartDetail([{sort:"전임", content:""}]);
    setSchool([{sort:"전임", content:""}]);
    setCareer([{sort:"전임", content:""}]);
    setRecruitNum('');
    setWorkday([{sort:"전임", content:""}]);
    setWorkTimeSunDay([{sort:"전임", startHour:"09", startMinute:"00", endHour:"16", endMinute:"00"}]);
    setWorkTimeWeek([{sort:"전임", startHour:"09", startMinute:"00", endHour:"17", endMinute:"00", day:"평일"}]);
    setDawnPray([{sort:"전임", content:""}]);
    setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
    setInsurance([{sort:"전임", content:""}]);
    setSeverance([{sort:"전임", content:""}]);
    setWelfare([{sort:"전임", content:""}]);
    setApplytime({startDay:"", endDay:"", daySort:""});
    setApplydoc([{sort:"전임", content:""}]);
    setApplyhow('');
    setInquiry({inquiryName:"", email:"", phone:""});
    setEtcNotice('');
    setCustomInput('');
    setChurchLogo(null);
  };

  const getParams = {
    postID,
    saveDate: todayDate,
    saveUser: userData,
    source,
    title,
    writer,
    date,
    link,
    church,
    religiousbody,
    location,
    locationDetail,
    address,
    mainpastor,
    homepage,
    school: JSON.stringify(school),
    career: JSON.stringify(career),
    sort,
    part: JSON.stringify(part),
    partDetail: JSON.stringify(partDetail),
    recruitNum,
    workday: JSON.stringify(workday),
    workTimeSunDay: JSON.stringify(workTimeSunDay),
    workTimeWeek: JSON.stringify(workTimeWeek),
    dawnPray: JSON.stringify(dawnPray),
    pay: JSON.stringify(pay),
    welfare: JSON.stringify(welfare),
    insurance: JSON.stringify(insurance),
    severance: JSON.stringify(severance),
    applydoc: JSON.stringify(applydoc),
    applyhow,
    applytime: JSON.stringify(applytime),
    etcNotice,
    inquiry: JSON.stringify(inquiry),
    churchLogo: churchLogo ? churchLogo.name : '',
    customInput : customInput,
  };

  // 글쓰기 등록 함수 ----------------------------------------------
  const registerPost = async () => {
    try {
      setImageLoading(true);
      const res = await axios.post(`${MainURL}/recruitwork/postsrecruit`, getParams);
      setImageLoading(false);
      if (res.data) {
        alert('등록이 완료되었습니다.');
        resetForm();
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      setImageLoading(false);
      if (error.response?.status === 400 && error.response?.data?.error === 'duplicate') {
        alert(error.response.data.message || '이미 동일한 제목, 날짜, 교회명의 글이 존재합니다.');
      } else {
        alert('등록에 실패했습니다. 다시 시도해 주세요.');
      }
      console.log('실패함', error);
    }
  };
  
  const revisePost = async () => {
    try {
      setImageLoading(true);
      const res = await axios.post(`${MainURL}/recruitwork/reviserecruit`, getParams);
      setImageLoading(false);
      if (res.data.success) {
        alert('수정이 완료되었습니다.');
        resetForm();
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      setImageLoading(false);
      if (error.response?.status === 400 && error.response?.data?.error === 'duplicate') {
        alert(error.response.data.message || '이미 동일한 제목과 날짜의 글이 존재합니다.');
      } else {
        alert('수정에 실패했습니다. 다시 시도해 주세요.');
      }
      console.log('실패함', error);
    }
  };
  
  
  
  // [추가] 작업중 상태 관리
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // [수정] userData가 JSON이 아닐 때도 안전하게 처리
  function getUserName(userData: string | null): string {
    if (!userData) return '';
    try {
      const parsed = JSON.parse(userData);
      return parsed.name || userData;
    } catch {
      return userData;
    }
  }

  // [추가] 서버에 작업중 상태 저장 함수
  const setRecruitEditing = async (postID: string, editingUser: string) => {
    try {
      await axios.post(`${MainURL}/recruitwork/setrecruitediting`, {
        postID,
        editingUser,
        editingAt: todayDate,
      });
    } catch (err) {
      console.error('작업중 상태 서버 저장 실패', err);
    }
  };

  // [추가] 작업중 상태 제거 함수
  const clearRecruitEditing = async (postID: string, skipRefresh: boolean = false) => {
    try {
      await axios.post(`${MainURL}/recruitwork/clearrecruitediting`, {
        postID,
      });
      // 리스트에서도 제거
      setList(prev => prev.map(row => 
        row.id === postID ? { ...row, editingUser: '' } : row
      ));
      if (!skipRefresh) {
        setRefresh(!refresh);
      }
    } catch (err) {
      console.error('작업중 상태 제거 실패', err);
      alert('작업중 상태 제거에 실패했습니다.');
    }
  };

  // 이메일 검색 함수
  const handleSearch = async () => {
    if (!searchWord.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    setCurrentPage(1);
    
    try {
      const res = await axios.post(`${MainURL}/recruitwork/searchrecruitemail`, {
        searchWord: searchWord.trim()
      });

      if (res.data.resultData) {
        setSearchResult(res.data.resultData);
        setListAllLength(res.data.totalCount);
      } else {
        setSearchResult([]);
        setListAllLength(0);
        alert('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('검색 오류:', error);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  // 검색 초기화 함수
  const handleClearSearch = () => {
    setSearchResult(null);
    setSearchWord('');
    setCurrentPage(1);
    setRefresh(!refresh);
  };

  // 현재 페이지의 모든 항목 작업중 일괄 해제 함수
  const handleClearAllEditing = async () => {
    if (!window.confirm('현재 페이지의 모든 항목에서 작업중 상태를 해제하시겠습니까?')) {
      return;
    }
    
    try {
      // 현재 페이지의 모든 항목에 대해 작업중 해제
      const itemsWithEditing = displayList.filter((item: any) => item.editingUser);
      
      if (itemsWithEditing.length === 0) {
        alert('해제할 작업중 항목이 없습니다.');
        return;
      }
      
      // 모든 항목에 대해 작업중 해제 (refresh는 마지막에 한 번만)
      await Promise.all(
        itemsWithEditing.map((item: any) => clearRecruitEditing(item.id, true))
      );
      
      // 검색 결과가 있으면 검색 결과도 업데이트
      if (searchResult) {
        setSearchResult(prev => prev ? prev.map((row: any) => 
          itemsWithEditing.some((item: any) => item.id === row.id) 
            ? { ...row, editingUser: '' } 
            : row
        ) : null);
      }
      
      // 마지막에 한 번만 refresh
      setRefresh(!refresh);
      
      alert(`${itemsWithEditing.length}개 항목의 작업중 상태가 해제되었습니다.`);
    } catch (err) {
      console.error('일괄 해제 오류:', err);
      alert('작업중 상태 일괄 해제에 실패했습니다.');
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
        inquiry: typeof item.inquiry === 'string' ? item.inquiry : JSON.stringify(item.inquiry || {}),
        customInput: item.customInput || ''
      });
      if (res.data.success) {
        alert('교회 테이블에 저장되었습니다.');
        setRefresh(!refresh);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('교회 저장 오류:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '서버 오류로 저장에 실패했습니다.';
      alert(errorMessage);
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
        inquiry: typeof item.inquiry === 'string' ? item.inquiry : JSON.stringify(item.inquiry || {}),
        customInput: item.customInput || ''
      });
      if (res.data.success) {
        alert('기관 테이블에 저장되었습니다.');
        setRefresh(!refresh);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('기관 저장 오류:', err);
      alert('서버 오류로 저장에 실패했습니다.');
    }
  };
  
  return (
    <div className="admin-register">

      <div className='AdminContent mobile-none' style={{height:'100px', flexDirection:'row', marginBottom:'50px'}}>
        <div className='amdin_Main_Btn' 
          style={{backgroundColor:listSort === '크롤링' ? '#333' : '', color:listSort === '크롤링' ? '#fff' : '#333'}}
          onClick={()=>{
            setListSort('크롤링');
            resetForm();
            handleClearSearch();
        }}>
          크롤링리스트
        </div>
        <div className='amdin_Main_Btn' 
        style={{backgroundColor:listSort === '저장' ? '#333' : '', color:listSort === '저장' ? '#fff' : '#333'}}
          onClick={()=>{
            setListSort('저장');
            resetForm();
            handleClearSearch();
        }}>
          저장된리스트
        </div>
        <div className='amdin_Main_Btn' 
        style={{backgroundColor:listSort === '작업내역' ? '#333' : '', color:listSort === '작업내역' ? '#fff' : '#333'}}
          onClick={()=>{
            setListSort('작업내역');
            resetForm();
            handleClearSearch();
        }}>
          작업내역
        </div>
      </div>
    
      <div className="inner">

        {
          listSort === '작업내역' 
          ?
          (
            // 사람별로 먼저 그룹화 후, 각 사람별로 월별 작업내역을 표로 보여줌
            <div style={{width: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', fontSize: '1.2rem', fontWeight: 400}}>
              <h2 style={{margin: '30px 0 20px 0', fontWeight: 700}}>월별 작업 내역</h2>
              {
                Object.entries(
                  workHistory.reduce((acc: any, cur: any) => {
                    if (!acc[cur.saveUser]) acc[cur.saveUser] = [];
                    acc[cur.saveUser].push(cur);
                    return acc;
                  }, {})
                ).map(([user, items]: any) => (
                  <div key={user} style={{width: '100%', maxWidth: '600px', marginBottom: '40px'}}>
                    <h3 style={{margin: '10px 0', fontWeight: 600}}>{user}</h3>
                    <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff'}}>
                      <thead>
                        <tr style={{background: '#f5f5f5'}}>
                          <th style={{padding: '8px', border: '1px solid #eee'}}>월</th>
                          <th style={{padding: '8px', border: '1px solid #eee'}}>건수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(
                          items.reduce((acc: any, cur: any) => {
                            const month = cur.month ? cur.month.replace('.', '-') : '';
                            if (month) {
                              acc[month] = (acc[month] || 0) + cur.count;
                            }
                            return acc;
                          }, {})
                        ).map(([month, count]: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{padding: '8px', border: '1px solid #eee'}}>{month}</td>
                            <td style={{padding: '8px', border: '1px solid #eee'}}>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              }
              {workHistory.length === 0 && <p>작업내역 데이터가 없습니다.</p>}
            </div>
          )
          :
          <>
            {/* 이메일 검색 영역 - 저장된 리스트에만 표시 */}
            {listSort === '저장' && (
              <div style={{marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                <input 
                  className="inputdefault" 
                  type="text" 
                  placeholder='이메일 주소로 검색'
                  value={searchWord} 
                  onChange={(e)=>{setSearchWord(e.target.value)}}
                  style={{flex: 1, outline:'none', paddingLeft:'10px', border: '1px solid #ccc', minHeight: '40px'}}
                  onKeyDown={(e)=>{if (e.key === 'Enter') {handleSearch();}}}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#4a90e2',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px',
                }}
                onClick={handleSearch}
                >
                  검색
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#999',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px',
                }}
                onClick={handleClearSearch}
                >
                  초기화
                </div>
              </div>
            )}
            {/* 작업중 일괄 해제 버튼 */}
            {listSort !== '작업내역' && (
              <div style={{marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
                onClick={handleClearAllEditing}
                >
                  작업중 일괄 해제
                </div>
              </div>
            )}

            <div className="recruitBox">
              { displayList.length > 0
                ?
                displayList.map((item:any, index:any)=>{
                  const isEditing = editingPostId === item.id;
                  
                  // 이메일 정보 추출
                  let emailInfo = '';
                  try {
                    const inquiryCopy = JSON.parse(item.inquiry);
                    emailInfo = inquiryCopy.email || '';
                  } catch (error) {
                    emailInfo = '';
                  }
                  
                  return (
                    <div className="recruit-input-row" key={index}>
                      <div className="recruit-input-title" style={{width:'18%'}}>{item.title}</div>
                      <div className="recruit-input-keySort" style={{width:'4%'}}>{item.id}.</div>
                      <div className="recruit-input-theme" style={{width:'9%'}}>{item.date}</div>
                      <div className="songs-input-theme" style={{width:'12%', fontSize:'12px', color: emailInfo ? '#333' : '#999'}}>
                        <p>{emailInfo || '이메일 없음'}</p>
                      </div>
                      <div className="songs-input-theme" style={{width:'8%'}}><p>{item.isSave === 'true' ? '저장됨' : ''}</p></div>
                      <div className="songs-input-theme" style={{width:'10%'}}><p>{item.saveDate}</p><p>{item.saveUser}</p></div>
                      {listSort === '크롤링' ? (
                        // 크롤링 탭: 작업중 표시와 버튼을 한 줄로 배치
                        <div style={{display: 'flex', gap: '5px', alignItems: 'center', width: '30%', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                          {/* 작업중 표시 */}
                          {(item.editingUser || (isEditing && editingUser)) && (
                            <div 
                              style={{
                                background: '#ffe082',
                                color: '#333',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.75em',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                flexShrink: 0,
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await clearRecruitEditing(item.id);
                              }}
                              title={`${isEditing ? editingUser : item.editingUser} 작업중 - 클릭하여 제거`}
                            >
                              {isEditing ? editingUser : item.editingUser} 작업중
                            </div>
                          )}
                          <div className="recruit-input-btn" 
                            style={{
                              minWidth: '70px',
                              width: '70px',
                              backgroundColor: item.title === title || isEditing ?  '#4a90e2' : '',
                              color: item.title === title || isEditing ? '#fff' : '',
                              flexShrink: 0
                            }}
                            onClick={async ()=>{
                              window.scrollTo(0, 700);
                              // 기존 모든 row의 editingUser를 ''로 초기화
                              setList(prev => prev.map((row, idx) => idx === index ? row : { ...row, editingUser: '' }));
                              // 선택한 row만 editingUser 설정
                              setEditingPostId(item.id);
                              const userName = getUserName(userData);
                              setEditingUser(userName);
                              // [추가] 서버에도 작업중 상태 저장
                              await setRecruitEditing(item.id, userName);
                              // 나머지 폼 세팅
                              setPostID(item.id);
                              setSource(item.source || '');
                              setTitle(item.title || '');
                              setWriter(item.writer || '');
                              setDate(item.date || '');
                              setLink(item.link || '');
                              setChurch(item.church || '');
                              setReligiousbody(item.religiousbody || '');
                              setLocation(item.location || '');
                              setLocationDetail(item.locationDetail || '');
                              setAddress(item.address || '');
                              setMainpastor(item.mainPastor || '');
                              setHomepage(item.homepage || '');
                              setRecruitNum(item.recruitNum || '');
                              setSort(item.sort || '');
                              setSchool(item.school ? JSON.parse(item.school) : [{sort: '전임', content: ''}]);
                              setCareer(item.career ? JSON.parse(item.career) : [{sort: '전임', content: ''}]);
                              setPart(item.part ? JSON.parse(item.part) : [{sort: '전임', content: ''}]);
                              setPartDetail(item.partDetail ? JSON.parse(item.partDetail) : [{sort: '전임', content: ''}]);
                              setWorkday(item.workday ? JSON.parse(item.workday) : [{sort: '전임', content: ''}]);
                              setWorkTimeSunDay(item.workTimeSunDay ? JSON.parse(item.workTimeSunDay) : [{sort: '전임', startHour: '09', startMinute: '00', endHour: '16', endMinute: '00'}]);
                              setWorkTimeWeek(item.workTimeWeek ? JSON.parse(item.workTimeWeek) : [{sort: '전임', startHour: '09', startMinute: '00', endHour: '17', endMinute: '00', day: '평일'}]);
                              setDawnPray(item.dawnPray ? JSON.parse(item.dawnPray) : [{sort: '전임', content: ''}]);
                              setPay(item.pay ? JSON.parse(item.pay) : [{sort: '전임', paySort: 'select', selectCost: '', inputCost: ''}]);
                              setWelfare(item.welfare ? JSON.parse(item.welfare) : [{sort: '전임', content: ''}]);
                              setInsurance(item.insurance ? JSON.parse(item.insurance) : [{sort: '전임', content: ''}]);
                              setSeverance(item.severance ? JSON.parse(item.severance) : [{sort: '전임', content: ''}]);
                              setApplydoc(item.applydoc ? JSON.parse(item.applydoc) : [{sort: '전임', content: ''}]);
                              setApplyhow(item.applyhow || '');
                              setApplytime(item.applytime ? JSON.parse(item.applytime) : {startDay: '', endDay: '', daySort: ''});
                              setEtcNotice(item.etcNotice || '');
                              setInquiry(item.inquiry ? (typeof item.inquiry === 'string' ? JSON.parse(item.inquiry) : item.inquiry) : '');
                              setCustomInput(item.customInput || '');
                            }}
                          >
                            <p>추가</p>
                          </div>
                          <div className="recruit-input-btn" 
                            style={{
                              minWidth: '70px',
                              width: '70px',
                              backgroundColor: '#4a90e2',
                              color: '#fff',
                              flexShrink: 0
                            }}
                            onClick={async ()=>{
                              await handleSaveToChoir(item);
                            }}
                          >
                            <p>교회</p>
                          </div>
                          <div className="recruit-input-btn" 
                            style={{
                              minWidth: '70px',
                              width: '70px',
                              backgroundColor: '#2ecc71',
                              color: '#fff',
                              flexShrink: 0
                            }}
                            onClick={async ()=>{
                              await handleSaveToInstitute(item);
                            }}
                          >
                            <p>기관</p>
                          </div>
                          <div className="recruit-input-btn" 
                            style={{
                              minWidth: '70px',
                              width: '70px',
                              backgroundColor: '#e74c3c',
                              color: '#fff',
                              flexShrink: 0
                            }}
                            onClick={async ()=>{
                              if (window.confirm('정말 삭제하시겠습니까?')) {
                                try {
                                  const res = await axios.post(`${MainURL}/recruitwork/deleterecruitpre`, {
                                    id: item.id
                                  });
                                  if (res.data.success) {
                                    alert('삭제되었습니다.');
                                    setRefresh(!refresh);
                                  } else {
                                    alert('삭제에 실패했습니다.');
                                  }
                                } catch (error) {
                                  console.error('삭제 오류:', error);
                                  alert('삭제 중 오류가 발생했습니다.');
                                }
                              }
                            }}
                          >
                            <p>삭제</p>
                          </div>
                        </div>
                      ) : (
                        // 저장 탭: 기존 레이아웃 유지
                        <div style={{display: 'flex', gap: '5px', width: '10%'}}>
                          <div className="recruit-input-btn" 
                            style={{
                              flex: 1,
                              backgroundColor: item.title === title || isEditing ?  '#4a90e2' : '',
                              color: item.title === title || isEditing ? '#fff' : '',
                              position: 'relative',
                            }}
                            onClick={async ()=>{
                              window.scrollTo(0, 700);
                              // 기존 모든 row의 editingUser를 ''로 초기화
                              setList(prev => prev.map((row, idx) => idx === index ? row : { ...row, editingUser: '' }));
                              // 선택한 row만 editingUser 설정
                              setEditingPostId(item.id);
                              const userName = getUserName(userData);
                              setEditingUser(userName);
                              // [추가] 서버에도 작업중 상태 저장
                              await setRecruitEditing(item.id, userName);
                              // 나머지 폼 세팅
                              setPostID(item.id);
                              setSource(item.source || '');
                              setTitle(item.title || '');
                              setWriter(item.writer || '');
                              setDate(item.date || '');
                              setLink(item.link || '');
                              setChurch(item.church || '');
                              setReligiousbody(item.religiousbody || '');
                              setLocation(item.location || '');
                              setLocationDetail(item.locationDetail || '');
                              setAddress(item.address || '');
                              setMainpastor(item.mainPastor || '');
                              setHomepage(item.homepage || '');
                              setRecruitNum(item.recruitNum || '');
                              setSort(item.sort || '');
                              setSchool(item.school ? JSON.parse(item.school) : [{sort: '전임', content: ''}]);
                              setCareer(item.career ? JSON.parse(item.career) : [{sort: '전임', content: ''}]);
                              setPart(item.part ? JSON.parse(item.part) : [{sort: '전임', content: ''}]);
                              setPartDetail(item.partDetail ? JSON.parse(item.partDetail) : [{sort: '전임', content: ''}]);
                              setWorkday(item.workday ? JSON.parse(item.workday) : [{sort: '전임', content: ''}]);
                              setWorkTimeSunDay(item.workTimeSunDay ? JSON.parse(item.workTimeSunDay) : [{sort: '전임', startHour: '09', startMinute: '00', endHour: '16', endMinute: '00'}]);
                              setWorkTimeWeek(item.workTimeWeek ? JSON.parse(item.workTimeWeek) : [{sort: '전임', startHour: '09', startMinute: '00', endHour: '17', endMinute: '00', day: '평일'}]);
                              setDawnPray(item.dawnPray ? JSON.parse(item.dawnPray) : [{sort: '전임', content: ''}]);
                              setPay(item.pay ? JSON.parse(item.pay) : [{sort: '전임', paySort: 'select', selectCost: '', inputCost: ''}]);
                              setWelfare(item.welfare ? JSON.parse(item.welfare) : [{sort: '전임', content: ''}]);
                              setInsurance(item.insurance ? JSON.parse(item.insurance) : [{sort: '전임', content: ''}]);
                              setSeverance(item.severance ? JSON.parse(item.severance) : [{sort: '전임', content: ''}]);
                              setApplydoc(item.applydoc ? JSON.parse(item.applydoc) : [{sort: '전임', content: ''}]);
                              setApplyhow(item.applyhow || '');
                              setApplytime(item.applytime ? JSON.parse(item.applytime) : {startDay: '', endDay: '', daySort: ''});
                              setEtcNotice(item.etcNotice || '');
                              setInquiry(item.inquiry ? (typeof item.inquiry === 'string' ? JSON.parse(item.inquiry) : item.inquiry) : '');
                              setCustomInput(item.customInput || '');
                            }}
                          >
                            <p>수정</p>
                            {/* [수정] editingUser가 있으면 항상 표시 */}
                            {(item.editingUser && !isEditing) && (
                              <span style={{
                                position: 'absolute',
                                right: '-120px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#ffe082',
                                color: '#333',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.95em',
                                fontWeight: 500,
                                marginLeft: '10px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                              }}>
                                {item.editingUser} 작업중
                              </span>
                            )}
                            {/* 내가 작업중이면 기존대로 editingUser 사용 */}
                            {isEditing && editingUser && (
                              <span style={{
                                position: 'absolute',
                                right: '-120px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#ffe082',
                                color: '#333',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.95em',
                                fontWeight: 500,
                                marginLeft: '10px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                              }}>
                                {editingUser} 작업중
                              </span>
                            )}
                          </div>
                          {listSort === '저장' && (
                            // 저장된 리스트 - johnleedev만 삭제 가능
                            getUserName(userData) === 'johnleedev' && (
                              <div className="recruit-input-btn" 
                                style={{
                                  flex: 1,
                                  backgroundColor: '#e74c3c',
                                  color: '#fff',
                                }}
                                onClick={async ()=>{
                                  if (window.confirm('정말 삭제하시겠습니까?')) {
                                    try {
                                      const res = await axios.post(`${MainURL}/recruitwork/deleterecruit`, {
                                        id: item.id,
                                        saveUser: getUserName(userData)
                                      });
                                    if (res.data.success) {
                                      alert('삭제되었습니다.');
                                      // 검색 중이면 검색 결과에서도 삭제
                                      if (searchResult) {
                                        const updatedResult = searchResult.filter((r: any) => r.id !== item.id);
                                        setSearchResult(updatedResult.length > 0 ? updatedResult : null);
                                        setListAllLength(updatedResult.length);
                                      }
                                      setRefresh(!refresh);
                                    } else {
                                      alert('삭제에 실패했습니다.');
                                    }
                                  } catch (error: any) {
                                    console.error('삭제 오류:', error);
                                    if (error.response?.status === 403) {
                                      alert('삭제 권한이 없습니다.');
                                    } else {
                                      alert('삭제 중 오류가 발생했습니다.');
                                    }
                                  }
                                  }
                                }}
                              >
                                <p>삭제</p>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
                :
                <p>등록된 글이 없습니다.</p>
              }
            </div>  
            
            <div className='btn-row'>
              <div onClick={() => changePage(1)} className='btn'>
                <p>{"<<"}</p>
              </div>
              <div onClick={() => changePage(currentPage - 1)} className='btn'>
                <p>{"<"}</p>
              </div>
              {getPageNumbers().map((page) => (
                <div key={page} onClick={() => changePage(page)} 
                className={currentPage === page ? 'current btn' : 'btn'}
                >
                  <p>{page}</p>
                </div>
              ))}
              <div onClick={() => changePage(currentPage + 1)} className='btn'>
                <p>{">"}</p>
              </div>
              <div onClick={() => changePage(totalPages)} className='btn'>
                <p>{">>"}</p>
              </div>
            </div>

            <div style={{height:'100px'}}></div>

            <div className="buttonbox" style={{marginBottom:'50px'}}>
              <div className="button reset" onClick={()=>{
                  resetForm();
                }}>
                <p>초기화</p>
              </div>
              <div className="button reset" 
                style={{backgroundColor: link ? '#333' : '#ccc', color: link ? '#fff' : '#8B8B8B'}}
                onClick={()=>{
                  if (link) window.open(link, '_blank');
                }}>
                <p>링크 바로가기</p>
              </div>
              <div className="button reset" 
                style={{
                  backgroundColor: postID && (listSort === '크롤링' || getUserName(userData) === 'johnleedev') ? '#e74c3c' : '#ccc', 
                  color: postID && (listSort === '크롤링' || getUserName(userData) === 'johnleedev') ? '#fff' : '#8B8B8B'
                }}
                onClick={async ()=>{
                  if (!postID) {
                    alert('삭제할 항목을 선택해주세요.');
                    return;
                  }
                  if (listSort === '저장' && getUserName(userData) !== 'johnleedev') {
                    alert('삭제 권한이 없습니다.');
                    return;
                  }
                  if (window.confirm('정말 삭제하시겠습니까?')) {
                    try {
                      const endpoint = listSort === '크롤링' ? 'deleterecruitpre' : 'deleterecruit';
                      const params = listSort === '크롤링' 
                        ? { id: postID }
                        : { id: postID, saveUser: getUserName(userData) };
                      
                      const res = await axios.post(`${MainURL}/recruitwork/${endpoint}`, params);
                      
                      if (res.data.success) {
                        alert('삭제되었습니다.');
                        // 검색 중이면 검색 결과에서도 삭제
                        if (searchResult) {
                          const updatedResult = searchResult.filter((r: any) => r.id !== postID);
                          setSearchResult(updatedResult.length > 0 ? updatedResult : null);
                          setListAllLength(updatedResult.length);
                        }
                        resetForm();
                        setRefresh(!refresh);
                      } else {
                        alert('삭제에 실패했습니다.');
                      }
                    } catch (error: any) {
                      console.error('삭제 오류:', error);
                      if (error.response?.status === 403) {
                        alert('삭제 권한이 없습니다.');
                      } else {
                        alert('삭제 중 오류가 발생했습니다.');
                      }
                    }
                  }
                }}>
                <p>삭제</p>
              </div>
            </div>

            <div 
              id="customInputSection"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                marginBottom: '30px', 
                gap: '20px',
                position: isCustomInputFixed ? 'fixed' : 'static',
                top: isCustomInputFixed ? '0' : 'auto',
                left: isCustomInputFixed ? '0' : 'auto',
                right: isCustomInputFixed ? '0' : 'auto',
                zIndex: isCustomInputFixed ? '1000' : 'auto',
                backgroundColor: isCustomInputFixed ? '#fff' : 'transparent',
                padding: isCustomInputFixed ? '10px 20px' : '0',
                borderBottom: isCustomInputFixed ? '1px solid #eee' : 'none',
                boxShadow: isCustomInputFixed ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                width: isCustomInputFixed ? '100%' : 'auto',
                maxWidth: '1400px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa',
                  fontSize: '15px',
                  color: '#222',
                }}
                dangerouslySetInnerHTML={{ __html: customInput }}
              />
            </div>
          </>
        }

        
   
        {
          listSort !== '작업내역' && 
          <div className="recruit">

            <div className="inner">

              <div className="subpage__main">
                
                <section style={{marginBottom:'50px'}}>
                  <div className="main_title_row">
                    <h3 className='main_title'>
                      어떤 사역자를 채용하시나요?
                    </h3>
                  </div>
                </section>

                {/* 기본정보 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>기본정보</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>제목</p></h3>
                      <div className="inputRow">
                        <input value={title} className="inputdefault" type="text" 
                          onChange={(e) => {setTitle(e.target.value)}}/>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>글쓰는이</p></h3>
                      <div className="inputRow">
                        <input value={writer} className="inputdefault" type="text" 
                          onChange={(e) => {setWriter(e.target.value)}}/>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>날짜</p></h3>
                      <div className="inputRow">
                        <input value={date} className="inputdefault" type="text" 
                          onChange={(e) => {
                            
                          }}/>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 교회정보 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>교회정보</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>교회명</p></h3>
                      <div className="inputRow">
                        <input value={church} className="inputdefault" type="text" 
                          onChange={(e) => {setChurch(e.target.value)}}/>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>교단</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {
                            religiousbodySubSort.map((item:any, index:any)=>{
                              return (
                                <div key={index} className='checkTextBox'
                                  onClick={()=>{
                                    if (religiousbody === item) {
                                      setReligiousbody('');
                                    } else {
                                      setReligiousbody(item);
                                    }
                                  }}
                                >
                                  <input className="checkbox" type="checkbox"
                                    checked={religiousbody === item}
                                    onChange={()=>{setReligiousbody(item);}}
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <img src={`${MainURL}/images/recruit/religiousbody/${item}.jpg`}/>
                                    <p className={religiousbody === item ? 'selected' : ''}>{item}</p>
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>위치</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {
                            citydata.map((c:any) => c.city).map((item:any, index:any)=>{
                              return (
                                <div key={index} className='checkTextBox'
                                  onClick={()=>{
                                    if (location === item) {
                                      setLocation('');
                                      setLocationDetail('');
                                    } else {
                                      setLocation(item);
                                      setLocationDetail('');
                                    }
                                  }}
                                >
                                  <input className="checkbox" type="checkbox"
                                    checked={location  === item}
                                    onChange={()=>{setLocation(item); setLocationDetail('');}}
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={location === item ? 'selectedLocation' : ''}>{item}</p>
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>상세위치</p></h3>
                      <div className="inputRow">
                        {
                          !location ? (
                            <p style={{fontSize:'14px', color:'#999'}}>위치를 선택해주세요</p>
                          ) : (
                            <div className='checkTextRow'>
                              {
                                (citydata.find((c:any) => c.city === location)?.subarea || []).map((sub:string, idx:number) => (
                                  <div key={idx} className='checkTextBox'
                                    onClick={() => {
                                      if (locationDetail === sub) {
                                        setLocationDetail('');
                                      } else {
                                        setLocationDetail(sub);
                                      }
                                    }}
                                  >
                                    <input className="checkbox" type="checkbox"
                                      checked={locationDetail === sub}
                                      onChange={() => { setLocationDetail(sub); }}
                                    />
                                    <span className="checkmark" />
                                    <div className='imgtextBox'>
                                      <p className={locationDetail === sub ? 'selectedSubarea' : ''}>{sub}</p>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          )
                        }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>주소</p></h3>
                      <div className="inputRow">
                        {
                          (isViewAddress && address === '')
                          ?
                          <div style={{width:'85%'}}>
                            <DaumPostcodeEmbed
                                key="daum-postcode"
                                style={{
                                  width:'100%',
                                  height:'400px',
                                  padding:'10px',
                                  boxSizing:'border-box',
                                  border:'1px solid #E9E9E9'
                                }}
                                onComplete={onCompletePost} {...props} 
                              >
                            </DaumPostcodeEmbed>
                          </div>
                          :
                          <input value={address} className="inputdefault" type="text" 
                            key="input-address"
                            onChange={(e) => {setAddress(e.target.value)}}
                            onClick={()=>{
                              setIsViewAddress(true);
                            }}
                          />
                        }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>담임목사</p></h3>
                      <div className="inputRow">
                        <input value={mainpastor} className="inputdefault" type="text" 
                          onChange={(e) => {setMainpastor(e.target.value)}}/>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>홈페이지</p></h3>
                      <div className="inputRow">
                        <input value={homepage} className="inputdefault" type="text" 
                          placeholder='홈페이지 주소를 입력해주세요'
                          onChange={(e) => {setHomepage(e.target.value)}}/>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 채용정보 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>채용정보</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>직무</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {
                            sortSubSort.map((item:any, index:any)=>{
                              return (
                                <div key={index} className='checkTextBox'
                                  onClick={()=>{
                                    if (sort === item) {
                                      setSort('');
                                      // 직무가 해제되면 모든 관련 배열을 초기화
                                      setPart([{sort:"전임", content:""}]);
                                      setPartDetail([{sort:"전임", content:""}]);
                                      setSchool([{sort:"전임", content:""}]);
                                      setCareer([{sort:"전임", content:""}]);
                                      setWorkday([{sort:"전임", content:""}]);
                                      setWorkTimeSunDay([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:""}]);
                                      setWorkTimeWeek([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}]);
                                      setDawnPray([{sort:"전임", content:""}]);
                                      setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}]);
                                      setInsurance([{sort:"전임", content:""}]);
                                      setSeverance([{sort:"전임", content:""}]);
                                      setWelfare([{sort:"전임", content:""}]);
                                      setApplydoc([{sort:"전임", content:""}]);
                                    } else {
                                      setSort(item);
                                    // 선택된 직무에 따라 배열 생성
                                      if (item === '전임' || item === '준전임' || item === '파트' || item === '전임or준전임' || item === '전임or파트' || item === '준전임or파트' || item === '담임') {
                                        setPart([{sort:item, content:""}]);
                                        setPartDetail([{sort:item, content:""}]);
                                        setSchool([{sort:item, content:""}]);
                                        setCareer([{sort:item, content:""}]);
                                        setWorkday([{sort:item, content:""}]);
                                        setWorkTimeSunDay([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:""}]);
                                        setWorkTimeWeek([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}]);
                                        setDawnPray([{sort:item, content:""}]);
                                        setPay([{sort:item, paySort:"월", selectCost:"", inputCost:""}]);
                                        setInsurance([{sort:item, content:""}]);
                                        setSeverance([{sort:item, content:""}]);
                                        setWelfare([{sort:item, content:""}]);
                                        setApplydoc([{sort:item, content:""}]);
                                      } else if (item === '전임&준전임') {
                                        setPart([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setPartDetail([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setSchool([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setCareer([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setWorkday([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setWorkTimeSunDay([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:""}, {sort:"준전임", startHour:"", startMinute:"", endHour:"", endMinute:""}]);
                                        setWorkTimeWeek([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}, {sort:"준전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}]);
                                        setDawnPray([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"준전임", paySort:"월", selectCost:"", inputCost:""}]);
                                        setInsurance([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setSeverance([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setWelfare([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                        setApplydoc([{sort:"전임", content:""}, {sort:"준전임", content:""}]);
                                      } else if (item === '전임&파트') {
                                        setPart([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setPartDetail([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setSchool([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setCareer([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setWorkday([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setWorkTimeSunDay([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:""}, {sort:"파트", startHour:"", startMinute:"", endHour:"", endMinute:""}]);
                                        setWorkTimeWeek([{sort:"전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}, {sort:"파트", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}]);
                                        setDawnPray([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setPay([{sort:"전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"파트", paySort:"월", selectCost:"", inputCost:""}]);
                                        setInsurance([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setSeverance([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setWelfare([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                        setApplydoc([{sort:"전임", content:""}, {sort:"파트", content:""}]);
                                      } else if (item === '준전임&파트') {
                                        setPart([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setPartDetail([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setSchool([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setCareer([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setWorkday([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setWorkTimeSunDay([{sort:"준전임", startHour:"", startMinute:"", endHour:"", endMinute:""}, {sort:"파트", startHour:"", startMinute:"", endHour:"", endMinute:""}]);
                                        setWorkTimeWeek([{sort:"준전임", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}, {sort:"파트", startHour:"", startMinute:"", endHour:"", endMinute:"", day:"평일"}]);
                                        setDawnPray([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setPay([{sort:"준전임", paySort:"월", selectCost:"", inputCost:""}, {sort:"파트", paySort:"월", selectCost:"", inputCost:""}]);
                                        setInsurance([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setSeverance([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setWelfare([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                        setApplydoc([{sort:"준전임", content:""}, {sort:"파트", content:""}]);
                                      }
                                    }
                                  }}
                                >
                                  <input className="checkbox" type="checkbox"
                                    checked={sort === item}
                                    onChange={()=>{setSort(item);}}
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={sort === item ? 'selected' : ''}>{item}</p>
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>담당파트</p></h3>
                      <div className="inputRow">
                      {
                        part.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={part}
                                setData={setPart}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...part];
                                  copy[index].content = e.target.value;
                                  setPart(copy);
                                }}
                              />
                              <div className='subTextBox'>
                                {
                                  partSubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.content.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          const updated = [...part];
                                          const currentList = item.content ? item.content.split(', ') : [];

                                          if (isSelected) {
                                            updated[index].content = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].content = [...currentList, subItem].join(', ');
                                          }

                                          setPart(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>파트상세</p></h3>
                      <div className="inputRow">
                      {
                        partDetail.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={partDetail}
                                setData={setPartDetail}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...partDetail];
                                  copy[index].content = e.target.value;
                                  setPartDetail(copy);
                                }}
                              />
                              <div className='subTextBox'>
                                {
                                  partDetailSubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.content.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          const updated = [...partDetail];
                                          const currentList = item.content ? item.content.split(', ') : [];

                                          if (isSelected) {
                                            updated[index].content = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].content = [...currentList, subItem].join(', ');
                                          }

                                          setPartDetail(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>학력</p></h3>
                      <div className="inputRow">
                      {
                        school.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={school}
                                setData={setSchool}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...school];
                                  copy[index].content = e.target.value;
                                  setSchool(copy);
                                }}
                              />
                              <div className='subTextBox'>
                                {
                                  schoolSubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.content.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          const updated = [...school];
                                          const currentList = item.content ? item.content.split(', ') : [];

                                          if (isSelected) {
                                            updated[index].content = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].content = [...currentList, subItem].join(', ');
                                          }

                                          setSchool(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>경력</p></h3>
                      <div className="inputRow">
                      {
                        career.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={career}
                                setData={setCareer}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...career];
                                  copy[index].content = e.target.value;
                                  setCareer(copy);
                                }}
                              />
                              <div className='subTextBox'>
                                {
                                  careerSubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.content.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          const updated = [...career];
                                          const currentList = item.content ? item.content.split(', ') : [];

                                          if (isSelected) {
                                            updated[index].content = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].content = [...currentList, subItem].join(', ');
                                          }

                                          setCareer(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>채용인원</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {
                            recruitNumSubSort.map((item:any, index:any)=>{
                              return (
                                <div key={index} className='checkTextBox'
                                  onClick={()=>{
                                    if (recruitNum === item) {
                                      setRecruitNum('');
                                    } else {
                                      setRecruitNum(item);
                                    }
                                  }}
                                >
                                  <input className="checkbox" type="checkbox"
                                    checked={recruitNum === item}
                                    onChange={()=>{setRecruitNum(item);}}
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={recruitNum === item ? 'selected' : ''}>{item}</p>
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </section>


                {/* 복지정보 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>복지정보</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>사례</p></h3>
                      <div className="inputRow">
                      {
                        pay.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={pay}
                                setData={setPay}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", paySort: "연", selectCost: "", inputCost: "" }}
                              />
                              <div className='checkTextRow' style={{display:'flex'}}>
                                <div className='checkTextBox'>
                                  <input className="checkbox"
                                    type="checkbox"
                                    checked={payInputType === 'select'}
                                    readOnly
                                  />
                                  <span className="checkmark" 
                                  onClick={() => {
                                    setPayInputType('select');
                                    const copy = [...pay];
                                    copy[index].inputCost = '';
                                    setPay(copy);
                                  }}
                                  />
                                  <DropdownBox
                                    widthmain='20%'
                                    height='50px'
                                    selectedValue={item.paySort}
                                    options={[
                                      {value:'월', label:'월'},
                                      {value:'연', label:'연'},
                                    ]}
                                    handleChange={(e)=>{
                                      const copy = [...pay];
                                      copy[index].paySort = e.target.value; 
                                      setPay(copy);
                                    }}
                                  />
                                  <input
                                    value={item.selectCost}
                                    className="inputdefault"
                                    style={{width:'20%'}}
                                    type="text"
                                    onClick={()=>{
                                      setPayInputType('select');
                                    }}
                                    onChange={(e) => {
                                      const copy = [...pay];
                                      copy[index].selectCost = e.target.value; 
                                      setPay(copy);
                                    }}
                                  />
                                  <p style={{margin:'0 10px'}}>만원</p>
                                </div>
                              </div>
                              <div className='checkTextRow' style={{display:'flex'}}>
                                <div className='checkTextBox'>
                                  <input className="checkbox"
                                    type="checkbox"
                                    checked={payInputType === 'input'}
                                    readOnly
                                  />
                                  <span className="checkmark" 
                                    onClick={() => {
                                      setPayInputType('input');
                                      const copy = [...pay];
                                      copy[index].selectCost = '';
                                      setPay(copy);
                                    }}
                                  />
                                  <p style={{margin:'0 10px'}}>직접입력 :</p>
                                  <input
                                    value={item.inputCost}
                                    className="inputdefault"
                                    style={{width:'35%'}}
                                    type="text"
                                    onChange={(e) => {
                                      const copy = [...pay];
                                      copy[index].inputCost = e.target.value;
                                      setPay(copy);
                                    }}
                                  />
                                </div>
                              </div>
                              <div className='subTextBox'>
                                {
                                  paySubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.inputCost.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          setPayInputType('input');
                                          const updated = [...pay];
                                          const currentList = item.inputCost ? item.inputCost.split(', ') : [];
                                          updated[index].paySort = '';
                                          updated[index].selectCost = '';
                                          if (isSelected) {
                                            updated[index].inputCost = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].inputCost = [...currentList, subItem].join(', ');
                                          }
                                          setPay(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>복리후생</p></h3>
                      <div className="inputRow">
                      {
                        welfare.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={welfare}
                                setData={setWelfare}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...welfare];
                                  copy[index].content = e.target.value;
                                  setWelfare(copy);
                                }}
                              />
                              <div className='subTextBox'>
                                {
                                  welfareSubSort.map((subItem: string, subIndex: number) => {
                                    const isSelected = item.content.split(', ').includes(subItem);
                                    return (
                                      <p key={subIndex}
                                        className={`subText ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          const updated = [...welfare];
                                          const currentList = item.content ? item.content.split(', ') : [];

                                          if (isSelected) {
                                            updated[index].content = currentList
                                              .filter((i:any) => i !== subItem)
                                              .join(', ');
                                          } else {
                                            updated[index].content = [...currentList, subItem].join(', ');
                                          }

                                          setWelfare(updated);
                                        }}
                                      >
                                        {subItem}
                                      </p>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                  </div>
                </section>

                {/* 지원정보 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>지원정보</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <h3 className='title' style={{color:'#FF0000'}}><p>지원기간</p></h3>
                      <div className="inputRow" style={{display:'flex', alignItems:'center'}}>
                        <DateBoxSingle
                          date={applytime.startDay} 
                          setSelectDate={(e:any)=>{ 
                            const copy = {...applytime};
                            copy.startDay = e;
                            setApplytime(copy);
                          }} 
                        />
                        <p style={{margin:'0 10px'}}>부터</p>
                        {
                          applytime.daySort === "" 
                          &&
                          <>
                          <DateBoxSingle
                            date={applytime.endDay} 
                            setSelectDate={(e:any)=>{ 
                              const copy = {...applytime};
                              copy.endDay = e;
                              setApplytime(copy);
                            }} 
                          />
                          <p style={{margin:'0 10px'}}>까지</p>
                          </>
                        }
                        <div className='checkTextRow' style={{display:'flex', width:'20%', marginLeft:'20px'}}>
                          <div className='checkTextBox'>
                            <input className="checkbox"
                              type="checkbox"
                              checked={applytime.daySort === "채용시마감"}
                              readOnly
                            />
                            <span className="checkmark" 
                              onClick={() => {
                                const copy = {...applytime};
                                if (copy.daySort === '채용시마감') {
                                  copy.daySort = ''  
                                } else {
                                  copy.endDay = '';
                                  copy.daySort = '채용시마감'
                                }
                                setApplytime(copy);
                              }}
                            />
                            <p style={{margin:'0 5px'}}>채용시마감</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>지원서류</p></h3>
                      <div className="inputRow">
                      {
                        applydoc.map((item: any, index: number) => {
                          return (
                            <div key={index}>
                              <SubTitleControl
                                index={index}
                                data={applydoc}
                                setData={setApplydoc}
                                sortOptions={sortSortOption}
                                defaultValues={{ sort: "전임", content: "" }}
                              />
                              <input
                                value={item.content}
                                className="inputdefault"
                                type="text"
                                onChange={(e) => {
                                  const copy = [...applydoc];
                                  copy[index].content = e.target.value;
                                  setApplydoc(copy);
                                }}
                              />
                              <div className='checkTextRow' style={{ display: 'flex' }}>
                                {
                                  applydocSubSort.map((day: string, dayIndex: number) => {
                                    const selectedDays = item.content ? item.content.split(', ') : [];
                                    const isChecked = selectedDays.includes(day);

                                    return (
                                      <div
                                        key={dayIndex}
                                        className='checkTextBox'
                                        onClick={() => {
                                          const updated = [...applydoc];
                                          const list = item.content ? item.content.split(', ') : [];
                                          if (isChecked) {
                                            updated[index].content = list.filter((d:any) => d !== day).join(', ');
                                          } else {
                                            updated[index].content = [...list, day].join(', ');
                                          }
                                          setApplydoc(updated);
                                        }}
                                      >
                                        <input
                                          className="checkbox"
                                          type="checkbox"
                                          checked={isChecked}
                                          readOnly // 직접 상태를 관리하므로 readOnly로 설정
                                        />
                                        <span className="checkmark" />
                                        <div className='imgtextBox'>
                                          <p className={`${isChecked ? 'selected' : ''}`}>{day}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          );
                        })
                      }
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>지원방법</p></h3>
                      <div className="inputRow">
                        <div className='checkTextRow'>
                          {
                            applyhowSubSort.map((item:any, index:any)=>{
                              return (
                                <div key={index} className='checkTextBox'
                                  onClick={()=>{
                                    if (applyhow === item) {
                                      setApplyhow('');
                                    } else {
                                      setApplyhow(item);
                                    }
                                  }}
                                >
                                  <input className="checkbox" type="checkbox"
                                    checked={applyhow === item}
                                    onChange={()=>{setApplyhow(item);}}
                                  />
                                  <span className="checkmark" />
                                  <div className='imgtextBox'>
                                    <p className={applyhow === item ? 'selected' : ''}>{item}</p>
                                  </div>
                                </div>
                              )
                            })
                          }
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>담당자</p></h3>
                      <div className="inputRow">
                        <div className="subTitle second">
                          <p></p>
                          <div style={{width:'70px', marginRight:'10px'}}><p>이름</p></div>
                          <input value={inquiry.inquiryName} className="inputdefault" type="text" 
                            placeholder='' style={{width:'50%'}}
                            onChange={(e) => {setInquiry({...inquiry, inquiryName:e.target.value})}}/>
                        </div>
                        <div className="subTitle second">
                          <p></p>
                          <div style={{width:'70px', marginRight:'10px'}}><p>e-메일</p></div>
                          <input value={inquiry.email} className="inputdefault" type="text" 
                            placeholder='' style={{width:'50%'}}
                            onChange={(e) => {setInquiry({...inquiry, email:e.target.value})}}/>
                        </div>
                        <div className="subTitle second">
                          <p></p>
                          <div style={{width:'70px', marginRight:'10px'}}><p>연락처</p></div>
                          <input value={inquiry.phone} className="inputdefault" type="text" 
                            placeholder='' style={{width:'50%'}}
                            onChange={(e) => {setInquiry({...inquiry, phone:e.target.value})}}/>
                        </div>
                      </div>
                    </div>
                    <div className="inputBox">
                      <h3 className='title'><p>기타사항</p></h3>
                      <div className="inputRow">
                        <textarea
                          value={etcNotice}
                          className="inputdefault"
                          placeholder=''
                          onChange={(e) => {setEtcNotice(e.target.value)}}
                          style={{ height: '100px', resize: 'none', width: '100%', outline: 'none', padding: '10px' }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 직접 입력하기 -------------------------------------------------------------------------- */}
                <section>
                  <h1 className='section_title'>직접 입력하기</h1>
                  <div className='inputCover'>
                    <div className="inputBox">
                      <div className="inputRow" style={{width:'100%'}}>
                        <p style={{color:'#8B8B8B', fontSize:'12px', marginBottom:'10px'}}>* 최대 2000자 이하로 작성해주세요.</p>
                        <EditorTinymce
                          value={customInput}
                          onChange={setCustomInput}
                          widthProps="100%"
                          heightProps="1000px"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                
              </div>
            </div>

            
          </div>
        }

        <div className="buttonbox" style={{width:'100%', marginBottom:'100px'}}>
          <div className="button reset" onClick={()=>{navigate(-1)}}>
            <p>뒤로가기</p>
          </div>
          <div className="button reset" onClick={()=>{
              resetForm();
            }}>
            <p>초기화</p>
          </div>
          <div className="button reset" onClick={()=>{
              listSort === '크롤링' ? registerPost() : revisePost();
            }}>
            <p>{listSort === '크롤링' ? '저장' : '수정'}하기</p>
          </div>
        </div>
      

        

      </div>
      
      <div style={{height:'200px'}}></div>

    </div>
  );
}
