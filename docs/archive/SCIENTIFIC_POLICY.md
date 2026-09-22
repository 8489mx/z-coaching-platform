# Z Coaching Platform — Scientific Policy

## 1. Purpose

Z Coaching Platform uses scientific evidence to define deterministic coaching
policies. This document governs how evidence is selected, recorded, reviewed,
and translated into code.

Scientific evidence does not remove professional judgment, and the platform
does not diagnose or replace medical care.

## 2. Evidence hierarchy

Use the strongest directly applicable evidence available:

1. **Authoritative clinical or public-health guidelines** from recognized
   bodies, when the population and decision match.
2. **Professional position stands or consensus statements** with transparent
   methodology.
3. **Systematic reviews and meta-analyses** of relevant interventions.
4. **Controlled trials** when higher-level synthesis is absent or a specific
   question requires it.
5. **High-quality observational evidence** for questions not suited to trials.
6. **Expert practice and conservative product policy** only when evidence is
   incomplete, explicitly labeled as such.

Evidence rank alone is insufficient. Applicability, recency, population,
outcomes, limitations, and conflicts must be assessed.

## 3. Translation from evidence to a rule

Before coding a scientific rule, document:

- Rule identifier and domain.
- Decision the rule supports.
- Population and exclusions.
- Inputs, outputs, units, and time window.
- Threshold/formula/range.
- Source type and complete citation.
- Exact section, table, equation, or page where possible.
- Interpretation from evidence to implementation.
- Uncertainty and material limitations.
- Safety exceptions and escalation path.
- Product-policy choices that are not direct scientific conclusions.
- Policy version, effective date, and reviewer.

If the evidence cannot justify a precise automated choice, use review or
withheld behavior instead of false precision.

## 4. Required evidence record

Future scientific rules should be traceable through a versioned evidence record
with at least:

```text
rule_code
policy_version
domain
source_type
full_citation
source_identifier_or_url
accessed_or_published_date
applicable_population
rule_summary
implementation_location
assumptions
exceptions
review_status
reviewed_by
next_review_date
```

The evidence record should live in a dedicated repository location when the
first post-documentation scientific rule is added. Do not place provider
generated summaries in place of the source.

## 5. Catalog data provenance

Food and exercise metadata require source traceability appropriate to the
field.

For nutrition foods:

- All contracted nutrient values for a record come from one approved source
  record.
- Preserve the external record identifier, data type, description, nutrient
  identifiers, and source reference.
- Do not mix nutrient values from multiple records.
- Preparation must match food identity.
- Material oil, butter, sugar, sauce, or combination-food changes require a
  different appropriate record.

The current Core Global catalog uses USDA FoodData Central identifiers and
metadata. This is data provenance, distinct from evidence for macro or energy
policy.

## 6. Medical and safety policy

- Safety rules route and constrain; they do not diagnose.
- A medical-review threshold must have a documented source or be explicitly
  identified as a conservative operational policy.
- Free text is not evidence of a structured condition.
- Uncertainty must not be converted into automatic clearance.
- Rules should identify when professional or medical review is required.

## 7. Versioning and review

- Scientific policies are versioned independently of application releases.
- A source update does not silently change an existing approved plan.
- Material rule changes require regression tests and a changelog entry.
- Review policies on a defined cadence and when authoritative guidance changes.
- Retain superseded policy and evidence versions for plan-history
  reproducibility.
- Record conflicts of interest and funding limitations when material.

## 8. Current repository evidence state

Known explicit provenance currently includes:

- Nutrition Energy Target names NASEM DRI 2023 adult EER as its policy basis.
- The Core Global food catalog retains USDA FoodData Central record-level
  provenance.

The repository does not yet contain a complete bibliography or rule-level
evidence registry. Numeric policies that require formal traceability include,
among others:

- Protein, fat, carbohydrate, fiber, and calorie adjustment policies.
- BMI/calculation-weight caps and physical-activity thresholds.
- Training volume, repetitions, rest, and prescription mappings.
- Cardio thresholds and limits.
- Pain and safety routing thresholds.
- Meal-pattern mappings, tolerances, and optimization weights.

These are documentation debts, not permission to rewrite working rules without
a separately scoped review.

## 9. AI and scientific evidence

AI may help locate candidate sources or summarize an already approved source,
but:

- A human must verify the primary source.
- The repository must store the real citation and interpretation.
- AI must not invent citations.
- AI-generated evidence summaries cannot become policy automatically.
- Any resulting rule still requires deterministic implementation and tests.

## 10. Scientific change checklist

- [ ] The decision requires a scientific rule rather than a product-only rule.
- [ ] The strongest applicable evidence was reviewed.
- [ ] Population, units, limits, and exceptions are explicit.
- [ ] A complete evidence record exists.
- [ ] Safety and uncertainty behavior are defined.
- [ ] Code reason/constraint/issue codes expose the decision.
- [ ] Boundary and interaction tests exist.
- [ ] Backward compatibility and plan-history impact were assessed.
- [ ] Documentation and changelog were updated.
