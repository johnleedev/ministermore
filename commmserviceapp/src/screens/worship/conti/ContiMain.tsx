import { StyleSheet, View } from 'react-native';
import { WorshipCategoryTabs } from '../worshipCategoryContext';
import { worshipColors } from '../worshipTheme';
import { ContiMaker } from './ContiMaker';

export function ContiMain() {
  return (
    <View style={styles.root}>
      <WorshipCategoryTabs />
      <ContiMaker hideBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: worshipColors.bg,
  },
});
