import { useState } from 'react';
import '../Admin.scss';
import AdminCommunityPost from './AdminCommunityPost';
import BoardPromptBuilder from './BoardPromptBuilder';
import { FREE_BOARD_CONFIG } from '../../screens/board/boardConfigs';

type FreeSubTab = 'write' | 'prompt';

const FREE_SUB_TABS: { key: FreeSubTab; label: string }[] = [
  { key: 'write', label: '글쓰기' },
  { key: 'prompt', label: '프롬프트' },
];

export default function FreeBoardWrite() {
  const [activeSubTab, setActiveSubTab] = useState<FreeSubTab>('write');

  return (
    <div className="admin-board-write__sub">
      <div className="admin-board-write__sub-tabs" role="tablist" aria-label="자유게시판 메뉴">
        {FREE_SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.key}
            className={`admin-board-write__sub-tab${activeSubTab === tab.key ? ' is-active' : ''}`}
            onClick={() => setActiveSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-board-write__sub-panel" role="tabpanel">
        {activeSubTab === 'write' && <AdminCommunityPost config={FREE_BOARD_CONFIG} randomUserNickName />}
        {activeSubTab === 'prompt' && <BoardPromptBuilder freeOnly />}
      </div>
    </div>
  );
}
