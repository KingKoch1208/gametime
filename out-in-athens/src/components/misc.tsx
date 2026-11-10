import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReviewTag } from '@/data/types';
import { haptic, sound } from '@/lib/feedback';
import { refresh } from '@/services/dataService';
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
      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.textMuted, alignItems: 'center', justifyContent: 'center' }}>
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

export const ALL_TAGS: ReviewTag[] = ['chill', 'crowded', 'great for groups', 'bring cash', 'dog friendly', 'date spot', 'loud', 'study-able', 'kid friendly', 'worth it'];

export function ReviewTags({ id, base = [] }: { id: string; base?: ReviewTag[] }) {
  const { myTags, toggleTag } = useApp();
  const mine = myTags[id] ?? [];
  const [open, setOpen] = useState(false);
  const shown = open ? ALL_TAGS : Array.from(new Set([...base, ...mine]));
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shown.map((t) => {
          const count = (base.includes(t) ? 12 + (t.length * 7) % 40 : 0) + (mine.includes(t) ? 1 : 0);
          return (
            <Chip
              key={t}
              small
              accent="ivy"
              label={count ? `${t} · ${count}` : t}
              active={mine.includes(t)}
              onPress={() => toggleTag(id, t)}
            />
          );
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
  const control = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brick} title="Re-stapling the flyers…" titleColor={c.textMuted} />
  );
  return { control, stampKey };
}

/** "FRESH" stamp that slams down after a refresh, then fades. */
export function FreshStamp({ stampKey }: { stampKey: number }) {
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
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

// ——— Pitch Mode floating switch (Student ↔ Local) ———

export function PitchSwitch() {
  const { prefs, profile, setProfile, setPrefs } = useApp();
  const insets = useSafeAreaInsets();
  if (!prefs.pitchMode) return null;
  const student = profile.mode === 'student';
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 48, right: 12, zIndex: 100, alignItems: 'flex-end', gap: 6 }}
    >
      <View style={{ flexDirection: 'row', backgroundColor: palette.ink, borderRadius: 4, padding: 3, borderWidth: 1.5, borderColor: palette.mustard }}>
        {(['student', 'local'] as const).map((m) => {
          const on = profile.mode === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={`Pitch mode: switch to ${m} view`}
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptic.stamp();
                setProfile({ mode: m });
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: on ? palette.mustard : 'transparent', borderRadius: 2 }}
            >
              <Txt style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: 1.2, color: on ? palette.ink : palette.paper }} maxFontSizeMultiplier={1}>
                {m === 'student' ? 'STUDENT' : 'LOCAL'}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pitch mode: toggle demo weather"
        onPress={() => {
          haptic.tap();
          setPrefs({ demoWeather: prefs.demoWeather === 'rain' ? 'clear' : 'rain' });
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3 }}
      >
        <Icon name={prefs.demoWeather === 'rain' ? 'rain' : 'sun'} color={palette.mustard} size={14} />
        <Txt style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: 1, color: palette.paper }} maxFontSizeMultiplier={1}>
          {prefs.demoWeather === 'rain' ? 'RAIN DEMO' : 'WEATHER'}
        </Txt>
      </Pressable>
      {!student && (
        <Txt style={{ fontFamily: fonts.label, fontSize: 9, letterSpacing: 1, color: palette.paper, backgroundColor: palette.brick, paddingHorizontal: 6, paddingVertical: 2 }} maxFontSizeMultiplier={1}>
          {prefs.showUgaOnly ? 'UGA-ONLY SHOWN LOCKED' : 'UGA-ONLY HIDDEN'}
        </Txt>
      )}
    </View>
  );
}
