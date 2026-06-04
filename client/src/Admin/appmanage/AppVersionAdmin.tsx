import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';

type VersionPolicy = {
  id: number;
  versionCode: number;
  versionName: string | null;
  forceUpdateEnabled: number | boolean;
  updateMessage: string | null;
  storeUrlAndroid: string | null;
  storeUrlIos: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PolicyForm = {
  id: number | null;
  versionCode: string;
  versionName: string;
  forceUpdateEnabled: boolean;
  updateMessage: string;
  storeUrlAndroid: string;
  storeUrlIos: string;
};

const EMPTY_FORM: PolicyForm = {
  id: null,
  versionCode: '',
  versionName: '',
  forceUpdateEnabled: true,
  updateMessage: '새 버전이 출시되었습니다. 업데이트 후 이용해 주세요.',
  storeUrlAndroid: 'https://play.google.com/store/apps/details?id=com.ministermore',
  storeUrlIos: '',
};

function toForm(row: VersionPolicy): PolicyForm {
  return {
    id: row.id,
    versionCode: String(row.versionCode ?? ''),
    versionName: row.versionName || '',
    forceUpdateEnabled: Boolean(row.forceUpdateEnabled),
    updateMessage: row.updateMessage || '',
    storeUrlAndroid: row.storeUrlAndroid || '',
    storeUrlIos: row.storeUrlIos || '',
  };
}

/** 최신 정책 값을 복사해 새 등록용 폼 (id 없음) */
function toNewFormFromLatest(row: VersionPolicy): PolicyForm {
  return { ...toForm(row), id: null };
}

function bumpVersionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '0.1';
  const num = Number.parseFloat(trimmed);
  if (!Number.isFinite(num)) return trimmed;
  return (Math.round((num + 0.1) * 10) / 10).toFixed(1);
}

function formatDate(value: string | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
}

function shortenUrl(url: string | null, max = 36) {
  const text = String(url || '').trim();
  if (!text) return '—';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function ForceBlockPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`admin-app-manage__pill${
        enabled ? ' admin-app-manage__pill--on' : ' admin-app-manage__pill--off'
      }`}>
      {enabled ? '차단함' : '허용함'}
    </span>
  );
}

