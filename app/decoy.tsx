import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

// Neutral-looking screen shown when the user taps "Quick Exit" on iOS.
// It mimics a generic weather or notes app so the app looks harmless at a glance.
export default function DecoyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>☀️ Today</Text>
        <Text style={styles.temp}>22°C</Text>
        <Text style={styles.desc}>Clear skies · Feels like 20°</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#87CEEB' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, color: '#fff', fontWeight: '600' },
  temp: { fontSize: 72, color: '#fff', fontWeight: '200' },
  desc: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
});
