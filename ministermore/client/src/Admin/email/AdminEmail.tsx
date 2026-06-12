import React, { useEffect, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';

const ITEMS_PER_PAGE = 100;
const EMAIL_RULE = /^(([^<>()\[\]\.,;:\s@"]+(\.[^<>()\[\]\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;

type EmailListItem = {
  id: number;
  post_id: number | null;
  title: string;
  church: string;
  source: string;
  saveDate: string;
  date: string;
  isSentEmail: string;
  email: string;
  inquiry: string;
};

export default function AdminEmail() {
  const [list, setList] = useState<EmailListItem[]>([]);
  const [allRows, setAllRows] = useState<EmailListItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listAllLength, setListAllLength] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);

    try {
      const res = await axios.get(`${MainURL}/recruitwork/getemailsall`);

      if (!res.data?.success || !Array.isArray(res.data.resultData)) {
        setAllRows([]);
        setList([]);
        setListAllLength(0);
        return;
      }

      const mappedRows: EmailListItem[] = res.data.resultData
        .filter((item: any) => EMAIL_RULE.test((item.email || '').trim()))
        .filter((item: any) => String(item.isSentEmail || '').trim() === 'true')
        .map((item: any) => ({
          id: item.id,
          post_id: item.post_id ?? null,
          title: item.church || '(교회명 없음)',
          church: item.church || '',
          source: 'emails',
          saveDate: item.date || '',
          date: item.date || '',
          isSentEmail: item.isSentEmail || '',
          email: (item.email || '').trim(),
          inquiry: JSON.stringify({
            inquiryName: '',
            email: (item.email || '').trim(),
            phone: '',
          }),
        }))
        .sort((a: EmailListItem, b: EmailListItem) => b.id - a.id);

      setAllRows(mappedRows);
      setListAllLength(mappedRows.length);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      setList(mappedRows.slice(offset, offset + ITEMS_PER_PAGE));
    } catch (error) {
      console.error('이메일 목록 조회 오류:', error);
      setAllRows([]);
      setList([]);
      setListAllLength(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(listAllLength / ITEMS_PER_PAGE));

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

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

  const buildMailItem = (row: EmailListItem) => ({
    id: row.id,
    post_id: row.post_id,
    title: row.church || row.title,
    church: row.church,
    source: row.source || '사역자모아',
    saveDate: row.date || row.saveDate,
    email: row.email,
    inquiry: row.inquiry,
    isSentEmail: row.isSentEmail,
  });

  const handleTestSendEmail = async () => {
    const confirmMessage = [
      '리뉴얼 안내 테스트 메일을 1건만 발송합니다.',
      '',
      '수신: johnlovesyou@naver.com',
      'DB는 변경되지 않습니다.',
    ].join('\n');

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSending(true);
    try {
      const res = await axios.post(`${MainURL}/recruitwork/sendtestrecruitemail`, {});

      if (res.data.success) {
        alert(res.data.message);
      } else {
        alert(res.data.message || '테스트 이메일 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('테스트 이메일 발송 오류:', error);
      alert(error?.response?.data?.message || '테스트 이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkSendEmail = async () => {
    if (list.length === 0) {
      alert('발송할 이메일이 없습니다.');
      return;
    }

    if (!window.confirm(`현재 페이지의 isSentEmail=true 대상 ${list.length}건에 리뉴얼 안내 메일을 발송하시겠습니까?\n발송에는 시간이 소요될 수 있습니다.`)) {
      return;
    }

    setIsSending(true);
    try {
      const simplifiedList = list.map((item) => buildMailItem(item));

      const res = await axios.post(`${MainURL}/recruitwork/sendbulkrecruitemail`, {
        emailList: simplifiedList,
      }, {
        timeout: 600000,
      });

      if (res.data.success) {
        alert(res.data.message);
        fetchPosts();
      } else {
        alert('일괄 이메일 발송에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('일괄 이메일 발송 오류:', error);
      alert(`일괄 이메일 발송 중 오류가 발생했습니다.\n${error.response?.data?.message || error.message || '알 수 없는 오류'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-register">
      <div className="inner">
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>이메일 발송 관리</h2>

        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleTestSendEmail}
              disabled={isSending}
              style={{
                width: '320px',
                height: '50px',
                background: isSending ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isSending ? 'not-allowed' : 'pointer',
              }}
            >
              {isSending ? '발송 중...' : '테스트 발송 (johnlovesyou@naver.com)'}
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
              {isSending ? '발송 중...' : `리뉴얼 안내 일괄 발송 (${list.length}개)`}
            </button>
            <p style={{ fontSize: '14px', color: '#666' }}>
              * 테스트는 johnlovesyou@naver.com 으로 리뉴얼 안내 1건만 발송합니다. DB는 변경되지 않습니다.
              <br />
              * 일괄 발송은 isSentEmail=true 인 항목만 대상이며, 발송 후 renewal_sent 로 표시됩니다.
            </p>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            현재 페이지: {currentPage} / {totalPages} | 발송 대상(isSentEmail=true): {listAllLength}개
            {isLoading ? ' (불러오는 중...)' : ''}
          </div>
        </div>

        <div className="recruitBox">
          {list.length > 0 ? (
            list.map((item) => (
              <div className="recruit-input-row" key={item.id}>
                <div className="recruit-input-keySort" style={{ width: '10%' }}><p>{item.post_id ?? '-'}</p></div>
                <div className="recruit-input-title" style={{ width: '30%' }}>{item.church}</div>
                <div className="recruit-input-keySort" style={{ width: '15%' }}>{item.date}</div>
                <div className="songs-input-theme" style={{ width: '15%' }}>
                  <p>{item.isSentEmail || '-'}</p>
                </div>
                <div className="songs-input-theme" style={{ width: '30%', color: '#333' }}>
                  <p>{item.email}</p>
                </div>
              </div>
            ))
          ) : (
            <p>{isLoading ? '이메일 목록을 불러오는 중입니다.' : 'isSentEmail=true 인 발송 대상이 없습니다.'}</p>
          )}
        </div>

        <div className="btn-row">
          <div onClick={() => changePage(1)} className="btn">
            <p>{'<<'}</p>
          </div>
          <div onClick={() => changePage(currentPage - 1)} className="btn">
            <p>{'<'}</p>
          </div>
          {getPageNumbers().map((page) => (
            <div
              key={page}
              onClick={() => changePage(page)}
              className={currentPage === page ? 'current btn' : 'btn'}
            >
              <p>{page}</p>
            </div>
          ))}
          <div onClick={() => changePage(currentPage + 1)} className="btn">
            <p>{'>'}</p>
          </div>
          <div onClick={() => changePage(totalPages)} className="btn">
            <p>{'>>'}</p>
          </div>
        </div>

        <div style={{ height: '200px' }}></div>
      </div>
    </div>
  );
}
