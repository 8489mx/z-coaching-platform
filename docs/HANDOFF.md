# HANDOFF — Z Coaching (read this first, then CLAUDE.md)

Written 2026-09-21 by the previous Claude session, for the next session / account.
Everything below is merged into `main` and pushed to GitHub (`8489mx/z-coaching-platform`).

---

## 0. First thing to do in the new session

1. Read `CLAUDE.md` (standing iron rules) and this file.
2. Run the full check and confirm the baseline before touching anything:
   - `npm.cmd test` (Windows) — expected: node:test **1819/1819 pass**, vitest **47/47 pass**, lint 0.
   - `cd frontend && npm.cmd run build` — expected: builds.
   - Tests need the env: they load `D:/zcc/.env` (never print its values). Scripts: `node --env-file=.env <script>`.
3. Then continue with **section 4 (open work)**. Section 3b lists what was done after the first version of this file.

---

## 1. Owner, working rules and preferences (persist these)

- Owner writes Egyptian Arabic. **Reply in Arabic, RTL, zero emojis.**
- UI rules: rounded corners (buttons 8–10px, cards 12–16px); **no native `<select>`** (use `CurvedSelect`); no spinners.
- Client app: one smart log card per exercise; no per-set tables, timers, water counters or grocery lists.
- Windows: use `npm.cmd` / `npx.cmd`.
- **Evidence before claims**: paste real command output (tests, grep, build).
- **One change type per commit**; commit message says "(behavior change)" when behavior changes.
- **STOP before any schema/migration/data move**: documented backup + detailed plan + explicit owner confirmation.
- Prove code is dead before deleting it (show the search, even if zero results).
- After every change: full tests + build. If an old test breaks: stop and explain (it is often a source-shape guard test).
- Never print `.env` secrets. Never set/enter passwords (staff creds are set by the owner with `node scripts/set-staff-credentials.js`).
- Owner authorised: commit → fast-forward `main` → `git push origin main` after each verified fix ("ادمج وارفع").
- Product: coach dashboard on the web; clients use the **Flutter app** (`mobile_app/`), which only renders the server's `client_view` — no clinical logic in Dart (guarded by `test/mobile-app-has-no-clinical-logic.test.js`).
- Packages: **ELITE_4M** (3+1 months), **ELITE_8M** (6+2), **MAX**. MAX checks in every 7 days, ELITE every 14 (+2 days grace).
- The system must carry a client from intake to subscription end (4, 8, 12+ months), cycling 5-week mesocycles (4 loading + 1 deload) automatically. Keep it simple: same exercises across cycles; change an exercise only for stall or pain.
- Big mechanical jobs can go to Antigravity (another AI) via written prompts, then be verified by running things. Antigravity has invented results before — always verify. **Branch `agx/full-simulation` must never be merged** (it secretly changed engines).

## 2. Stack and layout

- Node 22 / Express 5 / MariaDB (Sequelize) backend in `src/api`; engines in `src/*-engine*`; React 19 / Vite frontend in `frontend/`; Flutter in `mobile_app/`.
- Some engines live in `frontend/src/utils/X.js` and are re-exported by `src/execution-engines/*.js` (single source). Duplicates are guarded by `test/engine-copy-drift-guard.test.js`.
- Stored intake is encrypted `{answers:{...form}}`; the server reads it with `loadLatestIntakeAnswers` (program.controller).
- Form values are lowercase keys (`fat_loss`, `lean_bulk`, `recomposition`, `dairy_lactose`, `gluten_celiac`, `peanuts_tree_nuts`, `sesame_seeds`, `calisthenics_bands`...). Dangerous symptoms are uppercase (`NONE`, `CHEST_PAIN`, ...).
- Local DB (in `D:/zcc/.env`) is local; unknown whether it is a production copy.

## 3. Everything done in this long session (all merged + pushed)

Commits, newest first (`git log --oneline cf1251e~1..HEAD`):

