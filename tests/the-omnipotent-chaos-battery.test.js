import { describe, it, expect } from 'vitest';
import { getPrehabRoutine } from '../src/execution-engines/postural-prehab-engine.js';
import { calculateSubscriptionStatus } from '../src/execution-engines/subscription-lifecycle-engine.js';
import { generatePrintablePlanHTML } from '../src/utils/pdf-plan-exporter.js';

// ==========================================
// MASTER MOCK FIXTURES (Hyper-Complex Data)
// ==========================================
const masterMobilityCatalog = [
  { id: 'p_rs', issue_tag: 'ROUNDED_SHOULDERS', target_session: ['PUSH', 'UPPER'], duration_minutes: 3, exercises: [{ name_ar: 'Banded Pull-Apart', sets: 2, reps: '25' }] },
  { id: 'p_apt', issue_tag: 'ANTERIOR_PELVIC_TILT', target_session: ['LEGS', 'LOWER'], duration_minutes: 4, exercises: [{ name_ar: 'Hip Flexor Stretch', sets: 2, reps: '30s' }] },
  { id: 'p_ankle', issue_tag: 'ANKLE_RESTRICTION', target_session: ['LEGS', 'SQUAT_DAY'], duration_minutes: 2, exercises: [{ name_ar: 'Knee to Wall', sets: 2, reps: '12' }] },
  { id: 'p_knee', issue_tag: 'KNEE_DISCOMFORT', target_session: ['LEGS', 'LOWER'], duration_minutes: 3, exercises: [{ name_ar: 'Wall Tibialis Raise', sets: 2, reps: '20' }] },
  { id: 'p_rotator', issue_tag: 'SHOULDER_IMPINGEMENT', target_session: ['PUSH', 'UPPER', 'SHOULDERS'], duration_minutes: 3, exercises: [{ name_ar: 'Banded Ext Rotation', sets: 2, reps: '15' }] },
  { id: 'p_wrist', issue_tag: 'WRIST_STRAIN', target_session: ['PUSH', 'UPPER', 'PULL'], duration_minutes: 2, exercises: [{ name_ar: 'Forearm Release', sets: 2, reps: '10' }] }
];

describe('THE OMNIPOTENT CHAOS, CLINICAL & OPERATIONAL BATTERY', () => {

  // =========================================================================
  // 3. فحص محرك التأهيل المخصص وشدة التمرين (Biomechanics, RIR & Prehab)
  // =========================================================================
  describe('3. Biomechanical Prehab Injection & Session Targeting', () => {

    it('[Prehab Isolation]: Injects Knee & Ankle drills strictly on Lower body workouts', () => {
      const routine = getPrehabRoutine(['KNEE_DISCOMFORT', 'ANKLE_RESTRICTION'], 'LEGS', masterMobilityCatalog);
      expect(routine.has_prehab).toBe(true);
      expect(routine.exercises.length).toBe(2);
      expect(routine.exercises.some((e) => e.name_ar === 'Wall Tibialis Raise')).toBe(true);
      expect(routine.exercises.some((e) => e.name_ar === 'Knee to Wall')).toBe(true);
    });

    it('[Session Filter Guard]: Completely skips Upper Body prehab when the scheduled workout is Lower Body', () => {
      const routine = getPrehabRoutine(['ROUNDED_SHOULDERS', 'SHOULDER_IMPINGEMENT'], 'LEGS', masterMobilityCatalog);
      expect(routine.has_prehab).toBe(false);
      expect(routine.exercises.length).toBe(0);
    });

    it('[Duration Ceiling]: Never exceeds 5 minutes total prehab duration to preserve lifting energy', () => {
      const routine = getPrehabRoutine(['ROUNDED_SHOULDERS', 'SHOULDER_IMPINGEMENT', 'WRIST_STRAIN'], 'PUSH', masterMobilityCatalog);
      expect(routine.total_duration_minutes).toBeLessThanOrEqual(5);
      expect(routine.exercises.length).toBeLessThanOrEqual(3);
    });
  });

  // =========================================================================
  // 5. فحص تشويه التواريخ وفوضى التجميد (Date-Warp, Freeze Logs & Radar)
  // =========================================================================
  describe('5. Subscription Lifecycle, Retroactive Dates & Overlapping Freezes', () => {

    it('[Multi-Freeze Accumulation]: Accurately shifts expiry across multiple sequential freezes', () => {
      const sub = calculateSubscriptionStatus({
        startDateStr: '2026-08-01', durationDays: 30,
        freezeLogs: [{ days: 5 }, { days: 10 }],
        referenceDate: new Date('2026-08-20')
      });
      expect(sub.total_frozen_days).toBe(15);
      expect(sub.effective_expiry_date).toBe('2026-09-15');
      expect(sub.status).toBe('ACTIVE');
    });

    it('[Active Open-Ended Freeze Detection]: Locks app and flags frozen state when end is null', () => {
      const sub = calculateSubscriptionStatus({
        startDateStr: '2026-08-01', durationDays: 30,
        freezeLogs: [{ start: '2026-08-10', end: null }],
        referenceDate: new Date('2026-08-18')
      });
      expect(sub.is_frozen).toBe(true);
      expect(sub.status).toBe('FROZEN');
    });

    it('[Radar Alert 5-Day Threshold]: Triggers renewal alert when days remaining <= 5', () => {
      const sub = calculateSubscriptionStatus({
        startDateStr: '2026-08-01', durationDays: 20, freezeLogs: [],
        referenceDate: new Date('2026-08-18') // 17 days passed, 3 days remaining
      });
      expect(sub.days_remaining).toBe(3);
      expect(sub.radar_alert).toBe(true);
      expect(sub.status).toBe('EXPIRING_SOON');
      expect(sub.whatsapp_renewal_template).toContain('3 أيام');
    });
  });

  // =========================================================================
  // 6. فحص مقاومة البيانات المبتورة وتوليد الـ PDF (Null Safety & PDF Compiler)
  // =========================================================================
  describe('6. Null Payload Resilience & PDF Rendering Integrity', () => {

    it('[Null Payload Immunity]: Prehab Engine safely returns empty structure on corrupted input', () => {
      const res = getPrehabRoutine(undefined, undefined, undefined);
      expect(res.has_prehab).toBe(false);
      expect(res.exercises).toEqual([]);
    });

    it('[Printable PDF Markup Verification]: Renders robust clean HTML without raw null/undefined strings', () => {
      const html = generatePrintablePlanHTML({
        client: { name: 'المتدرب الشامل', target_calories: 2200, target_protein: 170, target_carbs: 220, target_fats: 70 },
        plan: {
          workout: { title_ar: 'تمرين شامل', exercises: [{ name_ar: 'سكوات', sets: 4, reps: 8, target_rir: 2 }] },
          meals: [{ title_ar: 'الفطور', calories: 500, items: [{ name_ar: 'بيض مسلوق', grams: 150 }] }],
          guidelines: {}
        }
      });
      expect(html).toContain('المتدرب الشامل');
      expect(html).toContain('2200 Kcal');
      expect(html).toContain('RIR 2');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    });
  });

});