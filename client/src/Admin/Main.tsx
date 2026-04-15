import './Admin.scss'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Routes, Route, useNavigate } from 'react-router-dom';

export default function Main( props: any) {
  
  const navigate = useNavigate();
  const userData = sessionStorage.getItem('user');

  return (
    <div className="AdminContainer">
    
      <div className='AdminContent'>
        
        
     
        
        <div className='amdin_Main_Btn' onClick={()=>{
           window.scrollTo(0, 0);
          navigate(`/admin/registerrecruit`)
        }}>
          사역게시판
        </div>
        {
          userData === 'johnleedev' && (
            <>
              <div className='amdin_Main_Btn' onClick={()=>{
                window.scrollTo(0, 0);
                navigate(`/admin/recruitlistmanagepre`)
              }}>
                일괄 관리 (사역게시판)
              </div>
            </>
          )
        }
        <div className='amdin_Main_Btn' onClick={()=>{
          window.scrollTo(0, 0);
          navigate(`/admin/worshipmanage`)
        }}>
          예배사역 관리
        </div>
     
        
        {
          userData === 'johnleedev' && (
            <>
              {/* <div className='amdin_Main_Btn' onClick={()=>{
                window.scrollTo(0, 0);
              navigate(`/admin/communitymanage`)
            }}>
              커뮤니티 게시판 관리
            </div> */}
            <div className='amdin_Main_Btn' onClick={()=>{
                window.scrollTo(0, 0);
              navigate(`/admin/emailmanage`)
            }}>
              메일전송관리
           </div>
          
            <div className='amdin_Main_Btn' onClick={()=>{
              window.scrollTo(0, 0);
              navigate(`/admin/adminmanage`)
            }}>
              통계
            </div>
            <div className='amdin_Main_Btn' onClick={()=>{
              window.scrollTo(0, 0);
              navigate(`/admin/backup`)
            }}>
              백업
            </div>
            </>
          )
        }
        {/* <div className='amdin_Main_Box' onClick={()=>{
          navigate(`/admin/registersolo`)
        }}>
          전단지 (solo) 등록
        </div>
        <div className='amdin_Main_Box' onClick={()=>{
          navigate(`/admin/revise`)
        }}>
          수정하기
        </div>
        <div className='amdin_Main_Box' onClick={()=>{
          navigate(`/admin/schoolinfo`)
        }}>
          학교 소개 (졸연)
        </div> */}
      </div>
        

     
    </div>
  );
}
