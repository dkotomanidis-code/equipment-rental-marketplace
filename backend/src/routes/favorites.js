const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { listFavoritesForUser } = require('../services/favorites');

const router = express.Router();
const protectedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const favorites = await listFavoritesForUser(req.user.id);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const equipmentId = Number(req.body.equipmentId);

    if (!equipmentId) {
      return res.status(400).json({ error: 'equipmentId is required' });
    }

    const equipmentRows = await db.query('SELECT id FROM equipment WHERE id = ? LIMIT 1', [equipmentId]);
    if (equipmentRows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const existingFavorite = await db.query(
      'SELECT id FROM user_favorites WHERE user_id = ? AND equipment_id = ? LIMIT 1',
      [req.user.id, equipmentId]
    );

    if (existingFavorite.length > 0) {
      return res.status(409).json({ error: 'Equipment is already in favorites' });
    }

    await db.query('INSERT INTO user_favorites (user_id, equipment_id) VALUES (?, ?)', [req.user.id, equipmentId]);

    const favorites = await listFavoritesForUser(req.user.id);
    const favorite = favorites.find((item) => item.equipmentId === equipmentId) || null;

    return res.status(201).json({
      message: 'Favorite added successfully',
      favorite,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Equipment is already in favorites' });
    }

    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:equipmentId', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const equipmentId = Number(req.params.equipmentId);

    if (!equipmentId) {
      return res.status(400).json({ error: 'Valid equipmentId is required' });
    }

    const result = await db.query('DELETE FROM user_favorites WHERE user_id = ? AND equipment_id = ?', [
      req.user.id,
      equipmentId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    return res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
