import BottomSheet, { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';

import { Sheet } from '~/components/Sheet';
import { haptics } from '~/lib/haptics';
import { trpc } from '~/lib/trpc';

type Props = {
  sheetRef: React.RefObject<BottomSheet | null>;
};

export function QuickAddLead({ sheetRef }: Props) {
  const utils = trpc.useUtils();
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createLead = trpc.leads.create.useMutation({
    onSuccess: async () => {
      await utils.leads.list.invalidate();
      haptics.success();
      setBusinessName('');
      setPhone('');
      setEstimatedValue('');
      Keyboard.dismiss();
      sheetRef.current?.close();
    },
    onError: () => haptics.error(),
    onSettled: () => setSubmitting(false),
  });

  const canSubmit = businessName.trim().length > 0 && !submitting;

  const onSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    createLead.mutate({
      businessName: businessName.trim(),
      phone: phone.trim() || null,
      estimatedValue: estimatedValue.trim() || null,
    });
  };

  return (
    <Sheet ref={sheetRef} snapPoints={['65%', '92%']}>
      <Text className="text-h1 font-semibold text-text-primary">Nuevo lead</Text>
      <Text className="mt-1 text-bodySm text-text-secondary">
        Lo esencial. Puedes completar el resto después.
      </Text>

      <View className="mt-6 gap-3">
        <Field label="Negocio" required>
          <BottomSheetTextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Ej. Tacos El Güero"
            placeholderTextColor="#52525B"
            returnKeyType="next"
            style={{
              paddingVertical: 12,
              color: '#FAFAFA',
              fontSize: 15,
              lineHeight: 22,
            }}
          />
        </Field>
        <Field label="Teléfono">
          <BottomSheetTextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+52 …"
            placeholderTextColor="#52525B"
            keyboardType="phone-pad"
            returnKeyType="next"
            style={{
              paddingVertical: 12,
              color: '#FAFAFA',
              fontSize: 15,
              lineHeight: 22,
            }}
          />
        </Field>
        <Field label="Valor estimado">
          <BottomSheetTextInput
            value={estimatedValue}
            onChangeText={setEstimatedValue}
            placeholder="0.00"
            placeholderTextColor="#52525B"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            style={{
              paddingVertical: 12,
              color: '#FAFAFA',
              fontSize: 14,
              lineHeight: 20,
              fontFamily: 'JetBrainsMono_500Medium',
            }}
          />
        </Field>
      </View>

      <Pressable
        disabled={!canSubmit}
        onPress={onSubmit}
        className={`mt-6 items-center justify-center rounded-2xl py-4 ${
          canSubmit ? 'bg-accent' : 'bg-bg-hover'
        }`}
      >
        <Text className="text-body font-semibold text-text-primary">
          {submitting ? 'Guardando…' : 'Crear lead'}
        </Text>
      </Pressable>
    </Sheet>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border-subtle bg-bg-inset px-4">
      <Text className="mt-2 text-caption uppercase tracking-wide text-text-tertiary">
        {label}
        {required ? ' *' : ''}
      </Text>
      {children}
    </View>
  );
}
