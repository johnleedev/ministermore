import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { isLoggedInAtom } from '../../state/atoms';
import { loadSessionUser, type StoredUserData } from '../../login/sessionStorage';

/** 수련회 화면 — 앱 로그인(AsyncStorage + Jotai) 상태 */
export function useRetreatSession() {
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const [user, setUser] = useState<StoredUserData | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const saved = await loadSessionUser();
    setUser(saved);
    setReady(true);
    return saved;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { isLoggedIn, user, ready, refresh };
}
