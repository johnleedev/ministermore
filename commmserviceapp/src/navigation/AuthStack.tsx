import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen } from '../login/ForgotPasswordScreen';
import { LoginScreen } from '../login/LoginScreen';
import { RegisterDetailScreen } from '../login/RegisterDetailScreen';
import { RegisterMainScreen } from '../login/RegisterMainScreen';
import { hiddenHeaderStackScreenOptions } from './stackScreenOptions';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  RegisterMain: undefined;
  RegisterDetail: {
    sort: 'email' | 'sns';
    snsData?: {
      email: string;
      userURL: string;
      refreshToken?: string;
    };
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...hiddenHeaderStackScreenOptions,
        contentStyle: { backgroundColor: '#f8fafd' },
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="RegisterMain" component={RegisterMainScreen} />
      <Stack.Screen name="RegisterDetail" component={RegisterDetailScreen} />
    </Stack.Navigator>
  );
}
