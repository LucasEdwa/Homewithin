import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '@/context/SessionContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="safety" />
        <Stack.Screen name="checkin" />
        <Stack.Screen name="journal-entry" />
        <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
        <Stack.Screen name="decoy" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
