import { View } from 'react-native';

import { getFriend } from '@/services/dataService';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Txt } from './ui';

export function Avatar({ initials, color, size = 28, ring }: { initials: string; color: string; size?: number; ring?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}
    >
      <Txt
        size={size * 0.38}
        color={color === palette.mustard ? palette.ink : palette.paper}
        style={{ fontFamily: fonts.label, letterSpacing: 0.5 }}
        maxFontSizeMultiplier={1}
      >
        {initials}
      </Txt>
    </View>
  );
}

export function FriendStack({ ids, size = 24, label = true }: { ids: string[]; size?: number; label?: boolean }) {
  const { c } = useTheme();
  const friends = ids.map(getFriend).filter(Boolean);
  if (!friends.length) return null;
  const names = friends.map((f) => f!.name.split(' ')[0]);
  const text = friends.length === 1 ? `${names[0]} is going` : `${names[0]} + ${friends.length - 1} friend${friends.length > 2 ? 's' : ''} going`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel={text}>
      <View style={{ flexDirection: 'row' }}>
        {friends.slice(0, 4).map((f, i) => (
          <View key={f!.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
            <Avatar initials={f!.initials} color={f!.color} size={size} ring={c.surface} />
          </View>
        ))}
      </View>
      {label && (
        <Txt v="caption" muted numberOfLines={1}>
          {text}
        </Txt>
      )}
    </View>
  );
}
