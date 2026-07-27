# Z Coaching Platform — Project Memory

This is the permanent entry point and narrative source of truth for the Z
Coaching Platform. Read it before changing the repository. It explains why the
product exists, how the current domain system works, what has already been
built, and which boundaries must remain intact.

For facts that change frequently—branch, test count, coverage, current gaps,
and the next task—use [CURRENT_STATUS.md](CURRENT_STATUS.md). The remaining
documents own their narrower topics:

- [PRODUCT_VISION.md](PRODUCT_VISION.md): users, outcomes, and product journey.
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md): components and data flow.
- [ROADMAP.md](ROADMAP.md): completed phases and ordered future work.
- [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md): non-negotiable engineering rules.
- [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md): permitted and forbidden AI behavior.
- [SCIENTIFIC_POLICY.md](SCIENTIFIC_POLICY.md): evidence and traceability policy.
- [CHANGELOG_HISTORY.md](CHANGELOG_HISTORY.md): milestone history and decisions.

## 1. Product identity

Z Coaching Platform is intended to become an evidence-based coaching operating
system. It is not a content generator and it is not an AI chatbot wrapped
around health inputs. Its core value is a deterministic, reviewable chain that
turns structured client data into safe coaching decisions and draft plans.

The target product includes:

- Client mobile applications for onboarding, plan delivery, check-ins, and
  progress.
- A coach dashboard for review, approval, communication, and longitudinal
  management.
- An administrative surface for catalog, policy, access, and operational
  control.
- Deterministic domain engines for intake, safety, training, nutrition,
  cardio, mobility, check-ins, and adaptation.
- A constrained AI assistant that helps people understand and operate the
  system without becoming a source of clinical or programming truth.

## 2. End-to-end product journey

The intended client journey is:

```text
Acquisition
  -> Payment
  -> Account creation
  -> Structured intake
  -> Assessment
  -> Deterministic plan generation
  -> Coach review and approval
  -> Client delivery
  -> Weekly check-ins
  -> Deterministic adaptation
  -> Long-term progress tracking and versioned history
```

Only the domain-intelligence portion of this journey exists in the repository
today. Authentication, payment, persistence, dashboards, applications, and
notifications have not been implemented.

## 3. Governing architecture decision

Deterministic code is the brain of the platform.

Domain engines own validation, safety escalation, training programming,
nutrition calculation, and future cardio/adaptation decisions. Their outputs
must be reproducible from versioned inputs and policies.

AI is an assistant beside those engines. It may:

- Summarize already-computed decisions.
- Explain reasons and constraints in appropriate language.
- Help coaches navigate approved information.
- Search an approved knowledge base.
- Improve communication drafts.

AI must not:

- Make or override medical and safety decisions.
- Invent training or nutrition prescriptions.
- bypass contracts, validation, review, or approval.
- Convert free text into an authoritative diagnosis or hidden rule.
- Write an unvalidated plan directly to a client.

See [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) for the complete boundary.

## 4. Domain architecture at a glance

```text
Structured data
  -> Contract validation
  -> Deterministic policy/rule engines
  -> Domain plan builders
  -> Preflight validation
  -> Coach approval (future workflow)
  -> Client delivery (future application)

AI assistant
  -> reads approved, bounded outputs
  -> explains or assists
  -> never enters the authoritative decision path
```

The repository currently contains four main areas:

1. Intake and embedded safety/nutrition/training/cardio decisions.
2. A complete deterministic Training Engine V1 pipeline.
3. A complete deterministic Nutrition Engine V1 pipeline.
4. A standalone metadata-only Pipeline Trace Core V1.

## 5. Completed implementation inventory

“Completed” means the current V1 contract and tests exist. It does not mean the
module is a finished consumer product or that its scientific policy can never
change.

