import type { Dispatch, SetStateAction } from 'react';
import Loading from '../../../components/Loading';
import {
  formatKoreanFromDateKey,
  normalizeBulletinDateKey,
  shortDateFromDateKey,
  type CalCell,
} from './serviceManageUtils';
import type {
  BulletinEditorState,
  BulletinWorshipRow,
  BulletinItem,
  DonorRow,
} from './serviceManageTypes';

export interface ChurchBulletinAdminProps {
  bulletinList: BulletinItem[];
  editingBulletinId: number | null;
  bulletinEditor: BulletinEditorState | null;
  bulletinEditorLoading: boolean;
  bulletinSaving: boolean;
  serviceNames: string[];
  selectedServiceIdx: number;
  setSelectedServiceIdx: Dispatch<SetStateAction<number>>;
  donorSearch: string;
  setDonorSearch: Dispatch<SetStateAction<string>>;
  calYM: { y: number; m: number };
  shiftCalMonth: (delta: number) => void;
  calendarCells: CalCell[];
  bulletinIdByDateKey: Map<string, number>;
  selectedDateKey: string | null;
  bulletinCountByDateKey: Map<string, number>;
  donorRowsFiltered: { row: DonorRow; originalIndex: number }[];
  handleCreateBooklet: () => void;
  handleDeleteBulletin: (bulletinMainId: number) => void;
  handleViewBulletin: (bulletinMainId: number) => void;
  handleEditBulletin: (bulletinMainId: number) => void;
  handleSaveBulletin: () => void;
  removeServiceName: (index: number) => void;
  addServiceName: () => void;
  updateServiceName: (index: number, value: string) => void;
  addWorshipRow: () => void;
  updateWorshipRow: (index: number, patch: Partial<BulletinWorshipRow>) => void;
  removeWorshipRow: (index: number) => void;
  addDonorRow: () => void;
  removeDonorRow: (index: number) => void;
  updateDonorRow: (index: number, patch: Partial<DonorRow>) => void;
}

