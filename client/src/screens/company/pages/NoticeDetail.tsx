import { useEffect, useState } from 'react';
import '../../board/Board.scss';
import MainURL from '../../../MainURL';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineRemoveRedEye, MdOutlineAccessTime } from "react-icons/md";
import { FaRegThumbsUp  } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { format } from "date-fns";
import DateFormmating from '../../../components/DateFormmating';
import { CiCircleMinus } from "react-icons/ci";
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';


export default function NoticeDetail () {

  let navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state.data;
  const propsSort = location.state.sort;
  const propsMenuNum = location.state.menuNum;
  const images = location.state.data.images ? JSON.parse(location.state.data.images) : [];
  const userData = useRecoilValue(recoilUserData);


  interface ListProps {
    id : number;
    post_id : number;
    content : string;
    userId : string;
    userName : string;
    date : string;
  }

  const [refresh, setRefresh] = useState<boolean>(false);
  const [commentsList, setCommentsList] = useState<ListProps[]>([]);
  const [isLikedLength, setIsLikedLength] = useState(0);
  const [checkIsLiked, setCheckIsLiked] = useState<boolean>(false);

  const fetchDatas = async () => {
    const resComment = await axios.get(`${MainURL}/noticeboard/getallnoticecomments/${propsData.id}`)
    if (resComment.data) {
      const copy = resComment.data;
      copy.reverse();
      setCommentsList(copy);
    }
    const resIsliked = await axios.get(`${MainURL}/noticeboard/getnoticeisliked/${propsData.id}`)
    if (resIsliked.data) {
      const copy = resIsliked.data;
      setIsLikedLength(copy.length);
      const isCheckLiked = copy.filter((e:any)=> e.userAccount === userData.userAccount);
      if (isCheckLiked.length > 0 && isCheckLiked[0].isliked === "true") {
        setCheckIsLiked(true);
      }
    }
  }
  useEffect(()=>{
    fetchDatas();
  }, [refresh]);

  // 좋아요 싫어요 등록 함수 ----------------------------------------------
  const handleislikedtoggle = async () => {
    axios 
      .post(`${MainURL}/noticeboard/noticeislikedtoggle`, {
        postId : propsData.id,
        isLiked : checkIsLiked,
        userAccount : userData.userAccount
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
      .catch(() => {
        console.log('실패함')
      })
  };

  // 댓글 등록 함수 ----------------------------------------------
  const [inputComments, setInputComments] = useState('');
  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');
  const registerComment = async () => {
    axios 
      .post(`${MainURL}/noticeboard/noticecommentsinput`, {
        postId : propsData.id,
        commentText : inputComments,
        date : date,
        userAccount : userData.userAccount,
        userNickName : userData.userNickName
      })
      .then((res) => {
        if (res.data) {
          alert('입력되었습니다.');
          setInputComments('');
          setRefresh(!refresh);
        }
      })
      .catch(() => {
        console.log('실패함')
      })
  };


  // 댓글 삭제 함수 ----------------------------------------------
  const deleteComment = (item:any) => {
    axios
      .post(`${MainURL}/noticeboard/noticecommentdelete`, {
        commentId : item.id,
        postId : item.post_id,
        userAccount : userData.userAccount
      })
      .then((res) => {
        if (res.data === true) {
          alert('삭제되었습니다.');
          setRefresh(!refresh);
        } 
      });
  };


  // 게시글 삭제 함수 ----------------------------------------------
  const deletePost = () => {
    axios
      .post(`${MainURL}/noticeboard/noticedeletepost`, {
        postId : propsData.id,
        userAccount : propsData.userAccount,
        images : images
      })
      .then((res) => {
        if (res.data === true) {
          alert('삭제되었습니다.');
          setRefresh(!refresh);
          navigate(-1);
        } 
      });
  };

  // 글자 제한 ----------------------------------------------
  const renderPreview = (content : string) => {
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
            <h3>공지사항</h3>
            <div style={{display:'flex'}}>
              <div className='postBtnbox'
                style={{marginRight:'10px'}}
                onClick={()=>{navigate(-1);}}
              >
                <p>목록</p>
              </div>
              {
                (propsSort !== 'graderequest' && userData.userAccount === propsData.userAccount) &&
                <div className='postBtnbox'
                  style={{marginRight:'10px'}}
                  onClick={deletePost}
                  >
                  <p>삭제</p>
                </div>
              }
              {
                propsSort !== 'notice' &&
                <div className='postBtnbox'
                  onClick={()=>{
                    navigate('/community/post', {state : {sort:propsSort, menuNum:propsMenuNum}});  
                  }}
                >
                  <p>글쓰기</p>
                </div>
              }
            </div>
          </div>
          
          <div className="subpage__main__content">
            
            <div className="top_box">
              <div className="left">
                <h1>{renderPreview(propsData.title)}</h1>
                {
                  propsSort !== 'nickname' &&
                  <p>글쓴이: {propsData.userNickName}님</p>
                }
              </div>
              <div className="right">
                <div className='contentcover'>
                  <div className="box">
                    <MdOutlineAccessTime color='#325382'/>
                    <p>{DateFormmating(propsData.date)}</p>
                  </div>
                  <div className="box">
                    <MdOutlineRemoveRedEye color='#325382'/>
                    <p>{propsData.views}</p>
                  </div>
                  <div className="box">
                    <FaRegThumbsUp color='#325382' />
                    <p>{isLikedLength > 0 ? isLikedLength : 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="view_content">
              <div className='imagecover'>
              { images.length > 0 &&
                images.map((item:any, index:any)=>{
                  return (
                    <img src={`${MainURL}/images/postimage/notice/${item}`} key={index}/>
                  )
                })
              }
              </div>
              <div className='textcover'>
                <p>{propsData.content}</p>
              </div>

              <div className="btn-box">
                <div className="btn"
                  onClick={()=>{
                    handleislikedtoggle();
                  }}
                  style={{border: checkIsLiked ? "2px solid #325382" : '1px solid #cbcbcb' }}
                >
                  <FaRegThumbsUp color='#325382' />
                  <p>좋아요</p>
                </div>
              </div>
            </div>

            <div style={{width:'100%', height:'2px', backgroundColor:'#EAEAEA', margin:'10px 0'}}></div>

            <div className="userBox">
              <FaPen color='#334968' />
              <p>{propsSort === 'nickname' ? '익명' : userData.userNickName}</p>
            </div>
            <div className="addPostBox">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'end'}}>
                <p>댓글 입력하기</p>
                <h5 style={{fontSize:'12px'}}>* 최대 500자</h5>
              </div>
              <textarea 
                className="textarea textareacomment"
                value={inputComments}
                maxLength={500}
                onChange={(e)=>{setInputComments(e.target.value)}}
              />
            </div>

            <div className="buttonbox">
              <div className="button"
              onClick={()=>{
                registerComment();
              }}
              >
                <p>댓글 입력</p>
              </div>
            </div>

            { commentsList.length > 0 
              ?
              commentsList.map((item:any, index:any)=>{
                return (
                  <div className="comments_box" key={index}>
                    <div className="topBox">
                      <div className="namebox">
                        <h3>{propsSort === 'nickname' ? '익명' : item.userNickName}님</h3>
                        {
                          propsSort !== 'graderequest' &&
                          <p style={{marginLeft:'20px'}}>{DateFormmating(item.date)}</p>
                        }
                      </div>
                      <div onClick={()=>{deleteComment(item);}}>
                        <CiCircleMinus color='#FF0000' size={20}/>
                      </div>
                    </div>
                    <div className="textbox">
                      <p>{item.content}</p>
                    </div>
                  </div>
                )
              })
              :
              <div className="comments_box">
                <p>입력된 댓글이 없습니다.</p>
              </div>
            }

            
          </div>
          
        </div>
      </div>

    </div>
  )
}



