# HANDOFF — Z Coaching (read this first, then CLAUDE.md)

Written 2026-09-21 by the previous Claude session, for the next session / account.
Everything below is merged into `main` and pushed to GitHub (`8489mx/z-coaching-platform`).

---

## 0. First thing to do in the new session

1. Read `CLAUDE.md` (standing iron rules) and this file.
2. Run the full check and confirm the baseline before touching anything:
   - `npm.cmd test` (Windows) — expected: node:test **1883/1883 pass**, vitest **47/47 pass**, lint 0.
   - In a git worktree: link `node_modules` and `frontend/node_modules` to `D:/zcc`'s (junctions), copy `.env` (ignored), and build the frontend once — `test/hostinger-deployment-readiness.test.js` fails without `frontend/dist`.
   - `cd frontend && npm.cmd run build` — expected: builds.
   - Tests need the env: they load `D:/zcc/.env` (never print its values). Scripts: `node --env-file=.env <script>`.
3. Then go to **section 4.0 (WHAT IS STILL OPEN)**. Sections 3, 3b and 3c list everything already done, with commit ids, files and tests.

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
- `8c623a7` (refactor, no behavior change — 60 plans hash identically) `buildAllergenContext` extracted from the meal generator and exported, so the plan and the swaps share the same restrictions.
- `c3fd9a2` **Mobile app food swaps** (`POST /api/v1/programs/swap-candidates`, `POST /api/v1/programs/swap-food`) checked nothing and needed no sign-in (a coeliac client was offered bread, a sesame allergy tahini, favism fava beans; an unknown food code was treated as egg). Now: `requireAuth` (the Flutter app already sends its token); every candidate judged by the meal generator's own `isFoodClinicallySafe` with the client's restrictions from the intake (`src/api/services/liveFoodSwapSafety.js`: `REGISTRY_TO_PLAN_FOOD`, `PLAN_FOOD_TO_REGISTRY`, `isSwapFoodSafe`, `resolveSwapContext`); unknown registry food refused (fail closed); swap-food returns 409 `SWAP_NOT_CLINICALLY_SAFE` for an unsafe target; unknown source food → no swaps (not egg); every plan food except vegetables maps to a swap family; diabetic potato swap only up to 200 g. Test: `test/live-food-swaps-are-clinically-safe.test.js`.
- `a7be2b4` **Web client swaps** (`frontend/src/utils/foodSwapEngine.js`, used by `ClientInteractiveApp/components/FoodSwapModal.jsx`): `SUGAR_FREE_CORNFLAKES` no longer gluten-free (barley malt); `PEA_RICE_PROTEIN_POWDER` is a legume (favism rule); diabetic potato swap above 200 g refused in `calculateDynamicFoodSwap`. A name sweep of all 142 foods against every form allergy found no other leak. Test: `test/web-food-swaps-are-clinically-safe.test.js`.

Exercise swaps
- `0e46cb4` Engine (`src/exercise-swap-engine/smart-exercise-swap-registry.js`): `getExerciseJointStress` now always reads the name too (`JOINT_STRESS_BY_NAME`) — back extensions / 45° hyperextensions were offered for a back injury (7 cases), pike push-ups for a shoulder (4); `normalizeInjuryFlag` understands Arabic (ركبة، ظهر، كتف...) and form keys (`spine_back`, `elbow_wrist`); `HOME` never gets gym gear by name (was: barbell hip thrust, barbell OHP — 10 cases); new setup **`BANDS`** (bodyweight + bands only); when fewer than 3 swaps remain, fallback from `EXERCISE_CATALOG_V2` (same slot → same main muscle; sore knee on a leg exercise → hip thrust / glute bridge, then Romanian deadlift, never conventional deadlift). Every registry exercise keeps ≥1 swap in every setup/injury. Test: `test/exercise-swaps-are-safe.test.js`.
- `3478919` Endpoints (`src/api/controllers/exercise.controller.js`, `src/api/services/clientTrainingProfile.js`): `GET /api/v1/exercises/swaps/:code` now `requireAuth` and reads the client's setup (`commercial_gym`→GYM, `home_gym`/`minimal_equipment`→HOME, `calisthenics_bands`→BANDS) and injuries from the intake (the web page sent none); the page's toggle can narrow the setup, never widen it. `POST /swap-in-program/:programId` and `POST /gym-rush/swap/:programId` changed ANY program for any signed-in user → now only the program's own client or a coach/admin (403); a client may only pick a swap the engine offers them (409 `EXERCISE_SWAP_NOT_ALLOWED`). These two POST endpoints have no caller in web or mobile today (searched, zero matches) — secured, not deleted. `loadLatestIntakeAnswers` is now exported from program.controller. Test: `test/exercise-swap-endpoints-follow-the-client.test.js`.
- `5258048` Coach editor manual exercise swap: allowed, but an amber warning names the conflict (loads an injured joint / needs gym machines at home / free weights for bands-only). Rules in `frontend/src/utils/exerciseSafety.js`, kept identical to the server engine by `test/exercise-safety-drift-guard.test.js`. Notification bar in `frontend/src/pages/CoachEditor.jsx` now shows `type: 'warning'` in amber.

