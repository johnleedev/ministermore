import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationDetailScreen } from '../notifi/NotificationDetailScreen';
import { NotificationsListScreen } from '../notifi/NotificationsListScreen';
import { SettingsScreen } from '../notifi/SettingsScreen';
import { MainAppTopBar } from './appTopBarHelpers';
import { stackScreenOptions } from './stackScreenOptions';

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  NotificationDetail: { id: string };
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export function NotificationsStack() {
  return (
    <Stack.Navigator
      initialRouteName="NotificationsList"
      screenOptions={{
        ...stackScreenOptions,
        headerShown: true,
        contentStyle: { backgroundColor: '#f5f8fd' },
      }}>
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsListScreen}
        options={({ navigation }) => ({
          header: () => (
            <MainAppTopBar
              title="알림"
              hideNotifiAction
              onPressSettings={() => navigation.navigate('NotificationSettings')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
