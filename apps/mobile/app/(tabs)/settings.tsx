import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '~/components/Card';
import { getApiUrl } from '~/lib/api-url';

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-base">
      <View className="px-6 pb-3 pt-4">
        <Text className="text-display font-semibold text-text-primary">Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}>
        <Card>
          <Text className="text-caption uppercase text-text-tertiary">API URL</Text>
          <Text className="mt-1 font-mono text-mono text-text-primary">{getApiUrl()}</Text>
        </Card>
        <Card>
          <Text className="text-caption uppercase text-text-tertiary">Version</Text>
          <Text className="mt-1 text-body text-text-primary">0.1.0 · Sprint 1</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
