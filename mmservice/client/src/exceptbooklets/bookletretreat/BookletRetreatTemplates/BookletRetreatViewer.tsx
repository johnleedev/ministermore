import { useMemo } from 'react';
import { FaUser } from 'react-icons/fa';
import MainHeroCarousel from '../../component/MainHeroCarousel';
import { parseMainImageNameFromDb } from '../../component/mainImageNames';
import TemplateNotice from '../../bookletEvent/BookletEventTemplates/TemplateNotice';
import TemplateEventGreeting from '../../bookletEvent/BookletEventTemplates/TemplateEventGreeting';
import TemplateEventOrder from '../../bookletEvent/BookletEventTemplates/TemplateEventOrder';
import RetreatApplyForm from '../../../screens/retreat/components/RetreatApplyForm';
import {
  ensureOrderDateKeysOnPrograms,
  groupProgramsByOrderDay,
  serializeYmdParts,
} from '../../../screens/retreat/lib/retreatOrderSchedule';
import type { RetreatCustomQuestion } from '../../../screens/retreat/lib/retreatRequestForm';
import {
  parseRetreatVisibleTabs,
  retreatTabLabel,
  type RetreatEditTabId,
} from '../../../screens/retreat/lib/retreatEditTabs';
import type { RetreatInfoForm, RetreatProgramRow } from '../../../screens/retreat/lib/types';
import {
  careerLines,
  parseRetreatDateStart,
  programRowHasContent,
  programsToOrderRows,
} from '../lib/retreatBookletHelpers';

export type BookletRetreatViewerProps = {
  bookletId: number | string;
  info: RetreatInfoForm;
  programs: RetreatProgramRow[];
  customQuestions: RetreatCustomQuestion[];
  orderTitle?: string;
  activeTab: RetreatEditTabId;
  onTabChange?: (tab: RetreatEditTabId) => void;
  applyPreview?: boolean;
  showViewFullButton?: boolean;
  mainImageBaseUrl: string;
};

function renderProgramPreviewRow(row: RetreatProgramRow, index: number) {
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
}

export default function BookletRetreatViewer({
  bookletId,
  info,
  programs,
  customQuestions,
  orderTitle,
  activeTab,
  onTabChange,
  applyPreview = false,
  showViewFullButton = true,
  mainImageBaseUrl,
}: BookletRetreatViewerProps) {
  const visibleTabList = useMemo(() => parseRetreatVisibleTabs(info.visibleTabs), [info.visibleTabs]);

  const displayTitle = info.eventName || orderTitle || '수련회 전단지';

  const mainHeroImageSrcs = useMemo(
    () =>
      parseMainImageNameFromDb(info.imageMain)
        .filter(Boolean)
        .map((name) => `${mainImageBaseUrl}/${encodeURIComponent(name)}`),
    [info.imageMain, mainImageBaseUrl],
  );

  const hasMainImage = mainHeroImageSrcs.length > 0;

  const orderDayGroups = useMemo(() => {
    const fallbackDate = parseRetreatDateStart(info.date);
    const normalizedPrograms = ensureOrderDateKeysOnPrograms(programs, fallbackDate);
    return groupProgramsByOrderDay(normalizedPrograms, fallbackDate);
  }, [programs, info.date]);

  const templateNoticePostData = useMemo(
    () => ({
      eventName: info.eventName,
      date: info.date,
      place: info.place,
      address: info.address,
      superViser: info.superViser,
      quiry: info.quiry,
      placeNaver: info.placeNaver,
      placeKakao: info.placeKakao,
    }),
    [info],
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

  const filledCustomQuestions = useMemo(
    () => customQuestions.filter((question) => question.label.trim()),
    [customQuestions],
  );

  const handleTabClick = (tabId: RetreatEditTabId) => {
    onTabChange?.(tabId);
  };

  return (
    <div className="retreat-edit__preview-inner">
      <div
        className={`retreat-edit__preview-hero${
          hasMainImage ? '' : ' retreat-edit__preview-hero--no-image'
        }`}
      >
        {hasMainImage ? (
          <MainHeroCarousel
            fill
            imageSrcs={mainHeroImageSrcs}
            imgClassName="event-create__preview-hero-img"
            placeholder={null}
            showViewFullButton={showViewFullButton && hasMainImage}
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
            onClick={() => handleTabClick(tabId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTabClick(tabId);
              }
            }}
            role="tab"
            tabIndex={0}
            aria-selected={activeTab === tabId}
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
                    ? () => handleTabClick('program')
                    : visibleTabList.includes('order')
                      ? () => handleTabClick('order')
                      : undefined
                }
              />
            </div>
            <div className="notice-create__preview-footer">
              <p className="notice-create__preview-footer-info">
                {info.quiry}
                {info.quiry && info.address ? ' | ' : ''}
                {info.address}
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
                  {programs.filter(programRowHasContent).map((row, index) =>
                    renderProgramPreviewRow(row, index),
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
                  <TemplateEventOrder rows={programsToOrderRows(dayRows)} orderStyle="retreat" />
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
              customQuestions={filledCustomQuestions}
              preview={applyPreview}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
