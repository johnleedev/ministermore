import ServiceManageShell from '../../components/ServiceManageShell';

const PLACEHOLDER_STUDENTS = [
  { id: 1, name: '김민준', group: '유년부 3학년', status: '출석' },
  { id: 2, name: '이서연', group: '유년부 3학년', status: '결석' },
  { id: 3, name: '박지호', group: '유년부 4학년', status: '출석' },
];

export default function AttendanceManage() {
  return (
    <ServiceManageShell
      title="주일학교 출석부 관리"
      description="학생 목록을 확인하고 이번 주 출석을 체크합니다."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
        >
          출석 체크 시작
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          학생 추가
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-semibold">이름</th>
              <th className="px-5 py-3 font-semibold">소그룹</th>
              <th className="px-5 py-3 font-semibold">이번 주</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PLACEHOLDER_STUDENTS.map((student) => (
              <tr key={student.id}>
                <td className="px-5 py-3 font-medium text-slate-900">{student.name}</td>
                <td className="px-5 py-3 text-slate-600">{student.group}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      student.status === '출석'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ServiceManageShell>
  );
}
