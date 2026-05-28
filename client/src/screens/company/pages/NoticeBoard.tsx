import { useEffect, useState } from 'react';
import '../../board/Board.scss';
import MainURL from '../../../MainURL';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DateFormmating from '../../../components/DateFormmating';
import Pagination from '../../../components/Pagination';
import Loading from '../../../components/Loading';
import '../../ForListPage.scss';


export default function NoticeBoard () {

  
  let navigate = useNavigate();

  interface ListProps {
    id : number;
    sort : string;
    title : string;
    content : string;
    userAccount : string;
    userNickName : string;
    isLiked : string;
    date : string;
    views : string;
    images : [string]
  }
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [list, setList] = useState<ListProps[]>([]);
  const [listAllLength, setListAllLength] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fetchDatas = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${MainURL}/noticeboard/getnoticeposts/${currentPage}`);
      if (res.data) {
        const copy = res.data.resultData || [];
        setList(copy);
        setListAllLength(res.data.totalCount || 0);
      } else {
        setList([]);
        setListAllLength(0);
      }
    } catch (error) {
      console.error(error);
      setList([]);
      setListAllLength(0);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(()=>{
    fetchDatas();
  }, [currentPage]);

  // State 변수 추가
  const itemsPerPage = 10; // 한 페이지당 표시될 게시글 수
  const totalPages = Math.ceil(listAllLength / itemsPerPage);

  // 글자수 제한
  const renderPreview = (content : string) => {
    if (content?.length > 40) {
      return content.substring(0, 40) + '...';
    }
    return content;
  };

  // 조회수 증가시킨 후에, 디테일 페이지로 넘어가기 
  const openPostDetails = async (post: any) => {
    axios.post(`${MainURL}/noticeboard/noticepostsviews`, {
      postId: post.id,
      sort : 'notice'
    })
    .then(()=>{
      window.scrollTo(0, 0);
      navigate('/company/noticedetail', {state : {data:post, sort:'notice', menuNum:1}});
    }).catch((error)=>{
      console.error(error);
    })
  };

  return (
    <div className='community'>

      <div className="inner">
        
        <div className="subpage__main">
          <div className="subpage__main__title">
            <div className="subpage__main__title">
              <h3>공지사항</h3>
            </div>
          </div>

          <div className="subpage__main__content">
            
            {isLoading ? (
              <div className="list-loading">
                <Loading />
              </div>
            ) : (
            <div className="tbl_wrap">
              <div className="tbl_head01">
                <ul className='titleRow'>
                  <li className="th_num">번호</li>
                  <li className="th_title">제목</li>
                  <li className="th_name">글쓴이</li>
                  <li className="th_date">등록일</li>
                  <li className="th_views">조회수</li>
                </ul>
                {
                  list.length > 0 
                  ?
                  list.map((item:any, index:any)=>{

                    return(
                      <ul className="textRow" key={index}
                        onClick={()=>{
                          openPostDetails(item)
                          
                        }}
                      >
                        <li className="td_num">{item.id}</li>
                        <li className="td_title">{renderPreview(item.title)}</li>
                        <li className="td_name">{item.userNickName}</li>
                        <li className="td_date">{DateFormmating(item.date)}</li>
                        <li className="td_views">{item.views}</li>
                      </ul>
                    )
                  })
                  :
                  <ul className="textRow">
                    <li className="td_num"></li>
                    <li className="td_title"><p>등록된 글이 없습니다.</p></li>
                    <li className="td_name"></li>
                    <li className="td_date"></li>
                    <li className="td_views"></li>
                  </ul>
                }
              </div>
            </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            
          </div>
        
        </div>
       
      </div>
    </div>
  )
}



