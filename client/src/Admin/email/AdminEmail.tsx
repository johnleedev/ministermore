import React, { useCallback, useEffect, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { format, formatDate } from "date-fns";

export default function AdminEmail() {

  const currentdate = new Date();
  const today = formatDate(currentdate, 'yyyy-MM-dd');
  const [refresh, setRefresh] = useState<boolean>(false); 
  const [listSort, setListSort] = useState('크롤링');
  const [list, setList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listAllLength, setListAllLength] = useState<number>(0);

  
  // 게시글 가져오기
  const fetchPosts = async () => {
    const res = await axios.get(`${MainURL}/recruitminister/work/getrecruitemail/${currentPage}`)
      if (res.data.resultData) {
        const copy = res.data.resultData;
        
        // 유효한 이메일이 있는 항목만 필터링
        const filteredList = copy.filter((item: any) => {
          try {
            const inquiryCopy = JSON.parse(item.inquiry);
            const email = inquiryCopy.email || '';
            const emailRule = /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
            return emailRule.test(email);
          } catch (error) {
            return false;
          }
        });
        
        setList(filteredList);
        console.log('전체:', copy.length, '유효 이메일:', filteredList.length);
        setListAllLength(filteredList.length);

      } else {
        setListAllLength(0);
      }
   };

  useEffect(() => {
    fetchPosts();
  }, [refresh, currentPage, listSort]); 
  
  
  // State 변수 추가
  const itemsPerPage = 100; // 한 페이지당 표시될 게시글 수
  const totalPages = Math.ceil(listAllLength / itemsPerPage);
  const [isSending, setIsSending] = useState(false);

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

  // 테스트 이메일 발송 함수 (1개만)
  const handleTestSendEmail = async () => {
    if (list.length === 0) {
      alert('발송할 이메일이 없습니다.');
      return;
    }

    if (!window.confirm(`첫 번째 이메일 1개만 테스트 발송하시겠습니까?`)) {
      return;
    }

    setIsSending(true);
    try {
      // 필요한 데이터만 추출하여 전송
      const simplifiedItem = {
        id: list[0].id,
        title: list[0].title,
        church: list[0].church,
        source: list[0].source,
        saveDate: list[0].saveDate,
        inquiry: list[0].inquiry
      };

      const res = await axios.post(`${MainURL}/recruitminister/work/sendbulkrecruitemail`, {
        emailList: [simplifiedItem]
      });
      
      if (res.data.success) {
        alert(res.data.message);
        setRefresh(!refresh); // 목록 새로고침
      } else {
        alert('테스트 이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('테스트 이메일 발송 오류:', error);
      alert('테스트 이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // 일괄 이메일 발송 함수
  const handleBulkSendEmail = async () => {
    if (list.length === 0) {
      alert('발송할 이메일이 없습니다.');
      return;
    }

    if (!window.confirm(`현재 페이지의 ${list.length}개 이메일을 발송하시겠습니까?\n발송에는 시간이 소요될 수 있습니다.`)) {
      return;
    }

    setIsSending(true);
    try {
      // 필요한 데이터만 추출하여 전송
      const simplifiedList = list.map(item => ({
        id: item.id,
        title: item.title,
        church: item.church,
        source: item.source,
        saveDate: item.saveDate,
        inquiry: item.inquiry
      }));

      console.log('발송할 데이터 개수:', simplifiedList.length);
      console.log('첫 번째 항목:', simplifiedList[0]);

      const res = await axios.post(`${MainURL}/recruitminister/work/sendbulkrecruitemail`, {
        emailList: simplifiedList
      }, {
        timeout: 600000 // 10분 타임아웃
      });
      
      if (res.data.success) {
        alert(res.data.message);
        setRefresh(!refresh); // 목록 새로고침
      } else {
        alert('일괄 이메일 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('일괄 이메일 발송 오류:', error);
      console.error('에러 상세:', error.response?.data);
      console.error('에러 메시지:', error.message);
      alert(`일괄 이메일 발송 중 오류가 발생했습니다.\n${error.response?.data?.message || error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-register">
      <div className="inner">
        <h2 style={{marginBottom: '20px', fontSize: '24px', fontWeight: 'bold'}}>이메일 발송 관리</h2>
        
        {/* 발송 버튼 */}
        <div style={{marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <button
              onClick={handleTestSendEmail}
              disabled={isSending || list.length === 0}
              style={{
                width: '180px',
                height: '50px',
                background: isSending ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isSending || list.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isSending ? '발송 중...' : '테스트 발송 (1개)'}
            </button>
            <button
              onClick={handleBulkSendEmail}
              disabled={isSending || list.length === 0}
              style={{
                width: '200px',
                height: '50px',
                background: isSending || list.length === 0 ? '#ccc' : '#4a90e2',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isSending || list.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {isSending ? '발송 중...' : `일괄 이메일 발송 (${list.length}개)`}
            </button>
            <p style={{fontSize: '14px', color: '#666'}}>
              * 유효한 이메일만 표시되며, 일괄 발송 시 모든 항목을 순차적으로 발송합니다.
            </p>
          </div>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#333'}}>
            현재 페이지: {currentPage} / {totalPages} | 유효 이메일: {list.length}개
          </div>
        </div>

        <div className="recruitBox">
          { list.length > 0
            ?
            list.map((item:any, index:any)=>{

              let email = '';
              try {
                const inquiryCopy = JSON.parse(item.inquiry);
                email = inquiryCopy.email || '';
              } catch (error) {
                email = '';
              }

              return (
                <div className="recruit-input-row" key={index}>
                  <div className="recruit-input-title" style={{width:'50%'}}>{item.title}</div>
                  <div className="recruit-input-keySort" style={{width:'15%'}}>{item.church}</div>
                  <div className="songs-input-theme" style={{width:'15%'}}><p>{item.saveDate}</p></div>
                  <div className="songs-input-theme" style={{width:'20%', color: email ? '#333' : '#999'}}>
                    <p>{email || '이메일 없음'}</p>
                  </div>
                </div>
              )
            })
            :
            <p>발송할 이메일이 없습니다.</p>
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

        <div style={{height:'200px'}}></div>
      </div>
    </div>
  );
}