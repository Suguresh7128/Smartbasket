const Redis = require('ioredis');
const net = require('net');

let cacheClient = null; // either ioredis client or fallback in-memory client

// Simple in-memory fallback cache (non-persistent)
const makeFallbackClient = () => {
  const map = new Map();
  return {
    async get(key) {
      return map.has(key) ? map.get(key) : null;
    },
    async setex(key, ttlSeconds, value) {
      map.set(key, value);
      if (ttlSeconds > 0) {
        setTimeout(() => map.delete(key), ttlSeconds * 1000);
      }
    },
    async del(key) {
      if (!key) return 0;
      if (Array.isArray(key)) {
        let removed = 0;
        key.forEach(k => { if (map.delete(k)) removed++; });
        return removed;
      }
      return map.delete(key) ? 1 : 0;
    },
    async keys(pattern) {
      // very naive pattern support: '*' returns all keys
      if (!pattern || pattern === '*') return Array.from(map.keys());
      // fallback: return keys that include the pattern substring
      return Array.from(map.keys()).filter(k => k.includes(pattern.replace('*', '')));
    }
  };
};

const waitForPort = (host, port, timeoutMs = 500) => new Promise((resolve) => {
  const socket = new net.Socket();
  let done = false;
  const onDone = (ok) => { if (!done) { done = true; socket.destroy(); resolve(ok); } };
  socket.setTimeout(timeoutMs);
  socket.once('error', () => onDone(false));
  socket.once('timeout', () => onDone(false));
  socket.connect(port, host, () => onDone(true));
});

const connectRedis = async () => {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  try {
    // quick port check to avoid noisy ioredis connection attempts
    const parsed = new URL(url);
    const host = parsed.hostname || '127.0.0.1';
    const port = parseInt(parsed.port || '6379', 10);
    const reachable = await waitForPort(host, port, 300);
    if (!reachable) {
      console.warn('[Redis] Not reachable at', `${host}:${port}`, '- using in-memory fallback');
      cacheClient = makeFallbackClient();
      return cacheClient;
    }

    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('error', (err) => console.warn('[Redis] Error (non-fatal):', err.message));
    client.on('close', () => console.warn('[Redis] Connection closed'));

    cacheClient = client;
    return cacheClient;
  } catch (err) {
    console.warn('[Redis] Failed to initialize — using fallback cache:', err.message);
    cacheClient = makeFallbackClient();
    return cacheClient;
  }
};

// ─── Cache helpers ──────────────────────────────────────────────

const getCache = async (key) => {
  if (!cacheClient) return null;
  try {
    const data = await cacheClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 300) => {
  if (!cacheClient) return;
  try {
    await cacheClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache failure is non-fatal
  }
};

const deleteCache = async (key) => {
  if (!cacheClient) return;
  try {
    await cacheClient.del(key);
  } catch {}
};

const deleteCachePattern = async (pattern) => {
  if (!cacheClient) return;
  try {
    const keys = await cacheClient.keys(pattern);
    if (keys && keys.length) await cacheClient.del(keys);
  } catch {}
};

module.exports = connectRedis;
module.exports.getCache = getCache;
module.exports.setCache = setCache;
module.exports.deleteCache = deleteCache;
module.exports.deleteCachePattern = deleteCachePattern;
