import { Pressable, ScrollView, Text } from 'react-native';

import { LEAD_STATUS, type LeadStatus } from '@agency-os/shared/enums';
import { haptics } from '~/lib/haptics';

type Filter = LeadStatus | 'ALL';
const OPTIONS: Filter[] = ['ALL', ...LEAD_STATUS];

const LABEL: Record<Filter, string> = {
  ALL: 'Todos',
  NEW: 'Nuevos',
  CONTACTED: 'Contactados',
  QUALIFIED: 'Calificados',
  PROPOSAL_SENT: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganados',
  LOST: 'Perdidos',
};

type Props = {
  value: Filter;
  onChange: (v: Filter) => void;
};

export function StatusFilterChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {OPTIONS.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => {
              haptics.tap();
              onChange(opt);
            }}
            className={`rounded-full border px-3 py-1.5 ${
              active
                ? 'border-accent bg-accent-soft'
                : 'border-border-subtle bg-bg-raised'
            }`}
          >
            <Text
              className={`text-bodySm font-medium ${
                active ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              {LABEL[opt]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
