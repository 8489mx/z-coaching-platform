import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildClientLinks, CLIENT_ROUTES } from "../frontend/src/utils/clientLinks.js";

/**
 * Every link a client receives must open a real page. The coach's WhatsApp messages used to send
 * /app, /app/renew, /app/checkin, /renewal, /client and /checkin - none of them routes - so the
 * client landed on the login page and the client code in the link was lost.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "frontend/src/App.jsx"), "utf8");
const routes = new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]));

test("every route the client links point at exists in App.jsx", () => {
  for (const [name, route] of Object.entries(CLIENT_ROUTES)) {
    assert.ok(routes.has(route), `${name} -> ${route} is not a route`);
  }
});

test("the built links carry the client code to the pages that read it", () => {
  const links = buildClientLinks("ZC-104", "https://app.test");
  assert.equal(links.checkin_url, "https://app.test/check-in?code=ZC-104");
  assert.equal(links.renewal_url, "https://app.test/renew?code=ZC-104");
  assert.equal(links.app_url, "https://app.test/client/today");
  const plain = buildClientLinks("", "https://app.test/");
  assert.equal(plain.checkin_url, "https://app.test/check-in");
});

test("the old links already in clients' phones still reach the right page", () => {
  for (const old of ["/app", "/app/checkin", "/app/renew", "/checkin", "/renewal", "/client"]) {
    assert.ok(routes.has(old), `${old} must stay as a redirect for messages already sent`);
  }
  assert.match(app, /RedirectKeepingQuery/, "the redirect keeps the ?code= the link carries");
});

test("no page builds a client link by hand any more", () => {
  const pages = ["CoachCommandCenter", "FinancialsRenewalsDashboard", "WhatsAppRemindersHub"];
  for (const page of pages) {
    const source = fs.readFileSync(path.join(ROOT, `frontend/src/pages/${page}.jsx`), "utf8");
    assert.doesNotMatch(source, /\$\{origin\}\/(app|client|checkin|renewal)\b/, `${page} builds a client link by hand`);
    assert.match(source, /buildClientLinks/, `${page} should use the shared builder`);
  }
});
