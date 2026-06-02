import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function ZoomablePreviewImage({ uri }: { uri: string }) {
  const scaleBase = useRef(1);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const panBase = useRef({ x: 0, y: 0 });
  const pinchRef = useRef<PinchGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);

  const resetTransforms = () => {
    scaleBase.current = 1;
    scaleAnim.setValue(1);
    panBase.current = { x: 0, y: 0 };
    translateX.setValue(0);
    translateY.setValue(0);
  };

  useEffect(() => {
    resetTransforms();
  }, [uri]);

  const onPinchEvent = (event: PinchGestureHandlerGestureEvent) => {
    const next = scaleBase.current * event.nativeEvent.scale;
    scaleAnim.setValue(clampScale(next));
  };

  const onPinchStateChange = (event: PinchGestureHandlerGestureEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      scaleBase.current = clampScale(scaleBase.current * event.nativeEvent.scale);
      scaleAnim.setValue(scaleBase.current);
    }
  };

  const onPanEvent = (event: PanGestureHandlerGestureEvent) => {
    if (scaleBase.current <= MIN_SCALE) return;
    translateX.setValue(panBase.current.x + event.nativeEvent.translationX);
    translateY.setValue(panBase.current.y + event.nativeEvent.translationY);
  };

  const onPanStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      panBase.current = {
        x: panBase.current.x + event.nativeEvent.translationX,
        y: panBase.current.y + event.nativeEvent.translationY,
      };
      translateX.setValue(panBase.current.x);
      translateY.setValue(panBase.current.y);
    }
  };

  return (
    <PanGestureHandler
      ref={panRef}
      simultaneousHandlers={pinchRef}
      onGestureEvent={onPanEvent}
      onHandlerStateChange={onPanStateChange}
      minPointers={1}
      maxPointers={2}
      avgTouches>
      <Animated.View style={styles.zoomStage}>
        <PinchGestureHandler
          ref={pinchRef}
          simultaneousHandlers={panRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}>
          <Animated.View style={styles.zoomStage}>
            <Animated.Image
              source={{ uri }}
              style={[
                styles.previewImage,
                {
                  transform: [{ scale: scaleAnim }, { translateX }, { translateY }],
                },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

type ImagePreviewModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

export function ImagePreviewModal({ visible, uri, onClose }: ImagePreviewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'right']}>
          <View style={styles.toolbar}>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12} accessibilityLabel="닫기">
              <MaterialIcons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
          {uri ? (
            <View style={styles.imageWrap}>
              <ZoomablePreviewImage uri={uri} />
            </View>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

type DetailPressableImageProps = {
  uri: string;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

/** 상세 본문 이미지 — 탭 시 전체 화면 미리보기 (핀치 확대·축소) */
export function DetailPressableImage({
  uri,
  style,
  resizeMode = 'cover',
}: DetailPressableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="이미지 크게 보기">
        <Image source={{ uri }} style={style} resizeMode={resizeMode} />
      </Pressable>
      <ImagePreviewModal visible={open} uri={uri} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  safe: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    zIndex: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  zoomStage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
