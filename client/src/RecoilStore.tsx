import { atom } from "recoil";
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({
  key: 'ministermore', 
  storage: sessionStorage,
});

export const recoilLoginState = atom({
  key: "loginState",
  default: false,
  effects_UNSTABLE: [persistAtom]
});

export const recoilLoginPath = atom({
  key: "loginPath",
  default: '',
  effects_UNSTABLE: [persistAtom]
});

export const recoilUserData = atom({
  key: "userData",
  default: {
    userAccount : '',
    userNickName : '',
    userSort: '',
    userDetail : '',
    grade: '',
    authInstitution : '',
    authChurch : '',
    authDepartment : '',
    authGroup: '',
  },
  effects_UNSTABLE: [persistAtom]
});


export const recoilKaKaoLoginData = atom({
  key: "kakaoLoginData",
  default: {
    APIKEY : 'cc1f48e0203e8c71fad8928db95cb4ef',
    REDIRECT_URI_Auth : 'https://ministermore.co.kr/login/loginsns'
    // REDIRECT_URI_Auth : 'http://localhost:3000/login/loginsns'
  },
});


export const recoilNaverLoginData = atom({
  key: "naverLoginData",
  default: {
    CLIENTID : 'oC2ypvaePVUFUTmJueXq',
    SECRET : 'IlPy8cgw0i',
    REDIRECT_URI_Auth : 'https://ministermore.co.kr/login/loginsns'
    // REDIRECT_URI_Auth : 'http://localhost:3000/login/loginsns'
  },
});
