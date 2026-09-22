# Cardio Session/Modality Requirements V1 Specification

## Overview
The **Cardio Session/Modality Requirements V1** module is the second phase of the Cardio Engine. It consumes the upstream `Cardio Plan Specification` and translates its broad strategy into precise, session-level modality requirements.

**Rule of Thumb**: The upstream *Specification* decides "what is the strategy and max limits?", while this *Requirements* module decides "which specific modalities (LISS, HIIT, Steps) satisfy that strategy and what are their individual duration/intensity boundaries?"

## Contract Boundaries

### Input
- **Upstream Source**: `CardioPlanSpecification` (The frozen output of the previous phase).
- **Other Context**: `WalkingAbility` and `MovementRestrictions` from the intake decision (to safely filter modalities).

### Output
- **Target Entity**: `CardioModalityRequirements`
- **Fields**:
  - `status`: `READY`, `PROVISIONAL_REVIEW_REQUIRED`, or `WITHHELD`
  - `requirements`: An array of approved session modalities. For each modality:
    - `modalityType`: e.g., `LISS`, `HIIT`, `STEPS`.
    - `allowedIntensity`: e.g., `LOW`, `MODERATE`, `HIGH`.
    - `durationBoundary`: Min/Max minutes allowed for this modality.
  - `reasons`: Explanation of why modalities were chosen or excluded.
  - `constraints`: Propagated constraints that must remain intact.

## Core Rules & Invariants
1. **No Scheduling**: Do not schedule these requirements into a weekly calendar. This module only provides the "menu of allowed session types and boundaries".
2. **Strict Limit Enforcement**: The duration boundaries per modality must NEVER exceed the global `max_duration_minutes` set in the upstream specification.
3. **Safety Filtering**: 
   - If `WalkingAbility` is `LIMITED`, modalities requiring extensive lower-body impact (e.g., standard running) must be filtered or flagged for `REVIEW_REQUIRED`.
   - If the upstream status is `WITHHELD`, this module must immediately return `WITHHELD` without calculation.
4. **Scientific Traceability**: Every mapping from strategy to modality (e.g., why `STEPS_ONLY` maps to `STEPS` with `LOW` intensity) must have a referenced scientific rule.

## Acceptance Criteria
1. **Standalone Module**: Exists in `src/cardio-modality-requirements/`.
2. **Immutability**: Does not modify the input specification.
3. **Determinism**: The same specification and constraints always yield the exact same modality list.
4. **Testing**: 100% coverage on ready, review, and withheld paths.
