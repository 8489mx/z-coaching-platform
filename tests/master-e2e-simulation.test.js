import { describe, it, expect } from 'vitest';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';
import { resolveExerciseProgressionModel } from '../src/execution-engines/progressive-overload-engine.js';
import { evaluateWeeklyProgress } from '../src/execution-engines/weekly-audit-engine.js';
import { evaluateMasterClinicalProfile } from '../src/execution-engines/drug-interaction-firewall.js';
import { 
  evaluateMetabolicAndDeloadState, 
  generateHydrationAdvice,
  evaluateMicronutrientCompetition,
  evaluateFemaleCycleModulation,
  evaluateEmergencyFieldProtocols
} from '../src/execution-engines/metabolic-safeguards.js';
import { completeSingleSet, completeWorkoutSession } from '../src/execution-engines/offline-workout-sync-engine.js';
import { getTriageWhatsAppAction, generateWhatsAppLink } from '../src/utils/whatsapp-generator.js';

describe('Z COACHING PLATFORM - COMPLETE MASTER SYSTEM SIMULATION', () => {

  it('1. Onboarding Engine (Gym Fat Loss + Hypertension + Knee Pain)', () => {
    const p1 = generateInitialPlan({
      name: 'طارق سليم',
      gender: 'MALE',
      age: 34,
      weightKg: 95,
      heightCm: 180,
      activityLevel: 'MODERATE',
      goal: 'FAT_LOSS',
      trainingDaysPerWeek: 4,
      experienceLevel: 'INTERMEDIATE',
      environment: 'GYM',
      splitPreference: 'UPPER_LOWER_4X',
      medicalConditions: ['HYPERTENSION', 'PATELLAR_TENDINITIS'],
      benchPressWeightKg: 80,
      squatWeightKg: 100
    });

    expect(p1.daily_targets.calories).toBeGreaterThan(1500);
    expect(p1.daily_targets.calories).toBeLessThan(2600);
    expect(p1.daily_targets.protein_grams).toBeGreaterThanOrEqual(150);
    expect(p1.training_split.id).toContain('upper_lower');
    expect(p1.clinical_profile.biomechanicalRestrictions.length).toBeGreaterThan(0);
  });

  it('2. Onboarding Engine (Home Female + PCOS + 2nd Trimester Pregnancy)', () => {
    const p2 = generateInitialPlan({
      name: 'مريم العوضي',
      gender: 'FEMALE',
      age: 29,
      weightKg: 62,
      heightCm: 165,
      activityLevel: 'LIGHT',
      goal: 'LEAN_BULK',
      trainingDaysPerWeek: 3,
      experienceLevel: 'BEGINNER',
      environment: 'HOME',
      homeEquipment: ['DUMBBELLS', 'BANDS', 'STATIONARY_BIKE'],
      medicalConditions: ['PCOS_IR'],
      pregnancyTrimester: 'SECOND'
    });

    expect(p2.daily_targets.calories).toBeGreaterThan(1800);
    expect(p2.clinical_profile.biomechanicalRestrictions).toContain('NO_FLAT_SUPINE_EXERCISES');
    expect(p2.clinical_profile.safetyCues.some(g => g.includes('الجنين') || g.includes('الظهر'))).toBe(true);
    expect(p2.cardio_protocol.equipment).toBe('HOME_STATIONARY_BIKE');
  });

  it('3. Clinical Firewall Master Evaluation (Celiac, Bariatric, Gout)', () => {
    const celiacProfile = evaluateMasterClinicalProfile({
      medicalConditions: ['CELIAC_DISEASE', 'BARIATRIC_SURGERY', 'GOUT'],
      weightKg: 85,
      targetCalories: 2000,
      targetProteinGrams: 160,
      targetCarbGrams: 180,
      targetFatGrams: 60
    });

    expect(celiacProfile.prescribedNutrients.some(n => n.includes('GLUTEN_FREE'))).toBe(true);
    expect(celiacProfile.safetyCues.some(c => c.includes('تكميم') || c.includes('جلوتين') || c.includes('يوريك'))).toBe(true);
    expect(celiacProfile.waterLiters).toBeGreaterThanOrEqual(4.0);
  });

  it('4. Metabolic Safeguards (MATADOR Diet Break & Summer Hydration)', () => {
    const matadorEval = evaluateMetabolicAndDeloadState({
      weeksInDeficit: 12,
      weightStallWeeks: 2,
      adherenceRate: 0.95,
      currentCalories: 1800,
      maintenanceCalories: 2350,
      currentCarbGrams: 180
    });

    expect(matadorEval.triggerDietBreak).toBe(true);
    expect(matadorEval.adjustedCalories).toBe(2350);

    const summerHydro = generateHydrationAdvice({
      environmentTemperature: 'HOT_SUMMER',
      dailySweatLevel: 'HIGH'
    });

    expect(summerHydro.type).toBe('SMART_ELECTROLYTES_OPTIONAL');
    expect(summerHydro.options.length).toBeGreaterThan(0);
  });

  it('5. Exercise Progression & Overload Engine (Gym vs Home)', () => {
    const gymProg = resolveExerciseProgressionModel({
      environment: 'GYM',
      availableEquipment: ['FULL_GYM'],
      weekNumber: 3,
      currentWeightKg: 60,
      currentReps: 10,
      targetRIR: 2
    });
    expect(gymProg.strategy).toBe('LOAD_OVERLOAD');
    expect(gymProg.suggestedWeightKg).toBeGreaterThan(60);

    const homeProg = resolveExerciseProgressionModel({
      environment: 'HOME',
      availableEquipment: ['BODYWEIGHT_ONLY'],
      weekNumber: 3,
      currentWeightKg: 0,
      currentReps: 12,
      targetRIR: 2
    });
    expect(homeProg.strategy.length).toBeGreaterThan(0);
  });

  it('6. Weekly Check-in & Dynamic Adjustment Engine + WhatsApp', () => {
    const checkinPlateau = evaluateWeeklyProgress({
      previousWeightKg: 88.0,
      currentWeightKg: 88.0,
      previousWaistCm: 92,
      currentWaistCm: 92,
      adherenceRatePct: 95,
      weeksOnCurrentCalories: 2,
      currentCalories: 2100,
      goalType: 'FAT_LOSS'
    });

    expect(checkinPlateau.status).toBe('CONFIRMED_PLATEAU');
    expect(checkinPlateau.decision).toBe('REDUCE_CALORIES');
    expect(checkinPlateau.new_calories).toBeLessThan(2100);

    const waAction = getTriageWhatsAppAction(
      { name: 'أحمد حسني', phone: '01012345678' },
      'PLATEAU_REVIEW'
    );
    expect(waAction.url).toContain('wa.me/201012345678');
    expect(waAction.message_text.length).toBeGreaterThan(10);
  });

  it('7. Offline Workout Sync & Logging Engine', () => {
    const fakeStorage = {
      store: {},
      getItem(key) { return this.store[key] || null; },
      setItem(key, val) { this.store[key] = val; }
    };

    const singleSet = completeSingleSet({
      workoutId: 'w_push_1',
      exerciseId: 'bench_press',
      setNumber: 1,
      targetWeightKg: 70,
      targetReps: 10,
      storageDriver: fakeStorage
    });

    expect(singleSet.success).toBe(true);
    expect(singleSet.updatedSet.completed).toBe(true);

    const fullSession = completeWorkoutSession({
      workoutId: 'w_push_1',
      exercises: [
        { id: 'ex_1', name_ar: 'تمرين بنش', sets: [1, 2, 3] }
      ],
      autoFillTargets: true,
      storageDriver: fakeStorage
    });

    expect(fullSession.success).toBe(true);
    expect(fullSession.totalSetsCompleted).toBe(3);
  });

});
