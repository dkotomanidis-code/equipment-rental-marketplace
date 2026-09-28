process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');

jest.mock('../db', () => ({
  query: jest.fn(),
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

  test('creates a paid booking and related earnings for another owner equipment item', async () => {
    db.query
      .mockResolvedValueOnce([{ id: 10, owner_id: 99, name: 'Generator' }])
      .mockResolvedValueOnce({ insertId: 120 })
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ insertId: 220 })
      .mockResolvedValueOnce([
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

    expect(db.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO user_earnings'),
      [99, 120, 10, 100, 5, 95, 'completed', '2026-10-10', '2026-10-12', 2]
    );
  });
});
