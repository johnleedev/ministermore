import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../../../RecoilStore';
import './NoticeCreate.scss';
import Footer from '../../../../components/Footer';
import MainURL from '../../../../MainURL';
import axios from 'axios';
import kakaologo from '../../../../images/login/kakao.png';
import naverlogo from '../../../../images/login/naver.png';
import naverbloglogo from '../../../../images/naverblog.png';
import navermapnotice from '../../../../images/booklet/navermapnotice.jpg';
import kakaomapnotice from '../../../../images/booklet/kakaomapnotice.jpg';
import { FaInstagram, FaYoutube, FaFacebookF, FaInfoCircle } from 'react-icons/fa';
import { DaumPostcodeEmbed } from 'react-daum-postcode';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { religiousbodySubSort } from '../../../recruit/recruit_minister/RecruitMinisterPostData';
import TemplateServers from '../../../../exceptbooklets/bookletNotice/BookletNoticeTemplates/TemplateServers';
import TemplateSermon from '../../../../exceptbooklets/bookletNotice/BookletNoticeTemplates/TemplateSermon';
import {
  type NoticeTemplateId,
  type IntroBlockId,
  TEMPLATE_INTRO_ORDER,
} from './noticeTemplateTypes';
import MainHeroCarousel from '../../../../exceptbooklets/component/MainHeroCarousel';
import {
  MAIN_IMAGE_SLOT_COUNT,
  parseMainImageNameFromDb,
  serializeMainImageNameForDb,
} from '../../../../exceptbooklets/component/mainImageNames';

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
        (m.serverName ? `${MainURL}/images/bookletnotice/mainimages/${m.serverName}` : '')
    )
    .filter(Boolean);
}

// BookletNoticeDetail / TemplateServers 구조에 맞춘 입력 데이터
interface SermonVideoItem {
  title: string;
  url: string;
  thumbnail: string;
  thumbnailFile?: File | null;
  thumbnailUrl?: string;
}

interface GalleryItem {
  image: string;
  title: string;
  description: string;
  imageFile?: File | null;
  imageUrl?: string;
}

function galleryItemPreviewSrc(g: GalleryItem): string {
  const raw = g.imageUrl || g.image;
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:') || raw.startsWith('http')) {
    return raw;
  }
  return `${MainURL}/images/bookletnotice/gallery/${raw}`;
}

/** 오른쪽 폼 ServerImageDropzone용: 새로 올린 blob(imageUrl) 우선, 없으면 서버 저장 파일명(image)으로 URL */
function galleryFormDisplayUrl(item: GalleryItem): string {
  if (item.imageUrl) return item.imageUrl;
  if (item.image) return `${MainURL}/images/bookletnotice/gallery/${item.image}`;
  return '';
}

/** TemplateServers.getImageUrl 과 동일 규칙: blob/데이터/절대 URL은 그대로, 나머지는 servers 폴더 파일명 */
function serverFormDisplayUrl(item: ServerItem): string {
  if (item.imageUrl) return item.imageUrl;
  const raw = (item.image || '').trim();
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  return `${MainURL}/images/bookletnotice/servers/${raw}`;
}

function mapServerRowFromApi(s: Record<string, unknown>): ServerItem {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    title: str(s.title),
    serverName: str(s.serverName ?? s.servername),
    duty: str(s.duty),
    notice: str(s.notice),
    image: str(s.image ?? s.Image),
  };
}

function sermonThumbFormDisplayUrl(item: SermonVideoItem): string {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.thumbnail) return `${MainURL}/images/bookletnotice/sermonthumbnail/${item.thumbnail}`;
  return '';
}

interface ServerItem {
  title: string;
  serverName: string;
  duty: string;
  notice: string;
  image: string;
  imageFile?: File | null;
  imageUrl?: string;
}

interface WorshipTime {
  worshipName: string;
  dayOfWeek: string;
  time: string;
  place: string;
  notice: string;
}

/** intro dirty 비교·lastSavedRef·서버 로드 직후 기준점 — 필드 구조가 하나라도 다르면 저장/다음탭 버튼이 틀어짐 */
function buildIntroDirtySnapshot(p: {
  churchName: string;
  mainPastor: string;
  religiousbody: string;
  address: string;
  quiry: string;
  youtube: string;
  blog: string;
  instar: string;
  facebook: string;
  mainPastorMessage: string;
  churchGreetingSub: string;
  churchGreetingTitle: string;
  churchGreetingDesc: string;
  pastorCareerLines: string[];
  worshipsTimes: WorshipTime[];
  placeNaver: string;
  placeKakao: string;
  mainImages: MainImageSlot[];
  mainPastorImage: string;
  mainPastorImageFile: File | null;
}): string {
  return JSON.stringify({
    churchName: p.churchName,
    mainPastor: p.mainPastor,
    religiousbody: p.religiousbody,
    address: p.address,
    quiry: p.quiry,
    youtube: p.youtube,
    blog: p.blog,
    instar: p.instar,
    facebook: p.facebook,
    mainPastorMessage: p.mainPastorMessage,
    churchGreetingSub: p.churchGreetingSub,
    churchGreetingTitle: p.churchGreetingTitle,
    churchGreetingDesc: p.churchGreetingDesc,
    pastorCareer: p.pastorCareerLines.map((s) => s.trim()).filter(Boolean),
    worshipsTimes: p.worshipsTimes,
    placeNaver: p.placeNaver,
    placeKakao: p.placeKakao,
    imageMainName: serializeMainImageNameForDb(p.mainImages.map((m) => m.serverName ?? '')),
    mainPastorImage: p.mainPastorImage,
    hasNewMainImages: p.mainImages.some((m) => !!m.file),
    hasNewPastorImage: !!p.mainPastorImageFile,
  });
}

const DAY_OPTIONS = [
  { value: '', label: '선택' },
  { value: '일요일', label: '일요일(주일)' },
  { value: '월요일', label: '월요일' },
  { value: '화요일', label: '화요일' },
  { value: '수요일', label: '수요일' },
  { value: '목요일', label: '목요일' },
  { value: '금요일', label: '금요일' },
  { value: '토요일', label: '토요일' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0')
);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  (i * 5).toString().padStart(2, '0')
);

function parseTime(timeStr: string): { hour: string; minute: string } {
  if (!timeStr || !timeStr.includes(':')) {
    return { hour: '00', minute: '00' };
  }
  const [hour, minute] = timeStr.split(':');
  return {
    hour: hour?.padStart(2, '0') || '00',
    minute: minute?.padStart(2, '0') || '00',
  };
}

function formatTimeForDisplay(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return '오전 11:00';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h || '11', 10);
  const minute = m?.padStart(2, '0') || '00';
  if (hour < 12) return `오전 ${hour}:${minute}`;
  if (hour === 12) return `오후 12:${minute}`;
  return `오후 ${hour - 12}:${minute}`;
}

function MainImageDropzone({
  onDrop,
  isLoading,
}: {
  onDrop: (files: File[]) => void;
  isLoading: boolean;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files.length && onDrop(files),
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isLoading,
  });
  return (
    <div {...getRootProps()} className="notice-create__main-image-dropzone">
      <input {...getInputProps()} />
      {isLoading ? '이미지 처리 중...' : '이미지 첨부'}
    </div>
  );
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
    <div {...getRootProps()} className="notice-create__main-image-slot-dropzone">
      <input {...getInputProps()} />
      {isLoading ? '처리 중...' : '첨부'}
    </div>
  );
}

function ServerImageDropzone({
  index,
  imageUrl,
  isLoading,
  onDrop,
  onClear,
  onRegisterReset,
}: {
  index: number;
  imageUrl: string;
  isLoading: boolean;
  onDrop: (index: number, files: File[]) => void;
  onClear: (index: number) => void;
  onRegisterReset: (index: number, reset: () => void) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => onDrop(index, files),
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isLoading,
  });

  const resetInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  React.useEffect(() => {
    onRegisterReset(index, resetInput);
    return () => onRegisterReset(index, () => {});
  }, [index, resetInput, onRegisterReset]);

  return (
    <div className="notice-create__inputRow">
      {imageUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={imageUrl}
            alt="프로필"
            style={{
              width: '150px',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '5px',
            }}
          />
          <button
            type="button"
            onClick={() => onClear(index)}
            style={{
              padding: '8px 16px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            width: '130px',
            height: '200px',
            padding: '20px',
            border: '2px dashed #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            {...(() => {
              const props = getInputProps();
              const origRef = (props as { ref?: React.Ref<HTMLInputElement> }).ref;
              return {
                ...props,
                ref: (el: HTMLInputElement | null) => {
                  (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                  if (typeof origRef === 'function') origRef(el);
                  else if (origRef && typeof origRef === 'object') (origRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                },
              };
            })()}
          />
          <p>{isLoading ? '이미지 처리 중...' : '이미지 첨부'}</p>
        </div>
      )}
    </div>
  );
}

