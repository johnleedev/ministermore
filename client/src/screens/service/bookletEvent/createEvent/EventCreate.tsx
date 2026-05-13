import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../../../RecoilStore';
import './EventCreate.scss';
import '../../bookletNotice/createNotice/NoticeCreate.scss';
import MainURL from '../../../../MainURL';
import axios from 'axios';
import navermapnotice from '../../../../images/booklet/navermapnotice.jpg';
import kakaomapnotice from '../../../../images/booklet/kakaomapnotice.jpg';
import orderImgSchedule from '../../../../images/bookletevent/ordersamples/ordersample2.png';
import orderImgWorship from '../../../../images/bookletevent/ordersamples/ordersample1.png';
import orderImgConcert from '../../../../images/bookletevent/ordersamples/ordersample3.png';
import { FaInfoCircle, FaUser } from 'react-icons/fa';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import MainHeroCarousel from '../../../../exceptbooklets/component/MainHeroCarousel';
import TemplateNotice from '../../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateNotice';
import TemplateEventProfile, { CastPortraitImage } from '../../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventProfile';
import TemplateEventOrder from '../../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventOrder';
import TemplateEventApply from '../../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventApply';
import TemplateEventGreeting from '../../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventGreeting';
import {
  MAIN_IMAGE_SLOT_COUNT,
  parseMainImageNameFromDb,
  serializeMainImageNameForDb,
  normalizeImageMainNameForSnapshot,
} from '../../../../exceptbooklets/component/mainImageNames';
import {
  type EventVisibleTabId,
  type EventBookletTypeId,
  EVENT_VISIBLE_TAB_ORDER,
  EVENT_VISIBLE_TAB_LABELS,
  EVENT_BOOKLET_TYPE_DEFS,
  parseEventBookletTypeId,
  presetVisibleTabsForBookletType,
  orderVisibleTabIds,
  type EventOrderStyleId,
  parseEventOrderStyleId,
} from './eventTemplateTypes';

type ProgramKind = 'concert' | 'worship';

type EventCreateTabId = EventVisibleTabId;

const TAB_DEFS: { id: EventCreateTabId; label: string }[] = EVENT_VISIBLE_TAB_ORDER.map((id) => ({
  id,
  label: EVENT_VISIBLE_TAB_LABELS[id],
}));

const DEFAULT_VISIBLE_TABS: EventCreateTabId[] = ['info', 'program', 'profile'];

/** 행사 영문·숫자 식별명 — 탭 한 번으로 입력 필드 채우기 */
const EVENT_NAME_EN_EXAMPLES = [
  'SpringRetreat2026',
  'SummerConcert2026',
  'YouthCamp2026',
  'Ordination2026',
  'FamilyWorship1',
] as const;

function orderVisibleTabs(ids: readonly string[] | null | undefined): EventCreateTabId[] {
  const base = ids && ids.length ? ids : DEFAULT_VISIBLE_TABS;
  return orderVisibleTabIds(base);
}

function parseVisibleTabs(raw: unknown): EventCreateTabId[] {
  if (raw == null || raw === '') return [...DEFAULT_VISIBLE_TABS];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [...DEFAULT_VISIBLE_TABS];
    try {
      const p = JSON.parse(t);
      return orderVisibleTabs(Array.isArray(p) ? p.map(String) : []);
    } catch {
      return [...DEFAULT_VISIBLE_TABS];
    }
  }
  if (Array.isArray(raw)) return orderVisibleTabs(raw.map(String));
  return [...DEFAULT_VISIBLE_TABS];
}

/** 결제 직후 `?visibleTabs=` 로 전달된 탭 — 첫 렌더에서 폼 탭과 맞춤 */
function parseVisibleTabsFromSearch(search: string): EventCreateTabId[] | null {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get('visibleTabs');
    if (raw == null || raw.trim() === '') return null;
    const p = JSON.parse(raw);
    if (!Array.isArray(p) || p.length === 0) return null;
    return orderVisibleTabs(p.map(String));
  } catch {
    return null;
  }
}

/** 순서 탭 행 — `eventOrder` / `POST /bookleteventcreate/saveWorship` (프로필 eventProfile와 별도 테이블) */
type WorshipItem = { subTitle: string; title: string; charger: string; notice: string };

const ORDER_STYLE_UI: { id: EventOrderStyleId; title: string; desc: string; sample: string }[] = [
  { id: 'schedule', title: '일정형', desc: '일시 + 텍스트', sample: orderImgSchedule },
  { id: 'worship', title: '예배형', desc: '제목 · 소제목 · 담당 · 문구(가사·내용)', sample: orderImgWorship },
  { id: 'concert', title: '음악회형', desc: '제목 · 작곡가 · 연주자 · 문구(가사·설명)', sample: orderImgConcert },
];

function worshipRowHasContentForEditor(w: WorshipItem, style: EventOrderStyleId): boolean {
  if (style === 'schedule') {
    return !!(
      w.title.trim() ||
      w.subTitle.trim() ||
      w.charger.trim() ||
      w.notice.trim()
    );
  }
  return !!(w.subTitle.trim() || w.title.trim() || w.charger.trim() || w.notice.trim());
}

/** 소개 탭 `<input type="date">` 값(YYYY-MM-DD) 파싱 */
function parseIntroYmd(s: string): { y: number; m: number; d: number } | null {
  const t = (s || '').trim();
  const mm = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!mm) return null;
  const y = parseInt(mm[1], 10);
  const mo = parseInt(mm[2], 10) - 1;
  const d = parseInt(mm[3], 10);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return { y, m: mo, d };
}

function enumerateIntroDaysInclusive(startStr: string, endStr: string): string[] {
  const a = parseIntroYmd(startStr);
  const b = parseIntroYmd(endStr);
  if (!a || !b) return [];
  const cur = new Date(a.y, a.m, a.d);
  const end = new Date(b.y, b.m, b.d);
  if (cur.getTime() > end.getTime()) {
    return enumerateIntroDaysInclusive(endStr, startStr);
  }
  const out: string[] = [];
  while (cur.getTime() <= end.getTime()) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${day}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** 일정형 날짜 셀렉트 — 소개 탭 행사 일정만 옵션으로 제공 */
function buildScheduleDateSelectOptionsFromIntro(
  mode: 'single' | 'range',
  dateStart: string,
  dateEnd: string
): { value: string; label: string }[] {
  const placeholder = { value: '', label: '날짜' };
  if (mode === 'single') {
    const ds = (dateStart || '').trim();
    if (!parseIntroYmd(ds)) {
      return [{ value: '', label: '소개 탭에서 행사 날짜를 입력하세요' }];
    }
    return [placeholder, { value: ds, label: ds }];
  }
  const start = (dateStart || '').trim();
  const end = (dateEnd || start).trim();
  const days = enumerateIntroDaysInclusive(start, end);
  if (days.length === 0) {
    return [{ value: '', label: '소개 탭에서 기간(시작·종료)을 입력하세요' }];
  }
  return [placeholder, ...days.map((iso) => ({ value: iso, label: iso }))];
}

const SCHEDULE_HOUR_SELECT_OPTS = [
  { value: '', label: '시' },
  ...Array.from({ length: 24 }, (_, i) => {
    const v = String(i).padStart(2, '0');
    return { value: v, label: v };
  }),
];

const SCHEDULE_MINUTE_SELECT_OPTS = [
  { value: '', label: '분' },
  ...Array.from({ length: 60 }, (_, i) => {
    const v = String(i).padStart(2, '0');
    return { value: v, label: v };
  }),
];

function scheduleHourValue(raw: string): string {
  const t = String(raw || '').trim();
  if (!t) return '';
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return '';
  return String(Math.max(0, Math.min(23, n))).padStart(2, '0');
}

function scheduleMinuteValue(raw: string): string {
  const t = String(raw || '').trim();
  if (!t) return '';
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return '';
  return String(Math.max(0, Math.min(59, n))).padStart(2, '0');
}

/** 프로필 탭 한 행 — `eventProfile` / `POST /bookleteventcreate/saveCast` (`postImage`: `castimages/`) */
type CastItem = {
  personName: string;
  roleName: string;
  note: string;
  postImage?: string;
};

/** 프로그램 행 — `POST /bookleteventcreate/saveProgram` → 통합 `eventProgram` */
interface ProgramItem {
  title: string;
  dateTime: string;
  /** 시간·일시 전단지 노출 여부 (false면 비노출) */
  showDateTime: boolean;
  career: string[]; // 설명 줄·항목 (장문형=줄 단위, 나열형=항목별)
  /** 설명 입력 UI: 장문형(textarea) | 나열형(input 여러 개) */
  careerMode?: 'long' | 'list';
  postImage: string[]; // JSON 배열 (이미지 파일명들)
  postImageFiles?: File[];
  /** 로컬 첨부 미리보기(blob URL), postImageFiles와 동일 인덱스 */
  postImageUrls?: string[];
  /** 서버+대기 이미지 통합 순서, CSS object-position (예: 50% 50%) */
  programImagePositions?: string[];
}

type ProgramImageSlot =
  | { kind: 'server'; name: string }
  | { kind: 'pending'; file: File; url: string };

function flattenProgramImages(row: ProgramItem): ProgramImageSlot[] {
  const server = (row.postImage || []).map((name) => ({ kind: 'server' as const, name }));
  const files = row.postImageFiles || [];
  const urls = row.postImageUrls || [];
  const pending: ProgramImageSlot[] = files.map((file, i) => ({
    kind: 'pending' as const,
    file,
    url: urls[i] || '',
  }));
  return [...server, ...pending];
}

/** DB postImage: 파일명 배열 또는 { name, pos }[] */
function parsePostImageLoad(raw: unknown): { names: string[]; positions: string[] } {
  if (raw == null) return { names: [], positions: [] };
  let arr: unknown;
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw || '[]');
    } catch {
      return { names: [], positions: [] };
    }
  } else return { names: [], positions: [] };
  if (!Array.isArray(arr) || arr.length === 0) return { names: [], positions: [] };
  const first = arr[0];
  if (typeof first === 'object' && first !== null && 'name' in first) {
    const rows = arr as { name: string; pos?: string }[];
    return {
      names: rows.map((x) => x.name),
      positions: rows.map((x) => x.pos || '50% 50%'),
    };
  }
  return {
    names: arr.map((x) => String(x)),
    positions: [],
  };
}

function serializeProgramPostImageForSave(row: ProgramItem): string {
  const names = row.postImage || [];
  if (names.length === 0) return '[]';
  const pos = row.programImagePositions || [];
  return JSON.stringify(
    names.map((name, i) => ({
      name,
      pos: pos[i] || '50% 50%',
    }))
  );
}

function revokeProgramRowBlobs(row: ProgramItem) {
  (row.postImageUrls || []).forEach((u) => {
    if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
  });
}

