import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><Text>Hello</Text></Card>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders multiple children', () => {
    render(
      <Card>
        <Text>First</Text>
        <Text>Second</Text>
      </Card>
    );
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('renders without crashing in elevated mode', () => {
    render(<Card elevated><Text>Elevated</Text></Card>);
    expect(screen.getByText('Elevated')).toBeTruthy();
  });
});
