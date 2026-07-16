# Z Coaching — Client Intake Decision Engine V1

محرك Domain مستقل وحتمي يحوّل بيانات تأسيس العميل المنظمة إلى قرار أولي آمن للتغذية والتدريب والكارديو، ثم يستطيع بناء خطة تدريب وتقدير هدف طاقة غذائي وأهداف ماكروز يومية أولية. لا يستخدم AI Runtime، ولا يتصل بقاعدة بيانات أو API، ولا يولّد وجبات أو يختار أطعمة.

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
| `personal` | `dateOfBirth`, `sex`, رمز دولة ISO alpha-2، `guardianConsent`. يُشتق العمر حتميًا من `dateOfBirth` و`EvaluationContext.assessmentDate` الموثوق، ويجب أن يقع بين 0 و120 سنة شاملًا. |
| `goals` | الهدف الأساسي وهدف التدريب الإضافي. الهدف يُسجّل ولا يفرض اتجاه سعرات أو كارديو تلقائيًا. |
| `body` | الطول، الوزن، محيط الوسط الاختياري، اتجاه الوزن في آخر 4–6 أسابيع، جودة القياسات، وجود صور البداية. |
| `lifestyle` | الحركة اليومية، نوع جدول العمل، أيام العمل البدني، متوسط ساعات وجودة النوم، مستوى الضغط. |
| `medical` | الحالات الصحية بعقد `conditionCode`/`otherConditionText` حصري واستقرارها، screening الأعراض الخطرة بـ`YES/NO/UNKNOWN`، الأدوية، تاريخ اضطرابات الأكل، الحمل/الرضاعة، الدورة، والنصوص غير المصنفة. |
| `nutrition` | الحساسية بعقد `{substance, medicallyConfirmed}`، المنع الطبي ذو `instruction/source` مصنفين ومعرّفات غذائية canonical، الأطعمة غير المرغوبة، عدم التحمل، المشاكل الهضمية، عدد الوجبات، فترات تعذر الأكل، الميزانية، الحفظ والتسخين. |
| `training` | المكان، الأدوات وقدرتها، `maxDaysPerWeek` و`preferredDaysPerWeek`، نوع توافر جدول التدريب، `availableTrainingDays` و`unavailableTrainingDays` من `DayOfWeek`، مدة الجلسة، الخبرة، آخر 4 أسابيع، `movementImpact` للإصابات، والمنع الطبي ذو حركة/تعليمات/مصدر من Enums. |
| `cardio` | الرياضات الإضافية المصنفة أو الحرة، أيامها الفعلية ومدتها وشدتها ومستوى المشاركة، الخطوات، القدرة على المشي 10 دقائق بسهولة، الحد الأقصى للجلسات والمدة. |
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

### عقد معدات التدريب المنظمة

كل عنصر داخل `training.equipment` يصرّح بالحقول الثلاثة `equipmentCode` و`otherEquipmentText` و`loadCapacity`. لا يقبل الحقل القديم `name`، ولا يحاول المحرك تفسير أسماء المعدات الحرة أو مطابقتها بالكلمات المفتاحية.

المعدة المنظمة:

```json
{
  "equipmentCode": "DUMBBELLS",
  "otherEquipmentText": null,
  "loadCapacity": "MODERATE"
}
```

وزن الجسم فقط:

```json
{
  "equipmentCode": "BODYWEIGHT",
  "otherEquipmentText": null,
  "loadCapacity": "BODYWEIGHT_ONLY"
}
```

المعدة الأخرى التي كتبها العميل:

```json
{
  "equipmentCode": null,
  "otherEquipmentText": "النص الأصلي الذي كتبه العميل",
  "loadCapacity": "NOT_APPLICABLE"
}
```

قيم `EquipmentCode` النهائية هي:

```text
BODYWEIGHT
DUMBBELLS
BARBELL_AND_PLATES
ADJUSTABLE_BENCH
FLAT_BENCH
RESISTANCE_BANDS
PULL_UP_BAR
SQUAT_RACK
SMITH_MACHINE
CABLE_STATION
SELECTORIZED_MACHINES
KETTLEBELLS
```

المساران حصريان: المعدة المنظمة تستخدم `equipmentCode` معروفًا مع `otherEquipmentText=null` أو `""`، والمعدة الحرة تستخدم `equipmentCode=null` مع نص غير فارغ بعد التحقق من المسافات. `BODYWEIGHT` يقبل `BODYWEIGHT_ONLY` فقط، وبقية المعدات المنظمة تقبل `LIGHT/MODERATE/HEAVY` فقط، بينما المسار الحر يقبل أيضًا `NOT_APPLICABLE`. تُرفض الأكواد المكررة، بما فيها تكرار `BODYWEIGHT`.

قواعد المكان ثابتة: `HOME` و`MIXED` يتطلبان عنصر معدات واحدًا على الأقل يمثل القدرة المنزلية المصرح بها، من دون افتراض وزن الجسم تلقائيًا؛ `GYM` يقبل قائمة فارغة؛ وسلوك `OUTDOORS` لم يتغير.

المعدات المنظمة تظهر كـ`AVAILABLE_TRAINING_EQUIPMENT` داخل `training_decision.constraints` فقط، ولا تدخل `hard_constraints`. أما المعدة الحرة فتضيف `COACH_REVIEW_REQUIRED` و`UNCLASSIFIED_TRAINING_EQUIPMENT` و`UNCLASSIFIED_EQUIPMENT_REQUIRES_MAPPING` و`TRAINING_EQUIPMENT_MAPPING_PENDING` بمسار العنصر المفهرس، ولا تتحول إلى معدة متاحة قبل المراجعة.

### عقد جدول الرياضات الإضافية المنظم

