import kakaologo from '../../../images/login/kakao.png';
import naverlogo from '../../../images/login/naver.png';
import type { EventProgramItem } from './TemplateEventProgram';

/** 서버/저장 형식의 부제·제목을 한 줄로 (EventCreate `mergeProgramTitle`과 동일) */
function mergeProgramTitle(subTitle: string | undefined, title: string | undefined): string {
  const s = (subTitle || '').trim();
  const t = (title || '').trim();
  if (s && t) return `${s}. ${t}`;
  return t || s;
}

function programRowHasPreview(row: EventProgramItem): boolean {
  return !!(
    mergeProgramTitle(row.subTitle, row.title).trim() ||
    (row.dateTime && String(row.dateTime).trim())
  );
}

/** BookletEventDetail 소개 탭 — EventCreate 미리보기(.notice-create__preview-*)와 동일 패턴 */
export interface EventNoticePostData {
  eventName?: string;
  date?: string;
  place?: string;
  address?: string;
  superViser?: string;
  quiry?: string;
  placeNaver?: string;
  placeKakao?: string;
}

export interface TemplateEventNoticeProps {
  postData?: EventNoticePostData;
  /** false면 하단 푸터 미표시 (예: EventCreate 소개 탭에서 프로그램 블록 아래에 푸터를 한 번만 둘 때) */
  showFooter?: boolean;
  /** 프로그램 탭과 동일 목록 — 소개 탭에서는 제목·일시만 표시 */
  program?: EventProgramItem[];
  /** 소개 탭의 「더보기」→ 프로그램 탭 */
  onOpenProgramTab?: () => void;
  /** EventCreate: 소개 탭 미저장 시 더보기 비활성 */
  programMoreDisabled?: boolean;
}

export default function TemplateNotice({
  postData,
  showFooter = true,
  program = [],
  onOpenProgramTab,
  programMoreDisabled = false,
}: TemplateEventNoticeProps) {
  const programRows = (program || []).filter(programRowHasPreview);
  return (
    <>
      <div className="notice-create__preview-welcome" id="event-embed-info">
        <p className="notice-create__preview-welcome-sub">행사</p>
        <h2 className="notice-create__preview-welcome-title">{postData?.eventName || '행사명'}</h2>
        <p className="notice-create__preview-welcome-desc">
          {postData?.date && postData?.place ? (
            <>
              {postData.date}
              <br />
              {postData.place}
            </>
          ) : postData?.date || postData?.place ? (
            postData.date || postData.place
          ) : (
            <span className="notice-create__preview-welcome-placeholder">일정과 장소를 입력해 주세요</span>
          )}
        </p>
      </div>

      <div className="notice-create__preview-section-panel">
        <div className="notice-create__preview-section-label">
          <span className="notice-create__preview-chip-icon">📋</span>
          행사 안내
        </div>
        <div className="notice-create__preview-worship-list notice-create__preview-worship-list--event-info">
          {[
            { label: '행사명', value: postData?.eventName },
            { label: '일시', value: postData?.date },
            { label: '장소', value: postData?.place },
            { label: '주소', value: postData?.address },
            { label: '주관/주최', value: postData?.superViser },
          ]
            .filter((row) => row.value)
            .map((row, i) => (
              <div key={i} className="notice-create__preview-worship-item">
                <div className="notice-create__preview-worship-row">
                  <span className="notice-create__preview-worship-name">{row.label}</span>
                  <span className="notice-create__preview-worship-place">{row.value}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="notice-create__preview-section-panel notice-create__preview-section-panel--event-program">
        <div className="notice-create__preview-section-label">
          <span className="notice-create__preview-chip-icon">🎵</span>
          프로그램
        </div>
        {programRows.length > 0 ? (
          <div className="notice-create__preview-worship-list">
            {programRows.map((row, i) => {
              const titleLine = mergeProgramTitle(row.subTitle, row.title) || '프로그램';
              const showTime = row.showDateTime !== false && row.showDateTime !== 0;
              return (
                <div key={row.id ?? i} className="notice-create__preview-worship-item">
                  <div className="notice-create__preview-worship-line notice-create__preview-worship-line--primary">
                    <span className="notice-create__preview-worship-name">{titleLine}</span>
                    {showTime ? (
                      <span className="notice-create__preview-worship-time">{row.dateTime || '—'}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="notice-create__preview-worship-empty">프로그램이 등록되지 않았습니다.</p>
        )}
        {onOpenProgramTab ? (
          <button
            type="button"
            className="notice-create__preview-intro-nav-btn"
            onClick={onOpenProgramTab}
            disabled={programMoreDisabled}
          >
            더보기
          </button>
        ) : null}
      </div>

      <div className="notice-create__preview-chips notice-create__preview-chips--location-full">
        <div className="notice-create__preview-chip">
          <span className="notice-create__preview-chip-icon">📍</span>
          <div>
            <p className="notice-create__preview-chip-label">위치</p>
            <p className="notice-create__preview-chip-value">{postData?.address || '주소를 입력해 주세요'}</p>
          </div>
        </div>
      </div>

      <div id="event-embed-map">
        <div className="notice-create__preview-actions">
          <div className="notice-create__preview-btn-row">
            <a
              href={postData?.placeNaver || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="notice-create__preview-btn notice-create__preview-btn--naver"
            >
              <img src={naverlogo} alt="네이버" className="notice-create__preview-map-icon" />
              네이버 지도
            </a>
            <a
              href={postData?.placeKakao || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="notice-create__preview-btn notice-create__preview-btn--kakao"
            >
              <img src={kakaologo} alt="카카오" className="notice-create__preview-map-icon" />
              카카오 지도
            </a>
          </div>
          <div className="notice-create__preview-btn-row">
            <div
              className={`notice-create__preview-btn notice-create__preview-btn--secondary${
                postData?.quiry ? ' notice-create__preview-btn--inquiry' : ''
              }`}
            >
              {postData?.quiry ? (
                <>
                  <span className="notice-create__preview-inquiry-phone">{postData.quiry}</span>
                  <span className="notice-create__preview-inquiry-label">📞 문의하기</span>
                </>
              ) : (
                '📞 문의하기'
              )}
            </div>
          </div>
        </div>
      </div>

      {showFooter ? (
        <div className="notice-create__preview-footer">
          <p className="notice-create__preview-footer-info">
            {postData?.quiry && `${postData.quiry}`}
            {postData?.quiry && postData?.address && ' | '}
            {postData?.address}
            <br />© {new Date().getFullYear()} {postData?.eventName || '행사'} All Rights Reserved.
          </p>
        </div>
      ) : null}
    </>
  );
}
