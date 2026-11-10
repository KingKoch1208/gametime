// Custom map markers: tiny illustrated circles, color-coded
// brick = events, ivy = places, mustard = food. Live pins pulse.
import { memo, useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

export type PinColor = 'brick' | 'ivy' | 'mustard' | 'locked';

function colorFor(c: ReturnType<typeof useTheme>['c'], k: PinColor) {
  switch (k) {
    case 'brick':
      return { bg: palette.brick, fg: palette.paper };
    case 'ivy':
      return { bg: palette.ivy, fg: palette.paper };
    case 'mustard':
      return { bg: palette.mustard, fg: palette.ink };
    case 'locked':
      return { bg: c.locked, fg: palette.paper };
  }
}

function PinImpl({ icon, color, live, selected, locked }: { icon: IconName; color: PinColor; live?: boolean; selected?: boolean; locked?: boolean }) {
  const { c, reduceMotion } = useTheme();
  const { bg, fg } = colorFor(c, locked ? 'locked' : color);
  const enter = useState(() => new Animated.Value(0))[0];
  const pulse = useState(() => new Animated.Value(0))[0];
  const size = selected ? 44 : 34;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }, [enter]);

  useEffect(() => {
    if (!live || reduceMotion) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [live, pulse, reduceMotion]);

  return (
    <View style={{ width: 70, height: 70, alignItems: 'center', justifyContent: 'center' }}>
      {live && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: bg,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) }],
          }}
        />
      )}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: 2,
          borderColor: selected ? palette.mustard : palette.ink,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: enter }],
          shadowColor: palette.ink,
          shadowOpacity: 0.35,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Icon name={locked ? 'lock' : icon} color={fg} size={size * 0.55} strokeWidth={2} />
      </Animated.View>
    </View>
  );
}

export const Pin = memo(PinImpl);

export function ClusterPin({ count, color }: { count: number; color: PinColor }) {
  const { c } = useTheme();
  const { bg, fg } = colorFor(c, color);
  const size = Math.min(58, 34 + count * 2);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderWidth: 2.5,
        borderColor: palette.paper,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: palette.ink,
        shadowOpacity: 0.4,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size - 8,
          height: size - 8,
          borderRadius: (size - 8) / 2,
          borderWidth: 1,
          borderColor: fg,
          opacity: 0.6,
          borderStyle: 'dashed',
        }}
      />
      <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 17, color: fg }} maxFontSizeMultiplier={1}>
        {count}
      </Txt>
    </View>
  );
}

export function FriendBubble({ initials, color, ghost }: { initials: string; color: string; ghost?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: ghost ? '#8C8476' : color,
          borderWidth: 3,
          borderColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: palette.ink,
          shadowOpacity: 0.35,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {ghost ? (
          <Icon name="ghost" color={palette.paper} size={22} />
        ) : (
          <Txt style={{ fontFamily: fonts.label, fontSize: 14, color: color === palette.mustard ? palette.ink : palette.paper }} maxFontSizeMultiplier={1}>
            {initials}
          </Txt>
        )}
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: palette.paper,
          marginTop: -1,
        }}
      />
    </View>
  );
}
