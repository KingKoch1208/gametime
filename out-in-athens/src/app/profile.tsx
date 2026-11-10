// PROFILE — access mode, interests, saved, plans, passport, friends,
// followed orgs, notifications and settings.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatars';
import { StackHeader, togglePitchMode } from '@/components/Header';
import { Icon, type IconName } from '@/components/Icon';
import { ProgressRing } from '@/components/ProgressRing';
import { Stamp } from '@/components/Stamp';
import { Button, Chip, Paper, Segmented, SectionHeader, ToggleRow, Txt } from '@/components/ui';
import type { AccessMode, AgeRange, Interest, Transport } from '@/data/types';
import { MODE_LABEL } from '@/lib/access';
import { haptic } from '@/lib/feedback';
import { BADGES, badgeProgress } from '@/lib/passport';
import { DAY_SHORT, fmtTime, MONTH_SHORT, relativeDay } from '@/lib/time';
import { getEvent, getFriends, getOrgs, getPlace, now as clockNow, demoPreset } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts } from '@/theme/tokens';
import { toast } from '@/lib/toast';

const DEMO_LABEL = { fri: 'Fri 6:30pm', sat: 'Sat 11am', tue: 'Tue 1pm' } as const;

function demoKindOf(iso: string | null): 'live' | 'fri' | 'sat' | 'tue' {
  if (!iso) return 'live';
  const d = new Date(iso);
  return d.getDay() === 5 ? 'fri' : d.getDay() === 6 ? 'sat' : d.getDay() === 2 ? 'tue' : 'live';
}

const INTERESTS: { v: Interest; l: string }[] = [
  { v: 'music', l: 'Live music' },
  { v: 'outdoors', l: 'Outdoors' },
  { v: 'sports', l: 'Sports' },
  { v: 'arts', l: 'Arts' },
  { v: 'food', l: 'Food' },
  { v: 'nightlife', l: 'Nights out, no bars' },
  { v: 'fitness', l: 'Fitness' },
  { v: 'volunteer', l: 'Volunteering' },
  { v: 'nerdy', l: 'Nerdy stuff' },
  { v: 'family', l: 'Family' },
  { v: 'faith', l: 'Faith' },
  { v: 'film', l: 'Movies' },
  { v: 'markets', l: 'Markets' },
  { v: 'study', l: 'Study spots' },
];

