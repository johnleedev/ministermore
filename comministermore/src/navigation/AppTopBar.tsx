import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BRAND_LOGO = require('../images/logopng.png');

export type AppTopBarProps = {
  title: string;
  /** 홈·구인 등 MM 로고 + 연한 배경 */
  branded?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onPressNotifi?: () => void;
  onPressMypage?: () => void;
  showBellDot?: boolean;
  /** 마이 탭 등에서 프로필 아이콘 테두리 강조 */
  highlightProfile?: boolean;
  /** 알림·마이 버튼 숨김 (해당 탭 자체) */
  hideNotifiAction?: boolean;
  hideMypageAction?: boolean;
  onPressSettings?: () => void;
  bottomSlot?: ReactNode;
};

export function AppTopBar({
  title,
  branded = false,
  showBack = false,
  onBack,
  onPressNotifi,
  onPressMypage,
  showBellDot = false,
  highlightProfile = false,
  hideNotifiAction = false,
  hideMypageAction = false,
  onPressSettings,
  bottomSlot,
}: AppTopBarProps) {
  return (
    <View style={[styles.wrap, branded && styles.wrapBranded]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              onPress={onBack}>
              <MaterialIcons name="chevron-left" size={26} color="#3c3c43" />
            </Pressable>
          ) : null}
          {branded ? (
            <Image source={BRAND_LOGO} style={styles.logoImage} resizeMode="contain" />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.actions}>
          {onPressSettings ? (
            <Pressable
              accessibilityLabel="알림 설정"
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              onPress={onPressSettings}>
              <MaterialIcons name="settings" size={22} color="#3c3c43" />
            </Pressable>
          ) : null}
          {!hideNotifiAction && onPressNotifi ? (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              onPress={onPressNotifi}>
              <View>
                <MaterialIcons name="notifications-none" size={22} color="#3c3c43" />
                {showBellDot ? <View style={[styles.bellDot, branded && styles.bellDotBranded]} /> : null}
              </View>
            </Pressable>
          ) : null}
          {!hideMypageAction && onPressMypage ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                highlightProfile && styles.profileHighlight,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={onPressMypage}>
              <MaterialIcons name="person-outline" size={22} color="#3c3c43" />
            </Pressable>
          ) : null}
        </View>
      </View>
      {bottomSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  wrapBranded: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e8ecf0',
  },
  row: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  logoImage: {
    width: 48,
    height: 28,
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    backgroundColor: '#F3F4F6',
  },
  profileHighlight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#c9cdd2',
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B7FFF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellDotBranded: {
    borderColor: '#ffffff',
  },
});
