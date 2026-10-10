process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.STRIPE_SECRET_KEY = 'test-placeholder';

jest.mock('../database/pool', () => ({
  execute: jest.fn(),
  getConnection: jest.fn(),
}));
jest.mock('stripe', () => {
  const client = {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    refunds: { create: jest.fn() },
  };
  return jest.fn(() => client);
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../database/pool');
const stripe = require('stripe')();
const app = require('../index');
const { signToken } = require('../middleware/auth');
const { rentalDays, priceCents } = require('../utils/api');

let server;
let base;
let connection;
const user = { id: 2, username: 'renter', email: 'renter@example.com' };
const owner = { id: 1, username: 'owner', email: 'owner@example.com' };
const item = {
  id: 4, ownerId: 1, name: 'Camera', pricePerDay: 12.34,
  availabilityStatus: 1, description: 'A camera', category: 'camera',
};
const booking = {
  id: 8, renterId: 2, ownerId: 1, equipmentId: 4, startDate: '2027-01-01',
  endDate: '2027-01-03', totalPrice: 24.68, status: 'pending', paymentStatus: 'unpaid',
  paymentId: null,
};

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = ['Bearer', token].join(' ');
  const result = await fetch(`${base}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: result.status, body: await result.json() };
}
const asUser = (method, path, body, account = user) => request(method, path, body, signToken(account));

beforeAll((done) => {
  server = app.listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${server.address().port}/api`;
    done();
  });
});
afterAll((done) => { server.close(done); });
beforeEach(() => {
  jest.clearAllMocks();
  pool.execute.mockReset();
  connection = {
    execute: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(),
    rollback: jest.fn(), release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(connection);
});

describe('authentication', () => {
  test('signup hashes the password, persists a user and returns an expiring signed JWT', async () => {
    pool.execute.mockResolvedValue([{ insertId: 2 }]);
    const result = await request('POST', '/auth/signup', { ...user, password: 'a-test-password' });
    expect(result.status).toBe(201);
    expect(result.body.user).toEqual(user);
    const payload = jwt.verify(result.body.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    expect(payload).toMatchObject(user);
    expect(payload.exp - payload.iat).toBe(7 * 86400);
    const params = pool.execute.mock.calls[0][1];
    expect(await bcrypt.compare('a-test-password', params[2])).toBe(true);
    expect(result.body.user.password).toBeUndefined();
  });

  test('login loads persisted credentials and returns the existing response shape', async () => {
    pool.execute.mockResolvedValue([[{ ...user, password: await bcrypt.hash('password', 4) }]]);
    const result = await request('POST', '/auth/login', { email: user.email, password: 'password' });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ message: 'Login successful', user });
    expect(jwt.verify(result.body.token, process.env.JWT_SECRET).id).toBe(2);
  });

  test('signup accepts the frontend empty optional name fields', async () => {
    pool.execute.mockResolvedValue([{ insertId: 2 }]);
    expect((await request('POST', '/auth/signup', {
      ...user, password: 'password', firstName: '', lastName: '',
    })).status).toBe(201);
    expect(pool.execute.mock.calls[0][1].slice(3)).toEqual([null, null]);
  });

  test.each([{ rows: [] }, { rows: [{ ...user, password: '$2a$04$invalid' }] }])('invalid login returns 401', async ({ rows }) => {
    pool.execute.mockResolvedValue([rows]);
    const result = await request('POST', '/auth/login', { email: user.email, password: 'wrong' });
    expect(result.status).toBe(401);
  });

  test.each([
    {}, { username: 'user', email: 'bad', password: 'pass' },
    { username: {}, email: user.email, password: 'pass' },
    { username: 'user', email: user.email, password: 'x'.repeat(73) },
  ])('invalid signup never queries the database', async (body) => {
    expect((await request('POST', '/auth/signup', body)).status).toBe(400);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('duplicate signup returns a safe conflict', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.execute.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    const result = await request('POST', '/auth/signup', { ...user, password: 'password' });
    expect(result.status).toBe(409);
    expect(result.body.error).not.toContain('SQL');
    log.mockRestore();
  });

  test.each([
    undefined, 'mock-jwt-token',
    jwt.sign({ id: 2 }, 'a-different-secret', { expiresIn: '1h' }),
    jwt.sign({ id: 2 }, process.env.JWT_SECRET, { expiresIn: -1 }),
    jwt.sign({ id: 2 }, process.env.JWT_SECRET, { algorithm: 'HS384', expiresIn: '1h' }),
    jwt.sign({ id: 2 }, process.env.JWT_SECRET),
    jwt.sign({ id: '2' }, process.env.JWT_SECRET, { expiresIn: '1h' }),
  ])('protected routes reject missing, invalid, expired or unsuitable tokens', async (token) => {
    expect((await request('GET', '/bookings', undefined, token)).status).toBe(401);
    expect(pool.execute).not.toHaveBeenCalled();
  });
});

describe('equipment', () => {
  test('listing is public, parameterized and preserves camelCase fields and booleans', async () => {
    pool.execute.mockResolvedValue([[item]]);
    const result = await request('GET', '/equipment?category=camera&search=%27&location=London');
    expect(result.status).toBe(200);
    expect(result.body).toEqual([{ ...item, availabilityStatus: true }]);
    expect(pool.execute.mock.calls[0][1]).toEqual(['camera', 'London', "'", "'"]);
    expect(pool.execute.mock.calls[0][0]).not.toContain("LOCATE('");
  });
  test('fetches single equipment', async () => {
    pool.execute.mockResolvedValue([[item]]);
    expect((await request('GET', '/equipment/4')).body.name).toBe('Camera');
  });
  test('returns 404 for missing equipment', async () => {
    pool.execute.mockResolvedValue([[]]);
    expect((await request('GET', '/equipment/4')).status).toBe(404);
  });
  test.each(['/equipment/0', '/equipment/nope', '/equipment?search[x]=y'])('rejects invalid IDs or filters', async (path) => {
    expect((await request('GET', path)).status).toBe(400);
    expect(pool.execute).not.toHaveBeenCalled();
  });
  test.each(['POST', 'PUT', 'DELETE'])('equipment %s requires authentication', async (method) => {
    expect((await request(method, method === 'POST' ? '/equipment' : '/equipment/4', {})).status).toBe(401);
  });
  test('creation uses token identity, never client-supplied owner', async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 4 }]).mockResolvedValueOnce([[item]]);
    const result = await asUser('POST', '/equipment', {
      name: 'Camera', pricePerDay: 12.34, ownerId: 99,
    }, owner);
    expect(result.status).toBe(201);
    expect(pool.execute.mock.calls[0][1][0]).toBe(1);
  });
  test.each([0, -1, 'abc', 1.234, {}, null])('rejects invalid daily prices', async (pricePerDay) => {
    expect((await asUser('POST', '/equipment', { name: 'Camera', pricePerDay })).status).toBe(400);
  });
  test.each(['PUT', 'DELETE'])('nonowners cannot %s equipment', async (method) => {
    pool.execute.mockResolvedValue([[{ owner_id: 1 }]]);
    expect((await asUser(method, '/equipment/4', { name: 'Changed' })).status).toBe(403);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });
  test('owner update only writes whitelisted fields', async () => {
    pool.execute.mockResolvedValueOnce([[{ owner_id: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[item]]);
    expect((await asUser('PUT', '/equipment/4', { name: 'Camera', ownerId: 99, id: 99 }, owner)).status).toBe(200);
    expect(pool.execute.mock.calls[1][0]).toContain('SET name = ?');
    expect(pool.execute.mock.calls[1][1]).toEqual(['Camera', '4', 1]);
  });
  test('owner can delete equipment', async () => {
    pool.execute.mockResolvedValueOnce([[{ owner_id: 1 }]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect((await asUser('DELETE', '/equipment/4', undefined, owner)).body).toEqual({ message: 'Equipment deleted' });
  });
});

describe('bookings', () => {
  const dates = { equipmentId: 4, startDate: '2027-01-01', endDate: '2027-01-03' };
  function mockCreation(payment) {
    connection.execute.mockResolvedValueOnce([[{ id: 4, owner_id: 1, price_per_day: 12.34, availability_status: 1 }]])
      .mockResolvedValueOnce([[]]);
    if (payment) connection.execute.mockResolvedValueOnce([[payment]]);
    connection.execute.mockResolvedValueOnce([{ insertId: 8 }]);
    if (payment) connection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    connection.execute.mockResolvedValueOnce([[booking]]);
  }
  test('GET /bookings includes owner and renter bookings', async () => {
    pool.execute.mockResolvedValue([[booking]]);
    expect((await asUser('GET', '/bookings')).status).toBe(200);
    expect(pool.execute.mock.calls[0][1]).toEqual([2, 2]);
    expect(pool.execute.mock.calls[0][0]).toContain('OR e.owner_id');
  });
  test('legacy my-bookings stays renter-only', async () => {
    pool.execute.mockResolvedValue([[booking]]);
    expect((await asUser('GET', '/bookings/my-bookings')).body).toEqual([booking]);
    expect(pool.execute.mock.calls[0][1]).toEqual([2]);
  });
  test.each([user, owner])('both participants can retrieve booking', async (account) => {
    pool.execute.mockResolvedValue([[booking]]);
    const result = await asUser('GET', '/bookings/8', undefined, account);
    expect(result.status).toBe(200);
    expect(result.body.ownerId).toBeUndefined();
  });
  test('other users cannot retrieve a booking', async () => {
    pool.execute.mockResolvedValue([[booking]]);
    expect((await asUser('GET', '/bookings/8', undefined, { ...user, id: 3 })).status).toBe(403);
  });
  test('booking price and renter identity come from server data', async () => {
    mockCreation();
    const result = await asUser('POST', '/bookings', { ...dates, totalPrice: 0.01, renterId: 99 });
    expect(result.status).toBe(201);
    expect(connection.execute.mock.calls[2][1]).toEqual([2, 4, dates.startDate, dates.endDate, 24.68, 'pending', 'unpaid', null]);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
  test.each([
    { startDate: '2027-02-30' }, { endDate: '2027-01-01' }, { startDate: 'not-a-date' },
    { equipmentId: 'bad' }, { endDate: '2026-01-01' },
  ])('rejects invalid booking dates or equipment ID', async (change) => {
    expect((await asUser('POST', '/bookings', { ...dates, ...change })).status).toBe(400);
    expect(pool.getConnection).not.toHaveBeenCalled();
  });
  test.each([
    { owner_id: 2, availability_status: 1, expected: 403 },
    { owner_id: 1, availability_status: 0, expected: 409 },
  ])('rejects own or unavailable equipment and releases the transaction', async ({ expected, ...equipment }) => {
    connection.execute.mockResolvedValueOnce([[equipment]]);
    expect((await asUser('POST', '/bookings', dates)).status).toBe(expected);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
  test('overlapping bookings are rejected under an equipment lock', async () => {
    connection.execute.mockResolvedValueOnce([[{ owner_id: 1, availability_status: 1, price_per_day: 12.34 }]])
      .mockResolvedValueOnce([[{ id: 7 }]]);
    expect((await asUser('POST', '/bookings', dates)).status).toBe(409);
    expect(connection.execute.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(connection.commit).not.toHaveBeenCalled();
  });
  test.each([
    {}, { user_id: 3 }, { status: 'pending' }, { amount: 0.01 }, { booking_id: 7 },
  ])('unverified, foreign, underpaid or reused payments cannot create paid bookings', async (change) => {
    const payment = { user_id: 2, status: 'succeeded', amount: 24.68, booking_id: null, ...change };
    if (Object.keys(change).length === 0) payment.status = 'pending';
    mockCreation(payment);
    expect((await asUser('POST', '/bookings', { ...dates, paymentId: 'pi_test' })).status).toBe(400);
    expect(connection.commit).not.toHaveBeenCalled();
  });
  test('verified exact payment is linked atomically', async () => {
    mockCreation({ user_id: 2, status: 'succeeded', amount: 24.68, booking_id: null });
    expect((await asUser('POST', '/bookings', { ...dates, paymentId: 'pi_test' })).status).toBe(201);
    expect(connection.execute.mock.calls[3][1].slice(5)).toEqual(['confirmed', 'paid', 'pi_test']);
    expect(connection.execute.mock.calls[4][1]).toEqual([8, 'pi_test']);
  });
  test.each(['confirmed', 'completed'])('renter cannot mark booking %s', async (status) => {
    connection.execute.mockResolvedValueOnce([[booking]]);
    expect((await asUser('PUT', '/bookings/8', { status })).status).toBe(403);
  });
  test('owner confirms pending booking', async () => {
    connection.execute.mockResolvedValueOnce([[booking]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect((await asUser('PUT', '/bookings/8', { status: 'confirmed' }, owner)).body.status).toBe('confirmed');
    expect(connection.commit).toHaveBeenCalled();
  });
  test('owner completes confirmed booking', async () => {
    connection.execute.mockResolvedValueOnce([[{ ...booking, status: 'confirmed' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect((await asUser('PUT', '/bookings/8', { status: 'completed' }, owner)).status).toBe(200);
  });
  test('renter cancels pending booking', async () => {
    connection.execute.mockResolvedValueOnce([[booking]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect((await asUser('PUT', '/bookings/8', { status: 'cancelled' })).body.status).toBe('cancelled');
  });
  test('paid booking must be refunded before cancellation', async () => {
    connection.execute.mockResolvedValueOnce([[{ ...booking, paymentStatus: 'paid' }]]);
    expect((await asUser('PUT', '/bookings/8', { status: 'cancelled' })).status).toBe(409);
  });
  test('cannot alter price or renter through update', async () => {
    expect((await asUser('PUT', '/bookings/8', { status: 'confirmed', totalPrice: 1 })).status).toBe(400);
  });
  test.each([user, owner])('participants may delete unpaid pending bookings', async (account) => {
    connection.execute.mockResolvedValueOnce([[booking]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect((await asUser('DELETE', '/bookings/8', undefined, account)).status).toBe(200);
    expect(connection.commit).toHaveBeenCalled();
  });
  test('others cannot delete bookings', async () => {
    connection.execute.mockResolvedValueOnce([[booking]]);
    expect((await asUser('DELETE', '/bookings/8', undefined, { ...user, id: 3 })).status).toBe(403);
  });
  test('paid bookings cannot be deleted', async () => {
    connection.execute.mockResolvedValueOnce([[{ ...booking, paymentStatus: 'paid' }]]);
    expect((await asUser('DELETE', '/bookings/8')).status).toBe(409);
  });
  test('database errors roll back and release without exposing details', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    connection.execute.mockRejectedValue(new Error('private database details'));
    const result = await asUser('POST', '/bookings', dates);
    expect(result).toEqual({ status: 500, body: { error: 'Something went wrong!' } });
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('payment verification', () => {
  const payment = { paymentId: 'pi_test', amount: 24.68, currency: 'usd', status: 'pending' };
  test('create-intent persists payer identity and preserves response fields', async () => {
    stripe.paymentIntents.create.mockResolvedValue({ id: 'pi_test', client_secret: 'test-client-secret' });
    pool.execute.mockResolvedValue([{ insertId: 1 }]);
    const result = await asUser('POST', '/payments/create-intent', { amount: 24.68 });
    expect(result.body).toMatchObject({ paymentId: 'pi_test', amount: 24.68, commission: 1.23, ownerAmount: 23.45 });
    expect(stripe.paymentIntents.create.mock.calls[0][0].metadata.renterId).toBe('2');
    expect(pool.execute.mock.calls[0][1][1]).toBe(2);
  });
  test('confirm checks Stripe and stores only verified status', async () => {
    pool.execute.mockResolvedValueOnce([[payment]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    stripe.paymentIntents.retrieve.mockResolvedValue({
      status: 'succeeded', metadata: { renterId: '2' }, amount: 2468, currency: 'usd',
    });
    const result = await asUser('POST', '/payments/confirm', { paymentIntentId: 'pi_test' });
    expect(result.body.status).toBe('succeeded');
    expect(pool.execute.mock.calls[1][1]).toEqual(['succeeded', 'pi_test', 2]);
  });
  test('confirm rejects mismatched payment details', async () => {
    pool.execute.mockResolvedValueOnce([[payment]]);
    stripe.paymentIntents.retrieve.mockResolvedValue({
      status: 'succeeded', metadata: { renterId: '3' }, amount: 2468, currency: 'usd',
    });
    expect((await asUser('POST', '/payments/confirm', { paymentIntentId: 'pi_test' })).status).toBe(409);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });
  test('another user cannot confirm payment', async () => {
    pool.execute.mockResolvedValueOnce([[]]);
    expect((await asUser('POST', '/payments/confirm', { paymentIntentId: 'pi_test' })).status).toBe(404);
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });
  test('refund locks payment, verifies payer and cancels linked booking', async () => {
    connection.execute.mockResolvedValueOnce([[{ id: 8, status: 'confirmed' }]])
      .mockResolvedValueOnce([[{ status: 'succeeded' }]])
      .mockResolvedValue([{ affectedRows: 1 }]);
    stripe.refunds.create.mockResolvedValue({ id: 're_test', status: 'succeeded', amount: 2468 });
    expect((await asUser('POST', '/payments/refund', { paymentIntentId: 'pi_test' })).body.amount).toBe(24.68);
    expect(connection.execute.mock.calls[3][0]).toContain("status = 'cancelled'");
    expect(connection.commit).toHaveBeenCalled();
  });
  test('completed bookings cannot be refunded', async () => {
    connection.execute.mockResolvedValueOnce([[{ id: 8, status: 'completed' }]])
      .mockResolvedValueOnce([[{ status: 'succeeded' }]]);
    expect((await asUser('POST', '/payments/refund', { paymentIntentId: 'pi_test' })).status).toBe(409);
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });
});

describe('date and price boundaries', () => {
  test('calculates leap dates and exclusive end dates without timezone drift', () => {
    expect(rentalDays('2028-02-28', '2028-03-01')).toBe(2);
    expect(rentalDays('2027-02-29', '2027-03-01')).toBeNull();
    expect(rentalDays('2027-03-28', '2027-03-29')).toBe(1);
    expect(priceCents('12.34')).toBe(1234);
    expect(priceCents('99999999.99')).toBe(9999999999);
    expect(priceCents('100000000')).toBeNull();
  });
  test('JWT configuration fails closed without a strong secret', () => {
    const secret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = '';
    expect(() => jest.isolateModules(() => require('../middleware/auth'))).toThrow('JWT_SECRET');
    process.env.JWT_SECRET = secret;
  });
});

describe('rate limiting', () => {
  test('excess login requests return 429 before accessing the database', async () => {
    pool.execute.mockResolvedValue([[]]);
    const statuses = [];
    for (let i = 0; i < 30; i++) {
      statuses.push((await request('POST', '/auth/login', {
        email: user.email, password: 'wrong',
      })).status);
    }
    expect(statuses).toContain(401);
    expect(statuses[statuses.length - 1]).toBe(429);
    expect(pool.execute.mock.calls.length).toBeLessThan(30);
  });
});
