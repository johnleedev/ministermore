import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { useRetreatSession } from '../useRetreatSession';
import { loadSessionUser } from '../../../login/sessionStorage';
import {
  checkRetreatLogin,
  checkRetreatLoginForRequest,
  checkRetreatMember,
} from '../retreatShared';
import { PlaceDetailView, PlaceListView, PlaceRequestView } from './PlaceMain';

export type PlaceStackParamList = {
  List: undefined;
  Detail: { id: number };
  Request: undefined;
};

const Stack = createNativeStackNavigator<PlaceStackParamList>();

function PlaceListScreen({ navigation }: NativeStackScreenProps<PlaceStackParamList, 'List'>) {
  const session = useRetreatSession();

  return (
    <PlaceListView
      onOpenDetail={async id => {
        if (!checkRetreatLogin(session.isLoggedIn)) return;
        const user = session.user ?? (await loadSessionUser());
        if (!checkRetreatMember(user?.grade)) return;
        navigation.navigate('Detail', { id });
      }}
      onOpenRequest={() => {
        if (!checkRetreatLoginForRequest(session.isLoggedIn)) return;
        navigation.navigate('Request');
      }}
    />
  );
}

export function PlaceStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={PlaceListScreen} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <PlaceDetailView id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Request">
        {({ navigation }) => <PlaceRequestView onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
