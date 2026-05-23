import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LEAD_STATUS, type LeadStatus } from '@halcon-os/shared/enums';
import { Card } from '~/components/Card';
import { StatusPill } from '~/components/StatusPill';
import { NotesSection } from '~/features/leads/NotesSection';
import { haptics } from '~/lib/haptics';
import { trpc } from '~/lib/trpc';

type Tab = 'details' | 'notes';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.leads.byId.useQuery({ id });
  const [tab, setTab] = useState<Tab>('details');

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.leads.byId.invalidate({ id });
      await utils.leads.list.invalidate();
      haptics.success();
    },
    onError: () => haptics.error(),
  });

  const del = trpc.leads.delete.useMutation({
    onSuccess: async () => {
      await utils.leads.list.invalidate();
      haptics.success();
      router.back();
    },
    onError: () => haptics.error(),
  });

  const onPickStatus = () => {
    if (!data) return;
    Alert.alert(
      'Cambiar status',
      'Selecciona el nuevo estado del lead',
      LEAD_STATUS.filter((s) => s !== data.status)
        .map((s) => ({
          text: s.replace(/_/g, ' '),
          onPress: () => updateStatus.mutate({ id, status: s as LeadStatus }),
        }))
        .concat([{ text: 'Cancelar', onPress: () => {} }]),
    );
  };

  const onDelete = () =>
    Alert.alert('Borrar lead', 'Se borrarán también sus notas. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => del.mutate({ id }) },
    ]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg-base">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Pressable
          onPress={() => {
            haptics.tap();
            router.back();
          }}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-bg-raised"
        >
          <Ionicons name="chevron-back" size={20} color="#FAFAFA" />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={12}>
          <Ionicons name="trash-outline" size={18} color="#71717A" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C5CFF" />
        </View>
      ) : error || !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body text-text-secondary">
            {error?.message ?? 'Lead no encontrado'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <View className="px-2 pb-4 pt-2">
            <Pressable onPress={onPickStatus} className="self-start">
              <StatusPill status={data.status} />
            </Pressable>
            <Text className="mt-3 text-display font-semibold text-text-primary">
              {data.businessName}
            </Text>
            {data.contactName ? (
              <Text className="mt-1 text-body text-text-secondary">{data.contactName}</Text>
            ) : null}
          </View>

          <View className="mb-4 flex-row gap-3">
            {data.phone ? (
              <ActionButton
                icon="call"
                label="Llamar"
                onPress={() => Linking.openURL(`tel:${data.phone}`)}
              />
            ) : null}
            {data.phone ? (
              <ActionButton
                icon="logo-whatsapp"
                label="WhatsApp"
                onPress={() =>
                  Linking.openURL(`https://wa.me/${data.phone!.replace(/[^\d]/g, '')}`)
                }
              />
            ) : null}
            {data.email ? (
              <ActionButton
                icon="mail"
                label="Email"
                onPress={() => Linking.openURL(`mailto:${data.email}`)}
              />
            ) : null}
          </View>

          <View className="mb-4 flex-row gap-2 rounded-2xl border border-border-subtle bg-bg-inset p-1">
            <TabButton active={tab === 'details'} onPress={() => setTab('details')} label="Detalles" />
            <TabButton active={tab === 'notes'} onPress={() => setTab('notes')} label="Notas" />
          </View>

          {tab === 'details' ? (
            <View className="gap-3">
              <InfoRow label="Valor estimado" value={data.estimatedValue ? `$${data.estimatedValue}` : '—'} mono />
              <InfoRow label="Teléfono" value={data.phone ?? '—'} />
              <InfoRow label="Email" value={data.email ?? '—'} />
              <InfoRow label="Fuente" value={data.source ?? '—'} />
              <InfoRow
                label="Follow-up"
                value={
                  data.nextFollowUpAt
                    ? new Date(data.nextFollowUpAt).toLocaleString()
                    : 'Sin programar'
                }
              />
              <InfoRow
                label="Creado"
                value={new Date(data.createdAt).toLocaleDateString()}
              />
            </View>
          ) : (
            <NotesSection leadId={data.id} />
          )}
        </ScrollView>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.press();
        onPress();
      }}
      className="flex-1 items-center gap-1 rounded-2xl border border-border-subtle bg-bg-raised px-3 py-3"
    >
      <Ionicons name={icon} size={18} color="#FAFAFA" />
      <Text className="text-bodySm text-text-secondary">{label}</Text>
    </Pressable>
  );
}

function TabButton({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-bg-raised' : ''}`}
    >
      <Text
        className={`text-bodySm font-medium ${active ? 'text-text-primary' : 'text-text-tertiary'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Card>
      <Text className="text-caption uppercase tracking-wide text-text-tertiary">{label}</Text>
      <Text
        className={`mt-1 ${mono ? 'font-mono text-mono' : 'text-body'} text-text-primary`}
      >
        {value}
      </Text>
    </Card>
  );
}
