interface TemplateBulletinNewsProps {
  newsText: string;
  loading?: boolean;
}

/** 주보 공개 — 이번 주 안내 탭 */
export default function TemplateBulletinNews({ newsText, loading = false }: TemplateBulletinNewsProps) {
  if (loading) {
    return (
      <div className="bulletin-template-news bulletin-template-news--loading">
        <p className="bulletin-template-news__hint">안내를 불러오는 중…</p>
      </div>
    );
  }

  const t = (newsText || '').trim();

  return (
    <div className="bulletin-template-news" id="bulletin-embed-news">
      <p className="bulletin-template-news__section-title">이번 주 안내</p>
      {t ? (
        <p className="bulletin-template-news__body">{t}</p>
      ) : (
        <p className="bulletin-template-news__empty">등록된 안내가 없습니다.</p>
      )}
    </div>
  );
}
