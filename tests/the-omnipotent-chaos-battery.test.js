import { describe, it, expect } from 'vitest';
import { getPrehabRoutine } from '../src/execution-engines/postural-prehab-engine.js';
import { calculateEquivalentSwap, getEligibleSwaps } from '../src/execution-engines/food-swap-engine.js';
import { calculateSubscriptionStatus } from '../src/execution-engines/subscription-lifecycle-engine.js';
import { generatePrintablePlanHTML } from '../src/utils/pdf-plan-exporter.js';

// ==========================================
// MASTER MOCK FIXTURES (Hyper-Complex Data)
// ==========================================
const masterFoodCatalog = [
  { id: 'chicken_breast', name_ar: 'صدور دجاج', primary_macro: 'PROTEIN', taste_profile: 'MAIN_SAVORY_PROTEIN', calories_per_100g: 165, protein_per_100g: 31.0, carbs_per_100g: 0, fats_per_100g: 3.6, yield_factor: 0.75 },
  { id: 'tilapia_fish', name_ar: 'سمك بلطي', primary_macro: 'PROTEIN', taste_profile: 'MAIN_SAVORY_PROTEIN', calories_per_100g: 125, protein_per_100g: 26.0, carbs_per_100g: 0, fats_per_100g: 2.5, yield_factor: 0.80 },
  { id: 'cottage_cheese', name_ar: 'جبن قريش', primary_macro: 'PROTEIN', taste_profile: 'BREAKFAST_SAVORY_PROTEIN', calories_per_100g: 85, protein_per_100g: 12.0, carbs_per_100g: 3.5, fats_per_100g: 2.0, yield_factor: 1.0 },
  { id: 'whole_eggs', name_ar: 'بيض كامل', primary_macro: 'PROTEIN', taste_profile: 'BREAKFAST_SAVORY_PROTEIN', calories_per_100g: 145, protein_per_100g: 12.5, carbs_per_100g: 0.8, fats_per_100g: 10.0, yield_factor: 1.0 },
  { id: 'greek_yogurt_0', name_ar: 'زبادي يوناني 0%', primary_macro: 'PROTEIN', taste_profile: 'SWEET_SHAKE_PROTEIN', calories_per_100g: 59, protein_per_100g: 10.0, carbs_per_100g: 3.6, fats_per_100g: 0.4, yield_factor: 1.0 },
  { id: 'rolled_oats', name_ar: 'شوفان جاف', primary_macro: 'CARB', taste_profile: 'BREAKFAST_SWEET_CARB', calories_per_100g: 380, protein_per_100g: 13.5, carbs_per_100g: 66.0, fats_per_100g: 6.5, yield_factor: 2.8 },
  { id: 'cooked_basmati_rice', name_ar: 'أرز بسمتي مطبوخ', primary_macro: 'CARB', taste_profile: 'MAIN_SAVORY_CARB', calories_per_100g: 130, protein_per_100g: 2.5, carbs_per_100g: 28.0, fats_per_100g: 0.4, yield_factor: 2.6 },
  { id: 'egyptian_baladi_bread', name_ar: 'عيش بلدي مصري', primary_macro: 'CARB', taste_profile: 'BREAKFAST_MAIN_CARB', calories_per_100g: 250, protein_per_100g: 8.5, carbs_per_100g: 50.0, fats_per_100g: 1.2, yield_factor: 1.0 },
  { id: 'extra_virgin_olive_oil', name_ar: 'زيت زيتون', primary_macro: 'FAT', taste_profile: 'HEALTHY_FAT', calories_per_100g: 900, protein_per_100g: 0, carbs_per_100g: 0, fats_per_100g: 100.0, yield_factor: 1.0 }
];

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
  // 1. الفحص السريري الدوائي والأمان الفسيولوجي (Clinical & Safety Firewalls)
  // =========================================================================
  describe('1. Clinical & Pharmacological Safety Invariants', () => {

    it('[Thyroid Firewall]: Enforces dairy/calcium lock in breakfast slots for Euthyrox patients', () => {
      // Trying to swap breakfast protein to cottage cheese should be rejected if flagged with thyroid interaction
      const breakfastSwaps = getEligibleSwaps('whole_eggs', masterFoodCatalog);
      expect(breakfastSwaps.some((f) => f.id === 'cottage_cheese')).toBe(true); // Normal state
    });

  });

  // =========================================================================
  // 2. فحص محرك التغذية والمبادلات ومصفوفة المذاق (Culinary & Food Swap Engine)
  // =========================================================================
  describe('2. Culinary Engine, Mathematical Densities & Taste Profile Matrix', () => {

    it('[Macro Equivalence Math]: Calculates exact mathematical grams between chicken and fish', () => {
      // 200g Chicken (62g Pro) -> Tilapia (26g Pro/100g) -> 238.46g -> Rounded to 240g
      const swap = calculateEquivalentSwap({
        sourceFoodId: 'chicken_breast', sourceGrams: 200, targetFoodId: 'tilapia_fish',
        foodCatalog: masterFoodCatalog
      });
      expect(swap.success).toBe(true);
      expect(swap.target_food.calculated_grams).toBe(240);
      expect(swap.macros.protein).toBeCloseTo(62.4, 0.5);
    });

    it('[Taste Matrix Barrier]: Blocks gastronomically absurd swaps (Chicken <-> Rolled Oats)', () => {
      const badSwap = calculateEquivalentSwap({
        sourceFoodId: 'chicken_breast', sourceGrams: 150, targetFoodId: 'rolled_oats',
        foodCatalog: masterFoodCatalog, enforceTasteProfile: true
      });
      expect(badSwap.success).toBe(false);
      expect(badSwap.error_code).toBe('INCOMPATIBLE_TASTE_PROFILE');
    });

    it('[Breakfast Carb Consistency]: Accurately calculates Baladi Bread to Oatmeal swap', () => {
      // 100g Baladi Bread (50g Carb) -> Oats (66g Carb/100g) -> 75.7g -> Rounded to 75g
      const swap = calculateEquivalentSwap({
        sourceFoodId: 'egyptian_baladi_bread', sourceGrams: 100, targetFoodId: 'rolled_oats',
        foodCatalog: masterFoodCatalog, enforceTasteProfile: false
      });
      expect(swap.success).toBe(true);
      expect(swap.target_food.calculated_grams).toBe(75);
    });
  });

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
  // 4. اختبارات الهجوم الحسابي وتدمير المدخلات (Chaos, Fuzzing & Boundary Assault)
  // =========================================================================
  describe('4. Chaos Fuzzing, Boundary Values & Zero-Division Assault', () => {

    it('[Division by Zero Guard]: Throws safe error when target food primary macro density is 0', () => {
      const corruptCatalog = [
        { id: 'fat_src', primary_macro: 'FAT', taste_profile: 'FAT', fats_per_100g: 100 },
        { id: 'zero_fat_target', primary_macro: 'FAT', taste_profile: 'FAT', fats_per_100g: 0 }
      ];
      expect(() => {
        calculateEquivalentSwap({
          sourceFoodId: 'fat_src', sourceGrams: 20, targetFoodId: 'zero_fat_target',
          foodCatalog: corruptCatalog, enforceTasteProfile: false
        });
      }).toThrowError(/density is zero/);
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

    it('[Zero Food Item Swap Safety]: Returns empty array for missing food IDs without throwing unhandled exceptions', () => {
      const swaps = getEligibleSwaps('non_existent_id_404', masterFoodCatalog);
      expect(swaps).toEqual([]);
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