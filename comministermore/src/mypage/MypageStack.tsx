import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MypageMainScreen } from './MypageMainScreen';
import { ProfileScreen } from './ProfileScreen';
import { ScrapListScreen } from './ScrapListScreen';
import { SettingsScreen } from '../notifi/SettingsScreen';
import { MainAppTopBar } from '../navigation/appTopBarHelpers';
import { stackScreenOptions } from '../navigation/stackScreenOptions';

export type MypageStackParamList = {
  MypageMain: undefined;
  Profile: undefined;
  NotificationSettings: undefined;
  ScrapList: undefined;
};

const Stack = createNativeStackNavigator<MypageStackParamList>();

export function MypageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackScreenOptions,
        headerShown: true,
        contentStyle: { backgroundColor: '#f5f8fd' },
      }}>
      <Stack.Screen
        name="MypageMain"
        component={MypageMainScreen}
        options={{
          header: () => (
            <MainAppTopBar title="마이페이지" highlightProfile hideMypageAction />
          ),
        }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ScrapList"
        component={ScrapListScreen}
        options={{ title: '스크랩 관리', headerBackTitle: '뒤로' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
