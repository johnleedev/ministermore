import { type ReactNode } from 'react';
import MainURL from '../../../MainURL';
import ServiceAPIURL from '../../../ServiceAPIURL';

/** 서버 `uploadProgramImage` → `build/images/bookletevent/programimages` */
function getProgramImageSrc(fileName: string): string {
  return `${ServiceAPIURL}/images/bookletevent/programimages/${encodeURIComponent(fileName)}`;
}

export interface EventProgramItem {
  id?: number;
  bookletId?: string;
  showOrder?: string;
  subTitle?: string;
  title?: string;
  dateTime?: string;
  /** eventProgram* 테이블 — 0이면 일시 비노출 (EventCreate 저장과 동일) */
  showDateTime?: number | boolean;
  /** DB·드라이버에 따라 문자열 JSON 또는 이미 파싱된 배열 */
  career?: string | Record<string, unknown>;
  /** JSON 문자열 또는 `[{name,pos}]` / 파일명 문자열 배열 */
  postImage?: string | unknown[];
}

/** EventCreate `parsePostImageLoad` / DB `postImage` — 파일명 + object-position */
function parseProgramPostImages(
  postImage: string | unknown[] | undefined
): { name: string; pos: string }[] {
  if (postImage == null || postImage === '') return [];
  if (Array.isArray(postImage)) {
    return normalizeProgramImageArray(postImage);
  }
  if (typeof postImage !== 'string') return [];
  const s = postImage.trim();
  if (!s) return [];
  if (!s.startsWith('[')) {
    return [{ name: s, pos: '50% 50%' }];
  }
  let raw: unknown;
  try {
    raw = JSON.parse(s);
  } catch {
    return [{ name: s, pos: '50% 50%' }];
  }
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return normalizeProgramImageArray(raw);
}

function normalizeProgramImageArray(raw: unknown[]): { name: string; pos: string }[] {
  if (raw.length === 0) return [];
  const first = raw[0];
  if (typeof first === 'object' && first !== null && 'name' in first) {
    return (raw as { name: string; pos?: string }[])
      .map((x) => ({
        name: String(x.name || ''),
        pos: (x.pos && String(x.pos).trim()) || '50% 50%',
      }))
      .filter((x) => x.name);
  }
  return raw
    .map((x: unknown) => ({
      name: typeof x === 'string' ? x : String((x as { name?: string })?.name || ''),
      pos: '50% 50%',
    }))
    .filter((x) => x.name);
}

/** EventCreate `parseCareerField` / `serializeCareerForSave` 와 동일한 의미 — long은 문단, list는 '-' 나열 */
function parseCareerForDisplay(career: unknown): { mode: 'long' | 'list'; lines: string[] } {
  const raw = career;
  if (raw == null || raw === '') return { mode: 'long', lines: [] };
  if (Array.isArray(raw)) {
    return { mode: 'long', lines: raw.map((x) => String(x ?? '')) };
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { lines?: unknown[] }).lines)) {
    const o = raw as { mode?: string; lines: unknown[] };
    const mode: 'long' | 'list' = o.mode === 'list' ? 'list' : 'long';
    return { mode, lines: o.lines.map((x) => String(x ?? '')) };
  }
  if (typeof raw !== 'string') return { mode: 'long', lines: [] };
  const s = raw.trim();
  if (!s) return { mode: 'long', lines: [] };
  try {
    return parseCareerForDisplay(JSON.parse(raw));
  } catch {
    return { mode: 'long', lines: [s] };
  }
}

export interface TemplateEventProgramProps {
  program: EventProgramItem[];
  /** 공개 페이지에서 프로그램 API 로딩 중 */
  loading?: boolean;
}

function renderCareerBlock(
  careerMode: 'long' | 'list',
  lines: string[],
  hasDesc: boolean,
): ReactNode {
  if (!hasDesc) return null;
  if (careerMode === 'list') {
    return (
      <div className="event-create__preview-program-desc-list event-create__preview-program-desc">
        {lines.map((line, li) => (
          <div key={li} className="event-create__preview-program-desc-list-row">
            {String(line).trim() ? (
              <>
                <span className="event-create__preview-program-desc-list-dash" aria-hidden>
                  -
                </span>
                <span className="event-create__preview-program-desc-list-text">{line}</span>
              </>
            ) : (
              <span className="event-create__preview-program-desc-list-spacer" aria-hidden />
            )}
          </div>
        ))}
      </div>
    );
  }
  return (
    <p className="event-create__preview-worship-desc event-create__preview-worship-desc--block event-create__preview-program-desc">
      {lines.join('\n')}
    </p>
  );
}

/** BookletEventDetail 프로그램 탭 — EventCreate 미리보기(.event-create__preview-*)와 동일한 블록 구조 */
export default function TemplateEventProgram({ program, loading = false }: TemplateEventProgramProps) {
  if (loading) {
    return (
      <div id="event-embed-program" className="template-event-program template-event-program--loading">
        <p className="template-event-program__hint">프로그램을 불러오는 중…</p>
      </div>
    );
  }

  if (!program?.length) {
    return (
      <div id="event-embed-program" className="template-event-program template-event-program--empty">
        <p className="template-event-program__empty">프로그램이 등록되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div id="event-embed-program" className="template-event-program event-create__preview-schedule">
      {program.map((item, index) => {
        const imageList = parseProgramPostImages(item.postImage);
        const { mode: careerMode, lines } = parseCareerForDisplay(item.career);
        const hasDesc = lines.some((c) => String(c).trim());
        const showSchedule = item.showDateTime !== false && item.showDateTime !== 0;
        const hasImages = imageList.length > 0;

        const head = (
          <div className="event-create__preview-program-head template-event-program__head">
            {showSchedule ? (
              <span className="event-create__preview-program-schedule">{item.dateTime || '—'}</span>
            ) : null}
            {item.subTitle ? (
              <span className="event-create__preview-program-title-inline">{item.subTitle}.</span>
            ) : null}
            <span className="event-create__preview-program-title">{item.title || '프로그램'}</span>
          </div>
        );

        if (hasImages) {
          return (
            <div key={item.id ?? index} className="notice-detail__servers-card template-event-program__card">
              <div className="notice-detail__servers-card-avatar template-event-program__avatar">
                {imageList.map(({ name, pos }, i) => (
                  <div key={i} className="template-event-program__avatar-img-wrap">
                    <img src={getProgramImageSrc(name)} alt="" style={{ objectPosition: pos }} />
                  </div>
                ))}
              </div>
              <div className="notice-detail__servers-card-body">
                {head}
                {renderCareerBlock(careerMode, lines, hasDesc)}
              </div>
            </div>
          );
        }

        /* 이미지 없음: 제목·일시 + 설명만 */
        return (
          <div key={item.id ?? index} className="event-create__preview-program-block">
            {head}
            {hasDesc ? (
              <div className="event-create__preview-program-body">
                {renderCareerBlock(careerMode, lines, hasDesc)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
