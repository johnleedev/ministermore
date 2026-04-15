import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../bookletNotice/BookletNoticeDetail.scss';
import '../bookletEvent/BookletEventDetail.scss';
import './BulletinDetail.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import MainHeroCarousel from '../component/MainHeroCarousel';
import { parseMainImageNameFromDb } from '../component/mainImageNames';
import TemplateBulletinInfo from './BulletinTemplates/TemplateBulletinInfo';
import TemplateBulletinOrder from './BulletinTemplates/TemplateBulletinOrder';
import TemplateBulletinNews from './BulletinTemplates/TemplateBulletinNews';
import { BULLETIN_DEMOS, BULLETIN_DEMO_DEFAULT } from './bulletinDemoData';
import type { BulletinPostProps, BulletinWorshipRow } from './bulletinTypes';
import { formatBulletinDateKo } from './bulletinTypes';

const VALID_TABS = ['info', 'order', 'news'] as const;
type BulletinTabId = (typeof VALID_TABS)[number];

function mainImageUrl(fileName: string): string {
  return `${MainURL}/images/bulletin/mainimages/${encodeURIComponent(fileName)}`;
}

function parseWorshipRows(raw: unknown): BulletinWorshipRow[] {
  if (raw == null || raw === false) return [];
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t || t === 'false') return [];
    try {
      const p = JSON.parse(t);
      arr = Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  } else return [];

  return arr.map((row, i) => {
    const r = row as Record<string, unknown>;
    const num = String(r.num ?? r.sortOrder ?? i + 1);
    return {
      num,
      title: r.title != null ? String(r.title) : '',
      sub: r.sub != null ? String(r.sub) : r.subTitle != null ? String(r.subTitle) : '',
      right: r.right != null ? String(r.right) : r.time != null ? String(r.time) : '',
    };
  });
}

function normalizeApiRow(raw: Record<string, unknown>): BulletinPostProps {
  const worshipRows = parseWorshipRows(raw.worshipRows ?? raw.worshiprows);
  return {
    id: typeof raw.id === 'number' ? raw.id : parseInt(String(raw.id ?? '0'), 10) || 0,
    churchName: raw.churchName != null ? String(raw.churchName) : '',
    bulletinTitle: raw.bulletinTitle != null ? String(raw.bulletinTitle) : '',
    bulletinDate: raw.bulletinDate != null ? String(raw.bulletinDate) : '',
    imageMainName: raw.imageMainName != null ? String(raw.imageMainName) : '',
    introText: raw.introText != null ? String(raw.introText) : '',
    newsText: raw.newsText != null ? String(raw.newsText) : '',
    worshipRows,
    quiry: raw.quiry != null ? String(raw.quiry) : undefined,
  };
}

export default function BulletinDetail() {
  const url = new URL(window.location.href);
  const ID = url.searchParams.get('id');
  const isPreview = url.searchParams.get('preview') === '1';
  const isEmbed = url.searchParams.get('embed') === '1';
  const embedSection = url.searchParams.get('section');
  const tabParam = url.searchParams.get('tab');

  const initialTab: BulletinTabId =
    tabParam && (VALID_TABS as readonly string[]).includes(tabParam) ? (tabParam as BulletinTabId) : 'info';
  const [currentSelectTab, setCurrentSelectTab] = useState<BulletinTabId>(initialTab);
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

  const [postData, setPostData] = useState<BulletinPostProps | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!ID) {
      setPostData({ ...BULLETIN_DEMO_DEFAULT });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${MainURL}/bulletinmain/getdatabookletspart`, { id: ID });
      const payload = res.data;
      if (Array.isArray(payload) && payload[0] && typeof payload[0] === 'object') {
        setPostData(normalizeApiRow(payload[0] as Record<string, unknown>));
        return;
      }
    } catch {
      // 서버 라우트 미구현 시 데모
    } finally {
      setLoading(false);
    }

    setPostData({ ...(BULLETIN_DEMOS[ID] ?? BULLETIN_DEMO_DEFAULT) });
  }, [ID]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
      setCurrentSelectTab(tabParam as BulletinTabId);
    }
  }, [tabParam]);

  const mainHeroImageSrcs = useMemo(() => {
    const raw = postData?.imageMainName ?? '';
    if (!raw.trim()) return [];
    return parseMainImageNameFromDb(raw)
      .filter(Boolean)
      .map((name) => mainImageUrl(name));
  }, [postData?.imageMainName]);

  const TAB_LIST = [
    { id: 'info' as const, label: '기본' },
    { id: 'order' as const, label: '예배 순서' },
    { id: 'news' as const, label: '안내' },
  ] as const;

  const post = postData ?? BULLETIN_DEMO_DEFAULT;
  const dateLine = formatBulletinDateKo(post.bulletinDate);

  const renderCurrentTabBody = () => (
    <>
      {currentSelectTab === 'info' && <TemplateBulletinInfo post={post} />}
      {currentSelectTab === 'order' && (
        <TemplateBulletinOrder rows={post.worshipRows} loading={Boolean(ID) && loading} />
      )}
      {currentSelectTab === 'news' && (
        <TemplateBulletinNews newsText={post.newsText} loading={Boolean(ID) && loading} />
      )}
    </>
  );

  const content = (
    <div className="church_detail church_detail--event-tabs3">
      <div className="church_detail__hero">
        <MainHeroCarousel
          fill
          imageSrcs={mainHeroImageSrcs}
          imgClassName="church_detail__hero-img"
          placeholder={<div className="church_detail__hero-placeholder">주보 메인 이미지</div>}
          showViewFullButton={!isPreview && mainHeroImageSrcs.length > 0}
        />
        <div className="church_detail__hero-overlay">
          <p className="church_detail__hero-sub">Sunday Worship Bulletin</p>
          <h1 className="church_detail__hero-title">{post.churchName || '교회 이름'}</h1>
          <p className="bulletin-detail__hero-subline">
            {post.bulletinTitle || '이번 주 주보'} · {dateLine}
          </p>
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
              <div className="church_detail church_detail--event-tabs3">
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