Cardio
- `af9d591` The plan now carries **`client_profile`** (gender, age, weight, height, BMI, training_environment, injuries, conditions, allergies, is_pregnant, is_lactating) from `buildMasterEngineV2` — before, the plan had no client data and the coach editor showed every client as "healthy" in a commercial gym. `useCoachEditorData.js` reads it (older plans keep the old fallback) and exposes `program.client_profile` (+ `hiit_banned`). The coach's cardio list (`CoachCardioSwapModal.jsx`) blocks unsafe options with the reason via `frontend/src/utils/cardioModalitySafety.js` (`evaluateCardioModality`): knee → no jumping/stairs; back → no burpees/rowing; shoulder → no burpees/mountain climbers; BMI ≥35 → no jumping; asthma → no HIIT; blood pressure/heart → no maximal effort; pregnancy → no impact/intensity; bands/minimal → no machines (home gym only warns). Test: `test/cardio-modality-safety.test.js`.
- `509c585` The cardio the client sees (`client_view.cardio` in `getActiveProgramByUserId`) now receives injuries, latest check-in weight (else intake weight), height and equipment (`machines_available`): the BMI and knee/back impact rules actually fire; bands/home clients get brisk walking instead of a treadmill; low-impact intervals without a machine become a moderate brisk walk (`NO_LOW_IMPACT_MACHINE` guidance); a `STEPS_ONLY` / `NO_ADDITIONAL_CARDIO` plan shows daily walking. Engine: `frontend/src/utils/cardioZonesEngine.js` (single copy, re-exported by `src/execution-engines/cardio-zones-engine.js`). Test: `test/client-cardio-follows-the-client.test.js`.

Other
- `43592c3` Coach screens (`CheckinReviewDashboard.jsx`, editor `goal_label`) use the plain goal names; the editor shows the plan's effective goal. Timeline periodization phases (Cut, Diet Break, Mini-Cut) intentionally kept as coaching terms.
- `40a2a9e` Olive oil ≤20 g per meal (`diversifyFatSources` in build-culinary-meals.js, run last in master-engine-v2): excess fat → avocado (≤100 g) then almonds (≤30 g; never with nut allergy or kidney protein cap); what is left returns to the oil; total fat unchanged (±3 g). Test: `test/fat-sources-beyond-oil.test.js`.
- Verification after this round: 1819/1819 + 47/47, lint 0, build OK, stress 306 clients 0 crashes / 0 violations, journeys 6/6 no issues, 10-client simulation 100%.

## 3d. Fourth round (2026-09-21, second session) — merged + pushed

