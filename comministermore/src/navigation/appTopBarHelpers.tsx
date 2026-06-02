import { useNavigation } from '@react-navigation/native';
import { useAtomValue } from 'jotai';
import { notificationListAtom } from '../state/atoms';
import { AppTopBar } from './AppTopBar';

export function useRootTabActions() {
  const navigation = useNavigation();
  return {
    goNotifi: () => navigation.navigate('Notifi' as never),
    goMypage: () => navigation.navigate('Mypage' as never),
  };
}

export function MainAppTopBar({
  title,
  branded,
  highlightProfile,
  hideNotifiAction,
  hideMypageAction,
  onPressSettings,
}: {
  title: string;
  branded?: boolean;
  highlightProfile?: boolean;
  hideNotifiAction?: boolean;
  hideMypageAction?: boolean;
  onPressSettings?: () => void;
}) {
  const notifications = useAtomValue(notificationListAtom);
  const { goNotifi, goMypage } = useRootTabActions();
  const showBellDot = notifications.some(n => n.readCount === 0);

  return (
    <AppTopBar
      title={title}
      branded={branded}
      onPressNotifi={goNotifi}
      onPressMypage={goMypage}
      showBellDot={showBellDot}
      highlightProfile={highlightProfile}
      hideNotifiAction={hideNotifiAction}
      hideMypageAction={hideMypageAction}
      onPressSettings={onPressSettings}
    />
  );
}

export function StackAppTopBar({
  title,
  onBack,
  hideNotifiAction,
  hideMypageAction,
}: {
  title: string;
  onBack: () => void;
  hideNotifiAction?: boolean;
  hideMypageAction?: boolean;
}) {
  const notifications = useAtomValue(notificationListAtom);
  const { goNotifi, goMypage } = useRootTabActions();
  const showBellDot = notifications.some(n => n.readCount === 0);

  return (
    <AppTopBar
      title={title}
      showBack
      onBack={onBack}
      onPressNotifi={goNotifi}
      onPressMypage={goMypage}
      showBellDot={showBellDot}
      hideNotifiAction={hideNotifiAction}
      hideMypageAction={hideMypageAction}
    />
  );
}
