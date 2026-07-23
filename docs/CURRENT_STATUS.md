# Z Coaching Platform — Current Status

- Audit date: 2026-07-23
- Audited branch: `develop`
- Audited commit: `d19b97bc9bdaa9d2846f7946b8d81c5a3901fef4`

This is the live-state companion to
[PROJECT_MEMORY.md](PROJECT_MEMORY.md). Update this file when the implementation,
test baseline, coverage, active branch, or exact next roadmap task changes.

## 1. Audit scope and source of truth

This document records the repository state after a read-only architecture audit.
The audit covered:

- All available repository documentation.
- All domain modules and their public exports under `src/`.
- The complete Intake, Training, Nutrition, and Pipeline Trace flows.
- All 27 test files and their integration coverage.
- Package exports, scripts, examples, Git history, and version tags.

Before this documentation milestone, `README.md` was the only repository
documentation. The implementation, contracts, tests, and Git history were
therefore used to resolve stale README statements. The new `docs/` system now
separates durable project memory, current state, architecture, roadmap, and
policy.

The current architecture follows these source-of-truth rules:

1. Deterministic code-based domain engines make all safety, training, nutrition,
   and cardio decisions.
2. Free text is retained for human review and is not interpreted by NLP or AI.
3. There is no AI/LLM runtime, external decision service, API, database, or UI
   in the current domain repository.
4. A future AI layer must be advisory only. It must consume approved,
   deterministic outputs and must not create, change, or override domain
   decisions.

## 2. Current architecture

### 2.1 Intake and safety

```text
Raw Client Intake + trusted evaluationContext.assessmentDate
  -> validateIntake
  -> Safety Rules
  -> Nutrition Decision Rules
  -> Training Decision Rules
  -> Cardio Decision Rules
  -> deterministic reducer and status priority
  -> IntakeDecision
```

Status priority is fixed:

```text
MEDICAL_REVIEW_REQUIRED
  > BLOCKED
  > COACH_REVIEW_REQUIRED
  > READY_FOR_DRAFT
```

Higher-priority status selection does not remove other relevant constraints,
review flags, reasons, or missing-data findings.

### 2.2 Training

```text
IntakeDecision
  -> Training Plan Specification
  -> Training Session Blueprint
  -> Exercise Selection <-> Exercise Catalog
  -> Training Prescription
  -> Training Draft
  -> Weekly Training Schedule
  -> Training Plan Preflight
  -> Training Engine output
```

### 2.3 Nutrition

```text
Raw Intake + trusted Evaluation Context + Nutrition Food Catalog
  -> Intake Decision
  -> Nutrition Planning Snapshot
  -> Nutrition Energy Target
  -> Nutrition Macro Targets
  -> Nutrition Meal Distribution
  -> Nutrition Meal Assembly Blueprint
  -> Nutrition Food Selection
  -> Nutrition Portion Solver
  -> Nutrition Swap Engine
  -> Nutrition Plan Preflight
  -> Nutrition Engine output
```

### 2.4 Pipeline trace

`Pipeline Trace Core V1` is a standalone metadata-only utility. It records
caller-supplied stage codes, versions, statuses, issue codes, reason codes, and
optional durations. It is intentionally not integrated into Training Engine or
Nutrition Engine yet and does not infer any business status.

## 3. A) Completed features

“Completed” below means complete within the explicitly implemented V1 scope. It
does not mean the surrounding product workflow is complete.

### 3.1 Intake Decision Engine V1

What exists:

- Strict runtime validation with unknown-field rejection.
- Trusted age derivation from `personal.dateOfBirth` and
  `evaluationContext.assessmentDate`, including the inclusive 0–120 range.
- Structured medical conditions, training equipment, additional sports,
  training availability, allergies, medical exclusions, intolerances,
  injuries, and movement restrictions.
- Deterministic safety, nutrition, training, and cardio findings.
- Stable status priority and deterministic deduplication/sorting.
- Original free text and exact source paths retained for human review.
- No silent coercion and no free-text disease, equipment, or sport inference.

