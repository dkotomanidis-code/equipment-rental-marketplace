import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import ListEquipment from './ListEquipment';

jest.mock('axios');

let container;
let root;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function setValue(element, value) {
  const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype
    : element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
  element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

async function renderAt(path) {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/list-equipment" element={<ListEquipment language="en" />} />
          <Route path="*" element={<p>navigated</p>} />
        </Routes>
      </MemoryRouter>
    );
  });
}

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  window.alert = jest.fn();
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

test('creating a listing sends the selected Georgia city with API field names', async () => {
  axios.post.mockResolvedValueOnce({ data: { id: 9 } });
  await renderAt('/list-equipment');
  const field = (name) => container.querySelector(`[name="${name}"]`);
  expect(Array.from(field('city').options).map((option) => option.value)).toContain('Kutaisi');

  await act(async () => {
    setValue(field('name'), 'Crane');
    setValue(field('description'), 'Tall crane');
    setValue(field('daily_price'), '120.50');
    setValue(field('city'), 'Kutaisi');
    setValue(field('location'), 'Near the station');
    setValue(field('image_url'), 'https://example.com/crane.jpg');
  });
  await act(async () => {
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  expect(axios.post).toHaveBeenCalledWith('/api/equipment', {
    name: 'Crane',
    description: 'Tall crane',
    category: 'Excavator',
    pricePerDay: '120.50',
    location: 'Near the station',
    imageUrl: 'https://example.com/crane.jpg',
    city: 'Kutaisi',
  }, expect.objectContaining({ headers: expect.any(Object) }));
});

test('editing loads the listing and only sends a changed city', async () => {
  axios.get.mockResolvedValueOnce({ data: {
    id: 4, name: 'Pump', description: 'Water pump', category: 'Drill', pricePerDay: 30,
    location: 'Old town', city: 'Batumi', imageUrl: 'https://example.com/pump.jpg',
  } });
  axios.put.mockResolvedValue({ data: {} });
  await renderAt('/list-equipment?edit=4');
  const field = (name) => container.querySelector(`[name="${name}"]`);
  expect(container.textContent).toContain('Edit Your Equipment');
  expect(field('city').value).toBe('Batumi');
  expect(field('daily_price').value).toBe('30');

  const submit = async () => act(async () => {
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await submit();
  expect(axios.put.mock.calls[0][0]).toBe('/api/equipment/4');
  expect(axios.put.mock.calls[0][1]).not.toHaveProperty('city');
});

test('editing with a new city sends it', async () => {
  axios.get.mockResolvedValueOnce({ data: {
    id: 4, name: 'Pump', description: 'Water pump', category: 'Drill', pricePerDay: 30,
    location: null, city: null, imageUrl: 'https://example.com/pump.jpg',
  } });
  axios.put.mockResolvedValue({ data: {} });
  await renderAt('/list-equipment?edit=4');
  await act(async () => { setValue(container.querySelector('[name="city"]'), 'Gori'); });
  await act(async () => {
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  expect(axios.put.mock.calls[0][1]).toMatchObject({ city: 'Gori', location: null, pricePerDay: '30' });
});
