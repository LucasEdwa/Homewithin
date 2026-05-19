import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import type { Resource } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ProfileBookmarksCard({ bookmarks }: { bookmarks: Resource[] }) {
  if (bookmarks.length === 0) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Saved articles</Text>
      {bookmarks.map((article) => {
        const color = CATEGORY_COLORS[article.category];
        return (
          <TouchableOpacity
            key={article.id}
            style={styles.row}
            onPress={() => router.push({ pathname: '/article', params: { id: article.id } })}
            accessibilityLabel={article.title}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <View style={styles.info}>
              <Text style={styles.bookmarkTitle} numberOfLines={1}>{article.title}</Text>
              <Text style={styles.cat}>{CATEGORY_LABELS[article.category]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  bookmarkTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cat: { fontSize: 12, color: Colors.textMuted },
});
