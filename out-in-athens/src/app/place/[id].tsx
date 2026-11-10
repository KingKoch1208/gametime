// PLACE DETAIL — hours, cost, access, good-for, travel times, check-in stamp.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fact, Pill } from '@/components/DetailBits';
import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MiniMap } from '@/components/MiniMap';
import { EmptyState, ReviewTags } from '@/components/misc';
import { PhotoBlock, placeIcon } from '@/components/PlaceCard';
import { Stamp } from '@/components/Stamp';
import { TicketCard } from '@/components/TicketCard';
import { TravelBadges } from '@/components/TravelBadges';
import { Button, IconButton, Paper, TearLine, Txt } from '@/components/ui';
import { accessFor, ACCESS_LABEL } from '@/lib/access';
import { openDirections } from '@/lib/directions';
import { haptic, sound } from '@/lib/feedback';
import { MOCK_ME } from '@/lib/geo';
import { DAY_SHORT, fmtHour, hoursForDay, openStatus } from '@/lib/time';
import { getEventsAtPlace, getOrg, getPlace, now as clockNow } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { toast } from '@/lib/toast';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = getPlace(id);
  const { c, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, checkins, checkIn, savedPlaces, toggleSavedPlace, profile, report, reported } = useApp();
  const stampAnim = useState(() => new Animated.Value(0))[0];
  const [justStamped, setJustStamped] = useState(false);

  if (!p) {
    return (
      <Paper style={{ paddingTop: insets.top + 40 }}>
        <EmptyState icon="pin" title="Can’t find that spot." />
      </Paper>
    );
  }

  const acc = accessFor(p, viewer);
  const locked = !acc.canAttend;
  const now = clockNow();
  const status = openStatus(p.hours, now);
  const saved = savedPlaces.includes(p.id);
  const stamped = !!checkins[p.id];
  const events = getEventsAtPlace(p.id);
  const org = p.orgId ? getOrg(p.orgId) : undefined;
  const color = locked ? 'locked' : p.kind === 'food' ? 'mustard' : 'ivy';

  const doCheckIn = () => {
    checkIn(p.id);
    setJustStamped(true);
    haptic.stamp();
    sound.stamp();
    stampAnim.setValue(0);
    Animated.sequence([
      Animated.spring(stampAnim, { toValue: 1, useNativeDriver: true, speed: reduceMotion ? 100 : 22, bounciness: 12 }),
      Animated.delay(1100),
      Animated.timing(stampAnim, { toValue: 2, duration: 300, useNativeDriver: true }),
    ]).start(() => setJustStamped(false));
  };

  return (
    <Paper>
      <StackHeader
        title={p.kind === 'food' ? 'Food' : 'Explore'}
        right={
          !locked && (
            <IconButton
              icon="bookmark"
              label={saved ? 'Unsave' : 'Save'}
              active={saved}
              onPress={() => {
                if (toggleSavedPlace(p.id)) haptic.success();
              }}
            />
          )
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PhotoBlock accent={locked ? 'ink' : p.accent} icon={placeIcon(p)} height={200} seed={p.id.length} label="Photos coming from venue" />
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Txt v="labelSm" color={c.brick}>
            {p.neighborhood}
            {p.foodKind ? ` · ${p.foodKind.replace('_', ' ')}` : ''}
          </Txt>
          <Txt v="display" accessibilityRole="header" style={{ marginTop: 2 }}>
            {p.name}
          </Txt>
          <Txt v="bodyBold" color={status.open ? c.ivy : c.brick} style={{ marginTop: 4 }}>
            {status.open ? '● ' : '○ '}
            {status.label}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Stamp kind={acc.stamp} text={locked ? acc.lockReason : undefined} size="md" />
            {acc.perk && <Stamp kind="perk" text={p.dawgPerk ? `Dawg perk: ${p.dawgPerk}` : undefined} size="md" delay={100} />}
            {stamped && <Stamp kind="verified" text="In your passport" size="md" delay={180} />}
          </View>

          {locked ? (
            <View style={{ borderWidth: 1.5, borderColor: c.brick, padding: 14, marginTop: 16, flexDirection: 'row', gap: 10 }}>
              <Icon name="lock" color={c.brick} size={22} />
              <Txt v="bodySm" style={{ flex: 1 }}>
                {acc.lockReason}. You can see it because “Show UGA-only stuff” is on, but we won’t send you here.
              </Txt>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Button
                label={stamped ? 'Stamp again' : 'Check in'}
                icon="passport"
                kind={stamped ? 'secondary' : 'ivy'}
                onPress={doCheckIn}
                style={{ flex: 1 }}
              />
              <Button label="Directions" icon="directions" onPress={() => openDirections(p.coords, p.name, profile.transport)} style={{ flex: 1 }} />
            </View>
          )}
          {!locked && (
            <Pressable
              onPress={() => router.push({ pathname: '/plan', params: { refType: 'place', refId: p.id } })}
              accessibilityRole="button"
              style={{ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center' }}
            >
              <Icon name="users" color={c.brick} size={16} />
              <Txt v="labelSm" color={c.brick}>
                Make a plan with friends →
              </Txt>
            </Pressable>
          )}

          <TearLine style={{ marginTop: 18 }} />
          <Txt v="body">{p.description}</Txt>
          <TearLine />

          <Fact icon="tag" label="Cost" value={p.cost === 0 ? (p.costNote ?? 'Free') : (p.costNote ?? `About $${p.avgPrice ?? p.cost} per person`)} />
          <Fact icon="lock" label="Access" value={ACCESS_LABEL[p.access]} />
          {p.season && <Fact icon="calendar" label="Season" value={p.season} />}
          {p.spottedToday && <Fact icon="truck" label="Spotted today" value={p.spottedToday} />}

          <Txt v="labelSm" muted style={{ marginBottom: 6 }}>
            Hours (sample)
          </Txt>
          <View style={{ borderWidth: 1.5, borderColor: c.line, marginBottom: 14 }}>
            {p.hours.kind === 'weekly' ? (
              DAY_SHORT.map((d, i) => {
                const h = hoursForDay(
                  p.hours,
                  (() => {
                    const x = new Date(now);
                    x.setDate(now.getDate() + ((i - now.getDay() + 7) % 7));
                    return x;
                  })(),
                );
                const today = i === now.getDay();
                return (
                  <View
                    key={d}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: today ? c.surfaceAlt : 'transparent',
                    }}
                  >
                    <Txt v={today ? 'bodyBold' : 'bodySm'}>{d}</Txt>
                    <Txt v={today ? 'bodyBold' : 'bodySm'} muted={!today}>
                      {h ? `${fmtHour(h[0])} – ${fmtHour(h[1])}` : 'Closed'}
                    </Txt>
                  </View>
                );
              })
            ) : (
              <Txt v="body" style={{ padding: 12 }}>
                {p.hours.kind === 'always' ? 'Open 24/7' : 'Dawn to dusk, every day'}
              </Txt>
            )}
          </View>

          <Txt v="labelSm" muted style={{ marginBottom: 6 }}>
            Good for
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {p.goodFor.map((g) => (
              <Pill key={g} icon="check" text={g} />
            ))}
            {p.accessibleVenue && <Pill icon="accessible" text="Accessible" />}
            {p.petFriendly && <Pill icon="paw" text="Pet-friendly" />}
            {p.foodTags?.map((t) => <Pill key={t} icon="leaf" text={t === 'gf' ? 'gluten-free' : t} />)}
          </View>

          {p.deals && p.deals.length > 0 && (
            <View style={{ marginBottom: 14, gap: 6 }}>
              <Txt v="labelSm" muted>
                Deals
              </Txt>
              {p.deals.map((d) => (
                <View
                  key={d.text}
                  style={{
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: c.lineStrong,
                    padding: 10,
                    backgroundColor: d.day === now.getDay() ? c.surfaceAlt : 'transparent',
                  }}
                >
                  <Txt v="bodySm">
                    {d.day === now.getDay() ? 'TODAY · ' : ''}
                    {d.text}
                  </Txt>
                </View>
              ))}
            </View>
          )}

          <MiniMap
            coords={p.coords}
            icon={placeIcon(p)}
            color={color}
            label={p.name}
            locked={locked}
            onPress={() => openDirections(p.coords, p.name, profile.transport)}
          />
          {!locked && (
            <View style={{ marginTop: 10 }}>
              <Txt v="labelSm" muted style={{ marginBottom: 4 }}>
                Getting there (car-free first)
              </Txt>
              <TravelBadges from={MOCK_ME} to={p.coords} showCar />
            </View>
          )}

          {events.length > 0 && (
            <>
              <Txt v="label" style={{ marginTop: 24, marginBottom: 10 }}>
                Coming up here
              </Txt>
              <View style={{ gap: 12 }}>
                {events.slice(0, 4).map((e) => {
                  const a = accessFor(e, viewer);
                  return a.visible ? <TicketCard key={e.id} event={e} acc={a} now={now} /> : null;
                })}
              </View>
            </>
          )}

          <Txt v="label" style={{ marginTop: 24, marginBottom: 10 }}>
            What people say
          </Txt>
          <ReviewTags id={p.id} base={p.reviewTags} />

          <TearLine style={{ marginTop: 20 }} />
          {org && (
            <Pressable onPress={() => router.push(`/org/${org.id}`)} accessibilityRole="link" style={{ marginBottom: 10 }}>
              <Txt v="labelSm" color={c.brick}>
                Managed by {org.name} →
              </Txt>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              report(p.id);
              haptic.warn();
              toast('Thanks! We’ll double-check the hours and details.');
            }}
            style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
          >
            <Icon name="flag" color={c.textMuted} size={15} />
            <Txt v="caption" muted>
              {reported.includes(p.id) ? 'Reported as outdated, thanks' : 'Report outdated info'}
            </Txt>
          </Pressable>
        </View>
      </ScrollView>

      {justStamped && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '32%',
            alignSelf: 'center',
            opacity: stampAnim.interpolate({ inputRange: [0, 0.2, 1, 2], outputRange: [0, 1, 1, 0] }),
            transform: [{ scale: stampAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [2.6, 1, 1.05] }) }, { rotate: '-12deg' }],
          }}
        >
          <View
            style={{
              width: 210,
              height: 210,
              borderRadius: 105,
              borderWidth: 5,
              borderColor: palette.brick,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(243,236,221,0.92)',
            }}
          >
            <View
              style={{
                width: 186,
                height: 186,
                borderRadius: 93,
                borderWidth: 1.5,
                borderColor: palette.brick,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <Txt style={{ fontFamily: fonts.label, fontSize: 13, letterSpacing: 2, color: palette.brick }} maxFontSizeMultiplier={1}>
                ATHENS PASSPORT
              </Txt>
              <Txt
                style={{ fontFamily: fonts.displayBlack, fontSize: 22, lineHeight: 24, color: palette.brick, textAlign: 'center', marginVertical: 6 }}
                numberOfLines={3}
                maxFontSizeMultiplier={1}
              >
                {p.name}
              </Txt>
              <Txt style={{ fontFamily: fonts.label, fontSize: 12, letterSpacing: 1.5, color: palette.brick }} maxFontSizeMultiplier={1}>
                {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </Txt>
            </View>
          </View>
        </Animated.View>
      )}
    </Paper>
  );
}
