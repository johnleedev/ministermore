import { FaPlay, FaPlayCircle, FaUserTie, FaEllipsisV, FaYoutube } from 'react-icons/fa';
import MainURL from '../../../MainURL';

export interface SermonItem {
  id?: number;
  title: string;
  url: string;
  thumbnail: string;
  sortOrder?: number;
}

interface Props {
  sermonVideos: SermonItem[];
  youtube?: string;
  mainPastor?: string;
}

export function getThumbnailUrl(item: SermonItem): string {
  if (!item.thumbnail) return '';
  if (
    item.thumbnail.startsWith('blob:') ||
    item.thumbnail.startsWith('data:') ||
    item.thumbnail.startsWith('http')
  ) {
    return item.thumbnail;
  }
  return `${MainURL}/images/bookletnotice/sermonthumbnail/${item.thumbnail}`;
}

/** 설교 탭 피처드 카드 — 소개 탭(TemplateNotice)에서도 동일 UI로 사용 */
export function SermonFeaturedCard(props: { featured: SermonItem; mainPastor?: string }) {
  const { featured, mainPastor } = props;
  const featuredThumb = getThumbnailUrl(featured);

  return (
    <a
      href={featured.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="notice-detail__sermon-featured"
    >
      <div className="notice-detail__sermon-featured-thumb">
        {featuredThumb ? (
          <img src={featuredThumb} alt={featured.title} />
        ) : (
          <div className="notice-detail__sermon-featured-placeholder" />
        )}
        <div className="notice-detail__sermon-featured-overlay" />
        <div className="notice-detail__sermon-featured-play">
          <div className="notice-detail__sermon-featured-play-btn">
            <FaPlay className="notice-detail__sermon-featured-play-icon" />
          </div>
        </div>
        <span className="notice-detail__sermon-featured-badge">NEW</span>
        <div className="notice-detail__sermon-featured-info">
          <h3 className="notice-detail__sermon-featured-title">{featured.title || '설교'}</h3>
        </div>
      </div>
      <div className="notice-detail__sermon-featured-body">
        <div className="notice-detail__sermon-featured-meta">
          <div className="notice-detail__sermon-featured-pastor">
            <div className="notice-detail__sermon-featured-avatar">
              <FaUserTie />
            </div>
            <span>{mainPastor || '담임목사'}</span>
          </div>
        </div>
        <div className="notice-detail__sermon-featured-btn">
          <FaPlayCircle className="notice-detail__sermon-featured-btn-icon" />
          설교 재생하기
        </div>
      </div>
    </a>
  );
}

export default function TemplateSermon(props: Props) {
  const { sermonVideos = [], youtube, mainPastor } = props;

  if (!sermonVideos || sermonVideos.length === 0) {
    return (
      <div className="notice-detail__sermon notice-detail__empty">
        <div className="notice-detail__section-title">설교영상</div>
        <p className="notice-detail__empty-text">등록된 영상이 없습니다.</p>
      </div>
    );
  }

  const featured = sermonVideos[0];
  const rest = sermonVideos.slice(1);

  return (
    <div className="notice-detail__sermon">
      {/* Section Header */}
      <div className="notice-detail__sermon-header">
        <h2 className="notice-detail__sermon-title">주일예배 설교</h2>
        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="notice-detail__sermon-youtube-link"
          >
            유튜브 채널 바로가기 <span className="notice-detail__sermon-youtube-arrow">›</span>
          </a>
        )}
      </div>

      {/* Featured Video (Latest) */}
      <SermonFeaturedCard featured={featured} mainPastor={mainPastor} />

      {/* Recent Videos List */}
      {rest.length > 0 && (
        <div className="notice-detail__sermon-list">
          {rest.map((item, i) => {
            const thumb = getThumbnailUrl(item);
            return (
              <a
                key={item.id ?? i}
                href={item.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="notice-detail__sermon-list-item"
              >
                <div className="notice-detail__sermon-list-thumb">
                  {thumb ? (
                    <img src={thumb} alt={item.title} />
                  ) : (
                    <div className="notice-detail__sermon-list-placeholder" />
                  )}
                </div>
                <div className="notice-detail__sermon-list-body">
                  <h4 className="notice-detail__sermon-list-item-title">{item.title || '설교'}</h4>
                  <p className="notice-detail__sermon-list-item-pastor">{mainPastor || '담임목사'}</p>
                </div>
                <div className="notice-detail__sermon-list-ellipsis">
                  <FaEllipsisV />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      {youtube && (
        <div className="notice-detail__sermon-cta">
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="notice-detail__sermon-cta-btn"
          >
            <FaYoutube className="notice-detail__sermon-cta-icon" />
            더 많은 설교 보러가기
          </a>
          <p className="notice-detail__sermon-cta-info">
            * 모바일 데이터 환경에서는 데이터 요금이 발생할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
