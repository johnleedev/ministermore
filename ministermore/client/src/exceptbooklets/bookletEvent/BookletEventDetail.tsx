import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '../bookletNotice/BookletNoticeDetail.scss';
import './BookletEventDetail.scss';
import '../bookletNotice/styles/NoticeCreate.scss';
import './styles/EventCreate.scss';
import MainURL from '../../MainURL';
import ServiceAPIURL from '../../ServiceAPIURL';
import axios from 'axios';
import MainHeroCarousel from '../component/MainHeroCarousel';
import { parseMainImageNameFromDb } from '../component/mainImageNames';
import TemplateNotice from './BookletEventTemplates/TemplateNotice';
import TemplateEventProgram, { type EventProgramItem } from './BookletEventTemplates/TemplateEventProgram';
import TemplateEventProfile, { type EventProfileItem } from './BookletEventTemplates/TemplateEventProfile';
import TemplateEventOrder, { type EventOrderItem } from './BookletEventTemplates/TemplateEventOrder';
import TemplateEventApply from './BookletEventTemplates/TemplateEventApply';
import TemplateEventGreeting from './BookletEventTemplates/TemplateEventGreeting';
import {
  orderVisibleTabIds,
  presetVisibleTabsForBookletType,
} from './eventTemplateTypes';

