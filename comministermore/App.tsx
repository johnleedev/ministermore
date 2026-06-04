/**
 * 네비게이션·전역 상태(Jotai)·앱 진입 분기(온보딩/메인, 로그인은 필요 시 모달)는 이 파일에서 처리합니다.
 * FCM/Notifee는 로그인 완료 후 `src/push/pushService.ts`에서 초기화합니다.
 * (index.js는 변경하지 않습니다.)
 */
import { enableScreens } from 'react-native-screens';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAtomValue, useSetAtom } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BootSplash from 'react-native-bootsplash';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import codePush from '@revopush/react-native-code-push';
import { OnboardingStack } from './src/navigation/OnboardingStack';
import { RootNavigator } from './src/navigation/RootNavigator';
import { rootNavigationRef } from './src/navigation/rootNavigation';
import {
  isFirstLaunchAtom,
  isLoggedInAtom,
  lastDeepLinkAtom,
} from './src/state/atoms';
import { loadOnboardingCompleted } from './src/state/appLaunchStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isLoggedInStorage,
  SESSION_REFRESH_TOKEN_KEY,
} from './src/login/sessionStorage';
import {
  cleanupPushServices,
  initPushServices,
} from './src/push/pushService';
import {
  fetchForceUpdateInfo,
  type ForceUpdateInfo,
} from './src/appControl/checkAppVersion';
import { ForceUpdateScreen } from './src/appControl/ForceUpdateScreen';
import { trackAppSession } from './src/analytics/adminStats';

enableScreens();

function MainApp() {
  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const setLastDeepLink = useSetAtom(lastDeepLinkAtom);

  const openDeepLink = useCallback(
    (url: string | null | undefined) => {
      if (!url) {
        return;
      }
      const trimmed = url.trim();
      if (!trimmed) {
        return;
      }
      setLastDeepLink(trimmed);
      console.log('Deep link:', trimmed);
    },
    [setLastDeepLink],
  );

  useEffect(() => {
    void trackAppSession();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      cleanupPushServices();
      return;
    }

    let cancelled = false;

    (async () => {
      const userToken = await AsyncStorage.getItem(SESSION_REFRESH_TOKEN_KEY);
      if (cancelled) {
        return;
      }
      initPushServices(openDeepLink, userToken ?? undefined);
    })();

    return () => {
      cancelled = true;
      cleanupPushServices();
    };
  }, [isLoggedIn, openDeepLink]);

  return <RootNavigator />;
}

function AppShell() {
  const isDarkMode = useColorScheme() === 'dark';
  const isFirstLaunch = useAtomValue(isFirstLaunchAtom);

  const navigator = isFirstLaunch ? <OnboardingStack /> : <MainApp />;

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={rootNavigationRef}>{navigator}</NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  safeArea: { flex: 1 },
  bootLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});

function AppSafeAreaLayout({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      {children}
    </View>
  );
}

type AppBootstrapProps = {
  onReady: () => void | Promise<void>;
  onForceUpdate: (info: ForceUpdateInfo) => void;
};

function AppBootstrap({ onReady, onForceUpdate }: AppBootstrapProps) {
  const setIsFirstLaunch = useSetAtom(isFirstLaunchAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  useEffect(() => {
    const init = async () => {
      const [onboardingDone, loggedIn, forceUpdate] = await Promise.all([
        loadOnboardingCompleted(),
        isLoggedInStorage(),
        fetchForceUpdateInfo(),
      ]);

      if (forceUpdate) {
        onForceUpdate(forceUpdate);
        return;
      }

      if (onboardingDone) {
        setIsFirstLaunch(false);
      }
      if (loggedIn) {
        setIsLoggedIn(true);
      }
    };

    (async () => {
      try {
        await init();
      } finally {
        await onReady();
      }
    })();
  }, [onReady, onForceUpdate, setIsFirstLaunch, setIsLoggedIn]);

  return null;
}

function App() {
  const [bootReady, setBootReady] = useState(false);
  const [forceUpdate, setForceUpdate] = useState<ForceUpdateInfo | null>(null);

  const hideSplash = useCallback(async () => {
    await BootSplash.hide({ fade: true });
    setBootReady(true);
  }, []);

  const setIsFirstLaunch = useSetAtom(isFirstLaunchAtom);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  const handleForceUpdate = useCallback((info: ForceUpdateInfo) => {
    setForceUpdate(info);
  }, []);

  const handleContinueWithoutUpdate = useCallback(async () => {
    setForceUpdate(null);
    const [onboardingDone, loggedIn] = await Promise.all([
      loadOnboardingCompleted(),
      isLoggedInStorage(),
    ]);
    if (onboardingDone) {
      setIsFirstLaunch(false);
    }
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, [setIsFirstLaunch, setIsLoggedIn]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <AppBootstrap onReady={hideSplash} onForceUpdate={handleForceUpdate} />
        <AppSafeAreaLayout>
          {!bootReady ? (
            <View style={styles.bootLoading}>
              <ActivityIndicator size="large" color="#33383F" />
            </View>
          ) : forceUpdate ? (
            <ForceUpdateScreen
              info={forceUpdate}
              onContinueWithoutUpdate={() => {
                void handleContinueWithoutUpdate();
              }}
            />
          ) : (
            <AppShell />
          )}
        </AppSafeAreaLayout>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
  installMode: codePush.InstallMode.IMMEDIATE,
};

export default codePush(codePushOptions)(App);
