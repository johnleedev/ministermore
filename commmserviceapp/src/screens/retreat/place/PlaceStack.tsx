import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
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

function PlaceListScreen({
  navigation,
  initialDetailId,
}: NativeStackScreenProps<PlaceStackParamList, 'List'> & { initialDetailId?: number }) {
  const session = useRetreatSession();
  useEffect(() => {
    if (initialDetailId) {
      navigation.navigate('Detail', { id: initialDetailId });
    }
  }, [initialDetailId, navigation]);

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

export function PlaceStack({ initialDetailId }: { initialDetailId?: number }) {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List">
        {props => <PlaceListScreen {...props} initialDetailId={initialDetailId} />}
      </Stack.Screen>
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
