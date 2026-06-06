import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  type CreateFinancePayload,
  type FinanceRecord,
  type FinanceSummaryItem,
  type CreateRecurringExpensePayload,
  type RecurringExpense,
  createFinanceRecord,
  createRecurringExpense,
  fetchFinanceList,
  fetchRecurringExpenses,
  fetchFinanceSummary,
  patchRecurringExpense,
} from './financeApi';
import { getAdminSession, isSuperAdmin } from '../adminSession';
import './FinanceDashboard.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type FinanceFilter = 'ALL' | 'REVENUE' | 'EXPENSE';

const EMPTY_FORM: CreateFinancePayload = {
  type: 'REVENUE',
  category: '',
  amount: 0,
  description: '',
  transaction_date: '',
  cash_flow_date: '',
};

const EMPTY_RECURRING_FORM: CreateRecurringExpensePayload = {
  category: '',
  amount: 0,
  repeat_day: 1,
  description: '',
};

const EXPENSE_CATEGORIES = [
  '식비(복리후생)',
  '식비(접대비)',
  '인건비/외주비',
  '서버/SaaS구독료',
  '교육훈련비',
  '임대료/관리비',
  '세금/공과금',
  '광고선전비',
  '여비교통비',
  '소모품비/비품',
  '기타지출',
];

const REVENUE_CATEGORIES = [
  '서비스 구독료',
  '건별 이용료/인앱결제',
  '플랫폼 중개수수료',
  '외주/용역 매출',
  '상품/콘텐츠 판매',
  '광고/입점료',
  '정부지원금',
  '이자수입',
  '기타매출',
];

function numberKRW(value: number) {
  return value.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
}

function formatNumberInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';
  return value.toLocaleString('ko-KR');
}

function parseNumberInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  return Number(digitsOnly);
}

