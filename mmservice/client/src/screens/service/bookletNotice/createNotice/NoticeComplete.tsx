import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaExternalLinkAlt, FaRegCopy } from 'react-icons/fa';
import './NoticeComplete.scss';

type NoticeCompleteState = {
  churchMainId?: number | string;
  fileName?: string;
  filePath?: string;
  fileUrl?: string;
  churchName?: string;
  churchNameEn?: string;
};

export default function NoticeComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as NoticeCompleteState;

  const fileUrl =
    state.fileUrl ||
    (state.filePath ? `https://ministermore.co.kr${state.filePath}` : '');

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!fileUrl) return;
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 권한 없거나 비-https 환경 fallback
      const tmp = document.createElement('textarea');
      tmp.value = fileUrl;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        alert('복사에 실패했습니다. 주소를 직접 선택해 복사해 주세요.');
      } finally {
        document.body.removeChild(tmp);
      }
    }
  };

  const handleOpen = () => {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = () => {
    const id = state.churchMainId != null ? String(state.churchMainId).trim() : '';
    if (id) {
      navigate(`/service/bookletnoticecreate?id=${encodeURIComponent(id)}`);
    } else {
      navigate('/service/notice');
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="notice-complete">
      <div className="notice-complete__inner">
        <div className="notice-complete__icon">
          <FaCheckCircle />
        </div>
        <h1 className="notice-complete__title">전단지 작성이 완료되었습니다</h1>
        <p className="notice-complete__desc">
          교회 소개 전단지가 성공적으로 저장되었습니다.
        </p>

        {fileUrl ? (
          <div className="notice-complete__link-box">
            <div className="notice-complete__link-label">
              모바일 전단지 링크 주소
            </div>
            <div className="notice-complete__link-row">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="notice-complete__link-url"
                title={fileUrl}
              >
                {fileUrl}
              </a>
            </div>
            <div className="notice-complete__link-actions">
              <button
                type="button"
                className="notice-complete__link-btn notice-complete__link-btn--copy"
                onClick={handleCopy}
              >
                <FaRegCopy />
                <span>{copied ? '복사되었습니다' : '주소 복사'}</span>
              </button>
              <button
                type="button"
                className="notice-complete__link-btn notice-complete__link-btn--open"
                onClick={handleOpen}
              >
                <FaExternalLinkAlt />
                <span>새 탭에서 열기</span>
              </button>
            </div>
            {(state.churchName || state.churchNameEn) && (
              <div className="notice-complete__link-meta">
                {state.churchName ? state.churchName : ''}
                {state.churchName && state.churchNameEn ? ' · ' : ''}
                {state.churchNameEn ? state.churchNameEn : ''}
              </div>
            )}
          </div>
        ) : (
          <div className="notice-complete__link-box notice-complete__link-box--empty">
            전단지 링크 정보를 불러올 수 없습니다. 마이페이지 → 서비스 관리에서 확인해 주세요.
          </div>
        )}

        <div className="notice-complete__btns">
          <button
            type="button"
            className="notice-complete__btn notice-complete__btn--primary"
            onClick={handleEdit}
          >
            전단지 수정하기
          </button>
          <button
            type="button"
            className="notice-complete__btn notice-complete__btn--secondary"
            onClick={() => navigate('/service/notice')}
          >
            서비스 목록으로
          </button>
        </div>
      </div>
    </div>
  );
}
