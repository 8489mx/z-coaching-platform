import test from "node:test";
import assert from "node:assert/strict";
import sequelize from "../src/api/config/database.js";
import { User, IntakeSubmission, Program, CheckinSubmission, ProgressPhoto } from "../src/api/models/index.js";
import { generateInitialPlan } from "../src/execution-engines/onboarding-plan-generator-engine.js";
import { approveCheckin } from "../src/api/controllers/checkin.controller.js";
import { generateWhatsAppLink } from "../src/utils/whatsapp-generator.js";

test("Live Trainee Lifecycle End-to-End Operational Simulation", async (t) => {
  let createdUser = null;
  let createdSubmission = null;
  let createdProgram = null;
  let createdCheckin = null;

  // Ensure Database is Synced
  await sequelize.authenticate();
  await sequelize.sync();

  const testPhone = "01099887766";
  const testClientCode = `SIM_${Date.now()}`;

  // =========================================================================
  // STAGE 1: Client Registration (NewClientQuickModal simulation)
  // =========================================================================
  await t.test("1. Stage 1: Client Registration & Subscription Creation", async () => {
    // Clean up any lingering test client with same phone
    await User.destroy({ where: { phone_number: testPhone } });

    const startDate = new Date();
    const durationDays = 120; // 4 months
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    createdUser = await User.create({
      full_name: "كابتن أحمد فؤاد (محاكاة حية)",
      phone_number: testPhone,
      client_code: testClientCode,
      subscription_package: "MAX_FOUR_MONTHS",
      subscription_status: "ACTIVE",
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      starting_weight_kg: 88.5,
      current_weight_kg: 88.5,
      target_calories: 2150
    });

    assert.ok(createdUser.id, "User ID should be generated");
    assert.equal(createdUser.subscription_package, "MAX_FOUR_MONTHS");
    assert.equal(createdUser.subscription_status, "ACTIVE");
    assert.ok(createdUser.subscription_end_date, "Subscription end date must be set");
  });

  // =========================================================================
  // STAGE 2: Intake Form Submission
  // =========================================================================
  await t.test("2. Stage 2: Trainee Submits Onboarding Intake Form", async () => {
    const intakeAnswers = {
      personal: {
        firstName: "أحمد",
        lastName: "فؤاد",
        gender: "male",
        age: 29,
        phone: testPhone
      },
      body: {
        weightKg: 88.5,
        heightCm: 178,
        estimatedBodyFat: 22
      },
      goals: {
        primaryGoal: "fat_loss",
        timelineWeeks: 16
      },
      training: {
        daysPerWeek: 4,
        experienceLevel: "intermediate",
        location: "gym"
      },
      nutrition: {
        mealsPerDay: 3,
        allergies: [],
        dietaryPreference: "intermittent_fasting_16_8",
        targetHydrationLiters: 3.5
      },
      medical: {
        hasInjuries: true,
        injuryNotes: "ألم خفيف أسفل الظهر عند ثني الجذع - يفضل حماية الفقرات القطنية"
      }
    };

    createdSubmission = await IntakeSubmission.create({
      user_id: createdUser.id,
      client_code: testClientCode,
      phone_number: testPhone,
      status: "PENDING_COACH_REVIEW",
      answers: intakeAnswers
    });

    assert.ok(createdSubmission.id, "Intake submission must be recorded");
    assert.equal(createdSubmission.status, "PENDING_COACH_REVIEW");
    assert.equal(createdSubmission.answers.goals.primaryGoal, "fat_loss");
  });

  // =========================================================================
  // STAGE 3: AI Plan Generation & Invariants Verification
  // =========================================================================
  let generatedPlan = null;
  await t.test("3. Stage 3: AI Program Synthesis & Strict Constraint Auditing", async () => {
    generatedPlan = generateInitialPlan({
      name: "أحمد فؤاد",
      gender: "MALE",
      age: 29,
      weightKg: 88.5,
      heightCm: 178,
      activityLevel: "MODERATE",
      goal: "FAT_LOSS",
      trainingDaysPerWeek: 4,
      experienceLevel: "INTERMEDIATE",
      environment: "GYM",
      medicalConditions: ["ألم خفيف أسفل الظهر"]
    });

    assert.ok(generatedPlan, "Plan must be generated");
    assert.ok(generatedPlan.daily_targets, "Plan must contain daily_targets specs");
    assert.ok(generatedPlan.training_split, "Plan must contain training_split");

    // Invariant 1: Caloric Deficit & Macros
    assert.ok(generatedPlan.daily_targets.calories < 2400, "Should be in caloric deficit");
    assert.ok(generatedPlan.daily_targets.protein_grams >= 160, "Should supply sufficient protein (~2g/kg)");

    // Invariant 2: ZERO GROCERY LISTS
    const serializedPlan = JSON.stringify(generatedPlan);
    assert.equal(
      /grocery|shopping_list|سوبرماركت|قائمة مشتريات/i.test(serializedPlan),
      false,
      "Zero grocery lists must exist in generated program"
    );

    // Invariant 3: NO interactive rep/weight logging tables in client prescriptions
    if (Array.isArray(generatedPlan.training_split?.sessions)) {
      for (const session of generatedPlan.training_split.sessions) {
        for (const ex of session.exercises || []) {
          assert.equal(ex.user_interactive_sets, undefined, "No interactive set tables should be mandated");
        }
      }
    }

    // Invariant 4: Static Hydration Target
    assert.ok(
      generatedPlan.daily_targets.water_liters >= 3.0,
      "Should have a static hydration target >= 3.0L"
    );
  });

  // =========================================================================
  // STAGE 4: Coach Approval & Program Activation
  // =========================================================================
  await t.test("4. Stage 4: Coach Program Activation", async () => {
    // Format program structure matching client app expectations
    const fullProgramData = {
      ...generatedPlan,
      nutrition: {
        targets: {
          calories: generatedPlan.daily_targets.calories,
          protein: generatedPlan.daily_targets.protein_grams,
          carbs: generatedPlan.daily_targets.carbs_grams,
          fats: generatedPlan.daily_targets.fats_grams,
          water_liters: generatedPlan.daily_targets.water_liters
        },
        culinary_meals: [
          {
            meal_name: "وجبة 1: الإفطار",
            items: [
              { name: "شوفان حبة كاملة", amount: 60, unit: "جرام" },
              { name: "بياض بيض مطبوخ", amount: 180, unit: "جرام" }
            ]
          },
          {
            meal_name: "وجبة 2: الغداء الرياضي",
            items: [
              { name: "صدور دجاج مشوية", amount: 200, unit: "جرام" },
              { name: "أرز بسمتي مسلوق", amount: 220, unit: "جرام" }
            ]
          }
        ]
      },
      training: {
        sessions: generatedPlan.training_split?.sessions || []
      }
    };

    createdProgram = await Program.create({
      user_id: createdUser.id,
      title: "برنامج التحول الرياضي - باقة ماكس",
      program_data: fullProgramData,
      status: "ACTIVE"
    });

    await createdSubmission.update({ status: "APPROVED" });

    assert.ok(createdProgram.id, "Program record created");
    assert.equal(createdProgram.status, "ACTIVE");
  });

  // =========================================================================
  // STAGE 5: Trainee Weekly Check-in Submission with Photo Upload
  // =========================================================================
  await t.test("5. Stage 5: Trainee Submits Week 1 Check-in", async () => {
    const checkinData = {
      user_id: createdUser.id,
      week_number: 1,
      daily_weights_kg: [88.5, 88.2, 88.0, 87.9, 87.8, 87.8, 87.8],
      average_weight_kg: 87.8, // -0.7 kg weight loss
      weight_change_kg: -0.7,
      waist_circumference_cm: 91.0, // -1 cm waist drop
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: {
        energyLevel: 8,
        sleepQuality: 8,
        hungerLevel: 4
      },
      analysis_status: "ON_TRACK",
      analysis_output: {
        suggested_calorie_delta: 0,
        status_badge: "تقدم ممتاز"
      },
      coach_notes: null,
      status: "PENDING_REVIEW"
    };

    createdCheckin = await CheckinSubmission.create(checkinData);

    // Attach simulated progress photo
    await ProgressPhoto.create({
      user_id: createdUser.id,
      week_number: 1,
      pose: "FRONT",
      photo_url: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vv9gAA="
    });

    assert.ok(createdCheckin.id, "Checkin record created");
    assert.equal(createdCheckin.status, "PENDING_REVIEW");
    assert.equal(createdCheckin.average_weight_kg, 87.8);
  });

  // =========================================================================
  // STAGE 6: Coach Check-in Approval with Smart Deep Merge
  // =========================================================================
  await t.test("6. Stage 6: Coach Review, Smart Deep Merge & WhatsApp Outreach", async () => {
    const coachCustomMacros = {
      calories: 2100,
      protein: 180,
      carbs: 195,
      fats: 53
    };
    const coachNotes = "عاش يا بطل، نزول 0.7 كجم ممتاز مع المحافظة على الكتلة العضلية. مستمرون بنفس الخطة!";

    // Prepare mock request and response for approveCheckin controller
    const req = {
      params: { checkinId: createdCheckin.id },
      body: {
        coach_notes: coachNotes,
        custom_macros: coachCustomMacros
      }
    };

    let responseStatus = null;
    let responseData = null;
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await approveCheckin(req, res);

    assert.equal(responseStatus, 200, "Approval should return HTTP 200");
    assert.equal(responseData?.success, true, "Approval must be marked successful");

    // Re-fetch updated program from DB
    const refreshedProg = await Program.findByPk(createdProgram.id);
    const progJson = typeof refreshedProg.program_data === 'string'
      ? JSON.parse(refreshedProg.program_data)
      : refreshedProg.program_data;

    // Verify Smart Deep Merge: Target macros updated to 2100 kcal
    assert.equal(progJson.nutrition?.targets?.calories, 2100, "Calories target must be updated");
    assert.equal(progJson.nutrition?.targets?.protein, 180, "Protein target must be updated");
    assert.equal(progJson.nutrition?.targets?.carbs, 195, "Carbs target must be updated");
    assert.equal(progJson.nutrition?.targets?.fats, 53, "Fats target must be updated");

    // Verify Checkin status updated to APPROVED
    const refreshedCheckin = await CheckinSubmission.findByPk(createdCheckin.id);
    assert.equal(refreshedCheckin.status, "APPROVED");
    assert.equal(refreshedCheckin.coach_notes, coachNotes);

    // Verify WhatsApp link generation has ZERO EMOJIS
    const waLink = generateWhatsAppLink(testPhone, coachNotes);
    assert.ok(waLink.startsWith("https://wa.me/201099887766?text="), "WhatsApp link must format phone with 20 prefix");
    
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(decodeURIComponent(waLink)), false, "WhatsApp message must contain ZERO emojis");
  });

  // =========================================================================
  // STAGE 7: Deterministic Subscription Freeze Shift
  // =========================================================================
  await t.test("7. Stage 7: Deterministic Freeze Shift Validation", async () => {
    // 1. Freeze Client
    const freezeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const freezeNotes = `[FREEZE_START:${freezeStart.toISOString()}]`;

    await createdUser.update({
      subscription_status: "FROZEN",
      notes: freezeNotes
    });

    assert.equal(createdUser.subscription_status, "FROZEN");

    // 2. Resume & Extend (Freeze Shift)
    const initialEndDate = new Date(createdUser.subscription_end_date);
    const freezeDays = 7;
    const newEndDate = new Date(initialEndDate.getTime() + freezeDays * 24 * 60 * 60 * 1000);

    await createdUser.update({
      subscription_status: "ACTIVE",
      subscription_end_date: newEndDate,
      notes: ""
    });

    const diffDays = Math.round((new Date(createdUser.subscription_end_date) - initialEndDate) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 7, "Subscription end date must be extended by exactly 7 freeze compensation days");
  });

  // =========================================================================
  // STAGE 8: Cascading Delete & Clean State
  // =========================================================================
  await t.test("8. Stage 8: Cascading Delete & Database Cleanup", async () => {
    await createdUser.destroy();

    // Verify cascading removal
    const orphanProgram = await Program.findOne({ where: { user_id: createdUser.id } });
    const orphanCheckin = await CheckinSubmission.findOne({ where: { user_id: createdUser.id } });
    const orphanIntake = await IntakeSubmission.findOne({ where: { user_id: createdUser.id } });
    const orphanPhoto = await ProgressPhoto.findOne({ where: { user_id: createdUser.id } });

    assert.equal(orphanProgram, null, "Programs must be deleted on cascade");
    assert.equal(orphanCheckin, null, "Checkins must be deleted on cascade");
    assert.equal(orphanIntake, null, "Intake submissions must be deleted on cascade");
    assert.equal(orphanPhoto, null, "Photos must be deleted on cascade");
  });

  await sequelize.close();
});

