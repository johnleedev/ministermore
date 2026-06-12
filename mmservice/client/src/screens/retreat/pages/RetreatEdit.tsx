import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { KakaoAddressFields } from '../../../components/KakaoAddressFields';
import { useKakaoAddress } from '../../../lib/useKakaoAddress';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaUser } from 'react-icons/fa';
import { recoilRetreatAuth } from '../../../RecoilStore';
import type { RetreatAuthParams } from '../../../api/retreatApi';
import MainURL from '../../../MainURL';
import {
  fetchRetreatDetail,
  fetchRetreatRequestMain,
  saveRetreatInfo,
  saveRetreatPrograms,
  saveRetreatRequestMain,
} from '../../../api/retreatApi';
import MainHeroCarousel from '../../../exceptbooklets/component/MainHeroCarousel';
import {
  MAIN_IMAGE_SLOT_COUNT,
  normalizeImageMainNameForSnapshot,
  parseMainImageNameFromDb,
  serializeMainImageNameForDb,
} from '../../../exceptbooklets/component/mainImageNames';
import TemplateNotice from '../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateNotice';
import TemplateEventGreeting from '../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventGreeting';
import TemplateEventOrder, {
  type EventOrderItem,
} from '../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventOrder';
import RetreatApplyForm from '../components/RetreatApplyForm';
import RetreatRequestFormBuilder from '../components/RetreatRequestFormBuilder';
import type { RetreatCustomQuestion } from '../lib/retreatRequestForm';
import type { EventOrderStyleId } from '../../service/bookletEvent/createEvent/eventTemplateTypes';
import navermapnotice from '../../../images/booklet/navermapnotice.jpg';
import kakaomapnotice from '../../../images/booklet/kakaomapnotice.jpg';
import type { RetreatInfoForm, RetreatProgramRow } from '../lib/types';
import {
  createEmptyProgramRow,
  mapInfoToForm,
  normalizeProgramRow,
} from '../lib/retreatFormDefaults';
import {
  addProgramsOrderDayBox,
  addProgramsOrderDayRow,
  ensureOrderDateKeysOnPrograms,
  groupProgramsByOrderDay,
  isOrderDayDateComplete,
  patchProgramsOrderDayDate,
  removeProgramsOrderDayBox,
  removeProgramsOrderDayRow,
  updateProgramsOrderDayRow,
} from '../lib/retreatOrderSchedule';
import {
  nextRetreatTab,
  parseRetreatVisibleTabs,
  prevRetreatTab,
  retreatEditorTabLabel,
  retreatEditorTabStep,
  retreatTabLabel,
  type RetreatEditTabId,
} from '../lib/retreatEditTabs';
import '../../service/bookletNotice/createNotice/NoticeCreate.scss';
import '../components/RetreatApplyForm.scss';
import './RetreatEdit.scss';

const RETREAT_MAIN_IMAGE_URL = `${MainURL}/images/retreat`;
const ORDER_FORM_MIN_ROWS = 1;

type YmdParts = { y: string; m: string; d: string };

type RetreatDateValue = {
  mode: 'single' | 'range';
  start: YmdParts;
  end: YmdParts;
};

const EMPTY_YMD: YmdParts = { y: '', m: '', d: '' };

const RETREAT_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0'),
);

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

const ORDER_HOUR_SELECT_OPTS = [
  { value: '', label: '시' },
  ...Array.from({ length: 24 }, (_, i) => {
    const v = pad2(i);
    return { value: v, label: v };
  }),
];

const ORDER_MINUTE_SELECT_OPTS = [
  { value: '', label: '분' },
  ...Array.from({ length: 60 }, (_, i) => {
    const v = pad2(i);
    return { value: v, label: v };
  }),
];

type OrderTimeRange = {
  startH: string;
  startM: string;
  endH: string;
  endM: string;
};

const EMPTY_ORDER_TIME: OrderTimeRange = {
  startH: '',
  startM: '',
  endH: '',
  endM: '',
};

function normalizeOrderTimePart(raw: string, max: number): string {
  const t = String(raw || '').trim();
  if (!t) return '';
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return '';
  return pad2(Math.max(0, Math.min(max, n)));
}

function parseOrderTimeRange(raw: string): OrderTimeRange {
  const value = String(raw || '').trim();
  if (!value) return { ...EMPTY_ORDER_TIME };

  const rangeMatch = value.match(/^(\d{1,2})(?::(\d{1,2}))?\s*[~\-–]\s*(\d{1,2})(?::(\d{1,2}))?$/);
  if (rangeMatch) {
    return {
      startH: normalizeOrderTimePart(rangeMatch[1], 23),
      startM: normalizeOrderTimePart(rangeMatch[2] || '0', 59),
      endH: normalizeOrderTimePart(rangeMatch[3], 23),
      endM: normalizeOrderTimePart(rangeMatch[4] || '0', 59),
    };
  }

  const singleMatch = value.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (singleMatch) {
    return {
      startH: normalizeOrderTimePart(singleMatch[1], 23),
      startM: normalizeOrderTimePart(singleMatch[2] || '0', 59),
      endH: '',
      endM: '',
    };
  }

  return { ...EMPTY_ORDER_TIME };
}

function serializeOrderTimeRange(parts: OrderTimeRange): string {
  const startStr =
    parts.startH && parts.startM
      ? `${parts.startH}:${parts.startM}`
      : parts.startH
        ? `${parts.startH}:00`
        : '';
  const endStr =
    parts.endH && parts.endM
      ? `${parts.endH}:${parts.endM}`
      : parts.endH
        ? `${parts.endH}:00`
        : '';
  if (startStr && endStr) return `${startStr} ~ ${endStr}`;
  return startStr || endStr;
}

/** BoardPost 패턴 + 맨 끝 초(2자리)로 파일명 중복 방지 */
function buildRetreatMainImageFileName(
  file: File,
  userAccount: string,
  _slotIndex: number,
): string {
  const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
  const userIdCopy = userAccount?.slice(0, 5) || 'user';
  const now = new Date();
  const datePart = [
    pad2(now.getFullYear() % 100),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
  ].join('');
  const secondPart = pad2(now.getSeconds());
  const extMatch = file.name.match(/\.([^.]+)$/i);
  const ext = (extMatch?.[1] || file.type.split('/')[1] || 'jpg').toLowerCase();
  const sanitized = file.name.replace(regexCopy, '').replace(/\.[^.]+$/i, '');
  const nameSlice = sanitized.slice(-15) || 'image';
  return `${datePart}${userIdCopy}_${nameSlice}${secondPart}.${ext}`;
}

function daysInMonth(y: string, m: string): number {
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  if (!Number.isFinite(yi) || !Number.isFinite(mi) || mi < 1 || mi > 12) return 31;
  return new Date(yi, mi, 0).getDate();
}

function parseYmdToken(token: string, defaultYear?: string): YmdParts | null {
  const t = token.trim();
  if (!t) return null;
  const full = t.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
  if (full) {
    return { y: full[1], m: pad2(full[2]), d: pad2(full[3]) };
  }
  const ym = t.match(/^(\d{4})[-.](\d{1,2})$/);
  if (ym) {
    return { y: ym[1], m: pad2(ym[2]), d: '' };
  }
  const yOnly = t.match(/^(\d{4})$/);
  if (yOnly) {
    return { y: yOnly[1], m: '', d: '' };
  }
  const short = t.match(/^(\d{1,2})[-.](\d{1,2})$/);
  if (short && defaultYear) {
    return { y: defaultYear, m: pad2(short[1]), d: pad2(short[2]) };
  }
  return null;
}

