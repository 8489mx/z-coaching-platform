# Z Coaching — Client Intake Decision Engine V1

محرك Domain مستقل وحتمي يحوّل بيانات تأسيس العميل المنظمة إلى قرار أولي آمن للتغذية والتدريب والكارديو. لا يستخدم AI Runtime، ولا يتصل بقاعدة بيانات أو API، ولا يولّد سعرات فعلية أو وجبات أو تمارين.

## النطاق والقرار التقني

المستودع كان فارغًا، لذلك نُفّذ المحرك بـJavaScript ESM وJSDoc على Node.js 22، باستخدام `node:test` فقط ومن دون أي dependency خارجية. هذا يحقق ثلاثة أهداف:

- التشغيل المباشر بلا build step أو framework.
- سهولة دمجه لاحقًا داخل API أو worker أو تطبيق متعدد الكوتشات.
- بقاء كل Rule دالة نقية قابلة للاختبار منفردة.

المحرك Stateless ولا يحفظ `tenantId`. الـMulti-Tenancy لاحقًا مسؤولية طبقة التطبيق أو طبقة سياسة تُحقن في المحرك، وليس قاعدة بيانات داخل الـDomain.

## Architecture

```text
JSON / DTO + trusted evaluation context
   │
   ▼
validateIntake ── invalid structure ──► IntakeValidationError
   │
   ▼
Safety Rules ─► Nutrition Rules ─► Training Rules ─► Cardio Rules
   │                    │                  │               │
   └────────────────────┴──────────────────┴───────────────┘
                            │
                            ▼
               deterministic reducer + status priority
                            │
                            ▼
                     IntakeDecision output
```

بنية الملفات:

```text
src/intake-decision-engine/
  domain/
    contracts.js             # DTO/output JSDoc contracts
    enums.js                 # runtime enums
    rule-result.js           # finding aggregation/status reducer
  validation/
    intake-validation-error.js
    validate-intake.js
  rules/
    safety-rules.js
    nutrition-rules.js
    training-rules.js
    cardio-rules.js
  intake-decision-engine.js  # orchestration only
  index.js                   # public API
test/
examples/
```

لا يوجد accumulator قابل للتعديل تشترك فيه القواعد. كل evaluator يعيد Findings منظمة، ثم يجمعها المحرك ويحذف التكرار ويرتبها ترتيبًا ثابتًا. المدخل لا يُعدّل.

## Public API

```js
import {
  IntakeDecisionEngine,
  IntakeValidationError,
  evaluateIntake,
} from "z-coaching-intake-decision-engine";

const evaluationContext = { assessmentDate: "2026-07-14" }; // server-owned
const output = evaluateIntake(input, evaluationContext);

// أو
const engine = new IntakeDecisionEngine(evaluationContext);
const sameOutput = engine.evaluate(input);
```

كل Rule مُصدّرة أيضًا من `index.js` للاختبار أو لاستبدال سياسة مجال واحدة لاحقًا.

## Validation مقابل `BLOCKED`

هناك فصل مقصود بين خطأ التكامل وحالة Domain:

- DTO غير صالح، مثل نوع خاطئ، Enum غير معروف، تاريخ غير صالح، عمر لا يطابق تاريخ الميلاد، رقم خارج المجال، أو قسم أساسي مفقود: يرمي `IntakeValidationError` وبداخله `issues: [{ path, code, message }]`. لا تعمل القواعد على بيانات مشوهة.
- DTO صالح لكن به إجابة منظمة `UNKNOWN` تمنع تقييم بوابة أمان، أو قاصر بلا موافقة ولي أمر: يعيد قرارًا بحالة `BLOCKED` مع الأسباب والبيانات غير المؤكدة.

لا يوجد coercion صامت: القيمة النصية `"3"` لا تُقبل بدل الرقم `3`. القائمة الفارغة `[]` تعني "لا يوجد شيء مُبلّغ"، أما غياب القائمة فيُعد خطأ schema. كما تُرفض الحقول غير المعروفة بدل إسقاط معلومة طبية بصمت.

تاريخ `assessmentDate` مطلوب داخل `EvaluationContext` المملوك لطبقة السيرفر، وليس داخل بيانات الفورم. بذلك يبقى حساب العمر حتميًا وقابلًا لإعادة التشغيل، ولا يستطيع العميل تغيير التاريخ المرجعي لتجاوز مسار القاصر.

## حالات الخطة وأولويتها

