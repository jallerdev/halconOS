import { Text, View } from 'react-native';

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-12 w-12 rounded-2xl border border-border-subtle bg-bg-raised" />
      <Text className="mt-6 text-h2 font-semibold text-text-primary">{title}</Text>
      {body ? (
        <Text className="mt-2 text-center text-body text-text-secondary">{body}</Text>
      ) : null}
    </View>
  );
}
