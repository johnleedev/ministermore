import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { SongDetail } from './SongDetail';
import { SongsList } from './SongsList';

export type SongsStackParamList = {
  List: undefined;
  Detail: { id: number };
};

const Stack = createNativeStackNavigator<SongsStackParamList>();

export function SongsStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={SongsList} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <SongDetail id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
