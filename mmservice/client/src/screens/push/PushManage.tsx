import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../main/Main.scss';
import '../flyer/ServicePage.scss';

export default function PushManage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      window.alert('제목과 내용을 입력해 주세요.');
      return;
    }
    window.alert('푸시 발송 API 연동 전입니다. (UI 뼈대)');
    setTitle('');
    setBody('');
  };

  return (
    <div className="service-admin">
      <div className="service-admin__container service-page">
        <button type="button" className="service-page__back" onClick={() => navigate('/')}>
          ← 대시보드
        </button>

        <header className="service-page__header">
          <h1>제작앱 푸시 알림</h1>
          <p>푸시 알림 발송 공간입니다.</p>
        </header>

        <form className="service-page__form" onSubmit={handleSubmit}>
          <label className="service-page__field">
            <span>제목</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
            />
          </label>

          <label className="service-page__field">
            <span>내용</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={6}
            />
          </label>

          <button type="submit" className="service-page__primary-btn">
            발송하기
          </button>
        </form>
      </div>
    </div>
  );
}
