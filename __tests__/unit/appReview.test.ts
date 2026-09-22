import * as SecureStore from 'expo-secure-store';
import * as StoreReview from 'expo-store-review';

import { maybePromptReview } from '@/services/user/appReview';

jest.mock('expo-secure-store');
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

const mockStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockIsAvailable = StoreReview.isAvailableAsync as jest.Mock;
const mockRequestReview = StoreReview.requestReview as jest.Mock;

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockStore.getItemAsync.mockImplementation(async (key) => store[key] ?? null);
  mockStore.setItemAsync.mockImplementation(async (key, value) => { store[key] = value; });
  mockStore.deleteItemAsync.mockImplementation(async (key) => { delete store[key]; });
  mockIsAvailable.mockReset().mockResolvedValue(true);
  mockRequestReview.mockReset().mockResolvedValue(undefined);
});

describe('maybePromptReview', () => {
  it('requests a review on a green safety level', async () => {
    await maybePromptReview('green');
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('requests a review when safety level is unknown (null)', async () => {
    await maybePromptReview(null);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('never prompts on a yellow safety level', async () => {
    await maybePromptReview('yellow');
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('never prompts on a red safety level', async () => {
    await maybePromptReview('red');
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('does nothing when the platform has no native review prompt', async () => {
    mockIsAvailable.mockResolvedValue(false);
    await maybePromptReview('green');
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('does not prompt again within the cooldown window', async () => {
    await maybePromptReview('green');
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    await maybePromptReview('green');
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });

  it('stops prompting after the lifetime cap even outside the cooldown', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));

    try {
      for (let i = 0; i < 5; i++) {
        await maybePromptReview('green');
        jest.setSystemTime(new Date(Date.now() + 200 * 24 * 60 * 60 * 1000)); // +200 days each round
      }
      expect(mockRequestReview).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });
});