/** axios 응답이 배열·false·JSON 문자열 등 여러 형태일 수 있음 — EventCreate와 동일한 `bookleteventmain/getdataprogramspart` 페이로드로 통일 */
function normalizeProgramPayload(data: unknown): EventProgramItem[] {
  if (data == null || data === false) return [];
  if (Array.isArray(data)) return data as EventProgramItem[];
  if (typeof data === 'string') {
    const t = data.trim();
    if (!t || t === 'false') return [];
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? (p as EventProgramItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapWorshipRow(r: Record<string, unknown>): EventOrderItem {
  const notice =
    r.notice != null && String(r.notice) !== ''
      ? String(r.notice)
      : r.content != null
        ? String(r.content)
        : '';
  return {
    id: typeof r.id === 'number' ? r.id : undefined,
    bookletId: r.bookletId != null ? String(r.bookletId) : undefined,
    showOrder: r.sortOrder != null ? String(r.sortOrder) : r.showOrder != null ? String(r.showOrder) : undefined,
    subTitle: r.subTitle != null ? String(r.subTitle) : '',
    title: r.title != null ? String(r.title) : '',
    charger: r.charger != null ? String(r.charger) : '',
    notice,
    orderStyle: r.orderStyle != null ? String(r.orderStyle) : undefined,
  };
}

function normalizeWorshipPayload(data: unknown): EventOrderItem[] {
  if (data == null || data === false) return [];
  let arr: unknown[] = [];
  if (Array.isArray(data)) arr = data;
  else if (typeof data === 'string') {
    const t = data.trim();
    if (!t || t === 'false') return [];
    try {
      const p = JSON.parse(t);
      arr = Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  } else return [];
  return arr.map((row) => mapWorshipRow(row as Record<string, unknown>));
}

function normalizeCastPayload(data: unknown): EventProfileItem[] {
  if (data == null || data === false) return [];
  if (Array.isArray(data)) return data as EventProfileItem[];
  if (typeof data === 'string') {
    const t = data.trim();
    if (!t || t === 'false') return [];
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? (p as EventProfileItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** 서버 정적 경로: build/images/bookletevent/mainimages (EventCreate와 동일) */
function mainImageUrl(fileName: string): string {
  const safe = encodeURIComponent(fileName);
  return `${ServiceAPIURL}/images/bookletevent/mainimages/${safe}`;
}

interface PostProps {
  id: number;
  bookletId: string;
  eventName: string;
  date: string;
  place: string;
  superViser: string;
  address: string;
  quiry: string;
  mainLogo: string;
  /** 레거시 단일 파일명 또는 JSON ["a.jpg","b.jpg",""] */
  imageMain: string;
  imageMainName?: string;
  placeNaver: string;
  placeKakao: string;
  /** eventInfo — `getdatabookletspart` 병합값 */
  programType?: string;
  /** 표시할 탭 id 목록 (소개 필수) */
  visibleTabs?: string[];
  applyNote?: string;
  bookletType?: string;
  eventGreeting?: string;
}

const DEFAULT_EVENT_VISIBLE_WHEN_MISSING = ['info', 'program', 'profile', 'order', 'apply'] as const;

const VALID_TABS = ['info', 'greeting', 'program', 'profile', 'order', 'apply'] as const;
type EventTabId = (typeof VALID_TABS)[number];

const ALL_TAB_DEFS: { id: EventTabId; label: string }[] = [
  { id: 'info', label: '소개' },
  { id: 'greeting', label: '초대의글' },
  { id: 'program', label: '프로그램' },
  { id: 'profile', label: '프로필' },
  { id: 'order', label: '순서' },
  { id: 'apply', label: '신청하기' },
];

/** EventMain 랜딩 iframe(구 4분할) → 탭 + 앵커 (`cast`/`worship` URL은 레거시) */
const LEGACY_EMBED: Record<string, { tab: EventTabId; anchor: string }> = {
  info: { tab: 'info', anchor: 'event-embed-info' },
  remind: { tab: 'info', anchor: 'event-embed-map' },
  /** EventMain 랜딩: 프로필 탭(현장·QR·프로필 흐름) */
  onsite: { tab: 'profile', anchor: 'event-embed-cast' },
  cast: { tab: 'profile', anchor: 'event-embed-cast' },
  profile: { tab: 'profile', anchor: 'event-embed-cast' },
  worship: { tab: 'order', anchor: 'event-embed-worship' },
  order: { tab: 'order', anchor: 'event-embed-worship' },
};

function normalizeUrlTab(raw: string | null): EventTabId {
  if (!raw) return 'info';
  if (raw in LEGACY_EMBED) {
    return LEGACY_EMBED[raw].tab;
  }
  if ((VALID_TABS as readonly string[]).includes(raw)) {
    return raw as EventTabId;
  }
  return 'info';
}

export default function BookletEventDetail() {
  const url = new URL(window.location.href);
  const ID = url.searchParams.get('id');
  const isPreview = url.searchParams.get('preview') === '1';
  const isEmbed = url.searchParams.get('embed') === '1';
  const embedSection = url.searchParams.get('section');
  const tabParam = url.searchParams.get('tab');

  const [currentSelectTab, setCurrentSelectTab] = useState<EventTabId>(() => normalizeUrlTab(tabParam));

  const [postData, setPostData] = useState<PostProps>();
  const [program, setProgram] = useState<EventProgramItem[]>([]);
  const [programLoading, setProgramLoading] = useState(false);
  const [cast, setCast] = useState<EventProfileItem[]>([]);
  const [castLoading, setCastLoading] = useState(false);
  const [worship, setWorship] = useState<EventOrderItem[]>([]);
  const [worshipLoading, setWorshipLoading] = useState(false);

  const [previewWidth, setPreviewWidth] = useState(450);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(350);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = previewWidth;
    },
    [previewWidth],
  );

  useEffect(() => {
    if (!isPreview || isEmbed) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(window.innerWidth - 48, Math.max(280, startWidthRef.current + delta));
      setPreviewWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPreview, isEmbed]);

  const fetchPosts = useCallback(async () => {
    if (!ID) return;

    /** 소개/프로그램 각각 실패해도 나머지는 채움 (한쪽 API 오류 시 프로그램 탭이 통째로 비는 문제 방지) */
    try {
      const resBooklet = await axios.post(`${ServiceAPIURL}/bookleteventmain/getdatabookletspart`, {
        id: ID,
      });
      const bookletPayload = resBooklet.data;
      if (Array.isArray(bookletPayload) && bookletPayload[0]) {
        setPostData(bookletPayload[0]);
      }
    } catch (e) {
      console.error('bookleteventmain getdatabookletspart:', e);
    }

    setProgramLoading(true);
    setCastLoading(true);
    setWorshipLoading(true);
    try {
      /** EventCreate와 동일 엔드포인트 (`EventCreateBooklet.js` → `sendProgramRowsResponse`) */
      const resProgram = await axios.post(`${ServiceAPIURL}/bookleteventmain/getdataprogramspart`, {
        id: ID,
      });
      setProgram(normalizeProgramPayload(resProgram.data));
    } catch (e) {
      console.error('bookleteventmain getdataprogramspart:', e);
      setProgram([]);
    } finally {
      setProgramLoading(false);
    }
    try {
      const resCast = await axios.post(`${ServiceAPIURL}/bookleteventmain/getdatacastpart`, { id: ID });
      setCast(normalizeCastPayload(resCast.data));
    } catch (e) {
      console.error('bookleteventmain getdatacastpart:', e);
      setCast([]);
    } finally {
      setCastLoading(false);
    }
    try {
      const resW = await axios.post(`${ServiceAPIURL}/bookleteventmain/getdataworshippart`, { id: ID });
      setWorship(normalizeWorshipPayload(resW.data));
    } catch (e) {
      console.error('bookleteventmain getdataworshippart:', e);
      setWorship([]);
    } finally {
      setWorshipLoading(false);
    }
  }, [ID]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setCurrentSelectTab(normalizeUrlTab(tabParam));
  }, [tabParam]);

  useEffect(() => {
    if (!isPreview || !isEmbed || embedSection !== 'body' || !tabParam) return;
    let anchor = 'event-embed-info';
    if (tabParam in LEGACY_EMBED) {
      anchor = LEGACY_EMBED[tabParam as keyof typeof LEGACY_EMBED].anchor;
    } else if (tabParam === 'program') {
      anchor = 'event-embed-program';
    } else if (tabParam === 'greeting') {
      anchor = 'event-embed-greeting';
    } else if (tabParam === 'apply') {
      anchor = 'event-embed-apply';
    }
    const t = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ block: 'start', behavior: 'auto' });
    }, 80);
    return () => clearTimeout(t);
  }, [isPreview, isEmbed, embedSection, tabParam, postData, program, cast, worship]);

  const mainHeroImageSrcs = useMemo(() => {
    const raw = postData?.imageMainName ?? postData?.imageMain ?? '';
    return parseMainImageNameFromDb(raw)
      .filter(Boolean)
      .map((name) => mainImageUrl(name));
  }, [postData?.imageMainName, postData?.imageMain]);

  const visibleTabIds = useMemo(() => {
    if (postData?.bookletType === 'newcomer') {
      return presetVisibleTabsForBookletType('newcomer');
    }
    const raw = postData?.visibleTabs;
    if (Array.isArray(raw) && raw.length) {
      return orderVisibleTabIds(raw.map(String));
    }
    return [...DEFAULT_EVENT_VISIBLE_WHEN_MISSING];
  }, [postData?.visibleTabs, postData?.bookletType]);

  const TAB_LIST = useMemo(() => ALL_TAB_DEFS.filter((t) => visibleTabIds.includes(t.id)), [visibleTabIds]);

  useEffect(() => {
    /** 랜딩 iframe(`section=body`)은 탭 UI 없이 본문만 쓰므로, 숨김 탭이어도 URL 탭·앵커 미리보기가 동작하도록 허용 */
    const allowedTabs: EventTabId[] =
      isPreview && isEmbed && embedSection === 'body'
        ? ALL_TAB_DEFS.map((t) => t.id)
        : (visibleTabIds as EventTabId[]);
    if (!allowedTabs.includes(currentSelectTab)) {
      setCurrentSelectTab((allowedTabs[0] || 'info') as EventTabId);
    }
  }, [visibleTabIds, currentSelectTab, isPreview, isEmbed, embedSection]);

  const renderCurrentTabBody = () => (
    <>
      {currentSelectTab === 'info' && (
        <TemplateNotice
          postData={postData}
          program={program}
          onOpenProgramTab={
            visibleTabIds.includes('program') ? () => setCurrentSelectTab('program') : undefined
          }
        />
      )}
      {currentSelectTab === 'greeting' && (
        <TemplateEventGreeting
          eventGreeting={postData?.eventGreeting ?? ''}
          dateLine={postData?.date ?? ''}
          placeLine={postData?.place ?? ''}
          hideBackgroundImage
        />
      )}
      {currentSelectTab === 'program' && (
        <TemplateEventProgram program={program} loading={programLoading} />
      )}
      {currentSelectTab === 'profile' && <TemplateEventProfile cast={cast} loading={castLoading} />}
      {currentSelectTab === 'order' && <TemplateEventOrder rows={worship} loading={worshipLoading} />}
      {currentSelectTab === 'apply' && <TemplateEventApply note={postData?.applyNote} />}
    </>
  );

  const tabGridClass =
    TAB_LIST.length <= 2
      ? 'church_detail--event-tabs2'
      : TAB_LIST.length === 3
        ? 'church_detail--event-tabs3'
        : TAB_LIST.length === 4
          ? 'church_detail--event-tabs4'
          : TAB_LIST.length === 5
            ? 'church_detail--event-tabs5'
            : 'church_detail--event-tabs6';

  const content = (
    <div className={`church_detail ${tabGridClass}${currentSelectTab === 'greeting' ? ' church_detail--greeting-tab' : ''}`}>
      <div className="church_detail__hero">
        <MainHeroCarousel
          fill
          imageSrcs={mainHeroImageSrcs}
          imgClassName="church_detail__hero-img"
          placeholder={<div className="church_detail__hero-placeholder">메인 이미지</div>}
          showViewFullButton={!isPreview && mainHeroImageSrcs.length > 0}
        />
        <div className="church_detail__hero-overlay">
          <p className="church_detail__hero-sub">모바일 행사 전단지</p>
          <h1 className="church_detail__hero-title">{postData?.eventName || '행사명'}</h1>
        </div>
      </div>

      <div className="church_detail__tabs">
        {TAB_LIST.map((tab) => (
          <div
            key={tab.id}
            className={`church_detail__tab ${currentSelectTab === tab.id ? 'on' : ''}`}
            onClick={() => setCurrentSelectTab(tab.id)}
            role="presentation"
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="church_detail__body">{renderCurrentTabBody()}</div>
    </div>
  );

  if (isPreview && isEmbed) {
    if (embedSection === 'body') {
      return (
        <div className="booklet-preview-page booklet-preview-page--embed booklet-preview-page--embed-body">
          <div className="booklet-preview-phone-frame booklet-preview-phone-frame--embed booklet-preview-phone-frame--embed-body">
            <div className="booklet-preview-phone-screen">
              <div className={`church_detail ${tabGridClass}`}>
                <div className="church_detail__body">{renderCurrentTabBody()}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="booklet-preview-page booklet-preview-page--embed">
        <div className="booklet-preview-phone-frame booklet-preview-phone-frame--embed">
          <div className="booklet-preview-phone-notch" />
          <div className="booklet-preview-phone-screen">{content}</div>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="booklet-preview-page">
        <div className="booklet-preview-phone-frame" style={{ width: previewWidth }}>
          <div className="booklet-preview-phone-notch" />
          <div className="booklet-preview-phone-screen">{content}</div>
          <div
            className="booklet-preview-resize-handle"
            onMouseDown={handleResizeMouseDown}
            role="slider"
            aria-label="모바일 화면 가로 길이 조절"
            aria-valuemin={280}
            aria-valuemax={typeof window !== 'undefined' ? Math.max(280, window.innerWidth - 48) : 1200}
            aria-valuenow={previewWidth}
          />
        </div>
        <p className="booklet-preview-hint">모바일 화면의 가로 길이를 조절해보세요</p>
      </div>
    );
  }

  return <div className="booklet-detail-page">{content}</div>;
}
