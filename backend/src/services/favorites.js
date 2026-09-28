const db = require('../db');
const { serializeFavorite } = require('../utils/serializers');

async function listFavoritesForUser(userId) {
  const rows = await db.query(
    `
      SELECT
        uf.id,
        uf.user_id,
        uf.equipment_id,
        uf.created_at,
        e.owner_id,
        e.name,
        e.description,
        e.category,
        COALESCE(e.price_per_day, e.price, e.min_price_per_day, e.min_price, 0) AS price_per_day,
        e.location,
        e.image_url,
        e.availability_status,
        e.created_at AS equipment_created_at,
        owner.username AS owner_username,
        owner.first_name AS owner_first_name,
        owner.last_name AS owner_last_name
      FROM user_favorites uf
      JOIN equipment e ON e.id = uf.equipment_id
      LEFT JOIN users owner ON owner.id = e.owner_id
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC
    `,
    [userId]
  );

  return rows.map((row) => serializeFavorite(row));
}

module.exports = {
  listFavoritesForUser,
};
