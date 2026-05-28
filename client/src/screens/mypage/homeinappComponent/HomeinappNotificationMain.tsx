import { useEffect, useMemo, useState } from 'react';
import '../Mypage.scss';
import './HomeinappNotificationMain.scss';
import { useRecoilState } from 'recoil';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { recoilUserData } from '../../../RecoilStore';
import MainURL from '../../../MainURL';
import Loading from '../../../components/Loading';

const DEFAULT_TITLE = '수요예배 안내';
const DEFAULT_MESSAGE =
  '오늘 저녁 7시 30분, 예수사랑교회 본당에서 수요예배가 진행됩니다. 은혜로운 시간이 되시기를 바랍니다.';
type NotificationHistoryItem = {
  id: number;
  church_id: string;
  adminLoginId?: string;
  title: string;
  content: string;
  sent_at: string;
  readCount?: number;
};
type ChurchInfoRow = {
  id?: string;
  churchName?: string;
  representatives?: string;
  phoneNumber?: string;
  userAccount?: string;
  created_at?: string;
  portonePaymentId?: string;
  portonePaidAmount?: number;
  portoneOrderName?: string;
  portonePlan?: string;
  schedulePaymentId?: string;
  billingKey?: string;
  portonePaidAt?: string;
  portoneTimeToPay?: string;
  portoneScheduleId?: string;
};

