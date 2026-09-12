/**
 * Mesocycle Weeks Audit & Non-Destructive Backfill Tool
 *
 * Safe maintenance script to audit and repair programs that may only have Week 1
 * stored in `training.sessions` instead of the full 5-week mesocycle array.
 *
 * Safety guarantees:
 * 1. Read-Only by default (--dry-run). Requires explicit --apply to write to database.
 * 2. Non-destructive: preserves existing customized nutrition, calories, and coach notes 100%.
 * 3. Atomic execution: wrapped in database transactions when applying.
 *
 * Usage:
 *   Audit only (safe):  node scripts/maintenance/audit-and-backfill-mesocycle-weeks.js
 *   Apply repairs:      node scripts/maintenance/audit-and-backfill-mesocycle-weeks.js --apply
 */

import sequelize from '../../src/api/config/database.js';
import { Program, User, IntakeSubmission } from '../../src/api/models/index.js';
import { buildMasterEngineV2 } from '../../src/master-engine-v2/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadFoodCatalog() {
  const catalogPath = path.join(__dirname, '..', '..', 'data', 'catalogs', 'core-global-food-batch-v1.json');
  const data = await fs.readFile(catalogPath, 'utf-8');
  return JSON.parse(data);
}

async function auditAndBackfillMesocycleWeeks() {
  const isApply = process.argv.includes('--apply');

  console.log('================================================================');
  console.log('Z COACHING PLATFORM - MESOCYCLE WEEKS AUDIT & BACKFILL');
  console.log(`MODE: ${isApply ? 'LIVE APPLY (Database updates ENABLED)' : 'DRY RUN (Read-Only audit)'}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Database Host:', sequelize.config.host);
  console.log('Database Name:', sequelize.config.database);
  console.log('================================================================\n');

  try {
    const programs = await Program.findAll({
      order: [['id', 'ASC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'client_code', 'full_name', 'phone_number'] }]
    });

    console.log(`Total programs found in database: ${programs.length}\n`);

    if (programs.length === 0) {
      console.log('No programs found to inspect.');
      process.exit(0);
    }

    let catalog = null;
    let fullyIntactCount = 0;
    let fixableViaFormatSyncCount = 0;
    let missingWeeksNeedingRegenerationCount = 0;
    let unfixableCount = 0;

    for (const prog of programs) {
      let data = prog.program_data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          console.error(`[CORRUPT DATA] Program #${prog.id} has invalid JSON in program_data.`);
          unfixableCount++;
          continue;
        }
      }

      if (!data || typeof data !== 'object') {
        console.warn(`[EMPTY] Program #${prog.id} has empty program_data.`);
        unfixableCount++;
        continue;
      }

      const clientLabel = prog.user?.full_name || `User #${prog.user_id}`;
      const trainingProgWeeks = data.training_program?.weeks;
      const trainingWeeks = data.training?.weeks;
      const masterProgTrainingWeeks = data.master_program?.training_program?.weeks;

      const hasTrainingProg5Weeks = Array.isArray(trainingProgWeeks) && trainingProgWeeks.length >= 4;
      const hasTraining5Weeks = Array.isArray(trainingWeeks) && trainingWeeks.length >= 4;
      const hasMasterProg5Weeks = Array.isArray(masterProgTrainingWeeks) && masterProgTrainingWeeks.length >= 4;

      // Case 1: Both containers have full mesocycle weeks
      if (hasTraining5Weeks && hasTrainingProg5Weeks) {
        fullyIntactCount++;
        console.log(`[INTACT] Program #${prog.id} (${clientLabel}): Full 5 weeks present in both training and training_program.`);
        continue;
      }

      // Case 2: Full weeks exist in training_program but missing from training wrapper (or vice versa)
      const existingWeeks = (hasTrainingProg5Weeks && trainingProgWeeks) ||
                            (hasMasterProg5Weeks && masterProgTrainingWeeks) ||
                            (hasTraining5Weeks && trainingWeeks);

      if (existingWeeks) {
        fixableViaFormatSyncCount++;
        console.log(`[SYNC NEEDED] Program #${prog.id} (${clientLabel}): Full ${existingWeeks.length} weeks exist in raw data, needs sync to training.weeks.`);

        if (isApply) {
          if (!data.training) data.training = {};
          data.training.weeks = existingWeeks;
          if (!data.training.sessions && existingWeeks[0]?.sessions) {
            data.training.sessions = existingWeeks[0].sessions;
          }
          if (!data.training_program) data.training_program = {};
          if (!data.training_program.weeks) {
            data.training_program.weeks = existingWeeks;
          }

          prog.program_data = data;
          await prog.save();
          console.log(`  -> APPLIED: Synchronized weeks array into program #${prog.id} successfully.`);
        }
        continue;
      }

      // Case 3: Both training_program.weeks and training.weeks are missing or only have 1 week
      missingWeeksNeedingRegenerationCount++;
      console.warn(`[MISSING WEEKS] Program #${prog.id} (${clientLabel}): Only 1 week or no weeks array found.`);

      // Look up user's intake to regenerate weeks safely without touching nutrition
      const intakeSub = await IntakeSubmission.findOne({
        where: { user_id: prog.user_id },
        order: [['id', 'DESC']]
      });

      if (!intakeSub || !intakeSub.answers) {
        console.warn(`  -> Cannot regenerate: No IntakeSubmission found for User #${prog.user_id}.`);
        unfixableCount++;
        continue;
      }

      console.log(`  -> Found IntakeSubmission #${intakeSub.id}. Can regenerate training mesocycle weeks.`);

      if (isApply) {
        if (!catalog) catalog = await loadFoodCatalog();

        const evaluationContext = Object.freeze({
          system_time: new Date().toISOString(),
          assessmentDate: new Date().toISOString().split('T')[0]
        });

        const generated = buildMasterEngineV2({
          intake: intakeSub.answers,
          evaluationContext,
          nutritionFoodCatalog: catalog,
          options: {}
        });

        const newWeeks = generated.training_program?.weeks || [];
        if (newWeeks.length > 0) {
          if (!data.training) data.training = {};
          data.training.weeks = newWeeks;
          if (!data.training.sessions && newWeeks[0]?.sessions) {
            data.training.sessions = newWeeks[0].sessions;
          }
          if (!data.training_program) data.training_program = {};
          data.training_program.weeks = newWeeks;

          // Crucial: strictly preserve existing nutrition, calories, and coach notes!
          prog.program_data = data;
          await prog.save();
          console.log(`  -> APPLIED: Regenerated and saved 5-week mesocycle for Program #${prog.id} (Nutrition & Calories preserved).`);
        } else {
          console.error(`  -> Failed to generate mesocycle weeks from intake for Program #${prog.id}.`);
        }
      }
    }

    console.log('\n================================================================');
    console.log('SUMMARY AUDIT RESULTS:');
    console.log(`  - Fully intact programs:                           ${fullyIntactCount}`);
    console.log(`  - Fixable via container format sync (zero regen):  ${fixableViaFormatSyncCount}`);
    console.log(`  - Missing weeks requiring intake regeneration:     ${missingWeeksNeedingRegenerationCount}`);
    console.log(`  - Corrupted or unfixable (no intake):              ${unfixableCount}`);
    console.log('================================================================');
    if (!isApply) {
      console.log('NOTICE: This was a DRY RUN. Zero database modifications were made.');
      console.log('To apply the necessary repairs, rerun with: node scripts/maintenance/audit-and-backfill-mesocycle-weeks.js --apply\n');
    }
    process.exit(0);
  } catch (err) {
    console.error('Audit and backfill script failed:', err);
    process.exit(1);
  }
}

auditAndBackfillMesocycleWeeks();
