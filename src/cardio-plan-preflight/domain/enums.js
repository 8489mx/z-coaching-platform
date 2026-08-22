export const CARDIO_PLAN_PREFLIGHT_VERSION = "cardio-plan-preflight-v1";

export const CardioPreflightResult = Object.freeze({
  PASSED: "PASSED",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  WITHHELD: "WITHHELD",
});

export const CardioPreflightIssueSeverity = Object.freeze({
  BLOCKING: "BLOCKING",
  REVIEW: "REVIEW",
});

export const CardioPreflightIssueCode = Object.freeze({
  PLAN_WITHHELD: "PLAN_WITHHELD",
  UPSTREAM_REVIEW_REQUIRED: "UPSTREAM_REVIEW_REQUIRED",
  HIGH_SPORT_DAY_REQUIRES_REVIEW: "HIGH_SPORT_DAY_REQUIRES_REVIEW",
});