### Nutrition
- `2972356` Bulking with high body fat (>25% men / >35% women, or BMI ≥30 when body fat unknown) → goal becomes **BODY_RECOMPOSITION** (10% deficit, high protein). Stored on the plan as `nutrition_program.targets.effective_goal` + `goal_redirect.reason_ar`; check-ins read the plan's goal. (Plain names and "coach decides" were added later — see 3b.)
- ~~`52e790c` potatoes HIGH GI~~ — **REVERTED** in `f9e0a0c` by the owner's decision; potatoes stay for diabetics with a 200 g limit (see 3b).
- `8efa013` + `b8c9618` Carbohydrate item over **400 g** is split across the same food + its own safe swaps (densest first, ≤400 g each; if not enough, all parts grow equally). Runs on the final meals (after diabetic choice) and again after a check-in rescales meals (`planMergeEngine`). No safe swap → item kept, `portion_warning_ar` for the coach. Function: `splitOversizedPortions` in `src/nutrition-meal-context-v2/build-culinary-meals.js`.
- `0278d42` Calorie **increases stop at 55 kcal/kg** body weight (adaptation engine); reaching it sets `requires_coach_approval` + reason `CALORIE_CEILING_REACHED`. Never cuts a plan already above it.
- `dea8b9e` **Diabetes / insulin resistance: carbs ≤45% of energy**, excess energy to fat, in the first plan and every check-in adjustment. Fat >40% → `coach_review_high_fat(_ar)` in `clinical_guardrails`. Constants in `src/config/clinical-guidelines.js` (DIABETES.MAX_CARB_ENERGY_SHARE).
- `19163b0` **PCOS / insulin resistance**: moderate lower-carb (~30% energy, ≥100 g) instead of ketogenic 40 g.
- `3c89a24` Nut/soy allergies exclude foods that contain them (flag false or name match), not every uncertified food; **sesame allergy handled** (RAW_TAHINI, RAW_ALMONDS flagged).
- `19eb7ff` Final safety pass `enforceClinicalSafety`: unsafe template item → first safe swap, else flagged `clinically_unsafe` for the coach.
- Earlier: `976d37d` allergies reach meals, `cf1251e` diabetic first plan without high-GI foods.

### Check-ins, adaptation and cycles
- `789bd8e` **Critical**: approving a check-in used the subscription week as the cycle week → cycles grew forever and every week after month one became a deload. Now uses the week inside the current cycle.
- `9761743` Next cycle is prepared only once the current one has **ENDED** (not during its deload week).
- `e0ea566` A cycle starts the day it is **published** (intake approve, editor publish, draft publish) — helper `startCycleOnPublish` in `trainingCycleService.js`.
- `b9e662b` Check-ins adapt the **ACTIVE** plan, not a newer waiting DRAFT; the draft gets the same food targets (`findPlanInUse` in checkin.controller).
- `177d531` New cycle clears the previous cycle's `is_deload` flag.
- `31d066b` Adaptive TDEE: a gap >2 weeks between check-ins restarts the weight trend (a break no longer cuts calories).
- `553ffce` **Rapid loss always adds +150 kcal** (adaptive TDEE can no longer cut it).
- `3289c99` Rapid loss in 2 consecutive check-ins for a client needing medical review (nursing, pregnancy, kidney/liver...) → `clinical_alert` at the front of the coach's recommendation (`coach_action`).
- `9668805` **run-due runs automatically daily at 04:00 Cairo** (`src/api/services/cycleScheduler.service.js`, started in `server.js`) as the first ADMIN. Same gates as the coach's button.
- `c6ad009` Check-ins ordered by week (false rapid-loss fix).

### Intake, cardio, training
- `e6e8cf1` Intake asks **average daily steps** (5 ranges incl. "مش عارف"); adapter maps to steps (2500/4500/7500/10500); unknown keeps the estimate. Shown in the coach's intake view.
- `2911ea7` Fat-loss client with **BMI ≥30 always gets a steps target** (cardio-rules).
- `aa0d2b3` Unrecognised dangerous symptom → medical review (not dropped); case-insensitive.
- `d1b1fa7` + `ebf6575` Home clients never get equipment they don't own (re-check after all substitutions; rotator-cuff work allowed with band/dumbbell).

### Tools / scripts
- `scripts/simulate-long-journeys.mjs` — 6 hard clients week by week to the end of 4/8/12-month subscriptions through the real controllers + local DB (only `JRN_` clients; does NOT call the global run-due). Last result before the latest items: 6/6 "مشاكل: لا شيء".
- `scripts/simulate-clients.mjs` — 10-client end-to-end simulation (last: 100%). It rewrites `docs/SIMULATION_REPORT.md` with new timestamps/ids — revert that file if only those changed.
- `scripts/audit-grown-cycles.mjs` — read-only; local DB: 10 plans, 0 grown. **Run it on production** (see 4.3).
- A 306-client stress harness existed only in the old session's scratchpad (not in the repo). Its findings are all fixed above except what is listed in section 4.

## 3b. Done after the first handoff (all merged + pushed)

