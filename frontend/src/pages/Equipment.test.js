import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Equipment from './Equipment';

jest.mock('axios');
jest.mock('../components/FavoriteButton', () => () => null);
jest.mock('../components/EquipmentMap', () => ({ items, reference, radiusKm }) => (
  <div data-testid="map">
    {items.map((item) => item.name).join('|')}
    {reference ? ` @${reference.latitude},${reference.longitude}` : ''}
    {radiusKm ? ` r${radiusKm}` : ''}
  </div>
));

let container;
let root;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const listings = [
  { id: 1, name: 'Old digger', pricePerDay: 50, location: 'Vake', city: null, latitude: null, longitude: null, availabilityStatus: true, createdAt: '2026-01-02' },
  { id: 2, name: 'Batumi pump', pricePerDay: 60, location: null, city: 'Batumi', latitude: 41.6168, longitude: 41.6367, availabilityStatus: true, createdAt: '2026-01-01' },
];

async function renderAt(path) {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Equipment language="en" />
      </MemoryRouter>
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.clearAllMocks();
  delete navigator.geolocation;
});

test('default browse request is unchanged and listings without coordinates stay visible', async () => {
  axios.get.mockResolvedValue({ data: listings });
  await renderAt('/equipment');
  expect(axios.get).toHaveBeenCalledWith('/api/equipment', expect.not.objectContaining({ params: expect.anything() }));
  expect(container.textContent).toContain('Old digger');
  expect(container.textContent).toContain('Batumi pump');
  expect(container.textContent).toContain('Vake');
  const cities = Array.from(container.querySelectorAll('#br-city option')).map((option) => option.value);
  expect(cities).toContain('Tbilisi');
  expect(cities).toContain('Batumi');
});

test('city and distance filters are sent to the API with nearest-first sorting', async () => {
  axios.get.mockResolvedValue({ data: [{ ...listings[1], distanceKm: 1.234 }] });
  await renderAt('/equipment?city=Batumi&near=Batumi&radius=25&sort=distance');
  expect(axios.get).toHaveBeenLastCalledWith('/api/equipment', expect.objectContaining({
    params: { city: 'Batumi', lat: '41.6168', lng: '41.6367', radiusKm: '25' },
  }));
  expect(container.querySelector('#br-sort').value).toBe('distance');
  expect(container.textContent).toContain('1.2 km');
});

test('map view shows every filtered listing and notes listings without coordinates', async () => {
  axios.get.mockResolvedValue({ data: listings });
  await renderAt('/equipment?view=map');
  expect(container.querySelector('[data-testid="map"]').textContent).toContain('Old digger|Batumi pump');
  expect(container.textContent).toContain('1 listing(s) without a map location');
  expect(container.querySelector('.br-cards')).toBeNull();
});

test('denied geolocation falls back gracefully without distance parameters', async () => {
  navigator.geolocation = { getCurrentPosition: jest.fn((success, failure) => failure({ code: 1 })) };
  axios.get.mockResolvedValue({ data: listings });
  await renderAt('/equipment?near=me');
  expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  expect(container.textContent).toContain('We could not access your location');
  expect(axios.get.mock.calls.every(([, config]) => !config.params)).toBe(true);
  expect(container.textContent).toContain('Old digger');
});

test('granted geolocation sends a rounded reference point', async () => {
  navigator.geolocation = {
    getCurrentPosition: jest.fn((success) => success({ coords: { latitude: 41.715137, longitude: 44.827096 } })),
  };
  axios.get.mockResolvedValue({ data: listings });
  await renderAt('/equipment?near=me&radius=10');
  expect(axios.get).toHaveBeenLastCalledWith('/api/equipment', expect.objectContaining({
    params: { lat: '41.7150', lng: '44.8270', radiusKm: '10' },
  }));
});
