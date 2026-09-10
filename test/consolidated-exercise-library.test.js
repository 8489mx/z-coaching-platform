import test from 'node:test';
import assert from 'node:assert/strict';
import { getSmartExerciseSwaps } from '../src/exercise-swap-engine/index.js';
import { getExercisesCatalogFile } from '../src/api/controllers/admin-settings.controller.js';

test('Consolidated Master Exercise Library & Swap Engine Suite', async (t) => {
  const catalog = getExercisesCatalogFile();

  await t.test('1. Catalog contains over 100 fully enriched biomechanical exercises', () => {
    assert.ok(catalog.length >= 100, `Expected at least 100 exercises, got ${catalog.length}`);
  });

  await t.test('2. Every exercise has complete mandatory metadata', () => {
    for (const ex of catalog) {
      assert.ok(typeof ex.id === 'string' && ex.id.length > 0, `Missing id on ${JSON.stringify(ex)}`);
      assert.ok(typeof ex.name_ar === 'string' && ex.name_ar.length > 0, `Missing name_ar on ${ex.id}`);
      assert.ok(typeof ex.name_en === 'string' && ex.name_en.length > 0, `Missing name_en on ${ex.id}`);
      assert.ok(typeof ex.muscle_group === 'string' && ex.muscle_group.length > 0, `Missing muscle_group on ${ex.id}`);
      assert.ok(typeof ex.equipment === 'string' && ex.equipment.length > 0, `Missing equipment on ${ex.id}`);
      assert.ok(typeof ex.video_id === 'string' && ex.video_id.length > 0, `Missing video_id on ${ex.id}`);
      assert.ok(typeof ex.cues_ar === 'string' && ex.cues_ar.length > 0, `Missing cues_ar on ${ex.id}`);
      assert.ok(typeof ex.mistakes_ar === 'string' && ex.mistakes_ar.length > 0, `Missing mistakes_ar on ${ex.id}`);
    }
  });

  await t.test('3. Key missing biomechanical angles are present in catalog', () => {
    const ids = new Set(catalog.map(e => e.id));
    assert.ok(ids.has('HIGH_TO_LOW_CABLE_FLY'), 'Missing HIGH_TO_LOW_CABLE_FLY');
    assert.ok(ids.has('STRAIGHT_ARM_LAT_PULLDOWN'), 'Missing STRAIGHT_ARM_LAT_PULLDOWN');
    assert.ok(ids.has('ROTATOR_CUFF_EXTERNAL_ROTATION'), 'Missing ROTATOR_CUFF_EXTERNAL_ROTATION');
    assert.ok(ids.has('SEATED_HIP_ADDUCTION_MACHINE'), 'Missing SEATED_HIP_ADDUCTION_MACHINE');
    assert.ok(ids.has('COPENHAGEN_PLANK'), 'Missing COPENHAGEN_PLANK');
  });

  await t.test('4. getSmartExerciseSwaps resolves canonical codes and legacy aliases', () => {
    const squatSwaps = getSmartExerciseSwaps('BARBELL_BACK_SQUAT');
    assert.ok(squatSwaps.length >= 2, 'Expected swaps for BARBELL_BACK_SQUAT');

    const legSquatSwaps = getSmartExerciseSwaps('quads_barbell_squat');
    assert.ok(legSquatSwaps.length >= 2, 'Expected swaps for quads_barbell_squat');

    const benchSwaps = getSmartExerciseSwaps('BARBELL_FLAT_BENCH_PRESS');
    assert.ok(benchSwaps.length >= 2, 'Expected swaps for BARBELL_FLAT_BENCH_PRESS');

    const latPrayerSwaps = getSmartExerciseSwaps('STRAIGHT_ARM_LAT_PULLDOWN');
    assert.ok(latPrayerSwaps.length >= 2, 'Expected swaps for STRAIGHT_ARM_LAT_PULLDOWN');
  });

  await t.test('5. Lower back injury bypass excludes spinal compression movements', () => {
    const swaps = getSmartExerciseSwaps('BARBELL_BACK_SQUAT', {
      injuryFlags: ['LOWER_BACK']
    });
    assert.ok(swaps.length > 0);
    for (const s of swaps) {
      assert.ok(!s.exercise_code.includes('BARBELL_BACK_SQUAT'), 'Squat should be excluded on lower back injury');
      assert.ok(!s.exercise_code.includes('BARBELL_ROMANIAN_DEADLIFT'), 'Deadlift should be excluded on lower back injury');
    }
  });

  await t.test('6. Home environment filter returns home/bodyweight/dumbbell friendly swaps', () => {
    const homeSwaps = getSmartExerciseSwaps('BARBELL_BACK_SQUAT', {
      environment: 'HOME'
    });
    assert.ok(homeSwaps.length > 0);
    for (const s of homeSwaps) {
      assert.ok(
        s.environment === 'HOME' ||
        s.environment === 'GYM_OR_HOME' ||
        s.equipment === 'DUMBBELL' ||
        s.equipment === 'BODYWEIGHT' ||
        s.equipment === 'RESISTANCE_BAND'
      );
    }
  });

  await t.test('7. 100% of all exercises in catalog return at least 2 smart biomechanical swaps', () => {
    for (const ex of catalog) {
      const swaps = getSmartExerciseSwaps(ex.id);
      assert.ok(
        swaps.length >= 2,
        `Exercise ${ex.id} (${ex.name_ar}) must have at least 2 biomechanical swaps, but got ${swaps.length}`
      );
    }
  });

  await t.test('8. YouTube Shorts and modern URL regex extracts 11-char video ID correctly', () => {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    
    const shortsUrl1 = 'https://www.youtube.com/shorts/8iPEnn-ltC8';
    const match1 = shortsUrl1.match(regex);
    assert.ok(match1 && match1[1] === '8iPEnn-ltC8', 'Failed on youtube.com/shorts/');

    const shortsUrl2 = 'https://youtube.com/shorts/rT7DgCr-3pg?feature=share';
    const match2 = shortsUrl2.match(regex);
    assert.ok(match2 && match2[1] === 'rT7DgCr-3pg', 'Failed on youtube.com/shorts/ with query params');

    const youtuBeUrl = 'https://youtu.be/bEv6CCg2BC8';
    const match3 = youtuBeUrl.match(regex);
    assert.ok(match3 && match3[1] === 'bEv6CCg2BC8', 'Failed on youtu.be/');

    const standardUrl = 'https://www.youtube.com/watch?v=CAwf7n6Luuc';
    const match4 = standardUrl.match(regex);
    assert.ok(match4 && match4[1] === 'CAwf7n6Luuc', 'Failed on standard watch?v=');
  });

  await t.test('9. Bidirectional Smart Linker: saving A with alternative B links B to A automatically', async () => {
    const { saveAdminExercise } = await import('../src/api/controllers/admin-settings.controller.js');
    const mockReqA = {
      body: {
        id: 'TEST_EXERCISE_A',
        name_ar: 'تمرين تجريبي أ',
        name_en: 'Test Exercise A',
        muscle_group: 'CHEST',
        equipment: 'BARBELL',
        video_url: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
        alternatives: ['BARBELL_FLAT_BENCH_PRESS']
      }
    };
    let jsonResultA = null;
    const mockResA = {
      status: () => ({
        json: (data) => { jsonResultA = data; return data; }
      })
    };

    saveAdminExercise(mockReqA, mockResA);
    assert.ok(jsonResultA && jsonResultA.success, 'Failed to save Exercise A');

    const updatedCatalog = getExercisesCatalogFile();
    const savedA = updatedCatalog.find(e => e.id === 'TEST_EXERCISE_A');
    assert.ok(savedA, 'TEST_EXERCISE_A should exist in catalog');
    assert.ok(savedA.alternatives.includes('BARBELL_FLAT_BENCH_PRESS'), 'TEST_EXERCISE_A must include BARBELL_FLAT_BENCH_PRESS');

    const linkedB = updatedCatalog.find(e => e.id === 'BARBELL_FLAT_BENCH_PRESS');
    assert.ok(linkedB, 'BARBELL_FLAT_BENCH_PRESS should exist in catalog');
    assert.ok(linkedB.alternatives.includes('TEST_EXERCISE_A'), 'BARBELL_FLAT_BENCH_PRESS must bidirectionally include TEST_EXERCISE_A');

    const swapsForB = getSmartExerciseSwaps('BARBELL_FLAT_BENCH_PRESS');
    const directTwin = swapsForB.find(s => s.exercise_code === 'TEST_EXERCISE_A');
    assert.ok(directTwin, 'getSmartExerciseSwaps for B must include TEST_EXERCISE_A');
    assert.equal(directTwin.is_direct_twin, true, 'Mutual alternative must be flagged as is_direct_twin');
  });

  await t.test('10. Bidirectional Smart Linker: unlinking and deleting cleans up all reverse references', async () => {
    const { saveAdminExercise, deleteAdminExercise } = await import('../src/api/controllers/admin-settings.controller.js');
    // 1. Unlink: Save TEST_EXERCISE_A without BARBELL_FLAT_BENCH_PRESS
    const mockReqUnlink = {
      body: {
        id: 'TEST_EXERCISE_A',
        name_ar: 'تمرين تجريبي أ',
        name_en: 'Test Exercise A',
        muscle_group: 'CHEST',
        equipment: 'BARBELL',
        video_url: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
        alternatives: []
      }
    };
    let jsonResultUnlink = null;
    const mockResUnlink = {
      status: () => ({ json: (d) => { jsonResultUnlink = d; return d; } })
    };
    saveAdminExercise(mockReqUnlink, mockResUnlink);

    let currentCatalog = getExercisesCatalogFile();
    let linkedB = currentCatalog.find(e => e.id === 'BARBELL_FLAT_BENCH_PRESS');
    assert.ok(!linkedB.alternatives || !linkedB.alternatives.includes('TEST_EXERCISE_A'), 'BARBELL_FLAT_BENCH_PRESS must have unlinked TEST_EXERCISE_A');

    // 2. Delete TEST_EXERCISE_A and confirm cleanup
    let jsonResultDel = null;
    const mockResDel = {
      status: () => ({ json: (d) => { jsonResultDel = d; return d; } })
    };
    deleteAdminExercise({ params: { id: 'TEST_EXERCISE_A' } }, mockResDel);

    currentCatalog = getExercisesCatalogFile();
    assert.ok(!currentCatalog.some(e => e.id === 'TEST_EXERCISE_A'), 'TEST_EXERCISE_A must be deleted');
  });
});
