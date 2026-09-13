import test from "node:test";
import assert from "node:assert/strict";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { IntakeValidationError } from "../src/intake-decision-engine/validation/intake-validation-error.js";
import { submitPublicIntake, saveDraftIntake } from "../src/api/controllers/intake.controller.js";

test("Intake Strict Validation: Biometrics & Field Values", async (t) => {
  await t.test("1. Rejects impossible height (>250 cm or <120 cm) with INVALID_BIOMETRICS", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ height_cm: 350, weight_kg: 80 }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_BIOMETRICS");
        assert.equal(err.field, "height_cm");
        assert.equal(err.value, 350);
        return true;
      }
    );

    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ body: { heightCm: 90, weightKg: 80 } }),
      (err) => {
        assert.equal(err.code, "INVALID_BIOMETRICS");
        return true;
      }
    );
  });

  await t.test("2. Rejects impossible weight (>300 kg or <30 kg) with INVALID_BIOMETRICS", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ height_cm: 180, weight_kg: 500 }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_BIOMETRICS");
        assert.equal(err.field, "weight_kg");
        assert.equal(err.value, 500);
        return true;
      }
    );

    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ height_cm: 180, weight_kg: 15 }),
      (err) => {
        assert.equal(err.code, "INVALID_BIOMETRICS");
        return true;
      }
    );
  });

  await t.test("3. Rejects impossible waist (>200 cm or <40 cm) with INVALID_BIOMETRICS", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ height_cm: 180, weight_kg: 80, waist_cm: 350 }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_BIOMETRICS");
        assert.equal(err.field, "waist_cm");
        assert.equal(err.value, 350);
        return true;
      }
    );

    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ height_cm: 180, weight_kg: 80, waist_cm: 25 }),
      (err) => {
        assert.equal(err.code, "INVALID_BIOMETRICS");
        return true;
      }
    );
  });

  await t.test("4. Rejects invalid sex with INVALID_FIELD_VALUE", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ sex: "ALIEN_SPECIES" }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_FIELD_VALUE");
        assert.equal(err.field, "sex");
        return true;
      }
    );
  });

  await t.test("5. Rejects invalid primary goal with INVALID_FIELD_VALUE", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ primary_goal: "RANDOM_UNKNOWN_GOAL" }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_FIELD_VALUE");
        assert.equal(err.field, "primary_goal");
        return true;
      }
    );
  });

  await t.test("6. Rejects invalid daily activity with INVALID_FIELD_VALUE", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ daily_activity: "SUPER_HUMAN_ACTIVITY" }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_FIELD_VALUE");
        assert.equal(err.field, "daily_activity");
        return true;
      }
    );
  });

  await t.test("7. Rejects invalid experience level with INVALID_FIELD_VALUE", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ experience_level: "NINJA_WARRIOR" }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_FIELD_VALUE");
        assert.equal(err.field, "experience_level");
        return true;
      }
    );
  });

  await t.test("8. Rejects invalid training location with INVALID_FIELD_VALUE", () => {
    assert.throws(
      () => adaptIntakePayloadToCanonicalEngine({ training_location: "OUTER_SPACE" }),
      (err) => {
        assert.ok(err instanceof IntakeValidationError);
        assert.equal(err.code, "INVALID_FIELD_VALUE");
        assert.equal(err.field, "training_location");
        return true;
      }
    );
  });

  await t.test("9. Accepts valid physiological biometrics and standard fields cleanly", () => {
    const valid = adaptIntakePayloadToCanonicalEngine({
      first_name: "علي",
      last_name: "حسن",
      sex: "MALE",
      height_cm: 178,
      weight_kg: 82,
      waist_cm: 86,
      primary_goal: "FAT_LOSS",
      daily_activity: "MODERATE",
      experience_level: "INTERMEDIATE",
      training_location: "GYM"
    });

    assert.equal(valid.personal.sex, "MALE");
    assert.equal(valid.body.heightCm, 178);
    assert.equal(valid.body.weightKg, 82);
    assert.equal(valid.body.waistCm, 86);
    assert.equal(valid.goals.primary, "FAT_LOSS");
    assert.equal(valid.lifestyle.dailyActivity, "MODERATE");
    assert.equal(valid.training.experience, "INTERMEDIATE");
    assert.equal(valid.training.location, "GYM");
  });

  await t.test("10. submitPublicIntake controller returns 400 on impossible biometrics", async () => {
    let statusCode = null;
    let jsonResponse = null;
    const req = {
      body: {
        client_code: "1001",
        phone: "01011112222",
        full_name: "مدخل وهمي",
        height_cm: 350,
        weight_kg: 80
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        jsonResponse = payload;
        return this;
      }
    };

    await submitPublicIntake(req, res);
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.code, "INVALID_BIOMETRICS");
    assert.equal(jsonResponse.field, "height_cm");
  });

  await t.test("11. saveDraftIntake controller returns 400 on invalid field value", async () => {
    let statusCode = null;
    let jsonResponse = null;
    const req = {
      body: {
        client_code: "1001",
        phone: "01011112222",
        full_name: "مدخل وهمي",
        sex: "ALIEN_ROBOT"
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        jsonResponse = payload;
        return this;
      }
    };

    await saveDraftIntake(req, res);
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.code, "INVALID_FIELD_VALUE");
    assert.equal(jsonResponse.field, "sex");
  });
});
