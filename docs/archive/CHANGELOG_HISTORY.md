# Z Coaching Platform — Changelog History

This file tells the architectural story of the repository. It is not a
replacement for `git log`, and it does not list every test-only correction.
Commit identifiers refer to the `develop` history audited on 2026-07-23.

## 1. Intake Decision Engine V1 foundation

### Baseline and safety corrections

- `d5c55d8` established the approved Intake Decision Engine baseline.
- `1257337` made unconfirmed allergy handling conservative and reviewable.
- `9be035f` represented budget and dislikes as nutrition soft preferences.
- `32c390d` introduced structured training equipment.
- `a3ff192` removed trust in client-supplied age and derived it only from birth
  date plus assessment date.
- `4cb9c1d` restored the 0–120 range validation on derived age.
- `b777612` completed structured additional-sport integration.

During this phase, the architecture settled on:

- Closed contracts and unknown-field rejection.
- Deterministic status priority.
- Structured enums instead of free-text interpretation.
- Retaining unclassified text for coach/medical review.
- Medical escalation without diagnosis.

The `intake-engine-v1` tag identifies the frozen intake milestone.

## 2. Training Engine V1

Training was intentionally built as small downstream stages rather than one
large generator:

- `7ea2b76` added Training Plan Skeleton/Specification V1.
- `0f82753` added Training Session Blueprints V1.
- `fc5cfc7` added the minimal Exercise Catalog.
- `4f4d4df` added deterministic Exercise Selection.
- `8a33a43` added the conservative standard gym equipment profile.
- `c789111` added exercise prescription units.
- `5be763d` added Training Prescription.
- `44405f9` added Training Draft composition.
- `80cf3a2` corrected draft integration behavior.
- `c908e11` added Weekly Training Schedule.
- `b83a106` added Training Plan Preflight.
- `fd28840` added the Training Engine facade.

Architectural decisions:

- Each stage consumes upstream output rather than raw intake.
- Blueprints define movement needs before exercises are selected.
- Selection, prescription, scheduling, and validation remain separate.
- A facade sequences public APIs without duplicating business rules.
- Preflight signals approval eligibility; it does not implement approval.

`6f6cdd9` is the functional Training Engine V1 milestone and is tagged
`training-engine-v1`.

## 3. Nutrition Engine V1

Nutrition followed the same staged domain-first approach:

- `34d1aa4` added Nutrition Planning Snapshot.
- `3424f79` added Nutrition Energy Target.
- `d804fbf` added Nutrition Macro Targets.
- `1fa1e96` added Nutrition Meal Distribution.
- `2387553` added Nutrition Meal Assembly Blueprint.
- `9e2f563` added the Nutrition Food Catalog contract.
- `4926622` added the official Excel catalog tooling.
- `f7bc6ef` added the verified 24-food Core Global batch.
- `fcd89b6` allowed future catalog batches while rejecting temporary artifacts.
- `622edec` added Nutrition Food Selection.
- `26737ae` added Nutrition Portion Solver.
- `501a227` added Nutrition Swap Engine.
- `e4a8eac` added Nutrition Plan Preflight.
- `b83ed22` added the Nutrition Engine facade.

Architectural decisions:

- Energy, macros, distribution, structure, foods, grams, swaps, and preflight
  are different responsibilities.
- Catalog data is structured and source-traceable.
- Food Selection owns eligibility; Portion Solver owns legal grams; Swap Engine
  cannot expand the candidate set.
- The facade retains complete stage outputs and derives final status only from
  preflight.
- The current real integration remains review-required when fiber tolerance is
  not met; the system does not hide the issue.

## 4. Pipeline metadata

- `d19b97b` added Pipeline Trace Core V1.

The trace is deliberately metadata-only and caller-supplied. It preserves stage
order, versions, statuses, issues, reasons, and optional durations without
executing or duplicating domain logic. Automatic facade integration was
explicitly deferred.

## 5. Documentation and project memory milestone

The repository grew through tightly scoped domain tasks faster than its README
could remain authoritative. A full audit at `d19b97b` found:

- 22 public domain/module areas under `src`.
- 27 test files and 808 passing tests.
- Completed Training and Nutrition V1 domain pipelines.
- No platform, approval workflow, longitudinal engines, or AI runtime.
- Strong deterministic boundaries but incomplete scientific reference
  traceability and operational delivery controls.

This documentation milestone creates the permanent project memory, product
vision, architecture, current status, roadmap, development rules, AI boundary,
scientific policy, and milestone history under `docs/`.

## 6. Current milestone and next direction

The current milestone is **Domain Intelligence V1 for Intake, Training, and
Nutrition**, plus a standalone Pipeline Trace contract.

The next approved development task is **Cardio Plan Specification V1**. It
should consume the existing intake cardio decision and begin the downstream
cardio pipeline without recalculating safety or inventing unsupported dose
rules.

See [ROADMAP.md](ROADMAP.md) for the scoped definition of done and
[CURRENT_STATUS.md](CURRENT_STATUS.md) for the live repository baseline.
