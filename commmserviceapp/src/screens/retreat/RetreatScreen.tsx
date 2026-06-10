import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PlaceMain } from './place/PlaceMain';
import { CastingMain } from './casting/CastingMain';
import { ReviewMain } from './review/ReviewMain';
import { UpgradeMain } from './upgrade/UpgradeMain';
import { RetreatCategoryProvider, type RetreatCategory } from './retreatCategoryContext';
import { retreatColors } from './retreatTheme';
import { useRootTabResetOnRequest } from '../../navigation/useRootTabResetOnRequest';
import type { RouteProp } from '@react-navigation/native';
import type { RootTabParamList } from '../../navigation/RootTabs';

export function RetreatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootTabParamList, 'Retreat'>>();
  const [category, setCategory] = useState<RetreatCategory>('place');
  const openTarget = route.params?.open;
  const targetCategory = openTarget?.category ?? category;

  useRootTabResetOnRequest(() => {
    setCategory('place');
  });

  useEffect(() => {
    if (openTarget?.category) {
      setCategory(openTarget.category);
      navigation.setParams?.({ open: undefined });
    }
  }, [openTarget?.category, navigation]);

  return (
    <RetreatCategoryProvider category={category} setCategory={setCategory}>
      <View style={styles.root}>
        {targetCategory === 'place' && (
          <PlaceMain initialDetailId={openTarget?.category === 'place' ? openTarget.id : undefined} />
        )}
        {category === 'review' && <ReviewMain />}
        {targetCategory === 'casting' && (
          <CastingMain initialDetailId={openTarget?.category === 'casting' ? openTarget.id : undefined} />
        )}
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
