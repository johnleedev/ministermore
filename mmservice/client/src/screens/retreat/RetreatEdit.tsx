import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilUserData } from '../../RecoilStore';
import {
  fetchRetreatDetail,
  saveRetreatInfo,
  saveRetreatPrograms,
} from '../../api/retreatApi';
import type { RetreatInfoForm, RetreatProgramRow } from './types';
import {
  createEmptyProgramRow,
  mapInfoToForm,
  normalizeProgramRow,
} from './retreatFormDefaults';

type TabKey = 'info' | 'program';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

export default function RetreatEdit() {
  const navigate = useNavigate();
  const { bookletId: bookletIdParam } = useParams();
  const bookletId = parseInt(String(bookletIdParam), 10);
  const userAccount = useRecoilValue(recoilUserData)?.userAccount?.trim() || '';

  const [tab, setTab] = useState<TabKey>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState('');
  const [info, setInfo] = useState<RetreatInfoForm>(mapInfoToForm(null));
  const [programs, setPrograms] = useState<RetreatProgramRow[]>([createEmptyProgramRow(0)]);

  useEffect(() => {
    if (!bookletId || !userAccount) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRetreatDetail(bookletId, userAccount)
      .then((detail) => {
        if (cancelled) return;
        setOrderTitle(detail.main?.orderTitle || '');
        setInfo(mapInfoToForm(detail.info));
        setPrograms(
          detail.programs?.length
            ? detail.programs.map((p) => normalizeProgramRow(p))
            : [createEmptyProgramRow(0)],
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookletId, userAccount]);

  const updateInfo = (key: keyof RetreatInfoForm, value: string) => {
    setInfo((prev) => ({ ...prev, [key]: value }));
  };

  const updateProgram = (index: number, key: keyof RetreatProgramRow, value: string | boolean) => {
    setPrograms((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const addProgram = () => {
    setPrograms((prev) => [...prev, createEmptyProgramRow(prev.length)]);
  };

  const removeProgram = (index: number) => {
    setPrograms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!bookletId || !userAccount) return;
    setSaving(true);
    setError(null);
    try {
      if (tab === 'info') {
        await saveRetreatInfo(bookletId, userAccount, info);
      } else {
        await saveRetreatPrograms(bookletId, userAccount, programs);
      }
      alert('저장되었습니다.');
      navigate('/retreat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!bookletId) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-600">
        잘못된 접근입니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/retreat')}
          className="text-sm font-medium text-slate-500 hover:text-emerald-600"
        >
          ← 수련회 전단지 목록
        </button>

        <header className="mt-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">수련회 전단지 제작</h1>
          <p className="mt-2 text-slate-600">{orderTitle || `전단지 #${bookletId}`}</p>
        </header>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('info')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'info'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            탭 1 · 수련회 정보
          </button>
          <button
            type="button"
            onClick={() => setTab('program')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'program'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            탭 2 · 일정/프로그램
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-500">불러오는 중…</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {!loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {tab === 'info' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">수련회명</span>
                  <input
                    className={inputClass}
                    value={info.eventName}
                    onChange={(e) => updateInfo('eventName', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">영문명</span>
                  <input
                    className={inputClass}
                    value={info.eventNameEn}
                    onChange={(e) => updateInfo('eventNameEn', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">일정</span>
                  <input
                    className={inputClass}
                    value={info.date}
                    onChange={(e) => updateInfo('date', e.target.value)}
                    placeholder="2026.07.15 ~ 07.17"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">장소</span>
                  <input
                    className={inputClass}
                    value={info.place}
                    onChange={(e) => updateInfo('place', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">인도자</span>
                  <input
                    className={inputClass}
                    value={info.superViser}
                    onChange={(e) => updateInfo('superViser', e.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">주소</span>
                  <input
                    className={inputClass}
                    value={info.address}
                    onChange={(e) => updateInfo('address', e.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">문의</span>
                  <input
                    className={inputClass}
                    value={info.quiry}
                    onChange={(e) => updateInfo('quiry', e.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">인사말</span>
                  <textarea
                    className={`${inputClass} min-h-[100px]`}
                    value={info.eventGreeting}
                    onChange={(e) => updateInfo('eventGreeting', e.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">참가 안내 (탭3)</span>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={info.applyNote}
                    onChange={(e) => updateInfo('applyNote', e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {programs.map((row, index) => (
                  <div
                    key={`program-${index}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        프로그램 {index + 1}
                      </span>
                      {programs.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeProgram(index)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs text-slate-500">순서</span>
                        <input
                          className={inputClass}
                          value={row.showOrder}
                          onChange={(e) => updateProgram(index, 'showOrder', e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">소제목</span>
                        <input
                          className={inputClass}
                          value={row.subTitle}
                          onChange={(e) => updateProgram(index, 'subTitle', e.target.value)}
                        />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs text-slate-500">제목</span>
                        <input
                          className={inputClass}
                          value={row.title}
                          onChange={(e) => updateProgram(index, 'title', e.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-slate-500">일시</span>
                        <input
                          className={inputClass}
                          value={row.dateTime}
                          onChange={(e) => updateProgram(index, 'dateTime', e.target.value)}
                        />
                      </label>
                      <label className="flex items-end gap-2 pb-2">
                        <input
                          type="checkbox"
                          checked={row.showDateTime}
                          onChange={(e) => updateProgram(index, 'showDateTime', e.target.checked)}
                        />
                        <span className="text-sm text-slate-600">일시 표시</span>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs text-slate-500">내용</span>
                        <textarea
                          className={`${inputClass} min-h-[80px]`}
                          value={row.career}
                          onChange={(e) => updateProgram(index, 'career', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProgram}
                  className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  + 프로그램 추가
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/retreat')}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                취소
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? '저장 중…' : '저장하기'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
