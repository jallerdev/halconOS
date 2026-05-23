import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  children: ReactNode;
  variant?: 'default' | 'glass';
};

export function Card({ children, variant = 'default', className = '', ...rest }: Props & { className?: string }) {
  const base = 'rounded-2xl border border-border-subtle p-4';
  const bg = variant === 'glass' ? 'bg-white/[0.02]' : 'bg-bg-raised';
  return (
    <View className={`${base} ${bg} ${className}`} {...rest}>
      {children}
    </View>
  );
}
