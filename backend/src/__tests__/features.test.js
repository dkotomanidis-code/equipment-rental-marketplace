process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');

jest.mock('../database/pool', () => ({
  execute: jest.fn(),
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require('../database/pool');
const app = require('../index');
const { signToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

const account = { id: 12, username: 'renter', email: 'renter@example.com' };
let server;
let base;
let connection;

async function request(method, path, body, user = account) {
  const headers = { 'Content-Type': 'application/json' };
  if (user) headers.Authorization = 'Bearer ' + signToken(user);
  const result = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = result.status === 204 ? null : await result.json();
  return { status: result.status, body: payload };
}

beforeAll((done) => {
  server = app.listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${server.address().port}/api`;
    done();
  });
});

afterAll((done) => { server.close(done); });

beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockResolvedValue([[{ tokenVersion: 0 }]]);
  connection = {
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);
});

test('review writes require authentication and reject invalid ratings before database access', async () => {
  expect((await request('POST', '/reviews', { bookingId: 5, rating: 5 }, null)).status).toBe(401);
  const result = await request('POST', '/reviews', { bookingId: 5, rating: 5.5 });
  expect(result.status).toBe(400);
  expect(pool.getConnection).not.toHaveBeenCalled();
});

test('review cannot be submitted for a foreign booking', async () => {
  connection.execute.mockResolvedValueOnce([[
    { id: 5, renterId: 99, equipmentId: 4, ownerId: 20, status: 'completed' },
  ]]);
  const result = await request('POST', '/reviews', { bookingId: 5, rating: 5, equipmentId: 4 });
  expect(result.status).toBe(403);
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.execute).toHaveBeenCalledTimes(1);
});

test('review uniqueness races return a conflict and roll back', async () => {
  connection.execute
    .mockResolvedValueOnce([[
      { id: 5, renterId: account.id, equipmentId: 4, ownerId: 20, status: 'completed' },
    ]])
    .mockResolvedValueOnce([[]])
    .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
  const result = await request('POST', '/reviews', { bookingId: 5, rating: 5, comment: 'Good' });
  expect(result.status).toBe(409);
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.commit).not.toHaveBeenCalled();
});

test('favourites are scoped to the signed-in user and return paginated listings', async () => {
  pool.execute.mockResolvedValueOnce([[{ id: 7, name: 'Drill' }]])
    .mockResolvedValueOnce([[{ total: 1 }]]);
  const result = await request('GET', '/favorites?page=1&limit=20');
  expect(result.status).toBe(200);
  expect(pool.execute.mock.calls[0][1][0]).toBe(account.id);
  expect(pool.execute.mock.calls[0][0]).toContain('WHERE f.user_id = ?');
});

test('favourite additions are idempotent and bound to the signed-in user', async () => {
  pool.execute.mockResolvedValueOnce([[{ id: 7 }]])
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockResolvedValueOnce([[{ id: 7 }]])
    .mockResolvedValueOnce([{ affectedRows: 0 }]);
  expect((await request('POST', '/favorites/7', {})).status).toBe(204);
  expect((await request('POST', '/favorites/7', {})).status).toBe(204);
  expect(pool.execute.mock.calls[1][0]).toContain('INSERT IGNORE');
  expect(pool.execute.mock.calls[1][1]).toEqual([account.id, '7']);
  expect(pool.execute.mock.calls[3][0]).toContain('INSERT IGNORE');
});

test('chat hides a guessed conversation ID from a nonparticipant', async () => {
  pool.execute.mockResolvedValueOnce([[]]);
  expect((await request('GET', '/chat/conversations/45/messages')).status).toBe(404);
  expect(pool.execute.mock.calls[0][1]).toEqual(['45', account.id, account.id]);
});

test('chat refuses forged sender and recipient fields', async () => {
  const result = await request('POST', '/chat/conversations/45/messages', {
    body: 'hello', senderId: 1, recipientId: 2,
  });
  expect(result.status).toBe(400);
  expect(pool.getConnection).not.toHaveBeenCalled();
});

test('notification reads and lists are constrained to the authenticated recipient', async () => {
  pool.execute.mockResolvedValueOnce([[{ id: 2, message: 'New message' }]])
    .mockResolvedValueOnce([[{ total: 1 }]]);
  expect((await request('GET', '/notifications')).status).toBe(200);
  expect(pool.execute.mock.calls[0][1][0]).toBe(account.id);
  expect(pool.execute.mock.calls[0][0]).toContain('WHERE user_id = ?');
});

test('marking a notification read only updates the authenticated recipient row', async () => {
  pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
  expect((await request('PATCH', '/notifications/6/read', {})).status).toBe(200);
  expect(pool.execute.mock.calls[0][0]).toContain('WHERE id = ? AND user_id = ?');
  expect(pool.execute.mock.calls[0][1]).toEqual(['6', account.id]);
});

test('notifications use idempotent database insertion for duplicate events', async () => {
  pool.execute.mockResolvedValue([{ affectedRows: 0 }]);
  await createNotification(pool, {
    userId: 2, actorId: 1, eventKey: 'message:9', type: 'message',
    message: 'A message', resourceType: 'conversation', resourceId: 3,
  });
  expect(pool.execute.mock.calls[0][0]).toContain('INSERT IGNORE');
  expect(pool.execute.mock.calls[0][1][2]).toBe('message:9');
});

test('message transaction rolls back when notification persistence fails', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  connection.execute
    .mockResolvedValueOnce([[
      { id: 3, equipmentId: 4, renterId: account.id, ownerId: 20 },
    ]])
    .mockResolvedValueOnce([{ insertId: 88 }])
    .mockResolvedValueOnce([{ affectedRows: 1 }])
    .mockRejectedValueOnce(new Error('notification insert failed'));
  const result = await request('POST', '/chat/conversations/3/messages', { body: 'Hello' });
  expect(result.status).toBe(500);
  expect(connection.rollback).toHaveBeenCalled();
  expect(connection.commit).not.toHaveBeenCalled();
  log.mockRestore();
});
