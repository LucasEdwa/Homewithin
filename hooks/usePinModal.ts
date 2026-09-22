import { useState } from 'react';
import { Alert } from 'react-native';
import { hasPin, setPin, verifyPin } from '@/services/storage';

/**
 * Reusable PIN verification hook shared between journal screens.
 *
 * @param onUnlock  Called with the entry id once the PIN is verified.
 * @param onLockSet Called when the user sets a new PIN via the lock toggle (journal-entry only).
 */
export function usePinModal(
  onUnlock: (entryId: string) => void,
  onLockSet?: () => void,
) {
  const [pinModal, setPinModal] = useState<'verify' | 'set' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [lockedEntryId, setLockedEntryId] = useState<string | null>(null);
  const [pinPurpose, setPinPurpose] = useState<'open-entry' | 'lock-editor' | null>(null);

  /** Intercept a tap on a hidden entry row. The caller must first check its own
   *  unlockedIds set and call onUnlock directly if already unlocked. */
  async function handleOpenHidden(entryId: string) {
    const pinSet = await hasPin();
    setLockedEntryId(entryId);
    setPinInput('');
    setPinPurpose('open-entry');
    setPinModal(pinSet ? 'verify' : 'set');
  }

  /**
   * Show the "set PIN" modal when the user enables the lock toggle and no PIN
   * exists yet. Returns true if the modal was shown (PIN was absent), false if
   * a PIN already exists — caller should toggle isHidden directly in that case.
   */
  async function openPinForLock(): Promise<boolean> {
    const pinSet = await hasPin();
    if (pinSet) return false;
    setPinPurpose('lock-editor');
    setPinInput('');
    setPinModal('set');
    return true;
  }

  async function handlePinSubmit() {
    if (pinModal === 'set') {
      if (pinInput.length < 4) {
        Alert.alert('Too short', 'PIN must be at least 4 digits.');
        return;
      }
      await setPin(pinInput);
      setPinModal(null);
      setPinPurpose(null);
      if (pinPurpose === 'lock-editor') {
        onLockSet?.();
      } else if (lockedEntryId) {
        onUnlock(lockedEntryId);
      }
    } else {
      const ok = await verifyPin(pinInput);
      if (ok) {
        setPinModal(null);
        setPinPurpose(null);
        if (lockedEntryId) {
          onUnlock(lockedEntryId);
        }
      } else {
        Alert.alert('Wrong PIN', 'Please try again.');
        setPinInput('');
      }
    }
  }

  function closePinModal() {
    setPinModal(null);
  }

  return {
    pinModal,
    pinInput,
    setPinInput,
    handleOpenHidden,
    openPinForLock,
    handlePinSubmit,
    closePinModal,
  };
}