function programRowHasContent(p: ProgramItem): boolean {
  return !!(
    (p.title && p.title.trim()) ||
    (p.dateTime && p.dateTime.trim()) ||
    (p.career?.some((c) => c && String(c).trim())) ||
    (p.postImage && p.postImage.length > 0) ||
    (p.postImageFiles && p.postImageFiles.length > 0)
  );
}

function getProgramRowPreviewImageItems(row: ProgramItem): { url: string; position: string }[] {
  const flat = flattenProgramImages(row);
  const positions = row.programImagePositions || [];
  return flat.map((slot, i) => ({
    url:
      slot.kind === 'server'
        ? `${MainURL}/images/bookletevent/programimages/${slot.name}`
        : slot.url,
    position: positions[i] || '50% 50%',
  }));
}

/** 썸네일에서 드래그해 보이는 영역(object-position) 조절 */
function ProgramImagePanThumb({
  src,
  objectPosition,
  onPositionChange,
  className,
}: {
  src: string;
  objectPosition: string;
  onPositionChange: (next: string) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPx: number; startPy: number } | null>(null);

  const parsePos = (s: string): [number, number] => {
    const m = (s || '').trim().match(/([\d.]+)%\s+([\d.]+)%/);
    if (m) return [Number(m[1]), Number(m[2])];
    return [50, 50];
  };

  const fmt = (x: number, y: number) =>
    `${Math.round(Math.max(0, Math.min(100, x)))}% ${Math.round(Math.max(0, Math.min(100, y)))}%`;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const [px, py] = parsePos(objectPosition);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPx: px, startPy: py };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    let nx = dragRef.current.startPx - (dx / w) * 100;
    let ny = dragRef.current.startPy - (dy / h) * 100;
    onPositionChange(fmt(nx, ny));
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          objectPosition,
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
}

/** 기존 DB의 부제목·제목을 단일 제목 필드로 합침 */
function mergeProgramTitle(sub: string | undefined, title: string | undefined): string {
  const s = (sub || '').trim();
  const t = (title || '').trim();
  if (s && t) return `${s}. ${t}`;
  return t || s;
}

type CareerInputMode = 'long' | 'list';

/** DB/응답: 기존 JSON 배열 또는 { mode, lines } */
function parseCareerField(raw: unknown): { mode: CareerInputMode; lines: string[] } {
  if (raw == null) return { mode: 'long', lines: [] };
  if (Array.isArray(raw)) {
    return { mode: 'long', lines: raw.map((x) => String(x ?? '')) };
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { lines?: unknown[] }).lines)) {
    const o = raw as { mode?: string; lines: unknown[] };
    const mode: CareerInputMode = o.mode === 'list' ? 'list' : 'long';
    return { mode, lines: o.lines.map((x) => String(x ?? '')) };
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return { mode: 'long', lines: [] };
    try {
      return parseCareerField(JSON.parse(s));
    } catch {
      /** DB 레거시: JSON이 아닌 한 줄 설명 문자열 */
      return { mode: 'long', lines: [s] };
    }
  }
  return { mode: 'long', lines: [] };
}

function serializeCareerForSave(row: ProgramItem): string {
  const mode = row.careerMode === 'list' ? 'list' : 'long';
  return JSON.stringify({ mode, lines: row.career ?? [] });
}

interface MainImageSlot {
  serverName: string;
  file: File | null;
  previewUrl: string;
}

function emptyMainImageSlots(): MainImageSlot[] {
  return Array.from({ length: MAIN_IMAGE_SLOT_COUNT }, () => ({
    serverName: '',
    file: null,
    previewUrl: '',
  }));
}

function mainImageSrcsForPreview(slots: MainImageSlot[]): string[] {
  return slots
    .map(
      (m) =>
        m.previewUrl ||
        (m.serverName ? `${MainURL}/images/bookletevent/mainimages/${m.serverName}` : '')
    )
    .filter(Boolean);
}

function parseDateRangeValue(raw: string): {
  mode: 'single' | 'range';
  start: string;
  end: string;
} {
  const value = (raw || '').trim();
  if (!value) return { mode: 'single', start: '', end: '' };
  if (value.includes('~')) {
    const [startRaw, endRaw] = value.split('~');
    const start = (startRaw || '').trim();
    const end = (endRaw || '').trim();
    return { mode: 'range', start, end };
  }
  return { mode: 'single', start: value, end: '' };
}

function MainImageSlotDropzone({
  slotIndex,
  onDrop,
  isLoading,
}: {
  slotIndex: number;
  onDrop: (slotIndex: number, files: File[]) => void;
  isLoading: boolean;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files.length && onDrop(slotIndex, files),
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isLoading,
  });
  return (
    <div {...getRootProps()} className="event-create__main-image-slot-dropzone">
      <input {...getInputProps()} />
      {isLoading ? '처리 중...' : '첨부'}
    </div>
  );
}


