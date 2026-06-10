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
import { CastingDetailView, CastingListView, CastingRequestView } from './CastingMain';

export type CastingStackParamList = {
  List: undefined;
  Detail: { id: number };
  Request: undefined;
};

const Stack = createNativeStackNavigator<CastingStackParamList>();

function CastingListScreen({
  navigation,
  initialDetailId,
}: NativeStackScreenProps<CastingStackParamList, 'List'> & { initialDetailId?: number }) {
  const session = useRetreatSession();
  useEffect(() => {
    if (initialDetailId) {
      navigation.navigate('Detail', { id: initialDetailId });
    }
  }, [initialDetailId, navigation]);

  return (
    <CastingListView
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

export function CastingStack({ initialDetailId }: { initialDetailId?: number }) {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List">
        {props => <CastingListScreen {...props} initialDetailId={initialDetailId} />}
      </Stack.Screen>
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <CastingDetailView id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Request">
        {({ navigation }) => <CastingRequestView onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
