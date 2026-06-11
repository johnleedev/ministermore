import {
  createEmptyCustomQuestion,
  type RetreatCustomQuestion,
  type RetreatCustomQuestionType,
} from '../lib/retreatRequestForm';

type RetreatRequestFormBuilderProps = {
  questions: RetreatCustomQuestion[];
  onChange: (next: RetreatCustomQuestion[]) => void;
};

const TYPE_OPTIONS: { value: RetreatCustomQuestionType; label: string }[] = [
  { value: 'text', label: '주관식 단답형' },
  { value: 'radio', label: '객관식 단일선택' },
  { value: 'checkbox', label: '다중선택' },
];

export default function RetreatRequestFormBuilder({
  questions,
  onChange,
}: RetreatRequestFormBuilderProps) {
  const updateQuestion = (index: number, patch: Partial<RetreatCustomQuestion>) => {
    const next = questions.map((question, i) => {
      if (i !== index) return question;
      const merged = { ...question, ...patch };
      if (patch.type === 'text') {
        delete merged.options;
      } else if (!merged.options || merged.options.length === 0) {
        merged.options = ['선택지 1'];
      }
      return merged;
    });
    onChange(next);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    onChange([...questions, createEmptyCustomQuestion()]);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    const options = [...(question.options || [])];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { options });
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const options = [...(question.options || []), `선택지 ${(question.options?.length || 0) + 1}`];
    updateQuestion(questionIndex, { options });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const options = (question.options || []).filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: options.length ? options : ['선택지 1'] });
  };

  return (
    <div className="retreat-request-builder">
      {questions.length === 0 ? (
        <p className="retreat-edit__hint">아직 추가 질문이 없습니다. 아래 버튼으로 질문을 추가해 보세요.</p>
      ) : null}

      {questions.map((question, index) => (
        <div key={question.id} className="retreat-request-builder__item">
          <div className="retreat-request-builder__item-header">
            <span className="retreat-request-builder__item-title">질문 {index + 1}</span>
            <button
              type="button"
              className="retreat-request-builder__delete-btn"
              onClick={() => removeQuestion(index)}
            >
              삭제
            </button>
          </div>

          <div className="retreat-request-builder__grid">
            <div className="retreat-request-builder__field">
              <label className="retreat-request-builder__label">질문 내용</label>
              <input
                type="text"
                className="retreat-request-builder__input"
                value={question.label}
                onChange={(e) => updateQuestion(index, { label: e.target.value })}
                placeholder="예: 참석 인원, 식사 여부"
              />
            </div>
            <div className="retreat-request-builder__field">
              <label className="retreat-request-builder__label">질문 형식</label>
              <select
                className="retreat-request-builder__select"
                value={question.type}
                onChange={(e) =>
                  updateQuestion(index, { type: e.target.value as RetreatCustomQuestionType })
                }
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="retreat-request-builder__checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(question.required)}
              onChange={(e) => updateQuestion(index, { required: e.target.checked })}
            />
            필수 응답
          </label>

          {question.type === 'radio' || question.type === 'checkbox' ? (
            <div className="retreat-request-builder__field">
              <label className="retreat-request-builder__label">선택지</label>
              <div className="retreat-request-builder__options">
                {(question.options || []).map((option, optionIndex) => (
                  <div key={`${question.id}-opt-${optionIndex}`} className="retreat-request-builder__option-row">
                    <input
                      type="text"
                      className="retreat-request-builder__input"
                      value={option}
                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    />
                    <button
                      type="button"
                      className="retreat-request-builder__remove-btn"
                      onClick={() => removeOption(index, optionIndex)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="retreat-request-builder__add-option-btn"
                onClick={() => addOption(index)}
              >
                + 선택지 추가
              </button>
            </div>
          ) : null}
        </div>
      ))}

      <button type="button" className="retreat-request-builder__add-question-btn" onClick={addQuestion}>
        + 질문 추가
      </button>
    </div>
  );
}
