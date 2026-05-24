import React from 'react';
import { Alert, Share } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import JournalEntryScreen from '@/app/(wellness)/journal-entry';
import * as storage from '@/services/storage';

jest.mock('@/services/storage', () => ({
  saveJournalEntry: jest.fn().mockResolvedValue(undefined),
  getJournalEntries: jest.fn().mockResolvedValue([]),
  deleteJournalEntry: jest.fn().mockResolvedValue(undefined),
  exportJournalAsText: jest.fn().mockResolvedValue('My exported journal'),
  verifyPin: jest.fn().mockResolvedValue(true),
  hasPin: jest.fn().mockResolvedValue(false),
  setPin: jest.fn().mockResolvedValue(undefined),
}));

const mockGetEntries = storage.getJournalEntries as jest.Mock;
const mockSaveEntry = storage.saveJournalEntry as jest.Mock;
const mockDeleteEntry = storage.deleteJournalEntry as jest.Mock;
const mockExport = storage.exportJournalAsText as jest.Mock;
const mockHasPin = storage.hasPin as jest.Mock;
const mockVerifyPin = storage.verifyPin as jest.Mock;

const sampleEntry = {
  id: 'je-1',
  date: '2026-05-16',
  body: 'Today I felt hope for the first time in a while.',
  emotionTags: ['hope'],
  isHidden: false,
  createdAt: '2026-05-16T09:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks(); // restore any Alert/Share spies from previous tests
  mockGetEntries.mockResolvedValue([]);
  mockSaveEntry.mockResolvedValue(undefined);
  mockDeleteEntry.mockResolvedValue(undefined);
  mockExport.mockResolvedValue('My exported journal');
  mockHasPin.mockResolvedValue(false);
  mockVerifyPin.mockResolvedValue(true);
});

// ─── List mode (default, no id param) ────────────────────────────────────────

describe('JournalEntryScreen — list mode', () => {
  it('renders the Journal header', async () => {
    render(<JournalEntryScreen />);
    await waitFor(() => expect(screen.getByText('Journal')).toBeTruthy());
  });

  it('shows "+ New entry" button', async () => {
    render(<JournalEntryScreen />);
    await waitFor(() => expect(screen.getByText('+ New entry')).toBeTruthy());
  });

  it('shows empty state when no entries', async () => {
    render(<JournalEntryScreen />);
    await waitFor(() =>
      expect(screen.getByText(/Your journal is empty/i)).toBeTruthy()
    );
  });

  it('renders existing entries in the list', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    render(<JournalEntryScreen />);
    await waitFor(() =>
      expect(screen.getByText('Today I felt hope for the first time in a while.')).toBeTruthy()
    );
  });

  it('shows emotion tag chips on list entries', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    render(<JournalEntryScreen />);
    await waitFor(() => expect(screen.getByText('hope')).toBeTruthy());
  });

  it('shows lock icon text for hidden entries', async () => {
    mockGetEntries.mockResolvedValue([{ ...sampleEntry, isHidden: true }]);
    render(<JournalEntryScreen />);
    await waitFor(() =>
      expect(screen.getByText(/Hidden — tap to unlock/i)).toBeTruthy()
    );
  });

  it('calls exportJournalAsText and Share when export pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    render(<JournalEntryScreen />);
    await waitFor(() => screen.getByLabelText('Export journal'));
    fireEvent.press(screen.getByLabelText('Export journal'));
    await waitFor(() => expect(mockExport).toHaveBeenCalled());
    expect(shareSpy).toHaveBeenCalledWith({ message: 'My exported journal', title: 'My Journal' });
    shareSpy.mockRestore();
  });

  it('confirms before deleting an entry', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<JournalEntryScreen />);
    await waitFor(() => screen.getByLabelText('Delete entry'));
    fireEvent.press(screen.getByLabelText('Delete entry'));
    expect(alertSpy).toHaveBeenCalledWith('Delete entry?', expect.any(String), expect.any(Array));
  });

  it('calls deleteJournalEntry when confirmed', async () => {
    mockGetEntries.mockResolvedValue([sampleEntry]);
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const deleteBtn = (buttons as any[]).find((b) => b.style === 'destructive');
      deleteBtn?.onPress?.();
    });
    render(<JournalEntryScreen />);
    await waitFor(() => screen.getByLabelText('Delete entry'));
    fireEvent.press(screen.getByLabelText('Delete entry'));
    await waitFor(() => expect(mockDeleteEntry).toHaveBeenCalledWith('je-1'));
  });
});

// ─── Write mode ───────────────────────────────────────────────────────────────

describe('JournalEntryScreen — write mode', () => {
  async function openWriteMode() {
    render(<JournalEntryScreen />);
    await waitFor(() => screen.getByText('+ New entry'));
    fireEvent.press(screen.getByText('+ New entry'));
  }

  it('shows "New Entry" header after pressing new entry', async () => {
    await openWriteMode();
    await waitFor(() => expect(screen.getByText('New Entry')).toBeTruthy());
  });

  it('renders all five emotion tags', async () => {
    await openWriteMode();
    await waitFor(() => {
      expect(screen.getByText('fear')).toBeTruthy();
      expect(screen.getByText('shame')).toBeTruthy();
      expect(screen.getByText('hope')).toBeTruthy();
      expect(screen.getByText('anger')).toBeTruthy();
      expect(screen.getByText('relief')).toBeTruthy();
    });
  });

  it('renders the body text input', async () => {
    await openWriteMode();
    await waitFor(() =>
      expect(screen.getByLabelText('Journal entry body')).toBeTruthy()
    );
  });

  it('renders the Save entry button', async () => {
    await openWriteMode();
    await waitFor(() => expect(screen.getByText('Save entry')).toBeTruthy());
  });

  it('shows alert when saving empty body', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await openWriteMode();
    await waitFor(() => screen.getByText('Save entry'));
    fireEvent.press(screen.getByText('Save entry'));
    expect(alertSpy).toHaveBeenCalledWith('Empty entry', expect.any(String));
    expect(mockSaveEntry).not.toHaveBeenCalled();
  });

  it('calls saveJournalEntry with body and selected tags', async () => {
    await openWriteMode();
    await waitFor(() => screen.getByLabelText('Journal entry body'));
    fireEvent.changeText(
      screen.getByLabelText('Journal entry body'),
      'Today I felt something shift.'
    );
    fireEvent.press(screen.getByText('hope'));
    fireEvent.press(screen.getByText('Save entry'));
    await waitFor(() => expect(mockSaveEntry).toHaveBeenCalledTimes(1));
    expect(mockSaveEntry.mock.calls[0][0]).toMatchObject({
      body: 'Today I felt something shift.',
      emotionTags: ['hope'],
      isHidden: false,
    });
  });

  it('toggles "Hide behind PIN" correctly', async () => {
    await openWriteMode();
    await waitFor(() => screen.getByLabelText('Hide this entry behind PIN'));
    fireEvent.press(screen.getByLabelText('Hide this entry behind PIN'));
    const toggle = screen.getByLabelText('Hide this entry behind PIN');
    expect(toggle.props.accessibilityState).toEqual({ checked: true });
  });

  it('goes back to list after saving', async () => {
    await openWriteMode();
    await waitFor(() => screen.getByLabelText('Journal entry body'));
    fireEvent.changeText(screen.getByLabelText('Journal entry body'), 'A new thought.');
    fireEvent.press(screen.getByText('Save entry'));
    await waitFor(() => expect(screen.getByText('Journal')).toBeTruthy());
  });
});
