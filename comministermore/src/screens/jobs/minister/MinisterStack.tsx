import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { MinisterDetail } from './MinisterDetail';
import { MinisterList } from './MinisterList';
import { MinisterWrite } from './MinisterWrite';

export type MinisterStackParamList = {
  List: undefined;
  Detail: { id: string };
  Write: undefined;
};

const Stack = createNativeStackNavigator<MinisterStackParamList>();

export function MinisterStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={MinisterList} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <MinisterDetail id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Write">
        {({ navigation }) => (
          <MinisterWrite
            onBack={() => navigation.goBack()}
            onSuccess={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
