/**
 * Read-only audit: plans whose training cycle grew past its weeks before the check-in fix
 * (789bd8e). Until then, approving a check-in appended a week per check-in, most of them deloads.
 * Nothing is changed; the output says whether a repair (backup + plan + owner approval) is needed.
 *
 * Run: node --env-file=.env scripts/audit-grown-cycles.mjs
 */
import { Program, User } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const programs = await Program.findAll({
  attributes: ["id", "user_id", "status", "program_data"],
  include: [{ model: User, as: "user", attributes: ["client_code", "full_name"] }],
});

const grown = [];
for (const program of programs) {
  const weeks = (program.program_data?.training_program || program.program_data?.training || {}).weeks || [];
  const deloads = weeks.filter((week) => week.phase === "DELOAD").length;
  if (weeks.length > 5 || deloads > 1) {
    grown.push({ client: program.user?.client_code, program: program.id, status: program.status, weeks: weeks.length, deloads });
  }
}

console.log(`plans checked: ${programs.length} | grown past five weeks: ${grown.length}`);
for (const row of grown) console.log(`  ${row.client} plan #${row.program} ${row.status}: ${row.weeks} weeks, ${row.deloads} deload weeks`);
if (grown.length === 0) console.log("nothing to repair.");
await sequelize.close();
