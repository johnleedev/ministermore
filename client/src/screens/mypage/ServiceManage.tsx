import { useEffect, useMemo, useState } from 'react';
import './Mypage.scss';
import './seviceComponent/ChurchBulletinAdmin.scss';
import MypageMenu from './MypageMenu';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import Loading from '../../components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import type {
  BookletItem,
  BulletinEditorState,
  BulletinWorshipRow,
  BulletinItem,
  DonorRow,
  EventBookletItem,
  ServiceType,
} from './seviceComponent/serviceManageTypes';
import { buildCalendarCells, normalizeBulletinDateKey, parsePartsFromDateKey } from './seviceComponent/serviceManageUtils';
import ChurchBulletinAdmin from './seviceComponent/ChurchBulletinAdmin';

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
    window.open(`/event?id=${eventMainId}`, '_blank', 'noopener,noreferrer');
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div className="subpage__main__title">{serviceMeta.title}</div>
            {activeServiceType !== 'church-bulletin' ? (
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
            ) : null}
          </div>

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
                    <ChurchBulletinAdmin
                      bulletinList={bulletinList}
                      editingBulletinId={editingBulletinId}
                      bulletinEditor={bulletinEditor}
                      bulletinEditorLoading={bulletinEditorLoading}
                      bulletinSaving={bulletinSaving}
                      serviceNames={serviceNames}
                      selectedServiceIdx={selectedServiceIdx}
                      setSelectedServiceIdx={setSelectedServiceIdx}
                      donorSearch={donorSearch}
                      setDonorSearch={setDonorSearch}
                      calYM={calYM}
                      shiftCalMonth={shiftCalMonth}
                      calendarCells={calendarCells}
                      bulletinIdByDateKey={bulletinIdByDateKey}
                      selectedDateKey={selectedDateKey}
                      bulletinCountByDateKey={bulletinCountByDateKey}
                      donorRowsFiltered={donorRowsFiltered}
                      handleCreateBooklet={handleCreateBooklet}
                      handleDeleteBulletin={handleDeleteBulletin}
                      handleViewBulletin={handleViewBulletin}
                      handleEditBulletin={handleEditBulletin}
                      handleSaveBulletin={handleSaveBulletin}
                      removeServiceName={removeServiceName}
                      addServiceName={addServiceName}
                      updateServiceName={updateServiceName}
                      addWorshipRow={addWorshipRow}
                      updateWorshipRow={updateWorshipRow}
                      removeWorshipRow={removeWorshipRow}
                      addDonorRow={addDonorRow}
                      removeDonorRow={removeDonorRow}
                      updateDonorRow={updateDonorRow}
                    />
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
