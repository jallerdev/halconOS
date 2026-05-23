import { Text, View } from 'react-native';

import type { LeadStatus, ProjectStatus, TaskStatus } from '@halcon-os/shared/enums';

type Status = LeadStatus | ProjectStatus | TaskStatus;

const TONE: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: 'bg-status-info/10', fg: 'text-status-info' },
  CONTACTED: { bg: 'bg-status-info/10', fg: 'text-status-info' },
  QUALIFIED: { bg: 'bg-accent-soft', fg: 'text-accent' },
  PROPOSAL_SENT: { bg: 'bg-accent-soft', fg: 'text-accent' },
  NEGOTIATION: { bg: 'bg-status-warning/10', fg: 'text-status-warning' },
  WON: { bg: 'bg-status-success/10', fg: 'text-status-success' },
  LOST: { bg: 'bg-status-danger/10', fg: 'text-status-danger' },
  PLANNING: { bg: 'bg-status-info/10', fg: 'text-status-info' },
  IN_PROGRESS: { bg: 'bg-accent-soft', fg: 'text-accent' },
  REVIEW: { bg: 'bg-status-warning/10', fg: 'text-status-warning' },
  DELIVERED: { bg: 'bg-status-success/10', fg: 'text-status-success' },
  ON_HOLD: { bg: 'bg-text-tertiary/10', fg: 'text-text-tertiary' },
  CANCELLED: { bg: 'bg-status-danger/10', fg: 'text-status-danger' },
  TODO: { bg: 'bg-text-tertiary/10', fg: 'text-text-tertiary' },
  DOING: { bg: 'bg-accent-soft', fg: 'text-accent' },
  DONE: { bg: 'bg-status-success/10', fg: 'text-status-success' },
};

export function StatusPill({ status }: { status: Status }) {
  const tone = TONE[status] ?? TONE.NEW!;
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${tone.bg}`}>
      <Text className={`text-caption uppercase tracking-wide ${tone.fg}`}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}
