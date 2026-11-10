// NOW — the home feed.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, View } from 'react-native';

import { FriendStack } from '@/components/Avatars';
import { BoredButton } from '@/components/BoredButton';
import { GuideCover } from '@/components/GuideCover';
import { TabHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { EmptyState, FreshStamp, useStampRefresh } from '@/components/misc';
import { PlaceCard } from '@/components/PlaceCard';
import { TicketCard } from '@/components/TicketCard';
import { Chip, Paper, SectionHeader, Sheet, Txt } from '@/components/ui';
import { useNow, useWeather } from '@/lib/hooks';
import { NEAR_RADIUS_KM } from '@/lib/geo';
import { DAY_LONG, partOfDay, relativeDay, type TimeWindow } from '@/lib/time';
import { getBoredDeck, getEvent, getEvents, getFeatured, getGuides, getOrg, getPlace, getPlaces } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

const CHIPS: { key: TimeWindow; label: string }[] = [
  { key: 'now', label: 'Right now' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'week', label: 'This week' },
];

const SECTION_TITLE: Record<TimeWindow, string> = {
  now: 'Happening right now',
  tonight: 'Happening tonight',
  weekend: 'This weekend',
  week: 'This week',
  twoWeeks: 'Next two weeks',
};

const CARD_W = 318;

export default function NowScreen() {
  const { c } = useTheme();
  const { viewer, profile, plans, prefs, setPrefs } = useApp();
  const [win, setWin] = useState<TimeWindow>('tonight');
  const [tick, setTick] = useState(0);
  const { control, stampKey } = useStampRefresh(() => setTick((t) => t + 1));
  const now = useNow();
  const weather = useWeather(now);
  const rainy = weather.condition === 'rain';

  const minuteKey = now.getMinutes();
  const data = useMemo(() => {
    const indoorFirst = <T extends { item: { indoor: boolean } }>(xs: T[]) =>
      rainy ? [...xs].sort((a, b) => Number(b.item.indoor) - Number(a.item.indoor)) : xs;
    // Each event shows up once on Now, in the highest-priority section that wants it.
    const seen = new Set<string>();
    const take = <T extends { item: { id: string } }>(xs: T[], n: number) => {
      const out = xs.filter((x) => !seen.has(x.item.id)).slice(0, n);
      out.forEach((x) => seen.add(x.item.id));
      return out;
    };
    const featured = getFeatured(viewer);
    if (featured) seen.add(featured.item.id);
    const happening = take(indoorFirst(getEvents({ viewer, window: win, openToMe: true }).filter((l) => !l.item.isAway)), 8);
    const friends = take(
      getEvents({ viewer, window: 'twoWeeks', openToMe: true }).filter((l) => l.item.friendsGoing.length > 0),
      4,
    );
    const free = take(indoorFirst(getEvents({ viewer, window: 'week', freeOnly: true, openToMe: true })), 8);
    const sober = take(
      getEvents({ viewer, window: 'week', soberFriendly: true, openToMe: true }).filter((l) => l.item.start.getHours() >= 17 || l.live),
      3,
    );
    const fresh = take(
      getEvents({ viewer, window: 'twoWeeks', openToMe: true }).filter((l) => l.item.isNew),
      8,
    );
    const lateFood = getPlaces({ viewer, kind: 'food', foodTags: ['late'], openToMe: true, openNow: true }).slice(0, 3);
    const gameDay = getEvents({ viewer, window: 'weekend', categories: ['sports'], includeAway: true }).find(
      (l) => l.item.opponent && (l.item.isAway || l.item.access === 'ticketed') && l.item.id.startsWith('fb-'),
    );
    const openNear = getBoredDeck(viewer, profile.transport, profile.interests, weather).length;
    const nearCount =
      getEvents({ viewer, window: 'now', openToMe: true }).filter((l) => l.km <= NEAR_RADIUS_KM[profile.transport]).length +
      getPlaces({ viewer, openNow: true, openToMe: true }).filter((l) => l.km <= NEAR_RADIUS_KM[profile.transport]).length;
    return { happening, free, sober, lateFood, friends, fresh, featured, openNear, nearCount, gameDay };
    // tick forces recompute after pull-to-refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, win, rainy, profile.transport, profile.interests, tick, minuteKey]);

  const featuredOrg = data.featured?.item.orgId ? getOrg(data.featured.item.orgId) : undefined;
  const isVisitor = profile.mode === 'visitor';
  const firstName = profile.name.split(' ')[0];
  const lateNight = now.getHours() >= 21 || now.getHours() < 4;

  return (
    <Paper>
      <FreshStamp stampKey={stampKey} />
      <ScrollView refreshControl={control} contentContainerStyle={{ paddingBottom: 40 }}>
        <TabHeader
          subtitle={
            <View style={{ marginTop: 16 }}>
              <Txt v="hero" accessibilityRole="header">
                {greeting(now)}
                {firstName ? `,\n${firstName}.` : '.'}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <Icon
                  name={rainy ? 'rain' : weather.condition === 'cloudy' ? 'cloud' : now.getHours() >= 18 || now.getHours() < 6 ? 'moon' : 'sun'}
                  color={c.textMuted}
                  size={17}
                />
                <Txt v="bodySm" muted>
                  {DAY_LONG[now.getDay()]} {partOfDay(now)} · {weather.tempF}° {weather.label} ·{' '}
                  <Txt v="bodySm" color={c.brick} style={{ fontWeight: '700' }}>
                    {data.nearCount} things open near you
                  </Txt>
                </Txt>
              </View>
            </View>
          }
        />

        {rainy && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 14,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: c.ivy,
              padding: 10,
            }}
          >
            <Icon name="rain" color={c.ivy} size={22} />
            <Txt v="bodySm" style={{ flex: 1 }}>
              <Txt v="bodySm" style={{ fontWeight: '700' }}>
                Rain today.
              </Txt>{' '}
              We moved indoor picks to the top so you stay dry.
            </Txt>
          </View>
        )}

        {!prefs.pitchHintSeen && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss tip: long-press the logo for Pitch Mode"
            onPress={() => setPrefs({ pitchHintSeen: true })}
            style={{ marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: c.surfaceAlt, padding: 10 }}
          >
            <Icon name="megaphone" color={c.brick} size={18} />
            <Txt v="caption" style={{ flex: 1 }}>
              Demoing? Long-press the logo for Pitch Mode.
            </Txt>
            <Icon name="close" color={c.textMuted} size={16} />
          </Pressable>
        )}

        {data.gameDay && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Game day: ${data.gameDay.item.title}`}
            onPress={() => router.push(`/event/${data.gameDay!.item.id}`)}
            style={{ marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: palette.brick, padding: 12 }}
          >
            <Icon name="sports" color={palette.paper} size={22} />
            <View style={{ flex: 1 }}>
              <Txt v="label" color={palette.mustard}>
                Game day · {relativeDay(data.gameDay.item.start, now)}
              </Txt>
              <Txt v="bodySm" color={palette.paper}>
                {data.gameDay.item.title}. {data.gameDay.item.isAway ? 'Watch parties open to everyone →' : 'No ticket? Find a watch spot →'}
              </Txt>
            </View>
          </Pressable>
        )}

        <BoredButton count={Math.max(data.openNear, 1)} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 22 }}>
          {CHIPS.map((ch) => (
            <Chip key={ch.key} label={ch.label} active={win === ch.key} onPress={() => setWin(ch.key)} accent="ink" />
          ))}
        </ScrollView>

        <SectionHeader title={SECTION_TITLE[win]} kicker={rainy ? 'Indoor first' : undefined} action="All events" onAction={() => router.push('/events')} />
        {data.happening.length ? (
          <FlatList
            horizontal
            data={data.happening}
            keyExtractor={(l) => l.item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 10 }}
            snapToInterval={CARD_W + 14}
            decelerationRate="fast"
            renderItem={({ item: l }) => <TicketCard event={l.item} acc={l.acc} km={l.km} live={l.live} width={CARD_W} now={now} />}
          />
        ) : (
          <EmptyState
            icon="moon"
            title={win === 'now' ? 'Nothing starting this second.' : 'Quiet stretch.'}
            body="Nothing open this late? The Waffle House on Broad never closes, though."
          />
        )}

        {data.featured && featuredOrg && (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <Txt v="caption" muted style={{ marginBottom: 8 }}>
              Featured · paid by {featuredOrg.name}. Always labeled, never in I’m bored.
            </Txt>
            <TicketCard event={data.featured.item} acc={data.featured.acc} km={data.featured.km} live={data.featured.live} now={now} featuredSlot />
          </View>
        )}

        {plans.length > 0 && (
          <>
            <SectionHeader title="Your plans" action="Profile" onAction={() => router.push('/profile')} />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {plans.slice(0, 2).map((p) => {
                const ref = p.refType === 'event' ? getEvent(p.refId) : getPlace(p.refId);
                const ins = Object.values(p.responses).filter((r) => r === 'in').length;
                const topTime = [...p.times].sort((a, b) => b.votes.length - a.votes.length)[0];
                return (
                  <Sheet
                    key={p.id}
                    style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}
                    onPress={() => router.push({ pathname: '/plan', params: { planId: p.id } })}
                    label={`Plan: ${p.title}`}
                  >
                    <Icon name="users" color={c.ivy} size={26} />
                    <View style={{ flex: 1 }}>
                      <Txt v="serif" numberOfLines={1}>
                        {p.title}
                      </Txt>
                      <Txt v="caption" muted>
                        {ins + 1} in · leading time: {topTime?.label ?? 'TBD'} {ref ? '' : ''}
                      </Txt>
                    </View>
                    <FriendStack ids={p.invited} size={22} label={false} />
                  </Sheet>
                );
              })}
            </View>
          </>
        )}

        {data.friends.length > 0 && (
          <>
            <SectionHeader title="Your friends are going" action="Friends" onAction={() => router.push('/profile')} />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {data.friends.slice(0, 4).map((l) => (
                <Pressable
                  key={l.item.id}
                  onPress={() => router.push(`/event/${l.item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${l.item.title}, friends going`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: c.line }}
                >
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyBold" numberOfLines={1}>
                      {l.item.title}
                    </Txt>
                    <View style={{ marginTop: 4 }}>
                      <FriendStack ids={l.item.friendsGoing} size={20} />
                    </View>
                  </View>
                  <Icon name="chevronRight" color={c.textMuted} size={18} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <SectionHeader title="Free this week" kicker="$0.00" action="See all" onAction={() => router.push({ pathname: '/events', params: { free: '1' } })} />
        <FlatList
          horizontal
          data={data.free}
          keyExtractor={(l) => l.item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 10 }}
          renderItem={({ item: l }) => <TicketCard event={l.item} acc={l.acc} km={l.km} live={l.live} width={CARD_W} now={now} showFriends={false} />}
        />

        <SectionHeader title="Not a bar crowd" kicker="Nights out, no hangover" />
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Txt v="bodySm" muted style={{ marginTop: -4, marginBottom: 2 }}>
            Sober-friendly plans after dark: shows, games, late eats and things with no bar line.
          </Txt>
          {data.sober.map((l) => (
            <TicketCard key={l.item.id} event={l.item} acc={l.acc} km={l.km} live={l.live} now={now} showFriends={false} />
          ))}
          <Pressable accessibilityRole="link" hitSlop={{ top: 14, bottom: 14 }} onPress={() => router.push({ pathname: '/events', params: { sober: '1' } })}>
            <Txt v="labelSm" color={c.brick}>
              All sober-friendly plans this week →
            </Txt>
          </Pressable>
        </View>
        {lateNight && data.lateFood.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingTop: 22, paddingBottom: 4, paddingHorizontal: 20 }}
          >
            {data.lateFood.map((l) => (
              <PlaceCard key={l.item.id} place={l.item} acc={l.acc} km={l.km} width={230} now={now} compact />
            ))}
          </ScrollView>
        )}

        {data.fresh.length > 0 && (
          <>
            <SectionHeader title="New this week" kicker="Just stapled up" />
            <FlatList
              horizontal
              data={data.fresh}
              keyExtractor={(l) => l.item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 10 }}
              renderItem={({ item: l }) => <TicketCard event={l.item} acc={l.acc} km={l.km} live={l.live} width={CARD_W} now={now} />}
            />
          </>
        )}

        <SectionHeader title="Curated collections" kicker="Zines by locals" action="Explore" onAction={() => router.push('/explore')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {getGuides(viewer.mode).map((g) => (
            <GuideCover key={g.id} guide={g} />
          ))}
        </ScrollView>

        {isVisitor && (
          <View style={{ marginHorizontal: 20, marginTop: 28, flexDirection: 'row', gap: 12, borderWidth: 1.5, borderColor: c.lineStrong, padding: 14 }}>
            <Icon name="car" color={c.text} size={22} />
            <View style={{ flex: 1 }}>
              <Txt v="bodyBold">Parking downtown</Txt>
              <Txt v="bodySm" muted>
                City decks on Washington St and College Ave are closest to everything (sample info). Everything downtown is a short walk from there.
              </Txt>
            </View>
          </View>
        )}

        <GetHomeSafe highlight={lateNight} mode={profile.mode} />

        <View style={{ paddingHorizontal: 20, marginTop: 24, flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add something to the guide"
            onPress={() => router.push('/submit')}
            style={{ flex: 1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong, padding: 14, alignItems: 'center', gap: 6 }}
          >
            <Icon name="megaphone" color={c.brick} size={24} />
            <Txt v="label" center>
              Add something
            </Txt>
            <Txt v="caption" muted center>
              Know about a show, market or pickup game? Post it.
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </Paper>
  );
}

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 4) return 'Up late';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night owl';
}

function GetHomeSafe({ highlight, mode }: { highlight: boolean; mode: 'student' | 'local' | 'visitor' }) {
  const { c } = useTheme();
  return (
    <View style={{ marginHorizontal: 20, marginTop: 28 }}>
      <View
        style={{
          backgroundColor: highlight ? palette.ink : c.surfaceAlt,
          padding: 16,
          borderWidth: 1.5,
          borderColor: c.lineStrong,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="moonStar" color={highlight ? palette.mustard : c.brick} size={22} />
          <Txt v="label" color={highlight ? palette.paper : c.text}>
            Late night · get home safe
          </Txt>
        </View>
        <View style={{ gap: 8, marginTop: 10 }}>
          {(mode === 'student'
            ? [
                ['bus', 'Night bus & campus transit', 'Live arrivals coming soon (placeholder).'],
                ['car', 'Campus safe-ride', 'Hours and the number to call (placeholder).'],
                ['users', 'Buddy check', 'Share your ETA with a friend from Plans.'],
              ]
            : [
                ['bus', 'Athens-Clarke Transit routes', 'Late routes and times (placeholder).'],
                ['car', 'Rideshare pickup spots downtown', 'Where drivers can actually stop (placeholder).'],
                ['users', 'Buddy check', 'Share your ETA with a friend from Plans.'],
              ]
          ).map(([icon, title, body]) => (
            <View key={title} style={{ flexDirection: 'row', gap: 10 }}>
              <Icon name={icon as 'bus'} color={highlight ? palette.paper : c.text} size={18} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold" color={highlight ? palette.paper : c.text}>
                  {title}
                </Txt>
                <Txt v="bodySm" color={highlight ? '#CFC5B1' : c.textMuted}>
                  {body}
                </Txt>
              </View>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call 911 in an emergency"
            onPress={() => Linking.openURL('tel:911')}
            style={{ marginTop: 4 }}
          >
            <Txt v="labelSm" color={highlight ? palette.mustard : c.brick}>
              Emergency? Call 911 →
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