| Area/module | Why it exists | Status | Main files | Test coverage and notes |
|---|---|---|---|---|
| Intake Decision Engine | Convert structured intake into an auditable plan status and domain decisions. | V1 complete | `src/intake-decision-engine/index.js`, `evaluate-intake.js`, `domain/`, `validation/`, `safety-rules/`, `nutrition-rules/`, `training-rules/`, `cardio-rules/` | Covered by intake, validation, rules, and branch tests. The current package root exports this engine. |
| Intake validation | Reject unknown fields and invalid contracts before rules execute. | V1 complete | `src/intake-decision-engine/validation/` | Includes derived age, medical conditions, sports, equipment, pain, and free-text contract cases. |
| Embedded safety layer | Escalate high-risk intake signals without diagnosis. | V1 complete as an intake layer | `src/intake-decision-engine/safety-rules/` | Medical status priority, high pain, injury red flags, medications/instructions, and unclassified conditions are tested. It is not a standalone versioned engine. |
| Intake nutrition decision | Produce constraints, soft preferences, reasons, and draft eligibility. | V1 complete | `src/intake-decision-engine/nutrition-rules/` | Allergies, exclusions, budget, dislikes, and review behavior are covered. |
| Intake training decision | Determine recommended days, schedule mode, starting volume, and constraints. | V1 complete | `src/intake-decision-engine/training-rules/` | Equipment, locations, injuries, age, additional sports, and review behavior are covered. |
| Intake cardio decision | Produce bounded cardio guidance inside the intake decision. | Intake-level decision complete | `src/intake-decision-engine/cardio-rules/` | Tested as part of intake/rules. |
| Cardio Plan Specification | Turn the frozen intake cardio decision into a downstream specification without recalculating it. | V1 complete | `src/cardio-plan-specification/` | Propagates strategy, limits, constraints, and produces WITHHELD when blocked. Tested. |
| Cardio Modality Requirements | Select precise modalities and upper bounds based on the specification strategy. | V1 complete | `src/cardio-modality-requirements/` | Outputs LISS and STEPS; HIIT is deferred. Ready/withheld paths are tested. |
| Training Plan Specification | Turn the frozen intake training decision into a split and ordered sessions without recalculating it. | V1 complete | `src/training-plan-specification/` | Covers 2–6 days, ready/provisional/withheld states, and the valid provisional zero-day case. |
| Training Session Blueprint | Translate each session code into ordered movement slots. | V1 complete | `src/training-session-blueprint/` | All 13 session codes and 14 movement-slot codes are mapped and tested. |
| Exercise Catalog | Provide structured exercises and prescription-unit metadata. | Minimal V1 complete | `src/exercise-catalog/` | 28 exercises, two per movement slot; query APIs, order, equipment, locations, and units are tested. |
| Exercise Selection | Select eligible exercises deterministically from slots, constraints, location, and equipment. | V1 complete | `src/exercise-selection/` | Includes explicit equipment precedence, standard gym profile, review fallbacks, immutability, and integration tests. |
| Training Prescription | Attach sets, target ranges/units, and rest metadata to selected exercises. | V1 complete | `src/training-prescription/` | Deterministic prescription mappings and upstream propagation are tested. It intentionally omits load, RPE/RIR, tempo, and progression. |
| Training Draft | Compose plan specification, blueprint, selection, and prescription through public APIs. | V1 complete | `src/training-draft/` | Pipeline wiring, status propagation, determinism, and integration are tested. |
| Weekly Training Schedule | Place ordered sessions into fixed-day or sequence schedules while retaining additional-sport load. | V1 complete | `src/weekly-training-schedule/` | Schedule modes, day validity, conflicts, provisional/withheld behavior, and immutability are tested. |
| Training Plan Preflight | Validate that a generated training draft and schedule are eligible for coach approval. | V1 complete | `src/training-plan-preflight/` | Pass/review/withheld paths and consistency checks are tested. `can_approve` is eligibility, not a persisted approval. |
| Training Engine | Provide one deterministic facade from an Intake Decision to draft, schedule, and preflight. | V1 complete | `src/training-engine/` | Facade composition and status propagation are tested. Training Engine coverage is lower than most domain modules; see current status. |
| Nutrition Planning Snapshot | Transform the intake decision into the structured data needed by nutrition planning. | V1 complete | `src/nutrition-planning-snapshot/` | Status, constraints, measurement inputs, derived age use, and immutability are tested. |
| Nutrition Energy Target | Calculate adult energy targets using the module’s versioned policy. | V1 complete | `src/nutrition-energy-target/` | Formula branches, guards, status propagation, and deterministic outputs are tested. Current named basis is NASEM DRI 2023 adult EER. |
| Nutrition Macro Targets | Allocate protein, fat, carbohydrate, and fiber targets from the energy result. | V1 complete | `src/nutrition-macro-targets/` | Macro consistency, bounds, units, status propagation, and immutability are tested. |
| Nutrition Meal Distribution | Distribute daily targets across 2–5 meals. | V1 complete | `src/nutrition-meal-distribution/` | Distribution policy, totals, meal ordering, and status behavior are tested. |
| Nutrition Meal Assembly Blueprint | Choose a deterministic structural pattern for each meal. | V1 complete | `src/nutrition-meal-assembly-blueprint/` | Nine patterns, slot construction, constraints, propagation, and deterministic mapping are tested. |
| Nutrition Food Catalog | Validate and expose structured food records and catalog metadata. | Core V1 complete | `src/nutrition-food-catalog/`, `tools/nutrition-food-catalog-excel/`, `data/catalogs/` | Catalog contracts, Excel importer/template, and production batch are tested. Core Global currently contains 24 USDA FDC-backed foods. |
| Nutrition Food Selection | Select eligible catalog candidates for blueprint slots without solving grams. | V1 complete | `src/nutrition-food-selection/` | Candidate filtering, constraints, patterns, uniqueness, determinism, and Core Global integration are tested. |
| Nutrition Portion Solver | Find legal gram values and evaluate meal/daily nutrition tolerances. | V1 complete | `src/nutrition-portion-solver/` | Legal-grid search, objective ordering, tolerances, residuals, status propagation, and integration are tested. |
| Nutrition Swap Engine | Calculate safe alternative foods and legal replacement grams from approved candidates. | V1 complete | `src/nutrition-swap-engine/` | Same-group/candidate restrictions, no-duplicate behavior, objective search, tolerance rejection, ordering, and immutability are tested. |
| Nutrition Plan Preflight | Run final deterministic consistency and tolerance checks across the nutrition pipeline. | V1 complete | `src/nutrition-plan-preflight/` | Eight checks, issue/reason propagation, readiness, deep freeze, and Core Global integration are tested. |
| Nutrition Engine | Run all ten nutrition stages from intake through preflight using public APIs. | V1 complete | `src/nutrition-engine/` | Stage wiring, status propagation, catalog-order independence, deep freeze, errors, and full integration are tested. |
| Pipeline Trace Core | Normalize caller-supplied stage metadata without executing domain logic. | V1 complete, standalone | `src/pipeline-trace/` | Public API, validation, order, deduplication, durations, immutability, and determinism are covered by 13 tests. |
| Examples and package exports | Demonstrate supported execution and make each module addressable through public subpaths. | Complete for current modules | `examples/`, `package.json` | `npm run example` and `npm run example:training` are acceptance commands. |

