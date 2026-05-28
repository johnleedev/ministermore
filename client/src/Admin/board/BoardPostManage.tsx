import { useState } from 'react';
import '../Admin.scss';
import FreeBoardManage from './FreeBoardManage';
import EventsBoardManage from './EventsBoardManage';
import UsedBoardManage from './UsedBoardManage';

export type BoardManageTab = 'free' | 'events' | 'used';

const MANAGE_TABS: { key: BoardManageTab; label: string }[] = [
  { key: 'free', label: '자유게시판 관리' },
  { key: 'events', label: '집회세미나 관리' },
  { key: 'used', label: '중고장터 관리' },
];

type Props = {
  initialTab?: BoardManageTab;
};

export default function BoardPostManage({ initialTab = 'free' }: Props) {
  const [activeTab, setActiveTab] = useState<BoardManageTab>(initialTab);

  return (
    <div className="admin-board-write">
      <div className="admin-board-write__tabs" role="tablist" aria-label="게시판 관리 선택">
        {MANAGE_TABS.map((tab) => (
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
        {activeTab === 'free' && <FreeBoardManage />}
        {activeTab === 'events' && <EventsBoardManage />}
        {activeTab === 'used' && <UsedBoardManage />}
      </div>
    </div>
  );
}