function serializeYmdParts(parts: YmdParts): string {
  if (!parts.y && !parts.m && !parts.d) return '';
  if (parts.y && parts.m && parts.d) return `${parts.y}-${parts.m}-${parts.d}`;
  if (parts.y && parts.m) return `${parts.y}-${parts.m}`;
  if (parts.y) return parts.y;
  return '';
}

function parseRetreatDate(raw: string): RetreatDateValue {
  const value = (raw || '').trim();
  if (!value) {
    return { mode: 'single', start: { ...EMPTY_YMD }, end: { ...EMPTY_YMD } };
  }
  if (value.includes('~')) {
    const [startRaw, endRaw] = value.split('~');
    const start = parseYmdToken(startRaw.trim()) || { ...EMPTY_YMD };
    const end = parseYmdToken(endRaw.trim(), start.y) || { ...EMPTY_YMD };
    return { mode: 'range', start, end };
  }
  const start = parseYmdToken(value) || { ...EMPTY_YMD };
  return { mode: 'single', start, end: { ...EMPTY_YMD } };
}

function serializeRetreatDate(value: RetreatDateValue): string {
  const { start, end, mode } = value;
  const startStr = serializeYmdParts(start);
  if (!startStr) return '';
  if (mode === 'single') return startStr;
  const endStr = serializeYmdParts(end);
  if (!endStr) return startStr;
  return `${startStr} ~ ${endStr}`;
}

function normalizeYmdParts(parts: YmdParts): YmdParts {
  if (!parts.y || !parts.m || !parts.d) return parts;
  const maxDay = daysInMonth(parts.y, parts.m);
  const dayNum = parseInt(parts.d, 10);
  if (!Number.isFinite(dayNum) || dayNum <= maxDay) return parts;
  return { ...parts, d: pad2(maxDay) };
}

function buildRetreatYearOptions(...extraYears: string[]): string[] {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now - 2; y <= now + 12; y += 1) years.push(y);
  extraYears.forEach((raw) => {
    const y = parseInt(raw, 10);
    if (Number.isFinite(y) && y > 1900 && y < 2100 && !years.includes(y)) years.push(y);
  });
  return years.sort((a, b) => b - a).map(String);
}

function programRowHasContent(row: RetreatProgramRow): boolean {
  return !!(
    row.title.trim()
    || row.subTitle.trim()
    || row.dateTime.trim()
    || row.career.trim()
  );
}