export default function NoticeCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useRecoilValue(recoilUserData);
  const userAccount = userData?.userAccount || '';

  const urlParams = new URLSearchParams(location.search);
  const [templateId, setTemplateId] = useState<NoticeTemplateId>(
    (urlParams.get('template') as NoticeTemplateId) || 'classic'
  );
  const ordererName = urlParams.get('ordererName') || '';
  const ordererPhone = urlParams.get('ordererPhone') || '';

  const TAB_LIST = [
    { id: 'intro' as const, label: '소개' },
    { id: 'servants' as const, label: '섬김이들' },
    { id: 'sermon' as const, label: '설교영상' },
    { id: 'gallery' as const, label: '갤러리' },
  ] as const;
  const [churchName, setChurchName] = useState('');
  const [mainPastor, setMainPastor] = useState('');
  const [mainImages, setMainImages] = useState<MainImageSlot[]>(emptyMainImageSlots);
  const [mainImageLoadingSlot, setMainImageLoadingSlot] = useState<number | null>(null);
  const [religiousbody, setReligiousbody] = useState('');
  const [address, setAddress] = useState('');
  const [placeNaver, setPlaceNaver] = useState('');
  const [placeKakao, setPlaceKakao] = useState('');
  const [quiry, setQuiry] = useState('');
  const [youtube, setYoutube] = useState('');
  const [blog, setBlog] = useState('');
  const [instar, setInstar] = useState('');
  const [facebook, setFacebook] = useState('');
  const [mainPastorMessage, setMainPastorMessage] = useState('');
  const [mainPastorImage, setMainPastorImage] = useState('');
  const [mainPastorImageFile, setMainPastorImageFile] = useState<File | null>(null);
  const [mainPastorImageUrl, setMainPastorImageUrl] = useState('');
  const [mainPastorImageLoading, setMainPastorImageLoading] = useState(false);
  const [churchGreetingSub, setChurchGreetingSub] = useState('Welcome Home');
  const [churchGreetingTitle, setChurchGreetingTitle] = useState('함께 예배하고 이웃을 사랑하는 공동체');
  const [churchGreetingDesc, setChurchGreetingDesc] = useState('');
  const [pastorCareerLines, setPastorCareerLines] = useState<string[]>(['']);
  const [worshipsTimes, setWorshipsTimes] = useState<WorshipTime[]>([
    { worshipName: '', dayOfWeek: '', time: '', place: '', notice: '' },
  ]);
  const [serversData, setServersData] = useState<ServerItem[]>([
    { title: '', serverName: '', duty: '', notice: '', image: '' },
  ]);
  const [sermonVideos, setSermonVideos] = useState<SermonVideoItem[]>([
    { title: '', url: '', thumbnail: '' },
  ]);
  const [galleryData, setGalleryData] = useState<GalleryItem[]>([
    { image: '', title: '', description: '' },
  ]);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const [serverImageLoading, setServerImageLoading] = useState<Record<number, boolean>>({});
  const [sermonThumbLoading, setSermonThumbLoading] = useState<Record<number, boolean>>({});
  const [galleryImageLoading, setGalleryImageLoading] = useState<Record<number, boolean>>({});
  const serverInputResetFns = useRef<Record<number, () => void>>({});
  const sermonThumbResetFns = useRef<Record<number, () => void>>({});
  const galleryImageResetFns = useRef<Record<number, () => void>>({});
  const [isViewAddress, setIsViewAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'intro' | 'servants' | 'sermon' | 'gallery'>('intro');
  const [showPastorCareer, setShowPastorCareer] = useState(true);
  /** URL `?id=` — 첫 렌더부터 읽어야 마이페이지「수정」직후 소개 저장이 신규 생성으로 가지 않음 (useEffect보다 늦으면 안 됨) */
  const [churchMainId, setChurchMainId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [dirtyTabs, setDirtyTabs] = useState<Record<string, boolean>>({
    intro: false,
    servants: false,
    sermon: false,
    gallery: false,
  });
  const lastSavedIntroRef = useRef<string | null>(null);
  const lastSavedServantsRef = useRef<string | null>(null);
  const lastSavedSermonRef = useRef<string | null>(null);
  const lastSavedGalleryRef = useRef<string | null>(null);

  // 섬김이들 탭일 때 전체 화면 스크롤 방지
  useEffect(() => {
    if (activeTab === 'servants') {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [activeTab]);

  // churchMain id는 URL에서만 사용 (NoticeApplyPay 결제 후 or ServiceManage 수정 시 전달)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setChurchMainId(id);
    } else {
      // id 없으면 템플릿 선택 페이지로 (전단지 만들기는 반드시 NoticeApplyPay 경유)
      navigate('/service/bookletnoticetemplates', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!churchMainId) return;
    axios
      .post(`${MainURL}/bookletnoticecreate/getdatabookletspart`, { id: churchMainId })
      .then((res) => {
        if (res.data?.[0]) {
          const d = res.data[0];
          if (d.templateId && ['classic', 'modern', 'minimal', 'warm', 'forest', 'rose', 'navy', 'violet'].includes(d.templateId)) {
            setTemplateId(d.templateId as NoticeTemplateId);
          }
          setChurchName(d.churchName || '');
          setMainPastor(d.mainPastor || '');
          setReligiousbody(d.religiousbody || '');
          setAddress(d.address || '');
          setPlaceNaver(d.placeNaver || '');
          setPlaceKakao(d.placeKakao || '');
          setQuiry(d.quiry || '');
          setYoutube(d.youtube || '');
          setBlog(d.blog || '');
          setInstar(d.instar || '');
          setFacebook(d.facebook || '');
          setMainPastorMessage(d.mainPastorMessage || '');
          setMainPastorImage(d.mainPastorImage || '');
          let greetingSub = 'Welcome Home';
          let greetingTitle = '함께 예배하고 이웃을 사랑하는 공동체';
          let greetingDesc = '';
          try {
            const greeting = d.churchGreeting
              ? (typeof d.churchGreeting === 'string' ? JSON.parse(d.churchGreeting || '{}') : d.churchGreeting)
              : {};
            greetingSub = greeting.sub ?? 'Welcome Home';
            greetingTitle = greeting.title ?? '함께 예배하고 이웃을 사랑하는 공동체';
            greetingDesc = greeting.desc ?? '';
          } catch {
            greetingSub = 'Welcome Home';
            greetingTitle = '함께 예배하고 이웃을 사랑하는 공동체';
            greetingDesc = '';
          }
          setChurchGreetingSub(greetingSub);
          setChurchGreetingTitle(greetingTitle);
          setChurchGreetingDesc(greetingDesc);
          const career = d.mainPastorCareer
            ? (typeof d.mainPastorCareer === 'string' ? JSON.parse(d.mainPastorCareer || '[]') : d.mainPastorCareer)
            : [];
          const pastorCareerLinesLoaded = Array.isArray(career) && career.length > 0 ? career : [''];
          setPastorCareerLines(pastorCareerLinesLoaded);
          const wtimes = d.worshipTimes
            ? (typeof d.worshipTimes === 'string' ? JSON.parse(d.worshipTimes || '[]') : d.worshipTimes)
            : [];
          const worshipRowsLoaded =
            Array.isArray(wtimes) && wtimes.length > 0
              ? wtimes.map((w: WorshipTime) => ({ ...w, dayOfWeek: w.dayOfWeek ?? '' }))
              : [{ worshipName: '', dayOfWeek: '', time: '', place: '', notice: '' }];
          setWorshipsTimes(worshipRowsLoaded);
          const mainNames = parseMainImageNameFromDb(d.imageMainName);
          const mainSlotsLoaded: MainImageSlot[] = mainNames.map((serverName) => ({
            serverName,
            file: null,
            previewUrl: '',
          }));
          setMainImages(mainSlotsLoaded);
          // 로드된 데이터를 lastSaved로 설정 (dirty 스냅샷과 동일 구조)
          lastSavedIntroRef.current = buildIntroDirtySnapshot({
            churchName: d.churchName || '',
            mainPastor: d.mainPastor || '',
            religiousbody: d.religiousbody || '',
            address: d.address || '',
            quiry: d.quiry || '',
            youtube: d.youtube || '',
            blog: d.blog || '',
            instar: d.instar || '',
            facebook: d.facebook || '',
            mainPastorMessage: d.mainPastorMessage || '',
            churchGreetingSub: greetingSub,
            churchGreetingTitle: greetingTitle,
            churchGreetingDesc: greetingDesc,
            pastorCareerLines: pastorCareerLinesLoaded,
            worshipsTimes: worshipRowsLoaded,
            placeNaver: d.placeNaver || '',
            placeKakao: d.placeKakao || '',
            mainImages: mainSlotsLoaded,
            mainPastorImage: d.mainPastorImage || '',
            mainPastorImageFile: null,
          });
          setDirtyTabs((prev) => ({ ...prev, intro: false }));
          // servants/sermon/gallery도 로드 시점 기준으로 lastSaved 설정 (서버에서 별도 fetch 없이 빈 배열로)
          lastSavedServantsRef.current = JSON.stringify({
            mainPastor: d.mainPastor || '',
            mainPastorMessage: d.mainPastorMessage || '',
            pastorCareerLines: Array.isArray(career) && career.length > 0 ? career : [''],
            showPastorCareer: true,
            serversData: [{ title: '', serverName: '', duty: '', notice: '', image: '' }],
          });
          lastSavedSermonRef.current = JSON.stringify([]);
          lastSavedGalleryRef.current = JSON.stringify([]);
        } else {
          // 데이터 없음 (신규) - 빈 상태를 lastSaved로 설정 (폼 초기값과 동일)
          lastSavedIntroRef.current = buildIntroDirtySnapshot({
            churchName: '',
            mainPastor: '',
            religiousbody: '',
            address: '',
            quiry: '',
            youtube: '',
            blog: '',
            instar: '',
            facebook: '',
            mainPastorMessage: '',
            churchGreetingSub: 'Welcome Home',
            churchGreetingTitle: '함께 예배하고 이웃을 사랑하는 공동체',
            churchGreetingDesc: '',
            pastorCareerLines: [''],
            worshipsTimes: [{ worshipName: '', dayOfWeek: '', time: '', place: '', notice: '' }],
            placeNaver: '',
            placeKakao: '',
            mainImages: emptyMainImageSlots(),
            mainPastorImage: '',
            mainPastorImageFile: null,
          });
          lastSavedServantsRef.current = JSON.stringify({
            mainPastor: '', mainPastorMessage: '', pastorCareerLines: [''], showPastorCareer: true,
            serversData: [{ title: '', serverName: '', duty: '', notice: '', image: '' }],
          });
          lastSavedSermonRef.current = JSON.stringify([]);
          lastSavedGalleryRef.current = JSON.stringify([]);
        }
        // servants, sermon, gallery 데이터 로드 (기존 전단지 수정 시)
        Promise.all([
          axios.post(`${MainURL}/bookletnoticecreate/getdataserverspart`, { id: churchMainId }),
          axios.post(`${MainURL}/bookletnoticecreate/getdatasermonpart`, { id: churchMainId }),
          axios.post(`${MainURL}/bookletnoticecreate/getdatagallerypart`, { id: churchMainId }),
        ])
          .then(([serversRes, sermonRes, galleryRes]) => {
            const d = res.data?.[0];
            const career = d?.mainPastorCareer
              ? (typeof d.mainPastorCareer === 'string' ? JSON.parse(d.mainPastorCareer || '[]') : d.mainPastorCareer)
              : [];
            if (serversRes.data && Array.isArray(serversRes.data) && serversRes.data.length > 0) {
              const list = serversRes.data.map((row: Record<string, unknown>) => mapServerRowFromApi(row));
              setServersData(list);
              lastSavedServantsRef.current = JSON.stringify({
                mainPastor: d?.mainPastor || '',
                mainPastorMessage: d?.mainPastorMessage || '',
                pastorCareerLines: Array.isArray(career) && career.length > 0 ? career : [''],
                showPastorCareer: true,
                serversData: list,
              });
            }
            if (sermonRes.data && Array.isArray(sermonRes.data) && sermonRes.data.length > 0) {
              const list = sermonRes.data.map((v: { title?: string; url?: string; thumbnail?: string }) => ({
                title: v.title || '',
                url: v.url || '',
                thumbnail: v.thumbnail || '',
              }));
              setSermonVideos(list);
              lastSavedSermonRef.current = JSON.stringify(list);
            }
            if (galleryRes.data && Array.isArray(galleryRes.data) && galleryRes.data.length > 0) {
              const list = galleryRes.data.map((g: { image?: string; title?: string; description?: string }) => ({
                image: g.image || '',
                title: g.title || '',
                description: g.description || '',
              }));
              setGalleryData(list);
              lastSavedGalleryRef.current = JSON.stringify(list);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [churchMainId]);

  // intro 탭 dirty 감지 (lastSavedRef는 fetch 시 또는 save 성공 시 설정)
  useEffect(() => {
    if (lastSavedIntroRef.current === null) return;
    const snapshot = buildIntroDirtySnapshot({
      churchName,
      mainPastor,
      religiousbody,
      address,
      quiry,
      youtube,
      blog,
      instar,
      facebook,
      mainPastorMessage,
      churchGreetingSub,
      churchGreetingTitle,
      churchGreetingDesc,
      pastorCareerLines,
      worshipsTimes,
      placeNaver,
      placeKakao,
      mainImages,
      mainPastorImage,
      mainPastorImageFile,
    });
    const isDirty = snapshot !== lastSavedIntroRef.current;
    setDirtyTabs((prev) => (prev.intro !== isDirty ? { ...prev, intro: isDirty } : prev));
  }, [
    churchName,
    mainPastor,
    religiousbody,
    address,
    quiry,
    youtube,
    blog,
    instar,
    facebook,
    mainPastorMessage,
    churchGreetingSub,
    churchGreetingTitle,
    churchGreetingDesc,
    pastorCareerLines,
    worshipsTimes,
    placeNaver,
    placeKakao,
    mainImages,
    mainPastorImage,
    mainPastorImageFile,
  ]);

  // servants 탭 dirty 감지
  useEffect(() => {
    if (lastSavedServantsRef.current === null) return;
    const snapshot = JSON.stringify({
      mainPastor,
      mainPastorMessage,
      pastorCareerLines,
      showPastorCareer,
      serversData: serversData.map((s) => ({
        title: s.title,
        serverName: s.serverName,
        duty: s.duty,
        notice: s.notice,
        image: s.imageFile ? '__NEW__' : s.image,
      })),
    });
    const isDirty = snapshot !== lastSavedServantsRef.current;
    setDirtyTabs((prev) => (prev.servants !== isDirty ? { ...prev, servants: isDirty } : prev));
  }, [mainPastor, mainPastorMessage, pastorCareerLines, showPastorCareer, serversData]);

  // sermon 탭 dirty 감지
  useEffect(() => {
    if (lastSavedSermonRef.current === null) return;
    const snapshot = JSON.stringify(
      sermonVideos.map((v) => ({
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnailFile ? '__NEW__' : v.thumbnail,
      }))
    );
    const isDirty = snapshot !== lastSavedSermonRef.current;
    setDirtyTabs((prev) => (prev.sermon !== isDirty ? { ...prev, sermon: isDirty } : prev));
  }, [sermonVideos]);

  // gallery 탭 dirty 감지
  useEffect(() => {
    if (lastSavedGalleryRef.current === null) return;
    const snapshot = JSON.stringify(
      galleryData.map((g) => ({
        image: g.imageFile ? '__NEW__' : g.image,
        title: g.title,
        description: g.description,
      }))
    );
    const isDirty = snapshot !== lastSavedGalleryRef.current;
    setDirtyTabs((prev) => (prev.gallery !== isDirty ? { ...prev, gallery: isDirty } : prev));
  }, [galleryData]);

  const galleryPreviewItems = useMemo(
    () =>
      galleryData
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !!(item.imageUrl || item.image)),
    [galleryData]
  );

  useEffect(() => {
    setGalleryPreviewIndex((idx) => {
      const n = galleryPreviewItems.length;
      if (n === 0) return 0;
      return Math.min(idx, n - 1);
    });
  }, [galleryPreviewItems]);

  const handlePrevClick = () => {
    // 탭 이동은 상단 탭 클릭으로만 (저장 후 이동 가능)
    const currentIndex = TAB_LIST.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      const targetTab = TAB_LIST[currentIndex - 1].id;
      handleTabClick(targetTab);
    }
  };

  const handleTabClick = (tabId: typeof activeTab) => {
    if (tabId === activeTab) return;
    if (dirtyTabs[activeTab]) {
      alert('변경 사항을 저장한 후 탭을 이동해 주세요.');
      return;
    }
    setActiveTab(tabId);
  };

  const handleNextTabClick = () => {
    const currentIndex = TAB_LIST.findIndex((t) => t.id === activeTab);
    if (currentIndex < TAB_LIST.length - 1) {
      const targetTab = TAB_LIST[currentIndex + 1].id;
      handleTabClick(targetTab);
    }
  };

  const handleCompleteClick = async () => {
    if (dirtyTabs[activeTab]) {
      alert('변경 사항을 저장한 후 완료해 주세요.');
      return;
    }
    if (!churchMainId) {
      alert('먼저 저장을 완료해 주세요.');
      return;
    }
    try {
      setSaveLoading(true);
      await axios.post(`${MainURL}/bookletnoticecreate/generateNoticeHtml`, {
        churchMainId,
      });
      navigate('/service/bookletnoticecomplete');
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('완료 HTML 생성 실패:', e);
      alert('완료 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveClick = async () => {
    if (saveLoading) return;
    let currentChurchMainId = churchMainId;

    try {
      setSaveLoading(true);

      if (activeTab === 'intro') {
        const formData = new FormData();
        if (currentChurchMainId) formData.append('churchMainId', currentChurchMainId);
        if (userAccount) formData.append('userAccount', userAccount);
        if (!currentChurchMainId) {
          formData.append('templateId', templateId);
          if (ordererName) formData.append('ordererName', ordererName);
          if (ordererPhone) formData.append('ordererPhone', ordererPhone);
        }
        formData.append('churchName', churchName);
        formData.append('mainPastor', mainPastor);
        formData.append('religiousbody', religiousbody);
        formData.append('address', address);
        formData.append('quiry', quiry);
        formData.append('youtube', youtube);
        formData.append('blog', blog);
        formData.append('instar', instar);
        formData.append('facebook', facebook);
        formData.append('mainPastorMessage', mainPastorMessage);
        formData.append('churchGreeting', JSON.stringify({ sub: churchGreetingSub, title: churchGreetingTitle, desc: churchGreetingDesc }));
        formData.append('mainPastorCareer', JSON.stringify(showPastorCareer ? pastorCareerList : []));
        formData.append('worshipTimes', JSON.stringify(worshipsTimes));
        formData.append('placeNaver', placeNaver);
        formData.append('placeKakao', placeKakao);
        formData.append('imageMainName', serializeMainImageNameForDb(mainImages.map((m) => m.serverName)));
        for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i++) {
          if (mainImages[i].file) {
            formData.append(`mainImage_${i}`, mainImages[i].file!);
          }
        }
        if (mainPastorImageFile) {
          formData.append('mainPastorImage', mainPastorImageFile);
        } else if (mainPastorImage) {
          formData.append('mainPastorImageName', mainPastorImage);
        }
        const saveUrl = currentChurchMainId
          ? `${MainURL}/bookletnoticecreate/saveIntro?churchMainId=${encodeURIComponent(currentChurchMainId)}`
          : `${MainURL}/bookletnoticecreate/saveIntro`;
        const saveRes = await axios.post(saveUrl, formData);
        if (saveRes.data?.id) {
          setChurchMainId(String(saveRes.data.id));
        }
        if (saveRes.data?.mainPastorImage) {
          setMainPastorImage(saveRes.data.mainPastorImage);
          setMainPastorImageFile(null);
          setMainPastorImageUrl('');
        }
        if (saveRes.data?.imageMainName != null) {
          const savedNames = parseMainImageNameFromDb(saveRes.data.imageMainName);
          setMainImages(savedNames.map((serverName) => ({ serverName, file: null, previewUrl: '' })));
        }
        const mainPastorImageSnap =
          saveRes.data?.mainPastorImage !== undefined && saveRes.data?.mainPastorImage !== null
            ? saveRes.data.mainPastorImage
            : mainPastorImage;
        let snapMainImages = mainImages;
        if (saveRes.data?.imageMainName != null) {
          const savedNamesSnap = parseMainImageNameFromDb(saveRes.data.imageMainName);
          snapMainImages = savedNamesSnap.map((serverName) => ({ serverName, file: null, previewUrl: '' }));
        }
        lastSavedIntroRef.current = buildIntroDirtySnapshot({
          churchName,
          mainPastor,
          religiousbody,
          address,
          quiry,
          youtube,
          blog,
          instar,
          facebook,
          mainPastorMessage,
          churchGreetingSub,
          churchGreetingTitle,
          churchGreetingDesc,
          pastorCareerLines,
          worshipsTimes,
          placeNaver,
          placeKakao,
          mainImages: snapMainImages,
          mainPastorImage: mainPastorImageSnap,
          mainPastorImageFile: null,
        });
        setDirtyTabs((prev) => ({ ...prev, intro: false }));
      } else if (activeTab === 'servants') {
        if (!currentChurchMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        // 담임목사 인사말·약력 저장 (churchMain 업데이트)
        const introFormData = new FormData();
        introFormData.append('churchMainId', currentChurchMainId);
        if (userAccount) introFormData.append('userAccount', userAccount);
        introFormData.append('churchName', churchName);
        introFormData.append('mainPastor', mainPastor);
        introFormData.append('religiousbody', religiousbody);
        introFormData.append('address', address);
        introFormData.append('quiry', quiry);
        introFormData.append('youtube', youtube);
        introFormData.append('blog', blog);
        introFormData.append('instar', instar);
        introFormData.append('facebook', facebook);
        introFormData.append('mainPastorMessage', mainPastorMessage);
        introFormData.append('churchGreeting', JSON.stringify({ sub: churchGreetingSub, title: churchGreetingTitle, desc: churchGreetingDesc }));
        introFormData.append('mainPastorCareer', JSON.stringify(showPastorCareer ? pastorCareerList : []));
        introFormData.append('worshipTimes', JSON.stringify(worshipsTimes));
        introFormData.append('placeNaver', placeNaver);
        introFormData.append('placeKakao', placeKakao);
        introFormData.append('imageMainName', serializeMainImageNameForDb(mainImages.map((m) => m.serverName)));
        for (let i = 0; i < MAIN_IMAGE_SLOT_COUNT; i++) {
          if (mainImages[i].file) {
            introFormData.append(`mainImage_${i}`, mainImages[i].file!);
          }
        }
        if (mainPastorImageFile) {
          introFormData.append('mainPastorImage', mainPastorImageFile);
        } else if (mainPastorImage) {
          introFormData.append('mainPastorImageName', mainPastorImage);
        }
        const introRes = await axios.post(
          `${MainURL}/bookletnoticecreate/saveIntro?churchMainId=${encodeURIComponent(currentChurchMainId)}`,
          introFormData
        );
        if (introRes.data?.imageMainName != null) {
          const introSavedNames = parseMainImageNameFromDb(introRes.data.imageMainName);
          setMainImages(introSavedNames.map((serverName) => ({ serverName, file: null, previewUrl: '' })));
        }
        if (introRes.data?.mainPastorImage) {
          setMainPastorImage(introRes.data.mainPastorImage);
          setMainPastorImageFile(null);
          setMainPastorImageUrl('');
        }
        // 섬김이들 저장
        const formData = new FormData();
        formData.append('churchMainId', currentChurchMainId);
        formData.append(
          'serversData',
          JSON.stringify(
            serversData.map((s) => ({
              title: s.title,
              serverName: s.serverName,
              duty: s.duty,
              notice: s.notice,
              image: s.imageFile ? '' : (s.image || ''),
            }))
          )
        );
        serversData.forEach((s, i) => {
          if (s.imageFile) formData.append(`serverImage_${i}`, s.imageFile);
        });
        const servantsRes = await axios.post(
          `${MainURL}/bookletnoticecreate/saveServants?churchMainId=${encodeURIComponent(currentChurchMainId)}`,
          formData
        );
        const serverImages = servantsRes.data?.serverImages as string[] | undefined;
        const nextServersData = serversData.map((s, i) => ({
          ...s,
          imageFile: null,
          imageUrl: undefined,
          image: Array.isArray(serverImages) && serverImages[i] !== undefined ? serverImages[i] : s.image,
        }));
        setServersData(nextServersData);
        lastSavedServantsRef.current = JSON.stringify({
          mainPastor,
          mainPastorMessage,
          pastorCareerLines,
          showPastorCareer,
          serversData: nextServersData.map((s) => ({
            title: s.title,
            serverName: s.serverName,
            duty: s.duty,
            notice: s.notice,
            image: s.image,
          })),
        });
        setDirtyTabs((prev) => ({ ...prev, servants: false }));
      } else if (activeTab === 'sermon') {
        if (!currentChurchMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        const formData = new FormData();
        formData.append('churchMainId', currentChurchMainId);
        formData.append(
          'sermonVideos',
          JSON.stringify(
            sermonVideos.map((v) => ({
              title: v.title,
              url: v.url,
              thumbnail: v.thumbnailFile ? '' : (v.thumbnail || ''),
            }))
          )
        );
        sermonVideos.forEach((v, i) => {
          if (v.thumbnailFile) formData.append(`sermonThumb_${i}`, v.thumbnailFile);
        });
        const sermonRes = await axios.post(
          `${MainURL}/bookletnoticecreate/saveSermon?churchMainId=${encodeURIComponent(currentChurchMainId)}`,
          formData
        );
        const thumbs = sermonRes.data?.thumbnails as string[] | undefined;
        const nextSermon = sermonVideos.map((v, i) => ({
          ...v,
          thumbnailFile: null,
          thumbnailUrl: undefined,
          thumbnail: Array.isArray(thumbs) && thumbs[i] !== undefined ? thumbs[i] : v.thumbnail,
        }));
        setSermonVideos(nextSermon);
        lastSavedSermonRef.current = JSON.stringify(
          nextSermon.map((v) => ({ title: v.title, url: v.url, thumbnail: v.thumbnail }))
        );
        setDirtyTabs((prev) => ({ ...prev, sermon: false }));
      } else if (activeTab === 'gallery') {
        if (!currentChurchMainId) {
          alert('먼저 소개 탭을 저장해 주세요.');
          return;
        }
        const formData = new FormData();
        formData.append('churchMainId', currentChurchMainId);
        formData.append(
          'galleryData',
          JSON.stringify(
            galleryData.map((g) => ({
              image: g.imageFile ? '' : (g.image || ''),
              title: g.title || '',
              description: g.description || '',
            }))
          )
        );
        galleryData.forEach((g, i) => {
          if (g.imageFile) formData.append(`galleryImage_${i}`, g.imageFile);
        });
        const galleryRes = await axios.post(
          `${MainURL}/bookletnoticecreate/saveGallery?churchMainId=${encodeURIComponent(currentChurchMainId)}`,
          formData
        );
        const gImages = galleryRes.data?.galleryImages as string[] | undefined;
        const nextGallery = galleryData.map((g, i) => ({
          ...g,
          imageFile: null,
          imageUrl: undefined,
          image: Array.isArray(gImages) && gImages[i] !== undefined ? gImages[i] : g.image,
        }));
        setGalleryData(nextGallery);
        lastSavedGalleryRef.current = JSON.stringify(
          nextGallery.map((g) => ({ image: g.image, title: g.title, description: g.description }))
        );
        setDirtyTabs((prev) => ({ ...prev, gallery: false }));
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

  const onCompletePost = (data: { address: string }) => {
    setAddress(data.address);
    setIsViewAddress(false);
  };

  const pastorCareerList = pastorCareerLines.map((s) => s.trim()).filter(Boolean);

  const addPastorCareerLine = () => {
    setPastorCareerLines((prev) => [...prev, '']);
  };

  const removePastorCareerLine = (index: number) => {
    setPastorCareerLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']
    );
  };

  const updatePastorCareerLine = (index: number, value: string) => {
    setPastorCareerLines((prev) =>
      prev.map((line, i) => (i === index ? value : line))
    );
  };

  const addWorshipTime = () => {
    setWorshipsTimes((prev) => [
      ...prev,
      { worshipName: '', dayOfWeek: '', time: '', place: '', notice: '' },
    ]);
  };

  const updateWorshipTime = (index: number, field: keyof WorshipTime, value: string) => {
    setWorshipsTimes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addServerItem = () => {
    setServersData((prev) => [
      ...prev,
      { title: '', serverName: '', duty: '', notice: '', image: '' },
    ]);
  };

  const removeServerItem = (index: number) => {
    setServersData((prev) =>
      prev.length > 1
        ? prev.filter((_, i) => i !== index)
        : [{ title: '', serverName: '', duty: '', notice: '', image: '' }]
    );
  };

  const updateServerItem = (index: number, field: keyof ServerItem, value: string) => {
    setServersData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const onServerImageDrop = useCallback(
    async (index: number, acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      try {
        setServerImageLoading((prev) => ({ ...prev, [index]: true }));
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
        const resizingBlob = await imageCompression(file, options);
        const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
        const regex = resizingBlob.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const newFile = new File([resizingBlob], `${dateStr}_${regexSlice}`, {
          type: file.type,
        });
        const url = URL.createObjectURL(newFile);
        setServersData((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, imageFile: newFile, imageUrl: url, image: newFile.name }
              : item
          )
        );
      } catch (error) {
        console.error('이미지 리사이징 중 오류 발생:', error);
      } finally {
        setServerImageLoading((prev) => ({ ...prev, [index]: false }));
        serverInputResetFns.current[index]?.();
      }
    },
    []
  );

  const registerServerInputReset = useCallback((index: number, reset: () => void) => {
    serverInputResetFns.current[index] = reset;
  }, []);

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

  const onPastorImageDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    try {
      setMainPastorImageLoading(true);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 800 };
      const resizingBlob = await imageCompression(file, options);
      const regex = file.name.replace(/[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g, '').slice(-15);
      const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
      const newFile = new File([resizingBlob], `${dateStr}_${regex}`, { type: file.type });
      const url = URL.createObjectURL(newFile);
      setMainPastorImageFile(newFile);
      setMainPastorImageUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setMainPastorImageLoading(false);
    }
  }, []);
  const clearPastorImage = () => {
    setMainPastorImageFile(null);
    setMainPastorImageUrl('');
    setMainPastorImage('');
  };

  const addSermonVideo = () => {
    setSermonVideos((prev) => [...prev, { title: '', url: '', thumbnail: '' }]);
  };
  const removeSermonVideo = (index: number) => {
    setSermonVideos((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ title: '', url: '', thumbnail: '' }]
    );
  };
  const updateSermonVideo = (index: number, field: keyof SermonVideoItem, value: string) => {
    setSermonVideos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const onSermonThumbDrop = useCallback(
    async (index: number, acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      try {
        setSermonThumbLoading((prev) => ({ ...prev, [index]: true }));
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
        const resizingBlob = await imageCompression(file, options);
        const regex = file.name.replace(/[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g, '').slice(-15);
        const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
        const newFile = new File([resizingBlob], `${dateStr}_${regex}`, { type: file.type });
        const url = URL.createObjectURL(newFile);
        setSermonVideos((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, thumbnailFile: newFile, thumbnailUrl: url, thumbnail: newFile.name } : item
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setSermonThumbLoading((prev) => ({ ...prev, [index]: false }));
        sermonThumbResetFns.current[index]?.();
      }
    },
    []
  );
  const clearSermonThumb = (index: number) => {
    setSermonVideos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, thumbnailFile: null, thumbnailUrl: '', thumbnail: '' } : item))
    );
  };

  const addGalleryItem = () => {
    setGalleryData((prev) => [...prev, { image: '', title: '', description: '' }]);
  };
  const removeGalleryItem = (index: number) => {
    setGalleryData((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ image: '', title: '', description: '' }]
    );
  };
  const updateGalleryItem = (index: number, field: 'title' | 'description', value: string) => {
    setGalleryData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const onGalleryImageDrop = useCallback(
    async (index: number, acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      try {
        setGalleryImageLoading((prev) => ({ ...prev, [index]: true }));
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
        const resizingBlob = await imageCompression(file, options);
        const regex = file.name.replace(/[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g, '').slice(-15);
        const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
        const newFile = new File([resizingBlob], `${dateStr}_${regex}`, { type: file.type });
        const url = URL.createObjectURL(newFile);
        setGalleryData((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, imageFile: newFile, imageUrl: url, image: newFile.name } : item
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setGalleryImageLoading((prev) => ({ ...prev, [index]: false }));
        galleryImageResetFns.current[index]?.();
      }
    },
    []
  );
  const clearGalleryImage = (index: number) => {
    setGalleryData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, imageFile: null, imageUrl: '', image: '' } : item
      )
    );
  };

  const registerSermonThumbReset = useCallback((index: number, reset: () => void) => {
    sermonThumbResetFns.current[index] = reset;
  }, []);
  const registerGalleryImageReset = useCallback((index: number, reset: () => void) => {
    galleryImageResetFns.current[index] = reset;
  }, []);

  const clearServerImage = useCallback((index: number) => {
    setServersData((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, imageFile: null, imageUrl: '', image: '' }
          : item
      )
    );
  }, []);

  const serversDataList = serversData.reduce<{ title: string; serverList: ServerItem[] }[]>(
    (acc, curr) => {
      const title = curr.title;
      const existingGroup = acc.find((group) => group.title === title);
      const listItem: ServerItem = {
        title: curr.title,
        serverName: curr.serverName,
        duty: curr.duty,
        notice: curr.notice,
        image: curr.image,
        imageUrl: curr.imageUrl,
      };
      if (existingGroup) {
        existingGroup.serverList.push(listItem);
      } else {
        acc.push({ title, serverList: [listItem] });
      }
      return acc;
    },
    []
  );

  return (
    <div className="notice-create">
      <div className="notice-create__body">
        <div className="notice-create__inner">
          {/* 왼쪽: 모바일 미리보기 (Header와 함께 화면에 딱 맞게) */}
        <aside className="notice-create__preview-wrap">
          <div className="notice-create__phone-frame">
            {/* iPhone 노치 / 다이나믹 아일랜드 */}
            <div className="notice-create__phone-notch" />
            <div className="notice-create__phone-screen">
              <div className="notice-create__preview">
                {/* 상단 메인 이미지 + 오버레이 (religiousbody, churchName) */}
                <div className="notice-create__preview-hero">
                  <MainHeroCarousel
                    fill
                    imageSrcs={mainImageSrcsForPreview(mainImages)}
                    imgClassName="notice-create__preview-hero-img"
                    placeholder={
                      <div className="notice-create__preview-hero-placeholder">메인 이미지</div>
                    }
                  />
                  <div className="notice-create__preview-hero-overlay">
                    {religiousbody && (
                      <p className="notice-create__preview-hero-sub">{religiousbody}</p>
                    )}
                    <h1 className="notice-create__preview-hero-title">{churchName || '교회명'}</h1>
                  </div>
                </div>

                {/* 탭: 소개 | 섬김이들 | 설교영상 | 갤러리 (선택한 디자인 색상 적용) */}
                <div className={`notice-create__tabs-wrap notice-create__tabs-wrap--${templateId}`}>
                <div className="notice-create__preview-tabs">
                  {TAB_LIST.map((tab) => (
                    <div
                      key={tab.id}
                      className={`notice-create__preview-tab ${activeTab === tab.id ? 'on' : ''}`}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
                </div>

                {/* 탭별 미리보기 내용 */}
                <div
                  className={`notice-create__preview-body ${activeTab === 'intro' ? `notice-create__preview-body--${templateId}` : ''}${activeTab === 'gallery' ? ' notice-create__preview-body--gallery' : ''}`}
                >
                  {activeTab === 'intro' ? (
                  <>
                  {TEMPLATE_INTRO_ORDER[templateId].map((blockId: IntroBlockId) => {
                    if (blockId === 'greeting') {
                      return (
                        <div key="greeting" className="notice-create__preview-welcome">
                          <p className="notice-create__preview-welcome-sub">{churchGreetingSub || 'Welcome Home'}</p>
                          <h2 className="notice-create__preview-welcome-title">
                            {churchGreetingTitle || '함께 예배하고 이웃을 사랑하는 공동체'}
                          </h2>
                          <p className="notice-create__preview-welcome-desc">
                            {churchGreetingDesc || (
                              <span className="notice-create__preview-welcome-placeholder">
                                하나님을 사랑하고 이웃을 내 몸과 같이 사랑하는 것을 삶으로 실천합니다. 따뜻한 환대와 깊이 있는 말씀이 있는 곳, {churchName || '교회'}에 오신 여러분을 환영합니다.
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    }
                    if (blockId === 'worship') {
                      return (
                        <div key="worship">
                          <div className="notice-create__preview-section-label">
                            <span className="notice-create__preview-chip-icon">🕐</span>
                            예배 안내
                          </div>
                          {worshipsTimes.some((w) => w.worshipName || w.time || w.place) ? (
                            <div className="notice-create__preview-worship-list">
                              {worshipsTimes
                                .filter((w) => w.worshipName || w.time || w.place)
                                .map((w, i) => {
                                  const timeStr = formatTimeForDisplay(w.time || '');
                                  return (
                                    <div key={i} className="notice-create__preview-worship-item">
                                      <div className="notice-create__preview-worship-line notice-create__preview-worship-line--primary">
                                        <span className="notice-create__preview-worship-name">{w.worshipName || '예배'}</span>
                                        {timeStr ? (
                                          <span className="notice-create__preview-worship-time">{timeStr}</span>
                                        ) : null}
                                      </div>
                                      {(w.dayOfWeek || w.place) ? (
                                        <div className="notice-create__preview-worship-line notice-create__preview-worship-line--meta">
                                          {w.place ? (
                                            <span className="notice-create__preview-worship-place">{w.place}</span>
                                          ) : null}
                                          {w.dayOfWeek ? (
                                            <span className="notice-create__preview-worship-day">{w.dayOfWeek}</span>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <p className="notice-create__preview-worship-empty">예배 정보를 입력해 주세요</p>
                          )}
                        </div>
                      );
                    }
                    if (blockId === 'sns') {
                      if (!(instar || youtube || facebook || blog)) {
                        return null;
                      }
                      return (
                        <div
                          key="sns"
                          className="notice-create__preview-footer-sns notice-create__preview-footer-sns--above-location"
                        >
                          {instar && (
                            <a href={instar} target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
                              <FaInstagram />
                            </a>
                          )}
                          {youtube && (
                            <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="유튜브">
                              <FaYoutube />
                            </a>
                          )}
                          {facebook && (
                            <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="페이스북">
                              <FaFacebookF />
                            </a>
                          )}
                          {blog && (
                            <a href={blog} target="_blank" rel="noopener noreferrer" aria-label="블로그">
                              <img src={naverbloglogo} alt="블로그" className="notice-create__preview-footer-blog-img" />
                            </a>
                          )}
                        </div>
                      );
                    }
                    if (blockId === 'location') {
                      return (
                        <div key="location" className="notice-create__preview-chips">
                          <div className="notice-create__preview-chip">
                            <span className="notice-create__preview-chip-icon">📍</span>
                            <div>
                              <p className="notice-create__preview-chip-label">위치</p>
                              <p className="notice-create__preview-chip-value">{address || '서울시 강남구'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (blockId === 'mapActions') {
                      return (
                        <div key="mapActions">
                          <div className="notice-create__preview-actions">
                            <div className="notice-create__preview-btn-row">
                              <a
                                href={placeNaver || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="notice-create__preview-btn notice-create__preview-btn--naver"
                              >
                                <img src={naverlogo} alt="네이버" className="notice-create__preview-map-icon" />
                                네이버 지도
                              </a>
                              <a
                                href={placeKakao || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="notice-create__preview-btn notice-create__preview-btn--kakao"
                              >
                                <img src={kakaologo} alt="카카오" className="notice-create__preview-map-icon" />
                                카카오 지도
                              </a>
                              </div>
                            <div className="notice-create__preview-btn-row">
                              <div className="notice-create__preview-btn notice-create__preview-btn--secondary">
                                📞 문의하기
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div className="notice-create__preview-footer">
                    <p className="notice-create__preview-footer-info">
                      {quiry && `${quiry}`}
                      {quiry && address && ' | '}
                      {address}
                      <br />
                      © {new Date().getFullYear()} {churchName || '교회'} All Rights Reserved.
                    </p>
                  </div>
                  </>
                  ) : activeTab === 'servants' ? (
                    <div className="notice-create__preview-servants">
                      <div className="notice-create__preview-pastor-block">
                        <div className="notice-create__preview-pastor-head">
                          <p className="notice-create__preview-pastor-label">담임목사</p>
                          {mainPastor && (
                            <p className="notice-create__preview-pastor-name">{mainPastor}</p>
                          )}
                        </div>
                        <div className="notice-create__preview-pastor-body">
                          {(mainPastorImageUrl || mainPastorImage) && (
                            <div className="notice-create__preview-pastor-photo">
                              <img
                                src={mainPastorImageUrl || `${MainURL}/images/bookletnotice/pastors/${mainPastorImage}`}
                                alt="담임목사"
                              />
                            </div>
                          )}
                          <div className="notice-create__preview-pastor-copy">
                            <div className="notice-create__preview-pastor-greeting">
                              <p className="notice-create__preview-pastor-label">인사말</p>
                              <p className="notice-create__preview-pastor-text">
                                {mainPastorMessage || (
                                  <span className="notice-create__preview-welcome-placeholder">
                                    인사말을 입력해 주세요
                                  </span>
                                )}
                              </p>
                            </div>
                            {showPastorCareer && (
                              <div className="notice-create__preview-pastor-career">
                                <p className="notice-create__preview-pastor-label">담임목사 약력</p>
                                <p className="notice-create__preview-pastor-text">
                                  {pastorCareerList.length > 0 ? (
                                    pastorCareerList.map((line, i) => (
                                      <span key={i}>
                                        {i > 0 && <br />}
                                        {line}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="notice-create__preview-welcome-placeholder">
                                      약력을 입력해 주세요
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <TemplateServers
                        serversDataList={serversDataList.filter(
                          (g) =>
                            g.title ||
                            g.serverList.some(
                              (s) => s.serverName || s.duty || s.notice || s.image || s.imageUrl
                            )
                        )}
                      />
                    </div>
                  ) : activeTab === 'sermon' ? (
                    <div className="notice-create__preview-sermon">
                      <TemplateSermon
                        sermonVideos={sermonVideos
                          .filter((v) => v.title || v.url || v.thumbnailUrl || v.thumbnail)
                          .map((v) => ({
                            title: v.title,
                            url: v.url,
                            thumbnail: v.thumbnailUrl || v.thumbnail,
                          }))}
                        youtube={youtube}
                        mainPastor={mainPastor}
                      />
                    </div>
                  ) : activeTab === 'gallery' ? (
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
                              onClick={() => setGalleryPreviewIndex(thumbIdx)}
                            >
                              <img src={galleryItemPreviewSrc(item)} alt="" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="notice-create__preview-placeholder">
                      {TAB_LIST.find((t) => t.id === activeTab)?.label} 탭 미리보기
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 오른쪽: 입력 폼 (BookletNoticeDetail 항목 기준) */}
        <section className="notice-create__form-wrap">
          <div className="notice-create__form-tabs">
            {TAB_LIST.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`notice-create__form-tab ${activeTab === tab.id ? 'on' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'intro' ? (
          <>
          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">메인 이미지</h3>
            <p className="notice-create__main-images-hint">
              최대 5장까지 첨부할 수 있습니다. 여러 장을 넣으면 왼쪽 미리보기 상단에서 슬라이드로 볼 수 있습니다.
            </p>
            <div className="notice-create__form">
              <div className="notice-create__label">
                <span className="notice-create__label-text">이미지 슬롯 (1~5)</span>
                <div className="notice-create__main-images-slots">
                  {mainImages.map((slot, i) => {
                    const src =
                      slot.previewUrl ||
                      (slot.serverName
                        ? `${MainURL}/images/bookletnotice/mainimages/${slot.serverName}`
                        : '');
                    const hasImg = !!src;
                    return (
                      <div key={i} className="notice-create__main-image-slot">
                        <span className="notice-create__main-image-slot-label">{i + 1}</span>
                        {hasImg ? (
                          <div className="notice-create__main-image-slot-preview">
                            <img src={src} alt="" />
                            <button
                              type="button"
                              className="notice-create__main-image-slot-remove"
                              onClick={() => clearMainImageSlot(i)}
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
            </div>
          </div>

          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">기본 정보</h3>
            <div className="notice-create__form">
              <label className="notice-create__label">
                <span className="notice-create__label-text">교회명</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="교회명"
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">담임</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={mainPastor}
                  onChange={(e) => setMainPastor(e.target.value)}
                  placeholder="담임목사 성함"
                />
              </label>
              <div className="notice-create__label">
                <span className="notice-create__label-text">교단</span>
                <div className="notice-create__religiousbody-row">
                  {religiousbodySubSort.map((item: string, index: number) => (
                    <div
                      key={index}
                      className={`notice-create__religiousbody-item ${religiousbody === item ? 'notice-create__religiousbody-item--selected' : ''}`}
                      onClick={() => setReligiousbody(religiousbody === item ? '' : item)}
                    >
                      <input
                        type="checkbox"
                        className="notice-create__religiousbody-checkbox"
                        checked={religiousbody === item}
                        onChange={() => setReligiousbody(religiousbody === item ? '' : item)}
                      />
                      <span className="notice-create__religiousbody-checkmark" />
                      <div className="notice-create__religiousbody-imgtext">
                        <img src={`${MainURL}/siteimages/religiousbody/${item}.jpg`} alt={item} />
                        <p>{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="notice-create__label">
                <span className="notice-create__label-text">주소</span>
                <div className="notice-create__address-field">
                  {isViewAddress && address === '' ? (
                    <div className="notice-create__postcode-wrap">
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
                      className="notice-create__input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onClick={() => setIsViewAddress(true)}
                      placeholder="주소 검색 클릭"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">교회 소개 인사말</h3>
            <div className="notice-create__form">
              <label className="notice-create__label">
                <span className="notice-create__label-text">소제목</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={churchGreetingSub}
                  onChange={(e) => setChurchGreetingSub(e.target.value)}
                  placeholder="Welcome Home"
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">인사말 제목</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={churchGreetingTitle}
                  onChange={(e) => setChurchGreetingTitle(e.target.value)}
                  placeholder="함께 예배하고 이웃을 사랑하는 공동체"
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">인사말 내용</span>
                <textarea
                  className="notice-create__textarea"
                  value={churchGreetingDesc}
                  onChange={(e) => setChurchGreetingDesc(e.target.value)}
                  placeholder="하나님을 사랑하고 이웃을 내 몸과 같이 사랑하는 것을 삶으로 실천합니다. 따뜻한 환대와 깊이 있는 말씀이 있는 곳, 교회에 오신 여러분을 환영합니다."
                  rows={4}
                />
              </label>
            </div>
          </div>

          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">예배안내</h3>
            {worshipsTimes.map((row, index) => (
              <div key={index} className="notice-create__worship-row">
                <div className="notice-create__form">
                  <label className="notice-create__label">
                    <span className="notice-create__label-text">예배명</span>
                    <input
                      type="text"
                      className="notice-create__input"
                      value={row.worshipName}
                      onChange={(e) =>
                        updateWorshipTime(index, 'worshipName', e.target.value)
                      }
                      placeholder="주일 1부 예배"
                    />
                  </label>
                  <label className="notice-create__label">
                    <span className="notice-create__label-text">요일</span>
                    <select
                      className="notice-create__select"
                      value={row.dayOfWeek}
                      onChange={(e) =>
                        updateWorshipTime(index, 'dayOfWeek', e.target.value)
                      }
                    >
                      {DAY_OPTIONS.map((opt) => (
                        <option key={opt.value || 'empty'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="notice-create__label notice-create__time-row">
                    <span className="notice-create__label-text">시간</span>
                    <div className="notice-create__time-selects">
                      <select
                        className="notice-create__select"
                        value={parseTime(row.time).hour}
                        onChange={(e) => {
                          const { minute } = parseTime(row.time);
                          updateWorshipTime(
                            index,
                            'time',
                            `${e.target.value}:${minute}`
                          );
                        }}
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={h} value={h}>
                            {h}시
                          </option>
                        ))}
                      </select>
                      <span className="notice-create__time-sep">:</span>
                      <select
                        className="notice-create__select"
                        value={parseTime(row.time).minute}
                        onChange={(e) => {
                          const { hour } = parseTime(row.time);
                          updateWorshipTime(
                            index,
                            'time',
                            `${hour}:${e.target.value}`
                          );
                        }}
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m}분
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="notice-create__label">
                    <span className="notice-create__label-text">장소</span>
                    <input
                      type="text"
                      className="notice-create__input"
                      value={row.place}
                      onChange={(e) =>
                        updateWorshipTime(index, 'place', e.target.value)
                      }
                      placeholder="본당"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="notice-create__add-worship"
              onClick={addWorshipTime}
            >
              + 예배 추가
            </button>
          </div>

          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">오시는길</h3>
            <div className="notice-create__form">
              <label className="notice-create__label">
                <span className="notice-create__label-text">네이버 지도 URL</span>
                <div className="notice-create__input-with-icon">
                  <input
                    type="url"
                    className="notice-create__input"
                    value={placeNaver}
                    onChange={(e) => setPlaceNaver(e.target.value)}
                    placeholder="https://map.naver.com/..."
                  />
                  <span
                    className="notice-create__form-info-icon"
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
              <label className="notice-create__label">
                <span className="notice-create__label-text">카카오 지도 URL</span>
                <div className="notice-create__input-with-icon">
                  <input
                    type="url"
                    className="notice-create__input"
                    value={placeKakao}
                    onChange={(e) => setPlaceKakao(e.target.value)}
                    placeholder="https://map.kakao.com/..."
                  />
                  <span
                    className="notice-create__form-info-icon"
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

          <div className="notice-create__form-block">
            <h3 className="notice-create__form-block-title">연락처 / SNS</h3>
            <div className="notice-create__form">
              <label className="notice-create__label">
                <span className="notice-create__label-text">문의(전화)</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="notice-create__input"
                  value={quiry}
                  onChange={(e) => setQuiry(e.target.value.replace(/\D/g, ''))}
                  placeholder="전화번호 (숫자만)"
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">유튜브 URL</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">네이버 블로그</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={blog}
                  onChange={(e) => setBlog(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">인스타그램</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={instar}
                  onChange={(e) => setInstar(e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="notice-create__label">
                <span className="notice-create__label-text">페이스북</span>
                <input
                  type="text"
                  className="notice-create__input"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>

          <div className="notice-create__nav-btns">
            <button
              type="button"
              className="notice-create__next-btn"
              onClick={handleSaveClick}
              disabled={!dirtyTabs.intro || saveLoading}
            >
              {saveLoading ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              className="notice-create__next-tab-btn"
              onClick={handleNextTabClick}
              disabled={dirtyTabs.intro}
            >
              다음 탭
            </button>
          </div>
          </>
          ) : activeTab === 'servants' ? (
            <>
              <div className="notice-create__form-block">
                <h3 className="notice-create__form-block-title">담임목사</h3>
                <div className="notice-create__form">
                  <label className="notice-create__label">
                    <span className="notice-create__label-text">이름</span>
                    <input
                      type="text"
                      className="notice-create__input"
                      value={mainPastor}
                      onChange={(e) => setMainPastor(e.target.value)}
                      placeholder="담임목사 성함"
                    />
                  </label>
                  <label className="notice-create__label notice-create__label--textarea">
                    <span className="notice-create__label-text">인사말</span>
                    <textarea
                      className="notice-create__textarea"
                      value={mainPastorMessage}
                      onChange={(e) => setMainPastorMessage(e.target.value)}
                      placeholder="인사말을 입력해 주세요"
                      rows={4}
                    />
                  </label>
                  <div className="notice-create__label">
                    <span className="notice-create__label-text">사진</span>
                    <div className="notice-create__main-image-wrap">
                      {(mainPastorImageUrl || mainPastorImage) ? (
                        <div className="notice-create__main-image-preview">
                          <img
                            src={mainPastorImageUrl || `${MainURL}/images/bookletnotice/pastors/${mainPastorImage}`}
                            alt="담임목사"
                            style={{ width: 130, height: 200, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <button
                            type="button"
                            className="notice-create__main-image-remove"
                            onClick={clearPastorImage}
                          >
                            삭제
                          </button>
                        </div>
                      ) : (
                        <MainImageDropzone onDrop={onPastorImageDrop} isLoading={mainPastorImageLoading} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="notice-create__form-block">
                <div className="notice-create__form-block-title-row">
                  <h3 className="notice-create__form-block-title">담임목사 약력</h3>
                  <label className="notice-create__label notice-create__label--checkbox">
                    <input
                      type="checkbox"
                      checked={!showPastorCareer}
                      onChange={(e) => setShowPastorCareer(!e.target.checked)}
                    />
                    <span>약력 숨기기</span>
                  </label>
                </div>
                {showPastorCareer && (
                <div className="notice-create__form">
                  <div className="notice-create__career-block">
                    <div className="notice-create__career-rows">
                      {pastorCareerLines.map((line, index) => (
                        <div key={index} className="notice-create__career-row">
                          <input
                            type="text"
                            className="notice-create__input"
                            value={line}
                            onChange={(e) =>
                              updatePastorCareerLine(index, e.target.value)
                            }
                            placeholder="예) OO대학교 신학과, OO교회 담임"
                          />
                          <button
                            type="button"
                            className="notice-create__career-remove"
                            onClick={() => removePastorCareerLine(index)}
                            title="이 행 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="notice-create__add-worship notice-create__career-add"
                      onClick={addPastorCareerLine}
                    >
                      + 행 추가
                    </button>
                  </div>
                </div>
                )}
              </div>
              <div className="notice-create__form-block">
                <h3 className="notice-create__form-block-title">섬김이들</h3>
                <div className="notice-create__server-rows">
                  {serversData.map((item, index) => (
                    <div key={index} className="notice-create__server-row">
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">부서/그룹명</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.title}
                          onChange={(e) => updateServerItem(index, 'title', e.target.value)}
                          placeholder="예) 청년부"
                        />
                      </label>
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">이름</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.serverName}
                          onChange={(e) => updateServerItem(index, 'serverName', e.target.value)}
                          placeholder="예) 홍길동"
                        />
                      </label>
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">직분</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.duty}
                          onChange={(e) => updateServerItem(index, 'duty', e.target.value)}
                          placeholder="예) 부장"
                        />
                      </label>
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">설명</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.notice}
                          onChange={(e) => updateServerItem(index, 'notice', e.target.value)}
                          placeholder="예) 청년부를 담당합니다"
                        />
                      </label>
                      <div className="notice-create__label">
                        <span className="notice-create__label-text">이미지</span>
                        <ServerImageDropzone
                          index={index}
                          imageUrl={serverFormDisplayUrl(item)}
                          isLoading={!!serverImageLoading[index]}
                          onDrop={onServerImageDrop}
                          onClear={clearServerImage}
                          onRegisterReset={registerServerInputReset}
                        />
                      </div>
                      <button
                        type="button"
                        className="notice-create__career-remove"
                        onClick={() => removeServerItem(index)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="notice-create__add-worship notice-create__career-add"
                  onClick={addServerItem}
                >
                  + 섬김이 추가
                </button>
              </div>
              <div className="notice-create__nav-btns">
                <button
                  type="button"
                  className="notice-create__next-btn"
                  onClick={handleSaveClick}
                  disabled={!dirtyTabs.servants || saveLoading}
                >
                  {saveLoading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="notice-create__prev-btn"
                  onClick={handlePrevClick}
                  disabled={dirtyTabs.servants}
                >
                  이전 탭
                </button>
                <button
                  type="button"
                  className="notice-create__next-tab-btn"
                  onClick={handleNextTabClick}
                  disabled={dirtyTabs.servants}
                >
                  다음 탭
                </button>
              </div>
            </>
          ) : activeTab === 'sermon' ? (
            <div className="notice-create__sermon">
              <div className="notice-create__form-block">
                <h3 className="notice-create__form-block-title">설교영상</h3>
                <div className="notice-create__sermon-rows">
                  {sermonVideos.map((item, index) => (
                    <div key={index} className="notice-create__server-row">
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">제목</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.title}
                          onChange={(e) => updateSermonVideo(index, 'title', e.target.value)}
                          placeholder="예) 2024년 1월 첫째 주 설교"
                        />
                      </label>
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">영상 URL</span>
                        <input
                          type="url"
                          className="notice-create__input"
                          value={item.url}
                          onChange={(e) => updateSermonVideo(index, 'url', e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </label>
                      <div className="notice-create__label">
                        <span className="notice-create__label-text">썸네일</span>
                        <ServerImageDropzone
                          index={index}
                          imageUrl={sermonThumbFormDisplayUrl(item)}
                          isLoading={!!sermonThumbLoading[index]}
                          onDrop={onSermonThumbDrop}
                          onClear={clearSermonThumb}
                          onRegisterReset={registerSermonThumbReset}
                        />
                      </div>
                      <button
                        type="button"
                        className="notice-create__career-remove"
                        onClick={() => removeSermonVideo(index)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="notice-create__add-worship" onClick={addSermonVideo}>
                  + 영상 추가
                </button>
              </div>
              <div className="notice-create__nav-btns">
                <button
                  type="button"
                  className="notice-create__next-btn"
                  onClick={handleSaveClick}
                  disabled={!dirtyTabs.sermon || saveLoading}
                >
                  {saveLoading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="notice-create__prev-btn"
                  onClick={handlePrevClick}
                  disabled={dirtyTabs.sermon}
                >
                  이전 탭
                </button>
                <button
                  type="button"
                  className="notice-create__next-tab-btn"
                  onClick={handleNextTabClick}
                  disabled={dirtyTabs.sermon}
                >
                  다음 탭
                </button>
              </div>
            </div>
          ) : activeTab === 'gallery' ? (
            <div className="notice-create__gallery">
              <div className="notice-create__form-block">
                <h3 className="notice-create__form-block-title">갤러리</h3>
                <div className="notice-create__gallery-rows">
                  {galleryData.map((item, index) => (
                    <div key={index} className="notice-create__gallery-row">
                      <div className="notice-create__label">
                        <span className="notice-create__label-text">이미지</span>
                        <ServerImageDropzone
                          index={index}
                          imageUrl={galleryFormDisplayUrl(item)}
                          isLoading={!!galleryImageLoading[index]}
                          onDrop={onGalleryImageDrop}
                          onClear={clearGalleryImage}
                          onRegisterReset={registerGalleryImageReset}
                        />
                      </div>
                      <label className="notice-create__label">
                        <span className="notice-create__label-text">사진 타이틀</span>
                        <input
                          type="text"
                          className="notice-create__input"
                          value={item.title}
                          onChange={(e) => updateGalleryItem(index, 'title', e.target.value)}
                          placeholder="사진 제목"
                        />
                      </label>
                      <label className="notice-create__label notice-create__label--textarea">
                        <span className="notice-create__label-text">설명</span>
                        <textarea
                          className="notice-create__textarea"
                          value={item.description}
                          onChange={(e) => updateGalleryItem(index, 'description', e.target.value)}
                          placeholder="사진 설명"
                          rows={2}
                        />
                      </label>
                      <button
                        type="button"
                        className="notice-create__career-remove"
                        onClick={() => removeGalleryItem(index)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="notice-create__add-worship" onClick={addGalleryItem}>
                  + 이미지 추가
                </button>
              </div>
              <div className="notice-create__nav-btns">
                <button
                  type="button"
                  className="notice-create__next-btn"
                  onClick={handleSaveClick}
                  disabled={!dirtyTabs.gallery || saveLoading}
                >
                  {saveLoading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="notice-create__prev-btn"
                  onClick={handlePrevClick}
                  disabled={dirtyTabs.gallery}
                >
                  이전 탭
                </button>
              </div>
            </div>
          ) : (
            <div className="notice-create__tab-placeholder">
              {TAB_LIST.find((t) => t.id === activeTab)?.label} 탭 내용 준비 중
            </div>
          )}

          {/* 완료 버튼 - 모든 탭 아래 */}
          <div className="notice-create__complete-wrap">
            <button
              type="button"
              className="notice-create__complete-btn"
              onClick={handleCompleteClick}
              disabled={dirtyTabs[activeTab] || saveLoading}
            >
              완료
            </button>
          </div>
       
        </section>
        </div>
        
      </div>
    </div>
  );
}