## 6. Important behavioral decisions

### Intake and safety

- Unknown fields are rejected instead of silently ignored.
- `assessmentDate` is the only trusted date reference for age derivation.
- Age is not accepted as a client-supplied contract field.
- Free medical or sport text is retained for review and never classified by
  inference.
- Confirmed allergies become hard constraints. Unconfirmed allergies are
  excluded provisionally and require coach review.
- High pain at or above the versioned threshold requires medical review without
  diagnosing its cause.
- Status precedence is deterministic:
  `MEDICAL_REVIEW_REQUIRED`, then `BLOCKED`, then
  `COACH_REVIEW_REQUIRED`, then `READY_FOR_DRAFT`.
- A higher-priority status must not erase other useful flags or reasons.

### Training

- Downstream builders consume the upstream decision; they do not recompute
  medical rules or recommended days.
- A provisional zero-day training plan is valid and produces no split or
  sessions.
- Session blueprints define needs, not exercises.
- Exercise selection interprets structured equipment and movement constraints;
  prescription does not silently select another exercise.
- Standard gym availability is deliberately limited to bodyweight, light
  dumbbells, light cable station, and light selectorized machines unless
  equipment is explicitly recorded.
- Preflight determines eligibility for review/approval but does not represent a
  persisted human approval.

### Nutrition

- Each stage consumes the full previous-stage contract and propagates status.
- Catalog foods are structured, versioned, and source-traceable; values are not
  generated by AI.
- Food selection chooses candidates, the portion solver chooses legal grams,
  and the swap engine only considers approved candidates.
- Swaps do not rerun food selection or portion solving and cannot change the
  original meal.
- Nutrition Engine status comes only from Plan Preflight.
- The current Core Global integration is correctly
  `REVIEW_REQUIRED` because fiber tolerance is not satisfied; the facade must
  not upgrade it.

## 7. What remains partial or absent

The domain foundation is strong, but the product is not yet an operating
platform. The most important partial areas are:

- Coach approval is represented only by eligibility booleans, not a workflow.
- Cardio has a specification, but lacks modality requirements and a downstream plan pipeline.
- Training prescription lacks progression and load/autoregulation.
- Nutrition lacks adaptation/calibration, recipes, shopping, broader regional
  catalogs, and longitudinal outcome feedback.
- Pipeline Trace is not integrated automatically into engine facades.
- Scientific references are not yet maintained in a rule-level evidence
  registry.

Entirely missing domains and platform layers include mobility/flexibility,
check-ins, adaptation, progress tracking, runtime plan history, persistence,
auth, payments, dashboards, client applications, notifications,
subscriptions, and the AI assistant.

For an exact, evidence-backed snapshot, see
[CURRENT_STATUS.md](CURRENT_STATUS.md).

## 8. How to continue safely

Before implementation:

1. Read this file and all linked documents.
2. Confirm `develop` is clean and inspect the latest commit.
3. Read the target module’s upstream contracts, public exports, and tests.
4. Confirm the next item in [CURRENT_STATUS.md](CURRENT_STATUS.md) and
   [ROADMAP.md](ROADMAP.md).
5. State the allowed file scope and forbidden adjacent work.

During implementation:

1. Preserve deterministic behavior and backward compatibility.
2. Add domain contracts/enums before orchestration.
3. Keep UI, API, database, and AI concerns outside domain engines.
4. Record reason/constraint/issue codes rather than hiding decisions.
5. Add tests and evidence traceability with every scientific rule.
6. Run the repository acceptance commands before committing.

The next recommended domain task is **Cardio Prescription V1**. It must
translate modality requirements into specific, evidence-backed concrete cardio prescriptions
without scheduling them into a weekly calendar yet. Its exact scope is defined in
[ROADMAP.md](ROADMAP.md).
