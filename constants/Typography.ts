import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
