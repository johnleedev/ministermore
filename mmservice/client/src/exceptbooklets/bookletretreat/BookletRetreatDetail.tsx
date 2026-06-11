import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../bookletNotice/BookletNoticeDetail.scss';
import './BookletRetreatDetail.scss';
import MainURL from '../../MainURL';
import { fetchRetreatPublicDetail, fetchRetreatRequestMain } from '../../api/retreatApi';
import { mapInfoToForm, normalizeProgramRow } from '../../screens/retreat/lib/retreatFormDefaults';
import {
  ensureOrderDateKeysOnPrograms,
} from '../../screens/retreat/lib/retreatOrderSchedule';
import type { RetreatCustomQuestion } from '../../screens/retreat/lib/retreatRequestForm';
import {
  parseRetreatVisibleTabs,
  type RetreatEditTabId,
} from '../../screens/retreat/lib/retreatEditTabs';
import type { RetreatInfoForm, RetreatProgramRow } from '../../screens/retreat/lib/types';
import BookletRetreatViewer from './BookletRetreatTemplates/BookletRetreatViewer';
import { parseRetreatDateStart } from './lib/retreatBookletHelpers';

const RETREAT_MAIN_IMAGE_URL = `${MainURL}/images/retreat`;

const VALID_TABS = ['info', 'greeting', 'program', 'order', 'apply'] as const;

function normalizeUrlTab(raw: string | null): RetreatEditTabId {
  if (!raw) return 'info';
  if ((VALID_TABS as readonly string[]).includes(raw)) {
    return raw as RetreatEditTabId;
  }
  return 'info';
}

export default function BookletRetreatDetail() {
  const url = new URL(window.location.href);
  const ID = url.searchParams.get('id');
  const bookletId = parseInt(String(ID || ''), 10);
  const isPreview = url.searchParams.get('preview') === '1';
  const isEmbed = url.searchParams.get('embed') === '1';
  const embedSection = url.searchParams.get('section');
  const tabParam = url.searchParams.get('tab');

  const [currentSelectTab, setCurrentSelectTab] = useState<RetreatEditTabId>(() =>
    normalizeUrlTab(tabParam),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState('');
  const [info, setInfo] = useState<RetreatInfoForm>(mapInfoToForm(null));
  const [programs, setPrograms] = useState<RetreatProgramRow[]>([]);
  const [customQuestions, setCustomQuestions] = useState<RetreatCustomQuestion[]>([]);

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
    if (!bookletId) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [detail, questions] = await Promise.all([
        fetchRetreatPublicDetail(bookletId),
        fetchRetreatRequestMain(bookletId).catch(() => []),
      ]);

      const mappedInfo = mapInfoToForm(detail.info);
      const fallbackDate = parseRetreatDateStart(mappedInfo.date);
      const mappedPrograms = ensureOrderDateKeysOnPrograms(
        detail.programs?.length
          ? detail.programs.map((row) => normalizeProgramRow(row))
          : [],
        fallbackDate,
      );

      setOrderTitle(detail.main?.orderTitle || '');
      setInfo(mappedInfo);
      setPrograms(mappedPrograms);
      setCustomQuestions(questions);

      const tabs = parseRetreatVisibleTabs(mappedInfo.visibleTabs);
      setCurrentSelectTab((prev) => (tabs.includes(prev) ? prev : tabs[0] ?? 'info'));
    } catch (err) {
      console.error('bookletretreat fetch:', err);
      setError(err instanceof Error ? err.message : '전단지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [bookletId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setCurrentSelectTab(normalizeUrlTab(tabParam));
  }, [tabParam]);

  const visibleTabIds = useMemo(
    () => parseRetreatVisibleTabs(info.visibleTabs),
    [info.visibleTabs],
  );

  useEffect(() => {
    const allowedTabs: RetreatEditTabId[] =
      isPreview && isEmbed && embedSection === 'body'
        ? [...VALID_TABS]
        : visibleTabIds;
    if (!allowedTabs.includes(currentSelectTab)) {
      setCurrentSelectTab(allowedTabs[0] || 'info');
    }
  }, [visibleTabIds, currentSelectTab, isPreview, isEmbed, embedSection]);

  if (loading) {
    return (
      <div className="booklet-detail-page">
        <p style={{ padding: 24 }}>불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booklet-detail-page">
        <p style={{ padding: 24, color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  const viewer = (
    <div className="retreat-edit retreat-edit--standalone-preview">
      <BookletRetreatViewer
        bookletId={bookletId}
        info={info}
        programs={programs}
        customQuestions={customQuestions}
        orderTitle={orderTitle}
        activeTab={currentSelectTab}
        onTabChange={setCurrentSelectTab}
        applyPreview={isPreview}
        showViewFullButton={!isPreview}
        mainImageBaseUrl={RETREAT_MAIN_IMAGE_URL}
      />
    </div>
  );

  if (isPreview && isEmbed) {
    if (embedSection === 'body') {
      return (
        <div className="booklet-preview-page booklet-preview-page--embed booklet-preview-page--embed-body">
          <div className="booklet-preview-phone-frame booklet-preview-phone-frame--embed booklet-preview-phone-frame--embed-body">
            <div className="booklet-preview-phone-screen">{viewer}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="booklet-preview-page booklet-preview-page--embed">
        <div className="booklet-preview-phone-frame booklet-preview-phone-frame--embed">
          <div className="booklet-preview-phone-notch" />
          <div className="booklet-preview-phone-screen">{viewer}</div>
        </div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="booklet-preview-page">
        <div className="booklet-preview-phone-frame" style={{ width: previewWidth }}>
          <div className="booklet-preview-phone-notch" />
          <div className="booklet-preview-phone-screen">{viewer}</div>
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

  return <div className="booklet-detail-page">{viewer}</div>;
}
