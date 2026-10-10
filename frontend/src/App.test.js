import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import App from './App';
import axios from 'axios';

jest.mock('axios');
let container;
let root;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  axios.get.mockResolvedValue({ data: [] });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
test('home page retains its existing content and navigation', async () => {
  await act(async () => root.render(<App />));
  expect(container.querySelector('h1').textContent).toBe('Find Equipment to Rent');
  expect(container.querySelectorAll('.feature-card')).toHaveLength(4);
  expect(container.querySelector('a[href="/equipment"]').textContent).toBe('Browse');
});
test('browse navigation renders through the production router', async () => {
  await act(async () => root.render(<App />));
  await act(async () => {
    container.querySelector('a[href="/equipment"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(container.textContent).toContain('No equipment found');
});
test('authenticated listing route mounts the restored listing form', async () => {
  localStorage.setItem('token', 'test-token');
  window.history.replaceState({}, '', '/list-equipment');
  await act(async () => root.render(<App />));
  expect(container.querySelector('input[name="name"]')).not.toBeNull();
  expect(container.querySelector('input[name="pricePerDay"]')).not.toBeNull();
});
