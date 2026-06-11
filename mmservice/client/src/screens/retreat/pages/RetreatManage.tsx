import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';
import { fetchRetreatList } from '../../../api/retreatApi';
import RetreatApplicantsModal from '../components/RetreatApplicantsModal';
import type { RetreatListItem } from '../lib/types';
import MainURL from '../../../MainURL';
import './RetreatManage.scss';

const RETREAT_APPLY_URL = 'https://ministermore.co.kr/service/retreat';

const THUMB_GRADIENTS = [
  'linear-gradient(135deg, #103877, #0a2a5e)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #22C55E, #16A34A)',
  'linear-gradient(135deg, #A78BFA, #7C3AED)',
  'linear-gradient(135deg, #EC4899, #BE185D)',
];

type FilterTab = 'all' | 'active' | 'draft';

function formatDate(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString('ko-KR');
}

function getStatus(item: RetreatListItem) {
  if (item.hasInfo) {
    return { label: '진행중', variant: 'green' as const };
  }
  return { label: '제작전', variant: 'blue' as const };
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function RetreatThumbIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 20l9-16 9 16H3z" />
    </svg>
  );
}

export default function RetreatManage() {
  const navigate = useNavigate();
  const userAccount = useRecoilValue(recoilUserData)?.userAccount?.trim() || '';

  const [list, setList] = useState<RetreatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicantsTarget, setApplicantsTarget] = useState<RetreatListItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    if (!userAccount) {
      setList([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRetreatList(userAccount)
      .then((rows) => {
        if (!cancelled) setList(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userAccount]);

  const stats = useMemo(() => {
    const active = list.filter((item) => item.hasInfo).length;
    const draft = list.filter((item) => !item.hasInfo).length;
    return { total: list.length, active, draft };
  }, [list]);

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = [...list];

    if (filterTab === 'active') {
      rows = rows.filter((item) => item.hasInfo);
    } else if (filterTab === 'draft') {
      rows = rows.filter((item) => !item.hasInfo);
    }

    if (query) {
      rows = rows.filter((item) => {
        const title = `${item.orderTitle || ''} ${item.eventName || ''}`.toLowerCase();
        return title.includes(query);
      });
    }

    rows.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortNewest ? tb - ta : ta - tb;
    });

    return rows;
  }, [list, filterTab, search, sortNewest]);

  const resolvePublicLink = (item: RetreatListItem) => {
    if (item.link?.trim()) return item.link.trim();
    return `${MainURL.replace(/\/$/, '')}/retreat/view?id=${item.id}`;
  };

  const copyLink = async (item: RetreatListItem) => {
    const url = resolvePublicLink(item);
    try {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    } catch {
      window.prompt('아래 링크를 복사하세요.', url);
    }
  };

  const handleCreateNew = () => {
    const draft = list.find((item) => !item.hasInfo);
    if (draft) {
      navigate(`/retreat/edit/${draft.id}`);
      window.scrollTo(0, 0);
      return;
    }
    window.open(RETREAT_APPLY_URL, '_blank', 'noopener,noreferrer');
  };

  const goToEdit = (id: number) => {
    navigate(`/retreat/edit/${id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="retreat-manage">
      <div className="retreat-manage__container">
        <nav className="retreat-manage__breadcrumb" aria-label="breadcrumb">
          <Link to="/">홈</Link>
          <span className="sep">/</span>
          <span className="current">수련회 전단지 관리</span>
        </nav>

        <section className="retreat-manage__page-header">
          <div>
            <h1 className="retreat-manage__page-title">수련회 전단지 관리</h1>
            <p className="retreat-manage__page-subtitle">
              수련회 모바일 전단지를 만들고 관리하세요
            </p>
          </div>
          <button type="button" className="retreat-manage__btn-primary" onClick={handleCreateNew}>
            <PlusIcon />
            새 전단지 만들기
          </button>
        </section>

        <div className="retreat-manage__stats">
          <div className="retreat-manage__chip">
            전체 <span className="num">{stats.total}</span>
          </div>
          <div className="retreat-manage__chip retreat-manage__chip--green">
            <span className="dot-sm" />
            진행중 <span className="num">{stats.active}</span>
          </div>
          <div className="retreat-manage__chip retreat-manage__chip--blue">
            <span className="dot-sm" />
            제작전 <span className="num">{stats.draft}</span>
          </div>
        </div>

        <div className="retreat-manage__toolbar">
          <div className="retreat-manage__search">
            <SearchIcon />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="전단지 검색..."
            />
          </div>
          <div className="retreat-manage__tabs" role="tablist" aria-label="전단지 필터">
            {(
              [
                { id: 'all', label: '전체' },
                { id: 'active', label: '진행중' },
                { id: 'draft', label: '제작전' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filterTab === tab.id}
                className={`retreat-manage__tab${filterTab === tab.id ? ' active' : ''}`}
                onClick={() => setFilterTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="retreat-manage__toolbar-right">
            <button
              type="button"
              className="retreat-manage__sort-btn"
              onClick={() => setSortNewest((prev) => !prev)}
            >
              {sortNewest ? '최신순' : '오래된순'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <p className="retreat-manage__status-msg retreat-manage__status-msg--loading">
            목록을 불러오는 중…
          </p>
        ) : null}

        {error ? (
          <p className="retreat-manage__status-msg retreat-manage__status-msg--error">{error}</p>
        ) : null}

        {!loading && !error && list.length === 0 ? (
          <div className="retreat-manage__status-msg retreat-manage__status-msg--empty">
            <p>결제된 수련회 전단지가 없습니다.</p>
            <p>사역자모아에서 수련회 전단지 서비스를 신청·결제해 주세요.</p>
          </div>
        ) : null}

        <section className="retreat-manage__grid">
          {filteredList.map((item, index) => {
            const status = getStatus(item);
            const thumbVariant = (index % 5) + 1;
            const phoneTitle = item.eventName || item.orderTitle || '수련회 전단지';
            const cardTitle = item.orderTitle || item.eventName || '제목 없음';
            const createdLabel = formatDate(item.createdAt) || `ID ${item.id}`;

            return (
              <article key={item.id} className="retreat-manage__card">
                <div className={`retreat-manage__thumb retreat-manage__thumb--var-${thumbVariant}`}>
                  <span className={`retreat-manage__badge-status retreat-manage__badge-status--${status.variant}`}>
                    <span className="dot-sm" />
                    {status.label}
                  </span>
                  <div
                    className={`retreat-manage__thumb-phone${
                      !item.hasInfo ? ' retreat-manage__thumb-phone--muted' : ''
                    }`}
                  >
                    <div
                      className="retreat-manage__ph-illust"
                      style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
                    >
                      <RetreatThumbIcon />
                    </div>
                    <div className="retreat-manage__ph-title">{phoneTitle}</div>
                    <div className="retreat-manage__ph-date">{createdLabel}</div>
                  </div>
                </div>

                <div className="retreat-manage__card-body">
                  <h3 className="retreat-manage__card-title">{cardTitle}</h3>
                  <div className="retreat-manage__meta-list">
                    <div className="retreat-manage__meta-row">
                      <CalendarIcon />
                      {item.hasInfo
                        ? item.eventName || '수련회명 입력됨'
                        : '아직 전단지가 생성되지 않았습니다'}
                    </div>
                    <div className="retreat-manage__meta-row">
                      <EyeIcon />
                      결제일 <strong>{createdLabel}</strong>
                    </div>
                  </div>
                  <div className="retreat-manage__card-actions">
                    <button
                      type="button"
                      className="retreat-manage__btn-edit"
                      onClick={() => goToEdit(item.id)}
                    >
                      <EditIcon />
                      {item.hasInfo ? '편집하기' : '제작하기'}
                    </button>
                    {item.hasInfo ? (
                      <>
                        <button
                          type="button"
                          className="retreat-manage__btn-icon"
                          aria-label="참가 신청자"
                          onClick={() => setApplicantsTarget(item)}
                        >
                          <ChartIcon />
                        </button>
                        <button
                          type="button"
                          className="retreat-manage__btn-icon"
                          aria-label="링크 공유"
                          onClick={() => void copyLink(item)}
                        >
                          <ShareIcon />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          <button type="button" className="retreat-manage__card-add" onClick={handleCreateNew}>
            <div className="retreat-manage__plus-circle">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <p>새 전단지 만들기</p>
            <small>결제 후 전단지를 제작하세요</small>
          </button>
        </section>
      </div>

      {applicantsTarget ? (
        <RetreatApplicantsModal
          bookletId={applicantsTarget.id}
          userAccount={userAccount}
          title={applicantsTarget.eventName || applicantsTarget.orderTitle || ''}
          onClose={() => setApplicantsTarget(null)}
        />
      ) : null}
    </div>
  );
}
