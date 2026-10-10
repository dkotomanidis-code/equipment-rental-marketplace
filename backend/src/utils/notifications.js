async function createNotification(db, notification) {
  await db.execute(
    `INSERT IGNORE INTO notifications
       (user_id, actor_id, event_key, type, message, resource_type, resource_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      notification.userId,
      notification.actorId || null,
      notification.eventKey,
      notification.type,
      notification.message,
      notification.resourceType,
      notification.resourceId,
    ]
  );
}

module.exports = { createNotification };
