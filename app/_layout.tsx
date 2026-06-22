import '@/i18n';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { UnreadProvider } from '@/context/UnreadContext';
import { useLanguage } from '@/hooks/useLanguage';
import { addNotificationResponseListener, getInitialNotificationTap, type NotificationScreen, registerForPushNotifications } from '@/services/social/notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { LogBox, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Suppress spurious multi-touch tracking warnings from RN internals.
// Fires when a touchmove arrives before a touchstart is recorded (e.g. iPad
// multi-touch gestures crossing native/JS boundaries). Not a bug in app code.
LogBox.ignoreLogs(['Cannot record touch move without a touch start.']);

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

// Stable module-level function — safe to reference inside useEffect([]) without
// causing stale-closure issues, since it only uses the router singleton.
function navigateToScreen(screen: NotificationScreen, meta?: { circleId?: string }) {
  if (screen === 'circle') {
    if (meta?.circleId) {
      router.push({ pathname: '/(social)/circle', params: { circleId: meta.circleId } });
    } else {
      router.push('/(social)/circles'); // fallback when circleId is missing
    }
  } else if (screen === 'connect') {
    router.push('/(tabs)/connect');
  } else if (screen === 'checkin') {
    router.push('/(wellness)/checkin');
  } else if (screen === 'journal') {
    router.push('/(wellness)/journal-entry');
  } else if (screen === 'programs') {
    router.push('/(content)/programs');
  } else if (screen === 'resources') {
    router.push('/(tabs)/resources');
  } else if (screen === 'ai-companion') {
    router.push('/ai-companion');
  }
}

function LockGate({ children }: { children: React.ReactNode }) {
  const { locked, loading, profile } = useSession();
  useLanguage();
  // Holds a navigation target captured from a cold-start notification tap.
  // We defer the push until the session finishes loading and the user isn't locked.
  const pendingNav = useRef<{ matchId?: string; screen?: NotificationScreen; circleId?: string } | null>(null);

  // Check once on mount whether the app was launched by tapping a push notification
  // (killed → notification tap → cold start). addNotificationResponseListener misses
  // this case; only getInitialNotificationTap handles it.
  useEffect(() => {
    getInitialNotificationTap().then((tap) => {
      if (tap?.matchId) pendingNav.current = { matchId: tap.matchId };
      else if (tap?.screen) pendingNav.current = { screen: tap.screen, circleId: tap.circleId };
    });
  }, []);

  // Fire the pending cold-start navigation once the session is ready and unlocked.
  useEffect(() => {
    if (loading || !pendingNav.current) return;
    if (locked && profile) return; // Still locked — wait for unlock
    const nav = pendingNav.current;
    pendingNav.current = null;
    if (nav.matchId) {
      router.push({ pathname: '/chat', params: { matchId: nav.matchId } });
    } else if (nav.screen) {
      navigateToScreen(nav.screen, { circleId: nav.circleId });
    }
  }, [loading, locked, profile]);

  useEffect(() => {
    if (!loading && locked && profile) {
      router.replace('/lock');
    }
  }, [locked, loading, profile]);

  // Register for push notifications once the user has a profile.
  useEffect(() => {
    if (profile) registerForPushNotifications();
  }, [profile]);

  // Navigate to the right chat when the user taps a push notification while the app
  // is running (foreground or background). Cold-start is handled above.
  useEffect(() => {
    const sub = addNotificationResponseListener(
      (matchId) => {
        router.push({ pathname: '/chat', params: { matchId } });
      },
      (screen, meta) => navigateToScreen(screen, meta),
    );
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
    <ErrorBoundary>
      <SessionProvider>
        <UnreadProvider>
        <LockGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/signin" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(wellness)/safety" />
            <Stack.Screen name="(wellness)/checkin" />
            <Stack.Screen name="(wellness)/journal-entry" />
            <Stack.Screen name="(content)/article" />
            <Stack.Screen name="(social)/chat" />
            <Stack.Screen name="(social)/circles" />
            <Stack.Screen name="(social)/circle" />
            <Stack.Screen name="(social)/circle-intro" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(social)/chosen-family" />
            <Stack.Screen name="(content)/programs" />
            <Stack.Screen name="(content)/program" />
            <Stack.Screen name="ai-companion" />
            <Stack.Screen name="(content)/local-resources" />
            <Stack.Screen name="(content)/events" />
            <Stack.Screen name="(wellness)/progress" />
            <Stack.Screen name="blocked-users" />
            <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
            <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(wellness)/intentions" />
            <Stack.Screen name="(safety)/pin" />
            <Stack.Screen name="(safety)/disguise" />
            <Stack.Screen name="(safety)/lock" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(safety)/emergency" options={{ presentation: 'modal' }} />
            <Stack.Screen name="(safety)/decoy" />
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          </Stack>
        </LockGate>
        </UnreadProvider>
        <StatusBar style="dark" />
      </SessionProvider>
    </ErrorBoundary>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