| الحالة | متى تستخدم |
|---|---|
| `READY_FOR_DRAFT` | بيانات صالحة، مسار بالغ، ولا توجد مراجعة معلقة. يمكن أن توجد Hard Constraints مصنفة مثل حساسية مؤكدة أو منع حركة معروف. |
| `COACH_REVIEW_REQUIRED` | قرار مهني أو تصنيف بشري غير طبي ما زال مطلوبًا: حساسية غذائية غير مؤكدة، نص حر، حالة صحية أخرى كتبها العميل، دواء مبلّغ، تاريخ اضطراب أكل، عدم تحمّل شديد/مجهول، إصابة مستقرة، أو قاصر لديه موافقة. |
| `MEDICAL_REVIEW_REQUIRED` | عرض خطر، حالة صحية غير مستقرة/مجهولة الاستقرار، تعليمات طبيب غير مصنفة، ألم إصابة من 7 إلى 10، إصابة تمنع الحركة/تتدهور/بها تنميل أو ضعف، أو حالة حمل/احتمال حمل/رضاعة وفق سياسة V1 المحافظة. |
| `BLOCKED` | بوابة أهلية/أمان لا يمكن اجتيازها رغم أن DTO صالح، مثل قاصر بلا موافقة أو إجابة أمان حرجة `UNKNOWN`. |

أولوية التعارض:

```text
MEDICAL_REVIEW_REQUIRED > BLOCKED > COACH_REVIEW_REQUIRED > READY_FOR_DRAFT
```

لذلك ألم الصدر لا يختفي إذا كان العميل أيضًا قاصرًا بلا موافقة. الحالة الطبية تفوز، مع الاحتفاظ بسبب الحظر وكافة Findings الأخرى.

## عقد الإدخال

الإدخال يستخدم `camelCase`، والمخرج العام يحافظ على `snake_case` المطلوب في المواصفات. كل الوحدات صريحة في اسم الحقل. يستقبل الاستدعاء أيضًا `EvaluationContext` موثوقًا منفصلًا.

| القسم | الحقول المدعومة |
|---|---|
| `EvaluationContext.assessmentDate` | تاريخ ISO مملوك للسيرفر لحساب العمر، وليس جزءًا من Client DTO. |
| `personal` | `dateOfBirth`, `ageYears`, `sex`, رمز دولة ISO alpha-2، `guardianConsent`. تاريخ الميلاد هو المرجع ويجب أن يطابق العمر المبلّغ. |
| `goals` | الهدف الأساسي وهدف التدريب الإضافي. الهدف يُسجّل ولا يفرض اتجاه سعرات أو كارديو تلقائيًا. |
| `body` | الطول، الوزن، محيط الوسط الاختياري، اتجاه الوزن في آخر 4–6 أسابيع، جودة القياسات، وجود صور البداية. |
| `lifestyle` | الحركة اليومية، نوع جدول العمل، أيام العمل البدني، متوسط ساعات وجودة النوم، مستوى الضغط. |
| `medical` | الحالات الصحية بعقد `conditionCode`/`otherConditionText` حصري واستقرارها، screening الأعراض الخطرة بـ`YES/NO/UNKNOWN`، الأدوية، تاريخ اضطرابات الأكل، الحمل/الرضاعة، الدورة، والنصوص غير المصنفة. |
| `nutrition` | الحساسية بعقد `{substance, medicallyConfirmed}`، المنع الطبي ذو `instruction/source` مصنفين ومعرّفات غذائية canonical، الأطعمة غير المرغوبة، عدم التحمل، المشاكل الهضمية، عدد الوجبات، فترات تعذر الأكل، الميزانية، الحفظ والتسخين. |
| `training` | المكان، الأدوات وقدرتها، `maxDaysPerWeek` و`preferredDaysPerWeek`، نوع توافر جدول التدريب، `availableTrainingDays` و`unavailableTrainingDays` من `DayOfWeek`، مدة الجلسة، الخبرة، آخر 4 أسابيع، `movementImpact` للإصابات، والمنع الطبي ذو حركة/تعليمات/مصدر من Enums. |
| `cardio` | الرياضات الإضافية وأيامها ومدتها وشدتها، الخطوات، القدرة على المشي 10 دقائق بسهولة، الحد الأقصى للجلسات والمدة. |
| `unclassifiedNotes` | نصوص حرة تُحفظ كـReview Flags ولا يجري تفسيرها. |