function currentMonthPrefix() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function FinanceDashboard() {
  const canViewOwnerSummary = isSuperAdmin(getAdminSession());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recurringSubmitting, setRecurringSubmitting] = useState(false);
  const [recurringSwitchingId, setRecurringSwitchingId] = useState<number | null>(null);
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummaryItem[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [filter, setFilter] = useState<FinanceFilter>('ALL');
  const [form, setForm] = useState<CreateFinancePayload>(EMPTY_FORM);
  const [recurringForm, setRecurringForm] = useState<CreateRecurringExpensePayload>(EMPTY_RECURRING_FORM);
  const financeCategories = form.type === 'REVENUE' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summaryRes, recurring] = await Promise.all([
        fetchFinanceList(),
        fetchFinanceSummary(12),
        fetchRecurringExpenses(),
      ]);
      setRecords(list);
      setSummary(summaryRes.data);
      setRecurringExpenses(recurring);
    } catch (err) {
      console.error('finance load failed:', err);
      setRecords([]);
      setSummary([]);
      setRecurringExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredRecords = useMemo(() => {
    if (filter === 'ALL') return records;
    return records.filter((row) => row.type === filter);
  }, [records, filter]);

  const monthPrefix = currentMonthPrefix();
  const monthTotals = useMemo(() => {
    const currentMonthRows = records.filter((row) => {
      const date = row.cash_flow_date || row.transaction_date;
      return date ? date.startsWith(monthPrefix) : false;
    });
    const revenue = currentMonthRows
      .filter((row) => row.type === 'REVENUE')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const expense = currentMonthRows
      .filter((row) => row.type === 'EXPENSE')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { revenue, expense, net: revenue - expense };
  }, [records, monthPrefix]);

  const chartData = useMemo(
    () => ({
      labels: summary.map((s) => s.month),
      datasets: [
        {
          label: '매출',
          data: summary.map((s) => s.revenue),
          backgroundColor: 'rgba(22, 163, 74, 0.75)',
          borderRadius: 6,
        },
        {
          label: '매입',
          data: summary.map((s) => s.expense),
          backgroundColor: 'rgba(220, 38, 38, 0.75)',
          borderRadius: 6,
        },
      ],
    }),
    [summary]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => `${Number(value).toLocaleString('ko-KR')}원`,
        },
      },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = String(form.category || '').trim();
    const amount = Number(form.amount);

    if (!category || !Number.isFinite(amount) || amount <= 0) {
      alert('카테고리와 올바른 금액을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await createFinanceRecord({
        ...form,
        category,
        amount,
        description: String(form.description || '').trim(),
        transaction_date: form.transaction_date || null,
        cash_flow_date: form.cash_flow_date || null,
      });
      setForm(EMPTY_FORM);
      await loadAll();
      alert('재무 내역이 등록되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = String(recurringForm.category || '').trim();
    const amount = Number(recurringForm.amount);
    const repeatDay = Number(recurringForm.repeat_day);

    if (!category || !Number.isFinite(amount) || amount <= 0) {
      alert('카테고리와 올바른 금액을 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(repeatDay) || repeatDay < 1 || repeatDay > 31) {
      alert('반복일은 1~31 사이의 정수여야 합니다.');
      return;
    }

    setRecurringSubmitting(true);
    try {
      await createRecurringExpense({
        category,
        amount,
        repeat_day: repeatDay,
        description: String(recurringForm.description || '').trim(),
      });
      setRecurringForm(EMPTY_RECURRING_FORM);
      const recurring = await fetchRecurringExpenses();
      setRecurringExpenses(recurring);
      alert('고정비 규칙이 등록되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '고정비 등록에 실패했습니다.');
    } finally {
      setRecurringSubmitting(false);
    }
  };

  const handleToggleRecurring = async (item: RecurringExpense) => {
    const nextIsActive: 0 | 1 = item.is_active === 1 ? 0 : 1;
    setRecurringSwitchingId(item.id);
    try {
      const updated = await patchRecurringExpense(item.id, { is_active: nextIsActive });
      setRecurringExpenses((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
    } catch (err) {
      alert(err instanceof Error ? err.message : '활성 상태 변경에 실패했습니다.');
    } finally {
      setRecurringSwitchingId(null);
    }
  };

  return (
    <div className="finance-dashboard">
      {canViewOwnerSummary && (
        <>
          <div className="finance-dashboard__cards">
            <article className="finance-dashboard__card">
              <p className="finance-dashboard__card-label">당월 총 매출</p>
              <p className="finance-dashboard__card-value finance-dashboard__card-value--revenue">
                {numberKRW(monthTotals.revenue)}
              </p>
            </article>
            <article className="finance-dashboard__card">
              <p className="finance-dashboard__card-label">당월 총 매입</p>
              <p className="finance-dashboard__card-value finance-dashboard__card-value--expense">
                {numberKRW(monthTotals.expense)}
              </p>
            </article>
            <article className="finance-dashboard__card">
              <p className="finance-dashboard__card-label">당월 순이익</p>
              <p className="finance-dashboard__card-value">{numberKRW(monthTotals.net)}</p>
            </article>
          </div>

          <section className="finance-dashboard__chart-panel">
            <h3 className="finance-dashboard__section-title">월별 매입/매출 비교</h3>
            {summary.length === 0 ? (
              <p className="finance-dashboard__empty">월별 통계 데이터가 없습니다.</p>
            ) : (
              <div className="finance-dashboard__chart-wrap">
                <div className="finance-dashboard__chart-inner">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </section>
        </>
      )}

      <section className="finance-dashboard__form-panel">
        <h3 className="finance-dashboard__section-title">매입/매출 등록</h3>
        <form onSubmit={handleSubmit}>
          <div className="finance-dashboard__form-grid">
            <div className="finance-dashboard__field">
              <label htmlFor="finance-type">구분</label>
              <div id="finance-type" className="finance-dashboard__chips" role="group" aria-label="구분 선택">
                <button
                  type="button"
                  className={`finance-dashboard__chip${form.type === 'REVENUE' ? ' is-selected' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, type: 'REVENUE' }))}
                >
                  매출
                </button>
                <button
                  type="button"
                  className={`finance-dashboard__chip${form.type === 'EXPENSE' ? ' is-selected' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, type: 'EXPENSE' }))}
                >
                  매입
                </button>
              </div>
            </div>
            <div className="finance-dashboard__field finance-dashboard__field--wide">
              <label htmlFor="finance-category">카테고리</label>
              <div id="finance-category" className="finance-dashboard__chips" role="group" aria-label="카테고리 선택">
                {financeCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`finance-dashboard__chip${form.category === category ? ' is-selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, category }))}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="finance-dashboard__field">
              <label htmlFor="finance-amount">금액</label>
              <input
                id="finance-amount"
                type="text"
                inputMode="numeric"
                value={formatNumberInput(Number(form.amount || 0))}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: parseNumberInput(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="finance-dashboard__field">
              <label htmlFor="finance-transaction-date">기준일</label>
              <input
                id="finance-transaction-date"
                type="date"
                value={form.transaction_date || ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    transaction_date: e.target.value,
                    cash_flow_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="finance-dashboard__field">
              <label htmlFor="finance-cashflow-date">입출금일</label>
              <input
                id="finance-cashflow-date"
                type="date"
                value={form.cash_flow_date || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, cash_flow_date: e.target.value }))}
              />
            </div>
            <div className="finance-dashboard__field finance-dashboard__field--wide">
              <label htmlFor="finance-description">메모</label>
              <textarea
                id="finance-description"
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="상세 메모를 입력하세요."
              />
            </div>
          </div>
          <div className="finance-dashboard__form-actions">
            <button className="finance-dashboard__submit-btn" type="submit" disabled={submitting}>
              {submitting ? '등록 중…' : '내역 등록'}
            </button>
          </div>
        </form>
      </section>

      <section className="finance-dashboard__table-panel">
        <h3 className="finance-dashboard__section-title">최근 거래 내역</h3>
        <div className="finance-dashboard__toolbar">
          <select
            className="finance-dashboard__filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FinanceFilter)}
          >
            <option value="ALL">전체</option>
            <option value="REVENUE">매출</option>
            <option value="EXPENSE">매입</option>
          </select>
        </div>
        {loading ? (
          <p className="finance-dashboard__empty">불러오는 중…</p>
        ) : filteredRecords.length === 0 ? (
          <p className="finance-dashboard__empty">거래 내역이 없습니다.</p>
        ) : (
          <div className="finance-dashboard__table-wrap">
            <table className="finance-dashboard__table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>카테고리</th>
                  <th>금액</th>
                  <th>기준일</th>
                  <th>입출금일</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className={`finance-dashboard__type-badge ${
                          row.type === 'REVENUE'
                            ? 'finance-dashboard__type-badge--revenue'
                            : 'finance-dashboard__type-badge--expense'
                        }`}
                      >
                        {row.type === 'REVENUE' ? '매출' : '매입'}
                      </span>
                    </td>
                    <td>{row.category}</td>
                    <td
                      className={
                        row.type === 'REVENUE'
                          ? 'finance-dashboard__amount--revenue'
                          : 'finance-dashboard__amount--expense'
                      }
                    >
                      {numberKRW(Number(row.amount || 0))}
                    </td>
                    <td>{row.transaction_date || '—'}</td>
                    <td>{row.cash_flow_date || '—'}</td>
                    <td>{row.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="finance-dashboard__recurring-panel">
        <div className="finance-dashboard__recurring-head">
          <h3 className="finance-dashboard__section-title">고정비 관리</h3>
          <p className="finance-dashboard__hint">매월 반복되는 매입 항목을 설정하고 활성 상태를 관리할 수 있습니다.</p>
        </div>

        <form onSubmit={handleRecurringSubmit}>
          <div className="finance-dashboard__form-grid finance-dashboard__form-grid--recurring">
            <div className="finance-dashboard__field finance-dashboard__field--wide">
              <label htmlFor="recurring-category">카테고리</label>
              <div id="recurring-category" className="finance-dashboard__chips" role="group" aria-label="고정비 카테고리 선택">
                {EXPENSE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`finance-dashboard__chip${
                      recurringForm.category === category ? ' is-selected' : ''
                    }`}
                    onClick={() => setRecurringForm((prev) => ({ ...prev, category }))}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="finance-dashboard__field">
              <label htmlFor="recurring-amount">금액</label>
              <input
                id="recurring-amount"
                type="text"
                inputMode="numeric"
                value={formatNumberInput(Number(recurringForm.amount || 0))}
                onChange={(e) =>
                  setRecurringForm((prev) => ({ ...prev, amount: parseNumberInput(e.target.value) }))
                }
                placeholder="0"
              />
            </div>
            <div className="finance-dashboard__field">
              <label htmlFor="recurring-repeat-day">매월 반복일</label>
              <input
                id="recurring-repeat-day"
                type="number"
                min={1}
                max={31}
                value={recurringForm.repeat_day}
                onChange={(e) =>
                  setRecurringForm((prev) => ({ ...prev, repeat_day: Number(e.target.value || 1) }))
                }
              />
            </div>
            <div className="finance-dashboard__field finance-dashboard__field--wide">
              <label htmlFor="recurring-description">메모</label>
              <textarea
                id="recurring-description"
                value={recurringForm.description || ''}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="고정비에 대한 설명을 입력하세요."
              />
            </div>
          </div>
          <div className="finance-dashboard__form-actions">
            <button className="finance-dashboard__submit-btn" type="submit" disabled={recurringSubmitting}>
              {recurringSubmitting ? '등록 중…' : '고정비 등록'}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="finance-dashboard__empty">고정비 목록을 불러오는 중…</p>
        ) : recurringExpenses.length === 0 ? (
          <p className="finance-dashboard__empty">등록된 고정비 규칙이 없습니다.</p>
        ) : (
          <div className="finance-dashboard__table-wrap">
            <table className="finance-dashboard__table finance-dashboard__table--recurring">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>금액</th>
                  <th>반복일</th>
                  <th>메모</th>
                  <th>활성화</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td className="finance-dashboard__amount--expense">{numberKRW(Number(item.amount || 0))}</td>
                    <td>매월 {item.repeat_day}일</td>
                    <td>{item.description || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`finance-dashboard__switch${item.is_active === 1 ? ' is-on' : ''}`}
                        onClick={() => void handleToggleRecurring(item)}
                        disabled={recurringSwitchingId === item.id}
                        aria-label={`고정비 ${item.category} 활성화 토글`}
                      >
                        <span className="finance-dashboard__switch-thumb" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
