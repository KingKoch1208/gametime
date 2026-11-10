// Event cards are ticket stubs: big stamped date block, perforated edge,
// rubber-stamp access badges.
import { router } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import type { AthensEvent } from '@/data/types';
import { type AccessResult, STAMP_TEXT } from '@/lib/access';
import { haptic } from '@/lib/feedback';
import { fmtDistance } from '@/lib/geo';
import { DAY_SHORT, fmtTime, MONTH_SHORT, whenLabel } from '@/lib/time';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { FriendStack } from './Avatars';
import { CATEGORY_ICON, Icon } from './Icon';
import { cardStamp, DotLabel, Stamp } from './Stamp';
import { Txt } from './ui';
import { now as clockNow } from '@/services/dataService';

type Props = {
  event: AthensEvent;
  acc: AccessResult;
  km?: number;
  live?: boolean;
  width?: number;
  now?: Date;
  showFriends?: boolean;
  /** Rendered in the labeled Featured slot (the only place the FEATURED stamp shows). */
  featuredSlot?: boolean;
};

const DATE_W = 76;

function TicketCardImpl({ event: e, acc, km, live, width, now = clockNow(), showFriends = true, featuredSlot = false }: Props) {
  const { c } = useTheme();
  const { savedEvents, toggleSavedEvent, profile } = useApp();
  const isStudent = profile.mode === 'student';
  const saved = savedEvents.includes(e.id);
  const locked = !acc.canAttend;
  // The stub's color means something: brick = happening now, grey = locked, ink otherwise.
  const fill = locked ? c.locked : live ? c.brickFill : c.inkFill;
  const onFill = locked ? c.bg : palette.paper;
  const textColor = locked ? c.locked : undefined;
  const stamp = cardStamp(acc, featuredSlot);
  const studentPick = isStudent && e.source.kind === 'student' && e.source.verified;
  const price = e.price === 0 ? (e.priceNote ?? 'Free') : (e.priceNote ?? `$${e.price}`);
  const meta = [whenLabel(e.start, e.end, now), price, e.isNew ? 'New' : null].filter(Boolean).join(' · ');

  const a11y = [
    e.title,
    whenLabel(e.start, e.end, now),
    e.venue,
    price,
    e.isNew ? 'New' : undefined,
    stamp && !locked ? STAMP_TEXT[stamp] : undefined,
    locked ? `Locked: ${acc.lockReason}` : undefined,
    acc.perk ? 'Dawg perk' : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Opens event details"
      onPress={() => router.push(`/event/${e.id}`)}
      style={({ pressed }) => [{ width, transform: [{ scale: pressed ? 0.985 : 1 }] }, width != null && { alignSelf: 'stretch' }]}
    >
      <View
        style={[
          styles.card,
          width != null && { flex: 1, minHeight: 176 },
          { backgroundColor: c.surface, borderColor: locked ? c.locked : c.lineStrong },
        ]}
      >
        {/* Date block */}
        <View style={[styles.date, { backgroundColor: fill }]}>
          {live ? (
            <>
              <LivePulse color={onFill} />
              <Txt v="label" color={onFill} size={13} style={{ marginTop: 4 }}>
                Now
              </Txt>
            </>
          ) : (
            <>
              <Txt v="labelSm" color={onFill} size={11}>
                {MONTH_SHORT[e.start.getMonth()]}
              </Txt>
              <Txt color={onFill} style={styles.day} maxFontSizeMultiplier={1.1}>
                {e.start.getDate()}
              </Txt>
              <Txt v="labelSm" color={onFill} size={11}>
                {DAY_SHORT[e.start.getDay()]} {fmtTime(e.start)}
              </Txt>
            </>
          )}
        </View>

        {/* Perforation */}
        <View pointerEvents="none" style={[styles.perf, { borderColor: c.lineStrong }]} />
        <View pointerEvents="none" style={[styles.notch, { top: -8, backgroundColor: c.bg, borderColor: c.lineStrong }]} />
        <View pointerEvents="none" style={[styles.notch, { bottom: -8, backgroundColor: c.bg, borderColor: c.lineStrong }]} />

        {/* Body */}
        <View style={styles.body}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Icon name={CATEGORY_ICON[e.category]} color={c.textMuted} size={14} />
                <Txt v="labelSm" muted numberOfLines={1} style={{ flexShrink: 1 }}>
                  {e.venue}
                  {km != null ? ` · ${fmtDistance(km)}` : ''}
                </Txt>
              </View>
              <Txt v="serif" numberOfLines={2} color={textColor}>
                {e.title}
              </Txt>
              <Txt v="bodySm" muted={!locked} color={textColor} numberOfLines={1} style={{ marginTop: 2 }}>
                {meta}
              </Txt>
              {(acc.perk || studentPick) && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                  {acc.perk && <DotLabel label="Dawg perk" />}
                  {studentPick && <DotLabel label="Student pick" color={c.ivy} />}
                </View>
              )}
            </View>
            {!locked && (
              <Pressable
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel={saved ? `Unsave ${e.title}` : `Save ${e.title}`}
                onPress={() => {
                  const on = toggleSavedEvent(e.id);
                  if (on) haptic.success();
                  else haptic.tap();
                }}
              >
                <Icon name="bookmark" color={saved ? c.brick : c.text} fill={saved ? c.brick : 'none'} size={22} />
              </Pressable>
            )}
          </View>

          {stamp && (
            <View style={styles.stamps}>
              <Stamp kind={stamp} text={stamp === 'lock' ? acc.lockReason : undefined} />
            </View>
          )}

          {showFriends && e.friendsGoing.length > 0 && !locked && (
            <View style={{ marginTop: 8 }}>
              <FriendStack ids={e.friendsGoing} size={20} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const TicketCard = memo(TicketCardImpl);

export function LivePulse({ color, size = 10 }: { color: string; size?: number }) {
  const { reduceMotion } = useTheme();
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v, reduceMotion]);
  return (
    <View style={{ width: size * 3, height: size * 3, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 3,
          height: size * 3,
          borderRadius: size * 1.5,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// Blank ticket stub skeleton loader.
export function TicketSkeleton() {
  const { c, reduceMotion } = useTheme();
  const v = useState(() => new Animated.Value(0.5))[0];
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduceMotion]);
  return (
    <Animated.View style={{ opacity: v }} accessibilityLabel="Loading" accessible>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line, borderStyle: 'dashed', minHeight: 104 }]}>
        <View style={[styles.date, { backgroundColor: c.surfaceAlt }]} />
        <View style={[styles.perf, { borderColor: c.line }]} />
        <View style={[styles.body, { gap: 8 }]}>
          <View style={{ height: 10, width: '40%', backgroundColor: c.surfaceAlt }} />
          <View style={{ height: 16, width: '85%', backgroundColor: c.surfaceAlt }} />
          <View style={{ height: 10, width: '60%', backgroundColor: c.surfaceAlt }} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 3, overflow: 'visible', minHeight: 112 },
  date: { width: DATE_W, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  day: { fontFamily: fonts.displayBlack, fontSize: 36, lineHeight: 40 },
  perf: { position: 'absolute', left: DATE_W, top: 6, bottom: 6, borderLeftWidth: 1.5, borderStyle: 'dashed' },
  notch: { position: 'absolute', left: DATE_W - 8, width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  body: { flex: 1, paddingVertical: 11, paddingLeft: 14, paddingRight: 12 },
  stamps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9, alignItems: 'center' },
});
