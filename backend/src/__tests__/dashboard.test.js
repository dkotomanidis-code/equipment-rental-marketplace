process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const mockStripeCreate = jest.fn();
const mockStripeRetrieve = jest.fn();
const mockStripeRefundCreate = jest.fn();

jest.mock('stripe', () => () => ({
  paymentIntents: {
    create: mockStripeCreate,
    retrieve: mockStripeRetrieve,
  },
  refunds: {
    create: mockStripeRefundCreate,
  },
}));

jest.mock('../db', () => ({
  query: jest.fn(),
  getPool: jest.fn(),
}));

const app = require('../app');
const db = require('../db');

describe('dashboard and favorites routes', () => {
  let server;
  let baseUrl;
  let token;

  beforeAll((done) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api`;
      token = jwt.sign({ id: 7, email: 'owner@example.com' }, process.env.JWT_SECRET);
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    db.query.mockReset();
    db.getPool.mockReset();
    mockStripeCreate.mockReset();
    mockStripeRetrieve.mockReset();
    mockStripeRefundCreate.mockReset();
  });

  test('rejects unauthenticated dashboard requests', async () => {
    const response = await fetch(`${baseUrl}/dashboard`);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Authentication required');
  });

  test('returns owner dashboard stats with camelCase payload', async () => {
    db.query
      .mockResolvedValueOnce([
        {
          id: 7,
          username: 'owner-user',
          email: 'owner@example.com',
          first_name: 'Owner',
          last_name: 'User',
          is_owner: 1,
          is_renter: 1,
        },
      ])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([{ count: 4 }])
      .mockResolvedValueOnce([{ total: '1450.50' }])
      .mockResolvedValueOnce([
        {
          id: 91,
          renter_id: 12,
          equipment_id: 10,
          equipment_name: 'Concrete Mixer',
          equipment_image_url: 'https://example.com/mixer.jpg',
          owner_id: 7,
          renter_first_name: 'Rita',
          renter_last_name: 'Renter',
          start_date: '2026-10-01',
          end_date: '2026-10-03',
          total_price: '300.00',
          status: 'confirmed',
          payment_status: 'paid',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 5,
          owner_id: 7,
          booking_id: 91,
          equipment_id: 10,
          equipment_name: 'Concrete Mixer',
          amount: '300.00',
          commission: '15.00',
          net_amount: '285.00',
          status: 'completed',
          rental_start_date: '2026-10-01',
          rental_end_date: '2026-10-03',
          days_rented: 2,
        },
      ])
      .mockResolvedValueOnce([{ month: '2026-09', total: '1450.50' }]);

    const response = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.role).toBe('owner');
    expect(payload.user.isOwner).toBe(true);
    expect(payload.summary).toEqual({
      totalEarnings: 1450.5,
      activeRentals: 2,
      upcomingBookings: 4,
      listedEquipmentCount: 3,
    });
    expect(payload.upcomingBookings[0]).toMatchObject({
      equipmentId: 10,
      equipmentName: 'Concrete Mixer',
      renterName: 'Rita Renter',
      totalPrice: 300,
    });
    expect(payload.recentEarnings[0]).toMatchObject({
      netAmount: 285,
      equipmentName: 'Concrete Mixer',
    });
  });

  test('prevents duplicate favorites for the authenticated user', async () => {
    db.query
      .mockResolvedValueOnce([{ id: 10 }])
      .mockResolvedValueOnce([{ id: 50 }]);

    const response = await fetch(`${baseUrl}/favorites`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equipmentId: 10 }),
    });
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe('Equipment is already in favorites');
  });

  test('rejects an invalid favorite equipment id', async () => {
    const response = await fetch(`${baseUrl}/favorites`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equipmentId: 'not-a-number' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('equipmentId is required');
  });

  test('returns 404 when favorite equipment does not exist', async () => {
    db.query.mockResolvedValueOnce([]);

    const response = await fetch(`${baseUrl}/favorites`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equipmentId: 999 }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('Equipment not found');
  });

  test('validates required payment intent fields', async () => {
    const response = await fetch(`${baseUrl}/payments/create-intent`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 100 }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('amount, equipmentId, startDate, and endDate are required');
  });

  test('creates an authenticated payment intent and persists ownership metadata', async () => {
    mockStripeCreate.mockResolvedValueOnce({
      id: 'pi_123',
      client_secret: 'secret_123',
    });
    db.query.mockResolvedValueOnce({ insertId: 1 });

    const response = await fetch(`${baseUrl}/payments/create-intent`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'usd',
        equipmentId: 10,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.paymentId).toBe('pi_123');
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10000,
        currency: 'usd',
        metadata: expect.objectContaining({
          userId: '7',
          equipmentId: '10',
          startDate: '2026-10-10',
          endDate: '2026-10-12',
          amount: '100',
        }),
      })
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO payments'),
      expect.arrayContaining(['pi_123', null, 7, 10, '2026-10-10', '2026-10-12'])
    );
  });

  test('creates a paid booking and related earnings for another owner equipment item', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      execute: jest
        .fn()
        .mockResolvedValueOnce([[{ id: 10, owner_id: 99, name: 'Generator' }]])
        .mockResolvedValueOnce([
          [
            {
              payment_id: 'pi_123',
              status: 'completed',
              user_id: 7,
              equipment_id: 10,
              rental_start_date: '2026-10-10',
              rental_end_date: '2026-10-12',
              total_amount: 100,
            },
          ],
        ])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 120 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 220 }]),
    };

    db.getPool.mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(fakeConnection),
    });
    db.query.mockResolvedValueOnce([
        {
          id: 120,
          renter_id: 7,
          equipment_id: 10,
          equipment_name: 'Generator',
          owner_id: 99,
          start_date: '2026-10-10',
          end_date: '2026-10-12',
          total_price: '100.00',
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: 'pi_123',
        },
      ]);

    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 10,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        totalPrice: 100,
        paymentId: 'pi_123',
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.status).toBe('confirmed');
    expect(payload.paymentStatus).toBe('paid');
    expect(payload.totalPrice).toBe(100);

    expect(fakeConnection.execute).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining('INSERT INTO user_earnings'),
      [99, 120, 10, 100, 5, 95, 'completed', '2026-10-10', '2026-10-12', 2]
    );
  });

  test('rejects booking your own equipment', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      execute: jest.fn().mockResolvedValueOnce([[{ id: 10, owner_id: 7, name: 'Generator' }]]),
    };

    db.getPool.mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(fakeConnection),
    });

    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 10,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        totalPrice: 100,
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('You cannot book your own equipment');
    expect(fakeConnection.rollback).toHaveBeenCalled();
  });

  test('rejects a completed payment that does not belong to the renter', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      execute: jest
        .fn()
        .mockResolvedValueOnce([[{ id: 10, owner_id: 99, name: 'Generator' }]])
        .mockResolvedValueOnce([
          [
            {
              payment_id: 'pi_123',
              status: 'completed',
              user_id: 999,
              equipment_id: 10,
              rental_start_date: '2026-10-10',
              rental_end_date: '2026-10-12',
              total_amount: 100,
            },
          ],
        ]),
    };

    db.getPool.mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(fakeConnection),
    });

    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 10,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        totalPrice: 100,
        paymentId: 'pi_123',
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('A completed payment is required for this booking');
    expect(fakeConnection.rollback).toHaveBeenCalled();
  });

  test('creates an unpaid same-day booking with pending earnings for one day', async () => {
    const fakeConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      execute: jest
        .fn()
        .mockResolvedValueOnce([[{ id: 22, owner_id: 99, name: 'Saw' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 321 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 654 }]),
    };

    db.getPool.mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(fakeConnection),
    });
    db.query.mockResolvedValueOnce([
      {
        id: 321,
        renter_id: 7,
        equipment_id: 22,
        equipment_name: 'Saw',
        owner_id: 99,
        start_date: '2026-10-10',
        end_date: '2026-10-10',
        total_price: '80.00',
        status: 'pending',
        payment_status: 'unpaid',
        payment_id: null,
      },
    ]);

    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 22,
        startDate: '2026-10-10',
        endDate: '2026-10-10',
        totalPrice: 80,
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.status).toBe('pending');
    expect(payload.paymentStatus).toBe('unpaid');
    expect(fakeConnection.execute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO user_earnings'),
      [99, 321, 22, 80, 4, 76, 'pending', '2026-10-10', '2026-10-10', 1]
    );
  });
});
