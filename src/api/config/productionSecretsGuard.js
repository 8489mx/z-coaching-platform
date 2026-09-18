/**
 * Refuses to boot in production when a required secret is missing or still holds the
 * .env.example placeholder. Deliberately does not enforce length or rotate anything,
 * so existing deployments with real values are unaffected.
 */
const REQUIRED_SECRETS = ["JWT_SECRET", "MEDICAL_ENCRYPTION_KEY"];
const OPTIONAL_SECRETS = ["INTAKE_JWT_SECRET", "CSRF_SECRET"];

export function findInsecureProductionSecrets(env = process.env) {
  if (env.NODE_ENV !== "production") return [];
  const problems = [];
  for (const name of REQUIRED_SECRETS) {
    const value = String(env[name] || "").trim();
    if (!value) problems.push(`${name} is not set`);
    else if (value.includes("REPLACE_WITH")) problems.push(`${name} still holds the .env.example placeholder`);
  }
  for (const name of OPTIONAL_SECRETS) {
    const value = String(env[name] || "").trim();
    if (value.includes("REPLACE_WITH")) problems.push(`${name} still holds the .env.example placeholder`);
  }
  return problems;
}

export function assertProductionSecrets(env = process.env) {
  const problems = findInsecureProductionSecrets(env);
  if (problems.length > 0) {
    throw new Error(`FATAL: insecure production secrets: ${problems.join("; ")}`);
  }
}
