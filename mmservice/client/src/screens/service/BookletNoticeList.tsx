import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import ServiceAPIURL from '../../ServiceAPIURL';
import MainSiteURL from '../../MainSiteURL';
import Loading from '../../components/Loading';
import type { BookletItem } from './serviceManageTypes';
import './ServiceList.scss';

export default function BookletNoticeList() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);
  const [refresh, setRefresh] = useState(false);
  const [bookletList, setBookletList] = useState<BookletItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedBookletId, setCopiedBookletId] = useState<number | null>(null);

  const createUrl = `${MainSiteURL.replace(/\/$/, '')}/service/bookletnoticepay`;

  useEffect(() => {
    const account = userData?.userAccount;
    if (!account) {
      setBookletList([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    axios
      .get(`${ServiceAPIURL}/bookletnoticemain/getUserBooklets/${account}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && Array.isArray(res.data.data)) {
          setBookletList(res.data.data);
        } else {
          setBookletList([]);
        }
      })
      .catch((error) => {
        console.error('모바일교회전단지 목록 가져오기 실패:', error);
        if (!cancelled) setBookletList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh, userData?.userAccount]);

  const handleDeleteBooklet = async (bookletId: number) => {
    if (!window.confirm('정말로 이 전단지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      return;
    }
    try {
      const res = await axios.post(`${ServiceAPIURL}/bookletnoticecreate/deleteBooklet`, {
        churchMainId: bookletId,
        userAccount: userData?.userAccount,
      });
      if (res.data?.success) {
        try {
          await axios.post(`${ServiceAPIURL}/serviceapply/updateStatus`, {
            serviceType: 'bookletNotice',
            churchMainId: bookletId,
            status: '삭제됨',
          });
        } catch (e) {
          console.error('serviceapply updateStatus (notice delete):', e);
        }
        alert('전단지가 삭제되었습니다.');
        setRefresh((v) => !v);
      } else {
        alert(res.data?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제에 실패했습니다.');
      console.error('삭제 실패:', error);
    }
  };

  const handleViewBooklet = (bookletId: number) => {
    window.open(`/booklet?id=${bookletId}`, '_blank', 'noopener,noreferrer');
  };

  const handleEditBooklet = async (bookletId: number) => {
    try {
      await axios.post(`${ServiceAPIURL}/serviceapply/updateStatus`, {
        serviceType: 'bookletNotice',
        churchMainId: bookletId,
        status: '수정됨',
      });
    } catch (e) {
      console.error('serviceapply updateStatus (notice edit):', e);
    }
    navigate(`/service/bookletnoticecreate?id=${bookletId}&namesLocked=1`);
    window.scrollTo(0, 0);
  };

  const handleCopyLink = async (bookletId: number, link: string) => {
    if (!link) return;
    const showCopied = () => {
      setCopiedBookletId(bookletId);
      window.setTimeout(() => {
        setCopiedBookletId((prev) => (prev === bookletId ? null : prev));
      }, 1800);
    };
    try {
      await navigator.clipboard.writeText(link);
      showCopied();
    } catch {
      const tmp = document.createElement('textarea');
      tmp.value = link;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
        showCopied();
      } catch {
        alert('복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.');
      } finally {
        document.body.removeChild(tmp);
      }
    }
  };

  const openCreate = () => {
    window.open(createUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="service-admin__list-page">
      <div className="service-admin__list-header">
        <h1 className="service-admin__list-title">모바일교회전단지 관리</h1>
        <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
          모바일교회전단지 만들기
        </button>
      </div>

      {loading ? (
        <div className="service-admin__loading">
          <Loading />
        </div>
      ) : bookletList.length > 0 ? (
        <div className="service-admin__posting-list">
          {bookletList.map((item) => (
            <div key={item.id} className="service-admin__posting-item">
              <div className="service-admin__posting-header">
                <div className="service-admin__posting-title">
                  <span className="service-admin__category-tag">교회 전단지</span>
                  <h3 className="service-admin__posting-name">
                    {item.churchName || item.title || '제목 없음'}
                  </h3>
                  {item.mainPastor && (
                    <span className="service-admin__posting-sub">담임: {item.mainPastor}</span>
                  )}
                </div>
                <div className="service-admin__posting-actions">
                  <button
                    type="button"
                    className="service-admin__action-btn"
                    onClick={() => handleViewBooklet(item.id)}
                  >
                    보기
                  </button>
                  <button
                    type="button"
                    className="service-admin__action-btn"
                    onClick={() => handleEditBooklet(item.id)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="service-admin__action-btn"
                    onClick={() => handleDeleteBooklet(item.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="service-admin__posting-info">
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">교회명:</span>
                  <span className="service-admin__info-value">{item.churchName || '-'}</span>
                </div>
                <div className="service-admin__info-row">
                  <span className="service-admin__info-label">담임목사:</span>
                  <span className="service-admin__info-value">{item.mainPastor || '-'}</span>
                </div>
                <div className="service-admin__info-row" style={{ gridColumn: '1 / -1' }}>
                  <span className="service-admin__info-label">링크:</span>
                  {item.link ? (
                    <>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="service-admin__info-link"
                        title={item.link}
                      >
                        {item.link}
                      </a>
                      <button
                        type="button"
                        className={`service-admin__action-btn service-admin__action-btn--outline${
                          copiedBookletId === item.id ? ' service-admin__action-btn--copied' : ''
                        }`}
                        onClick={() => handleCopyLink(item.id, item.link as string)}
                      >
                        {copiedBookletId === item.id ? '복사됨' : '주소 복사'}
                      </button>
                    </>
                  ) : (
                    <span className="service-admin__info-value">아직 생성되지 않았습니다.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="service-admin__empty">
          <p>신청한 모바일교회전단지가 없습니다.</p>
          <button type="button" className="service-admin__list-create-btn" onClick={openCreate}>
            모바일교회전단지 만들기
          </button>
        </div>
      )}
    </div>
  );
}
