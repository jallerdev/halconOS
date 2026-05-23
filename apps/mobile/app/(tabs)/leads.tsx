import { Ionicons } from '@expo/vector-icons';
import type BottomSheet from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '~/components/EmptyState';
import { FAB } from '~/components/FAB';
import { SwipeRow } from '~/components/SwipeRow';
import { LeadCard } from '~/features/leads/LeadCard';
import { QuickAddLead } from '~/features/leads/QuickAddLead';
import { StatusFilterChips } from '~/features/leads/StatusFilterChips';
import { isTerminal, nextLeadStatus } from '~/features/leads/status';
import { useDebounced } from '~/hooks/use-debounced';
import { haptics } from '~/lib/haptics';
import { trpc } from '~/lib/trpc';
import { useLeadsUI } from '~/stores/leads-ui';

export default function LeadsScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const [refreshing, setRefreshing] = useState(false);

  const statusFilter = useLeadsUI((s) => s.statusFilter);
  const setStatusFilter = useLeadsUI((s) => s.setStatusFilter);
  const search = useLeadsUI((s) => s.search);
  const setSearch = useLeadsUI((s) => s.setSearch);
  const debouncedSearch = useDebounced(search, 250);

  const utils = trpc.useUtils();
  const { data, isLoading, error, refetch } = trpc.leads.list.useQuery();

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onMutate: async (input) => {
      await utils.leads.list.cancel();
      const prev = utils.leads.list.getData();
      utils.leads.list.setData(undefined, (old) =>
        old?.map((l) => (l.id === input.id ? { ...l, status: input.status } : l)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.leads.list.setData(undefined, ctx.prev);
      haptics.error();
    },
    onSuccess: () => haptics.success(),
    onSettled: () => utils.leads.list.invalidate(),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = debouncedSearch.trim().toLowerCase();
    return data.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.businessName.toLowerCase().includes(q) ||
        (l.contactName ?? '').toLowerCase().includes(q) ||
        (l.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, statusFilter, debouncedSearch]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.tap();
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-base">
      <View className="px-6 pb-2 pt-4">
        <Text className="text-display font-semibold text-text-primary">Leads</Text>
        <Text className="mt-1 text-bodySm text-text-secondary">
          {data?.length ?? 0} en pipeline · {filtered.length} visibles
        </Text>
      </View>

      <View className="mx-4 mb-3 flex-row items-center rounded-2xl border border-border-subtle bg-bg-inset px-3">
        <Ionicons name="search" size={16} color="#71717A" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar negocio, contacto…"
          placeholderTextColor="#52525B"
          className="ml-2 flex-1 text-body text-text-primary"
          style={{ paddingVertical: 10 }}
        />
        {search.length > 0 ? (
          <Ionicons
            name="close-circle"
            size={16}
            color="#71717A"
            onPress={() => setSearch('')}
          />
        ) : null}
      </View>

      <View className="mb-2">
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C5CFF" />
        </View>
      ) : error ? (
        <EmptyState title="Error de conexión" body={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={data?.length === 0 ? 'Sin leads todavía' : 'Sin resultados'}
          body={
            data?.length === 0
              ? 'Toca el botón + para agregar tu primer prospecto.'
              : 'Ajusta el filtro o la búsqueda.'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C5CFF" />
          }
          renderItem={({ item }) => {
            const canAdvance = !isTerminal(item.status);
            const node = (
              <LeadCard
                id={item.id}
                businessName={item.businessName}
                contactName={item.contactName}
                status={item.status}
                estimatedValue={item.estimatedValue}
                phone={item.phone}
              />
            );
            if (!canAdvance) return node;
            return (
              <SwipeRow
                onSwipe={() =>
                  updateStatus.mutate({ id: item.id, status: nextLeadStatus(item.status) })
                }
              >
                {node}
              </SwipeRow>
            );
          }}
        />
      )}

      <FAB onPress={() => sheetRef.current?.expand()} />
      <QuickAddLead sheetRef={sheetRef} />
    </SafeAreaView>
  );
}
