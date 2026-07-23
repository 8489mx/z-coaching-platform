# Z Coaching Platform — Development Rules

These rules apply to every future task unless an explicit, reviewed
architecture decision changes them.

## 1. Source of truth

1. Deterministic domain code is authoritative.
2. Structured contracts define accepted inputs and outputs.
3. Tests define protected behavior but do not replace product and scientific
   intent.
4. `PROJECT_MEMORY.md` explains the project; `CURRENT_STATUS.md` records the
   current repository state; `ROADMAP.md` defines the approved order of work.
5. README or conversation text must not override current code and contracts
   when they are stale. Resolve the mismatch and update documentation.

## 2. Domain-first architecture

- Put coaching logic in small domain modules under `src/`.
- Give each module one bounded responsibility.
- Define enums and contracts before orchestration.
- Use public APIs between modules.
- Keep facades thin; they sequence stages and map owned output fields only.
- Never copy upstream business rules into a downstream module.
- Never read raw intake when the module is specified to consume an upstream
  decision.
- Do not mix UI, API, database, payments, notifications, or provider code into
  domain engines.

## 3. Determinism

- The same versioned input must produce the same output.
- No device-current date, randomness, implicit locale, mutable global state, or
  hidden remote lookup may influence a domain decision.
- Trusted dates and contexts must be explicit inputs.
- Catalog order must not affect results unless order is explicitly part of the
  contract.
- Numeric search spaces, tie-breakers, rounding, and tolerances must be
  explicit and tested.

## 4. Rule design

Every material rule must define:

1. Purpose.
2. Inputs and units.
3. Output or status effect.
4. Reason, constraint, or issue code.
5. Limits and exceptions.
6. Priority relative to other rules.
7. Scientific or product-policy source.
8. Version and effective date.
9. Tests for normal, boundary, escalation, and interaction behavior.

Do not introduce a threshold because it “looks reasonable.” If evidence is
insufficient, preserve the value for coach review or withhold the decision.

## 5. Safety and health data

- Do not diagnose.
- Do not infer structured medical meaning from free text.
- Retain original text and its path for review when the contract requires it.
- Preserve all relevant flags and reasons even when a higher-priority status
  wins.
- Medical escalation rules outrank automated draft readiness.
- Unknown data must not be treated as safe data.
- A rule may narrow automation; it may not manufacture clinical clearance.

## 6. Contracts and compatibility

- Reject unknown fields where the contract is closed.
- Validate enum membership, range, presence, mutual exclusivity, and
  cross-stage identity.
- Preserve field names and semantics within a version.
- Backward-incompatible changes require a new contract/version or an explicit
  migration plan.
- Do not silently coerce invalid data into a valid domain state.
- Allow valid upstream states even when they are inconvenient downstream—for
  example a provisional zero-day training decision.

## 7. Status and review semantics

- Status priority belongs to the module that defines it.
- A facade must not independently upgrade or downgrade a stage.
- “Ready for coach review” and “can approve” are eligibility signals, not proof
  of human approval.
- Withheld outputs must not contain a disguised usable plan.
- Review-required output must retain the exact issues, constraints, and reasons
  the reviewer needs.

## 8. Immutability and data ownership

- Do not mutate or freeze caller inputs.
- When a contract promises immutable output, return independent deeply frozen
  data.
- Copy constraints/reasons by value when required.
- Do not expose hidden mutable references from catalogs or internal constants.
- Tests must verify both input preservation and output immutability.

## 9. Testing policy

Every module requires:

- Public API and version tests.
- Contract validation tests.
- Status propagation tests.
- Boundary and tie-breaker tests.
- Determinism and immutability tests.
- Integration tests with the real upstream contract where practical.
- Regression tests for every fixed defect.

Rules:

- Do not modify tests merely to hide a failure.
- Do not weaken directory or data checks in a way that permits build artifacts
  or secrets.
- Run the repository acceptance commands relevant to the scope.
- Coverage is a diagnostic, not permission to omit behavioral assertions.

## 10. Scientific references

- Follow [SCIENTIFIC_POLICY.md](SCIENTIFIC_POLICY.md).
- New scientific rules require an evidence record in the same change.
- Record the actual source; never invent or let AI fabricate a citation.
- Distinguish scientific evidence from a conservative product policy.
- Preserve source identifiers for catalog data.

## 11. AI rules

- AI cannot replace deterministic logic.
- AI cannot write authoritative medical, training, nutrition, cardio, or
  adaptation decisions.
- AI cannot interpret free text into an unreviewed clinical fact.
- AI output is untrusted until bounded, authorized, and—when structured
  action is proposed—revalidated.
- Domain modules must not import AI SDKs.

See [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md).

## 12. Repository and change discipline

- Start from a clean, updated branch required by the task.
- Inspect existing contracts, exports, tests, and history before coding.
- Respect the task’s allowed-file list.
- Do not perform opportunistic refactors or start the next roadmap item.
- Do not add dependencies without a demonstrated need.
- Never force-push, erase history, commit secrets, or commit generated temporary
  artifacts.
- Keep one coherent purpose per commit with a precise message.
- Update project memory when architecture, status, roadmap, evidence policy, or
  a major milestone changes.

## 13. Completion checklist

Before declaring a task complete:

- [ ] Scope matches the approved roadmap item.
- [ ] No adjacent feature or architecture redesign was introduced.
- [ ] Contracts and public exports are minimal and versioned.
- [ ] Logic is deterministic and domain-owned.
- [ ] Reasons, constraints, issues, and status are preserved.
- [ ] Scientific rules have traceable sources.
- [ ] Inputs remain unmodified and output immutability matches the contract.
- [ ] Unit, boundary, regression, and integration tests pass.
- [ ] Required examples/checks pass.
- [ ] Documentation and current status are accurate.
- [ ] Git diff contains only intended files and no secrets/artifacts.
