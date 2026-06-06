import { useCallback, useEffect, useState } from 'react';
import { FaPlus, FaRedo, FaSpinner } from 'react-icons/fa';
import type { AdminSession } from '../adminSession';
import {
  type AdminTodoTemplate,
  type TodoPriority,
  createTodoTemplate,
  deleteTodoTemplate,
  fetchTodoTemplates,
  updateTodoTemplate,
} from './adminTodoApi';

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

const EMPTY_TEMPLATE_FORM = {
  title: '',
  description: '',
  priority: 'medium' as TodoPriority,
};

type TemplateFormState = typeof EMPTY_TEMPLATE_FORM;

type TodoTemplatesPanelProps = {
  session: AdminSession;
  requesterId: number;
  generatingDaily?: boolean;
  generateDisabled?: boolean;
  onGenerateDaily?: () => void;
};

export default function TodoTemplatesPanel({
  session,
  requesterId,
  generatingDaily = false,
  generateDisabled = false,
  onGenerateDaily,
}: TodoTemplatesPanelProps) {
  const [templates, setTemplates] = useState<AdminTodoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_TEMPLATE_FORM);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminTodoTemplate | null>(null);
  const [editForm, setEditForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const templateList = await fetchTodoTemplates(requesterId);
      setTemplates(templateList);
    } catch {
      setError('내 반복 업무 목록을 불러오지 못했습니다.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [requesterId]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const openCreateForm = () => {
    setForm(EMPTY_TEMPLATE_FORM);
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(EMPTY_TEMPLATE_FORM);
    setFormOpen(false);
  };

  const openEditForm = (template: AdminTodoTemplate) => {
    setEditTarget(template);
    setEditForm({
      title: template.title,
      description: template.description || '',
      priority: template.priority,
    });
    setEditOpen(true);
  };

  const closeEditForm = () => {
    setEditTarget(null);
    setEditForm(EMPTY_TEMPLATE_FORM);
    setEditOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      alert('제목을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const created = await createTodoTemplate(requesterId, {
        title,
        priority: form.priority,
        description: form.description.trim() || undefined,
      });
      setTemplates((prev) => [...prev, created]);
      closeForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePriorityChange = async (template: AdminTodoTemplate, priority: TodoPriority) => {
    if (template.priority === priority) return;
    setActingId(template.id);
    try {
      const updated = await updateTodoTemplate(requesterId, template.id, { priority });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : '우선순위 변경에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (template: AdminTodoTemplate) => {
    if (!window.confirm(`"${template.title}" 반복 업무를 삭제할까요?`)) return;
    setActingId(template.id);
    try {
      await deleteTodoTemplate(requesterId, template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActingId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const title = editForm.title.trim();
    if (!title) {
      alert('제목을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setActingId(editTarget.id);
    try {
      const updated = await updateTodoTemplate(requesterId, editTarget.id, {
        title,
        description: editForm.description.trim() || null,
        priority: editForm.priority,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      closeEditForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setSaving(false);
      setActingId(null);
    }
  };

  return (
    <>
      <div className="admin-todo-manage__templates-toolbar">
        <p className="admin-todo-manage__templates-hint">
          <strong>{session.name}</strong>님이 매일 반복할 업무를 직접 등록합니다. 「일괄 등록」 시
          내 항목만 오늘 날짜로 「전체 작업」에 추가됩니다.
        </p>
        <div className="admin-todo-manage__templates-actions">
          {onGenerateDaily && (
            <button
              type="button"
              className="admin-todo-manage__generate-daily-btn"
              disabled={generateDisabled || generatingDaily}
              onClick={onGenerateDaily}
            >
              {generatingDaily ? (
                <>
                  <FaSpinner
                    className="admin-todo-manage__generate-daily-btn-icon admin-todo-manage__generate-daily-btn-icon--spin"
                    aria-hidden
                  />
                  생성 중…
                </>
              ) : (
                <>
                  <FaRedo className="admin-todo-manage__generate-daily-btn-icon" aria-hidden />
                  오늘의 반복 업무 일괄 등록
                </>
              )}
            </button>
          )}
          <button type="button" className="admin-todo-manage__add-btn" onClick={openCreateForm}>
            <FaPlus />
            내 반복 업무 등록
          </button>
        </div>
      </div>

      {error && <div className="admin-todo-manage__error">{error}</div>}

      {loading ? (
        <p className="admin-todo-manage__loading">불러오는 중…</p>
      ) : templates.length === 0 ? (
        <p className="admin-todo-manage__empty">등록된 내 반복 업무가 없습니다.</p>
      ) : (
        <ul className="admin-todo-manage__todo-list">
          {templates.map((template) => (
            <li key={template.id} className="admin-todo-manage__todo-item">
              <span className="admin-todo-manage__status-badge admin-todo-manage__status-badge--todo">
                반복
              </span>
              <div className="admin-todo-manage__todo-content">
                <h3 className="admin-todo-manage__todo-title">{template.title}</h3>
                {template.description && (
                  <p className="admin-todo-manage__todo-desc">{template.description}</p>
                )}
                <div className="admin-todo-manage__todo-meta">
                  <span
                    className={`admin-todo-manage__priority-tag admin-todo-manage__priority-tag--${template.priority}`}
                  >
                    {PRIORITY_LABEL[template.priority]}
                  </span>
                </div>
              </div>
              <div className="admin-todo-manage__todo-actions">
                <select
                  value={template.priority}
                  disabled={actingId === template.id}
                  onChange={(e) =>
                    void handlePriorityChange(template, e.target.value as TodoPriority)
                  }
                  className={`admin-todo-manage__status-select admin-todo-manage__status-select--${template.priority}`}
                  aria-label="우선순위 변경"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-todo-manage__edit-btn"
                  disabled={actingId === template.id}
                  onClick={() => openEditForm(template)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="admin-todo-manage__delete-btn"
                  disabled={actingId === template.id}
                  onClick={() => void handleDelete(template)}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <div
          className="admin-todo-manage__modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="admin-todo-manage__modal" role="dialog" aria-labelledby="template-form-title">
            <div className="admin-todo-manage__modal-header">
              <h2 id="template-form-title" className="admin-todo-manage__modal-title">
                내 반복 업무 등록
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
              <p className="admin-todo-manage__form-self-hint">
                담당자: <strong>{session.name}</strong> (본인 반복 업무로 등록됩니다)
              </p>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-form-title">제목 *</label>
                <input
                  id="template-form-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="반복 업무 제목"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-form-desc">내용</label>
                <textarea
                  id="template-form-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="상세 내용 (선택)"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-form-priority">우선순위</label>
                <select
                  id="template-form-priority"
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
          <div
            className="admin-todo-manage__modal"
            role="dialog"
            aria-labelledby="template-edit-form-title"
          >
            <div className="admin-todo-manage__modal-header">
              <h2 id="template-edit-form-title" className="admin-todo-manage__modal-title">
                내 반복 업무 수정
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
              <p className="admin-todo-manage__form-self-hint">
                담당자: <strong>{session.name}</strong>
              </p>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-edit-form-title-input">제목 *</label>
                <input
                  id="template-edit-form-title-input"
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="반복 업무 제목"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-edit-form-desc">내용</label>
                <textarea
                  id="template-edit-form-desc"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="상세 내용 (선택)"
                />
              </div>
              <div className="admin-todo-manage__field">
                <label htmlFor="template-edit-form-priority">우선순위</label>
                <select
                  id="template-edit-form-priority"
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
    </>
  );
}
