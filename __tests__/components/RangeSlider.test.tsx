import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RangeSlider } from '@/components/ui/RangeSlider';

describe('RangeSlider', () => {
  it('renders the label', () => {
    render(<RangeSlider label="Anxiety" value={5} onValueChange={() => {}} />);
    expect(screen.getByText('Anxiety')).toBeTruthy();
  });

  it('renders the current value', () => {
    render(<RangeSlider label="Anxiety" value={7} onValueChange={() => {}} />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('renders minLabel and maxLabel when provided', () => {
    render(
      <RangeSlider
        label="Safety"
        value={5}
        onValueChange={() => {}}
        minLabel="Unsafe"
        maxLabel="Safe"
      />
    );
    expect(screen.getByText('Unsafe')).toBeTruthy();
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('does not render range labels when omitted', () => {
    render(<RangeSlider label="Loneliness" value={5} onValueChange={() => {}} />);
    expect(screen.queryByText('Isolated')).toBeNull();
  });

  it('renders the slider with correct accessibilityLabel', () => {
    render(<RangeSlider label="Anxiety" value={5} onValueChange={() => {}} />);
    expect(screen.getByLabelText('Anxiety')).toBeTruthy();
  });
});
