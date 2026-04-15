import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './BulletinCreate.scss';
import {
  type BulletinEditorTabId,
  type BulletinTemplateId,
  BULLETIN_EDITOR_TABS,
  DEFAULT_BULLETIN_TEMPLATE,
} from './bulletinTemplateTypes';

type WorshipRow = {
  num: string;
  title: string;
  sub: string;
  right: string;
};

function emptyWorshipRows(): WorshipRow[] {
  return [
    { num: '1', title: '예배로 부름', sub: 'Call to Worship', right: '09:00' },
    { num: '2', title: '찬양과 기도', sub: 'Praise & Prayer', right: '09:10' },
    { num: '3', title: '말씀 선포', sub: 'Sermon Message', right: '09:30' },
  ];
}

export default function BulletinCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const titleFromQuery = searchParams.get('title')?.trim() ?? '';

  const [templateId] = useState<BulletinTemplateId>(DEFAULT_BULLETIN_TEMPLATE);
  const [activeTab, setActiveTab] = useState<BulletinEditorTabId>('info');

  const [churchName, setChurchName] = useState('');
  const [bulletinTitle, setBulletinTitle] = useState(() => titleFromQuery || '이번 주 주보');
  const [bulletinDate, setBulletinDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [worshipRows, setWorshipRows] = useState<WorshipRow[]>(() => emptyWorshipRows());
  const [newsText, setNewsText] = useState(
    '교회 소식, 행사 안내, 헌금 안내, 새가족 안내 문구를 입력하세요.'
  );

  const displayDate = useMemo(() => {
    const raw = bulletinDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw || '날짜';
    const [y, m, d] = raw.split('-').map(Number);
    return `${y}년 ${m}월 ${d}일`;
  }, [bulletinDate]);

  const updateRow = useCallback((index: number, patch: Partial<WorshipRow>) => {
    setWorshipRows((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return prev;
      next[index] = { ...cur, ...patch };
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setWorshipRows((prev) => {
      const n = String(prev.length + 1);
      return [...prev, { num: n, title: '', sub: '', right: '' }];
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    setWorshipRows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next.map((r, i) => ({ ...r, num: String(i + 1) }));
    });
  }, []);

  const handleSave = useCallback(() => {
    navigate('/service/bookletbulletincomplete');
  }, [navigate]);

  const previewTabsClass = `bulletin-create__tabs-wrap--${templateId}`;

  return (
    <div className="bulletin-create">
      <div className="bulletin-create__body">
        <div className="bulletin-create__inner">
          <aside className="bulletin-create__preview-wrap" aria-label="미리보기">
            <div className="bulletin-create__phone-frame">
              <div className="bulletin-create__phone-notch" />
              <div className="bulletin-create__phone-screen">
                <div className="bulletin-create__preview">
                  <div className="bulletin-create__preview-hero">
                    <p className="bulletin-create__preview-hero-kicker">Sunday Worship Bulletin</p>
                    <h2 className="bulletin-create__preview-hero-title">
                      {churchName.trim() || '교회 이름'}
                    </h2>
                    <p className="bulletin-create__preview-hero-date">
                      {bulletinTitle.trim() || '이번 주 주보'} · {displayDate}
                    </p>
                  </div>

                  <div className={`bulletin-create__preview-tabs ${previewTabsClass}`}>
                    {BULLETIN_EDITOR_TABS.map((t) => (
                      <div
                        key={t.id}
                        className={`bulletin-create__preview-tab ${activeTab === t.id ? 'on' : ''}`}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>

                  <div className="bulletin-create__preview-body">
                    {activeTab === 'info' && (
                      <>
                        <p className="bulletin-create__preview-section-title">기본 정보</p>
                        <p className="bulletin-create__preview-news">
                          {churchName.trim()
                            ? `${churchName}의 모바일 주보입니다.`
                            : '교회 이름을 입력하면 미리보기에 반영됩니다.'}
                        </p>
                      </>
                    )}
                    {activeTab === 'order' && (
                      <>
                        <p className="bulletin-create__preview-section-title">예배 순서</p>
                        <div className="bulletin-create__order-list">
                          {worshipRows.map((r) => (
                            <div key={r.num} className="bulletin-create__order-item">
                              <div className="bulletin-create__order-left">
                                <div className="bulletin-create__order-num">{r.num}</div>
                                <div className="bulletin-create__order-label">
                                  <b>{r.title.trim() || '제목'}</b>
                                  <span>{r.sub.trim() || '부제목'}</span>
                                </div>
                              </div>
                              <span className="bulletin-create__order-right">
                                {r.right.trim() || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {activeTab === 'news' && (
                      <>
                        <p className="bulletin-create__preview-section-title">이번 주 안내</p>
                        {newsText.trim() ? (
                          <p className="bulletin-create__preview-news">{newsText}</p>
                        ) : (
                          <p className="bulletin-create__preview-empty">안내 문구를 입력하세요.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="bulletin-create__form-wrap" aria-label="주보 입력">
            <div className="bulletin-create__form-scroll">
              <div className="bulletin-create__form-head">
                <h1>모바일 주보 작성</h1>
                <p>왼쪽 미리보기와 함께 기본 정보, 예배 순서, 안내 문구를 입력합니다.</p>
              </div>

              <div className="bulletin-create__tab-bar" role="tablist">
                {BULLETIN_EDITOR_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === t.id}
                    className={activeTab === t.id ? 'on' : ''}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <>
                  <div className="bulletin-create__field">
                    <label htmlFor="bulletin-church">교회 이름</label>
                    <input
                      id="bulletin-church"
                      type="text"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      placeholder="예: ○○교회"
                      autoComplete="organization"
                    />
                  </div>
                  <div className="bulletin-create__field">
                    <label htmlFor="bulletin-heading">주보 제목</label>
                    <input
                      id="bulletin-heading"
                      type="text"
                      value={bulletinTitle}
                      onChange={(e) => setBulletinTitle(e.target.value)}
                      placeholder="예: 제○○주 주일예배"
                    />
                  </div>
                  <div className="bulletin-create__field">
                    <label htmlFor="bulletin-date">주보 날짜</label>
                    <input
                      id="bulletin-date"
                      type="date"
                      value={bulletinDate}
                      onChange={(e) => setBulletinDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {activeTab === 'order' && (
                <div className="bulletin-create__order-editor">
                  {worshipRows.map((row, i) => (
                    <div key={i} className="bulletin-create__order-row">
                      <div className="bulletin-create__order-row-grid">
                        <div className="bulletin-create__field">
                          <label htmlFor={`ord-title-${i}`}>순서 제목</label>
                          <input
                            id={`ord-title-${i}`}
                            type="text"
                            value={row.title}
                            onChange={(e) => updateRow(i, { title: e.target.value })}
                          />
                        </div>
                        <div className="bulletin-create__field">
                          <label htmlFor={`ord-sub-${i}`}>영문/부제</label>
                          <input
                            id={`ord-sub-${i}`}
                            type="text"
                            value={row.sub}
                            onChange={(e) => updateRow(i, { sub: e.target.value })}
                          />
                        </div>
                        <div className="bulletin-create__field">
                          <label htmlFor={`ord-time-${i}`}>시간</label>
                          <input
                            id={`ord-time-${i}`}
                            type="text"
                            value={row.right}
                            onChange={(e) => updateRow(i, { right: e.target.value })}
                            placeholder="09:00"
                          />
                        </div>
                      </div>
                      <div className="bulletin-create__order-row-actions">
                        <button
                          type="button"
                          className="bulletin-create__btn-ghost"
                          onClick={() => removeRow(i)}
                        >
                          이 항목 삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="bulletin-create__btn-add" onClick={addRow}>
                    + 순서 항목 추가
                  </button>
                </div>
              )}

              {activeTab === 'news' && (
                <div className="bulletin-create__field">
                  <label htmlFor="bulletin-news">이번 주 안내</label>
                  <textarea
                    id="bulletin-news"
                    value={newsText}
                    onChange={(e) => setNewsText(e.target.value)}
                    placeholder="교회 소식, 행사, 헌금, 새가족 안내 등"
                  />
                </div>
              )}
            </div>

            <div className="bulletin-create__form-footer">
              <button
                type="button"
                className="bulletin-create__btn-secondary"
                onClick={() => navigate(-1)}
              >
                이전
              </button>
              <button type="button" className="bulletin-create__btn-primary" onClick={handleSave}>
                저장 완료
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
