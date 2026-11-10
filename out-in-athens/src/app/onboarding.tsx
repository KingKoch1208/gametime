// ONBOARDING — 4 short, skippable steps. Sets Access Mode, interests,
// how you get around, and (optionally) age so filters are right from day one.
import { useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Wordmark } from '@/components/Header';
import { Stamp } from '@/components/Stamp';
import { Button, Paper, Squiggle, Txt } from '@/components/ui';
import type { AccessMode, AgeRange, Interest, Transport } from '@/data/types';
import { haptic, sound } from '@/lib/feedback';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';

const MODES: { value: AccessMode; title: string; body: string; icon: IconName }[] = [
  { value: 'student', title: 'UGA student', body: 'Everything, plus Dawg perks: Ramsey, $3 movies, dining halls.', icon: 'arch' },
  { value: 'local', title: 'Athens local', body: 'No UGA ID? We only show stuff you can actually get into.', icon: 'home' },
  { value: 'visitor', title: 'Just visiting', body: 'In town for a game, a show or a weekend. The good stuff only.', icon: 'compass' },
];

const INTERESTS: { value: Interest; label: string; icon: IconName }[] = [
  { value: 'music', label: 'Live music', icon: 'music' },
  { value: 'outdoors', label: 'Outdoors', icon: 'trail' },
  { value: 'sports', label: 'Sports', icon: 'sports' },
  { value: 'arts', label: 'Arts', icon: 'arts' },
  { value: 'food', label: 'Food', icon: 'food' },
  { value: 'nightlife', label: 'Nights out, no bars', icon: 'moon' },
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },
  { value: 'volunteer', label: 'Volunteering', icon: 'heart' },
  { value: 'nerdy', label: 'Nerdy stuff', icon: 'dice' },
  { value: 'family', label: 'Family-friendly', icon: 'family' },
  { value: 'faith', label: 'Faith', icon: 'candle' },
  { value: 'film', label: 'Movies', icon: 'film' },
  { value: 'markets', label: 'Markets', icon: 'basket' },
  { value: 'study', label: 'Study spots', icon: 'book' },
];

const TRANSPORT: { value: Transport; label: string; icon: IconName; note: string }[] = [
  { value: 'walk', label: 'Walk', icon: 'walk', note: '“Near me” ≈ 1 mile' },
  { value: 'bike', label: 'Bike', icon: 'bike', note: '≈ 3 miles' },
  { value: 'bus', label: 'Bus', icon: 'bus', note: '≈ 4 miles on a route' },
  { value: 'car', label: 'Car', icon: 'car', note: 'All of Athens-Clarke' },
];

const AGES: { value: AgeRange; label: string; note: string }[] = [
  { value: '21+', label: '21+', note: 'Show everything' },
  { value: '18+', label: '18–20', note: 'Hide 21+ events' },
  { value: 'under18', label: 'Under 18', note: 'Hide 18+ and 21+ events' },
  { value: null, label: 'Skip', note: 'Show age-restricted events with a stamp' },
];

const STEPS = 4;

