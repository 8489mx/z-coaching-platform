/**
 * Read-only audit: clients already in the system whose case is outside the service now
 * (pregnancy, kidney disease or dialysis, a diagnosed heart condition, an underweight body).
 * Nothing is written. The count says whether the clinical branches those cases used are dead
 * code or still carrying someone who is already subscribed.
 *
 * Run: node --env-file=.env scripts/audit-out-of-scope-clients.mjs
 */
import { IntakeSubmission, User } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";
import { assessServiceScope } from "../src/api/services/serviceScope.js";

const submissions = await IntakeSubmission.findAll({
  attributes: ["id", "user_id", "status", "answers", "createdAt"],
  include: [{ model: User, as: "user", attributes: ["client_code", "full_name", "subscription_status"] }],
});

const byCase = new Map();
const rows = [];

for (const submission of submissions) {
  const scope = assessServiceScope(submission.answers || {});
  if (scope.supported) continue;
  for (const kind of scope.cases) byCase.set(kind, (byCase.get(kind) || 0) + 1);
  rows.push({
    client: submission.user?.client_code || `user#${submission.user_id}`,
    name: submission.user?.full_name || "",
    subscription: submission.user?.subscription_status || "",
    status: submission.status,
    cases: scope.cases.join(", "),
  });
}

console.log(`intake submissions checked: ${submissions.length} | outside the service: ${rows.length}`);
for (const [kind, count] of byCase) console.log(`  ${kind}: ${count}`);
for (const row of rows) {
  console.log(`  ${row.client} ${row.name} [${row.subscription}] form:${row.status} -> ${row.cases}`);
}
if (rows.length === 0) console.log("no client in the system falls outside the service.");

await sequelize.close();
