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
    APIKEY : '0ceb02a4c2ba5343e679e135b09a649a',
    REDIRECT_URI_Auth : 'https://ministermore.co.kr/login/loginsns'
  },
});


export const recoilNaverLoginData = atom({
  key: "naverLoginData",
  default: {
    CLIENTID : 'oC2ypvaePVUFUTmJueXq',
    SECRET : 'IlPy8cgw0i',
    REDIRECT_URI_Auth : 'https://ministermore.co.kr/login/loginsns'
  },
});

