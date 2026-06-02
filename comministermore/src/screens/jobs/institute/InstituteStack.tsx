import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { InstituteDetail } from './InstituteDetail';
import { InstituteList } from './InstituteList';
import { InstituteWrite } from './InstituteWrite';

export type InstituteStackParamList = {
  List: undefined;
  Detail: { id: string };
  Write: undefined;
};

const Stack = createNativeStackNavigator<InstituteStackParamList>();

export function InstituteStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={InstituteList} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <InstituteDetail id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Write">
        {({ navigation }) => (
          <InstituteWrite
            onBack={() => navigation.goBack()}
            onSuccess={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
