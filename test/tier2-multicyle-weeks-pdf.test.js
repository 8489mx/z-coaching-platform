import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { buildTrainingMesoCycle, MesoCyclePhase } from '../src/training-engine-v2/index.js';
import { completeIntake } from './fixtures/complete-intake.js';
import { readFileSync } from 'node:fs';
import { adaptSessionToInteractiveWorkout } from '../frontend/src/pages/ClientInteractiveApp/utils/programAdapters.js';

describe('Tier 2 - Item 1: Multi-Week Mesocycle & PDF Full Periodization Suite', () => {

  it('1. Training Engine generates complete 5-week periodized cycle with Deload week', () => {
    const validIntake = completeIntake();
    const evaluationContext = { assessmentDate: '2026-08-16' };
    const decision = evaluateIntake(validIntake, evaluationContext);
    // Hidden old-contract failure (uncovered only once the M5 load error was
    // fixed): the fixture's profile has no experience, so the engine treats
    // it as a beginner — and the locked P1-B9 design CONSOLIDATES week 5 for
    // beginners instead of deloading (shouldDeload = !isBeginner). The test's
    // intent is to verify a deload week exists in a 5-week cycle, so it
    // explicitly requests a planned deload; the engine behavior is unchanged.
    const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5, plannedDeload: true });

    assert.ok(mesocycle, 'Mesocycle should be generated');
    assert.equal(mesocycle.total_weeks, 5, 'Must generate exactly 5 weeks');
    assert.equal(mesocycle.weeks.length, 5, 'Weeks array length must be 5');

    // Verify progression across weeks
    const weekNumbers = mesocycle.weeks.map(w => w.week_number);
    assert.deepEqual(weekNumbers, [1, 2, 3, 4, 5], 'Weeks must be numbered 1 to 5 sequentially');

    const week1 = mesocycle.weeks[0];
    const week5 = mesocycle.weeks[4];

    assert.equal(week1.phase, MesoCyclePhase.INTRO_ACCUMULATION, 'Week 1 should be INTRO_ACCUMULATION');
    assert.equal(week5.phase, MesoCyclePhase.DELOAD, 'Week 5 should be DELOAD');
    assert.ok(week5.volume_modifier < 1.0, 'Week 5 Deload must have reduced volume modifier');
    assert.ok(week1.sessions.length > 0, 'Week 1 must contain training sessions');
    assert.ok(week5.sessions.length > 0, 'Week 5 must contain training sessions');
  });

  it('2. PDF Chunking Logic extracts and flattens all 5 weeks into distinct pages (not just week 0)', () => {
    const mockProgram = {
      client: { full_name: 'أحمد محمود', client_code: '101' },
      training_program: {
        weeks: [
          {
            week_number: 1,
            phase: 'ACCUMULATION',
            target_rir: 3,
            focus_note: 'تأسيس التكنيك والمدى الحركي الكامل',
            sessions: [
              { session_name: 'Day 1: Upper A', exercises: [{ name_en: 'Bench Press', name_ar: 'بنش برس', sets: 3, reps: '8-10', rir: 3 }] },
              { session_name: 'Day 2: Lower A', exercises: [{ name_en: 'Squat', name_ar: 'سكوات', sets: 3, reps: '8-10', rir: 3 }] }
            ]
          },
          {
            week_number: 2,
            phase: 'ACCUMULATION',
            target_rir: 2,
            focus_note: 'زيادة الحمل التدريبي والتوتر الميكانيكي',
            sessions: [
              { session_name: 'Day 1: Upper A', exercises: [{ name_en: 'Bench Press', name_ar: 'بنش برس', sets: 3, reps: '8-10', rir: 2 }] },
              { session_name: 'Day 2: Lower A', exercises: [{ name_en: 'Squat', name_ar: 'سكوات', sets: 3, reps: '8-10', rir: 2 }] }
            ]
          },
          {
            week_number: 3,
            phase: 'OVERREACHING',
            target_rir: 1,
            focus_note: 'أقصى استثارة عضلية وتكثيف الحمل',
            sessions: [
              { session_name: 'Day 1: Upper A', exercises: [{ name_en: 'Bench Press', name_ar: 'بنش برس', sets: 4, reps: '8-10', rir: 1 }] },
              { session_name: 'Day 2: Lower A', exercises: [{ name_en: 'Squat', name_ar: 'سكوات', sets: 4, reps: '8-10', rir: 1 }] }
            ]
          },
          {
            week_number: 4,
            phase: 'PEAK',
            target_rir: 0,
            focus_note: 'قمة الأداء والاقتراب من الفشل العضلي',
            sessions: [
              { session_name: 'Day 1: Upper A', exercises: [{ name_en: 'Bench Press', name_ar: 'بنش برس', sets: 4, reps: '8-10', rir: 0 }] },
              { session_name: 'Day 2: Lower A', exercises: [{ name_en: 'Squat', name_ar: 'سكوات', sets: 4, reps: '8-10', rir: 0 }] }
            ]
          },
          {
            week_number: 5,
            phase: 'DELOAD',
            target_rir: 3,
            focus_note: 'أسبوع كسر الإجهاد والاستشفاء العضلي (-40% حجم)',
            sessions: [
              { session_name: 'Day 1: Upper Deload', exercises: [{ name_en: 'Bench Press', name_ar: 'بنش برس', sets: 2, reps: '10', rir: 3 }] },
              { session_name: 'Day 2: Lower Deload', exercises: [{ name_en: 'Squat', name_ar: 'سكوات', sets: 2, reps: '10', rir: 3 }] }
            ]
          }
        ]
      }
    };

    const rawWeeks = (
      (Array.isArray(mockProgram?.training_program?.weeks) && mockProgram.training_program.weeks.length > 0 && mockProgram.training_program.weeks) ||
      []
    );

    const trainingPages = [];
    rawWeeks.forEach((week) => {
      const wSessions = (Array.isArray(week.sessions) && week.sessions.length > 0) ? week.sessions : [];
      const numChunks = Math.max(1, Math.ceil(wSessions.length / 2));
      for (let c = 0; c < numChunks; c++) {
        trainingPages.push({
          weekNumber: week.week_number || 1,
          phase: week.phase || 'ACCUMULATION',
          targetRir: week.target_rir !== undefined ? week.target_rir : '1 - 2',
          focusNote: week.focus_note,
          sessions: wSessions.slice(c * 2, c * 2 + 2),
          chunkIndex: c,
          totalChunksInWeek: numChunks,
        });
      }
    });

    const totalPages = 3 + trainingPages.length;

    assert.equal(rawWeeks.length, 5, 'Must find 5 weeks in program');
    assert.equal(trainingPages.length, 5, 'With 2 sessions/week and 2 sessions/chunk, must generate 5 distinct training pages');
    assert.equal(totalPages, 8, 'Total pages must be 3 + 5 = 8');

    const representedWeeks = trainingPages.map(p => p.weekNumber);
    assert.deepEqual(representedWeeks, [1, 2, 3, 4, 5], 'All 5 weeks must be sequentially present in printable pages');

    const deloadPage = trainingPages.find(p => p.weekNumber === 5);
    assert.equal(deloadPage.phase, 'DELOAD');
    assert.equal(deloadPage.targetRir, 3);
    assert.ok(deloadPage.focusNote.includes('كسر الإجهاد'));
  });

  it('3. Client Interactive App has NO fallback weeks — offline with no program means no weeks, never a fabricated plan', async () => {
    // Decision 8 (confirmed 2026-11-05): DEFAULT_FALLBACK_WEEKS was deleted
    // intentionally in P0-A14 — the client never fabricates a demo week plan.
    // The old shape assertions (week 1 ACCUMULATION / RIR 3, week 5 DELOAD /
    // RIR 3) described the deleted demo constant and cannot be expressed
    // under the current design; the live coverage of "weeks come from the
    // server only" is test 1 in this file (the engine generates the real
    // 5-week cycle: week 1 INTRO_ACCUMULATION, week 5 DELOAD).
    const hookMod = await import('../frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js');
    assert.equal(
      'DEFAULT_FALLBACK_WEEKS' in hookMod,
      false,
      'The client hook must not export DEFAULT_FALLBACK_WEEKS (deleted intentionally in P0-A14)'
    );

    const hookSrc = readFileSync(
      new URL('../frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js', import.meta.url),
      'utf8'
    );
    // The trainingWeeks memo returns the program's weeks when they exist,
    // and [] — never a fabricated plan — when no program exists.
    assert.match(hookSrc, /P0-A14: no program means no weeks/);
    assert.match(
      hookSrc,
      /const trainingWeeks = useMemo\(\(\) => \{[\s\S]*?return \[\];/,
      'trainingWeeks must fall back to an empty array when no program weeks exist'
    );
  });

  it('4. adaptSessionToInteractiveWorkout properly incorporates weekContext target_rir', () => {
    const rawSession = {
      session_name: 'جلسة الصدر والترايسبس',
      exercises: [
        {
          id: 'ex_bench',
          name_en: 'Barbell Bench Press',
          name_ar: 'بنش برس بالبار',
          muscle: 'CHEST',
          sets: 3,
          reps: '8-10'
        }
      ]
    };

    // Week 4 (Peak: target_rir = 0)
    const week4Context = { week_number: 4, phase: 'PEAK', target_rir: 0 };
    const adaptedWeek4 = adaptSessionToInteractiveWorkout(rawSession, 0, week4Context);
    assert.equal(adaptedWeek4.exercises[0].targetRir, 0, 'Exercise in week 4 must inherit RIR 0 from weekContext');

    // Week 5 (Deload: target_rir = 3)
    const week5Context = { week_number: 5, phase: 'DELOAD', target_rir: 3 };
    const adaptedWeek5 = adaptSessionToInteractiveWorkout(rawSession, 0, week5Context);
    assert.equal(adaptedWeek5.exercises[0].targetRir, 3, 'Exercise in week 5 Deload must inherit RIR 3 from weekContext');
  });

});
