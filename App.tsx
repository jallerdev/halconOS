// Compat shim for older Expo Go clients (≤SDK 53) that load `node_modules/expo/AppEntry.js`
// and try to resolve `../../App` from there. With bun hoisting, expo lives at the workspace
// root, so this file must also be at the workspace root.
// New Expo Go (SDK 54+) uses `expo-router/entry` declared in apps/mobile/package.json "main"
// and never loads this file.
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';

export default App;