كل عنصر داخل `cardio.additionalSports` يصرّح صراحة بالحقول الستة `sportCode` و`otherSportText` و`days` و`minutesPerSession` و`intensity` و`participationLevel`. لا يقبل العقد الحقلين القديمين `name` و`daysPerWeek`؛ كلاهما يُرفض كـ`UNKNOWN_FIELD`، ويُشتق عدد أيام الرياضة من `days.length` بدل استقبال رقم منفصل من العميل.

رياضة معروفة:

```json
{
  "sportCode": "FOOTBALL",
  "otherSportText": null,
  "days": ["MONDAY", "THURSDAY"],
  "minutesPerSession": 60,
  "intensity": "HIGH",
  "participationLevel": "RECREATIONAL"
}
```

رياضة أخرى كتبها العميل:

```json
{
  "sportCode": null,
  "otherSportText": "Volleyball beach training",
  "days": ["SATURDAY"],
  "minutesPerSession": 90,
  "intensity": "MODERATE",
  "participationLevel": "RECREATIONAL"
}
```

قيم `SportCode` النهائية هي:

```text
FOOTBALL
RUNNING
CYCLING
SWIMMING
BOXING
MARTIAL_ARTS
BASKETBALL
HANDBALL
VOLLEYBALL
RACKET_SPORTS
CROSSFIT_OR_FUNCTIONAL
```

أما `SportParticipationLevel` فيقبل `RECREATIONAL` و`COMPETITIVE` فقط. تُحفظ قيمة المشاركة في القيود الناتجة كما أرسلها العميل، لكنها لا تضيف معامل حمل أو تغيّر الحدود الحالية في V1.

المساران حصريان: الرياضة المنظمة تستخدم `sportCode` معروفًا مع `otherSportText=null` أو `""`، والرياضة الحرة تستخدم `sportCode=null` مع نص أصلي غير فارغ. يجب أن تحتوي `days` من يوم واحد إلى سبعة أيام فريدة من `DayOfWeek`، ويجب أن تكون `minutesPerSession` عددًا صحيحًا من 1 إلى 300، وأن تكون `intensity` من `SportIntensity` و`participationLevel` من `SportParticipationLevel`. تُرفض القيم غير المعروفة، واليوم المكرر داخل الرياضة نفسها، وغياب أي حقل صريح، ووجود مساري التصنيف معًا أو غيابهما. وتظل `additionalSports=[]` صالحة لمن لا يمارس رياضة إضافية.

النص في `otherSportText` يُحفظ كما كتبه العميل، بلا trim أو Keyword Matching أو AI mapping. يرفع المسار الحر الحالة إلى `COACH_REVIEW_REQUIRED` ويضيف Review Flag باسم `UNCLASSIFIED_ADDITIONAL_SPORT` بالنطاق `TRAINING` والمستوى `COACH` ومسار المصدر `cardio.additionalSports[index].otherSportText`، وسبب `UNCLASSIFIED_SPORT_REQUIRES_MAPPING`، وبيانًا ناقصًا باسم `ADDITIONAL_SPORT_MAPPING_PENDING` ورسالة `The reported sport requires coach mapping for sport-specific planning.`. ورغم أن نوع الرياضة غير مصنف، تبقى أيامها ومدتها وشدتها محسوبة في الحمل الرياضي العام.

كل رياضة، منظمة أو حرة، تظهر كقيد `EXISTING_ADDITIONAL_SPORT` داخل كل من `cardio_decision.constraints` و`training_decision.constraints` ببيانات العقد الجديدة. هذه الأيام ليست أيامًا ممنوعة تلقائيًا للتدريب، ولا تتحول إلى `TRAINING_UNAVAILABLE_DAY`، ولا يختار المحرك جدول تمارين في هذه المرحلة.

تُحسب الجلسات الأسبوعية لكل رياضة من `sport.days.length`، وتُحسب دقائقها الأسبوعية من `sport.days.length × sport.minutesPerSession`. أما عدد أيام الحمل `HIGH` أو `MODERATE` فيستخدم اتحاد الأيام الفعلية الفريدة بين كل الرياضات: لا يُحسب اليوم نفسه مرتين، وإذا اجتمعت رياضة `HIGH` وأخرى `MODERATE` في اليوم نفسه يُصنف ذلك اليوم `HIGH` فقط لهذا الحساب. لا يغير هذا التصحيح عتبات الحمل أو أوزان الشدة الحالية.

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
| 21 | قرار التدريب | يعيد Intake Engine الأيام، نمط الجدول، Intro Week، حجم البداية، القيود والأسباب، بلا Split أو تمارين؛ تبني الوحدة المستقلة اللاحقة الهيكل من هذا الناتج فقط. |
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

## Training Plan Specification V1

الوحدة المستقلة `src/training-plan-specification` تحوّل قرار التدريب المجمد إلى هيكل برنامج فقط، من دون إعادة حساب الأيام أو قراءة قواعد التغذية أو الكارديو أو الأمان. واجهتها العامة هي `buildTrainingPlanSpec(intakeDecision)`، وهي متاحة أيضًا عبر export الحزمة الفرعي `./training-plan-specification`.

تقرأ الوحدة فقط `plan_status` والحقول `recommended_days`, `schedule_mode`, `intro_week_required`, `volume_start`, `constraints`, و`reasons` داخل `training_decision`. وتعيد العقد التالي:

```json
{
  "spec_version": "training-plan-spec-v1",
  "status": "READY",
  "recommended_days": 4,
  "split_code": "UPPER_LOWER",
  "schedule_mode": "FIXED_DAYS",
  "intro_week_required": true,
  "volume_start": "CONSERVATIVE",
  "sessions": [
    {
      "sequence": 1,
      "session_code": "UPPER_A",
      "focus": "UPPER_BODY"
    }
  ],
  "constraints": [],
  "reasons": []
}
```

