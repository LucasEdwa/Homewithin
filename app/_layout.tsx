import { SessionProvider, useSession } from '@/context/SessionContext';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

function LockGate({ children }: { children: React.ReactNode }) {
  const { locked, loading } = useSession();
  useEffect(() => {
    if (!loading && locked) {
      router.replace('/lock');
    }
  }, [locked, loading]);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <LockGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="signin" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="safety" />
          <Stack.Screen name="checkin" />
          <Stack.Screen name="journal-entry" />
          <Stack.Screen name="article" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="circles" />
          <Stack.Screen name="circle" />
          <Stack.Screen name="circle-intro" options={{ presentation: 'modal' }} />
          <Stack.Screen name="chosen-family" />
          <Stack.Screen name="programs" />
          <Stack.Screen name="program" />
          <Stack.Screen name="ai-companion" />
          <Stack.Screen name="blocked-users" />
          <Stack.Screen name="intentions" />
          <Stack.Screen name="pin" />
          <Stack.Screen name="disguise" />
          <Stack.Screen name="lock" options={{ gestureEnabled: false }} />
          <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
          <Stack.Screen name="decoy" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </LockGate>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
