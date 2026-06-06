import { useState } from 'react';
import '../Admin.scss';
import NoticePost from './NoticePost';
import AdminCommunityPost from './AdminCommunityPost';
import FreeBoardWrite from './FreeBoardWrite';
import { EVENTS_BOARD_CONFIG, USED_BOARD_CONFIG } from '../../screens/board/boardConfigs';

type BoardTab = 'free' | 'events' | 'used' | 'notice';

const BOARD_TABS: { key: BoardTab; label: string }[] = [
  { key: 'free', label: '자유게시판' },
  { key: 'events', label: '집회세미나' },
  { key: 'used', label: '중고장터' },
  { key: 'notice', label: '공지사항' },
];

export default function BoardPostWrite() {
  const [activeTab, setActiveTab] = useState<BoardTab>('free');

  return (
    <div className="admin-board-write">
      <div className="admin-board-write__tabs" role="tablist" aria-label="게시판 선택">
        {BOARD_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`admin-board-write__tab${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-board-write__panel" role="tabpanel">
        {activeTab === 'free' && <FreeBoardWrite />}
        {activeTab === 'events' && <AdminCommunityPost config={EVENTS_BOARD_CONFIG} />}
        {activeTab === 'used' && <AdminCommunityPost config={USED_BOARD_CONFIG} />}
        {activeTab === 'notice' && <NoticePost />}
      </div>
    </div>
  );
}
