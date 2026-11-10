import { Pressable, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { LatLng } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';
import type { IconName } from './Icon';
import { Pin, type PinColor } from './MapPins';
import { Txt } from './ui';

export function MiniMap({
  coords,
  icon,
  color,
  onPress,
  label,
  locked,
}: {
  coords: LatLng;
  icon: IconName;
  color: PinColor;
  onPress?: () => void;
  label: string;
  locked?: boolean;
}) {
  const { c, dark } = useTheme();
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      accessibilityRole={locked ? undefined : 'button'}
      accessibilityLabel={locked ? `Map: ${label}. UGA ID required.` : `Map: ${label}. Tap for directions.`}
    >
      <View style={{ height: 150, borderWidth: 1.5, borderColor: c.lineStrong, overflow: 'hidden' }} pointerEvents="none">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ ...coords, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsPointsOfInterests={false}
          userInterfaceStyle={dark ? 'dark' : 'light'}
        >
          <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }}>
            <Pin icon={icon} color={color} />
          </Marker>
        </MapView>
        {!locked && (
          <View
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              backgroundColor: c.bg,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: c.lineStrong,
            }}
          >
            <Txt v="labelSm">Directions →</Txt>
          </View>
        )}
      </View>
    </Pressable>
  );
}
