// P2-C8: admin surfaces — wire or tag. No admin tab may silently pretend to be live.
// Source-text tests (no server, no DOM): they pin the tags and the wiring evidence
// so a future edit cannot silently reintroduce a false live claim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const hub = read('frontend/src/pages/MasterSettingsHub.jsx');
const calc = read('frontend/src/pages/MacroCalculator.jsx');
const intakeForm = read('frontend/src/pages/FullIntakeForm.jsx');
const join = read('frontend/src/pages/PublicPricingJoin.jsx');
const renewal = read('frontend/src/pages/ClientOnlineRenewal.jsx');
const routes = read('src/api/routes/admin-settings.routes.js');
const exCtrl = read('src/api/controllers/exercise.controller.js');
const swapReg = read('src/exercise-swap-engine/smart-exercise-swap-registry.js');
const canonical = read('src/nutrition-food-catalog/canonical-food-table.js');
const culinary = read('src/nutrition-meal-context-v2/build-culinary-meals.js');

test('P2-C8: all three hub tabs carry the non-live tag', () => {
  for (const label of [
    'تخصيص وهوية الكوتش (System & Studio) — لسه مش مباشرة',
    'باقات الاشتراك والأسعار (Packages) — لسه مش مباشرة',
    'محرر استمارة الاشتراك (Intake Builder) — لسه مش مباشرة',
  ]) {
    assert.ok(hub.includes(label), `missing tag on tab: ${label}`);
  }
});

test('P2-C8: hub has a persistent non-live strip on every tab', () => {
  assert.ok(hub.includes('لسه مش مباشرة — التعديل هنا يُحفظ في سجلات المنظومة لكنه لا يظهر للعملاء مباشرةً'));
});

test('P2-C8: packages false live claim is gone, honest banner is present', () => {
  assert.ok(!hub.includes('لتظهر في استمارة الاشتراك وعروض التجديد'), 'false claim still present');
  assert.ok(hub.includes('صفحة الانضمام لا تعرض باقات'));
  assert.ok(hub.includes('أسعار التجديد ثابتة في الكود'));
});

test('P2-C8: intake tab banner states the client form is static', () => {
  assert.ok(hub.includes('استمارة العميل الحالية ثابتة ولا تقرأ هذه الأسئلة'));
});

test('P2-C8: system tab banner states admin-only visibility, no payment publishing', () => {
  assert.ok(hub.includes('يظهر للأدمن فقط'));
  assert.ok(hub.includes('بيانات الدفع (إنستا باي/البنك) لا تُنشر أبدًا'));
});

test('P2-C8: system save message no longer claims a live install', () => {
  assert.ok(!hub.includes('تم حفظ وتثبيت إعدادات وهوية المنظومة بنجاح'));
});

test('P2-C8: calculator food banner states calculator-only scope', () => {
  assert.ok(calc.includes('يظهر في الحاسبة فقط'));
  assert.ok(calc.includes('لا يغيّر خطط العملاء'));
  assert.ok(calc.includes('قرار مرجعية الأطعمة القابلة للتعديل ما زال معلّقًا'));
});

test('P2-C8: exercises stay WIRED — public list and swap engine read the settings file', () => {
  assert.ok(exCtrl.includes('getExercisesCatalogFile()'), 'public list must serve settings file');
  assert.ok(swapReg.includes('data/settings/exercises_catalog.json'), 'swap engine must read settings file');
});

test('P2-C8: evidence pins — intake form hardcoded, join shows no packages, renewal hardcoded', () => {
  assert.ok(!intakeForm.includes('admin-settings/intake-schema'), 'intake form must not fetch admin schema');
  assert.ok(intakeForm.includes('DEFAULT_MASTER_INTAKE'), 'intake form stays hardcoded');
  assert.ok(!join.includes('admin-settings/packages'), 'join page must not fetch packages');
  assert.ok(renewal.includes('6000'), 'renewal prices stay hardcoded');
  assert.ok(/router\.get\('\/system', requireAuth, requireAdmin/.test(routes), 'system sync stays admin-gated');
});

test('P2-C8: foods stay calculator-only — no plan path reads foods_catalog.json', () => {
  assert.ok(!canonical.includes('foods_catalog.json'));
  assert.ok(!culinary.includes('foods_catalog.json'));
});
