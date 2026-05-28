import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import {
  isRetreatVisible,
  parseRetreatImages,
  PLACE_REGION_OPTIONS,
  PLACE_SIZE_OPTIONS,
  PLACE_SORT_OPTIONS,
  ViewFilter,
} from './retreatAdminUtils';
import './RetreatManage.scss';

export interface PlaceRow {
  id: number;
  isView: string | boolean | number | null;
  placeName: string;
  sort: string;
  region: string;
  location: string;
  size: string;
  address: string;
  phone: string;
  homepage: string;
  images: string | string[] | null;
  date: string;
  userContact: string;
}

type EditForm = {
  placeName: string;
  sort: string;
  region: string;
  location: string;
  size: string;
  address: string;
  phone: string;
  homepage: string;
  userContact: string;
};

const emptyForm: EditForm = {
  placeName: '',
  sort: '',
  region: '',
  location: '',
  size: '',
  address: '',
  phone: '',
  homepage: '',
  userContact: '',
};

export default function PlaceManage() {
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [editRow, setEditRow] = useState<PlaceRow | null>(null);
  const [form, setForm] = useState<EditForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [editImageNames, setEditImageNames] = useState<string[]>([]);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const dragImageIndexRef = useRef<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post<{ ok: boolean; data: PlaceRow[] }>(`${MainURL}/retreat/admingetall`);
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      console.error(error);
      alert('장소 목록을 불러오지 못했습니다.');
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
      if (regionFilter !== 'all' && row.region !== regionFilter) return false;
      if (!word) return true;
      const haystack = [
        row.placeName,
        row.sort,
        row.region,
        row.location,
        row.address,
        row.phone,
        row.userContact,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(word);
    });
  }, [rows, searchWord, viewFilter, regionFilter]);

  const openEdit = (row: PlaceRow) => {
    setEditRow(row);
    setForm({
      placeName: row.placeName || '',
      sort: row.sort || '',
      region: row.region || '',
      location: row.location || '',
      size: row.size || '',
      address: row.address || '',
      phone: row.phone || '',
      homepage: row.homepage || '',
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

  const toggleView = async (row: PlaceRow) => {
    const nextVisible = !isRetreatVisible(row.isView);
    setActingId(row.id);
    try {
      const res = await axios.post(`${MainURL}/retreat/adminupdateisview`, {
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
    if (!form.placeName.trim() || !form.sort.trim() || !form.region.trim()) {
      alert('장소명, 형식, 지역은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`${MainURL}/retreat/adminupdate`, {
        id: editRow.id,
        placeName: form.placeName.trim(),
        sort: form.sort.trim(),
        region: form.region.trim(),
        location: form.location.trim(),
        size: form.size.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        homepage: form.homepage.trim(),
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

  const deleteRow = async (row: PlaceRow) => {
    if (!window.confirm(`「${row.placeName}」 장소를 삭제하시겠습니까?`)) return;
    setActingId(row.id);
    try {
      const res = await axios.post(`${MainURL}/retreat/admindelete`, { id: row.id });
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
          placeholder="장소명, 주소, 연락처 검색"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
        />
        <select
          className="retreat-admin__filter"
          value={viewFilter}
          onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
        >
          <option value="all">전체 상태</option>
          <option value="hidden">검토대기</option>
          <option value="visible">노출중</option>
        </select>
        <select
          className="retreat-admin__filter"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
        >
          <option value="all">전체 지역</option>
          {PLACE_REGION_OPTIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <button type="button" className="retreat-admin__refresh" onClick={() => void fetchRows()}>
          새로고침
        </button>
        <a className="retreat-admin__link" href="/retreat/place" target="_blank" rel="noreferrer">
          사이트 목록 보기
        </a>
      </div>

      {loading ? (
        <div className="retreat-admin__loading">불러오는 중...</div>
      ) : filteredRows.length === 0 ? (
        <div className="retreat-admin__empty">표시할 장소가 없습니다.</div>
      ) : (
        <div className="retreat-admin__table-wrap">
          <table className="retreat-admin__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>사진</th>
                <th>상태</th>
                <th>지역</th>
                <th>장소명</th>
                <th>형식</th>
                <th>규모</th>
                <th>위치</th>
                <th>요청자</th>
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
                          src={`${MainURL}/images/retreat/placeimage/${images[0]}`}
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
                    <td>{row.region}</td>
                    <td>{row.placeName}</td>
                    <td>{row.sort}</td>
                    <td>{row.size || '-'}</td>
                    <td>{row.location || '-'}</td>
                    <td>{row.userContact || '-'}</td>
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
              <h3>장소 수정 — {editRow.placeName}</h3>
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
                        <img src={`${MainURL}/images/retreat/placeimage/${img}`} alt="" draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="retreat-admin__field">
                <label htmlFor="place-name">장소명</label>
                <input
                  id="place-name"
                  value={form.placeName}
                  onChange={(e) => setForm((prev) => ({ ...prev, placeName: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-sort">형식</label>
                <select
                  id="place-sort"
                  value={form.sort}
                  onChange={(e) => setForm((prev) => ({ ...prev, sort: e.target.value }))}
                >
                  <option value="">선택</option>
                  {PLACE_SORT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-region">지역</label>
                <select
                  id="place-region"
                  value={form.region}
                  onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
                >
                  <option value="">선택</option>
                  {PLACE_REGION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-size">규모</label>
                <select
                  id="place-size"
                  value={form.size}
                  onChange={(e) => setForm((prev) => ({ ...prev, size: e.target.value }))}
                >
                  <option value="">선택</option>
                  {PLACE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-location">위치</label>
                <input
                  id="place-location"
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-address">주소</label>
                <input
                  id="place-address"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-phone">장소 연락처</label>
                <input
                  id="place-phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-homepage">홈페이지</label>
                <input
                  id="place-homepage"
                  value={form.homepage}
                  onChange={(e) => setForm((prev) => ({ ...prev, homepage: e.target.value }))}
                />
              </div>
              <div className="retreat-admin__field">
                <label htmlFor="place-userContact">작성자 연락처</label>
                <input
                  id="place-userContact"
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
