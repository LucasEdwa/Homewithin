import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { EmergencyButton } from '@/components/safety/EmergencyButton';
import { getResourceById, toggleBookmark, isBookmarked } from '@/services/content/resources';
import { currentUserId, supabase } from '@/services/supabase';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types';
import type { Resource } from '@/types';
import { MarkdownBody } from '@/components/ui/MarkdownBody';

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Resource | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [res, bm] = await Promise.all([getResourceById(id), isBookmarked(id)]);
      setArticle(res);
      setBookmarked(bm);
      setLoading(false);

      // Log resource read for daily notification tracking (fire-and-forget)
      if (supabase) {
        const uid = await currentUserId();
        if (uid) {
          supabase
            .from('resource_reads')
            .insert({ user_id: uid, resource_id: id })
            .then(() => {});
        }
      }
    })();
  }, [id]);

  async function handleToggleBookmark() {
    if (!article) return;
    const nowBookmarked = await toggleBookmark(article.id);
    setBookmarked(nowBookmarked);
  }

  async function handleShare() {
    if (!article) return;
    await Share.share({
      title: article.title,
      message: `${article.title}\n\n${article.summary}`,
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.safeBlue} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Article not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const catColor = CATEGORY_COLORS[article.category];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav bar */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={handleShare} style={styles.navBtn} accessibilityLabel="Share article">
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleBookmark} style={styles.navBtn} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark article'}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? Colors.safeBlue : Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: catColor + '22', borderColor: catColor }]}>
          <Text style={[styles.badgeText, { color: catColor }]}>{CATEGORY_LABELS[article.category]}</Text>
        </View>

        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{article.readTime} min read</Text>
        </View>

        <Text style={styles.summary}>{article.summary}</Text>

        <View style={styles.divider} />

        <MarkdownBody body={article.body} fontSize={16} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            onPress={handleToggleBookmark}
            accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save for later'}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={bookmarked ? Colors.white : Colors.safeBlue}
            />
            <Text style={[styles.bookmarkText, bookmarked && styles.bookmarkTextActive]}>
              {bookmarked ? 'Saved' : 'Save for later'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <EmergencyButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  loader: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBtn: { padding: Spacing.xs },
  navActions: { flexDirection: 'row', gap: Spacing.xs },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, lineHeight: 34 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textMuted },
  summary: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  body: { fontSize: 16, color: Colors.textPrimary, lineHeight: 26 },
  bodyHeading: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, lineHeight: 26, marginTop: 20, marginBottom: 2 },
  bodyBold: { fontWeight: '700', color: Colors.textPrimary },
  footer: { marginTop: Spacing.md, alignItems: 'center' },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.safeBlue,
    backgroundColor: Colors.white,
  },
  bookmarkBtnActive: { backgroundColor: Colors.safeBlue },
  bookmarkText: { fontSize: 15, fontWeight: '600', color: Colors.safeBlue },
  bookmarkTextActive: { color: Colors.white },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundText: { fontSize: 16, color: Colors.textSecondary },
  backLink: { fontSize: 15, color: Colors.safeBlue, fontWeight: '600' },
});
