import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReviewTag } from '@/data/types';
import { haptic, sound } from '@/lib/feedback';
import { refresh } from '@/services/dataService';
import { onToast, toast } from '@/lib/toast';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Stamp } from './Stamp';
import { Chip, Txt } from './ui';

// ——— Empty states with personality ———

export function EmptyState({ title, body, icon = 'moon' }: { title: string; body?: string; icon?: IconName }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 30, gap: 10 }} accessible accessibilityLabel={`${title}. ${body ?? ''}`}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: c.textMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={c.textMuted} size={30} />
      </View>
      <Txt v="serif" center>
        {title}
      </Txt>
      {body && (
        <Txt v="bodySm" muted center>
          {body}
        </Txt>
      )}
    </View>
  );
}

// ——— Reviews-lite: quick tags instead of stars ———

export const ALL_TAGS: ReviewTag[] = [
  'chill',
  'crowded',
  'great for groups',
  'bring cash',
  'dog friendly',
  'date spot',
  'loud',
  'study-able',
  'kid friendly',
  'worth it',
];

export function ReviewTags({ id, base = [] }: { id: string; base?: ReviewTag[] }) {
  const { myTags, toggleTag } = useApp();
  const mine = myTags[id] ?? [];
  const [open, setOpen] = useState(false);
  const shown = open ? ALL_TAGS : Array.from(new Set([...base, ...mine]));
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shown.map((t) => {
          const count = (base.includes(t) ? 12 + ((t.length * 7) % 40) : 0) + (mine.includes(t) ? 1 : 0);
          return <Chip key={t} small accent="ivy" label={count ? `${t} · ${count}` : t} active={mine.includes(t)} onPress={() => toggleTag(id, t)} />;
        })}
        {!open && <Chip small label="+ Add a tag" accent="ink" onPress={() => setOpen(true)} />}
      </View>
    </View>
  );
}

// ——— Pull-to-refresh with a stamp ———

export function useStampRefresh(onDone?: () => void) {
  const { c } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stampKey, setStampKey] = useState(0);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic.light();
    await refresh();
    setRefreshing(false);
    haptic.stamp();
    sound.stamp();
    setStampKey((k) => k + 1);
    onDone?.();
  }, [onDone]);
  const control = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brick} title="Re-stapling the flyers…" titleColor={c.textMuted} />;
  return { control, stampKey };
}

/** "FRESH" stamp that slams down after a refresh, then fades. */
export function FreshStamp({ stampKey }: { stampKey: number }) {
  const insets = useSafeAreaInsets();
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!stampKey) return;
    v.setValue(0);
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
      Animated.delay(900),
      Animated.timing(v, { toValue: 2, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [stampKey, v]);
  if (!stampKey) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 70,
        alignSelf: 'center',
        zIndex: 50,
        opacity: v.interpolate({ inputRange: [0, 0.2, 1, 2], outputRange: [0, 1, 1, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1, 2], outputRange: [2.2, 1, 1] }) }],
      }}
    >
      <Stamp kind="verified" text="Fresh · just updated" size="lg" animate={false} rotate={-6} />
    </Animated.View>
  );
}

// ——— Pitch Mode switch (Student · Local · Visitor) ———
// A small pill docked in the tab header next to the avatar, shown only in Pitch
// Mode, so it never covers content. Long-press it to fake rain for the demo.

const PITCH_MODES = [
  { m: 'student', label: 'STU', name: 'student' },
  { m: 'local', label: 'LOC', name: 'local' },
  { m: 'visitor', label: 'VIS', name: 'visitor' },
] as const;

export function PitchPill() {
  const { prefs, profile, setProfile, setPrefs } = useApp();
  if (!prefs.pitchMode) return null;
  const rain = prefs.demoWeather === 'rain';
  const toggleRain = () => {
    haptic.tap();
    setPrefs({ demoWeather: rain ? 'auto' : 'rain' });
    toast(rain ? 'Demo weather: back to the forecast.' : 'Demo weather: rain. Indoor picks move to the top.');
  };
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Pitch Mode view. Long-press to toggle demo rain."
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.ink,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: palette.mustard,
        padding: 2,
        gap: 2,
      }}
    >
      {PITCH_MODES.map(({ m, label, name }) => {
        const on = profile.mode === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityLabel={`Pitch mode: ${name} view`}
            accessibilityState={{ selected: on }}
            accessibilityActions={[{ name: 'longpress', label: 'Toggle demo rain' }]}
            onAccessibilityAction={toggleRain}
            hitSlop={{ top: 10, bottom: 10 }}
            delayLongPress={500}
            onLongPress={toggleRain}
            onPress={() => {
              haptic.stamp();
              setProfile({ mode: m });
            }}
            style={{ minWidth: 32, height: 26, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.mustard : 'transparent', borderRadius: 2 }}
          >
            <Txt style={{ fontFamily: fonts.label, fontSize: 10.5, letterSpacing: 0.8, color: on ? palette.ink : palette.paper }} maxFontSizeMultiplier={1}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
      {rain && (
        <View style={{ paddingHorizontal: 3 }} accessible accessibilityLabel="Demo rain on">
          <Icon name="rain" color={palette.mustard} size={14} />
        </View>
      )}
    </View>
  );
}

// ——— Toast host (rendered once at the root) ———

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string | null>(null);
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(
    () =>
      onToast((m) => {
        setMsg(m);
        v.setValue(0);
        Animated.sequence([
          Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }),
          Animated.delay(2600),
          Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(({ finished }) => finished && setMsg(null));
      }),
    [v],
  );
  if (!msg) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 96,
        zIndex: 200,
        alignItems: 'center',
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <View style={{ backgroundColor: palette.ink, borderWidth: 1.5, borderColor: palette.mustard, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 420 }}>
        <Txt v="bodySm" color={palette.paper} center>
          {msg}
        </Txt>
      </View>
    </Animated.View>
  );
}
