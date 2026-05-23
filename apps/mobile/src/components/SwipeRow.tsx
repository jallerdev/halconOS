import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '~/lib/haptics';

type Props = {
  children: ReactNode;
  onSwipe: () => void;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  threshold?: number;
};

const ACTION_W = 88;

export function SwipeRow({
  children,
  onSwipe,
  actionLabel = 'Next',
  actionIcon = 'arrow-forward',
  threshold = 80,
}: Props) {
  const tx = useSharedValue(0);
  const triggered = useSharedValue(false);

  const trigger = () => {
    haptics.pressMedium();
    onSwipe();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const dx = Math.min(0, e.translationX); // solo swipe izquierda
      tx.value = dx;
      if (-dx > threshold && !triggered.value) {
        triggered.value = true;
        runOnJS(haptics.tap)();
      } else if (-dx <= threshold && triggered.value) {
        triggered.value = false;
      }
    })
    .onEnd(() => {
      if (-tx.value > threshold) {
        runOnJS(trigger)();
      }
      tx.value = withSpring(0, { damping: 18, stiffness: 220 });
      triggered.value = false;
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const actionStyle = useAnimatedStyle(() => {
    const passed = -tx.value > threshold;
    return {
      opacity: withTiming(Math.min(1, -tx.value / threshold), { duration: 80 }),
      backgroundColor: passed ? '#7C5CFF' : '#27272A',
    };
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.action, actionStyle]}>
        <Ionicons name={actionIcon} size={20} color="#FAFAFA" />
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
  },
  action: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FAFAFA',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
