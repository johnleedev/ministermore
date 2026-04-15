import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../../../MainURL';

interface GroupItem {
  id: number;
  church_id?: number;
  dept_id?: number;
  name: string;
  teacher?: string;
  leader_id?: number | null;
}

interface SmallgroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  departmentId: string;
  groupSort?: string;
  leaderSort?: string;
  studentSort?: string;
  onRefresh: () => void;
}

export default function SmallgroupManageModal({
  isOpen,
  onClose,
  churchId,
  departmentId,
  groupSort = '소그룹',
  leaderSort = '교사',
  studentSort = '학생',
  onRefresh,
}: SmallgroupManageModalProps) {
  const [modalGroups, setModalGroups] = useState<GroupItem[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTeacher, setNewGroupTeacher] = useState('');
  const [newGroupLeaderId, setNewGroupLeaderId] = useState<number | null>(null);
  const [deptLeaders, setDeptLeaders] = useState<{ id: number; name: string }[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupTeacher, setEditGroupTeacher] = useState('');
  const [editGroupLeaderId, setEditGroupLeaderId] = useState<number | null>(null);
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);

  const fetchModalGroups = async () => {
    if (!departmentId) return;
    try {
        const res = await axios.post(`${MainURL}/rollbookgroup/getgrouplist`, {
        churchId,
        deptId: departmentId,
      });
      if (Array.isArray(res.data)) {
        setModalGroups(res.data);
      } else {
        setModalGroups([]);
      }
    } catch (e) {
      console.error('소그룹 목록 조회 실패:', e);
      setModalGroups([]);
    }
  };

  const fetchDeptLeaders = async () => {
    if (!departmentId) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookleaders/getleadersbydept`, { deptId: departmentId });
      if (res.data?.success) {
        setDeptLeaders(res.data.data || []);
      } else {
        setDeptLeaders([]);
      }
    } catch (e) {
      setDeptLeaders([]);
    }
  };

  useEffect(() => {
    if (isOpen && departmentId) {
      fetchModalGroups();
      fetchDeptLeaders();
    }
  }, [isOpen, departmentId]);

  const handleAddGroup = async () => {
    if (isGroupSubmitting || !departmentId) return;
    if (!newGroupName.trim()) {
      alert(`${groupSort} 이름을 입력해주세요.`);
      return;
    }
    const trimmed = newGroupName.trim();
    if (modalGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 등록된 이름입니다.');
      return;
    }
    setIsGroupSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/rollbookgroup/addgroup`, {
        church_id: churchId,
        deptId: departmentId,
        name: trimmed,
        teacher_name: newGroupTeacher.trim() || null,
        leader_id: newGroupLeaderId,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setNewGroupName('');
        setNewGroupTeacher('');
        setNewGroupLeaderId(null);
        fetchModalGroups();
        onRefresh();
      } else {
        alert(res.data?.error || '등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  const handleUpdateGroup = async (id: number) => {
    if (!editGroupName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    const trimmed = editGroupName.trim();
    if (modalGroups.some((g) => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('이미 등록된 이름입니다.');
      return;
    }
    try {
      const res = await axios.post(`${MainURL}/rollbookgroup/updategroup`, {
        id,
        name: trimmed,
        teacher_name: editGroupTeacher.trim() || null,
        leader_id: editGroupLeaderId,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setEditingGroupId(null);
        setEditGroupName('');
        setEditGroupTeacher('');
        setEditGroupLeaderId(null);
        fetchModalGroups();
        onRefresh();
      } else {
        alert(res.data?.error || '수정에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '수정에 실패했습니다.');
    }
  };

  const handleDeleteGroup = async (id: number, name: string) => {
    if (!window.confirm(`"${name}" ${groupSort}을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await axios.post(`${MainURL}/rollbookgroup/deletegroup`, { id });
      if (res.data?.success) {
        alert(res.data.message);
        fetchModalGroups();
        onRefresh();
      } else {
        alert(res.data?.error || '삭제에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="Modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      <div
        className="modal-backcover"
        style={{ position: 'absolute', width: '100vw', minHeight: '200vh', top: 0, left: 0, zIndex: 8, opacity: 0.6, backgroundColor: '#000' }}
        onClick={() => !isGroupSubmitting && onClose()}
      />
      <div className="modal-maincover" style={{ position: 'absolute', width: '100vw', top: 0, left: 0, zIndex: 9, display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
        <div style={{ marginTop: '60px', width: '90%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{groupSort}관리</h2>
            <button type="button" onClick={() => !isGroupSubmitting && onClose()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
          </div>
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>새 {groupSort} 등록</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ minWidth: '80px', fontSize: '14px' }}>이름</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={`${groupSort} 이름`}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddGroup(); }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ minWidth: '80px', fontSize: '14px' }}>담당 {leaderSort}</label>
                <select
                  value={newGroupLeaderId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const id = v ? Number(v) : null;
                    setNewGroupLeaderId(id);
                    setNewGroupTeacher(id ? deptLeaders.find((l) => l.id === id)?.name ?? '' : '');
                  }}
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">선택 (해당 부서 {leaderSort})</option>
                  {deptLeaders.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  disabled={isGroupSubmitting}
                  style={{ padding: '10px 20px', backgroundColor: isGroupSubmitting ? '#999' : '#33383f', color: '#fff', border: 'none', borderRadius: '8px', cursor: isGroupSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}
                >
                  {isGroupSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>{groupSort} 목록</h3>
            {modalGroups.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>등록된 {groupSort}이(가) 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modalGroups.map((g) => (
                  <div
                    key={g.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}
                  >
                    {editingGroupId === g.id ? (
                      <>
                        <input
                          type="text"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          placeholder="이름"
                          style={{ flex: 1, minWidth: 0, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateGroup(g.id); if (e.key === 'Escape') { setEditingGroupId(null); setEditGroupName(''); setEditGroupTeacher(''); setEditGroupLeaderId(null); } }}
                          autoFocus
                        />
                        <select
                          value={editGroupLeaderId ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            const id = v ? Number(v) : null;
                            setEditGroupLeaderId(id);
                            setEditGroupTeacher(id ? deptLeaders.find((l) => l.id === id)?.name ?? '' : '');
                          }}
                          style={{ minWidth: '90px', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                        >
                          <option value="">담당 없음</option>
                          {deptLeaders.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => handleUpdateGroup(g.id)} style={{ padding: '8px 14px', backgroundColor: '#1DDB16', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>저장</button>
                        <button type="button" onClick={() => { setEditingGroupId(null); setEditGroupName(''); setEditGroupTeacher(''); setEditGroupLeaderId(null); }} style={{ padding: '8px 14px', backgroundColor: '#999', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>취소</button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 500 }}>
                          {g.name}
                          {g.teacher && (
                            <span style={{ marginLeft: '8px', fontSize: '13px', color: '#666' }}>(담당: {g.teacher})</span>
                          )}
                        </div>
                        <button type="button" onClick={() => { setEditingGroupId(g.id); setEditGroupName(g.name); setEditGroupTeacher(g.teacher || ''); setEditGroupLeaderId(g.leader_id ?? null); }} style={{ padding: '8px 14px', backgroundColor: '#33383f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>수정</button>
                        <button type="button" onClick={() => handleDeleteGroup(g.id, g.name)} style={{ padding: '8px 14px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>삭제</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => !isGroupSubmitting && onClose()} style={{ padding: '10px 24px', backgroundColor: '#999', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
