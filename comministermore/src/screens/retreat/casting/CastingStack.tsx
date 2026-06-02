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
import { CastingDetailView, CastingListView, CastingRequestView } from './CastingMain';

export type CastingStackParamList = {
  List: undefined;
  Detail: { id: number };
  Request: undefined;
};

const Stack = createNativeStackNavigator<CastingStackParamList>();

function CastingListScreen({ navigation }: NativeStackScreenProps<CastingStackParamList, 'List'>) {
  const session = useRetreatSession();

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

export function CastingStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={CastingListScreen} />
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
