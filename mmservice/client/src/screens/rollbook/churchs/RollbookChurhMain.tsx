import React, { useEffect, useState } from 'react';
import '../scss/RollbookChurchMain.scss';
import MainURL from '../../../MainURL';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DepartmentManageModal from './DepartmentManageModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  PiChurchBold,
  PiCross,
  PiMapPin,
  PiPhone,
  PiUser,
  PiClock,
  PiCaretRight,
  PiPlus,
  PiArrowLeft,
  PiBaby,
  PiShapes,
  PiLeaf,
  PiTree,
  PiBookOpen,
  PiGraduationCap,
  PiFire,
  PiArrowsClockwise,
} from 'react-icons/pi';
import { IoMdPerson } from 'react-icons/io';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

const ROLLBOOK_LEADER_TOKEN_KEY = 'rollbook_leader_token';
const ROLLBOOK_LEADER_DEPT_KEY = 'rollbook_leader_dept';
const ROLLBOOK_LEADER_ID_KEY = 'rollbook_leader_id';
const ROLLBOOK_LEADER_IS_CHIEF_KEY = 'rollbook_leader_is_chief';
const ROLLBOOK_LEADER_NAME_KEY = 'rollbook_leader_name';
const ROLLBOOK_LEADER_AUTHLEVEL_KEY = 'rollbook_leader_authlevel';
const ROLLBOOK_CHURCH_AUTO_KEY = 'rollbook_church_auto';

interface DepartmentProps {
  id: number;
  church_id: number;
  name: string;
  chief_name?: string;
  group_sort?: string;
  leader_sort?: string;
  student_sort?: string;
}

const DEPT_ICONS = [
  { Icon: PiBaby, class: 'icon-pink' },
  { Icon: PiShapes, class: 'icon-yellow' },
  { Icon: PiLeaf, class: 'icon-blue' },
  { Icon: PiTree, class: 'icon-indigo' },
  { Icon: PiBookOpen, class: 'icon-purple' },
  { Icon: PiGraduationCap, class: 'icon-red' },
  { Icon: PiFire, class: 'icon-teal' },
];

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: { display: false },
    y: { display: false, min: 60, max: 100 },
  },
};

const lineChartData = {
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  datasets: [{
    label: '출석률',
    data: [78, 82, 80, 85, 84, 88, 87],
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 2,
    tension: 0.4,
    fill: true,
    pointRadius: 0,
  }],
};

