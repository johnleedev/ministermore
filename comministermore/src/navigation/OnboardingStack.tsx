import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { hiddenHeaderStackScreenOptions } from './stackScreenOptions';

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...hiddenHeaderStackScreenOptions,
        contentStyle: { backgroundColor: '#ffffff' },
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
