import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '~/components/Card';
import { EmptyState } from '~/components/EmptyState';
import { StatusPill } from '~/components/StatusPill';
import { trpc } from '~/lib/trpc';

export default function ProjectsScreen() {
  const { data, isLoading, error } = trpc.projects.list.useQuery();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-base">
      <View className="px-6 pb-3 pt-4">
        <Text className="text-display font-semibold text-text-primary">Projects</Text>
        <Text className="mt-1 text-bodySm text-text-secondary">
          {data?.length ?? 0} activos
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C5CFF" />
        </View>
      ) : error ? (
        <EmptyState title="Error de conexión" body={error.message} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          body="Convierte un lead ganado para empezar a ejecutar."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}
        >
          {data.map((p) => (
            <Card key={p.id}>
              <View className="flex-row items-start justify-between">
                <Text className="text-h2 font-semibold text-text-primary">{p.name}</Text>
                <StatusPill status={p.status} />
              </View>
              <Text className="mt-3 font-mono text-mono text-text-primary">${p.amount}</Text>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