- `d0c9c67` **Fourth-meal snack fixed** (standard case D, meal 4 in `buildCulinaryRecipeMeals`, build-culinary-meals.js). Found while adding the automatic 4th meal: for any client on 4 meals the snack had up to 733 g sweet potato with `swaps: []` (so the 400 g split could not run), 102 g almonds for a kidney patient, and almonds always listed as 3 g protein. Now: sweet potato gets `generateSmartSwaps` (split applies), nuts/seeds ≤30 g (`SNACK_NUT_MAX_G`) with macros from `FOOD_SWAP_DATABASE`, none when `clinical_guardrails.kidney_protein_capped`, remaining fat → olive oil (then `diversifyFatSources` as usual). Test: `test/four-meal-snack-is-safe.test.js`.
- `bc54470` **Owner decision: 3200+ kcal on 3 meals → 4 meals automatically** (`mealAddedForCalories` in build-master-engine-v2.js). Day macros unchanged (only split). Coach note `meal_count_note_ar` says a 4th meal was added and deleting it in the editor ("حذف الوجبة") spreads it over the rest. 2 meals (fasting) keep the advice only; ≥4 untouched. `test/coach-alerts.test.js` updated to the new note. Test: `test/high-calorie-day-gets-a-fourth-meal.test.js`. Extreme case (130 kg, diabetes+kidney+liver, coeliac+nuts, 4924 kcal): 3 meals up to 1841 kcal / 1348 g → 4 meals of ~1275 kcal, largest plate 1187 g.
- `1f8e69c` Owner's answer on 4.0 item 5: fewer/clearer choices — a line under the goal cards: "مهما كان اختيارك، هنوصلك لأفضل فورمة ممكنة." Redirected / coach-decides plans do **not** wait for approval (owner did not ask for it); the reason stays in the coach notes.
- Verification: 1828/1828 + 47/47, lint 0, build OK, stress 306 clients 0 crashes / 0 violations, journeys 6/6 no issues, 10-client simulation 100%. The regenerated `docs/SIMULATION_REPORT.md` was reverted (ids/timestamps, plus the blood-pressure + obesity sim client's cardio now `RECOVERY_WALK` instead of `LISS_TALK_TEST` — from `509c585`, "no HIIT" still passes).
- Browser (real, signed out): intake form shows the 5 goal cards, no "إعادة تكوين", the steps question (5 options) and the new line. The rest of item 1 needs the backend restarted on the latest code (the owner's backend was started at 19:08, before the 3c server commits) and the owner signed in.
- Production audit: `.env.production` has `DB_HOST=localhost`, i.e. the database lives on the VPS itself; from this PC it would reach the local DB. The audit has to run **on the server**: `node --env-file=.env scripts/audit-grown-cycles.mjs` from the app folder there. Local DB now: 10 plans, 0 grown.

## 3e. Fifth round (2026-09-21) — "do it right, research-based, and swaps must taste right" — merged + pushed

Owner's words: every food must be palatable; a swap must be eaten the same way and be close in value, not "anything with the same protein".
- `7a98a10` **Kidney + avocado** (KDIGO 2024 CKD guideline, practice points 3.11.5.1–2: potassium is managed per person; limit potassium-rich foods with hyperkalaemia or its risk; fruit/veg not banned by default). The intake has no potassium result, so `diversifyFatSources` caps avocado at `KIDNEY.AVOCADO_MAX_G_PER_MEAL` = 50 g for any kidney client (was 100 g); coach note `KIDNEY.POTASSIUM_NOTE_AR` (ask for the latest potassium test; if high cut avocado, potatoes, banana, dates, salt substitutes). New guardrails `kidney_condition`, `kidney_potassium_note_ar`; shown by `collectCoachAlerts`.
- `67fbbf1` **One swap rule** `frontend/src/utils/swapExchangeRules.js`: `SWAP_FAMILIES` for every plan + mobile-registry food (meat/fish; savory breakfast protein; sweet dairy/shakes; savory starch = bread+rice+potato+pasta; cereal; sweet carb = fruit+dates+sweet potato+oats; crunch; legume snack; cooking fat; nut/spread) and value: energy within 25% (`MAX_ENERGY_GAP`) and fat within 10 g. Families follow the clinical exchange lists (ADA/AND "Choose Your Foods"); the 25%/10 g limits are a product rule, not a published number (30% was measured: it would add whey→750 g yogurt, oats→550 g orange).
- Mobile app (`/programs/swap-candidates`, `/swap-food`): `ab22c8d` rule applied (`src/api/services/liveFoodSwapValue.js`; 409 `SWAP_NOT_EQUIVALENT`); before: chicken→860 g laban +115%, →foul +187%, bread→400 g watermelon. `f629a10` **bug: the app showed 0 kcal after every swap** — swap-food now returns calories/protein_g/carbs_g/fat_g. `31e099f` the app sends no `meal_context`: without it all foods of the macro type are candidates (family rule keeps fit) — egg→egg white and fruit→fruit work again. Foods with **no equivalent** in the mobile list (named in `test/live-food-swaps-are-clinically-safe.test.js`): salmon, tuna, whey, laban, lupini, skim and lactose-free milk. Peanut butter has no macros in the data → no longer offered.
- Plan swaps (`e235b97`, build-culinary-meals.js): `generateSmartSwaps` = equivalent swaps only; `buildSmartSwapCandidates` (internal) = full list; `keepEquivalentSwaps` re-checks against each item as shown (templates state their own macros). Leaner protein swaps **add olive oil** (`oil_addition_g`, ≤15 g) like fattier ones already cut it — eggs→labneh/cottage/halloumi/tuna with oil. Dinner meat→meat/fish; breakfast carbs + sweet potato; snack carbs + fruit. **Safety before taste**: `enforceClinicalSafety` falls back to the full safe list (same family first, then closest energy) — without it egg-allergic bariatric clients kept an omelette (caught by the stress run; test proven to fail without the fallback). Audit over 306 clients: 71 pair types / 34 over 25% → 42 / 6 (the 6 carry an oil instruction). Old tests in `nutrition-swap-engine-v2.test.js` updated to the owner's rule (bread not→oats/dates; eggs not→foul/laban; salmon only when the meal's oil absorbs its fat).
- `2b19e71` Web client `FoodSwapModal` uses `listEquivalentFoodSwaps` (foodSwapEngine): same taste group (was only sorted, `enforce_taste_profile:false`) + close value. Not yet seen in a browser (needs a signed-in client).
- `907893b` Swap measures follow the grams (USDA medium potato 173 g, sweet potato 114 g); tamees shows grams only.
- `5147c60` 4th meal named "الوجبة الرابعة (سناك)" (was "سناك صحي خفيف" at ~1000 kcal); title names the real food.
- `4e7cc13` Intake headings: "هدفك الأساسي", "حركتك اليومية برا الجيم", "طبيعة شغلك" (seen in the browser).
- `24a50c9` Check-in that takes a 3-meal plan past 3200 kcal → note in `coach_action` to add a meal ("إضافة وجبة"); the merge cannot rebuild meals (`src/checkin-engine/meal-count-note.js`).
- Verification: 1855/1855 + 47/47, lint 0, build OK, stress 306 clients 0 violations, journeys 6/6 no issues, 10-client simulation 100%.

## 3f. Sixth round (2026-09-21) — "fix everything you said needs fixing" — merged + pushed

- `1c0be06` **Owner rule: protein powder has no swap** (whey, isolate, casein, pea-rice: `NO_SWAP_FOODS` in swapExchangeRules). The client takes it; when it runs out they tell the coach and protein comes from normal food (`NO_SWAP_NOTE_AR`). Plan: no swaps + `swap_note_ar`; web window shows the note; swap-candidates returns none + `message_ar`; swap-food 409 `NO_SWAP_FOR_FOOD`; client_view items get `note` (Flutter reads `note` but does not display it yet).
- `c4352e2` Mobile swaps find the food in the client's active plan and use that meal (breakfast/snack/main): breakfast bread is no longer offered rice (the app sends no meal_context; no Dart change needed).
- `eadd0a4` Mobile: a leaner swap gets the missing fat as olive oil (up to 15 g), shown in the line/name and counted in the returned calories. Salmon now swaps to leaner fish/meat; eggs to cottage/labneh/halloumi/tuna.
- `1a34160` Mobile portions and values come from **one data source** (the registry densities disagreed: tuna 26 vs 19.4 g protein, USDA drained light tuna; egg and egg white were valued as an omelette cooked with fat; 79 offered swaps changed the main nutrient by more than 1.5 g). Egg, egg white and peanut butter from USDA SR Legacy (01129, 01124, 16098). With the corrected data lean beef is 26% above chicken, so it is not a mobile chicken swap.
- `baf2e5d` Fruit at most 250 g a plate, dates 80 g (product limits); a split never leaves a part under 40 g (folded into a part with room, else spread over non-potato parts; a diabetic potato limit is never passed).
- `bbb6ccc` **Kidney: energy at most 35 kcal/kg of reference weight** (KDOQI 2020 nutrition in CKD, guideline 3.1.1: 25-35 kcal/kg/day), first plan and check-ins (`KIDNEY_ENERGY_CEILING_REACHED`); not for pregnancy/lactation. Extreme case 4924 -> 4550 kcal.
- `e78fe1e` Olive oil above 30 g in a meal -> `portion_warning_ar` for the coach (first plan and after a check-in rescale). Stress: 29/306 clients have a meal above 20 g, 7 above 30 g (mostly kidney + diabetes: protein cap + carb ceiling leave fat as the only energy; changing those limits is a medical decision, not done).
- Correction: the swap-database omelette (154 kcal, 11.7 g fat per 100 g) is USDA omelette cooked with fat, not an error; the template uses boiled egg. Nothing to fix.
- Verification: 1873/1873 + 47/47, lint 0, build OK, stress 306 clients 0 violations, journeys 6/6 no issues, 10-client simulation 100%.

## 3g. Seventh round (2026-09-21/22) — owner: "the engine first, the app later; training and nutrition are the foundation; 30 g of oil is too much, the overall balance matters" — merged + pushed

Owner decision: **no Flutter work until the engine has no error that can stop a client reaching the goal.**

- `e68c304` **The day's balance** (IOM DRI 2005, adult AMDR: fat 20-35% of energy; `CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_FAT_ENERGY_SHARE` 0.35). Energy a clinical limit pushes out (diabetic carb ceiling, kidney protein cap, PCOS lower-carb) no longer piles up as fat. Above 35%: no diabetes -> carbohydrate; diabetes -> protein up to 2.2 g/kg of reference weight where the kidneys allow, then lower energy (never while breastfeeding, never under 1200/1500 or KDOQI 25 kcal/kg, below maintenance only with BMI 25+), then carbohydrate above 45% (with a kidney cap only, at most ~56%, low-GI sources already chosen). PCOS lower-carb: protein then carbohydrate (Teede et al. 2023: no diet type favoured). Coach note `energy_balance_note_ar`. Extreme case: 4550 kcal / fat 46% / oil 39-50 g a meal -> 3254 kcal / fat 35% / carbs 52% / oil 20-24 g. Stress: meals over 30 g of oil 7 clients -> 1; the stress run now also fails any plan with fat above 35% (none).
- `9e29e02` Pregnant/breastfeeding kidney patients keep +25 g protein on top of the kidney cap (Eur J Clin Nutr 2020 review of CKD in pregnancy: use the CKD recommendation plus the extra needs of pregnancy; IOM +25 g/day). R233 (42 kg, breastfeeding) 34 -> 59 g protein.
- `6290e88` Check-ins keep the balance: a diabetic's extra energy goes to protein (no kidney cap), then fat up to 35%, else the increase is held (`FAT_SHARE_LIMIT_REACHED`, coach approval); a kidney + diabetes plan keeps its own carbohydrate share instead of being pulled back to 45% (which pushed the difference into fat every check-in). The long-journeys run now fails any week with fat above 35% (none in 6 journeys).
- `96415be` **Training: chest volume.** Audit of the 306 clients (week 1, fractional sets, Pelland et al. 2024): chest had ~6 weekly sets in every split (back 12-16, shoulders up to 19) - one chest movement per upper/push day against two for the back. Now a second press on UPPER_B and both push days (PUSH_B trades its second overhead press), a third press on full-body day C; repeated slots become incline presses (`DUPLICATE_ALTERNATIVES`). Chest: PPL 6 -> 12.6, upper/lower 6 -> ~9, 5 days 6 -> ~10, full body 3 days 6 -> 9 (>= 10 weekly sets: Schoenfeld et al. 2017). Guard test `training-muscle-balance.test.js`; the slot-map guard updated.
- Audit also found: no major muscle under 6 or over 22 weekly sets, every muscle trained at least twice a week from 3 days, 12-30 sets a session. Volume is the same for beginners and advanced (see 4.0 item 7).
- Verification: 1883/1883 + 47/47, lint 0, build OK, stress 306 clients 0 violations (with the new fat and carb checks), journeys 6/6 no issues (with the new fat check), 10-client simulation 100%.

## 4. Open work (in priority order)

### 4.1 Goal choice and plain names — DONE in `653804c` (kept below for context)
Owner's words: in the case "client picked bulking but is too fat", there should be an intake answer like **"سيبها للكوتش يحدد الأفضل"**, and goal names must be **professional and easy for clients** — many clients will not understand "إعادة تكوين الجسم". Applies to the intake questions AND everything the client sees in the app.
Suggested approach (confirm with owner first, show proposed Arabic labels):
- Intake goal options with plain Arabic + one-line explanation, e.g. "نزول دهون", "بناء عضل", "نزول دهون مع شد وبناء عضل" (instead of إعادة تكوين), "الحفاظ على الوزن وتحسين اللياقة", and **"سيب الكوتش يحدد الأنسب"**.
- "Coach decides" → engine picks by body fat/BMI (the rule from `2972356`), plan flagged for the coach to confirm.
- Keep internal codes unchanged (`fat_loss`, `lean_bulk`, `recomposition`); change only labels. Search every place labels appear: `frontend/src/pages/FullIntakeForm.jsx`, `frontend/src/components/intake/IntakeAuditDetailModal.jsx` (GOALS_MAP), client app pages under `frontend/src/pages/ClientInteractiveApp/`, `mobile_app/lib` (labels only), and `goal_redirect.reason_ar` in `src/master-engine-v2/build-master-engine-v2.js`.
- Also decide: when the goal is redirected, should the plan wait for coach approval? (currently it just records the reason).

### 4.1b Naming work — DONE
- Coach screens aligned in `43592c3`; `mobile_app/lib` has no goal labels (searched, zero matches). Live swaps apply the diabetic potato limit (3c).

### 4.0 WHAT IS STILL OPEN (read this list first)
1. **Look at the new screens in a real browser** — intake form DONE (3d, 3e). Still to do, plus the web client swap window from 3e (needs the backend restarted on the latest code + owner sign-in): coach editor → nutrition tab "ملاحظات للكوتش قبل الاعتماد"; cardio picker (blocked options + reasons); manual exercise swap amber warning; client injuries/equipment now shown in the editor; intake form: goal cards (5 incl. "سيب الكوتش يحدد") and the daily-steps question; web client app food and exercise swap windows (now signed-in, filtered). Needs the dev server (`.claude/launch.json` / `npm.cmd run dev`) and a real coach + client login (the owner logs in; never enter passwords).
2. **Flutter app** — on hold by the owner's decision until the engine is clean. When resumed (needs the Flutter SDK + a device): display `item.note` (protein powder note), show the swap-food 409 `error`, verify swaps on a device.
3. **Production data audit**: must run on the VPS itself (see 3d): `node --env-file=.env scripts/audit-grown-cycles.mjs` (read-only). The owner is not technical — walk them through it or get server access. Repair only with backup + plan + owner approval.
4. **Extreme case** (130 kg, diabetes + kidney + liver, coeliac + nuts): balanced now (3254 kcal, fat 35%, oil ~20 g a meal); carbohydrate 52% (kidney cap) with the coach note; potatoes 245-260 g flagged (the diabetic 200 g limit has no other safe carbohydrate for coeliac). Needs the doctor anyway (kidney + liver).
5. **Swaps with no equivalent** (mobile): tuna (leanest protein), laban and milks (sugar vs protein), lupini (only snack of its kind). Adding foods of the same kind (sardine/mackerel, skyr, roasted chickpeas) to the swap list would give them swaps.
6. Potassium: the intake does not ask for a potassium result (the coach note asks for it). Optional: a lab field so the kidney limits become automatic (owner decision).
7. **Training volume by experience**: beginners and advanced get the same weekly sets (advanced only get 4 sets on heavy compounds). A possible next step: fewer sets for beginners in the first cycle and more (12-20) for advanced - owner/coach choice, not an error.
8. Branch `agx/full-simulation` must never be merged.

### 4.2 Verify everything together — DONE (see 3b); rerun after any engine change
- `node --env-file=.env scripts/simulate-long-journeys.mjs` and `scripts/simulate-clients.mjs`; expect no issues. Note: the journeys harness applies run-due's rule (ENDED only).
- Rebuild the 306-client stress idea if wanted (random intakes through `buildMasterEngineV2`, check allergies/GI/equipment/portions/macros/cardio).

### 4.3 Production data
- Run `node --env-file=<prod env> scripts/audit-grown-cycles.mjs` on production. If it finds plans with >5 weeks or >1 deload week, they were damaged by the pre-`789bd8e` bug: repair needs backup + plan + owner approval (CLAUDE.md rule 5).

### 4.4 Known smaller points
- Extreme case: see 4.0 item 4 (oil now capped at 20 g/meal with avocado/almonds; plates still large on 3 meals).
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
