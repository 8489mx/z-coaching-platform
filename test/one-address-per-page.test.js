import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One page, one address. The same screen used to be mounted at up to seven paths (the client app at
 * /client/today, /client/meals, /client/workout, /client-app, /mobile, /program and /user-dashboard,
 * the check-in review at five), which made bookmarks, links and the active item in the sidebar
 * disagree. Older addresses stay as redirects, so nothing a client or coach saved stops working.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "frontend/src/App.jsx"), "utf8");

// Two entrances on purpose: the client portal and the staff login are the same screen, and the
// editor and the debrief take an optional client id.
const ALLOWED_TWO_ADDRESSES = new Set(["ClientLogin", "CoachEditor", "MesocycleDebriefPdfView"]);

test("no screen is mounted at more than one address", () => {
  const byComponent = {};
  for (const match of app.matchAll(/path="([^"]+)" element={<([A-Za-z]+)\s*\/>}/g)) {
    (byComponent[match[2]] ||= []).push(match[1]);
  }
  const offenders = Object.entries(byComponent)
    .filter(([component, paths]) => paths.length > 1 && !ALLOWED_TWO_ADDRESSES.has(component))
    .map(([component, paths]) => `${component}: ${paths.join(", ")}`);
  assert.deepEqual(offenders, []);
});

test("every older address still leads somewhere", () => {
  const olderAddresses = [
    "/today", "/coach/today", "/dashboard", "/index",
    "/client/meals", "/client/workout", "/client-app", "/mobile", "/program", "/user-dashboard",
    "/checkins/review", "/checkin/review", "/coach/checkin", "/coach/checkins",
    "/mobility", "/financials", "/reminders", "/program-pdf", "/mesocycle-debrief",
    "/pricing", "/client/renew", "/client/login", "/client/check-in",
  ];
  for (const address of olderAddresses) {
    const route = app.match(new RegExp(`path="${address.replace(/\//g, "\/")}" element={<([^}]+)}`));
    assert.ok(route, `${address} disappeared`);
    assert.match(route[1], /Navigate|RedirectKeepingQuery/, `${address} should redirect`);
  }
});

test("the sidebar starts with what is waiting on the coach", () => {
  const sidebar = fs.readFileSync(path.join(ROOT, "frontend/src/components/layout/Sidebar.jsx"), "utf8");
  const order = [...sidebar.matchAll(/key: '(today|intakes|checkins|customers|reminders|exercises|mobility|calculator|financials|settings)'/g)].map((m) => m[1]);
  assert.deepEqual(order, ["today", "intakes", "checkins", "customers", "reminders", "exercises", "mobility", "calculator", "financials", "settings"]);
});
