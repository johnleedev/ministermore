import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaRedo,
  FaSpinner,
  FaTasks,
} from 'react-icons/fa';
import TodoTemplatesPanel from './TodoTemplatesPanel';
import { getAdminSession, isSuperAdmin } from '../adminSession';
import {
  type AdminEmployee,
  type AdminTodo,
  type CreateTodoPayload,
  type TodoPriority,
  type TodoStatus,
  createTodo,
  deleteTodo,
  fetchEmployees,
  fetchTodos,
  generateDailyTodos,
  updateTodo,
} from './adminTodoApi';
import './AdminTodoManage.scss';

type ViewFilter = 'all' | TodoStatus | 'overdue';
type QuickFilter = 'all' | TodoStatus | 'overdue';
type SidebarView = ViewFilter | 'templates';

const SIDEBAR_NAV: { value: ViewFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '전체 작업', icon: <FaTasks className="admin-todo-manage__nav-icon" /> },
  { value: 'todo', label: '예정된 작업', icon: <FaClock className="admin-todo-manage__nav-icon" /> },
  { value: 'in_progress', label: '진행중', icon: <FaSpinner className="admin-todo-manage__nav-icon" /> },
  { value: 'done', label: '완료된 작업', icon: <FaCheckCircle className="admin-todo-manage__nav-icon" /> },
  {
    value: 'overdue',
    label: '지연된 작업',
    icon: <FaExclamationTriangle className="admin-todo-manage__nav-icon" />,
  },
];

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'in_progress', label: '진행중' },
  { value: 'done', label: '완료' },
  { value: 'overdue', label: '지연' },
];

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: 'todo', label: '대기' },
  { value: 'in_progress', label: '진행중' },
  { value: 'done', label: '완료' },
];

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '중간' },
  { value: 'low', label: '낮음' },
];

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const EMPTY_FORM = {
  assignee_id: '',
  title: '',
  description: '',
  priority: 'medium' as TodoPriority,
  due_date: '',
};

type TodoFormState = typeof EMPTY_FORM;

