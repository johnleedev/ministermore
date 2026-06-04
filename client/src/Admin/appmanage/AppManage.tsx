import { useState } from 'react';
import './AppManage.scss';
import PushNotificationAdmin from './PushNotificationAdmin';
import AppVersionAdmin from './AppVersionAdmin';

type AppManageTab = 'push' | 'version';

const MANAGE_TABS: { key: AppManageTab; label: string }[] = [
  { key: 'push', label: '푸시 알림' },
  { key: 'version', label: '앱 버전' },
];

export default function AppManage() {
  const [activeTab, setActiveTab] = useState<AppManageTab>('push');

  return (
    <div className="admin-app-manage">
      <header className="admin-app-manage__head">
        <h2 className="admin-app-manage__title">앱 관리</h2>
        <p className="admin-app-manage__desc">
          모바일 앱 푸시 알림 발송과 강제 업데이트 버전 정책을 관리합니다.
        </p>
      </header>

      <div className="admin-app-manage__tabs" role="tablist" aria-label="앱 관리 메뉴">
        {MANAGE_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`admin-app-manage__tab${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-app-manage__panel" role="tabpanel">
        {activeTab === 'push' && <PushNotificationAdmin />}
        {activeTab === 'version' && <AppVersionAdmin />}
      </div>
    </div>
  );
}
