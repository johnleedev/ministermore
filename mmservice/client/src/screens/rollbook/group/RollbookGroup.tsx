import React, { useEffect, useState } from 'react';
import '../scss/RollbookPresents.scss';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import { getYear } from 'date-fns';
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoMdCheckmark,
  IoMdClose,
  IoMdTime,
  IoMdPeople,
  IoMdPrint,
  IoMdSave,
  IoMdCall,
} from 'react-icons/io';
import { PiChurchBold, PiCaretDown, PiCaretUp } from 'react-icons/pi';
import presentImg from '../../../images/rollbook/present.png';
import absentImg from '../../../images/rollbook/absent.png';

interface PresentEntry {
  day: string;
  present: boolean | string;
}

interface PersonalItem {
  id: number;
  name: string;
  birth_date?: string | null;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  school?: string;
  phone?: string | null;
}

interface PersonalItemWithPresents extends PersonalItem {
  presents2025?: PresentEntry[];
}

const ROLLBOOK_LEADER_AUTHLEVEL_KEY = 'rollbook_leader_authlevel';

const AVATAR_CLASSES = [
  'avatar-indigo',
  'avatar-pink',
  'avatar-blue',
  'avatar-purple',
  'avatar-yellow',
  'avatar-green',
  'avatar-gray',
];

