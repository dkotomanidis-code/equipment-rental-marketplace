import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Wishlist from './Wishlist';

jest.mock('axios');

let container;
let root;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  jest.clearAllMocks();
});

test('shows a localized empty wishlist state', async () => {
  axios.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });

  await act(async () => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Wishlist language="en" />
      </MemoryRouter>
    );
  });

  expect(container.textContent).toContain('Your wishlist is empty.');
  expect(container.querySelector('a[href="/equipment"]')).not.toBeNull();
});

test('removes an item from the persisted wishlist', async () => {
  axios.get.mockResolvedValueOnce({
    data: { items: [{ id: 7, name: 'Portable generator', pricePerDay: 20 }], total: 1 },
  });
  axios.delete.mockResolvedValueOnce({});

  await act(async () => {
    root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Wishlist language="en" />
      </MemoryRouter>
    );
  });
  const removeButton = Array.from(container.querySelectorAll('button'))
    .find((button) => button.textContent === 'Remove');

  await act(async () => {
    removeButton.click();
    await Promise.resolve();
  });

  expect(axios.delete).toHaveBeenCalledWith(
    expect.stringContaining('/favorites/7'),
    expect.any(Object)
  );
  expect(container.textContent).toContain('Your wishlist is empty.');
});
