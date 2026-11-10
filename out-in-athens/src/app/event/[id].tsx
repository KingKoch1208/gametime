// EVENT DETAIL — poster header, date stamp, access, RSVP, actions, extras.
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendStack } from '@/components/Avatars';
import { CATEGORY_ICON, Icon, type IconName } from '@/components/Icon';
import { MiniMap } from '@/components/MiniMap';
import { EmptyState, ReviewTags } from '@/components/misc';
import { ShareCard, SHARE_H, SHARE_W, shareEventCard, type ViewRef } from '@/components/ShareCard';
import { Stamp } from '@/components/Stamp';
import { TicketCard } from '@/components/TicketCard';
import { TravelBadges } from '@/components/TravelBadges';
import { Fact, Pill } from '@/components/DetailBits';
import { Button, Paper, Sheet, TearLine, Txt } from '@/components/ui';
import { accessFor, ACCESS_LABEL } from '@/lib/access';
import { addToCalendar } from '@/lib/calendar';
import { openDirections } from '@/lib/directions';
import { haptic } from '@/lib/feedback';
import { MOCK_ME } from '@/lib/geo';
import { DAY_LONG, fmtTime, isLive, MONTH_SHORT, whenLabel } from '@/lib/time';
import { getEvent, getOrg, now as clockNow } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, onAccent, palette } from '@/theme/tokens';
import { toast } from '@/lib/toast';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = getEvent(id);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, rsvp, setRsvp, savedEvents, toggleSavedEvent, profile, report, reported } = useApp();
  const shareRef = useRef<ViewRef>(null);

  if (!e) {
    return (
      <Paper style={{ paddingTop: insets.top + 40 }}>
        <EmptyState icon="flag" title="This flyer got torn down." body="The event may have ended or been removed." />
        <Button label="Back" onPress={() => router.back()} style={{ alignSelf: 'center' }} />
      </Paper>
    );
  }

  const acc = accessFor(e, viewer);
  const locked = !acc.canAttend;
  const now = clockNow();
  const live = isLive(e.start, e.end, now);
  const fill = locked ? c.locked : accentFill(c, e.accent);
  const fg = locked ? palette.paper : onAccent(e.accent);
  const mine = rsvp[e.id];
  const saved = savedEvents.includes(e.id);
  const org = e.orgId ? getOrg(e.orgId) : undefined;
  const watchParties = (e.watchPartyIds ?? []).map(getEvent).filter(Boolean);
  const forGame = e.watchPartyFor ? getEvent(e.watchPartyFor) : undefined;
  const going = e.going + (mine === 'going' ? 1 : 0);
  const interested = e.interested + (mine === 'interested' ? 1 : 0);

  return (
    <Paper>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Poster header */}
        <View style={{ backgroundColor: fill, paddingTop: insets.top + 56, paddingHorizontal: 20, paddingBottom: 26, overflow: 'hidden' }}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <Pattern id="poster" patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(28)">
                <Circle cx={4} cy={4} r={1.4} fill={fg} opacity={0.17} />
              </Pattern>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#poster)" />
            <Circle cx="88%" cy="30%" r={120} fill={fg} opacity={0.07} />
          </Svg>
          {/* staples */}
          <View style={[styles.staple, { left: 18, top: insets.top + 10 }]} />
          <View style={[styles.staple, { right: 18, top: insets.top + 10, transform: [{ rotate: '8deg' }] }]} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={CATEGORY_ICON[e.category]} color={fg} size={18} />
                <Txt v="label" color={fg}>
                  {e.category}
                  {e.opponent ? ` · vs ${e.opponent}` : ''}
                </Txt>
              </View>
            </View>
            {/* Date stamp */}
            <View
              style={{ borderWidth: 2.5, borderColor: fg, padding: 3, transform: [{ rotate: '6deg' }] }}
              accessible
              accessibilityLabel={`${DAY_LONG[e.start.getDay()]} ${MONTH_SHORT[e.start.getMonth()]} ${e.start.getDate()}`}
            >
              <View style={{ borderWidth: 1, borderColor: fg, paddingHorizontal: 10, paddingVertical: 2, alignItems: 'center' }}>
                <Txt v="label" color={fg} size={12}>
                  {MONTH_SHORT[e.start.getMonth()]}
                </Txt>
                <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 38, lineHeight: 40, color: fg }} maxFontSizeMultiplier={1.1}>
                  {e.start.getDate()}
                </Txt>
                <Txt v="labelSm" color={fg}>
                  {DAY_LONG[e.start.getDay()].slice(0, 3)}
                </Txt>
              </View>
            </View>
          </View>
          <Txt
            style={{ fontFamily: fonts.displayBlack, fontSize: 40, lineHeight: 42, letterSpacing: -1, color: fg, marginTop: 14 }}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
          >
            {e.title}
          </Txt>
          <Txt v="italic" color={fg} style={{ marginTop: 8, opacity: 0.95 }}>
            {live ? whenLabel(e.start, e.end, now) : `${whenLabel(e.start, e.end, now)}–${fmtTime(e.end)}`} · {e.venue}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {live && <Stamp kind="live" size="md" />}
            <Stamp kind={acc.stamp} text={locked ? acc.lockReason : undefined} size="md" style={{ backgroundColor: c.surface }} />
            {acc.perk && <Stamp kind="perk" text={e.dawgPerk ? `Dawg perk: ${e.dawgPerk}` : undefined} size="md" delay={120} />}
            {e.featured && <Stamp kind="featured" size="md" delay={200} />}
          </View>
        </View>

        {/* Floating back + save */}
        <View style={{ position: 'absolute', top: insets.top + 6, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
          <RoundBtn icon="chevronLeft" label="Back" onPress={() => router.back()} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <RoundBtn icon="share" label="Share poster" onPress={() => shareEventCard(shareRef, e)} />
            {!locked && (
              <RoundBtn
                icon="bookmark"
                label={saved ? 'Unsave' : 'Save'}
                active={saved}
                onPress={() => {
                  if (toggleSavedEvent(e.id)) haptic.success();
                }}
              />
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          {locked && (
            <View style={{ borderWidth: 1.5, borderColor: c.brick, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
              <Icon name="lock" color={c.brick} size={22} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold">
                  {acc.lockReason}. Not for you in {profile.mode === 'local' ? 'Local' : 'Visitor'} mode.
                </Txt>
                <Txt v="bodySm" muted style={{ marginTop: 2 }}>
                  We’re showing it because “Show UGA-only stuff” is on. No RSVP or directions, so nobody gets turned away at the door.
                </Txt>
              </View>
            </View>
          )}

          {acc.needsStudent && (
            <View style={{ borderWidth: 1.5, borderColor: c.ivy, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
              <Icon name="users" color={c.ivy} size={22} />
              <Txt v="bodySm" style={{ flex: 1 }}>
                <Txt v="bodySm" style={{ fontWeight: '700' }}>
                  Locals need a UGA student with them.
                </Txt>{' '}
                Going with a friend who’s a student? Tap Going.
              </Txt>
            </View>
          )}
          {acc.ageUnknown && (
            <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
              <Icon name="info" color={c.text} size={20} />
              <Txt v="bodySm" style={{ flex: 1 }}>
                This is {e.access}. Set your age in Profile to see if you can go.
              </Txt>
            </View>
          )}

          {/* RSVP */}
          {!locked && (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  kind={mine === 'interested' ? 'ivy' : 'secondary'}
                  icon="star"
                  label={`Interested · ${interested}`}
                  onPress={() => setRsvp(e.id, mine === 'interested' ? null : 'interested')}
                  style={{ flex: 1 }}
                  small
                />
                <Button
                  kind={mine === 'going' ? 'primary' : 'secondary'}
                  icon="check"
                  label={`Going · ${going}`}
                  onPress={() => {
                    if (mine !== 'going') haptic.success();
                    setRsvp(e.id, mine === 'going' ? null : 'going');
                  }}
                  style={{ flex: 1 }}
                  small
                />
              </View>
              {e.friendsGoing.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <FriendStack ids={e.friendsGoing} size={26} />
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <Action icon="calendar" label="Calendar" onPress={() => addToCalendar(e)} />
                <Action icon="share" label="Share" onPress={() => shareEventCard(shareRef, e)} />
                <Action icon="directions" label="Directions" onPress={() => openDirections(e.coords, e.venue, profile.transport)} />
                <Action icon="users" label="Make a plan" onPress={() => router.push({ pathname: '/plan', params: { refType: 'event', refId: e.id } })} />
              </View>
            </>
          )}

          <TearLine style={{ marginTop: 18 }} />

          {/* Facts */}
          <Fact
            icon="clock"
            label="When"
            value={`${DAY_LONG[e.start.getDay()]}, ${MONTH_SHORT[e.start.getMonth()]} ${e.start.getDate()} · ${fmtTime(e.start)}–${fmtTime(e.end)}`}
          />
          <Fact icon="tag" label="Price" value={e.price === 0 ? (e.priceNote ?? 'Free') : `$${e.price}${e.priceNote ? ` · ${e.priceNote}` : ''}`} />
          <Fact icon="lock" label="Access" value={ACCESS_LABEL[e.access]} />
          <Fact icon="pin" label="Where" value={e.venue} />
          {e.isAway ? (
            <Txt v="bodySm" muted style={{ marginBottom: 10 }}>
              Away game. Pick a watch party in Athens below.
            </Txt>
          ) : (
            <>
              <MiniMap
                coords={e.coords}
                icon={CATEGORY_ICON[e.category]}
                color={locked ? 'locked' : 'brick'}
                label={e.venue}
                locked={locked}
                onPress={() => openDirections(e.coords, e.venue, profile.transport)}
              />
              {!locked && <TravelBadges from={MOCK_ME} to={e.coords} showCar style={{ marginTop: 10 }} />}
            </>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {e.soberFriendly && <Pill icon="coffee" text="Sober-friendly" />}
            {e.accessibleVenue && <Pill icon="accessible" text="Accessible venue" />}
            {e.petFriendly && <Pill icon="paw" text="Pet-friendly" />}
            <Pill icon={e.indoor ? 'home' : 'sun'} text={e.indoor ? 'Indoors' : 'Outdoors'} />
          </View>

          <TearLine />
          <Txt v="body">{e.description}</Txt>

          {/* Concert / sports extras */}
          {(e.lineup || e.studentTicketNote || e.ticketUrl) && (
            <Sheet style={{ padding: 14, marginTop: 16, gap: 8 }}>
              {e.lineup && (
                <>
                  <Txt v="label">{e.category === 'sports' ? 'Matchup' : 'Lineup'}</Txt>
                  {e.lineup.map((l, i) => (
                    <Txt key={l} v={i === 0 ? 'serif' : 'body'} muted={i > 0}>
                      {l}
                    </Txt>
                  ))}
                </>
              )}
              {e.studentTicketNote && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Icon name="arch" color={c.brick} size={18} />
                  <Txt v="bodySm" style={{ flex: 1 }}>
                    {e.studentTicketNote}
                  </Txt>
                </View>
              )}
              {e.ticketUrl && !locked && (
                <Button
                  small
                  kind="mustard"
                  icon="ticket"
                  label="Get tickets (placeholder)"
                  onPress={() => toast('In the real app this opens the venue’s ticketing page.')}
                />
              )}
            </Sheet>
          )}

          {watchParties.length > 0 && (
            <>
              <Txt v="label" style={{ marginTop: 20, marginBottom: 10 }}>
                Watch parties nearby
              </Txt>
              <View style={{ gap: 12 }}>
                {watchParties.map((w) => (
                  <TicketCard key={w!.id} event={w!} acc={accessFor(w!, viewer)} now={now} />
                ))}
              </View>
            </>
          )}
          {forGame && (
            <Pressable onPress={() => router.push(`/event/${forGame.id}`)} accessibilityRole="link" style={{ marginTop: 14 }}>
              <Txt v="labelSm" color={c.brick}>
                Watch party for {forGame.title} →
              </Txt>
            </Pressable>
          )}

          <Txt v="label" style={{ marginTop: 22, marginBottom: 10 }}>
            What people say
          </Txt>
          <ReviewTags id={e.id} base={e.reviewTags} />

          <TearLine style={{ marginTop: 20 }} />

          {/* Source + report */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Stamp
              kind={e.source.verified ? 'verified' : 'pending'}
              text={
                e.source.kind === 'partner'
                  ? `Listed by ${e.source.name}`
                  : e.source.kind === 'student'
                    ? `${e.source.name} ✓ verified`
                    : e.source.kind === 'scraper'
                      ? 'From venue calendar (auto)'
                      : 'Out in Athens pick'
              }
              animate={false}
            />
            {org && (
              <Pressable onPress={() => router.push(`/org/${org.id}`)} accessibilityRole="link">
                <Txt v="labelSm" color={c.brick}>
                  {org.name} →
                </Txt>
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              report(e.id);
              haptic.warn();
              toast('Thanks for the heads up. We’ll double-check this listing.');
            }}
            style={{ marginTop: 14, flexDirection: 'row', gap: 6, alignItems: 'center' }}
          >
            <Icon name="flag" color={c.textMuted} size={15} />
            <Txt v="caption" muted>
              {reported.includes(e.id) ? 'Reported as outdated, thanks' : 'Report outdated info'}
            </Txt>
          </Pressable>
          {e.ticketUrl && (
            <Pressable onPress={() => Linking.openURL('https://www.visitathensga.com')} style={{ marginTop: 8 }} accessibilityRole="link">
              <Txt v="caption" muted>
                Event details are sample data for the prototype.
              </Txt>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Off-screen poster for sharing */}
      <View style={{ position: 'absolute', left: -SHARE_W * 3, top: 0, width: SHARE_W, height: SHARE_H }} pointerEvents="none">
        <ShareCard ref={shareRef} event={e} />
      </View>
    </Paper>
  );
}

function RoundBtn({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.bg,
        borderWidth: 1.5,
        borderColor: c.lineStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} color={active ? c.brick : c.text} fill={active ? c.brick : 'none'} size={20} />
    </Pressable>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => ({ alignItems: 'center', gap: 6, width: 76, opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 1.5,
          borderColor: c.lineStrong,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.surface,
        }}
      >
        <Icon name={icon} color={c.text} size={22} />
      </View>
      <Txt v="labelSm" center>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  staple: { position: 'absolute', width: 22, height: 4, backgroundColor: '#9C968B', borderRadius: 1, opacity: 0.8 },
});
