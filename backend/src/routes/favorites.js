const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, validId } = require('../utils/api');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncRoute(async (req, res) => {
  const page = Math.min(100000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT e.id, e.owner_id AS ownerId, e.name, e.description, e.category,
            e.price_per_day AS pricePerDay, e.location, e.image_url AS imageUrl,
            e.availability_status AS availabilityStatus, f.created_at AS favoritedAt
     FROM favorites f LEFT JOIN equipment e ON e.id = f.equipment_id
     WHERE f.user_id = ? ORDER BY f.created_at DESC, f.equipment_id DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );
  const [counts] = await pool.execute('SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?', [req.user.id]);
  res.json({
    items: rows.filter((item) => item.id).map((item) => ({
      ...item,
      availabilityStatus: Boolean(item.availabilityStatus),
    })),
    page,
    limit,
    total: counts[0].total,
  });
}));

router.param('equipmentId', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid equipment ID' });
  next();
});

router.get('/:equipmentId', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT 1 FROM favorites WHERE user_id = ? AND equipment_id = ?',
    [req.user.id, req.params.equipmentId]
  );
  res.json({ favorited: rows.length > 0 });
}));

router.post('/:equipmentId', asyncRoute(async (req, res) => {
  const [items] = await pool.execute('SELECT id FROM equipment WHERE id = ?', [req.params.equipmentId]);
  if (!items.length) return res.status(404).json({ error: 'Equipment not found' });
  await pool.execute(
    'INSERT IGNORE INTO favorites (user_id, equipment_id) VALUES (?, ?)',
    [req.user.id, req.params.equipmentId]
  );
  res.status(204).end();
}));

router.delete('/:equipmentId', asyncRoute(async (req, res) => {
  await pool.execute(
    'DELETE FROM favorites WHERE user_id = ? AND equipment_id = ?',
    [req.user.id, req.params.equipmentId]
  );
  res.status(204).end();
}));

module.exports = router;
