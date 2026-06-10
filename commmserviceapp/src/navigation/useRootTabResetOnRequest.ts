import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { rootTabResetRequestAtom } from '../state/atoms';
import { useTabScrollKey } from './tabScrollToTop';

/** 같은 탭 재탭(이미 맨 위) 시 탭 초기 상태로 되돌릴 때 호출 */
export function useRootTabResetOnRequest(onReset: () => void) {
  const tab = useTabScrollKey();
  const requests = useAtomValue(rootTabResetRequestAtom);
  const isFocused = useIsFocused();
  const seen = useRef(0);
  const seq = tab ? requests[tab] : 0;

  useEffect(() => {
    if (!tab || !isFocused) {
      return;
    }
    if (seq > seen.current) {
      seen.current = seq;
      onReset();
    }
  }, [tab, seq, isFocused, onReset]);
}
