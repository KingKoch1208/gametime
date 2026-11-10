// Spring-y modal bottom sheet. Drag the handle down (or tap the backdrop) to close.
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './ui';

const H = Dimensions.get('window').height;

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  heightPct = 0.78,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  heightPct?: number;
  footer?: ReactNode;
}) {
  const { c, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetH = H * heightPct;
  const y = useState(() => new Animated.Value(sheetH))[0];
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      // Stay mounted through the exit animation, so mount state follows `visible` here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      y.setValue(sheetH);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: reduceMotion ? 0 : 7, speed: 14 }).start();
    } else if (mounted) {
      Animated.timing(y, { toValue: sheetH, duration: 200, useNativeDriver: true }).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => y.setValue(Math.max(-20, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > sheetH * 0.25 || g.vy > 1.1) onClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
      },
    }),
  )[0];

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay, opacity: y.interpolate({ inputRange: [0, sheetH], outputRange: [1, 0] }) }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" accessibilityRole="button" />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          { height: sheetH, backgroundColor: c.bg, borderColor: c.lineStrong, paddingBottom: insets.bottom, transform: [{ translateY: y }] },
        ]}
      >
        <View {...pan.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: c.lineStrong }]} />
          {title && (
            <Txt v="title" style={{ marginTop: 10 }} accessibilityRole="header">
              {title}
            </Txt>
          )}
        </View>
        <View style={{ flex: 1 }}>{children}</View>
        {footer}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  handleArea: { paddingTop: 10, paddingBottom: 6, paddingHorizontal: 20, alignItems: 'flex-start' },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, opacity: 0.5 },
});
