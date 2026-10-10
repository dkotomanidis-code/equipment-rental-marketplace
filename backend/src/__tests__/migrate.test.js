jest.mock('../database/pool', () => ({}));
const { migrate } = require('../database/migrate');

function database(existing = [], duplicateReviews = []) {
  const columns = new Set(existing);
  const indexes = new Set();
  const connection = {
    execute: jest.fn(async (sql, values) => {
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
      if (sql.includes('information_schema.STATISTICS')) {
        const indexName = sql.match(/INDEX_NAME = '([^']+)'/)?.[1];
        return [indexes.has(indexName) ? [{ INDEX_NAME: indexName }] : []];
      }
      if (sql.includes('information_schema.COLUMNS') && sql.includes('token_version')) {
        return [columns.has('token_version') ? [{ COLUMN_NAME: 'token_version' }] : []];
      }
      return [columns.has(values[0]) ? [{ COLUMN_NAME: values[0] }] : []];
    }),
    query: jest.fn(async (sql) => {
      if (sql.includes('ADD COLUMN')) columns.add(sql.match(/ADD COLUMN (\w+)/)[1]);
      if (sql.includes('ADD UNIQUE KEY')) indexes.add('uq_reviews_booking_reviewer');
      if (sql.includes('ADD INDEX')) indexes.add('idx_reviews_booking_created');
      if (sql.includes('GROUP BY booking_id')) return [duplicateReviews];
      return [[]];
    }),
    release: jest.fn(),
  };
  return { getConnection: jest.fn(async () => connection), connection };
}

test('upgrades an older MySQL schema without dropping or rewriting records, and is repeatable', async () => {
  const db = database();
  await migrate(db);
  expect(db.connection.query.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE payments ADD COLUMN'))).toHaveLength(4);
  expect(db.connection.query.mock.calls.some(([sql]) => sql.includes('CREATE TABLE IF NOT EXISTS notifications'))).toBe(true);
  await migrate(db);
  expect(db.connection.query.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE payments ADD COLUMN'))).toHaveLength(4);
  expect(db.connection.release).toHaveBeenCalledTimes(2);
});

test('upgrades a schema already containing refund_id', async () => {
  const db = database(['refund_id']);
  await migrate(db);
  expect(db.connection.query.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE payments ADD COLUMN'))).toHaveLength(3);
});

test('fresh schemas require no upgrade', async () => {
  const db = database(
    ['refund_id', 'refund_key', 'refund_reason', 'refund_requested_at', 'token_version'],
    []
  );
  await migrate(db);
  expect(db.connection.query.mock.calls.some(([sql]) =>
    sql.startsWith('ALTER TABLE payments') || sql.startsWith('ALTER TABLE users')
  )).toBe(false);
});

test('migration stops for existing duplicate reviews without deleting records', async () => {
  const duplicate = { booking_id: 8, reviewer_id: 2, review_count: 2 };
  const db = database([], [duplicate]);
  await expect(migrate(db)).rejects.toThrow(/Resolve duplicate review records manually/);
  expect(db.connection.query.mock.calls.some(([sql]) => sql.includes('DELETE FROM reviews'))).toBe(false);
  expect(db.connection.release).toHaveBeenCalled();
});

test('migration failures release the advisory lock and connection', async () => {
  const db = database();
  db.connection.query.mockRejectedValueOnce(new Error('DDL failed'));
  await expect(migrate(db)).rejects.toThrow('DDL failed');
  expect(db.connection.execute.mock.calls.some(([sql]) => sql.includes('RELEASE_LOCK'))).toBe(true);
  expect(db.connection.release).toHaveBeenCalled();
});
