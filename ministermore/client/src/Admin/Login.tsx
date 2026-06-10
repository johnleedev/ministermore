import './Admin.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../MainURL';
import { getAdminSession, normalizeAdminSession, saveAdminSession } from './adminSession';

type AuthMode = 'login' | 'register';

type AdminAuthResponse = {
  ok: boolean;
  message?: string;
  code?: string;
  admin?: unknown;
  isFirstSuper?: boolean;
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminSession()) {
      navigate('/admin/main', { replace: true });
    }
  }, [navigate]);

  const [email, setEmail] = useState('');
  const [passwd, setPasswd] = useState('');
  const [passwdConfirm, setPasswdConfirm] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  const login = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !passwd) {
      alert('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<AdminAuthResponse>(`https://www.yeplat.com/adminuser/login`, {
        email: trimmedEmail,
        password: passwd,
      });

      const admin = normalizeAdminSession(res.data?.admin);
      if (res.data?.ok && admin) {
        alert('관리자 로그인 되었습니다.');
        saveAdminSession(admin);
        navigate('/admin/main');
        window.scrollTo(0, 0);
      } else {
        alert(res.data?.message || '아이디, 비밀번호가 잘못되었습니다. 다시 시도하세요.');
      }
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message?: string }).message)
          : null;
      alert(msg || '로그인에 실패했습니다. 다시 시도하세요.');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !passwd || !trimmedName) {
      alert('아이디, 비밀번호, 이름을 입력해 주세요.');
      return;
    }
    if (passwd.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (passwd !== passwdConfirm) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<AdminAuthResponse>(`https://www.yeplat.com/adminuser/register`, {
        email: trimmedEmail,
        password: passwd,
        name: trimmedName,
        department: department.trim() || undefined,
        position: position.trim() || undefined,
      });

      const registeredAdmin = normalizeAdminSession(res.data?.admin);
      if (res.data?.ok) {
        alert(res.data.message || '가입 신청이 완료되었습니다.');
        if (res.data.isFirstSuper && registeredAdmin) {
          saveAdminSession(registeredAdmin);
          navigate('/admin/main');
          window.scrollTo(0, 0);
          return;
        }
        setMode('login');
        setPasswd('');
        setPasswdConfirm('');
      } else {
        alert(res.data?.message || '가입에 실패했습니다.');
      }
    } catch (err: unknown) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      const msg =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message?: string }).message)
          : null;
      alert(msg || '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="AdminContainer admin-login">
      <div className="admin-login__panel">
        <div className="admin-login__title-wrap">
          <h1 className="admin-login__title">관리자 {mode === 'login' ? '로그인' : '가입'}</h1>
          <p className="admin-login__subtitle">
            {mode === 'login'
              ? '승인된 관리자만 로그인할 수 있습니다.'
              : '가입 후 최종관리자 승인이 필요합니다. (최초 1명은 자동 승인)'}
          </p>
        </div>

        <div className="admin-login__form">
          {mode === 'register' && (
            <>
              <div className="admin-login__field">
                <label className="admin-login__label" htmlFor="admin-reg-name">
                  이름 *
                </label>
                <input
                  id="admin-reg-name"
                  className="admin-login__input"
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="admin-login__field">
                <label className="admin-login__label" htmlFor="admin-reg-dept">
                  부서
                </label>
                <input
                  id="admin-reg-dept"
                  className="admin-login__input"
                  type="text"
                  value={department}
                  disabled={loading}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
              <div className="admin-login__field">
                <label className="admin-login__label" htmlFor="admin-reg-position">
                  직급
                </label>
                <input
                  id="admin-reg-position"
                  className="admin-login__input"
                  type="text"
                  value={position}
                  disabled={loading}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="admin-login__field">
            <label className="admin-login__label" htmlFor="admin-login-id">
              아이디 *
            </label>
            <input
              id="admin-login-id"
              className="admin-login__input"
              type="text"
              value={email}
              placeholder={mode === 'login' ? '아이디을 입력하세요' : '등록할 아이디'}
              autoComplete="username"
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="admin-login__field">
            <label className="admin-login__label" htmlFor="admin-login-password">
              비밀번호 *
            </label>
            <input
              id="admin-login-password"
              className="admin-login__input"
              type="password"
              value={passwd}
              placeholder="비밀번호 (6자 이상)"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
              onChange={(e) => setPasswd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (mode === 'login') void login();
                  else void register();
                }
              }}
            />
          </div>

          {mode === 'register' && (
            <div className="admin-login__field">
              <label className="admin-login__label" htmlFor="admin-login-password2">
                비밀번호 확인 *
              </label>
              <input
                id="admin-login-password2"
                className="admin-login__input"
                type="password"
                value={passwdConfirm}
                disabled={loading}
                onChange={(e) => setPasswdConfirm(e.target.value)}
              />
            </div>
          )}

          <div className="admin-login__actions">
            <button
              type="button"
              className="admin-login__button admin-login__button--primary"
              disabled={loading}
              onClick={() => void (mode === 'login' ? login() : register())}
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입 신청'}
            </button>
            <button
              type="button"
              className="admin-login__button admin-login__button--ghost"
              disabled={loading}
              onClick={() => navigate('/')}
            >
              뒤로가기
            </button>
          </div>

          <p className="admin-login__switch">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  className="admin-login__switch-link"
                  disabled={loading}
                  onClick={() => setMode('register')}
                >
                  관리자 가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  className="admin-login__switch-link"
                  disabled={loading}
                  onClick={() => {
                    setMode('login');
                    setPasswdConfirm('');
                  }}
                >
                  로그인하기
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
