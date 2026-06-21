import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'home-outline',
    color: Colors.softGreen,
    title: 'Welcome to HomeWithin',
    body: "A private, safe space built for LGBTQ+ people — especially when home isn't always safe.",
    features: ['Anonymous by default', 'Built for Sweden', 'Always free'],
  },
  {
    id: '2',
    icon: 'heart-outline',
    color: Colors.mutedLavender,
    title: 'Track your wellbeing',
    body: 'Check in daily, journal privately, and talk to an AI companion that truly listens.',
    features: ['Mood check-ins', 'Private journal', 'AI companion'],
  },
  {
    id: '3',
    icon: 'people-outline',
    color: Colors.safetyYellow,
    title: 'Find your people',
    body: 'Get matched with peers who get it. Build your chosen family. Join support circles.',
    features: ['Anonymous peer matching', 'Chosen family', 'Group circles'],
  },
  {
    id: '4',
    icon: 'location-outline',
    color: Colors.warmAmber,
    title: 'Support across Sweden',
    body: 'LGBTQ+ centers, shelters, therapists, and events — filtered to your county.',
    features: ['All 21 counties', 'Therapists & shelters', 'Events & programs'],
  },
  {
    id: '5',
    icon: 'shield-checkmark-outline',
    color: Colors.safeBlue,
    title: 'Your privacy, your control',
    body: 'PIN lock, disguise mode, and one-tap emergency access keep you safe.',
    features: ['PIN & Face ID lock', 'Disguise mode', 'Emergency access'],
  },
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
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

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
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await markIntroSeen();
      router.replace('/welcome');
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;
  const activeColor = SLIDES[activeIndex].color;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityLabel="Skip tour">
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={SLIDES}
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
        {SLIDES.map((s, i) => (
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
          label={isLast ? 'Get Started' : 'Next'}
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
