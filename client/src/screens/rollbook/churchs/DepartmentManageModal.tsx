import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../../../MainURL';

interface Department {
  id: number;
  church_id: number;
  name: string;
  chief_name?: string;
  chief_id?: number | null;
  group_sort?: string;
  leader_sort?: string;
  student_sort?: string;
}

interface LeaderOption {
  id: number;
  name: string;
  authlevel?: number;
}

const GROUP_SORT_OPTIONS = ['반', '가지', '순', '소그룹', '조'];
const LEADER_SORT_OPTIONS = ['교사', '리더', '순장', '목장', '조장'];
const STUDENT_SORT_OPTIONS = ['어린이', '학생', '청년', '가지원', '조원', '지체', '순원'];

interface DepartmentManageModalProps {
  churchId: string | null;
  callerLeaderId?: number;
  canAssignOperator?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function DepartmentManageModal({ churchId, callerLeaderId, canAssignOperator, isOpen, onClose, onRefresh }: DepartmentManageModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editChiefName, setEditChiefName] = useState('');
  const [editChiefId, setEditChiefId] = useState<number | ''>('');
  const [editGroupSort, setEditGroupSort] = useState('');
  const [editLeaderSort, setEditLeaderSort] = useState('');
  const [editStudentSort, setEditStudentSort] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newGroupSort, setNewGroupSort] = useState('소그룹');
  const [newLeaderSort, setNewLeaderSort] = useState('교사');
  const [newStudentSort, setNewStudentSort] = useState('학생');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingAuthLevelId, setSettingAuthLevelId] = useState<number | null>(null);

  const fetchLeadersByChurch = async () => {
    if (!churchId) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/getleadersbychurch`, {
        church_id: parseInt(churchId),
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const byName = new Map<string, { id: number; name: string; authlevel: number }>();
        for (const r of res.data.data) {
          const name = String(r.name || '').trim();
          const al = r.authlevel != null ? Math.min(5, Math.max(0, parseInt(String(r.authlevel), 10))) : 5;
          const existing = byName.get(name);
          if (!existing || al < existing.authlevel) {
            byName.set(name, { id: r.id, name, authlevel: al });
          }
        }
        setLeaders(Array.from(byName.values()));
      } else {
        setLeaders([]);
      }
    } catch (e) {
      setLeaders([]);
    }
  };

  const fetchDepartments = async () => {
    if (!churchId) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookdepart/getdepartments`, {
        church_id: parseInt(churchId),
      });
      if (res.data?.success) {
        setDepartments(res.data.data || []);
      }
    } catch (error) {
      console.error('부서 목록 조회 실패:', error);
      alert('부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && churchId) {
      fetchDepartments();
      fetchLeadersByChurch();
    }
  }, [isOpen, churchId]);

  const handleAddDepartment = async () => {
    if (isSubmitting) return;
    if (!newDepartmentName.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }
    if (!churchId) return;

    const trimmedName = newDepartmentName.trim();
    const isDuplicate = departments.some(
      (dept) => dept.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      alert('이미 등록된 부서명입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookdepart/adddepartment`, {
        church_id: parseInt(churchId),
        name: trimmedName,
        group_sort: newGroupSort.trim() || '소그룹',
        leader_sort: newLeaderSort.trim() || '교사',
        student_sort: newStudentSort.trim() || '학생',
      });
      if (res.data?.success) {
        alert(res.data.message);
        setNewDepartmentName('');
        setNewGroupSort('소그룹');
        setNewLeaderSort('교사');
        setNewStudentSort('학생');
        fetchDepartments();
        onRefresh();
      } else {
        alert(res.data?.error || '부서 등록에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('부서 등록 실패:', error);
      alert(error.response?.data?.error || '부서 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (department: Department) => {
    setEditingId(department.id);
    setEditName(department.name);
    setEditChiefName(department.chief_name || '');
    setEditChiefId(department.chief_id ?? '');
    setEditGroupSort(GROUP_SORT_OPTIONS.includes(department.group_sort || '') ? (department.group_sort as string) : GROUP_SORT_OPTIONS[0]);
    setEditLeaderSort(LEADER_SORT_OPTIONS.includes(department.leader_sort || '') ? (department.leader_sort as string) : LEADER_SORT_OPTIONS[0]);
    setEditStudentSort(STUDENT_SORT_OPTIONS.includes(department.student_sort || '') ? (department.student_sort as string) : STUDENT_SORT_OPTIONS[0]);
  };

  const handleChiefSelect = (leaderId: string) => {
    setEditChiefId(leaderId ? Number(leaderId) : '');
    const leader = leaders.find((l) => l.id === Number(leaderId));
    setEditChiefName(leader?.name ?? '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditChiefName('');
    setEditChiefId('');
    setEditGroupSort('');
    setEditLeaderSort('');
    setEditStudentSort('');
  };

  const handleUpdateDepartment = async (id: number) => {
    if (!editName.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    const trimmedName = editName.trim();
    const isDuplicate = departments.some(
      (dept) => dept.id !== id && dept.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      alert('이미 등록된 부서명입니다.');
      return;
    }

    try {
      const res = await axios.post(`${MainURL}/rollbookdepart/updatedepartment`, {
        id,
        name: trimmedName,
        chief_name: editChiefName.trim() || null,
        chief_id: editChiefId || null,
        group_sort: editGroupSort.trim() || '소그룹',
        leader_sort: editLeaderSort.trim() || '교사',
        student_sort: editStudentSort.trim() || '학생',
      });
      if (res.data?.success) {
        alert(res.data.message);
        setEditingId(null);
        setEditName('');
        fetchDepartments();
        onRefresh();
      } else {
        alert(res.data?.error || '부서 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('부서 수정 실패:', error);
      alert(error.response?.data?.error || '부서 수정에 실패했습니다.');
    }
  };

  const handleSetAuthLevel1 = async (leaderId: number) => {
    if (!churchId || !callerLeaderId || settingAuthLevelId) return;
    setSettingAuthLevelId(leaderId);
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/setauthlevel`, {
        church_id: parseInt(churchId),
        leaderId,
        authlevel: 1,
        callerLeaderId,
      });
      if (res.data?.success) {
        alert(res.data.message);
        fetchLeadersByChurch();
      } else {
        alert(res.data?.error || '권한 지정에 실패했습니다.');
      }
    } catch (e: any) {
      alert(e.response?.data?.error || '권한 지정에 실패했습니다.');
    } finally {
      setSettingAuthLevelId(null);
    }
  };

  const handleDeleteDepartment = async (id: number, name: string) => {
    if (!window.confirm(`"${name}" 부서를 삭제하시겠습니까?`)) return;

    try {
      const res = await axios.post(`${MainURL}/rollbookdepart/deletedepartment`, {
        id,
      });
      if (res.data?.success) {
        alert(res.data.message);
        fetchDepartments();
        onRefresh();
      } else {
        alert(res.data?.error || '부서 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('부서 삭제 실패:', error);
      alert(error.response?.data?.error || '부서 삭제에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="Modal">
      <div className="modal-backcover" onClick={onClose} />
      <div className="modal-maincover" style={{ width:'90%'}}>
        <div
          style={{
            marginTop: '120px',
            width: '95%',
            maxWidth: '900px',
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '30px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',       
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '15px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>부서 관리</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>새 부서 등록</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="부서명을 입력하세요"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    e.preventDefault();
                    handleAddDepartment();
                  }
                }}
              />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', minWidth: '70px' }}>그룹 종류</label>
                  <select
                    value={newGroupSort}
                    onChange={(e) => setNewGroupSort(e.target.value)}
                    style={{ width: '140px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                  >
                    {GROUP_SORT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', minWidth: '70px' }}>담당자 종류</label>
                  <select
                    value={newLeaderSort}
                    onChange={(e) => setNewLeaderSort(e.target.value)}
                    style={{ width: '140px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                  >
                    {LEADER_SORT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', minWidth: '70px' }}>구성원 종류</label>
                  <select
                    value={newStudentSort}
                    onChange={(e) => setNewStudentSort(e.target.value)}
                    style={{ width: '140px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                  >
                    {STUDENT_SORT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleAddDepartment}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isSubmitting ? '#999' : '#33383f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>부서 목록</h3>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>로딩 중...</div>
            ) : departments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                등록된 부서가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '15px',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                    }}
                  >
                    {editingId === dept.id ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="부서명"
                              style={{ flex: 1, minWidth: 0, padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateDepartment(dept.id);
                                else if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <select
                          value={editChiefId}
                          onChange={(e) => handleChiefSelect(e.target.value)}
                          style={{
                            minWidth: '120px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            fontSize: '14px',
                          }}
                        >
                          <option value="">담당자 없음</option>
                          {leaders.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>그룹:</span>
                              <select
                                value={GROUP_SORT_OPTIONS.includes(editGroupSort) ? editGroupSort : GROUP_SORT_OPTIONS[0]}
                                onChange={(e) => setEditGroupSort(e.target.value)}
                                style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '13px' }}
                              >
                                {GROUP_SORT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>담당:</span>
                              <select
                                value={LEADER_SORT_OPTIONS.includes(editLeaderSort) ? editLeaderSort : LEADER_SORT_OPTIONS[0]}
                                onChange={(e) => setEditLeaderSort(e.target.value)}
                                style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '13px' }}
                              >
                                {LEADER_SORT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', color: '#666' }}>구성원:</span>
                              <select
                                value={STUDENT_SORT_OPTIONS.includes(editStudentSort) ? editStudentSort : STUDENT_SORT_OPTIONS[0]}
                                onChange={(e) => setEditStudentSort(e.target.value)}
                                style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '13px' }}
                              >
                                {STUDENT_SORT_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUpdateDepartment(dept.id)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#1DDB16',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#999',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, fontSize: '16px', fontWeight: '500' }}>
                          {dept.name}
                          <span style={{ marginLeft: '8px', fontSize: '13px', color: '#666' }}>
                            (그룹: {dept.group_sort || '소그룹'} / 담당: {dept.leader_sort || '교사'} / 학생: {dept.student_sort || '학생'})
                          </span>
                          <span style={{ marginLeft: '8px', fontSize: '13px', color: dept.chief_name ? '#666' : '#999' }}>
                            {dept.chief_name ? `담당자: ${dept.chief_name}` : '(담당자 미지정)'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStartEdit(dept)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#33383f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          수정하기
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          style={{
                            padding: '8px 15px',
                            backgroundColor: '#ff4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {canAssignOperator && leaders.length > 0 && (
            <div
              style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>전체운영자 지정</h3>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>authlevel 1(전체운영자)로 지정할 리더를 선택하세요.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaders.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{l.name}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      (현재: {l.authlevel === 0 ? '전체관리자' : l.authlevel === 1 ? '전체운영자' : l.authlevel === 2 ? '부서관리자' : l.authlevel === 3 ? '부서운영자' : l.authlevel === 4 ? '소그룹담당' : '소그룹부담당'})
                    </span>
                    {l.authlevel !== 1 && l.authlevel !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetAuthLevel1(l.id)}
                        disabled={settingAuthLevelId === l.id}
                        style={{
                          padding: '6px 12px',
                          background: settingAuthLevelId === l.id ? '#94a3b8' : '#0ea5e9',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 13,
                          cursor: settingAuthLevelId === l.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {settingAuthLevelId === l.id ? '처리 중...' : '운영자로 지정'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '30px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '10px 30px',
                backgroundColor: '#999',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
