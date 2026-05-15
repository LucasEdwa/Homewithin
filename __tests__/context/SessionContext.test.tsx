import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SessionProvider, useSession } from '@/context/SessionContext';
import * as SecureStore from 'expo-secure-store';

const mockStore = SecureStore as any;

beforeEach(() => {
  mockStore.__reset?.();
  jest.clearAllMocks();
});

// Helper component to observe context values
function SessionDisplay() {
  const { profile, safetyLevel, onboardingComplete, loading } = useSession();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="complete">{String(onboardingComplete)}</Text>
      <Text testID="level">{safetyLevel ?? 'null'}</Text>
      <Text testID="nickname">{profile?.nickname ?? 'none'}</Text>
    </>
  );
}

function SessionActions() {
  const { setProfile, setSafetyLevel, completeOnboarding, reset } = useSession();
  return (
    <>
      <Text
        testID="setProfile"
        onPress={() => setProfile({
          nickname: 'River',
          pronouns: 'they/them',
          ageRange: '18–24',
          language: 'English',
          country: 'Brazil',
          hideFromSearch: true,
          needs: [],
          isAnonymous: true,
        })}
      >
        Set Profile
      </Text>
      <Text testID="setGreen" onPress={() => setSafetyLevel('green')}>Green</Text>
      <Text testID="setRed" onPress={() => setSafetyLevel('red')}>Red</Text>
      <Text testID="doComplete" onPress={() => completeOnboarding()}>Complete</Text>
      <Text testID="reset" onPress={() => reset()}>Reset</Text>
    </>
  );
}

describe('SessionProvider', () => {
  it('starts with loading true and then resolves', async () => {
    render(<SessionProvider><SessionDisplay /></SessionProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });
  });

  it('starts with onboardingComplete false when no storage', async () => {
    render(<SessionProvider><SessionDisplay /></SessionProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('complete').props.children).toBe('false');
    });
  });

  it('reads onboardingComplete from SecureStore on mount', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'hw_onboarding_complete') return 'true';
      return null;
    });
    render(<SessionProvider><SessionDisplay /></SessionProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('complete').props.children).toBe('true');
    });
  });

  it('starts with safetyLevel null', async () => {
    render(<SessionProvider><SessionDisplay /></SessionProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('level').props.children).toBe('null');
    });
  });
});

describe('SessionContext actions', () => {
  async function setup() {
    const { getByTestId } = render(
      <SessionProvider>
        <SessionDisplay />
        <SessionActions />
      </SessionProvider>
    );
    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    return { getByTestId };
  }

  it('setProfile updates nickname in context', async () => {
    const { getByTestId } = await setup();
    expect(getByTestId('nickname').props.children).toBe('none');
    await act(async () => {
      getByTestId('setProfile').props.onPress();
    });
    await waitFor(() => {
      expect(getByTestId('nickname').props.children).toBe('River');
    });
  });

  it('setProfile persists to SecureStore', async () => {
    const { getByTestId } = await setup();
    await act(async () => {
      getByTestId('setProfile').props.onPress();
    });
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'hw_session',
        expect.stringContaining('River')
      );
    });
  });

  it('setSafetyLevel updates the level', async () => {
    const { getByTestId } = await setup();
    expect(getByTestId('level').props.children).toBe('null');
    act(() => { getByTestId('setGreen').props.onPress(); });
    expect(getByTestId('level').props.children).toBe('green');
  });

  it('setSafetyLevel can be set to red', async () => {
    const { getByTestId } = await setup();
    act(() => { getByTestId('setRed').props.onPress(); });
    expect(getByTestId('level').props.children).toBe('red');
  });

  it('completeOnboarding sets onboardingComplete to true', async () => {
    const { getByTestId } = await setup();
    expect(getByTestId('complete').props.children).toBe('false');
    await act(async () => {
      getByTestId('doComplete').props.onPress();
    });
    await waitFor(() => {
      expect(getByTestId('complete').props.children).toBe('true');
    });
  });

  it('reset clears profile and safety level', async () => {
    const { getByTestId } = await setup();
    await act(async () => { getByTestId('setProfile').props.onPress(); });
    await waitFor(() => expect(getByTestId('nickname').props.children).toBe('River'));
    act(() => { getByTestId('reset').props.onPress(); });
    expect(getByTestId('nickname').props.children).toBe('none');
  });
});
