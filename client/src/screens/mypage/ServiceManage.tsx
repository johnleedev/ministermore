import { useEffect, useState } from 'react';
import './Mypage.scss';
import MypageMenu from './MypageMenu';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';

interface BookletItem {
  id: number;
  title: string;
  type: string;
  churchName: string;
  mainPastor: string;
  imageMainName: string;
}

interface EventBookletItem {
  id: number;
  eventName: string;
  date: string;
  place: string;
  address: string;
  superViser: string;
  imageMainName: string;
}

export default function ServiceManage() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);

  const [refresh, setRefresh] = useState<boolean>(false);
  const [bookletList, setBookletList] = useState<BookletItem[]>([]);
  const [eventBookletList, setEventBookletList] = useState<EventBookletItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
        axios.get(`${MainURL}/bookletnoticemain/getUserBooklets/${account}`),
        axios.get(`${MainURL}/bookleteventcreate/getUserBooklets/${account}`),
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
        const res = await axios.post(`${MainURL}/bookletnoticecreate/deleteBooklet`, {
          churchMainId: bookletId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
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
        const res = await axios.post(`${MainURL}/bookleteventcreate/deleteBooklet`, {
          eventMainId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
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
    window.open(`/eventbooklet?id=${eventMainId}`, '_blank', 'noopener,noreferrer');
  };

  const handleEditBooklet = (bookletId: number) => {
    navigate(`/service/bookletnoticecreate?id=${bookletId}`);
    window.scrollTo(0, 0);
  };

  const handleEditEventBooklet = (eventMainId: number) => {
    navigate(`/service/bookleteventcreate?id=${eventMainId}`);
    window.scrollTo(0, 0);
  };

  const handleCreateBooklet = () => {
    navigate('/service/bookletnoticetemplates');
    window.scrollTo(0, 0);
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
            <div className="subpage__main__title">모바일 서비스 관리</div>
            <button
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
              전단지 만들기
            </button>
          </div>

          <div className="subpage__main__content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                {bookletList.length > 0 || eventBookletList.length > 0 ? (
                  <div className="postingList">
                    {bookletList.map((item) => (
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
                        </div>
                      </div>
                    ))}
                    {eventBookletList.map((item) => (
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="noPosts">
                    <p>신청한 모바일 서비스가 없습니다.</p>
                    <button
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
                      전단지 만들기
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
