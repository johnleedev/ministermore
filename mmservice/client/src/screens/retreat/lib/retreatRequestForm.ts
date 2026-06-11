export type RetreatCustomQuestionType = 'text' | 'radio' | 'checkbox';

export type RetreatCustomQuestion = {
  id: string;
  label: string;
  type: RetreatCustomQuestionType;
  options?: string[];
  required?: boolean;
};

export type RetreatCustomAnswers = Record<string, string | string[]>;

export function createEmptyCustomQuestion(): RetreatCustomQuestion {
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    type: 'text',
    required: false,
  };
}

export function normalizeCustomQuestions(raw: unknown): RetreatCustomQuestion[] {
  if (!Array.isArray(raw)) return [];
  const result: RetreatCustomQuestion[] = [];

  raw.forEach((item, index) => {
    const q = item && typeof item === 'object' ? (item as Partial<RetreatCustomQuestion>) : {};
    const id = String(q.id || `q_${index + 1}`).trim();
    const label = String(q.label || '').trim();
    const type: RetreatCustomQuestionType =
      q.type === 'radio' || q.type === 'checkbox' ? q.type : 'text';
    if (!id || !label) return;

    if (type === 'text') {
      result.push({
        id,
        label,
        type,
        required: Boolean(q.required),
      });
      return;
    }

    const options = Array.isArray(q.options)
      ? q.options.map((opt) => String(opt || '').trim()).filter(Boolean)
      : [];
    if (options.length === 0) return;

    result.push({
      id,
      label,
      type,
      options,
      required: Boolean(q.required),
    });
  });

  return result;
}

export function formatCustomAnswerValue(value: string | string[] | undefined | null): string {
  if (value == null) return '-';
  if (Array.isArray(value)) {
    const items = value.map((v) => String(v).trim()).filter(Boolean);
    return items.length ? items.join(', ') : '-';
  }
  const text = String(value).trim();
  return text || '-';
}
