
import './Admin.scss';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin( props: any) {
  let navigate = useNavigate();

  let [user, setuser] = useState('');
  let [passwd, setpasswd] = useState('');

  const login = () => {
    if (user === 'johnleedev' && passwd === 'gksksla' || user === 'noah' && passwd === '1234' 
      ||  user === 'jueun' && passwd === '1111' || user === 'seoyun' && passwd === '1212') {
      alert('관리자 로그인 되었습니다.')
      navigate('/admin/main'); 
      sessionStorage.setItem('user', user);
      window.scrollTo(0, 0);
    } else {
      alert('아이디,passwd이 잘못되었습니다. 다시 시도하세요.')
    }

    // axios.post(`${MainURL}/login/loginadmin`, {
    //   username : user, password : passwd
    // }).then((res)=>{
    //   if (res.data) {
    //     alert('관리자 로그인 되었습니다.')
    //     navigate('/admin/main');
    //   } else {
    //     alert('아이디,passwd이 잘못되었습니다. 다시 시도하세요.')
    //   } 
    // })
    // .catch((error)=>{console.log(error)})
  }

  return (
    <div className="AdminContainer admin-login">
      <div className="admin-login__panel">
        <div className="admin-login__title-wrap">
          <h1 className="admin-login__title">관리자 로그인</h1>
          <p className="admin-login__subtitle">관리자 계정으로 로그인해 주세요.</p>
        </div>

        <div className='admin-login__form'>
          <div className='admin-login__field'>
            <label className='admin-login__label' htmlFor="admin-login-id">아이디</label>
            <input
              id="admin-login-id"
              className='admin-login__input'
              type='text'
              value={user}
              placeholder="아이디를 입력하세요"
              onChange={(e)=>{setuser(e.target.value)}}
            />
          </div>

          <div className='admin-login__field'>
            <label className='admin-login__label' htmlFor="admin-login-password">비밀번호</label>
            <input
              id="admin-login-password"
              className='admin-login__input'
              type='password'
              value={passwd}
              placeholder="비밀번호를 입력하세요"
              onChange={(e)=>{setpasswd(e.target.value)}}
              onKeyDown={(e)=>{if (e.key === 'Enter') {login();}}}
            />
          </div>

          <div className="admin-login__actions">
            <button className='admin-login__button admin-login__button--primary' onClick={login}>
              로그인
            </button>
            <button className='admin-login__button admin-login__button--ghost' onClick={()=>{navigate('/')}}>
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