- `f9e0a0c` + `66c38a9` **Owner decision: potatoes are NOT banned for diabetics.** The high-GI classification (`52e790c`) was reverted (potatoes/sweet potato are MEDIUM again). For a diabetic: a potato item above **200 g** is split with another carbohydrate; a larger potato swap becomes a mixed plate ("200 g potato + N g of the original food", same macros); potato items/swaps carry `diabetic_tip_ar` (eat with protein and salad, best boiled and cooled). Applied in the first plan and after check-in rescales (`carbPortionLimit({ diabetic })` in build-culinary-meals.js).
- `653804c` **Plain goal names + "سيب الكوتش يحدد"** (see table below). Internal codes unchanged; new form value `coach_decides` (adapter maps it to canonical FAT_LOSS as a placeholder; the plan engine decides). Engine for `coach_decides`: high body fat (>25% men / >35% women, or BMI ≥30 without body fat) → FAT_LOSS; moderate (>18% / >28%, or BMI ≥25) → BODY_RECOMPOSITION; lean → MUSCLE_GAIN; recorded in `targets.goal_redirect` with `coach_review_required: true` and the Arabic reason. Recomposition wording in client texts is now "نزول دهون مع شد وبناء عضل".
  | code | label shown |
  |---|---|
  | fat_loss | نزول دهون ووزن |
  | lean_bulk | زيادة عضل ووزن |
  | recomposition | نزول دهون مع شد وبناء عضل |
  | general_fitness | صحة ولياقة عامة |
  | coach_decides | مش متأكد، سيب الكوتش يحدد |
