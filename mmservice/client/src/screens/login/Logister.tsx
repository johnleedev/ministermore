import './Login.scss'
import { useNavigate } from 'react-router-dom';
import { FaAngleDoubleRight } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";
import kakaologo from "../../images/login/kakao.png"
import naverlogo from "../../images/login/naver.png"
import { useRecoilValue } from "recoil";
import { recoilKaKaoLoginData, recoilNaverLoginData } from "../../RecoilStore";


export default function Logister(props:any) {
  
  let navigate = useNavigate();
  const kakaoLoginData = useRecoilValue(recoilKaKaoLoginData);
  const naverLoginData = useRecoilValue(recoilNaverLoginData);

  const KAKAO_API_KEY = kakaoLoginData.APIKEY;
  const KAKAO_REDIRECT_URI = kakaoLoginData.REDIRECT_URI_Auth;
  const kakaoToken = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;

  // 네이버 로그인
  const NAVER_CLIENT_ID = naverLoginData.CLIENTID;
  const NAVER_SECRET = naverLoginData.SECRET;
  const NAVER_REDIRECT_URI = naverLoginData.REDIRECT_URI_Auth;
  const NAVER_STATE = "sdfsdfsdf";
  const naverToken = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&state=${NAVER_STATE}`;

   
  return (
    <div className="login">
      
      <div className="inner">

        <div className="container">
          
          <div className="title">
            <h1>회원가입</h1>
            <p>다음 정보를 입력해주세요.</p>
          </div>

          <div className="stepnotice">
            <div className="currentbar">
              <p className="current">간편가입</p>
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p>동의</p>
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p>정보입력</p>
            </div>
            <div className="rowbar"></div>
          </div>

          <h2>SNS 계정으로 간편하게 시작하세요!</h2>
      
          <div className="inputbox">
            <div className="link"
              onClick={()=>{
                window.location.href = kakaoToken;
              }}
            >
              <div className="snsloginbox">
                <img src={kakaologo}/>
                <p>카카오로 회원가입</p>
              </div>
            </div>
            <div className="link"
              onClick={()=>{
                window.location.href = naverToken;
              }} 
            >
              <div className="snsloginbox">
                <img src={naverlogo}/>
                <p>네이버로 회원가입</p>
              </div>
            </div>
            <div className="link">
              <div className="snsloginbox"
                onClick={()=>{
                  navigate('/login/logisterDetail', { state:  {sort:'email'} });
                }}
              >
                <IoIosMail size={30}/>
                <p>이메일로 회원가입</p>
              </div>
            </div>
          </div>
 
          <div style={{width:'100%', height:'2px', backgroundColor:'#EAEAEA', margin:'10px 0'}}></div>
        
          <div className="bottombox">
            <div className="cover">
              <p onClick={()=>{
                navigate('/login');
              }}>로그인</p>
            </div>
          </div>
          
        </div>

      </div>

  
    </div>
  );
}
