import { useMemo, useState } from 'react';
import '../Admin.scss';
import {
  DEFAULT_PROMPT_FORM,
  PROMPT_AGE_OPTIONS,
  PROMPT_BOARD_OPTIONS,
  PROMPT_DIRECTION_OPTIONS,
  PROMPT_LENGTH_OPTIONS,
  PROMPT_POSITION_OPTIONS,
  PROMPT_TONE_OPTIONS,
  type PromptBoardKey,
  type PromptFormState,
  buildClaudePrompt,
} from './boardPromptConstants';

type ChipOption = { value: string; label: string };

function toChipOptions(options: readonly string[] | ReadonlyArray<{ readonly value: string; readonly label: string }>): ChipOption[] {
  if (options.length === 0) return [];
  if (typeof options[0] === 'string') {
    return (options as readonly string[]).map((o) => ({ value: o, label: o }));
  }
  return (options as ReadonlyArray<{ readonly value: string; readonly label: string }>).map((o) => ({
    value: o.value,
    label: o.label,
  }));
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  options: readonly string[] | ReadonlyArray<{ readonly value: string; readonly label: string }>;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const normalized = toChipOptions(options);

  return (
    <div className="admin-prompt-builder__field">
      <p className="admin-prompt-builder__label">
        {label}
        {required ? ' *' : ''}
      </p>
      <div className="admin-notice-post__chips">
        {normalized.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`admin-notice-post__chip${value === opt.value ? ' admin-notice-post__chip--on' : ''}`}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  /** 자유게시판 전용: 게시판 선택 숨김 */
  freeOnly?: boolean;
};

export default function BoardPromptBuilder({ freeOnly = false }: Props) {
  const [form, setForm] = useState<PromptFormState>(() =>
    freeOnly ? { ...DEFAULT_PROMPT_FORM, boardKey: 'free' } : DEFAULT_PROMPT_FORM
  );
  const [copied, setCopied] = useState(false);

  const activeBoard = PROMPT_BOARD_OPTIONS.find((b) => b.key === form.boardKey);
  const hasRegion = Boolean(activeBoard?.regions?.length);

  const generatedPrompt = useMemo(() => buildClaudePrompt(form), [form]);

  const update = <K extends keyof PromptFormState>(key: K, value: PromptFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectBoard = (key: PromptBoardKey) => {
    setForm((prev) => ({
      ...prev,
      boardKey: key,
      category: '',
      region: '',
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사에 실패했습니다. 프롬프트 영역에서 직접 복사해주세요.');
    }
  };

  const handleReset = () => {
    setForm(freeOnly ? { ...DEFAULT_PROMPT_FORM, boardKey: 'free' } : DEFAULT_PROMPT_FORM);
    setCopied(false);
  };

  return (
    <div className="admin-prompt-builder">
      <p className="admin-prompt-builder__desc">
        {freeOnly
          ? '자유게시판 글 작성용 프롬프트입니다. 구분·작성자 설정을 선택하면 Claude AI에 붙여넣을 문장이 완성됩니다.'
          : '게시판·구분·작성자 설정을 선택하면 Claude AI에 붙여넣을 프롬프트가 자동으로 완성됩니다.'}
      </p>

      <div className="admin-prompt-builder__form">
        {!freeOnly && (
          <div className="admin-prompt-builder__field">
            <p className="admin-prompt-builder__label">게시판 *</p>
            <div className="admin-notice-post__chips">
              {PROMPT_BOARD_OPTIONS.map((board) => (
                <button
                  key={board.key}
                  type="button"
                  className={`admin-notice-post__chip${form.boardKey === board.key ? ' admin-notice-post__chip--on' : ''}`}
                  onClick={() => selectBoard(board.key)}
                >
                  {board.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChipGroup
          label="구분"
          options={activeBoard?.categories ?? []}
          value={form.category}
          onChange={(v) => update('category', v)}
        />

        {hasRegion && activeBoard?.regions && (
          <ChipGroup
            label="지역"
            options={activeBoard.regions}
            value={form.region}
            onChange={(v) => update('region', v)}
          />
        )}

        <ChipGroup
          label="연령"
          options={PROMPT_AGE_OPTIONS}
          value={form.age}
          onChange={(v) => update('age', v)}
        />

        <ChipGroup
          label="직분"
          options={PROMPT_POSITION_OPTIONS}
          value={form.position}
          onChange={(v) => update('position', v)}
        />

        <ChipGroup
          label="글의 방향"
          options={PROMPT_DIRECTION_OPTIONS}
          value={form.direction}
          onChange={(v) => update('direction', v)}
        />

        <ChipGroup label="문체" options={PROMPT_TONE_OPTIONS} value={form.tone} onChange={(v) => update('tone', v)} />

        <ChipGroup
          label="분량"
          options={PROMPT_LENGTH_OPTIONS}
          value={form.length}
          onChange={(v) => update('length', v)}
        />

        <div className="admin-prompt-builder__field">
          <label htmlFor="prompt-topic">주제 (선택)</label>
          <input
            id="prompt-topic"
            className="admin-prompt-builder__input"
            type="text"
            placeholder="예: 수련회 모집, 기도 간증, 중고 찬양대 피아노"
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
          />
        </div>

        <div className="admin-prompt-builder__field">
          <label htmlFor="prompt-extra">추가 요청 (선택)</label>
          <textarea
            id="prompt-extra"
            className="admin-prompt-builder__textarea"
            placeholder="예: 질문 형식으로 마무리, 성경 구절 1개 포함"
            value={form.extra}
            onChange={(e) => update('extra', e.target.value)}
          />
        </div>
      </div>

      <div className="admin-prompt-builder__output">
        <div className="admin-prompt-builder__output-head">
          <h4>완성된 프롬프트</h4>
          <div className="admin-prompt-builder__output-actions">
            <button type="button" className="admin-notice-post__btn admin-notice-post__btn--ghost" onClick={handleReset}>
              초기화
            </button>
            <button type="button" className="admin-notice-post__btn admin-notice-post__btn--primary" onClick={() => void handleCopy()}>
              {copied ? '복사됨' : '프롬프트 복사'}
            </button>
          </div>
        </div>
        <textarea
          className="admin-prompt-builder__preview"
          readOnly
          value={generatedPrompt}
          aria-label="생성된 프롬프트"
        />
      </div>
    </div>
  );
}
