import { SessionProvider, useSession } from '@/context/SessionContext';
import { UnreadProvider } from '@/context/UnreadContext';
import { addNotificationResponseListener, registerForPushNotifications } from '@/services/notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  const { locked, loading, profile } = useSession();

  useEffect(() => {
    if (!loading && locked) {
      router.replace('/lock');
    }
  }, [locked, loading]);

  // Register for push notifications once the user has a profile.
  useEffect(() => {
    if (profile) registerForPushNotifications();
  }, [!!profile]);

  // Navigate to the right chat when the user taps a push notification.
  useEffect(() => {
    const sub = addNotificationResponseListener((matchId) => {
      router.push({ pathname: '/chat', params: { matchId } });
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <ErrorBoundary>
      <SessionProvider>
        <UnreadProvider>
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
        </UnreadProvider>
        <StatusBar style="dark" />
      </SessionProvider>
    </ErrorBoundary>
    </SafeAreaProvider>
  );
}
