import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';

type Props = {
  children: ReactNode;
  snapPoints?: (string | number)[];
};

export const Sheet = forwardRef<BottomSheet, Props>(function Sheet(
  { children, snapPoints },
  ref,
) {
  const points = useMemo(() => snapPoints ?? ['55%', '92%'], [snapPoints]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={points}
      enablePanDownToClose
      // Mover el sheet con el teclado en lugar de quedar tapado.
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#3F3F46', width: 36, height: 4 }}
      backgroundStyle={{ backgroundColor: '#111113' }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
});
