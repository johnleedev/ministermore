import MainURL from '../../../MainURL';
import ServiceAPIURL from '../../../ServiceAPIURL';

/** BookletNoticeDetail / NoticeCreate 미리보기 갤러리 타일 그리드 */
export interface NoticeGalleryItem {
  id?: number;
  image: string;
  title: string;
  description: string;
  sortOrder?: number;
  imageUrl?: string;
}

export function galleryItemPreviewSrc(item: NoticeGalleryItem): string {
  const raw = item.imageUrl || item.image || '';
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:') || raw.startsWith('http')) {
    return raw;
  }
  return `${ServiceAPIURL}/images/bookletnotice/gallery/${raw}`;
}

export interface TemplateGalleryProps {
  galleryPreviewItems: { item: NoticeGalleryItem; index: number }[];
  galleryPreviewIndex: number;
  onSelectPreviewIndex: (index: number) => void;
}

function openImageInNewWindow(src: string) {
  if (!src) return;
  window.open(src, '_blank', 'noopener,noreferrer');
}

export default function TemplateGallery({
  galleryPreviewItems,
  galleryPreviewIndex,
  onSelectPreviewIndex,
}: TemplateGalleryProps) {
  return (
    <div className="notice-create__preview-gallery notice-create__preview-gallery--editor">
      {galleryPreviewItems.length === 0 ? (
        <div className="notice-create__preview-gallery-editor-empty" aria-hidden />
      ) : (
        <div className="notice-create__preview-gallery-editor-grid">
          {galleryPreviewItems.map(({ item, index }, thumbIdx) => {
            const src = galleryItemPreviewSrc(item);
            const isSelected = thumbIdx === galleryPreviewIndex;

            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                className={
                  isSelected
                    ? 'notice-create__preview-gallery-editor-tile notice-create__preview-gallery-editor-tile--selected'
                    : 'notice-create__preview-gallery-editor-tile'
                }
                onClick={() => onSelectPreviewIndex(thumbIdx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPreviewIndex(thumbIdx);
                  }
                }}
              >
                <img src={src} alt={item.title || ''} />
                {isSelected && src ? (
                  <button
                    type="button"
                    className="notice-create__preview-gallery-editor-view-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageInNewWindow(src);
                    }}
                    aria-label="크게보기 — 새 창에서 이미지 보기"
                  >
                    크게보기
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
