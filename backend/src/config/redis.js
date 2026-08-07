const Redis = require('ioredis');

let client = null;

const connectRedis = () => {
  try {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('error', (err) => console.warn('[Redis] Error (non-fatal):', err.message));
    client.on('close', () => console.warn('[Redis] Connection closed'));

    return client;
  } catch (err) {
    console.warn('[Redis] Failed to connect — cache disabled:', err.message);
    return null;
  }
};

// ─── Cache helpers ──────────────────────────────────────────────

const getCache = async (key) => {
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 300) => {
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache failure is non-fatal
  }
};

const deleteCache = async (key) => {
  if (!client) return;
  try {
    await client.del(key);
  } catch {}
};

const deleteCachePattern = async (pattern) => {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch {}
};

module.exports = connectRedis;
module.exports.getCache = getCache;
module.exports.setCache = setCache;
module.exports.deleteCache = deleteCache;
module.exports.deleteCachePattern = deleteCachePattern;
