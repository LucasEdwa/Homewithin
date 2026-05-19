import { SessionProvider, useSession } from '@/context/SessionContext';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError)
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
            <Stack.Screen name="local-resources" />
            <Stack.Screen name="events" />
            <Stack.Screen name="progress" />
            <Stack.Screen name="blocked-users" />
            <Stack.Screen name="intentions" />
            <Stack.Screen name="pin" />
            <Stack.Screen name="disguise" />
            <Stack.Screen name="lock" options={{ gestureEnabled: false }} />
            <Stack.Screen name="emergency" options={{ presentation: 'modal' }} />
            <Stack.Screen name="decoy" />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          </Stack>
        </LockGate>
        <StatusBar style="dark" />
      </SessionProvider>
    </ErrorBoundary>
  );
}