export default function HomeinappNotificationMain() {
  const navigate = useNavigate();
  const { churchId: churchIdParam } = useParams<{ churchId: string }>();
  const [userData] = useRecoilState(recoilUserData);
  const [churchReady, setChurchReady] = useState(false);
  const [churchName, setChurchName] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('');
  const [churchInfo, setChurchInfo] = useState<ChurchInfoRow | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isSending, setIsSending] = useState(false);
  const [churchUsersCount, setChurchUsersCount] = useState<number>(0);
  const [churchUsersActiveCount, setChurchUsersActiveCount] = useState<number>(0);
  const [historyRows, setHistoryRows] = useState<NotificationHistoryItem[]>([]);
  const [kpiStats, setKpiStats] = useState<{
    todaySentCount: number;
    avgOpenRate7d: number;
    openRateDenominator: number;
  } | null>(null);
  const [bodyModal, setBodyModal] = useState<{ id: number; title: string; content: string } | null>(null);
  const [historyDeleteLoading, setHistoryDeleteLoading] = useState(false);
  const [pushResultModal, setPushResultModal] = useState<{ title: string; body: string } | null>(null);

  const fetchNotificationSummary = async (churchId: string) => {
    const res = await axios.get(`${MainURL}/homeinappmain/notifications/summary/${encodeURIComponent(churchId)}`);
    const payload = res.data;
    if (!payload?.success) return;
    const raw = Array.isArray(payload?.data?.history) ? payload.data.history : [];
    // notifications.readCount (DB 컬럼) — 드라이버에 따라 키가 readcount로 올 수 있어 정규화
    setHistoryRows(
      raw.map((row: NotificationHistoryItem & { readcount?: string | number }) => ({
        ...row,
        readCount: Number(row.readCount ?? row.readcount ?? 0) || 0,
      }))
    );
    const s = payload?.data?.stats;
    if (s && typeof s === 'object') {
      setKpiStats({
        todaySentCount: Number(s.todaySentCount ?? 0) || 0,
        avgOpenRate7d: Number(s.avgOpenRate7d ?? 0) || 0,
        openRateDenominator: Math.max(1, Number(s.openRateDenominator ?? 1) || 1),
      });
    } else {
      setKpiStats(null);
    }
  };

  useEffect(() => {
    const userAccount = String(userData?.userAccount || '').trim();
    const churchId = String(churchIdParam || '').trim();
    setChurchReady(false);
    setChurchInfo(null);

    if (!churchId) {
      navigate('/mypage/homeinapp-notification', { replace: true });
      return;
    }
    if (!userAccount) return;

    let mounted = true;
    axios
      .get(
        `${MainURL}/homeinappmain/getChurchForUser/${encodeURIComponent(userAccount)}/${encodeURIComponent(churchId)}`
      )
      .then((res) => {
        if (!mounted) return;
        const payload = res.data;
        if (payload?.success && payload?.data) {
          setChurchInfo(payload.data as ChurchInfoRow);
          setChurchName(String(payload.data.churchName || '').trim());
          const reps = String(payload.data.representatives || '').trim();
          const firstRep = reps.split(',').map((v: string) => v.trim()).find(Boolean) || '';
          if (firstRep) setAdminName(firstRep);
          setChurchReady(true);
        } else {
          window.alert('교회 정보를 찾을 수 없습니다.');
          navigate('/mypage/homeinapp-notification', { replace: true });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('homeinapp church fetch fail:', err);
        const msg =
          err?.response?.status === 404
            ? '해당 홈인앱 교회를 찾을 수 없거나 권한이 없습니다.'
            : '교회 정보를 불러오지 못했습니다.';
        window.alert(msg);
        navigate('/mypage/homeinapp-notification', { replace: true });
      });

    return () => {
      mounted = false;
    };
  }, [churchIdParam, userData?.userAccount, navigate]);

  useEffect(() => {
    const churchId = String(churchInfo?.id || '').trim();
    if (!churchId) return;

    let mounted = true;
    axios
      .get(`${MainURL}/homeinappmain/users/${encodeURIComponent(churchId)}`)
      .then((res) => {
        if (!mounted) return;
        const payload = res.data;
        if (!payload?.success) return;
        const summary = payload.summary || {};
        setChurchUsersCount(Number(summary.total || 0));
        setChurchUsersActiveCount(Number(summary.active || 0));
      })
      .catch((err) => {
        console.error('homeinapp users fetch fail:', err);
      });

    return () => {
      mounted = false;
    };
  }, [churchInfo?.id]);

  useEffect(() => {
    const churchId = String(churchInfo?.id || '').trim();
    if (!churchId) return;

    let mounted = true;
    fetchNotificationSummary(churchId)
      .then(() => {
        if (!mounted) return;
      })
      .catch((err) => {
        console.error('homeinapp notifications summary fetch fail:', err);
      });

    return () => {
      mounted = false;
    };
  }, [churchInfo?.id]);

  const church = (churchName && churchName.trim()) || (userData?.authChurch?.trim() || '예수사랑교회');
  const admin = (adminName && adminName.trim()) || (userData?.userNickName?.trim() || '김동현');

  const previewMessage = useMemo(
    () => (message || '알림 메시지가 여기에 표시됩니다.').slice(0, 70),
    [message]
  );
  const previewTitle = useMemo(() => (title || '알림 제목').trim() || '알림 제목', [title]);
  const stats = useMemo(() => {
    const todayN = kpiStats?.todaySentCount ?? 0;
    const avgOpen = kpiStats?.avgOpenRate7d ?? 0;
    const denom = kpiStats?.openRateDenominator ?? 1;
    return [
      {
        label: '앱 설치 성도',
        value: `${churchUsersCount.toLocaleString()}명`,
        meta: `활성 ${churchUsersActiveCount.toLocaleString()}명`,
      },
      {
        label: '금일 발송 건수',
        value: `${todayN.toLocaleString()}건`,
        meta: '오늘 00:00~현재 (알림 발송 기록 기준)',
      },
      {
        label: '평균 오픈율',
        value: `${avgOpen.toFixed(1)}%`,
        meta: `최근 7일 · 건당 오픈수 ÷ 활성 ${denom.toLocaleString()}명 (최대 100%)`,
      },
    ];
  }, [churchUsersActiveCount, churchUsersCount, kpiStats]);

  const onSend = async () => {
    if (isSending) return;

    const churchId = String(churchInfo?.id || '').trim();
    const pushTitle = String(title || '').trim();
    const pushMessage = String(message || '').trim();

    if (!churchId) {
      setPushResultModal({
        title: '알림',
        body: '교회 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }
    if (!pushTitle || !pushMessage) {
      setPushResultModal({
        title: '알림',
        body: '제목과 메시지를 모두 입력해주세요.',
      });
      return;
    }

    try {
      setIsSending(true);
      const response = await axios.post(`${MainURL}/homeinappmain/sendPushByChurch`, {
        churchId,
        adminLoginId: String(userData?.userAccount || '').trim(),
        title: pushTitle,
        content: pushMessage,
      });

      const result = response?.data?.result;
      const successCount = Number(result?.successCount || 0);
      const total = Number(result?.total || 0);
      const failureCount = Number(result?.failureCount || 0);
      const cleanedCount = Number(result?.cleanedCount || 0);

      let bodyText: string;
      if (total === 0) {
        bodyText = '발송 대상 토큰이 없어 FCM 발송은 하지 않았습니다.';
      } else if (successCount === 0) {
        bodyText = `기기로 전달된 푸시가 없습니다. (${successCount} / ${total})`;
      } else if (failureCount > 0) {
        bodyText = `푸시 발송: 성공 ${successCount}건 / 전체 ${total}건 (실패 ${failureCount}건)`;
        if (cleanedCount > 0) bodyText += `\n무효 토큰 정리: ${cleanedCount}건`;
      } else {
        bodyText =
          cleanedCount > 0
            ? `푸시 발송 완료: ${successCount} / ${total}건\n무효 토큰 정리: ${cleanedCount}건`
            : `푸시 발송 완료: ${successCount} / ${total}건`;
      }
      setPushResultModal({ title: '푸시 발송 결과', body: bodyText });
      await fetchNotificationSummary(churchId);
    } catch (error: any) {
      console.error('homeinapp push send fail:', error);
      const messageText =
        error?.response?.data?.message || error?.response?.data?.error || '푸시 발송 중 오류가 발생했습니다.';
      setPushResultModal({
        title: '푸시 발송 오류',
        body: messageText,
      });
    } finally {
      setIsSending(false);
    }
  };

  const onDeleteHistoryItem = async () => {
    if (!bodyModal) return;
    const cid = String(churchInfo?.id || '').trim();
    if (!cid) {
      window.alert('교회 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 발송 이력을 삭제할까요? 삭제하면 되돌릴 수 없습니다. 삭제시 사용자의 기기의 알림목록에서도 삭제됩니다.')) return;

    setHistoryDeleteLoading(true);
    try {
      await axios.delete(
        `${MainURL}/homeinappmain/notifications/${encodeURIComponent(cid)}/${bodyModal.id}`,
      );
      setBodyModal(null);
      await fetchNotificationSummary(cid);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.response?.data?.error || '삭제에 실패했습니다.';
      window.alert(msg);
    } finally {
      setHistoryDeleteLoading(false);
    }
  };

  if (!churchReady || !churchInfo?.id) {
    return (
      <div className="mypage mypage--service-full mypage--service-plain">
        <div className="inner">
          <div className="subpage__main">
            <div className="subpage__main__title">홈인앱알림</div>
            <div className="subpage__main__content">
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <Loading />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="subpage__main__title">홈인앱알림 · 푸시 발송</div>
            <button
              type="button"
              onClick={() => {
                navigate('/mypage/homeinapp-notification');
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
              목록으로
            </button>
          </div>
          <div className="subpage__main__content">
            <div className="main__content">
              <div className="hipush-root hipush-root--flat" lang="ko">
                <div className="hipush-main">
                  <div className="hipush-topbar">
                    <div className="hipush-church-text">
                      <small>현재 교회</small>
                      <strong>{church}</strong>
                    </div>
                    <div className="hipush-top-info">
                      <strong>{`관리자 ${admin || '—'}님`}</strong>
                      <span>{`${userData?.userAccount || '-'}`}</span>
                    </div>
                  </div>

                  <section className="hipush-hero" aria-labelledby="hipush-hero-title">
                    <div>
                      <h2 id="hipush-hero-title">푸시 알림 발송</h2>
                      <p>
                        메시지 작성, 최근 발송 이력 확인까지 한 번에 관리할 수 있습니다.
                      </p>
                    </div>
                  </section>

                  <section className="hipush-stats" aria-label="지표">
                    {stats.map((s) => (
                      <article key={s.label} className="hipush-card hipush-stat-card">
                        <div className="hipush-stat-label">{s.label}</div>
                        <div className="hipush-stat-value">{s.value}</div>
                        <div className="hipush-stat-meta">{s.meta}</div>
                      </article>
                    ))}
                  </section>

                  <section className="hipush-content-grid" aria-label="푸시 발송·분석">
                    <article className="hipush-card hipush-compose-card">
                      <div className="hipush-section-title">
                        <h3>새 푸시 발송</h3>
                        <span className="hipush-mini-badge">Church Scoped</span>
                      </div>

                      <div className="hipush-compose-body">
                        <div className="hipush-form-grid">
                          <div>
                            <label className="hipush-label" htmlFor="hipush-title">
                              제목
                            </label>
                            <input
                              className="hipush-input"
                              id="hipush-title"
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              autoComplete="off"
                            />
                          </div>

                          <div>
                            <label className="hipush-label" htmlFor="hipush-message">
                              메시지
                            </label>
                            <textarea
                              className="hipush-textarea"
                              id="hipush-message"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                            />
                          </div>

                          <div className="hipush-form-actions">
                            <button className="hipush-btn-primary" type="button" onClick={onSend} disabled={isSending}>
                              {isSending ? '발송 중...' : '발송하기'}
                            </button>
                          </div>
                        </div>

                        <div className="hipush-preview-panel">
                          <div className="hipush-preview-copy">
                            <strong>앱 푸시 미리보기</strong>
                          </div>
                          <div className="hipush-phone-mini">
                            <div className="hipush-screen">
                              <div className="hipush-notch" />
                              <div className="hipush-notif">
                                <strong>{previewTitle}</strong>
                                <span>{previewMessage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>

                    <div className="hipush-side-col">
                      <article className="hipush-card hipush-history">
                        <div className="hipush-card-head">
                          <h3>최근 발송 이력</h3>
                        </div>
                        <div className="hipush-table-wrap">
                          <table className="hipush-table hipush-table--history">
                            <thead>
                              <tr>
                                <th>발송일시</th>
                                <th>제목</th>
                                <th>오픈수</th>
                                <th>상태</th>
                                <th className="hipush-th-action" aria-label="본문" />
                              </tr>
                            </thead>
                            <tbody>
                              {historyRows.map((r) => {
                                const sentAt = new Date(r.sent_at);
                                const sentAtText = Number.isNaN(sentAt.getTime())
                                  ? '-'
                                  : `${sentAt.getFullYear()}.${String(sentAt.getMonth() + 1).padStart(2, '0')}.${String(
                                      sentAt.getDate()
                                    ).padStart(2, '0')} ${String(sentAt.getHours()).padStart(2, '0')}:${String(
                                      sentAt.getMinutes()
                                    ).padStart(2, '0')}`;
                                return (
                                  <tr key={r.id}>
                                    <td>{sentAtText}</td>
                                    <td>{r.title}</td>
                                    <td>{Number(r.readCount ?? 0).toLocaleString()}</td>
                                    <td>
                                      <span className="hipush-status">발송 완료</span>
                                    </td>
                                    <td className="hipush-td-action">
                                      <button
                                        type="button"
                                        className="hipush-btn-ghost"
                                        onClick={() =>
                                          setBodyModal({
                                            id: Number(r.id),
                                            title: r.title,
                                            content: String(r.content || ''),
                                          })
                                        }
                                      >
                                        본문보기
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {historyRows.length === 0 ? (
                                <tr>
                                  <td colSpan={5}>발송 이력이 없습니다.</td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pushResultModal ? (
        <div
          className="hipush-modal-backdrop"
          role="presentation"
          onClick={() => setPushResultModal(null)}
        >
          <div
            className="hipush-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hipush-push-result-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hipush-modal__head">
              <h2 id="hipush-push-result-title" className="hipush-modal__title">
                {pushResultModal.title}
              </h2>
              <button
                type="button"
                className="hipush-modal__close"
                onClick={() => setPushResultModal(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="hipush-modal__body">
              <p className="hipush-modal__text hipush-modal__text--selectable">{pushResultModal.body}</p>
            </div>
            <div className="hipush-modal__foot hipush-modal__foot--split">
              <button
                type="button"
                className="hipush-btn-ghost"
                onClick={async () => {
                  try {
                    const t = pushResultModal.body;
                    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(t);
                    else {
                      const ta = document.createElement('textarea');
                      ta.value = t;
                      ta.setAttribute('readonly', '');
                      ta.style.position = 'fixed';
                      ta.style.left = '-9999px';
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                    }
                    setPushResultModal(null);
                  } catch {
                    /* 복사 실패 시 모달 유지 */
                  }
                }}
              >
                전체 복사
              </button>
              <button type="button" className="hipush-btn-primary" onClick={() => setPushResultModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bodyModal ? (
        <div
          className="hipush-modal-backdrop"
          role="presentation"
          onClick={() => setBodyModal(null)}
        >
          <div
            className="hipush-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hipush-body-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hipush-modal__head">
              <h2 id="hipush-body-modal-title" className="hipush-modal__title">
                {bodyModal.title}
              </h2>
              <button type="button" className="hipush-modal__close" onClick={() => setBodyModal(null)} aria-label="닫기">
                ×
              </button>
            </div>
            <div className="hipush-modal__body">
              <p className="hipush-modal__text">{bodyModal.content || '내용이 없습니다.'}</p>
            </div>
            <div className="hipush-modal__foot hipush-modal__foot--with-delete">
              <button
                type="button"
                className="hipush-btn-danger"
                disabled={historyDeleteLoading}
                onClick={() => void onDeleteHistoryItem()}
              >
                {historyDeleteLoading ? '삭제 중…' : '이 항목 삭제'}
              </button>
              <button type="button" className="hipush-btn-primary" onClick={() => setBodyModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
