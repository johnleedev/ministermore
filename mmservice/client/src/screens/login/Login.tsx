import { useState } from 'react';
import axios from 'axios';
import './Login.scss';
import kakaologo from '../../images/login/kakao.png';
import naverlogo from '../../images/login/naver.png';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  recoilKaKaoLoginData,
  recoilLoginPath,
  recoilLoginState,
  recoilNaverLoginData,
  recoilUserData,
} from '../../RecoilStore';
import LOGIN_API_URL from './loginApiUrl';

export default function Login() {
  const setIsLogin = useSetRecoilState(recoilLoginState);
  const setUserData = useSetRecoilState(recoilUserData);
  const setLoginPath = useSetRecoilState(recoilLoginPath);
  const kakaoLoginData = useRecoilValue(recoilKaKaoLoginData);
  const naverLoginData = useRecoilValue(recoilNaverLoginData);

  const KAKAO_API_KEY = kakaoLoginData.APIKEY;
  const KAKAO_REDIRECT_URI = kakaoLoginData.REDIRECT_URI_Auth;
  const kakaoToken = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`;

  const NAVER_CLIENT_ID = naverLoginData.CLIENTID;
  const NAVER_REDIRECT_URI = naverLoginData.REDIRECT_URI_Auth;
  const NAVER_STATE = 'sdfsdfsdf';
  const naverToken = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&state=${NAVER_STATE}`;

  const [loginAccount, setLoginAccount] = useState('');
  const [loginPasswd, setLoginPasswd] = useState('');

  const handleEmailLogin = async () => {
    await axios
      .post(`${LOGIN_API_URL}/login/loginemail`, {
        loginAccount,
        loginPasswd,
        userURL: 'email',
      })
      .then((res) => {
        if (res.data.isUser) {
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
          window.location.replace('/');
        } else if (res.data.which === 'email') {
          alert('가입되어 있지 않은 이메일 계정입니다. 사역자모아(ministermore.co.kr)에서 가입해 주세요.');
        } else if (res.data.which === 'passwd') {
          alert('비밀번호가 정확하지 않습니다. SNS 계정으로 가입·로그인하셨는지 확인해 주세요.');
        }
      })
      .catch(() => {
        alert('다시 시도해주세요.');
      });
  };

  return (
    <div className="login">
      <div className="inner">
        <div className="container">
          <div className="title">
            <h1>로그인</h1>
            <p>로그인을 하시면 더 많은 정보를 보실수 있습니다.</p>
          </div>

          <div className="stepnotice">
            <div className="rowbar" />
          </div>

          <h2>SNS 계정으로 간편하게 로그인 하세요!</h2>

          <div className="inputbox">
            <div
              className="link"
              onClick={() => {
                setLoginPath('/');
                window.location.href = kakaoToken;
              }}
            >
              <div className="snsloginbox">
                <img src={kakaologo} alt="카카오" />
                <p>카카오로 로그인</p>
              </div>
            </div>
            <div
              className="link"
              onClick={() => {
                setLoginPath('/');
                window.location.href = naverToken;
              }}
            >
              <div className="snsloginbox">
                <img src={naverlogo} alt="네이버" />
                <p>네이버로 로그인</p>
              </div>
            </div>
          </div>

          <p style={{ margin: '20px 0' }}>어플로 가입하셨다면, 가입한 SNS로 로그인해주세요.</p>

          <div className="inputbox">
            <p style={{ marginTop: '20px' }}>이메일로 로그인하기</p>
            <input
              value={loginAccount}
              className={loginAccount === '' ? 'inputdefault' : 'inputdefault select'}
              type="text"
              onChange={(e) => {
                setLoginAccount(e.target.value);
              }}
              placeholder="이메일"
              onKeyDown={(e) => {
                if (loginAccount !== '' && loginPasswd !== '' && e.key === 'Enter') {
                  handleEmailLogin();
                }
              }}
            />
            <input
              value={loginPasswd}
              className={loginPasswd === '' ? 'inputdefault' : 'inputdefault select'}
              type="password"
              onChange={(e) => {
                setLoginPasswd(e.target.value);
              }}
              placeholder="비밀번호"
              onKeyDown={(e) => {
                if (loginAccount !== '' && loginPasswd !== '' && e.key === 'Enter') {
                  handleEmailLogin();
                }
              }}
            />
          </div>

          <div className="buttonbox">
            <div
              className="button"
              onClick={() => {
                setLoginPath('/');
                handleEmailLogin();
              }}
            >
              <p>로그인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