export default function RollbookChurhMain() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const churchId = searchParams.get('id');
  const churchName = searchParams.get('churchName') || '';

  const [departments, setDepartments] = useState<DepartmentProps[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<number, number>>({});
  const [mounted, setMounted] = useState(false);
  const [isViewDepartmentManageModal, setIsViewDepartmentManageModal] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [leaderName, setLeaderName] = useState('');
  const [leaderPw, setLeaderPw] = useState('');
  const [leaderPwConfirm, setLeaderPwConfirm] = useState('');
  const [selectedDeptIdForLeader, setSelectedDeptIdForLeader] = useState<number | ''>('');
  const [adminAuthLevelForRegister, setAdminAuthLevelForRegister] = useState<0 | 1>(1);
  const [isLeaderSubmitting, setIsLeaderSubmitting] = useState(false);

  const [churchLoginDeptId, setChurchLoginDeptId] = useState<number | ''>('');
  const [churchLoginName, setChurchLoginName] = useState('');
  const [churchLoginPw, setChurchLoginPw] = useState('');
  const [churchLoginAutoLogin, setChurchLoginAutoLogin] = useState(false);
  const [churchLoginSubmitting, setChurchLoginSubmitting] = useState(false);
  const [isChurchLoggedIn, setIsChurchLoggedIn] = useState(false);
  const [churchLeader, setChurchLeader] = useState<{ leaderId: number; leaderName: string; deptIds: number[]; isChief: boolean; isApproved?: boolean; leaderIdByDept?: Record<number, number>; authLevelByDept?: Record<number, number>; churchAuthLevel?: number } | null>(null);

  const [adminPassModalOpen, setAdminPassModalOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassSubmitting, setAdminPassSubmitting] = useState(false);

  const [isMyPageModalOpen, setIsMyPageModalOpen] = useState(false);
  const [myPageMode, setMyPageMode] = useState<'menu' | 'change_password' | 'withdraw'>('menu');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [withdrawPw, setWithdrawPw] = useState('');
  const [myPageSubmitting, setMyPageSubmitting] = useState(false);

  const handleChurchLogin = async () => {
    if (!churchId || churchLoginSubmitting) return;
    if ((churchLoginDeptId !== 0 && !churchLoginDeptId) || !churchLoginName.trim() || !churchLoginPw) {
      alert('부서, 이름, 비밀번호를 모두 입력·선택해주세요.');
      return;
    }
    setChurchLoginSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/loginbychurch`, {
        church_id: parseInt(churchId),
        dept_id: churchLoginDeptId,
        name: churchLoginName.trim(),
        password: churchLoginPw,
      });
      if (res.data?.success) {
        const leader = {
          leaderId: res.data.leaderId,
          leaderName: res.data.leaderName ?? churchLoginName.trim(),
          deptIds: res.data.deptIds || [],
          isChief: res.data.isChief === true,
          isApproved: res.data.isApproved !== false,
          leaderIdByDept: res.data.leaderIdByDept || {},
          authLevelByDept: res.data.authLevelByDept || {},
          churchAuthLevel: res.data.churchAuthLevel != null ? res.data.churchAuthLevel : 5,
        };
        setChurchLeader(leader);
        setIsChurchLoggedIn(true);
        setChurchLoginName('');
        setChurchLoginPw('');
        setChurchLoginDeptId('');
        if (churchId) {
          const payload = JSON.stringify({ churchId, ...leader });
          if (churchLoginAutoLogin) {
            localStorage.setItem(ROLLBOOK_CHURCH_AUTO_KEY, payload);
            sessionStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
          } else {
            sessionStorage.setItem(ROLLBOOK_CHURCH_AUTO_KEY, payload);
            localStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
          }
        }
      } else {
        alert(res.data?.error || '부서, 이름 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '부서, 이름 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setChurchLoginSubmitting(false);
    }
  };

  const handleDeptClick = (item: DepartmentProps) => {
    if (!isChurchLoggedIn || !churchLeader) return;
    if (!churchLeader.deptIds.includes(item.id)) return;
    const effectiveLeaderId = churchLeader.leaderIdByDept?.[item.id] ?? churchLeader.leaderId;
    const authlevel = churchLeader.authLevelByDept?.[item.id] ?? 5;
    const token = `leader_${effectiveLeaderId}_${Date.now()}_${item.id}`;
    sessionStorage.setItem(ROLLBOOK_LEADER_TOKEN_KEY, token);
    sessionStorage.setItem(ROLLBOOK_LEADER_DEPT_KEY, String(item.id));
    sessionStorage.setItem(ROLLBOOK_LEADER_ID_KEY, String(effectiveLeaderId));
    sessionStorage.setItem(ROLLBOOK_LEADER_IS_CHIEF_KEY, String(churchLeader.isChief));
    sessionStorage.setItem(ROLLBOOK_LEADER_NAME_KEY, churchLeader.leaderName);
    sessionStorage.setItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY, String(authlevel));
    const gSort = item.group_sort || '소그룹';
    const lSort = item.leader_sort || '교사';
    const sSort = item.student_sort || '학생';
    window.scrollTo(0, 0);
    navigate(`/rollbook/depart?church_id=${churchId}&department_id=${item.id}&churchName=${encodeURIComponent(churchName)}&departmentName=${encodeURIComponent(item.name)}&groupSort=${encodeURIComponent(gSort)}&leaderSort=${encodeURIComponent(lSort)}&studentSort=${encodeURIComponent(sSort)}`);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!churchId) return;
    try {
      const stored = localStorage.getItem(ROLLBOOK_CHURCH_AUTO_KEY) || sessionStorage.getItem(ROLLBOOK_CHURCH_AUTO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (String(parsed?.churchId) === String(churchId) && parsed?.leaderId) {
          setChurchLeader({
            leaderId: parsed.leaderId,
            leaderName: parsed.leaderName || '',
            deptIds: Array.isArray(parsed.deptIds) ? parsed.deptIds : [],
            isChief: parsed.isChief === true,
            isApproved: parsed.isApproved !== false,
            leaderIdByDept: parsed.leaderIdByDept && typeof parsed.leaderIdByDept === 'object' ? parsed.leaderIdByDept : {},
            authLevelByDept: parsed.authLevelByDept && typeof parsed.authLevelByDept === 'object' ? parsed.authLevelByDept : {},
            churchAuthLevel: parsed.churchAuthLevel != null ? parsed.churchAuthLevel : 5,
          });
          setIsChurchLoggedIn(true);
          return;
        }
      }
    } catch {
      localStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
      sessionStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
    }
  }, [churchId]);

  useEffect(() => {
    if (!churchId) return;
    const refresh = async () => {
      try {
        const res = await axios.post(`${MainURL}/rollbookdepart/getdepartments`, {
          church_id: parseInt(churchId),
        });
        if (res.data?.success) setDepartments(res.data.data || []);
      } catch (e) {
        console.error('부서 목록 새로고침 실패:', e);
      }
    };
    refresh();
  }, [churchId]);

  useEffect(() => {
    if (departments.length === 0) return;
    const fetchGroupCounts = async () => {
      const counts: Record<number, number> = {};
      await Promise.all(
        departments.map(async (d) => {
          try {
            const res = await axios.post(`${MainURL}/rollbookgroup/getgrouplist`, {
              churchId,
              deptId: d.id,
            });
            counts[d.id] = Array.isArray(res.data) ? res.data.length : 0;
          } catch {
            counts[d.id] = 0;
          }
        })
      );
      setGroupCounts(counts);
    };
    fetchGroupCounts();
  }, [churchId, departments]);

  const churchAuthLevel = churchLeader?.churchAuthLevel ?? 5;
  const canAccessDeptManage = churchAuthLevel === 0;

  const openDepartmentManage = () => {
    if (!canAccessDeptManage) return;
    setAdminPassInput('');
    setAdminPassModalOpen(true);
  };

  const handleAdminPassVerify = async () => {
    if (!churchId || adminPassSubmitting) return;
    if (!adminPassInput.trim()) {
      alert('운영 비밀번호를 입력해주세요.');
      return;
    }
    setAdminPassSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookchurch/verifyadminpass`, {
        church_id: parseInt(churchId),
        password: adminPassInput.trim(),
      });
      if (res.data?.success) {
        setAdminPassModalOpen(false);
        setAdminPassInput('');
        setIsViewDepartmentManageModal(true);
      } else {
        alert(res.data?.error || '비밀번호가 올바르지 않습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '확인에 실패했습니다.');
    } finally {
      setAdminPassSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!churchLeader?.leaderId || myPageSubmitting) return;
    if (!currentPw || !newPw || !newPwConfirm) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    if (newPw.length !== 4) {
      alert('새 비밀번호는 4자리로 입력해주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setMyPageSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/changepassword`, {
        leaderId: churchLeader.leaderId,
        currentPassword: currentPw,
        newPassword: newPw,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setMyPageMode('menu');
        setCurrentPw('');
        setNewPw('');
        setNewPwConfirm('');
        setIsMyPageModalOpen(false);
      } else {
        alert(res.data?.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    } finally {
      setMyPageSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!churchLeader?.leaderId || myPageSubmitting) return;
    if (!withdrawPw) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!window.confirm('정말 탈퇴하시겠습니까? 탈퇴 후에는 복구할 수 없습니다.')) return;
    setMyPageSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/withdraw`, {
        leaderId: churchLeader.leaderId,
        password: withdrawPw,
      });
      if (res.data?.success) {
        alert(res.data.message);
        [ROLLBOOK_LEADER_TOKEN_KEY, ROLLBOOK_LEADER_DEPT_KEY, ROLLBOOK_LEADER_ID_KEY, ROLLBOOK_LEADER_IS_CHIEF_KEY, ROLLBOOK_LEADER_NAME_KEY].forEach((k) => {
          sessionStorage.removeItem(k);
          localStorage.removeItem(k);
        });
        sessionStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
        localStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
        setIsMyPageModalOpen(false);
        setIsChurchLoggedIn(false);
        setChurchLeader(null);
      } else {
        alert(res.data?.error || '탈퇴에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '탈퇴에 실패했습니다.');
    } finally {
      setMyPageSubmitting(false);
    }
  };

  const openMyPageModal = () => {
    setMyPageMode('menu');
    setCurrentPw('');
    setNewPw('');
    setNewPwConfirm('');
    setWithdrawPw('');
    setIsMyPageModalOpen(true);
  };

  const closeMyPageModal = () => {
    if (!myPageSubmitting) {
      setIsMyPageModalOpen(false);
      setMyPageMode('menu');
    }
  };

  const refreshDepartments = async () => {
    if (!churchId) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookdepart/getdepartments`, {
        church_id: parseInt(churchId),
      });
      if (res.data?.success) setDepartments(res.data.data || []);
    } catch (e) {
      console.error('부서 목록 새로고침 실패:', e);
    }
  };

  const handleRegisterLeader = async () => {
    if (isLeaderSubmitting || !churchId) return;
    if (!leaderName.trim() || !leaderPw || (selectedDeptIdForLeader !== 0 && !selectedDeptIdForLeader)) {
      alert('부서, 이름, 비밀번호를 모두 입력·선택해주세요.');
      return;
    }
    if (leaderPw.length !== 4) {
      alert('비밀번호는 4자리로 입력해주세요.');
      return;
    }
    if (leaderPw !== leaderPwConfirm) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setIsLeaderSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/registerbychurch`, {
        church_id: parseInt(churchId),
        dept_id: selectedDeptIdForLeader,
        name: leaderName.trim(),
        password: leaderPw,
        ...(selectedDeptIdForLeader === 0 ? { authlevel: canAccessDeptManage ? adminAuthLevelForRegister : 1 } : {}),
      });
      if (res.data?.success) {
        alert(res.data.message);
        setLeaderName('');
        setLeaderPw('');
        setLeaderPwConfirm('');
        setSelectedDeptIdForLeader('');
        setAdminAuthLevelForRegister(1);
        setIsLeaderModalOpen(false);
      } else {
        alert(res.data?.error || '등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setIsLeaderSubmitting(false);
    }
  };

  const getDeptDisplayData = (item: DepartmentProps, index: number) => {
    const iconInfo = DEPT_ICONS[index % DEPT_ICONS.length];
    const groupCount = groupCounts[item.id] ?? 0;
    const enrollment = 0;
    const attendance = 0;
    const rate = enrollment > 0 ? Math.round((attendance / enrollment) * 1000) / 10 : 0;
    const isExcellent = rate >= 90;
    const isAttention = rate > 0 && rate < 75;
    return { iconInfo, groupCount, enrollment, attendance, rate, isExcellent, isAttention };
  };

  if (!mounted) return null;

  return (
    <div className="RollbookChurchMainPage">
      <div className="slide-container">
        <header className="rb-header">
          <div className="rb-header-left">
            <div className="rb-logo"><PiChurchBold size={18} /></div>
            <p className="rb-header-title">주일학교 출석부</p>
            <div className="rb-header-divider" />
            <p className="rb-header-sub">관리자 대시보드</p>
          </div>
        </header>

        <div className="content-area">
          <div className="content-block content-block-profile">
            <div className="church-profile-card">
              <div className="profile-icon">
                <PiCross size={36} />
              </div>
              <h2 className="profile-title">{churchName || '교회'}</h2>
              <p className="profile-subtitle">하나님의 사랑으로 세상을 섬기는 제자 공동체</p>
              <div className="profile-badges">
                <span className="badge badge-green">운영중</span>
                <span className="badge badge-gray">설립 -</span>
              </div>
              <div className="profile-details">
                <div className="detail-row">
                  <PiMapPin size={16} className="detail-icon" />
                  <span>주소 확인 필요</span>
                </div>
                <div className="detail-row">
                  <PiPhone size={16} className="detail-icon" />
                  <span>연락처 확인 필요</span>
                </div>
                <div className="detail-row">
                  <PiUser size={16} className="detail-icon" />
                  <span>담임: 확인 필요</span>
                </div>
                <div className="detail-row">
                  <PiClock size={16} className="detail-icon" />
                  <span>주일학교: 09:00 ~ 13:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-block content-block-stats">
            <div className="stat-cards">
              <div className="stat-card">
                <span className="stat-label">전체 학생</span>
                <div className="stat-value">
                  <span className="stat-num">-</span>
                  <span className="stat-unit">명</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-label">교사</span>
                <div className="stat-value">
                  <span className="stat-num">-</span>
                  <span className="stat-unit">명</span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-block content-block-chart">
            <div className="chart-card">
              <div className="chart-header">
                <p className="chart-title">주간 출석률 추이</p>
                <span className="chart-trend">▲ 2.4%</span>
              </div>
              <div className="chart-container">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
              <p className="chart-footer">최근 4주간 평균 85% 출석</p>
            </div>
          </div>

          <div className="content-block content-block-list right-panel">
            <div className="panel-header">
              <div className="header-row header-row-top">
                <div className="breadcrumbs">
                  <span className="breadcrumb-link" onClick={() => navigate('/rollbook')}>교회 목록</span>
                  <span style={{ color: '#9ca3af' }}>/</span>
                  <span className="breadcrumb-current">{churchName || '교회'}</span>
                </div>
                {isChurchLoggedIn && (
                  <div className="header-btns">
                    <span style={{ fontSize: 16, color: '#000', marginRight: 8, fontWeight: 600 }}>{churchLeader?.leaderName}님</span>
                    <button
                      type="button"
                      className="rb-btn"
                      onClick={() => refreshDepartments()}
                      title="새로고침"
                    >
                      <PiArrowsClockwise size={16} /> 새로고침
                    </button>
                    <button
                      type="button"
                      className="rb-btn"
                      onClick={() => {
                        setIsChurchLoggedIn(false);
                        setChurchLeader(null);
                        sessionStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
                        localStorage.removeItem(ROLLBOOK_CHURCH_AUTO_KEY);
                      }}
                    >
                      로그아웃
                    </button>
                    {canAccessDeptManage && (
                      <button
                        type="button"
                        className="rb-btn rb-btn-primary"
                        onClick={openDepartmentManage}
                      >
                        <PiPlus size={16} /> 부서 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isChurchLoggedIn ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>사용자 로그인</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>부서를 선택하고, 등록 시 사용한 이름과 비밀번호로 로그인해주세요.</p>
                <div style={{ width: 320, maxWidth: '100%', margin: '0 auto 16px', boxSizing: 'border-box' }}>
                  <select
                    value={churchLoginDeptId === '' ? '' : churchLoginDeptId}
                    onChange={(e) => setChurchLoginDeptId(e.target.value === '' ? '' : (e.target.value === '0' ? 0 : Number(e.target.value)))}
                    style={{ width: '100%', minWidth: 0, padding: 12, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="">부서 선택</option>
                    <option value="0">관리자</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={churchLoginName}
                    onChange={(e) => setChurchLoginName(e.target.value)}
                    placeholder="이름"
                    style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChurchLogin(); }}
                  />
                  <input
                    type="password"
                    value={churchLoginPw}
                    onChange={(e) => setChurchLoginPw(e.target.value)}
                    placeholder="비밀번호 (4자리)"
                    style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChurchLogin(); }}
                  />
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="churchAutoLogin"
                      checked={churchLoginAutoLogin}
                      onChange={(e) => setChurchLoginAutoLogin(e.target.checked)}
                    />
                    <label htmlFor="churchAutoLogin" style={{ fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>자동로그인</label>
                  </div>
                  <button
                    onClick={handleChurchLogin}
                    disabled={churchLoginSubmitting}
                    style={{ width: '100%', padding: 12, background: churchLoginSubmitting ? '#9ca3af' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: churchLoginSubmitting ? 'not-allowed' : 'pointer', boxSizing: 'border-box' }}
                  >
                    {churchLoginSubmitting ? '로그인 중...' : '로그인'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLeaderModalOpen(true)}
                    style={{ width: '100%', marginTop: 12, padding: 10, background: 'transparent', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500, boxSizing: 'border-box' }}
                  >
                    사용자 등록
                  </button>
                </div>
              </div>
            ) : (
              <>
                {churchLeader && churchLeader.isApproved === false && (
                  <div style={{ padding: '16px 24px', marginBottom: 0, background: '#fef3c7', borderBottom: '1px solid #fcd34d', fontSize: 14, color: '#92400e' }}>
                    승인 대기 중입니다. 부서 담당자 승인 후 부서에 진입할 수 있습니다.
                  </div>
                )}
                <div className="list-header">
                  <div>부서명 / 담당자</div>
                  <div style={{ textAlign: 'center' }}>반 개수</div>
                  <div style={{ textAlign: 'center' }}>재적 / 출석</div>
                  <div className="col-progress" style={{ paddingLeft: 16 }}>지난주 출석률</div>
                  <div className="col-action" style={{ textAlign: 'center' }}>관리</div>
                </div>
                <div className="list-content">
                  {departments.length > 0 ? (
                    departments.map((item, index) => {
                      const canEnter = churchLeader ? churchLeader.deptIds.includes(item.id) : false;
                      const { iconInfo, groupCount, enrollment, attendance, rate, isExcellent, isAttention } = getDeptDisplayData(item, index);
                      const DeptIcon = iconInfo.Icon;
                      const rowClass = [
                        'list-row',
                        isExcellent ? 'row-excellent' : '',
                        isAttention ? 'row-attention' : '',
                        !canEnter ? 'row-disabled' : '',
                      ].filter(Boolean).join(' ');
                      return (
                        <div
                          key={item.id || index}
                          className={rowClass}
                          onClick={() => canEnter && handleDeptClick(item)}
                          style={{ cursor: canEnter ? 'pointer' : 'default' }}
                        >
                            <div className="dept-cell">
                              <div className={`dept-icon ${iconInfo.class}`}>
                                <DeptIcon size={20} />
                              </div>
                              <div className="dept-info">
                                <div className="dept-name">
                                  {item.name}
                                  {canEnter && <span className="dept-badge-enter">진입 가능</span>}
                                </div>
                                <div className="dept-chief">담당: {item.chief_name || '-'}</div>
                              </div>
                            </div>
                            <div className="group-count-cell">
                              <span className="group-badge">{groupCount}개 반</span>
                            </div>
                            <div className="enrollment-cell">
                              {enrollment > 0 ? (
                                <>{enrollment} / <span className={rate >= 80 ? 'attendance-high' : rate >= 70 ? 'attendance-warn' : 'attendance-low'}>{attendance}</span></>
                              ) : (
                                <>- / <span className="attendance-high">-</span></>
                              )}
                            </div>
                            <div className="col-progress progress-cell">
                              <div className={`progress-label ${isExcellent ? 'rate-excellent' : ''} ${isAttention ? 'rate-attention' : ''}`}>
                                <span className="rate">{rate > 0 ? `${rate}%` : '-'}</span>
                                <span className="goal">{isExcellent ? '우수 부서' : isAttention ? '관심 필요' : '목표 80%'}</span>
                              </div>
                              <div className="progress-bg">
                                <div
                                  className={`progress-bar ${rate >= 85 ? 'bar-green' : rate >= 80 ? 'bar-teal' : rate >= 70 ? 'bar-yellow' : 'bar-orange'}`}
                                  style={{ width: `${Math.min(rate, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="col-action action-cell">
                              {canEnter ? (
                                <button
                                  type="button"
                                  className={`action-btn ${isExcellent ? 'btn-indigo' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleDeptClick(item); }}
                                  title="부서로 이동"
                                >
                                  <PiCaretRight size={16} />
                                </button>
                              ) : (
                                <span className="dept-no-access" style={{ fontSize: 12, color: '#9ca3af' }}>진입 불가</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                      등록된 부서가 없습니다.
                    </div>
                  )}
                </div>
                <div className="list-footer">
                  <p className="footer-info">
                    총 {departments.length}개 부서 중 진입 가능 {churchLeader?.deptIds.length ?? 0}개
                  </p>
                  <div className="footer-pagination">
                    <button type="button" className="page-btn active">1</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rb-bottom-nav">
          <button type="button" className="rb-nav-btn" onClick={() => setIsLeaderModalOpen(true)}>
            사용자 등록
          </button>
          {isChurchLoggedIn && (
            <button type="button" className="rb-nav-btn" onClick={openMyPageModal}>
              <IoMdPerson size={18} /> 마이페이지
            </button>
          )}
          {canAccessDeptManage && (
            <button type="button" className="rb-nav-btn" onClick={openDepartmentManage}>
              부서관리
            </button>
          )}
          <button
            type="button"
            className="rb-nav-btn rb-nav-primary"
            onClick={() => {}}
          >
            전체통계
          </button>
        </div>
      </div>

      {mounted && adminPassModalOpen && churchId && (
        <div className="rb-modal-overlay" onClick={() => !adminPassSubmitting && (setAdminPassModalOpen(false), setAdminPassInput(''))}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>운영 비밀번호</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>부서관리를 위해 운영 비밀번호를 입력해주세요.</p>
            <div className="rb-form-group">
              <input
                type="password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="운영 비밀번호"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdminPassVerify(); }}
              />
            </div>
            <button
              onClick={handleAdminPassVerify}
              disabled={adminPassSubmitting}
              style={{ width: '100%', padding: 12, background: adminPassSubmitting ? '#9ca3af' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: adminPassSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {adminPassSubmitting ? '확인 중...' : '확인'}
            </button>
            <button
              type="button"
              onClick={() => !adminPassSubmitting && (setAdminPassModalOpen(false), setAdminPassInput(''))}
              style={{ width: '100%', marginTop: 12, padding: 10, background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {mounted && isViewDepartmentManageModal && churchId && churchLeader && (
        <DepartmentManageModal
          churchId={churchId}
          callerLeaderId={churchLeader.leaderId}
          canAssignOperator={canAccessDeptManage}
          isOpen={isViewDepartmentManageModal}
          onClose={() => setIsViewDepartmentManageModal(false)}
          onRefresh={refreshDepartments}
        />
      )}

      {mounted && isMyPageModalOpen && isChurchLoggedIn && (
        <div className="rb-modal-overlay" onClick={closeMyPageModal}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            {myPageMode === 'menu' ? (
              <>
                <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>마이페이지</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button type="button" onClick={() => setMyPageMode('change_password')}
                    style={{ width: '100%', padding: 14, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 500 }}>
                    비번 변경
                  </button>
                  <button type="button" onClick={() => setMyPageMode('withdraw')}
                    style={{ width: '100%', padding: 14, background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 500 }}>
                    사용자 탈퇴하기
                  </button>
                  <button type="button" onClick={closeMyPageModal}
                    style={{ width: '100%', marginTop: 8, padding: 12, background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                    닫기
                  </button>
                </div>
              </>
            ) : myPageMode === 'change_password' ? (
              <>
                <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>비번 변경</h2>
                <div className="rb-form-group">
                  <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="현재 비밀번호" />
                </div>
                <div className="rb-form-group">
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 (4자리)" maxLength={4} />
                </div>
                <div className="rb-form-group">
                  <input type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} placeholder="새 비밀번호 확인" maxLength={4} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setMyPageMode('menu')} disabled={myPageSubmitting}
                    style={{ flex: 1, padding: 12, background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>취소</button>
                  <button type="button" onClick={handleChangePassword} disabled={myPageSubmitting}
                    style={{ flex: 1, padding: 12, background: myPageSubmitting ? '#9ca3af' : '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                    {myPageSubmitting ? '처리 중...' : '변경'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, textAlign: 'center', color: '#dc2626' }}>사용자 탈퇴하기</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>탈퇴 시 모든 권한이 해제됩니다.</p>
                <div className="rb-form-group">
                  <input type="password" value={withdrawPw} onChange={(e) => setWithdrawPw(e.target.value)} placeholder="비밀번호 확인" />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setMyPageMode('menu')} disabled={myPageSubmitting}
                    style={{ flex: 1, padding: 12, background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>취소</button>
                  <button type="button" onClick={handleWithdraw} disabled={myPageSubmitting}
                    style={{ flex: 1, padding: 12, background: myPageSubmitting ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                    {myPageSubmitting ? '처리 중...' : '탈퇴'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mounted && isLeaderModalOpen && churchId && (
        <div className="rb-modal-overlay" onClick={() => !isLeaderSubmitting && setIsLeaderModalOpen(false)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>리더/교사 등록</h2>
              <button type="button" onClick={() => !isLeaderSubmitting && setIsLeaderModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div className="rb-form-group">
              <label>부서</label>
              <select
                value={selectedDeptIdForLeader === '' ? '' : selectedDeptIdForLeader}
                onChange={(e) => setSelectedDeptIdForLeader(e.target.value === '' ? '' : (e.target.value === '0' ? 0 : Number(e.target.value)))}
              >
                <option value="">선택하세요</option>
                <option value="0">관리자</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            {selectedDeptIdForLeader === 0 && canAccessDeptManage && (
              <div className="rb-form-group">
                <label>관리자 권한</label>
                <select
                  value={adminAuthLevelForRegister}
                  onChange={(e) => setAdminAuthLevelForRegister(e.target.value === '0' ? 0 : 1)}
                >
                  <option value={0}>전체관리자</option>
                  <option value={1}>전체운영자</option>
                </select>
              </div>
            )}
            <div className="rb-form-group">
              <label>이름</label>
              <input type="text" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="이름" />
            </div>
            <div className="rb-form-group">
              <label>비밀번호 (4자리)</label>
              <input type="password" value={leaderPw} onChange={(e) => setLeaderPw(e.target.value)} placeholder="4자리" maxLength={4} />
            </div>
            <div className="rb-form-group">
              <label>비밀번호 확인 (4자리)</label>
              <input type="password" value={leaderPwConfirm} onChange={(e) => setLeaderPwConfirm(e.target.value)} placeholder="4자리 다시 입력" maxLength={4} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" onClick={() => !isLeaderSubmitting && setIsLeaderModalOpen(false)} style={{ padding: '10px 20px', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>취소</button>
              <button type="button" onClick={handleRegisterLeader} disabled={isLeaderSubmitting} style={{ padding: '10px 24px', background: isLeaderSubmitting ? '#9ca3af' : '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: isLeaderSubmitting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {isLeaderSubmitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
