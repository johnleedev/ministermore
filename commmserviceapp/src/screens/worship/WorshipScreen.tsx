import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SongsStack } from './songs/SongsStack';
import { ContiMain } from './conti/ContiMain';
import { WorshipCategoryProvider, type WorshipCategory } from './worshipCategoryContext';
import { worshipColors } from './worshipTheme';
import { useRootTabResetOnRequest } from '../../navigation/useRootTabResetOnRequest';

export function WorshipScreen() {
  const [tab, setTab] = useState<WorshipCategory>('songs');

  useRootTabResetOnRequest(() => {
    setTab('songs');
  });

  return (
    <WorshipCategoryProvider category={tab} setCategory={setTab}>
      <View style={styles.root}>
        {tab === 'songs' && <SongsStack />}
        {tab === 'conti' && <ContiMain />}
      </View>
    </WorshipCategoryProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: worshipColors.bg,
  },
});