Main files:

- `src/intake-decision-engine/intake-decision-engine.js`
- `src/intake-decision-engine/domain/contracts.js`
- `src/intake-decision-engine/domain/enums.js`
- `src/intake-decision-engine/domain/rule-result.js`
- `src/intake-decision-engine/validation/validate-intake.js`
- `src/intake-decision-engine/rules/safety-rules.js`
- `src/intake-decision-engine/rules/nutrition-rules.js`
- `src/intake-decision-engine/rules/training-rules.js`
- `src/intake-decision-engine/rules/cardio-rules.js`

Tests:

- 146 tests across Intake, validation, rules, and domain branches.
- Safety rules include medical instability, dangerous symptoms, pregnancy,
  minors, free text, medication, injury red flags, and pain level `>= 7`.
- Integration tests confirm status priority while retaining other findings.

### 3.2 Safety rules layer

What exists:

- Age and guardian-consent routing.
- Dangerous-symptom screening.
- Structured and unclassified medical-condition routing.
- Pregnancy and breastfeeding safety gates.
- Injury red flags and the high-pain medical-review threshold.
- Medical movement restrictions and retained hard constraints.
- Medication and unclassified-text review without medical interpretation.

Main file:

- `src/intake-decision-engine/rules/safety-rules.js`

The safety logic is complete for Intake V1, but it is a rules layer inside the
Intake Decision Engine rather than a separately versioned `Safety Engine`
module.

### 3.3 Training Plan Specification V1

What exists:

- Deterministic split selection from the already-decided
  `recommended_days`.
- Full Body for 2–3 days.
- Upper/Lower for 4 days.
- Upper/Lower/PPL for 5 days.
- Push/Pull/Legs for 6 days.
- Correct READY, provisional, and withheld propagation.
- Supported provisional zero-day result without inventing a replacement day
  count.

Main files:

- `src/training-plan-specification/build-training-plan-spec.js`
- `src/training-plan-specification/domain/contracts.js`
- `src/training-plan-specification/domain/enums.js`

Tests: 12.

### 3.4 Training Session Blueprints V1

What exists:

- Thirteen supported session codes.
- Fourteen structured movement-slot codes.
- Ordered movement-slot maps for every session.
- Status, constraints, reasons, sequence, and upstream decisions passed through.

Main files:

- `src/training-session-blueprint/build-training-session-blueprint.js`
- `src/training-session-blueprint/domain/contracts.js`
- `src/training-session-blueprint/domain/enums.js`

Tests: 11.

### 3.5 Minimal Exercise Catalog V1

What exists:

- 28 fixed exercise records, two per movement slot.
- Structured equipment requirements, locations, beginner suitability, and
  prescription units.
- `REPS`, `REPS_PER_SIDE`, and `SECONDS` metadata.
- Deterministic lookup by exercise code or movement slot.

Main files:

- `src/exercise-catalog/exercise-catalog.js`
- `src/exercise-catalog/domain/contracts.js`
- `src/exercise-catalog/domain/enums.js`

Tests: 15.

### 3.6 Exercise Selection V1

What exists:

- Deterministic selection by movement slot, location, available equipment,
  equipment capacity, beginner suitability, and catalog order.
- Standard GYM profile limited to light dumbbells, cable station, and
  selectorized machines, plus implicit bodyweight.
- Explicit equipment outranks standard gym equipment.
- Structured movement constraints preserve unresolved slots for review.
- No injury diagnosis or free-text interpretation.

Main files:

- `src/exercise-selection/build-exercise-selection.js`
- `src/exercise-selection/domain/contracts.js`
- `src/exercise-selection/domain/enums.js`

Tests: 19.

### 3.7 Training Prescription V1

What exists:

- Deterministic sets, target ranges, units, and rest periods.
- Prescription based on movement-slot category, maximum session duration,
  `volume_start`, and catalog `prescription_unit`.