function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateOnly(value: string | null): Date | null {
  const normalized = normalizeDateText(value);
  if (!normalized) return null;
  const d = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeDateText(value: string | null): string | null {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

/** 마감일이 오늘 이전이거나 오늘인 경우 */
export function isDueUrgent(dueDate: string | null): boolean {
  const due = parseDateOnly(dueDate);
  if (!due) return false;
  const today = parseDateOnly(todayDateString());
  if (!today) return false;
  return due.getTime() <= today.getTime();
}

function isOverdue(todo: AdminTodo): boolean {
  return isDueUrgent(todo.due_date) && todo.status !== 'done';
}

function formatDueDisplay(dueDate: string | null): string {
  const normalized = normalizeDateText(dueDate);
  if (!normalized) return '마감일 없음';
  const [y, m, d] = normalized.split('-');
  if (y && m && d) return `${y}.${m}.${d}`;
  return normalized;
}

function assigneeInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : '?';
}

function assigneeLabel(emp: AdminEmployee): string {
  const parts = [emp.name];
  if (emp.department) parts.push(emp.department);
  if (emp.position) parts.push(emp.position);
  return parts.join(' · ');
}

function matchesViewFilter(todo: AdminTodo, view: ViewFilter): boolean {
  if (view === 'all') return true;
  if (view === 'overdue') return isOverdue(todo);
  return todo.status === view;
}

function matchesQuickFilter(todo: AdminTodo, quick: QuickFilter): boolean {
  if (quick === 'all') return true;
  if (quick === 'overdue') return isOverdue(todo);
  return todo.status === quick;
}

export default function AdminTodoManage() {
  const session = getAdminSession();
  const superAdmin = isSuperAdmin(session);
  const requesterId = session?.id ?? 0;

  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const [sidebarView, setSidebarView] = useState<SidebarView>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminTodo | null>(null);
  const [editForm, setEditForm] = useState<TodoFormState>(EMPTY_FORM);

  const loadData = useCallback(async () => {
    if (!requesterId) {
      setError('로그인 정보가 없습니다. 다시 로그인해 주세요.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [empList, todoList] = await Promise.all([
        fetchEmployees(requesterId),
        fetchTodos(requesterId),
      ]);
      setEmployees(empList);
      setTodos(todoList);
    } catch {
      setError('데이터를 불러오지 못했습니다. 서버 연결을 확인해 주세요.');
      setEmployees([]);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [requesterId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refreshTodos = useCallback(async () => {
    if (!requesterId) return;
    const todoList = await fetchTodos(requesterId);
    setTodos(todoList);
  }, [requesterId]);

  const handleGenerateDaily = async () => {
    if (!requesterId) return;
    if (
      !window.confirm(
        '내가 등록한 반복 업무를 오늘 날짜로 「전체 작업」에 일괄 추가할까요?'
      )
    ) {
      return;
    }

    setGeneratingDaily(true);
    try {
      const result = await generateDailyTodos(requesterId);
      await refreshTodos();
      setSidebarView('all');
      setQuickFilter('all');
      const count = result.insertedCount;
      alert(
        count > 0
          ? `오늘(${result.due_date}) 내 반복 업무 ${count}건이 전체 작업에 등록되었습니다.`
          : '등록된 내 반복 업무가 없습니다. 「오늘의 반복 업무」 메뉴에서 먼저 등록해 주세요.'
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '일괄 등록에 실패했습니다.');
    } finally {
      setGeneratingDaily(false);
    }
  };

  const stats = useMemo(() => {
    const scoped =
      superAdmin && assigneeFilter !== 'all'
        ? todos.filter((t) => String(t.assignee_id) === assigneeFilter)
        : todos;
    return {
      total: scoped.length,
      done: scoped.filter((t) => t.status === 'done').length,
      inProgress: scoped.filter((t) => t.status === 'in_progress').length,
      overdue: scoped.filter((t) => isOverdue(t)).length,
    };
  }, [todos, assigneeFilter, superAdmin]);

  const isTemplatesView = sidebarView === 'templates';
  const todoViewFilter: ViewFilter = isTemplatesView ? 'all' : sidebarView;
  const today = todayDateString();

  const calendarCells = useMemo(() => {
    const firstDay = startOfMonth(calendarMonth);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
    const cells: Array<{ key: string; date: Date | null }> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ key: `empty-${i}`, date: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        key: `day-${day}`,
        date: new Date(firstDay.getFullYear(), firstDay.getMonth(), day),
      });
    }
    return cells;
  }, [calendarMonth]);

  const filteredTodos = useMemo(() => {
    if (isTemplatesView) return [];
    return todos.filter((todo) => {
      if (superAdmin && assigneeFilter !== 'all' && String(todo.assignee_id) !== assigneeFilter) {
        return false;
      }
      if (selectedDateFilter && normalizeDateText(todo.due_date) !== selectedDateFilter) {
        return false;
      }
      if (!matchesViewFilter(todo, todoViewFilter)) return false;
      if (!matchesQuickFilter(todo, quickFilter)) return false;
      return true;
    });
  }, [todos, assigneeFilter, selectedDateFilter, todoViewFilter, quickFilter, superAdmin, isTemplatesView]);

  const handleSidebarSelect = (value: ViewFilter) => {
    setSidebarView(value);
    if (value === 'overdue') {
      setQuickFilter('overdue');
    } else if (value === 'all') {
      setQuickFilter('all');
    } else {
      setQuickFilter(value);
    }
  };

  const handleQuickFilterSelect = (value: QuickFilter) => {
    setQuickFilter(value);
    if (value === 'all') setSidebarView('all');
    else if (value === 'overdue') setSidebarView('overdue');
    else setSidebarView(value);
  };

  const openCreateForm = () => {
    setForm({
      ...EMPTY_FORM,
      assignee_id: superAdmin ? '' : String(requesterId),
    });
    setFormOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterId) return;

    const assigneeId = superAdmin ? Number(form.assignee_id) : requesterId;
    const title = form.title.trim();
    if (!assigneeId || !title) {
      alert(superAdmin ? '담당 직원과 제목을 입력해 주세요.' : '제목을 입력해 주세요.');
      return;
    }

    const payload: CreateTodoPayload = {
      assignee_id: assigneeId,
      title,
      priority: form.priority,
      description: form.description.trim() || undefined,
      due_date: form.due_date.trim() || null,
    };

    setSaving(true);
    try {
      const created = await createTodo(requesterId, payload);
      setTodos((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (todo: AdminTodo, status: TodoStatus) => {
    if (todo.status === status) return;
    setActingId(todo.id);
    try {
      const updated = await updateTodo(requesterId, todo.id, { status });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (todo: AdminTodo) => {
    if (!window.confirm(`"${todo.title}" 할 일을 삭제할까요?`)) return;
    setActingId(todo.id);
    try {
      await deleteTodo(requesterId, todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const closeForm = () => {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  };

  const openEditForm = (todo: AdminTodo) => {
    setEditTarget(todo);
    setEditForm({
      assignee_id: String(todo.assignee_id),
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
    });
    setEditOpen(true);
  };

  const closeEditForm = () => {
    setEditTarget(null);
    setEditForm(EMPTY_FORM);
    setEditOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterId || !editTarget) return;

    const title = editForm.title.trim();
    if (!title) {
      alert('제목을 입력해 주세요.');
      return;
    }

    const assigneeId = superAdmin ? Number(editForm.assignee_id) : editTarget.assignee_id;
    if (superAdmin && !assigneeId) {
      alert('담당 직원을 선택해 주세요.');
      return;
    }

    setSaving(true);
    setActingId(editTarget.id);
    try {
      const updated = await updateTodo(requesterId, editTarget.id, {
        title,
        description: editForm.description.trim() || null,
        priority: editForm.priority,
        due_date: editForm.due_date.trim() || null,
        ...(superAdmin ? { assignee_id: assigneeId } : {}),
      });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      closeEditForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setSaving(false);
      setActingId(null);
    }
  };

  if (!session?.id) {
    return (
      <div className="admin-todo-manage">
        <p className="admin-todo-manage__empty">로그인 후 이용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="admin-todo-manage">
      <header className="admin-todo-manage__header">
        <div>
          <h1 className="admin-todo-manage__title">
            {superAdmin ? '할 일 관리' : '내 할 일'}
          </h1>
          <p className="admin-todo-manage__subtitle">
            {isTemplatesView
              ? `${session.name}님의 매일 반복할 업무를 직접 등록·관리합니다.`
              : superAdmin
                ? `총 ${stats.total}개의 작업 중 ${stats.done}개 완료`
                : `${session.name}님 · 총 ${stats.total}개 중 ${stats.done}개 완료`}
          </p>
        </div>
        <div className="admin-todo-manage__header-actions">
          <button
            type="button"
            className="admin-todo-manage__refresh-btn"
            onClick={() => void loadData()}
            disabled={loading}
          >
            새로고침
          </button>
          {!isTemplatesView && (
            <button
              type="button"
              className="admin-todo-manage__add-btn"
              onClick={openCreateForm}
            >
              <FaPlus />
              새 작업
            </button>
          )}
        </div>
      </header>

      <div className="admin-todo-manage__grid">
        <aside className="admin-todo-manage__sidebar">
          {SIDEBAR_NAV.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`admin-todo-manage__nav-item${
                sidebarView === item.value ? ' admin-todo-manage__nav-item--active' : ''
              }`}
              onClick={() => handleSidebarSelect(item.value)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`admin-todo-manage__nav-item${
              isTemplatesView ? ' admin-todo-manage__nav-item--active' : ''
            }`}
            onClick={() => setSidebarView('templates')}
          >
            <FaRedo className="admin-todo-manage__nav-icon" />
            <span>오늘의 반복 업무 (내 업무)</span>
          </button>
          <div className="admin-todo-manage__calendar-wrap">
            <div className="admin-todo-manage__calendar-header">
              <strong className="admin-todo-manage__calendar-title">
                {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
              </strong>
              <div className="admin-todo-manage__calendar-nav">
                <button
                  type="button"
                  className="admin-todo-manage__calendar-nav-btn"
                  onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                  aria-label="이전 달"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="admin-todo-manage__calendar-nav-btn"
                  onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                  aria-label="다음 달"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="admin-todo-manage__calendar-weekdays">
              {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="admin-todo-manage__calendar-grid">
              {calendarCells.map((cell) => {
                if (!cell.date) {
                  return <span key={cell.key} className="admin-todo-manage__calendar-cell admin-todo-manage__calendar-cell--empty" />;
                }
                const dateText = formatDateOnly(cell.date);
                const isSelected = selectedDateFilter === dateText;
                const isToday = dateText === today;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`admin-todo-manage__calendar-cell${
                      isSelected ? ' admin-todo-manage__calendar-cell--selected' : ''
                    }${isToday ? ' admin-todo-manage__calendar-cell--today' : ''}`}
                    onClick={() =>
                      setSelectedDateFilter((prev) => (prev === dateText ? null : dateText))
                    }
                    title={`${dateText} 작업 보기`}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="admin-todo-manage__calendar-clear"
              onClick={() => setSelectedDateFilter(null)}
              disabled={selectedDateFilter == null}
            >
              날짜 필터 해제
            </button>
          </div>
          {superAdmin && (
            <div className="admin-todo-manage__assignee-wrap">
              <label className="admin-todo-manage__assignee-label" htmlFor="todo-assignee-filter">
                담당 직원
              </label>
              <select
                id="todo-assignee-filter"
                className="admin-todo-manage__assignee-select"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="all">전체 직원</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {assigneeLabel(emp)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>

        <div className="admin-todo-manage__main-panel">
          {error && <div className="admin-todo-manage__error">{error}</div>}

          {isTemplatesView ? (
            <TodoTemplatesPanel
              session={session}
              requesterId={requesterId}
              generatingDaily={generatingDaily}
              generateDisabled={loading}
              onGenerateDaily={() => void handleGenerateDaily()}
            />
          ) : (
            <>
              <div className="admin-todo-manage__stats-bar">
                <div className="admin-todo-manage__stat-item">
                  <span className="admin-todo-manage__stat-number">{stats.total}</span>
                  <span>전체 작업</span>
                </div>
                <div className="admin-todo-manage__stat-item">
                  <span className="admin-todo-manage__stat-number">{stats.done}</span>
                  <span>완료</span>
                </div>
                <div className="admin-todo-manage__stat-item">
                  <span className="admin-todo-manage__stat-number">{stats.inProgress}</span>
                  <span>진행중</span>
                </div>
                <div className="admin-todo-manage__stat-item">
                  <span className="admin-todo-manage__stat-number">{stats.overdue}</span>
                  <span>지연</span>
                </div>
              </div>

              <div className="admin-todo-manage__filter-bar">
                <div className="admin-todo-manage__filter-tabs">
                  {QUICK_FILTERS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      className={`admin-todo-manage__filter-btn${
                        quickFilter === tab.value ? ' admin-todo-manage__filter-btn--active' : ''
                      }`}
                      onClick={() => handleQuickFilterSelect(tab.value)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-todo-manage__generate-daily-btn"
                  disabled={loading || generatingDaily}
                  onClick={() => void handleGenerateDaily()}
                >
                  {generatingDaily ? (
                    <>
                      <FaSpinner className="admin-todo-manage__generate-daily-btn-icon admin-todo-manage__generate-daily-btn-icon--spin" aria-hidden />
                      생성 중…
                    </>
                  ) : (
                    <>
                      <FaRedo className="admin-todo-manage__generate-daily-btn-icon" aria-hidden />
                      오늘의 반복 업무 일괄 등록
                    </>
                  )}
                </button>
              </div>

              {loading ? (
                <p className="admin-todo-manage__loading">불러오는 중…</p>
              ) : filteredTodos.length === 0 ? (
                <p className="admin-todo-manage__empty">
                  {selectedDateFilter
                    ? `${selectedDateFilter}에 해당하는 작업이 없습니다.`
                    : '표시할 작업이 없습니다.'}
                </p>
              ) : (
                <ul className="admin-todo-manage__todo-list">
              {filteredTodos.map((todo) => {
                const urgent = isOverdue(todo);
                const dept =
                  [todo.assignee_department, todo.assignee_position].filter(Boolean).join(' · ') ||
                  '-';
                return (
                  <li
                    key={todo.id}
                    className={`admin-todo-manage__todo-item${
                      urgent ? ' admin-todo-manage__todo-item--urgent' : ''
                    }`}
                  >
                    <span
                      className={`admin-todo-manage__status-badge admin-todo-manage__status-badge--${todo.status}`}
                      aria-label={`현재 상태: ${STATUS_OPTIONS.find((s) => s.value === todo.status)?.label ?? todo.status}`}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === todo.status)?.label ?? todo.status}
                    </span>
                    <div className="admin-todo-manage__avatar" aria-hidden>
                      {assigneeInitial(todo.assignee_name)}
                    </div>
                    <div className="admin-todo-manage__todo-content">
                      <h3 className="admin-todo-manage__todo-title">{todo.title}</h3>
                      {todo.description && (
                        <p className="admin-todo-manage__todo-desc">{todo.description}</p>
                      )}
                      <div className="admin-todo-manage__todo-meta">
                        <span
                          className={`admin-todo-manage__priority-tag admin-todo-manage__priority-tag--${todo.priority}`}
                        >
                          {PRIORITY_LABEL[todo.priority]}
                        </span>
                        <span>{dept}</span>
                        <span>{formatDueDisplay(todo.due_date)}</span>
                      </div>
                    </div>
                    <div className="admin-todo-manage__todo-actions">
                      <div className="admin-todo-manage__status-btns" role="group" aria-label="상태 변경">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            className={`admin-todo-manage__status-btn admin-todo-manage__status-btn--${s.value}${
                              todo.status === s.value ? ' admin-todo-manage__status-btn--active' : ''
                            }`}
                            disabled={actingId === todo.id}
                            onClick={() => void handleStatusChange(todo, s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="admin-todo-manage__edit-btn"
                        disabled={actingId === todo.id}
                        onClick={() => openEditForm(todo)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="admin-todo-manage__delete-btn"
                        disabled={actingId === todo.id}
                        onClick={() => void handleDelete(todo)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                );
              })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <div
          className="admin-todo-manage__modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="admin-todo-manage__modal" role="dialog" aria-labelledby="todo-form-title">
            <div className="admin-todo-manage__modal-header">
              <h2 id="todo-form-title" className="admin-todo-manage__modal-title">
                새 작업 등록
              </h2>
              <button
                type="button"
                className="admin-todo-manage__modal-close"
                onClick={closeForm}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="admin-todo-manage__form">
              {superAdmin ? (
                <div className="admin-todo-manage__field">
                  <label htmlFor="todo-form-assignee">담당 직원 *</label>
                  <select
                    id="todo-form-assignee"
                    required
                    value={form.assignee_id}
                    onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                  >
                    <option value="">선택</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {assigneeLabel(emp)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="admin-todo-manage__form-self-hint">
                  담당자: <strong>{session.name}</strong> (본인에게 등록됩니다)
                </p>
              )}
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-form-title-input">제목 *</label>
                <input
                  id="todo-form-title-input"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="할 일 제목"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-form-desc">내용</label>
                <textarea
                  id="todo-form-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="상세 내용 (선택)"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-form-priority">우선순위</label>
                <select
                  id="todo-form-priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value as TodoPriority }))
                  }
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-form-due">마감일</label>
                <input
                  id="todo-form-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div className="admin-todo-manage__form-actions">
                <button type="button" className="admin-todo-manage__btn-secondary" onClick={closeForm}>
                  취소
                </button>
                <button type="submit" className="admin-todo-manage__btn-primary" disabled={saving}>
                  {saving ? '등록 중…' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && editTarget && (
        <div
          className="admin-todo-manage__modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditForm();
          }}
        >
          <div className="admin-todo-manage__modal" role="dialog" aria-labelledby="todo-edit-form-title">
            <div className="admin-todo-manage__modal-header">
              <h2 id="todo-edit-form-title" className="admin-todo-manage__modal-title">
                작업 수정
              </h2>
              <button
                type="button"
                className="admin-todo-manage__modal-close"
                onClick={closeEditForm}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="admin-todo-manage__form">
              {superAdmin ? (
                <div className="admin-todo-manage__field">
                  <label htmlFor="todo-edit-form-assignee">담당 직원 *</label>
                  <select
                    id="todo-edit-form-assignee"
                    required
                    value={editForm.assignee_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, assignee_id: e.target.value }))}
                  >
                    <option value="">선택</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={String(emp.id)}>
                        {assigneeLabel(emp)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="admin-todo-manage__form-self-hint">
                  담당자: <strong>{editTarget.assignee_name}</strong>
                </p>
              )}

              <div className="admin-todo-manage__field">
                <label htmlFor="todo-edit-form-title-input">제목 *</label>
                <input
                  id="todo-edit-form-title-input"
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="할 일 제목"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-edit-form-desc">내용</label>
                <textarea
                  id="todo-edit-form-desc"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="상세 내용 (선택)"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-edit-form-priority">우선순위</label>
                <select
                  id="todo-edit-form-priority"
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, priority: e.target.value as TodoPriority }))
                  }
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="todo-edit-form-due">마감일</label>
                <input
                  id="todo-edit-form-due"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div className="admin-todo-manage__form-actions">
                <button
                  type="button"
                  className="admin-todo-manage__btn-secondary"
                  onClick={closeEditForm}
                >
                  취소
                </button>
                <button type="submit" className="admin-todo-manage__btn-primary" disabled={saving}>
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
