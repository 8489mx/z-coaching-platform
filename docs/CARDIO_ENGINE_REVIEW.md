# Z Coaching Platform — Cardio Engine Specification V1 Review

| Field | Value |
|---|---|
| Review date | 2026-07-23 |
| Specification reviewed | [CARDIO_ENGINE_SPEC.md](CARDIO_ENGINE_SPEC.md) |
| Initial specification commit | `6562ba6a275ea68fb1a8bf47fe5403b33323991e` |
| Review type | Formal architecture, domain-boundary, deterministic-rule, scientific-policy, and implementation-readiness review |
| Initial result | `NEEDS_REVISION` |
| Final result after documentation corrections | `APPROVED_FOR_IMPLEMENTATION` |
| Approved implementation scope | Cardio Plan Specification V1 only |
| Code implementation performed | None |

## 1. Final Review Result

**Implementation readiness status: `APPROVED_FOR_IMPLEMENTATION`.**

The reviewed architecture is consistent with the repository's domain-first
model after the documentation corrections recorded in this review. Cardio Plan
Specification V1 can be implemented without re-deciding Intake or Safety
rules, inventing scientific dose, or redesigning the current architecture.

Approval is deliberately narrow:

- Implementation may start for `src/cardio-plan-specification/` as defined in
  section 6.1 of the specification.
- Modality selection, frequency, duration, operational intensity, scheduling,
  progression, regression, preflight, and the complete Cardio Engine facade
  remain outside the approved implementation scope.
- The later stages remain blocked by their exact contracts, a verified Cardio
  Activity Catalog, and approved scientific evidence records.

The initial review found material documentation gaps. They were corrected in
`CARDIO_ENGINE_SPEC.md` before this final approval. No production code, tests,
package configuration, or existing engine was changed.

## 2. Review Basis

The specification was reviewed against:

- [PROJECT_MEMORY.md](PROJECT_MEMORY.md)
- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)
- [SCIENTIFIC_POLICY.md](SCIENTIFIC_POLICY.md)

The comparison also inspected the current public contracts, builders, exports,
and tests for:

- Intake Decision Engine and its embedded Safety and Cardio rules.
- Training Plan Specification and Training Engine.
- Nutrition Engine and Nutrition Plan Preflight.

## 3. Architecture Consistency

| Check | Result | Review finding |
|---|---|---|
| Domain-first module design | Approved | The specification separates contracts, construction stages, scheduling, preflight, and facade responsibilities. |
| Existing-decision consumption | Approved | Plan Specification consumes the authoritative Intake status and Cardio decision; it does not read raw Intake to recompute need. |
| Intake logic duplication | None found | Step, lifestyle, goal, sport-load, capacity, and cardio-need ordering remain owned by Intake. |
| Safety logic duplication | None found | Cardio preserves status, constraints, and review context without diagnosing or adding condition-specific gates. |
| Training integration | Approved | Training output is read-only scheduling context; Cardio cannot change resistance days, split, exercises, or prescription. |
| Nutrition integration | Approved after correction | Future completed-workload data is routed through Application/Adaptation orchestration rather than a direct Cardio-to-Nutrition engine dependency. |
| Status ownership | Approved after correction | A Training-only review cannot lower Cardio status. Only a concrete Cardio-owned coordination issue may do so. |
| Lineage claims | Approved after correction | Cross-stage identity is validated only when public contracts expose matching fields; current Intake/Training pairing remains an orchestrator responsibility. |
| Facade behavior | Approved | The eventual facade calls public stage APIs, retains stage outputs, and copies final status only from Cardio Preflight. |
| AI authority | None | AI is restricted to explanation of bounded deterministic output and has no decision path. |

The result follows the repository dependency rule:

```text
Intake Decision
  -> Cardio Plan Specification
  -> separately versioned Cardio stages
  -> Cardio Preflight
  -> thin Cardio Engine facade
  -> future coach-review workflow

AI assistant
  -> may explain approved structured output
  -> cannot create or change the output
```

## 4. Domain Boundary Review

