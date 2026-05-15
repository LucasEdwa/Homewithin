import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Tag } from '@/components/ui/Tag';

describe('Tag', () => {
  it('renders the label', () => {
    render(<Tag label="Family" />);
    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Tag label="Hope" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Hope'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility state when not selected', () => {
    render(<Tag label="Fear" selected={false} onPress={() => {}} />);
    const tag = screen.getByRole('checkbox', { name: 'Fear' });
    expect(tag.props.accessibilityState).toEqual({ checked: false });
  });

  it('has correct accessibility state when selected', () => {
    render(<Tag label="Fear" selected={true} onPress={() => {}} />);
    const tag = screen.getByRole('checkbox', { name: 'Fear' });
    expect(tag.props.accessibilityState).toEqual({ checked: true });
  });

  it('renders without onPress (non-interactive)', () => {
    render(<Tag label="Static" />);
    expect(screen.getByText('Static')).toBeTruthy();
  });
});
