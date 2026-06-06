/** 공개 행사 전단지 · 편집기 미리보기 공용 — 신청 안내 탭 */
export default function TemplateEventApply({ note }: { note?: string }) {
  const text = (note || '').trim();
  return (
    <div id="event-embed-apply" className="template-event-apply">
      <div className="notice-create__preview-section-label">
        <span className="notice-create__preview-chip-icon">✍️</span>
        신청하기
      </div>
      <div className="template-event-apply__body">
        {text ? (
          <p className="template-event-apply__note">{text}</p>
        ) : (
          <p className="template-event-apply__placeholder">신청 안내 문구를 입력해 주세요.</p>
        )}
        <div className="template-event-apply__cta" aria-hidden>
          <span className="template-event-apply__cta-btn">신청하기</span>
        </div>
      </div>
    </div>
  );
}
