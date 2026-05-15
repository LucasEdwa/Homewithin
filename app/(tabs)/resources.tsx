import { EmergencyButton } from '@/components/EmergencyButton';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { getBookmarks, getResources } from '@/services/resources';
import type { Resource, ResourceCategory } from '@/types';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  RESOURCE_CATEGORY_IDS,
} from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ALL = 'all' as const;
type Filter = ResourceCategory | typeof ALL;

export default function ResourcesScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(ALL);
  const [articles, setArticles] = useState<Resource[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const [all, bms] = await Promise.all([getResources(), getBookmarks()]);
        if (active) {
          setArticles(all);
          setBookmarkIds(bms);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const filtered = articles.filter((a) => {
    const matchCat = filter === ALL || a.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={styles.header}>
          <Text style={styles.title}>Resources</Text>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              accessibilityLabel="Search resources"
              testID="search-input"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
            <FilterTab label="All" value={ALL} active={filter === ALL} onPress={() => setFilter(ALL)} color={Colors.safeBlue} />
            {RESOURCE_CATEGORY_IDS.map((cat) => (
              <FilterTab
                key={cat}
                label={CATEGORY_LABELS[cat]}
                value={cat}
                active={filter === cat}
                onPress={() => setFilter(cat)}
                color={CATEGORY_COLORS[cat]}
              />
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {loading ? (
          <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No articles found.</Text>
          </View>
        ) : (
          filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              bookmarked={bookmarkIds.includes(article.id)}
              onPress={() => router.push({ pathname: '/article', params: { id: article.id } })}
            />
          ))
        )}
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

function FilterTab({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  value: Filter;
  active: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ArticleCard({
  article,
  bookmarked,
  onPress,
}: {
  article: Resource;
  bookmarked: boolean;
  onPress: () => void;
}) {
  const catColor = CATEGORY_COLORS[article.category];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityLabel={article.title} testID={`article-${article.id}`}>
      <Card elevated style={styles.card}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>{CATEGORY_LABELS[article.category]}</Text>
        </View>
        <Text style={styles.cardTitle}>{article.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={2}>{article.summary}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.readTime}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{article.readTime} min read</Text>
          </View>
          {bookmarked && (
            <Ionicons name="bookmark" size={16} color={Colors.safeBlue} />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { paddingBottom: 120 },
  header: { backgroundColor: Colors.warmWhite, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  searchIcon: { marginRight: 2 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  tabs: { marginBottom: Spacing.md },
  tabsContent: { gap: Spacing.xs, paddingRight: Spacing.lg },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.softGray,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  loader: { marginTop: Spacing.xl * 2 },
  empty: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl * 2 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  card: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, gap: Spacing.xs },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardSummary: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  readTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
});
