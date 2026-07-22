import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Button, TextLink } from './Button';

test('renders Button with children', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeDefined();
});

test('handles click events', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  fireEvent.click(screen.getByText('Click Me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('Button is disabled when loading prop is true', () => {
  render(<Button loading>Loading State</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveProperty('disabled', true);
  expect(screen.getByText('progress_activity')).toBeDefined();
});

test('renders TextLink correctly', () => {
  render(<TextLink>Secondary Action</TextLink>);
  const link = screen.getByRole('button');
  expect(link.textContent).toBe('Secondary Action');
});