العقد التفصيلي موجود في `domain/contracts.js`، والقيم المسموحة موجودة في `domain/enums.js`. مثال مكتمل في `examples/full-intake.json`، وسياق التقييم المنفصل في `examples/evaluation-context.json`.

### عقد الحالات الصحية المنظمة

كل عنصر في `medical.conditions` يستخدم مسارًا واحدًا فقط. لا يقبل الحقل القديم `name`، ولا يحاول المحرك فهم أسماء الأمراض المكتوبة بحرية.

الحالة المنظمة:

```json
{
  "conditionCode": "THYROID_CONDITION",
  "otherConditionText": null,
  "stability": "STABLE",
  "physicianInstructions": [],
  "unclassifiedInstructionsText": null
}
```

الحالة الأخرى التي كتبها العميل:

```json
{
  "conditionCode": null,
  "otherConditionText": "النص الأصلي الذي كتبه العميل",
  "stability": "STABLE",
  "physicianInstructions": [],
  "unclassifiedInstructionsText": null
}
```

قيم `MedicalConditionCode` النهائية هي:

```text
DIABETES
INSULIN_RESISTANCE
HYPERTENSION
HEART_CONDITION
KIDNEY_CONDITION
LIVER_CONDITION
THYROID_CONDITION
ANEMIA
ASTHMA_OR_RESPIRATORY_CONDITION
DIAGNOSED_DIGESTIVE_CONDITION
PCOS
```

يلزم حضور الحقلين صراحة: `conditionCode` معروف مع `otherConditionText=null` أو `""`، أو `conditionCode=null` مع نص غير فارغ. وجود المسارين معًا، غيابهما معًا، حذف أحد حقلي العقد، قيمة Enum غير معروفة، النص الفارغ/المكوّن من مسافات في المسار الحر، والحقل القديم `name` كلها أخطاء Validation. يبقى النص الأصلي بلا trim أو mapping داخل الإدخال، ويشير Review Flag `UNCLASSIFIED_MEDICAL_CONDITION` إلى مساره الدقيق. الحالة الحرة المستقرة ترفع الحالة إلى `COACH_REVIEW_REQUIRED` من دون إنشاء Hard Constraint؛ أما `UNSTABLE/UNKNOWN` وتعليمات الطبيب الحرة فتحتفظ بمسار المراجعة الطبية الأعلى أولوية.

مثال إصابة عند عتبة الألم الطبية:

```json
{
  "area": "KNEE",
  "painLevel": 7,
  "movementImpact": "LIMITS",
  "worsening": false,
  "numbnessOrWeakness": false,
  "affectedMovements": ["RUNNING"],
  "medicalRestrictions": []
}
```

هذا المثال ينتج `MEDICAL_REVIEW_REQUIRED` و`HIGH_PAIN_REQUIRES_MEDICAL_REVIEW` من دون تشخيص سبب الألم.

### عقد توافر جدول التدريب

جدول العمل وجدول التدريب مدخلان مستقلان. `lifestyle.workSchedule` يظل عاملًا في تقدير الضغط اليومي والاستشفاء، لكنه لا يحدد `schedule_mode`. الحقول المنظمة داخل `training` هي:

