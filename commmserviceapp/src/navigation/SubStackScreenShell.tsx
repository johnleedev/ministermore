import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackAppTopBar } from './appTopBarHelpers';

type Props = {
  title: string;
  children: ReactNode;
  hideNotifiAction?: boolean;
  hideMypageAction?: boolean;
};

/** headerShown: false 스택 화면용 — 뒤로가기 헤더 (상단 Safe Area는 App 루트에서 처리) */
export function SubStackScreenShell({
  title,
  children,
  hideNotifiAction,
  hideMypageAction,
}: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <StackAppTopBar
          title={title}
          onBack={() => navigation.goBack()}
          hideNotifiAction={hideNotifiAction}
          hideMypageAction={hideMypageAction}
        />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f8fd' },
  headerWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  body: { flex: 1 },
});