export default function ProfileScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const { profile, prefs, setProfile, setPrefs, savedEvents, savedPlaces, rsvp, plans, checkins, following, toggleFollow, submissions } = app;
  const now = clockNow();
  const [confirmReset, setConfirmReset] = useState(false);
  const demoKind = demoKindOf(prefs.demoTime);
  const initials = profile.name.trim()
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'You';

  // "My plans" = going/interested events + plans, grouped by day.
  const agenda = [
    ...Object.entries(rsvp)
      .map(([id, kind]) => ({ e: getEvent(id), kind }))
      .filter((x) => x.e && x.e.end > now)
      .map((x) => ({
        date: x.e!.start,
        title: x.e!.title,
        sub: `${x.kind === 'going' ? 'Going' : 'Interested'} · ${fmtTime(x.e!.start)} · ${x.e!.venue}`,
        href: `/event/${x.e!.id}`,
      })),
    ...plans.map((p) => {
      const e = p.refType === 'event' ? getEvent(p.refId) : undefined;
      return {
        date: e?.start ?? new Date(p.createdAt),
        title: `Plan: ${p.title}`,
        sub: `${Object.values(p.responses).filter((r) => r === 'in').length + 1} in`,
        href: `/plan?planId=${p.id}`,
      };
    }),
  ].sort((a, b) => +a.date - +b.date);

  const savedE = savedEvents.map(getEvent).filter((e) => e && e.end > now);
  const savedP = savedPlaces.map(getPlace).filter(Boolean);

  return (
    <Paper>
      <StackHeader title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Identity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 }}>
          <Avatar initials={initials} color={c.ivyFill} size={72} ring={c.lineStrong} />
          <View style={{ flex: 1 }}>
            <TextInput
              value={profile.name}
              onChangeText={(name) => setProfile({ name })}
              placeholder="Your name"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Your name"
              style={{ fontFamily: fonts.display, fontSize: 26, color: c.text, paddingVertical: 2 }}
            />
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <Stamp kind={profile.mode === 'student' ? 'perk' : 'open'} text={MODE_LABEL[profile.mode]} />
              <Stamp kind="verified" text={`${Object.keys(checkins).length} stamp${Object.keys(checkins).length === 1 ? '' : 's'}`} />
            </View>
          </View>
        </View>

        {/* Access mode */}
        <View style={{ paddingHorizontal: 20 }}>
          <Txt v="label" style={{ marginBottom: 8 }}>
            Access Mode
          </Txt>
          <Segmented<AccessMode>
            value={profile.mode}
            onChange={(mode) => {
              haptic.stamp();
              setProfile({ mode });
            }}
            options={[
              { value: 'student', label: 'UGA student' },
              { value: 'local', label: 'Local' },
              { value: 'visitor', label: 'Visiting' },
            ]}
          />
          <Txt v="caption" muted style={{ marginTop: 6 }}>
            {profile.mode === 'student'
              ? 'You see everything, with Dawg perk badges on UGA-ID stuff.'
              : 'UGA-ID-only things are hidden so you never get turned away at the door.'}{' '}
            Self-declared for now; real UGA login is a backend decision.
          </Txt>
          {profile.mode !== 'student' && (
            <ToggleRow
              icon="lock"
              label="Show UGA-only stuff"
              hint="Greyed out with a lock stamp, no directions"
              value={prefs.showUgaOnly}
              onChange={(showUgaOnly) => setPrefs({ showUgaOnly })}
            />
          )}
          <Txt v="label" style={{ marginTop: 14, marginBottom: 8 }}>
            Age (for 18+ / 21+ events)
          </Txt>
          <Segmented<'u' | '18' | '21' | 'skip'>
            value={profile.age === '21+' ? '21' : profile.age === '18+' ? '18' : profile.age === 'under18' ? 'u' : 'skip'}
            onChange={(v) => setProfile({ age: ({ u: 'under18', '18': '18+', '21': '21+', skip: null } as Record<string, AgeRange>)[v] })}
            options={[
              { value: '21', label: '21+' },
              { value: '18', label: '18–20' },
              { value: 'u', label: 'Under 18' },
              { value: 'skip', label: 'Not set' },
            ]}
          />
          <Txt v="label" style={{ marginTop: 14, marginBottom: 8 }}>
            Getting around
          </Txt>
          <Segmented<Transport>
            value={profile.transport}
            onChange={(transport) => setProfile({ transport })}
            options={[
              { value: 'walk', label: 'Walk' },
              { value: 'bike', label: 'Bike' },
              { value: 'bus', label: 'Bus' },
              { value: 'car', label: 'Car' },
            ]}
          />
          <Txt v="label" style={{ marginTop: 14, marginBottom: 8 }}>
            Interests
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map((i) => (
              <Chip
                key={i.v}
                small
                label={i.l}
                active={profile.interests.includes(i.v)}
                onPress={() =>
                  setProfile({ interests: profile.interests.includes(i.v) ? profile.interests.filter((x) => x !== i.v) : [...profile.interests, i.v] })
                }
              />
            ))}
          </View>
        </View>

        {/* My plans */}
        <SectionHeader title="My plans" />
        <View style={{ paddingHorizontal: 20, gap: 0 }}>
          {agenda.length ? (
            agenda.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => router.push(a.href)}
                accessibilityRole="button"
                accessibilityLabel={`${a.title}, ${relativeDay(a.date, now)}`}
                style={{ flexDirection: 'row', gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }}
              >
                <View style={{ width: 48, alignItems: 'center', borderWidth: 1.5, borderColor: c.lineStrong, paddingVertical: 4 }}>
                  <Txt v="labelSm" size={10}>
                    {MONTH_SHORT[a.date.getMonth()]}
                  </Txt>
                  <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 20, color: c.text }}>{a.date.getDate()}</Txt>
                  <Txt v="labelSm" size={9} muted>
                    {DAY_SHORT[a.date.getDay()]}
                  </Txt>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Txt v="bodyBold" numberOfLines={1}>
                    {a.title}
                  </Txt>
                  <Txt v="caption" muted numberOfLines={1}>
                    {a.sub}
                  </Txt>
                </View>
              </Pressable>
            ))
          ) : (
            <Txt v="bodySm" muted>
              Nothing yet. Tap “Going” on an event or make a plan with friends.
            </Txt>
          )}
        </View>

        {/* Saved */}
        <SectionHeader title="Saved" />
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {[
            ...savedE.map((e) => ({
              id: e!.id,
              t: e!.title,
              s: `${relativeDay(e!.start, now)} · ${e!.venue}`,
              href: `/event/${e!.id}`,
              icon: 'ticket' as IconName,
            })),
            ...savedP.map((p) => ({ id: p!.id, t: p!.name, s: p!.neighborhood, href: `/place/${p!.id}`, icon: 'pin' as IconName })),
          ].map((x) => (
            <Pressable
              key={x.id}
              onPress={() => router.push(x.href)}
              accessibilityRole="button"
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}
            >
              <Icon name={x.icon} color={c.brick} size={18} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold" numberOfLines={1}>
                  {x.t}
                </Txt>
                <Txt v="caption" muted>
                  {x.s}
                </Txt>
              </View>
              <Icon name="chevronRight" color={c.textMuted} size={16} />
            </Pressable>
          ))}
          {savedE.length + savedP.length === 0 && (
            <Txt v="bodySm" muted>
              Swipe right in “I’m bored” or tap the bookmark on anything.
            </Txt>
          )}
        </View>

        {/* Passport */}
        <SectionHeader title="Athens Passport" action="Open" onAction={() => router.push('/passport')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
          {BADGES.map((b) => {
            const p = badgeProgress(b, checkins);
            return (
              <Pressable
                key={b.id}
                onPress={() => router.push('/passport')}
                style={{ alignItems: 'center', width: 82 }}
                accessibilityRole="button"
                accessibilityLabel={`${b.name}: ${p.have} of ${p.need}`}
              >
                <ProgressRing value={p.have / p.need} color={accentFill(c, b.accent)} icon={p.done ? 'star' : 'passport'} label={b.name} />
                <Txt v="labelSm" size={10} center numberOfLines={2} style={{ marginTop: 6 }}>
                  {b.name}
                </Txt>
                <Txt v="caption" muted>
                  {p.have}/{p.need}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Friends */}
        <SectionHeader title="Friends" />
        <View style={{ paddingHorizontal: 20 }}>
          <Txt v="label" style={{ marginBottom: 8 }}>
            Share where you are with friends
          </Txt>
          <Segmented<'off' | 'neighborhood' | 'exact'>
            value={prefs.locationSharing}
            onChange={(locationSharing) => setPrefs({ locationSharing, sharingAsked: true, ghostMode: locationSharing === 'off' })}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'neighborhood', label: 'Neighborhood' },
              { value: 'exact', label: 'Exact' },
            ]}
          />
          <Txt v="caption" muted style={{ marginTop: 6, marginBottom: 8 }}>
            {prefs.locationSharing === 'off'
              ? 'Off by default. Friends can’t see you on the map.'
              : prefs.locationSharing === 'neighborhood'
                ? 'Friends see your neighborhood (like “Five Points”), never a building. Turns off at 4am.'
                : 'Exact spot is shared only with friends in an active Plan. Turns off at 4am.'}
          </Txt>
          {getFriends().map((f) => (
            <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: c.line }}>
              <Avatar initials={f.initials} color={f.color} size={36} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold">{f.name}</Txt>
                <Txt v="caption" muted>
                  {f.sharing ? `${f.status} · ${f.area}` : 'Not sharing location'} · {MODE_LABEL[f.mode]}
                </Txt>
              </View>
              {f.sharing ? <Icon name="pin" color={c.ivy} size={18} /> : <Icon name="ghost" color={c.textMuted} size={18} />}
            </View>
          ))}
        </View>

        {/* Orgs */}
        <SectionHeader title="Following" />
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {getOrgs().map((o) => {
            const on = following.includes(o.id);
            return (
              <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => router.push(`/org/${o.id}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                  accessibilityRole="link"
                  accessibilityLabel={o.name}
                >
                  <View style={{ width: 36, height: 36, backgroundColor: accentFill(c, o.accent), alignItems: 'center', justifyContent: 'center' }}>
                    <Txt style={{ fontFamily: fonts.label, fontSize: 10, color: o.accent === 'mustard' ? '#1C1A17' : '#F3ECDD' }} maxFontSizeMultiplier={1}>
                      {o.short}
                    </Txt>
                  </View>
                  <Txt v="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
                    {o.name} {o.verified ? '✓' : ''}
                  </Txt>
                </Pressable>
                <Chip small label={on ? 'Following' : 'Follow'} active={on} onPress={() => toggleFollow(o.id)} accent="ivy" />
              </View>
            );
          })}
        </View>

        {submissions.length > 0 && (
          <>
            <SectionHeader title="Your submissions" />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {submissions.map((s) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: c.lineStrong,
                    padding: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyBold">{s.title}</Txt>
                    <Txt v="caption" muted>
                      {s.category} · submitted {new Date(s.submittedAt).toLocaleDateString()}
                    </Txt>
                  </View>
                  <Stamp kind="pending" />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={{ paddingHorizontal: 20 }}>
          <ToggleRow
            icon="bell"
            label="Thursday Weekend Drop"
            hint="A digest of the weekend, every Thursday at 4pm"
            value={prefs.notif.weekendDrop}
            onChange={(v) => setPrefs({ notif: { ...prefs.notif, weekendDrop: v } })}
          />
          <ToggleRow
            icon="users"
            label="Friends going"
            hint="When 2+ friends RSVP to the same thing"
            value={prefs.notif.friendsGoing}
            onChange={(v) => setPrefs({ notif: { ...prefs.notif, friendsGoing: v } })}
          />
          <ToggleRow
            icon="clock"
            label="Saved event reminders"
            hint="Two hours before"
            value={prefs.notif.reminders}
            onChange={(v) => setPrefs({ notif: { ...prefs.notif, reminders: v } })}
          />
        </View>

        {/* Settings */}
        <SectionHeader title="Settings" />
        <View style={{ paddingHorizontal: 20 }}>
          <Txt v="label" style={{ marginBottom: 8 }}>
            Theme
          </Txt>
          <Segmented
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'paper', label: 'Paper' },
              { value: 'afterDark', label: 'After dark' },
            ]}
          />
          <Txt v="label" style={{ marginTop: 14, marginBottom: 8 }}>
            Text size
          </Txt>
          <Segmented<'1' | '1.15' | '1.3'>
            value={String(prefs.textScale) as '1' | '1.15' | '1.3'}
            onChange={(v) => setPrefs({ textScale: Number(v) as 1 | 1.15 | 1.3 })}
            options={[
              { value: '1', label: 'Aa' },
              { value: '1.15', label: 'Aa+' },
              { value: '1.3', label: 'Aa++' },
            ]}
          />
          <Txt v="caption" muted style={{ marginTop: 6 }}>
            Also follows iOS Dynamic Type.
          </Txt>
          <ToggleRow
            icon="refresh"
            label="Reduce motion"
            hint="Fewer stamp and card animations"
            value={prefs.reduceMotion}
            onChange={(reduceMotion) => setPrefs({ reduceMotion })}
          />
          <ToggleRow icon="music" label="Sounds" hint="Card shuffle and stamp sounds" value={prefs.sounds} onChange={(sounds) => setPrefs({ sounds })} />
          <ToggleRow
            icon="megaphone"
            label="Pitch Mode"
            hint="Student · Local · Visitor switch in the header for demos (or long-press the logo)"
            value={prefs.pitchMode}
            onChange={() => togglePitchMode(prefs, setPrefs)}
          />
          <Txt v="label" style={{ marginTop: 8, marginBottom: 8 }}>
            Demo clock
          </Txt>
          <Segmented<'live' | 'fri' | 'sat' | 'tue'>
            value={demoKind}
            onChange={(k) => {
              setPrefs({ demoTime: k === 'live' ? null : demoPreset(k) });
              toast(k === 'live' ? 'Demo clock off: showing the real time.' : `Demo clock set to ${DEMO_LABEL[k]}.`);
            }}
            options={[
              { value: 'live', label: 'Live' },
              { value: 'fri', label: DEMO_LABEL.fri },
              { value: 'sat', label: DEMO_LABEL.sat },
              { value: 'tue', label: DEMO_LABEL.tue },
            ]}
          />
          <Txt v="caption" muted style={{ marginTop: 6 }}>
            Pins the sample schedule to one moment. The shared web link starts everyone on Friday 6:30pm; add ?clock=tue (or sat, live) to the link to start somewhere else.
          </Txt>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 10, marginTop: 20 }}>
          <Button kind="secondary" icon="plus" label="Add something to the guide" onPress={() => router.push('/submit')} />
          <Button kind="secondary" icon="chart" label="Partner Portal (demo)" onPress={() => router.push('/partner')} />
          {confirmReset ? (
            <View style={{ borderWidth: 1.5, borderColor: c.brick, padding: 12, gap: 10 }}>
              <Txt v="bodySm">Reset everything? This clears your profile, saves, stamps and plans on this phone.</Txt>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button small kind="secondary" label="Cancel" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
                <Button small label="Reset" onPress={() => app.resetAll()} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Button kind="ghost" label="Reset demo & restart onboarding" onPress={() => setConfirmReset(true)} />
          )}
        </View>

        <View
          style={{
            marginTop: 28,
            marginHorizontal: 20,
            paddingTop: 14,
            borderTopWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: c.line,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Txt v="labelSm" muted>
            Prototype — sample data
          </Txt>
          <Txt v="caption" muted center>
            Events, prices, lineups, hours and deals are illustrative. Out in Athens v0.1.
          </Txt>
        </View>
      </ScrollView>
    </Paper>
  );
}
