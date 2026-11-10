import { Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Icon } from './Icon';

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { c, scale } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: c.lineStrong,
        backgroundColor: c.surface,
        paddingHorizontal: 12,
        minHeight: 44,
      }}
    >
      <Icon name="search" color={c.textMuted} size={18} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        style={{ flex: 1, fontFamily: fonts.body, fontSize: 15 * scale, color: c.text, paddingVertical: 10 }}
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={12} onPress={() => onChange('')}>
          <Icon name="close" color={c.textMuted} size={16} />
        </Pressable>
      )}
    </View>
  );
}
