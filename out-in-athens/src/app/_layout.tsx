import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold, Fraunces_600SemiBold_Italic, Fraunces_800ExtraBold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import { Oswald_500Medium, Oswald_600SemiBold } from '@expo-google-fonts/oswald';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PitchSwitch } from '@/components/misc';
import { setSoundsEnabled } from '@/lib/feedback';
import { AppStateProvider, useApp } from '@/state/AppState';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_800ExtraBold,
    Fraunces_900Black,
    Oswald_500Medium,
    Oswald_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ThemeProvider>
          <Root fontsLoaded={fontsLoaded} />
        </ThemeProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function Root({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, profile, prefs } = useApp();
  const { c, dark } = useTheme();

  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded]);

  useEffect(() => setSoundsEnabled(prefs.sounds), [prefs.sounds]);

  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={profile.onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="place/[id]" />
          <Stack.Screen name="guide/[id]" />
          <Stack.Screen name="org/[id]" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="passport" />
          <Stack.Screen name="partner" />
          <Stack.Screen name="bored" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="plan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="submit" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!profile.onboarded}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
      <PitchSwitch />
    </View>
  );
}