- `8682565` Coach editor nutrition tab shows **"ملاحظات للكوتش قبل الاعتماد"**: every engine note (goal suggestion/change, diabetic carb ceiling, high fat share, meal-count advice, items with portion/clinical/glycemic warnings). Collector: `frontend/src/utils/coachAlerts.js` (`collectCoachAlerts`). Build and tests pass; **not yet looked at in a real browser session**.
- `33d33ff` 3200+ kcal on ≤3 meals → coach note advising 4–5 meals (`targets.meal_count_note_ar`); the plan is not changed (client's choice).
- `c3b65c2` `scripts/stress-random-clients.mjs` — 306 clients, no DB (`node scripts/stress-random-clients.mjs`).
- Verification after all of the above: stress 306 clients **0 crashes, 0 violations** (diabetic carbs >50%: 24→0, oversized portions: 4→0, obese fat-loss without cardio: 10→0); long journeys **6/6 no issues** (JRN_04/JRN_05 now show one cycle fewer than before — expected, their gated cycles are published a week later and now count from the publish date); 10-client simulation **100%**.

## 3c. Swaps (food, exercise, cardio) — third round, all merged + pushed

Food swaps
-  **Mobile app food swaps** (, ) checked nothing and needed no sign-in; now require sign-in, judge every candidate with the meal generator's own filter and the client's restrictions (,  extracted in , proven identical output), refuse unsafe targets (409), no egg swaps for unknown foods, every plan food except vegetables maps to a swap family, diabetic potato swap ≤200 g.
-  **Web client swaps** (): cornflakes not gluten-free (barley malt), pea protein under favism's legume rule, diabetic potato swap ≤200 g. A name sweep of all 142 foods vs every form allergy found no other leak.

Exercise swaps
-  Engine (): joint stress read from the name too (back extensions for a back injury, pike push-ups for a shoulder were leaking); injuries understood in Arabic and form keys (); home never gets gym gear; new **BANDS** setup (bodyweight + bands only); catalog fallback so every exercise keeps a swap (sore knee on a leg day → hip thrust / glute bridge, then RDL).
-  Endpoints:  requires sign-in and reads the client's setup and injuries from the intake (the page sent none);  and  only for the program's client or a coach, a client only an engine-offered swap (409). Those two POST endpoints have no caller in web/mobile today (searched) — secured, not deleted.
-  Coach editor: a manual swap that loads an injured joint or needs missing equipment shows an amber warning (, rules kept identical to the server by ).

Cardio
-  The plan now carries **** (injuries, conditions, allergies, setup, BMI, pregnancy, nursing) — the coach editor used to show every client as healthy in a gym. The coach's cardio list blocks unsafe options with the reason ().
-  The client's own cardio (client_view) now receives injuries, weight, height and equipment: BMI / knee / back rules fire, no treadmill for bands/home clients, no-machine intervals → brisk walk, a steps-only plan shows daily walking.

Other
-  Coach screens use the plain goal names; editor shows the plan's effective goal.
-  Olive oil ≤20 g a meal; excess fat → avocado (≤100 g) then almonds (≤30 g; never with nut allergy or kidney cap); fat total unchanged.
- Verification after this round: 1819/1819 + 47/47, lint 0, build OK, stress 306 clients 0 crashes / 0 violations, journeys 6/6 no issues, 10-client simulation 100%.

## 4. Open work (in priority order)

### 4.1 Goal choice and plain names — DONE in `653804c` (kept below for context)
Owner's words: in the case "client picked bulking but is too fat", there should be an intake answer like **"سيبها للكوتش يحدد الأفضل"**, and goal names must be **professional and easy for clients** — many clients will not understand "إعادة تكوين الجسم". Applies to the intake questions AND everything the client sees in the app.
Suggested approach (confirm with owner first, show proposed Arabic labels):
- Intake goal options with plain Arabic + one-line explanation, e.g. "نزول دهون", "بناء عضل", "نزول دهون مع شد وبناء عضل" (instead of إعادة تكوين), "الحفاظ على الوزن وتحسين اللياقة", and **"سيب الكوتش يحدد الأنسب"**.
- "Coach decides" → engine picks by body fat/BMI (the rule from `2972356`), plan flagged for the coach to confirm.
- Keep internal codes unchanged (`fat_loss`, `lean_bulk`, `recomposition`); change only labels. Search every place labels appear: `frontend/src/pages/FullIntakeForm.jsx`, `frontend/src/components/intake/IntakeAuditDetailModal.jsx` (GOALS_MAP), client app pages under `frontend/src/pages/ClientInteractiveApp/`, `mobile_app/lib` (labels only), and `goal_redirect.reason_ar` in `src/master-engine-v2/build-master-engine-v2.js`.
- Also decide: when the goal is redirected, should the plan wait for coach approval? (currently it just records the reason).

### 4.1b Still open from the naming work
- Other client-facing places still use older goal wording: `frontend/src/pages/ClientTimelineProfile.jsx` (coach page, "Lean Bulk" labels), `frontend/src/pages/CheckinReviewDashboard.jsx` (coach page, "إعادة تشكيل"), `useCoachEditorData.js` `goal_label` fallback — align if the owner wants the coach side plain too. (`mobile_app/lib` has no goal labels: searched, zero matches.)
- Live swaps now apply the diabetic potato limit too (3c).

### 4.2 Verify everything together — DONE (see 3b); rerun after any engine change
- `node --env-file=.env scripts/simulate-long-journeys.mjs` and `scripts/simulate-clients.mjs`; expect no issues. Note: the journeys harness applies run-due's rule (ENDED only).
- Rebuild the 306-client stress idea if wanted (random intakes through `buildMasterEngineV2`, check allergies/GI/equipment/portions/macros/cardio).

### 4.3 Production data
- Run `node --env-file=<prod env> scripts/audit-grown-cycles.mjs` on production. If it finds plans with >5 weeks or >1 deload week, they were damaged by the pre-`789bd8e` bug: repair needs backup + plan + owner approval (CLAUDE.md rule 5).

### 4.4 Known smaller points
- Extreme case (130 kg, diabetes+kidney+liver, celiac+nut allergy): only basmati rice stays eligible and fat goes to olive oil (80–90 g/meal). It is flagged for the coach (`coach_review_high_fat`, `portion_warning_ar`). Better: more meals for high-calorie plans, and fat sources besides oil (avocado, nuts when allowed).
- Meal count: DONE as a coach note (`33d33ff`).
- Coach notes: DONE in the nutrition tab (`8682565`); look at it once in a real browser with a real client. `clinical_alert` shows inside the check-in review (`coach_action`).
- Fat sources: DONE (`40a2a9e`).
- Coach editor and cardio/exercise warnings: built and tested, **not yet looked at in a real browser**.
- Flutter app not yet tried on a real device.
- PDPL consent text: owner says the lawyer reviewed it — done.

## 5. How work was verified in this session (repeatable)
- For each fix: a test that **fails before the fix and passes after** (restore old file with `git show HEAD:<file> > <file>`, run the test, put the fix back), then the full suite, lint and build.
- Full suite command used: `npm.cmd test` from the repo root with `D:/zcc/.env` loaded (tests read env).
- Merge flow: `cd /d/zcc && git checkout -q main && git merge --ff-only <branch> && git push origin main`, then `npm.cmd test` on main.
