// The hero: a big rubber stamp that says I'M BORED.
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { haptic } from '@/lib/feedback';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Icon } from './Icon';
import { Txt } from './ui';

export function BoredButton({ count }: { count: number }) {
  const { c, reduceMotion } = useTheme();
  const press = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(wobble, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wobble, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="I'm bored"
      accessibilityHint={`Deals a stack of ${count} things open right now near you`}
      onPressIn={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 14 }).start()}
      onPress={() => {
        haptic.stamp();
        router.push('/bored');
      }}
      style={{ marginHorizontal: 20, marginTop: 18 }}
    >
      <Animated.View
        style={{
          transform: [
            { rotate: wobble.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-2.6deg', '-1.5deg', '-0.4deg'] }) },
            { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) },
          ],
        }}
      >
        <View
          style={{
            backgroundColor: c.brickFill,
            padding: 5,
            borderRadius: 4,
            shadowColor: palette.ink,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
          }}
        >
          <View style={{ borderWidth: 2, borderColor: palette.paper, borderRadius: 2, paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: fonts.label, fontSize: 12, letterSpacing: 2, color: palette.paper, opacity: 0.85 }} maxFontSizeMultiplier={1.2}>
                NOTHING TO DO?
              </Txt>
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 40, lineHeight: 42, color: palette.paper, letterSpacing: -1 }} maxFontSizeMultiplier={1.2}>
                I’m bored.
              </Txt>
              <Txt v="bodySm" color={palette.paper} style={{ opacity: 0.9, marginTop: 2 }}>
                Deal me {count} things open right now, near me.
              </Txt>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: palette.paper, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <Icon name="shuffle" color={palette.paper} size={28} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
