import * as SecureStore from 'expo-secure-store';
import type { SupportPerson, SupportRole } from '@/types';

const KEY = 'hw_chosen_family';

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getSupportPeople(): Promise<SupportPerson[]> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getSupportPersonByRole(role: SupportRole): Promise<SupportPerson | null> {
  const people = await getSupportPeople();
  return people.find((p) => p.role === role) ?? null;
}

export async function addSupportPerson(
  data: Omit<SupportPerson, 'id' | 'createdAt'>
): Promise<SupportPerson> {
  const people = await getSupportPeople();
  // One person per role — replace if same role already exists
  const filtered = people.filter((p) => p.role !== data.role);
  const person: SupportPerson = {
    ...data,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(KEY, JSON.stringify([...filtered, person]));
  return person;
}

export async function updateSupportPerson(
  id: string,
  updates: Partial<Pick<SupportPerson, 'nickname' | 'contactInfo' | 'notes'>>
): Promise<void> {
  const people = await getSupportPeople();
  const updated = people.map((p) => (p.id === id ? { ...p, ...updates } : p));
  await SecureStore.setItemAsync(KEY, JSON.stringify(updated));
}

export async function removeSupportPerson(id: string): Promise<void> {
  const people = await getSupportPeople();
  await SecureStore.setItemAsync(KEY, JSON.stringify(people.filter((p) => p.id !== id)));
}

export function getNextSuggestedRole(people: SupportPerson[]): import('@/types').SupportRoleMeta | null {
  const { SUPPORT_ROLES } = require('@/types');
  const filledRoles = new Set(people.map((p) => p.role));
  return SUPPORT_ROLES.find((r: import('@/types').SupportRoleMeta) => !filledRoles.has(r.id)) ?? null;
}