| `recommended_days` | `split_code` | ترتيب الحصص |
|---:|---|---|
| 2 | `FULL_BODY` | `FULL_BODY_A`, `FULL_BODY_B` |
| 3 | `FULL_BODY` | `FULL_BODY_A`, `FULL_BODY_B`, `FULL_BODY_C` |
| 4 | `UPPER_LOWER` | `UPPER_A`, `LOWER_A`, `UPPER_B`, `LOWER_B` |
| 5 | `UPPER_LOWER_PPL` | `UPPER_A`, `LOWER_A`, `PUSH_A`, `PULL_A`, `LEGS_A` |
| 6 | `PUSH_PULL_LEGS` | `PUSH_A`, `PULL_A`, `LEGS_A`, `PUSH_B`, `PULL_B`, `LEGS_B` |

`READY_FOR_DRAFT` ينتج `READY`، و`COACH_REVIEW_REQUIRED` ينتج `PROVISIONAL_REVIEW_REQUIRED`. إذا كان قرار مراجعة الكوتش المعتمد يحتوي `recommended_days=0`، تبقى الحالة provisional مع `split_code=null` و`sessions=[]` من دون اختراع أيام. أما `MEDICAL_REVIEW_REQUIRED` و`BLOCKED` فينتجان `WITHHELD` بلا Split أو حصص. في كل الحالات تُمرر قيود التدريب وأسبابه دون تصفية أو تفسير.

الحصص مرتبة بـ`sequence` فقط. لا تحدد الوحدة أيام الأسبوع، ولا تختار تمارين أو Sets أو Reps أو Progression، ولا تغيّر الحمل بسبب الرياضة الإضافية.

## Training Session Blueprints V1

الوحدة المستقلة `src/training-session-blueprint` تستهلك ناتج `buildTrainingPlanSpec(...)` فقط، وتضيف لكل حصة قائمة مرتبة من Movement Slots تصف احتياج الحصة من دون اختيار تمرين فعلي. واجهتها العامة هي `buildTrainingSessionBlueprint(trainingPlanSpec)`، وهي متاحة عبر export الحزمة الفرعي `./training-session-blueprint`.

```json
{
  "blueprint_version": "training-session-blueprint-v1",
  "status": "READY",
  "recommended_days": 4,
  "split_code": "UPPER_LOWER",
  "schedule_mode": "FIXED_DAYS",
  "intro_week_required": true,
  "volume_start": "CONSERVATIVE",
  "sessions": [
    {
      "sequence": 1,
      "session_code": "UPPER_A",
      "focus": "UPPER_BODY",
      "movement_slots": [
        {
          "order": 1,
          "slot_code": "HORIZONTAL_PUSH"
        }
      ]
    }
  ],
  "constraints": [],
  "reasons": []
}
```

