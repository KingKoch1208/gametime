// Rubber-stamp badges: FREE, OPEN TO ALL, UGA ID, 21+, DAWG PERK, LOCK…
// Slightly rotated, double-ruled border, stamped on with a little spring.
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { type AccessResult, STAMP_TEXT, type StampKind } from '@/lib/access';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

type Props = {
  kind: StampKind;
  text?: string;
  rotate?: number;
  animate?: boolean;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

export function Stamp({ kind, text, rotate, animate = true, delay = 0, size = 'sm', style }: Props) {
  const { c, reduceMotion } = useTheme();
  const anim = useState(() => new Animated.Value(animate && !reduceMotion ? 0 : 1))[0];

  useEffect(() => {
    if (!animate || reduceMotion) return;
    Animated.sequence([Animated.delay(delay), Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 9 })]).start();
  }, [anim, animate, delay, reduceMotion]);

  const { fg, bg, icon } = stampStyle(kind, c);
  const r = rotate ?? ROT[kind];
  const fs = size === 'lg' ? 18 : size === 'md' ? 13 : 10.5;
  const label = (text ?? STAMP_TEXT[kind]).toUpperCase();

  return (
    <Animated.View
      accessible
      accessibilityLabel={label}
      style={[
        {
          opacity: anim,
          transform: [{ rotate: `${r}deg` }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.9, 1] }) }],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <View style={[styles.outer, { borderColor: fg, backgroundColor: bg, padding: size === 'lg' ? 3 : 1.5 }]}>
        <View
          style={[
            styles.inner,
            {
              borderColor: fg,
              paddingHorizontal: size === 'lg' ? 12 : 5,
              paddingVertical: size === 'lg' ? 4 : 1,
            },
          ]}
        >
          {icon && <Icon name={icon} color={fg} size={fs + 2} strokeWidth={2.2} />}
          <Animated.Text maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.label, fontSize: fs, letterSpacing: 1.1, color: fg, lineHeight: fs * 1.35 }}>
            {label}
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const ROT: Record<StampKind, number> = {
  free: -4,
  open: 3,
  uga: -3,
  guest: 2,
  '18': -5,
  '21': 4,
  ticket: -2,
  perk: 3,
  lock: -6,
  featured: -3,
  pending: 4,
  verified: -2,
  live: -3,
  new: 5,
};

function stampStyle(kind: StampKind, c: ReturnType<typeof useTheme>['c']): { fg: string; bg: string; icon?: IconName } {
  switch (kind) {
    case 'free':
    case 'open':
    case 'verified':
      return { fg: c.ivy, bg: 'transparent', icon: kind === 'verified' ? 'check' : undefined };
    case 'uga':
    case 'pending':
      return { fg: c.brick, bg: 'transparent' };
    case 'guest':
      return { fg: c.text, bg: 'transparent', icon: 'users' };
    case '18':
    case '21':
    case 'ticket':
      return { fg: c.text, bg: 'transparent', icon: kind === 'ticket' ? 'ticket' : undefined };
    case 'perk':
      return { fg: palette.ink, bg: c.mustard };
    case 'featured':
      return { fg: palette.ink, bg: c.mustard, icon: 'star' };
    case 'new':
      return { fg: palette.ink, bg: c.mustard };
    case 'live':
      return { fg: palette.paper, bg: c.brickFill, icon: 'flame' };
    case 'lock':
      return { fg: c.locked, bg: 'transparent', icon: 'lock' };
  }
}

const styles = StyleSheet.create({
  outer: { borderWidth: 1.5, borderRadius: 2 },
  inner: { borderWidth: 0.75, borderRadius: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
});

// One loud thing per card: a rotated stamp is only for access limits (plus the
// labeled Featured slot). FREE / OPEN TO ALL are the default, so they get no stamp.
const ACCESS_STAMPS: StampKind[] = ['uga', 'lock', 'guest', '21', '18', 'ticket'];

/** The single stamp a card should show, or null. */
export function cardStamp(acc: AccessResult, featuredSlot = false): StampKind | null {
  if (ACCESS_STAMPS.includes(acc.stamp)) return acc.stamp;
  return featuredSlot ? 'featured' : null;
}

/** Quiet marker for perks and picks: a small dot plus an Oswald label. Not a stamp. */
export function DotLabel({ label, color }: { label: string; color?: string }) {
  const { c } = useTheme();
  const dot = color ?? c.mustard;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} accessible accessibilityLabel={label}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
      <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.label, fontSize: 10.5, letterSpacing: 1, color: c.text }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
