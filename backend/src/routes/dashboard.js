const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { listFavoritesForUser } = require('../services/favorites');
const { serializeBooking, serializeEarning, serializeUser, toNumber } = require('../utils/serializers');

const router = express.Router();

async function getOwnerDashboard(user) {
  const ownerId = user.id;

  const [
    listingCountRows,
    activeRentalRows,
    upcomingBookingRows,
    totalEarningsRows,
    upcomingBookingsRows,
    recentBookingsRows,
    recentEarningsRows,
    earningsByMonthRows,
  ] = await Promise.all([
    db.query('SELECT COUNT(*) AS count FROM equipment WHERE owner_id = ?', [ownerId]),
    db.query(
      `
        SELECT COUNT(*) AS count
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        WHERE e.owner_id = ?
          AND b.start_date <= CURDATE()
          AND b.end_date >= CURDATE()
          AND b.status NOT IN ('cancelled', 'rejected', 'completed')
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT COUNT(*) AS count
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        WHERE e.owner_id = ?
          AND b.start_date > CURDATE()
          AND b.status NOT IN ('cancelled', 'rejected')
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT COALESCE(SUM(net_amount), 0) AS total
        FROM user_earnings
        WHERE owner_id = ?
          AND status IN ('completed', 'paid')
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location,
          renter.username AS renter_username,
          renter.first_name AS renter_first_name,
          renter.last_name AS renter_last_name
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        LEFT JOIN users renter ON renter.id = b.renter_id
        WHERE e.owner_id = ?
          AND b.start_date >= CURDATE()
          AND b.status NOT IN ('cancelled', 'rejected')
        ORDER BY b.start_date ASC, b.created_at DESC
        LIMIT 5
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location,
          renter.username AS renter_username,
          renter.first_name AS renter_first_name,
          renter.last_name AS renter_last_name
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        LEFT JOIN users renter ON renter.id = b.renter_id
        WHERE e.owner_id = ?
        ORDER BY b.created_at DESC
        LIMIT 5
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT ue.*, e.name AS equipment_name
        FROM user_earnings ue
        LEFT JOIN equipment e ON e.id = ue.equipment_id
        WHERE ue.owner_id = ?
        ORDER BY ue.created_at DESC
        LIMIT 5
      `,
      [ownerId]
    ),
    db.query(
      `
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COALESCE(SUM(net_amount), 0) AS total
        FROM user_earnings
        WHERE owner_id = ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
      `,
      [ownerId]
    ),
  ]);

  return {
    role: 'owner',
    summary: {
      totalEarnings: toNumber(totalEarningsRows[0]?.total) || 0,
      activeRentals: Number(activeRentalRows[0]?.count || 0),
      upcomingBookings: Number(upcomingBookingRows[0]?.count || 0),
      listedEquipmentCount: Number(listingCountRows[0]?.count || 0),
    },
    upcomingBookings: upcomingBookingsRows.map((row) => serializeBooking(row)),
    recentBookings: recentBookingsRows.map((row) => serializeBooking(row)),
    recentEarnings: recentEarningsRows.map((row) => serializeEarning(row)),
    earningsByMonth: earningsByMonthRows.map((row) => ({
      month: row.month,
      total: toNumber(row.total) || 0,
    })),
  };
}

async function getRenterDashboard(user) {
  const renterId = user.id;
  const [bookingSummaryRows, currentBookingRows, rentalHistoryRows, favorites] = await Promise.all([
    db.query(
      `
        SELECT
          COUNT(*) AS total_rentals,
          COALESCE(SUM(total_price), 0) AS total_spending
        FROM bookings
        WHERE renter_id = ?
      `,
      [renterId]
    ),
    db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location,
          owner.username AS owner_username,
          owner.first_name AS owner_first_name,
          owner.last_name AS owner_last_name
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        LEFT JOIN users owner ON owner.id = e.owner_id
        WHERE b.renter_id = ?
          AND b.end_date >= CURDATE()
          AND b.status NOT IN ('cancelled', 'rejected')
        ORDER BY b.start_date ASC, b.created_at DESC
      `,
      [renterId]
    ),
    db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location,
          owner.username AS owner_username,
          owner.first_name AS owner_first_name,
          owner.last_name AS owner_last_name
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        LEFT JOIN users owner ON owner.id = e.owner_id
        WHERE b.renter_id = ?
        ORDER BY b.start_date DESC, b.created_at DESC
        LIMIT 10
      `,
      [renterId]
    ),
    listFavoritesForUser(renterId),
  ]);

  const currentAndUpcomingBookings = currentBookingRows.map((row) => serializeBooking(row));
  const today = new Date().toISOString().slice(0, 10);

  return {
    role: 'renter',
    summary: {
      totalRentals: Number(bookingSummaryRows[0]?.total_rentals || 0),
      totalSpending: toNumber(bookingSummaryRows[0]?.total_spending) || 0,
      currentBookings: currentAndUpcomingBookings.filter(
        (booking) => booking.startDate <= today && booking.endDate >= today
      ).length,
      upcomingBookings: currentAndUpcomingBookings.filter((booking) => booking.startDate > today).length,
      savedFavorites: favorites.length,
    },
    currentAndUpcomingBookings,
    rentalHistory: rentalHistoryRows.map((row) => serializeBooking(row)),
    favorites,
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await db.query(
      `
        SELECT
          id,
          username,
          email,
          first_name,
          last_name,
          is_renter,
          is_owner,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = serializeUser(users[0]);
    const dashboard = user.isOwner ? await getOwnerDashboard(user) : await getRenterDashboard(user);

    return res.json({
      user,
      ...dashboard,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
