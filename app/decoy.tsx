import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/context/SessionContext';

// Tap secret: 5 quick taps on the title within 2 seconds to reveal the app.
const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 2000;

export default function DecoyScreen() {
  const { locked, pinEnabled, disguiseStyle } = useSession();
  const [taps, setTaps] = useState(0);
  const windowStartRef = useRef<number>(0);

  function handleSecretTap() {
    const now = Date.now();
    const expired = now - windowStartRef.current > SECRET_WINDOW_MS;
    if (expired || taps === 0) {
      windowStartRef.current = now;
      setTaps(1);
      return;
    }
    const next = taps + 1;
    setTaps(next);
    if (next >= SECRET_TAPS) {
      setTaps(0);
      windowStartRef.current = 0;
      if (pinEnabled && locked) router.replace('/lock');
      else router.replace('/(tabs)');
    }
  }

  if (disguiseStyle === 'calculator') return <Calculator onSecretTap={handleSecretTap} />;
  if (disguiseStyle === 'notes') return <Notes onSecretTap={handleSecretTap} />;
  return <Weather onSecretTap={handleSecretTap} />;
}

// ─── Weather ─────────────────────────────────────────────────────────────────
function Weather({ onSecretTap }: { onSecretTap: () => void }) {
  return (
    <SafeAreaView style={weatherStyles.safe}>
      <View style={weatherStyles.content}>
        <Pressable onPress={onSecretTap} hitSlop={20} testID="decoy-secret">
          <Text style={weatherStyles.title}>☀️ Today</Text>
        </Pressable>
        <Text style={weatherStyles.temp}>22°C</Text>
        <Text style={weatherStyles.desc}>Clear skies · Feels like 20°</Text>
      </View>
    </SafeAreaView>
  );
}

const weatherStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#87CEEB' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 22, color: '#fff', fontWeight: '600' },
  temp: { fontSize: 72, color: '#fff', fontWeight: '200' },
  desc: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
});

// ─── Calculator ──────────────────────────────────────────────────────────────
function Calculator({ onSecretTap }: { onSecretTap: () => void }) {
  const [display, setDisplay] = useState('0');
  function press(key: string) {
    setDisplay((d) => (d === '0' ? key : d + key).slice(-12));
  }
  const keys = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','−'],['0','.','=','+']];
  return (
    <SafeAreaView style={calcStyles.safe}>
      <View style={calcStyles.displayWrap}>
        <Pressable onPress={onSecretTap} hitSlop={20} testID="decoy-secret">
          <Text style={calcStyles.display}>{display}</Text>
        </Pressable>
      </View>
      <View style={calcStyles.pad}>
        {keys.map((row, ri) => (
          <View key={ri} style={calcStyles.row}>
            {row.map((k) => (
              <Pressable
                key={k}
                style={({ pressed }) => [calcStyles.key, pressed && calcStyles.keyPressed]}
                onPress={() => k === '=' ? setDisplay('0') : press(k)}
              >
                <Text style={calcStyles.keyText}>{k}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const calcStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  displayWrap: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 16 },
  display: { color: '#fff', fontSize: 72, fontWeight: '200', textAlign: 'right' },
  pad: { paddingHorizontal: 8, paddingBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  key: {
    flex: 1, aspectRatio: 1, marginHorizontal: 4, borderRadius: 100,
    backgroundColor: '#333', alignItems: 'center', justifyContent: 'center',
  },
  keyPressed: { backgroundColor: '#555' },
  keyText: { color: '#fff', fontSize: 28, fontWeight: '400' },
});

// ─── Notes ───────────────────────────────────────────────────────────────────
function Notes({ onSecretTap }: { onSecretTap: () => void }) {
  return (
    <SafeAreaView style={notesStyles.safe}>
      <View style={notesStyles.header}>
        <Pressable onPress={onSecretTap} hitSlop={20} testID="decoy-secret">
          <Text style={notesStyles.title}>Notes</Text>
        </Pressable>
      </View>
      <View style={notesStyles.list}>
        {[
          { title: 'Groceries', body: 'Milk, bread, oats, apples...', date: 'Today' },
          { title: 'Books to read', body: 'Bluets, The Argonauts...', date: 'Yesterday' },
          { title: 'Recipe — pancakes', body: '2 cups flour, 1 egg...', date: 'Mon' },
        ].map((n) => (
          <View key={n.title} style={notesStyles.item}>
            <Text style={notesStyles.itemTitle}>{n.title}</Text>
            <Text style={notesStyles.itemMeta}>{n.date}  ·  {n.body}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const notesStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', color: '#1c1c1e' },
  list: { paddingHorizontal: 20 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D1D6' },
  itemTitle: { fontSize: 17, fontWeight: '600', color: '#1c1c1e' },
  itemMeta: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
});
