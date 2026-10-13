import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// jsdom lacks SVG geometry APIs that Leaflet checks for before drawing vector markers.
window.SVGSVGElement.prototype.createSVGRect = () => ({});
const L = require('leaflet');
const EquipmentMap = require('./EquipmentMap').default;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('groups listings sharing a point and renders popup text safely', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const popups = [];
  const bindPopup = jest.spyOn(L.CircleMarker.prototype, 'bindPopup')
    .mockImplementation(function capture(content) { popups.push(content); return this; });
  const onOpen = jest.fn();
  const items = [
    { id: 1, name: '<img src=x onerror=alert(1)>', latitude: 41.7151, longitude: 44.8271 },
    { id: 2, name: 'Second', latitude: 41.7151, longitude: 44.8271 },
    { id: 3, name: 'Batumi', latitude: 41.6168, longitude: 41.6367 },
    { id: 4, name: 'Nowhere', latitude: null, longitude: null },
  ];

  act(() => {
    root.render(
      <EquipmentMap
        items={items}
        reference={null}
        radiusKm={null}
        onOpen={onOpen}
        describe={() => 'details'}
        labels={{ listings: 'listings', reference: 'Reference', map: 'Map' }}
      />
    );
  });

  expect(popups).toHaveLength(2);
  const shared = popups.find((popup) => popup.children.length === 2);
  expect(shared.querySelector('img')).toBeNull();
  expect(shared.querySelector('a').textContent).toBe('<img src=x onerror=alert(1)>');
  shared.querySelectorAll('a')[1].click();
  expect(onOpen).toHaveBeenCalledWith(2);

  bindPopup.mockRestore();
  act(() => root.unmount());
  container.remove();
});
