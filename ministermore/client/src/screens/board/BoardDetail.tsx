import { useEffect, useState } from 'react';
import './Board.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineRemoveRedEye, MdOutlineAccessTime } from 'react-icons/md';
import { FaRegThumbsUp } from 'react-icons/fa';
import { FaPen } from 'react-icons/fa';
import { format } from 'date-fns';
import DateFormmating from '../../components/DateFormmating';
import { CiCircleMinus } from 'react-icons/ci';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';
import ScrollToTopButton from '../../components/ScrollToTopButton';
import type { CommunityBoardConfig, CommunityComment } from './BoardTypes';
import type { BoardDetailLocationState } from './boardNavigation';

type Props = {
  config: CommunityBoardConfig;
};

const getAllCommentsRoute = (config: CommunityBoardConfig) =>
  config.getAllCommentsRoute ?? `${config.routePrefix}getallcomments`;
const getIsLikedRoute = (config: CommunityBoardConfig) =>
  config.getIsLikedRoute ?? `${config.routePrefix}getisliked`;
const getDeletePostRoute = (config: CommunityBoardConfig) =>
  config.deletePostRoute ?? `${config.routePrefix}deletepost`;
const getCommentsInputRoute = (config: CommunityBoardConfig) =>
  config.commentsInputRoute ?? `${config.routePrefix}commentsinput`;
const getCommentDeleteRoute = (config: CommunityBoardConfig) =>
  config.commentDeleteRoute ?? `${config.routePrefix}commentdelete`;
const getIsLikedToggleRoute = (config: CommunityBoardConfig) =>
  config.isLikedToggleRoute ?? `${config.routePrefix}islikedtoggle`;

