import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MinisterStack } from './minister/MinisterStack';
import { ChurchStack } from './church/ChurchStack';
import { InstituteStack } from './institute/InstituteStack';
import { JobsCategoryProvider, type JobCategory } from './jobsCategoryContext';
import { jobColors } from './common/jobsTheme';
import type { RouteProp } from '@react-navigation/native';
import type { RootTabParamList } from '../../navigation/RootTabs';

export function JobsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootTabParamList, 'Jobs'>>();
  const [category, setCategory] = useState<JobCategory>('minister');
  const openTarget = route.params?.open;
  const targetCategory = openTarget?.category ?? category;

  useEffect(() => {
    if (openTarget?.category) {
      setCategory(openTarget.category);
      navigation.setParams?.({ open: undefined });
    }
  }, [openTarget?.category, navigation]);

  return (
    <JobsCategoryProvider category={category} setCategory={setCategory}>
      <View style={styles.root}>
        {targetCategory === 'minister' && <MinisterStack initialDetailId={openTarget?.category === 'minister' ? openTarget.id : undefined} />}
        {targetCategory === 'church' && <ChurchStack initialDetailId={openTarget?.category === 'church' ? openTarget.id : undefined} />}
        {targetCategory === 'institute' && <InstituteStack initialDetailId={openTarget?.category === 'institute' ? openTarget.id : undefined} />}
      </View>
    </JobsCategoryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: jobColors.bg,
  },
});
