import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafetySlider } from '@/components/ui/SafetySlider';

describe('SafetySlider', () => {
  it('renders with a label', () => {
    render(
      <SafetySlider
        label="How safe do you feel?"
        value={5}
        onValueChange={() => {}}
      />
    );
    expect(screen.getByText('How safe do you feel?')).toBeTruthy();
  });

  it('renders min and max labels', () => {
    render(
      <SafetySlider
        label="Safety"
        minLabel="Unsafe"
        maxLabel="Safe"
        value={5}
        onValueChange={() => {}}
      />
    );
    expect(screen.getByText('Unsafe')).toBeTruthy();
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('renders without labels', () => {
    render(<SafetySlider value={5} onValueChange={() => {}} />);
    // Should not crash without optional props
  });

  it('renders the accessible slider element', () => {
    render(
      <SafetySlider
        label="Mood"
        value={7}
        onValueChange={() => {}}
      />
    );
    // The label text AND the mocked Slider View both carry the label — at least one exists
    expect(screen.getAllByLabelText('Mood').length).toBeGreaterThanOrEqual(1);
  });
});
