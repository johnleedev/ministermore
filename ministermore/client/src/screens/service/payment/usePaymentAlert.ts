import { useCallback, useState } from 'react';

export type PaymentAlertState = {
  title: string;
  message: string;
};

export function usePaymentAlert() {
  const [alert, setAlert] = useState<PaymentAlertState | null>(null);
  const [alertCopyDone, setAlertCopyDone] = useState(false);

  const openErrorAlert = useCallback((message: string, title = '안내') => {
    setAlertCopyDone(false);
    const m = String(message ?? '').trim() || '알 수 없는 오류';
    setAlert({ title: (title || '안내').trim() || '안내', message: m });
  }, []);

  const closeAlert = useCallback(() => setAlert(null), []);

  const handleAlertCopy = useCallback(async () => {
    if (!alert) return;
    try {
      await navigator.clipboard.writeText(alert.message);
      setAlertCopyDone(true);
      window.setTimeout(() => setAlertCopyDone(false), 2200);
    } catch {
      setAlertCopyDone(false);
    }
  }, [alert]);

  return { alert, alertCopyDone, openErrorAlert, closeAlert, handleAlertCopy };
}