function careerLines(career: string): string[] {
  return career
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function programsToOrderRows(rows: RetreatProgramRow[]): EventOrderItem[] {
  return rows.map((row, index) => ({
    showOrder: row.showOrder || String(index),
    subTitle: row.subTitle,
    title: row.title,
    charger: row.dateTime,
    notice: row.career,
  }));
}

type DirtyMap = Record<RetreatEditTabId, boolean>;

function emptyDirtyMap(tabs: RetreatEditTabId[]): DirtyMap {
  return Object.fromEntries(tabs.map((t) => [t, false])) as DirtyMap;
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

function mainImageSlotHasContent(slot: MainImageSlot): boolean {
  return Boolean(slot.file || slot.previewUrl || slot.serverName.trim());
}

function mainImageThumbSrc(slot: MainImageSlot): string {
  if (slot.previewUrl) return slot.previewUrl;
  if (slot.serverName.trim()) {
    return `${RETREAT_MAIN_IMAGE_URL}/${slot.serverName.trim()}`;
  }
  return '';
}

function mainImageSrcsForPreview(slots: MainImageSlot[]): string[] {
  return slots
    .filter(mainImageSlotHasContent)
    .map((m) => mainImageThumbSrc(m))
    .filter(Boolean);
}

function mainImagesSnapshot(slots: MainImageSlot[]): string {
  return JSON.stringify({
    names: normalizeImageMainNameForSnapshot(
      serializeMainImageNameForDb(slots.map((m) => m.serverName ?? '')),
    ),
    pending: slots.map((m) => !!m.file),
  });
}

function MainImageSlotDropzone({
  slotIndex,
  onDrop,
  isLoading,
  maxFiles = 1,
}: {
  slotIndex: number;
  onDrop: (slotIndex: number, files: File[]) => void;
  isLoading: boolean;
  maxFiles?: number;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files.length && onDrop(slotIndex, files),
    accept: { 'image/*': [] },
    maxFiles,
    multiple: maxFiles > 1,
    disabled: isLoading,
  });

  return (
    <div {...getRootProps()} className="retreat-edit__image-dropzone">
      <input {...getInputProps()} />
      {isLoading
        ? '처리 중...'
        : maxFiles > 1
          ? `이미지 선택 (최대 ${maxFiles}장)`
          : '이미지 선택'}
    </div>
  );
}

function MainImageThumb({
  src,
  onBroken,
}: {
  src: string;
  onBroken: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt=""
      className="retreat-edit__image-thumb"
      onError={() => {
        setFailed(true);
        onBroken();
      }}
    />
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RetreatOrderTimeRangeSelect({
  value,
  onChange,
  idPrefix,
}: {
  value: string;
  onChange: (next: string) => void;
  idPrefix: string;
}) {
  const parts = parseOrderTimeRange(value);

  const patch = (next: Partial<OrderTimeRange>) => {
    onChange(serializeOrderTimeRange({ ...parts, ...next }));
  };

  return (
    <div className="retreat-edit__order-time-range">
      <select
        id={`${idPrefix}-start-hour`}
        className="retreat-edit__order-time-select"
        value={parts.startH}
        onChange={(e) => patch({ startH: e.target.value })}
        aria-label="시작 시"
      >
        {ORDER_HOUR_SELECT_OPTS.map((o) => (
          <option key={`sh-${o.value || 'empty'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-start-minute`}
        className="retreat-edit__order-time-select"
        value={parts.startM}
        onChange={(e) => patch({ startM: e.target.value })}
        aria-label="시작 분"
      >
        {ORDER_MINUTE_SELECT_OPTS.map((o) => (
          <option key={`sm-${o.value || 'empty'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="retreat-edit__order-time-sep" aria-hidden>
        ~
      </span>
      <select
        id={`${idPrefix}-end-hour`}
        className="retreat-edit__order-time-select"
        value={parts.endH}
        onChange={(e) => patch({ endH: e.target.value })}
        aria-label="종료 시"
      >
        {ORDER_HOUR_SELECT_OPTS.map((o) => (
          <option key={`eh-${o.value || 'empty'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-end-minute`}
        className="retreat-edit__order-time-select"
        value={parts.endM}
        onChange={(e) => patch({ endM: e.target.value })}
        aria-label="종료 분"
      >
        {ORDER_MINUTE_SELECT_OPTS.map((o) => (
          <option key={`em-${o.value || 'empty'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RetreatYmdSelectRow({
  parts,
  onChange,
  idPrefix,
  yearOptions,
}: {
  parts: YmdParts;
  onChange: (patch: Partial<YmdParts>) => void;
  idPrefix: string;
  yearOptions: string[];
}) {
  const dayCount = daysInMonth(parts.y, parts.m);
  const dayOptions = Array.from({ length: dayCount }, (_, i) => pad2(i + 1));

  return (
    <div className="retreat-edit__date-ymd-row">
      <select
        id={`${idPrefix}-year`}
        className="retreat-edit__select"
        value={parts.y}
        onChange={(e) => onChange({ y: e.target.value })}
        aria-label="년"
      >
        <option value=""></option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-month`}
        className="retreat-edit__select"
        value={parts.m}
        onChange={(e) => onChange({ m: e.target.value })}
        aria-label="월"
      >
        <option value=""></option>
        {RETREAT_MONTH_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {Number(m)}월
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-day`}
        className="retreat-edit__select"
        value={parts.d}
        onChange={(e) => onChange({ d: e.target.value })}
        aria-label="일"
      >
        <option value=""></option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {Number(d)}일
          </option>
        ))}
      </select>
    </div>
  );
}

export default function RetreatEdit() {
  const navigate = useNavigate();
  const { bookletId: bookletIdParam } = useParams();
  const bookletId = parseInt(String(bookletIdParam), 10);
  const retreatAuth = useRecoilValue(recoilRetreatAuth);
  const auth: RetreatAuthParams = {
    churchName: retreatAuth.churchName,
    passwd: retreatAuth.passwd,
    ownerpw: retreatAuth.ownerpw,
  };
  const churchSlug = retreatAuth.churchName?.trim() || 'church';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState('');
  const [info, setInfo] = useState<RetreatInfoForm>(mapInfoToForm(null));
  const [programs, setPrograms] = useState<RetreatProgramRow[]>([createEmptyProgramRow(0)]);
  const [activeTab, setActiveTab] = useState<RetreatEditTabId>('info');
  const [mainImages, setMainImages] = useState<MainImageSlot[]>(emptyMainImageSlots);
  const [mainImageLoadingSlot, setMainImageLoadingSlot] = useState<number | null>(null);
  const [customQuestions, setCustomQuestions] = useState<RetreatCustomQuestion[]>([]);

  const infoBaselineRef = useRef<RetreatInfoForm>(mapInfoToForm(null));
  const customQuestionsBaselineRef = useRef<RetreatCustomQuestion[]>([]);
  const programsBaselineRef = useRef<RetreatProgramRow[]>([createEmptyProgramRow(0)]);
  const mainImagesBaselineRef = useRef(mainImagesSnapshot(emptyMainImageSlots()));
  const lastEventNameEnAlertRef = useRef(0);

  const visibleTabList = useMemo(
    () => parseRetreatVisibleTabs(info.visibleTabs),
    [info.visibleTabs],
  );

  const orderStyle: EventOrderStyleId = 'retreat';

  const [dirtyTabs, setDirtyTabs] = useState<DirtyMap>(() => emptyDirtyMap(visibleTabList));

  const isDirty = dirtyTabs[activeTab];
  const nextTab = nextRetreatTab(visibleTabList, activeTab);
  const prevTab = prevRetreatTab(visibleTabList, activeTab);
  const displayTitle = info.eventName || orderTitle || '수련회 전단지';

  const previewMainImages = useMemo(
    () => mainImageSrcsForPreview(mainImages),
    [mainImages],
  );
  const hasMainImage = previewMainImages.length > 0;

  const filledMainImageSlots = useMemo(
    () =>
      mainImages
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => mainImageSlotHasContent(slot)),
    [mainImages],
  );
  const nextEmptyMainImageSlotIndex = useMemo(
    () => mainImages.findIndex((slot) => !mainImageSlotHasContent(slot)),
    [mainImages],
  );
  const emptyMainImageSlotCount = useMemo(
    () => mainImages.filter((slot) => !mainImageSlotHasContent(slot)).length,
    [mainImages],
  );

  useEffect(() => {
    setDirtyTabs(emptyDirtyMap(visibleTabList));
    if (!visibleTabList.includes(activeTab)) {
      setActiveTab(visibleTabList[0] ?? 'info');
    }
  }, [visibleTabList, activeTab]);

  const recomputeDirty = useCallback(
    (
      nextInfo: RetreatInfoForm,
      nextPrograms: RetreatProgramRow[],
      nextMainImages: MainImageSlot[],
      nextCustomQuestions: RetreatCustomQuestion[] = customQuestions,
    ) => {
      const baseInfo = infoBaselineRef.current;
      const basePrograms = programsBaselineRef.current;
      const infoDirty =
        JSON.stringify(nextInfo) !== JSON.stringify(baseInfo)
        || mainImagesSnapshot(nextMainImages) !== mainImagesBaselineRef.current;
      const programsDirty = JSON.stringify(nextPrograms) !== JSON.stringify(basePrograms);
      const applyQuestionsDirty =
        JSON.stringify(nextCustomQuestions) !== JSON.stringify(customQuestionsBaselineRef.current);

      setDirtyTabs({
        info: infoDirty,
        greeting: infoDirty,
        apply: infoDirty || applyQuestionsDirty,
        program: programsDirty,
        order: programsDirty,
      });
    },
    [customQuestions],
  );

  const kakaoAddress = useKakaoAddress({
    onRegion: (location) => {
      setInfo((prev) => {
        const next = { ...prev, place: location };
        recomputeDirty(next, programs, mainImages);
        return next;
      });
    },
  });

  useEffect(() => {
    if (!bookletId || !retreatAuth.loggedIn || !auth.churchName || !auth.passwd) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchRetreatDetail(bookletId, auth),
      fetchRetreatRequestMain(bookletId).catch(() => []),
    ])
      .then(([detail, loadedQuestions]) => {
        if (cancelled) return;
        const mappedInfo = mapInfoToForm(detail.info);
        const fallbackDate = parseRetreatDate(mappedInfo.date).start;
        const mappedPrograms = ensureOrderDateKeysOnPrograms(
          detail.programs?.length
            ? detail.programs.map((p) => normalizeProgramRow(p))
            : [createEmptyProgramRow(0)],
          fallbackDate,
        );
        const tabs = parseRetreatVisibleTabs(mappedInfo.visibleTabs);
        const loadedMainNames = parseMainImageNameFromDb(mappedInfo.imageMain);
        const loadedMainImages = loadedMainNames.map((serverName) => ({
          serverName,
          file: null,
          previewUrl: '',
        }));

        const mappedQuestions = loadedQuestions.map((question) => ({ ...question }));

        setOrderTitle(detail.main?.orderTitle || '');
        setInfo(mappedInfo);
        kakaoAddress.resetFromSaved(mappedInfo.address);
        setPrograms(mappedPrograms);
        setCustomQuestions(mappedQuestions);
        setMainImages(loadedMainImages);
        setActiveTab(tabs[0] ?? 'info');
        infoBaselineRef.current = mappedInfo;
        customQuestionsBaselineRef.current = mappedQuestions.map((question) => ({ ...question }));
        programsBaselineRef.current = mappedPrograms;
        mainImagesBaselineRef.current = mainImagesSnapshot(loadedMainImages);
        setDirtyTabs(emptyDirtyMap(tabs));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookletId, retreatAuth.loggedIn, auth.churchName, auth.passwd, auth.ownerpw]);

  const updateInfo = (key: keyof RetreatInfoForm, value: string) => {
    setInfo((prev) => {
      const next = { ...prev, [key]: value };
      recomputeDirty(next, programs, mainImages);
      return next;
    });
  };

  const retreatDateValue = useMemo(() => parseRetreatDate(info.date), [info.date]);

  const retreatYearOptions = useMemo(
    () => buildRetreatYearOptions(retreatDateValue.start.y, retreatDateValue.end.y),
    [retreatDateValue.start.y, retreatDateValue.end.y],
  );

  const applyRetreatDate = (next: RetreatDateValue) => {
    updateInfo('date', serializeRetreatDate(next));
  };

  const patchRetreatDateStart = (patch: Partial<YmdParts>) => {
    const nextStart = normalizeYmdParts({ ...retreatDateValue.start, ...patch });
    applyRetreatDate({ ...retreatDateValue, start: nextStart });
  };

  const patchRetreatDateEnd = (patch: Partial<YmdParts>) => {
    const nextEnd = normalizeYmdParts({ ...retreatDateValue.end, ...patch });
    applyRetreatDate({ ...retreatDateValue, end: nextEnd });
  };

  const orderDayGroups = useMemo(
    () => groupProgramsByOrderDay(programs, retreatDateValue.start),
    [programs, retreatDateValue.start],
  );

  const canAddOrderDayBox = useMemo(
    () => orderDayGroups.every((group) => isOrderDayDateComplete(group.dateParts)),
    [orderDayGroups],
  );

  const patchOrderDayDate = (dayIndex: number, patch: Partial<YmdParts>) => {
    setPrograms((prev) => {
      const next = patchProgramsOrderDayDate(prev, dayIndex, patch, retreatDateValue.start);
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const addOrderDayBox = () => {
    setPrograms((prev) => {
      const next = addProgramsOrderDayBox(prev, retreatDateValue.start, createEmptyProgramRow);
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const removeOrderDayBox = (dayIndex: number) => {
    setPrograms((prev) => {
      const next = removeProgramsOrderDayBox(
        prev,
        dayIndex,
        retreatDateValue.start,
        createEmptyProgramRow,
      );
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const updateProgram = (index: number, key: keyof RetreatProgramRow, value: string | boolean) => {
    setPrograms((prev) => {
      const next = prev.map((row, i) => (i === index ? { ...row, [key]: value } : row));
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const addProgram = () => {
    setPrograms((prev) => {
      const next = [...prev, createEmptyProgramRow(prev.length)];
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const removeProgram = (index: number) => {
    setPrograms((prev) => {
      const next = prev.length > 1 ? prev.filter((_, i) => i !== index) : prev;
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const updateOrderProgramInDay = (
    dayIndex: number,
    localRowIndex: number,
    key: 'subTitle' | 'title' | 'dateTime' | 'career',
    value: string,
  ) => {
    setPrograms((prev) => {
      const next = updateProgramsOrderDayRow(
        prev,
        dayIndex,
        localRowIndex,
        key,
        value,
        retreatDateValue.start,
        createEmptyProgramRow,
      );
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const addOrderProgramToDay = (dayIndex: number) => {
    setPrograms((prev) => {
      const next = addProgramsOrderDayRow(
        prev,
        dayIndex,
        retreatDateValue.start,
        createEmptyProgramRow,
      );
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const removeOrderProgramFromDay = (dayIndex: number, localRowIndex: number) => {
    setPrograms((prev) => {
      const next = removeProgramsOrderDayRow(
        prev,
        dayIndex,
        localRowIndex,
        retreatDateValue.start,
      );
      recomputeDirty(info, next, mainImages);
      return next;
    });
  };

  const onMainImageDrop = useCallback(async (slotIndex: number, acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const emptySlots = mainImages
      .map((slot, i) => (mainImageSlotHasContent(slot) ? -1 : i))
      .filter((i) => i >= 0);

    let targetSlots: number[];
    if (acceptedFiles.length === 1) {
      targetSlots = [slotIndex];
    } else {
      const startAt = emptySlots.indexOf(slotIndex);
      const from = startAt >= 0 ? startAt : 0;
      targetSlots = emptySlots.slice(from, from + acceptedFiles.length);
      if (targetSlots.length === 0) return;
    }

    const pairs = acceptedFiles.slice(0, targetSlots.length).map((file, i) => ({
      slotIndex: targetSlots[i],
      file,
    }));

    try {
      setMainImageLoadingSlot(-1);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200 };
      const processed = await Promise.all(
        pairs.map(async ({ slotIndex: si, file }) => {
          const resizingBlob = await imageCompression(file, options);
          const fileName = buildRetreatMainImageFileName(file, churchSlug, si);
          const newFile = new File([resizingBlob], fileName, { type: file.type });
          return {
            slotIndex: si,
            file: newFile,
            previewUrl: URL.createObjectURL(newFile),
            serverName: fileName,
          };
        }),
      );

      setMainImages((prev) => {
        const next = [...prev];
        processed.forEach(({ slotIndex: si, file, previewUrl, serverName }) => {
          const current = next[si];
          if (current.previewUrl && current.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(current.previewUrl);
          }
          next[si] = { ...current, file, previewUrl, serverName };
        });
        recomputeDirty(info, programs, next);
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setMainImageLoadingSlot(null);
    }
  }, [info, programs, recomputeDirty, churchSlug, mainImages]);

  const clearMainImageSlot = (slotIndex: number) => {
    setMainImages((prev) => {
      const next = prev.map((m, i) => {
        if (i !== slotIndex) return m;
        if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(m.previewUrl);
        }
        return { serverName: '', file: null, previewUrl: '' };
      });
      recomputeDirty(info, programs, next);
      return next;
    });
  };

  const moveMainImageSlot = (displayIndex: number, direction: 'up' | 'down') => {
    const filled = mainImages
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => mainImageSlotHasContent(slot));
    const targetDisplay = direction === 'up' ? displayIndex - 1 : displayIndex + 1;
    if (targetDisplay < 0 || targetDisplay >= filled.length) return;

    const indexA = filled[displayIndex].index;
    const indexB = filled[targetDisplay].index;
    setMainImages((prev) => {
      const next = [...prev];
      [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
      recomputeDirty(info, programs, next);
      return next;
    });
  };

  const applySavedMainImages = (imageMainRaw: string | undefined) => {
    const savedNames = parseMainImageNameFromDb(imageMainRaw || '');
    const nextMainImages = savedNames.map((serverName) => ({
      serverName,
      file: null,
      previewUrl: '',
    }));
    setMainImages((prev) => {
      prev.forEach((m) => {
        if (m.previewUrl && m.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(m.previewUrl);
        }
      });
      return nextMainImages;
    });
    mainImagesBaselineRef.current = mainImagesSnapshot(nextMainImages);
    setInfo((prev) => {
      const next = { ...prev, imageMain: imageMainRaw || '' };
      infoBaselineRef.current = next;
      return next;
    });
  };

  const saveCurrentTab = async (): Promise<void> => {
    if (!bookletId || !retreatAuth.loggedIn || !auth.churchName || !auth.passwd) return;

    if (activeTab === 'program' || activeTab === 'order') {
      await saveRetreatPrograms(bookletId, auth, programs);
      programsBaselineRef.current = programs.map((row) => ({ ...row }));
    } else if (activeTab === 'apply') {
      const imageMainSerialized = serializeMainImageNameForDb(
        mainImages.map((m) => m.serverName ?? ''),
      );
      const infoToSave = {
        ...info,
        address: kakaoAddress.getFullAddress() || info.address,
        imageMain: imageMainSerialized,
      };
      const saveResult = await saveRetreatInfo(bookletId, auth, infoToSave, {
        imageMainName: imageMainSerialized,
        mainImageFiles: mainImages.some((m) => !!m.file)
          ? mainImages.map((m) => m.file)
          : undefined,
      });
      applySavedMainImages(saveResult.imageMain ?? imageMainSerialized);

      const questionsToSave = customQuestions
        .map((question) => ({ ...question, label: question.label.trim() }))
        .filter((question) => question.label);
      await saveRetreatRequestMain(bookletId, auth, questionsToSave);
      customQuestionsBaselineRef.current = questionsToSave.map((question) => ({ ...question }));
      setCustomQuestions(questionsToSave);
    } else {
      const imageMainSerialized = serializeMainImageNameForDb(
        mainImages.map((m) => m.serverName ?? ''),
      );
      const infoToSave = {
        ...info,
        address: kakaoAddress.getFullAddress() || info.address,
        imageMain: imageMainSerialized,
      };
      const saveResult = await saveRetreatInfo(bookletId, auth, infoToSave, {
        imageMainName: imageMainSerialized,
        mainImageFiles: mainImages.some((m) => !!m.file)
          ? mainImages.map((m) => m.file)
          : undefined,
      });
      applySavedMainImages(saveResult.imageMain ?? imageMainSerialized);
    }

    setDirtyTabs((prev) => {
      const next = { ...prev };
      if (activeTab === 'program' || activeTab === 'order') {
        next.program = false;
        next.order = false;
      } else {
        next.info = false;
        next.greeting = false;
        next.apply = false;
      }
      return next;
    });
  };

  const handleSaveClick = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    try {
      await saveCurrentTab();
      alert('저장되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteClick = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isDirty) {
        await saveCurrentTab();
      }
      navigate('/retreat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleTabClick = (tabId: RetreatEditTabId) => {
    if (isDirty) {
      const ok = window.confirm('저장하지 않은 변경 사항이 있습니다. 탭을 이동할까요?');
      if (!ok) return;
    }
    setActiveTab(tabId);
  };

  const goToNextTabFrom = (tabId: RetreatEditTabId) => {
    const next = nextRetreatTab(visibleTabList, tabId);
    if (next) setActiveTab(next);
  };

  const goToPrevTabFrom = (tabId: RetreatEditTabId) => {
    const prev = prevRetreatTab(visibleTabList, tabId);
    if (prev) setActiveTab(prev);
  };

  const templateNoticePostData = useMemo(
    () => ({
      eventName: info.eventName,
      date: info.date,
      place: info.place,
      address: kakaoAddress.getFullAddress() || info.address,
      superViser: info.superViser,
      quiry: info.quiry,
      placeNaver: info.placeNaver,
      placeKakao: info.placeKakao,
    }),
    [info, kakaoAddress.address, kakaoAddress.addressExtra, kakaoAddress.addressDetail],
  );

  const previewPrograms = useMemo(
    () =>
      programs
        .filter(programRowHasContent)
        .map((row) => ({
          title: row.title,
          subTitle: row.subTitle,
          dateTime: row.dateTime,
          showDateTime: row.showDateTime,
        })),
    [programs],
  );

  const renderProgramPreviewRow = (row: RetreatProgramRow, index: number) => {
    const titleLine = row.title.trim() || row.subTitle.trim() || '프로그램';
    const descLines = careerLines(row.career);

    return (
      <div key={`pr-${index}`} className="notice-detail__servers-card template-event-cast__card--editor">
        <div
          className="notice-detail__servers-card-avatar"
          style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
        >
          <FaUser className="notice-detail__servers-card-icon" aria-hidden />
        </div>
        <div className="notice-detail__servers-card-body">
          <div className="notice-detail__servers-card-row">
            <div className="event-create__preview-program-card-text">
              <h4 className="notice-detail__servers-card-name">{titleLine}</h4>
              {row.showDateTime && row.dateTime.trim() ? (
                <p className="notice-detail__servers-card-duty event-create__preview-program-card-schedule">
                  {row.dateTime}
                </p>
              ) : null}
              {descLines.length > 0 ? (
                <div className="notice-detail__servers-card-desc template-event-cast__note event-create__preview-program-card-desc-long">
                  {descLines.map((line) => (
                    <p key={line} className="event-create__preview-program-card-desc-line">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => (
    <div className="retreat-edit__preview-inner">
      <div
        className={`retreat-edit__preview-hero${
          hasMainImage ? '' : ' retreat-edit__preview-hero--no-image'
        }`}
      >
        {hasMainImage ? (
          <MainHeroCarousel
            fill
            imageSrcs={previewMainImages}
            imgClassName="event-create__preview-hero-img"
            placeholder={null}
            showViewFullButton
          />
        ) : (
          <div className="retreat-edit__preview-hero-blank" aria-hidden />
        )}
        <div className="event-create__preview-hero-overlay">
          <p className="event-create__preview-hero-sub">수련회</p>
          <h1 className="event-create__preview-hero-title">{displayTitle}</h1>
        </div>
      </div>

      <div className="retreat-edit__preview-tabs">
        {visibleTabList.map((tabId) => (
          <div
            key={tabId}
            className={`retreat-edit__preview-tab${activeTab === tabId ? ' on' : ''}`}
          >
            {retreatTabLabel(tabId)}
          </div>
        ))}
      </div>

      <div className="retreat-edit__preview-body">
        {activeTab === 'info' ? (
          <>
            <div className="notice-create__preview-body">
              <TemplateNotice
                postData={templateNoticePostData}
                variant="retreat"
                showFooter={false}
                program={previewPrograms}
                applyNote={info.applyNote}
                applyNoteLabel="수련회 안내"
                alwaysShowApplyNote
                onOpenProgramTab={
                  visibleTabList.includes('program')
                    ? () => setActiveTab('program')
                    : visibleTabList.includes('order')
                      ? () => setActiveTab('order')
                      : undefined
                }
                programMoreDisabled={dirtyTabs.info || saving}
              />
            </div>
            <div className="notice-create__preview-footer">
              <p className="notice-create__preview-footer-info">
                {info.quiry}
                {info.quiry && (kakaoAddress.getFullAddress() || info.address) ? ' | ' : ''}
                {kakaoAddress.getFullAddress() || info.address}
                <br />
                © {new Date().getFullYear()} {info.eventName || '수련회'} All Rights Reserved.
              </p>
            </div>
          </>
        ) : null}

        {activeTab === 'greeting' ? (
          <TemplateEventGreeting
            eventGreeting={info.eventGreeting}
            dateLine={info.date}
            placeLine={info.place}
            editorPreview
            hideBackgroundImage
          />
        ) : null}

        {activeTab === 'program' ? (
          <div className="event-create__preview-program-tab">
            {programs.filter(programRowHasContent).length === 0 ? (
              <div className="template-event-cast template-event-cast--empty template-event-cast--editor-preview">
                <p className="template-event-program__empty">프로그램을 입력해 주세요</p>
              </div>
            ) : (
              <div className="template-event-cast template-event-cast--editor-preview">
                <div className="notice-detail__servers-list template-event-cast__list template-event-cast__list--editor">
                  {programs.filter(programRowHasContent).map((row, i) =>
                    renderProgramPreviewRow(row, i),
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'order' ? (
          <div className="event-create__preview-worship">
            {orderDayGroups.map((group, dayIndex) => {
              const dateLabel = serializeYmdParts(group.dateParts);
              const dayRows = programs.slice(
                group.startIndex,
                group.startIndex + group.rowCount,
              );
              return (
                <div
                  key={`order-preview-day-${group.groupId || dayIndex}`}
                  className="retreat-edit__preview-order-day"
                >
                  {dateLabel ? (
                    <p className="retreat-edit__preview-order-date">{dateLabel}</p>
                  ) : null}
                  <TemplateEventOrder
                    rows={programsToOrderRows(dayRows)}
                    orderStyle={orderStyle}
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === 'apply' ? (
          <div className="event-create__preview-apply" style={{ padding: '12px 10px' }}>
            <RetreatApplyForm
              bookletId={bookletId}
              applyNote={info.applyNote}
              customQuestions={customQuestions.filter((question) => question.label.trim())}
              preview
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderInfoForm = () => (
    <>
      <div className="retreat-edit__form-group">
        <div className="retreat-edit__group-header">
          <div className="retreat-edit__group-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div>
            <h3 className="retreat-edit__group-title">대표 이미지</h3>
            <p className="retreat-edit__group-desc">
              전단지 상단에 표시될 메인 이미지입니다 (최대 5장, 권장 1920×1080). 여러 장을 한 번에 선택할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="retreat-edit__main-images">
          {filledMainImageSlots.map(({ slot, index }, displayIndex) => {
            const thumbSrc = mainImageThumbSrc(slot);
            return (
              <div key={`main-image-${index}`} className="retreat-edit__main-image-slot">
                <span className="retreat-edit__main-image-slot-label">{displayIndex + 1}</span>
                <div className="retreat-edit__image-upload">
                  {thumbSrc ? (
                    <MainImageThumb
                      src={thumbSrc}
                      onBroken={() => clearMainImageSlot(index)}
                    />
                  ) : null}
                  <div className="retreat-edit__image-info">
                    <div className="retreat-edit__image-name">
                      {slot.file?.name || slot.serverName || '등록된 이미지'}
                    </div>
                    <div className="retreat-edit__image-size">
                      {slot.file ? '저장 시 업로드됩니다' : '저장된 이미지'}
                    </div>
                  </div>
                  <div className="retreat-edit__image-actions">
                    {filledMainImageSlots.length > 1 ? (
                      <div className="retreat-edit__image-reorder" role="group" aria-label="이미지 순서">
                        <button
                          type="button"
                          className="retreat-edit__image-reorder-btn"
                          disabled={displayIndex === 0}
                          onClick={() => moveMainImageSlot(displayIndex, 'up')}
                          title="위로 이동"
                          aria-label="위로 이동"
                        >
                          <FaChevronUp aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="retreat-edit__image-reorder-btn"
                          disabled={displayIndex >= filledMainImageSlots.length - 1}
                          onClick={() => moveMainImageSlot(displayIndex, 'down')}
                          title="아래로 이동"
                          aria-label="아래로 이동"
                        >
                          <FaChevronDown aria-hidden />
                        </button>
                      </div>
                    ) : null}
                    <MainImageSlotDropzone
                      slotIndex={index}
                      onDrop={onMainImageDrop}
                      isLoading={mainImageLoadingSlot !== null}
                    />
                    <button
                      type="button"
                      className="retreat-edit__btn-sm retreat-edit__btn-sm--danger"
                      onClick={() => clearMainImageSlot(index)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {nextEmptyMainImageSlotIndex !== -1 ? (
            <div className="retreat-edit__main-image-slot">
              {filledMainImageSlots.length > 0 ? (
                <span className="retreat-edit__main-image-slot-label">
                  {filledMainImageSlots.length + 1}
                </span>
              ) : null}
              <MainImageSlotDropzone
                slotIndex={nextEmptyMainImageSlotIndex}
                onDrop={onMainImageDrop}
                isLoading={mainImageLoadingSlot !== null}
                maxFiles={emptyMainImageSlotCount}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="retreat-edit__form-group">
        <div className="retreat-edit__group-header">
          <div className="retreat-edit__group-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="retreat-edit__group-title">기본 정보</h3>
            <p className="retreat-edit__group-desc">수련회명, 일정, 장소 등 핵심 안내를 입력하세요</p>
          </div>
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-event-name">
            수련회명 <span className="retreat-edit__required">*</span>
            <span className="retreat-edit__field-hint">{info.eventName.length}/40</span>
          </label>
          <input
            id="retreat-event-name"
            type="text"
            className="retreat-edit__input"
            value={info.eventName}
            maxLength={40}
            onChange={(e) => updateInfo('eventName', e.target.value)}
            placeholder="예) 2026 여름 청년 수련회"
          />
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-event-name-en">
            영문 식별명
          </label>
          <input
            id="retreat-event-name-en"
            type="text"
            className="retreat-edit__input"
            value={info.eventNameEn}
            onChange={(e) => {
              const raw = e.target.value;
              if (/[^a-zA-Z0-9]/.test(raw)) {
                const now = Date.now();
                if (now - lastEventNameEnAlertRef.current > 500) {
                  lastEventNameEnAlertRef.current = now;
                  alert('숫자+영문만 기입할 수 있습니다');
                }
              }
              updateInfo('eventNameEn', raw.replace(/[^a-zA-Z0-9]/g, ''));
            }}
            placeholder="영문·숫자 식별명 : 링크 주소를 위해 사용됩니다 ex) 2026summeryouthretreat"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className="retreat-edit__field">
          <span className="retreat-edit__field-label">
            일정 <span className="retreat-edit__required">*</span>
          </span>
          <div className="retreat-edit__date-wrap">
            <div className="retreat-edit__date-mode-row">
              <label className="retreat-edit__date-mode-option">
                <input
                  type="radio"
                  name="retreat-date-mode"
                  checked={retreatDateValue.mode === 'single'}
                  onChange={() =>
                    applyRetreatDate({
                      mode: 'single',
                      start: retreatDateValue.start,
                      end: { ...EMPTY_YMD },
                    })
                  }
                />
                <span>당일</span>
              </label>
              <label className="retreat-edit__date-mode-option">
                <input
                  type="radio"
                  name="retreat-date-mode"
                  checked={retreatDateValue.mode === 'range'}
                  onChange={() =>
                    applyRetreatDate({
                      mode: 'range',
                      start: retreatDateValue.start,
                      end:
                        retreatDateValue.end.y
                          ? retreatDateValue.end
                          : { ...retreatDateValue.start },
                    })
                  }
                />
                <span>기간</span>
              </label>
            </div>
            {retreatDateValue.mode === 'single' ? (
              <RetreatYmdSelectRow
                parts={retreatDateValue.start}
                onChange={patchRetreatDateStart}
                idPrefix="retreat-date-start"
                yearOptions={retreatYearOptions}
              />
            ) : (
              <div className="retreat-edit__date-range">
                <RetreatYmdSelectRow
                  parts={retreatDateValue.start}
                  onChange={patchRetreatDateStart}
                  idPrefix="retreat-date-start"
                  yearOptions={retreatYearOptions}
                />
                <span className="retreat-edit__date-range-sep">~</span>
                <RetreatYmdSelectRow
                  parts={retreatDateValue.end}
                  onChange={patchRetreatDateEnd}
                  idPrefix="retreat-date-end"
                  yearOptions={retreatYearOptions}
                />
              </div>
            )}
          </div>
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-place">
            장소
          </label>
          <input
            id="retreat-place"
            type="text"
            className="retreat-edit__input"
            value={info.place}
            onChange={(e) => updateInfo('place', e.target.value)}
          />
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-address-detail">
            주소
          </label>
          <div className="retreat-edit__address-field">
            <KakaoAddressFields
              postcode={kakaoAddress.postcode}
              address={kakaoAddress.address}
              addressExtra={kakaoAddress.addressExtra}
              addressGuide={kakaoAddress.addressGuide}
              addressDetail={kakaoAddress.addressDetail}
              onAddressDetailChange={kakaoAddress.setAddressDetail}
              onSearch={kakaoAddress.handleAddressSearch}
              detailInputRef={kakaoAddress.addressDetailRef}
              inputClassName="retreat-edit__input"
            />
          </div>
        </div>

        <div className="retreat-edit__field-row">
          <div className="retreat-edit__field">
            <label className="retreat-edit__field-label" htmlFor="retreat-superviser">
              인도자
            </label>
            <input
              id="retreat-superviser"
              type="text"
              className="retreat-edit__input"
              value={info.superViser}
              onChange={(e) => updateInfo('superViser', e.target.value)}
            />
          </div>
          <div className="retreat-edit__field">
            <label className="retreat-edit__field-label" htmlFor="retreat-quiry">
              문의 <span className="retreat-edit__required">*</span>
            </label>
            <input
              id="retreat-quiry"
              type="tel"
              className="retreat-edit__input"
              value={info.quiry}
              onChange={(e) => updateInfo('quiry', e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-apply-note">
            수련회 안내
          </label>
          <textarea
            id="retreat-apply-note"
            className="retreat-edit__textarea"
            value={info.applyNote}
            onChange={(e) => updateInfo('applyNote', e.target.value)}
            rows={5}
          />
        </div>
      </div>

      <div className="retreat-edit__form-group">
        <div className="retreat-edit__group-header">
          <div className="retreat-edit__group-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h3 className="retreat-edit__group-title">오시는 길</h3>
            <p className="retreat-edit__group-desc">네이버·카카오 지도 링크를 입력하세요</p>
          </div>
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-naver">
            네이버 지도 URL
          </label>
          <div className="retreat-edit__input-with-icon">
            <input
              id="retreat-naver"
              type="url"
              className="retreat-edit__input"
              value={info.placeNaver}
              onChange={(e) => updateInfo('placeNaver', e.target.value)}
              placeholder="예시) https://naver.me/GyNv7dGv"
            />
            <button
              type="button"
              className="retreat-edit__map-open-btn retreat-edit__map-open-btn--naver"
              onClick={() => {
                const q = (kakaoAddress.getFullAddress() || info.address).trim();
                const url = q
                  ? `https://map.naver.com/p/search/${encodeURIComponent(q)}`
                  : 'https://map.naver.com/';
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              네이버지도
            </button>
            <span
              className="retreat-edit__info-icon"
              role="button"
              tabIndex={0}
              onClick={() =>
                window.open(
                  `${window.location.origin}${navermapnotice}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
            >
              <FaInfoCircle />
            </span>
          </div>
        </div>

        <div className="retreat-edit__field">
          <label className="retreat-edit__field-label" htmlFor="retreat-kakao">
            카카오 지도 URL
          </label>
          <div className="retreat-edit__input-with-icon">
            <input
              id="retreat-kakao"
              type="url"
              className="retreat-edit__input"
              value={info.placeKakao}
              onChange={(e) => updateInfo('placeKakao', e.target.value)}
              placeholder="예시)https://kko.to/Mo4dcW-xOo"
            />
            <button
              type="button"
              className="retreat-edit__map-open-btn retreat-edit__map-open-btn--kakao"
              onClick={() => {
                const q = (kakaoAddress.getFullAddress() || info.address).trim();
                const url = q
                  ? `https://map.kakao.com/link/search/${encodeURIComponent(q)}`
                  : 'https://map.kakao.com/';
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              카카오지도
            </button>
            <span
              className="retreat-edit__info-icon"
              role="button"
              tabIndex={0}
              onClick={() =>
                window.open(
                  `${window.location.origin}${kakaomapnotice}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
            >
              <FaInfoCircle />
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const renderGreetingForm = () => (
    <div className="retreat-edit__form-group">
      <div className="retreat-edit__group-header">
        <div className="retreat-edit__group-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="retreat-edit__group-title">초대의 글</h3>
          <p className="retreat-edit__group-desc">참가자에게 전할 환영 메시지를 작성하세요</p>
        </div>
      </div>
      <div className="retreat-edit__field">
        <textarea
          className="retreat-edit__textarea"
          value={info.eventGreeting}
          onChange={(e) => updateInfo('eventGreeting', e.target.value)}
          placeholder="초대의 글을 입력하세요."
          rows={14}
        />
      </div>
    </div>
  );

  const renderProgramForm = () => (
    <div className="retreat-edit__form-group">
      <div className="retreat-edit__group-header">
        <div className="retreat-edit__group-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </div>
        <div>
          <h3 className="retreat-edit__group-title">프로그램</h3>
          <p className="retreat-edit__group-desc">시간표와 프로그램 내용을 항목별로 입력하세요</p>
        </div>
      </div>

      {programs.map((row, index) => (
        <div key={`program-${index}`} className="retreat-edit__program-entry">
          <div className="retreat-edit__field">
            <label className="retreat-edit__field-label">제목</label>
            <input
              type="text"
              className="retreat-edit__input"
              value={row.title}
              onChange={(e) => updateProgram(index, 'title', e.target.value)}
            />
          </div>
          <div className="retreat-edit__field">
            <label className="retreat-edit__field-label">소제목</label>
            <input
              type="text"
              className="retreat-edit__input"
              value={row.subTitle}
              onChange={(e) => updateProgram(index, 'subTitle', e.target.value)}
            />
          </div>
          <div className="retreat-edit__program-schedule">
            <div className="retreat-edit__field">
              <label className="retreat-edit__field-label">일시</label>
              <input
                type="text"
                className="retreat-edit__input"
                value={row.dateTime}
                onChange={(e) => updateProgram(index, 'dateTime', e.target.value)}
              />
            </div>
            <label className="retreat-edit__visibility-toggle">
              <input
                type="checkbox"
                checked={row.showDateTime}
                onChange={(e) => updateProgram(index, 'showDateTime', e.target.checked)}
              />
              <span>{row.showDateTime ? '일시 노출' : '일시 비노출'}</span>
            </label>
          </div>
          <div className="retreat-edit__field">
            <label className="retreat-edit__field-label">설명</label>
            <textarea
              className="retreat-edit__textarea"
              value={row.career}
              onChange={(e) => updateProgram(index, 'career', e.target.value)}
              rows={4}
            />
          </div>
          {programs.length > 1 ? (
            <button
              type="button"
              className="retreat-edit__remove-row-btn"
              onClick={() => removeProgram(index)}
            >
              삭제
            </button>
          ) : null}
        </div>
      ))}

      <button type="button" className="retreat-edit__add-row-btn" onClick={addProgram}>
        + 프로그램 추가
      </button>
    </div>
  );

  const renderOrderForm = () => (
    <div className="retreat-edit__form-group">
      <div className="retreat-edit__group-header">
        <div className="retreat-edit__group-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <h3 className="retreat-edit__group-title">일정 & 순서</h3>
          <p className="retreat-edit__group-desc">진행 순서를 단계별로 입력하세요</p>
        </div>
      </div>

      <p className="retreat-edit__hint">
        표처럼 한눈에 입력할 수 있습니다. 왼쪽 미리보기에 텍스트 형태로 표시됩니다.
      </p>

      {orderDayGroups.map((group, dayIndex) => {
        const rowCount = Math.max(group.rowCount, ORDER_FORM_MIN_ROWS);
        const yearOptions = buildRetreatYearOptions(group.dateParts.y);
        const canDeleteBox = orderDayGroups.length > 1;

        return (
          <div
            key={`order-day-${group.groupId || dayIndex}`}
            className="retreat-edit__order-day-block"
          >
            <div className="retreat-edit__order-table-wrap">
              <div className="retreat-edit__order-date-bar">
                <span className="retreat-edit__order-date-label">날짜</span>
                <RetreatYmdSelectRow
                  parts={group.dateParts}
                  onChange={(patch) => patchOrderDayDate(dayIndex, patch)}
                  idPrefix={`retreat-order-date-${dayIndex}`}
                  yearOptions={yearOptions}
                />
                {canDeleteBox ? (
                  <button
                    type="button"
                    className="retreat-edit__order-day-delete"
                    onClick={() => removeOrderDayBox(dayIndex)}
                  >
                    박스 삭제
                  </button>
                ) : null}
              </div>
              <table className="retreat-edit__order-table">
                <thead>
                  <tr>
                    <th className="retreat-edit__order-table-col-num">#</th>
                    <th className="retreat-edit__order-table-col-time">시간</th>
                    <th>제목</th>
                    <th>소제목</th>
                    <th>상세내용</th>
                    <th className="retreat-edit__order-table-col-action" aria-label="관리" />
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }, (_, localRowIndex) => {
                    const globalIndex = group.startIndex + localRowIndex;
                    const row = programs[globalIndex];
                    const subTitle = row?.subTitle ?? '';
                    const title = row?.title ?? '';
                    const dateTime = row?.dateTime ?? '';
                    const career = row?.career ?? '';
                    const canDeleteRow =
                      localRowIndex < group.rowCount && group.rowCount > 1;

                    return (
                      <tr key={`order-row-${dayIndex}-${localRowIndex}`}>
                        <td className="retreat-edit__order-table-num">{localRowIndex + 1}</td>
                        <td className="retreat-edit__order-table-time-cell">
                          <RetreatOrderTimeRangeSelect
                            value={dateTime}
                            onChange={(next) =>
                              updateOrderProgramInDay(dayIndex, localRowIndex, 'dateTime', next)
                            }
                            idPrefix={`retreat-order-time-${dayIndex}-${localRowIndex}`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="retreat-edit__order-table-input"
                            value={title}
                            onChange={(e) =>
                              updateOrderProgramInDay(
                                dayIndex,
                                localRowIndex,
                                'title',
                                e.target.value,
                              )
                            }
                            aria-label={`${localRowIndex + 1}행 제목`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="retreat-edit__order-table-input"
                            value={subTitle}
                            onChange={(e) =>
                              updateOrderProgramInDay(
                                dayIndex,
                                localRowIndex,
                                'subTitle',
                                e.target.value,
                              )
                            }
                            aria-label={`${localRowIndex + 1}행 소제목`}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="retreat-edit__order-table-input"
                            value={career}
                            onChange={(e) =>
                              updateOrderProgramInDay(
                                dayIndex,
                                localRowIndex,
                                'career',
                                e.target.value,
                              )
                            }
                            aria-label={`${localRowIndex + 1}행 상세내용`}
                          />
                        </td>
                        <td className="retreat-edit__order-table-action">
                          {canDeleteRow ? (
                            <button
                              type="button"
                              className="retreat-edit__order-table-delete"
                              onClick={() =>
                                removeOrderProgramFromDay(dayIndex, localRowIndex)
                              }
                            >
                              삭제
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="retreat-edit__add-row-btn retreat-edit__add-row-btn--inline"
              onClick={() => addOrderProgramToDay(dayIndex)}
            >
              + 한 줄 추가
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className="retreat-edit__add-row-btn"
        onClick={addOrderDayBox}
        disabled={!canAddOrderDayBox}
        title={
          canAddOrderDayBox
            ? undefined
            : '모든 날짜 박스에 년·월·일을 입력한 뒤 추가할 수 있습니다.'
        }
      >
        + 날짜 박스 추가
      </button>
    </div>
  );

  const handleCustomQuestionsChange = (next: RetreatCustomQuestion[]) => {
    setCustomQuestions(next);
    recomputeDirty(info, programs, mainImages, next);
  };

  const renderApplyForm = () => (
    <>
      <div className="retreat-edit__form-group">
        <div className="retreat-edit__group-header">
          <div className="retreat-edit__group-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h3 className="retreat-edit__group-title">신청 설정</h3>
            <p className="retreat-edit__group-desc">구글폼처럼 추가 질문을 자유롭게 구성할 수 있습니다</p>
          </div>
        </div>
        <div className="retreat-edit__apply-default-notice">
          <p className="retreat-edit__apply-default-notice__text">
            <strong>이름·연락처·소속·성별·나이</strong>는 기본 항목으로 자동 포함됩니다.
          </p>
        </div>
        <p className="retreat-edit__hint retreat-edit__hint--inline">
          안내 문구는 기본 정보 탭에서 수정할 수 있습니다.
        </p>
        <RetreatRequestFormBuilder
          questions={customQuestions}
          onChange={handleCustomQuestionsChange}
        />
      </div>
    </>
  );

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoForm();
      case 'greeting':
        return renderGreetingForm();
      case 'program':
        return renderProgramForm();
      case 'order':
        return renderOrderForm();
      case 'apply':
        return renderApplyForm();
      default:
        return null;
    }
  };

  if (!bookletId) {
    return (
      <div className="retreat-edit">
        <p className="retreat-edit__loading">잘못된 접근입니다.</p>
      </div>
    );
  }

  return (
    <div className="retreat-edit">
      <header className="retreat-edit__topbar">
        <div className="retreat-edit__topbar-left">
          <button
            type="button"
            className="retreat-edit__back-link"
            onClick={() => navigate('/retreat')}
          >
            <BackIcon />
            목록으로
          </button>
          <nav className="retreat-edit__breadcrumb" aria-label="breadcrumb">
            <span>수련회 전단지 관리</span>
            <span className="retreat-edit__breadcrumb-sep">/</span>
            <span className="retreat-edit__breadcrumb-current">편집</span>
          </nav>
        </div>

        <div className="retreat-edit__topbar-center">
          <input
            type="text"
            value={info.eventName}
            maxLength={40}
            onChange={(e) => updateInfo('eventName', e.target.value)}
            placeholder="수련회명"
            aria-label="수련회명"
          />
          <EditIcon />
        </div>

        <div className="retreat-edit__topbar-right">
          <span className="retreat-edit__save-status">
            <span
              className={`retreat-edit__save-dot${
                isDirty ? ' retreat-edit__save-dot--dirty' : ' retreat-edit__save-dot--saved'
              }`}
            />
            {isDirty ? '저장 필요' : '저장됨'}
          </span>
          <button
            type="button"
            className="retreat-edit__btn retreat-edit__btn-outline"
            onClick={() => void handleSaveClick()}
            disabled={!isDirty || saving}
          >
            {saving ? '저장 중…' : '임시저장'}
          </button>
          <button
            type="button"
            className="retreat-edit__btn retreat-edit__btn-primary"
            onClick={() => void handleCompleteClick()}
            disabled={saving}
          >
            <CheckIcon />
            {saving ? '처리 중…' : '완료'}
          </button>
        </div>
      </header>

      <div className="retreat-edit__workspace">
        <aside className="retreat-edit__preview-panel">
          <div className="retreat-edit__preview-header">
            <span className="retreat-edit__preview-label">
              <EyeIcon />
              실시간 미리보기
            </span>
          </div>

          <div className="retreat-edit__preview-stage">
            <div className="retreat-edit__phone">
              <div className="retreat-edit__phone-screen">{renderPreviewContent()}</div>
            </div>
            <p className="retreat-edit__preview-caption">
              <PhoneIcon />
              입력한 내용이 실시간으로 반영됩니다
            </p>
          </div>
        </aside>

        <section className="retreat-edit__form-panel">
          <nav className="retreat-edit__section-tabs" aria-label="편집 단계">
            {visibleTabList.map((tabId) => (
              <button
                key={tabId}
                type="button"
                className={`retreat-edit__section-tab${activeTab === tabId ? ' active' : ''}`}
                onClick={() => handleTabClick(tabId)}
              >
                <span className="retreat-edit__step-num">
                  {retreatEditorTabStep(visibleTabList, tabId)}
                </span>
                {retreatEditorTabLabel(tabId)}
              </button>
            ))}
          </nav>

          <div className="retreat-edit__form-scroll">
            {loading ? <p className="retreat-edit__loading">불러오는 중…</p> : null}
            {error ? <p className="retreat-edit__error">{error}</p> : null}
            {!loading ? renderActiveForm() : null}
          </div>

          <div className="retreat-edit__action-bar">
            <button
              type="button"
              className="retreat-edit__btn retreat-edit__btn-outline"
              onClick={() => goToPrevTabFrom(activeTab)}
              disabled={!prevTab || isDirty || saving}
            >
              <ChevronLeftIcon />
              이전
            </button>
            {nextTab ? (
              <button
                type="button"
                className="retreat-edit__btn retreat-edit__btn-primary"
                onClick={() => goToNextTabFrom(activeTab)}
                disabled={isDirty || saving}
              >
                다음 단계: {retreatEditorTabLabel(nextTab)}
                <ChevronRightIcon />
              </button>
            ) : (
              <button
                type="button"
                className="retreat-edit__btn retreat-edit__btn-primary"
                onClick={() => void handleCompleteClick()}
                disabled={isDirty || saving}
              >
                <CheckIcon />
                {saving ? '처리 중…' : '완료'}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
