import type { ComponentType } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { JobsScreen } from '../screens/jobs/JobsScreen';
import { RetreatScreen } from '../screens/retreat/RetreatScreen';
import { WorshipScreen } from '../screens/worship/WorshipScreen';
import { BoardScreen } from '../screens/board/BoardScreen';
import { MypageStack } from '../mypage/MypageStack';
import { NotificationsStack } from '../navigation/NotificationsStack';
import { MainAppTopBar } from './appTopBarHelpers';
import type { RootTabKey } from './rootTabKeys';
import { rootTabPressScrollToTopListeners, TabScrollProvider } from './tabScrollToTop';

export type RootTabParamList = {
  Home: undefined;
  Jobs:
    | undefined
    | {
        open?: {
          category: 'minister' | 'church' | 'institute';
          id: string;
        };
      };
  Retreat:
    | undefined
    | {
        open?: {
          category: 'place' | 'casting';
          id: number;
        };
      };
  Worship: undefined;
  Board: undefined;
  Notifi: undefined;
  Mypage: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ROUTE_ICONS: Record<keyof RootTabParamList, string> = {
  Home: 'home',
  Jobs: 'work-outline',
  Retreat: 'terrain',
  Worship: 'library-music',
  Board: 'forum',
  Notifi: 'notifications-none',
  Mypage: 'person-outline',
};

const ROUTE_TITLES: Record<keyof RootTabParamList, string> = {
  Home: '홈',
  Jobs: '구인구직',
  Retreat: '수련회',
  Worship: '예배사역',
  Board: '게시판',
  Notifi: '알림',
  Mypage: '마이페이지',
};

const BRANDED_TABS = new Set<keyof RootTabParamList>(['Home', 'Jobs', 'Retreat', 'Worship', 'Board']);

type TabIconProps = {
  color: string;
  size: number;
  routeName: keyof RootTabParamList;
};

function TabBarIcon({ color, size, routeName }: TabIconProps) {
  return (
    <MaterialIcons
      name={ROUTE_ICONS[routeName]}
      size={size}
      color={color}
    />
  );
}

function withTabScroll(tab: RootTabKey, Screen: ComponentType) {
  return function TabScreenWithScroll() {
    return (
      <TabScrollProvider tab={tab}>
        <Screen />
      </TabScrollProvider>
    );
  };
}

function TabTopBar({ route }: BottomTabHeaderProps) {
  const routeName = route.name as keyof RootTabParamList;
  const branded = BRANDED_TABS.has(routeName);

  return (
    <MainAppTopBar
      title={ROUTE_TITLES[routeName]}
      branded={branded}
      highlightProfile={branded}
    />
  );
}

export function RootTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: true,
        header: props => <TabTopBar {...props} />,
        /** 다른 탭으로 이동 시 언마운트 → 다시 들어올 때 해당 탭 초기 화면 */
        unmountOnBlur: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2B7FFF',
        tabBarInactiveTintColor: '#b0b8c1',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e8ecf0',
        },
        sceneContainerStyle: { backgroundColor: '#ffffff' },
        tabBarIcon: ({ color, size }) => (
          <TabBarIcon color={color} size={size} routeName={route.name} />
        ),
      })}>
      <Tab.Screen
        name="Home"
        component={withTabScroll('Home', HomeScreen)}
        options={{ tabBarLabel: '홈' }}
        listeners={rootTabPressScrollToTopListeners('Home')}
      />
      <Tab.Screen
        name="Jobs"
        component={withTabScroll('Jobs', JobsScreen)}
        options={{ tabBarLabel: '구인구직' }}
        listeners={rootTabPressScrollToTopListeners('Jobs')}
      />
      <Tab.Screen
        name="Retreat"
        component={withTabScroll('Retreat', RetreatScreen)}
        options={{ tabBarLabel: '수련회' }}
        listeners={rootTabPressScrollToTopListeners('Retreat')}
      />
      <Tab.Screen
        name="Worship"
        component={withTabScroll('Worship', WorshipScreen)}
        options={{ tabBarLabel: '예배사역' }}
        listeners={rootTabPressScrollToTopListeners('Worship')}
      />
      <Tab.Screen
        name="Board"
        component={withTabScroll('Board', BoardScreen)}
        options={{ tabBarLabel: '게시판' }}
        listeners={rootTabPressScrollToTopListeners('Board')}
      />
      <Tab.Screen
        name="Notifi"
        component={withTabScroll('Notifi', NotificationsStack)}
        options={{
          tabBarLabel: '알림',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerShown: false,
        }}
        listeners={rootTabPressScrollToTopListeners('Notifi')}
      />
      <Tab.Screen
        name="Mypage"
        component={withTabScroll('Mypage', MypageStack)}
        options={{
          tabBarLabel: '마이페이지',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          headerShown: false,
        }}
        listeners={rootTabPressScrollToTopListeners('Mypage')}
      />
    </Tab.Navigator>
  );
}
