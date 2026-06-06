import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useRecoilState, useRecoilValue } from 'recoil';
import MainURL from '../../../MainURL';
import DateFormmating from '../../../components/DateFormmating';
import Pagination from '../../../components/Pagination';
import Loading from '../../../components/Loading';
import ScrollToTopButton from '../../../components/ScrollToTopButton';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';
import './Upgrade.scss';
import '../../ForListPage.scss';

interface UpgradePost {
  id: number;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
}


export default function UpgradeList() {
  const isLogin = useRecoilValue(recoilLoginState);
  const [userData, setUserData] = useRecoilState(recoilUserData);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState<UpgradePost[]>([]);
  const [listAllLength, setListAllLength] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(listAllLength / itemsPerPage);

  const fetchDatas = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${MainURL}/retreatupgrade/getposts/${currentPage}`);
      if (res.data) {
        setList(res.data.resultData || []);
        setListAllLength(res.data.totalCount || 0);
      }
    } catch (error) {
      console.error(error);
      setList([]);
      setListAllLength(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatas();
  }, [currentPage]);

  const renderPreview = (value: string) => {
    if (value?.length > 40) return `${value.substring(0, 40)}...`;
    return value;
  };

  const openWriteBox = async () => {
    if (!isLogin) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }

    try {
      const res = await axios.post(`${MainURL}/retreatupgrade/checkisposting`, {
        userAccount: userData.userAccount,
      });
      if (res.data) {
        setIsWriting(true);
      } else {
        alert('먼저 장소후기 게시글에 1개 이상의 댓글을 작성후에 등업신청을 하셔야, 등업이 완료됩니다.');
      }
    } catch (error) {
      console.error(error);
      alert('등업신청 가능 여부를 확인하지 못했습니다.');
    }
  };

  const registerPost = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const res = await axios.post(`${MainURL}/retreatupgrade/posts`, {
      title: title.trim(),
      content: content.trim(),
      userAccount: userData.userAccount,
      userNickName: userData.userNickName,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    });

    if (res.data) {
      setUserData({
        ...userData,
        grade: '정회원',
      });
      alert('등업신청이 완료되었습니다.');
      setTitle('');
      setContent('');
      setIsWriting(false);
      fetchDatas();
    }
  };

  const deletePost = async (item: UpgradePost) => {
    if (!window.confirm('등업신청 글을 삭제하시겠습니까?')) return;

    const res = await axios.post(`${MainURL}/retreatupgrade/postdelete`, {
      postId: item.id,
      userAccount: userData.userAccount,
    });

    if (res.data) {
      alert('삭제되었습니다.');
      if (list.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchDatas();
      }
    } else {
      alert('삭제 권한이 없거나 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="retreat upgrade">
      <div className="inner">
        <main className="subpage__main">
          <div className="subpage__main__title">
            <h3>등업신청</h3>
            <button type="button" className="postBtnbox" onClick={openWriteBox}>
              등업신청
            </button>
          </div>

          <div className="subpage__main__content">
            {!isWriting && (
              <div className="warningBox">
                <div className="warningBox__title">
                  <span>등업 안내</span>
                  <h4>등업제도의 취지</h4>
                </div>
                <div className="warningBox__steps">
                  <p>사이트 활성화를 목적으로 하며, 또한 허위가입자 및 악성 광고 게시물 작성자를 근본적으로 차단하기 위해 도입된 제도입니다.</p>
                  <p className="warningBox__heading"># 등업신청 방법 (자동 등업 & 즉시 등업)</p>
                  <p className="warningBox__heading">1. 게시물 작성하기</p>
                  <p>- 장소후기 게시판에 '게시글' 1개 이상 작성</p>
                  <p className="warningBox__heading">2. 등업신청 하기</p>
                  <p>- 장소후기 게시글에 1개 이상 '댓글'을 작성하고, 등업 게시판에 등업 신청</p>
                </div>
              </div>
            )}

            {isWriting && (
              <div className="upgrade-write">
                <div className="upgrade-write__header">
                  <h4>등업신청 작성</h4>
                  <p>간단한 가입인사와 등업신청 사유를 남겨주세요.</p>
                </div>
                <div className="field-row">
                  <label>제목</label>
                  <input placeholder="예: 등업신청합니다." value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field-row">
                  <label>내용</label>
                  <textarea value={content} maxLength={2000} onChange={(e) => setContent(e.target.value)} />
                </div>
                <div className="write-actions">
                  <button type="button" className="btn btn--secondary" onClick={() => setIsWriting(false)}>
                    취소
                  </button>
                  <button type="button" className="btn btn--primary" onClick={registerPost}>
                    등록
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="list-loading">
                <Loading />
              </div>
            ) : (
            <div className="upgrade-grid">
              {list.length > 0 ? (
                list.map((item) => (
                  <div className="upgrade-card" key={item.id}>
                    <div className="upgrade-card__top">
                      <span className="upgrade-card__no">no. {item.id}</span>
                      <div className="upgrade-card__info">
                        <span>{item.userNickName}</span>
                        <span>{DateFormmating(item.date)}</span>
                        {item.userAccount === userData.userAccount && (
                          <button type="button" className="upgrade-card__delete" onClick={() => deletePost(item)}>
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <h4>{renderPreview(item.title)}</h4>
                    <p>{item.content}</p>
                  </div>
                ))
              ) : (
                <div className="upgrade-empty">작성된 글이 없습니다.</div>
              )}
            </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
