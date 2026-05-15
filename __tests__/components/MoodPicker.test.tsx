import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MoodPicker } from '@/components/ui/MoodPicker';
import { MOOD_LABELS } from '@/types';

describe('MoodPicker', () => {
  it('renders all five mood options', () => {
    render(<MoodPicker value={null} onChange={() => {}} />);
    expect(screen.getByLabelText('Terrible')).toBeTruthy();
    expect(screen.getByLabelText('Bad')).toBeTruthy();
    expect(screen.getByLabelText('Okay')).toBeTruthy();
    expect(screen.getByLabelText('Good')).toBeTruthy();
    expect(screen.getByLabelText('Great')).toBeTruthy();
  });

  it('calls onChange with the correct level when pressed', () => {
    const onChange = jest.fn();
    render(<MoodPicker value={null} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Good'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with level 1 for Terrible', () => {
    const onChange = jest.fn();
    render(<MoodPicker value={null} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Terrible'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with level 5 for Great', () => {
    const onChange = jest.fn();
    render(<MoodPicker value={null} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Great'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('marks selected option as selected in accessibility state', () => {
    render(<MoodPicker value={3} onChange={() => {}} />);
    const okay = screen.getByLabelText('Okay');
    expect(okay.props.accessibilityState).toEqual({ selected: true });
  });

  it('marks unselected options as not selected', () => {
    render(<MoodPicker value={3} onChange={() => {}} />);
    const good = screen.getByLabelText('Good');
    expect(good.props.accessibilityState).toEqual({ selected: false });
  });

  it('renders with no selection (null value)', () => {
    render(<MoodPicker value={null} onChange={() => {}} />);
    Object.values(MOOD_LABELS).forEach((label) => {
      const el = screen.getByLabelText(label);
      expect(el.props.accessibilityState).toEqual({ selected: false });
    });
  });
});
