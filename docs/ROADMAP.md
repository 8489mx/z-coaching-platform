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

### Next task: Cardio Plan Specification V1

This is the exact next implementation task.

Purpose: transform the existing
`intakeDecision.cardio_decision` into a versioned downstream specification
without recalculating intake safety or inventing a complete cardio program.

Minimum scope:

1. Create a standalone domain module with contracts, enums, builder, public
   export, and tests.
2. Consume the existing cardio decision only through its documented output.
3. Preserve upstream status, constraints, reasons, safety limits, and
   additional-sport context.
4. Produce `WITHHELD` when upstream status prohibits planning.
5. Treat existing maximum values as limits, not automatically as prescribed
   doses.
6. Do not introduce modality, frequency, intensity, or progression rules until
   their evidence and exceptions are explicitly approved.
7. Add rule-level scientific references for every new numeric or clinical
   policy.
8. Do not add API, database, UI, AI, check-in, or adaptation behavior.

Definition of done:

- Public API is minimal and versioned.
- Contracts reject invalid and mismatched upstream data.
- Ready, coach-review, medical-review, and blocked/withheld paths are tested.
- Inputs remain unmodified; deterministic output is independently immutable.
- All existing tests and acceptance commands pass.

### Remaining Cardio Engine sequence

After the specification is approved, proceed through separately scoped tasks:

1. Cardio session blueprint or modality requirements.
2. Cardio prescription with evidence-backed dose boundaries.
3. Weekly cardio scheduling coordinated with training and additional sports.
4. Cardio preflight.
5. Cardio Engine facade.

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