- Review-required exercise slots retain `prescription: null`.

Main files:

- `src/training-prescription/build-training-prescription.js`
- `src/training-prescription/domain/contracts.js`

Tests: 10.

### 3.8 Training Draft, weekly scheduling, preflight, and facade

What exists:

- A Training Draft pipeline with stage-version provenance.
- Deterministic fixed-day scheduling and session-sequence mode.
- Additional-sport day/load handling.
- A final preflight report that validates schedule, exercise slots, and
  prescriptions.
- A Training Engine facade that runs Draft -> Schedule -> Preflight.

Main files:

- `src/training-draft/build-training-draft.js`
- `src/weekly-training-schedule/build-weekly-training-schedule.js`
- `src/training-plan-preflight/evaluate-training-plan-preflight.js`
- `src/training-engine/build-training-engine.js`

Tests:

- Training Draft: 11.
- Weekly Training Schedule: 20.
- Training Plan Preflight: 21.
- Training Engine: 13.

The Training Preflight result means:

| Training plan status | Preflight result | `can_approve` |
|---|---|---:|
| `READY` | `PASSED` | `true` |
| `PROVISIONAL_REVIEW_REQUIRED` | `REVIEW_REQUIRED` | `false` |
| `WITHHELD` | `WITHHELD` | `false` |

`can_approve` is approval eligibility, not a recorded coach approval.

### 3.9 Nutrition Engine V1

The deterministic Nutrition Engine is already implemented. It must not be
classified as wholly missing.

Completed stages:

| Stage | Main location | Tests |
|---|---|---:|
| Planning Snapshot | `src/nutrition-planning-snapshot/` | 16 |
| Energy Target | `src/nutrition-energy-target/` | 29 |
| Macro Targets | `src/nutrition-macro-targets/` | 30 |
| Meal Distribution | `src/nutrition-meal-distribution/` | 32 |
| Meal Assembly Blueprint | `src/nutrition-meal-assembly-blueprint/` | 33 |
| Food Catalog Contract | `src/nutrition-food-catalog/` | 38 |
| Food Catalog Excel tooling | `tools/nutrition-food-catalog-excel/` | 60 |
| Core Global Food Data batch | `data/catalogs/core-global-food-batch-v1.*` | 38 |
| Food Selection | `src/nutrition-food-selection/` | 84 |
| Portion Solver | `src/nutrition-portion-solver/` | 57 |
| Swap Engine | `src/nutrition-swap-engine/` | 51 |
| Nutrition Plan Preflight | `src/nutrition-plan-preflight/` | 36 |
| Nutrition Engine facade | `src/nutrition-engine/` | 13 |

What exists:

- Adult NASEM DRI 2023 EER energy calculation.
- Deterministic PAL classification and conservative calorie adjustments.
- Protein, fat, carbohydrate, and fiber targets.
- Deterministic 2–5 meal distribution.
- Nine meal-assembly patterns and structured component slots.
- A validated, immutable food-catalog contract.
- A production Core Global catalog containing 24 USDA FDC-backed foods.
- Deterministic food filtering and selection.
- Legal-gram portion optimization.
- Safe same-group swaps from approved candidates.
- Independent nutrition preflight with eight ordered checks.
- A ten-stage facade that exposes complete stage outputs without embedding the
  whole catalog.

Nutrition Preflight and Engine statuses:

| Preflight status | Engine status | `ready_for_coach_review` |
|---|---|---:|
| `READY` | `READY` | `true` |
| `REVIEW_REQUIRED` | `REVIEW_REQUIRED` | `true` |
| `WITHHELD` | `WITHHELD` | `false` |

The current real Core Global integration is deterministic and operational, but
finishes as `REVIEW_REQUIRED` because `fiber_g` is outside tolerance in meal 3
and at daily level. Swap safety still passes.

Total Nutrition tests: 517.

### 3.10 Pipeline Trace Core V1

What exists:

- Metadata-only deterministic trace construction.
- Ordered stages with one-based sequence.
- Unique stage codes.
- First-occurrence deduplication for issue and reason codes.
- Optional non-negative duration.
- Independent, deeply frozen output.
- No timestamps, randomness, business inference, or full stage payloads.

Main files:

- `src/pipeline-trace/build-pipeline-trace.js`
- `src/pipeline-trace/domain/contracts.js`
- `src/pipeline-trace/domain/enums.js`

Tests: 13.

### 3.11 Test baseline

Actual audit run:

- Test files: 27.
- Tests: 808.
- Passed: 808.
- Failed: 0.
- Overall line coverage: 98.12%.
- Overall branch coverage: 95.13%.
- Overall function coverage: 99.59%.

Test distribution:

| Area | Tests |
|---|---:|
| Intake, validation, safety, and intake decisions | 146 |
| Training pipeline | 132 |
| Nutrition pipeline, catalog, and Excel tooling | 517 |
| Pipeline Trace | 13 |
| **Total** | **808** |

### 3.12 Repository baseline and important milestones

Current repository facts at audit time:

- Local branch: `develop`.
- Local and remote baseline: `d19b97bc9bdaa9d2846f7946b8d81c5a3901fef4`.
- `main` points to the Training Engine V1 milestone `6f6cdd9`.
- Version tags: `intake-engine-v1-baseline`, `intake-engine-v1`, and
  `training-engine-v1`.
- Runtime dependencies: none.
- Development dependency: `exceljs`.
- There is no CI workflow, lint configuration, static type checker, API,
  database, UI, or AI runtime.

Important functional milestones:

| Commit | Milestone |
|---|---|
| `d5c55d8` | Approved Intake Decision Engine baseline |
| `b777612` | Structured sports integration and Intake V1 completion |
| `6f6cdd9` | Training Engine V1 milestone |
| `f7bc6ef` | Verified Core Global food-data batch |
| `26737ae` | Nutrition Portion Solver V1 |
| `501a227` | Nutrition Swap Engine V1 |
| `e4a8eac` | Nutrition Plan Preflight V1 |
| `b83ed22` | Nutrition Engine facade V1 |
| `d19b97b` | Pipeline Trace Core V1 |

The complete milestone narrative is in
[CHANGELOG_HISTORY.md](CHANGELOG_HISTORY.md).

## 4. B) Partially completed features

### 4.1 Approval Flow

Existing foundation:

- Training Preflight exposes `can_approve`.
- Nutrition Preflight exposes `ready_for_coach_review`.
- Review and blocking issues are structured and attributable.

Missing:

- An approve/reject/request-changes state machine.
- Coach or medical-reviewer identity.
- Approval comments and resolution of review issues.
- Medical-clearance recording.
- Plan locking after approval.
- Persistence, audit history, and authorization.

The current implementation determines eligibility for approval; it does not
record an actual approval.

### 4.2 Training prescription depth

Existing foundation:

- Exercise, sets, target range, unit, and rest.

Missing:

- Load selection.
- RPE/RIR.
- Tempo.
- Warm-up sets.
- Progression and regression.
- Deload.
- Exercise substitutions after coach review.
- Adaptation from completed-session data.

### 4.3 Exercise catalog breadth

Existing foundation:

- A validated minimal catalog covering every current movement slot.

Missing:

- Broader equipment coverage.
- More alternatives per slot.
- Regression/progression relationships.
- Contraindication metadata beyond the current movement constraints.
- Exercise-media or coaching-cue metadata.

### 4.4 Scheduling

Existing foundation:

- Deterministic weekly day assignment.
- Session-sequence support.
- Additional-sport load awareness.

Missing:

- Session time of day.
- Calendar dates and time zones.
- Rescheduling after missed sessions.
- Execution state.
- Cardio or mobility scheduling.

### 4.5 Nutrition product workflow

Existing foundation:

- The complete deterministic Nutrition Engine V1.
- Food selection, grams, swaps, and final preflight.

Missing or intentionally limited:

- The production catalog has only 24 core global foods.
- No specialized Egyptian or Gulf catalog batches yet.
- No recipes, shopping lists, supplements, sodium, saturated fat, or
  micronutrient planning.
- No presentation-layer serving units.
- No training-day/rest-day nutrition or carb cycling.
- No meal publication or client acceptance flow.
- No calibration/adaptation loop despite `calibration_required`.
- The current Core Global integration retains a fiber review finding.

### 4.6 Cardio

Existing foundation:

- Intake produces a deterministic cardio strategy, capacity limits, starting
  intensity, constraints, and reasons.

Missing:

- Cardio Plan Specification.
- Modality selection.
- Session prescription.
- Weekly coordination with training.
- Cardio preflight and facade.

### 4.7 Versioning and traceability

Existing foundation:

- Version constants on modules and outputs.
- Source-version links between stages.
- Git tags for Intake and Training baselines.
- Standalone Pipeline Trace Core.

Missing:

- Saved client-plan revisions.
- Policy/catalog version snapshots tied to a client plan.
- Supersede/rollback rules.
- Integrated engine traces.
- Durable audit events.

## 5. C) Missing features against the product vision

| Product capability | Current status | What is missing |
|---|---|---|
| Nutrition Engine | **Domain Engine V1 exists** | Product delivery, approval, persistence, history, calibration/adaptation, and broader catalog coverage |
| Cardio Engine | Missing after Intake decision | Plan specification, prescription, scheduling, preflight, and facade |
| Mobility/Flexibility Engine | Missing | Contracts, movement library, deterministic rules, prescription, tests, and evidence |
| Check-in Engine | Missing | Structured check-in contract, adherence/recovery inputs, validation, findings, and statuses |
| Adaptation Engine | Missing | Deterministic plan-change rules based on approved check-in and progress data |
| Progress Tracking | Missing | Measurements, performance history, adherence, trends, and domain summaries |
| Versioned Plan History | Missing at runtime | Stored immutable plan revisions, lineage, approval state, and rollback/supersede behavior |
| Coach Dashboard | Missing | Application/API/auth layer for review, approval, issue resolution, and plan publication |
| Client Application | Missing | Application/API/auth layer for intake, plan viewing, logging, check-ins, and progress |
| AI Assistant Layer | Missing intentionally | A bounded advisory adapter that can summarize or draft explanations but cannot decide or override domain outputs |

Other absent platform concerns include persistence, authentication,
authorization, tenancy, notifications, and external integrations. These belong
outside the pure domain engines.

## 6. D) Technical debt

### 6.1 Missing or stale documentation

- `/docs` does not exist.
- There are no architecture decision records.
- `README.md` is a 1,152-line monolith.
- README still reports 554 tests although 808 now pass.
- Early README sections say food selection, portions, swaps, dependencies, and
  production food data do not exist, while later code and appended sections
  show that they do.
- There is no single current module/version matrix apart from this audit.

### 6.2 Scientific evidence traceability

Strengths:

- The energy method is named `NASEM_DRI_2023_EER_ADULT`.
- Production foods contain exact USDA FDC record metadata and checked dates.

Gaps:

- There is no bibliography with complete publication details, links, or DOI
  where applicable.
- There is no versioned evidence registry linking each policy/rule code to its
  source, population, scope, review date, and interpretation.
- Protein factors, BMI-30 reference cap, fat percentage, fiber targets,
  deficit/surplus percentages, PAL thresholds, training set/rep/rest policies,
  cardio thresholds, pain routing, meal maps, optimization weights, and
  tolerances do not have rule-level citation provenance in the repository.

No new evidence-sensitive rule should be added without an explicit reference
record and tests for its policy boundary.

### 6.3 Missing tests and delivery controls

The suite is strong, but the remaining gaps include:

- No CI workflow.
- No enforced coverage threshold.
- No linting, formatting, or JSDoc/static type-checking configuration.
- `npm run check` is a manually maintained `node --check` list followed by the
  test suite; it can omit new files and is not a semantic type check.
- Training Engine defensive mismatch branches have relatively low direct
  coverage (76.47% lines and 66.67% branches).
- Training Plan Specification, Session Blueprint, and Prescription retain some
  uncovered defensive branches.
- Excel importer branches have lower coverage than the core engines.
- No performance/scale tests for larger food catalogs or the Portion/Swap
  optimization loops.
- No tests can cover approval actions, plan history, adaptation, or UI/API
  authorization because those capabilities do not exist yet.

### 6.4 Contract and validation risks

- Contracts are JSDoc plus runtime validation; there are no published,
  versioned JSON Schemas.
- Literal unions are repeated across module contracts and runtime enums,
  creating schema-drift risk.
- Downstream modules duplicate validation, deep-freeze, reason-deduplication,
  tolerance, and objective-calculation code.
- Portion Solver, Swap Engine, and Nutrition Preflight currently test shared
  numeric policies for consistency, but duplicated formulas could drift.
- `buildNutritionPlanningSnapshot` can be called publicly with an Intake
  Decision that has the right shape but came from a different intake. The
  Nutrition Engine facade avoids this by calculating the decision internally.
- Training Preflight validates the final shape but does not independently
  re-resolve every selected exercise against the Exercise Catalog. The normal
  pipeline remains safe because Selection and Prescription run first.

### 6.5 Immutability and status consistency

- Nutrition stages and Pipeline Trace return independent deeply frozen outputs.
- Training stages generally do not deep-freeze outputs and often pass
  `constraints`, `reasons`, and nested arrays by reference.
- Intake output is cloned but remains mutable.
- Training and Nutrition use different final status vocabularies and different
  approval-eligibility field names.
- A global Intake `plan_status` can make Training provisional because of a
  nutrition-only coach review. That is the current conservative behavior, but
  domain-specific approval policy must be decided before building a real
  Approval Flow.

### 6.6 Operational and architecture risks

- There is no persistence, audit log, runtime plan history, or tenant model.
- Pipeline Trace accepts caller-supplied metadata and is not integrated into
  either engine.
- The Food Catalog runtime is supplied by the caller; no repository interface
  or catalog-version persistence exists.
- The package name still reflects the original Intake Engine even though the
  repository now contains a broader platform. Renaming it would be a breaking
  change and should not be done casually.
- AI boundaries are architectural documentation only because no AI adapter
  exists yet. A future adapter needs explicit technical enforcement that it
  cannot write domain decisions or bypass preflight.

## 7. Recommended next implementation step

The next deterministic product module should be:

### Cardio Plan Specification V1

Why this is next:

- Intake already produces a structured cardio decision, but the pipeline ends
  at strategy and capacity.
- Training and Nutrition already have downstream specifications and preflight
  flows.
- Cardio is therefore the largest remaining gap in the deterministic coaching
  core, before Mobility, Check-ins, Adaptation, UI, or AI.

Required boundaries for that future task:

1. Consume only the approved Intake Decision cardio output and explicitly
   required upstream schedule context.
2. Do not re-run or reinterpret medical, injury, training-load, or Intake rules.
3. Preserve `MEDICAL_REVIEW_REQUIRED` and `BLOCKED` as withheld.
4. Treat current `max_sessions` and `max_duration_minutes` as limits unless a
   separately documented evidence-backed rule determines an actual
   prescription.
5. Define versioned contracts, enums, status propagation, immutability, and
   deterministic tests before adding session details.
6. Add a rule-level evidence document for every new duration, frequency,
   intensity, progression, or modality rule.
7. Keep API, database, UI, calendar integration, and AI outside the module.
8. Preserve all existing public contracts and backward compatibility.

No Cardio implementation, architecture redesign, AI layer, API, database, UI,
or other feature was started as part of this audit.
