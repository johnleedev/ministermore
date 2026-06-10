import { StyleSheet, Text, View } from 'react-native';

export function NotifiMainScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>알림</Text>
      <Text style={styles.desc}>알림 화면입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  desc: {
    fontSize: 14,
    color: '#6B7280',
  },
});