export default function AppVersionAdmin() {
  const [policies, setPolicies] = useState<VersionPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);

  const latestPolicyId = policies[0]?.id ?? null;

  const loadPolicies = useCallback(async (selectId?: number | null) => {
    setLoading(true);
    try {
      const res = await axios.get(`${MainURL}/appcontrol/policies`);
      const list: VersionPolicy[] = Array.isArray(res.data?.policies) ? res.data.policies : [];
      setPolicies(list);

      const target = selectId != null ? list.find(row => row.id === selectId) : null;
      if (target) {
        setForm(selectId != null ? toForm(target) : toNewFormFromLatest(target));
      } else if (list[0]) {
        setForm(toNewFormFromLatest(list[0]));
      } else if (selectId == null) {
        setForm(EMPTY_FORM);
      }
      return list;
    } catch {
      setPolicies([]);
      window.alert('버전 정책 목록을 불러오지 못했습니다.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const patchForm = (patch: Partial<PolicyForm>) => {
    setForm(prev => ({ ...prev, ...patch }));
  };

  const resetForm = () => {
    const latest = policies[0];
    setForm(latest ? toNewFormFromLatest(latest) : EMPTY_FORM);
  };

  const handleVersionUp = () => {
    const latest = policies[0];
    const base = latest ? toNewFormFromLatest(latest) : { ...form, id: null };
    const currentCode = Number(form.versionCode);
    const baseCode = Number.isFinite(currentCode)
      ? currentCode
      : Number(base.versionCode) || 0;
    const nameBase =
      form.versionName.trim() || base.versionName || String(latest?.versionName ?? '');

    setForm({
      ...base,
      id: null,
      versionCode: String(baseCode + 1),
      versionName: bumpVersionName(nameBase),
    });
    document.querySelector('.admin-app-manage__version-layout')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleEdit = (row: VersionPolicy) => {
    setForm(toForm(row));
    document.querySelector('.admin-app-manage__version-layout')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleDelete = async (row: VersionPolicy) => {
    const label = `#${row.id} (빌드 ${row.versionCode}${row.versionName ? ` · ${row.versionName}` : ''})`;
    if (!window.confirm(`정책 ${label}을(를) 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`)) {
      return;
    }

    setDeletingId(row.id);
    try {
      const res = await axios.delete(`${MainURL}/appcontrol/policy/${row.id}`);
      if (!res.data?.success) {
        window.alert(res.data?.message || '삭제에 실패했습니다.');
        return;
      }
      if (form.id === row.id) {
        resetForm();
      }
      await loadPolicies(form.id === row.id ? null : form.id);
    } catch (error: any) {
      const message = error?.response?.data?.message || '삭제 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    const versionCode = Number(form.versionCode);
    if (!Number.isFinite(versionCode)) {
      window.alert('빌드 번호는 숫자로 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${MainURL}/appcontrol/policy`, {
        id: form.id ?? undefined,
        versionCode,
        versionName: form.versionName.trim() || null,
        forceUpdateEnabled: form.forceUpdateEnabled,
        updateMessage: form.updateMessage.trim() || null,
        storeUrlAndroid: form.storeUrlAndroid.trim() || null,
        storeUrlIos: form.storeUrlIos.trim() || null,
      });
      if (!res.data?.success) {
        window.alert(res.data?.message || '저장에 실패했습니다.');
        return;
      }
      window.alert(
        form.id
          ? '수정되었습니다.'
          : '등록되었습니다. 이 항목이 가장 최신 정책이며 앱 버전 체크 기준이 됩니다.',
      );
      const savedId = Number(res.data?.id ?? form.id) || null;
      await loadPolicies(form.id ? savedId : null);
    } catch (error: any) {
      const message = error?.response?.data?.message || '저장 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const latestSummary = useMemo(() => {
    const latest = policies[0];
    if (!latest) return null;
    const version = `빌드 ${latest.versionCode}${latest.versionName ? ` · ${latest.versionName}` : ''}`;
    const block = Boolean(latest.forceUpdateEnabled)
      ? '구버전 앱 차단'
      : '구버전 앱 허용(안내만, 차단 없음)';
    return `현재 적용: ${version} · ${block}`;
  }, [policies]);

  return (
    <div className="admin-app-manage__section">
      <p className="admin-app-manage__version-hint">
        <strong>맨 위(가장 최근 등록) 정책</strong>만 앱에 적용됩니다. 앱 빌드 번호가 등록한 빌드
        번호보다 낮을 때, 「구버전 앱 차단」이 켜져 있으면 스토어 업데이트 화면만 보입니다.
        {latestSummary ? <> {latestSummary}</> : null}
      </p>

      <div className="admin-app-manage__version-layout">
        <section className="admin-app-manage__card">
          <div className="admin-app-manage__form-card-head">
            <h3 className="admin-app-manage__card-title">
              {form.id ? `정책 수정 #${form.id}` : '새 버전 정책 등록'}
            </h3>
            <button
              type="button"
              className="admin-app-manage__btn admin-app-manage__btn--version-up"
              onClick={handleVersionUp}
              disabled={loading}>
              버전업
            </button>
          </div>
          <p className="admin-app-manage__card-sub admin-app-manage__card-sub--spaced">
            {form.id
              ? form.id === latestPolicyId
                ? '현재 앱에 적용 중인 최신 정책입니다.'
                : '과거 이력 수정입니다. 앱 체크에는 맨 위(최신 등록) 항목만 사용됩니다.'
              : policies[0]
                ? '최신 정책 값이 입력창에 채워져 있습니다. 빌드·버전명을 올린 뒤 등록하세요.'
                : '등록하면 즉시 앱 버전 체크 기준이 됩니다.'}
          </p>

          <div className="admin-app-manage__form-grid">
            <label className="admin-app-manage__field">
              <span>빌드 번호</span>
              <input
                type="number"
                min={0}
                value={form.versionCode}
                onChange={e => patchForm({ versionCode: e.target.value })}
                placeholder="스토어에 올린 빌드 번호 (예: 5)"
              />
            </label>

            <label className="admin-app-manage__field">
              <span>버전명</span>
              <input
                value={form.versionName}
                onChange={e => patchForm({ versionName: e.target.value })}
                placeholder="예: 1.5"
              />
            </label>

            <label className="admin-app-manage__field admin-app-manage__field--full">
              <span>Android 스토어 URL (Google Play)</span>
              <input
                value={form.storeUrlAndroid}
                onChange={e => patchForm({ storeUrlAndroid: e.target.value })}
                placeholder="https://play.google.com/store/apps/details?id=..."
              />
            </label>

            <label className="admin-app-manage__field admin-app-manage__field--full">
              <span>iOS 스토어 URL (App Store)</span>
              <input
                value={form.storeUrlIos}
                onChange={e => patchForm({ storeUrlIos: e.target.value })}
                placeholder="https://apps.apple.com/app/id..."
              />
            </label>

            <label className="admin-app-manage__field admin-app-manage__field--full">
              <span>업데이트 안내 문구</span>
              <textarea
                rows={3}
                value={form.updateMessage}
                onChange={e => patchForm({ updateMessage: e.target.value })}
              />
            </label>

            <div className="admin-app-manage__toggle-card admin-app-manage__field--full">
              <label className="admin-app-manage__toggle-head">
                <input
                  type="checkbox"
                  checked={form.forceUpdateEnabled}
                  onChange={e => patchForm({ forceUpdateEnabled: e.target.checked })}
                />
                <span className="admin-app-manage__toggle-title">구버전 앱 차단</span>
                <ForceBlockPill enabled={form.forceUpdateEnabled} />
              </label>
              <p className="admin-app-manage__toggle-desc">
                {form.forceUpdateEnabled
                  ? '앱 빌드가 위에 입력한 번호보다 낮으면 앱을 막고 스토어로 이동시킵니다. (일반적으로 켜 둡니다)'
                  : '빌드가 낮아도 앱은 그대로 사용할 수 있습니다. 테스트·점검 때만 끄세요.'}
              </p>
            </div>
          </div>

          <div className="admin-app-manage__actions">
            <button
              type="button"
              className="admin-app-manage__btn"
              onClick={() => void handleSave()}
              disabled={saving}>
              {saving ? '저장 중…' : form.id ? '수정 저장' : '등록'}
            </button>
            {form.id ? (
              <button
                type="button"
                className="admin-app-manage__btn admin-app-manage__btn--secondary"
                onClick={resetForm}>
                새로 등록
              </button>
            ) : null}
          </div>
        </section>

        <section className="admin-app-manage__card">
          <div className="admin-app-manage__card-head">
            <div>
              <h3 className="admin-app-manage__card-title">정책 이력</h3>
              <p className="admin-app-manage__card-sub">맨 위 행이 앱에 적용되는 기준입니다.</p>
            </div>
            <button
              type="button"
              className="admin-app-manage__btn admin-app-manage__btn--secondary"
              onClick={() => void loadPolicies(form.id)}
              disabled={loading}>
              {loading ? '새로고침…' : '새로고침'}
            </button>
          </div>

          {loading ? (
            <p className="admin-app-manage__empty">불러오는 중…</p>
          ) : policies.length === 0 ? (
            <p className="admin-app-manage__empty">등록된 정책이 없습니다.</p>
          ) : (
            <div className="admin-app-manage__table-wrap">
              <table className="admin-app-manage__table">
                <thead>
                  <tr>
                    <th>적용</th>
                    <th>빌드</th>
                    <th>버전명</th>
                    <th>Android URL</th>
                    <th>iOS URL</th>
                    <th>구버전</th>
                    <th>등록일</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {policies.map((row, index) => (
                    <tr key={row.id} className={index === 0 ? 'admin-app-manage__row--latest' : ''}>
                      <td>
                        {index === 0 ? (
                          <span className="admin-app-manage__badge-live">적용 중</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{row.versionCode}</td>
                      <td>{row.versionName || '—'}</td>
                      <td title={row.storeUrlAndroid || ''}>{shortenUrl(row.storeUrlAndroid)}</td>
                      <td title={row.storeUrlIos || ''}>{shortenUrl(row.storeUrlIos)}</td>
                      <td>
                        <ForceBlockPill enabled={Boolean(row.forceUpdateEnabled)} />
                      </td>
                      <td>{formatDate(row.createdAt || row.updatedAt)}</td>
                      <td>
                        <div className="admin-app-manage__table-actions">
                          <button
                            type="button"
                            className="admin-app-manage__table-btn"
                            onClick={() => handleEdit(row)}>
                            수정
                          </button>
                          <button
                            type="button"
                            className="admin-app-manage__table-btn admin-app-manage__table-btn--danger"
                            onClick={() => void handleDelete(row)}
                            disabled={deletingId === row.id}>
                            {deletingId === row.id ? '삭제 중…' : '삭제'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
