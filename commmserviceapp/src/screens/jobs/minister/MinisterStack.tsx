import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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

function MinisterListScreen({
  navigation,
  initialDetailId,
}: NativeStackScreenProps<MinisterStackParamList, 'List'> & { initialDetailId?: string }) {
  useEffect(() => {
    if (initialDetailId) {
      navigation.navigate('Detail', { id: initialDetailId });
    }
  }, [initialDetailId, navigation]);
  return <MinisterList />;
}

export function MinisterStack({ initialDetailId }: { initialDetailId?: string }) {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List">
        {props => <MinisterListScreen {...props} initialDetailId={initialDetailId} />}
      </Stack.Screen>
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
