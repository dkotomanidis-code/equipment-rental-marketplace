const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { serializeEquipment } = require('../utils/serializers');

// Get all equipment
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const params = [];
    let sql = `
      SELECT
        e.*,
        owner.username AS owner_username,
        owner.first_name AS owner_first_name,
        owner.last_name AS owner_last_name
      FROM equipment e
      LEFT JOIN users owner ON owner.id = e.owner_id
      WHERE 1 = 1
    `;

    if (category) {
      sql += ' AND e.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (LOWER(e.name) LIKE ? OR LOWER(COALESCE(e.description, "")) LIKE ?)';
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    sql += ' ORDER BY e.created_at DESC';

    const rows = await db.query(sql, params);
    res.json(rows.map((row) => serializeEquipment(row)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single equipment
router.get('/:id', async (req, res) => {
  try {
    const rows = await db.query(
      `
        SELECT
          e.*,
          owner.username AS owner_username,
          owner.first_name AS owner_first_name,
          owner.last_name AS owner_last_name
        FROM equipment e
        LEFT JOIN users owner ON owner.id = e.owner_id
        WHERE e.id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    return res.json(serializeEquipment(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create equipment (owner only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, category, pricePerDay, location, imageUrl } = req.body;

    if (!name || !pricePerDay) {
      return res.status(400).json({ error: 'name and pricePerDay are required' });
    }

    const result = await db.query(
      `
        INSERT INTO equipment (owner_id, name, description, category, price_per_day, location, image_url, availability_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, true)
      `,
      [req.user.id, name, description || null, category || null, pricePerDay, location || null, imageUrl || null]
    );

    await db.query('UPDATE users SET is_owner = true WHERE id = ?', [req.user.id]);

    const rows = await db.query('SELECT * FROM equipment WHERE id = ? LIMIT 1', [result.insertId]);
    return res.status(201).json(serializeEquipment(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update equipment
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const ownerRows = await db.query('SELECT id FROM equipment WHERE id = ? AND owner_id = ? LIMIT 1', [
      req.params.id,
      req.user.id,
    ]);

    if (ownerRows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const fieldMap = {
      name: 'name',
      description: 'description',
      category: 'category',
      pricePerDay: 'price_per_day',
      location: 'location',
      imageUrl: 'image_url',
      availabilityStatus: 'availability_status',
    };

    const updates = Object.entries(req.body).filter(([key]) => fieldMap[key]);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = [];
    const params = [];
    for (const [key, value] of updates) {
      fields.push(`${fieldMap[key]} = ?`);
      params.push(value);
    }

    params.push(req.params.id, req.user.id);

    await db.query(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ? AND owner_id = ?`, params);

    const rows = await db.query('SELECT * FROM equipment WHERE id = ? LIMIT 1', [req.params.id]);
    return res.json(serializeEquipment(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete equipment
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM equipment WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    return res.json({ message: 'Equipment deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
