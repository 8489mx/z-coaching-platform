/* S4-2: client login must require a secret the client chose. Code + phone
 * alone (sequential codes from 1000, last-8 phone matching) is not a secret,
 * and register-fast minted a token for any unused code with no proof.
 * login-fast therefore requires the bcrypt password once one is set, returns
 * PASSWORD_NOT_SET for password-less accounts (one-time set-password flow),
 * set-password refuses accounts that already have a password, register-fast
 * is gone, and only COACH/ADMIN can reset a client's password.
 * Source guards: the controller cannot be imported without the DB layer. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controller = fs.readFileSync(
  path.join(ROOT, "src/api/controllers/auth.controller.js"),
  "utf8"
);
const routes = fs.readFileSync(
  path.join(ROOT, "src/api/routes/auth.routes.js"),
  "utf8"
);

function handlerBody(name) {
  const start = controller.indexOf(`export const ${name}`);
  assert.notEqual(start, -1, `${name} not found in auth.controller.js`);
  const end = controller.indexOf("export const", start + 10);
  return controller.slice(start, end === -1 ? undefined : end);
}

const loginFast = handlerBody("loginFast");

test("login-fast checks the bcrypt password before issuing any token", () => {
  const compareAt = loginFast.indexOf("bcrypt.compare");
  assert.notEqual(compareAt, -1, "loginFast must compare the password with bcrypt");
  const tokenAt = loginFast.indexOf("generateToken(user)");
  assert.notEqual(tokenAt, -1, "loginFast must still issue a token on success");
  assert.ok(compareAt < tokenAt, "password check must run before the token is issued");
  assert.match(loginFast, /password/, "loginFast must read a password from the request");
});

test("login-fast tells password-less accounts to set a password, without a token", () => {
  assert.match(loginFast, /PASSWORD_NOT_SET/, "loginFast must signal PASSWORD_NOT_SET");
  const signalAt = loginFast.indexOf("PASSWORD_NOT_SET");
  const tokenAt = loginFast.indexOf("generateToken(user)");
  assert.ok(signalAt < tokenAt, "the PASSWORD_NOT_SET branch must not fall through to a token");
});

test("set-password exists, only sets a password where none exists, and hashes it", () => {
  const body = handlerBody("setClientPassword");
  assert.match(body, /PASSWORD_ALREADY_SET/, "set-password must refuse accounts that already have a password");
  assert.match(body, /bcrypt\.hash\(/, "set-password must bcrypt-hash the new password");
  assert.match(body, /token_version/, "set-password must bump token_version so old sessions die");
  assert.match(
    body,
    /length < 8|WEAK|weakPasswords/,
    "set-password must enforce the same password-strength rules as change-password"
  );
});

test("register-fast is removed: no handler and no route", () => {
  assert.equal(controller.indexOf("export const registerFast"), -1, "registerFast handler must be gone");
  assert.equal(routes.indexOf("register-fast"), -1, "register-fast route must be gone");
  assert.equal(routes.indexOf("registerFast"), -1, "register-fast must not be imported by the routes");
});

test("set-password route is public-but-rate-limited and whitelisted for the audit test", () => {
  assert.match(routes, /router\.post\("\/set-password",\s*authRateLimiter,\s*setClientPassword\)/);
  const auditTest = fs.readFileSync(
    path.join(ROOT, "test/security-audit-hardening.test.js"),
    "utf8"
  );
  assert.match(auditTest, /'auth:POST:\/set-password'/, "set-password must be whitelisted in the route audit");
});

test("coach password reset is admin-only, client-only, and revokes sessions", () => {
  const body = handlerBody("resetClientPassword");
  assert.match(body, /role.*CLIENT|CLIENT.*role/, "reset must only touch CLIENT accounts");
  assert.match(body, /bcrypt\.hash\(/, "reset must bcrypt-hash the temporary password");
  assert.match(body, /token_version/, "reset must bump token_version so old sessions die");
  assert.match(
    routes,
    /router\.post\("\/reset-client-password",\s*requireAuth,\s*requireAdmin/
  );
});
