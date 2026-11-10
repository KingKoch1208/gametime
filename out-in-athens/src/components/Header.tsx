// Screen header: wordmark (long-press = Pitch Mode), title, profile avatar top-right.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/feedback';
import { toast } from '@/lib/toast';
import { demoPreset } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Avatar } from './Avatars';
import { PitchPill } from './misc';
import { Icon } from './Icon';
import { Squiggle, Txt } from './ui';

type PrefsApi = Pick<ReturnType<typeof useApp>, 'prefs' | 'setPrefs'>;

/** Pitch Mode on: pin the demo clock to this Friday 6:30pm (unless one is already set). */
export function togglePitchMode(prefs: PrefsApi['prefs'], setPrefs: PrefsApi['setPrefs']) {
  const on = !prefs.pitchMode;
  setPrefs({ pitchMode: on, pitchHintSeen: true, ...(on && !prefs.demoTime ? { demoTime: demoPreset('fri') } : {}) });
  toast(on ? 'Pitch Mode on: STU · LOC · VIS switch is in the header (long-press it for rain). Long-press the logo to turn it off.' : 'Pitch Mode off.');
}

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
        togglePitchMode(prefs, setPrefs);
      }}
      hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
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
  const initials = profile.name.trim()
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'You';
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
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PitchPill />
          {right}
          <ProfileButton />
        </View>
      </View>
      {title && (
        <>
          <Txt v="display" style={{ marginTop: 14 }} accessibilityRole="header">
            {title}
          </Txt>
          <Squiggle color={c.mustard} width={Math.min(160, title.length * 14)} />
        </>
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
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          borderWidth: 1.5,
          borderColor: c.lineStrong,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.surface,
        }}
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
