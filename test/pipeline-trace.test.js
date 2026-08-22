import assert from "node:assert/strict";
import test from "node:test";

import * as pipelineTraceApi from
  "z-coaching-intake-decision-engine/pipeline-trace";

const {
  PIPELINE_TRACE_VERSION,
  PipelineTracePolicy,
  PipelineTraceStatus,
  buildPipelineTrace,
} = pipelineTraceApi;

function makeStage(overrides = {}) {
  return {
    stageCode: "FOOD_SELECTION",
    stageVersion: "nutrition-food-selection-v1",
    status: "READY",
    issueCodes: [],
    reasonCodes: ["FOOD_SELECTION_POLICY_APPLIED"],
    durationMs: null,
    ...structuredClone(overrides),
  };
}

function makeInputs(overrides = {}) {
  return {
    pipelineCode: "NUTRITION_ENGINE",
    engineVersion: "nutrition-engine-v1",
    finalStatus: "READY",
    readyForCoachReview: true,
    stages: [makeStage()],
    ...structuredClone(overrides),
  };
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

test("public API exposes only the approved Pipeline Trace entries", async () => {
  assert.deepEqual(Object.keys(pipelineTraceApi).sort(), [
    "PIPELINE_TRACE_VERSION",
    "PipelineTracePolicy",
    "PipelineTraceStatus",
    "buildPipelineTrace",
  ]);
  assert.equal(PIPELINE_TRACE_VERSION, "pipeline-trace-v1");
  assert.deepEqual(Object.values(PipelineTracePolicy), [
    "Z_COACHING_PIPELINE_TRACE_V1",
  ]);
  assert.deepEqual(Object.values(PipelineTraceStatus), [
    "READY",
    "REVIEW_REQUIRED",
    "WITHHELD",
    "FAILED",
  ]);
  assert.equal(Object.isFrozen(PipelineTracePolicy), true);
  assert.equal(Object.isFrozen(PipelineTraceStatus), true);

  const packageApi = await import(
    "z-coaching-intake-decision-engine/pipeline-trace"
  );
  assert.equal(packageApi.buildPipelineTrace, buildPipelineTrace);
});

test("output uses the exact metadata-only trace contract", () => {
  const inputs = makeInputs({
    extraTopLevelData: { must_not: "leak" },
    stages: [makeStage({
      fullStageOutput: { meals: [{ secret: true }] },
      timestamp: "2026-07-18T00:00:00.000Z",
    })],
  });
  const result = buildPipelineTrace(inputs);

  assert.deepEqual(Object.keys(result), [
    "pipeline_trace_version",
    "pipeline_code",
    "engine_version",
    "status",
    "trace_policy",
    "ready_for_coach_review",
    "stages",
  ]);
  assert.deepEqual(Object.keys(result.stages[0]), [
    "sequence",
    "stage_code",
    "stage_version",
    "status",
    "issue_codes",
    "reason_codes",
    "duration_ms",
  ]);
  assert.deepEqual(result, {
    pipeline_trace_version: "pipeline-trace-v1",
    pipeline_code: "NUTRITION_ENGINE",
    engine_version: "nutrition-engine-v1",
    status: "READY",
    trace_policy: "Z_COACHING_PIPELINE_TRACE_V1",
    ready_for_coach_review: true,
    stages: [{
      sequence: 1,
      stage_code: "FOOD_SELECTION",
      stage_version: "nutrition-food-selection-v1",
      status: "READY",
      issue_codes: [],
      reason_codes: ["FOOD_SELECTION_POLICY_APPLIED"],
      duration_ms: null,
    }],
  });
});

test("all approved statuses and the coach-review flag pass through unchanged", () => {
  for (const status of Object.values(PipelineTraceStatus)) {
    const readyForCoachReview = status === "READY";
    const result = buildPipelineTrace(makeInputs({
      finalStatus: status,
      readyForCoachReview,
      stages: [makeStage({ status })],
    }));
    assert.equal(result.status, status);
    assert.equal(result.stages[0].status, status);
    assert.equal(result.ready_for_coach_review, readyForCoachReview);
  }

  const deliberatelyIndependent = buildPipelineTrace(makeInputs({
    finalStatus: "WITHHELD",
    readyForCoachReview: true,
  }));
  assert.equal(deliberatelyIndependent.status, "WITHHELD");
  assert.equal(deliberatelyIndependent.ready_for_coach_review, true);
});

test("stage order is preserved and sequence starts at one", () => {
  const stages = [
    makeStage({ stageCode: "INTAKE_DECISION", stageVersion: "intake-v1" }),
    makeStage({ stageCode: "PORTION_SOLVER", stageVersion: "portion-v1" }),
    makeStage({ stageCode: "PLAN_PREFLIGHT", stageVersion: "preflight-v1" }),
  ];
  const result = buildPipelineTrace(makeInputs({ stages }));

  assert.deepEqual(result.stages.map(({ sequence, stage_code }) => [
    sequence,
    stage_code,
  ]), [
    [1, "INTAKE_DECISION"],
    [2, "PORTION_SOLVER"],
    [3, "PLAN_PREFLIGHT"],
  ]);
});

test("duplicate stageCode values are rejected even when non-adjacent", () => {
  const stages = [
    makeStage({ stageCode: "FIRST" }),
    makeStage({ stageCode: "SECOND" }),
    makeStage({ stageCode: "FIRST" }),
  ];
  assert.throws(
    () => buildPipelineTrace(makeInputs({ stages })),
    {
      name: "TypeError",
      message: "stages contains duplicate stageCode FIRST.",
    },
  );
});

test("issue and reason codes deduplicate independently by first appearance", () => {
  const result = buildPipelineTrace(makeInputs({
    stages: [makeStage({
      issueCodes: ["ISSUE_B", "ISSUE_A", "ISSUE_B", "ISSUE_C", "ISSUE_A"],
      reasonCodes: ["REASON_A", "REASON_A", "REASON_C", "REASON_B"],
    })],
  }));

  assert.deepEqual(result.stages[0].issue_codes, [
    "ISSUE_B",
    "ISSUE_A",
    "ISSUE_C",
  ]);
  assert.deepEqual(result.stages[0].reason_codes, [
    "REASON_A",
    "REASON_C",
    "REASON_B",
  ]);
});

test("durationMs accepts null, zero, and positive fractional values", () => {
  const durations = [null, 0, 0.125, 475.75];
  const stages = durations.map((durationMs, index) => makeStage({
    stageCode: `STAGE_${index + 1}`,
    durationMs,
  }));
  const result = buildPipelineTrace(makeInputs({ stages }));
  assert.deepEqual(
    result.stages.map((stage) => stage.duration_ms),
    durations,
  );
});

test("durationMs rejects negative, non-number, and non-finite values", () => {
  for (const durationMs of [-0.01, "10", Number.NaN, Infinity, -Infinity]) {
    assert.throws(
      () => buildPipelineTrace(makeInputs({
        stages: [makeStage({ durationMs })],
      })),
      {
        name: "TypeError",
        message:
          "stages[0].durationMs must be a finite non-negative number or null.",
      },
    );
  }
});

test("top-level validation enforces the trace input contract", () => {
  const cases = [
    [undefined, "inputs must be an object."],
    [[], "inputs must be an object."],
    [makeInputs({ pipelineCode: "  " }),
      "pipelineCode must be a non-empty string."],
    [makeInputs({ engineVersion: null }),
      "engineVersion must be a non-empty string."],
    [makeInputs({ finalStatus: "UNKNOWN" }),
      "finalStatus must be one of READY, REVIEW_REQUIRED, WITHHELD, FAILED."],
    [makeInputs({ readyForCoachReview: "yes" }),
      "readyForCoachReview must be a boolean."],
    [makeInputs({ stages: {} }), "stages must be an array."],
  ];

  for (const [inputs, message] of cases) {
    assert.throws(
      () => buildPipelineTrace(inputs),
      { name: "TypeError", message },
    );
  }

  assert.deepEqual(
    buildPipelineTrace(makeInputs({ stages: [] })).stages,
    [],
  );
});

test("stage validation enforces every required metadata field", () => {
  const invalidStages = [
    [null, "stages[0] must be an object."],
    [makeStage({ stageCode: "" }),
      "stages[0].stageCode must be a non-empty string."],
    [makeStage({ stageVersion: " " }),
      "stages[0].stageVersion must be a non-empty string."],
    [makeStage({ status: "PROVISIONAL" }),
      "stages[0].status must be one of READY, REVIEW_REQUIRED, WITHHELD, FAILED."],
    [makeStage({ issueCodes: null }),
      "stages[0].issueCodes must be an array."],
    [makeStage({ reasonCodes: "REASON" }),
      "stages[0].reasonCodes must be an array."],
    [makeStage({ issueCodes: ["VALID", " "] }),
      "stages[0].issueCodes[1] must be a non-empty string."],
    [makeStage({ reasonCodes: [1] }),
      "stages[0].reasonCodes[0] must be a non-empty string."],
  ];

  for (const [stage, message] of invalidStages) {
    assert.throws(
      () => buildPipelineTrace(makeInputs({ stages: [stage] })),
      { name: "TypeError", message },
    );
  }
});

test("inputs remain unchanged, mutable, and independent from the output", () => {
  const inputs = makeInputs({
    stages: [makeStage({
      issueCodes: ["ISSUE_A", "ISSUE_A"],
      reasonCodes: ["REASON_A"],
    })],
  });
  const inputSnapshot = structuredClone(inputs);
  const result = buildPipelineTrace(inputs);
  const outputSnapshot = structuredClone(result);

  assert.deepEqual(inputs, inputSnapshot);
  assert.equal(Object.isFrozen(inputs), false);
  assert.equal(Object.isFrozen(inputs.stages), false);
  assert.equal(Object.isFrozen(inputs.stages[0].issueCodes), false);

  inputs.pipelineCode = "CHANGED";
  inputs.stages[0].stageCode = "CHANGED_STAGE";
  inputs.stages[0].issueCodes.push("LATE_ISSUE");
  assert.deepEqual(result, outputSnapshot);
});

test("the complete output is deeply frozen", () => {
  const result = buildPipelineTrace(makeInputs());
  assertDeepFrozen(result);
  assert.throws(() => {
    result.status = "FAILED";
  }, TypeError);
  assert.throws(() => {
    result.stages[0].reason_codes.push("NEW_REASON");
  }, TypeError);
});

test("identical inputs produce deterministic traces", () => {
  const inputs = makeInputs({
    finalStatus: "REVIEW_REQUIRED",
    stages: [
      makeStage({ stageCode: "FIRST", durationMs: 2.5 }),
      makeStage({
        stageCode: "SECOND",
        status: "REVIEW_REQUIRED",
        issueCodes: ["NEEDS_REVIEW"],
        durationMs: null,
      }),
    ],
  });
  assert.deepEqual(
    buildPipelineTrace(inputs),
    buildPipelineTrace(inputs),
  );
});