| Domain | Owned responsibility | Explicitly outside its responsibility |
|---|---|---|
| Intake Decision Engine | Decide Cardio strategy, capacity ceilings, inherited start-intensity label, status, constraints, and reasons | Build an executable Cardio plan |
| Embedded Safety layer | Medical/safety escalation, dangerous symptoms, pain, restrictions, and review priority | Select Cardio modality, dose, or schedule |
| Cardio Plan Specification | Map status, represent formal-session state, retain capacity as limits, and copy Cardio findings and review context | Recompute need, choose modality, prescribe dose, or resolve review |
| Later Cardio stages | Apply separately approved modality, prescription, coordination, and preflight policies | Interpret raw medical/free text or alter another engine |
| Training Engine | Resistance plan and weekly resistance schedule | Lower Cardio readiness for an unrelated Training issue |
| Nutrition Engine | Energy, macro, meal, food, portion, swap, and Nutrition preflight decisions | Convert planned Cardio into automatic calorie changes |
| Future Adaptation Engine | Decide longitudinal hold/progress/regress/supersede actions from validated execution and check-in data | Be replaced by an initial Cardio prescription builder |
| Application/Approval layer | Pair source artifacts, persist lineage, present cross-domain statuses, and record human approval | Contain or rewrite Cardio business rules |
| AI assistant | Summarize and explain approved structured records | Diagnose, prescribe, schedule, clear, or override |

No remaining responsibility leakage blocks Cardio Plan Specification V1.

Two distinctions are especially important:

1. A prospective progression/regression protocol may later be metadata on an
   approved Cardio prescription. Applying a longitudinal plan change remains an
   Adaptation Engine decision.
2. Cardio may apply an exact structured restriction to catalog metadata. It
   may not infer that an injury area, condition name, medication, or free text
   makes a modality unsafe.

## 5. Deterministic Rule Review

The immediate executable design is deterministic and testable because it
defines:

- One public builder input and one closed output contract.
- Exact public enums and version.
- An exhaustive mapping from all four Intake statuses.
- An exhaustive mapping from all four current Cardio strategies.
- Explicit valid combinations for strategy, limits, and inherited intensity.
- Closed constraint, reason, review-flag, decision-reason, and data-issue
  records.
- JSON-compatible value rules for copied constraint payloads.
- Exact order and duplicate preservation.
- Input non-mutation/non-freezing and independent deep-frozen output.
- Explicit negative space: no sessions, dose, modality, weekday, progression,
  or step target.

No executable rule depends on AI, randomness, device time, hidden network
state, catalog iteration accident, or free-text interpretation.

Terms such as poor recovery, excess fatigue, plateau, LISS, MISS, HIIT, and
conditioning do not create vague executable behavior. The specification marks
them as future concepts and blocks them until a typed contract, operational
definition, evidence record, reason/issue code, and boundary tests exist.

## 6. Scientific Policy Compliance

### 6.1 Immediate Plan Specification

Cardio Plan Specification V1 adds no scientific prescription rule. Its
executable behavior is contract and product-policy behavior:

- Preserve an upstream status.
- Preserve upstream capacity as a ceiling.
- Copy structured findings and review context.
- Return no executable session when withheld or unresolved.
- Validate, clone, freeze, and version the result.

The example values `2` sessions and `30` minutes are identified as existing
client capacity values, not recommended dose. No new scientific evidence
record is required for this pass-through stage.

### 6.2 Later scientific stages

The specification correctly blocks all of the following until evidence is
approved:

- Initial frequency and duration.
- Weekly dose.
- Operational low/moderate/high intensity methods.
- LISS/MISS or modality selection.
- Interval and HIIT protocols.
- Concurrent-training order, spacing, and load rules.
- Progression, regression, recovery, and adaptation rules.

Intensity is modeled as separate format, band, method, target/unit, modality,
intent, protocol, and mechanical-demand axes. This avoids treating LISS, MISS,
HIIT, intervals, and conditioning as interchangeable labels.

The corrected specification now also requires every scientific stage to expose:

- An independently versioned Cardio policy.
- Applied rule codes.
- Stable applied evidence-record identifiers.
- The evidence-translation fields required by `SCIENTIFIC_POLICY.md`, including
  decision supported, effective date, interpretation, uncertainty, product
  policy choices, and safety escalation.

The existing Intake Cardio thresholds remain inherited scientific-traceability
debt. This specification neither re-approves nor duplicates them.

## 7. Comparison With Existing Engines

| Concern | Training V1 | Nutrition V1 | Reviewed Cardio design |
|---|---|---|---|
| First downstream stage | Training Plan Specification consumes an Intake Decision | Planning Snapshot begins a ten-stage facade flow | Cardio Plan Specification consumes an Intake Decision |
| Stage ownership | Split, blueprint, selection, prescription, schedule, preflight | Snapshot, energy, macros, meals, food, portions, swaps, preflight | Specification, requirements, selection, prescription, schedule, preflight |
| Facade | Composes draft, weekly schedule, and preflight | Calls ten public APIs and retains all stage outputs | Future thin facade calls public Cardio stages and retains complete outputs |
| Final status | Preflight report is authoritative | Preflight status is copied by the facade | Cardio Preflight alone will own final facade status |
| Validation | Training V1 has some defensive-validation and immutability debt | Strong object-shell, cross-stage, version, and contract validation | Closed owned records, explicit invariants, and exposed-field identity checks |
| Immutability | Some stages retain caller references and are not deeply frozen | Independent deeply frozen outputs | Uses the stronger Nutrition pattern: clone by value and deep freeze |
| Review semantics | Provisional/withheld construction states; approval eligibility is not approval | Review/withheld states; readiness is not approval | Same distinction is explicit |
| Auditability | Final weekly plan plus preflight | Complete stage outputs and source versions | Complete stage outputs, policy versions, rule codes, evidence links, and upstream review context |
| Testing | Public API, status, mapping, integration | Public API, validation, propagation, determinism, immutability, full integration | Requires all of those plus negative-space and no-cross-domain-status-leakage tests |

The deliberate use of stronger immutability and validation than early Training
modules is compatible with the architecture; it avoids repeating known
technical debt and does not break an existing Cardio contract.

## 8. Required Changes Found and Resolution

The initial result was `NEEDS_REVISION` for the following reasons.

### 8.1 Upstream review cause was not retained

Problem:

- A global coach, medical, or blocking status could be mapped to Cardio while
  only generic Cardio reasons survived.
- Exact upstream review codes and source paths were absent from the Cardio
  artifact.

Resolution:

- Plan Specification now copies `review_flags`, `decision_reasons`, and
  `missing_or_uncertain_data` into `source_review_context`.
- These records are never interpreted, filtered, sorted, or deduplicated.
- The future facade must retain the complete Plan Specification stage.

### 8.2 Copied record validation was underspecified

Problem:

- “Valid structured record” did not define exact keys, plain-object rules,
  non-empty fields, JSON compatibility, or duplicate behavior.

Resolution:

- The specification now defines closed record shapes and recursive
  JSON-compatible values.
- It requires rejection of unknown fields, cycles, sparse arrays, non-finite
  numbers, functions, symbols, `bigint`, class instances, and malformed text.
- Required tests now cover these boundaries.

### 8.3 Cross-artifact identity was impossible to prove

Problem:

- The specification required cross-stage identity validation even though
  current Intake and Training outputs expose no shared client/intake/plan
  identity.

Resolution:

- Validation is limited to identity and version fields actually exposed.
- Application/API orchestration owns pairing and persistence until a versioned
  lineage contract exists.
- Cardio must not invent a fingerprint or claim unprovable identity.

### 8.4 Training review leaked into Cardio status

Problem:

- A Training-only review could make Cardio “at least provisional” despite no
  Cardio conflict.

Resolution:

- An unrelated Training review no longer changes Cardio status.
- Only a concrete structured Cardio scheduling conflict may lower Cardio
  readiness, with a Cardio-owned issue.
- Cross-domain approval orchestration presents both statuses independently.

