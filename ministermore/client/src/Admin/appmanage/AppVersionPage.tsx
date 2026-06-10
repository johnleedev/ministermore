import './AppManage.scss';
import AppVersionAdmin from './AppVersionAdmin';

export default function AppVersionPage() {
  return (
    <div className="admin-app-manage">
      <header className="admin-app-manage__head">
        <h2 className="admin-app-manage__title">앱 버전</h2>
        <p className="admin-app-manage__desc">모바일 앱 강제 업데이트 버전 정책을 관리합니다.</p>
      </header>
      <div className="admin-app-manage__panel">
        <AppVersionAdmin />
      </div>
    </div>
  );
}
