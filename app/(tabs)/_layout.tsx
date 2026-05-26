import { Colors } from '@/constants/Colors';
import { useUnread } from '@/context/UnreadContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IoniconsName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

export default function TabLayout() {
  const { totalUnread } = useUnread();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.safeBlue,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#171310',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <TabIcon name="book-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color }) => <TabIcon name="people-outline" color={color} />,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.safeBlue, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color }) => <TabIcon name="library-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color }) => <TabIcon name="medal-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="person-outline" color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
