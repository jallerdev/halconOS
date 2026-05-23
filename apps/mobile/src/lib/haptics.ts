import * as Haptics from 'expo-haptics';

export const haptics = {
  tap: () => Haptics.selectionAsync(),
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  pressMedium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  pressHeavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
