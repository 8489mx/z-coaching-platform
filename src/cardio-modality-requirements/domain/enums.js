export const CARDIO_MODALITY_REQUIREMENTS_VERSION = "cardio-modality-requirements-v1";

/**
 * Re-export status values for downstream consumers.
 */
export const CardioModalityRequirementsStatus = Object.freeze({
  READY: "READY",
  PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
  WITHHELD: "WITHHELD",
});

/**
 * Modalities currently supported by the engine.
 * HIIT is excluded in V1 for safety and simplicity.
 */
export const ModalityType = Object.freeze({
  STEPS: "STEPS",
  LISS: "LISS",
});

export const ModalityReasonCode = Object.freeze({
  MODALITY_STEPS_ONLY: "MODALITY_STEPS_ONLY",
  MODALITY_LISS_SELECTED: "MODALITY_LISS_SELECTED",
  MODALITIES_CLEARED_BY_NO_CARDIO_STRATEGY: "MODALITIES_CLEARED_BY_NO_CARDIO_STRATEGY",
  MODALITIES_WITHHELD_DUE_TO_UPSTREAM_STATUS: "MODALITIES_WITHHELD_DUE_TO_UPSTREAM_STATUS",
});
