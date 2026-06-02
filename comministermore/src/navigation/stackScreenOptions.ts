import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** iOS 스와이프 뒤로가기 + 공통 스택 애니메이션 */
export const stackScreenOptions: NativeStackNavigationOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animation: 'slide_from_right',
};

/** 커스텀 헤더를 화면 안에 그릴 때 (headerShown: false) */
export const hiddenHeaderStackScreenOptions: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  headerShown: false,
};
