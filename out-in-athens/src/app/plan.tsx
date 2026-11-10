// MAKE A PLAN — pick friends, poll a time, see who's in. (Mock social.)
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatars';
import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/misc';
import { Stamp } from '@/components/Stamp';
import { Button, Paper, Sheet, Txt } from '@/components/ui';
import { haptic, sound } from '@/lib/feedback';
import { addDays, DAY_SHORT, fmtTime, relativeDay, startOfDay } from '@/lib/time';
import { getEvent, getFriend, getFriends, getPlace } from '@/services/dataService';
import { type Plan, useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

export default function PlanScreen() {
  const params = useLocalSearchParams<{ refType?: 'event' | 'place'; refId?: string; planId?: string }>();
  const { plans } = useApp();
  const existing = params.planId ? plans.find((p) => p.id === params.planId) : undefined;
  const [createdId, setCreatedId] = useState<string | null>(null);
  const created = createdId ? plans.find((p) => p.id === createdId) : undefined;
  const plan = existing ?? created;
  if (plan) return <PlanCard plan={plan} />;
  if (params.refType && params.refId) return <NewPlan refType={params.refType} refId={params.refId} onCreated={setCreatedId} />;
  return (
    <Paper>
      <StackHeader title="Plan" />
      <EmptyState icon="users" title="Pick something first" body="Open an event or a place and tap “Make a plan.”" />
    </Paper>
  );
}

function suggestTimes(refType: 'event' | 'place', refId: string): string[] {
  const now = new Date();
  if (refType === 'event') {
    const e = getEvent(refId);
    if (e) {
      const meet = new Date(e.start.getTime() - 30 * 60_000);
      return [`Meet ${fmtTime(meet)} before`, `Doors (${fmtTime(e.start)})`, 'Meet there'];
    }
  }
  const sat = addDays(startOfDay(now), (6 - now.getDay() + 7) % 7 || 7);
  return [now.getHours() < 18 ? 'Tonight 7pm' : 'Tomorrow 6pm', `${DAY_SHORT[sat.getDay()]} 11am`, `${DAY_SHORT[addDays(sat, 1).getDay()]} 2pm`];
}

function NewPlan({ refType, refId, onCreated }: { refType: 'event' | 'place'; refId: string; onCreated: (id: string) => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { addPlan } = useApp();
  const title = refType === 'event' ? getEvent(refId)?.title : getPlace(refId)?.name;
  const [invited, setInvited] = useState<string[]>([]);
  const options = suggestTimes(refType, refId);
  const [times, setTimes] = useState<string[]>(options.slice(0, 2));

  const create = () => {
    const id = `plan-${Date.now()}`;
    // Mock: friends "respond" right away so the demo has a shared card.
    const responses: Plan['responses'] = {};
    invited.forEach((f, i) => (responses[f] = i % 3 === 2 ? 'maybe' : i % 4 === 3 ? 'pending' : 'in'));
    const plan: Plan = {
      id,
      refType,
      refId,
      title: title ?? 'Plan',
      invited,
      times: times.map((t, i) => ({ label: t, votes: ['me', ...invited.filter((_, j) => (j + i) % 2 === 0)] })),
      responses,
      createdAt: new Date().toISOString(),
    };
    addPlan(plan);
    haptic.success();
    sound.stamp();
    onCreated(id);
  };

  return (
    <Paper>
      <StackHeader title="Make a plan" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <Txt v="labelSm" color={c.brick}>
          Planning
        </Txt>
        <Txt v="display">{title}</Txt>

        <Txt v="label" style={{ marginTop: 24, marginBottom: 10 }}>
          Invite friends
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {getFriends().map((f) => {
            const on = invited.includes(f.id);
            return (
              <Pressable
                key={f.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={f.name}
                onPress={() => {
                  haptic.tap();
                  setInvited((xs) => (on ? xs.filter((x) => x !== f.id) : [...xs, f.id]));
                }}
                style={{ alignItems: 'center', width: 70, opacity: on ? 1 : 0.55 }}
              >
                <View>
                  <Avatar initials={f.initials} color={f.color} size={52} ring={on ? c.brick : undefined} />
                  {on && (
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: c.brickFill,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="check" color={palette.paper} size={13} strokeWidth={2.6} />
                    </View>
                  )}
                </View>
                <Txt v="caption" center numberOfLines={1} style={{ marginTop: 4 }}>
                  {f.name.split(' ')[0]}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <Txt v="label" style={{ marginTop: 24, marginBottom: 10 }}>
          Poll a time
        </Txt>
        <View style={{ gap: 8 }}>
          {options.map((o) => {
            const on = times.includes(o);
            return (
              <Pressable
                key={o}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => setTimes((ts) => (on ? ts.filter((t) => t !== o) : [...ts, o]))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: c.lineStrong,
                  backgroundColor: on ? c.text : c.surface,
                }}
              >
                <Icon name="clock" color={on ? c.bg : c.text} size={18} />
                <Txt v="bodyBold" color={on ? c.bg : c.text}>
                  {o}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={invited.length ? `Send to ${invited.length} friend${invited.length > 1 ? 's' : ''}` : 'Pick at least one friend'}
          icon="users"
          disabled={!invited.length || !times.length}
          onPress={create}
          style={{ marginTop: 28 }}
        />
        <Txt v="caption" muted center style={{ marginTop: 8 }}>
          Prototype: friends are mock and reply instantly.
        </Txt>
      </ScrollView>
    </Paper>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { updatePlan } = useApp();
  const e = plan.refType === 'event' ? getEvent(plan.refId) : undefined;
  const p = plan.refType === 'place' ? getPlace(plan.refId) : undefined;
  const total = plan.invited.length + 1;
  const max = Math.max(1, ...plan.times.map((t) => t.votes.length));

  return (
    <Paper>
      <StackHeader title="Plan" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <Sheet style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Txt v="labelSm" color={c.brick}>
              Shared plan
            </Txt>
            <Stamp kind="verified" text={`${Object.values(plan.responses).filter((r) => r === 'in').length + 1} of ${total} in`} rotate={5} />
          </View>
          <Txt v="display" style={{ marginTop: 6 }}>
            {plan.title}
          </Txt>
          <Txt v="bodySm" muted>
            {e ? `${relativeDay(e.start, new Date())} · ${fmtTime(e.start)} · ${e.venue}` : p ? p.neighborhood : ''}
          </Txt>

          <Txt v="label" style={{ marginTop: 18, marginBottom: 8 }}>
            Who’s in
          </Txt>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar initials="ME" color={c.ivyFill} size={32} />
              <Txt v="bodyBold" style={{ flex: 1 }}>
                You (organizer)
              </Txt>
              <Stamp kind="free" text="In" animate={false} />
            </View>
            {plan.invited.map((id) => {
              const f = getFriend(id)!;
              const r = plan.responses[id] ?? 'pending';
              return (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={f.initials} color={f.color} size={32} />
                  <Txt v="bodyBold" style={{ flex: 1 }}>
                    {f.name}
                  </Txt>
                  <Stamp
                    kind={r === 'in' ? 'free' : r === 'maybe' ? 'guest' : 'lock'}
                    text={r === 'in' ? 'In' : r === 'maybe' ? 'Maybe' : 'No reply'}
                    animate={false}
                  />
                </View>
              );
            })}
          </View>

          <Txt v="label" style={{ marginTop: 18, marginBottom: 8 }}>
            Time poll
          </Txt>
          <View style={{ gap: 10 }}>
            {plan.times.map((t, i) => {
              const mine = t.votes.includes('me');
              return (
                <Pressable
                  key={t.label}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.label}, ${t.votes.length} votes${mine ? ', you voted' : ''}`}
                  onPress={() => {
                    haptic.tap();
                    updatePlan(plan.id, {
                      times: plan.times.map((x, j) => (j === i ? { ...x, votes: mine ? x.votes.filter((v) => v !== 'me') : [...x.votes, 'me'] } : x)),
                    });
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Txt v="bodyBold">
                      {mine ? '✓ ' : ''}
                      {t.label}
                    </Txt>
                    <Txt v="caption" muted>
                      {t.votes.length} vote{t.votes.length === 1 ? '' : 's'}
                    </Txt>
                  </View>
                  <View style={{ height: 10, borderWidth: 1.5, borderColor: c.lineStrong }}>
                    <View style={{ width: `${(t.votes.length / max) * 100}%`, height: '100%', backgroundColor: mine ? c.brickFill : c.mustard }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Sheet>

        <Button
          kind="secondary"
          icon="share"
          label="Share plan link"
          onPress={() => Share.share({ message: `Plan: ${plan.title}. Vote on a time in Out in Athens.` })}
          style={{ marginTop: 18 }}
        />
        <Button kind="ghost" label="Done" onPress={() => router.back()} style={{ marginTop: 6 }} />
      </ScrollView>
    </Paper>
  );
}
