import React from 'react';
import { screen, fireEvent, waitFor, render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

jest.mock('@/context/SessionContext', () => ({
  useSession: jest.fn(),
}));

import DisguiseScreen from '@/app/disguise';
import { router } from 'expo-router';
import { useSession } from '@/context/SessionContext';

const setDisguiseEnabled = jest.fn().mockResolvedValue(undefined);
const setDisguiseStyle = jest.fn().mockResolvedValue(undefined);

(useSession as jest.Mock).mockReturnValue({
  disguiseEnabled: false,
  disguiseStyle: 'weather',
  setDisguiseEnabled,
  setDisguiseStyle,
});

describe('DisguiseScreen', () => {
  beforeEach(() => {
    setDisguiseEnabled.mockClear();
    setDisguiseStyle.mockClear();
    (router.push as jest.Mock).mockClear();
    (router.back as jest.Mock).mockClear();
    (useSession as jest.Mock).mockReturnValue({
      disguiseEnabled: false,
      disguiseStyle: 'weather',
      setDisguiseEnabled,
      setDisguiseStyle,
    });
  });

  it('toggles disguise on launch via Switch', async () => {
    render(<DisguiseScreen />);
    const sw = screen.getByLabelText('Disguise on launch');
    fireEvent(sw, 'valueChange', true);
    await waitFor(() => expect(setDisguiseEnabled).toHaveBeenCalledWith(true));
  });

  it('selects a different disguise style', async () => {
    render(<DisguiseScreen />);
    const row = screen.getByLabelText('Disguise: Calculator');
    fireEvent.press(row);
    await waitFor(() => expect(setDisguiseStyle).toHaveBeenCalledWith('calculator'));
  });

  it('marks the active style with selected accessibilityState', () => {
    render(<DisguiseScreen />);
    const weatherRow = screen.getByLabelText('Disguise: Weather');
    expect(weatherRow.props.accessibilityState).toMatchObject({ selected: true });
    const calcRow = screen.getByLabelText('Disguise: Calculator');
    expect(calcRow.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('navigates to preview when "Preview disguise" tapped', () => {
    render(<DisguiseScreen />);
    fireEvent.press(screen.getByLabelText('Preview disguise'));
    expect(router.push).toHaveBeenCalledWith('/decoy');
  });

  it('goes back via header chevron', () => {
    render(<DisguiseScreen />);
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(router.back).toHaveBeenCalled();
  });
});
