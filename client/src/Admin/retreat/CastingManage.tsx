import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import {
  CASTING_SORT_OPTIONS,
  isRetreatVisible,
  parseRetreatImages,
  ViewFilter,
} from './retreatAdminUtils';
import './RetreatManage.scss';

export interface CastingRow {
  id: number;
  isView: string | boolean | number | null;
  sort: string;
  name: string;
  phone: string;
  profile: string;
  images: string | string[] | null;
  date: string;
  userContact: string;
}

type EditForm = {
  sort: string;
  name: string;
  phone: string;
  profile: string;
  userContact: string;
};

const emptyForm: EditForm = {
  sort: '',
  name: '',
  phone: '',
  profile: '',
  userContact: '',
};

export default function CastingManage() {
  const [rows, setRows] = useState<CastingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [editRow, setEditRow] = useState<CastingRow | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [editImageNames, setEditImageNames] = useState<string[]>([]);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const dragImageIndexRef = useRef<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post<{ ok: boolean; data: CastingRow[] }>(
        `${MainURL}/retreatcasting/admingetall`
      );
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error(error);
      alert('강사 목록을 불러오지 못했습니다.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filteredRows = useMemo(() => {
    const word = searchWord.trim().toLowerCase();
    return rows.filter((row) => {
      if (viewFilter === 'visible' && !isRetreatVisible(row.isView)) return false;
      if (viewFilter === 'hidden' && isRetreatVisible(row.isView)) return false;
      if (!word) return true;
      const haystack = [row.name, row.sort, row.phone, row.userContact, row.profile]
        .join(' ')
        .toLowerCase();
      return haystack.includes(word);
    });
  }, [rows, searchWord, viewFilter]);

  const openEdit = (row: CastingRow) => {
    setEditRow(row);
    setForm({
      sort: row.sort || '',
      name: row.name || '',
      phone: row.phone || '',
      profile: row.profile || '',
      userContact: row.userContact || '',
    });
    setEditImageNames(parseRetreatImages(row.images));
    setDragOverImageIndex(null);
    dragImageIndexRef.current = null;
  };

  const closeEdit = () => {
    setEditRow(null);
    setForm(emptyForm);
    setEditImageNames([]);
    setDragOverImageIndex(null);
    dragImageIndexRef.current = null;
  };

  const handleImageDragStart = (index: number) => {
    dragImageIndexRef.current = index;
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverImageIndex(index);
  };

  const handleImageDrop = (dropIndex: number) => {
    const fromIndex = dragImageIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverImageIndex(null);
      return;
    }
    setEditImageNames((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    dragImageIndexRef.current = null;
    setDragOverImageIndex(null);
  };

  const handleImageDragEnd = () => {
    dragImageIndexRef.current = null;
    setDragOverImageIndex(null);
  };

  const removeEditImage = (fileName: string) => {
    if (!window.confirm('이 사진을 삭제하시겠습니까?')) return;
    setEditImageNames((prev) => prev.filter((name) => name !== fileName));
  };

  const toggleView = async (row: CastingRow) => {
    const nextVisible = !isRetreatVisible(row.isView);
    setActingId(row.id);
    try {
      const res = await axios.post(`${MainURL}/retreatcasting/adminupdateisview`, {
        id: row.id,
        isView: nextVisible,
      });
      if (res.data) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id ? { ...item, isView: nextVisible ? 'true' : 'false' } : item
          )
        );
      } else {
        alert('노출 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('노출 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const saveEdit = async () => {
    if (!editRow) return;
    if (!form.name.trim() || !form.sort.trim()) {
      alert('구분과 강사명은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${MainURL}/retreatcasting/adminupdate`, {
        id: editRow.id,
        sort: form.sort.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        profile: form.profile.trim(),
        userContact: form.userContact.trim(),
        images: JSON.stringify(editImageNames),
      });
      if (res.data) {
        alert('저장되었습니다.');
        closeEdit();
        void fetchRows();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row: CastingRow) => {
    if (!window.confirm(`「${row.name}」 강사를 삭제하시겠습니까?`)) return;
    setActingId(row.id);
    try {
      const res = await axios.post(`${MainURL}/retreatcasting/admindelete`, { id: row.id });
      if (res.data) {
        setRows((prev) => prev.filter((item) => item.id !== row.id));
        if (editRow?.id === row.id) closeEdit();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="retreat-admin">
      <div className="retreat-admin__toolbar">
        <input
          className="retreat-admin__search"
          type="text"
          placeholder="강사명, 구분, 연락처 검색"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
        />
        <select
          className="retreat-admin__filter"
          value={viewFilter}
          onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
        >
          <option value="all">전체</option>
          <option value="hidden">검토대기</option>
          <option value="visible">노출중</option>
        </select>
        <button type="button" className="retreat-admin__refresh" onClick={() => void fetchRows()}>
          새로고침
        </button>
        <a className="retreat-admin__link" href="/retreat/casting" target="_blank" rel="noreferrer">
          사이트 목록 보기
        </a>
      </div>

      {loading ? (
        <div className="retreat-admin__loading">불러오는 중...</div>
      ) : filteredRows.length === 0 ? (
        <div className="retreat-admin__empty">표시할 강사가 없습니다.</div>
      ) : (
        <div className="retreat-admin__table-wrap">
          <table className="retreat-admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>사진</th>
                <th>상태</th>
                <th>구분</th>
                <th>강사명</th>
                <th>연락처</th>
                <th>요청자</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const images = parseRetreatImages(row.images);
                const visible = isRetreatVisible(row.isView);
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {images[0] ? (
                        <img
                          className="retreat-admin__thumb"
                          src={`${MainURL}/images/retreat/castingimage/${images[0]}`}
                          alt=""
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span
                        className={`retreat-admin__badge ${
                          visible ? 'retreat-admin__badge--visible' : 'retreat-admin__badge--hidden'
                        }`}
                      >
                        {visible ? '노출중' : '검토대기'}
                      </span>
                    </td>
                    <td>{row.sort}</td>
                    <td>{row.name}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.userContact || '-'}</td>
                    <td>{row.date ? String(row.date).slice(0, 10) : '-'}</td>
                    <td>
                      <div className="retreat-admin__actions">
                        <button
                          type="button"
                          className="retreat-admin__btn retreat-admin__btn--primary"
                          disabled={actingId === row.id}
                          onClick={() => void toggleView(row)}
                        >
                          {visible ? '비노출' : '노출승인'}
                        </button>
                        <button
                          type="button"
                          className="retreat-admin__btn retreat-admin__btn--ghost"
                          onClick={() => openEdit(row)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="retreat-admin__btn retreat-admin__btn--danger"
                          disabled={actingId === row.id}
                          onClick={() => void deleteRow(row)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editRow && (
        <div className="retreat-admin__modal-backdrop" onClick={closeEdit}>
          <div className="retreat-admin__modal" onClick={(e) => e.stopPropagation()}>
            <div className="retreat-admin__modal-head">
              <h3>강사 수정 — {editRow.name}</h3>
              <button type="button" className="retreat-admin__modal-close" onClick={closeEdit}>
                ×
              </button>
            </div>
            <div className="retreat-admin__modal-body">
              {editImageNames.length > 0 && (
                <div className="retreat-admin__field">
                  <label>사진 순서</label>
                  <p className="retreat-admin__preview-hint">
                    사진을 드래그해 순서를 바꿀 수 있습니다. 첫 번째 사진이 목록·상세의 대표 이미지입니다.
                  </p>
                  <div className="retreat-admin__preview-images retreat-admin__preview-images--sortable">
                    {editImageNames.map((img, index) => (
                      <div
                        key={img}
                        className={`retreat-admin__preview-item${
                          dragOverImageIndex === index ? ' is-drag-over' : ''
                        }${index === 0 ? ' is-cover' : ''}`}
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDrop={() => handleImageDrop(index)}
                        onDragEnd={handleImageDragEnd}
                      >
                        {index === 0 && <span className="retreat-admin__preview-badge">대표</span>}
                        <span className="retreat-admin__preview-order">{index + 1}</span>
                        <button
                          type="button"
                          className="retreat-admin__preview-remove"
                          title="사진 삭제"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEditImage(img);
                          }}
                        >
                          ×
                        </button>
                        <img src={`${MainURL}/images/retreat/castingimage/${img}`} alt="" draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="retreat-admin__field">
                <label htmlFor="casting-sort">구분</label>
                <select
                  id="casting-sort"
                  value={form.sort}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort: e.target.value }))}
                >
                  <option value="">선택</option>
                  {CASTING_SORT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="casting-name">강사명</label>
                <input
                  id="casting-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="casting-phone">연락처</label>
                <input
                  id="casting-phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="casting-profile">프로필</label>
                <textarea
                  id="casting-profile"
                  value={form.profile}
                  onChange={(e) => setForm((prev) => ({ ...prev, profile: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="casting-userContact">작성자 연락처</label>
                <input
                  id="casting-userContact"
                  value={form.userContact}
                  onChange={(e) => setForm((prev) => ({ ...prev, userContact: e.target.value }))}
                />
              </div>
            </div>
            <div className="retreat-admin__modal-foot">
              <button
                type="button"
                className="retreat-admin__btn retreat-admin__btn--ghost"
                onClick={closeEdit}
              >
                취소
              </button>
              <button
                type="button"
                className="retreat-admin__btn retreat-admin__btn--primary"
                disabled={saving}
                onClick={() => void saveEdit()}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
