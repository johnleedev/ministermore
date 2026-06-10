import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import { fetchRetreatList } from '../../api/retreatApi';
import ServiceManageShell from '../../components/ServiceManageShell';
import RetreatApplicantsModal from './RetreatApplicantsModal';
import type { RetreatListItem } from './types';
import MainURL from '../../MainURL';

function formatDate(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString('ko-KR');
}

export default function RetreatManage() {
  const navigate = useNavigate();
  const userAccount = useRecoilValue(recoilUserData)?.userAccount?.trim() || '';

  const [list, setList] = useState<RetreatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicantsTarget, setApplicantsTarget] = useState<RetreatListItem | null>(null);

  useEffect(() => {
    if (!userAccount) {
      setList([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRetreatList(userAccount)
      .then((rows) => {
        if (!cancelled) setList(rows);
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
  }, [userAccount]);

  const resolvePublicLink = (item: RetreatListItem) => {
    if (item.link?.trim()) return item.link.trim();
    return `${MainURL.replace(/\/$/, '')}/retreat/view?id=${item.id}`;
  };

  const copyLink = async (item: RetreatListItem) => {
    const url = resolvePublicLink(item);
    try {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    } catch {
      window.prompt('아래 링크를 복사하세요.', url);
    }
  };

  return (
    <>
      <ServiceManageShell
        title="수련회 전단지 관리"
        description="결제하신 수련회 전단지를 제작·수정하고 참가 신청자를 확인합니다."
      >
        {loading ? <p className="text-sm text-slate-500">목록을 불러오는 중…</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {!loading && !error && list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">결제된 수련회 전단지가 없습니다.</p>
            <p className="mt-2 text-sm text-slate-500">
              사역자모아에서 수련회 전단지 서비스를 신청·결제해 주세요.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {list.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-1 text-xs text-slate-400">
                {formatDate(item.createdAt) || `ID ${item.id}`}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {item.orderTitle || '제목 없음'}
              </h3>

              {item.hasInfo ? (
                <p className="mt-2 text-sm text-emerald-700">
                  수련회명: {item.eventName || '(미입력)'}
                </p>
              ) : (
                <p className="mt-2 text-sm text-amber-600">
                  아직 전단지가 생성되지 않았습니다.
                </p>
              )}

              <div className="mt-5 flex flex-1 flex-col gap-2">
                {!item.hasInfo ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/retreat/edit/${item.id}`)}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    새 전단지 만들기
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/retreat/edit/${item.id}`)}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      전단지 수정하기
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(item)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      링크 / QR 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicantsTarget(item)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      참가 신청자 명단 보기
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </ServiceManageShell>

      {applicantsTarget ? (
        <RetreatApplicantsModal
          bookletId={applicantsTarget.id}
          userAccount={userAccount}
          title={applicantsTarget.eventName || applicantsTarget.orderTitle || ''}
          onClose={() => setApplicantsTarget(null)}
        />
      ) : null}
    </>
  );
}
