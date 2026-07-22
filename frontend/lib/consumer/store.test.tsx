import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { AppProvider, useApp } from './store';
import { catalogApi } from '@/lib/api/catalog';

vi.mock('@/lib/api/catalog', () => ({
  catalogApi: {
    getArtStyles: vi.fn().mockResolvedValue([]),
    getPresetModels: vi.fn().mockResolvedValue([]),
    getProducts: vi.fn().mockResolvedValue([{ id: 'p1', priceGHS: 100, category: 'Tops' }]),
    getLooks: vi.fn().mockResolvedValue([]),
    getBackdrops: vi.fn().mockResolvedValue([]),
    getArtists: vi.fn().mockResolvedValue([]),
    getVendors: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    me: vi.fn().mockRejectedValue(new Error('Not logged in'))
  }
}));

vi.mock('@/lib/api/token', () => ({
  getConsumerToken: vi.fn().mockReturnValue(null),
  clearConsumerToken: vi.fn(),
  __isBrowser: true,
  __LEGACY_SESSION_KEY: 'test-session',
}));

function TestComponent() {
  const { cartCount, cartSubtotal, addToCart, updateQty, removeFromCart } = useApp();

  return (
    <div>
      <div data-testid="cartCount">{cartCount}</div>
      <div data-testid="cartSubtotal">{cartSubtotal}</div>
      <button onClick={() => addToCart('p1', 'M' as any)}>Add p1(M)</button>
      <button onClick={() => addToCart('p1', 'L' as any)}>Add p1(L)</button>
      <button onClick={() => updateQty('p1-M-x', 5)}>Update p1(M) to 5</button>
      <button onClick={() => removeFromCart('p1-L-x')}>Remove p1(L)</button>
    </div>
  );
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true
  });
  window.localStorage.clear();
  vi.clearAllMocks();
});

test('AppProvider manages cart state correctly', async () => {
  render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );

  await waitFor(() => {
    expect(catalogApi.getProducts).toHaveBeenCalled();
  });

  const cartCount = screen.getByTestId('cartCount');
  const cartSubtotal = screen.getByTestId('cartSubtotal');

  expect(cartCount.textContent).toBe("0");

  fireEvent.click(screen.getByText('Add p1(M)'));
  expect(cartCount.textContent).toBe("1");
  expect(cartSubtotal.textContent).toBe("100");

  fireEvent.click(screen.getByText('Add p1(M)'));
  expect(cartCount.textContent).toBe("2");
  expect(cartSubtotal.textContent).toBe("200");

  fireEvent.click(screen.getByText('Add p1(L)'));
  expect(cartCount.textContent).toBe("3");

  fireEvent.click(screen.getByText('Update p1(M) to 5'));
  expect(cartCount.textContent).toBe("6");
  expect(cartSubtotal.textContent).toBe("600");

  fireEvent.click(screen.getByText('Remove p1(L)'));
  expect(cartCount.textContent).toBe("5");
  expect(cartSubtotal.textContent).toBe("500");
});