| الحقل | العقد |
|---|---|
| `trainingScheduleAvailabilityType` | قيمة إلزامية من `TrainingScheduleAvailabilityType`: `FIXED_AVAILABLE_DAYS`, `FIXED_UNAVAILABLE_DAYS`, `VARIABLE`, `FLEXIBLE`. |
| `availableTrainingDays` | قائمة من `DayOfWeek`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`. |
| `unavailableTrainingDays` | قائمة من نفس `DayOfWeek` للأيام التي لا يمكن التدريب فيها. |
| `maxDaysPerWeek` | عدد صحيح من 2 إلى 6 يضع سقف السعة الأسبوعية. |
| `preferredDaysPerWeek` | عدد صحيح من 2 إلى `maxDaysPerWeek`؛ هو تفضيل لا يتجاوز القيود الأعلى أولوية. |

| `TrainingScheduleAvailabilityType` | المعنى | قواعد الأيام | `schedule_mode` |
|---|---|---|---|
| `FIXED_AVAILABLE_DAYS` | العميل حدّد الأيام التي يستطيع التدريب فيها. | `availableTrainingDays` إلزامية بيومان على الأقل، و`unavailableTrainingDays` فارغة. | `FIXED_DAYS` |
| `FIXED_UNAVAILABLE_DAYS` | العميل حدّد الأيام المستحيل التدريب فيها. | `unavailableTrainingDays` إلزامية وغير فارغة، و`availableTrainingDays` فارغة؛ ويجب أن يتبقى يومان متاحان على الأقل. | `FIXED_DAYS` |
| `VARIABLE` | توافر التدريب نفسه يتغير من أسبوع إلى آخر. | قائمتا الأيام الثابتة فارغتان، وتُنفذ الجلسات بالترتيب A ثم B ثم C دون ربطها بأيام أسبوع ثابتة. | `SESSION_SEQUENCE` |
| `FLEXIBLE` | العميل مرن ويمكن للنظام أو الكوتش اختيار التوزيع الأسبوعي الأنسب. | قائمتا الأيام الثابتة فارغتان، وتُعد أيام الأسبوع كلها قابلة للاختيار. | `FIXED_DAYS` |

تُرفض الأيام المكررة أو غير المعروفة، وتُرفض مشاركة اليوم نفسه بين قائمتي الأيام. كما تُرفض أي تركيبة قد تنتج أقل من يومي تدريب؛ لذلك لا يعود قرار ناجح بحالة `READY_FOR_DRAFT` مع `recommended_days` أقل من 2.

#### مثال `FLEXIBLE`

هذا مقتطف الحقول المؤثرة في الجدولة؛ المثال التنفيذي الكامل موجود في `examples/full-intake.json`. وجود جدول عمل متغير هنا لا يغيّر نمط التدريب المرن:

```json
{
  "lifestyle": {
    "workSchedule": {
      "type": "VARIABLE",
      "physicallyDemandingDays": []
    }
  },
  "training": {
    "maxDaysPerWeek": 4,
    "preferredDaysPerWeek": 3,
    "trainingScheduleAvailabilityType": "FLEXIBLE",
    "availableTrainingDays": [],
    "unavailableTrainingDays": []
  }
}
```

مقتطف المخرج والسبب المرتبط بالجدولة:

```json
{
  "training_decision": {
    "recommended_days": 3,
    "schedule_mode": "FIXED_DAYS",
    "reasons": [
      {
        "code": "FLEXIBLE_TRAINING_SCHEDULE",
        "scope": "TRAINING",
        "message": "Client is flexible; the system may select the best weekly distribution."
      }
    ]
  }
}
```

#### مثال `VARIABLE`

حتى مع جدول عمل ثابت، توافر التدريب المتغير هو الذي يفرض تسلسل الجلسات:

```json
{
  "lifestyle": {
    "workSchedule": {
      "type": "FIXED",
      "physicallyDemandingDays": []
    }
  },
  "training": {
    "maxDaysPerWeek": 4,
    "preferredDaysPerWeek": 3,
    "trainingScheduleAvailabilityType": "VARIABLE",
    "availableTrainingDays": [],
    "unavailableTrainingDays": []
  }
}
```

مقتطف المخرج والسبب المرتبط بالجدولة:

```json
{
  "training_decision": {
    "recommended_days": 3,
    "schedule_mode": "SESSION_SEQUENCE",
    "reasons": [
      {
        "code": "VARIABLE_TRAINING_SCHEDULE",
        "scope": "TRAINING",
        "message": "Client has a variable training schedule; session sequence is required."
      }
    ]
  }
}
```

## قرار الحاجة إلى كارديو إضافي

قرار الكارديو في V1 يحدد الحاجة فقط، ولا يبني خطة جلسات. تُطبّق الأولويات بالترتيب: بوابات الأمان وقيود الحركة، ثم الحمل الرياضي الحالي، ثم الخطوات والنشاط اليومي، ثم هدف التحمل المنظم، وأخيرًا سعة العميل. السعة حد أعلى وليست سببًا للوصف، وهدف خسارة الدهون وحده لا يضيف جلسات.

| الحالة | القرار الافتراضي | الملاحظات |
|---|---|---|
| خطر أو تعارض حركة يمنع قرارًا آمنًا | `REVIEW_REQUIRED` | لا يعيد المحرك تفسير الأعراض؛ يستهلك بوابات الأمان والقيود المصنفة الحالية. |
| حمل رياضي مرتفع | `NO_ADDITIONAL_CARDIO` | يمكن `STEPS_ONLY` فقط إذا كانت الخطوات أقل من 5000 والمشي آمنًا. |
| خطوات أقل من 5000 | `STEPS_ONLY` | رفع الحركة اليومية هو المسار الأول؛ لا توجد في DTO الحالي إشارة منظمة تثبت أن رفع الخطوات غير عملي. |
| خطوات من 5000 إلى أقل من 8000 | `STEPS_ONLY` أو `NO_ADDITIONAL_CARDIO` | لا توجد جلسات تلقائية؛ هدف أداء/تحمل صريح مع السعة والأمان يمكن أن يبرر `CARDIO_SESSIONS`. |
| 8000 خطوة فأكثر | `NO_ADDITIONAL_CARDIO` | النشاط كافٍ افتراضيًا؛ يمكن لهدف أداء/تحمل صريح فقط، دون حمل رياضي كافٍ، تبرير جلسات. |
| خطوات مجهولة | `STEPS_ONLY` أو `NO_ADDITIONAL_CARDIO` | لا تُخمن جلسات، وتُسجل `AVERAGE_DAILY_STEPS_UNKNOWN` مع سبب مؤقت. |

يصنّف Helper الكارديو الحمل الرياضي `HIGH` عند يومين أو أكثر بشدة `HIGH`، أو ثلاثة أيام أو أكثر بشدة `MODERATE`، أو عند تحقق حد V1 الأقوى الموجود: 90 دقيقة أسبوعية عالية الشدة أو 180 دقيقة أسبوعية موزونة (`HIGH=1`, `MODERATE=0.5`, `LOW=0.25`). هذا التصنيف خاص بقرار الحاجة ولا يغير Training Rules.

عقد `SportIntensity` الحالي يحتوي `LOW`, `MODERATE`, و`HIGH` فقط؛ لذلك `HIGH` هو أعلى شدة منظمة في V1، ولم يُوسّع هذا التصحيح عقد الرياضة لإضافة `VERY_HIGH`.

إشارة التحمل الصريحة هي `goals.primary=PERFORMANCE` أو التطابق الحرفي لـ`secondaryTraining` مع `ENDURANCE` أو `CARDIOVASCULAR_FITNESS`. لا يفحص المحرك نصوصًا حرة ولا يستخدم مطابقة كلمات تقريبية.

`maxSessionsPerWeek` و`maxDurationMinutes` هما سقفان فقط. لا يمكن اختيار `CARDIO_SESSIONS` إذا كان أحدهما صفرًا، وعند اختيارها يكون كلا المخرجين موجبًا ولا يتجاوز السعة. أما `NO_ADDITIONAL_CARDIO`, `STEPS_ONLY`, و`REVIEW_REQUIRED` فتعيد صفر جلسات وصفر مدة. تبدأ الجلسات الفعلية بـ`MODERATE` فقط مع مشي `EASY`، واستشفاء مقبول، وعدم وجود قيود أو حمل رياضي متوسط/مرتفع؛ وإلا تستخدم `LOW`. لا يستخدم V1 شدة `HIGH`.

كل قرار يحتوي على `reasons` منظمة. أمثلة الحقول المؤثرة والنتائج الفعلية المتوقعة:

| المثال | المدخل المختصر | المخرج المختصر |
|---|---|---|
| خطوات مرتفعة | `FAT_LOSS`, خطوات `12000`, بلا رياضة | `NO_ADDITIONAL_CARDIO`, الجلسات/المدة `0` |
| خطوات منخفضة | خطوات `3500`, مشي `EASY`, بلا رياضة | `STEPS_ONLY`, الجلسات/المدة `0` |
| رياضة إضافية عالية | كرة قدم يومان `HIGH`, خطوات `8000` | `NO_ADDITIONAL_CARDIO`, الجلسات/المدة `0` |
| هدف تحسين التحمل | `PERFORMANCE/ENDURANCE`, خطوات `6000`, سعة `2 × 30` | `CARDIO_SESSIONS`, `max_sessions=2`, `max_duration_minutes=30` |

## جدول القواعد المنفذة

| # | القاعدة | التنفيذ الحتمي |
|---:|---|---|
| 1 | القاصر | أقل من 18 بلا موافقة ⇒ `BLOCKED`. مع الموافقة ⇒ `COACH_REVIEW_REQUIRED` ومسار قاصر منفصل. |
| 2 | الأعراض الخطرة | أي إجابة منظمة `YES` لألم/ضغط الصدر، الإغماء، ضيق النفس غير الطبيعي، الخفقان غير الطبيعي أو عرض خطر آخر ⇒ مراجعة طبية. |
| 3 | الحالة الصحية وتعليمات الطبيب | `conditionCode` من القائمة مع استقرار `STABLE` لا يمنع الجاهزية وحده. `otherConditionText` المستقر ⇒ مراجعة كوتش بلا تفسير أو Hard Constraint. `UNSTABLE/UNKNOWN` أو تعليمات طبيب حرة غير مصنفة ⇒ مراجعة طبية. |
| 4 | الحمل والرضاعة | حمل، احتمال حمل أو رضاعة ⇒ مراجعة طبية إلزامية وفق سياسة V1 المحافظة. `UNKNOWN` ⇒ `BLOCKED`. |
| 5 | الإصابة الخطرة | `painLevel >= 7`، أو `movementImpact=PREVENTS`، أو التدهور، أو التنميل/الضعف ⇒ مراجعة طبية. الألم من 0 إلى 6 بلا Red Flags ⇒ مراجعة كوتش مع الاحتفاظ بقيود الحركات. |
| 6 | المنع الطبي للحركة | كل منع مصنف يتحول إلى Hard Constraint. منع `ALL_TRAINING/ALL_CARDIO/ALL_ACTIVITY` يوقف القرار المتعارض ويطلب المراجعة. |
| 7 | النص الحر | Review Flag فقط؛ لا NLP، ولا keyword matching، ولا تحويل آلي إلى حالة صحية أو حساسية أو منع. نص الحالة الأخرى يستخدم `UNCLASSIFIED_MEDICAL_CONDITION`. |
| 8 | الحساسية والمنع الغذائي | كل حساسية تبقى `FOOD_ALLERGY_EXCLUSION`. المؤكدة لا تمنع الجاهزية وحدها؛ غير المؤكدة تبقى مستبعدة احترازيًا وتضيف `UNCONFIRMED_FOOD_ALLERGY` ومراجعة كوتش وبيان تأكيد معلق، من دون تحويلها إلى منع طبي أو عدم تحمّل. |
| 9 | الطعام غير المرغوب | Soft Preference مستقلة، وتبقى مختلفة عن الحساسية حتى لو تكرر اسم الطعام. |
| 10 | عدم التحمل | نوع مستقل لا يتحول إلى حساسية. المشخّص الشديد يصبح قيدًا طبيًا؛ الشديد/المجهول يحتاج مراجعة. |
| 11 | الهدف والسعرات | الهدف وحده لا يفرض `DEFICIT` أو `SURPLUS`. V1 يستخدم `MAINTENANCE` كبداية معايرة محايدة عند غياب gates. |
| 12 | ثقة السعرات | اتجاه معروف + جودة عالية ⇒ `HIGH`. نقص عامل ⇒ `MEDIUM`. اتجاه مجهول مع جودة منخفضة/مجهولة ⇒ `LOW`. |
| 13 | تاريخ اضطرابات الأكل | أي تاريخ غير `NONE` ⇒ `REVIEW_REQUIRED/LOW` للتغذية ولا عجز/فائض تلقائي. |
| 14 | قرار التغذية | يعيد اتجاه السعرات والثقة واستراتيجية الوجبات والقيود والأسباب، بلا حساب رقم سعرات. |
| 15 | حد أيام التدريب | `recommended_days` لا يتجاوز `maxDaysPerWeek` ولا السعة الفعلية المستنتجة من نوع توافر التدريب، ولا يكون صفرًا في قرار ناجح. |
| 16 | الأيام المفضلة | Soft Preference صالح فقط عندما يقع بين 1 و`maxDaysPerWeek`؛ إذا تجاوز السعة الفعلية تُستخدم أعلى قيمة صالحة ويُضاف سبب التخفيض. |
| 17 | نمط جدول التدريب | `trainingScheduleAvailabilityType=VARIABLE` وحده ⇒ `SESSION_SEQUENCE`؛ الأنواع الثلاثة الأخرى ⇒ `FIXED_DAYS`. نوع جدول العمل لا يقرر هذا الحقل. |
| 18 | الأدوات والإصابات | المكان، الأدوات، قدرة الحمل، الإصابة والمنع الطبي كلها قيود منظمة للجيل المستقبلي. |
| 19 | Intro Week | لم يتدرب مطلقًا، عائد بعد انقطاع، بلا تدريب آخر 4 أسابيع، أو خبرته/تاريخه مجهول ⇒ Intro/Calibration Week. |
| 20 | البداية المحافظة | Intro Week، نوم أقل من 6 ساعات أو رديء، ضغط مرتفع، حمل رياضي مرتفع، أو عمل بدني ⇒ `CONSERVATIVE`. |
| 21 | قرار التدريب | يعيد الأيام، نمط الجدول، Intro Week، حجم البداية، القيود والأسباب، بلا Split أو تمارين. |
| 22 | الرياضة الإضافية | تُصنف قبل الهدف والسعة؛ الحمل المرتفع ⇒ `NO_ADDITIONAL_CARDIO`، أو `STEPS_ONLY` فقط مع خطوات أقل من 5000 ومشي آمن. |
| 23 | المشي 10 دقائق | `LIMITED` ⇒ `REVIEW_REQUIRED`؛ ولا يخمّن المحرك سبب العجز. عدم اليقين يُحفظ في بيانات المراجعة ولا يبرر جلسات. |
| 24 | قدرة الكارديو | السعة حد أقصى وليست وصفة. `CARDIO_SESSIONS` تتطلب سقف جلسات ومدة موجبين؛ كل استراتيجية أخرى تعيدهما صفرًا. |
| 25 | تعارض الكارديو مع الإصابة | Safety gate يوقف الكارديو، والمنع المصنف يظهر ضمن قيود قرار الكارديو. |
| 26 | قرار الكارديو | يقرر الحاجة حسب الأمان ثم الرياضة والخطوات والهدف والسعة، ويعيد أسبابًا غير فارغة بلا توليد خطة فعلية. |

## افتراضات Policy الموثقة

المواصفات تركت بعض الحدود دون قيمة رقمية. استخدم V1 القواعد التالية بوضوح، وهي Routing Policy وليست تشخيصًا طبيًا:

- `MEDICAL_REVIEW_REQUIRED` يفوز على أي حالة أخرى.
- الحمل/احتماله/الرضاعة يدخل مراجعة طبية، لا مجرد مراجعة كوتش، حتى تُعتمد سياسة سريرية مختلفة.
- الأدوية لا تُفسر ولا يُستنتج منها تداخل؛ وجودها يطلب مراجعة كوتش.
- `HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD = 7`: الألم من 0 إلى 6 بلا Red Flags يبقى في مراجعة الكوتش الحالية، ومن 7 إلى 10 يطلب مراجعة طبية. العتبة Routing Policy ولا تشخّص سبب الألم.
- الحالة المنظمة المستقرة لا تمنع `READY_FOR_DRAFT` وحدها. نص الحالة الأخرى لا يفسر ولا يتحول إلى Hard Constraint، ويطلب مراجعة كوتش ما لم يرفع عدم الاستقرار/جهله الحالة إلى مراجعة طبية.
- `medicallyConfirmed=false` لا يلغي استبعاد الحساسية: تظل المادة Hard Constraint في الوجبات والبدائل، مع `COACH_REVIEW_REQUIRED` و`FOOD_ALLERGY_CONFIRMATION_PENDING`. لا تغيّر هذه المراجعة اتجاه السعرات أو استراتيجية الوجبات، ولا تُصعّد وحدها إلى مراجعة طبية أو حظر.
- أهداف الحساسية والمنع وعدم التحمل والطعام غير المرغوب يجب أن تكون IDs كبيرة canonical؛ الجمل الحرة مكانها حقول النص غير المصنف وتحتاج مراجعة.
- تعليمات المنع الطبي في V1 هي `AVOID` فقط، وعلى حركة معروفة من Enum. لا يقبل V1 `OTHER` أو `LIMIT` بلا هدف/مقدار قابل للتطبيق.
- السعرات تبدأ `MAINTENANCE` للمعايرة، لأن المواصفات تمنع اشتقاق العجز/الفائض من الهدف ولا تقدم Policy بديلة كافية.
- النوم المنخفض هو أقل من 6 ساعات، أو جودة `POOR` مهما كان العدد.
- أي يوم عمل بدني مصنف، أو نشاط يومي `HIGH/VERY_HIGH`، يجعل البداية محافظة.
- حمل الرياضة الإضافية للكارديو مرتفع عند يومين عالَيَي الشدة، أو ثلاثة أيام متوسطة الشدة، أو 90 دقيقة أسبوعية عالية الشدة، أو 180 دقيقة أسبوعية موزونة على الأقل (`HIGH=1`, `MODERATE=0.5`, `LOW=0.25`).
- فترات عدم القدرة على الأكل في V1 يجب أن تكون same-day، موجبة، وغير متداخلة؛ overnight windows تحتاج عقدًا لاحقًا صريحًا.
- أقل من 5000 خطوة ⇒ `STEPS_ONLY` أولًا. من 5000 إلى أقل من 8000 لا تُفرض جلسات؛ ويمكن لهدف أداء/تحمل صريح فقط تبريرها مع السعة والأمان. 8000 فأكثر ⇒ `NO_ADDITIONAL_CARDIO` افتراضيًا. الخطوات المجهولة لا تنتج جلسات وتُسجل كبيانات ناقصة.
- هدف خسارة الدهون وحده لا يفرض `CARDIO_SESSIONS`، ووجود سعة زمنية أو بدنية لا يعني استخدامها تلقائيًا.
- `intensity_start` يبقى `LOW` عند `STEPS_ONLY` أو `NO_ADDITIONAL_CARDIO` أو `REVIEW_REQUIRED` لأن عقد V1 لا يحتوي `NOT_APPLICABLE`.
- الصور، الدولة، الطول، الوزن، محيط الوسط وحالة الدورة تُجمع وتُتحقق، لكن لا تُحوّل إلى حسابات جسمية أو سريرية في V1. `UNKNOWN` المصرح به يظهر في `missing_or_uncertain_data` حين يؤثر في الثقة أو الأمان.

ثوابت التدريب والكارديو موجودة في `TrainingPolicy` و`CardioPolicy`، وعتبة الألم الطبية مصدّرة باسم `HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD` من قواعد الأمان.

## تشغيل الاختبارات والمثال

يتطلب Node.js 22 أو أحدث، ولا يحتاج `npm install` لعدم وجود dependencies.

```bash
npm test
npm run test:coverage
npm run check
npm run example
```

آخر تشغيل فعلي عند التسليم: **104/104 اختبارات ناجحة**، وتشمل الاختبارات الـ99 السابقة و5 اختبارات جديدة لهذا التصحيح. التغطية الكلية: **98.42% للأسطر، 94.80% للفروع، 99.69% للدوال**. كما نجح `npm run check`.

`npm run example` يقرأ `examples/full-intake.json` ويطبع ناتج المحرك الفعلي. الخلاصة الفعلية لنفس المثال:

```json
{
  "plan_status": "READY_FOR_DRAFT",
  "review_flags": [],
  "nutrition_decision": {
    "calorie_direction": "MAINTENANCE",
    "confidence": "HIGH",
    "meal_count_strategy": "ADAPT_TO_EATING_WINDOWS"
  },
  "training_decision": {
    "recommended_days": 3,
    "schedule_mode": "FIXED_DAYS",
    "intro_week_required": true,
    "volume_start": "CONSERVATIVE"
  },
  "cardio_decision": {
    "strategy": "STEPS_ONLY",
    "max_sessions": 0,
    "max_duration_minutes": 0,
    "intensity_start": "LOW"
  },
  "missing_or_uncertain_data": []
}
```

الأمر يطبع أيضًا قوائم القيود والتفضيلات والأسباب كاملة؛ الاختصار أعلاه للقراءة فقط.

## ما لم يُنفذ

- لا UI أو صفحات موقع أو API أو مصادقة أو دفع.
- لا Database أو تخزين أو Audit Log أو إعدادات Tenant.
- لا AI Runtime أو خدمات خارجية.
- لا حساب TDEE/BMR أو رقم سعرات أو Macros.
- لا خطة وجبات، بدائل طعام فعلية، Split، تمارين أو جلسات كارديو.
- لا تفسير دوائي أو تشخيص أو بديل عن الطبيب/الكوتش.
- لا JSON Schema منشور كملف مستقل؛ Validation الحالية Runtime وJSDoc. يمكن توليد Schema versioned لاحقًا عند تثبيت عقد الـAPI.

## الخطوة التالية المقترحة — بدون تنفيذ

إنشاء `Draft Specification Builder V1` يستهلك ناتج هذا المحرك فقط بعد اجتياز `plan_status`، ويحوّل القرارات إلى مواصفات Draft قابلة للمراجعة: نطاق طاقة لا رقم نهائي، تكرار تدريب، حدود حجم، وجرعة كارديو، مع `rulesetVersion` و`coachPolicyVersion` وAudit Trail للأسباب. بعد اعتماد هذه الطبقة يمكن أن تأتي مولدات الوجبات والتمارين كطبقات منفصلة لا تتجاوز Hard Constraints.