export default function EventCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const urlParams = new URLSearchParams(location.search);
  const ordererName = urlParams.get('ordererName') || '';
  const ordererPhone = urlParams.get('ordererPhone') || '';

  const [visibleTabIds, setVisibleTabIds] = useState<EventCreateTabId[]>(() => {
    if (typeof window === 'undefined') return [...DEFAULT_VISIBLE_TABS];
    const fromUrl = parseVisibleTabsFromSearch(window.location.search);
    return fromUrl ?? [...DEFAULT_VISIBLE_TABS];
  });
  const visibleTabList = useMemo(() => orderVisibleTabs(visibleTabIds), [visibleTabIds]);

  const [eventName, setEventName] = useState('');
  const [eventNameEn, setEventNameEn] = useState('');
  const lastEventNameEnAlertRef = useRef<number>(0);
  /** 완료 시 필수 미입력 안내 후 소개 탭의 행사명 입력으로 스크롤·포커스 (NoticeCreate `churchNameInputRef` 패턴) */
  const eventNameInputRef = useRef<HTMLInputElement | null>(null);
  const [date, setDate] = useState('');
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const scheduleDateSelectOptions = useMemo(
    () => buildScheduleDateSelectOptionsFromIntro(dateMode, dateStart, dateEnd),
    [dateMode, dateStart, dateEnd]
  );
  const [place, setPlace] = useState('');
  const [superViser, setSuperViser] = useState('');
  const [mainImages, setMainImages] = useState<MainImageSlot[]>(emptyMainImageSlots);
  const [mainImageLoadingSlot, setMainImageLoadingSlot] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [placeNaver, setPlaceNaver] = useState('');
  const [placeKakao, setPlaceKakao] = useState('');
  const [quiry, setQuiry] = useState('');
  /** `eventInfo.programType` — 프로그램 탭 내 음악회형/예배형, `saveProgram`에 반영 */
  const [programType, setProgramType] = useState<ProgramKind>('concert');
  const [programData, setProgramData] = useState<ProgramItem[]>([
    { title: '', dateTime: '', showDateTime: true, career: [], careerMode: 'long', postImage: [] },
  ]);
  const [castData, setCastData] = useState<CastItem[]>([{ personName: '', roleName: '', note: '', postImage: '' }]);
  const [worshipData, setWorshipData] = useState<WorshipItem[]>([
    { subTitle: '', title: '', charger: '', notice: '' },
  ]);
  const [orderStyle, setOrderStyle] = useState<EventOrderStyleId>('worship');
  const [castImageLoadingIndex, setCastImageLoadingIndex] = useState<number | null>(null);
  const [programImageLoading, setProgramImageLoading] = useState<Record<string, boolean>>({});
  const programImageResetFns = useRef<Record<string, () => void>>({});
  const [isViewAddress, setIsViewAddress] = useState(false);
  /** URL의 id를 첫 렌더에서 읽어 데이터 로드 useEffect가 한 번에 실행되도록 함 (마이페이지→수정 진입 시 이미지 등 로드 누락 방지) */
  const [eventMainId, setEventMainId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
  );
  /** `getdatabookletspart` 병합값 — 완료 시 관리자 `serviceApply` 기록용 */
  const [savedOrderMeta, setSavedOrderMeta] = useState({
    orderTitle: '',
    ordererName: '',
    ordererPhone: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<EventCreateTabId>('info');
  const [dirtyTabs, setDirtyTabs] = useState<Record<EventCreateTabId, boolean>>({
    info: false,
    greeting: false,
    program: false,
    profile: false,
    order: false,
    apply: false,
  });
  const [eventGreeting, setEventGreeting] = useState('');
  const [applyNote, setApplyNote] = useState('');
  const [bookletTypeId, setBookletTypeId] = useState<EventBookletTypeId | null>(null);
  const lastSavedApplyRef = useRef<string | null>(null);
  const lastSavedInfoRef = useRef<string | null>(null);
  const lastSavedProgramRef = useRef<string | null>(null);
  const lastSavedCastRef = useRef<string | null>(null);
  const lastSavedWorshipRef = useRef<string | null>(null);
  const lastSavedGreetingRef = useRef<string | null>(null);

  const templateNoticePostData = useMemo(
    () => ({
      eventName,
      date,
      place,
      address,
      superViser,
      quiry,
      placeNaver,
      placeKakao,
    }),
    [eventName, date, place, address, superViser, quiry, placeNaver, placeKakao]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setEventMainId(id);
    } else {
      navigate('/service/bookleteventpay', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!eventMainId) return;

    const mapRow = (p: {
      subTitle?: string;
      title?: string;
      dateTime?: string;
      showDateTime?: boolean | number;
      career?: string | string[];
      postImage?: string | string[];
    }): ProgramItem => {
      const rawCareer = Array.isArray(p.career)
        ? p.career
        : typeof p.career === 'string'
          ? (() => {
              const s = p.career || '';
              try {
                return JSON.parse(s);
              } catch {
                /** 레거시 평문 한 줄 — parseCareerField에서 한 줄 lines로 복원 */
                return s.trim() ? s : [];
              }
            })()
          : [];
      const parsed = parseCareerField(rawCareer);
      const rawPost =
        Array.isArray(p.postImage)
          ? p.postImage
          : typeof p.postImage === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.postImage || '[]');
                } catch {
                  return [];
                }
              })()
            : [];
      const imgLoaded = parsePostImageLoad(rawPost);
      return {
        title: mergeProgramTitle(p.subTitle, p.title),
        dateTime: p.dateTime || '',
        showDateTime: !(p.showDateTime === 0 || p.showDateTime === false),
        career: parsed.lines,
        careerMode: parsed.mode,
        postImage: imgLoaded.names,
        programImagePositions:
          imgLoaded.names.length === 0
            ? undefined
            : imgLoaded.positions.length > 0
              ? imgLoaded.positions
              : imgLoaded.names.map(() => '50% 50%'),
      };
    };

    /** 소개/프로그램/프로필/순서를 병렬로 불러옴 */
    Promise.allSettled([
      axios.post(`${MainURL}/bookleteventcreate/getdatabookletspart`, { id: eventMainId }),
      axios.post(`${MainURL}/bookleteventcreate/getdataprogramspart`, { id: eventMainId }),
      axios.post(`${MainURL}/bookleteventcreate/getdatacastpart`, { id: eventMainId }),
      axios.post(`${MainURL}/bookleteventcreate/getdataworshippart`, { id: eventMainId }),
    ]).then((results) => {
      const [introResult, programResult, castResult, worshipResult] = results;

      let loadedProgramType: ProgramKind = 'concert';

      if (introResult.status === 'fulfilled') {
        const res = introResult.value;
        if (res.data?.[0]) {
          const d = res.data[0];
          setSavedOrderMeta({
            orderTitle: String((d as { orderTitle?: unknown }).orderTitle ?? ''),
            ordererName: String((d as { ordererName?: unknown }).ordererName ?? ''),
            ordererPhone: String((d as { ordererPhone?: unknown }).ordererPhone ?? '').replace(/\s/g, ''),
          });
          loadedProgramType = d.programType === 'worship' ? 'worship' : 'concert';
          setProgramType(loadedProgramType);
          setEventName(d.eventName || '');
          const loadedEventNameEn = String(
            (d as { eventNameEn?: unknown }).eventNameEn ?? ''
          ).replace(/[^a-zA-Z0-9]/g, '');
          setEventNameEn(loadedEventNameEn);
          const parsedDate = parseDateRangeValue(d.date || '');
          setDate(d.date || '');
          setDateMode(parsedDate.mode);
          setDateStart(parsedDate.start);
          setDateEnd(parsedDate.end);
          setPlace(d.place || '');
          setSuperViser(d.superViser || '');
          const rawMain =
            (d as { imageMainName?: string; imageMain?: string }).imageMainName ||
            (d as { imageMainName?: string; imageMain?: string }).imageMain ||
            '';
          const mainNames = parseMainImageNameFromDb(typeof rawMain === 'string' ? rawMain : String(rawMain ?? ''));
          setMainImages(
            mainNames.map((serverName) => ({ serverName, file: null, previewUrl: '' }))
          );
          setAddress(d.address || '');
          setPlaceNaver(d.placeNaver || '');
          setPlaceKakao(d.placeKakao || '');
          setQuiry(d.quiry || '');
          const loadedBookletType = parseEventBookletTypeId((d as { bookletType?: unknown }).bookletType);
          const rawVt = (d as { visibleTabs?: unknown }).visibleTabs;
          const hasStoredVisible = rawVt != null && String(rawVt).trim() !== '';
          const loadedVisible = parseVisibleTabs(rawVt);
          const resolvedVisible = hasStoredVisible
            ? loadedVisible
            : loadedBookletType
              ? presetVisibleTabsForBookletType(loadedBookletType)
              : loadedVisible;
          setVisibleTabIds(orderVisibleTabs(resolvedVisible));
          setBookletTypeId(loadedBookletType);
          const loadedGreeting = String((d as { eventGreeting?: unknown }).eventGreeting ?? '');
          setEventGreeting(loadedGreeting);
          lastSavedGreetingRef.current = JSON.stringify({ eventGreeting: loadedGreeting });
          const loadedApply = String((d as { applyNote?: unknown }).applyNote ?? '');
          setApplyNote(loadedApply);
          lastSavedApplyRef.current = JSON.stringify({ applyNote: loadedApply });
          lastSavedInfoRef.current = JSON.stringify({
            eventName: d.eventName || '',
            eventNameEn: loadedEventNameEn,
            date: d.date || '',
            place: d.place || '',
            superViser: d.superViser || '',
            address: d.address || '',
            placeNaver: d.placeNaver || '',
            placeKakao: d.placeKakao || '',
            quiry: d.quiry || '',
            imageMainName: normalizeImageMainNameForSnapshot(d.imageMainName || d.imageMain || ''),
            hasNewMainImages: false,
            visibleTabs: JSON.stringify(orderVisibleTabs(resolvedVisible)),
          });
        }
      }

      if (programResult.status === 'fulfilled') {
        const programRes = programResult.value;
        let list: ProgramItem[];
        if (programRes.data && Array.isArray(programRes.data) && programRes.data.length > 0) {
          list = programRes.data.map(mapRow);
        } else {
          list = [{ title: '', dateTime: '', showDateTime: true, career: [], careerMode: 'long', postImage: [] }];
        }
        setProgramData(list);
        lastSavedProgramRef.current = JSON.stringify({ programType: loadedProgramType, programData: list });
      }

      const emptyCast: CastItem[] = [{ personName: '', roleName: '', note: '', postImage: '' }];
      if (castResult.status === 'fulfilled') {
        const raw = castResult.value.data;
        let list: CastItem[];
        if (raw && Array.isArray(raw) && raw.length > 0) {
          list = raw.map(
            (r: { personName?: string; roleName?: string; note?: string; postImage?: string; photo?: string }) => ({
              personName: r.personName || '',
              roleName: r.roleName || '',
              note: r.note || '',
              postImage: (r.postImage != null && r.postImage !== '' ? r.postImage : r.photo) || '',
            })
          );
        } else {
          list = emptyCast;
        }
        setCastData(list);
        lastSavedCastRef.current = JSON.stringify(list);
      } else {
        setCastData(emptyCast);
        lastSavedCastRef.current = JSON.stringify(emptyCast);
      }

      const emptyWorship: WorshipItem[] = [{ subTitle: '', title: '', charger: '', notice: '' }];
      if (worshipResult.status === 'fulfilled') {
        const raw = worshipResult.value.data;
        let wlist: WorshipItem[];
        let loadedStyle: EventOrderStyleId = 'worship';
        if (raw && Array.isArray(raw) && raw.length > 0) {
          loadedStyle = parseEventOrderStyleId((raw[0] as { orderStyle?: string }).orderStyle);
          const mapped = raw.map(
            (r: {
              subTitle?: string;
              title?: string;
              charger?: string;
              notice?: string;
              content?: string;
            }) => ({
              subTitle: r.subTitle || '',
              title: r.title || '',
              charger: r.charger || '',
              notice:
                r.notice != null && String(r.notice) !== ''
                  ? String(r.notice)
                  : r.content != null
                    ? String(r.content)
                    : '',
            })
          );
          const withContent = mapped.filter((w) => worshipRowHasContentForEditor(w, loadedStyle));
          wlist = withContent.length > 0 ? withContent : emptyWorship;
        } else {
          wlist = emptyWorship;
        }
        setOrderStyle(loadedStyle);
        setWorshipData(wlist);
        lastSavedWorshipRef.current = JSON.stringify({ worshipData: wlist, orderStyle: loadedStyle });
      } else {
        setOrderStyle('worship');
        setWorshipData(emptyWorship);
        lastSavedWorshipRef.current = JSON.stringify({ worshipData: emptyWorship, orderStyle: 'worship' });
      }
    });
  }, [eventMainId]);

  useEffect(() => {
    if (!visibleTabList.includes(activeTab)) {
      setActiveTab('info');
    }
  }, [visibleTabList, activeTab]);

  useEffect(() => {
    const nextDate =
      dateMode === 'single'
        ? dateStart
        : dateStart && dateEnd
          ? `${dateStart} ~ ${dateEnd}`
          : dateStart || dateEnd || '';
    if (nextDate !== date) {
      setDate(nextDate);
    }
  }, [dateMode, dateStart, dateEnd, date]);

  useEffect(() => {
    if (lastSavedInfoRef.current === null) return;
    const snapshot = JSON.stringify({
      eventName,
      eventNameEn,
      date,
      place,
      superViser,
      address,
      placeNaver,
      placeKakao,
      quiry,
      imageMainName: serializeMainImageNameForDb(mainImages.map((m) => m.serverName ?? '')),
      hasNewMainImages: mainImages.some((m) => !!m.file),
      visibleTabs: JSON.stringify(orderVisibleTabs(visibleTabIds)),
    });
    setDirtyTabs((prev) => (prev.info !== (snapshot !== lastSavedInfoRef.current) ? { ...prev, info: snapshot !== lastSavedInfoRef.current } : prev));
  }, [eventName, eventNameEn, date, place, superViser, address, placeNaver, placeKakao, quiry, mainImages, visibleTabIds]);

  useEffect(() => {
    if (lastSavedProgramRef.current === null) return;
    const snapshot = JSON.stringify({ programType, programData });
    setDirtyTabs((prev) =>
      prev.program !== (snapshot !== lastSavedProgramRef.current)
        ? { ...prev, program: snapshot !== lastSavedProgramRef.current }
        : prev
    );
  }, [programType, programData]);

  useEffect(() => {
    if (lastSavedCastRef.current === null) return;
    const snapshot = JSON.stringify(castData);
    setDirtyTabs((prev) =>
      prev.profile !== (snapshot !== lastSavedCastRef.current)
        ? { ...prev, profile: snapshot !== lastSavedCastRef.current }
        : prev
    );
  }, [castData]);

  useEffect(() => {
    if (lastSavedWorshipRef.current === null) return;
    const snapshot = JSON.stringify({ worshipData, orderStyle });
    setDirtyTabs((prev) =>
      prev.order !== (snapshot !== lastSavedWorshipRef.current)
        ? { ...prev, order: snapshot !== lastSavedWorshipRef.current }
        : prev
    );
  }, [worshipData, orderStyle]);

  useEffect(() => {
    if (lastSavedApplyRef.current === null) return;
    const snapshot = JSON.stringify({ applyNote });
    setDirtyTabs((prev) =>
      prev.apply !== (snapshot !== lastSavedApplyRef.current)
        ? { ...prev, apply: snapshot !== lastSavedApplyRef.current }
        : prev
    );
  }, [applyNote]);

  useEffect(() => {
    if (lastSavedGreetingRef.current === null) return;
    const snapshot = JSON.stringify({ eventGreeting });
    setDirtyTabs((prev) =>
      prev.greeting !== (snapshot !== lastSavedGreetingRef.current)
        ? { ...prev, greeting: snapshot !== lastSavedGreetingRef.current }
        : prev
    );
  }, [eventGreeting]);

  const nextVisibleTab = useCallback(
    (current: EventCreateTabId): EventCreateTabId | null => {
      const idx = visibleTabList.indexOf(current);
      if (idx < 0 || idx >= visibleTabList.length - 1) return null;
      return visibleTabList[idx + 1];
    },
    [visibleTabList]
  );

  const prevVisibleTab = useCallback(
    (current: EventCreateTabId): EventCreateTabId | null => {
      const idx = visibleTabList.indexOf(current);
      if (idx <= 0) return null;
      return visibleTabList[idx - 1];
    },
    [visibleTabList]
  );

  const goToNextTabFrom = (from: EventCreateTabId) => {
    if (dirtyTabs[from]) {
      alert('변경 사항을 저장한 후 탭을 이동해 주세요.');
      return;
    }
    const n = nextVisibleTab(from);
    if (n) setActiveTab(n);
  };

  const goToPrevTabFrom = (from: EventCreateTabId) => {
    if (dirtyTabs[from]) {
      alert('변경 사항을 저장한 후 탭을 이동해 주세요.');
      return;
    }
    const p = prevVisibleTab(from);
    if (p) setActiveTab(p);
  };

  const updateWorshipItem = (index: number, field: keyof WorshipItem, value: string) => {
    setWorshipData((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addWorshipItem = useCallback(() => {
    setWorshipData((prev) => {
      const row: WorshipItem = { subTitle: '', title: '', charger: '', notice: '' };
      if (orderStyle === 'schedule') {
        const opts = buildScheduleDateSelectOptionsFromIntro(dateMode, dateStart, dateEnd);
        const pick = opts.find((o) => o.value);
        if (pick) row.title = pick.value;
      }
      return [...prev, row];
    });
  }, [orderStyle, dateMode, dateStart, dateEnd]);

  const removeWorshipItem = (index: number) => {
    setWorshipData((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  /** 소개 탭 일정 변경 시 일정형 순서 행의 날짜를 허용 범위 안으로 맞춤 */
  useEffect(() => {
    if (orderStyle !== 'schedule') return;
    const allowed = new Set(scheduleDateSelectOptions.map((o) => o.value).filter(Boolean));
    if (allowed.size === 0) return;

    setWorshipData((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        const t = row.title.trim();
        if (!allowed.has(t)) {
          const fallback = Array.from(allowed)[0];
          changed = true;
          return { ...row, title: fallback };
        }
        return row;
      });
      return changed ? next : prev;
    });
  }, [orderStyle, scheduleDateSelectOptions]);

  const handleTabClick = (tabId: EventCreateTabId) => {
    if (tabId === activeTab) return;
    if (dirtyTabs[activeTab]) {
      alert('변경 사항을 저장한 후 탭을 이동해 주세요.');
      return;
    }
    setActiveTab(tabId);
  };

  const openProgramFromIntroPreview = () => {
    if (dirtyTabs.info) {
      alert('변경 사항을 저장한 후 탭을 이동해 주세요.');
      return;
    }
    if (visibleTabList.includes('program')) setActiveTab('program');
  };

  const handleCastImageFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCastImageLoadingIndex(index);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await axios.post(`${MainURL}/bookleteventcreate/uploadCastImage`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (r.data?.filename) {
        setCastData((prev) =>
          prev.map((row, i) => (i === index ? { ...row, postImage: r.data.filename } : row))
        );
      }
    } catch (err) {
      console.error(err);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setCastImageLoadingIndex(null);
    }
  };

  const onCompletePost = (data: { address: string }) => {
    setAddress(data.address);
    setIsViewAddress(false);
  };

  const handleSaveClick = async () => {
    if (saveLoading) return;
    let currentEventMainId = eventMainId;

    try {
      setSaveLoading(true);

      if (activeTab === 'info') {
        const formData = new FormData();
        if (currentEventMainId) formData.append('eventMainId', currentEventMainId);
        if (userAccount) formData.append('userAccount', userAccount);
        if (!currentEventMainId) {
          if (ordererName) formData.append('ordererName', ordererName);
          if (ordererPhone) formData.append('ordererPhone', ordererPhone);
        }
        formData.append('eventName', eventName);
        formData.append('eventNameEn', eventNameEn);
        formData.append('date', date);
        formData.append('place', place);
        formData.append('superViser', superViser);
        formData.append('address', address);
        formData.append('placeNaver', placeNaver);
        formData.append('placeKakao', placeKakao);
        formData.append('quiry', quiry);
        formData.append('visibleTabs', JSON.stringify(orderVisibleTabs(visibleTabIds)));
        formData.append('applyNote', applyNote);
        formData.append('imageMainName', serializeMainImageNameForDb(mainImages.map((m) => m.serverName)));
        for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i++) {
          if (mainImages[i].file) {
            formData.append(`mainImage_${i}`, mainImages[i].file!);
          }
        }
        const saveUrl = currentEventMainId
          ? `${MainURL}/bookleteventcreate/saveIntro?eventMainId=${encodeURIComponent(currentEventMainId)}`
          : `${MainURL}/bookleteventcreate/saveIntro`;
        const saveRes = await axios.post(saveUrl, formData);
        if (saveRes.data?.id) {
          setEventMainId(String(saveRes.data.id));
        }
        let snapMainImages = mainImages;
        if (saveRes.data?.imageMainName != null) {
          const savedNames = parseMainImageNameFromDb(saveRes.data.imageMainName);
          snapMainImages = savedNames.map((serverName) => ({ serverName, file: null, previewUrl: '' }));
          setMainImages(snapMainImages);
        }
        lastSavedInfoRef.current = JSON.stringify({
          eventName,
          eventNameEn,
          date,
          place,
          superViser,
          address,
          placeNaver,
          placeKakao,
          quiry,
          imageMainName: normalizeImageMainNameForSnapshot(saveRes.data?.imageMainName ?? ''),
          hasNewMainImages: false,
          visibleTabs: JSON.stringify(orderVisibleTabs(visibleTabIds)),
        });
        lastSavedApplyRef.current = JSON.stringify({ applyNote });
        setDirtyTabs((prev) => ({ ...prev, info: false, apply: false }));
      } else if (activeTab === 'greeting') {
        if (!currentEventMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        await axios.post(`${MainURL}/bookleteventcreate/saveEventGreeting`, {
          eventMainId: currentEventMainId,
          eventGreeting,
        });
        lastSavedGreetingRef.current = JSON.stringify({ eventGreeting });
        setDirtyTabs((prev) => ({ ...prev, greeting: false }));
      } else if (activeTab === 'program') {
        if (!currentEventMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        let rowsToSave = programData;
        if (programType === 'concert') {
          rowsToSave = await Promise.all(
            programData.map(async (row) => {
              const names = [...(row.postImage || [])];
              const pending = row.postImageFiles || [];
              const flatPos = [...(row.programImagePositions || [])];
              const imgs: string[] = [];
              const posOut: string[] = [];
              let fi = 0;
              for (let i = 0; i < names.length; i++) {
                imgs.push(names[i]);
                posOut.push(flatPos[fi] || '50% 50%');
                fi++;
              }
              for (const f of pending) {
                const fd = new FormData();
                fd.append('file', f);
                const r = await axios.post(`${MainURL}/bookleteventcreate/uploadProgramImage`, fd, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (r.data?.filename) {
                  imgs.push(r.data.filename);
                  posOut.push(flatPos[fi] || '50% 50%');
                }
                fi++;
              }
              return {
                ...row,
                postImage: imgs,
                programImagePositions: posOut,
                postImageFiles: undefined,
                postImageUrls: undefined,
              };
            })
          );
          programData.forEach(revokeProgramRowBlobs);
          setProgramData(rowsToSave);
        }
        await axios.post(
          `${MainURL}/bookleteventcreate/saveProgram?eventMainId=${encodeURIComponent(currentEventMainId)}`,
          {
            programType,
            programData: rowsToSave.map((p) => ({
              subTitle: '',
              title: p.title,
              dateTime: p.dateTime,
              showDateTime: p.showDateTime !== false,
              career: serializeCareerForSave(p),
              postImage: programType === 'worship' ? '[]' : serializeProgramPostImageForSave(p),
            })),
          }
        );
        lastSavedProgramRef.current = JSON.stringify({ programType, programData: rowsToSave });
        setDirtyTabs((prev) => ({ ...prev, program: false }));
        if (programType === 'worship') {
          programData.forEach(revokeProgramRowBlobs);
          setProgramData((prev) =>
            prev.map((p) => ({ ...p, postImageFiles: undefined, postImageUrls: undefined }))
          );
        }
      } else if (activeTab === 'profile') {
        if (!currentEventMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        await axios.post(
          `${MainURL}/bookleteventcreate/saveCast?eventMainId=${encodeURIComponent(currentEventMainId)}`,
          {
            castData: castData.map((c) => ({
              personName: c.personName || '',
              roleName: c.roleName || '',
              note: c.note || '',
              postImage: c.postImage || '',
            })),
          }
        );
        lastSavedCastRef.current = JSON.stringify(castData);
        setDirtyTabs((prev) => ({ ...prev, profile: false }));
      } else if (activeTab === 'order') {
        if (!currentEventMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        await axios.post(`${MainURL}/bookleteventcreate/saveWorship?eventMainId=${encodeURIComponent(currentEventMainId)}`, {
          orderStyle,
          worshipData: worshipData.map((w) => ({
            subTitle: w.subTitle || '',
            title: w.title || '',
            charger: w.charger || '',
            notice: w.notice != null ? String(w.notice) : '',
          })),
        });
        lastSavedWorshipRef.current = JSON.stringify({ worshipData, orderStyle });
        setDirtyTabs((prev) => ({ ...prev, order: false }));
      } else if (activeTab === 'apply') {
        if (!currentEventMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        await axios.post(`${MainURL}/bookleteventcreate/saveApplyNote`, {
          eventMainId: currentEventMainId,
          applyNote,
        });
        lastSavedApplyRef.current = JSON.stringify({ applyNote });
        setDirtyTabs((prev) => ({ ...prev, apply: false }));
      }
    } catch (err: unknown) {
      console.error('저장 실패:', err);
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          '저장에 실패했습니다. 다시 시도해 주세요.'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCompleteClick = async () => {
    // 필수 입력 검증: 행사명·행사 영문명 (NoticeCreate 교회명·교회 영문명과 동일 역할)
    if (!eventName.trim() || !eventNameEn.trim()) {
      alert('행사명과 행사 영문명을 입력해 주세요');
      if (activeTab !== 'info') {
        setActiveTab('info');
      }
      setTimeout(() => {
        eventNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        eventNameInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return;
    }
    if (dirtyTabs[activeTab]) {
      alert('변경 사항을 저장한 후 완료해 주세요.');
      return;
    }
    if (!eventMainId) {
      alert('먼저 저장을 완료해 주세요.');
      return;
    }
    try {
      setSaveLoading(true);
      const res = await axios.post<{
        success: boolean;
        fileName?: string;
        filePath?: string;
        fileUrl?: string;
        eventName?: string;
        eventNameEn?: string;
        message?: string;
      }>(`${MainURL}/bookleteventcreate/generateEventHtml`, {
        eventMainId,
      });
      if (!res.data?.success) {
        alert(res.data?.message || '완료 처리에 실패했습니다.');
        return;
      }
      try {
        await axios.post(`${MainURL}/serviceapply/record`, {
          serviceType: 'bookletEvent',
          orderName: savedOrderMeta.orderTitle.trim() || '행사 전단지 제작',
          userAccount: userAccount || undefined,
          churchName: (res.data?.eventName || eventName).trim() || null,
          ordererName: (savedOrderMeta.ordererName || ordererName).trim() || null,
          ordererPhone: (savedOrderMeta.ordererPhone || ordererPhone).trim() || null,
          amount: null,
          vat: null,
          totalAmount: null,
          paymentStatus: 'completed',
          paymentId: null,
          memo: `eventMainId=${eventMainId}`,
          status: '등록',
        });
      } catch (e) {
        console.error('serviceapply /record (event complete):', e);
      }
      navigate('/service/bookleteventcomplete', {
        state: {
          eventMainId,
          fileName: res.data?.fileName,
          filePath: res.data?.filePath,
          fileUrl: res.data?.fileUrl,
          eventName: res.data?.eventName,
          eventNameEn: res.data?.eventNameEn,
        },
      });
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('행사 완료 HTML 생성 실패:', e);
      alert('완료 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaveLoading(false);
    }
  };

  const updateProgramItem = (index: number, field: keyof ProgramItem, value: string | string[] | boolean) => {
    setProgramData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addProgramItem = () => {
    setProgramData((prev) => [
      ...prev,
      { title: '', dateTime: '', showDateTime: true, career: [], careerMode: 'long', postImage: [] },
    ]);
  };

  const removeProgramItem = (index: number) => {
    setProgramData((prev) => {
      const victim = prev[index];
      if (victim) revokeProgramRowBlobs(victim);
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return [{ title: '', dateTime: '', showDateTime: true, career: [], careerMode: 'long', postImage: [] }];
    });
  };

  const appendProgramPostImages = (index: number, files: FileList | null) => {
    if (!files?.length) return;
    const add = Array.from(files);
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const newUrls = add.map((f) => URL.createObjectURL(f));
        const beforeFlat = (row.postImage?.length || 0) + (row.postImageFiles?.length || 0);
        const padded = [...(row.programImagePositions || [])];
        while (padded.length < beforeFlat) padded.push('50% 50%');
        for (let j = 0; j < add.length; j++) padded.push('50% 50%');
        return {
          ...row,
          postImageFiles: [...(row.postImageFiles || []), ...add],
          postImageUrls: [...(row.postImageUrls || []), ...newUrls],
          programImagePositions: padded,
        };
      })
    );
  };

  const removeServerProgramImage = (index: number, imgIndex: number) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const imgs = [...(row.postImage || [])];
        imgs.splice(imgIndex, 1);
        const pos = [...(row.programImagePositions || [])];
        if (pos.length > imgIndex) pos.splice(imgIndex, 1);
        return { ...row, postImage: imgs, programImagePositions: pos.length ? pos : undefined };
      })
    );
  };

  const removePendingProgramImage = (index: number, fileIndex: number) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const files = [...(row.postImageFiles || [])];
        const urls = [...(row.postImageUrls || [])];
        const u = urls[fileIndex];
        if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
        files.splice(fileIndex, 1);
        urls.splice(fileIndex, 1);
        const flatIdx = (row.postImage?.length || 0) + fileIndex;
        const pos = [...(row.programImagePositions || [])];
        if (pos.length > flatIdx) pos.splice(flatIdx, 1);
        return { ...row, postImageFiles: files, postImageUrls: urls, programImagePositions: pos.length ? pos : undefined };
      })
    );
  };

  const updateProgramImagePosition = (rowIndex: number, flatIndex: number, position: string) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        const n = (row.postImage?.length || 0) + (row.postImageFiles?.length || 0);
        const next = [...(row.programImagePositions || [])];
        while (next.length < n) next.push('50% 50%');
        next[flatIndex] = position;
        return { ...row, programImagePositions: next };
      })
    );
  };

  const setProgramCareerMode = (index: number, mode: CareerInputMode) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (mode === 'list') {
          const lines = row.career && row.career.length > 0 ? [...row.career] : [''];
          return { ...row, careerMode: 'list', career: lines };
        }
        return { ...row, careerMode: 'long' };
      })
    );
  };

  const addCareerListLine = (index: number) => {
    setProgramData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, career: [...(row.career || []), ''] } : row))
    );
  };

  const removeCareerListLine = (index: number, lineIndex: number) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const cur = row.career?.length ? [...row.career] : [''];
        if (cur.length <= 1) return { ...row, career: [''] };
        cur.splice(lineIndex, 1);
        return { ...row, career: cur };
      })
    );
  };

  const updateCareerListLine = (index: number, lineIndex: number, value: string) => {
    setProgramData((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const cur = row.career?.length ? [...row.career] : [''];
        cur[lineIndex] = value;
        return { ...row, career: cur };
      })
    );
  };

  const onMainImageDrop = useCallback(async (slotIndex: number, acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    try {
      setMainImageLoadingSlot(slotIndex);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200 };
      const resizingBlob = await imageCompression(file, options);
      const regex = file.name.replace(/[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g, '').slice(-15);
      const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
      const newFile = new File([resizingBlob], `${dateStr}_${regex}`, { type: file.type });
      const url = URL.createObjectURL(newFile);
      setMainImages((prev) =>
        prev.map((m, i) => {
          if (i !== slotIndex) return m;
          if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(m.previewUrl);
          }
          return { ...m, file: newFile, previewUrl: url };
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setMainImageLoadingSlot(null);
    }
  }, []);

  const clearMainImageSlot = (slotIndex: number) => {
    setMainImages((prev) =>
      prev.map((m, i) => {
        if (i !== slotIndex) return m;
        if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(m.previewUrl);
        }
        return { serverName: '', file: null, previewUrl: '' };
      })
    );
  };

  const DELETE_IMAGE_CONFIRM = '정말 삭제 하시겠습니까?';

  type DeleteEventImageKind = 'mainSlot' | 'program' | 'cast';

  const deletePersistedEventImage = async (payload: {
    kind: DeleteEventImageKind;
    fileName: string;
    slotIndex?: number;
  }) => {
    const res = await axios.post<{ success?: boolean; message?: string }>(
      `${MainURL}/bookleteventcreate/deleteBookletUploadedImage`,
      {
        eventMainId,
        userAccount,
        ...payload,
      }
    );
    return res.data;
  };

  const confirmClearMainImageSlot = async (slotIndex: number) => {
    if (!window.confirm(DELETE_IMAGE_CONFIRM)) return;
    const slot = mainImages[slotIndex];
    const persistedName = (slot?.serverName || '').trim();
    if (eventMainId && userAccount && persistedName) {
      try {
        setMainImageLoadingSlot(slotIndex);
        const data = await deletePersistedEventImage({
          kind: 'mainSlot',
          fileName: persistedName,
          slotIndex,
        });
        if (!data?.success) {
          alert(data?.message || '서버에서 이미지 삭제에 실패했습니다.');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('서버에서 이미지 삭제에 실패했습니다.');
        return;
      } finally {
        setMainImageLoadingSlot(null);
      }
    }
    clearMainImageSlot(slotIndex);
  };

  const confirmRemoveServerProgramImage = async (rowIndex: number, imgIndex: number) => {
    if (!window.confirm(DELETE_IMAGE_CONFIRM)) return;
    const fileName = (programData[rowIndex]?.postImage?.[imgIndex] || '').trim();
    if (eventMainId && userAccount && fileName) {
      try {
        setProgramImageLoading((prev) => ({ ...prev, [`r${rowIndex}`]: true }));
        const data = await deletePersistedEventImage({ kind: 'program', fileName });
        if (!data?.success) {
          alert(data?.message || '서버에서 이미지 삭제에 실패했습니다.');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('서버에서 이미지 삭제에 실패했습니다.');
        return;
      } finally {
        setProgramImageLoading((prev) => ({ ...prev, [`r${rowIndex}`]: false }));
      }
    }
    removeServerProgramImage(rowIndex, imgIndex);
  };

  const confirmRemovePendingProgramImage = async (rowIndex: number, fileIndex: number) => {
    if (!window.confirm(DELETE_IMAGE_CONFIRM)) return;
    removePendingProgramImage(rowIndex, fileIndex);
  };

  const confirmClearCastPostImage = async (castIndex: number) => {
    if (!window.confirm(DELETE_IMAGE_CONFIRM)) return;
    const persisted = (castData[castIndex]?.postImage || '').trim();
    if (eventMainId && userAccount && persisted) {
      try {
        setCastImageLoadingIndex(castIndex);
        const data = await deletePersistedEventImage({ kind: 'cast', fileName: persisted });
        if (!data?.success) {
          alert(data?.message || '서버에서 이미지 삭제에 실패했습니다.');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('서버에서 이미지 삭제에 실패했습니다.');
        return;
      } finally {
        setCastImageLoadingIndex(null);
      }
    }
    setCastData((prev) => prev.map((r, i) => (i === castIndex ? { ...r, postImage: '' } : r)));
  };

  /** 소개 탭의 당일/기간 — 프로그램 행의 시간·일시 라벨에 연동 */
  const programScheduleFieldLabel = dateMode === 'single' ? '시간' : '일시';
  const programSchedulePlaceholder =
    dateMode === 'single' ? '예: 14:00' : '예: 2025-01-15 14:00';

  /** 프로그램 탭 미리보기 — 프로필 탭과 동일 카드(좌 이미지·우 텍스트) */
  const renderProgramPreviewRow = (p: ProgramItem, i: number) => {
    const titleLine = (p.title || '').trim();
    const imgItems = programType === 'concert' ? getProgramRowPreviewImageItems(p) : [];
    const hasDesc = (p.career || []).some((c) => String(c).trim());
    const hasImg = imgItems.length > 0;

    return (
      <div key={`pr-${i}`} className="notice-detail__servers-card template-event-cast__card--editor">
        <div
          className={`notice-detail__servers-card-avatar${hasImg ? ' event-create__preview-program-card-avatar--stack' : ''}`}
          style={hasImg ? undefined : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
        >
          {hasImg ? (
            <div className="event-create__preview-program-card-images">
              {imgItems.map((item, ii) => (
                <img key={ii} src={item.url} alt="" style={{ objectPosition: item.position }} />
              ))}
            </div>
          ) : (
            <FaUser className="notice-detail__servers-card-icon" aria-hidden />
          )}
        </div>
        <div className="notice-detail__servers-card-body">
          <div className="notice-detail__servers-card-row">
            <div className="event-create__preview-program-card-text">
              <h4 className="notice-detail__servers-card-name">{titleLine || '프로그램'}</h4>
              {p.showDateTime !== false ? (
                <p className="notice-detail__servers-card-duty event-create__preview-program-card-schedule">
                  {p.dateTime || '—'}
                </p>
              ) : null}
              {hasDesc ? (
                (p.careerMode || 'long') === 'list' ? (
                  <div className="notice-detail__servers-card-desc template-event-cast__note event-create__preview-program-card-desc-list">
                    {(p.career || []).map((line, li) => (
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
                ) : (
                  <div className="notice-detail__servers-card-desc template-event-cast__note event-create__preview-program-card-desc-long">
                    {(p.career || []).map((line, li) => (
                      <p key={li} className="event-create__preview-program-card-desc-line">
                        {line}
                      </p>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="event-create">
      <div className="event-create__body">
        <div className="event-create__inner">
          <aside className="event-create__preview-wrap">
            <div className="event-create__phone-frame">
              <div className="event-create__phone-notch" />
              <div className="event-create__phone-screen">
                <div
                  className={`event-create__preview${activeTab === 'greeting' ? ' event-create__preview--greeting-tab' : ''}`}
                >
                  <div className="event-create__preview-hero">
                    <MainHeroCarousel
                      fill
                      imageSrcs={mainImageSrcsForPreview(mainImages)}
                      imgClassName="event-create__preview-hero-img"
                      placeholder={
                        <div className="event-create__preview-hero-placeholder">메인 이미지</div>
                      }
                    />
                    <div className="event-create__preview-hero-overlay">
                      <p className="event-create__preview-hero-sub">행사</p>
                      <h1 className="event-create__preview-hero-title">{eventName || '행사명'}</h1>
                    </div>
                  </div>

                  <div className="event-create__tabs-wrap">
                    <div
                      className={`event-create__preview-tabs event-create__preview-tabs--n${visibleTabList.length}`}
                    >
                      {visibleTabList.map((tabId) => {
                        const tab = TAB_DEFS.find((t) => t.id === tabId)!;
                        return (
                          <div
                            key={tab.id}
                            className={`event-create__preview-tab ${activeTab === tab.id ? 'on' : ''}`}
                          >
                            {tab.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="event-create__preview-body">
                    {activeTab === 'info' ? (
                      <>
                        <div className="notice-create__preview-body">
                          <TemplateNotice
                            postData={templateNoticePostData}
                            showFooter={false}
                            program={programData.filter(programRowHasContent).map((p) => ({
                              title: p.title,
                              dateTime: p.dateTime,
                              showDateTime: p.showDateTime,
                            }))}
                            onOpenProgramTab={visibleTabList.includes('program') ? openProgramFromIntroPreview : undefined}
                            programMoreDisabled={dirtyTabs.info || saveLoading}
                          />
                        </div>
                        <div className="notice-create__preview-footer">
                          <p className="notice-create__preview-footer-info">
                            {quiry && `${quiry}`}
                            {quiry && address && ' | '}
                            {address}
                            <br />
                            © {new Date().getFullYear()} {eventName || '행사'} All Rights Reserved.
                          </p>
                        </div>
                      </>
                    ) : activeTab === 'greeting' ? (
                      <div className="event-create__preview-greeting">
                        <TemplateEventGreeting
                          eventGreeting={eventGreeting}
                          dateLine={date}
                          placeLine={place}
                          editorPreview
                          hideBackgroundImage
                        />
                      </div>
                    ) : activeTab === 'program' ? (
                      <div className="event-create__preview-program-tab">
                        {(() => {
                          const rows = programData.filter(programRowHasContent);
                          if (rows.length === 0) {
                            return (
                              <div className="template-event-cast template-event-cast--empty template-event-cast--editor-preview">
                                <p className="template-event-program__empty">프로그램을 입력해 주세요</p>
                              </div>
                            );
                          }
                          return (
                            <div className="template-event-cast template-event-cast--editor-preview">
                              <div className="notice-detail__servers-list template-event-cast__list template-event-cast__list--editor">
                                {rows.map((p, i) => renderProgramPreviewRow(p, i))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : activeTab === 'profile' ? (
                      <div className="event-create__preview-cast">
                        <TemplateEventProfile cast={castData} loading={false} editorPreview />
                      </div>
                    ) : activeTab === 'order' ? (
                      <div className="event-create__preview-worship">
                        <TemplateEventOrder rows={worshipData} loading={false} orderStyle={orderStyle} />
                      </div>
                    ) : activeTab === 'apply' ? (
                      <div className="event-create__preview-apply">
                        <TemplateEventApply note={applyNote} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="event-create__form-wrap">
            <div className="event-create__tab-select event-create__tab-select--readonly" role="region" aria-label="행사 유형별 탭 구성">
              <h3 className="event-create__tab-select-title">행사 유형 · 탭 구성</h3>
              <div className="event-create__tab-select-inner">
                <p className="event-create__tab-select-hint">
                  표시할 탭은 <strong>템플릿 선택</strong>에서 결제 시 포함으로 고른 탭과 같습니다. 바꾸려면 새로 만들기를 진행해 주세요.
                </p>
                {bookletTypeId ? (
                  <p className="event-create__tab-select-booklet-type">
                    저장된 유형:{' '}
                    <strong>
                      {EVENT_BOOKLET_TYPE_DEFS.find((t) => t.id === bookletTypeId)?.title ?? bookletTypeId}
                    </strong>
                  </p>
                ) : null}
                <ul className="event-create__tab-select-readonly-list">
                  {visibleTabList.map((tabId) => (
                    <li key={tabId}>{TAB_DEFS.find((t) => t.id === tabId)?.label ?? tabId}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="event-create__form-tabs">
              {visibleTabList.map((tabId) => {
                const tab = TAB_DEFS.find((t) => t.id === tabId)!;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`event-create__form-tab ${activeTab === tab.id ? 'on' : ''}`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'info' && (
              <>
                <div className="event-create__form-block">
                  <h3 className="event-create__form-block-title">메인 이미지</h3>
                  <p className="event-create__main-images-hint">
                    최대 5장까지 등록할 수 있습니다. 미리보기에서 좌우 화살표 또는 스와이프로 넘겨 보세요.
                  </p>
                  <div className="event-create__main-images-slots">
                    {mainImages.map((slot, i) => {
                      const thumbSrc =
                        slot.previewUrl ||
                        (slot.serverName
                          ? `${MainURL}/images/bookletevent/mainimages/${slot.serverName}`
                          : '');
                      return (
                        <div key={i} className="event-create__main-image-slot">
                          <span className="event-create__main-image-slot-label">{i + 1}</span>
                          {thumbSrc ? (
                            <div className="event-create__main-image-slot-preview">
                              <img src={thumbSrc} alt="" />
                              <button
                                type="button"
                                className="event-create__main-image-slot-remove"
                                onClick={() => void confirmClearMainImageSlot(i)}
                              >
                                삭제
                              </button>
                            </div>
                          ) : (
                            <MainImageSlotDropzone
                              slotIndex={i}
                              onDrop={onMainImageDrop}
                              isLoading={mainImageLoadingSlot === i}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="event-create__form-block">
                  <h3 className="event-create__form-block-title">소개</h3>
                  <div className="event-create__form">
                    <label className="event-create__label">
                      <span className="event-create__label-text">행사명</span>
                      <input
                        ref={eventNameInputRef}
                        type="text"
                        className="event-create__input"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="행사명"
                      />
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">행사 영문명</span>
                      <input
                        type="text"
                        className="event-create__input"
                        value={eventNameEn}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(raw)) {
                            const now = Date.now();
                            if (now - lastEventNameEnAlertRef.current > 500) {
                              lastEventNameEnAlertRef.current = now;
                              alert('영문과 숫자만 입력 가능합니다');
                            }
                          }
                          setEventNameEn(raw.replace(/[^a-zA-Z0-9]/g, ''));
                        }}
                        placeholder="행사 영문·숫자 식별명 (예: SpringRetreat2026)"
                        autoCapitalize="off"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </label>
                    <div
                      className="event-create__name-en-examples"
                      role="group"
                      aria-label="행사 영문명 예시"
                    >
                      <span className="event-create__name-en-examples__lead">예시</span>
                      {EVENT_NAME_EN_EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          className={`event-create__name-en-example-btn${
                            eventNameEn === ex ? ' event-create__name-en-example-btn--on' : ''
                          }`}
                          onClick={() => setEventNameEn(ex)}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                    <p
                      style={{
                        margin: '-4px 0 8px 0',
                        fontSize: '12px',
                        fontWeight: 400,
                        color: '#94a3b8',
                        lineHeight: 1.4,
                      }}
                    >
                      영문과 숫자만 입력 가능합니다 (공백·한글·특수문자 입력 불가). 모바일 행사전단지 링크 주소로 만들어집니다.
                    </p>
                    <label className="event-create__label">
                      <span className="event-create__label-text">날짜</span>
                      <div className="event-create__date-mode-wrap">
                        <div className="event-create__date-mode-row">
                          <label className="event-create__date-mode-option">
                            <input
                              type="checkbox"
                              checked={dateMode === 'single'}
                              onChange={() => setDateMode('single')}
                            />
                            <span>당일</span>
                          </label>
                          <label className="event-create__date-mode-option">
                            <input
                              type="checkbox"
                              checked={dateMode === 'range'}
                              onChange={() => {
                                setDateMode('range');
                                setDateEnd(dateStart);
                              }}
                            />
                            <span>기간</span>
                          </label>
                        </div>
                        {dateMode === 'single' ? (
                          <input
                            type="date"
                            className="event-create__input"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            placeholder="날짜"
                          />
                        ) : (
                          <div className="event-create__date-range-inputs">
                            <input
                              type="date"
                              className="event-create__input"
                              value={dateStart}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDateStart(v);
                                setDateEnd(v);
                              }}
                              placeholder="시작일"
                            />
                            <span className="event-create__date-range-sep">~</span>
                            <input
                              type="date"
                              className="event-create__input"
                              value={dateEnd}
                              onChange={(e) => setDateEnd(e.target.value)}
                              placeholder="종료일"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">장소</span>
                      <input type="text" className="event-create__input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="장소" />
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">주관/주최</span>
                      <input type="text" className="event-create__input" value={superViser} onChange={(e) => setSuperViser(e.target.value)} placeholder="주관/주최" />
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">문의</span>
                      <input type="tel" className="event-create__input" value={quiry} onChange={(e) => setQuiry(e.target.value.replace(/\D/g, ''))} placeholder="전화번호" />
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">주소</span>
                      <div className="event-create__address-field">
                        {isViewAddress && address === '' ? (
                          <div className="event-create__postcode-wrap">
                            <DaumPostcodeEmbed
                              style={{
                                width: '100%',
                                height: '400px',
                                padding: '10px',
                                boxSizing: 'border-box',
                                border: '1px solid #e2e8f0',
                              }}
                              onComplete={onCompletePost}
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="event-create__input"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            onClick={() => setIsViewAddress(true)}
                            placeholder="주소 검색 클릭"
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="event-create__form-block">
                  <h3 className="event-create__form-block-title">오시는길</h3>
                  <div className="event-create__form">
                    <label className="event-create__label">
                      <span className="event-create__label-text">네이버 지도 URL</span>
                      <div className="event-create__input-with-icon">
                        <input type="url" className="event-create__input" value={placeNaver} onChange={(e) => setPlaceNaver(e.target.value)} placeholder="https://map.naver.com/..." />
                        <span
                          className="event-create__form-info-icon"
                          title="네이버 지도 URL 복사 방법"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`${window.location.origin}${navermapnotice}`, '_blank', 'noopener,noreferrer');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
                        >
                          <FaInfoCircle />
                        </span>
                      </div>
                    </label>
                    <label className="event-create__label">
                      <span className="event-create__label-text">카카오 지도 URL</span>
                      <div className="event-create__input-with-icon">
                        <input type="url" className="event-create__input" value={placeKakao} onChange={(e) => setPlaceKakao(e.target.value)} placeholder="https://map.kakao.com/..." />
                        <span
                          className="event-create__form-info-icon"
                          title="카카오 지도 URL 복사 방법"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`${window.location.origin}${kakaomapnotice}`, '_blank', 'noopener,noreferrer');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
                        >
                          <FaInfoCircle />
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="event-create__nav-btns">
                  <button type="button" className="event-create__next-btn" onClick={handleSaveClick} disabled={!dirtyTabs.info || saveLoading}>
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('info') ? (
                    <button
                      type="button"
                      className="event-create__next-tab-btn"
                      onClick={() => goToNextTabFrom('info')}
                      disabled={dirtyTabs.info || saveLoading}
                    >
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {activeTab === 'greeting' && (
              <>
                <div className="event-create__form-block">
                  <label className="event-create__label event-create__label--textarea">
                    <textarea
                      className="event-create__textarea"
                      value={eventGreeting}
                      onChange={(e) => setEventGreeting(e.target.value)}
                      placeholder={'소중한 당신을 초대합니다!\n당신은 참으로 소중한 사람입니다.\n...'}
                      rows={14}
                    />
                  </label>
                </div>
                <div className="event-create__nav-btns event-create__nav-btns--greeting">
                  {prevVisibleTab('greeting') ? (
                    <button
                      type="button"
                      className="event-create__prev-btn"
                      onClick={() => goToPrevTabFrom('greeting')}
                      disabled={dirtyTabs.greeting || saveLoading}
                    >
                      이전
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="event-create__next-btn"
                    onClick={handleSaveClick}
                    disabled={!dirtyTabs.greeting || saveLoading}
                  >
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('greeting') ? (
                    <button
                      type="button"
                      className="event-create__next-tab-btn"
                      onClick={() => goToNextTabFrom('greeting')}
                      disabled={dirtyTabs.greeting || saveLoading}
                    >
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {activeTab === 'program' && (
              <>
                <div className="event-create__form-block event-create__form-block--program-schedule-hint">
                  <div className="event-create__program-section event-create__program-section--schedule">
                    <p className="event-create__program-schedule-hint-text">
                      {dateMode === 'single' ? (
                        <>
                          <strong>당일</strong> 행사
                          {dateStart ? (
                            <span className="event-create__program-schedule-hint-date"> (행사 날짜: {dateStart})</span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <strong>기간</strong> 행사
                          {dateStart && dateEnd ? (
                            <span className="event-create__program-schedule-hint-date">
                              {' '}
                              ({dateStart} ~ {dateEnd})
                            </span>
                          ) : null}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="event-create__form-block event-create__form-block--program-entries">
                  <h3 className="event-create__form-block-title">프로그램</h3>

                  {programData.map((row, index) => (
                    <div key={index} className="event-create__worship-row">
                      <div className="event-create__form">
                        <label className="event-create__label">
                          <span className="event-create__label-text">제목</span>
                          <input type="text" className="event-create__input" value={row.title} onChange={(e) => updateProgramItem(index, 'title', e.target.value)} placeholder="프로그램 제목" />
                        </label>
                        <div className="event-create__program-schedule-field">
                          <label className="event-create__label event-create__label--schedule-combo">
                            <span className="event-create__label-text">{programScheduleFieldLabel}</span>
                            <input
                              type="text"
                              className="event-create__input"
                              value={row.dateTime}
                              onChange={(e) => updateProgramItem(index, 'dateTime', e.target.value)}
                              placeholder={programSchedulePlaceholder}
                              autoComplete="off"
                            />
                          </label>
                          <label className="event-create__program-visibility-toggle">
                            <input
                              type="checkbox"
                              checked={row.showDateTime !== false}
                              onChange={(e) => updateProgramItem(index, 'showDateTime', e.target.checked)}
                            />
                            <span>{row.showDateTime !== false ? '노출' : '비노출'}</span>
                          </label>
                        </div>
                        <label className="event-create__label event-create__label--textarea">
                          <span className="event-create__label-text">설명</span>
                          <div className="event-create__career-desc-stack">
                            <div className="event-create__career-mode" role="radiogroup" aria-label="설명 형식">
                              <label className="event-create__career-mode-option">
                                <input
                                  type="radio"
                                  name={`careerMode-${index}`}
                                  checked={(row.careerMode || 'long') === 'long'}
                                  onChange={() => setProgramCareerMode(index, 'long')}
                                />
                                <span>장문형</span>
                              </label>
                              <label className="event-create__career-mode-option">
                                <input
                                  type="radio"
                                  name={`careerMode-${index}`}
                                  checked={(row.careerMode || 'long') === 'list'}
                                  onChange={() => setProgramCareerMode(index, 'list')}
                                />
                                <span>나열형</span>
                              </label>
                            </div>
                            {(row.careerMode || 'long') === 'long' ? (
                              <textarea
                                className="event-create__textarea"
                                value={(row.career || []).join('\n')}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateProgramItem(index, 'career', v === '' ? [] : v.split('\n'));
                                }}
                                placeholder="설명을 입력하세요. Enter로 줄바꿈할 수 있습니다."
                                rows={4}
                              />
                            ) : (
                              <div className="event-create__program-career-list">
                                {(row.career.length > 0 ? row.career : ['']).map((line, li) => (
                                  <div key={li} className="event-create__program-career-list-row">
                                    <input
                                      type="text"
                                      className="event-create__input"
                                      value={line}
                                      onChange={(e) => updateCareerListLine(index, li, e.target.value)}
                                      placeholder={`항목 ${li + 1}`}
                                      autoComplete="off"
                                    />
                                    <button
                                      type="button"
                                      className="event-create__program-career-list-remove"
                                      onClick={() => removeCareerListLine(index, li)}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))}
                                <button type="button" className="event-create__program-career-list-add" onClick={() => addCareerListLine(index)}>
                                  + 항목 추가
                                </button>
                              </div>
                            )}
                          </div>
                        </label>
                        {programType === 'concert' && (
                        <div className="event-create__program-images">
                            <span className="event-create__label-text">이미지</span>
                            {(() => {
                              const slots = flattenProgramImages(row);
                              return (
                                <div className="event-create__program-images-row">
                                  <div className="event-create__program-images-list">
                                    {slots.map((slot, fi) => {
                                      const src =
                                        slot.kind === 'server'
                                          ? `${MainURL}/images/bookletevent/programimages/${slot.name}`
                                          : slot.url;
                                      const pos = row.programImagePositions?.[fi] || '50% 50%';
                                      return (
                                        <div
                                          key={slot.kind === 'server' ? `srv-${slot.name}-${fi}` : `pend-${fi}-${slot.file.name}`}
                                          className={`event-create__program-image-chip event-create__program-image-chip--pannable${slot.kind === 'pending' ? ' event-create__program-image-chip--pending' : ''}`}
                                        >
                                          <ProgramImagePanThumb
                                            src={src}
                                            objectPosition={pos}
                                            onPositionChange={(next) => updateProgramImagePosition(index, fi, next)}
                                            className="event-create__program-image-pan-wrap"
                                          />
                                          <button
                                            type="button"
                                            className="event-create__program-image-remove"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={() =>
                                              slot.kind === 'server'
                                                ? void confirmRemoveServerProgramImage(index, fi)
                                                : void confirmRemovePendingProgramImage(index, fi - row.postImage.length)
                                            }
                                            aria-label={slot.kind === 'server' ? '이미지 삭제' : '첨부 취소'}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {slots.length > 0 ? (
                                    <p className="event-create__program-images-hint">
                                      첨부된 사진을 드래그하면, 위치가 조정됩니다
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })()}
                            <label className="event-create__program-image-add">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="event-create__program-file-input"
                                onChange={(e) => {
                                  appendProgramPostImages(index, e.target.files);
                                  e.target.value = '';
                                }}
                              />
                              <span className="event-create__program-image-add-label">이미지 추가</span>
                            </label>
                          </div>
                        )}
                        <button type="button" className="event-create__career-remove" onClick={() => removeProgramItem(index)}>삭제</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="event-create__add-worship" onClick={addProgramItem}>+ 프로그램 추가</button>
                </div>

                <div className="event-create__nav-btns event-create__nav-btns--program">
                  {prevVisibleTab('program') ? (
                    <button type="button" className="event-create__prev-btn" onClick={() => goToPrevTabFrom('program')} disabled={dirtyTabs.program || saveLoading}>
                      이전
                    </button>
                  ) : null}
                  <button type="button" className="event-create__next-btn" onClick={handleSaveClick} disabled={!dirtyTabs.program || saveLoading}>
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('program') ? (
                    <button type="button" className="event-create__next-tab-btn" onClick={() => goToNextTabFrom('program')} disabled={dirtyTabs.program || saveLoading}>
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <>
                <div className="event-create__form-block event-create__form-block--cast">
                  <h3 className="event-create__form-block-title">프로필</h3>
                  <p className="event-create__cast-hint">출연자·참석자 등 이름과 역할을 입력하세요.</p>
                  <div className="event-create__cast-rows">
                    {castData.map((row, index) => (
                      <div key={index} className="event-create__cast-row">
                        <label className="event-create__label event-create__label--cast">
                          <span className="event-create__label-text">이름</span>
                          <input
                            type="text"
                            className="event-create__input"
                            value={row.personName}
                            onChange={(e) =>
                              setCastData((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, personName: e.target.value } : r))
                              )
                            }
                            placeholder="이름"
                          />
                        </label>
                        <label className="event-create__label event-create__label--cast">
                          <span className="event-create__label-text">역할·직분</span>
                          <input
                            type="text"
                            className="event-create__input"
                            value={row.roleName}
                            onChange={(e) =>
                              setCastData((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, roleName: e.target.value } : r))
                              )
                            }
                            placeholder="예: 지휘, 소프라노"
                          />
                        </label>
                        <label className="event-create__label event-create__label--cast">
                          <span className="event-create__label-text">비고</span>
                          <textarea
                            className="event-create__input event-create__textarea event-create__textarea--cast"
                            value={row.note}
                            onChange={(e) =>
                              setCastData((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, note: e.target.value } : r))
                              )
                            }
                            placeholder="추가 설명 (선택)"
                            rows={2}
                          />
                        </label>
                        <div className="event-create__cast-image">
                          {row.postImage ? (
                            <div className="event-create__cast-image-preview">
                              <CastPortraitImage fileName={row.postImage} alt="" />
                              <button
                                type="button"
                                className="event-create__cast-image-remove"
                                onClick={() => void confirmClearCastPostImage(index)}
                              >
                                사진 제거
                              </button>
                            </div>
                          ) : null}
                          <label className="event-create__cast-image-add">
                            <input
                              type="file"
                              accept="image/*"
                              className="event-create__cast-file-input"
                              onChange={(e) => handleCastImageFile(index, e)}
                              disabled={castImageLoadingIndex === index}
                            />
                            <span className="event-create__cast-image-add-label">
                              {castImageLoadingIndex === index ? '업로드 중…' : '사진 첨부'}
                            </span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="event-create__cast-remove"
                          onClick={() =>
                            setCastData((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
                          }
                          disabled={castData.length <= 1}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="event-create__add-worship"
                      onClick={() =>
                        setCastData((prev) => [...prev, { personName: '', roleName: '', note: '', postImage: '' }])
                      }
                    >
                      + 프로필 추가
                    </button>
                  </div>
                </div>

                <div className="event-create__nav-btns event-create__nav-btns--cast">
                  {prevVisibleTab('profile') ? (
                    <button type="button" className="event-create__prev-btn" onClick={() => goToPrevTabFrom('profile')} disabled={dirtyTabs.profile || saveLoading}>
                      이전
                    </button>
                  ) : null}
                  <button type="button" className="event-create__next-btn" onClick={handleSaveClick} disabled={!dirtyTabs.profile || saveLoading}>
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('profile') ? (
                    <button type="button" className="event-create__next-tab-btn" onClick={() => goToNextTabFrom('profile')} disabled={dirtyTabs.profile || saveLoading}>
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {activeTab === 'order' && (
              <>
                <div className="event-create__form-block event-create__form-block--worship">
                  <h3 className="event-create__form-block-title">순서</h3>
                  <div className="event-create__order-style-picker" role="group" aria-label="순서 표시 스타일">
                    <p className="event-create__order-style-picker-label">순서 스타일</p>
                    <div className="event-create__order-style-grid">
                      {ORDER_STYLE_UI.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`event-create__order-style-card${orderStyle === opt.id ? ' event-create__order-style-card--selected' : ''}`}
                          onClick={() => setOrderStyle(opt.id)}
                        >
                          <img src={opt.sample} alt="" className="event-create__order-style-card-img" />
                          <span className="event-create__order-style-card-title">{opt.title}</span>
                          <span className="event-create__order-style-card-desc">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="event-create__cast-hint">
                    {orderStyle === 'schedule'
                      ? '날짜는 소개 탭의 행사 일정과 같은 범위에서만 선택할 수 있습니다. 시·분과 내용을 입력하세요.'
                      : orderStyle === 'concert'
                        ? '곡 제목·작곡가(한 줄), 연주자, 가사·설명을 각각 입력하세요. 순서대로 전단지에 표시됩니다.'
                        : '제목·소제목·담당·문구(가사·내용)를 입력하세요. 순서대로 전단지에 표시됩니다.'}
                  </p>
                  {worshipData.map((row, index) => (
                    <div key={index} className="event-create__worship-row">
                      <div className="event-create__form">
                        {orderStyle === 'schedule' ? (
                          <div className="event-create__worship-schedule-row">
                            <div className="event-create__worship-schedule-datetime" role="group" aria-label="일시">
                              <select
                                className="event-create__input event-create__select event-create__worship-schedule-select"
                                value={/^\d{4}-\d{2}-\d{2}$/.test(row.title) ? row.title : ''}
                                onChange={(e) => updateWorshipItem(index, 'title', e.target.value)}
                                aria-label="날짜"
                              >
                                {scheduleDateSelectOptions.map((o) => (
                                  <option key={o.value || 'd-empty'} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="event-create__input event-create__select event-create__worship-schedule-select"
                                value={scheduleHourValue(row.subTitle)}
                                onChange={(e) => updateWorshipItem(index, 'subTitle', e.target.value)}
                                aria-label="시"
                              >
                                {SCHEDULE_HOUR_SELECT_OPTS.map((o) => (
                                  <option key={o.value || 'h-empty'} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="event-create__input event-create__select event-create__worship-schedule-select"
                                value={scheduleMinuteValue(row.charger)}
                                onChange={(e) => updateWorshipItem(index, 'charger', e.target.value)}
                                aria-label="분"
                              >
                                {SCHEDULE_MINUTE_SELECT_OPTS.map((o) => (
                                  <option key={o.value || 'm-empty'} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <input
                              type="text"
                              className="event-create__input event-create__worship-schedule-content-input"
                              value={row.notice}
                              onChange={(e) => updateWorshipItem(index, 'notice', e.target.value)}
                              placeholder="내용"
                              maxLength={500}
                              aria-label="내용"
                            />
                          </div>
                        ) : orderStyle === 'concert' ? (
                          <div className="event-create__worship-concert-stack">
                            <div className="event-create__worship-concert-line event-create__worship-concert-line--pair">
                              <input
                                type="text"
                                className="event-create__input"
                                value={row.title}
                                onChange={(e) => updateWorshipItem(index, 'title', e.target.value)}
                                placeholder="곡 제목"
                                maxLength={100}
                                aria-label="곡 제목"
                              />
                              <span className="event-create__worship-concert-dash" aria-hidden>
                                -
                              </span>
                              <input
                                type="text"
                                className="event-create__input"
                                value={row.subTitle}
                                onChange={(e) => updateWorshipItem(index, 'subTitle', e.target.value)}
                                placeholder="작곡가"
                                maxLength={100}
                                aria-label="작곡가"
                              />
                            </div>
                            <div className="event-create__worship-concert-line">
                              <input
                                type="text"
                                className="event-create__input"
                                value={row.charger}
                                onChange={(e) => updateWorshipItem(index, 'charger', e.target.value)}
                                placeholder="연주자"
                                maxLength={100}
                                aria-label="연주자"
                              />
                            </div>
                            <div className="event-create__worship-concert-line">
                              <input
                                type="text"
                                className="event-create__input"
                                value={row.notice}
                                onChange={(e) => updateWorshipItem(index, 'notice', e.target.value)}
                                placeholder="가사·설명"
                                maxLength={500}
                                aria-label="가사·설명"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="event-create__worship-fields-row">
                              <label className="event-create__label event-create__label--cast event-create__label--worship-field-only">
                                <input
                                  type="text"
                                  className="event-create__input"
                                  value={row.title}
                                  onChange={(e) => updateWorshipItem(index, 'title', e.target.value)}
                                  placeholder="제목"
                                  maxLength={100}
                                  aria-label="제목"
                                />
                              </label>
                              <label className="event-create__label event-create__label--cast event-create__label--worship-field-only">
                                <input
                                  type="text"
                                  className="event-create__input"
                                  value={row.subTitle}
                                  onChange={(e) => updateWorshipItem(index, 'subTitle', e.target.value)}
                                  placeholder="소제목 (선택)"
                                  maxLength={100}
                                  aria-label="소제목"
                                />
                              </label>
                              <label className="event-create__label event-create__label--cast event-create__label--worship-field-only">
                                <input
                                  type="text"
                                  className="event-create__input"
                                  value={row.charger}
                                  onChange={(e) => updateWorshipItem(index, 'charger', e.target.value)}
                                  placeholder="담당 (선택)"
                                  maxLength={100}
                                  aria-label="담당"
                                />
                              </label>
                            </div>
                            <label className="event-create__label event-create__label--cast event-create__label--textarea event-create__label--worship-field-only">
                              <textarea
                                className="event-create__textarea"
                                value={row.notice}
                                onChange={(e) => updateWorshipItem(index, 'notice', e.target.value)}
                                placeholder="가사·내용 (선택)"
                                rows={3}
                                aria-label="문구(가사·내용)"
                              />
                            </label>
                          </>
                        )}
                        <button type="button" className="event-create__career-remove" onClick={() => removeWorshipItem(index)} disabled={worshipData.length <= 1}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="event-create__add-worship" onClick={addWorshipItem}>
                    + 항목 추가
                  </button>
                </div>

                <div className="event-create__nav-btns event-create__nav-btns--worship">
                  {prevVisibleTab('order') ? (
                    <button type="button" className="event-create__prev-btn" onClick={() => goToPrevTabFrom('order')} disabled={dirtyTabs.order || saveLoading}>
                      이전
                    </button>
                  ) : null}
                  <button type="button" className="event-create__next-btn" onClick={handleSaveClick} disabled={!dirtyTabs.order || saveLoading}>
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('order') ? (
                    <button type="button" className="event-create__next-tab-btn" onClick={() => goToNextTabFrom('order')} disabled={dirtyTabs.order || saveLoading}>
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            {activeTab === 'apply' && (
              <>
                <div className="event-create__form-block">
                  <h3 className="event-create__form-block-title">신청 안내</h3>
                  <p className="event-create__cast-hint">
                    참가 신청 안내 문구를 입력하세요. 공개 전단지 「신청하기」 탭에 표시됩니다.
                  </p>
                  <label className="event-create__label event-create__label--textarea">
                    <span className="event-create__label-text">안내 문구</span>
                    <textarea
                      className="event-create__textarea"
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      placeholder="예: 아래 버튼을 눌러 신청서를 작성해 주세요. 선착순 마감 시 조기 종료될 수 있습니다."
                      rows={8}
                    />
                  </label>
                </div>
                <div className="event-create__nav-btns event-create__nav-btns--apply">
                  {prevVisibleTab('apply') ? (
                    <button type="button" className="event-create__prev-btn" onClick={() => goToPrevTabFrom('apply')} disabled={dirtyTabs.apply || saveLoading}>
                      이전
                    </button>
                  ) : null}
                  <button type="button" className="event-create__next-btn" onClick={handleSaveClick} disabled={!dirtyTabs.apply || saveLoading}>
                    {saveLoading ? '저장 중...' : '저장'}
                  </button>
                  {nextVisibleTab('apply') ? (
                    <button type="button" className="event-create__next-tab-btn" onClick={() => goToNextTabFrom('apply')} disabled={dirtyTabs.apply || saveLoading}>
                      다음
                    </button>
                  ) : null}
                </div>
              </>
            )}

            <div className="event-create__complete-wrap">
              <button
                type="button"
                className="event-create__complete-btn"
                onClick={handleCompleteClick}
                disabled={dirtyTabs[activeTab] || saveLoading}
              >
                {saveLoading ? '처리 중...' : '완료'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
