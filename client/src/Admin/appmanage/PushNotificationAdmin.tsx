import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import { getAdminSession } from '../adminSession';

function parseTokenText(raw: string) {
  return raw
    .split(/\r?\n|,/)
    .map(v => v.trim())
    .filter(Boolean);
}

type PushHistoryItem = {
  id: number;
  adminId: number;
  mode: 'topic' | 'tokens' | string;
  topic: string | null;
  title: string;
  body: string;
  total: number;
  successCount: number;
  failureCount: number;
  chunkSize: number;
  chunkCount: number;
  createdAt: string;
};

const PUSH_CATEGORIES = [
  { value: 'notice', label: '공지' },
  { value: 'job', label: '구인구직' },
  { value: 'retreat', label: '수련회' },
  { value: 'community', label: '게시판' },
  { value: 'worship', label: '예배사역' },
] as const;

type PushCategory = (typeof PUSH_CATEGORIES)[number]['value'];

export default function PushNotificationAdmin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PushCategory>('notice');
  const [tokenText, setTokenText] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);
  const [dbTokenUserCount, setDbTokenUserCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [history, setHistory] = useState<PushHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const tokens = useMemo(() => parseTokenText(tokenText), [tokenText]);

  const loadDbTokenUserCount = useCallback(async () => {
    const adminSession = getAdminSession();
    if (!adminSession?.id) {
      setDbTokenUserCount(null);
      return;
    }
    setLoadingCount(true);
    try {
      const res = await axios.get(`${MainURL}/pushnotifi/usertokencount`, {
        params: { requesterId: adminSession.id },
      });
      setDbTokenUserCount(Number(res.data?.result?.tokenUserCount || 0));
    } catch {
      setDbTokenUserCount(null);
    } finally {
      setLoadingCount(false);
    }
  }, []);

  const loadSendHistory = useCallback(async () => {
    const adminSession = getAdminSession();
    if (!adminSession?.id) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${MainURL}/pushnotifi/sendhistory`, {
        params: { requesterId: adminSession.id },
      });
      setHistory(Array.isArray(res.data?.result) ? res.data.result : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadDbTokenUserCount();
    void loadSendHistory();
  }, [loadDbTokenUserCount, loadSendHistory]);

  const handleSend = async () => {
    const adminSession = getAdminSession();
    if (!adminSession?.id) {
      window.alert('관리자 로그인 정보가 없습니다. 다시 로그인해 주세요.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      window.alert('제목과 메시지를 입력해 주세요.');
      return;
    }
    setLoadingSend(true);
    try {
      const res = await axios.post(`${MainURL}/pushnotifi/send`, {
        requesterId: adminSession.id,
        title: title.trim(),
        body: body.trim(),
        category,
        tokens,
      });
      window.alert(res.data?.message || '푸시 발송 완료');
      await loadDbTokenUserCount();
      await loadSendHistory();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        '푸시 발송 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div className="admin-app-manage__section">
      <div className="admin-app-manage__push-grid">
        <section className="admin-app-manage__card">
          <div className="admin-app-manage__card-head">
            <div>
              <h3 className="admin-app-manage__card-title">푸시 발송</h3>
              <p className="admin-app-manage__card-sub">
                토큰을 비우면 DB에 등록된 전체 사용자에게 발송됩니다.
              </p>
            </div>
            <span className="admin-app-manage__stat">
              {loadingCount ? '조회 중…' : `대상 ${dbTokenUserCount ?? 0}명`}
            </span>
          </div>

          <label className="admin-app-manage__field">
            <span>알림 제목</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
            />
          </label>

          <label className="admin-app-manage__field">
            <span>알림 메시지</span>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="알림 본문을 입력하세요"
              rows={4}
            />
          </label>

          <label className="admin-app-manage__field">
            <span>분류</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as PushCategory)}>
              {PUSH_CATEGORIES.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-app-manage__field">
            <span>FCM 토큰 (선택)</span>
            <textarea
              value={tokenText}
              onChange={e => setTokenText(e.target.value)}
              placeholder="줄바꿈 또는 콤마로 구분. 비우면 전체 발송"
              rows={5}
            />
          </label>

          <div className="admin-app-manage__actions">
            <button
              type="button"
              className="admin-app-manage__btn"
              onClick={handleSend}
              disabled={loadingSend}>
              {loadingSend ? '발송 중…' : '푸시 발송'}
            </button>
          </div>
        </section>

        <section className="admin-app-manage__card">
          <div className="admin-app-manage__card-head">
            <div>
              <h3 className="admin-app-manage__card-title">발송 이력</h3>
              <p className="admin-app-manage__card-sub">최근 50건까지 표시됩니다.</p>
            </div>
            <button
              type="button"
              className="admin-app-manage__btn admin-app-manage__btn--secondary"
              onClick={() => void loadSendHistory()}
              disabled={loadingHistory}>
              {loadingHistory ? '새로고침…' : '새로고침'}
            </button>
          </div>

          {loadingHistory ? (
            <p className="admin-app-manage__empty">이력을 불러오는 중…</p>
          ) : history.length === 0 ? (
            <p className="admin-app-manage__empty">발송 이력이 없습니다.</p>
          ) : (
            <div className="admin-app-manage__history-list">
              {history.map(item => (
                <article key={item.id} className="admin-app-manage__history-item">
                  <p className="admin-app-manage__history-title">
                    [{item.mode === 'topic' ? '토픽' : '토큰'}] {item.title}
                  </p>
                  <p className="admin-app-manage__history-body">{item.body}</p>
                  <p className="admin-app-manage__history-meta">
                    {item.mode === 'topic'
                      ? `topic: ${item.topic || '-'}`
                      : `성공/실패 ${item.successCount}/${item.failureCount} · 전체 ${item.total} · 청크 ${item.chunkCount}`}
                    {' · '}
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
