const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const validId = (value) => /^[1-9]\d*$/.test(String(value)) &&
  Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647;

const validText = (value, max) => typeof value === 'string' &&
  value.trim().length > 0 && value.length <= max;

function priceCents(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value))) return null;
  const cents = Math.round(Number(value) * 100);
  return cents > 0 && cents <= 9999999999 ? cents : null;
}

function rentalDays(startDate, endDate) {
  const validDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value < '1000-01-01' || value > '9999-12-31') return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!validDate(startDate) || !validDate(endDate)) return null;
  const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000;
  return days > 0 ? days : null;
}

const equipmentColumns = `id, owner_id AS ownerId, name, description, category,
  price_per_day AS pricePerDay, location, image_url AS imageUrl,
  availability_status AS availabilityStatus, created_at AS createdAt`;

const bookingColumns = `b.id, b.renter_id AS renterId, b.equipment_id AS equipmentId,
  b.start_date AS startDate, b.end_date AS endDate, b.total_price AS totalPrice,
  b.status, b.payment_status AS paymentStatus, b.payment_id AS paymentId,
  b.created_at AS createdAt`;

const equipmentResponse = (item) => ({
  ...item,
  availabilityStatus: Boolean(item.availabilityStatus),
});

module.exports = {
  asyncRoute, validId, validText, priceCents, rentalDays,
  equipmentColumns, bookingColumns, equipmentResponse,
};
