import { useEffect } from 'react';
import axios from 'axios';
import './Login.scss';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  recoilKaKaoLoginData,
  recoilLoginPath,
  recoilLoginState,
  recoilNaverLoginData,
  recoilUserData,
} from '../../RecoilStore';
import LOGIN_API_URL from './loginApiUrl';

function handleLoginSuccess(
  res: {
    data: {
      refreshToken: string;
      userAccount: string;
      userNickName: string;
      userChurch: string;
      userSort: string;
      userDetail: string;
      grade: string;
      authInstitution: string;
      authChurch: string;
      authDepartment: string;
      authGroup: string;
    };
  },
  setIsLogin: (v: boolean) => void,
  setUserData: (v: object) => void,
  loginPath: string,
) {
  localStorage.setItem('refreshToken', res.data.refreshToken);
  setIsLogin(true);
  setUserData({
    userAccount: res.data.userAccount,
    userNickName: res.data.userNickName,
    userChurch: res.data.userChurch,
    userSort: res.data.userSort,
    userDetail: res.data.userDetail,
    grade: res.data.grade,
    authInstitution: res.data.authInstitution,
    authChurch: res.data.authChurch,
    authDepartment: res.data.authDepartment,
    authGroup: res.data.authGroup,
  });
  window.location.replace(loginPath || '/');
}

function handleUnregisteredUser(navigate: ReturnType<typeof useNavigate>) {
  alert('가입되지 않은 계정입니다. 사역자모아(ministermore.co.kr)에서 가입 후 로그인해 주세요.');
  navigate('/login');
}

export default function LoginSns() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const navigate = useNavigate();
  const setIsLogin = useSetRecoilState(recoilLoginState);
  const setUserData = useSetRecoilState(recoilUserData);
  const loginPath = useRecoilValue(recoilLoginPath);
  const kakaoLoginData = useRecoilValue(recoilKaKaoLoginData);
  const naverLoginData = useRecoilValue(recoilNaverLoginData);

  const KAKAO_API_KEY = kakaoLoginData.APIKEY;
  const KAKAO_REDIRECT_URI = kakaoLoginData.REDIRECT_URI_Auth;

  const NAVER_CLIENT_ID = naverLoginData.CLIENTID;
  const NAVER_SECRET = naverLoginData.SECRET;
  const NAVER_STATE = 'sdfsdfsdf';

  const requestToken = async () => {
    if (code && !state) {
      axios
        .post(`${LOGIN_API_URL}/login/loginsnstoken`, {
          sort: 'kakao',
          client_id: KAKAO_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code,
          secret: '',
          state: '',
        })
        .then((res) => {
          axios
            .post(`${LOGIN_API_URL}/login/login`, {
              url: 'kakao',
              AccessToken: res.data,
            })
            .then((loginRes) => {
              if (loginRes.data.isUser === true) {
                handleLoginSuccess(loginRes, setIsLogin, setUserData, loginPath);
              } else if (loginRes.data.isUser === false) {
                handleUnregisteredUser(navigate);
              }
            })
            .catch((err) => {
              console.log('kakao 로그인 에러:', err);
            });
        })
        .catch((err) => {
          console.error('kakao 토큰 에러', err);
        });
    } else if (code && state === NAVER_STATE) {
      axios
        .post(`${LOGIN_API_URL}/login/loginsnstoken`, {
          sort: 'naver',
          client_id: NAVER_CLIENT_ID,
          code,
          redirect_uri: '',
          secret: NAVER_SECRET,
          state: NAVER_STATE,
        })
        .then((res) => {
          axios
            .post(`${LOGIN_API_URL}/login/login`, {
              url: 'naver',
              AccessToken: res.data,
            })
            .then((loginRes) => {
              if (loginRes.data.isUser === true) {
                handleLoginSuccess(loginRes, setIsLogin, setUserData, loginPath);
              } else if (loginRes.data.isUser === false) {
                handleUnregisteredUser(navigate);
              }
            })
            .catch((err) => {
              console.log('naver 로그인 에러:', err);
            });
        })
        .catch((err) => {
          console.error('naver 로그인 에러', err);
        });
    }
  };

  useEffect(() => {
    requestToken();
  }, []);

  return <div />;
}
