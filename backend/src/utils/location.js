const GEORGIA_CITIES = require('../data/georgiaCities.json');

const MAX_RADIUS_KM = 1000;
const normalize = (value) => String(value).trim().toLocaleLowerCase();

// Matches the canonical English name or the Georgian/Russian label of a curated city.
function findCity(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 100) return undefined;
  const key = normalize(value);
  return GEORGIA_CITIES.find((city) =>
    [city.name, city.ka, city.ru].some((label) => normalize(label) === key));
}

function coordinate(value, limit) {
  let number = value;
  if (typeof value === 'string') {
    if (!/^-?\d{1,3}(\.\d{1,10})?$/.test(value.trim())) return null;
    number = Number(value);
  }
  return typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= limit
    ? number : null;
}

const latitudeValue = (value) => coordinate(value, 90);
const longitudeValue = (value) => coordinate(value, 180);

/*
 * Validates optional city/latitude/longitude fields from a create/update body.
 * Returns null when invalid, otherwise only the columns that should be written.
 * Coordinates default to the city centre when a city is sent without coordinates.
 */
function equipmentLocation(body, creating = false) {
  const cityProvided = body.city !== undefined;
  const coordinatesProvided = body.latitude !== undefined || body.longitude !== undefined;
  const changes = {};

  if (cityProvided) {
    if (body.city === null || body.city === '') changes.city = null;
    else {
      const city = findCity(body.city);
      if (!city) return null;
      changes.city = city.name;
    }
  }

  if (coordinatesProvided) {
    if (body.latitude === null && body.longitude === null) {
      changes.latitude = null;
      changes.longitude = null;
    } else {
      if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') return null;
      const latitude = latitudeValue(body.latitude);
      const longitude = longitudeValue(body.longitude);
      if (latitude === null || longitude === null) return null;
      changes.latitude = latitude;
      changes.longitude = longitude;
    }
  } else if (cityProvided) {
    const city = changes.city ? findCity(changes.city) : null;
    changes.latitude = city ? city.latitude : null;
    changes.longitude = city ? city.longitude : null;
  }

  if (creating) {
    return { city: null, latitude: null, longitude: null, ...changes };
  }
  return changes;
}

// Great-circle distance in kilometres; NULL when the listing has no coordinates.
const distanceSql = `(6371 * 2 * ASIN(LEAST(1, SQRT(
  POWER(SIN(RADIANS(latitude - ?) / 2), 2) +
  COS(RADIANS(?)) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ?) / 2), 2)
))))`;
const distanceValues = (latitude, longitude) => [latitude, latitude, longitude];

module.exports = {
  GEORGIA_CITIES, MAX_RADIUS_KM, findCity, latitudeValue, longitudeValue,
  equipmentLocation, distanceSql, distanceValues,
};