### 8.5 Scientific runtime traceability was incomplete

Problem:

- Module versions and rule codes alone could not reproduce the scientific
  policy and evidence used.

Resolution:

- Later scientific stages must expose policy versions, rule codes, and stable
  evidence-record identifiers.
- The required evidence record now includes the complete translation fields
  from `SCIENTIFIC_POLICY.md`.

No further change to the specification is required before Cardio Plan
Specification V1 implementation.

## 9. Remaining Risks and Gates

These do not block the approved first stage:

1. **No Intake runtime version.** Plan Specification must not invent one. A
   later backward-compatible lineage task is needed for stronger provenance.
2. **No Cardio Activity Catalog.** Modality and mechanical-demand selection
   cannot start until a versioned, verified catalog contract exists.
3. **No Cardio-specific preference/access profile.** Modality access,
   equipment, preferred/disliked modalities, preferred days, and
   Cardio-specific experience cannot be inferred from current fields.
4. **No approved scientific Cardio policy records.** Formal dose, intensity,
   modality, concurrency, and adaptation remain non-executable.
5. **Repeated constraint codes have no source ID.** A future Modality Selection
   contract must reference the exact source record deterministically, for
   example by preserved source sequence plus copied record. Code alone is not
   sufficient.
6. **Current Training outputs are mutable.** Cardio Scheduling must treat them
   as caller-owned, must not freeze them, and must clone retained values.
7. **Exact later-stage contracts remain to be specified.** Blueprint,
   selection, prescription, schedule, preflight, and facade concepts are
   architecturally placed but not authorized for coding.
8. **Repository scripts enumerate modules manually.** A future implementation
   must add the Cardio test and syntax-check paths explicitly so acceptance
   commands cannot omit them.

For a future `src/cardio-engine/`, `domain/contracts.js`,
`domain/enums.js`, builders, and tests can follow the Nutrition facade pattern.
Any `rules/` or `builders/` directory inside that facade must coordinate public
stage APIs rather than duplicate rules owned by separately versioned Cardio
stages. A monolithic Cardio engine would conflict with the approved design.

## 10. Implementation Readiness Decision

### Approved now

Cardio Plan Specification V1:

```text
src/cardio-plan-specification/
  domain/contracts.js
  domain/enums.js
  build-cardio-plan-spec.js
  index.js

test/cardio-plan-specification.test.js
```

This stage has sufficient:

- Input and output contracts.
- Public API and version.
- Status and formal-session-state enums.
- Structural and cross-field validation.
- Status/strategy mappings.
- Review-context preservation.
- Immutability and determinism rules.
- Unit, boundary, negative-space, and integration test requirements.

### Not approved yet

- Cardio Session/Modality Requirements.
- Cardio Activity Catalog.
- Modality Selection.
- Cardio Prescription.
- Weekly Cardio Schedule.
- Cardio Plan Preflight.
- Complete Cardio Engine facade.
- Cardio Adaptation.

Those modules can be added in the documented order without redesigning the
architecture, but each needs its own exact contract and, where scientific
decisions are introduced, verified evidence records.

## 11. Final Checklist

- [x] Domain-first architecture matches the repository.
- [x] Intake Cardio logic is not duplicated.
- [x] Safety logic is not duplicated.
- [x] Existing decisions can be consumed through public contracts.
- [x] Training and Nutrition ownership remains intact.
- [x] Cardio and Adaptation responsibilities are separated.
- [x] Executable rules are deterministic and testable.
- [x] AI is absent from the authoritative decision path.
- [x] Unsupported numeric prescription is prohibited.
- [x] Intensity concepts are structurally separated and evidence-gated.
- [x] Assumptions and missing contracts are explicit.
- [x] Review-required and withheld causes remain attributable.
- [x] Future scientific outputs require policy and evidence linkage.
- [x] Cardio Plan Specification V1 can be implemented without redesign.
- [x] No code implementation was started.

**Final status: `APPROVED_FOR_IMPLEMENTATION`.**

**Implementation can start only with Cardio Plan Specification V1.**
