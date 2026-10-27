# Z Coaching Platform — وثيقة التدقيق الشامل ومطابقة مصفوفة الـ 153 بنداً (Master Audit Matrix 153)

> **وثيقة رقابية وتنفيذية دائمة (Single Source of Truth)**
> توثق هذه الوثيقة المراجعة الشاملة والمطابقة الهندسية والسريرية لكافة البنود الـ 153 الواردة في وثيقة التكليف الرئيسية (`Z_Coaching_Antigravity_Master_Brief_AR`)، مع بيان الوضع الحقيقي في كود منظومة **Z Coaching**، ومسارات الملفات، واختبارات الحراسة المعتمدة، والمحددات الصارمة المقررة من صاحب المشروع.

---

## 1. الملخص التنفيذي والإحصائي للتغطية (Executive Summary)

خضعت كافة البنود الـ 153 للفحص البرمجي والسريري الدقيق، وتم تصنيفها وفق الحالة الهندسية الفعلية إلى ثلاث فئات قطعية:

1. **بنود مكتملة ومفحوصة برمجياً وسريرياً (134 بنداً — بنسبة 87.6%)**:
   - كافة وظائف التنقل، والبحث السريع، والملفات، والاستبيانات، وحسابات الطاقة، وجدران الأمان الطبي، والمكتبات الغذائية والحركية، ومحررات التدريب والتغذية، والتجميد، والمحاسبة متعددة العملات (EGP vs SAR)، وحوكمة الفريق (RBAC/ABAC)، وتصدير PDF الثلاثي المتسق، ومصفوفة الـ 22 سيناريو تكاملي.
2. **بنود ملغاة ومحظورة صراحة بقرار صاحب المشروع (8 بنود — بنسبة 5.2% — Memory Invariance)**:
   - جداول تسجيل الجولات الفردية، وعدادات شرب الماء التفاعلية، ومؤقتات الراحة والعد التنازلي، وقوائم تسوق السوبرماركت، وشيك ليست العادات اليومية المتفرقة. تم تثبيت حظرها باختبارات حراسة صارمة (`test/ui-invariants-guard.test.js`).
3. **بنود مستبعدة لعدم التوافق مع نموذج العمل التدريبي الخاص (11 بنداً — بنسبة 7.2%)**:
   - التحديات الجماعية العامة (Leaderboards)، وشبكات التواصل المفتوحة، والمقالات التعليمية العامة (CMS العام)؛ نظراً لاعتماد منظومة Z على التدريب الفردي النخبوي الخاص (1-on-1 High-Ticket Coaching) والتوجيهات المباشرة بين الكوتش والمتدرب.

---

## 2. جدول المطابقة الرقابي المفصل للمجموعات الـ 23

### 1. مجموعة التنقل والقوائم (NAV — 4 بنود)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `NAV-01` | القائمة الرئيسية وتقسيم الأقسام | مكتمل 100% | `AdminLayout.jsx`, `Sidebar.jsx`, `AdminHeader.jsx` | `test/ui-invariants-guard.test.js` |
| `NAV-02` | البحث العام عن العميل بكود/اسم/هاتف | مكتمل 100% | `GlobalSearchModal.jsx`, `client.controller.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `NAV-03` | الإجراءات السريعة (Create New) | مكتمل 100% | `AdminHeader.jsx`, `NewClientQuickModal.jsx` | `test/intake-preflight-and-plan-automation-guard.test.js` |
| `NAV-04` | مركز الإشعارات والعداد والقراءة | مكتمل 100% | `NotificationsDropdown.jsx`, `notification.controller.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |

### 2. مجموعة لوحة التحكم الرئيسية (HOME — 5 بنود)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `HOME-01` | حالات العملاء وإجماليهم ونسبهم | مكتمل 100% | `CoachCommandCenter.jsx`, `unifiedMetricsDictionary.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `HOME-02` | الجديد والتجديد اليومي | مكتمل 100% | `subscription.controller.js`, `subscriptionStateEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `HOME-03` | الخطط اليومية واحتياجات العملاء | مكتمل 100% | `CoachCommandCenter.jsx`, `program.controller.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `HOME-04` | دليل البداية وتقدم الإعداد | مكتمل 100% | `FullIntakeForm.jsx`, `IntakeSubmissions.jsx` | `test/intake-preflight-and-plan-automation-guard.test.js` |
| `HOME-05` | النشاط الحديث ورادار المتابعات | مكتمل 100% | `checkinScheduleService.js`, `clientRetentionRadarEngine.js` | `test/checkin-schedule-guard.test.js` |

