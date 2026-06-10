import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { UpgradeListScreen, UpgradeWriteScreen } from './UpgradeMain';

export type UpgradeStackParamList = {
  List: undefined;
  Write: undefined;
};

const Stack = createNativeStackNavigator<UpgradeStackParamList>();

export function UpgradeStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={UpgradeListScreen} />
      <Stack.Screen name="Write" component={UpgradeWriteScreen} />
    </Stack.Navigator>
  );
}
