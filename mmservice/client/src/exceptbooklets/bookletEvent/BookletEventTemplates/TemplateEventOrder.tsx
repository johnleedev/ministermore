import { useState } from 'react';
import {
  parseEventOrderStyleId,
  type EventOrderStyleId,
} from '../eventTemplateTypes';

export interface EventOrderItem {
  id?: number;
  bookletId?: string;
  showOrder?: string;
  subTitle?: string;
  title?: string;
  charger?: string;
  notice?: string;
  orderStyle?: string;
}

interface TemplateEventOrderProps {
  rows: EventOrderItem[];
  loading?: boolean;
  /** 미지정 시 첫 행의 `orderStyle` 또는 예배형 */
  orderStyle?: EventOrderStyleId;
}

/** 일정형: `title`=YYYY-MM-DD, `subTitle`=시, `charger`=분, `notice`=내용 */
function formatScheduleDateTimeLabel(row: EventOrderItem): string {
  const d = String(row.title || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    let h = parseInt(String(row.subTitle ?? '0'), 10);
    let m = parseInt(String(row.charger ?? '0'), 10);
    if (Number.isNaN(h)) h = 0;
    if (Number.isNaN(m)) m = 0;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return `${d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return d || '—';
}

function rowHasContent(row: EventOrderItem, style: EventOrderStyleId): boolean {
  if (style === 'schedule') {
    return !!(
      String(row.title || '').trim() ||
      String(row.subTitle || '').trim() ||
      String(row.charger || '').trim() ||
      String(row.notice || '').trim()
    );
  }
  return !!(
    String(row.subTitle || '').trim() ||
    String(row.title || '').trim() ||
    String(row.charger || '').trim() ||
    String(row.notice || '').trim()
  );
}

function RetreatOrderRow({ row }: { row: EventOrderItem }) {
  const [open, setOpen] = useState(false);
  const time = row.charger?.trim() || '';
  const title = row.title?.trim() || '';
  const sub = row.subTitle?.trim() || '';
  const detail = row.notice?.trim() || '';
  const hasDetail = !!detail;

  return (
    <li className="template-event-worship__item">
      <div
        className={`template-event-worship__card template-event-worship__card--retreat${
          open ? ' template-event-worship__card--retreat-open' : ''
        }`}
      >
        <div className="template-event-worship__retreat-row">
          <span className="template-event-worship__retreat-time">{time || '—'}</span>
          <div className="template-event-worship__retreat-main">
            {hasDetail ? (
              <button
                type="button"
                className="template-event-worship__retreat-toggle"
                aria-expanded={open}
                aria-label={open ? '상세내용 접기' : '상세내용 펼치기'}
                onClick={() => setOpen((prev) => !prev)}
              >
                <svg
                  className={`template-event-worship__retreat-toggle-icon${
                    open ? ' template-event-worship__retreat-toggle-icon--open' : ''
                  }`}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ) : null}
            <div className="template-event-worship__retreat-text">
              {title ? (
                <span className="template-event-worship__retreat-title">{title}</span>
              ) : null}
              {sub ? (
                <span className="template-event-worship__retreat-sub">{sub}</span>
              ) : null}
            </div>
          </div>
        </div>
        {hasDetail && open ? (
          <div className="template-event-worship__retreat-detail">{detail}</div>
        ) : null}
      </div>
    </li>
  );
}

function resolveOrderStyle(rows: EventOrderItem[] | undefined, prop?: EventOrderStyleId): EventOrderStyleId {
  if (prop === 'schedule' || prop === 'worship' || prop === 'concert' || prop === 'retreat') return prop;
  const fromRow = rows?.find((r) => r.orderStyle != null && String(r.orderStyle).trim() !== '');
  return parseEventOrderStyleId(fromRow?.orderStyle);
}

/** 행사 전단지 순서 탭 — `eventOrder` */
export default function TemplateEventOrder({ rows, loading = false, orderStyle: orderStyleProp }: TemplateEventOrderProps) {
  if (loading) {
    return (
      <div id="event-embed-worship" className="template-event-worship template-event-worship--loading">
        <p className="template-event-program__hint">순서를 불러오는 중…</p>
      </div>
    );
  }

  const orderStyle = resolveOrderStyle(rows, orderStyleProp);
  const list = (rows || []).filter((r) => rowHasContent(r, orderStyle));
  const modClass =
    orderStyle === 'schedule'
      ? 'template-event-worship--style-schedule'
      : orderStyle === 'concert'
        ? 'template-event-worship--style-concert'
        : orderStyle === 'retreat'
          ? 'template-event-worship--style-retreat'
          : 'template-event-worship--style-worship';

  if (list.length === 0) {
    return (
      <div id="event-embed-worship" className={`template-event-worship template-event-worship--empty ${modClass}`}>
        <p className="template-event-program__empty">등록된 순서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div id="event-embed-worship" className={`template-event-worship ${modClass}`}>
      <ul className="template-event-worship__list">
        {list.map((row, i) => {
          if (orderStyle === 'schedule') {
            return (
              <li key={row.id ?? i} className="template-event-worship__item">
                <div className="template-event-worship__card template-event-worship__card--schedule">
                  <div className="template-event-worship__schedule-row-preview">
                    <span className="template-event-worship__schedule-time">{formatScheduleDateTimeLabel(row)}</span>
                    {row.notice?.trim() ? (
                      <>
                        <span className="template-event-worship__schedule-sep" aria-hidden>
                          ·
                        </span>
                        <span className="template-event-worship__schedule-inline-body">{row.notice}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          }
          if (orderStyle === 'retreat') {
            return <RetreatOrderRow key={row.id ?? i} row={row} />;
          }
          if (orderStyle === 'concert') {
            const t = row.title?.trim() || '';
            const comp = row.subTitle?.trim() || '';
            const line1 =
              t && comp ? `${t} - ${comp}` : t || comp || '항목';
            return (
              <li key={row.id ?? i} className="template-event-worship__item">
                <div className="template-event-worship__card template-event-worship__card--concert">
                  <p className="template-event-worship__concert-line1">{line1}</p>
                  {row.charger?.trim() ? (
                    <p className="template-event-worship__concert-line2">{row.charger}</p>
                  ) : null}
                  {row.notice?.trim() ? (
                    <p className="template-event-worship__concert-line3">{row.notice}</p>
                  ) : null}
                </div>
              </li>
            );
          }
          return (
            <li key={row.id ?? i} className="template-event-worship__item">
              <div className="template-event-worship__card">
                <div className="template-event-worship__line">
                  <span className="template-event-worship__title">{row.title?.trim() ? row.title : '항목'}</span>
                  <span className="template-event-worship__sub">{row.subTitle || ''}</span>
                  <span className="template-event-worship__charger">{row.charger || ''}</span>
                </div>
                {row.notice?.trim() ? <p className="template-event-worship__content">{row.notice}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
