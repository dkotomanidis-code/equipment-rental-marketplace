import cities from './georgiaCities.json';

/*
 * Curated major cities of Georgia (country). The canonical English `name` is
 * what the API stores; `ka`/`ru` are display labels. Keep georgiaCities.json
 * identical to backend/src/data/georgiaCities.json (a backend test checks this).
 */
export const GEORGIA_CITIES = cities;

export const DISTANCE_OPTIONS_KM = [5, 10, 25, 50, 100];

// Approximate centre of Georgia, used when there is nothing to fit on the map.
export const GEORGIA_CENTER = { latitude: 42.3, longitude: 43.4, zoom: 7 };

const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase();

export function findCity(value) {
  const key = normalize(value);
  if (!key) return undefined;
  return GEORGIA_CITIES.find((city) =>
    [city.name, city.ka, city.ru].some((label) => normalize(label) === key));
}

export function cityLabel(city, language = 'en') {
  if (!city) return '';
  if (language === 'ka') return city.ka;
  if (language === 'ru') return city.ru;
  return city.name;
}

// Cities sorted by their label in the current interface language.
export function cityOptions(language = 'en') {
  const locale = { en: 'en', ka: 'ka', ru: 'ru' }[language] || 'en';
  return [...GEORGIA_CITIES].sort((a, b) =>
    cityLabel(a, language).localeCompare(cityLabel(b, language), locale));
}
