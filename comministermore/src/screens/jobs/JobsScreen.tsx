import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MinisterStack } from './minister/MinisterStack';
import { ChurchStack } from './church/ChurchStack';
import { InstituteStack } from './institute/InstituteStack';
import { JobsCategoryProvider, type JobCategory } from './jobsCategoryContext';
import { jobColors } from './common/jobsTheme';

export function JobsScreen() {
  const [category, setCategory] = useState<JobCategory>('minister');

  return (
    <JobsCategoryProvider category={category} setCategory={setCategory}>
      <View style={styles.root}>
        {category === 'minister' && <MinisterStack />}
        {category === 'church' && <ChurchStack />}
        {category === 'institute' && <InstituteStack />}
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
