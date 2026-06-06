import React, { useEffect, useState } from 'react';
import '../scss/RollbookDepartment.scss';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import SmallgroupManageModal from './SmallgroupManageModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  PiChurchBold,
  PiTree,
  PiUser,
  PiMapPin,
  PiClock,
  PiMegaphone,
  PiQrCode,
  PiPlus,
  PiList,
  PiSquaresFour,
  PiArrowLeft,
} from 'react-icons/pi';
import { IoMdCheckmark } from 'react-icons/io';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);

const ROLLBOOK_LEADER_TOKEN_KEY = 'rollbook_leader_token';
const ROLLBOOK_LEADER_DEPT_KEY = 'rollbook_leader_dept';
const ROLLBOOK_LEADER_ID_KEY = 'rollbook_leader_id';
const ROLLBOOK_LEADER_IS_CHIEF_KEY = 'rollbook_leader_is_chief';
const ROLLBOOK_LEADER_NAME_KEY = 'rollbook_leader_name';
const ROLLBOOK_LEADER_AUTHLEVEL_KEY = 'rollbook_leader_authlevel';

interface GroupItem {
  id: number;
  church_id?: number;
  dept_id?: number;
  name: string;
  teacher?: string;
  leader_id?: number | null;
}

interface TeacherItem {
  id: number;
  name: string;
  is_approved: number;
  group_name?: string;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      display: false,
      stacked: true,
    },
  },
};

const chartData = {
  labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
  datasets: [
    {
      label: '출석',
      data: [155, 160, 165, 158, 162, 170],
      backgroundColor: '#4F46E5',
      borderRadius: 4,
      barThickness: 12,
    },
    {
      label: '결석',
      data: [25, 20, 15, 22, 18, 10],
      backgroundColor: '#E2E8F0',
      borderRadius: 4,
      barThickness: 12,
    },
  ],
};