export default function ChurchBulletinAdmin(props: ChurchBulletinAdminProps) {
  const {
    bulletinList,
    editingBulletinId,
    bulletinEditor,
    bulletinEditorLoading,
    bulletinSaving,
    serviceNames,
    selectedServiceIdx,
    setSelectedServiceIdx,
    donorSearch,
    setDonorSearch,
    calYM,
    shiftCalMonth,
    calendarCells,
    bulletinIdByDateKey,
    selectedDateKey,
    bulletinCountByDateKey,
    donorRowsFiltered,
    handleCreateBooklet,
    handleDeleteBulletin,
    handleViewBulletin,
    handleEditBulletin,
    handleSaveBulletin,
    removeServiceName,
    addServiceName,
    updateServiceName,
    addWorshipRow,
    updateWorshipRow,
    removeWorshipRow,
    addDonorRow,
    removeDonorRow,
    updateDonorRow,
  } = props;

  return (
<div className="church-bulletin-admin">
  <div className="cba-window">
    <div className="cba-app">

      <div className="cba-upper-panel cba-card">
        <div className="cba-upper-split">
          <div className="cba-upper-cal">
            <div className="cba-calendar-popover">
              <div className="cba-calendar-head">
                <button
                  type="button"
                  className="cba-mini-icon"
                  onClick={() => shiftCalMonth(-1)}
                  aria-label="이전 달"
                >
                  ←
                </button>
                <strong>
                  {calYM.y}년 {calYM.m}월
                </strong>
                <button
                  type="button"
                  className="cba-mini-icon"
                  onClick={() => shiftCalMonth(1)}
                  aria-label="다음 달"
                >
                  →
                </button>
              </div>
              <div className="cba-weekdays">
                {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="cba-dates-grid">
                {calendarCells.map((cell, ci) => {
                  if (cell.kind === 'blank') {
                    return <div key={`cal-blank-${ci}`} className="cba-date-cell muted" />;
                  }
                  const has = bulletinIdByDateKey.has(cell.iso);
                  const active = selectedDateKey === cell.iso;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      className={`cba-date-cell${has ? ' has-bulletin' : ' muted'}${
                        active ? ' active' : ''
                      }`}
                      onClick={() => {
                        if (!has) return;
                        const id = bulletinIdByDateKey.get(cell.iso);
                        if (id) handleEditBulletin(id);
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="cba-upper-side">
            <div className="cba-toolbar">
              <div className="cba-toolbar-left">
                <button type="button" className="cba-chip date-display">
                  <span>
                    📅{' '}
                    <strong>
                      {editingBulletinId && bulletinEditor
                        ? formatKoreanFromDateKey(selectedDateKey)
                        : '주보를 선택하세요'}
                    </strong>
                  </span>
                  <span>⌄</span>
                </button>
                <div className="cba-status-badge">
                  {bulletinSaving ? '저장 중...' : '저장 준비됨'}
                </div>
                <button type="button" className="cba-btn soft" onClick={handleCreateBooklet}>
                  새 주보
                </button>
                {editingBulletinId ? (
                  <button
                    type="button"
                    className="cba-btn danger"
                    onClick={() => handleDeleteBulletin(editingBulletinId)}
                  >
                    주보 삭제
                  </button>
                ) : null}
              </div>
              <div className="cba-toolbar-right">
                <button
                  type="button"
                  className="cba-btn ghost"
                  disabled={!editingBulletinId}
                  onClick={() => editingBulletinId && handleViewBulletin(editingBulletinId)}
                >
                  미리보기
                </button>
                <button
                  type="button"
                  className="cba-btn primary"
                  disabled={!bulletinEditor || bulletinSaving}
                  onClick={handleSaveBulletin}
                >
                  {bulletinSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            <div className="cba-sidebar-tabs">
              <button type="button" className="cba-tab active">
                주보 날짜
              </button>
              <button type="button" className="cba-tab" disabled title="준비 중">
                보관함
              </button>
            </div>

            <div className="cba-date-list">
              {bulletinList.map((item) => {
                const dk = normalizeBulletinDateKey(item.bulletinDate);
                const sameDay = dk ? bulletinCountByDateKey.get(dk) ?? 1 : 1;
                const subtitle =
                  sameDay > 1
                    ? `${sameDay}건의 주보 · ${item.churchName || item.bulletinTitle || ''}`
                    : item.churchName || item.bulletinTitle || '제목 없음';
                return (
                  <button
                    key={`bulletin-date-${item.id}`}
                    type="button"
                    className={`cba-date-item${
                      editingBulletinId === item.id ? ' active' : ''
                    }`}
                    onClick={() => handleEditBulletin(item.id)}
                  >
                    <div className="meta">
                      <strong>
                        {dk ? formatKoreanFromDateKey(dk) : item.bulletinDate || '날짜 없음'}
                      </strong>
                      <span>{subtitle}</span>
                    </div>
                    <span className="cba-count-badge">{sameDay > 1 ? sameDay : '주'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="cba-lower-layout">
        <div className="cba-lower-main-wrap">
          <div className="cba-main-col">
            {editingBulletinId && bulletinEditorLoading ? (
            <div className="cba-card" style={{ minHeight: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loading />
              </div>
            </div>
          ) : editingBulletinId && bulletinEditor ? (
            <>
              <section className="cba-card">
                <div className="cba-section-head">
                  <div>
                    <h2>예배리스트</h2>
                    <p>
                      선택한 날짜에 운영되는 예배를 확인하고 예배순서를 편집할 수 있습니다.
                    </p>
                  </div>
                  <div className="cba-head-actions">
                    <button
                      type="button"
                      className="cba-btn danger"
                      onClick={() => {
                        if (
                          !window.confirm(
                            '선택한 예배를 목록에서 삭제할까요? (저장해야 서버에 반영됩니다.)'
                          )
                        )
                          return;
                        removeServiceName(selectedServiceIdx);
                      }}
                    >
                      삭제
                    </button>
                    <button type="button" className="cba-btn ghost" onClick={addServiceName}>
                      추가
                    </button>
                  </div>
                </div>

                <div className="cba-services">
                  {serviceNames.map((serviceName, idx) => (
                    <button
                      key={`service-${idx}`}
                      type="button"
                      className={`cba-service-card${selectedServiceIdx === idx ? ' active' : ''}`}
                      onClick={(e) => {
                        const t = e.target as HTMLElement;
                        if (t.closest('input,button')) return;
                        setSelectedServiceIdx(idx);
                      }}
                    >
                      <span className="cba-service-radio" aria-hidden />
                      <span className="cba-service-label">예배 {idx + 1}</span>
                      <h4>{serviceName.trim() || `예배 ${idx + 1}`}</h4>
                      <p>이름은 아래에서 바꿀 수 있습니다. 주보 공개 화면에서 확인하세요.</p>
                      <input
                        className="cba-service-field"
                        type="text"
                        value={serviceName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateServiceName(idx, e.target.value)}
                        placeholder="예배 이름"
                      />
                    </button>
                  ))}
                </div>
              </section>

              <section className="cba-card">
                <div className="cba-section-head">
                  <div>
                    <h2>예배순서</h2>
                    <p>
                      <strong>
                        {serviceNames[selectedServiceIdx]?.trim() ||
                          `예배 ${selectedServiceIdx + 1}`}
                      </strong>
                      의 순서를 편집합니다. (현재 서버 구조상 순서는 주보당 한 세트입니다.)
                    </p>
                  </div>
                  <div className="cba-head-actions">
                    <button type="button" className="cba-btn soft" onClick={addWorshipRow}>
                      추가
                    </button>
                    <button
                      type="button"
                      className="cba-btn primary"
                      onClick={handleSaveBulletin}
                      disabled={bulletinSaving}
                    >
                      {bulletinSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>

                <div className="cba-mini-stat-grid">
                  <div className="cba-mini-stat">
                    <span>선택 날짜</span>
                    <strong>{shortDateFromDateKey(selectedDateKey)}</strong>
                  </div>
                  <div className="cba-mini-stat">
                    <span>순서 행 수</span>
                    <strong>{bulletinEditor.worshipRows.length}</strong>
                  </div>
                  <div className="cba-mini-stat">
                    <span>편집</span>
                    <strong style={{ color: 'var(--cba-success)' }}>정상</strong>
                  </div>
                </div>

                <div className="cba-order-table-wrap">
                  <table className="cba-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8%' }}>#</th>
                        <th style={{ width: '22%' }}>순서명</th>
                        <th style={{ width: '18%' }}>유형</th>
                        <th>내용 / 비고</th>
                        <th style={{ width: '120px' }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulletinEditor.worshipRows.map((row, idx) => (
                        <tr key={`w-${idx}-${row.num}`}>
                          <td>
                            <input
                              className="cba-field"
                              type="text"
                              value={row.num}
                              onChange={(e) => updateWorshipRow(idx, { num: e.target.value })}
                              placeholder="번호"
                            />
                          </td>
                          <td>
                            <input
                              className="cba-field"
                              type="text"
                              value={row.title}
                              onChange={(e) => updateWorshipRow(idx, { title: e.target.value })}
                              placeholder="순서명"
                            />
                          </td>
                          <td>
                            <input
                              className="cba-field"
                              type="text"
                              value={row.sub}
                              onChange={(e) => updateWorshipRow(idx, { sub: e.target.value })}
                              placeholder="유형"
                            />
                          </td>
                          <td>
                            <input
                              className="cba-field"
                              type="text"
                              value={row.right}
                              onChange={(e) => updateWorshipRow(idx, { right: e.target.value })}
                              placeholder="내용 · 시간 등"
                            />
                          </td>
                          <td>
                            <div className="cba-head-actions" style={{ margin: 0 }}>
                              <button
                                type="button"
                                className="cba-text-btn delete"
                                onClick={() => removeWorshipRow(idx)}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cba-tfoot-actions">
                  <div className="cba-helper">
                    항목 추가 후 저장을 누르면 예배 순서가 반영됩니다.
                  </div>
                  <div className="cba-head-actions">
                    <button
                      type="button"
                      className="cba-btn ghost"
                      onClick={() => editingBulletinId && handleViewBulletin(editingBulletinId)}
                    >
                      미리보기
                    </button>
                    <button
                      type="button"
                      className="cba-btn primary"
                      onClick={handleSaveBulletin}
                      disabled={bulletinSaving}
                    >
                      {bulletinSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="cba-card">
              <div className="noPosts" style={{ padding: '40px 16px' }}>
                <p>위 목록에서 관리할 교회주보를 선택해 주세요.</p>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="cba-lower-donor-wrap">
          <aside className="cba-card cba-donor-panel">
          <div className="cba-section-head" style={{ marginBottom: 8 }}>
            <div>
              <h3>헌금자명단</h3>
              <p>선택한 주보의 헌금자 명단을 입력하고 관리합니다.</p>
            </div>
          </div>

          <input
            className="cba-search-input"
            type="search"
            placeholder="이름으로 검색"
            value={donorSearch}
            onChange={(e) => setDonorSearch(e.target.value)}
            disabled={!bulletinEditor}
          />

          <div className="cba-donor-labels">
            <div>이름</div>
            <div>구분</div>
            <div>관리</div>
          </div>

          {editingBulletinId && bulletinEditor ? (
            <>
              <div className="cba-donor-list">
                {donorRowsFiltered.map(({ row, originalIndex }) => (
                  <div key={`donor-${originalIndex}`} className="cba-donor-item">
                    <input
                      className="cba-field"
                      type="text"
                      value={row.name}
                      onChange={(e) => updateDonorRow(originalIndex, { name: e.target.value })}
                      placeholder="헌금자명"
                    />
                    <select
                      className="cba-field"
                      value={row.type}
                      onChange={(e) => updateDonorRow(originalIndex, { type: e.target.value })}
                    >
                      {['주정헌금', '십일조', '감사헌금', '선교헌금', '건축헌금'].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="cba-text-btn delete"
                      onClick={() => removeDonorRow(originalIndex)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
              <div className="cba-head-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="cba-btn soft" onClick={addDonorRow}>
                  추가
                </button>
                <button
                  type="button"
                  className="cba-btn ghost"
                  onClick={() => handleViewBulletin(editingBulletinId)}
                >
                  미리보기
                </button>
                <button
                  type="button"
                  className="cba-btn primary"
                  onClick={handleSaveBulletin}
                  disabled={bulletinSaving}
                >
                  {bulletinSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </>
          ) : (
            <p className="cba-helper" style={{ margin: 0 }}>
              주보를 선택하면 헌금자명단을 편집할 수 있습니다.
            </p>
          )}
          </aside>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
