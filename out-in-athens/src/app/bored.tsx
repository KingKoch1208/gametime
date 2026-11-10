// "I'M BORED" — deals a swipeable stack of things that are open right now,
// near you, and allowed for your Access Mode. Right = save, left = skip.
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendStack } from '@/components/Avatars';
import { CATEGORY_ICON, Icon } from '@/components/Icon';
import { EmptyState } from '@/components/misc';
import { PhotoBlock, placeIcon } from '@/components/PlaceCard';
import { Stamp } from '@/components/Stamp';
import { TravelBadges } from '@/components/TravelBadges';
import { Button, Paper, Txt } from '@/components/ui';
import { MODE_LABEL } from '@/lib/access';
import { openDirections } from '@/lib/directions';
import { haptic, sound } from '@/lib/feedback';
import { fmtDistance, MOCK_ME, NEAR_RADIUS_KM } from '@/lib/geo';
import { useNow, useWeather } from '@/lib/hooks';
import { openStatus, whenLabel } from '@/lib/time';
import { type DeckCard, getBoredDeck } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

const { width: SW } = Dimensions.get('window');
const SWIPE = SW * 0.28;

export default function BoredScreen() {
  const { c, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, profile, toggleSavedEvent, toggleSavedPlace, savedEvents, savedPlaces } = useApp();
  const now = useNow();
  const weather = useWeather(now);
  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck = useMemo(() => getBoredDeck(viewer, profile.transport, profile.interests, weather), [seed, viewer]);
  const [idx, setIdx] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const pos = useRef(new Animated.ValueXY()).current;
  const deal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    deal.setValue(0);
    sound.shuffle();
    haptic.light();
    Animated.spring(deal, { toValue: 1, useNativeDriver: false, speed: 8, bounciness: 6 }).start();
  }, [seed, deal]);

  const current = deck[idx];
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const deckRef = useRef(deck);
  deckRef.current = deck;

  const save = (card: DeckCard) => {
    const id = card.listed.item.id;
    if (card.type === 'event') {
      if (!savedEvents.includes(id)) toggleSavedEvent(id);
    } else if (!savedPlaces.includes(id)) toggleSavedPlace(id);
    setSavedCount((n) => n + 1);
  };

  const fling = (dir: 1 | -1) => {
    const card = deckRef.current[idxRef.current];
    if (!card) return;
    if (dir === 1) {
      haptic.success();
      save(card);
    } else haptic.tap();
    Animated.timing(pos, { toValue: { x: dir * SW * 1.4, y: 40 }, duration: reduceMotion ? 1 : 220, useNativeDriver: false }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      setIdx((i) => i + 1);
    });
  };
  const flingRef = useRef(fling);
  flingRef.current = fling;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE || g.vx > 0.9) flingRef.current(1);
        else if (g.dx < -SWIPE || g.vx < -0.9) flingRef.current(-1);
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false, bounciness: 10 }).start();
      },
    }),
  ).current;

  const rotate = pos.x.interpolate({ inputRange: [-SW, 0, SW], outputRange: ['-14deg', '0deg', '14deg'] });
  const saveOpacity = pos.x.interpolate({ inputRange: [0, SWIPE], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = pos.x.interpolate({ inputRange: [-SWIPE, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const reshuffle = () => {
    setIdx(0);
    setSeed((s) => s + 1);
  };

  return (
    <Paper style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={10} style={[styles.round, { borderColor: c.lineStrong, backgroundColor: c.surface }]}>
          <Icon name="close" color={c.text} size={20} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Txt v="label">I’m bored</Txt>
          <Txt v="caption" muted>
            Open now · within {NEAR_RADIUS_KM[profile.transport]} km by {profile.transport} · {MODE_LABEL[profile.mode]}
          </Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Shuffle a new deck" onPress={reshuffle} hitSlop={10} style={[styles.round, { borderColor: c.lineStrong, backgroundColor: c.surface }]}>
          <Icon name="shuffle" color={c.text} size={20} />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        {current ? (
          deck
            .slice(idx, idx + 3)
            .reverse()
            .map((card, iRev, arr) => {
              const depth = arr.length - 1 - iRev; // 0 = top
              const isTop = depth === 0;
              const dealT = deal.interpolate({ inputRange: [0, 1], outputRange: [600 + depth * 80, 0] });
              return (
                <Animated.View
                  key={card.listed.item.id}
                  {...(isTop ? pan.panHandlers : {})}
                  accessibilityActions={isTop ? [{ name: 'save', label: 'Save' }, { name: 'skip', label: 'Skip' }] : undefined}
                  onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'save' ? fling(1) : fling(-1))}
                  style={[
                    styles.cardWrap,
                    {
                      zIndex: 10 - depth,
                      transform: isTop
                        ? [{ translateY: dealT }, { translateX: pos.x }, { translateY: pos.y }, { rotate }]
                        : [{ translateY: Animated.add(dealT, new Animated.Value(depth * 12)) }, { scale: 1 - depth * 0.04 }, { rotate: `${depth % 2 ? 2.5 : -2}deg` }],
                    },
                  ]}
                >
                  <DeckCardView card={card} now={now} />
                  {isTop && (
                    <>
                      <Animated.View style={[styles.swipeStamp, { left: 18, opacity: saveOpacity }]}>
                        <Stamp kind="verified" text="Saved" size="lg" rotate={-14} animate={false} />
                      </Animated.View>
                      <Animated.View style={[styles.swipeStamp, { right: 18, opacity: skipOpacity }]}>
                        <Stamp kind="lock" text="Nah" size="lg" rotate={12} animate={false} />
                      </Animated.View>
                    </>
                  )}
                </Animated.View>
              );
            })
        ) : (
          <View style={{ alignItems: 'center' }}>
            <EmptyState
              icon="moon"
              title={deck.length ? 'That’s the whole deck.' : 'Nothing open nearby right now.'}
              body={`${savedCount ? `You saved ${savedCount}. ` : ''}Nothing else open this late? The Waffle House on Broad never closes, though.`}
            />
            <Button label="Shuffle again" icon="shuffle" onPress={reshuffle} />
          </View>
        )}
      </View>

      {current && (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={() => fling(-1)} style={[styles.bigRound, { borderColor: c.lineStrong, backgroundColor: c.surface }]}>
            <Icon name="close" color={c.text} size={28} />
          </Pressable>
          <Button
            label="Let’s go"
            icon="directions"
            onPress={() => {
              haptic.success();
              const it = current.listed.item;
              openDirections(it.coords, current.type === 'event' ? (it as { venue: string }).venue : (it as { name: string }).name, profile.transport);
            }}
            style={{ flex: 1 }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Save" onPress={() => fling(1)} style={[styles.bigRound, { borderColor: c.ivyFill, backgroundColor: c.ivyFill }]}>
            <Icon name="bookmark" color={palette.paper} size={26} />
          </Pressable>
        </View>
      )}
    </Paper>
  );
}

function DeckCardView({ card, now }: { card: DeckCard; now: Date }) {
  const { c } = useTheme();
  const { profile } = useApp();
  const it = card.listed.item;
  const why = it.interests.find((i) => profile.interests.includes(i));
  const isEvent = card.type === 'event';
  const title = isEvent ? card.listed.item.title : card.listed.item.name;
  const sub = isEvent
    ? `${whenLabel(card.listed.item.start, card.listed.item.end, now)} · ${card.listed.item.venue}`
    : `${openStatus(card.listed.item.hours, now).label} · ${card.listed.item.neighborhood}`;
  const price = isEvent
    ? card.listed.item.price === 0
      ? 'Free'
      : `$${card.listed.item.price}`
    : card.listed.item.cost === 0
      ? 'Free'
      : `~$${card.listed.item.avgPrice ?? card.listed.item.cost}`;
  const icon = isEvent ? CATEGORY_ICON[card.listed.item.category] : placeIcon(card.listed.item);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.lineStrong }]} accessible accessibilityLabel={`${title}. ${sub}. ${price}`}>
      <PhotoBlock accent={it.accent} icon={icon} height={190} seed={title.length} />
      <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 }}>
        {card.listed.live && isEvent && <Stamp kind="live" />}
        <Stamp kind={card.listed.acc.stamp} />
        {card.listed.acc.perk && <Stamp kind="perk" />}
      </View>
      <View style={{ padding: 16, gap: 6, flex: 1 }}>
        <Txt v="labelSm" color={c.brick}>
          {isEvent ? card.listed.item.category : (card.listed.item.foodKind ?? card.listed.item.exploreCategories[0])} · {fmtDistance(card.listed.km)} · {price}
        </Txt>
        <Txt v="display" numberOfLines={2}>
          {title}
        </Txt>
        <Txt v="body" muted numberOfLines={1}>
          {sub}
        </Txt>
        <Txt v="bodySm" numberOfLines={3} style={{ marginTop: 4 }}>
          {it.description}
        </Txt>
        <View style={{ flex: 1 }} />
        {isEvent && card.listed.item.friendsGoing.length > 0 && <FriendStack ids={card.listed.item.friendsGoing} />}
        <TravelBadges from={MOCK_ME} to={it.coords} showCar />
        {why && (
          <Txt v="italic" size={13} muted>
            Because you’re into {why}.
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  bigRound: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { position: 'absolute', width: '100%', maxWidth: 380, height: '92%', maxHeight: 560 },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
  },
  swipeStamp: { position: 'absolute', top: 60 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
});