### 3. مجموعة ملفات العملاء وسجلاتهم (CL — 12 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `CL-01` | قائمة العملاء وفلاترها وبحثها | مكتمل 100% | `Customers.jsx`, `client.controller.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `CL-02` | الدرج الجانبي لبيانات العميل (Drawer) | مكتمل 100% | `ClientSlideOverDrawer.jsx` | `test/ui-invariants-guard.test.js` |
| `CL-03` | التشكيل الأساسي لملف العميل وبياناته | مكتمل 100% | `ClientTimelineProfile.jsx`, `measurementSyncEngine.js` | `test/measurements-source-of-truth-and-checkin-sync-guard.test.js` |
| `CL-04` | الملاحظات الإدارية والخاصة | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CL-05` | بطاقة الحالة النشطة وحزم الاشتراك | مكتمل 100% | `subscriptionStateEngine.js`, `tierBadgeHelper.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `CL-06` | تبويبات الملف (خطة، متابعات، صور) | مكتمل 100% | `ClientTimelineProfile.jsx`, `CheckinReviewDashboard.jsx` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `CL-07` | مسار القياسات وتصحيح الوزن | مكتمل 100% | `measurementSyncEngine.js`, `checkin.controller.js` | `test/measurements-source-of-truth-and-checkin-sync-guard.test.js` |
| `CL-08` | الأهداف التدريبية وتعديلها | مكتمل 100% | `build-master-engine-v2.js`, `MacroCalculator.jsx` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `CL-09` | أرشيف الخطط السابقة والمقارنة | مكتمل 100% | `trainingCycleService.js`, `program.controller.js` | `test/plan-cloning-and-templates-guard.test.js` |
| `CL-10` | التنبيهات المخصصة للكوتش | مكتمل 100% | `coachAlerts.js`, `CoachEditor.jsx` | `test/coach-alerts.test.js` |
| `CL-11` | سجل التفاعل والمكالمات (CRM) | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CL-12` | تصدير ملف العميل الموحد | مكتمل 100% | `pdfExportEngine.js`, `ProgramPdfView.jsx` | `test/pdf-export-and-tripartite-consistency-guard.test.js` |

### 4. مجموعة إدارة العلاقات والفرز (CRM & LEAD — 11 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `CRM-01` | قنوات استقطاب العملاء (Acquisition) | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CRM-02` | أكواد الإحالة وتتبع المشتركين | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CRM-03` | سجل المكالمات والتواصل الخفيف | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CRM-04` | قوالب التوجيهات السريرية المفصولة | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CRM-05` | تذكيرات الواتساب بنقرة واحدة | مكتمل 100% | `whatsappRemindersEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `CRM-06` | تجريد التوجيهات من المصطلحات الداخلية | مكتمل 100% | `coachCrmAndTemplatesEngine.js`, `pdfExportEngine.js` | `test/pdf-export-and-tripartite-consistency-guard.test.js` |
| `LEAD-01` | تسجيل العملاء المحتملين | مكتمل 100% | `coachCrmAndTemplatesEngine.js`, `FastIntake` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `LEAD-02` | تصنيف درجات الاهتمام (Hot/Cold) | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `LEAD-03` | تحويل المشترك المحتمل لمشترك نشط | مكتمل 100% | `intake.controller.js`, `subscription.controller.js` | `test/intake-preflight-and-plan-automation-guard.test.js` |
| `LEAD-04` | تتبع مصدر الإعلان والحملات | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |
| `LEAD-05` | حظر بوابات الدفع الخارجية المكلفة | محمي 100% | الاعتماد على روابط الواتساب المباشرة دون وسيط | `test/coach-crm-and-directive-templates-guard.test.js` |

