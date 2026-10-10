jest.mock('../database/pool', () => ({}));
const { migrate } = require('../database/migrate');

function database(existing = []) {
  const columns = new Set(existing);
  const connection = {
    execute: jest.fn(async (sql, values) => {
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
      return [columns.has(values[0]) ? [{ COLUMN_NAME: values[0] }] : []];
    }),
    query: jest.fn(async (sql) => {
      columns.add(sql.match(/ADD COLUMN (\w+)/)[1]);
    }),
    release: jest.fn(),
  };
  return { getConnection: jest.fn(async () => connection), connection };
}

test('upgrades an older MySQL schema without dropping or rewriting records, and is repeatable', async () => {
  const db = database();
  await migrate(db);
  expect(db.connection.query).toHaveBeenCalledTimes(4);
  expect(db.connection.query.mock.calls.every(([sql]) => sql.startsWith('ALTER TABLE payments ADD COLUMN'))).toBe(true);
  await migrate(db);
  expect(db.connection.query).toHaveBeenCalledTimes(4);
  expect(db.connection.release).toHaveBeenCalledTimes(2);
});

test('upgrades a schema already containing refund_id', async () => {
  const db = database(['refund_id']);
  await migrate(db);
  expect(db.connection.query).toHaveBeenCalledTimes(3);
});

test('fresh schemas require no upgrade', async () => {
  const db = database(['refund_id', 'refund_key', 'refund_reason', 'refund_requested_at']);
  await migrate(db);
  expect(db.connection.query).not.toHaveBeenCalled();
});

test('migration failures release the advisory lock and connection', async () => {
  const db = database();
  db.connection.query.mockRejectedValueOnce(new Error('DDL failed'));
  await expect(migrate(db)).rejects.toThrow('DDL failed');
  expect(db.connection.execute.mock.calls.some(([sql]) => sql.includes('RELEASE_LOCK'))).toBe(true);
  expect(db.connection.release).toHaveBeenCalled();
});
