import { FaCheck } from 'react-icons/fa';

type Props = {
  classPrefix: string;
  titleId: string;
  confirmButtonId: string;
  successLine: string;
  onConfirm: () => void;
};

export default function PaymentSuccessModal({
  classPrefix,
  titleId,
  confirmButtonId,
  successLine,
  onConfirm,
}: Props) {
  const p = classPrefix;

  return (
    <div className={`${p}__modal-backdrop`} role="presentation">
      <div
        className={`${p}__modal`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${p}__modal-header ${p}__modal-header--success`}>
          <h2 className={`${p}__modal-title`} id={titleId}>
            결제 완료
          </h2>
        </div>
        <div className={`${p}__modal-body ${p}__modal-body--success`}>
          <div className={`${p}__modal-success`}>
            <div className={`${p}__modal-success-icon`} aria-hidden>
              <FaCheck />
            </div>
            <p className={`${p}__modal-success-head`}>결제가 되었습니다.</p>
            <p className={`${p}__modal-success-line`}>{successLine}</p>
          </div>
        </div>
        <div className={`${p}__modal-footer ${p}__modal-footer--success`}>
          <button
            id={confirmButtonId}
            type="button"
            className={`${p}__modal-btn ${p}__modal-btn--primary`}
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
