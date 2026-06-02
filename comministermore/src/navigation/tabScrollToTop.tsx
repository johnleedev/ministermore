import { createContext, useContext, type ReactNode } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EventArg } from '@react-navigation/native';
import { getDefaultStore } from 'jotai';
import { rootTabScrollToTopRequestAtom } from '../state/atoms';
import type { RootTabKey } from './rootTabKeys';

const TabScrollContext = createContext<RootTabKey | null>(null);

export function TabScrollProvider({ tab, children }: { tab: RootTabKey; children: ReactNode }) {
  return <TabScrollContext.Provider value={tab}>{children}</TabScrollContext.Provider>;
}

export function useTabScrollKey() {
  return useContext(TabScrollContext);
}

export function requestRootTabScrollToTop(tab: RootTabKey) {
  const store = getDefaultStore();
  store.set(rootTabScrollToTopRequestAtom, prev => ({
    ...prev,
    [tab]: (prev[tab] ?? 0) + 1,
  }));
}

type TabNav = BottomTabNavigationProp<Record<string, object | undefined>>;

/** 이미 선택된 탭을 다시 누르면 현재 화면에서만 스크롤 맨 위 (스택 pop 방지) */
export function rootTabPressScrollToTopListeners(tab: RootTabKey) {
  return ({ navigation }: { navigation: TabNav }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      if (!navigation.isFocused()) {
        return;
      }
      e.preventDefault();
      requestRootTabScrollToTop(tab);
    },
  });
}
