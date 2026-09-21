/**
 * The training setup and injuries a client declared in the intake, for the exercise swaps: the
 * server reads them itself instead of trusting what a page sends. Also the one rule for who may
 * change a program's exercises: its client or a coach.
 */
import { User } from "../models/index.js";

// Intake training_environment -> the swap engine's setups.
const SETUP_BY_ENVIRONMENT = Object.freeze({
  commercial_gym: "GYM",
  home_gym: "HOME",
  minimal_equipment: "HOME",
  calisthenics_bands: "BANDS",
});
const NARROWNESS = Object.freeze({ GYM: 0, HOME: 1, BANDS: 2 });

/** {setup, injuries} from the stored intake answers; nulls when unknown. */
export function trainingProfileFromAnswers(answers) {
  if (!answers || typeof answers !== "object") return { setup: null, injuries: [] };
  const setup = SETUP_BY_ENVIRONMENT[String(answers.training_environment || "").toLowerCase()] || null;
  const areas = Array.isArray(answers.injuries_map?.selected_areas) ? answers.injuries_map.selected_areas : [];
  const injuries = answers.injuries_map?.has_injuries === false
    ? []
    : areas.map((a) => String(a).trim()).filter((a) => a && a.toLowerCase() !== "none");
  return { setup, injuries };
}

/**
 * The setup to use: the client's own, narrowed further if the client asks (training at home today),
 * never widened past what they own.
 */
export function effectiveSetup(declared, requested) {
  const asked = ["GYM", "HOME", "BANDS"].includes(String(requested || "").toUpperCase()) ? String(requested).toUpperCase() : null;
  if (!declared) return asked || "GYM";
  if (!asked) return declared;
  return NARROWNESS[asked] > NARROWNESS[declared] ? asked : declared;
}

/**
 * The client a request is about: the signed-in client, or the client a coach names. Returns
 * {requester, client} (either may be null).
 */
export async function resolveRequestClient(req, clientCode) {
  const requester = req.user?.id ? await User.findByPk(req.user.id).catch(() => null) : null;
  if (!requester) return { requester: null, client: null };
  if (requester.role === "CLIENT") return { requester, client: requester };
  const code = String(clientCode || "").replace(/^#+/, "").trim();
  const client = ["COACH", "ADMIN"].includes(requester.role) && code
    ? await User.findOne({ where: { client_code: code } }).catch(() => null)
    : null;
  return { requester, client };
}

/** Only the program's own client, or a coach/admin, may change its exercises. */
export function mayEditProgram(requester, program) {
  if (!requester || !program) return false;
  if (["COACH", "ADMIN"].includes(requester.role)) return true;
  return Number(program.user_id) === Number(requester.id);
}
