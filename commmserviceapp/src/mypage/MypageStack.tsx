import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MypageMainScreen } from './MypageMainScreen';
import { ProfileScreen } from './ProfileScreen';
import { ScrapListScreen } from './ScrapListScreen';
import { UserPostsScreen } from './UserPostsScreen';
import { InquiryScreen } from './InquiryScreen';
import { SettingsScreen } from '../notifi/SettingsScreen';
import { MainAppTopBar } from '../navigation/appTopBarHelpers';
import { stackScreenOptions } from '../navigation/stackScreenOptions';

export type MypageStackParamList = {
  MypageMain: undefined;
  Profile: undefined;
  NotificationSettings: undefined;
  ScrapList: undefined;
  UserPosts: undefined;
  Inquiry: undefined;
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
      <Stack.Screen name="ScrapList" component={ScrapListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserPosts" component={UserPostsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Inquiry" component={InquiryScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="NotificationSettings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
