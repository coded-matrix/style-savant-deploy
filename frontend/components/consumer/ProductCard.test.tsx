import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { ProductCard } from './ProductCard';
import { useApp } from '@/lib/consumer/store';
import { Product } from '@/lib/consumer/types';

// Mock the store
vi.mock('@/lib/consumer/store', () => ({
  useApp: vi.fn(),
}));

const mockProduct: Product = {
  id: 'prod-123',
  vendorId: 'vendor-1',
  vendorName: 'Acme',
  name: 'Cool Shirt',
  description: 'A very cool shirt',
  priceGHS: 150.5,
  category: 'Top',
  sizes: ['M', 'L'],
  colors: ['Red'],
  images: ['/img1.jpg'],
  clothImages: [],
  style: 'casual',
  createdAt: '2023-01-01',
  stockBySize: { M: true, L: false },
  soldOut: false,
};

beforeEach(() => {
  (useApp as any).mockReturnValue({
    likedProductIds: [],
    toggleLikeProduct: vi.fn(),
  });
});

test('renders ProductCard with product details', () => {
  render(<ProductCard product={mockProduct} />);
  expect(screen.getByText('Cool Shirt')).toBeDefined();
  expect(screen.getByText('Acme')).toBeDefined();
  expect(screen.getByText('GH₵150.50')).toBeDefined();
});

test('shows Sold Out badge when soldOut is true', () => {
  const soldOutProduct = { ...mockProduct, soldOut: true };
  render(<ProductCard product={soldOutProduct} />);
  expect(screen.getByText('Sold Out')).toBeDefined();
});

test('calls toggleLikeProduct when heart is clicked', () => {
  const toggleLikeProduct = vi.fn();
  (useApp as any).mockReturnValue({
    likedProductIds: [],
    toggleLikeProduct,
  });

  render(<ProductCard product={mockProduct} />);
  const likeBtn = screen.getByRole('button', { name: 'Like' });
  fireEvent.click(likeBtn);
  expect(toggleLikeProduct).toHaveBeenCalledWith('prod-123');
});
