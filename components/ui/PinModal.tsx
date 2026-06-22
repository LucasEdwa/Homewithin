import React from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  visible: boolean;
  mode: 'verify' | 'set' | null;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PinModal({ visible, mode, value, onChange, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Ionicons name="lock-closed" size={32} color={Colors.mutedLavender} />
          <Text style={styles.title}>
            {mode === 'set' ? t('pin.setTitle') : t('pin.enterTitle')}
          </Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={t('pin.placeholder')}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={8}
            autoFocus
            accessibilityLabel={t('pin.placeholder')}
          />
          <View style={styles.buttons}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={t('pin.confirm')} onPress={onSubmit} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: { width: '100%', alignItems: 'center', gap: Spacing.md },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 24,
    letterSpacing: 8,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
});
