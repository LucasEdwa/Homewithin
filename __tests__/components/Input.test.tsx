import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders a text input', () => {
    render(<Input label="Nickname" placeholder="Enter nickname" value="" onChangeText={() => {}} />);
    expect(screen.getByPlaceholderText('Enter nickname')).toBeTruthy();
  });

  it('renders label text', () => {
    render(<Input label="Nickname" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Nickname')).toBeTruthy();
  });

  it('displays error message', () => {
    render(<Input label="Nickname" value="" onChangeText={() => {}} error="Required field" />);
    expect(screen.getByText('Required field')).toBeTruthy();
  });

  it('does not display error when not provided', () => {
    render(<Input label="Nickname" value="" onChangeText={() => {}} />);
    expect(screen.queryByText('Required field')).toBeNull();
  });

  it('calls onChangeText when text changes', () => {
    const onChange = jest.fn();
    render(<Input label="Nickname" value="" onChangeText={onChange} />);
    fireEvent.changeText(screen.getByLabelText('Nickname'), 'River');
    expect(onChange).toHaveBeenCalledWith('River');
  });

  it('shows current value', () => {
    render(<Input label="Email" value="test@example.com" onChangeText={() => {}} />);
    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
  });
});
