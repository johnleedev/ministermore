import { useMemo, useRef, useState } from 'react';
import type { BillingCardFields } from './billingPayment';

export type CardFormState = BillingCardFields;

export function useCardForm() {
  const [cardnum, setCardnum] = useState('');
  const [expM, setExpM] = useState('');
  const [expY, setExpY] = useState('');
  const [birthBiz, setBirthBiz] = useState('');
  const [pwd2, setPwd2] = useState('');
  const panInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const cardFields = useMemo(
    (): BillingCardFields => ({ cardnum, expM, expY, birthBiz, pwd2 }),
    [cardnum, expM, expY, birthBiz, pwd2],
  );

  return {
    cardnum,
    setCardnum,
    expM,
    setExpM,
    expY,
    setExpY,
    birthBiz,
    setBirthBiz,
    pwd2,
    setPwd2,
    cardFields,
    panInputRefs,
  };
}
