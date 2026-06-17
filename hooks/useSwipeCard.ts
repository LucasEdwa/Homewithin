import { Gesture } from 'react-native-gesture-handler';
import {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const FLY_DISTANCE = 600;
const VERTICAL_DAMPEN = 0.25;

interface Options {
  peerId: string;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function useSwipeCard({ peerId, onSwipeRight, onSwipeLeft }: Options) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Reset card position whenever a new peer is shown
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [peerId]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])   // only activates on clear horizontal intent
    .failOffsetY([-15, 15])     // defers to ScrollView on vertical intent
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * VERTICAL_DAMPEN;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(FLY_DISTANCE, { duration: 280 });
        translateY.value = withTiming(e.translationY * 0.4, { duration: 280 });
        runOnJS(onSwipeRight)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-FLY_DISTANCE, { duration: 280 });
        translateY.value = withTiming(e.translationY * 0.4, { duration: 280 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value * ROTATION_FACTOR}deg` },
    ],
  }));

  // Fades in from 0 → 1 as user drags right
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5],
      [0, 1],
      'clamp',
    ),
  }));

  // Fades in from 0 → 1 as user drags left
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.5, 0],
      [1, 0],
      'clamp',
    ),
  }));

  return { pan, cardStyle, likeStyle, skipStyle };
}
