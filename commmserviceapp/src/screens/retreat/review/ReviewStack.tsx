import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../../navigation/stackScreenOptions';
import { useRetreatSession } from '../useRetreatSession';
import { checkRetreatLogin } from '../retreatShared';
import { ReviewDetailView, ReviewListView, ReviewPostView } from './ReviewMain';

export type ReviewStackParamList = {
  List: { refreshKey?: number } | undefined;
  Detail: { id: number };
  Post: undefined;
};

const Stack = createNativeStackNavigator<ReviewStackParamList>();

function ReviewListScreen({ navigation }: NativeStackScreenProps<ReviewStackParamList, 'List'>) {
  const session = useRetreatSession();

  return (
    <ReviewListView
      onOpenDetail={id => {
        if (!checkRetreatLogin(session.isLoggedIn)) return;
        navigation.navigate('Detail', { id });
      }}
      onOpenPost={() => {
        if (!checkRetreatLogin(session.isLoggedIn)) return;
        navigation.navigate('Post');
      }}
    />
  );
}

export function ReviewStack() {
  return (
    <Stack.Navigator screenOptions={hiddenHeaderStackScreenOptions}>
      <Stack.Screen name="List" component={ReviewListScreen} />
      <Stack.Screen name="Detail">
        {({ route, navigation }) => (
          <ReviewDetailView id={route.params.id} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Post">
        {({ navigation }) => <ReviewPostView onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