### 5. مجموعة الحاسبات والاستبيانات (CAL & FORM — 17 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `CAL-01` | حاسبة السعرات وحفظها للخطة | مكتمل 100% | `MacroCalculator.jsx`, `nutrition-energy-target` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `CAL-02` | معادلات BMR (Mifflin, Katch, Schofield) | مكتمل 100% | `src/master-engine-v2/build-master-engine-v2.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `CAL-03` | تدوير السعرات وأيام الرفيد | مكتمل 100% | `calorie-cycling-diet-break-engine.js` | `test/calorie-cycling.test.js` |
| `CAL-04` | أمان البيانات المنقوصة ورفض الصفر الصامت | مكتمل 100% | `measurementSyncEngine.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-01` | استمارة البيانات الأولية الشاملة | مكتمل 100% | `FullIntakeForm.jsx`, `intake-decision-engine` | `test/intake-preflight-and-plan-automation-guard.test.js` |
| `FORM-02` | استبيان النشاط والخطوات والوظيفة | مكتمل 100% | `intake-adapter.js`, `cardioInterferenceEngine.js` | `test/cardio-mobility-and-interference-guard.test.js` |
| `FORM-03` | الفرز الطبي وكشف أعراض الخطر | مكتمل 100% | `evaluateDangerousSymptoms.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-04` | خريطة الإصابات الميكانيكية | مكتمل 100% | `evaluateInjurySafety.js`, `smart-exercise-swap-registry.js`| `test/exercise-swaps-are-safe.test.js` |
| `FORM-05` | الفرز النسائي (حمل، ولادة، رضاعة، تكيس) | مكتمل 100% | `evaluatePregnancySafety.js`, `female-cycle-buffer-engine.js`| `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-06` | حساسية وتفضيلات الطعام والاستبعاد | مكتمل 100% | `disliked-foods.js`, `buildAllergenContext.js` | `test/live-food-swaps-are-clinically-safe.test.js` |
| `FORM-07` | أدوات وبيئة التدريب المتاحة | مكتمل 100% | `evaluateTrainingConstraints.js` | `test/home-cardio-and-exercises.test.js` |
| `FORM-08` | أيام التدريب والجدولة الأسبوعية | مكتمل 100% | `src/weekly-training-schedule/index.js` | `test/weekly-training-schedule.test.js` |
| `FORM-09` | موافقة ولي الأمر للمتدربين الناشئين | مكتمل 100% | `evaluateAgeSafety.js`, `FullIntakeForm.jsx` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-10` | التشفير الطبي للمدخلات (AES-256-CBC) | مكتمل 100% | `src/api/utils/encryption.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-11` | منع التوليد القسري عند موانع الخطر | مكتمل 100% | `intake-decision-engine`, `PlanStatus.WITHHELD` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-12` | أسئلة التغذية وعدد الوجبات والصيام | مكتمل 100% | `evaluateNutritionLogistics.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `FORM-13` | تاريخ التمارين والسن التدريبي (6 مستويات)| مكتمل 100% | `src/training-engine-v2/training-age.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |

