const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equipment_rental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to get user ID from request
const getUserId = (req) => req.user?.id || 1;

// GET /api/dashboard-stats/owner/earnings - Get owner earnings
router.get('/owner/earnings', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        COALESCE(SUM(ue.net_amount), 0) as totalEarnings,
        COALESCE(SUM(CASE WHEN MONTH(ue.created_at) = MONTH(NOW()) AND YEAR(ue.created_at) = YEAR(NOW()) THEN ue.net_amount ELSE 0 END), 0) as thisMonth,
        COALESCE(SUM(CASE WHEN YEAR(ue.created_at) = YEAR(NOW()) THEN ue.net_amount ELSE 0 END), 0) as thisYear,
        COUNT(CASE WHEN ue.status = 'completed' THEN 1 END) as completedRentals,
        COALESCE(SUM(CASE WHEN ue.status = 'pending' THEN ue.net_amount ELSE 0 END), 0) as pendingPayouts
      FROM user_earnings ue
      WHERE ue.owner_id = ?
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    const earnings = {
      totalEarnings: parseFloat(rows[0].totalEarnings) || 0,
      thisMonth: parseFloat(rows[0].thisMonth) || 0,
      thisYear: parseFloat(rows[0].thisYear) || 0,
      pendingPayouts: parseFloat(rows[0].pendingPayouts) || 0,
      completedRentals: rows[0].completedRentals || 0,
    };

    res.json(earnings);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// GET /api/dashboard-stats/owner/active-rentals - Get active rentals for owner
router.get('/owner/active-rentals', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        b.id,
        e.name as equipmentName,
        u.first_name as renterFirstName,
        u.last_name as renterLastName,
        CONCAT(u.first_name, ' ', u.last_name) as renterName,
        b.start_date as startDate,
        b.end_date as endDate,
        b.status,
        e.price_per_day as dailyRate,
        DATEDIFF(b.end_date, NOW()) as daysRemaining,
        b.total_price as totalCost
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u ON b.renter_id = u.id
      WHERE e.owner_id = ? 
      AND b.status = 'confirmed'
      AND b.end_date > NOW()
      AND b.start_date <= NOW()
      ORDER BY b.end_date ASC
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching active rentals:', error);
    res.status(500).json({ error: 'Failed to fetch active rentals' });
  }
});

// GET /api/dashboard-stats/owner/upcoming-bookings - Get upcoming bookings
router.get('/owner/upcoming-bookings', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        b.id,
        e.name as equipmentName,
        u.first_name as renterFirstName,
        u.last_name as renterLastName,
        CONCAT(u.first_name, ' ', u.last_name) as renterName,
        b.start_date as startDate,
        b.end_date as endDate,
        b.status,
        e.price_per_day as dailyRate,
        DATEDIFF(b.end_date, b.start_date) as daysBooked,
        (DATEDIFF(b.end_date, b.start_date) * e.price_per_day) as estimatedRevenue
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u ON b.renter_id = u.id
      WHERE e.owner_id = ? 
      AND b.start_date > NOW()
      ORDER BY b.start_date ASC
      LIMIT 10
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming bookings' });
  }
});

// GET /api/dashboard-stats/owner/summary - Get owner dashboard summary
router.get('/owner/summary', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    // Get earnings
    const earningsQuery = `
      SELECT 
        COALESCE(SUM(ue.net_amount), 0) as totalEarnings,
        COALESCE(SUM(CASE WHEN MONTH(ue.created_at) = MONTH(NOW()) AND YEAR(ue.created_at) = YEAR(NOW()) THEN ue.net_amount ELSE 0 END), 0) as thisMonth,
        COALESCE(SUM(CASE WHEN YEAR(ue.created_at) = YEAR(NOW()) THEN ue.net_amount ELSE 0 END), 0) as thisYear,
        COUNT(CASE WHEN ue.status = 'completed' THEN 1 END) as completedRentals
      FROM user_earnings ue
      WHERE ue.owner_id = ?
    `;

    // Get active rentals count
    const activeQuery = `
      SELECT COUNT(*) as activeCount FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      WHERE e.owner_id = ? 
      AND b.status = 'confirmed'
      AND b.end_date > NOW()
      AND b.start_date <= NOW()
    `;

    // Get upcoming bookings count
    const upcomingQuery = `
      SELECT COUNT(*) as upcomingCount FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      WHERE e.owner_id = ? 
      AND b.start_date > NOW()
    `;

    // Get total listings
    const listingsQuery = `
      SELECT COUNT(*) as totalListings FROM equipment WHERE owner_id = ?
    `;

    // Get rating info
    const ratingQuery = `
      SELECT 
        AVG(r.rating) as averageRating,
        COUNT(r.id) as totalReviews
      FROM reviews r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE e.owner_id = ?
    `;

    const [earnings] = await connection.execute(earningsQuery, [userId]);
    const [active] = await connection.execute(activeQuery, [userId]);
    const [upcoming] = await connection.execute(upcomingQuery, [userId]);
    const [listings] = await connection.execute(listingsQuery, [userId]);
    const [rating] = await connection.execute(ratingQuery, [userId]);

    connection.release();

    const summary = {
      totalEarnings: parseFloat(earnings[0].totalEarnings) || 0,
      thisMonth: parseFloat(earnings[0].thisMonth) || 0,
      thisYear: parseFloat(earnings[0].thisYear) || 0,
      activeRentals: active[0].activeCount || 0,
      upcomingBookings: upcoming[0].upcomingCount || 0,
      totalListings: listings[0].totalListings || 0,
      completedRentals: earnings[0].completedRentals || 0,
      averageRating: parseFloat(rating[0].averageRating) || 0,
      totalReviews: rating[0].totalReviews || 0,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching owner summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/dashboard-stats/renter/rental-history - Get rental history
router.get('/renter/rental-history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        b.id,
        e.name as equipmentName,
        CONCAT(u.first_name, ' ', u.last_name) as ownerName,
        b.start_date as rentalDate,
        b.end_date as returnDate,
        b.status,
        b.total_price as totalCost,
        e.price_per_day as dailyRate,
        DATEDIFF(b.end_date, b.start_date) as daysRented,
        DATEDIFF(b.end_date, NOW()) as daysRemaining,
        r.rating,
        r.comment as review
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users u ON e.owner_id = u.id
      LEFT JOIN reviews r ON b.id = r.booking_id AND r.reviewer_id = b.renter_id
      WHERE b.renter_id = ?
      ORDER BY b.end_date DESC
      LIMIT 50
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching rental history:', error);
    res.status(500).json({ error: 'Failed to fetch rental history' });
  }
});

