import test from "node:test";
import assert from "node:assert/strict";

import router from "../src/api/routes/admin-settings.routes.js";
import { requireAuth, requireAdmin } from "../src/api/middlewares/auth.middleware.js";

/**
 * GET /exercises, /foods, /packages and /intake-schema under /api/v1/admin-settings (and /api/v1/admin)
 * answered anyone on the internet: the whole exercise and food catalogs, the packages and the intake
 * questions. Only the coach/admin pages read them (the fetch interceptor sends their token), so every
 * route of this router now needs a coach or admin login.
 */
const routes = router.stack.filter((layer) => layer.route).map((layer) => ({
  path: layer.route.path,
  methods: Object.keys(layer.route.methods),
  handlers: layer.route.stack.map((s) => s.handle),
}));

test("every catalog and settings route needs a coach or admin login", () => {
  assert.ok(routes.length >= 20, `found ${routes.length} routes`);
  const open = routes.filter((r) => !(r.handlers.includes(requireAuth) && r.handlers.includes(requireAdmin)));
  assert.deepEqual(open.map((r) => `${r.methods.join(",").toUpperCase()} ${r.path}`), []);
});

test("the login check runs before the handler", () => {
  for (const r of routes) {
    assert.equal(r.handlers[0], requireAuth, r.path);
    assert.equal(r.handlers[1], requireAdmin, r.path);
  }
});
