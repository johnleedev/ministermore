import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigationState } from '@react-navigation/native';
import { SubStackScreenShell } from '../navigation/SubStackScreenShell';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getOsNotificationsAllowed,
  loadUserWantsPush,
  saveUserWantsPush,
  syncUserActiveToServer,
  fetchFcmTokenForSync,
} from './notificationSettings';
import { mpScreenContentStyle } from '../screens/shared/mypageUi';
import { mpColors } from '../screens/shared/mypageTheme';

function SettingsRow({
  title,
  subtitle,
  onPress,
  showChevron,
  isLast,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  trailing?: ReactNode;
}) {
  const content = (
    <View style={[styles.rowInner, !isLast && styles.rowBorder]}>
      <View style={styles.rowTexts}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? (
        <MaterialIcons name="chevron-right" size={22} color="#C7C7CC" style={styles.chevron} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.rowPressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const hideNotifiAction = useNavigationState(
    state => state.routes[0]?.name === 'NotificationsList',
  );
  const [loading, setLoading] = useState(false);
  const [osAllowed, setOsAllowed] = useState(false);
  const [userWants, setUserWants] = useState(true);
  const [androidPostLabel, setAndroidPostLabel] = useState('—');
  const [tokenPreview, setTokenPreview] = useState('…');

  const effective = osAllowed && userWants;

  const refreshStatus = useCallback(async () => {
    try {
      const [os, wants] = await Promise.all([
        getOsNotificationsAllowed(),
        loadUserWantsPush(),
      ]);
      setOsAllowed(os);
      setUserWants(wants);

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const post = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        setAndroidPostLabel(post ? '허용됨' : '거부 또는 아직 요청 전');
      } else if (Platform.OS === 'android') {
        setAndroidPostLabel('해당 없음 (API 32 이하)');
      } else {
        setAndroidPostLabel('—');
      }

      const token = await fetchFcmTokenForSync();
      if (token) {
        setTokenPreview(
          token.length > 40 ? `${token.slice(0, 20)}…${token.slice(-10)}` : token,
        );
      } else {
        setTokenPreview('토큰을 가져오지 못했습니다.');
      }
    } catch {
      setTokenPreview('—');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus().catch(() => {});
    }, [refreshStatus]),
  );

  const onOpenAppSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const onTogglePush = useCallback(
    async (next: boolean) => {
      if (next) {
        setLoading(true);
        try {
          const os = await getOsNotificationsAllowed();
          if (!os) {
            setLoading(false);
            Alert.alert('알림 권한', '기기 설정에서 알림 권한을 허용해주세요.', [
              { text: '취소', style: 'cancel' },
              { text: '설정 열기', onPress: onOpenAppSettings },
            ]);
            return;
          }
          await saveUserWantsPush(true);
          setUserWants(true);
          await syncUserActiveToServer();
        } catch (e) {
          Alert.alert('알림', e instanceof Error ? e.message : '설정을 저장하지 못했습니다.');
        } finally {
          setLoading(false);
          refreshStatus().catch(() => {});
        }
        return;
      }

      setLoading(true);
      try {
        await saveUserWantsPush(false);
        setUserWants(false);
        await syncUserActiveToServer();
      } catch (e) {
        Alert.alert('알림', e instanceof Error ? e.message : '설정을 저장하지 못했습니다.');
      } finally {
        setLoading(false);
        refreshStatus().catch(() => {});
      }
    },
    [onOpenAppSettings, refreshStatus],
  );

  const deviceSubtitle = osAllowed
    ? userWants
      ? '기기 알림 허용·앱에서 푸시 수신'
      : '기기는 허용됨 — 앱에서만 알림 끔(서버는 이 기기로 보내지 않음)'
    : '시스템 알림이 꺼져 있습니다. 켤 때는 기기 설정에서 권한을 켜 주세요.';

  return (
    <SubStackScreenShell title="알림 설정" hideNotifiAction={hideNotifiAction}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={mpScreenContentStyle(24 + insets.bottom)}
        keyboardShouldPersistTaps="handled">

      <Text style={styles.sectionHeader}>알림</Text>
      <View style={styles.card}>
        <SettingsRow
          title="푸시 알림"
          subtitle={deviceSubtitle}
          trailing={
            <View style={styles.switchWrap}>
              {loading ? <ActivityIndicator style={styles.rowSpinner} color="#8E8E93" /> : null}
              <Switch value={effective} onValueChange={onTogglePush} disabled={loading} />
            </View>
          }
        />
        <SettingsRow
          title="기기에서 알림 설정"
          subtitle="배너·소리·배지 등 시스템 설정"
          onPress={onOpenAppSettings}
          showChevron
          isLast
        />
      </View>

      <Text style={styles.sectionHeader}>상태</Text>
      <View style={styles.card}>
        {Platform.OS === 'android' ? (
          <SettingsRow title="알림 표시 권한 (Android)" subtitle={androidPostLabel} />
        ) : null}
        <SettingsRow title="등록 토큰" subtitle={tokenPreview} isLast />
      </View>
      </ScrollView>
    </SubStackScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: mpColors.bg },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    color: mpColors.text,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: mpColors.border,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  rowPressed: { opacity: 0.55 },
  rowTexts: { flex: 1, paddingRight: 8 },
  rowTitle: { fontSize: 16, color: mpColors.text },
  rowSubtitle: { fontSize: 13, marginTop: 3, lineHeight: 18, color: mpColors.textMuted },
  chevron: { marginLeft: 4 },
  rowSpinner: { marginRight: 8 },
  switchWrap: { flexDirection: 'row', alignItems: 'center' },
});