// GET /api/dashboard-stats/renter/favorites - Get favorite equipment
router.get('/renter/favorites', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        e.id,
        e.name,
        CONCAT(u.first_name, ' ', u.last_name) as owner,
        e.price_per_day as dailyRate,
        e.image_url as image,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(r.id) as reviews,
        e.location,
        DATE_ADD(NOW(), INTERVAL 1 DAY) as availableFrom,
        1 as isFavorite
      FROM user_favorites uf
      JOIN equipment e ON uf.equipment_id = e.id
      JOIN users u ON e.owner_id = u.id
      LEFT JOIN reviews r ON e.id = r.equipment_id
      WHERE uf.user_id = ?
      GROUP BY e.id
      ORDER BY uf.created_at DESC
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// GET /api/dashboard-stats/renter/summary - Get renter dashboard summary
router.get('/renter/summary', async (req, res) => {
  try {
    const userId = getUserId(req);
    const connection = await pool.getConnection();

    // Total spent
    const spentQuery = `
      SELECT COALESCE(SUM(b.total_price), 0) as totalSpent,
             COALESCE(SUM(CASE WHEN MONTH(b.created_at) = MONTH(NOW()) AND YEAR(b.created_at) = YEAR(NOW()) THEN b.total_price ELSE 0 END), 0) as thisMonth
      FROM bookings b
      WHERE b.renter_id = ? AND b.status = 'confirmed'
    `;

    // Active rentals
    const activeQuery = `
      SELECT COUNT(*) as activeCount FROM bookings b
      WHERE b.renter_id = ? 
      AND b.status = 'confirmed'
      AND b.end_date > NOW()
      AND b.start_date <= NOW()
    `;

    // Completed rentals
    const completedQuery = `
      SELECT COUNT(*) as completedCount FROM bookings b
      WHERE b.renter_id = ? 
      AND b.status = 'completed'
    `;

    // Total favorites
    const favoritesQuery = `
      SELECT COUNT(*) as favoriteCount FROM user_favorites WHERE user_id = ?
    `;

    // User's average rating
    const ratingQuery = `
      SELECT AVG(r.rating) as averageRating FROM reviews r
      WHERE r.reviewer_id = ?
    `;

    const [spent] = await connection.execute(spentQuery, [userId]);
    const [active] = await connection.execute(activeQuery, [userId]);
    const [completed] = await connection.execute(completedQuery, [userId]);
    const [favorites] = await connection.execute(favoritesQuery, [userId]);
    const [rating] = await connection.execute(ratingQuery, [userId]);

    connection.release();

    const summary = {
      totalSpent: parseFloat(spent[0].totalSpent) || 0,
      thisMonth: parseFloat(spent[0].thisMonth) || 0,
      activeRentals: active[0].activeCount || 0,
      completedRentals: completed[0].completedCount || 0,
      totalFavorites: favorites[0].favoriteCount || 0,
      upcomingRentals: 0,
      averageRating: parseFloat(rating[0].averageRating) || 0,
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching renter summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// POST /api/dashboard-stats/renter/favorites/:equipmentId - Add to favorites
router.post('/renter/favorites/:equipmentId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const equipmentId = req.params.equipmentId;
    const connection = await pool.getConnection();

    const query = `
      INSERT INTO user_favorites (user_id, equipment_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = NOW()
    `;

    await connection.execute(query, [userId, equipmentId]);

    // Get updated favorite count
    const countQuery = `SELECT COUNT(*) as favoriteCount FROM user_favorites WHERE user_id = ?`;
    const [result] = await connection.execute(countQuery, [userId]);

    connection.release();

    res.json({
      success: true,
      message: 'Added to favorites',
      equipmentId,
      favoriteCount: result[0].favoriteCount
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/dashboard-stats/renter/favorites/:equipmentId - Remove from favorites
router.delete('/renter/favorites/:equipmentId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const equipmentId = req.params.equipmentId;
    const connection = await pool.getConnection();

    const query = `DELETE FROM user_favorites WHERE user_id = ? AND equipment_id = ?`;
    await connection.execute(query, [userId, equipmentId]);

    // Get updated favorite count
    const countQuery = `SELECT COUNT(*) as favoriteCount FROM user_favorites WHERE user_id = ?`;
    const [result] = await connection.execute(countQuery, [userId]);

    connection.release();

    res.json({
      success: true,
      message: 'Removed from favorites',
      equipmentId,
      favoriteCount: result[0].favoriteCount
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;