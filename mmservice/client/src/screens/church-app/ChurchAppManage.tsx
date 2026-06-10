import ServiceManageShell from '../../components/ServiceManageShell';

export default function ChurchAppManage() {
  return (
    <ServiceManageShell
      title="교회 전용앱 관리"
      description="푸시 알림 발송과 교회 전용앱 설정을 관리합니다."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">푸시 알림</h2>
          <p className="mt-2 text-sm text-slate-600">공지·행사 알림을 앱 사용자에게 발송합니다.</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            알림 작성하기
          </button>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">앱 설정</h2>
          <p className="mt-2 text-sm text-slate-600">교회명, 로고, 메뉴 구성 등 앱 기본 설정을 편집합니다.</p>
          <button
            type="button"
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            설정 열기
          </button>
        </section>
      </div>
    </ServiceManageShell>
  );
}
