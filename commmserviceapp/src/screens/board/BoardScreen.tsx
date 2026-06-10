import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BoardMain } from './BoardMain';
import { BOARD_CONFIG_BY_CATEGORY } from './boardConfigs';
import { BoardCategoryProvider } from './boardCategoryContext';
import type { BoardCategoryKey } from './boardUi';
import { boardColors } from './boardTheme';
import { useRootTabResetOnRequest } from '../../navigation/useRootTabResetOnRequest';

export function BoardScreen() {
  const [category, setCategory] = useState<BoardCategoryKey>('freeboard');

  useRootTabResetOnRequest(() => {
    setCategory('freeboard');
  });

  return (
    <BoardCategoryProvider category={category} setCategory={setCategory}>
      <View style={styles.root}>
        <BoardMain key={category} config={BOARD_CONFIG_BY_CATEGORY[category]} />
      </View>
    </BoardCategoryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: boardColors.bg,
  },
});