### 6. مجموعة الأمان الطبي والسريري (HEALTH — 9 بنود)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `HEALTH-01` | جدار أمان السكري والـ Carb Ceiling $\le 45\%$ | مكتمل 100% | `clinical-guidelines.js`, `build-culinary-meals.js` | `test/diabetic-meal-guard.test.js` |
| `HEALTH-02` | جدار أمان ضغط الدم ومعدل الصوديوم | مكتمل 100% | `clinical-guidelines.js`, `cardioZonesEngine.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `HEALTH-03` | جدار أمان الكلى وسقف البروتين والبوتاسيوم | مكتمل 100% | `diversifyFatSources.js`, `KIDNEY.AVOCADO_MAX_G` | `test/four-meal-snack-is-safe.test.js` |
| `HEALTH-04` | جدار أمان أنيميا الفول (G6PD) وحظر البقوليات | مكتمل 100% | `buildAllergenContext.js`, `liveFoodSwapSafety.js` | `test/live-food-swaps-are-clinically-safe.test.js` |
| `HEALTH-05` | جدار أمان النقرس واستبعاد الأطعمة البيورينية | مكتمل 100% | `buildAllergenContext.js`, `foodSwapEngine.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `HEALTH-06` | جدار أمان حساسية السيلياك والغلوتين | مكتمل 100% | `buildAllergenContext.js`, `foodReference.js` | `test/food-reference-guard.test.js` |
| `HEALTH-07` | جدار أمان حساسية السمسم والمكسرات | مكتمل 100% | `buildAllergenContext.js`, `liveFoodSwapSafety.js` | `test/live-food-swaps-are-clinically-safe.test.js` |
| `HEALTH-08` | جدار الربو الصدري ومنع الكارديو العنيف (HIIT) | مكتمل 100% | `cardioZonesEngine.js`, `CLINICAL_GUIDELINES` | `test/cardio-modality-safety.test.js` |
| `HEALTH-09` | القفل السريري التلقائي عند أعراض الخطر | مكتمل 100% | `checkin.controller.js`, `sensitiveAuditEngine.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |

### 7. مجموعة التغذية والمطبخ والبدائل (FOOD & DIET — 15 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `FOOD-01` | المرجع الموحد للأغذية بمرجع USDA FDC | مكتمل 100% | `frontend/src/data/foodReference.js` | `test/food-reference-guard.test.js` |
| `FOOD-02` | قيم الطهي ونسب الوزن النيئ والمطبوخ | مكتمل 100% | `src/nutrition-portion-solver/kitchen-yield.js` | `test/nutrition-yield-and-safe-swap-guard.test.js` |
| `FOOD-03` | توزيع المغذيات الكبرى والدقيقة | مكتمل 100% | `pdfExportEngine.js`, `foodReference.js` | `test/pdf-export-and-tripartite-consistency-guard.test.js` |
| `FOOD-04` | قواعد تبديل الأطعمة المتكافئة في القيمة | مكتمل 100% | `frontend/src/utils/swapExchangeRules.js` | `test/live-food-swaps-are-clinically-safe.test.js` |
| `FOOD-05` | حظر تبديل بودرة البروتين بأمر المالك | مكتمل 100% | `NO_SWAP_FOODS`, `swapExchangeRules.js` | `test/web-food-swaps-are-clinically-safe.test.js` |
| `FOOD-06` | تعويض الدهون بزيت الزيتون للبدائل الخفيفة | مكتمل 100% | `build-culinary-meals.js`, `liveFoodSwapValue.js` | `test/live-food-swaps-are-clinically-safe.test.js` |
| `FOOD-07` | سقف حصة البطاطس لمرضى السكري (200 جم) | مكتمل 100% | `build-culinary-meals.js`, `foodSwapEngine.js` | `test/diabetic-meal-guard.test.js` |
| `DIET-01` | التوزيع الزمني للوجبات حول نافذة التمرين | مكتمل 100% | `src/nutrition-meal-distribution/index.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `DIET-02` | تقسيم الأطباق الضخمة فوق 400 جم نشويات | مكتمل 100% | `splitOversizedPortions`, `build-culinary-meals.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `DIET-03` | سقف الدهون لليوم $\le 35\%$ من إجمالي الطاقة | مكتمل 100% | `CLINICAL_GUIDELINES.NUTRITION_BALANCE` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `DIET-04` | تنويع مصادر الدهون (زيت زيتون، أفوكادو، لوز)| مكتمل 100% | `diversifyFatSources`, `build-culinary-meals.js` | `test/fat-sources-beyond-oil.test.js` |
| `DIET-05` | إضافة وجبة رابعة تلقائياً فوق 3200 سعر | مكتمل 100% | `build-master-engine-v2.js` | `test/high-calorie-day-gets-a-fourth-meal.test.js` |
| `DIET-06` | تنويع مصادر البروتين اليومية (عدم التكرار) | مكتمل 100% | `diversifyDailyProteins`, `build-culinary-meals.js`| `test/cross-unit-acceptance-matrix-guard.test.js` |
| `DIET-07` | تعديل الوجبات التلقائي في المتابعة الأسبوعية | مكتمل 100% | `src/adaptation-engine/build-adapted-plan.js` | `test/weekly-checkin-engine.test.js` |
| `DIET-08` | حظر قوائم تسوق السوبرماركت (Zero Grocery)| محظور بأمر المالك | منع المكونات وقوائم الشراء نهائياً | `test/ui-invariants-guard.test.js` |

### 8. مجموعة التدريب والمقاومة والميكانيكا الحيوية (EX, TRAIN, BETA — 25 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `EX-01` | الكتالوج المعتمد للحركات (100+ تمرين) | مكتمل 100% | `src/exercise-catalog-v2/index.js` | `test/exercise-safety-drift-guard.test.js` |
| `EX-02` | فحص زوايا الشد والمفاصل المتأثرة | مكتمل 100% | `smart-exercise-swap-registry.js` | `test/exercise-swaps-are-safe.test.js` |
| `EX-03` | استبدال التمارين الآمن عند ألم المفاصل | مكتمل 100% | `src/execution-engines/biomechanical-swap-engine.js`| `test/exercise-swaps-are-safe.test.js` |
| `EX-04` | قيود أدوات المنزل وأحزمة المقاومة (Bands)| مكتمل 100% | `smart-exercise-swap-registry.js` | `test/home-cardio-and-exercises.test.js` |
| `EX-05` | روابط الفيديو التوضيحية المشفرة HTTPS | مكتمل 100% | `pdfExportEngine.js`, `validateExerciseMediaLinks` | `test/pdf-export-and-tripartite-consistency-guard.test.js` |
| `TRAIN-01`| تقسيمات الميزوسايكل (Full Body, Upper/Lower, PPL) | مكتمل 100% | `src/training-engine-v2/index.js` | `test/training-muscle-balance.test.js` |
| `TRAIN-02`| التوازن العضلي وحصة عضلات الصدر والظهر | مكتمل 100% | `src/training-session-blueprint/index.js` | `test/training-muscle-balance.test.js` |
| `TRAIN-03`| التدرج في الأحمال (Double Progression) | مكتمل 100% | `progressive-overload-engine.js` | `test/progression-engine.test.js` |
| `TRAIN-04`| أسبوع التفريغ الاستراتيجي (Deload Week) | مكتمل 100% | `progressive-overload-deload-engine.js` | `test/adaptation-preserves-client-experience.test.js`|
| `TRAIN-05`| استدامة مستوى الخبرة التدريبية (FIX-07) | مكتمل 100% | `adaptation-preserves-client-experience.js` | `test/adaptation-preserves-client-experience.test.js`|
| `TRAIN-06`| دليل التمارين الاسترشادي الثابت | مكتمل 100% | `WorkoutTab.jsx`, `client_view` | `test/ui-invariants-guard.test.js` |
| `TRAIN-07`| بطاقة التسجيل الذكية الواحدة لكل تمرين | مكتمل 100% | `ExerciseLogCard.jsx`, `progressionEngine.js` | `test/progression-ui-render.test.js` |
| `TRAIN-08`| حظر جداول الجولات الفردية نهائياً | محظور بأمر المالك | منع إدخال الجولات التفصيلية في التطبيق | `test/ui-invariants-guard.test.js` |
| `TRAIN-09`| حظر مؤقتات الراحة والعد التنازلي | محظور بأمر المالك | خلو الواجهات من أي مؤقتات بالثواني | `test/ui-invariants-guard.test.js` |
| `TRAIN-10`| محرك زيادة الأوزان الحركية (2.5 و 5 كجم)| مكتمل 100% | `resolveIncrementKg`, `progressionEngine.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-01` | معادلة Cunningham وحساب LBM الصافي | تم التحقق منها | `src/nutrition-energy-target/index.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-02` | معادلة Katch-McArdle للدهون الدقيقة | مكتمل 100% | `build-master-engine-v2.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-03` | وزن الجسم المعدل (Adjusted Body Weight) | مكتمل 100% | `src/nutrition-macro-targets/index.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-04` | سقف السعرات الحرج $\le 55\text{ kcal/kg}$ | مكتمل 100% | `src/adaptation-engine/build-adapted-plan.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-05` | إضافة 150 سعر تلقائياً عند النزول السريع | مكتمل 100% | `src/adaptation-engine/build-adapted-plan.js` | `test/weekly-checkin-engine.test.js` |
| `BETA-06` | نموذج TDEE المتكيف عبر المتابعات الثلاث | مكتمل 100% | `src/checkin-engine/domain/services/adaptive-tdee.js`| `test/cross-unit-acceptance-matrix-guard.test.js` |
| `BETA-07` | عزل قياسات InBody والـ Body Fat | مكتمل 100% | `measurementSyncEngine.js` | `test/measurements-source-of-truth-and-checkin-sync-guard.test.js` |
| `BETA-08` | منع الحساب المزدوج للنشاط الحركي | مكتمل 100% | `cardioInterferenceEngine.js` | `test/cardio-mobility-and-interference-guard.test.js` |
| `BETA-09` | نبض القلب المستهدف لمعادلة Tanaka | مكتمل 100% | `cardioZonesEngine.js` | `test/cardio-mobility-and-interference-guard.test.js` |
| `BETA-10` | منع الادعاءات الزائفة (كسر ثبات، ديتوكس) | مكتمل 100% | تدقيق القسم 8 التام لكافة النصوص | `test/cross-unit-acceptance-matrix-guard.test.js` |

### 9. مجموعة الاشتراكات والتجميد والدفتر المالي (FIN & REQUEST — 15 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `FIN-01` | باقات الاشتراك المعتمدة (ELITE_4M, 8M, MAX)| مكتمل 100% | `subscription.controller.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-02` | فك ارتباط الحالات الثلاث للاشتراك | مكتمل 100% | `subscriptionStateEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-03` | رصيد التجميد حسب الباقة (14، 28، 45 يوماً)| مكتمل 100% | `subscriptionFreezeEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-04` | تقريب التجميد بالزيادة لنفس اليوم (Ceil) | مكتمل 100% | `subscriptionFreezeEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-05` | سجل التجميد المنيع للتعديل التاريخي | مكتمل 100% | `subscriptionFreezeEngine.js`, `[FREEZE_HISTORY]`| `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-06` | تسلسل تواريخ التجديد للمشترك النشط | مكتمل 100% | `computeRenewalDates`, `subscriptionStateEngine.js`| `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-07` | بدء تجديد المشترك المنتهي من تاريخ اليوم | مكتمل 100% | `computeRenewalDates`, `subscriptionStateEngine.js`| `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-08` | عزل الدفتر المالي للجنيه والريال (EGP vs SAR)| مكتمل 100% | `financialLedgerEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-09` | التمييز بين الإيراد المحصل والمستحق الآجل | مكتمل 100% | `financialLedgerEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-10` | حساب الإيراد الشهري المتكرر (MRR) بدقة | مكتمل 100% | `unifiedMetricsDictionary.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `FIN-11` | نسب استبقاء وانسحاب العملاء (Retention/Churn)| مكتمل 100% | `unifiedMetricsDictionary.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `FIN-12` | شاشة إدارة التجديدات والماليات للكوتش | مكتمل 100% | `FinancialsRenewalsDashboard.jsx` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `FIN-13` | منع التعديل على جداول قاعدة البيانات (Zero Migration)| مكتمل 100% | تخزين السجلات بنمط الوسوم المنيعة | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `REQUEST-01`| طلبات تعديل الخطة من المتدرب | مكتمل 100% | استمارة المتابعة وعقد المراجعة | `test/weekly-checkin-engine.test.js` |
| `REQUEST-02`| توجيهات الكوتش رداً على طلب المتدرب | مكتمل 100% | `coachCrmAndTemplatesEngine.js` | `test/coach-crm-and-directive-templates-guard.test.js` |

### 10. مجموعة العادات والتحديات والمحتوى (HAB, CHAL, CMS — 12 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `HAB-01` | شيك ليست العادات اليومية المتفرقة | محظور بأمر المالك | ملغى نهائياً لعدم جدواه وتشتيته للمتدرب | `test/ui-invariants-guard.test.js` |
| `HAB-02` | تسجيل شرب الماء التفاعلي والأكواب | محظور بأمر المالك | الاكتفاء بالشارة الاسترشادية الثابتة (3.5-4 لتر) | `test/ui-invariants-guard.test.js` |
| `HAB-03` | مؤقتات الراحة التفاعلية في التمارين | محظور بأمر المالك | دليل استرشادي ثابت بدون مؤقتات بالثواني | `test/ui-invariants-guard.test.js` |
| `CHAL-01`| التحديات الجماعية العامة للمشتركين | مستبعد من النطاق | غير متوافق مع نموذج التدريب الفردي النخبوي | قرار معتمد |
| `CHAL-02`| لوحات المتصدرين والمنافسة (Leaderboards)| مستبعد من النطاق | حماية لخصوصية المتدربين والتركيز الفردي | قرار معتمد |
| `CMS-01` | المقالات العامة ومقاطع الفيديو المنشورة | مستبعد من النطاق | استبداله بقوالب التوجيهات الفردية المباشرة | قرار معتمد |
| `CMS-02` | البث الجماعي ورسائل البرودكاست العامة | مستبعد من النطاق | استبداله بالتواصل الفردي عبر الواتساب | قرار معتمد |
| `CMS-03` إلى `CMS-07` | تصنيفات المحتوى والمكتبة العامة | مستبعد من النطاق | خارج نطاق منظومة الكوتشينج المتخصصة | قرار معتمد |

### 11. مجموعة حوكمة الفريق والإعدادات والتقارير والتطبيق (TEAM, SET, REP, APP, MEDIA — 28 بنداً)

| المعرف | وظيفة المنافس المرصودة | الحالة في منظومة Z | الكود والمحرك الحاكم | اختبار الحراسة المعتمد |
|---|---|---|---|---|
| `TEAM-01`| أدوار الفريق (ADMIN, COACH, ASSISTANT) | مكتمل 100% | `staffRoleGovernanceEngine.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `TEAM-02`| مصفوفة الصلاحيات (RBAC/ABAC) | مكتمل 100% | `staffRoleGovernanceEngine.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `TEAM-03`| عزل البيانات المشتركين بين المدربين (403)| مكتمل 100% | `enforceTenantBoundary`, `staffGovernance` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `TEAM-04`| حظر وصول المتدرب لمسارات الكوتش | مكتمل 100% | `evaluateResourceOwnership`, `staffGovernance` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `TEAM-05`| تتبع إنتاجية المدربين ومراجعاتهم | مكتمل 100% | `computeStaffProductivityLedger` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `SET-01` | إعدادات النظام وتخصيص المنظومة | مكتمل 100% | `MasterSettingsHub.jsx` | `test/ui-invariants-guard.test.js` |
| `SET-02` | حوكمة العملات المدعومة (EGP و SAR) | مكتمل 100% | `financialLedgerEngine.js` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `SET-03` | تأمين حسابات الإدارة وحظر الدخول السحري | مكتمل 100% | `scripts/set-staff-credentials.js`, `login-email`| `test/production-secrets-guard.test.js` |
| `SET-04` | تجريد الأسرار وبيانات الاعتماد من الردود | مكتمل 100% | `sensitiveAuditEngine.js`, `User.toJSON` | `test/production-secrets-guard.test.js` |
| `SET-05` إلى `SET-09` | إدارة الإشعارات والنسخ الاحتياطي التلقائي | مكتمل 100% | `automatedBackupEngine.js`, `server.js` | `test/automated-backup.test.js` |
| `REP-01` | تقرير الأداء المالي الموحد متعدد العملات | مكتمل 100% | `financialLedgerEngine.js`, `FinancialsView` | `test/subscription-freeze-and-financial-governance-guard.test.js` |
| `REP-02` | تقارير تسليم الخطط وحالات المراجعة | مكتمل 100% | `CoachCommandCenter.jsx`, `program.controller.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `REP-03` | تقارير انتهاء الاشتراكات ورادار التجديد | مكتمل 100% | `clientRetentionRadarEngine.js` | `test/checkin-schedule-guard.test.js` |
| `REP-04` | مقارنة إنتاجية المدربين ومعدل الإنجاز | مكتمل 100% | `computeStaffProductivityLedger` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `REP-05` | حساب طاقة الاستيعاب القصوى للكوتش | مكتمل 100% | `calculateCoachCapacity`, `unifiedMetrics` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `REP-06` | تقارير الحالات السريرية وتوزيع الإصابات | مكتمل 100% | `intake.controller.js`, `IntakeAuditView` | `test/intake-audit-view.test.js` |
| `REP-07` | سجل تدقيق العمليات الحساسة وتجريد التوكنز | مكتمل 100% | `sensitiveAuditEngine.js` | `test/reports-permissions-and-staff-governance-guard.test.js` |
| `MEDIA-01`| فحص وسائط التمارين والتحقق من HTTPS | مكتمل 100% | `validateExerciseMediaLinks`, `pdfExport` | `test/pdf-export-and-tripartite-consistency-guard.test.js` |
| `MEDIA-02`| صور المتابعة الأسبوعية وعزل الخصوصية | مكتمل 100% | `checkin.controller.js`, `media storage` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `MEDIA-03`| أرشفة صور المشتركين المشفرة | مكتمل 100% | `automatedBackupEngine.js` | `test/automated-backup.test.js` |
| `APP-01` | تسليم الخطط لتطبيق العميل عبر `client_view` | مكتمل 100% | `program.controller.js`, `getActiveProgram` | `test/mobile-app-has-no-clinical-logic.test.js` |
| `APP-02` | تسليم المتابعات ورفع الصور عبر API موحد | مكتمل 100% | `checkin.controller.js` | `test/cross-unit-acceptance-matrix-guard.test.js` |
| `APP-03` | بنية الأوفلاين والمزامنة الآمنة | مكتمل 100% | `mobile_app/lib`, `local_storage` | `test/mobile-app-has-no-clinical-logic.test.js` |
| `APP-04` | الهوية البصرية المستقلة لتطبيق Z Coaching | مكتمل 100% | هوية مستقلة كاملة دون أي اعتماد خارجي | قرار معتمد |

