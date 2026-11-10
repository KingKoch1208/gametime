import { Tabs, type BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/ui';
import { haptic } from '@/lib/feedback';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Now', icon: 'bolt' },
  events: { label: 'Events', icon: 'ticket' },
  map: { label: 'Map', icon: 'map' },
  explore: { label: 'Explore', icon: 'compass' },
  food: { label: 'Food', icon: 'bowl' },
};

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: c.bg,
        borderTopWidth: 1.5,
        borderColor: c.lineStrong,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
      }}
    >
      {state.routes.map((route, i) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === i;
        const isMap = route.name === 'map';
        const onPress = () => {
          haptic.tap();
          if (!focused) navigateToTab(route.key);
        };
        if (isMap) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel="Map"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center' }}
            >
              <View
                style={{
                  marginTop: -26,
                  width: 62,
                  height: 62,
                  borderRadius: 31,
                  backgroundColor: focused ? c.brickFill : c.inkFill,
                  borderWidth: 3,
                  borderColor: dark ? c.lineStrong : c.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: palette.ink,
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  transform: [{ rotate: '-4deg' }],
                }}
              >
                <Icon name="map" color={palette.paper} size={28} />
              </View>
              <Txt v="labelSm" size={10.5} color={focused ? c.brick : c.textMuted} style={{ marginTop: 2 }}>
                Map
              </Txt>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', paddingTop: 4, gap: 3 }}
          >
            <Icon name={meta.icon} color={focused ? c.brick : c.textMuted} size={24} strokeWidth={focused ? 2.2 : 1.8} />
            <Txt v="labelSm" size={10.5} color={focused ? c.brick : c.textMuted}>
              {meta.label}
            </Txt>
            {focused && <View style={{ position: 'absolute', top: -7, width: 22, height: 3, backgroundColor: c.brick }} />}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="food" />
    </Tabs>
  );
}
