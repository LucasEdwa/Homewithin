import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface ArcGaugeProps {
  value: number;
  max: number;
  label: string;        // e.g. "LESSONS PROGRESS"
  icon: IoniconsName;
  color?: string;
}

const N_DASHES = 44;

export function ArcGauge({ value, max, label, icon, color = Colors.white }: ArcGaugeProps) {
  const [containerW, setContainerW] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);

  const progress = max > 0 ? Math.min(value / max, 1) : 0;

  useEffect(() => {
    if (containerW === 0) return;
    const id = animValue.addListener(({ value: v }) => setDisplayProgress(v));
    Animated.timing(animValue, {
      toValue: progress,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animValue.removeListener(id);
  }, [progress, containerW]);

  const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);

  // Geometry — arc spans from θ=180° (left) to θ=0° (right) going over the top
  const radius = containerW * 0.40;
  const cx = containerW / 2;
  const topPad = 16;
  const cy = radius + topPad;          // center of the full circle in container coords
  const arcH = cy + 28;                // visible height (cut just below center)

  const dashW = 10;
  const dashH = 3;

  const activeDashes = Math.round(displayProgress * N_DASHES);

  // Build dash descriptors
  const dashes = Array.from({ length: N_DASHES }, (_, i) => {
    const theta = 180 - (i / (N_DASHES - 1)) * 180; // 180° → 0°  (left → right)
    const rad = theta * (Math.PI / 180);
    const x = cx + radius * Math.cos(rad);
    const y = cy - radius * Math.sin(rad);   // RN y-axis is flipped
    const rotation = 90 - theta;             // tangent to the arc at this point
    const isActive = i < activeDashes;
    return { x, y, rotation, isActive };
  });

  // Endpoint positions for 0 / max labels
  const leftPt = dashes[0];
  const rightPt = dashes[N_DASHES - 1];

  // Tick mark indices (5 evenly spaced, excluding endpoints)
  const tickIndices = new Set([
    0,
    Math.round(N_DASHES * 0.25),
    Math.round(N_DASHES * 0.5),
    Math.round(N_DASHES * 0.75),
    N_DASHES - 1,
  ]);

  const displayValue = value.toLocaleString('en-US');
  const maxLabel = max >= 1000 ? `${(max / 1000).toFixed(0)} 000` : String(max);

  return (
    <View onLayout={onLayout}>
      {containerW > 0 && (
        <>
          {/* ── Arc area ──────────────────────────────────── */}
          <View style={{ height: arcH }}>

            {/* Dashes */}
            {dashes.map((d, i) => {
              const isTick = tickIndices.has(i);
              const w = isTick ? dashW + 2 : dashW;
              const h = isTick ? dashH + 1 : dashH;
              const opacity = d.isActive
                ? 1
                : isTick
                ? 0.35
                : 0.14;
              const bg = d.isActive ? color : Colors.white;

              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: d.x - w / 2,
                    top: d.y - h / 2,
                    width: w,
                    height: h,
                    borderRadius: h / 2,
                    backgroundColor: bg,
                    opacity,
                    transform: [{ rotate: `${d.rotation}deg` }],
                  }}
                />
              );
            })}

            {/* Glowing dot at the leading edge of the progress */}
            {activeDashes > 0 && activeDashes <= N_DASHES && (() => {
              const lead = dashes[Math.max(activeDashes - 1, 0)];
              return (
                <View
                  style={{
                    position: 'absolute',
                    left: lead.x - 5,
                    top: lead.y - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: color,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                />
              );
            })()}

            {/* Icon pill at bottom center */}
            <View
              style={[
                styles.iconPill,
                { left: cx - 18, top: cy - 18, backgroundColor: Colors.softGray + 'CC' },
              ]}
            >
              <Ionicons name={icon} size={18} color={color} />
            </View>

            {/* Min label */}
            <Text
              style={[
                styles.endLabel,
                { left: leftPt.x - 6, top: leftPt.y + 8 },
              ]}
            >
              0
            </Text>

            {/* Max label */}
            <Text
              style={[
                styles.endLabel,
                { left: rightPt.x - 24, top: rightPt.y + 8 },
              ]}
            >
              {maxLabel}
            </Text>
          </View>

          {/* ── Text below arc ────────────────────────────── */}
          <View style={styles.textBlock}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.bigValue}>{displayValue}</Text>
          </View>
        </>
      )}

      {/* Invisible layout trigger when containerW is 0 */}
      {containerW === 0 && <View style={{ height: 200 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  endLabel: {
    position: 'absolute',
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bigValue: {
    fontSize: 52,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 58,
  },
});
