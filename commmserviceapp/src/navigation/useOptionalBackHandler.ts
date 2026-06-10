import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * 탭 안에서 useState로 list → detail 전환할 때 Android 하드웨어 뒤로가기 처리.
 * enabled가 true이면 onBack 실행 후 이벤트 소비(상위로 전달 안 함).
 */
export function useOptionalBackHandler(enabled: boolean, onBack: () => void) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onBack();
        return true;
      });
      return () => sub.remove();
    }, [enabled, onBack]),
  );
}
