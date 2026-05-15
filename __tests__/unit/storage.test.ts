import * as SecureStore from 'expo-secure-store';
import {
  markOnboardingComplete,
  isOnboardingComplete,
  saveSession,
  getSession,
  saveSafetyPlan,
  getSafetyPlan,
  setPin,
  verifyPin,
  hasPin,
  deleteSensitiveData,
} from '@/services/storage';

// Access the in-memory store reset helper from our mock
const mockStore = SecureStore as any;

beforeEach(() => {
  mockStore.__reset?.();
  jest.clearAllMocks();
});

describe('onboarding flag', () => {
  it('returns false before marking complete', async () => {
    expect(await isOnboardingComplete()).toBe(false);
  });

  it('returns true after markOnboardingComplete', async () => {
    await markOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
  });

  it('calls setItemAsync with correct key', async () => {
    await markOnboardingComplete();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('hw_onboarding_complete', 'true');
  });
});

describe('session', () => {
  const profile = { nickname: 'River', pronouns: 'they/them', country: 'Brazil' };

  it('returns null when no session saved', async () => {
    expect(await getSession()).toBeNull();
  });

  it('saves and retrieves session data', async () => {
    await saveSession(profile);
    const retrieved = await getSession();
    expect(retrieved).toEqual(profile);
  });

  it('overwrites an existing session', async () => {
    await saveSession(profile);
    await saveSession({ nickname: 'Sage' });
    const retrieved = await getSession() as any;
    expect(retrieved.nickname).toBe('Sage');
  });
});

describe('safety plan', () => {
  it('returns empty array when no plan saved', async () => {
    expect(await getSafetyPlan()).toEqual([]);
  });

  it('saves and retrieves a safety plan', async () => {
    const steps = ['Text Alex', 'Go to library', 'Call helpline'];
    await saveSafetyPlan(steps);
    expect(await getSafetyPlan()).toEqual(steps);
  });

  it('handles an empty plan array', async () => {
    await saveSafetyPlan([]);
    expect(await getSafetyPlan()).toEqual([]);
  });
});

describe('PIN', () => {
  it('hasPin returns false with no PIN set', async () => {
    expect(await hasPin()).toBe(false);
  });

  it('hasPin returns true after setting a PIN', async () => {
    await setPin('1234');
    expect(await hasPin()).toBe(true);
  });

  it('verifyPin returns true for correct PIN', async () => {
    await setPin('5678');
    expect(await verifyPin('5678')).toBe(true);
  });

  it('verifyPin returns false for wrong PIN', async () => {
    await setPin('5678');
    expect(await verifyPin('0000')).toBe(false);
  });

  it('verifyPin returns false when no PIN is set', async () => {
    expect(await verifyPin('1234')).toBe(false);
  });
});

describe('deleteSensitiveData', () => {
  it('calls deleteItemAsync for safety plan and session keys', async () => {
    await deleteSensitiveData();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('hw_safety_plan');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('hw_session');
  });

  it('makes getSession return null after deletion', async () => {
    await saveSession({ nickname: 'River' });
    await deleteSensitiveData();
    expect(await getSession()).toBeNull();
  });
});
