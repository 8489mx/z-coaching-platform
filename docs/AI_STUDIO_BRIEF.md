# رسالة التشغيل لأدوات الذكاء الاصطناعي (Google AI Studio وغيرها)

> انسخ كل ما بداخل الصندوق التالي والصقه في أول كل جلسة عمل جديدة.
> قبل كل جلسة: اعمل commit. بعد كل جلسة: شغّل `npm.cmd test` و`npm.cmd --prefix frontend run build`، ولا تنشر لو فشل أي شيء.

```text
أنت تعمل على منظومة Z Coaching: نظام حي فيه بيانات صحية لعملاء حقيقيين. أي خطأ يؤثر على صحة إنسان. اقرأ قبل أي شيء: CLAUDE.md و GEMINI.md و SYSTEM_CAPABILITIES.md، والتزم بهذه القواعد حرفياً.

== خريطة المشروع ==
- الخادم: Node 22 / Express 5 / MariaDB (Sequelize). نقطة الدخول: src/api/server.js
- الواجهة: React 19 / Vite. نقطة الدخول: frontend/src/main.jsx. صفحات الكوتش محملة بـ React.lazy في App.jsx، وصفحات المتدرب (ClientInteractiveApp, ClientLogin, FullIntakeForm, WeeklyCheckinForm) في الحزمة الرئيسية ولا تُحوَّل إلى lazy.
- محركات الخطة الأساسية: src/master-engine-v2, src/nutrition-meal-context-v2 (بناء الوجبات), src/training-engine-v2, src/checkin-engine, src/adaptation-engine.
- محركات التنفيذ: src/execution-engines (39 ملفاً فقط، كلها مستخدمة). القائمة الحقيقية في SYSTEM_CAPABILITIES.md قسم 3-هـ.

== مصادر الحقيقة (ممنوع كسرها) ==
1) أرقام الأكل: frontend/src/data/foodReference.js هو المرجع الوحيد (USDA مع fdc_id). أي صنف جديد أو تعديل رقم يبدأ من هنا ثم يُطابق في: frontend/src/utils/foodSwapEngine.js و src/nutrition-meal-context-v2/build-culinary-meals.js و src/data/food-catalog.json و data/settings/foods_catalog.json و frontend/src/data/defaultFoodsCatalog.js. الاختبار test/food-reference-guard.test.js يفشل عند أي اختلاف. ممنوع كتابة رقم غذائي بدون مصدر.
2) المحركات الموحدة مصدرها frontend/src/utils (foodSwapEngine, pdfExportEngine, biomechanicalSwapEngine, biomechanicsFirewallEngine, circadianLabTriggerEngine, cardioZonesEngine). الملفات المقابلة في src/execution-engines تعيد التصدير فقط: لا تعدّلها ولا تنسخ كوداً فيها. باقي النسخ المكررة يجب أن تبقى متطابقة (test/engine-copy-drift-guard.test.js).
3) لا تُضف محركاً أو ملفاً جديداً إلا إذا كان مستدعى فعلياً من مسار في الخادم أو شاشة في الواجهة، ومعه اختبار.

== ممنوعات مطلقة ==
- قاعدة البيانات: لا تعديل على بنية الجداول ولا حذف ولا نقل بيانات إلا بنسخة احتياطية وخطة وموافقتي الصريحة. (الأعمدة enable_rest_timer و enable_weight_logging و grocery_list تُركت عمداً، لا تستخدمها).
- الأمان: ممنوع كتابة أي كلمة سر أو كود دخول أو مفتاح داخل الكود أو .env.example. الكوتش والإدارة يدخلون بالبريد وكلمة المرور فقط (login-email)، و login-fast للمتدربين فقط ويرفض ADMIN/COACH. لا تُرجع password في أي رد.
- لا قيم افتراضية صامتة للبيانات الصحية (مثل وزن 75 أو سعرات 1900 عند غياب القيمة): ارفض برسالة واضحة. لا catch فارغ يخفي عطلاً في ميزة أساسية.
- ممنوعات تطبيق المتدرب: لا حقول إدخال أوزان أو جولات، لا مؤقتات، لا عدادات ماء، لا قوائم تسوق. ممنوعات الواجهة: لا <select> افتراضي (استخدم frontend/src/components/common/CurvedSelect.jsx)، لا زوايا حادة، لا إيموجي. كل الردود بالعربية.
- أي قيمة طبية أو غذائية جديدة (حدود بروتين، أدوية، أمراض) اذكر مصدرها العلمي وقل إنها تحتاج مراجعة متخصص.

== قبل أي تعديل ==
- ابحث عن كل مكان يستخدم الملف أو الدالة في frontend/src و src و test و tests و mobile_app واذكر النتيجة.
- إذا كان الطلب غامضاً أو يمس أكثر من جزء: اشرح الخطة والمخاطر واطلب موافقتي أولاً.

== بعد كل تعديل ==
- اذكر كل ملف ودالة تغيّرت بالظبط.
- اطلب مني تشغيل: npm.cmd test ثم npm.cmd --prefix frontend run build. (npm test يشغل بوابة لينت صارمة ثم اختبارات node ثم اختبارات vitest، ويحتاج MariaDB وملف .env).
- لا تقل "تم" أو "تم الاختبار" إلا بعد أن ألصق لك المخرجات الحقيقية. لو فشل أي اختبار قديم: توقف واشرح السبب، ولا تعدّل الاختبار لينجح إلا إذا كان التغيير في السلوك مقصوداً ومعلناً.
- أضف اختباراً في مجلد test لكل إصلاح أو ميزة جديدة يفشل لو انكسرت.
- لو لاحظت خطأً آخر: لا تصلحه بصمت، أخبرني ونفّذه في خطوة منفصلة. لو لست متأكداً قل "لست متأكداً".

== نقاط مفتوحة معروفة (لا تعتبرها أخطاء جديدة) ==
- أرقام تقريبية تنتظر مرجعاً: المكملات، منتجات الماركات اللايت، الأكلات المركبة والإقليمية، العيش البلدي، لحم الجمل، الزبيدي.
- ملف database/migrations/20260821_master_schema.sql غير مطابق للموديلات (الجداول الحقيقية تُبنى بـ Sequelize sync).
- 138 متغيراً غير مستخدم في الواجهة (تحذيرات لينت فقط).
- تطبيق الموبايل Flutter لم يُفحص.
```
