import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'hw_onboarding_complete';
const SESSION_KEY = 'hw_session';
const SAFETY_PLAN_KEY = 'hw_safety_plan';
const PIN_KEY = 'hw_pin';

export async function markOnboardingComplete() {
  await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === 'true';
}

export async function saveSession(data: object) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(data));
}

export async function getSession(): Promise<object | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  return value ? JSON.parse(value) : null;
}

export async function saveSafetyPlan(steps: string[]) {
  await SecureStore.setItemAsync(SAFETY_PLAN_KEY, JSON.stringify(steps));
}

export async function getSafetyPlan(): Promise<string[]> {
  const value = await SecureStore.getItemAsync(SAFETY_PLAN_KEY);
  return value ? JSON.parse(value) : [];
}

export async function setPin(pin: string) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}

export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return !!stored;
}

export async function deleteSensitiveData() {
  await Promise.all([
    SecureStore.deleteItemAsync(SAFETY_PLAN_KEY),
    SecureStore.deleteItemAsync(SESSION_KEY),
  ]);
}
