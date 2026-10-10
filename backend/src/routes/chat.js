const express = require('express');
const { rateLimit } = require('express-rate-limit');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, validId, validText } = require('../utils/api');
const { createNotification } = require('../utils/notifications');

const router = express.Router();
router.use(authenticate);

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages, please try again later' },
});

function pagination(query) {
  const requestedPage = Number.parseInt(query.page, 10) || 1;
  const requestedLimit = Number.parseInt(query.limit, 10) || 30;
  const page = Math.min(100000, Math.max(1, requestedPage));
  const limit = Math.min(50, Math.max(1, requestedLimit));
  return { page, limit, offset: (page - 1) * limit };
}

async function findParticipantConversation(db, conversationId, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT id, equipment_id AS equipmentId, renter_id AS renterId, owner_id AS ownerId
     FROM conversations
     WHERE id = ? AND (renter_id = ? OR owner_id = ?)${lock ? ' FOR UPDATE' : ''}`,
    [conversationId, userId, userId]
  );
  return rows[0];
}

router.get('/unread-count', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS unreadCount FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.read_at IS NULL AND m.sender_id <> ?
       AND (c.renter_id = ? OR c.owner_id = ?)`,
    [req.user.id, req.user.id, req.user.id]
  );
  res.json({ unreadCount: rows[0].unreadCount });
}));

router.get('/conversations', asyncRoute(async (req, res) => {
  const { page, limit, offset } = pagination(req.query);
  const [rows] = await pool.execute(
    `SELECT c.id, c.equipment_id AS equipmentId, e.name AS equipmentName,
            other.id AS otherUserId, other.username AS otherUsername,
            c.updated_at AS updatedAt,
            (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS lastMessage,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id
             AND m.sender_id <> ? AND m.read_at IS NULL) AS unreadCount
     FROM conversations c
     LEFT JOIN equipment e ON e.id = c.equipment_id
     JOIN users other ON other.id = IF(c.renter_id = ?, c.owner_id, c.renter_id)
     WHERE c.renter_id = ? OR c.owner_id = ?
     ORDER BY c.updated_at DESC, c.id DESC LIMIT ? OFFSET ?`,
    [req.user.id, req.user.id, req.user.id, req.user.id, limit, offset]
  );
  const [counts] = await pool.execute(
    'SELECT COUNT(*) AS total FROM conversations WHERE renter_id = ? OR owner_id = ?',
    [req.user.id, req.user.id]
  );
  res.json({ items: rows, page, limit, total: counts[0].total });
}));

router.post('/conversations', asyncRoute(async (req, res) => {
  const equipmentId = req.body?.equipmentId;
  if (!validId(equipmentId)) return res.status(400).json({ error: 'Valid equipmentId is required' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [items] = await connection.execute(
      'SELECT id, owner_id FROM equipment WHERE id = ? FOR UPDATE',
      [equipmentId]
    );
    if (!items.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Equipment not found' });
    }
    if (items[0].owner_id === req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Cannot start a conversation with yourself' });
    }
    const [existing] = await connection.execute(
      'SELECT id FROM conversations WHERE equipment_id = ? AND renter_id = ? FOR UPDATE',
      [equipmentId, req.user.id]
    );
    let conversationId = existing[0]?.id;
    if (!conversationId) {
      const [result] = await connection.execute(
        'INSERT INTO conversations (equipment_id, renter_id, owner_id) VALUES (?, ?, ?)',
        [equipmentId, req.user.id, items[0].owner_id]
      );
      conversationId = result.insertId;
    }
    await connection.commit();
    res.status(existing.length ? 200 : 201).json({ id: conversationId, equipmentId: Number(equipmentId) });
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

router.param('id', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid conversation ID' });
  next();
});

router.get('/conversations/:id/messages', asyncRoute(async (req, res) => {
  const conversation = await findParticipantConversation(pool, req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  const { page, limit, offset } = pagination(req.query);
  const [rows] = await pool.execute(
    `SELECT m.id, m.sender_id AS senderId, u.username AS senderUsername,
            m.body, m.created_at AS createdAt, m.read_at AS readAt
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT ? OFFSET ?`,
    [req.params.id, limit, offset]
  );
  const [counts] = await pool.execute('SELECT COUNT(*) AS total FROM messages WHERE conversation_id = ?', [
    req.params.id,
  ]);
  res.json({
    items: rows.reverse(),
    page,
    limit,
    total: counts[0].total,
    hasMore: offset + rows.length < counts[0].total,
  });
}));

router.post('/conversations/:id/messages', messageLimiter, asyncRoute(async (req, res) => {
  const body = req.body?.body;
  if (!validText(body, 2000) || Object.keys(req.body || {}).some((key) => key !== 'body')) {
    return res.status(400).json({ error: 'Message must be plain text between 1 and 2000 characters' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const conversation = await findParticipantConversation(connection, req.params.id, req.user.id, true);
    if (!conversation) {
      await connection.rollback();
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const [result] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
      [conversation.id, req.user.id, body.trim()]
    );
    await connection.execute('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      conversation.id,
    ]);
    const recipientId = conversation.renterId === req.user.id
      ? conversation.ownerId
      : conversation.renterId;
    await createNotification(connection, {
      userId: recipientId,
      actorId: req.user.id,
      eventKey: `message:${result.insertId}`,
      type: 'message',
      message: 'You received a new message',
      resourceType: 'conversation',
      resourceId: conversation.id,
    });
    await connection.commit();
    res.status(201).json({
      id: result.insertId,
      conversationId: conversation.id,
      senderId: req.user.id,
      body: body.trim(),
    });
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

router.patch('/conversations/:id/read', asyncRoute(async (req, res) => {
  const conversation = await findParticipantConversation(pool, req.params.id, req.user.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
  const [result] = await pool.execute(
    `UPDATE messages SET read_at = CURRENT_TIMESTAMP
     WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL`,
    [conversation.id, req.user.id]
  );
  res.json({ updated: result.affectedRows });
}));

module.exports = router;
