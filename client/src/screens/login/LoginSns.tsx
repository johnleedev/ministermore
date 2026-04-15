import { useEffect } from "react";
import axios from "axios";
import './Login.scss'
import { useNavigate } from 'react-router-dom';
import MainURL from "../../MainURL";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { recoilKaKaoLoginData, recoilLoginPath, recoilLoginState, recoilNaverLoginData, recoilUserData } from "../../RecoilStore";

export default function LoginSns(props:any) {

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  let navigate = useNavigate();
  const setIsLogin = useSetRecoilState(recoilLoginState);
  const setUserData = useSetRecoilState(recoilUserData);
  const loginPath = useRecoilValue(recoilLoginPath);
  const kakaoLoginData = useRecoilValue(recoilKaKaoLoginData);
  const naverLoginData = useRecoilValue(recoilNaverLoginData);

  const KAKAO_API_KEY = kakaoLoginData.APIKEY;
  const KAKAO_REDIRECT_URI = kakaoLoginData.REDIRECT_URI_Auth;

  // 네이버 로그인
  const NAVER_CLIENT_ID = naverLoginData.CLIENTID;
  const NAVER_SECRET = naverLoginData.SECRET;
  const NAVER_STATE = "sdfsdfsdf";

  const requestToken = async () => { 
    if (code && !state) {
    // 카카오 로그인 처리
    axios
      .post(`${MainURL}/login/loginsnstoken`, {
        sort : 'kakao',
        client_id: KAKAO_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
        secret : '',
        state : ''
      })
      .then((res) => {
        axios
          .post(`${MainURL}/login/login`, {
            url: 'kakao',
            AccessToken: res.data,
          })
          .then((res: any) => {
            if (res.data.isUser === true) {
              localStorage.setItem("refreshToken", res.data.refreshToken);
              setIsLogin(true);
              setUserData({
                userAccount : res.data.userAccount,
                userNickName : res.data.userNickName,
                userChurch : res.data.userChurch,
                userSort: res.data.userSort,
                userDetail: res.data.userDetail,
                grade: res.data.grade,
                authInstitution : res.data.authInstitution,
                authChurch : res.data.authChurch,
                authDepartment : res.data.authDepartment,
                authGroup: res.data.authGroup
              })
              window.location.replace(loginPath);
            } else if (res.data.isUser === false) {
              navigate('/login/logisterDetail', { state: {data:res.data, sort:'sns'} });
            }
          }).catch((err: string) => {
            console.log('kakao 로그인 에러:', err);
          });
      }).catch((err) => {
        console.error('kakao 토큰 에러', err);
      });
    } else if (code && state === NAVER_STATE) {
      // 네이버 로그인
      axios
        .post(`${MainURL}/login/loginsnstoken`, {
          sort : 'naver',
          client_id: NAVER_CLIENT_ID,
          code: code,
          redirect_uri: '',
          secret : NAVER_SECRET,
          state : NAVER_STATE
        })
        .then((res) => {
          axios
            .post(`${MainURL}/login/login`, {
              url: 'naver',
              AccessToken: res.data,
            })
            .then((res: any) => {
              if (res.data.isUser === true) {
                localStorage.setItem("refreshToken", res.data.refreshToken);
                setIsLogin(true);
                setUserData({
                  userAccount : res.data.userAccount,
                  userNickName : res.data.userNickName,
                  userChurch : res.data.userChurch,
                  userSort: res.data.userSort,
                  userDetail: res.data.userDetail,
                  grade: res.data.grade,
                  authInstitution : res.data.authInstitution,
                  authChurch : res.data.authChurch,
                  authDepartment : res.data.authDepartment,
                  authGroup: res.data.authGroup
                })
                window.location.replace(loginPath);
              } else if (res.data.isUser === false) {
                navigate('/login/logisterDetail', { state:  {data:res.data, sort:'sns'} });
              }
            }).catch((err: string) => {
              console.log('kakao 토큰 요청 에러:', err);
            });
        }).catch((err) => {
          console.error('naver 로그인 에러', err);
        });
    }
  }

  useEffect(() =>{
    requestToken();
  }, []);

   
  return (
    <div></div>
  )
}
