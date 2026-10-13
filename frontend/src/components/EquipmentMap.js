import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GEORGIA_CENTER } from '../data/georgiaCities';

const TILE_URL = process.env.REACT_APP_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = process.env.REACT_APP_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const hasCoordinates = (item) =>
  Number.isFinite(item.latitude) && Number.isFinite(item.longitude);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // textContent keeps user-provided listing data from being interpreted as HTML.
  if (text != null) node.textContent = text;
  return node;
}

/*
 * Map of equipment listings. Listings without coordinates are skipped by the
 * caller's count note; listings sharing a point (e.g. the same city centre)
 * are grouped into one marker whose popup lists all of them.
 */
export default function EquipmentMap({
  items, reference, radiusKm, onOpen, describe, labels,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false })
      .setView([GEORGIA_CENTER.latitude, GEORGIA_CENTER.longitude], GEORGIA_CENTER.zoom);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const groups = new Map();
    items.filter(hasCoordinates).forEach((item) => {
      const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    const points = [];
    groups.forEach((group) => {
      const point = [group[0].latitude, group[0].longitude];
      points.push(point);
      const popup = element('div', 'br-map-popup');
      group.forEach((item) => {
        const row = element('div', 'br-map-popup-item');
        const link = element('a', null, item.name);
        link.href = `/equipment/${encodeURIComponent(item.id)}`;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          openRef.current(item.id);
        });
        row.appendChild(link);
        const details = describe(item);
        if (details) row.appendChild(element('span', null, details));
        popup.appendChild(row);
      });
      L.circleMarker(point, {
        radius: Math.min(16, 7 + group.length),
        color: '#101010',
        weight: 2,
        fillColor: '#d6b66b',
        fillOpacity: 0.9,
      })
        .bindTooltip(group.length > 1 ? `${group.length} ${labels.listings}` : group[0].name)
        .bindPopup(popup)
        .addTo(layer);
    });

    if (reference) {
      const point = [reference.latitude, reference.longitude];
      points.push(point);
      if (radiusKm) {
        L.circle(point, {
          radius: radiusKm * 1000, color: '#d6b66b', weight: 1, fillOpacity: 0.05,
        }).addTo(layer);
      }
      L.circleMarker(point, {
        radius: 7, color: '#ffffff', weight: 2, fillColor: '#3b82f6', fillOpacity: 1,
      }).bindTooltip(labels.reference).addTo(layer);
    }

    if (reference && radiusKm) {
      map.fitBounds(L.latLng(reference.latitude, reference.longitude).toBounds(radiusKm * 2000), { padding: [20, 20] });
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 13 });
    } else if (points.length === 1) {
      map.setView(points[0], 12);
    } else {
      map.setView([GEORGIA_CENTER.latitude, GEORGIA_CENTER.longitude], GEORGIA_CENTER.zoom);
    }
  }, [items, reference, radiusKm, describe, labels]);

  return <div ref={containerRef} className="br-map" role="region" aria-label={labels.map} />;
}