export default function RollbookGroup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const churchId = searchParams.get('church_id') || '';
  const departmentId = searchParams.get('department_id') || '';
  const groupId = searchParams.get('group_id') || '';
  const churchName = searchParams.get('churchName') || '';
  const groupSortParam = searchParams.get('groupSort') || '';
  const groupSort = groupSortParam ? decodeURIComponent(groupSortParam) : (typeof window !== 'undefined' ? sessionStorage.getItem('departmentGroupSort') || '소그룹' : '소그룹');
  const studentSortParam = searchParams.get('studentSort') || '';
  const studentSort = studentSortParam ? decodeURIComponent(studentSortParam) : (typeof window !== 'undefined' ? sessionStorage.getItem('departmentStudentSort') || '학생' : '학생');

  const currentDate = new Date();
  const thisyear = getYear(currentDate);
  const [currentMonth, setCurrentMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const todayFormatted = `${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}`;

  const [refresh, setRefresh] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [yearDateAll, setYearDateAll] = useState<{ day: string }[]>([]);
  const [viewYearDate, setViewYearDate] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [personalList, setPersonalList] = useState<PersonalItemWithPresents[]>([]);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [authlevel, setAuthlevel] = useState<number>(5);

  const departmentName = typeof window !== 'undefined' ? sessionStorage.getItem('department') || '' : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY);
      const al = saved != null ? parseInt(saved, 10) : 5;
      setAuthlevel(isNaN(al) ? 5 : Math.min(5, Math.max(0, al)));
    }
  }, []);

  const findCurrentMonthDate = (daysList: { day: string }[], currentMonthCopy: string) => {
    const currentMonthDaysCopy = daysList
      .map((item) => (item && item.day ? item.day : ''))
      .filter((day) => day && day.startsWith(currentMonthCopy));
    setViewYearDate(currentMonthDaysCopy);
    const nextClosest = currentMonthDaysCopy
      .filter((day) => day >= todayFormatted)
      .sort((a, b) => a.localeCompare(b))[0];
    setSelectedDate(nextClosest ?? currentMonthDaysCopy[currentMonthDaysCopy.length - 1] ?? '');
  };

  const fetchYearPosts = async () => {
    try {
      const resYear = await axios.post(`${MainURL}/rollbookattendance/getyearstate`, {
        thisyear,
      });
      if (Array.isArray(resYear.data)) {
        setYearDateAll(resYear.data);
        findCurrentMonthDate(resYear.data, currentMonth);
      }
    } catch (err) {
      console.error('연도 날짜 로드 실패:', err);
    }
  };

  const fetchPresentPosts = async () => {
    if (!churchId || !departmentId || !groupId) return;
    try {
      const resPresents = await axios.post(`${MainURL}/rollbookattendance/getpersonalpresents`, {
        churchId,
        deptId: departmentId,
        groupId,
        year: thisyear,
      });
      if (resPresents.data && Array.isArray(resPresents.data)) {
        const result = resPresents.data.map((item: PersonalItemWithPresents) => ({
          ...item,
          presents2025: typeof item.presents2025 === 'string' ? JSON.parse(item.presents2025) : (item.presents2025 || []),
        }));
        setPersonalList(result);
      } else {
        setPersonalList([]);
      }
    } catch (err) {
      console.error('출석 데이터 로드 실패:', err);
      setPersonalList([]);
    }
  };

  const loadInitialData = async () => {
    setIsDataReady(false);
    try {
      await Promise.all([fetchYearPosts(), fetchPresentPosts()]);
    } finally {
      setIsDataReady(true);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [refresh, churchId, departmentId, groupId, location.key]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && churchId && groupId) fetchPresentPosts();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && churchId && groupId) fetchPresentPosts();
    };
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [churchId, departmentId, groupId]);

  useEffect(() => {
    if (!churchId || !groupId) return;
    const timer = setTimeout(() => fetchPresentPosts(), 800);
    return () => clearTimeout(timer);
  }, [churchId, departmentId, groupId]);

  useEffect(() => {
    const detail = sessionStorage.getItem('departmentDetail');
    if (detail) {
      try {
        const parsed = JSON.parse(detail);
        if (parsed.name) setGroupName(parsed.name);
        if (parsed.teacher) setTeacherName(parsed.teacher);
      } catch {
        // ignore
      }
    }
  }, []);

  const savePresentState = async (username: string, result: PresentEntry[], prevList: PresentEntry[]) => {
    try {
      const res = await axios.post(`${MainURL}/rollbookattendance/revisepersonalpresents`, {
        churchId,
        deptId: departmentId,
        groupId,
        name: username,
        presents: JSON.stringify(result),
        year: thisyear,
      });
      if (res.data && res.data.success === false) {
        throw new Error(res.data.error);
      }
      setLastSaved(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('출석 저장 실패:', err);
      alert('출석 저장에 실패했습니다.');
      setPersonalList((prev) =>
        prev.map((p) =>
          p.name === username ? { ...p, presents2025: prevList } : p
        )
      );
    }
  };

  const updateAttendance = (item: PersonalItemWithPresents, isPresent: boolean) => {
    const prevList = Array.isArray(item.presents2025) ? [...item.presents2025] : [];
    const updatedList = [...prevList];
    const existingEntry = updatedList.find((e) => e.day === selectedDate);
    if (existingEntry) {
      existingEntry.present = isPresent;
    } else {
      updatedList.push({ day: selectedDate, present: isPresent });
    }
    setPersonalList((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, presents2025: [...updatedList] } : p
      )
    );
    setPopupMessage(isPresent ? '출석' : '결석');
    setTimeout(() => setPopupMessage(null), 500);
    savePresentState(item.name, updatedList, prevList);
  };

  const getPresentStatus = (item: PersonalItemWithPresents): 'present' | 'absent' | null => {
    const entry = item.presents2025?.find((e) => e.day === selectedDate);
    if (!entry) return null;
    const val = typeof entry.present === 'string' ? entry.present === 'true' : Boolean(entry.present);
    return val ? 'present' : 'absent';
  };

  const formatNum = (num: string) => {
    const d = num.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('010')) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return num;
  };

  const parsePhoneToContacts = (phone: string | null | undefined): { type: string; number: string }[] => {
    if (!phone || !phone.trim()) return [];
    try {
      const parsed = JSON.parse(phone);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((p: { number?: string }) => p.number)
          .map((p: { type?: string; number?: string }) => ({ type: p.type || '본인', number: p.number || '' }));
      }
    } catch {
      return [{ type: '본인', number: phone.trim() }];
    }
    return [];
  };

  const formatPhoneDisplay = (phone: string | null | undefined): string => {
    const contacts = parsePhoneToContacts(phone);
    if (contacts.length === 0) return '-';
    const parts = contacts.map((c) => `${c.type}: ${formatNum(c.number)}`);
    return parts.length >= 2 ? parts.join('\n') : parts[0];
  };

  const renderPhoneWithActions = (phone: string | null | undefined) => {
    const contacts = parsePhoneToContacts(phone);
    if (contacts.length === 0) return <span className="rb-phone-text">-</span>;
    return (
      <div className="rb-phone-list">
        {contacts.map((c, i) => (
          <div key={i} className="rb-phone-row">
            <span className="rb-phone-text">{c.type}: {formatNum(c.number)}</span>
            <div className="rb-phone-actions">
              <a href={`tel:${c.number.replace(/\D/g, '')}`} className="rb-phone-btn">전화</a>
              <a href={`sms:${c.number.replace(/\D/g, '')}`} className="rb-phone-btn">문자</a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const selectedDateDisplay = selectedDate
    ? {
        month: `${thisyear}년 ${parseInt(selectedDate.slice(0, 2), 10)}월`,
        day: `${parseInt(selectedDate.slice(2, 4), 10)}일 (주일)`,
      }
    : { month: '', day: '' };

  const stats = React.useMemo(() => {
    const total = personalList.length;
    let present = 0;
    let absent = 0;
    personalList.forEach((p) => {
      const status = getPresentStatus(p);
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
    });
    const processed = present + absent;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, late: 0, absent, processed, percent };
  }, [personalList, selectedDate]);

  const goPrevDate = () => {
    const idx = viewYearDate.indexOf(selectedDate);
    if (idx > 0) setSelectedDate(viewYearDate[idx - 1]);
    else {
      const copyMonth = parseInt(currentMonth, 10);
      if (copyMonth <= 1) {
        alert('가장 첫 달입니다.');
      } else {
        const lastMonth = String(copyMonth - 1).padStart(2, '0');
        setCurrentMonth(lastMonth);
        findCurrentMonthDate(yearDateAll, lastMonth);
      }
    }
  };

  const goNextDate = () => {
    const idx = viewYearDate.indexOf(selectedDate);
    if (idx >= 0 && idx < viewYearDate.length - 1) setSelectedDate(viewYearDate[idx + 1]);
    else {
      const copyMonth = parseInt(currentMonth, 10);
      if (copyMonth >= 12) {
        alert('가장 마지막 달입니다.');
      } else {
        const nextMonth = String(copyMonth + 1).padStart(2, '0');
        setCurrentMonth(nextMonth);
        findCurrentMonthDate(yearDateAll, nextMonth);
      }
    }
  };

  if (!isDataReady) {
    return (
      <div className="RollbookGroupPage rb-loading">
        <div style={{ textAlign: 'center' }}>
          <div className="rb-loading-spinner" />
          <div className="rb-loading-text">출석 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="RollbookGroupPage">
      {popupMessage && (
        <div className={`rb-popup ${popupMessage ? 'rb-popup-active' : ''}`}>
          <img src={popupMessage === '출석' ? presentImg : absentImg} alt={popupMessage} />
        </div>
      )}

      <div className="slide-container">
        {/* Header - HTML과 동일 */}
        <header className="rb-header">
          <div className="rb-header-left">
            <div className="rb-logo">
              <PiChurchBold size={18} />
            </div>
            <p className="rb-header-title">주일학교 출석부</p>
            <div className="rb-header-divider" />
            <p className="rb-header-sub">관리자 대시보드</p>
          </div>
        </header>

        {/* Main Content - HTML content-area 구조 */}
        <div className="content-area">
          <div className="content-block content-block-control">
          {/* Top Control Bar - HTML과 동일 */}
          <div className="rb-control-bar">
            <div className="rb-control-left">
              <div className="rb-date-picker">
                <span className="rb-date-arrow" onClick={goPrevDate} role="button" tabIndex={0}>
                  <IoIosArrowBack size={18} />
                </span>
                <div className="rb-date-inner">
                  <p className="rb-date-month">{selectedDateDisplay.month || '날짜 선택'}</p>
                  <p className="rb-date-day">{selectedDateDisplay.day || '-'}</p>
                </div>
                <span className="rb-date-arrow" onClick={goNextDate} role="button" tabIndex={0}>
                  <IoIosArrowForward size={18} />
                </span>
              </div>
              <div className="rb-class-block">
                <h1>
                  {groupName || groupSort}
                  {teacherName && <span className="rb-teacher-badge">담당: {teacherName}</span>}
                </h1>
                <p className="rb-status-line">
                  <span className="rb-status-green"><span className="rb-dot" />출석 체크 진행중</span>
                  <span className="rb-status-divider">|</span>
                  마지막 저장: {lastSaved || '-'}
                </p>
              </div>
            </div>
          </div>
          </div>

          <div className="content-block content-block-action">
            <div className="rb-action-btns">
              <button
                type="button"
                className="rb-btn-report"
                onClick={() =>
                  navigate('/rollbook/presentsstate', {
                    state: {
                      departmentDetail: { group: groupName, name: groupName },
                      churchId,
                      deptId: departmentId,
                      groupId,
                      departmentName,
                    },
                  })
                }
              >
                <IoMdPrint size={16} /> 보고서
              </button>
              {/* <button type="button" className="rb-btn-save" onClick={() => fetchPresentPosts()}>
                <IoMdSave size={16} /> 저장 완료
              </button> */}
            </div>
          </div>

          <div className="content-block content-block-stats">
          {/* Stats Overview Cards - HTML grid grid-cols-4 gap-4 */}
          <div className="rb-stats-grid">
            <div className="glass-panel rb-stat-card stat-total">
              <div>
                <p className="rb-stat-label">총 재적</p>
                <p className="rb-stat-num">
                  {stats.total}
                  <span className="rb-stat-unit">명</span>
                </p>
              </div>
              <div className="rb-stat-icon">
                <IoMdPeople size={20} />
              </div>
            </div>
            <div className="glass-panel rb-stat-card stat-present">
              <div>
                <p className="rb-stat-label">출석</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <p className="rb-stat-num">
                    {stats.present}
                    <span className="rb-stat-unit">명</span>
                  </p>
                  {stats.total > 0 && (
                    <span className="rb-stat-percent">{stats.percent}%</span>
                  )}
                </div>
              </div>
              <div className="rb-stat-icon">
                <IoMdCheckmark size={20} />
              </div>
            </div>
            <div className="glass-panel rb-stat-card stat-late">
              <div>
                <p className="rb-stat-label">지각</p>
                <p className="rb-stat-num">
                  {stats.late}
                  <span className="rb-stat-unit">명</span>
                </p>
              </div>
              <div className="rb-stat-icon">
                <IoMdTime size={20} />
              </div>
            </div>
            <div className="glass-panel rb-stat-card stat-absent">
              <div>
                <p className="rb-stat-label">결석</p>
                <p className="rb-stat-num">
                  {stats.absent}
                  <span className="rb-stat-unit">명</span>
                </p>
              </div>
              <div className="rb-stat-icon">
                <IoMdClose size={20} />
              </div>
            </div>
          </div>
          </div>

          <div className="content-block content-block-roster">
          {/* Attendance Roster Table - HTML glass-panel 구조 */}
          <div className="glass-panel rb-roster-panel">
            <div className="rb-roster-content">
            <div className="scrollbar-custom">
              {personalList.length > 0 ? (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th className="col-arrow"> </th>
                      <th className="w-16 col-no">No.</th>
                      <th className="w-64">{studentSort}명</th>
                      <th className="w-72">출석 상태</th>
                      <th className="col-birth">생년월일</th>
                      <th className="w-48 col-phone">전화번호</th>
                      <th className="col-memo">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalList.map((item, index) => {
                      const status = getPresentStatus(item);
                      const isPresent = status === 'present';
                      const isAbsent = status === 'absent';
                      const avatarClass = AVATAR_CLASSES[index % AVATAR_CLASSES.length];
                      const birthStr = [item.birthYear, item.birthMonth, item.birthDay]
                        .filter(Boolean)
                        .join('.') || '-';
                      const rowClass = '';
                      const isExpanded = expandedStudentId === item.id;
                      return (
                        <React.Fragment key={item.id || index}>
                          <tr
                            className={`${rowClass} ${isExpanded ? 'row-expanded' : ''}`}
                            onClick={() => setExpandedStudentId(isExpanded ? null : item.id)}
                          >
                            <td className="col-arrow">
                              {isExpanded ? (
                                <PiCaretUp size={20} className="rb-row-arrow" />
                              ) : (
                                <PiCaretDown size={20} className="rb-row-arrow" />
                              )}
                            </td>
                            <td className="col-no" style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, fontWeight: 500 }}>
                              {index + 1}
                            </td>
                            <td>
                              <div className="rb-student-cell">
                                <p className={`rb-student-name rb-student-name-badge ${avatarClass}`}>{item.name}</p>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="status-group">
                                <button
                                  type="button"
                                  className={`status-btn ${isPresent ? 'active-present' : ''}`}
                                  onClick={() => updateAttendance(item, true)}
                                >
                                  <IoMdCheckmark size={20} /> 출석
                                </button>
                                <button
                                  type="button"
                                  className={`status-btn ${isAbsent ? 'active-absent' : ''}`}
                                  onClick={() => updateAttendance(item, false)}
                                >
                                  <IoMdClose size={20} /> 결석
                                </button>
                              </div>
                            </td>
                            <td className="col-birth">{birthStr}</td>
                            <td className="col-phone">
                              <div className="rb-contact-cell">
                                <div className="rb-phone">
                                  <IoMdCall size={10} style={{ flexShrink: 0 }} />
                                  {renderPhoneWithActions(item.phone)}
                                </div>
                                <p className="rb-extra">{item.school || ''}</p>
                              </div>
                            </td>
                            <td className="col-memo">
                              <input
                                type="text"
                                className="rb-memo-input"
                                placeholder="특이사항 입력..."
                                readOnly
                              />
                            </td>
                          </tr>
                          <tr className={`rb-detail-row ${isExpanded ? 'rb-detail-row-visible' : ''}`}>
                            <td colSpan={7} className="rb-detail-cell">
                              <div className="rb-detail-content" onClick={(e) => e.stopPropagation()}>
                               
                                <div className="rb-detail-item">
                                  <span className="rb-detail-label">생년월일</span>
                                  <span className="rb-detail-value">{birthStr}</span>
                                </div>
                                <div className="rb-detail-item rb-detail-phone">
                                  <span className="rb-detail-label">전화번호</span>
                                  <div className="rb-detail-value rb-detail-phone-value">
                                    {renderPhoneWithActions(item.phone)}
                                  </div>
                                </div>
                                <div className="rb-detail-item">
                                  <span className="rb-detail-label">학교</span>
                                  <span className="rb-detail-value">{item.school || '-'}</span>
                                </div>
                                <div className="rb-detail-item">
                                  <span className="rb-detail-label">메모</span>
                                  <input
                                    type="text"
                                    className="rb-memo-input"
                                    placeholder="특이사항 입력..."
                                    readOnly
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="rb-empty">등록된 {studentSort}이(가) 없습니다.</div>
              )}
            </div>
            </div>

            {/* Bottom Action Footer - HTML과 동일 */}
            <div className="rb-table-footer">
              <div className="rb-footer-summary">
                <p>
                  <strong>{stats.total}명</strong> 중 <strong className="rb-indigo">{stats.processed}명</strong> 처리 완료
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span><span className="rb-dot rb-dot-green" /> 출석 {stats.present}</span>
                  <span><span className="rb-dot rb-dot-yellow" /> 지각 {stats.late}</span>
                  <span><span className="rb-dot rb-dot-red" /> 결석 {stats.absent}</span>
                </div>
              </div>
              <div className="rb-footer-btns">
                <button type="button">일괄 출석 처리</button>
                <button type="button">선택 {studentSort} 문자 발송</button>
              </div>
            </div>
          </div>
          </div>

          {/* Bottom Nav */}
          <div className="rb-group-bottom-nav">
            <button type="button" className="rb-group-nav-btn" onClick={() => navigate(-1)}>
              <IoIosArrowBack size={16} /> 뒤로가기
            </button>
            {authlevel === 4 && (
              <button
                type="button"
                className="rb-group-nav-btn"
                onClick={() =>
                  navigate('/rollbook/groupadmin', {
                    state: {
                      church_id: churchId,
                      department_id: departmentId,
                      group_id: groupId,
                      churchName,
                      groupName,
                      groupSort,
                      studentSort,
                    },
                  })
                }
              >
                관리
              </button>
            )}
            <button
              type="button"
              className="rb-group-nav-btn rb-group-nav-primary"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate('/rollbook/presentsstate', {
                  state: {
                    departmentDetail: { group: groupName, name: groupName },
                    churchId,
                    deptId: departmentId,
                    groupId,
                    departmentName,
                  },
                });
              }}
            >
              출석현황
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
