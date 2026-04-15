import './TemplateEventGreeting.scss';
import newcomerGreetingBg from '../../../images/bookletevent/newcomer-greeting-bg.png';

export interface TemplateEventGreetingProps {
  eventGreeting: string;
  /** 소개 탭과 동일 — 예: `2024년 4월 21일 (주일) 오전 11:00` */
  dateLine?: string;
  placeLine?: string;
  /** EventCreate 좌측 미리보기 */
  editorPreview?: boolean;
  /** 장식 배경 이미지를 숨길 때 사용 */
  hideBackgroundImage?: boolean;
}

export default function TemplateEventGreeting({
  eventGreeting,
  dateLine = '',
  placeLine = '',
  editorPreview = false,
  hideBackgroundImage = false,
}: TemplateEventGreetingProps) {
  const rootClass = [
    'template-event-greeting',
    editorPreview ? 'template-event-greeting--editor' : '',
    hideBackgroundImage ? 'template-event-greeting--plain' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div id="event-embed-greeting" className={rootClass}>
      <div
        className="template-event-greeting__card"
        style={hideBackgroundImage ? undefined : { backgroundImage: `url(${newcomerGreetingBg})` }}
      >
        <div className="template-event-greeting__content">
          <h2 className="template-event-greeting__title">소중한 당신을 초대합니다.</h2>
          <div className="template-event-greeting__divider" aria-hidden />
          <div className="template-event-greeting__body">
            {eventGreeting.trim() ? (
              <p className="template-event-greeting__text">{eventGreeting}</p>
            ) : (
              <p className="template-event-greeting__placeholder">초대글을 입력해 주세요.</p>
            )}
          </div>
          {(dateLine.trim() || placeLine.trim()) && (
            <ul className="template-event-greeting__meta">
              {dateLine.trim() ? (
                <li className="template-event-greeting__meta-item">
                  <span className="template-event-greeting__meta-icon" aria-hidden>
                    🕐
                  </span>
                  <span>일시: {dateLine.trim()}</span>
                </li>
              ) : null}
              {placeLine.trim() ? (
                <li className="template-event-greeting__meta-item">
                  <span className="template-event-greeting__meta-icon" aria-hidden>
                    ⛪
                  </span>
                  <span>장소: {placeLine.trim()}</span>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
