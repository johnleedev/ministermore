import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './BookletNoticeDetail.scss';
import '../../screens/service/bookletNotice/createNotice/NoticeCreate.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import TemplateNotice from './BookletNoticeTemplates/TemplateNotice';
import TemplateServers from './BookletNoticeTemplates/TemplateServers';
import TemplateSermon from './BookletNoticeTemplates/TemplateSermon';
import TemplateGallery, { type NoticeGalleryItem } from './BookletNoticeTemplates/TemplateGallery';
import MainHeroCarousel from '../component/MainHeroCarousel';
import { parseMainImageNameFromDb } from '../component/mainImageNames';
interface PostProps {
  id: number;
  type: string;
  churchName: string;
  mainPastor: string;
  religiousbody: string;
  address: string;
  addressDetail?: string;
  quiry: string;
  youtube: string;
  blog: string;
  instar: string;
  facebook: string;
  imageMainName: string;
  mainLogo: string;
  mainPastorImage: string;
  mainPastorMessage: string;
  mainPastorCareer: string;
  worshipTimes: string;
  placeNaver: string;
  placeKakao: string;
  placeHomepage: string;
  churchGreeting?: string | { sub?: string; title?: string; desc?: string };
}

interface ServersProps {
  title: string;
  serverName: string;
  duty: string;
  notice: string;
  image: string;
}

interface SermonItem {
  id?: number;
  title: string;
  url: string;
  thumbnail: string;
  sortOrder?: number;
}

interface WorshipTimesProps {
  worshipName: string;
  dayOfWeek?: string;
  time: string;
  place: string;
  notice: string;
}

const VALID_TABS = ['info', 'servers', 'sermon', 'gallery'] as const;
type NoticeTabId = (typeof VALID_TABS)[number];

