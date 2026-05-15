import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export function EmergencyButton() {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => router.push('/emergency')}
      activeOpacity={0.85}
      accessibilityLabel="Open emergency support"
      accessibilityRole="button"
    >
      <Ionicons name="alert" size={26} color={Colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.alertRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.alertRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
});
