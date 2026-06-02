import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { rootTabScrollToTopRequestAtom } from '../state/atoms';
import { useTabScrollKey } from './tabScrollToTop';

/** `TabScrollProvider`로 감싼 탭에서, 같은 탭 재탭 시 `scrollToTop` 실행 */
export function useRootTabScrollToTopOnRequest(scrollToTop: () => void) {
  const tab = useTabScrollKey();
  const requests = useAtomValue(rootTabScrollToTopRequestAtom);
  const isFocused = useIsFocused();
  const seen = useRef(0);
  const seq = tab ? requests[tab] : 0;

  useEffect(() => {
    if (!tab || !isFocused) {
      return;
    }
    if (seq > seen.current) {
      seen.current = seq;
      scrollToTop();
    }
  }, [tab, seq, isFocused, scrollToTop]);
}
