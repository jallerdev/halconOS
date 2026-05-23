import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Card } from '~/components/Card';
import { StatusPill } from '~/components/StatusPill';
import { haptics } from '~/lib/haptics';

type Props = {
  id: string;
  businessName: string;
  contactName: string | null;
  status: import('@halcon-os/shared/enums').LeadStatus;
  estimatedValue: string | null;
  phone: string | null;
};

export function LeadCard({ id, businessName, contactName, status, estimatedValue, phone }: Props) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        router.push(`/lead/${id}` as Href);
      }}
    >
      <Card>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-h2 font-semibold text-text-primary" numberOfLines={1}>
              {businessName}
            </Text>
            {contactName ? (
              <Text className="mt-1 text-bodySm text-text-secondary" numberOfLines={1}>
                {contactName}
              </Text>
            ) : null}
          </View>
          <StatusPill status={status} />
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          {estimatedValue ? (
            <Text className="font-mono text-mono text-text-primary">${estimatedValue}</Text>
          ) : (
            <Text className="text-bodySm text-text-tertiary">Sin valor</Text>
          )}
          {phone ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="call-outline" size={12} color="#71717A" />
              <Text className="text-bodySm text-text-tertiary">{phone}</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
