# Z Coaching Platform — Product Vision

## 1. Vision

Z Coaching Platform is an evidence-based coaching operating system that helps a
qualified coach safely assess clients, generate deterministic draft plans,
review decisions, deliver approved coaching, and adapt that coaching over time.

The system should make good coaching repeatable and auditable without removing
human accountability. It should reduce manual work, surface risks, and explain
why a plan was produced.

## 2. Product principles

1. **Safety before automation.** Unsafe or uncertain inputs are escalated, not
   guessed.
2. **Deterministic intelligence.** The same versioned inputs and policies
   produce the same outputs.
3. **Coach accountability.** The system prepares and validates; the coach
   reviews and approves.
4. **Scientific traceability.** Material rules identify their evidence,
   assumptions, exceptions, and version.
5. **Client clarity.** Approved outputs should be explainable in accessible
   language.
6. **Longitudinal care.** Plans, check-ins, changes, and outcomes form a
   versioned history.
7. **AI is assistive.** AI improves navigation and communication but is never
   the source of medical, training, or nutrition truth.

## 3. Target users

### Client

- Completes structured intake and assessment.
- Receives only reviewed and approved plans.
- Records adherence, feedback, measurements, symptoms, and check-ins.
- Understands the plan and when to contact the coach or a clinician.

### Coach

- Reviews safety flags, constraints, reasons, and draft plans.
- Approves, rejects, or requests clarification with an audit trail.
- Monitors adherence and progress.
- Applies deterministic adaptations with professional judgment.
- Uses an assistant for summaries and communication, never hidden decisions.

### Administrator

- Manages organizations, coaches, permissions, policies, catalogs, evidence
  versions, and operational configuration.
- Audits changes and access.

## 4. Intended client journey

```text
Discover service
  -> Purchase or subscribe
  -> Create account and consent
  -> Complete structured intake
  -> Complete assessment
  -> Receive deterministic safety and planning evaluation
  -> Coach reviews and approves
  -> Approved plan is delivered
  -> Client follows plan and checks in weekly
  -> Deterministic adaptation proposal is reviewed
  -> Plan history and progress accumulate over time
```

### Acquisition and account

The future platform will support acquisition, payment, account creation,
consent, identity, access, and subscription management. These are platform
concerns, not domain-engine concerns.

### Intake and assessment

Structured inputs are preferred. Unknown or free-text health information is
retained and routed for human review. Trusted assessment context—such as the
assessment date—must be explicit and reproducible.

### Planning and review

Domain engines produce status, constraints, reasons, issues, targets, and draft
plans. Preflight validates internal consistency. A qualified coach remains
responsible for approval and release.

### Delivery and adaptation

Clients receive versioned approved plans. Check-ins and measured outcomes feed
future deterministic check-in and adaptation engines. Historical plans are
never overwritten.

## 5. Product capability map

| Capability | Intended outcome | Current state |
|---|---|---|
| Intake and safety | Structured, auditable eligibility and escalation | Domain V1 complete |
| Training planning | Deterministic draft training plan | Domain V1 complete |
| Nutrition planning | Deterministic targets, meals, foods, grams, swaps, preflight | Domain V1 complete |
| Cardio planning | Safe modality, dose, schedule, and preflight | Intake decision only |
| Mobility/flexibility | Goal- and constraint-aware mobility planning | Missing |
| Coach approval | Accountable release gate with audit trail | Eligibility foundation only |
| Check-ins | Structured adherence, recovery, symptoms, and outcome capture | Missing |
| Adaptation | Versioned deterministic changes based on check-ins | Missing |
| Progress tracking | Longitudinal metrics and trend interpretation | Missing |
| Plan history | Immutable approved versions and change reasons | Missing |
| Coach/admin dashboard | Review and operations surfaces | Missing |
| Client applications | Intake, plan delivery, check-ins, communication | Missing |
| AI assistant | Bounded explanation, search, and communication support | Missing by design |

## 6. Success criteria

The product succeeds when:

- Safety escalations are never silently lost.
- Every generated plan can be traced to input, policy version, reasons, and
  evidence.
- Coaches spend less time assembling routine plans and more time reviewing,
  communicating, and applying judgment.
- Clients receive consistent, comprehensible, approved coaching.
- Adaptations are explainable and preserve historical context.
- No AI output can bypass deterministic validation or human authorization.

## 7. Explicit non-goals

- Replacing clinicians or diagnosing disease.
- Autonomous release of training or nutrition plans.
- Generating scientific policy from unverified model output.
- Mixing business logic into mobile, dashboard, API, or database layers.
- Treating a language model as the authoritative coaching engine.

Current implementation facts live in [CURRENT_STATUS.md](CURRENT_STATUS.md);
the delivery sequence lives in [ROADMAP.md](ROADMAP.md).
