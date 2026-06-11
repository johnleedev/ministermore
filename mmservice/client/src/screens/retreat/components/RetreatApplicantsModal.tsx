import { useEffect, useState } from 'react';
import { fetchRetreatAnswers, type RetreatAuthParams } from '../../../api/retreatApi';
import { formatCustomAnswerValue } from '../lib/retreatRequestForm';
import type { RetreatAnswerRow } from '../lib/types';
import type { RetreatCustomQuestion } from '../lib/retreatRequestForm';

type RetreatApplicantsModalProps = {
  bookletId: number;
  auth: RetreatAuthParams;
  title: string;
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ko-KR');
}

export default function RetreatApplicantsModal({
  bookletId,
  auth,
  title,
  onClose,
}: RetreatApplicantsModalProps) {
  const [rows, setRows] = useState<RetreatAnswerRow[]>([]);
  const [customQuestions, setCustomQuestions] = useState<RetreatCustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRetreatAnswers(bookletId, auth)
      .then((data) => {
        if (!cancelled) {
          setRows(data.list);
          setCustomQuestions(data.customQuestions);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookletId, auth.churchName, auth.passwd, auth.ownerpw]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">참가 신청자 명단</h2>
            <p className="mt-1 text-sm text-slate-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? <p className="text-sm text-slate-500">불러오는 중…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && rows.length === 0 ? (
            <p className="text-sm text-slate-500">아직 참가 신청자가 없습니다.</p>
          ) : null}

          {!loading && !error && rows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">이름</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">연락처</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">소속</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">건의/기도제목</th>
                    {customQuestions.map((question) => (
                      <th key={question.id} className="px-4 py-3 font-semibold whitespace-nowrap">
                        {question.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">신청일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {row.userName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.userPhone}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.userGroup || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 min-w-[160px]">{row.note || '-'}</td>
                      {customQuestions.map((question) => (
                        <td key={`${row.id}-${question.id}`} className="px-4 py-3 text-slate-600 min-w-[140px]">
                          {formatCustomAnswerValue(row.customAnswers?.[question.id])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
