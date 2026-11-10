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
import { Stamp } from '@/components/Stamp';
import { TicketCard } from '@/components/TicketCard';
import { Chip, Paper, SectionHeader, Sheet, Txt } from '@/components/ui';
import { useNow, useWeather } from '@/lib/hooks';
import { NEAR_RADIUS_KM } from '@/lib/geo';
import { DAY_LONG, partOfDay, type TimeWindow } from '@/lib/time';
import { getBoredDeck, getEvent, getEvents, getFeatured, getGuides, getPlace, getPlaces } from '@/services/dataService';
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
  const { viewer, profile, plans } = useApp();
  const [win, setWin] = useState<TimeWindow>('tonight');
  const [tick, setTick] = useState(0);
  const { control, stampKey } = useStampRefresh(() => setTick((t) => t + 1));
  const now = useNow();
  const weather = useWeather(now);
  const rainy = weather.condition === 'rain';

  const data = useMemo(() => {
    const indoorFirst = <T extends { item: { indoor: boolean } }>(xs: T[]) =>
      rainy ? [...xs].sort((a, b) => Number(b.item.indoor) - Number(a.item.indoor)) : xs;

    const happening = indoorFirst(getEvents({ viewer, window: win }).filter((l) => !l.item.isAway)).slice(0, 10);
    const free = indoorFirst(getEvents({ viewer, window: 'week', freeOnly: true, openToMe: true })).slice(0, 10);
    const sober = getEvents({ viewer, window: 'week', soberFriendly: true, openToMe: true })
      .filter((l) => l.item.start.getHours() >= 18 || l.live)
      .slice(0, 4);
    const lateFood = getPlaces({ viewer, kind: 'food', foodTags: ['late'], openToMe: true }).slice(0, 3);
    const friends = getEvents({ viewer, window: 'twoWeeks', openToMe: true }).filter((l) => l.item.friendsGoing.length > 0).slice(0, 6);
    const fresh = getEvents({ viewer, window: 'twoWeeks' }).filter((l) => l.item.isNew).slice(0, 8);
    const featured = getFeatured(viewer);
    const openNear = getBoredDeck(viewer, profile.transport, profile.interests, weather).length;
    const nearCount =
      getEvents({ viewer, window: 'now', openToMe: true }).filter((l) => l.km <= NEAR_RADIUS_KM[profile.transport]).length +
      getPlaces({ viewer, openNow: true, openToMe: true }).filter((l) => l.km <= NEAR_RADIUS_KM[profile.transport]).length;
    return { happening, free, sober, lateFood, friends, fresh, featured, openNear, nearCount };
    // tick forces recompute after pull-to-refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, win, rainy, profile.transport, profile.interests, tick, now.getMinutes()]);

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
                <Icon name={rainy ? 'rain' : weather.condition === 'cloudy' ? 'cloud' : now.getHours() >= 19 ? 'moon' : 'sun'} color={c.textMuted} size={17} />
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
          <View style={{ marginHorizontal: 20, marginTop: 14, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.ivy, padding: 10 }}>
            <Icon name="rain" color={c.ivy} size={22} />
            <Txt v="bodySm" style={{ flex: 1 }}>
              <Txt v="bodySm" style={{ fontWeight: '700' }}>Rain today.</Txt> We moved indoor picks to the top so you stay dry.
            </Txt>
          </View>
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

        {data.featured && (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Stamp kind="featured" animate={false} />
              <Txt v="caption" muted style={{ flex: 1 }}>
                Paid placement by {data.featured.item.source.name}. Always labeled.
              </Txt>
            </View>
            <TicketCard event={data.featured.item} acc={data.featured.acc} km={data.featured.km} live={data.featured.live} now={now} />
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
                  <Sheet key={p.id} style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={() => router.push({ pathname: '/plan', params: { planId: p.id } })} label={`Plan: ${p.title}`}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingTop: 12, paddingBottom: 4 }}>
            {data.lateFood.map((l) => (
              <PlaceCard key={l.item.id} place={l.item} acc={l.acc} km={l.km} width={230} now={now} compact />
            ))}
          </ScrollView>
        </View>

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
          {getGuides().map((g) => (
            <GuideCover key={g.id} guide={g} />
          ))}
        </ScrollView>

        <GetHomeSafe highlight={lateNight} />

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

function GetHomeSafe({ highlight }: { highlight: boolean }) {
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
          {[
            ['bus', 'Night bus & campus transit', 'Live arrivals coming soon (placeholder).'],
            ['car', 'Safe ride', 'Campus safe-ride hours & the number to call (placeholder).'],
            ['users', 'Buddy check', 'Share your ETA with a friend from Plans.'],
          ].map(([icon, title, body]) => (
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
          <Pressable accessibilityRole="button" accessibilityLabel="Call 911 in an emergency" onPress={() => Linking.openURL('tel:911')} style={{ marginTop: 4 }}>
            <Txt v="labelSm" color={highlight ? palette.mustard : c.brick}>
              Emergency? Call 911 →
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
