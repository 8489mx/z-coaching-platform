import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_DIR = path.resolve(__dirname, '../../../data/settings');
const EXERCISES_CATALOG_FILE = path.join(SETTINGS_DIR, 'exercises_catalog.json');
const FOODS_CATALOG_FILE = path.join(SETTINGS_DIR, 'foods_catalog.json');
const SRC_EXERCISES_CATALOG_FILE = path.resolve(__dirname, '../../data/exercises-catalog.json');
const SRC_FOODS_CATALOG_FILE = path.resolve(__dirname, '../../data/food-catalog.json');

// Memory store for catalogs
const cacheStore = {
  exercises: {
    data: null,
    etag: null,
    lastUpdated: null,
    mtime: 0,
    hits: 0,
    misses: 0,
  },
  foods: {
    data: null,
    etag: null,
    lastUpdated: null,
    mtime: 0,
    hits: 0,
    misses: 0,
  }
};

/**
 * Compute strong ETag hash from catalog data
 */
export function computeEtag(data) {
  if (!data) return null;
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Helper to handle HTTP 304 Not Modified conditional requests
 */
export function handleConditionalGet(req, res, etag, maxAgeSeconds = 300) {
  if (!etag) return false;

  res.setHeader('ETag', `"${etag}"`);
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, must-revalidate`);

  const clientEtag = req.headers['if-none-match'];
  if (clientEtag) {
    const cleanClient = clientEtag.replace(/^W\//, '').replace(/^"|"$/g, '').trim();
    const cleanServer = etag.replace(/^"|"$/g, '').trim();
    if (cleanClient === cleanServer) {
      res.status(304).end();
      return true;
    }
  }
  return false;
}

/**
 * Load exercises from disk with fallbacks
 */
function loadExercisesFromDisk() {
  if (fs.existsSync(EXERCISES_CATALOG_FILE)) {
    try {
      const raw = fs.readFileSync(EXERCISES_CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const stat = fs.statSync(EXERCISES_CATALOG_FILE);
      return { data: parsed, mtime: stat.mtimeMs };
    } catch (e) {
      console.warn('Failed to parse exercises_catalog.json, falling back to source file:', e.message);
    }
  }

  if (fs.existsSync(SRC_EXERCISES_CATALOG_FILE)) {
    try {
      const srcRaw = fs.readFileSync(SRC_EXERCISES_CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(srcRaw);
      const stat = fs.statSync(SRC_EXERCISES_CATALOG_FILE);
      return { data: parsed, mtime: stat.mtimeMs };
    } catch (e) {
      console.warn('Failed to parse fallback exercises file:', e.message);
    }
  }

  return { data: [], mtime: Date.now() };
}

/**
 * Get exercises catalog from memory cache
 */
export function getExercisesCache(customLoader = null) {
  const store = cacheStore.exercises;

  // Check if cache is warm and still valid
  if (store.data !== null) {
    store.hits++;
    return store.data;
  }

  // Cache miss
  store.misses++;
  let loadedData = [];
  let fileMtime = Date.now();

  if (typeof customLoader === 'function') {
    loadedData = customLoader();
  } else {
    const result = loadExercisesFromDisk();
    loadedData = result.data;
    fileMtime = result.mtime;
  }

  store.data = loadedData;
  store.etag = computeEtag(loadedData);
  store.lastUpdated = new Date().toISOString();
  store.mtime = fileMtime;

  return store.data;
}

/**
 * Get current ETag for exercises catalog
 */
export function getExercisesEtag() {
  if (!cacheStore.exercises.etag) {
    getExercisesCache();
  }
  return cacheStore.exercises.etag;
}

/**
 * Invalidate or update exercises cache immediately (Write-Through)
 */
export function invalidateExercisesCache(newData = null) {
  const store = cacheStore.exercises;
  if (newData !== null) {
    store.data = Array.isArray(newData) ? newData : [];
    store.etag = computeEtag(store.data);
    store.lastUpdated = new Date().toISOString();
    store.mtime = Date.now();
  } else {
    store.data = null;
    store.etag = null;
    store.lastUpdated = new Date().toISOString();
    store.mtime = 0;
  }
}

/**
 * Load foods from disk with fallbacks
 */
function loadFoodsFromDisk() {
  if (fs.existsSync(FOODS_CATALOG_FILE)) {
    try {
      const raw = fs.readFileSync(FOODS_CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const stat = fs.statSync(FOODS_CATALOG_FILE);
      return { data: parsed, mtime: stat.mtimeMs };
    } catch (e) {
      console.warn('Failed to parse foods_catalog.json, falling back to source file:', e.message);
    }
  }

  if (fs.existsSync(SRC_FOODS_CATALOG_FILE)) {
    try {
      const srcRaw = fs.readFileSync(SRC_FOODS_CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(srcRaw);
      const stat = fs.statSync(SRC_FOODS_CATALOG_FILE);
      return { data: parsed, mtime: stat.mtimeMs };
    } catch (e) {
      console.warn('Failed to parse fallback foods file:', e.message);
    }
  }

  return { data: [], mtime: Date.now() };
}

/**
 * Get foods catalog from memory cache
 */
export function getFoodsCache(customLoader = null) {
  const store = cacheStore.foods;

  if (store.data !== null) {
    store.hits++;
    return store.data;
  }

  // Cache miss
  store.misses++;
  let loadedData = [];
  let fileMtime = Date.now();

  if (typeof customLoader === 'function') {
    loadedData = customLoader();
  } else {
    const result = loadFoodsFromDisk();
    loadedData = result.data;
    fileMtime = result.mtime;
  }

  store.data = loadedData;
  store.etag = computeEtag(loadedData);
  store.lastUpdated = new Date().toISOString();
  store.mtime = fileMtime;

  return store.data;
}

/**
 * Get current ETag for foods catalog
 */
export function getFoodsEtag() {
  if (!cacheStore.foods.etag) {
    getFoodsCache();
  }
  return cacheStore.foods.etag;
}

/**
 * Invalidate or update foods cache immediately (Write-Through)
 */
export function invalidateFoodsCache(newData = null) {
  const store = cacheStore.foods;
  if (newData !== null) {
    store.data = Array.isArray(newData) ? newData : [];
    store.etag = computeEtag(store.data);
    store.lastUpdated = new Date().toISOString();
    store.mtime = Date.now();
  } else {
    store.data = null;
    store.etag = null;
    store.lastUpdated = new Date().toISOString();
    store.mtime = 0;
  }
}

/**
 * Clear all cache data (useful for test isolation)
 */
export function clearCatalogCache() {
  cacheStore.exercises = {
    data: null,
    etag: null,
    lastUpdated: null,
    mtime: 0,
    hits: 0,
    misses: 0,
  };
  cacheStore.foods = {
    data: null,
    etag: null,
    lastUpdated: null,
    mtime: 0,
    hits: 0,
    misses: 0,
  };
}

/**
 * Get cache operational statistics
 */
export function getCacheStats() {
  const ex = cacheStore.exercises;
  const fd = cacheStore.foods;

  const totalExRequests = ex.hits + ex.misses;
  const exHitRatio = totalExRequests > 0 ? ((ex.hits / totalExRequests) * 100).toFixed(1) + '%' : '0%';

  const totalFdRequests = fd.hits + fd.misses;
  const fdHitRatio = totalFdRequests > 0 ? ((fd.hits / totalFdRequests) * 100).toFixed(1) + '%' : '0%';

  return {
    exercises: {
      cached: ex.data !== null,
      itemCount: ex.data ? ex.data.length : 0,
      etag: ex.etag,
      hits: ex.hits,
      misses: ex.misses,
      hitRatio: exHitRatio,
      lastUpdated: ex.lastUpdated
    },
    foods: {
      cached: fd.data !== null,
      itemCount: fd.data ? fd.data.length : 0,
      etag: fd.etag,
      hits: fd.hits,
      misses: fd.misses,
      hitRatio: fdHitRatio,
      lastUpdated: fd.lastUpdated
    }
  };
}

/**
 * Pre-warm all catalog caches on server boot
 */
export function warmUpCatalogCache() {
  const ex = getExercisesCache();
  const fd = getFoodsCache();
  console.log(`[CatalogCache] Warmed up: ${ex.length} exercises, ${fd.length} foods cached in memory.`);
  return {
    exercisesCount: ex.length,
    foodsCount: fd.length
  };
}