export default function BookletNoticeDetailPage() {
  const url = new URL(window.location.href);
  const ID = url.searchParams.get('id');
  const isPreview = url.searchParams.get('preview') === '1';
  const isEmbed = url.searchParams.get('embed') === '1';
  const embedSection = url.searchParams.get('section');
  const tabParam = url.searchParams.get('tab');

  const initialTab: NoticeTabId =
    tabParam && (VALID_TABS as readonly string[]).includes(tabParam) ? (tabParam as NoticeTabId) : 'info';
  const [currentSelectTab, setCurrentSelectTab] = useState<'info' | 'servers' | 'sermon' | 'gallery'>(initialTab);
  const [previewWidth, setPreviewWidth] = useState(450);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(350);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = previewWidth;
  }, [previewWidth]);

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

  const [postData, setPostData] = useState<PostProps>();
  const [pastorCareer, setPastorCareer] = useState<string[]>([]);
  const [serversData, setServersData] = useState<ServersProps[]>([]);
  const [sermonVideos, setSermonVideos] = useState<SermonItem[]>([]);
  const [galleryData, setGalleryData] = useState<NoticeGalleryItem[]>([]);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const [worshipsTimes, setWorshipsTimes] = useState<WorshipTimesProps[]>([]);

  const fetchPosts = async () => {
    if (!ID) return;
    try {
      const resBooklet = await axios.post(`${MainURL}/bookletnoticecreate/getdatabookletspart`, { id: ID });
      if (resBooklet.data?.[0]) {
        const copy = { ...resBooklet.data[0] };
        setPostData(copy);
        const worshipTimesCopy = copy.worshipTimes
          ? (typeof copy.worshipTimes === 'string' ? JSON.parse(copy.worshipTimes) : copy.worshipTimes)
          : [];
        setWorshipsTimes(Array.isArray(worshipTimesCopy) ? worshipTimesCopy : []);
        const pastorCareerCopy = copy.mainPastorCareer
          ? (typeof copy.mainPastorCareer === 'string' ? JSON.parse(copy.mainPastorCareer) : copy.mainPastorCareer)
          : [];
        setPastorCareer(Array.isArray(pastorCareerCopy) ? pastorCareerCopy : []);
      }

      const resServers = await axios.post(`${MainURL}/bookletnoticecreate/getdataserverspart`, { id: ID });
      setServersData(resServers.data || []);

      const resSermon = await axios.post(`${MainURL}/bookletnoticecreate/getdatasermonpart`, { id: ID });
      setSermonVideos(resSermon.data || []);

      try {
        const resGallery = await axios.post(`${MainURL}/bookletnoticecreate/getdatagallerypart`, { id: ID });
        setGalleryData(Array.isArray(resGallery.data) ? resGallery.data : []);
      } catch {
        setGalleryData([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [ID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
      setCurrentSelectTab(tabParam as NoticeTabId);
    }
  }, [tabParam]);

  interface ServersGroup {
    title: string;
    serverList: ServersProps[];
  }

  const mainHeroImageSrcs = useMemo(() => {
    if (!postData?.imageMainName) return [];
    return parseMainImageNameFromDb(postData.imageMainName)
      .filter(Boolean)
      .map((name) => `${MainURL}/images/bookletnotice/mainimages/${name}`);
  }, [postData?.imageMainName]);

  const serversDataList: ServersGroup[] = serversData.reduce((acc: ServersGroup[], curr: ServersProps) => {
    const title = curr.title;
    const existingGroup = acc.find((group) => group.title === title);
    const list: ServersProps = {
      title: curr.title,
      serverName: curr.serverName,
      duty: curr.duty,
      notice: curr.notice,
      image: curr.image,
    };
    if (existingGroup) {
      existingGroup.serverList.push(list);
    } else {
      acc.push({ title, serverList: [list] });
    }
    return acc;
  }, []);

  const TAB_LIST = [
    { id: 'info' as const, label: '소개' },
    { id: 'servers' as const, label: '섬김이들' },
    { id: 'sermon' as const, label: '설교영상' },
    { id: 'gallery' as const, label: '갤러리' },
  ] as const;

  const galleryPreviewItems = useMemo(
    () =>
      galleryData
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !!item.image),
    [galleryData]
  );

  useEffect(() => {
    setGalleryPreviewIndex((idx) => {
      const n = galleryPreviewItems.length;
      if (n === 0) return 0;
      return Math.min(idx, n - 1);
    });
  }, [galleryPreviewItems]);

  const greeting = useMemo(() => {
    const fallback = {
      sub: 'Welcome Home',
      title: '함께 예배하고 이웃을 사랑하는 공동체',
      desc: '',
    };
    const raw = postData?.churchGreeting;
    if (!raw) return fallback;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        sub: parsed?.sub || fallback.sub,
        title: parsed?.title || fallback.title,
        desc: parsed?.desc || '',
      };
    } catch {
      return fallback;
    }
  }, [postData?.churchGreeting]);

  const renderCurrentTabBody = () => (
    <>
      {currentSelectTab === 'info' && (
        <TemplateNotice
          greeting={greeting}
          worshipsTimes={worshipsTimes}
          postData={postData}
          sermonVideos={sermonVideos}
          galleryPreviewItems={galleryPreviewItems}
          onOpenGalleryTab={() => setCurrentSelectTab('gallery')}
          onOpenSermonTab={() => setCurrentSelectTab('sermon')}
          onOpenServersTab={() => setCurrentSelectTab('servers')}
        />
      )}
      {currentSelectTab === 'servers' && (
        <TemplateServers
          withPastorBlock
          postData={postData}
          pastorCareer={pastorCareer}
          serversDataList={serversDataList}
        />
      )}
      {currentSelectTab === 'sermon' && (
        <div className="notice-create__preview-sermon">
          <TemplateSermon
            sermonVideos={sermonVideos}
            youtube={postData?.youtube}
            mainPastor={postData?.mainPastor}
          />
        </div>
      )}
      {currentSelectTab === 'gallery' && (
        <TemplateGallery
          galleryPreviewItems={galleryPreviewItems}
          galleryPreviewIndex={galleryPreviewIndex}
          onSelectPreviewIndex={setGalleryPreviewIndex}
        />
      )}
    </>
  );

  const content = (
    <div className="church_detail">

      {/* 헤더: NoticeCreate와 동일 구조 (메인 이미지 + 로고 텍스트) */}
      <div className="church_detail__hero">
        <MainHeroCarousel
          fill
          imageSrcs={mainHeroImageSrcs}
          imgClassName="church_detail__hero-img"
          placeholder={<div className="church_detail__hero-placeholder">메인 이미지</div>}
          showViewFullButton={!isPreview && mainHeroImageSrcs.length > 0}
        />
        <div className="church_detail__hero-overlay">
          {postData?.religiousbody && (
            <p className="church_detail__hero-sub">{postData.religiousbody}</p>
          )}
          <h1 className="church_detail__hero-title">{postData?.churchName || '교회 로고'}</h1>
        </div>
      </div>

      {/* 탭: NoticeCreate와 동일 (소개 | 섬김이들 | 설교영상 | 갤러리) */}
      <div className="church_detail__tabs">
        {TAB_LIST.map((tab) => (
          <div
            key={tab.id}
            className={`church_detail__tab ${currentSelectTab === tab.id ? 'on' : ''}`}
            onClick={() => setCurrentSelectTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="church_detail__body">
        {renderCurrentTabBody()}
      </div>
    </div>
  );

  if (isPreview && isEmbed) {
    if (embedSection === 'body') {
      return (
        <div className="booklet-preview-page booklet-preview-page--embed booklet-preview-page--embed-body">
          <div className="booklet-preview-phone-frame booklet-preview-phone-frame--embed booklet-preview-phone-frame--embed-body">
            <div className="booklet-preview-phone-screen">
              <div className="church_detail">
                <div className="church_detail__body">
                  {renderCurrentTabBody()}
                </div>
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
          <div className="booklet-preview-phone-screen">
            {content}
          </div>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="booklet-preview-page">
        <div className="booklet-preview-phone-frame" style={{ width: previewWidth }}>
          <div className="booklet-preview-phone-notch" />
          <div className="booklet-preview-phone-screen">
            {content}
          </div>
          <div
            className="booklet-preview-resize-handle"
            onMouseDown={handleResizeMouseDown}
            role="slider"
            aria-label="모바일 화면 가로 길이 조절"
          />
        </div>
        <p className="booklet-preview-hint">모바일 화면의 가로 길이를 조절해보세요</p>
      </div>
    );
  }

  return <div className="booklet-detail-page">{content}</div>;
}
