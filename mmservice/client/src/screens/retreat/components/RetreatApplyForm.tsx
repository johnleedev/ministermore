import { useMemo, useState } from 'react';
import { submitRetreatAnswer } from '../../../api/retreatApi';
import type { RetreatCustomQuestion } from '../lib/retreatRequestForm';
import './RetreatApplyForm.scss';

type RetreatApplyFormProps = {
  bookletId: number | string;
  applyNote?: string;
  customQuestions: RetreatCustomQuestion[];
  preview?: boolean;
  onSubmitted?: () => void;
};

type FormState = {
  userName: string;
  userPhone: string;
  userGroup: string;
  userGender: string;
  userAge: string;
  note: string;
  customAnswers: Record<string, string | string[]>;
};

const EMPTY_FORM: FormState = {
  userName: '',
  userPhone: '',
  userGroup: '',
  userGender: '',
  userAge: '',
  note: '',
  customAnswers: {},
};

const GENDER_OPTIONS = ['남성', '여성'] as const;

export default function RetreatApplyForm({
  bookletId,
  applyNote,
  customQuestions,
  preview = false,
  onSubmitted,
}: RetreatApplyFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const noteText = (applyNote || '').trim();

  const updateBase = (key: keyof Omit<FormState, 'customAnswers'>, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  };

  const updateCustom = (questionId: string, value: string | string[]) => {
    setForm((prev) => ({
      ...prev,
      customAnswers: { ...prev.customAnswers, [questionId]: value },
    }));
    setError(null);
    setSuccess(false);
  };

  const validate = (): string | null => {
    if (!form.userName.trim()) return '이름을 입력해 주세요.';
    if (!form.userPhone.trim()) return '연락처를 입력해 주세요.';

    for (const question of customQuestions) {
      if (!question.required) continue;
      const answer = form.customAnswers[question.id];
      if (question.type === 'checkbox') {
        const values = Array.isArray(answer) ? answer : [];
        if (values.length === 0) return `"${question.label}" 항목을 선택해 주세요.`;
      } else if (!String(answer || '').trim()) {
        return `"${question.label}" 항목을 입력해 주세요.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (preview) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitRetreatAnswer({
        bookletId: String(bookletId),
        userName: form.userName.trim(),
        userPhone: form.userPhone.trim(),
        userGroup: form.userGroup.trim() || undefined,
        userGender: form.userGender.trim() || undefined,
        userAge: form.userAge.trim() || undefined,
        note: form.note.trim() || undefined,
        customAnswers: form.customAnswers,
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '참가 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const questionBlocks = useMemo(
    () =>
      customQuestions.map((question) => {
        const answer = form.customAnswers[question.id];
        return (
          <div key={question.id} className="retreat-apply-form__field">
            <label className="retreat-apply-form__label" htmlFor={`retreat-apply-${question.id}`}>
              {question.label}
              {question.required ? <span className="retreat-apply-form__required">*</span> : null}
            </label>

            {question.type === 'text' ? (
              <input
                id={`retreat-apply-${question.id}`}
                type="text"
                className="retreat-apply-form__input"
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => updateCustom(question.id, e.target.value)}
                disabled={preview || submitting}
              />
            ) : null}

            {question.type === 'radio' ? (
              <div className="retreat-apply-form__options">
                {(question.options || []).map((option) => (
                  <label key={option} className="retreat-apply-form__option">
                    <input
                      type="radio"
                      name={`retreat-apply-${question.id}`}
                      value={option}
                      checked={answer === option}
                      onChange={() => updateCustom(question.id, option)}
                      disabled={preview || submitting}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {question.type === 'checkbox' ? (
              <div className="retreat-apply-form__options">
                {(question.options || []).map((option) => {
                  const selected = Array.isArray(answer) ? answer : [];
                  const checked = selected.includes(option);
                  return (
                    <label key={option} className="retreat-apply-form__option">
                      <input
                        type="checkbox"
                        value={option}
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(option);
                          else next.delete(option);
                          updateCustom(question.id, Array.from(next));
                        }}
                        disabled={preview || submitting}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      }),
    [customQuestions, form.customAnswers, preview, submitting],
  );

  return (
    <form
      className={`retreat-apply-form${preview ? ' retreat-apply-form--preview' : ''}`}
      onSubmit={handleSubmit}
    >
      {noteText ? <p className="retreat-apply-form__note">{noteText}</p> : null}

      <h4 className="retreat-apply-form__section-title">기본 정보</h4>

      <div className="retreat-apply-form__field">
        <label className="retreat-apply-form__label" htmlFor="retreat-apply-name">
          이름<span className="retreat-apply-form__required">*</span>
        </label>
        <input
          id="retreat-apply-name"
          type="text"
          className="retreat-apply-form__input"
          value={form.userName}
          onChange={(e) => updateBase('userName', e.target.value)}
          disabled={preview || submitting}
        />
      </div>

      <div className="retreat-apply-form__field">
        <label className="retreat-apply-form__label" htmlFor="retreat-apply-phone">
          연락처<span className="retreat-apply-form__required">*</span>
        </label>
        <input
          id="retreat-apply-phone"
          type="tel"
          className="retreat-apply-form__input"
          value={form.userPhone}
          onChange={(e) => updateBase('userPhone', e.target.value)}
          disabled={preview || submitting}
        />
      </div>

      <div className="retreat-apply-form__field">
        <label className="retreat-apply-form__label" htmlFor="retreat-apply-group">
          소속
        </label>
        <input
          id="retreat-apply-group"
          type="text"
          className="retreat-apply-form__input"
          value={form.userGroup}
          onChange={(e) => updateBase('userGroup', e.target.value)}
          disabled={preview || submitting}
        />
      </div>

      <div className="retreat-apply-form__field">
        <span className="retreat-apply-form__label">성별</span>
        <div className="retreat-apply-form__options">
          {GENDER_OPTIONS.map((option) => (
            <label key={option} className="retreat-apply-form__option">
              <input
                type="radio"
                name="retreat-apply-gender"
                value={option}
                checked={form.userGender === option}
                onChange={() => updateBase('userGender', option)}
                disabled={preview || submitting}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="retreat-apply-form__field">
        <label className="retreat-apply-form__label" htmlFor="retreat-apply-age">
          나이
        </label>
        <input
          id="retreat-apply-age"
          type="number"
          min={1}
          max={120}
          inputMode="numeric"
          className="retreat-apply-form__input"
          value={form.userAge}
          onChange={(e) => updateBase('userAge', e.target.value)}
          disabled={preview || submitting}
          placeholder="예: 25"
        />
      </div>

      <div className="retreat-apply-form__field">
        <label className="retreat-apply-form__label" htmlFor="retreat-apply-note">
          건의/기도제목
        </label>
        <textarea
          id="retreat-apply-note"
          className="retreat-apply-form__textarea"
          value={form.note}
          onChange={(e) => updateBase('note', e.target.value)}
          disabled={preview || submitting}
        />
      </div>

      {customQuestions.length > 0 ? (
        <>
          <div className="retreat-apply-form__divider" />
          <h4 className="retreat-apply-form__section-title">추가 질문</h4>
          {questionBlocks}
        </>
      ) : null}

      {error ? <p className="retreat-apply-form__message retreat-apply-form__message--error">{error}</p> : null}
      {success ? (
        <p className="retreat-apply-form__message retreat-apply-form__message--success">
          참가 신청이 완료되었습니다.
        </p>
      ) : null}

      <button type="submit" className="retreat-apply-form__submit" disabled={preview || submitting}>
        {preview ? '미리보기' : submitting ? '제출 중…' : '신청하기'}
      </button>
    </form>
  );
}