`MovementSlotCode` يحتوي فقط: `KNEE_DOMINANT`, `HIP_HINGE`, `UNILATERAL_LOWER`, `KNEE_FLEXION`, `CALF_RAISE`, `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `VERTICAL_PUSH`, `VERTICAL_PULL`, `SHOULDER_ABDUCTION`, `REAR_DELT`, `ELBOW_FLEXION`, `ELBOW_EXTENSION`, و`CORE_STABILITY`.

| `session_code` | Movement Slots بالترتيب |
|---|---|
| `FULL_BODY_A` | `KNEE_DOMINANT`, `HIP_HINGE`, `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `CORE_STABILITY` |
| `FULL_BODY_B` | `HIP_HINGE`, `KNEE_DOMINANT`, `VERTICAL_PUSH`, `VERTICAL_PULL`, `CORE_STABILITY` |
| `FULL_BODY_C` | `UNILATERAL_LOWER`, `KNEE_FLEXION`, `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `CORE_STABILITY` |
| `UPPER_A` | `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `VERTICAL_PUSH`, `VERTICAL_PULL`, `ELBOW_FLEXION`, `ELBOW_EXTENSION` |
| `UPPER_B` | `VERTICAL_PUSH`, `VERTICAL_PULL`, `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `ELBOW_EXTENSION`, `ELBOW_FLEXION` |
| `LOWER_A` | `KNEE_DOMINANT`, `HIP_HINGE`, `UNILATERAL_LOWER`, `KNEE_FLEXION`, `CALF_RAISE`, `CORE_STABILITY` |
| `LOWER_B` | `HIP_HINGE`, `KNEE_DOMINANT`, `KNEE_FLEXION`, `UNILATERAL_LOWER`, `CALF_RAISE`, `CORE_STABILITY` |
| `PUSH_A` | `HORIZONTAL_PUSH`, `VERTICAL_PUSH`, `SHOULDER_ABDUCTION`, `ELBOW_EXTENSION` |
| `PUSH_B` | `VERTICAL_PUSH`, `HORIZONTAL_PUSH`, `SHOULDER_ABDUCTION`, `ELBOW_EXTENSION` |
| `PULL_A` | `VERTICAL_PULL`, `HORIZONTAL_PULL`, `REAR_DELT`, `ELBOW_FLEXION` |
| `PULL_B` | `HORIZONTAL_PULL`, `VERTICAL_PULL`, `REAR_DELT`, `ELBOW_FLEXION` |
| `LEGS_A` | نفس ترتيب `LOWER_A` |
| `LEGS_B` | نفس ترتيب `LOWER_B` |

تمرّر الوحدة `status`, `recommended_days`, `split_code`, `schedule_mode`, `intro_week_required`, `volume_start`, `constraints`, و`reasons` دون تغيير. تظل `sessions` فارغة عند `WITHHELD`، وكذلك عند `PROVISIONAL_REVIEW_REQUIRED` مع صفر أيام؛ أما provisional الذي يحتوي حصصًا فيُبنى مع بقاء حالته. لا تعيد الوحدة ترتيب الحصص، ولا تفسر القيود أو الإصابات أو المعدات، ولا تختار تمارين أو تضيف Sets أو Reps أو أحمال أو أيام أسبوع.

## Minimal Exercise Catalog V1

الوحدة المستقلة `src/exercise-catalog` توفر 28 سجل تمرين ثابتًا كبيانات مرشحة للمرحلة اللاحقة، بواقع تمرينين لكل `MovementSlotCode`. تستخدم الوحدة `MovementSlotCode`, `EquipmentCode`, `EquipmentLoadCapacity`, و`TrainingLocation` من الـPublic Exports الحالية فقط، وهي متاحة عبر export الحزمة الفرعي `./exercise-catalog`.

```json
{
  "catalog_version": "exercise-catalog-v1",
  "exercises": [
    {
      "exercise_code": "BODYWEIGHT_SQUAT",
      "name_en": "Bodyweight Squat",
      "slot_code": "KNEE_DOMINANT",
      "equipment_requirements": [
        {
          "equipment_code": "BODYWEIGHT",
          "minimum_load_capacity": "BODYWEIGHT_ONLY"
        }
      ],
      "allowed_locations": ["HOME", "GYM", "OUTDOORS", "MIXED"],
      "beginner_friendly": true,
      "prescription_unit": "REPS"
    }
  ]
}
```

كل سجل يحدد `prescription_unit` صراحة باستخدام `ExercisePrescriptionUnit` فقط، من دون استنتاج الوحدة من اسم التمرين وقت التشغيل. تستخدم `REPS_PER_SIDE` مع `SPLIT_SQUAT`, `DUMBBELL_REVERSE_LUNGE`, `ONE_ARM_DUMBBELL_ROW`, `CABLE_LATERAL_RAISE`, و`DEAD_BUG` فقط؛ وتستخدم `SECONDS` مع `FRONT_PLANK` فقط؛ بينما تستخدم التمارين الـ22 المتبقية `REPS`. هذه بيانات وصفية للوصفة اللاحقة، ولا تضيف Sets أو Reps فعلية أو Rest أو Tempo.

الواجهة العامة تصدّر `EXERCISE_CATALOG`, `EXERCISE_CATALOG_VERSION`, `ExercisePrescriptionUnit`, `getExerciseByCode(exerciseCode)`, و`listExercisesForSlot(slotCode)`. تعيد دالة البحث `null` للكود غير الموجود، وتعيد دالة الـSlot قائمة جديدة في كل استدعاء من دون تعديل الكتالوج الأصلي، وتحتفظ الواجهتان بحقل `prescription_unit` ضمن سجل التمرين.

| `slot_code` | التمارين |
|---|---|
| `KNEE_DOMINANT` | `BODYWEIGHT_SQUAT`, `GOBLET_SQUAT` |
| `HIP_HINGE` | `GLUTE_BRIDGE`, `DUMBBELL_ROMANIAN_DEADLIFT` |
| `UNILATERAL_LOWER` | `SPLIT_SQUAT`, `DUMBBELL_REVERSE_LUNGE` |
| `KNEE_FLEXION` | `HAMSTRING_WALKOUT`, `LYING_LEG_CURL_MACHINE` |
| `CALF_RAISE` | `STANDING_CALF_RAISE`, `DUMBBELL_CALF_RAISE` |
| `HORIZONTAL_PUSH` | `PUSH_UP`, `DUMBBELL_FLOOR_PRESS` |
| `HORIZONTAL_PULL` | `RESISTANCE_BAND_ROW`, `ONE_ARM_DUMBBELL_ROW` |
| `VERTICAL_PUSH` | `PIKE_PUSH_UP`, `STANDING_DUMBBELL_SHOULDER_PRESS` |
| `VERTICAL_PULL` | `BAND_LAT_PULLDOWN`, `LAT_PULLDOWN` |
| `SHOULDER_ABDUCTION` | `DUMBBELL_LATERAL_RAISE`, `CABLE_LATERAL_RAISE` |
| `REAR_DELT` | `BAND_FACE_PULL`, `DUMBBELL_REAR_DELT_RAISE` |
| `ELBOW_FLEXION` | `BAND_BICEPS_CURL`, `DUMBBELL_BICEPS_CURL` |
| `ELBOW_EXTENSION` | `CLOSE_GRIP_PUSH_UP`, `BAND_TRICEPS_EXTENSION` |
| `CORE_STABILITY` | `DEAD_BUG`, `FRONT_PLANK` |

تمارين `BODYWEIGHT` متاحة في `HOME`, `GYM`, `OUTDOORS`, و`MIXED`. تمارين `DUMBBELLS` و`RESISTANCE_BANDS` متاحة في `HOME`, `GYM`, و`MIXED`، بينما `CABLE_STATION` و`SELECTORIZED_MACHINES` متاحتان في `GYM` و`MIXED`. الكتالوج لا يفلتر حسب العميل أو المعدات، ولا يختار تمرينًا أو يبني برنامجًا.

## Exercise Selection V1

الوحدة المستقلة `src/exercise-selection` تستهلك `Training Session Blueprint` و`hard_constraints` المنظمة فقط عبر `buildExerciseSelection({ trainingSessionBlueprint, hardConstraints })`. لا تقرأ Client Intake الخام ولا تعيد تقييم الأمان الطبي، وهي متاحة عبر export الحزمة الفرعي `./exercise-selection`.

```json
{
  "selection_version": "exercise-selection-v1",
  "status": "READY",
  "recommended_days": 4,
  "split_code": "UPPER_LOWER",
  "schedule_mode": "FIXED_DAYS",
  "intro_week_required": true,
  "volume_start": "CONSERVATIVE",
  "sessions": [
    {
      "sequence": 1,
      "session_code": "UPPER_A",
      "focus": "UPPER_BODY",
      "exercises": [
        {
          "order": 1,
          "slot_code": "HORIZONTAL_PUSH",
          "selection_status": "SELECTED",
          "exercise_code": "DUMBBELL_FLOOR_PRESS",
          "name_en": "Dumbbell Floor Press",
          "reason_code": "SELECTED_EXPLICIT_EQUIPMENT",
          "source_constraint_codes": []
        }
      ]
    }
  ],
  "constraints": [],
  "reasons": []
}
```

عند وجود حصص، تقرأ الوحدة قيد `TRAINING_LOCATION` واحدًا بالضبط وقيود `AVAILABLE_TRAINING_EQUIPMENT` من `blueprint.constraints`. `BODYWEIGHT` متاح ضمنيًا في كل المواقع. عندما يكون المكان `GYM` فقط، تضيف الوحدة داخليًا ملف الجيم القياسي: `DUMBBELLS/LIGHT`, `CABLE_STATION/LIGHT`, و`SELECTORIZED_MACHINES/LIGHT`. لا يفترض هذا الملف أي معدات أخرى، ولا يطبق على `HOME`, `OUTDOORS`, أو`MIXED`. تندمج المعدات الصريحة مع الملف الداخلي، وتبقى السعة الأعلى عند تكرار نفس المعدة؛ ولا تُضاف معدات الملف الافتراضي إلى `constraints` الناتجة. يجب أن يطابق كل متطلب معدة التمرين؛ `BODYWEIGHT_ONLY` يطابق الجسم فقط، وترتيب القدرات الأخرى هو `LIGHT < MODERATE < HEAVY`، بينما `NOT_APPLICABLE` لا يحقق أي متطلب.

| الحركة المنظمة | Movement Slots المتأثرة |
|---|---|
| `ALL_ACTIVITY`, `ALL_TRAINING` | جميع الـSlots |
| `SQUAT` | `KNEE_DOMINANT`, `UNILATERAL_LOWER` |
| `HINGE` | `HIP_HINGE` |
| `PUSH` | `HORIZONTAL_PUSH`, `VERTICAL_PUSH` |
| `PULL` | `HORIZONTAL_PULL`, `VERTICAL_PULL` |
| `OVERHEAD` | `VERTICAL_PUSH` |
| `WALKING`, `RUNNING`, `CYCLING`, `SWIMMING`, `ROWING`, `STAIRS`, `JUMPING`, `ALL_CARDIO` | لا تمنع Strength Slots في V1 |

تقرأ خريطة الحركة فقط من `INJURY_AFFECTED_MOVEMENT`, `INJURY_MEDICAL_RESTRICTION`, و`MEDICAL_MOVEMENT_RESTRICTION` داخل `hardConstraints`، ولا تطبق القيدين الطبيين إلا مع `instruction=AVOID`. الـSlot المقيد يبقى موجودًا بحالة `REVIEW_REQUIRED` وسبب `MOVEMENT_CONSTRAINT_REQUIRES_REVIEW`، والـSlot الذي لا يملك مرشحًا مؤهلًا يستخدم `NO_ELIGIBLE_EXERCISE`.

عند `intro_week_required=true` تكون ملاءمة المبتدئ أولًا، ثم المعدة المذكورة صراحة، ثم معدات ملف الجيم القياسي، ثم `BODYWEIGHT`، ثم ترتيب الكتالوج. من دون Intro Week يبدأ الترتيب بالمعدة الصريحة، ثم معدات ملف الجيم القياسي، ثم `BODYWEIGHT`، ثم ترتيب الكتالوج. أسباب النجاح هي `SELECTED_EXPLICIT_EQUIPMENT`, `SELECTED_STANDARD_GYM_EQUIPMENT`, أو `SELECTED_BODYWEIGHT_FALLBACK`. لا تُرقّى الحالة provisional إلى ready؛ أما `READY` فتتحول إلى `PROVISIONAL_REVIEW_REQUIRED` إذا بقي Slot واحد على الأقل للمراجعة، و`WITHHELD` يبقى بلا حصص.

## Training Prescription V1

الوحدة المستقلة `src/training-prescription` تستهلك ناتج `buildExerciseSelection(...)` فقط عبر `buildTrainingPrescription(exerciseSelection)`، وهي متاحة من export الحزمة الفرعي `./training-prescription`. تصدّر الواجهة العامة `TRAINING_PRESCRIPTION_VERSION` و`buildTrainingPrescription`، ولا تقرأ Client Intake أو تعيد اختيار التمارين أو تفسير القيود.

```json
{
  "prescription_version": "training-prescription-v1",
  "status": "READY",
  "recommended_days": 4,
  "split_code": "UPPER_LOWER",
  "schedule_mode": "FIXED_DAYS",
  "intro_week_required": true,
  "volume_start": "CONSERVATIVE",
  "sessions": [
    {
      "sequence": 1,
      "session_code": "UPPER_A",
      "focus": "UPPER_BODY",
      "exercises": [
        {
          "order": 1,
          "slot_code": "HORIZONTAL_PUSH",
          "selection_status": "SELECTED",
          "exercise_code": "DUMBBELL_FLOOR_PRESS",
          "name_en": "Dumbbell Floor Press",
          "reason_code": "SELECTED_STANDARD_GYM_EQUIPMENT",
          "source_constraint_codes": [],
          "prescription": {
            "sets": 2,
            "unit": "REPS",
            "target_min": 8,
            "target_max": 12,
            "rest_seconds": 90
          }
        }
      ]
    }
  ],
  "constraints": [],
  "reasons": []
}
```

| التصنيف | Movement Slots |
|---|---|
| Primary | `KNEE_DOMINANT`, `HIP_HINGE`, `UNILATERAL_LOWER`, `HORIZONTAL_PUSH`, `HORIZONTAL_PULL`, `VERTICAL_PUSH`, `VERTICAL_PULL` |
| Accessory | `KNEE_FLEXION`, `CALF_RAISE`, `SHOULDER_ABDUCTION`, `REAR_DELT`, `ELBOW_FLEXION`, `ELBOW_EXTENSION` |
| Core | `CORE_STABILITY` |

| المدة و`volume_start` | Primary | Accessory | Core |
|---|---:|---:|---:|
| `minutes <= 30` | 2 Sets | 2 Sets | 2 Sets |
| `minutes > 30`, `CONSERVATIVE` | 2 Sets | 2 Sets | 2 Sets |
| `minutes > 30`, `NORMAL` | 3 Sets | 2 Sets | 2 Sets |

| التصنيف والوحدة | `target_min` | `target_max` |
|---|---:|---:|
| Primary، `REPS` أو `REPS_PER_SIDE` | 8 | 12 |
| Accessory، `REPS` أو `REPS_PER_SIDE` | 10 | 15 |
| Core، `REPS` أو `REPS_PER_SIDE` | 8 | 12 |
| Core، `SECONDS` | 20 | 30 |

| مدة الحصة | Primary | Accessory | Core |
|---|---:|---:|---:|
| `minutes <= 30` | 60 ثانية | 45 ثانية | 30 ثانية |
| `minutes > 30` | 90 ثانية | 60 ثانية | 45 ثانية |

تقرأ الوحدة `prescription_unit` من `getExerciseByCode(exercise_code)` فقط. عند وجود حصص يلزم قيد واحد صحيح `TRAINING_MAX_SESSION_DURATION` بقيمة `minutes` عدد صحيح موجب. كود تمرين غير موجود، أو `SECONDS` خارج `CORE_STABILITY`، أو كسر في الوحدة أو الـSlot ينتج `TypeError`. يحتفظ `REVIEW_REQUIRED` بكل حقوله مع `prescription=null`، وتبقى حالات `READY`, `PROVISIONAL_REVIEW_REQUIRED`, و`WITHHELD` كما قررتها Exercise Selection. لا تتطلب `WITHHELD` أو الحالة بلا حصص قيد مدة، ولا تستخدم `intro_week_required` لتخفيض إضافي.

## تشغيل الاختبارات والمثال

يتطلب Node.js 22 أو أحدث، ولا يحتاج `npm install` لعدم وجود dependencies.

```bash
npm test
npm run test:coverage
npm run check
npm run example
npm run example:training
```

آخر تشغيل فعلي عند التسليم: **385/385 اختبارات ناجحة**. كانت النسخة المجمدة من Intake Decision Engine تحتوي على 146 اختبارًا، وأضيفت 12 حالة لعقد Training Plan Specification، و11 حالة لخرائط Training Session Blueprints، و15 حالة لـMinimal Exercise Catalog، و19 حالة مستقلة لفلترة Exercise Selection، و10 حالات لـTraining Prescription، و11 حالة لـTraining Draft Pipeline، و20 حالة لـWeekly Training Schedule، و21 حالة لـTraining Plan Preflight، و13 حالة لـTraining Engine، و16 حالة لـNutrition Planning Snapshot، و29 حالة لـNutrition Energy Target، و30 حالة لـNutrition Macro Targets، ثم 32 حالة لـNutrition Meal Distribution. كما نجح كل من `npm run test:coverage` و`npm run check`.

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
- لا اختيار Foods أو Serving Sizes أو Meal Templates أو أوقات وجبات محددة، ولا Carb Cycling أو Saturated Fat أو Supplements. حساب الطاقة والماكروز وتوزيعها على Meal Slots محصور في سياسات V1 المنظمة.
- لا خطة وجبات أو بدائل طعام فعلية، ولا أوزان أو RPE أو RIR أو Tempo أو Warm-up Sets أو Progression أو Deload أو جلسات كارديو. Weekly Training Schedule يوزع الحصص على أيام الأسبوع فقط، من دون ساعات يوم أو تغيير التمارين والوصفات.
- لا تفسير دوائي أو تشخيص أو بديل عن الطبيب/الكوتش.
- لا JSON Schema منشور كملف مستقل؛ Validation الحالية Runtime وJSDoc. يمكن توليد Schema versioned لاحقًا عند تثبيت عقد الـAPI.

## Training Draft Pipeline V1

الوحدة المستقلة `src/training-draft` تجمّع نتائج الوحدات الأربع (`training-plan-specification`, `training-session-blueprint`, `exercise-selection`, `training-prescription`) داخل عقد مسطّح وموحد.

لا تعيد الوحدة الكائنات الوسيطة بشكل متداخل، بل تعيد `sessions` النهائية التي تحتوي على التمارين والوصفات معًا، بالإضافة إلى الثوابت مثل `pipeline_versions` لضمان التتبع والتوافق.

## Weekly Training Schedule V1

الوحدة المستقلة `src/weekly-training-schedule` تستهلك ناتج `buildTrainingDraft(...)` فقط عبر `buildWeeklyTrainingSchedule(trainingDraft)`، وهي متاحة من export الحزمة الفرعي `./weekly-training-schedule`. تصدّر الواجهة العامة `WEEKLY_TRAINING_SCHEDULE_VERSION`, `WeeklySportLoad`, `ScheduleReasonCode`, و`buildWeeklyTrainingSchedule`، ولا تغيّر التمارين أو الوصفات التدريبية.

```json
{
  "schedule_version": "weekly-training-schedule-v1",
  "draft_version": "training-draft-v1",
  "pipeline_versions": {},
  "prescription_version": "training-prescription-v1",
  "status": "READY",
  "recommended_days": 4,
  "split_code": "UPPER_LOWER",
  "schedule_mode": "FIXED_DAYS",
  "intro_week_required": false,
  "volume_start": "NORMAL",
  "schedule_review_required": false,
  "schedule_reasons": [],
  "sessions": [
    {
      "sequence": 1,
      "session_code": "UPPER_A",
      "focus": "UPPER_BODY",
      "scheduled_day": "MONDAY",
      "sport_load": "NONE",
      "schedule_reason_code": "SELECTED_FIXED_TRAINING_DAY",
      "exercises": []
    }
  ],
  "constraints": [],
  "reasons": []
}
```

عند `SESSION_SEQUENCE` لا تختار الوحدة أيامًا ثابتة؛ تضيف لكل حصة `scheduled_day=null`, `sport_load=NONE`, و`SESSION_SEQUENCE_REQUIRED` مع الحفاظ على ترتيب الحصص وحالة الخطة. عند `WITHHELD` أو عدم وجود حصص يبقى الناتج بلا حصص ولا يتطلب قيود أيام.

عند `FIXED_DAYS` تستخدم قيود `TRAINING_AVAILABLE_DAY` كقائمة حصرية، أو تبدأ بالأسبوع كاملًا وتحذف `TRAINING_UNAVAILABLE_DAY`. يجب أن يساوي عدد الحصص `recommended_days` وأن يبقى بين 2 و6. التوزيعات المفضلة هي:

| عدد الحصص | ترتيب الاختيار المفضل |
|---:|---|
| 2 | `MONDAY`, `THURSDAY`, `TUESDAY`, `FRIDAY`, `WEDNESDAY`, `SATURDAY`, `SUNDAY` |
| 3 | `MONDAY`, `WEDNESDAY`, `FRIDAY`, `TUESDAY`, `THURSDAY`, `SATURDAY`, `SUNDAY` |
| 4 | `MONDAY`, `TUESDAY`, `THURSDAY`, `SATURDAY`, `WEDNESDAY`, `FRIDAY`, `SUNDAY` |
| 5 | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `FRIDAY`, `SATURDAY`, `THURSDAY`, `SUNDAY` |
| 6 | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |

تجمع الوحدة أعلى شدة من قيود `EXISTING_ADDITIONAL_SPORT` لكل يوم، ثم ترتب المرشحين حسب `NONE`, `LOW`, `MODERATE`, `HIGH` قبل ترتيب التوزيع المفضل. بعد الاختيار ترتب الأيام طبيعيًا من الاثنين إلى الأحد وتربطها بـ`sequence`. الأيام ذات `LOW` أو `MODERATE` تستخدم `SELECTED_AROUND_ADDITIONAL_SPORT` ولا تغيّر الحالة. إذا تعذر تجنب يوم `HIGH` تستخدم `HIGH_SPORT_DAY_REQUIRES_REVIEW`، وتضيف سبب مراجعة واحدًا، وتحول `READY` إلى `PROVISIONAL_REVIEW_REQUIRED` دون ترقية أو تغيير أي حالة أخرى.

## Training Plan Preflight V1

الوحدة المستقلة `src/training-plan-preflight` تستهلك الناتج النهائي من `buildWeeklyTrainingSchedule(...)` عبر `evaluateTrainingPlanPreflight(weeklyTrainingSchedule)`، وهي متاحة من export الحزمة الفرعي `./training-plan-preflight`. تصدّر الواجهة العامة `TRAINING_PLAN_PREFLIGHT_VERSION`, `TrainingPlanPreflightResult`, `PreflightIssueSeverity`, `PreflightIssueCode`، ودالة التقييم فقط.

تعيد الوحدة تقريرًا جديدًا بالمفاتيح `preflight_version`, `schedule_version`, `plan_status`, `result`, `can_approve`, و`issues`، ولا تعيد الخطة أو تعدّل الجدول أو الحصص أو التمارين أو الوصفات. الخطة `READY` المتسقة تنتج `PASSED` وقابلية اعتماد، والخطة `PROVISIONAL_REVIEW_REQUIRED` تنتج `REVIEW_REQUIRED` مع Issues محددة، والخطة `WITHHELD` تنتج `WITHHELD` مع Issue مانع واحد.

يتحقق الفحص من بنية الجدول، وتتابع الحصص، وتوافق اليوم والحمل وسبب الجدولة، واتساق مراجعة يوم الرياضة عالي الشدة، ثم من تتابع Exercise Slots وصحة Prescription لكل تمرين مختار. يرتب Issues بدءًا من `HIGH_SPORT_DAY_REQUIRES_REVIEW`، ثم Slots التي تحتاج مراجعة حسب `session_sequence` و`slot_order`، ثم `UPSTREAM_REVIEW_REQUIRED` عند غياب سبب محلي؛ أما الخطة المحجوبة فتحتوي `PLAN_WITHHELD` وحده.

## Training Engine Facade V1

الوحدة المستقلة `src/training-engine` توفر الواجهة الرئيسية ونقطة الدخول الرسمية لمسار التدريب بالكامل. تستهلك الناتج النهائي من `evaluateIntake(...)` عبر `buildTrainingEngine(intakeDecision)`، وهي متاحة من export الحزمة الفرعي `./training-engine`. تصدّر الواجهة العامة `TRAINING_ENGINE_VERSION` ودالة البناء فقط.

الناتج يحتوي فقط على الخطة الأسبوعية النهائية (بكل ما تشمله من حصص وتمارين ووصفات)، وتقرير صلاحية الاعتماد (Preflight Report):

```json
{
  "engine_version": "training-engine-v1",
  "weekly_training_plan": {
    "schedule_version": "weekly-training-schedule-v1",
    "status": "READY",
    "sessions": []
  },
  "preflight_report": {
    "preflight_version": "training-plan-preflight-v1",
    "schedule_version": "weekly-training-schedule-v1",
    "plan_status": "READY",
    "result": "PASSED",
    "can_approve": true,
    "issues": []
  }
}
```

لا تقبل الوحدة بيانات العميل (Raw Intake)، ولا تنفذ `evaluateIntake` داخليًا. تتأكد الوحدة فقط من استدعاء `buildTrainingDraft` ثم `buildWeeklyTrainingSchedule` ثم `evaluateTrainingPlanPreflight` بالترتيب الإلزامي، ثم ترمي `TypeError` فورًا في حال كسر اتساق الـPipeline (مثل اختلاف `schedule_version` أو `plan_status` بين التقرير والخطة)، ولا تعيد المخرجات الوسيطة.

إجمالي عدد الاختبارات الحالية: 385 اختبارًا.

## Nutrition Planning Snapshot V1

الوحدة المستقلة `src/nutrition-planning-snapshot` تنشئ عبر `buildNutritionPlanningSnapshot(...)` عقدًا ثابتًا يجمع البيانات الغذائية المطلوبة لاحقًا من Raw Client Intake الصحيح، وEvaluation Context الموثوق، وIntake Decision الموجود. وهي متاحة من export الحزمة الفرعي `./nutrition-planning-snapshot` وتصدّر فقط `NUTRITION_PLANNING_SNAPSHOT_VERSION` ودالة البناء.

هذه الوحدة ليست Nutrition Engine كاملًا: لا تحسب BMR أو TDEE أو سعرات أو ماكروز، ولا تختار أطعمة أو وجبات ولا تضيف قواعد تغذية. تستخدم `validateIntake` و`IntakeValidationError` و`calculateAgeYears` من Public API الحالي، ثم تنسخ الأقسام المحددة دون تفسير أو إعادة حساب لقرار التغذية أو التدريب أو الكارديو.

الناتج مستقل عن المدخلات الثلاثة باستخدام `structuredClone` ومجمّد بالكامل بعمق، بما في ذلك كل الكائنات والقوائم وعناصرها؛ لذلك يصلح كنقطة بيانات موثوقة وثابتة للوحدات الغذائية التالية دون مشاركة مراجع قابلة للتعديل.

## Nutrition Energy Target V1

الوحدة المستقلة `src/nutrition-energy-target` تستهلك ناتج `buildNutritionPlanningSnapshot(...)` فقط عبر `buildNutritionEnergyTarget(snapshot)`، وهي متاحة من export الحزمة الفرعي `./nutrition-energy-target`. تصنّف PAL من أعلى إشارة بين نمط الحياة والخطوات وتدريب المقاومة والرياضات الإضافية، ثم تقدّر سعرات المحافظة للبالغين من 19 سنة فأكثر باستخدام معادلات **NASEM DRI 2023 EER** الخاصة بالجنس وفئة النشاط.

الناتج يحدد `READY` أو `PROVISIONAL_REVIEW_REQUIRED` أو `WITHHELD`، ويحافظ على حالات المراجعة القادمة من Intake Decision. يطبّق اتجاه `MAINTENANCE` أو عجزًا أوليًا بنسبة 15% (10% عند الحاجة للمحافظة) بحد 500 kcal/day، أو فائضًا أوليًا بنسبة 8% (5% عند الحاجة للمحافظة) بحد 300 kcal/day. حالات المراجعة الطبية والحظر لا تشغّل معادلة الطاقة.

أرقام المحافظة والهدف **تقديرات أولية وليست قياسًا معمليًا**. عند وجود `target_calories` فعلي يكون `calibration_required=true` لأن المعايرة اللاحقة مقابل تغير الوزن والالتزام مطلوبة. هذه الوحدة لا تحسب Macros، ولا تركّب وجبات، ولا تختار أطعمة، ولا تنفذ المعايرة نفسها.

## Nutrition Macro Targets V1

الوحدة المستقلة `src/nutrition-macro-targets` تستهلك Nutrition Planning Snapshot وNutrition Energy Target فقط عبر `buildNutritionMacroTargets({ nutritionPlanningSnapshot, nutritionEnergyTarget })`، وهي متاحة من export الحزمة الفرعي `./nutrition-macro-targets`. لا تعيد حساب PAL أو السعرات، وتحافظ على حالة الطاقة `READY` أو `PROVISIONAL_REVIEW_REQUIRED` أو `WITHHELD`.

البروتين يعتمد على وزن مرجعي يساوي الأقل بين الوزن الفعلي والوزن المقابل لـBMI 30 وفق Policy V1، ثم يستخدم عاملًا من 1.2 إلى 2.0 g/kg حسب أيام المقاومة وحمل الرياضات واتجاه العجز. يُحد البروتين عند 30% من السعرات؛ وإذا خفضه الحد تحت 1.2 g/kg تصبح النتيجة Provisional مع بقاء الماكروز محسوبة. هذا الحد الحسابي ليس تشخيصًا طبيًا ولا وزنًا مستهدفًا.

الدهون تستهدف 25% من السعرات وتُقرب لأقرب 5g، والكربوهيدرات تستخدم السعرات المتبقية بعد البروتين والدهون. Fiber للبالغين يعتمد على العمر والجنس ولا يُطرح من الكربوهيدرات. الوحدة لا توزع الماكروز على الوجبات، ولا تنشئ Meal Templates، ولا تختار أطعمة أو Supplements.

## Nutrition Meal Distribution V1

الوحدة المستقلة `src/nutrition-meal-distribution` تستهلك Nutrition Planning Snapshot وNutrition Macro Targets فقط عبر `buildNutritionMealDistribution({ nutritionPlanningSnapshot, nutritionMacroTargets })`، وهي متاحة من export الحزمة الفرعي `./nutrition-meal-distribution`. تحافظ على حالات `READY` و`PROVISIONAL_REVIEW_REQUIRED` و`WITHHELD`، ولا تعيد حساب السعرات أو أهداف الماكروز اليومية.

يدعم المسار التلقائي في V1 من وجبتين إلى خمس وجبات فقط وفق خرائط الأدوار والأوزان الثابتة. يوزع البروتين بالتساوي قدر الإمكان، ويوزع الدهون والكربوهيدرات وFiber بخوارزمية Largest Remainder الحتمية مع حسم التعادل حسب تسلسل الوجبة، مع إغلاق أهداف الجرامات وسعرات الماكروز اليومية بالضبط.

تنتج استراتيجيات عدد الوجبات أوضاع `FLEXIBLE_SEQUENCE` أو `AVOID_UNAVAILABLE_WINDOWS` أو `COACH_TO_CONFIRM`. تُحفظ نوافذ عدم القدرة على الأكل دون تعيين أوقات وجبات من النظام، وتحتاج الأعداد خارج 2–5 أو `COACH_TO_CONFIRM` إلى مراجعة. الوحدة لا تختار أطعمة، ولا تنشئ Meal Templates أو Serving Sizes، ولا تفرق بين أيام التدريب والراحة.
