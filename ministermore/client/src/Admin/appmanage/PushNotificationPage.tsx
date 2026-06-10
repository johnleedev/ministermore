import './AppManage.scss';
import PushNotificationAdmin from './PushNotificationAdmin';

export default function PushNotificationPage() {
  return (
    <div className="admin-app-manage">
      <header className="admin-app-manage__head">
        <h2 className="admin-app-manage__title">푸시 알림</h2>
        <p className="admin-app-manage__desc">모바일 앱 푸시 알림을 발송하고 발송 내역을 확인합니다.</p>
      </header>
      <div className="admin-app-manage__panel">
        <PushNotificationAdmin />
      </div>
    </div>
  );
}
