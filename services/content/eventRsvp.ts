import * as SecureStore from 'expo-secure-store';
import { cancelLocalNotification, scheduleLocalNotification } from '../social/notifications';
import type { LocalMeetup, Workshop } from '@/types';

const RSVPS_KEY = 'hw_event_rsvps';
const REMINDER_LEAD_MS = 60 * 60 * 1000; // 1 hour before the event

interface RsvpRecord {
  id: string;
  title: string;
  reminderNotificationId: string | null;
  rsvpedAt: string;
}

async function readAll(): Promise<RsvpRecord[]> {
  const raw = await SecureStore.getItemAsync(RSVPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(records: RsvpRecord[]): Promise<void> {
  await SecureStore.setItemAsync(RSVPS_KEY, JSON.stringify(records));
}

export async function getRsvpIds(): Promise<string[]> {
  const all = await readAll();
  return all.map((r) => r.id);
}

export async function isRsvped(id: string): Promise<boolean> {
  const all = await readAll();
  return all.some((r) => r.id === id);
}

/**
 * Toggles RSVP state for a workshop or meetup. When the item has a concrete
 * `date`, schedules a local reminder 1 hour before — no server round-trip,
 * no push token required. Items without a date (most current seed content,
 * which only has a recurring cadence like "every Tuesday") are tracked as
 * "going" without a reminder, since there's no real fire time to anchor to.
 */
export async function toggleRsvp(item: Workshop | LocalMeetup): Promise<boolean> {
  const all = await readAll();
  const existing = all.find((r) => r.id === item.id);

  if (existing) {
    if (existing.reminderNotificationId) {
      await cancelLocalNotification(existing.reminderNotificationId);
    }
    await writeAll(all.filter((r) => r.id !== item.id));
    return false;
  }

  let reminderNotificationId: string | null = null;
  if (item.date) {
    const eventDate = new Date(item.date);
    const fireDate = new Date(eventDate.getTime() - REMINDER_LEAD_MS);
    reminderNotificationId = await scheduleLocalNotification(
      fireDate,
      'Starting soon',
      `${item.title} starts in an hour`,
      { screen: 'events' },
    );
  }

  await writeAll([
    { id: item.id, title: item.title, reminderNotificationId, rsvpedAt: new Date().toISOString() },
    ...all,
  ]);
  return true;
}
