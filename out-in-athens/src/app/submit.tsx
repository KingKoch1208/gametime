// ADD SOMETHING — student / local / partner submissions. Goes to "Pending review".
// TODO: backend — moderation queue. Submissions should land in a review table,
// get auto-checked (duplicates, spam, access level sanity), then a human or
// trusted-partner approval before they appear in public feeds.
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Pin } from '@/components/MapPins';
import { Stamp } from '@/components/Stamp';
import { Button, Chip, Paper, Txt } from '@/components/ui';
import type { Access, EventCategory, LatLng } from '@/data/types';
import { ACCESS_LABEL } from '@/lib/access';
import { haptic, sound } from '@/lib/feedback';
import { MOCK_ME } from '@/lib/geo';
import { addDays, DAY_SHORT, fmtHour, startOfDay } from '@/lib/time';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

const CATS: EventCategory[] = ['concerts', 'sports', 'shows', 'campus', 'community', 'outdoors', 'arts', 'volunteer'];
const ACCESS: Access[] = ['open', 'uga_id', 'uga_guest_ok', '18+', '21+', 'ticketed'];

export default function SubmitScreen() {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { partner } = useLocalSearchParams<{ partner?: string }>();
  const { addSubmission, profile } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('community');
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(19);
  const [coords, setCoords] = useState<LatLng>(MOCK_ME);
  const [price, setPrice] = useState('');
  const [access, setAccess] = useState<Access>(profile.mode === 'student' ? 'open' : 'open');
  const [photo, setPhoto] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const now = new Date();

  const pickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [4, 3] });
      if (!res.canceled) setPhoto(res.assets[0].uri);
    } catch {
      // Permission denied or unavailable — fine for a prototype.
    }
  };

  const submit = () => {
    addSubmission({
      id: `sub-${Date.now()}`,
      title: title.trim(),
      category,
      dayOffset: day,
      hour,
      coords,
      price: Number(price) || 0,
      access,
      photoUri: photo,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      asPartner: partner,
    });
    haptic.stamp();
    sound.stamp();
    setDone(true);
  };

  if (done) {
    return (
      <Paper>
        <StackHeader title="Submitted" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 }}>
          <Stamp kind="pending" size="lg" rotate={-8} />
          <Txt v="display" center>
            {title || 'Your listing'}
          </Txt>
          <Txt v="body" muted center>
            Thanks! It’s in the review pile. Most listings go live within a day once someone checks the details. You’ll see it in your profile under “Your
            submissions.”
          </Txt>
          <Button label="Back to Athens" onPress={() => router.back()} />
        </View>
      </Paper>
    );
  }

  return (
    <Paper>
      <StackHeader title={partner ? `Post as ${partner}` : 'Add something'} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Txt v="display">Post a flyer</Txt>
          <Txt v="bodySm" muted style={{ marginBottom: 18 }}>
            Shows, pickup games, markets, cleanups, club nights. If it’s not a bar crawl, it belongs here.
          </Txt>

          <Label text="Title" />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Porch show on Boulevard"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Title"
            style={{
              borderWidth: 1.5,
              borderColor: c.lineStrong,
              padding: 12,
              fontFamily: fonts.serif,
              fontSize: 18,
              color: c.text,
              backgroundColor: c.surface,
            }}
          />

          <Label text="Category" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATS.map((ct) => (
              <Chip key={ct} small label={ct} active={category === ct} onPress={() => setCategory(ct)} />
            ))}
          </View>

          <Label text="Date & time" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i)).map((d, i) => (
              <Chip
                key={i}
                small
                label={i === 0 ? 'Today' : `${DAY_SHORT[d.getDay()]} ${d.getDate()}`}
                active={day === i}
                onPress={() => setDay(i)}
                accent="ink"
              />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Earlier"
              onPress={() => setHour((h) => Math.max(6, h - 0.5))}
              style={{ width: 40, height: 40, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="minus" color={c.text} size={18} />
            </Pressable>
            <Txt v="title" style={{ minWidth: 90 }} center accessibilityLiveRegion="polite">
              {fmtHour(hour)}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Later"
              onPress={() => setHour((h) => Math.min(23.5, h + 0.5))}
              style={{ width: 40, height: 40, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" color={c.text} size={18} />
            </Pressable>
          </View>

          <Label text="Location — tap the map to drop a pin" />
          <View style={{ height: 180, borderWidth: 1.5, borderColor: c.lineStrong, overflow: 'hidden' }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={{ ...MOCK_ME, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
              onPress={(e) => {
                haptic.tap();
                setCoords(e.nativeEvent.coordinate);
              }}
              showsPointsOfInterests={false}
              userInterfaceStyle={dark ? 'dark' : 'light'}
            >
              <Marker coordinate={coords} draggable onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)} anchor={{ x: 0.5, y: 0.5 }}>
                <Pin icon="pin" color="brick" />
              </Marker>
            </MapView>
          </View>

          <Label text="Price (USD, 0 for free)" />
          <TextInput
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Price in dollars"
            style={{
              borderWidth: 1.5,
              borderColor: c.lineStrong,
              padding: 12,
              fontFamily: fonts.body,
              fontSize: 16,
              color: c.text,
              backgroundColor: c.surface,
              width: 120,
            }}
          />

          <Label text="Who can go?" />
          <View style={{ gap: 6 }}>
            {ACCESS.map((a) => (
              <Pressable
                key={a}
                accessibilityRole="radio"
                accessibilityState={{ selected: access === a }}
                onPress={() => setAccess(a)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: c.lineStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {access === a && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.brickFill }} />}
                </View>
                <Txt v="body">{ACCESS_LABEL[a]}</Txt>
              </Pressable>
            ))}
          </View>

          <Label text="Photo (optional)" />
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            style={{
              height: 120,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: c.lineStrong,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Icon name="camera" color={c.textMuted} size={28} />
                <Txt v="caption" muted>
                  Add a flyer or photo
                </Txt>
              </View>
            )}
          </Pressable>

          <Button label="Submit for review" icon="megaphone" disabled={title.trim().length < 3} onPress={submit} style={{ marginTop: 24 }} />
          <Txt v="caption" muted center style={{ marginTop: 8 }}>
            Everything is reviewed before it’s public. Wrong access levels get fixed or rejected.
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </Paper>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Txt v="label" style={{ marginTop: 20, marginBottom: 8 }}>
      {text}
    </Txt>
  );
}
