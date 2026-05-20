import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
});

import {
  getSupportPeople,
  getSupportPersonByRole,
  addSupportPerson,
  updateSupportPerson,
  removeSupportPerson,
  getNextSuggestedRole,
} from '@/services/social/chosenFamily';
import { SUPPORT_ROLES } from '@/types';
import type { SupportPerson } from '@/types';

describe('getSupportPeople', () => {
  it('returns empty array when nothing stored', async () => {
    expect(await getSupportPeople()).toEqual([]);
  });
});

describe('addSupportPerson', () => {
  it('adds a person and assigns id + createdAt', async () => {
    const person = await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    expect(person.id).toBeTruthy();
    expect(person.nickname).toBe('Alex');
    expect(person.role).toBe('trusted_friend');
    expect(person.createdAt).toBeTruthy();
  });

  it('persists to store', async () => {
    await addSupportPerson({ nickname: 'Sam', role: 'mentor' });
    const people = await getSupportPeople();
    expect(people).toHaveLength(1);
    expect(people[0].nickname).toBe('Sam');
  });

  it('replaces same role if already filled', async () => {
    await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await addSupportPerson({ nickname: 'Jordan', role: 'trusted_friend' });
    const people = await getSupportPeople();
    expect(people.filter((p) => p.role === 'trusted_friend')).toHaveLength(1);
    expect(people.find((p) => p.role === 'trusted_friend')?.nickname).toBe('Jordan');
  });

  it('allows different roles independently', async () => {
    await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await addSupportPerson({ nickname: 'Sam', role: 'mentor' });
    const people = await getSupportPeople();
    expect(people).toHaveLength(2);
  });

  it('stores optional fields', async () => {
    const person = await addSupportPerson({
      nickname: 'Alex',
      role: 'emergency_contact',
      contactInfo: '+1234567890',
      notes: 'My closest friend',
    });
    expect(person.contactInfo).toBe('+1234567890');
    expect(person.notes).toBe('My closest friend');
  });
});

describe('getSupportPersonByRole', () => {
  it('returns null when role not filled', async () => {
    expect(await getSupportPersonByRole('therapist')).toBeNull();
  });

  it('returns the person for a filled role', async () => {
    await addSupportPerson({ nickname: 'Dr. Lee', role: 'therapist' });
    const person = await getSupportPersonByRole('therapist');
    expect(person?.nickname).toBe('Dr. Lee');
  });
});

describe('updateSupportPerson', () => {
  it('updates nickname and contactInfo', async () => {
    const added = await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await updateSupportPerson(added.id, { nickname: 'Alex M.', contactInfo: '+9876543210' });
    const people = await getSupportPeople();
    const updated = people.find((p) => p.id === added.id)!;
    expect(updated.nickname).toBe('Alex M.');
    expect(updated.contactInfo).toBe('+9876543210');
  });

  it('does not affect other people', async () => {
    const a = await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await addSupportPerson({ nickname: 'Sam', role: 'mentor' });
    await updateSupportPerson(a.id, { nickname: 'Alex Updated' });
    const people = await getSupportPeople();
    expect(people.find((p) => p.role === 'mentor')?.nickname).toBe('Sam');
  });
});

describe('removeSupportPerson', () => {
  it('removes a person by id', async () => {
    const added = await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await removeSupportPerson(added.id);
    expect(await getSupportPeople()).toHaveLength(0);
  });

  it('does not remove others', async () => {
    const a = await addSupportPerson({ nickname: 'Alex', role: 'trusted_friend' });
    await addSupportPerson({ nickname: 'Sam', role: 'mentor' });
    await removeSupportPerson(a.id);
    const people = await getSupportPeople();
    expect(people).toHaveLength(1);
    expect(people[0].nickname).toBe('Sam');
  });
});

describe('getNextSuggestedRole', () => {
  it('returns first role when no one added', () => {
    const next = getNextSuggestedRole([]);
    expect(next?.id).toBe(SUPPORT_ROLES[0].id);
  });

  it('skips filled roles', async () => {
    const p1 = await addSupportPerson({ nickname: 'A', role: SUPPORT_ROLES[0].id });
    const next = getNextSuggestedRole([p1]);
    expect(next?.id).toBe(SUPPORT_ROLES[1].id);
  });

  it('returns null when all 5 roles filled', () => {
    const allFilled: SupportPerson[] = SUPPORT_ROLES.map((r, i) => ({
      id: String(i),
      nickname: `Person ${i}`,
      role: r.id,
      createdAt: new Date().toISOString(),
    }));
    expect(getNextSuggestedRole(allFilled)).toBeNull();
  });
});
