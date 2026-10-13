const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const {
  asyncRoute, validId, validText, priceCents, equipmentColumns, equipmentResponse,
} = require('../utils/api');
const {
  MAX_RADIUS_KM, findCity, latitudeValue, longitudeValue, equipmentLocation, distanceSql, distanceValues,
} = require('../utils/location');

const fields = {
  name: 'name', description: 'description', category: 'category',
  pricePerDay: 'price_per_day', location: 'location', imageUrl: 'image_url',
  availabilityStatus: 'availability_status',
};

function validEquipment(body, creating = false) {
  if (creating && (!validText(body.name, 255) || priceCents(body.pricePerDay) === null)) return false;
  return Object.keys(fields).every((key) => {
    if (body[key] === undefined) return true;
    if (key === 'pricePerDay') return priceCents(body[key]) !== null;
    if (key === 'availabilityStatus') return typeof body[key] === 'boolean';
    if (key === 'name') return validText(body[key], 255);
    const max = key === 'description' ? 16000 : key === 'category' ? 100 : 255;
    return body[key] === null || (typeof body[key] === 'string' && body[key].length <= max);
  });
}

// Get all equipment (public browsing)
// Optional: city=<Georgia city>, lat/lng=<reference point> (adds distanceKm and
// sorts nearest first, listings without coordinates last), radiusKm=<max distance>.
router.get('/', asyncRoute(async (req, res) => {
  const { category, search, location, city, lat, lng, radiusKm } = req.query;
  if ([category, search, location, city].some((value) => value !== undefined && !validText(value, 255))) {
    return res.status(400).json({ error: 'Invalid filters' });
  }
  const cityRow = city === undefined ? undefined : findCity(city);
  if (city !== undefined && !cityRow) return res.status(400).json({ error: 'Unknown city' });
  const hasReference = lat !== undefined || lng !== undefined;
  const latitude = hasReference && typeof lat === 'string' ? latitudeValue(lat) : null;
  const longitude = hasReference && typeof lng === 'string' ? longitudeValue(lng) : null;
  if (hasReference && (latitude === null || longitude === null)) {
    return res.status(400).json({ error: 'lat and lng must both be valid coordinates' });
  }
  let radius = null;
  if (radiusKm !== undefined) {
    radius = typeof radiusKm === 'string' && /^\d{1,4}(\.\d{1,3})?$/.test(radiusKm) ? Number(radiusKm) : 0;
    if (!hasReference || !(radius > 0 && radius <= MAX_RADIUS_KM)) {
      return res.status(400).json({ error: `radiusKm must be greater than 0 and at most ${MAX_RADIUS_KM}, with lat and lng` });
    }
  }

  const conditions = [];
  const values = [];
  if (category) { conditions.push('category = ?'); values.push(category); }
  if (location) { conditions.push('location = ?'); values.push(location); }
  if (cityRow) { conditions.push('city = ?'); values.push(cityRow.name); }
  if (search) {
    conditions.push('(LOCATE(?, name) > 0 OR LOCATE(?, description) > 0)');
    values.push(search, search);
  }
  if (radius !== null) {
    conditions.push(`latitude IS NOT NULL AND longitude IS NOT NULL AND ${distanceSql} <= ?`);
    values.push(...distanceValues(latitude, longitude), radius);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = hasReference
    ? await pool.execute(
      `SELECT ${equipmentColumns}, ${distanceSql} AS distanceKm FROM equipment${where}
       ORDER BY distanceKm IS NULL, distanceKm ASC, id DESC`,
      [...distanceValues(latitude, longitude), ...values]
    )
    : await pool.execute(`SELECT ${equipmentColumns} FROM equipment${where} ORDER BY id DESC`, values);
  res.json(rows.map(equipmentResponse));
}));

// Get the authenticated user's listings. Keep this before the /:id route.
router.get('/my-equipment', authenticate, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ${equipmentColumns} FROM equipment WHERE owner_id = ? ORDER BY id DESC`,
    [req.user.id]
  );
  res.json(rows.map(equipmentResponse));
}));

router.param('id', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid equipment ID' });
  next();
});

// Get single equipment
router.get('/:id', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${equipmentColumns} FROM equipment WHERE id = ?`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
  res.json(equipmentResponse(rows[0]));
}));

// Create equipment (the authenticated user owns the listing)
router.post('/', authenticate, asyncRoute(async (req, res) => {
  if (!validEquipment(req.body, true)) {
    return res.status(400).json({ error: 'A name and positive daily price are required; check equipment fields' });
  }
  const place = equipmentLocation(req.body, true);
  if (!place) return res.status(400).json({ error: 'Invalid city or coordinates' });
  const { name, description, category, pricePerDay, location, imageUrl } = req.body;
  const [result] = await pool.execute(
    `INSERT INTO equipment (owner_id, name, description, category, price_per_day, location, city, latitude, longitude, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name.trim(), description ?? null, category ?? null,
      priceCents(pricePerDay) / 100, location ?? null, place.city, place.latitude, place.longitude, imageUrl ?? null]
  );
  const [rows] = await pool.execute(`SELECT ${equipmentColumns} FROM equipment WHERE id = ?`, [result.insertId]);
  res.status(201).json(equipmentResponse(rows[0]));
}));

// Update equipment
router.put('/:id', authenticate, asyncRoute(async (req, res) => {
  const keys = Object.keys(fields).filter((key) => req.body[key] !== undefined);
  const place = equipmentLocation(req.body);
  if (!place) return res.status(400).json({ error: 'Invalid city or coordinates' });
  const placeKeys = Object.keys(place);
  if ((!keys.length && !placeKeys.length) || !validEquipment(req.body)) {
    return res.status(400).json({ error: 'Invalid equipment fields' });
  }
  const [rows] = await pool.execute('SELECT owner_id FROM equipment WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
  if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can update equipment' });

  await pool.execute(
    `UPDATE equipment SET ${[...keys.map((key) => fields[key]), ...placeKeys].map((column) => `${column} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?`,
    [...keys.map((key) => key === 'pricePerDay' ? priceCents(req.body[key]) / 100 : req.body[key]),
      ...placeKeys.map((key) => place[key]), req.params.id, req.user.id]
  );
  const [items] = await pool.execute(`SELECT ${equipmentColumns} FROM equipment WHERE id = ?`, [req.params.id]);
  res.json(equipmentResponse(items[0]));
}));

// Delete equipment
router.delete('/:id', authenticate, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT owner_id FROM equipment WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
  if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete equipment' });
  await pool.execute('DELETE FROM equipment WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Equipment deleted' });
}));

module.exports = router;
