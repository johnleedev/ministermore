import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainHeroCarousel from '../../../exceptbooklets/component/MainHeroCarousel';
import { parseMainImageNameFromDb } from '../../../exceptbooklets/component/mainImageNames';
import TemplateNotice from '../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateNotice';
import TemplateEventOrder, {
  type EventOrderItem,
} from '../../../exceptbooklets/bookletEvent/BookletEventTemplates/TemplateEventOrder';
import { fetchRetreatPublicDetail, fetchRetreatRequestMain } from '../../../api/retreatApi';
import MainURL from '../../../MainURL';
import { mapInfoToForm, normalizeProgramRow } from '../lib/retreatFormDefaults';
import {
  ensureOrderDateKeysOnPrograms,
  groupProgramsByOrderDay,
  serializeYmdParts,
} from '../lib/retreatOrderSchedule';
import type { RetreatCustomQuestion } from '../lib/retreatRequestForm';
import type { RetreatProgramRow } from '../lib/types';
import { parseRetreatVisibleTabs, retreatTabLabel } from '../lib/retreatEditTabs';
import RetreatApplyForm from '../components/RetreatApplyForm';
import '../../service/bookletNotice/createNotice/NoticeCreate.scss';
import '../../../exceptbooklets/bookletEvent/BookletEventDetail.scss';
import '../../../exceptbooklets/bookletEvent/styles/EventCreate.scss';
import '../components/RetreatApplyForm.scss';

const RETREAT_MAIN_IMAGE_URL = `${MainURL}/images/retreat`;

type RetreatTabId = 'info' | 'order' | 'apply';

function parseRetreatDateStart(dateRaw: string) {
  const value = (dateRaw || '').trim();
  if (!value) return { y: '', m: '', d: '' };
  const start = value.includes('~') ? value.split('~')[0].trim() : value;
  const full = start.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return { y: full[1], m: full[2], d: full[3] };
  return { y: '', m: '', d: '' };
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

export default function RetreatView() {
  const [searchParams] = useSearchParams();
  const bookletId = parseInt(String(searchParams.get('id') || ''), 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [infoForm, setInfoForm] = useState(mapInfoToForm(null));
  const [programs, setPrograms] = useState<RetreatProgramRow[]>([]);
  const [customQuestions, setCustomQuestions] = useState<RetreatCustomQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<RetreatTabId>('info');

  const visibleTabs = useMemo(
    () => parseRetreatVisibleTabs(infoForm.visibleTabs).filter((tab): tab is RetreatTabId =>
      tab === 'info' || tab === 'order' || tab === 'apply',
    ),
    [infoForm.visibleTabs],
  );

  const mainHeroImageSrcs = useMemo(() => {
    return parseMainImageNameFromDb(infoForm.imageMain)
      .filter(Boolean)
      .map((name) => `${RETREAT_MAIN_IMAGE_URL}/${encodeURIComponent(name)}`);
  }, [infoForm.imageMain]);

  const orderDayGroups = useMemo(() => {
    const fallbackDate = parseRetreatDateStart(infoForm.date);
    return groupProgramsByOrderDay(programs, fallbackDate);
  }, [programs, infoForm.date]);

  const loadData = useCallback(async () => {
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
          ? detail.programs.map((p) => normalizeProgramRow(p))
          : [],
        fallbackDate,
      );

      setEventName(mappedInfo.eventName || detail.main?.orderTitle || '수련회');
      setInfoForm(mappedInfo);
      setPrograms(mappedPrograms);
      setCustomQuestions(questions);

      const tabs = parseRetreatVisibleTabs(mappedInfo.visibleTabs).filter(
        (tab): tab is RetreatTabId => tab === 'info' || tab === 'order' || tab === 'apply',
      );
      setActiveTab(tabs[0] ?? 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : '전단지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [bookletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] ?? 'info');
    }
  }, [visibleTabs, activeTab]);

  if (loading) {
    return <div className="booklet-detail-page"><p style={{ padding: 24 }}>불러오는 중…</p></div>;
  }

  if (error) {
    return <div className="booklet-detail-page"><p style={{ padding: 24, color: '#b91c1c' }}>{error}</p></div>;
  }

  const tabGridClass =
    visibleTabs.length <= 2
      ? 'church_detail--event-tabs2'
      : visibleTabs.length === 3
        ? 'church_detail--event-tabs3'
        : 'church_detail--event-tabs4';

  const noticePostData = {
    eventName: infoForm.eventName,
    date: infoForm.date,
    place: infoForm.place,
    superViser: infoForm.superViser,
    address: infoForm.address,
    quiry: infoForm.quiry,
    placeNaver: infoForm.placeNaver,
    placeKakao: infoForm.placeKakao,
    imageMain: infoForm.imageMain,
    imageMainName: infoForm.imageMain,
  };

  return (
    <div className="booklet-detail-page">
      <div className={`church_detail ${tabGridClass}`}>
        <div className="church_detail__hero">
          <MainHeroCarousel
            fill
            imageSrcs={mainHeroImageSrcs}
            imgClassName="church_detail__hero-img"
            placeholder={<div className="church_detail__hero-placeholder">메인 이미지</div>}
            showViewFullButton={mainHeroImageSrcs.length > 0}
          />
          <div className="church_detail__hero-overlay">
            <p className="church_detail__hero-sub">모바일 수련회 전단지</p>
            <h1 className="church_detail__hero-title">{eventName}</h1>
          </div>
        </div>

        <div className="church_detail__tabs">
          {visibleTabs.map((tabId) => (
            <div
              key={tabId}
              className={`church_detail__tab ${activeTab === tabId ? 'on' : ''}`}
              onClick={() => setActiveTab(tabId)}
              role="presentation"
            >
              {retreatTabLabel(tabId)}
            </div>
          ))}
        </div>

        <div className="church_detail__body">
          {activeTab === 'info' ? (
            <TemplateNotice
              postData={noticePostData}
              variant="retreat"
              program={[]}
              applyNote={infoForm.applyNote}
              applyNoteLabel="수련회 안내"
              onOpenProgramTab={
                visibleTabs.includes('order') ? () => setActiveTab('order') : undefined
              }
            />
          ) : null}

          {activeTab === 'order' ? (
            <div className="event-create__preview-worship">
              {orderDayGroups.map((group, dayIndex) => {
                const dayRows = programs.slice(group.startIndex, group.startIndex + group.rowCount);
                const dateLabel = serializeYmdParts(group.dateParts);
                return (
                  <div key={`retreat-view-order-${group.groupId || dayIndex}`}>
                    {dateLabel ? (
                      <p className="retreat-edit__preview-order-date">{dateLabel}</p>
                    ) : null}
                    <TemplateEventOrder
                      rows={programsToOrderRows(dayRows)}
                      orderStyle="retreat"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === 'apply' ? (
            <div className="event-create__preview-apply" style={{ padding: '12px 14px' }}>
              <RetreatApplyForm
                bookletId={bookletId}
                applyNote={infoForm.applyNote}
                customQuestions={customQuestions}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
