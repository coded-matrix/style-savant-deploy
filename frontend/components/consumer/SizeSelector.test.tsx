import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SizeSelector } from './SizeSelector';
import { Product } from '@/lib/consumer/types';

const mockProduct: Product = {
  id: 'prod-1',
  vendorId: 'vendor-1',
  vendorName: 'Acme',
  name: 'Cool Shirt',
  description: 'A very cool shirt',
  priceGHS: 150.5,
  category: 'Top',
  sizes: ['S', 'M', 'L'],
  colors: ['Red'],
  images: [],
  clothImages: [],
  style: 'casual',
  createdAt: '2023-01-01',
  stockBySize: { S: true, M: false, L: true },
  soldOut: false,
};

test('renders multiple sizes', () => {
  const onChange = vi.fn();
  render(<SizeSelector product={mockProduct} onChange={onChange} />);
  expect(screen.getByText('S')).toBeDefined();
  expect(screen.getByText('M')).toBeDefined();
  expect(screen.getByText('L')).toBeDefined();
});

test('disables out of stock sizes', () => {
  const onChange = vi.fn();
  render(<SizeSelector product={mockProduct} onChange={onChange} />);
  const mBtn = screen.getByText('M');
  expect(mBtn).toHaveProperty('disabled', true);
});

test('calls onChange when a valid size is clicked', () => {
  const onChange = vi.fn();
  render(<SizeSelector product={mockProduct} onChange={onChange} />);
  const sBtn = screen.getByText('S');
  fireEvent.click(sBtn);
  expect(onChange).toHaveBeenCalledWith('S');
});

test('shows "One size" when product has only 1 size', () => {
  const onChange = vi.fn();
  const oneSizeProduct = { ...mockProduct, sizes: ['OS'] as any };
  render(<SizeSelector product={oneSizeProduct} onChange={onChange} />);
  expect(screen.getByText('One size')).toBeDefined();
});
