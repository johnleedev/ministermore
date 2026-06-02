import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { ChurchDetail } from './ChurchDetail';
import { ChurchList } from './ChurchList';
import { ChurchWrite } from './ChurchWrite';

export type ChurchStackParamList = {
  List: undefined;
  Detail: { id: string };
  Write: undefined;
};

const Stack = createNativeStackNavigator<ChurchStackParamList>();

export function ChurchStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={ChurchList} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <ChurchDetail id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Write">
        {({ navigation }) => (
          <ChurchWrite
            onBack={() => navigation.goBack()}
            onSuccess={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
