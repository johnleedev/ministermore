import MainURL from '../../../MainURL';

/** BookletNoticeDetail / NoticeCreate 미리보기 갤러리 타일 그리드 */
export interface NoticeGalleryItem {
  id?: number;
  image: string;
  title: string;
  description: string;
  sortOrder?: number;
}

export function galleryItemPreviewSrc(item: NoticeGalleryItem): string {
  const raw = item.image || '';
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:') || raw.startsWith('http')) {
    return raw;
  }
  return `${MainURL}/images/bookletnotice/gallery/${raw}`;
}

export interface TemplateGalleryProps {
  galleryPreviewItems: { item: NoticeGalleryItem; index: number }[];
  galleryPreviewIndex: number;
  onSelectPreviewIndex: (index: number) => void;
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
          {galleryPreviewItems.map(({ item, index }, thumbIdx) => (
            <button
              key={index}
              type="button"
              className={
                thumbIdx === galleryPreviewIndex
                  ? 'notice-create__preview-gallery-editor-tile notice-create__preview-gallery-editor-tile--selected'
                  : 'notice-create__preview-gallery-editor-tile'
              }
              onClick={() => onSelectPreviewIndex(thumbIdx)}
            >
              <img src={galleryItemPreviewSrc(item)} alt={item.title || ''} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
