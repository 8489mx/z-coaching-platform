import { readFileSync } from "node:fs";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";

const input = JSON.parse(readFileSync(new URL("./full-intake.json", import.meta.url), "utf8"));
const context = JSON.parse(
  readFileSync(new URL("./evaluation-context.json", import.meta.url), "utf8"),
);
const output = evaluateIntake(input, context);

console.log(JSON.stringify(output, null, 2));
