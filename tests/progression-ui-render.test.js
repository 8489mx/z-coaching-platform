import { describe, it, expect } from 'vitest';
import React from '../frontend/node_modules/react/index.js';
import { renderToStaticMarkup } from '../frontend/node_modules/react-dom/server.node.js';
import ProgressionTimeline from '../frontend/src/pages/CoachEditor/components/ProgressionTimeline.jsx';
import ExerciseLogCard from '../frontend/src/pages/ClientInteractiveApp/components/ExerciseLogCard.jsx';
import { buildProgressionState } from '../frontend/src/utils/progressionEngine.js';

const state = buildProgressionState({
  now: '2026-10-01',
  logs: [
    { created_at: '2026-09-20', week_number: 1, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 60, last_set_reps: 10, effort: 'OK', rep_min: 8, rep_max: 10 }] },
    { created_at: '2026-09-24', week_number: 2, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 62.5, last_set_reps: 8, effort: 'OK', rep_min: 8, rep_max: 10 }] },
  ],
});
const entry = state.exercises.BARBELL_BENCH_PRESS;

describe('progression UI', () => {
  it('coach timeline shows each logged session and the next target', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressionTimeline, { entry }));
    expect(html).toContain('60 × 10');
    expect(html).toContain('62.5 × 8');
    expect(html).toContain('الهدف الجاي: 62.5 كجم × 9 عدات');
  });

  it('coach timeline handles an exercise with no logs', () => {
    expect(renderToStaticMarkup(React.createElement(ProgressionTimeline, { entry: null }))).toContain('لم يسجل المتدرب');
  });

  it('client log card shows the target and exactly two inputs, no timers', () => {
    const html = renderToStaticMarkup(React.createElement(ExerciseLogCard, {
      exercise: { code: 'BARBELL_BENCH_PRESS' },
      progressionEntry: entry,
      draft: { weight_kg: 62.5, last_set_reps: 9, effort: 'OK' },
      onChange: () => {},
      onRepeatLast: () => {},
    }));
    expect(html).toContain('هدفك: 62.5 كجم × 9 عدات في آخر مجموعة');
    expect((html.match(/<input/g) || []).length).toBe(2);
    expect(html).toContain('زي آخر مرة (62.5 كجم × 8)');
  });

  it('bodyweight exercises show only the reps input', () => {
    const html = renderToStaticMarkup(React.createElement(ExerciseLogCard, {
      exercise: { code: 'PUSH_UPS_STANDARD' }, progressionEntry: null, draft: {}, onChange: () => {}, onRepeatLast: () => {},
    }));
    expect((html.match(/<input/g) || []).length).toBe(1);
  });
});
