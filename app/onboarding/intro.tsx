import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Slide = {
  id: string;
  icon: IoniconsName;
  color: string;
  title: string;
  body: string;
  features: string[];
};

const SLIDE_META: { icon: IoniconsName; color: string }[] = [
  { icon: 'home-outline',             color: Colors.softGreen },
  { icon: 'heart-outline',            color: Colors.mutedLavender },
  { icon: 'people-outline',           color: Colors.safetyYellow },
  { icon: 'location-outline',         color: Colors.warmAmber },
  { icon: 'shield-checkmark-outline', color: Colors.safeBlue },
];

function SlideItem({ item, isActive }: { item: Slide; isActive: boolean }) {
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.65)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const textY = useRef(new Animated.Value(isActive ? 0 : 20)).current;
  const textOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.65,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
      Animated.timing(opacity, {
        toValue: isActive ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(textY, {
        toValue: isActive ? 0 : 20,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
      Animated.timing(textOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        style={[
          styles.iconWrap,
          { backgroundColor: item.color + '18', transform: [{ scale }], opacity },
        ]}
      >
        <Ionicons name={item.icon} size={72} color={item.color} />
      </Animated.View>

      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textY }] },
        ]}
      >
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideBody}>{item.body}</Text>

        <View style={styles.featureList}>
          {item.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: item.color }]} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

async function markIntroSeen() {
  try {
    await SecureStore.setItemAsync('intro_seen', '1');
  } catch {
    // Non-critical — proceed regardless
  }
}

export default function OnboardingIntro() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const slides: Slide[] = (t('onboarding.intro.slides', { returnObjects: true }) as any[]).map(
    (s: { title: string; body: string; features: string[] }, i: number) => ({
      id: String(i),
      icon: SLIDE_META[i].icon,
      color: SLIDE_META[i].color,
      title: s.title,
      body: s.body,
      features: s.features,
    })
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function handleSkip() {
    await markIntroSeen();
    router.replace('/welcome');
  }

  async function handleNext() {
    if (activeIndex < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await markIntroSeen();
      router.replace('/welcome');
    }
  }

  const isLast = activeIndex === slides.length - 1;
  const activeColor = slides[activeIndex]?.color ?? Colors.safeBlue;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityLabel={t('onboarding.intro.skip')}>
        <Text style={styles.skipText}>{t('onboarding.intro.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <SlideItem item={item} isActive={index === activeIndex} />
        )}
        style={styles.list}
        scrollEventThrottle={16}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? [styles.dotActive, { backgroundColor: activeColor }]
                : undefined,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={isLast ? t('common.getStarted') : t('common.next')}
          onPress={handleNext}
          variant="primary"
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  list: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  iconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  slideBody: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  cta: {
    width: '100%',
  },
});
