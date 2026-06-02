import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PlaceMain } from './place/PlaceMain';
import { CastingMain } from './casting/CastingMain';
import { ReviewMain } from './review/ReviewMain';
import { UpgradeMain } from './upgrade/UpgradeMain';
import { RetreatCategoryProvider, type RetreatCategory } from './retreatCategoryContext';
import { retreatColors } from './retreatTheme';

export function RetreatScreen() {
  const [category, setCategory] = useState<RetreatCategory>('place');

  return (
    <RetreatCategoryProvider category={category} setCategory={setCategory}>
      <View style={styles.root}>
        {category === 'place' && <PlaceMain />}
        {category === 'review' && <ReviewMain />}
        {category === 'casting' && <CastingMain />}
        {category === 'upgrade' && <UpgradeMain />}
      </View>
    </RetreatCategoryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: retreatColors.bg,
  },
});
