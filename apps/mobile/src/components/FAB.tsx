import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '~/lib/haptics';

export function FAB({ onPress, icon = 'add' }: { onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => {
        haptics.press();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Crear lead"
      className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-accent"
      style={{
        bottom: insets.bottom + 76, // sobre la tab bar
        shadowColor: '#7C5CFF',
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <Ionicons name={icon} size={26} color="#FAFAFA" />
    </Pressable>
  );
}
