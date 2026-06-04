import { useEffect, useRef } from 'react';
import {
  StackActions,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { rootTabScrollToTopRequestAtom } from '../state/atoms';
import { requestRootTabReset, useTabScrollKey } from './tabScrollToTop';
import { useIsLeafFocusedScreen } from './useIsLeafFocusedScreen';

/** 현재 스택에 쌓인 화면이 있을 때만 pop (부모 탭 canGoBack과 구분) */
function popCurrentStackToTop(navigation: NavigationProp<ParamListBase>) {
  const state = navigation.getState();
  if (state.type !== 'stack' || (state.index ?? 0) <= 0) {
    return false;
  }
  navigation.dispatch(StackActions.popToTop());
  return true;
}

/** `TabScrollProvider`로 감싼 탭에서, 같은 탭 재탭 시 스크롤 맨 위 → 맨 위면 pop 또는 탭 초기화 */
export function useRootTabScrollToTopOnRequest(scrollToTop: () => boolean) {
  const navigation = useNavigation();
  const tab = useTabScrollKey();
  const requests = useAtomValue(rootTabScrollToTopRequestAtom);
  const isLeafFocused = useIsLeafFocusedScreen();
  const seen = useRef(0);
  const seq = tab ? requests[tab] : 0;

  useEffect(() => {
    if (!tab || !isLeafFocused) {
      return;
    }
    if (seq > seen.current) {
      seen.current = seq;
      const alreadyAtTop = scrollToTop();
      if (alreadyAtTop && !popCurrentStackToTop(navigation)) {
        requestRootTabReset(tab);
      }
    }
  }, [tab, seq, isLeafFocused, scrollToTop, navigation]);
}
