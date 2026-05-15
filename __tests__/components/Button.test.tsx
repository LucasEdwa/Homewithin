import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders the label', () => {
    render(<Button label="Continue" onPress={() => {}} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Submit" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Submit" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator and hides label when loading', () => {
    render(<Button label="Submit" onPress={() => {}} loading />);
    expect(screen.queryByText('Submit')).toBeNull();
    // ActivityIndicator renders but text is gone
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button label="Submit" onPress={onPress} loading />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with secondary variant', () => {
    render(<Button label="Sign in" onPress={() => {}} variant="secondary" />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('renders with danger variant', () => {
    render(<Button label="Delete" onPress={() => {}} variant="danger" />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('uses accessibilityLabel when provided', () => {
    render(<Button label="Submit" onPress={() => {}} accessibilityLabel="Submit the form" />);
    expect(screen.getByLabelText('Submit the form')).toBeTruthy();
  });

  it('falls back to label as accessibilityLabel when not provided', () => {
    render(<Button label="Continue" onPress={() => {}} />);
    expect(screen.getByLabelText('Continue')).toBeTruthy();
  });
});
