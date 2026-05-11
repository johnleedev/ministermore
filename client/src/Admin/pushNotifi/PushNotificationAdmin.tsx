import { useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import '../Admin.scss';

function parseTokenText(raw: string) {
  return raw
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function PushNotificationAdmin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('');
  const [tokenText, setTokenText] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);

  const tokens = useMemo(() => parseTokenText(tokenText), [tokenText]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      window.alert('제목과 메시지를 입력해 주세요.');
      return;
    }
    if (!topic.trim() && tokens.length === 0) {
      window.alert('토픽 또는 토큰 목록 중 하나는 입력해 주세요.');
      return;
    }

    setLoadingSend(true);
    try {
      const res = await axios.post(`${MainURL}/pushnotifi/send`, {
        title: title.trim(),
        body: body.trim(),
        topic: topic.trim(),
        tokens,
      });
      window.alert(res.data?.message || '푸시 발송 완료');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.response?.data?.error || '푸시 발송 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div className="admin-register">
      <div className="inner">
        <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 'bold' }}>Firebase 푸시알림 관리</h2>

        <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>푸시 내용 작성</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목"
              style={{ width: '100%', padding: '10px 12px', marginBottom: 8 }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 메시지"
              rows={4}
              style={{ width: '100%', padding: '10px 12px', marginBottom: 8 }}
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="토픽 발송 시 입력 (예: all-users)"
              style={{ width: '100%', padding: '10px 12px', marginBottom: 8 }}
            />
            <textarea
              value={tokenText}
              onChange={(e) => setTokenText(e.target.value)}
              placeholder="토큰 발송 시 입력 (줄바꿈 또는 콤마 구분)"
              rows={6}
              style={{ width: '100%', padding: '10px 12px' }}
            />
            <p style={{ marginTop: 8, color: '#666' }}>현재 토큰 개수: {tokens.length}개</p>
            <button onClick={handleSend} disabled={loadingSend} style={{ marginTop: 8 }}>
              {loadingSend ? '발송 중...' : '푸시 발송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
