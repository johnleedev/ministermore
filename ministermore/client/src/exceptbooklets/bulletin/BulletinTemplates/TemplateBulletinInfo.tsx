import { formatBulletinDateKo, type BulletinPostProps } from '../bulletinTypes';

interface TemplateBulletinInfoProps {
  post: BulletinPostProps;
}

/** 주보 공개 — 기본 탭: 인사·날짜 안내 */
export default function TemplateBulletinInfo({ post }: TemplateBulletinInfoProps) {
  const dateLine = formatBulletinDateKo(post.bulletinDate);

  return (
    <div className="bulletin-template-info">
      <div className="bulletin-template-info__card">
        <p className="bulletin-template-info__label">이번 주 주보</p>
        <h2 className="bulletin-template-info__title">{post.bulletinTitle || '주보'}</h2>
        <p className="bulletin-template-info__meta">
          {post.churchName} · {dateLine}
        </p>
        <p className="bulletin-template-info__body">{post.introText}</p>
        {post.quiry?.trim() ? (
          <p className="bulletin-template-info__quiry">
            <span className="bulletin-template-info__quiry-label">문의</span>
            <a href={`tel:${post.quiry.replace(/[^\d+]/g, '')}`}>{post.quiry.trim()}</a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
