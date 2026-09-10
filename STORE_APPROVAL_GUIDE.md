# دليل حماية واعتماد التطبيق على متجري Apple App Store و Google Play

تم إعداد هذا الدليل لحماية حساب المطور ومنظومة Z Coaching Platform من أي حظر (Ban) أو رفض (Rejection)، ومعالجة كافة الثغرات التي تسببت في حظر التطبيقات المشابهة (مثل تجربة صديقك) وفقاً لأحدث سياسات متجري Apple و Google.

---

## 1. أسباب حظر ورفض تطبيقات اللياقة والتدريب وكيف عالجناها جذرياً

| سبب الحظر / الرفض الشائع | السياسة الرسمية | كيف تم تحصين منظومة Z في الكود؟ |
|---|---|---|
| **تصنيف السن غير المتطابق (Age Rating)** | Apple Guideline 1.3<br>Google Families Policy | - المنظومة مخصصة للبالغين **18+ فقط**.<br>- تمت إضافة **Age Gate** إلزامي في شاشة الدخول: *"أقر بأن عمري 18 عاماً فما فوق"*.<br>- تم توثيق شرط السن في صفحة سياسة الخصوصية الرسمية. |
| **غياب خيار حذف الحساب (Account Deletion)** | Apple Guideline 5.1.1(v)<br>*(السبب الأول لرفض أبل منذ 2022)* | - تمت إضافة زر أحمر صريح: **"حذف الحساب نهائياً"** داخل التطبيق.<br>- برمجة مسار آمن في الخادم `/api/v1/auth/delete-account` يمسح حساب المتدرب وكافة صوره وسجلاته دون رجعة. |
| **غياب إخلاء المسؤولية الطبي (Medical Disclaimer)** | Apple Guideline 1.4.1<br>Google Health Apps Policy | - صياغة إخلاء مسؤولية طبي قانوني صارم يوضح أن التطبيق رياضي للياقة العامة وليس بديلاً عن الاستشارة أو التشخيص الطبي.<br>- إلزام المشترك بالموافقة عليه قبل الدخول. |
| **صور التقييم الأسبوعي (User Generated Content)** | Apple Guideline 1.2<br>Google Inappropriate Content | - فرض صندوق تنبيهي أمني في شاشة رفع الصور يؤكد التزام سياسة عدم التسامح المطلق (Zero-Tolerance) ومنع أي صور غير رياضية.<br>- تشفير وحماية الصور وقصرها على الكوتش والمتدرب فقط. |
| **غياب روابط الخصوصية والشروط العامة (Privacy & EULA)** | Apple Guideline 5.1.1<br>Google User Data Policy | - إنشاء مسارات ويب عامة حية تفتح بدون تسجيل دخول:<br>`https://your-domain.com/privacy-policy`<br>`https://your-domain.com/terms-of-service` |
| **أوصاف أذونات الكاميرا والصور الناقصة** | Apple Guideline 5.1.1<br>Android Permissions | - كتابة أوصاف واضحة ومفصلة باللغتين العربية والإنجليزية في `Info.plist` و `AndroidManifest.xml` توضح سبب الحاجة للكاميرا بدقة. |

---

## 2. الإجابات النموذجية عند ملء استبيان المتاجر (Store Questionnaires)

### أ. في متجر Apple (App Store Connect)
1. **استبيان تصنيف المحتوى (Age Rating)**:
   - هل يحتوي التطبيق على محتوى طبي أو استشارات علاجية؟ **نعم بشكل محدود (Medical/Treatment Information: Infrequent/Mild)**.
   - هل يرفع المستخدمون صوراً؟ **نعم (Unrestricted Web Access / User Content: Infrequent)**.
   - **النتيجة المطلوبة**: سيمنح متجر أبل التطبيق تصنيف **17+** (وهذا هو التصنيف الأضمن لحماية التطبيق من أي مساءلة بخصوص القُصّر أو الأطفال).

2. **بيانات اعتماد المراجع (App Review Information)**:
   - يجب تزويد مراجع أبل بحساب تجريبي فعال ومفتوح مع خطة جاهزة:
     - **كود المشترك**: `1`
     - **رقم الهاتف**: `01000000000`
   - كتابة ملاحظة للمراجع (Review Notes):
     > *"This app is a companion tool for one-on-one professional athletic and nutrition coaching. All weekly check-in photos are strictly private, encrypted, and accessible only by the verified trainee and their assigned coach. The app complies with Guideline 5.1.1(v) with a full in-app account deletion mechanism."*

---

### ب. في متجر Google Play (Google Play Console)
1. **الجمهور المستهدف والفئات العمرية (Target Audience)**:
   - اختر الفئة العمرية: **18 عاماً فما فوق فقط (18 and above)**.
   - تجنب نهائياً اختيار فئات تشمل الأطفال أو المراهقين دون 18 لحماية الحساب من قوانين COPPA المعقدة.
2. **سياسة التطبيقات الصحية (Health Apps Declaration)**:
   - اختر: **تطبيق لياقة وتدريب رياضي وتغذية (Fitness & Nutrition)**.
   - أقر بأن التطبيق لا يقدم خدمات التشخيص أو العلاج الإكلينيكي الطبي.
3. **رابط سياسة الخصوصية (Privacy Policy URL)**:
   - ضع الرابط العام المباشر:
     `https://your-domain.com/privacy-policy`

---

## 3. الروابط المتاحة الآن على الخادم

- رابط سياسة الخصوصية الرسمي: `/privacy-policy`
- رابط شروط الخدمة واتفاقية ترخيص المستخدم (EULA): `/terms-of-service`
- واجهة حذف الحساب الفورية: `DELETE /api/v1/auth/delete-account`
