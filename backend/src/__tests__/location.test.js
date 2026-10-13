const fs = require('fs');
const path = require('path');
const { GEORGIA_CITIES, findCity } = require('../utils/location');

test('curated Georgia cities have unique names and coordinates inside Georgia', () => {
  expect(new Set(GEORGIA_CITIES.map((city) => city.name)).size).toBe(GEORGIA_CITIES.length);
  for (const city of GEORGIA_CITIES) {
    expect(city.latitude).toBeGreaterThan(41);
    expect(city.latitude).toBeLessThan(43.6);
    expect(city.longitude).toBeGreaterThan(40);
    expect(city.longitude).toBeLessThan(46.8);
  }
});

test('city lookup accepts English, Georgian and Russian labels', () => {
  expect(findCity(' TBILISI ').name).toBe('Tbilisi');
  expect(findCity('ქუთაისი').name).toBe('Kutaisi');
  expect(findCity('Батуми').name).toBe('Batumi');
  expect(findCity('Atlantis')).toBeUndefined();
});

test('frontend city options match the backend dataset', () => {
  const frontend = path.join(__dirname, '../../../frontend/src/data/georgiaCities.json');
  if (!fs.existsSync(frontend)) return;
  expect(JSON.parse(fs.readFileSync(frontend, 'utf8'))).toEqual(GEORGIA_CITIES);
});
