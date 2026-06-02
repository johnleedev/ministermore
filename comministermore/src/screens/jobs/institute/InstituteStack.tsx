import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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

function InstituteListScreen({
  navigation,
  initialDetailId,
}: NativeStackScreenProps<InstituteStackParamList, 'List'> & { initialDetailId?: string }) {
  useEffect(() => {
    if (initialDetailId) {
      navigation.navigate('Detail', { id: initialDetailId });
    }
  }, [initialDetailId, navigation]);
  return <InstituteList />;
}

export function InstituteStack({ initialDetailId }: { initialDetailId?: string }) {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List">
        {props => <InstituteListScreen {...props} initialDetailId={initialDetailId} />}
      </Stack.Screen>
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
