# Z Coaching Platform — Roadmap

The roadmap is ordered. A later phase must not pull UI, database, or AI concerns
into unfinished domain work. Exact current facts and test totals live in
[CURRENT_STATUS.md](CURRENT_STATUS.md).

## Roadmap rules

- Complete and stabilize one bounded domain contract at a time.
- Preserve backward compatibility unless a versioned migration is approved.
- Do not start a downstream module before its upstream contract is stable.
- Every scientific rule requires evidence traceability.
- Every module requires contracts, deterministic logic, public exports, tests,
  and documentation.
- “Complete” below means domain V1, not an immutable final policy.

## Phase 1 — Domain Intelligence

### Completed foundations

- Intake Decision Engine V1.
- Embedded safety evaluation and medical/coach escalation.
- Training Engine V1 from plan specification through preflight.
- Nutrition Engine V1 from intake through preflight.
- Structured exercise and food catalogs.
- Pipeline Trace Core V1 as a standalone metadata contract.
- Cardio Plan Specification V1.
- Cardio Session/Modality Requirements V1.

### Next task: Cardio Prescription V1

This is the exact next implementation task.

Purpose: Translate modality requirements into specific, evidence-backed concrete cardio prescriptions (e.g., prescribing exact duration, intensity, or zones) before scheduling them into the week.

Minimum scope:

1. Create a standalone domain module (`src/cardio-prescription/`).
2. Consume the `CardioModalityRequirements` and generate concrete session building blocks.
3. Define safe lower and upper dose boundaries (e.g., minimum effective dose for LISS).
4. Preserve upstream reasons and constraints.
5. Provide tests for standard scenarios and blocked paths.

Definition of done:

- Contracts reject invalid and mismatched upstream data.
- Ready, review-required, and blocked/withheld paths are tested.
- All existing tests and acceptance commands pass.

### Remaining Cardio Engine sequence

After the prescription is approved, proceed through separately scoped tasks:

1. Weekly cardio scheduling coordinated with training and additional sports.
2. Cardio preflight.
3. Cardio Engine facade.

Do not collapse these into one broad change.

### Mobility/Flexibility Engine

Future ordered work:

1. Define mobility goals and structured movement limitations.
2. Create a verified movement/intervention catalog.
3. Build deterministic session blueprints and selection.
4. Add dose and scheduling policies with evidence.
5. Add preflight and facade.

This engine must not diagnose pain or silently treat medical constraints.

### Check-in Engine

Future responsibilities:

- Structured adherence, recovery, sleep, soreness, pain, symptoms, hunger,
  performance, and client feedback.
- Validation and escalation before adaptation.
- Separation of measured values from subjective reports.
- Versioned issues, reasons, and review state.

### Adaptation Engine

Future responsibilities:

- Consume approved plan version plus validated check-in history.
- Propose deterministic bounded changes.
- Explain the trigger, evidence, limit, and expected effect.
- Withhold adaptation when safety, data quality, or review requirements block
  it.
- Never overwrite the previous plan.

Training and nutrition adaptation policies should be separate modules under a
shared version-history and approval model.

### Progress Tracking

Future responsibilities:

- Versioned measurements and outcomes.
- Trend calculations with explicit windows and units.
- Adherence and performance history.
- Data-quality flags.
- Coach-facing summaries that distinguish observation from inference.

## Phase 2 — Platform

Begin only after the required domain contracts and approval model are stable.

### Persistence and versioned plan history

- Database schema for organizations, users, clients, consents, assessments,
  inputs, outputs, plans, approvals, and check-ins.
- Immutable plan versions and explicit supersession.
- Audit log of actor, action, source version, and reason.
- Migration and backup policy.

### Identity, authorization, and profiles

- Authentication and session management.
- Coach, client, and administrator roles.
- Tenant isolation and least-privilege authorization.
- Client and coach profiles.
- Sensitive health-data access controls.

### Approval workflow

- Submit, approve, reject, request information, and medically clear states.
- Actor identity, comments, timestamps, and source versions.
- Locking of approved artifacts.
- No client delivery without authorization.

### Coach and admin dashboard

- Intake and safety review queue.
- Draft plan inspection and approval.
- Check-in and adaptation queue.
- Progress and adherence views.
- Catalog, policy, organization, and audit administration.

### Client applications

- Guided structured intake.
- Approved plan delivery.
- Exercise and meal presentation.
- Check-ins, measurements, adherence, and messaging.
- Safety and escalation messaging defined by policy.

### Operations

- Payments and subscriptions.
- Notifications and reminders.
- Background jobs.
- Monitoring, error reporting, CI/CD, environment separation, and incident
  response.

## Phase 3 — AI Assistant

AI is introduced after authoritative domain outputs, permissions, audit, and
approval exist.

### Provider abstraction

- A replaceable provider interface.
- Model/version recording.
- Prompt and response audit metadata.
- Timeouts, cost controls, redaction, and fallback behavior.
- No provider-specific logic in domain engines.

### Coach assistant

Permitted capabilities:

- Summarize intake flags, reasons, constraints, and plan differences.
- Explain deterministic outputs with citations.
- Search approved internal evidence.
- Draft questions and client communication.
- Help navigate queues and documentation.

### Client assistant

Permitted capabilities:

- Explain the approved plan in accessible language.
- Answer questions from approved plan/evidence context.
- Help record structured feedback.
- Escalate uncertainty or safety reports to the coach.

### AI release gates

- AI cannot change an authoritative plan.
- Suggested structured changes must be revalidated by deterministic engines.
- No direct client delivery of an unapproved generated plan.
- Permissions, provenance, prompt-injection defenses, and monitoring are
  mandatory.

See [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md).