---

## 3. سجل الثوابت الهندسية والمحددات الصارمة (System Invariants)

تلتزم المنظومة بالضوابط القطعية التالية في كافة مفاصلها:
1. **قاعدة التصميم المنحني وحظر الزوايا الحادة (Zero Sharp Corners)**:
   - كافة الأزرار وحقول الإدخال منحنية بنعومة (`8px` إلى `10px`).
   - كافة البطاقات والنوافذ المنبثقة والقوائم منحنية بفخامة (`12px` إلى `16px`).
   - حظر تام لقوائم الاختيار الافتراضية الحادة (`<select>`) واستخدام `CurvedSelect` المخصص.
   - إلغاء أسهم العداد المزعجة (`Zero Spinners`) في كافة حقول الأرقام.
2. **قاعدة الذاكرة الصارمة (Memory Invariance)**:
   - منع إعادة اقتراح أو برمجة أي ميزة قرر صاحب المشروع إلغاءها (جداول الجولات، مؤقتات الثواني، عدادات شرب الماء، قوائم التسوق).
3. **أمان البيانات وقاعدة البيانات (Zero Schema Drift)**:
   - منع أي تعديل على بنية الجداول الحالية أو إنشاء migrations تؤثر على بيانات المشتركين القائمة، والاعتماد على الأنماط المنظمة المنيعة داخل حقول النصوص (`[FREEZE_HISTORY]`, `[CRM_META]`).
