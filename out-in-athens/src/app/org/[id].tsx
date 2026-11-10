// ORG PAGE — partner / club profile, follow button, upcoming events.
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/misc';
import { Stamp } from '@/components/Stamp';
import { TicketCard } from '@/components/TicketCard';
import { Button, Paper, Txt } from '@/components/ui';
import { accessFor } from '@/lib/access';
import { haptic } from '@/lib/feedback';
import { getEventsByOrg, getOrg } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, onAccent } from '@/theme/tokens';

export default function OrgScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const o = getOrg(id);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { following, toggleFollow, viewer } = useApp();
  if (!o) return <EmptyState title="Org not found" />;
  const on = following.includes(o.id);
  const fill = accentFill(c, o.accent);
  const fg = onAccent(o.accent);
  const now = new Date();
  const events = getEventsByOrg(o.id)
    .map((e) => ({ e, acc: accessFor(e, viewer) }))
    .filter((x) => x.acc.visible);
  const hidden = getEventsByOrg(o.id).length - events.length;

  return (
    <Paper>
      <StackHeader title={o.kind === 'club' ? 'Club' : 'Partner'} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ backgroundColor: fill, padding: 22, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderWidth: 2,
                borderColor: fg,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-4deg' }],
              }}
            >
              <Txt style={{ fontFamily: fonts.label, fontSize: 16, letterSpacing: 1, color: fg }} maxFontSizeMultiplier={1}>
                {o.short}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 28, lineHeight: 30, color: fg }} accessibilityRole="header">
                {o.name}
              </Txt>
              <Txt v="caption" color={fg} style={{ opacity: 0.85 }}>
                {(o.followers + (on ? 1 : 0)).toLocaleString()} followers
              </Txt>
            </View>
          </View>
          {o.verified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="check" color={fg} size={16} strokeWidth={2.4} />
              <Txt v="labelSm" color={fg}>
                Verified partner
              </Txt>
            </View>
          )}
        </View>
        <View style={{ padding: 20, gap: 14 }}>
          <Txt v="body">{o.description}</Txt>
          <Button
            kind={on ? 'secondary' : 'primary'}
            icon={on ? 'check' : 'plus'}
            label={on ? 'Following' : 'Follow'}
            onPress={() => {
              toggleFollow(o.id);
              if (!on) haptic.success();
            }}
          />
          <Txt v="label" style={{ marginTop: 10 }}>
            Upcoming
          </Txt>
          {events.length ? (
            events.map(({ e, acc }) => <TicketCard key={e.id} event={e} acc={acc} now={now} />)
          ) : (
            <Txt v="bodySm" muted>
              Nothing on the calendar right now.
            </Txt>
          )}
          {hidden > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Stamp kind="lock" text={`${hidden} UGA-only`} animate={false} />
              <Txt v="caption" muted>
                hidden in your Access Mode
              </Txt>
            </View>
          )}
        </View>
      </ScrollView>
    </Paper>
  );
}
