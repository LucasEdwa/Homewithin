import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import SignInScreen from '@/app/(auth)/signin';
import * as supabaseModule from '@/services/supabase';

// jest.mock is hoisted to the top by Babel — outer-scope variables assigned via
// `const foo = jest.fn()` don't exist yet when the factory runs. Use jest.fn()
// directly inside the factory, then access the fns through the imported module.
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
  isSupabaseConfigured: true,
}));

// Typed accessors into the mocked module
const mockAuth = (supabaseModule.supabase as any).auth as {
  signInWithPassword: jest.Mock;
  signUp: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.signInWithPassword.mockResolvedValue({ error: null });
  mockAuth.signUp.mockResolvedValue({ data: { session: { user: { id: 'test-uid' } } }, error: null });
});

function fillForm(email: string, password: string) {
  fireEvent.changeText(screen.getByLabelText('Email'), email);
  fireEvent.changeText(screen.getByLabelText('Password'), password);
}

// ============================================================
describe('SignInScreen — rendering', () => {
  beforeEach(() => render(<SignInScreen />));

  it('shows the title', () => {
    expect(screen.getByText('Welcome back')).toBeTruthy();
  });

  it('renders email and password inputs', () => {
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('renders Sign in and Create account buttons', () => {
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Create account')).toBeTruthy();
  });

  it('renders the anonymous continue link', () => {
    expect(screen.getByText('Continue anonymously — no account needed')).toBeTruthy();
  });

  it('does NOT show the config banner when Supabase is configured', () => {
    expect(screen.queryByText('Supabase not configured')).toBeNull();
  });
});

// ============================================================
describe('SignInScreen — sign in', () => {
  beforeEach(() => render(<SignInScreen />));

  it('calls signInWithPassword with entered credentials', async () => {
    fillForm('test@example.com', 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('navigates to tabs on successful sign-in', async () => {
    fillForm('test@example.com', 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows error message on failed sign-in', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    });
    fillForm('wrong@example.com', 'badpass');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeTruthy();
    });
  });

  it('shows validation error when fields are empty', async () => {
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Please enter your email and password.')).toBeTruthy();
    });
    expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('shows validation error when only email is filled', async () => {
    fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Please enter your email and password.')).toBeTruthy();
    });
    expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
  });
});

// ============================================================
describe('SignInScreen — sign up', () => {
  beforeEach(() => render(<SignInScreen />));

  it('calls signUp with entered credentials', async () => {
    fillForm('new@example.com', 'securePass1');
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'securePass1',
      });
    });
  });

  it('navigates to onboarding after successful sign-up', async () => {
    fillForm('new@example.com', 'securePass1');
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/onboarding/step1');
    });
  });

  it('shows error message on failed sign-up', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      error: { message: 'User already registered' },
    });
    fillForm('existing@example.com', 'password123');
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeTruthy();
    });
  });

  it('shows validation error when fields are empty on sign-up', async () => {
    fireEvent.press(screen.getByText('Create account'));

    await waitFor(() => {
      expect(screen.getByText('Please enter your email and password.')).toBeTruthy();
    });
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });
});

// ============================================================
describe('SignInScreen — navigation', () => {
  beforeEach(() => render(<SignInScreen />));

  it('Back button calls router.back', () => {
    fireEvent.press(screen.getByText('← Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('anonymous link navigates to onboarding step1', () => {
    fireEvent.press(screen.getByText('Continue anonymously — no account needed'));
    expect(router.push).toHaveBeenCalledWith('/onboarding/step1');
  });
});