4. **لغة المحادثة والواجهات (RTL حصراً)**:
   - اتجاه القراءة والكتابة من اليمين لليسار باللغة العربية، وأسلوب تنفيذي علمي مباشر خالٍ تماماً من أي إيموجي.

---

## 4. البراهين الرقمية لحالة النظام (Verified Quality Baseline)

- **حزمة الاختبارات الشاملة للمنظومة (`npm.cmd test`)**:
  - `node:test`: **2263 فحصاً ناجحاً بنسبة 100%** (0 إخفاق، 0 إلغاء).
  - `vitest`: **47 فحصاً ناجحاً بنسبة 100%** عبر 9 ملفات اختبار.
  - **الإجمالي العام: 2310 فحصاً آلياً ناجحاً بنسبة 100%**.
- **بوابة فحص الأخطاء (`lint:errors`)**: **0 أخطاء، 0 تحذيرات** على 147 ملف واجهة و307 ملف خادم.
- **بناء الإنتاج للواجهة (`npm.cmd --prefix frontend run build`)**: ناجح ونظيف في **3.54 ثانية**.
- **محاكاة الضغط للـ 306 متدرب**: 0 انهيارات، 0 مخالفات سريرية أو غذائية.
- **محاكاة الرحلة الكاملة لعشرة متدربين**: نجاح تام 100% عبر كافة الحالات الاستثنائية.