export default function Onboarding() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AccessMode | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [transport, setTransport] = useState<Transport>('walk');
  const [age, setAge] = useState<AgeRange>(null);
  const slide = useRef(new Animated.Value(0)).current;

  const go = (n: number) => {
    haptic.tap();
    slide.setValue(30);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
    setStep(n);
  };

  const finish = (skip = false) => {
    haptic.stamp();
    sound.stamp();
    setProfile({
      name: name.trim(),
      mode: mode ?? 'local', // skipping = safest default: never show UGA-only stuff as available
      interests: skip && !interests.length ? ['music', 'outdoors', 'food', 'arts'] : interests,
      transport,
      age,
      onboarded: true,
    });
  };

  const canNext = step !== 0 || mode !== null;

  return (
    <Paper>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
          <Wordmark />
          <Pressable onPress={() => finish(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Skip onboarding">
            <Txt v="label" muted>
              Skip
            </Txt>
          </Pressable>
        </View>

        {/* progress: ticket punches */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 18 }} accessible accessibilityLabel={`Step ${step + 1} of ${STEPS}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 6, backgroundColor: i <= step ? c.brickFill : 'transparent', borderWidth: 1.5, borderColor: c.lineStrong }} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, transform: [{ translateX: slide }] }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              <>
                <Txt v="labelSm" color={c.brick}>
                  Step 1 · Access mode
                </Txt>
                <Txt v="hero" style={{ marginTop: 6 }} accessibilityRole="header">
                  Who are you{'\n'}in Athens?
                </Txt>
                <Squiggle color={c.mustard} width={180} />
                <Txt v="body" muted style={{ marginTop: 8 }}>
                  This decides what you see. We never send you somewhere you can’t get in.
                </Txt>
                <View style={{ gap: 12, marginTop: 20 }}>
                  {MODES.map((m) => {
                    const on = mode === m.value;
                    return (
                      <Pressable
                        key={m.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${m.title}. ${m.body}`}
                        onPress={() => {
                          haptic.light();
                          setMode(m.value);
                        }}
                        style={{
                          flexDirection: 'row',
                          gap: 14,
                          alignItems: 'center',
                          padding: 16,
                          borderWidth: 1.5,
                          borderColor: c.lineStrong,
                          backgroundColor: on ? c.text : c.surface,
                          shadowColor: palette.ink,
                          shadowOffset: { width: on ? 0 : 3, height: on ? 0 : 3 },
                          shadowOpacity: 1,
                          shadowRadius: 0,
                        }}
                      >
                        <Icon name={m.icon} color={on ? c.bg : c.text} size={32} />
                        <View style={{ flex: 1 }}>
                          <Txt v="title" color={on ? c.bg : c.text}>
                            {m.title}
                          </Txt>
                          <Txt v="bodySm" color={on ? c.bg : c.textMuted}>
                            {m.body}
                          </Txt>
                        </View>
                        {on && <Stamp kind={m.value === 'student' ? 'perk' : 'open'} text={m.value === 'student' ? 'Dawg' : 'Locals'} rotate={-10} />}
                      </Pressable>
                    );
                  })}
                </View>
                <Txt v="label" style={{ marginTop: 24, marginBottom: 6 }}>
                  What should we call you? <Txt v="labelSm" muted>(optional)</Txt>
                </Txt>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="First name"
                  placeholderTextColor={c.textMuted}
                  accessibilityLabel="Your first name"
                  style={{ borderBottomWidth: 1.5, borderColor: c.lineStrong, paddingVertical: 10, fontFamily: fonts.serif, fontSize: 20, color: c.text }}
                  returnKeyType="done"
                />
                <Txt v="caption" muted style={{ marginTop: 8 }}>
                  You can switch modes anytime in your profile. Real UGA login can come later.
                </Txt>
              </>
            )}

            {step === 1 && (
              <>
                <Txt v="labelSm" color={c.brick}>
                  Step 2 · Interests
                </Txt>
                <Txt v="hero" style={{ marginTop: 6 }} accessibilityRole="header">
                  What are you into?
                </Txt>
                <Squiggle color={c.mustard} width={160} />
                <Txt v="body" muted style={{ marginTop: 8 }}>
                  Tap as many as you like. We use these to deal your “I’m bored” stack.
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                  {INTERESTS.map((i) => {
                    const on = interests.includes(i.value);
                    return (
                      <Pressable
                        key={i.value}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={i.label}
                        onPress={() => {
                          haptic.tap();
                          setInterests((xs) => (on ? xs.filter((x) => x !== i.value) : [...xs, i.value]));
                        }}
                        style={{
                          width: '47.5%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          padding: 12,
                          borderWidth: 1.5,
                          borderColor: on ? c.brickFill : c.lineStrong,
                          backgroundColor: on ? c.brickFill : c.surface,
                          transform: [{ rotate: on ? `${(i.label.length % 3) - 1}deg` : '0deg' }],
                        }}
                      >
                        <Icon name={i.icon} color={on ? palette.paper : c.text} size={22} />
                        <Txt v="bodyBold" size={14} color={on ? palette.paper : c.text} style={{ flex: 1 }}>
                          {i.label}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Txt v="labelSm" color={c.brick}>
                  Step 3 · Getting around
                </Txt>
                <Txt v="hero" style={{ marginTop: 6 }} accessibilityRole="header">
                  How do you get around?
                </Txt>
                <Squiggle color={c.mustard} width={200} />
                <Txt v="body" muted style={{ marginTop: 8 }}>
                  Sets how far “near me” reaches. Every place also shows walk, bike and bus times.
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
                  {TRANSPORT.map((t) => {
                    const on = transport === t.value;
                    return (
                      <Pressable
                        key={t.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${t.label}. ${t.note}`}
                        onPress={() => {
                          haptic.light();
                          setTransport(t.value);
                        }}
                        style={{
                          width: '47.5%',
                          aspectRatio: 1.15,
                          padding: 14,
                          justifyContent: 'space-between',
                          borderWidth: 1.5,
                          borderColor: c.lineStrong,
                          backgroundColor: on ? c.ivyFill : c.surface,
                        }}
                      >
                        <Icon name={t.icon} color={on ? palette.paper : c.text} size={40} strokeWidth={1.6} />
                        <View>
                          <Txt v="title" color={on ? palette.paper : c.text}>
                            {t.label}
                          </Txt>
                          <Txt v="caption" color={on ? palette.paper : c.textMuted}>
                            {t.note}
                          </Txt>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Txt v="labelSm" color={c.brick}>
                  Step 4 · Optional
                </Txt>
                <Txt v="hero" style={{ marginTop: 6 }} accessibilityRole="header">
                  Age check
                </Txt>
                <Squiggle color={c.mustard} width={120} />
                <Txt v="body" muted style={{ marginTop: 8 }}>
                  Only used to filter 18+ and 21+ events. Stays on your phone.
                </Txt>
                <View style={{ gap: 10, marginTop: 20 }}>
                  {AGES.map((a) => {
                    const on = age === a.value;
                    return (
                      <Pressable
                        key={a.label}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${a.label}. ${a.note}`}
                        onPress={() => {
                          haptic.tap();
                          setAge(a.value);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: c.lineStrong, backgroundColor: on ? c.text : c.surface }}
                      >
                        <View style={{ width: 22, height: 22, borderWidth: 1.5, borderColor: on ? c.bg : c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                          {on && <Icon name="check" color={c.bg} size={16} strokeWidth={2.6} />}
                        </View>
                        <Txt v="title" color={on ? c.bg : c.text} style={{ width: 90 }}>
                          {a.label}
                        </Txt>
                        <Txt v="bodySm" color={on ? c.bg : c.textMuted} style={{ flex: 1 }}>
                          {a.note}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
          {step > 0 && <Button kind="secondary" label="Back" onPress={() => go(step - 1)} />}
          <Button
            label={step === STEPS - 1 ? 'Let’s go out' : step === 0 && !mode ? 'Pick one to continue' : 'Next'}
            icon={step === STEPS - 1 ? 'check' : undefined}
            disabled={!canNext}
            onPress={() => (step === STEPS - 1 ? finish() : go(step + 1))}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Paper>
  );
}
