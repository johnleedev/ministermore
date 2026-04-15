import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import '../scss/RollbookPresents.scss';
import { IoIosArrowBack, IoMdPersonAdd, IoMdCreate, IoMdTrash } from 'react-icons/io';
import { PiChurchBold } from 'react-icons/pi';

const ROLLBOOK_LEADER_AUTHLEVEL_KEY = 'rollbook_leader_authlevel';

interface ContactItem {
  type: string;
  number: string;
}

interface StudentItem {
  id: number;
  name: string;
  birth_date?: string | null;
  school?: string | null;
  phone?: string | null;
}

const PHONE_TYPE_OPTIONS = ['본인', '부', '모', '기타'];

const AVATAR_CLASSES = [
  'avatar-indigo',
  'avatar-pink',
  'avatar-blue',
  'avatar-purple',
  'avatar-yellow',
  'avatar-green',
  'avatar-gray',
];

export default function RollbookGroupAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    church_id?: string;
    department_id?: string;
    group_id?: string;
    churchName?: string;
    groupName?: string;
    groupSort?: string;
    studentSort?: string;
  } | null;

  const churchId = state?.church_id || '';
  const departmentId = state?.department_id || '';
  const groupId = state?.group_id || '';
  const churchName = state?.churchName || '';
  const [groupName, setGroupName] = useState(state?.groupName || '');
  const groupSort = state?.groupSort || (typeof window !== 'undefined' ? sessionStorage.getItem('departmentGroupSort') || '소그룹' : '소그룹');
  const studentSort = state?.studentSort || (typeof window !== 'undefined' ? sessionStorage.getItem('departmentStudentSort') || '학생' : '학생');

  const [studentList, setStudentList] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authlevel, setAuthlevel] = useState<number>(5);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formBirthYear, setFormBirthYear] = useState('');
  const [formBirthMonth, setFormBirthMonth] = useState('');
  const [formBirthDay, setFormBirthDay] = useState('');
  const [formSchool, setFormSchool] = useState('');
  const [formContacts, setFormContacts] = useState<ContactItem[]>([{ type: '본인', number: '' }]);

  const addContactRow = () => {
    setFormContacts((prev) => [...prev, { type: '본인', number: '' }]);
  };
  const removeContactRow = (index: number) => {
    setFormContacts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ type: '본인', number: '' }]));
  };
  const updateContactRow = (index: number, field: keyof ContactItem, value: string) => {
    setFormContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const getFormPhoneValue = () => {
    const valid = formContacts.filter((c) => c.number.trim());
    if (valid.length === 0) return null;
    return JSON.stringify(valid.map((c) => ({ type: c.type, number: c.number.trim() })));
  };
  const formatPhoneNumber = (num: string): string => {
    const d = num.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('010')) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return num;
  };

  const formatPhoneDisplay = (phone: string | null | undefined): string => {
    if (!phone || !phone.trim()) return '-';
    try {
      const parsed = JSON.parse(phone);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((p: { number?: string }) => p.number)
          .map((p: { type?: string; number?: string }) => `${p.type}: ${formatPhoneNumber(p.number || '')}`)
          .join(', ') || '-';
      }
    } catch {
      return formatPhoneNumber(phone);
    }
    return '-';
  };

  const parsePhoneToContacts = (phone: string | null | undefined): ContactItem[] => {
    if (!phone || !phone.trim()) return [{ type: '본인', number: '' }];
    try {
      const parsed = JSON.parse(phone);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: { type?: string; number?: string }) => ({
          type: p.type || '본인',
          number: p.number || '',
        }));
      }
    } catch {
      // legacy: plain string as single "본인" contact
      return [{ type: '본인', number: phone.trim() }];
    }
    return [{ type: '본인', number: '' }];
  };

  const currentYear = new Date().getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 76 }, (_, i) => (currentYear - i).toString());
  const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const getFormBirthDate = () => {
    if (!formBirthYear || !formBirthMonth || !formBirthDay) return '';
    return `${formBirthYear}-${formBirthMonth}-${formBirthDay}`;
  };

  const fetchStudents = async () => {
    if (!churchId || !groupId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookattendance/getstudentlist`, {
        churchId,
        groupId,
      });
      setStudentList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(`${studentSort} 목록 조회 실패:`, err);
      setStudentList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(ROLLBOOK_LEADER_AUTHLEVEL_KEY);
      const al = saved != null ? parseInt(saved, 10) : 5;
      setAuthlevel(isNaN(al) ? 5 : Math.min(5, Math.max(0, al)));
    }
  }, []);

  useEffect(() => {
    if (state?.groupName) setGroupName(state.groupName);
    else {
      const detail = sessionStorage.getItem('departmentDetail');
      if (detail) {
        try {
          const parsed = JSON.parse(detail);
          if (parsed.name) setGroupName(parsed.name);
        } catch {
          // ignore
        }
      }
    }
    if (churchId && groupId) fetchStudents();
    else if (!churchId || !groupId) {
      navigate(-1);
    }
  }, [churchId, groupId]);

  const openAddModal = () => {
    setFormName('');
    setFormBirthYear('');
    setFormBirthMonth('');
    setFormBirthDay('');
    setFormSchool('');
    setFormContacts([{ type: '본인', number: '' }]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: StudentItem) => {
    setIsAddModalOpen(false);
    setEditingStudent(s);
    setFormName(s.name);
    if (s.birth_date) {
      const [y, m, d] = String(s.birth_date).slice(0, 10).split('-');
      setFormBirthYear(y || '');
      setFormBirthMonth(m || '');
      setFormBirthDay(d || '');
    } else {
      setFormBirthYear('');
      setFormBirthMonth('');
      setFormBirthDay('');
    }
    setFormSchool(s.school || '');
    setFormContacts(parsePhoneToContacts(s.phone));
  };

  const closeModals = () => {
    if (!submitting) {
      setIsAddModalOpen(false);
      setEditingStudent(null);
    }
  };

  const handleAddStudent = async () => {
    if (!formName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookattendance/addstudent`, {
        churchId,
        groupId,
        name: formName.trim(),
        birth_date: getFormBirthDate() || null,
        school: formSchool.trim() || null,
        phone: getFormPhoneValue(),
      });
      if (res.data?.success) {
        alert(res.data.message);
        closeModals();
        fetchStudents();
      } else {
        alert(res.data?.error || '등록에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !formName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookattendance/updatestudent`, {
        churchId,
        studentId: editingStudent.id,
        name: formName.trim(),
        birth_date: getFormBirthDate() || null,
        school: formSchool.trim() || null,
        phone: getFormPhoneValue(),
      });
      if (res.data?.success) {
        alert(res.data.message);
        closeModals();
        fetchStudents();
      } else {
        alert(res.data?.error || '수정에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (s: StudentItem) => {
    if (!window.confirm(`"${s.name}" ${studentSort}(을)를 삭제하시겠습니까? 출석 기록도 함께 삭제됩니다.`)) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookattendance/deletestudent`, {
        churchId,
        studentId: s.id,
      });
      if (res.data?.success) {
        alert(res.data.message);
        fetchStudents();
      } else {
        alert(res.data?.error || '삭제에 실패했습니다.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const modalFormContent = (
    <div className="rb-modal-form">
      <div className="rb-form-group">
        <label>이름 *</label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="이름"
        />
      </div>
      <div className="rb-form-group">
        <label>생년월일</label>
        <div className="rb-form-birth-row">
          <select
            value={formBirthYear}
            onChange={(e) => setFormBirthYear(e.target.value)}
            className="rb-form-select"
          >
            <option value="">년</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={formBirthMonth}
            onChange={(e) => setFormBirthMonth(e.target.value)}
            className="rb-form-select"
          >
            <option value="">월</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <select
            value={formBirthDay}
            onChange={(e) => setFormBirthDay(e.target.value)}
            className="rb-form-select"
          >
            <option value="">일</option>
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>
      </div>
      <div className="rb-form-group">
        <label>학교/직장</label>
        <input
          type="text"
          value={formSchool}
          onChange={(e) => setFormSchool(e.target.value)}
          placeholder="학교 또는 직장"
        />
      </div>
      <div className="rb-form-group">
        <label>연락처</label>
        <div className="rb-form-contacts">
          {formContacts.map((c, index) => (
            <div key={index} className="rb-form-contact-row">
              <select
                value={c.type}
                onChange={(e) => updateContactRow(index, 'type', e.target.value)}
                className="rb-form-select rb-form-contact-type"
              >
                {PHONE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="tel"
                value={c.number}
                onChange={(e) => updateContactRow(index, 'number', e.target.value.replace(/\D/g, ''))}
                placeholder="번호 (숫자만)"
                className="rb-form-contact-number"
              />
              <button
                type="button"
                className="rb-form-contact-remove"
                onClick={() => removeContactRow(index)}
                title="삭제"
              >
                <IoMdTrash size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="rb-form-contact-add" onClick={addContactRow}>
            + 연락처 추가
          </button>
        </div>
      </div>
    </div>
  );

  const canManageStudents = authlevel === 4;

  return (
    <div className="RollbookGroupAdminPage">
      <div className="slide-container">
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

        <div className="content-area">
          <div className="rb-admin-title-bar">
            <h1 className="rb-admin-title">
              {groupName || groupSort}
              <span className="rb-admin-badge">{studentSort} 관리</span>
            </h1>
            {canManageStudents && (
              <button type="button" className="rb-btn-add" onClick={openAddModal}>
                <IoMdPersonAdd size={18} /> {studentSort} 추가
              </button>
            )}
          </div>

          <div className="rb-admin-panel">
            {loading ? (
              <div className="rb-admin-loading">
                <div className="rb-admin-spinner" />
                <span>로딩 중...</span>
              </div>
            ) : studentList.length === 0 ? (
              <div className="rb-admin-empty">등록된 {studentSort}이(가) 없습니다.</div>
            ) : (
              <table className="rb-admin-table">
                <thead>
                  <tr>
                    <th className="col-no" style={{ textAlign: 'center' }}>No.</th>
                    <th className="col-student">{studentSort} 정보</th>
                    <th className="col-school">학교/직장</th>
                    <th className="col-phone">연락처</th>
                    <th className="col-action" style={{ textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((s, index) => {
                    const avatarClass = AVATAR_CLASSES[index % AVATAR_CLASSES.length];
                    const infoParts: string[] = [];
                    if (s.birth_date) infoParts.push(`생년월일: ${String(s.birth_date).slice(0, 10)}`);
                    if (s.school) infoParts.push(`학교/직장: ${s.school}`);
                    if (s.phone) infoParts.push(`연락처: ${s.phone}`);
                    if (infoParts.length === 0) infoParts.push('정보 없음');
                    return (
                      <tr key={s.id}>
                        <td className="col-no" style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {index + 1}
                        </td>
                        <td className="col-student">
                          <div className="rb-admin-student-cell">
                            <div className={`rb-admin-avatar ${avatarClass}`}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div className="rb-admin-student-name">{s.name}</div>
                              {/* <div className="rb-admin-student-info">{infoParts.join(' · ')}</div> */}
                            </div>
                          </div>
                        </td>
                        <td className="col-school" style={{ fontSize: 13, color: '#4b5563' }}>{s.school || '-'}</td>
                        <td className="col-phone" style={{ fontSize: 13, color: '#4b5563' }}>
                          {formatPhoneDisplay(s.phone)}
                        </td>
                        <td className="col-action" style={{ textAlign: 'right' }}>
                          {canManageStudents && (
                            <div className="rb-admin-actions">
                              <button
                                type="button"
                                className="rb-admin-btn rb-btn-edit"
                                onClick={() => openEditModal(s)}
                              >
                                <IoMdCreate size={14} /> 수정
                              </button>
                              <button
                                type="button"
                                className="rb-admin-btn rb-btn-delete"
                                onClick={() => handleDeleteStudent(s)}
                              >
                                <IoMdTrash size={14} /> 삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rb-bottom-nav">
            <button type="button" className="rb-nav-btn" onClick={() => navigate(-1)}>
              <IoIosArrowBack size={18} /> 뒤로가기
            </button>
            <button
              type="button"
              className="rb-nav-btn rb-nav-primary"
              onClick={() => {
                sessionStorage.setItem('departmentDetail', JSON.stringify({ name: groupName }));
                const params = new URLSearchParams({
                  church_id: churchId,
                  department_id: departmentId,
                  group_id: groupId,
                  churchName: churchName || '',
                });
                navigate(`/rollbook/group?${params.toString()}`);
              }}
            >
              출석부로 이동
            </button>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="rb-admin-modal-overlay" onClick={closeModals}>
          <div className="rb-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="rb-modal-title">{studentSort} 추가</h2>
            {modalFormContent}
            <div className="rb-modal-actions">
              <button
                type="button"
                className="rb-modal-btn rb-btn-cancel"
                onClick={closeModals}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="rb-modal-btn rb-btn-submit"
                onClick={handleAddStudent}
                disabled={submitting}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="rb-admin-modal-overlay" onClick={closeModals}>
          <div className="rb-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="rb-modal-title">{studentSort} 정보 수정</h2>
            {modalFormContent}
            <div className="rb-modal-actions">
              <button
                type="button"
                className="rb-modal-btn rb-btn-cancel"
                onClick={closeModals}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="rb-modal-btn rb-btn-submit"
                onClick={handleUpdateStudent}
                disabled={submitting}
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
