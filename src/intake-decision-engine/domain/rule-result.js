import { PlanStatus } from "./enums.js";

const STATUS_PRIORITY = Object.freeze({
  [PlanStatus.READY_FOR_DRAFT]: 0,
  [PlanStatus.COACH_REVIEW_REQUIRED]: 1,
  [PlanStatus.BLOCKED]: 2,
  [PlanStatus.MEDICAL_REVIEW_REQUIRED]: 3,
});

export function emptyRuleResult() {
  return {
    statusCandidates: [],
    hardConstraints: [],
    softPreferences: [],
    reviewFlags: [],
    reasons: [],
    missingOrUncertainData: [],
  };
}

export function mergeRuleResults(results) {
  const merged = emptyRuleResult();
  for (const result of results) {
    merged.statusCandidates.push(...(result.statusCandidates ?? []));
    merged.hardConstraints.push(...(result.hardConstraints ?? []));
    merged.softPreferences.push(...(result.softPreferences ?? []));
    merged.reviewFlags.push(...(result.reviewFlags ?? []));
    merged.reasons.push(...(result.reasons ?? []));
    merged.missingOrUncertainData.push(...(result.missingOrUncertainData ?? []));
  }
  return merged;
}

export function selectPlanStatus(statusCandidates) {
  return statusCandidates.reduce((selected, candidate) => {
    return STATUS_PRIORITY[candidate.status] > STATUS_PRIORITY[selected]
      ? candidate.status
      : selected;
  }, PlanStatus.READY_FOR_DRAFT);
}

export function deduplicateByStableKey(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function constraint(code, scope, value, reason) {
  return { code, scope, value, reason };
}

export function reason(code, scope, message) {
  return { code, scope, message };
}

export function reviewFlag(code, scope, level, message, sourcePath) {
  return { code, scope, level, message, sourcePath };
}

export function statusCandidate(status, code) {
  return { status, code };
}

