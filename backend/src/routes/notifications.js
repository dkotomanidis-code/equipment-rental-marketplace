const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, validId } = require('../utils/api');

const router = express.Router();
router.use(authenticate);

router.get('/unread-count', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [req.user.id]
  );
  res.json({ unreadCount: rows[0].unreadCount });
}));

router.get('/', asyncRoute(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const [rows] = await pool.execute(
    `SELECT id, type, message, resource_type AS resourceType, resource_id AS resourceId,
            created_at AS createdAt, read_at AS readAt
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [req.user.id, limit, (page - 1) * limit]
  );
  const [counts] = await pool.execute('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?', [req.user.id]);
  res.json({ items: rows, page, limit, total: counts[0].total });
}));

router.param('id', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid notification ID' });
  next();
});

router.patch('/:id/read', asyncRoute(async (req, res) => {
  const [result] = await pool.execute(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL',
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) {
    const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [
      req.params.id, req.user.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ message: 'Notification marked as read' });
}));

router.patch('/read-all', asyncRoute(async (req, res) => {
  const [result] = await pool.execute(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
    [req.user.id]
  );
  res.json({ updated: result.affectedRows });
}));

module.exports = router;
