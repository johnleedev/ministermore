import { useEffect, useState } from 'react';
import './Mypage.scss';
import MypageMenu from './MypageMenu';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import ServiceAPIURL from '../../ServiceAPIURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import type { BookletItem, EventBookletItem, ServiceType } from './bulletinComponent/serviceManageTypes';

const SERVICE_META: Record<
  ServiceType,
  { title: string; createLabel: string; createPath: string; emptyText: string }
> = {
  'mobile-church-notice': {
    title: '모바일교회전단지 관리',
    createLabel: '모바일교회전단지 만들기',
    createPath: '/service/bookletnoticepay',
    emptyText: '신청한 모바일교회전단지가 없습니다.',
  },
  'mobile-event-notice': {
    title: '모바일행사전단지 관리',
    createLabel: '모바일행사전단지 만들기',
    createPath: '/service/bookleteventpay',
    emptyText: '신청한 모바일행사전단지가 없습니다.',
  },
};

export default function ServiceManage() {
  const navigate = useNavigate();
  const { serviceType: serviceTypeParam } = useParams<{ serviceType?: string }>();
  const [userData] = useRecoilState(recoilUserData);

  const [refresh, setRefresh] = useState<boolean>(false);
  const [bookletList, setBookletList] = useState<BookletItem[]>([]);
  const [eventBookletList, setEventBookletList] = useState<EventBookletItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedBookletId, setCopiedBookletId] = useState<number | null>(null);

  const activeServiceType: ServiceType =
    serviceTypeParam === 'mobile-event-notice' ? 'mobile-event-notice' : 'mobile-church-notice';
  const serviceMeta = SERVICE_META[activeServiceType];

  const fetchBookletList = async () => {
    const account = userData?.userAccount;
    if (!account) {
      setBookletList([]);
      setEventBookletList([]);
      return;
    }
    setLoading(true);
    try {
      const [churchRes, eventRes] = await Promise.all([
        axios.get(`${ServiceAPIURL}/bookletnoticemain/getUserBooklets/${account}`),
        axios.get(`${ServiceAPIURL}/bookleteventcreate/getUserBooklets/${account}`),
      ]);
      if (churchRes.data?.success && Array.isArray(churchRes.data.data)) {
        setBookletList(churchRes.data.data);
      } else {
        setBookletList([]);
      }
      if (eventRes.data?.success && Array.isArray(eventRes.data.data)) {
        setEventBookletList(eventRes.data.data);
      } else {
        setEventBookletList([]);
      }
    } catch (error) {
      setBookletList([]);
      setEventBookletList([]);
      console.error('모바일 서비스 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookletList();
  }, [refresh, userData?.userAccount]);

  const handleDeleteBooklet = async (bookletId: number) => {
    if (window.confirm('정말로 이 전단지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
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
          setRefresh(!refresh);
        } else {
          alert(res.data?.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제에 실패했습니다.');
        console.error('삭제 실패:', error);
      }
    }
  };

  const handleDeleteEventBooklet = async (eventMainId: number) => {
    if (window.confirm('정말로 이 행사 전단지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      try {
        const res = await axios.post(`${ServiceAPIURL}/bookleteventcreate/deleteBooklet`, {
          eventMainId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
          try {
            await axios.post(`${ServiceAPIURL}/serviceapply/updateStatus`, {
              serviceType: 'bookletEvent',
              eventMainId,
              status: '삭제됨',
            });
          } catch (e) {
            console.error('serviceapply updateStatus (event delete):', e);
          }
          alert('행사 전단지가 삭제되었습니다.');
          setRefresh(!refresh);
        } else {
          alert(res.data?.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제에 실패했습니다.');
        console.error('행사 전단지 삭제 실패:', error);
      }
    }
  };

  const handleViewBooklet = (bookletId: number) => {
    window.open(`/booklet?id=${bookletId}`, '_blank', 'noopener,noreferrer');
  };

  const handleViewEventBooklet = (eventMainId: number) => {
    window.open(`/event?id=${eventMainId}`, '_blank', 'noopener,noreferrer');
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

  const handleEditEventBooklet = async (eventMainId: number) => {
    try {
      await axios.post(`${ServiceAPIURL}/serviceapply/updateStatus`, {
        serviceType: 'bookletEvent',
        eventMainId,
        status: '수정됨',
      });
    } catch (e) {
      console.error('serviceapply updateStatus (event edit):', e);
    }
    navigate(`/service/bookleteventcreate?id=${eventMainId}`);
    window.scrollTo(0, 0);
  };

  const handleCreateBooklet = () => {
    navigate(serviceMeta.createPath);
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

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div className="subpage__main__title">{serviceMeta.title}</div>
            <button
              type="button"
              onClick={handleCreateBooklet}
              style={{
                padding: '12px 24px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {serviceMeta.createLabel}
            </button>
          </div>

          <div className="subpage__main__content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                {(activeServiceType === 'mobile-church-notice' && bookletList.length > 0) ||
                (activeServiceType === 'mobile-event-notice' && eventBookletList.length > 0) ? (
                  <div className="postingList">
                    {activeServiceType === 'mobile-church-notice' &&
                      bookletList.map((item) => (
                        <div key={`church-${item.id}`} className="postingItem">
                          <div className="postingHeader">
                            <div className="postingTitle">
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  marginBottom: '5px',
                                }}
                              >
                                <span className="categoryTag">교회 전단지</span>
                                <h3 style={{ margin: 0 }}>
                                  {item.churchName || item.title || '제목 없음'}
                                </h3>
                              </div>
                              {item.mainPastor && (
                                <span className="postingDate">담임: {item.mainPastor}</span>
                              )}
                            </div>
                            <div className="postingActions">
                              <button
                                className="actionBtn viewBtn"
                                onClick={() => handleViewBooklet(item.id)}
                              >
                                보기
                              </button>
                              <button
                                className="actionBtn editBtn"
                                onClick={() => handleEditBooklet(item.id)}
                              >
                                수정
                              </button>
                              <button
                                className="actionBtn deleteBtn"
                                onClick={() => handleDeleteBooklet(item.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <div className="postingInfo">
                            <div className="infoRow">
                              <span className="infoLabel">교회명:</span>
                              <span className="infoValue">{item.churchName || '-'}</span>
                            </div>
                            <div className="infoRow">
                              <span className="infoLabel">담임목사:</span>
                              <span className="infoValue">{item.mainPastor || '-'}</span>
                            </div>
                            <div
                              className="infoRow"
                              style={{ gridColumn: '1 / -1', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
                            >
                              <span className="infoLabel">링크:</span>
                              {item.link ? (
                                <>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="infoValue"
                                    style={{
                                      color: '#2563eb',
                                      textDecoration: 'underline',
                                      wordBreak: 'break-all',
                                      flex: '1 1 240px',
                                      minWidth: 0,
                                    }}
                                    title={item.link}
                                  >
                                    {item.link}
                                  </a>
                                  <button
                                    type="button"
                                    className={`actionBtn copyLinkBtn${
                                      copiedBookletId === item.id ? ' copyLinkBtn--copied' : ''
                                    }`}
                                    onClick={() => handleCopyLink(item.id, item.link as string)}
                                  >
                                    {copiedBookletId === item.id ? '복사됨' : '주소 복사'}
                                  </button>
                                </>
                              ) : (
                                <span className="infoValue">아직 생성되지 않았습니다.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {activeServiceType === 'mobile-event-notice' &&
                      eventBookletList.map((item) => (
                        <div key={`event-${item.id}`} className="postingItem">
                          <div className="postingHeader">
                            <div className="postingTitle">
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  marginBottom: '5px',
                                }}
                              >
                                <span className="categoryTag">행사 전단지</span>
                                <h3 style={{ margin: 0 }}>{item.eventName || '행사명 없음'}</h3>
                              </div>
                              {(item.date || item.place) && (
                                <span className="postingDate">
                                  {[item.date, item.place].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </div>
                            <div className="postingActions">
                              <button
                                className="actionBtn viewBtn"
                                onClick={() => handleViewEventBooklet(item.id)}
                              >
                                보기
                              </button>
                              <button
                                className="actionBtn editBtn"
                                onClick={() => handleEditEventBooklet(item.id)}
                              >
                                수정
                              </button>
                              <button
                                className="actionBtn deleteBtn"
                                onClick={() => handleDeleteEventBooklet(item.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <div className="postingInfo">
                            <div className="infoRow">
                              <span className="infoLabel">행사명:</span>
                              <span className="infoValue">{item.eventName || '-'}</span>
                            </div>
                            <div className="infoRow">
                              <span className="infoLabel">일시:</span>
                              <span className="infoValue">{item.date || '-'}</span>
                            </div>
                            <div className="infoRow">
                              <span className="infoLabel">장소:</span>
                              <span className="infoValue">{item.place || '-'}</span>
                            </div>
                            <div
                              className="infoRow"
                              style={{ gridColumn: '1 / -1', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
                            >
                              <span className="infoLabel">링크:</span>
                              {item.link ? (
                                <>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="infoValue"
                                    style={{
                                      color: '#2563eb',
                                      textDecoration: 'underline',
                                      wordBreak: 'break-all',
                                      flex: '1 1 240px',
                                      minWidth: 0,
                                    }}
                                    title={item.link}
                                  >
                                    {item.link}
                                  </a>
                                  <button
                                    type="button"
                                    className={`actionBtn copyLinkBtn${
                                      copiedBookletId === item.id ? ' copyLinkBtn--copied' : ''
                                    }`}
                                    onClick={() => handleCopyLink(item.id, item.link as string)}
                                  >
                                    {copiedBookletId === item.id ? '복사됨' : '주소 복사'}
                                  </button>
                                </>
                              ) : (
                                <span className="infoValue">아직 생성되지 않았습니다.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="noPosts">
                    <p>{serviceMeta.emptyText}</p>
                    <button
                      type="button"
                      onClick={handleCreateBooklet}
                      style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        background: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      {serviceMeta.createLabel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
