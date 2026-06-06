import axios from 'axios';
import MainURL from '../../MainURL';

/**
 * Node: app.use('/admintodos', AdminTodosRouter) — 운영/로컬 모두 이 경로 사용
 * (/api/admin 도 app.js에 있으나, 프록시·배포 환경에서는 /admintodos 만 Node로 전달되는 경우가 많음)
 */
const API_BASE = `${MainURL}/admintodos`;

export type TodoStatus = 'todo' | 'in_progress' | 'done';
export type TodoPriority = 'high' | 'medium' | 'low';

export type AdminEmployee = {
  id: number;
  name: string;
  department: string | null;
  position: string | null;
};

export type AdminTodo = {
  id: number;
  assignee_id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  due_date: string | null;
  assignee_name: string;
  assignee_position: string | null;
  assignee_department: string | null;
};

export type AdminTodoTemplate = {
  id: number;
  assignee_id: number;
  title: string;
  description: string | null;
  priority: TodoPriority;
  assignee_name: string;
  assignee_position: string | null;
  assignee_department: string | null;
};

type ApiListResponse<T> = { ok: boolean; data?: T };
type ApiItemResponse<T> = { ok: boolean; data?: T };
type ApiError = { ok: false; error?: { message?: string } };

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    return data?.error?.message || fallback;
  }
  return fallback;
}

function parseListData<T>(res: { data?: unknown }): T[] {
  const body = res.data as ApiListResponse<T> | undefined;
  if (!body?.ok || !Array.isArray(body.data)) {
    throw new Error('목록 응답이 올바르지 않습니다.');
  }
  return body.data;
}

export async function fetchEmployees(requesterId: number): Promise<AdminEmployee[]> {
  const res = await axios.get(`${API_BASE}/employees`, { params: { requesterId } });
  return parseListData<AdminEmployee>(res);
}

export async function fetchTodos(requesterId: number): Promise<AdminTodo[]> {
  const res = await axios.get(`${API_BASE}/todos`, { params: { requesterId } });
  return parseListData<AdminTodo>(res);
}

export type GenerateDailyResult = {
  due_date: string;
  insertedCount: number;
  todos: AdminTodo[];
};

export async function fetchTodoTemplates(requesterId: number): Promise<AdminTodoTemplate[]> {
  const res = await axios.get(`${API_BASE}/todo-templates`, { params: { requesterId } });
  return parseListData<AdminTodoTemplate>(res);
}

export type CreateTodoTemplatePayload = {
  title: string;
  description?: string;
  priority: TodoPriority;
};

export async function createTodoTemplate(
  requesterId: number,
  payload: CreateTodoTemplatePayload
): Promise<AdminTodoTemplate> {
  try {
    const res = await axios.post<ApiItemResponse<AdminTodoTemplate>>(`${API_BASE}/todo-templates`, {
      requesterId,
      ...payload,
    });
    if (!res.data?.data) throw new Error('생성 응답이 올바르지 않습니다.');
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '반복 업무 등록에 실패했습니다.'));
  }
}

export async function updateTodoTemplate(
  requesterId: number,
  id: number,
  payload: Partial<{
    title: string;
    description: string | null;
    priority: TodoPriority;
  }>
): Promise<AdminTodoTemplate> {
  try {
    const res = await axios.patch<ApiItemResponse<AdminTodoTemplate>>(
      `${API_BASE}/todo-templates/${id}`,
      { requesterId, ...payload }
    );
    if (!res.data?.data) throw new Error('수정 응답이 올바르지 않습니다.');
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '반복 업무 수정에 실패했습니다.'));
  }
}

export async function deleteTodoTemplate(requesterId: number, id: number): Promise<void> {
  try {
    await axios.delete(`${API_BASE}/todo-templates/${id}`, { params: { requesterId } });
  } catch (err) {
    throw new Error(getErrorMessage(err, '반복 업무 삭제에 실패했습니다.'));
  }
}

export async function generateDailyTodos(requesterId: number): Promise<GenerateDailyResult> {
  try {
    const res = await axios.post<{ ok: boolean; data?: GenerateDailyResult }>(
      `${API_BASE}/todos/generate-daily`,
      { requesterId }
    );
    if (!res.data?.ok || !res.data.data) {
      throw new Error('일괄 생성 응답이 올바르지 않습니다.');
    }
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '오늘의 반복 업무 일괄 등록에 실패했습니다.'));
  }
}

export type CreateTodoPayload = {
  assignee_id: number;
  title: string;
  description?: string;
  priority: TodoPriority;
  due_date?: string | null;
};

export async function createTodo(
  requesterId: number,
  payload: CreateTodoPayload
): Promise<AdminTodo> {
  try {
    const res = await axios.post<ApiItemResponse<AdminTodo>>(`${API_BASE}/todos`, {
      requesterId,
      ...payload,
    });
    if (!res.data?.data) throw new Error('생성 응답이 올바르지 않습니다.');
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '할 일 등록에 실패했습니다.'));
  }
}

export async function updateTodo(
  requesterId: number,
  id: number,
  payload: Partial<{
    status: TodoStatus;
    title: string;
    description: string | null;
    priority: TodoPriority;
    due_date: string | null;
    assignee_id: number;
  }>
): Promise<AdminTodo> {
  try {
    const res = await axios.patch<ApiItemResponse<AdminTodo>>(`${API_BASE}/todos/${id}`, {
      requesterId,
      ...payload,
    });
    if (!res.data?.data) throw new Error('수정 응답이 올바르지 않습니다.');
    return res.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, '할 일 수정에 실패했습니다.'));
  }
}

export async function deleteTodo(requesterId: number, id: number): Promise<void> {
  try {
    await axios.delete(`${API_BASE}/todos/${id}`, { params: { requesterId } });
  } catch (err) {
    throw new Error(getErrorMessage(err, '할 일 삭제에 실패했습니다.'));
  }
}
