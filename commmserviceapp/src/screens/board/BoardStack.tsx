import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { hiddenHeaderStackScreenOptions } from '../../navigation/stackScreenOptions';
import type { CommunityBoardConfig, CommunityPost } from './boardTypes';
import { BoardConfigProvider, useBoardConfig } from './boardConfigContext';
import { BoardDetailView, BoardListView } from './BoardMain';
import { BoardPostView } from './BoardPostView';
import { useRetreatSession } from '../retreat/useRetreatSession';
import { ensureBoardLogin } from './boardShared';

export type BoardStackParamList = {
  List: { refreshKey?: number } | undefined;
  Detail: { post: CommunityPost };
  Post: undefined;
};

const Stack = createNativeStackNavigator<BoardStackParamList>();

function BoardListScreen() {
  const config = useBoardConfig();
  const session = useRetreatSession();
  const navigation = useNavigation<NativeStackNavigationProp<BoardStackParamList>>();
  const route = useRoute<RouteProp<BoardStackParamList, 'List'>>();
  const refreshKey = route.params?.refreshKey ?? 0;

  return (
    <BoardListView
      key={refreshKey}
      config={config}
      refreshKey={refreshKey}
      onOpenDetail={post => navigation.navigate('Detail', { post })}
      onOpenPost={() => {
        void (async () => {
          const user = await ensureBoardLogin(session.isLoggedIn, session.user);
          if (!user) return;
          navigation.navigate('Post');
        })();
      }}
    />
  );
}

function BoardDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<BoardStackParamList, 'Detail'>) {
  const config = useBoardConfig();
  return (
    <BoardDetailView
      config={config}
      post={route.params.post}
      onBack={() => navigation.goBack()}
    />
  );
}

function BoardPostScreen({
  navigation,
}: NativeStackScreenProps<BoardStackParamList, 'Post'>) {
  const config = useBoardConfig();
  return (
    <BoardPostView
      config={config}
      onBack={() => navigation.goBack()}
      onSuccess={() => navigation.navigate('List', { refreshKey: Date.now() })}
    />
  );
}

export function BoardStack({ config }: { config: CommunityBoardConfig }) {
  return (
    <BoardConfigProvider config={config}>
      <Stack.Navigator
        id={`board-${config.sort}`}
        screenOptions={hiddenHeaderStackScreenOptions}>
        <Stack.Screen name="List" component={BoardListScreen} />
        <Stack.Screen name="Detail" component={BoardDetailScreen} />
        <Stack.Screen name="Post" component={BoardPostScreen} />
      </Stack.Navigator>
    </BoardConfigProvider>
  );
}
