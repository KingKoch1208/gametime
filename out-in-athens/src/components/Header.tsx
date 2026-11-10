// Screen header: wordmark (long-press = Pitch Mode), title, profile avatar top-right.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Avatar } from './Avatars';
import { Icon } from './Icon';
import { Txt } from './ui';

export function Wordmark({ size = 15 }: { size?: number }) {
  const { c } = useTheme();
  const { prefs, setPrefs } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Out in Athens"
      accessibilityHint="Long press to toggle Pitch Mode"
      delayLongPress={600}
      onLongPress={() => {
        haptic.stamp();
        const on = !prefs.pitchMode;
        setPrefs({ pitchMode: on });
        Alert.alert(on ? 'Pitch Mode on' : 'Pitch Mode off', on ? 'A floating Student ↔ Local switch is now pinned to the screen. Long-press the logo again to hide it.' : undefined);
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <View style={{ borderWidth: 1.5, borderColor: c.brick, paddingHorizontal: 5, paddingVertical: 1, transform: [{ rotate: '-3deg' }] }}>
        <Txt style={{ fontFamily: fonts.label, fontSize: size * 0.8, letterSpacing: 1.6, color: c.brick }} maxFontSizeMultiplier={1.2}>
          OUT IN
        </Txt>
      </View>
      <Txt style={{ fontFamily: fonts.displayBlack, fontSize: size * 1.25, color: c.text, letterSpacing: -0.3 }} maxFontSizeMultiplier={1.2}>
        Athens
      </Txt>
    </Pressable>
  );
}

export function ProfileButton() {
  const { c } = useTheme();
  const { profile } = useApp();
  const initials = (profile.name || 'You')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      hitSlop={8}
      onPress={() => {
        haptic.tap();
        router.push('/profile');
      }}
    >
      <Avatar initials={initials} color={c.ivyFill} size={36} ring={c.lineStrong} />
    </Pressable>
  );
}

export function TabHeader({ title, subtitle, right }: { title?: string; subtitle?: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {right}
          <ProfileButton />
        </View>
      </View>
      {title && (
        <Txt v="display" style={{ marginTop: 14 }} accessibilityRole="header">
          {title}
        </Txt>
      )}
      {subtitle}
    </View>
  );
}

/** Header for pushed stack screens: back button + optional actions. */
export function StackHeader({ title, right, transparent }: { title?: string; right?: ReactNode; transparent?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 14,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: transparent ? 'transparent' : c.bg,
        borderBottomWidth: transparent ? 0 : 1.5,
        borderColor: c.line,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface }}
      >
        <Icon name="chevronLeft" color={c.text} size={20} />
      </Pressable>
      <Txt v="label" numberOfLines={1} style={{ flex: 1 }} accessibilityRole="header">
        {title ?? ''}
      </Txt>
      {right}
    </View>
  );
}
