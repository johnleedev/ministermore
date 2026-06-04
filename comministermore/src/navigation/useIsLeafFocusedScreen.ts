import { useIsFocused, useNavigationState, useRoute } from '@react-navigation/native';

/** 현재 네비게이터 트리에서 가장 깊은 포커스 화면인지 (탭 재탭 시 중복 처리 방지) */
export function useIsLeafFocusedScreen() {
  const route = useRoute();
  const isFocused = useIsFocused();
  const focusedRouteKey = useNavigationState(state => {
    if (!state?.routes?.length) {
      return undefined;
    }
    let current = state;
    while (current.routes && current.index != null) {
      const focused = current.routes[current.index];
      if (focused.state && 'index' in focused.state) {
        current = focused.state as typeof state;
      } else {
        return focused.key;
      }
    }
    return undefined;
  });

  return isFocused && focusedRouteKey === route.key;
}
