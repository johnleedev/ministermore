import ServiceManageShell from '../../components/ServiceManageShell';

const PLACEHOLDER_ITEMS = [
  { id: 1, title: '2026 부활절 특별예배', updatedAt: '2026-03-05' },
  { id: 2, title: '청년부 찬양예배', updatedAt: '2026-02-20' },
];

export default function EventManage() {
  return (
    <ServiceManageShell
      title="행사 전단지 관리"
      description="행사·집회 안내 페이지를 제작하고 수정합니다."
    >
      <div className="mb-6">
        <button
          type="button"
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + 새 행사 전단지 만들기
        </button>
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {PLACEHOLDER_ITEMS.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">최근 수정 {item.updatedAt}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              편집
            </button>
          </li>
        ))}
      </ul>
    </ServiceManageShell>
  );
}
