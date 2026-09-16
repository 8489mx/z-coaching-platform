import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getExercisesCache,
  invalidateExercisesCache,
  getExercisesEtag,
  getFoodsCache,
  invalidateFoodsCache,
  getFoodsEtag,
  handleConditionalGet,
  getCacheStats,
  warmUpCatalogCache,
  clearCatalogCache,
  computeEtag
} from '../src/api/services/catalogCache.service.js';
import { getExercisesList } from '../src/api/controllers/exercise.controller.js';
import { getAdminExercises, getAdminFoods, getAdminCacheStats } from '../src/api/controllers/admin-settings.controller.js';

test('In-Memory Catalog Caching & ETag Validation Suite', async (t) => {

  await t.test('1. Initial Cache Miss and Subsequent Instant Cache Hits (O(1) Memory Access)', () => {
    clearCatalogCache();

    let stats = getCacheStats();
    assert.equal(stats.exercises.cached, false, 'Exercises must not be cached initially after clear');
    assert.equal(stats.exercises.hits, 0);
    assert.equal(stats.exercises.misses, 0);

    // 1. First call -> Cache Miss, loads into memory
    const t0 = performance.now();
    const ex1 = getExercisesCache();
    const durationMiss = performance.now() - t0;

    assert.ok(Array.isArray(ex1), 'Exercises must be an array');
    assert.ok(ex1.length > 50, 'Exercises catalog must contain items');

    stats = getCacheStats();
    assert.equal(stats.exercises.cached, true, 'Exercises must now be cached');
    assert.equal(stats.exercises.misses, 1, 'Miss count must be 1 on first load');
    assert.equal(stats.exercises.hits, 0, 'Hits should be 0 on first load');

    // 2. Subsequent calls -> Cache Hits
    const t1 = performance.now();
    for (let i = 0; i < 50; i++) {
      const exCached = getExercisesCache();
      assert.equal(exCached.length, ex1.length);
    }
    const durationHits = performance.now() - t1;

    stats = getCacheStats();
    assert.equal(stats.exercises.hits, 50, 'Hits must increment to 50');
    assert.equal(stats.exercises.misses, 1, 'Misses must remain 1');
    assert.ok(durationHits < 60, `50 in-memory cache hits must take < 60ms, took: ${durationHits.toFixed(2)}ms`);
  });

  await t.test('2. Foods Catalog Caching & Metrics', () => {
    clearCatalogCache();

    let stats = getCacheStats();
    assert.equal(stats.foods.cached, false);

    // First call -> Miss
    const fd1 = getFoodsCache();
    assert.ok(Array.isArray(fd1), 'Foods must be an array');
    assert.ok(fd1.length > 10, 'Foods catalog must contain items');

    stats = getCacheStats();
    assert.equal(stats.foods.cached, true);
    assert.equal(stats.foods.misses, 1);
    assert.equal(stats.foods.hits, 0);

    // Repeated calls -> Hits
    for (let i = 0; i < 20; i++) {
      const fd = getFoodsCache();
      assert.equal(fd.length, fd1.length);
    }

    stats = getCacheStats();
    assert.equal(stats.foods.hits, 20);
    assert.equal(stats.foods.misses, 1);
    assert.ok(stats.foods.hitRatio.includes('%'), 'Hit ratio must be formatted as percentage');
  });

  await t.test('3. Deterministic ETag Generation & Hash Consistency', () => {
    const sampleDataA = [{ id: 'EX_1', name_ar: 'تمرين 1' }, { id: 'EX_2', name_ar: 'تمرين 2' }];
    const sampleDataB = [{ id: 'EX_1', name_ar: 'تمرين 1' }, { id: 'EX_2', name_ar: 'تمرين 2' }];
    const sampleDataC = [{ id: 'EX_1', name_ar: 'تمرين معدل' }, { id: 'EX_2', name_ar: 'تمرين 2' }];

    const etagA = computeEtag(sampleDataA);
    const etagB = computeEtag(sampleDataB);
    const etagC = computeEtag(sampleDataC);

    assert.ok(etagA && typeof etagA === 'string' && etagA.length === 32, 'ETag must be 32-char hex MD5');
    assert.equal(etagA, etagB, 'Identical data must yield identical ETag');
    assert.notEqual(etagA, etagC, 'Modified data must yield a different ETag');
  });

  await t.test('4. Write-Through Invalidation: Instantly Updates In-Memory Cache (Zero Stale State)', () => {
    // Current cache state
    const originalExercises = getExercisesCache();
    const originalEtag = getExercisesEtag();

    const dummyExercise = {
      id: 'TEST_EX_CACHE_001',
      name_ar: 'تمرين فحص الكاش الذكي',
      name_en: 'Smart Cache Test Exercise',
      muscle_group: 'CHEST',
      equipment: 'DUMBBELL'
    };

    // Simulate saving a new exercise through invalidateExercisesCache (Write-Through)
    const updatedExercises = [dummyExercise, ...originalExercises];
    invalidateExercisesCache(updatedExercises);

    const freshCache = getExercisesCache();
    assert.equal(freshCache.length, originalExercises.length + 1, 'Cache must immediately include new item');
    assert.equal(freshCache[0].id, 'TEST_EX_CACHE_001', 'First item in cache must be the newly added exercise');

    const freshEtag = getExercisesEtag();
    assert.notEqual(freshEtag, originalEtag, 'ETag must change after cache invalidation');

    // Invalidate back with original
    invalidateExercisesCache(originalExercises);
    assert.equal(getExercisesCache().length, originalExercises.length);
  });

  await t.test('5. Write-Through Foods Invalidation: Instant Reflection', () => {
    const originalFoods = getFoodsCache();
    const originalEtag = getFoodsEtag();

    const testFood = {
      id: 'FOOD_CACHE_TEST_999',
      name_ar: 'شوفان معزز بالبروتين',
      name_en: 'Protein Fortified Oats',
      calories_per_100g: 380,
      protein_per_100g: 25
    };

    const updatedFoods = [testFood, ...originalFoods];
    invalidateFoodsCache(updatedFoods);

    const freshFoods = getFoodsCache();
    assert.equal(freshFoods.length, originalFoods.length + 1);
    assert.equal(freshFoods[0].id, 'FOOD_CACHE_TEST_999');

    const freshEtag = getFoodsEtag();
    assert.notEqual(freshEtag, originalEtag, 'Foods ETag must update on mutation');

    // Restore original
    invalidateFoodsCache(originalFoods);
  });

  await t.test('6. HTTP Conditional GET (304 Not Modified) Handling', () => {
    const testEtag = 'abc123def456';
    let responseStatus = null;
    let responseEnded = false;
    const responseHeaders = {};

    const createMockRes = () => ({
      setHeader: (name, val) => { responseHeaders[name] = val; },
      status: (code) => {
        responseStatus = code;
        return {
          end: () => { responseEnded = true; }
        };
      }
    });

    // 6.1 Client sends matching ETag -> 304 Not Modified
    const reqMatching = { headers: { 'if-none-match': `"${testEtag}"` } };
    const handledMatching = handleConditionalGet(reqMatching, createMockRes(), testEtag);
    assert.equal(handledMatching, true, 'handleConditionalGet must return true on match');
    assert.equal(responseStatus, 304, 'Response status must be 304 Not Modified');
    assert.equal(responseEnded, true, 'Response must end immediately without sending body');

    // 6.2 Client sends matching weak ETag (W/"...") -> 304 Not Modified
    responseStatus = null;
    responseEnded = false;
    const reqWeak = { headers: { 'if-none-match': `W/"${testEtag}"` } };
    const handledWeak = handleConditionalGet(reqWeak, createMockRes(), testEtag);
    assert.equal(handledWeak, true, 'handleConditionalGet must handle weak ETag W/"..."');
    assert.equal(responseStatus, 304);

    // 6.3 Client sends mismatched ETag -> false, sets ETag and Cache-Control
    responseStatus = null;
    responseEnded = false;
    const reqMismatch = { headers: { 'if-none-match': '"outdated_etag_789"' } };
    const handledMismatch = handleConditionalGet(reqMismatch, createMockRes(), testEtag);
    assert.equal(handledMismatch, false, 'Must return false on ETag mismatch');
    assert.equal(responseStatus, null, 'Status must not be set to 304 on mismatch');
    assert.equal(responseHeaders['ETag'], `"${testEtag}"`);
    assert.ok(responseHeaders['Cache-Control'].includes('max-age'));
  });

  await t.test('7. getExercisesList Controller: In-Memory Filtering and Fast-Path ETag', async () => {
    getExercisesCache(); // Ensure warm
    const currentEtag = getExercisesEtag();

    // 7.1 Unfiltered request with matching ETag -> 304 Not Modified
    let status304 = null;
    let ended304 = false;
    const req304 = {
      query: {},
      headers: { 'if-none-match': `"${currentEtag}"` }
    };
    const res304 = {
      setHeader: () => {},
      status: (code) => {
        status304 = code;
        return { end: () => { ended304 = true; } };
      }
    };
    getExercisesList(req304, res304);
    assert.equal(status304, 304, 'Unfiltered getExercisesList with valid ETag must return 304');
    assert.equal(ended304, true);

    // 7.2 In-memory filtering by muscle group
    let resultChest = null;
    const reqChest = {
      query: { muscle: 'CHEST' },
      headers: {}
    };
    const resChest = {
      setHeader: () => {},
      status: (code) => ({
        json: (data) => { resultChest = data; }
      })
    };
    getExercisesList(reqChest, resChest);
    assert.ok(resultChest && resultChest.exercises, 'Result must contain exercises');
    assert.ok(resultChest.exercises.every(e => e.muscle_group === 'CHEST'), 'All returned exercises must have muscle_group CHEST');

    // 7.3 In-memory Arabic text search
    let resultSearch = null;
    const reqSearch = {
      query: { search: 'بنش' },
      headers: {}
    };
    const resSearch = {
      setHeader: () => {},
      status: (code) => ({
        json: (data) => { resultSearch = data; }
      })
    };
    getExercisesList(reqSearch, resSearch);
    assert.ok(resultSearch && resultSearch.total > 0, 'Search for بنش must find items in memory');
  });

  await t.test('8. Admin Endpoints ETag and Cache Monitoring Integration', async () => {
    // 8.1 getAdminExercises returns 304 on matching ETag
    const exEtag = getExercisesEtag();
    let adminExStatus = null;
    const reqAdminEx = { headers: { 'if-none-match': `"${exEtag}"` } };
    const resAdminEx = {
      setHeader: () => {},
      status: (code) => {
        adminExStatus = code;
        return { end: () => {} };
      }
    };
    getAdminExercises(reqAdminEx, resAdminEx);
    assert.equal(adminExStatus, 304, 'getAdminExercises must return 304 on matching ETag');

    // 8.2 getAdminFoods returns 304 on matching ETag
    const fdEtag = getFoodsEtag();
    let adminFdStatus = null;
    const reqAdminFd = { headers: { 'if-none-match': `"${fdEtag}"` } };
    const resAdminFd = {
      setHeader: () => {},
      status: (code) => {
        adminFdStatus = code;
        return { end: () => {} };
      }
    };
    getAdminFoods(reqAdminFd, resAdminFd);
    assert.equal(adminFdStatus, 304, 'getAdminFoods must return 304 on matching ETag');

    // 8.3 getAdminCacheStats returns structured metrics
    let cacheStatsResponse = null;
    const reqStats = {};
    const resStats = {
      status: (code) => ({
        json: (data) => { cacheStatsResponse = data; }
      })
    };
    getAdminCacheStats(reqStats, resStats);
    assert.ok(cacheStatsResponse && cacheStatsResponse.success);
    assert.ok(cacheStatsResponse.cache.exercises.cached);
    assert.ok(cacheStatsResponse.cache.foods.cached);
    assert.ok(cacheStatsResponse.cache.exercises.itemCount > 50);
    assert.ok(cacheStatsResponse.cache.foods.itemCount > 10);
  });

  await t.test('9. warmUpCatalogCache Pre-warms All Catalogs into Memory', () => {
    clearCatalogCache();
    const statsBefore = getCacheStats();
    assert.equal(statsBefore.exercises.cached, false);
    assert.equal(statsBefore.foods.cached, false);

    const warmResult = warmUpCatalogCache();
    assert.ok(warmResult.exercisesCount > 50, 'Warmed exercises count must be > 50');
    assert.ok(warmResult.foodsCount > 10, 'Warmed foods count must be > 10');

    const statsAfter = getCacheStats();
    assert.equal(statsAfter.exercises.cached, true, 'Exercises must be cached after warmup');
    assert.equal(statsAfter.foods.cached, true, 'Foods must be cached after warmup');
  });

  await t.test('10. Graceful Degradation: Handles Empty / Fallback Loaders Without Crashing', () => {
    clearCatalogCache();
    
    // Custom empty loader
    const emptyResult = getExercisesCache(() => []);
    assert.deepEqual(emptyResult, [], 'Must handle empty loader gracefully');

    // Cache should hold empty array with valid ETag
    const stats = getCacheStats();
    assert.equal(stats.exercises.cached, true);
    assert.equal(stats.exercises.itemCount, 0);

    // Warm up back to real data
    clearCatalogCache();
    warmUpCatalogCache();
  });

});
