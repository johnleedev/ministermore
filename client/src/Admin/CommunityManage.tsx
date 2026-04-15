import React, { useEffect, useState } from 'react';
import './Admin.scss';
import axios from 'axios';
import MainURL from '../MainURL';
import { useNavigate } from 'react-router-dom';
import DateFormmating from '../components/DateFormmating';

interface PostProps {
  id: number;
  sort: string;
  title: string;
  content: string;
  userAccount: string;
  userNickName: string;
  date: string;
  views: number;
  commentCount: number;
  images: string;
}

// AI 프롬프트 예시 글 생성 함수 (실제 AI 연동 전용)
function generateAIPost({
  age, gender, position, career, style, mood, topic
}: {
  age: string;
  gender: string;
  position: string;
  career: string;
  style: string;
  mood: string;
  topic: string;
}) {
  // 간단한 형태로 결과 생성
  const content = `나이: ${age}대\n직분: ${position}\n사역경력: ${career}년\n글 스타일: ${style}\n분위기: ${mood}\n주제: ${topic}`;
  return { title: 'AI 생성 결과', content };
}

export default function CommunityManage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSort, setSelectedSort] = useState('all');
  const [loading, setLoading] = useState(false);

  // 글 작성 폼 상태
  const [writeSort, setWriteSort] = useState('notice');
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeLoading, setWriteLoading] = useState(false);

  // AI 프롬프트 상태
  const [aiAge, setAiAge] = useState('30');
  const [aiGender, setAiGender] = useState('male');
  const [aiPosition, setAiPosition] = useState('목사');
  const [aiCareer, setAiCareer] = useState('10');
  const [aiStyle, setAiStyle] = useState('진지하게');
  const [aiMood, setAiMood] = useState('밝게');
  const [aiTopic, setAiTopic] = useState('교회에서 있었던 일');
  const [aiLoading, setAiLoading] = useState(false);

  const pageSize = 20;

  // 게시글 목록 가져오기
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${MainURL}/board/getposts/${selectedSort}/${currentPage}`);
      if (res.data) {
        setPosts(res.data.resultData || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedSort]);

  // AI 생성 결과 상태
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');
  const [showAiResult, setShowAiResult] = useState(false);

  // AI로 글 생성
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    // 실제 AI 연동 시 이 부분에서 API 호출
    setTimeout(() => {
      const { title, content } = generateAIPost({
        age: aiAge,
        gender: aiGender,
        position: aiPosition,
        career: aiCareer,
        style: aiStyle,
        mood: aiMood,
        topic: aiTopic
      });
      setAiGeneratedTitle(title);
      setAiGeneratedContent(content);
      setShowAiResult(true);
      setAiLoading(false);
    }, 700);
  };

  // 게시글 등록
  const handleWritePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeTitle.trim() || !writeContent.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    setWriteLoading(true);
    try {
      const res = await axios.post(`${MainURL}/board/writepost`, {
        sort: writeSort,
        title: writeTitle,
        content: writeContent,
        userAccount: 'admin', // 관리자 계정
        userNickName: '관리자',
        images: ''
      });
      if (res.data) {
        alert('글이 등록되었습니다.');
        setWriteTitle('');
        setWriteContent('');
        fetchPosts();
      } else {
        alert('등록에 실패했습니다.');
      }
    } catch (error) {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setWriteLoading(false);
    }
  };

  // 게시글 삭제
  const deletePost = async (postId: number, userAccount: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await axios.post(`${MainURL}/board/deletepost`, {
        postId: postId,
        userAccount: userAccount,
        images: ''
      });
      if (res.data) {
        alert('삭제되었습니다.');
        fetchPosts();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId: number, postId: number, userAccount: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await axios.post(`${MainURL}/board/commentdelete`, {
        commentId: commentId,
        postId: postId,
        userAccount: userAccount
      });
      if (res.data) {
        alert('댓글이 삭제되었습니다.');
        fetchPosts();
      } else {
        alert('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 페이지 변경
  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 게시판 종류별 필터링
  const getSortDisplayName = (sort: string) => {
    switch (sort) {
      case 'notice': return '공지사항';
      case 'nickname': return '익명게시판';
      case 'manage': return '운영게시판';
      case 'graderequest': return '등업신청';
      case 'programsare': return '프로그램추천&공유';
      case 'placereview': return '장소후기';
      default: return sort;
    }
  };

  // 글자수 제한
  const renderPreview = (content: string, maxLength: number = 50) => {
    if (!content) return '';
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    return content;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="AdminContainer">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">
            <h3>커뮤니티 게시판 관리</h3>
            <div style={{display:'flex'}}>
              <div className='postBtnbox'
                onClick={()=>{navigate('/admin/main');}}
              >
                <p>목록</p>
              </div>
            </div>
          </div>

                     {/* AI 프롬프트 영역 */}
           <form className="ai-prompt-form" onSubmit={handleAIGenerate} style={{marginBottom: 24, background: '#e3f2fd', padding: 20, borderRadius: 8}}>
             <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10}}>
               <input type="number" min={20} max={80} value={aiAge} onChange={e => setAiAge(e.target.value)} placeholder="나이" style={{width: 70, padding: 6, borderRadius: 4, border: '1px solid #bbb'}} />
               <select value={aiGender} onChange={e => setAiGender(e.target.value)} style={{padding: 6, borderRadius: 4, border: '1px solid #bbb'}}>
                 <option value="male">남자</option>
                 <option value="female">여자</option>
               </select>
               <select value={aiPosition} onChange={e => setAiPosition(e.target.value)} style={{padding: 6, borderRadius: 4, border: '1px solid #bbb'}}>
                 <option value="목사">목사</option>
                 <option value="전도사">전도사</option>
                 <option value="사모">사모</option>
                 <option value="평신도">평신도</option>
               </select>
               <input type="number" min={0} max={50} value={aiCareer} onChange={e => setAiCareer(e.target.value)} placeholder="경력(년)" style={{width: 90, padding: 6, borderRadius: 4, border: '1px solid #bbb'}} />
               <select value={aiStyle} onChange={e => setAiStyle(e.target.value)} style={{padding: 6, borderRadius: 4, border: '1px solid #bbb'}}>
                 <option value="진지하게">진지하게</option>
                 <option value="친근하게">친근하게</option>
                 <option value="격식있게">격식있게</option>
                 <option value="간단하게">간단하게</option>
                 <option value="상세하게">상세하게</option>
               </select>
               <select value={aiMood} onChange={e => setAiMood(e.target.value)} style={{padding: 6, borderRadius: 4, border: '1px solid #bbb'}}>
                 <option value="밝게">밝게</option>
                 <option value="차분하게">차분하게</option>
                 <option value="열정적으로">열정적으로</option>
                 <option value="신중하게">신중하게</option>
                 <option value="희망차게">희망차게</option>
               </select>
               <select value={aiTopic} onChange={e => setAiTopic(e.target.value)} style={{padding: 6, borderRadius: 4, border: '1px solid #bbb'}}>
                 <option value="교회에서 있었던 일">교회에서 있었던 일</option>
                 <option value="사역 중 느낀 점">사역 중 느낀 점</option>
                 <option value="기도 응답">기도 응답</option>
                 <option value="성도와의 만남">성도와의 만남</option>
                 <option value="말씀을 통한 깨달음">말씀을 통한 깨달음</option>
                 <option value="교회 행사">교회 행사</option>
                 <option value="목회 고민">목회 고민</option>
                 <option value="감사한 일">감사한 일</option>
{/* 
                 글 스타일이랑 분위기는 같은거 같은니까, 옵션을 합쳐주고,

'AI로 글 생성' 이 버튼 옆에 '랜덤으로 선택' 버튼을 눌러서
나이, 성별, 직분, 사역경력, 글스타일,주제 등을
랜덤으로 선택할수 있게 만들어줘 */}

               </select>
             </div>
             <button type="submit" className="admin-btn view-btn" disabled={aiLoading} style={{minWidth: 120, fontSize: 16}}>
               {aiLoading ? 'AI 생성 중...' : 'AI로 글 생성'}
             </button>
           </form>

          {/* AI 생성 결과 영역 */}
          {showAiResult && (
            <div style={{marginBottom: 24, background: '#fff3cd', padding: 20, borderRadius: 8, border: '1px solid #ffeaa7'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <h4 style={{margin: 0, color: '#856404', fontSize: 18}}>AI 생성 결과</h4>
                <button 
                  onClick={() => setShowAiResult(false)}
                  style={{background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#856404'}}
                >
                  ×
                </button>
              </div>
              <div style={{marginBottom: 15}}>
                <strong style={{color: '#856404'}}>제목:</strong>
                <div style={{padding: 10, background: 'white', borderRadius: 4, marginTop: 5, border: '1px solid #ffeaa7'}}>
                  {aiGeneratedTitle}
                </div>
              </div>
              <div>
                <strong style={{color: '#856404'}}>내용:</strong>
                <div style={{padding: 10, background: 'white', borderRadius: 4, marginTop: 5, border: '1px solid #ffeaa7', whiteSpace: 'pre-line', minHeight: 100}}>
                  {aiGeneratedContent}
                </div>
              </div>
            </div>
          )}

          {/* 글 작성 폼 */}
          <form className="admin-write-form" onSubmit={handleWritePost} style={{marginBottom: 32, background: '#f8f9fa', padding: 24, borderRadius: 8}}>
            <div style={{display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center'}}>
              <select value={writeSort} onChange={e => setWriteSort(e.target.value)} style={{padding: '8px 12px', fontSize: 16}}>
                <option value="notice">공지사항</option>
                <option value="nickname">익명게시판</option>
                <option value="manage">운영게시판</option>
                <option value="graderequest">등업신청</option>
                <option value="programsare">프로그램추천&공유</option>
                <option value="placereview">장소후기</option>
              </select>
              <input
                type="text"
                placeholder="제목"
                value={writeTitle}
                onChange={e => setWriteTitle(e.target.value)}
                style={{flex: 1, padding: '8px 12px', fontSize: 16, borderRadius: 4, border: '1px solid #ccc'}}
                maxLength={100}
              />
            </div>
            <div style={{marginBottom: 12}}>
              <textarea
                placeholder="내용을 입력하세요"
                value={writeContent}
                onChange={e => setWriteContent(e.target.value)}
                style={{width: '100%', minHeight: 80, padding: 12, fontSize: 15, borderRadius: 4, border: '1px solid #ccc'}}
                maxLength={2000}
              />
            </div>
            <button type="submit" className="admin-btn view-btn" disabled={writeLoading} style={{minWidth: 120, fontSize: 16}}>
              {writeLoading ? '등록 중...' : '글 등록'}
            </button>
          </form>

          {/* 필터 */}
          <div className="filter-section" style={{marginBottom: '20px'}}>
            <select 
              value={selectedSort} 
              onChange={(e) => {
                setSelectedSort(e.target.value);
                setCurrentPage(1);
              }}
              style={{padding: '8px 12px', fontSize: '16px'}}
            >
              <option value="all">전체 게시판</option>
              <option value="notice">공지사항</option>
              <option value="nickname">익명게시판</option>
              <option value="manage">운영게시판</option>
              <option value="graderequest">등업신청</option>
              <option value="programsare">프로그램추천&공유</option>
              <option value="placereview">장소후기</option>
            </select>
          </div>

          {/* 게시글 목록 */}
          <div className="subpage__main__content">
            {loading ? (
              <div style={{textAlign: 'center', padding: '50px'}}>로딩 중...</div>
            ) : (
              <div className="board-list">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>게시판</th>
                      <th>제목</th>
                      <th>작성자</th>
                      <th>작성일</th>
                      <th>조회수</th>
                      <th>댓글수</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, index) => (
                      <tr key={post.id}>
                        <td>{totalCount - ((currentPage - 1) * pageSize + index)}</td>
                        <td>{getSortDisplayName(post.sort)}</td>
                        <td style={{textAlign: 'left', maxWidth: '300px'}}>
                          <div title={post.title}>
                            {renderPreview(post.title, 30)}
                          </div>
                        </td>
                        <td>{post.userNickName}</td>
                        <td>{DateFormmating(post.date)}</td>
                        <td>{post.views}</td>
                        <td>{post.commentCount}</td>
                        <td>
                          <div style={{display: 'flex', gap: '5px'}}>
                            <button 
                              className="admin-btn delete-btn"
                              onClick={() => deletePost(post.id, post.userAccount)}
                              title="게시글 삭제"
                            >
                              삭제
                            </button>
                            <button 
                              className="admin-btn view-btn"
                              onClick={() => navigate('/community/detail', {state: {data: post, sort: post.sort, menuNum: 1}})}
                              title="상세보기"
                            >
                              보기
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="pagination" style={{marginTop: '30px', textAlign: 'center'}}>
                    <button 
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      이전
                    </button>
                    
                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="page-btn"
                    >
                      다음
                    </button>
                  </div>
                )}

                {posts.length === 0 && (
                  <div style={{textAlign: 'center', padding: '50px', color: '#666'}}>
                    게시글이 없습니다.
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