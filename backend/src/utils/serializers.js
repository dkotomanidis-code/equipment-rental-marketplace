function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function toNumber(value) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toBoolean(value, defaultValue = false) {
  if (value == null) {
    return defaultValue;
  }

  return Boolean(value);
}

function buildDisplayName(row, prefixes = ['']) {
  for (const prefix of prefixes) {
    const firstName = row[`${prefix}first_name`];
    const lastName = row[`${prefix}last_name`];
    const username = row[`${prefix}username`];
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    if (username) {
      return username;
    }
  }

  return null;
}

function serializeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: firstDefined(row.firstName, row.first_name, null),
    lastName: firstDefined(row.lastName, row.last_name, null),
    isRenter: toBoolean(firstDefined(row.isRenter, row.is_renter), true),
    isOwner: toBoolean(firstDefined(row.isOwner, row.is_owner), false),
    createdAt: firstDefined(row.createdAt, row.created_at, null),
    updatedAt: firstDefined(row.updatedAt, row.updated_at, null),
  };
}

function serializeEquipment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ownerId: firstDefined(row.ownerId, row.owner_id, null),
    ownerName: firstDefined(row.ownerName, row.owner_name, buildDisplayName(row, ['owner_', ''])),
    name: row.name,
    description: row.description,
    category: row.category,
    pricePerDay: toNumber(
      firstDefined(row.pricePerDay, row.price_per_day, row.price, row.min_price_per_day, row.min_price, 0)
    ),
    location: row.location,
    imageUrl: firstDefined(row.imageUrl, row.image_url, null),
    availabilityStatus: toBoolean(firstDefined(row.availabilityStatus, row.availability_status), true),
    createdAt: firstDefined(row.createdAt, row.created_at, null),
    updatedAt: firstDefined(row.updatedAt, row.updated_at, null),
  };
}

function serializeBooking(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    renterId: firstDefined(row.renterId, row.renter_id, null),
    equipmentId: firstDefined(row.equipmentId, row.equipment_id, null),
    equipmentName: firstDefined(row.equipmentName, row.equipment_name, null),
    equipmentImageUrl: firstDefined(row.equipmentImageUrl, row.equipment_image_url, null),
    ownerId: firstDefined(row.ownerId, row.owner_id, null),
    ownerName: firstDefined(row.ownerName, row.owner_name, buildDisplayName(row, ['owner_'])),
    renterName: firstDefined(row.renterName, row.renter_name, buildDisplayName(row, ['renter_'])),
    location: row.location,
    startDate: firstDefined(row.startDate, row.start_date, null),
    endDate: firstDefined(row.endDate, row.end_date, null),
    totalPrice: toNumber(firstDefined(row.totalPrice, row.total_price, 0)),
    status: row.status,
    paymentStatus: firstDefined(row.paymentStatus, row.payment_status, null),
    paymentId: firstDefined(row.paymentId, row.payment_id, null),
    createdAt: firstDefined(row.createdAt, row.created_at, null),
    updatedAt: firstDefined(row.updatedAt, row.updated_at, null),
  };
}

function serializeFavorite(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: firstDefined(row.userId, row.user_id, null),
    equipmentId: firstDefined(row.equipmentId, row.equipment_id, null),
    createdAt: firstDefined(row.createdAt, row.created_at, null),
    equipment: serializeEquipment({
      ...row,
      created_at: firstDefined(row.equipment_created_at, row.created_at, null),
      updated_at: firstDefined(row.equipment_updated_at, row.updated_at, null),
    }),
  };
}

function serializeEarning(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ownerId: firstDefined(row.ownerId, row.owner_id, null),
    bookingId: firstDefined(row.bookingId, row.booking_id, null),
    equipmentId: firstDefined(row.equipmentId, row.equipment_id, null),
    equipmentName: firstDefined(row.equipmentName, row.equipment_name, null),
    amount: toNumber(row.amount),
    commission: toNumber(row.commission),
    netAmount: toNumber(firstDefined(row.netAmount, row.net_amount)),
    status: row.status,
    rentalStartDate: firstDefined(row.rentalStartDate, row.rental_start_date, null),
    rentalEndDate: firstDefined(row.rentalEndDate, row.rental_end_date, null),
    daysRented: toNumber(firstDefined(row.daysRented, row.days_rented)),
    createdAt: firstDefined(row.createdAt, row.created_at, null),
  };
}

module.exports = {
  serializeBooking,
  serializeEarning,
  serializeEquipment,
  serializeFavorite,
  serializeUser,
  toNumber,
};
