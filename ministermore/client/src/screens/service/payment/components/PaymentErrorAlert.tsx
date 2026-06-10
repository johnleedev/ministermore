import { FaExclamationCircle } from 'react-icons/fa';
import type { PaymentAlertState } from '../usePaymentAlert';

type Props = {
  classPrefix: string;
  alert: PaymentAlertState | null;
  alertCopyDone: boolean;
  onClose: () => void;
  onCopy: () => void;
};

export default function PaymentErrorAlert({
  classPrefix,
  alert,
  alertCopyDone,
  onClose,
  onCopy,
}: Props) {
  if (!alert) return null;
  const p = classPrefix;

  return (
    <div
      className={`${p}__alert-backdrop`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${p}-alert-title`}
      aria-describedby={`${p}-alert-message`}
      onClick={onClose}
    >
      <div className={`${p}__alert-panel`} onClick={(e) => e.stopPropagation()}>
        <div className={`${p}__alert-icon`} aria-hidden>
          <FaExclamationCircle />
        </div>
        <h2 className={`${p}__alert-title`} id={`${p}-alert-title`}>
          {alert.title}
        </h2>
        <p className={`${p}__alert-message`} id={`${p}-alert-message`}>
          {alert.message}
        </p>
        <div className={`${p}__alert-actions`}>
          <button type="button" className={`${p}__alert-btn ${p}__alert-btn--ghost`} onClick={onCopy}>
            {alertCopyDone ? '복사됨' : '메시지 복사'}
          </button>
          <button
            type="button"
            className={`${p}__alert-btn ${p}__alert-btn--primary`}
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
