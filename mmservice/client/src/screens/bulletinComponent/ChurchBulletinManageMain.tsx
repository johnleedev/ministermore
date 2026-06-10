import { useEffect, useMemo, useState } from 'react';
import '../Mypage.scss';
import './ChurchBulletinAdmin.scss';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../../../ministermore/client/src/MainURL';
import Loading from '../../../../../ministermore/client/src/components/Loading';
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../../../ministermore/client/src/RecoilStore';
import type {
  BulletinEditorState,
  BulletinWorshipRow,
  BulletinItem,
  DonorRow,
} from './serviceManageTypes';
import {
  buildCalendarCells,
  normalizeBulletinDateKey,
  parsePartsFromDateKey,
} from './serviceManageUtils';
import ChurchBulletinAdmin from './ChurchBulletinAdmin';

const BULLETIN_CREATE = '/service/bookletbulletintemplates';
const BULLETIN_EMPTY = '신청한 교회주보가 없습니다.';

export default function ChurchBulletinManagePage() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);

  const [refresh, setRefresh] = useState(false);
  const [bulletinList, setBulletinList] = useState<BulletinItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  const fetchBulletinList = async () => {
    const account = userData?.userAccount;
    if (!account) {
      setBulletinList([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${MainURL}/bulletinmain/getUserBulletins/${account}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBulletinList(res.data.data);
      } else {
        setBulletinList([]);
      }
    } catch (error) {
      setBulletinList([]);
      console.error('교회주보 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletinList();
  }, [refresh, userData?.userAccount]);

  useEffect(() => {
    setDonorSearch('');
  }, [editingBulletinId]);

  useEffect(() => {
    const item = bulletinList.find((b) => b.id === editingBulletinId);
    const k = item ? normalizeBulletinDateKey(item.bulletinDate) : null;
    const p = k ? parsePartsFromDateKey(k) : null;
    if (p) setCalYM({ y: p.y, m: p.m });
  }, [editingBulletinId, bulletinList]);

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

  const handleViewBulletin = (bulletinMainId: number) => {
    window.open(`/bulletin?id=${bulletinMainId}`, '_blank', 'noopener,noreferrer');
  };

  const handleCreateBooklet = () => {
    navigate(BULLETIN_CREATE);
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

  return (
    <div className="mypage mypage--service-full mypage--service-plain">
      <div className="inner">
        <div className="subpage__main">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div className="subpage__main__title">교회주보 관리</div>
            <button
              type="button"
              onClick={() => {
                navigate('/mypage/servicemanage/mobile-church-notice');
                window.scrollTo(0, 0);
              }}
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
              서비스관리
            </button>
          </div>

          <div className="subpage__main__content">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            ) : (
              <div className="main__content">
                {bulletinList.length > 0 ? (
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
                  <div className="noPosts">
                    <p>{BULLETIN_EMPTY}</p>
                    <button
                      type="button"
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
                      교회주보 만들기
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
