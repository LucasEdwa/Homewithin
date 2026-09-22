import * as SecureStore from 'expo-secure-store';

import { getRsvpIds, isRsvped, toggleRsvp } from '@/services/content/eventRsvp';
import * as notifications from '@/services/social/notifications';
import type { LocalMeetup, Workshop } from '@/types';

jest.mock('expo-secure-store');
jest.mock('@/services/social/notifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockSchedule = notifications.scheduleLocalNotification as jest.Mock;
const mockCancel = notifications.cancelLocalNotification as jest.Mock;

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
  mockSchedule.mockReset().mockResolvedValue('notif-123');
  mockCancel.mockReset().mockResolvedValue(undefined);
});

const UNDATED_WORKSHOP: Workshop = {
  id: 'ws-1',
  title: 'Coming Out with Confidence',
  description: 'A gentle online workshop.',
  host: 'HomeWithin Community',
  format: 'online',
  recurring: 'Monthly — first Sunday',
  free: true,
};

const DATED_MEETUP: LocalMeetup = {
  id: 'mt-1',
  title: 'NYC Queer Social',
  description: 'Meet other queer folks nearby.',
  city: 'New York',
  state: 'United States',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('eventRsvp', () => {
  it('starts with no RSVPs', async () => {
    expect(await getRsvpIds()).toEqual([]);
    expect(await isRsvped('ws-1')).toBe(false);
  });

  it('toggling an undated item adds it without scheduling a reminder', async () => {
    const going = await toggleRsvp(UNDATED_WORKSHOP);
    expect(going).toBe(true);
    expect(await isRsvped('ws-1')).toBe(true);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('toggling a dated item schedules a reminder 1 hour before', async () => {
    const going = await toggleRsvp(DATED_MEETUP);
    expect(going).toBe(true);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const [fireDate, title, body] = mockSchedule.mock.calls[0];
    const expectedFire = new Date(DATED_MEETUP.date!).getTime() - 60 * 60 * 1000;
    expect(fireDate.getTime()).toBe(expectedFire);
    expect(title).toBe('Starting soon');
    expect(body).toContain(DATED_MEETUP.title);
  });

  it('un-RSVPing cancels the scheduled reminder', async () => {
    await toggleRsvp(DATED_MEETUP);
    const going = await toggleRsvp(DATED_MEETUP);
    expect(going).toBe(false);
    expect(mockCancel).toHaveBeenCalledWith('notif-123');
    expect(await isRsvped('mt-1')).toBe(false);
  });

  it('un-RSVPing an undated item does not attempt to cancel anything', async () => {
    await toggleRsvp(UNDATED_WORKSHOP);
    await toggleRsvp(UNDATED_WORKSHOP);
    expect(mockCancel).not.toHaveBeenCalled();
  });
});
