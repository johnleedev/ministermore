import type { BulletinWorshipRow } from '../bulletinTypes';

interface TemplateBulletinOrderProps {
  rows: BulletinWorshipRow[];
  loading?: boolean;
}

/** 주보 공개 — 예배 순서 탭 */
export default function TemplateBulletinOrder({ rows, loading = false }: TemplateBulletinOrderProps) {
  if (loading) {
    return (
      <div className="bulletin-template-order bulletin-template-order--loading">
        <p className="bulletin-template-order__hint">예배 순서를 불러오는 중…</p>
      </div>
    );
  }

  const list = (rows || []).filter((r) => r.title.trim() || r.sub.trim() || r.right.trim());

  if (list.length === 0) {
    return (
      <div className="bulletin-template-order">
        <p className="bulletin-template-order__empty">등록된 예배 순서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bulletin-template-order" id="bulletin-embed-order">
      <p className="bulletin-template-order__section-title">예배 순서</p>
      <ul className="bulletin-template-order__list">
        {list.map((r) => (
          <li key={r.num} className="bulletin-template-order__item">
            <div className="bulletin-template-order__left">
              <span className="bulletin-template-order__num">{r.num}</span>
              <div className="bulletin-template-order__text">
                <strong>{r.title.trim() || '제목'}</strong>
                <span>{r.sub.trim() || ''}</span>
              </div>
            </div>
            <span className="bulletin-template-order__time">{r.right.trim() || '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
