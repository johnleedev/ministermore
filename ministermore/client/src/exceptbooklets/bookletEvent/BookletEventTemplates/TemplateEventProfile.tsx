import { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import MainURL from '../../../MainURL';
import ServiceAPIURL from '../../../ServiceAPIURL';

/** 프로필 사진 — 신규 `castimages`, 레거시 `programimages` 한 번 폴백 */
export function CastPortraitImage({ fileName, alt = '' }: { fileName: string; alt?: string }) {
  const [useLegacyDir, setUseLegacyDir] = useState(false);
  const dir = useLegacyDir ? 'programimages' : 'castimages';
  const src = `${ServiceAPIURL}/images/bookletevent/${dir}/${encodeURIComponent(fileName)}`;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => {
        if (!useLegacyDir) setUseLegacyDir(true);
      }}
    />
  );
}

export interface EventProfileItem {
  id?: number;
  bookletId?: string;
  showOrder?: string;
  personName?: string;
  roleName?: string;
  note?: string;
  /** 프로그램 행과 동일하게 이미지 파일명(또는 JSON 문자열). 레거시 `photo`는 조회 시 병합 가능 */
  postImage?: string;
  /** @deprecated DB/응답이 `postImage`로 통일되면 제거 */
  photo?: string;
}

export interface TemplateEventProfileProps {
  cast: EventProfileItem[];
  loading?: boolean;
  /** EventCreate 좌측 미리보기: 「아이콘+프로필」 라벨 숨김, 행마다 흰 카드 */
  editorPreview?: boolean;
}

/** DB 단일 파일명 또는 JSON 배열 — `{ name }`·문자열 혼합 허용 (파일은 `castimages/`, 구버전은 `programimages/`) */
function castPostImageFileName(postImage?: string, photo?: string): string {
  const raw = postImage || photo;
  if (!raw?.trim()) return '';
  const t = raw.trim();
  try {
    const p = JSON.parse(t);
    if (Array.isArray(p) && p.length > 0) {
      const first = p[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && first !== null && 'name' in first) {
        const n = (first as { name?: unknown }).name;
        return typeof n === 'string' ? n : '';
      }
    }
  } catch {
    /* 단일 파일명 */
  }
  return t;
}

function rowHasContent(row: EventProfileItem): boolean {
  return !!(
    String(row.personName || '').trim() ||
    String(row.roleName || '').trim() ||
    String(row.note || '').trim() ||
    castPostImageFileName(row.postImage, row.photo)
  );
}

/** 행사 전단지 프로필 탭 — TemplateServers와 동일 카드 레이아웃(아바타 비율·본문 flex) */
export default function TemplateEventProfile({ cast, loading = false, editorPreview = false }: TemplateEventProfileProps) {
  if (loading) {
    return (
      <div
        id="event-embed-cast"
        className={`template-event-cast template-event-cast--loading${editorPreview ? ' template-event-cast--editor-preview' : ''}`}
      >
        <p className="template-event-program__hint">프로필을 불러오는 중…</p>
      </div>
    );
  }

  const rows = (cast || []).filter(rowHasContent);

  if (rows.length === 0) {
    return (
      <div
        id="event-embed-cast"
        className={`template-event-cast template-event-cast--empty${editorPreview ? ' template-event-cast--editor-preview' : ''}`}
      >
        <p className="template-event-program__empty">등록된 프로필이 없습니다.</p>
      </div>
    );
  }

  const rootClass = [
    'template-event-cast',
    editorPreview ? 'template-event-cast--editor-preview' : 'notice-create__preview-section-panel',
  ].join(' ');

  const listClass = [
    'notice-detail__servers-list',
    'template-event-cast__list',
    editorPreview ? 'template-event-cast__list--editor' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const cardEditorClass = editorPreview ? ' template-event-cast__card--editor' : '';

  return (
    <div id="event-embed-cast" className={rootClass}>
      {!editorPreview && (
        <div className="notice-create__preview-section-label">
          <span className="notice-create__preview-chip-icon">👥</span>
          프로필
        </div>
      )}
      <div className={listClass}>
        {rows.map((row, i) => {
          const imgName = castPostImageFileName(row.postImage, row.photo);
          return (
            <div key={row.id ?? i} className={`notice-detail__servers-card${cardEditorClass}`}>
              <div
                className="notice-detail__servers-card-avatar"
                style={
                  imgName
                    ? undefined
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                }
              >
                {imgName ? (
                  <CastPortraitImage fileName={imgName} alt={row.personName || ''} />
                ) : (
                  <FaUser className="notice-detail__servers-card-icon" aria-hidden />
                )}
              </div>
              <div className="notice-detail__servers-card-body">
                <div className="notice-detail__servers-card-row">
                  <div>
                    <h4 className="notice-detail__servers-card-name">
                      {row.personName || '이름'}
                      {row.roleName ? (
                        <span className="notice-detail__servers-card-duty"> | {row.roleName}</span>
                      ) : null}
                    </h4>
                    {row.note ? (
                      <p className="notice-detail__servers-card-desc template-event-cast__note">{row.note}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
