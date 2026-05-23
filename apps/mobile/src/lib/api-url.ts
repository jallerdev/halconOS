import Constants from 'expo-constants';

export function getApiUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined);
  if (fromEnv) return fromEnv;

  // Fallback: derive from Expo host (works in Expo Go on LAN).
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}