export default function RollbookDepartment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const churchId = searchParams.get('church_id') || '';
  const departmentId = searchParams.get('department_id') || '';
  const churchName = searchParams.get('churchName') || '';
  const departmentNameParam = searchParams.get('departmentName') || '';
  const departmentName = departmentNameParam ? decodeURIComponent(departmentNameParam) : '부서';
  const groupSortParam = searchParams.get('groupSort') || '';
  const leaderSortParam = searchParams.get('leaderSort') || '';
  const studentSortParam = searchParams.get('studentSort') || '';

  const [isLogin, setIsLogin] = useState(false);
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [isDeptChief, setIsDeptChief] = useState(false);
  const [authlevel, setAuthlevel] = useState<number>(5);
  const [leaderName, setLeaderName] = useState('');
  const [leaderPw, setLeaderPw] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [groupList, setGroupList] = useState<GroupItem[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'students' | 'teachers'>('list');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [deptChiefName, setDeptChiefName] = useState('');
  const [groupSort, setGroupSort] = useState('소그룹');
  const [leaderSort, setLeaderSort] = useState('교사');
  const [studentSort, setStudentSort] = useState('학생');
  const [teacherList, setTeacherList] = useState<TeacherItem[]>([]);
  const [teacherListLoading, setTeacherListLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchGroupList = async () => {
    if (!churchId || !departmentId) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookgroup/getgrouplist`, {
        churchId,
        deptId: departmentId,
      });
      if (Array.isArray(res.data)) {
        setGroupList(res.data);
      } else {
        setGroupList([]);
      }
    } catch (error) {
      console.error('소그룹 목록 조회 실패:', error);
      setGroupList([]);
    }
  };

  const fetchTeacherList = async () => {
    if (!departmentId) return;
    setTeacherListLoading(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/getteachersbydept`, { deptId: departmentId });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTeacherList(res.data.data);
      } else {
        setTeacherList([]);
      }
    } catch (error) {
      console.error('교사 목록 조회 실패:', error);
      setTeacherList([]);
    } finally {
      setTeacherListLoading(false);
    }
  };

  const handleApproveTeacher = async (teacherId: number) => {
    if (!departmentId || !leaderId || approvingId) return;
    setApprovingId(teacherId);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/approveleader`, {
        leaderId: teacherId,
        deptId: departmentId,
        callerLeaderId: leaderId,
      });
      if (res.data?.success) {
        alert(res.data.message);
        fetchTeacherList();
      } else {
        alert(res.data?.error || '승인에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '승인에 실패했습니다.');
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && departmentId) {
      const token = sessionStorage.getItem(ROLLBOOK_LEADER_TOKEN_KEY);
      const savedDept = sessionStorage.getItem(ROLLBOOK_LEADER_DEPT_KEY);
      const savedLeaderId = sessionStorage.getItem(ROLLBOOK_LEADER_ID_KEY);
      const savedIsChief = sessionStorage.getItem(ROLLBOOK_LEADER_IS_CHIEF_KEY);
      const savedLeaderName = sessionStorage.getItem(ROLLBOOK_LEADER_NAME_KEY);
      const savedAuthlevel = sessionStorage.getItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY);
      if (token && savedDept === departmentId) {
        setIsLogin(true);
        if (savedLeaderId) setLeaderId(parseInt(savedLeaderId, 10));
        setIsDeptChief(savedIsChief === 'true');
        if (savedLeaderName) setLeaderName(savedLeaderName);
        const al = savedAuthlevel != null ? parseInt(savedAuthlevel, 10) : 5;
        setAuthlevel(isNaN(al) ? 5 : Math.min(5, Math.max(0, al)));
      }
    }
  }, [departmentId]);

  useEffect(() => {
    fetchGroupList();
    if (churchId) sessionStorage.setItem('churchId', churchId);
    if (departmentId) sessionStorage.setItem('department_id', departmentId);
    if (departmentNameParam) sessionStorage.setItem('department', decodeURIComponent(departmentNameParam));
  }, [churchId, departmentId, departmentNameParam]);

  useEffect(() => {
    if (activeTab === 'teachers' && departmentId) fetchTeacherList();
  }, [activeTab, departmentId]);

  useEffect(() => {
    if (groupSortParam) setGroupSort(decodeURIComponent(groupSortParam));
    if (leaderSortParam) setLeaderSort(decodeURIComponent(leaderSortParam));
    if (studentSortParam) setStudentSort(decodeURIComponent(studentSortParam));
  }, [groupSortParam, leaderSortParam, studentSortParam]);

  useEffect(() => {
    if (!churchId || !departmentId) return;
    const fetchDeptInfo = async () => {
      try {
        const res = await axios.post(`${MainURL}/rollbookdepart/getdepartments`, {
          church_id: parseInt(churchId, 10),
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          const dept = res.data.data.find((d: { id: number }) => String(d.id) === String(departmentId));
          if (dept) {
            if (isLogin) setDeptChiefName(dept.chief_name ?? '');
            if (!groupSortParam && dept.group_sort) setGroupSort(dept.group_sort);
            if (!leaderSortParam && dept.leader_sort) setLeaderSort(dept.leader_sort);
            if (!studentSortParam && dept.student_sort) setStudentSort(dept.student_sort);
          }
        }
      } catch {
        if (isLogin) setDeptChiefName('');
      }
    };
    fetchDeptInfo();
  }, [churchId, departmentId, isLogin, groupSortParam, leaderSortParam, studentSortParam]);

  const handleLeaderLogin = async () => {
    if (!leaderName.trim() || !leaderPw) {
      alert('이름과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/loginbyname`, {
        deptId: departmentId,
        name: leaderName.trim(),
        password: leaderPw,
      });
      if (res.data?.success) {
        const id = res.data.leaderId;
        const chief = res.data.isChief === true;
        const name = res.data.leaderName ?? leaderName.trim();
        const al = res.data.authlevel != null ? Math.min(5, Math.max(0, parseInt(String(res.data.authlevel), 10))) : 5;
        if (id != null) {
          setLeaderId(id);
          if (autoLogin) sessionStorage.setItem(ROLLBOOK_LEADER_ID_KEY, String(id));
        }
        setLeaderName(name);
        setIsDeptChief(chief);
        setAuthlevel(al);
        if (autoLogin) {
          sessionStorage.setItem(ROLLBOOK_LEADER_IS_CHIEF_KEY, String(chief));
          sessionStorage.setItem(ROLLBOOK_LEADER_NAME_KEY, name);
          sessionStorage.setItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY, String(al));
        }
        if (autoLogin && res.data.token) {
          sessionStorage.setItem(ROLLBOOK_LEADER_TOKEN_KEY, res.data.token);
          sessionStorage.setItem(ROLLBOOK_LEADER_DEPT_KEY, String(departmentId));
        }
        sessionStorage.setItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY, String(al));
        setIsLogin(true);
      } else {
        alert(res.data?.error || '이름 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '로그인에 실패했습니다.');
    }
  };

  const canManageGroup = authlevel === 2;
  const canAccessAllGroups = authlevel === 2 || authlevel === 3;

  const handleGroupClick = (item: GroupItem) => {
    const isAssignedLeader = leaderId != null && item.leader_id != null && Number(leaderId) === Number(item.leader_id);
    const canEnter = canAccessAllGroups || isAssignedLeader;
    if (!canEnter) {
      alert(`담당자만 해당 ${groupSort}에 진입할 수 있습니다.`);
      return;
    }
    window.scrollTo(0, 0);
    sessionStorage.setItem('churchId', String(churchId));
    sessionStorage.setItem('departmentDetail', JSON.stringify(item));
    sessionStorage.setItem('departmentGroupSort', groupSort);
    sessionStorage.setItem('departmentLeaderSort', leaderSort);
    sessionStorage.setItem('departmentStudentSort', studentSort);
    sessionStorage.setItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY, String(authlevel));
    navigate(
      `/rollbook/group?church_id=${churchId}&department_id=${departmentId}&group_id=${item.id}&churchName=${encodeURIComponent(churchName)}&groupSort=${encodeURIComponent(groupSort)}&leaderSort=${encodeURIComponent(leaderSort)}&studentSort=${encodeURIComponent(studentSort)}`
    );
  };

  if (!isLogin) {
    return (
      <div className="RollbookDepartmentPage">
        <div className="slide-container">
          <header className="rb-header">
            <div className="rb-header-left">
              <div className="rb-logo"><PiChurchBold size={18} /></div>
              <p className="rb-header-title">주일학교 출석부</p>
              <div className="rb-header-divider" />
              <p className="rb-header-sub">관리자 대시보드</p>
            </div>
          </header>
          <div className="rb-login-wrap">
            <div className="rb-login-card">
              <h2 className="rb-login-title">{leaderSort} 로그인</h2>
              <p className="rb-login-sub">{departmentName}</p>
              <div className="rb-form-group">
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="이름"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLeaderLogin(); }}
                />
              </div>
              <div className="rb-form-group">
                <input
                  type="password"
                  value={leaderPw}
                  onChange={(e) => setLeaderPw(e.target.value)}
                  placeholder="비밀번호"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLeaderLogin(); }}
                />
              </div>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="autoLogin" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
                <label htmlFor="autoLogin" style={{ fontSize: 14, cursor: 'pointer' }}>자동 로그인</label>
              </div>
              <button type="button" className="rb-login-submit" onClick={handleLeaderLogin}>로그인</button>
            </div>
            <button
              type="button"
              className="rb-nav-btn"
              onClick={() => navigate(-1)}
              style={{ marginTop: 24 }}
            >
              <PiArrowLeft size={18} /> 뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="RollbookDepartmentPage">
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
            <div className="profile-card">
              <div className="profile-icon">
                <PiTree size={36} />
              </div>
              <h2 className="profile-title">{departmentName}</h2>
              <p className="profile-subtitle">예수님의 성품을 닮아가는 어린이</p>
              <div className="profile-badges">
                <span className="badge badge-indigo">우수 부서</span>
                <span className="badge badge-gray">{groupSort} {groupList.length}개</span>
              </div>
              <div className="profile-details">
                <div className="detail-row">
                  <PiUser size={16} className="detail-icon" />
                  <span>담당: 확인 필요</span>
                </div>
                <div className="detail-row">
                  <PiMapPin size={16} className="detail-icon" />
                  <span>장소: 확인 필요</span>
                </div>
                <div className="detail-row">
                  <PiClock size={16} className="detail-icon" />
                  <span>주일 오전 11:00</span>
                </div>
                <div className="detail-row">
                  <PiMegaphone size={16} className="detail-icon" />
                  <span>공지사항 없음</span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-block content-block-stats">
            <div className="stat-cards">
              <div className="stat-card">
                <span className="stat-label">총 {studentSort}수</span>
                <div className="stat-value">
                  <span className="stat-num">-</span>
                  <span className="stat-unit">명</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-label">{groupSort} 개수</span>
                <div className="stat-value">
                  <span className="stat-num">{groupList.length}</span>
                  <span className="stat-unit">개</span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-block content-block-chart">
            <div className="chart-card">
              <p className="chart-title">월별 출석률</p>
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="content-block content-block-list right-panel">
            <div className="panel-header">
              <div className="header-row header-row-top">
                <div className="breadcrumbs">
                  <span className="breadcrumb-link" onClick={() => navigate(-1)}>{churchName || '교회'}</span>
                  <span style={{ color: '#9ca3af' }}>/</span>
                  <span className="breadcrumb-current">{departmentName}</span>
                </div>
                <div className="header-btns">
                  {/* <button type="button" className="rb-btn">
                    <PiQrCode size={16} /> 전체 QR
                  </button> */}
                  {canManageGroup && (
                    <button
                      type="button"
                      className="rb-btn rb-btn-primary"
                      onClick={() => setIsGroupModalOpen(true)}
                    >
                      <PiPlus size={16} /> {groupSort} 추가
                    </button>
                  )}
                </div>
              </div>
              <div className="header-row header-row-bottom">
                <div className="rb-tabs">
                  <button
                    type="button"
                    className={`tab ${activeTab === 'list' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('list')}
                  >
                    {groupSort} 목록 <span className="tab-count">{groupList.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`tab ${activeTab === 'students' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('students')}
                  >
                    전체 {studentSort}
                  </button>
                    <button
                      type="button"
                      className={`tab ${activeTab === 'teachers' ? 'tab-active' : ''}`}
                      onClick={() => setActiveTab('teachers')}
                    >
                    {leaderSort}
                  </button>
                </div>
                {activeTab === 'list' && (
                  <div className="header-filters">
                    <select
                      className="filter-select"
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                    >
                      <option value="all">전체 학년</option>
                      <option value="4">4학년</option>
                      <option value="5">5학년</option>
                      <option value="6">6학년</option>
                    </select>
                    <div className="view-toggle">
                      <button
                        type="button"
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="목록 보기"
                      >
                        <PiList size={14} />
                      </button>
                      <button
                        type="button"
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="그리드 보기"
                      >
                        <PiSquaresFour size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'list' && (
              <>
                <div className="list-header">
                  <div>{groupSort} 이름 / 담당 {leaderSort}</div>
                  <div style={{ textAlign: 'center' }}>학년 / 구분</div>
                  <div style={{ textAlign: 'center' }}>재적 / 출석</div>
                  <div className="col-trend" style={{ textAlign: 'center' }}>최근 4주 추이</div>
                  <div className="col-action" style={{ textAlign: 'center' }}>액션</div>
                </div>
                <div className="list-content">
                  {groupList.map((item, index) => {
                    const isAssignedLeader = leaderId != null && item.leader_id != null && Number(leaderId) === Number(item.leader_id);
                    const canEnter = canAccessAllGroups || isAssignedLeader;
                    const badgeClass = index % 2 === 0 ? 'badge-blue' : 'badge-pink';
                    const shortName = item.name.replace(/[^0-9-]/g, '').slice(0, 4) || item.name.slice(0, 2);
                    return (
                      <div
                        key={item.id || index}
                        className={`list-row ${!canEnter ? 'row-alert' : ''}`}
                        onClick={() => handleGroupClick(item)}
                      >
                        <div className="group-cell">
                          <div className={`group-badge ${badgeClass}`}>{shortName || '-'}</div>
                          <div className="group-info">
                            <div className="group-name">{item.name}</div>
                            <div className="group-teacher">
                              <PiUser size={14} style={{ color: '#9ca3af' }} />
                              {item.teacher || '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span className="grade-badge badge-normal">-</span>
                        </div>
                        <div className="attendance-cell">
                          - / <span className="attendance-high">-</span>
                        </div>
                        <div className="col-trend sparkline-cell">
                          <div className="sparkline-placeholder" />
                        </div>
                        <div className="col-action action-cell">
                          {canEnter ? (
                            <>
                              <button type="button" className="action-btn" title="출석 체크" onClick={(e) => { e.stopPropagation(); handleGroupClick(item); }}>
                                <IoMdCheckmark size={14} />
                              </button>
                            </>
                          ) : (
                            <button type="button" className="action-btn btn-alert" title="관리 필요">
                              !
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="list-footer">
                  <p className="footer-info">총 {groupList.length}개 반 중 1-{Math.min(groupList.length, 7)} 표시</p>
                  <div className="footer-pagination">
                    <button type="button" className="page-btn active">1</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'students' && (
              <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>전체 {studentSort} 목록 (준비 중)</div>
            )}

            {activeTab === 'teachers' && (
              <>
                <div className="list-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 120px' }}>
                  <div>이름</div>
                  <div style={{ textAlign: 'center' }}>담당 {groupSort}</div>
                  <div style={{ textAlign: 'center' }}>승인 상태</div>
                  <div className="col-action" style={{ textAlign: 'center' }}>액션</div>
                </div>
                <div className="list-content">
                  {teacherListLoading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>로딩 중...</div>
                  ) : teacherList.length > 0 ? (
                    teacherList.map((t) => (
                      <div key={t.id} className="list-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 120px' }}>
                        <div className="group-cell">
                          <PiUser size={18} style={{ color: '#9ca3af', marginRight: 8 }} />
                          <span style={{ fontWeight: 600 }}>{t.name}</span>
                        </div>
                        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6b7280' }}>
                          {t.group_name || '-'}
                        </div>
                        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className={t.is_approved === 1 ? 'badge badge-green' : 'badge badge-yellow'} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            {t.is_approved === 1 ? '승인됨' : '승인 대기'}
                          </span>
                        </div>
                        <div className="col-action action-cell" style={{ justifyContent: 'center' }}>
                          {t.is_approved !== 1 && canManageGroup && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleApproveTeacher(t.id)}
                              disabled={approvingId === t.id}
                              title="승인"
                              style={{ background: approvingId === t.id ? '#9ca3af' : '#22c55e', color: '#fff', border: 'none', padding: '10px 24px', minWidth: 80 }}
                            >
                              {approvingId === t.id ? '...' : '승인'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>등록된 {leaderSort}가 없습니다.</div>
                  )}
                </div>
                <div className="list-footer">
                  <p className="footer-info">총 {teacherList.length}명 {leaderSort}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rb-bottom-nav">
          <button type="button" className="rb-nav-btn" onClick={() => navigate(-1)}>
            <PiArrowLeft size={18} /> 뒤로가기
          </button>
          {canManageGroup && (
            <button type="button" className="rb-nav-btn" onClick={() => setIsGroupModalOpen(true)}>
              {groupSort}관리
            </button>
          )}
          <button
            type="button"
            className="rb-nav-btn rb-nav-primary"
            onClick={() => {
              // window.scrollTo(0, 0);
              // navigate('/rollbook/departstate');
            }}
          >
            통계
          </button>
        </div>
      </div>

      {isGroupModalOpen && churchId && departmentId && (
            <SmallgroupManageModal
              isOpen={isGroupModalOpen}
              onClose={() => setIsGroupModalOpen(false)}
              churchId={churchId}
              departmentId={departmentId}
              groupSort={groupSort}
              leaderSort={leaderSort}
              studentSort={studentSort}
              onRefresh={fetchGroupList}
            />
      )}

    </div>
  );
}
