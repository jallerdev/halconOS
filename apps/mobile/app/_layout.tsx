import '~/styles/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TrpcProvider } from '~/providers/TrpcProvider';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000').catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <TrpcProvider>
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000' },
              animation: 'slide_from_right',
              animationDuration: 280,
            }}
          />
        </TrpcProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
