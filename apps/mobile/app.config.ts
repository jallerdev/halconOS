import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Halcón',
  slug: 'halcon',
  scheme: 'halcon',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  backgroundColor: '#000000',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.agenciaSO.app',
  },
  android: {
    package: 'com.agenciaSO.app',
  },
  plugins: ['expo-router', 'expo-font', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
};

export default config;
