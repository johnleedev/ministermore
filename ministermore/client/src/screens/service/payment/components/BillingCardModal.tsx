import type { useCardForm } from '../useCardForm';

type CardForm = ReturnType<typeof useCardForm>;

type Props = {
  classPrefix: string;
  idPrefix: string;
  open: boolean;
  loading: boolean;
  supplyPrice: number;
  totalAmount: number;
  cardForm: CardForm;
  onClose: () => void;
  onSubmit: () => void;
};

export default function BillingCardModal({
  classPrefix,
  idPrefix,
  open,
  loading,
  supplyPrice,
  totalAmount,
  cardForm,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  const p = classPrefix;

  return (
    <div className={`${p}__modal-backdrop`} role="presentation" onClick={onClose}>
      <div
        className={`${p}__modal`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idPrefix}-billing-modal-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${p}__modal-header`}>
          <h2 className={`${p}__modal-title`} id={`${idPrefix}-billing-modal-title`}>
            카드 정보 입력
          </h2>
        </div>
        <div className={`${p}__modal-body`}>
          <p className={`${p}__modal-desc`}>
            월 {supplyPrice.toLocaleString('ko-KR')}원 (부가세 포함 {totalAmount.toLocaleString('ko-KR')}원) 정기결제
          </p>
          <div className={`${p}__card-form`}>
            <label className={`${p}__card-label`} htmlFor={`${idPrefix}-cardnum`}>
              카드번호
            </label>
            <input
              ref={(el) => {
                cardForm.panInputRefs.current[0] = el;
              }}
              id={`${idPrefix}-cardnum`}
              type="text"
              inputMode="numeric"
              className={`${p}__input`}
              placeholder="16자리"
              maxLength={19}
              value={cardForm.cardnum}
              onChange={(e) => cardForm.setCardnum(e.target.value.replace(/\D/g, '').slice(0, 16))}
            />
            <div className={`${p}__card-row`}>
              <div>
                <label className={`${p}__card-label`} htmlFor={`${idPrefix}-expM`}>
                  유효기간(월)
                </label>
                <input
                  id={`${idPrefix}-expM`}
                  type="text"
                  inputMode="numeric"
                  className={`${p}__input`}
                  placeholder="MM"
                  maxLength={2}
                  value={cardForm.expM}
                  onChange={(e) => cardForm.setExpM(e.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>
              <div>
                <label className={`${p}__card-label`} htmlFor={`${idPrefix}-expY`}>
                  유효기간(년)
                </label>
                <input
                  id={`${idPrefix}-expY`}
                  type="text"
                  inputMode="numeric"
                  className={`${p}__input`}
                  placeholder="YY"
                  maxLength={2}
                  value={cardForm.expY}
                  onChange={(e) => cardForm.setExpY(e.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>
            </div>
            <label className={`${p}__card-label`} htmlFor={`${idPrefix}-birthBiz`}>
              생년월일 6자리 또는 사업자번호
            </label>
            <input
              id={`${idPrefix}-birthBiz`}
              type="text"
              inputMode="numeric"
              className={`${p}__input`}
              value={cardForm.birthBiz}
              onChange={(e) => cardForm.setBirthBiz(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            <label className={`${p}__card-label`} htmlFor={`${idPrefix}-pwd2`}>
              카드 비밀번호 앞 2자리
            </label>
            <input
              id={`${idPrefix}-pwd2`}
              type="password"
              inputMode="numeric"
              className={`${p}__input`}
              maxLength={2}
              value={cardForm.pwd2}
              onChange={(e) => cardForm.setPwd2(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
          </div>
        </div>
        <div className={`${p}__modal-footer`}>
          <button type="button" className={`${p}__modal-btn`} onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            type="button"
            className={`${p}__modal-btn ${p}__modal-btn--primary`}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? '결제 처리 중...' : '결제하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
