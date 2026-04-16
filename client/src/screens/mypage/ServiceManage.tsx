import { useEffect, useMemo, useState } from 'react';
import './Mypage.scss';
import './ChurchBulletinAdmin.scss';
import MypageMenu from './MypageMenu';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';

interface BookletItem {
  id: number;
  title: string;
  type: string;
  churchName: string;
  mainPastor: string;
  imageMainName: string;
}

interface EventBookletItem {
  id: number;
  eventName: string;
  date: string;
  place: string;
  address: string;
  superViser: string;
  imageMainName: string;
}

interface BulletinItem {
  id: number;
  churchName: string;
  bulletinTitle: string;
  bulletinDate: string;
  imageMainName: string;
}

interface BulletinWorshipRow {
  num: string;
  title: string;
  sub: string;
  right: string;
}

interface BulletinEditorState {
  id: number;
  templateId: string;
  churchName: string;
  bulletinTitle: string;
  bulletinDate: string;
  imageMainName: string;
  introText: string;
  newsText: string;
  quiry: string;
  worshipRows: BulletinWorshipRow[];
}

interface DonorRow {
  name: string;
  type: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeBulletinDateKey(raw: string): string | null {
  const t = String(raw || '').trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const kr = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(t);
  if (kr) return `${kr[1]}-${pad2(Number(kr[2]))}-${pad2(Number(kr[3]))}`;
  return null;
}

function parsePartsFromDateKey(key: string): { y: number; m: number; d: number } | null {
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(key);
  if (!p) return null;
  return { y: +p[1], m: +p[2], d: +p[3] };
}

function formatKoreanFromDateKey(key: string | null): string {
  if (!key) return '날짜 미지정';
  const parts = parsePartsFromDateKey(key);
  if (!parts) return '날짜 미지정';
  return `${parts.y}년 ${parts.m}월 ${parts.d}일`;
}

function shortDateFromDateKey(key: string | null): string {
  if (!key) return '--/--';
  const parts = parsePartsFromDateKey(key);
  if (!parts) return '--/--';
  return `${pad2(parts.m)}/${pad2(parts.d)}`;
}

type CalCell = { kind: 'blank' } | { kind: 'day'; day: number; iso: string };

function buildCalendarCells(year: number, month: number): CalCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ kind: 'blank' });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      kind: 'day',
      day: d,
      iso: `${year}-${pad2(month)}-${pad2(d)}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: 'blank' });
  return cells;
}

type ServiceType = 'mobile-church-notice' | 'mobile-event-notice' | 'church-bulletin';

const SERVICE_META: Record<
  ServiceType,
  { title: string; createLabel: string; createPath: string; emptyText: string }
> = {
  'mobile-church-notice': {
    title: '모바일교회전단지 관리',
    createLabel: '모바일교회전단지 만들기',
    createPath: '/service/bookletnoticetemplates',
    emptyText: '신청한 모바일교회전단지가 없습니다.',
  },
  'mobile-event-notice': {
    title: '모바일행사전단지 관리',
    createLabel: '모바일행사전단지 만들기',
    createPath: '/service/bookleteventtemplates',
    emptyText: '신청한 모바일행사전단지가 없습니다.',
  },
  'church-bulletin': {
    title: '교회주보 관리',
    createLabel: '교회주보 만들기',
    createPath: '/service/bookletbulletintemplates',
    emptyText: '신청한 교회주보가 없습니다.',
  },
};

export default function ServiceManage() {
  const navigate = useNavigate();
  const { serviceType: serviceTypeParam } = useParams<{ serviceType?: string }>();
  const [userData] = useRecoilState(recoilUserData);

  const [refresh, setRefresh] = useState<boolean>(false);
  const [bookletList, setBookletList] = useState<BookletItem[]>([]);
  const [eventBookletList, setEventBookletList] = useState<EventBookletItem[]>([]);
  const [bulletinList, setBulletinList] = useState<BulletinItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingBulletinId, setEditingBulletinId] = useState<number | null>(null);
  const [bulletinEditor, setBulletinEditor] = useState<BulletinEditorState | null>(null);
  const [bulletinEditorLoading, setBulletinEditorLoading] = useState(false);
  const [bulletinSaving, setBulletinSaving] = useState(false);
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [selectedServiceIdx, setSelectedServiceIdx] = useState(0);
  const [donorRows, setDonorRows] = useState<DonorRow[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [calYM, setCalYM] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1 };
  });

  const activeServiceType: ServiceType =
    serviceTypeParam === 'mobile-event-notice' || serviceTypeParam === 'church-bulletin'
      ? serviceTypeParam
      : 'mobile-church-notice';
  const serviceMeta = SERVICE_META[activeServiceType];

  const parseWorshipRows = (raw: unknown): BulletinWorshipRow[] => {
    if (raw == null || raw === false) return [];
    let arr: unknown[] = [];
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === 'string') {
      const t = raw.trim();
      if (!t || t === 'false') return [];
      try {
        const p = JSON.parse(t);
        arr = Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    } else return [];
    return arr.map((row, i) => {
      const r = row as Record<string, unknown>;
      return {
        num: String(r.num ?? i + 1),
        title: r.title != null ? String(r.title) : '',
        sub: r.sub != null ? String(r.sub) : '',
        right: r.right != null ? String(r.right) : r.rightText != null ? String(r.rightText) : '',
      };
    });
  };

  const normalizeEditorState = (raw: Record<string, unknown>): BulletinEditorState => ({
    id: Number(raw.id ?? 0),
    templateId: String(raw.templateId || 'classic'),
    churchName: String(raw.churchName || ''),
    bulletinTitle: String(raw.bulletinTitle || ''),
    bulletinDate: String(raw.bulletinDate || ''),
    imageMainName: String(raw.imageMainName || ''),
    introText: String(raw.introText || ''),
    newsText: String(raw.newsText || ''),
    quiry: String(raw.quiry || ''),
    worshipRows: parseWorshipRows(raw.worshipRows),
  });

  const parseServiceNames = (introText: string): string[] => {
    const lines = String(introText || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : ['주일1부예배'];
  };

  const parseDonorRows = (quiry: string): DonorRow[] => {
    const lines = String(quiry || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    const parsed = lines.map((line) => {
      const [name = '', type = '주정헌금'] = line.split('|').map((v) => v.trim());
      return { name, type: type || '주정헌금' };
    });
    return parsed.length > 0 ? parsed : [{ name: '', type: '주정헌금' }];
  };

  const fetchBookletList = async () => {
    const account = userData?.userAccount;
    if (!account) {
      setBookletList([]);
      setEventBookletList([]);
      setBulletinList([]);
      return;
    }
    setLoading(true);
    try {
      const [churchRes, eventRes, bulletinRes] = await Promise.all([
        axios.get(`${MainURL}/bookletnoticemain/getUserBooklets/${account}`),
        axios.get(`${MainURL}/bookleteventcreate/getUserBooklets/${account}`),
        axios.get(`${MainURL}/bulletinmain/getUserBulletins/${account}`),
      ]);
      if (churchRes.data?.success && Array.isArray(churchRes.data.data)) {
        setBookletList(churchRes.data.data);
      } else {
        setBookletList([]);
      }
      if (eventRes.data?.success && Array.isArray(eventRes.data.data)) {
        setEventBookletList(eventRes.data.data);
      } else {
        setEventBookletList([]);
      }
      if (bulletinRes.data?.success && Array.isArray(bulletinRes.data.data)) {
        setBulletinList(bulletinRes.data.data);
      } else {
        setBulletinList([]);
      }
    } catch (error) {
      setBookletList([]);
      setEventBookletList([]);
      setBulletinList([]);
      console.error('모바일 서비스 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookletList();
  }, [refresh, userData?.userAccount]);

  useEffect(() => {
    setDonorSearch('');
  }, [editingBulletinId]);

  useEffect(() => {
    if (activeServiceType !== 'church-bulletin') return;
    const item = bulletinList.find((b) => b.id === editingBulletinId);
    const k = item ? normalizeBulletinDateKey(item.bulletinDate) : null;
    const p = k ? parsePartsFromDateKey(k) : null;
    if (p) setCalYM({ y: p.y, m: p.m });
  }, [activeServiceType, editingBulletinId, bulletinList]);

  const bulletinIdByDateKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bulletinList) {
      const k = normalizeBulletinDateKey(b.bulletinDate);
      if (k && !m.has(k)) m.set(k, b.id);
    }
    return m;
  }, [bulletinList]);

  const bulletinCountByDateKey = useMemo(() => {
    const c = new Map<string, number>();
    for (const b of bulletinList) {
      const k = normalizeBulletinDateKey(b.bulletinDate);
      if (!k) continue;
      c.set(k, (c.get(k) || 0) + 1);
    }
    return c;
  }, [bulletinList]);

  const selectedDateKey = useMemo(() => {
    const item = bulletinList.find((x) => x.id === editingBulletinId);
    return item ? normalizeBulletinDateKey(item.bulletinDate) : null;
  }, [bulletinList, editingBulletinId]);

  const calendarCells = useMemo(
    () => buildCalendarCells(calYM.y, calYM.m),
    [calYM.y, calYM.m]
  );

  const donorRowsFiltered = useMemo(() => {
    const q = donorSearch.trim().toLowerCase();
    return donorRows
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => !q || (row.name || '').toLowerCase().includes(q));
  }, [donorRows, donorSearch]);

  const shiftCalMonth = (delta: number) => {
    setCalYM(({ y, m }) => {
      let nm = m + delta;
      let ny = y;
      if (nm > 12) {
        nm = 1;
        ny += 1;
      }
      if (nm < 1) {
        nm = 12;
        ny -= 1;
      }
      return { y: ny, m: nm };
    });
  };

  const handleDeleteBooklet = async (bookletId: number) => {
    if (window.confirm('정말로 이 전단지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      try {
        const res = await axios.post(`${MainURL}/bookletnoticecreate/deleteBooklet`, {
          churchMainId: bookletId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
          alert('전단지가 삭제되었습니다.');
          setRefresh(!refresh);
        } else {
          alert(res.data?.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제에 실패했습니다.');
        console.error('삭제 실패:', error);
      }
    }
  };

  const handleDeleteEventBooklet = async (eventMainId: number) => {
    if (window.confirm('정말로 이 행사 전단지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      try {
        const res = await axios.post(`${MainURL}/bookleteventcreate/deleteBooklet`, {
          eventMainId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
          alert('행사 전단지가 삭제되었습니다.');
          setRefresh(!refresh);
        } else {
          alert(res.data?.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제에 실패했습니다.');
        console.error('행사 전단지 삭제 실패:', error);
      }
    }
  };

  const handleViewBooklet = (bookletId: number) => {
    window.open(`/booklet?id=${bookletId}`, '_blank', 'noopener,noreferrer');
  };

  const handleViewEventBooklet = (eventMainId: number) => {
    window.open(`/eventbooklet?id=${eventMainId}`, '_blank', 'noopener,noreferrer');
  };
  const handleViewBulletin = (bulletinMainId: number) => {
    window.open(`/bulletin?id=${bulletinMainId}`, '_blank', 'noopener,noreferrer');
  };

  const handleEditBooklet = (bookletId: number) => {
    navigate(`/service/bookletnoticecreate?id=${bookletId}`);
    window.scrollTo(0, 0);
  };

  const handleEditEventBooklet = (eventMainId: number) => {
    navigate(`/service/bookleteventcreate?id=${eventMainId}`);
    window.scrollTo(0, 0);
  };
  const handleEditBulletin = async (bulletinMainId: number) => {
    if (editingBulletinId === bulletinMainId) {
      setEditingBulletinId(null);
      setBulletinEditor(null);
      return;
    }
    setEditingBulletinId(bulletinMainId);
    setBulletinEditorLoading(true);
    try {
      const res = await axios.post(`${MainURL}/bulletinmain/getdatabookletspart`, { id: bulletinMainId });
      const payload = res.data;
      if (Array.isArray(payload) && payload[0] && typeof payload[0] === 'object') {
        const normalized = normalizeEditorState(payload[0] as Record<string, unknown>);
        setBulletinEditor(normalized);
        setServiceNames(parseServiceNames(normalized.introText));
        setSelectedServiceIdx(0);
        setDonorRows(parseDonorRows(normalized.quiry));
      } else {
        setBulletinEditor(null);
        alert('주보 데이터를 불러오지 못했습니다.');
      }
    } catch (error) {
      setBulletinEditor(null);
      alert('주보 데이터를 불러오지 못했습니다.');
      console.error('교회주보 조회 실패:', error);
    } finally {
      setBulletinEditorLoading(false);
    }
  };

  const handleBulletinEditorChange = <K extends keyof BulletinEditorState>(
    key: K,
    value: BulletinEditorState[K]
  ) => {
    setBulletinEditor((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateWorshipRow = (index: number, patch: Partial<BulletinWorshipRow>) => {
    setBulletinEditor((prev) => {
      if (!prev) return prev;
      const nextRows = [...prev.worshipRows];
      nextRows[index] = { ...nextRows[index], ...patch };
      return { ...prev, worshipRows: nextRows };
    });
  };

  const addWorshipRow = () => {
    setBulletinEditor((prev) => {
      if (!prev) return prev;
      const nextNum = String(prev.worshipRows.length + 1);
      return {
        ...prev,
        worshipRows: [...prev.worshipRows, { num: nextNum, title: '', sub: '', right: '' }],
      };
    });
  };

  const removeWorshipRow = (index: number) => {
    setBulletinEditor((prev) => {
      if (!prev || prev.worshipRows.length <= 1) return prev;
      const nextRows = prev.worshipRows.filter((_, i) => i !== index).map((row, i) => ({
        ...row,
        num: String(i + 1),
      }));
      return { ...prev, worshipRows: nextRows };
    });
  };

  const updateServiceName = (index: number, value: string) => {
    setServiceNames((prev) => prev.map((name, idx) => (idx === index ? value : name)));
  };

  const addServiceName = () => {
    setServiceNames((prev) => [...prev, '새 예배']);
    setSelectedServiceIdx(serviceNames.length);
  };

  const removeServiceName = (index: number) => {
    setServiceNames((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      setSelectedServiceIdx((cur) => Math.max(0, Math.min(cur, next.length - 1)));
      return next;
    });
  };

  const updateDonorRow = (index: number, patch: Partial<DonorRow>) => {
    setDonorRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addDonorRow = () => {
    setDonorRows((prev) => [...prev, { name: '', type: '주정헌금' }]);
  };

  const removeDonorRow = (index: number) => {
    setDonorRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSaveBulletin = async () => {
    if (!bulletinEditor) return;
    if (!bulletinEditor.churchName.trim() || !bulletinEditor.bulletinTitle.trim()) {
      alert('교회명과 주보 제목은 필수입니다.');
      return;
    }
    setBulletinSaving(true);
    try {
      const introTextPayload = serviceNames.map((v) => v.trim()).filter(Boolean).join('\n');
      const donorPayload = donorRows
        .map((d) => `${(d.name || '').trim()}|${(d.type || '').trim()}`)
        .filter((v) => v.replace('|', '').trim())
        .join('\n');
      const res = await axios.post(`${MainURL}/bulletincreate/save`, {
        bulletinMainId: bulletinEditor.id,
        templateId: bulletinEditor.templateId || 'classic',
        churchName: bulletinEditor.churchName,
        bulletinTitle: bulletinEditor.bulletinTitle,
        bulletinDate: bulletinEditor.bulletinDate,
        imageMainName: bulletinEditor.imageMainName,
        introText: introTextPayload,
        newsText: bulletinEditor.newsText,
        quiry: donorPayload,
        worshipRows: bulletinEditor.worshipRows,
      });
      if (res.data?.success) {
        alert('교회주보가 업데이트되었습니다.');
        setRefresh(!refresh);
      } else {
        alert('업데이트에 실패했습니다.');
      }
    } catch (error) {
      alert('업데이트에 실패했습니다.');
      console.error('교회주보 업데이트 실패:', error);
    } finally {
      setBulletinSaving(false);
    }
  };

  const handleDeleteBulletin = async (bulletinMainId: number) => {
    if (window.confirm('정말로 이 교회주보를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      try {
        const res = await axios.post(`${MainURL}/bulletincreate/deleteBulletin`, {
          bulletinMainId,
          userAccount: userData?.userAccount,
        });
        if (res.data?.success) {
          alert('교회주보가 삭제되었습니다.');
          if (bulletinMainId === editingBulletinId) {
            setEditingBulletinId(null);
            setBulletinEditor(null);
          }
          setRefresh(!refresh);
        } else {
          alert(res.data?.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        alert('삭제에 실패했습니다.');
        console.error('교회주보 삭제 실패:', error);
      }
    }
  };

  const handleCreateBooklet = () => {
    navigate(serviceMeta.createPath);
    window.scrollTo(0, 0);
  };

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          {!(activeServiceType === 'church-bulletin' && bulletinList.length > 0) ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div className="subpage__main__title">{serviceMeta.title}</div>
              <button
                onClick={handleCreateBooklet}
                style={{
                  padding: '12px 24px',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {serviceMeta.createLabel}
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '12px' }} />
          )}

          <div className="subpage__main__content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                {(activeServiceType === 'mobile-church-notice' && bookletList.length > 0) ||
                (activeServiceType === 'mobile-event-notice' && eventBookletList.length > 0) ||
                (activeServiceType === 'church-bulletin' && bulletinList.length > 0) ? (
                  activeServiceType === 'church-bulletin' ? (
                    <div className="church-bulletin-admin">
                      <div className="cba-window">
                        <div className="cba-browser-bar">
                          <div className="cba-traffic-lights" aria-hidden="true">
                            <span className="red" />
                            <span className="yellow" />
                            <span className="green" />
                          </div>
                          <div className="cba-browser-search">church-bulletin-admin.local</div>
                          <div className="cba-browser-actions" aria-hidden="true">
                            <span>↶</span>
                            <span>↷</span>
                            <span>⋯</span>
                          </div>
                        </div>

                        <div className="cba-app">
                          <div className="cba-topbar">
                            <div className="cba-title-wrap">
                              <h1>온라인 주보 관리자</h1>
                              <p>
                                날짜별 예배리스트, 예배순서, 헌금자명단을 한 화면에서 편집하고 저장합니다.
                              </p>
                            </div>
                            <div className="cba-topbar-right">
                              <button type="button" className="cba-icon-btn" aria-label="알림">
                                🔔
                              </button>
                              <button type="button" className="cba-icon-btn" aria-label="검색">
                                ⌕
                              </button>
                              <div className="cba-avatar" aria-label="계정">
                                관
                              </div>
                            </div>
                          </div>

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
                                onClick={() =>
                                  editingBulletinId && handleViewBulletin(editingBulletinId)
                                }
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

                          <div className="cba-layout">
                            <aside className="cba-card cba-sidebar">
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
                                      return (
                                        <div key={`cal-blank-${ci}`} className="cba-date-cell muted" />
                                      );
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
                                          {dk
                                            ? formatKoreanFromDateKey(dk)
                                            : item.bulletinDate || '날짜 없음'}
                                        </strong>
                                        <span>{subtitle}</span>
                                      </div>
                                      <span className="cba-count-badge">{sameDay > 1 ? sameDay : '주'}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </aside>

                            <div className="cba-content-col">
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
                                          className={`cba-service-card${
                                            selectedServiceIdx === idx ? ' active' : ''
                                          }`}
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
                                                  onChange={(e) =>
                                                    updateWorshipRow(idx, { num: e.target.value })
                                                  }
                                                  placeholder="번호"
                                                />
                                              </td>
                                              <td>
                                                <input
                                                  className="cba-field"
                                                  type="text"
                                                  value={row.title}
                                                  onChange={(e) =>
                                                    updateWorshipRow(idx, { title: e.target.value })
                                                  }
                                                  placeholder="순서명"
                                                />
                                              </td>
                                              <td>
                                                <input
                                                  className="cba-field"
                                                  type="text"
                                                  value={row.sub}
                                                  onChange={(e) =>
                                                    updateWorshipRow(idx, { sub: e.target.value })
                                                  }
                                                  placeholder="유형"
                                                />
                                              </td>
                                              <td>
                                                <input
                                                  className="cba-field"
                                                  type="text"
                                                  value={row.right}
                                                  onChange={(e) =>
                                                    updateWorshipRow(idx, { right: e.target.value })
                                                  }
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
                                          onClick={() =>
                                            editingBulletinId && handleViewBulletin(editingBulletinId)
                                          }
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
                                    <p>왼쪽에서 관리할 교회주보를 선택해 주세요.</p>
                                  </div>
                                </div>
                              )}
                            </div>

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
                                          onChange={(e) =>
                                            updateDonorRow(originalIndex, { name: e.target.value })
                                          }
                                          placeholder="헌금자명"
                                        />
                                        <select
                                          className="cba-field"
                                          value={row.type}
                                          onChange={(e) =>
                                            updateDonorRow(originalIndex, { type: e.target.value })
                                          }
                                        >
                                          {['주정헌금', '십일조', '감사헌금', '선교헌금', '건축헌금'].map(
                                            (type) => (
                                              <option key={type} value={type}>
                                                {type}
                                              </option>
                                            )
                                          )}
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
                  ) : (
                  <div className="postingList">
                    {activeServiceType === 'mobile-church-notice' &&
                      bookletList.map((item) => (
                      <div key={`church-${item.id}`} className="postingItem">
                        <div className="postingHeader">
                          <div className="postingTitle">
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '5px',
                              }}
                            >
                              <span className="categoryTag">교회 전단지</span>
                              <h3 style={{ margin: 0 }}>
                                {item.churchName || item.title || '제목 없음'}
                              </h3>
                            </div>
                            {item.mainPastor && (
                              <span className="postingDate">담임: {item.mainPastor}</span>
                            )}
                          </div>
                          <div className="postingActions">
                            <button
                              className="actionBtn viewBtn"
                              onClick={() => handleViewBooklet(item.id)}
                            >
                              보기
                            </button>
                            <button
                              className="actionBtn editBtn"
                              onClick={() => handleEditBooklet(item.id)}
                            >
                              수정
                            </button>
                            <button
                              className="actionBtn deleteBtn"
                              onClick={() => handleDeleteBooklet(item.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="postingInfo">
                          <div className="infoRow">
                            <span className="infoLabel">교회명:</span>
                            <span className="infoValue">{item.churchName || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">담임목사:</span>
                            <span className="infoValue">{item.mainPastor || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activeServiceType === 'mobile-event-notice' &&
                      eventBookletList.map((item) => (
                      <div key={`event-${item.id}`} className="postingItem">
                        <div className="postingHeader">
                          <div className="postingTitle">
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '5px',
                              }}
                            >
                              <span className="categoryTag">행사 전단지</span>
                              <h3 style={{ margin: 0 }}>{item.eventName || '행사명 없음'}</h3>
                            </div>
                            {(item.date || item.place) && (
                              <span className="postingDate">
                                {[item.date, item.place].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </div>
                          <div className="postingActions">
                            <button
                              className="actionBtn viewBtn"
                              onClick={() => handleViewEventBooklet(item.id)}
                            >
                              보기
                            </button>
                            <button
                              className="actionBtn editBtn"
                              onClick={() => handleEditEventBooklet(item.id)}
                            >
                              수정
                            </button>
                            <button
                              className="actionBtn deleteBtn"
                              onClick={() => handleDeleteEventBooklet(item.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div className="postingInfo">
                          <div className="infoRow">
                            <span className="infoLabel">행사명:</span>
                            <span className="infoValue">{item.eventName || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">일시:</span>
                            <span className="infoValue">{item.date || '-'}</span>
                          </div>
                          <div className="infoRow">
                            <span className="infoLabel">장소:</span>
                            <span className="infoValue">{item.place || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )
                ) : (
                  <div className="noPosts">
                    <p>{serviceMeta.emptyText}</p>
                    <button
                      onClick={handleCreateBooklet}
                      style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        background: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '16px',
                        cursor: 'pointer',
                      }}
                    >
                      {serviceMeta.createLabel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