export default function BoardDetail({ config }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as BoardDetailLocationState | null;
  const propsData = locationState?.data;
  const propsSort = locationState?.sort ?? config.sort;
  const boardReturn = locationState?.boardReturn;

  const goBackToList = () => {
    if (boardReturn) {
      navigate(config.listPath, { state: { boardReturn } });
      return;
    }

    navigate(config.listPath);
  };
  const userData = useRecoilValue(recoilUserData);
  const isLogin = useRecoilValue(recoilLoginState);
  const canInteract = isLogin && Boolean(userData.userAccount?.trim());

  const images = propsData?.images ? JSON.parse(propsData.images) : [];

  const [refresh, setRefresh] = useState(false);
  const [commentsList, setCommentsList] = useState<CommunityComment[]>([]);
  const [isLikedLength, setIsLikedLength] = useState(0);
  const [checkIsLiked, setCheckIsLiked] = useState(false);
  const [inputComments, setInputComments] = useState('');

  useEffect(() => {
    if (!propsData?.id) {
      navigate(config.listPath, { replace: true });
      return;
    }

    const fetchDatas = async () => {
      const resComment = await axios.get(
        `${MainURL}/${config.apiBase}/${getAllCommentsRoute(config)}/${propsData.id}`
      );
      if (resComment.data) {
        const copy = [...resComment.data];
        copy.reverse();
        setCommentsList(copy);
      } else {
        setCommentsList([]);
      }

      const resIsliked = await axios.get(
        `${MainURL}/${config.apiBase}/${getIsLikedRoute(config)}/${propsData.id}`
      );
      if (resIsliked.data) {
        const copy = resIsliked.data;
        setIsLikedLength(copy.length);
        const isCheckLiked = copy.filter((e: { userAccount: string; isliked: string }) => e.userAccount === userData.userAccount);
        if (isCheckLiked.length > 0 && isCheckLiked[0].isliked === 'true') {
          setCheckIsLiked(true);
        } else {
          setCheckIsLiked(false);
        }
      } else {
        setIsLikedLength(0);
        setCheckIsLiked(false);
      }
    };

    void fetchDatas();
  }, [refresh, propsData?.id, config, navigate, userData.userAccount]);

  if (!propsData) {
    return null;
  }

  const handleislikedtoggle = async () => {
    if (!canInteract) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }
    axios
      .post(`${MainURL}/${config.apiBase}/${getIsLikedToggleRoute(config)}`, {
        postId: propsData.id,
        isLiked: checkIsLiked,
        userAccount: userData.userAccount,
      })
      .then((res) => {
        if (res.data) {
          setRefresh(!refresh);
          if (checkIsLiked) {
            alert('해제되었습니다.');
            setCheckIsLiked(false);
          } else {
            alert('입력되었습니다.');
            setCheckIsLiked(true);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');

  const registerComment = async () => {
    if (!canInteract) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }
    if (!inputComments.trim()) {
      alert('댓글을 입력해 주세요.');
      return;
    }
    axios
      .post(`${MainURL}/${config.apiBase}/${getCommentsInputRoute(config)}`, {
        postId: propsData.id,
        commentText: inputComments.trim(),
        date,
        userAccount: userData.userAccount,
        userNickName: userData.userNickName,
      })
      .then((res) => {
        if (res.data) {
          alert('입력되었습니다.');
          setInputComments('');
          setRefresh(!refresh);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const deleteComment = (item: CommunityComment) => {
    if (!canInteract) {
      alert('권한이 없습니다. 로그인이 필요합니다.');
      return;
    }
    axios
      .post(`${MainURL}/${config.apiBase}/${getCommentDeleteRoute(config)}`, {
        commentId: item.id,
        postId: item.post_id,
        userAccount: userData.userAccount,
      })
      .then((res) => {
        if (res.data === true) {
          alert('삭제되었습니다.');
          setRefresh(!refresh);
        }
      });
  };

  const deletePost = () => {
    axios
      .post(`${MainURL}/${config.apiBase}/${getDeletePostRoute(config)}`, {
        postId: propsData.id,
        userAccount: propsData.userAccount,
        images,
      })
      .then((res) => {
        if (res.data === true) {
          alert('삭제되었습니다.');
          navigate(config.listPath);
        }
      });
  };

  const renderPreview = (content: string) => {
    if (content?.length > 40) {
      return content.substring(0, 40) + '...';
    }
    return content;
  };

  return (
    <div className="Board">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>{config.detailTitle}</h3>
            <div className="subpage__main__title__actions">
              <button type="button" className="postBtnbox" onClick={goBackToList}>
                목록
              </button>
              {userData.userAccount === propsData.userAccount && (
                <button type="button" className="postBtnbox postBtnbox--danger" onClick={deletePost}>
                  삭제
                </button>
              )}
            </div>
          </div>

          <div className="subpage__main__content">
            <div className="top_box">
              <div className="left">
                <h1>{propsData.title}</h1>
                <p>구분: {propsData.sort}</p>
                {propsData.region ? <p>지역: {propsData.region}</p> : null}
                <p>글쓴이: {propsData.userNickName}님</p>
              </div>
              <div className="right">
                <div className="contentcover">
                  <div className="box">
                    <MdOutlineAccessTime color="#325382" />
                    <p>{DateFormmating(propsData.date)}</p>
                  </div>
                  <div className="box">
                    <MdOutlineRemoveRedEye color="#325382" />
                    <p>{propsData.views}</p>
                  </div>
                  <div className="box">
                    <FaRegThumbsUp color="#325382" />
                    <p>{isLikedLength > 0 ? isLikedLength : 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="view_content">
              <div className="imagecover">
                {images.length > 0 &&
                  images.map((item: string, index: number) => (
                    <img
                      src={`${MainURL}/images/postimage/${config.imagePath}/${item}`}
                      alt=""
                      key={index}
                    />
                  ))}
              </div>
              <div className="textcover">
                <p>{propsData.content}</p>
              </div>

              <div className="btn-box">
                <div
                  className="btn"
                  onClick={() => handleislikedtoggle()}
                  style={{ border: checkIsLiked ? '2px solid #325382' : '1px solid #cbcbcb' }}
                >
                  <FaRegThumbsUp color="#325382" />
                  <p>좋아요</p>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '2px', backgroundColor: '#EAEAEA', margin: '10px 0' }}></div>

            <div className="userBox">
              <FaPen color="#334968" />
              <p>
                {canInteract
                  ? userData.userNickName
                  : '로그인 후 댓글을 입력할 수 있습니다.'}
              </p>
            </div>
            <div className="addPostBox">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <p>댓글 입력하기</p>
                <h5 style={{ fontSize: '12px' }}>* 최대 500자</h5>
              </div>
              <textarea
                className="textarea textareacomment"
                value={inputComments}
                maxLength={500}
                disabled={!canInteract}
                placeholder={
                  canInteract ? '댓글을 입력해 주세요.' : '로그인이 필요합니다.'
                }
                onChange={(e) => setInputComments(e.target.value)}
              />
            </div>

            <div className="buttonbox">
              <div
                className={`button${!canInteract ? ' button--disabled' : ''}`}
                onClick={() => registerComment()}
              >
                <p>댓글 입력</p>
              </div>
            </div>

            {commentsList.length > 0 ? (
              commentsList.map((item, index) => (
                <div className="comments_box" key={index}>
                  <div className="topBox">
                    <div className="namebox">
                      <h3>{item.userNickName}님</h3>
                      <p style={{ marginLeft: '20px' }}>{DateFormmating(item.date)}</p>
                    </div>
                    {canInteract && userData.userAccount === item.userAccount && (
                      <div onClick={() => deleteComment(item)}>
                        <CiCircleMinus color="#FF0000" size={20} />
                      </div>
                    )}
                  </div>
                  <div className="textbox">
                    <p>{item.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="comments_box">
                <p>입력된 댓글이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}
