import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { Card } from '~/components/Card';
import { haptics } from '~/lib/haptics';
import { trpc } from '~/lib/trpc';

export function NotesSection({ leadId }: { leadId: string }) {
  const utils = trpc.useUtils();
  const queryKey = { parentType: 'lead' as const, parentId: leadId };
  const { data } = trpc.notes.listByParent.useQuery(queryKey);

  const [draft, setDraft] = useState('');

  const create = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.listByParent.invalidate(queryKey);
      haptics.tap();
      setDraft('');
    },
    onError: () => haptics.error(),
  });

  const del = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.listByParent.invalidate(queryKey);
      haptics.tap();
    },
  });

  const onAdd = () => {
    const body = draft.trim();
    if (!body) return;
    create.mutate({ parentType: 'lead', parentId: leadId, body });
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Borrar nota', '¿Seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => del.mutate({ id }) },
    ]);
  };

  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-border-subtle bg-bg-inset px-4 py-3">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe una nota…"
          placeholderTextColor="#52525B"
          multiline
          className="text-body text-text-primary"
          style={{ minHeight: 60, textAlignVertical: 'top' }}
        />
        <View className="mt-2 flex-row justify-end">
          <Pressable
            disabled={draft.trim().length === 0 || create.isPending}
            onPress={onAdd}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
              draft.trim().length === 0 ? 'bg-bg-hover' : 'bg-accent'
            }`}
          >
            <Ionicons name="add" size={14} color="#FAFAFA" />
            <Text className="text-bodySm font-medium text-text-primary">Agregar</Text>
          </Pressable>
        </View>
      </View>

      {data?.length === 0 ? (
        <Text className="px-1 text-center text-bodySm text-text-tertiary">
          Sin notas todavía.
        </Text>
      ) : (
        data?.map((n) => (
          <Card key={n.id}>
            <Text className="text-body text-text-primary">{n.body}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-caption uppercase text-text-tertiary">
                {new Date(n.createdAt).toLocaleString()}
              </Text>
              <Pressable onPress={() => confirmDelete(n.id)} hitSlop={12}>
                <Ionicons name="trash-outline" size={16} color="#71717A" />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}
