/**
 * وحدة السياسات القانونية والامتثال لمتجري أبل وجوجل (Legal & Store Compliance)
 * تتضمن سياسة الخصوصية الرسمية وشروط الخدمة وإخلاء المسؤولية الطبي وشرط السن (18+)
 */

export const getPrivacyPolicy = (req, res) => {
  const isHtml = req.accepts('html');
  
  if (!isHtml && req.query.format !== 'html') {
    return res.json({
      title: "سياسة الخصوصية وحماية البيانات - منظومة Z Coaching",
      last_updated: "2026-09-01",
      min_age: 18,
      data_collected: [
        "البيانات الشخصية الأساسية (الاسم، رقم الهاتف، البريد الإلكتروني)",
        "المؤشرات والقياسات البدنية (الوزن، الطول، محيطات الجسم، مستوى النشاط)",
        "صور التقييم الأسبوعي لمتابعة التطور العضلي والدهني"
      ],
      photo_privacy_guarantee: "الصور مشفرة ومحفوظة بسرية تامة، ومحصورة بين المتدرب وكوتشه الخاص فقط. لا تُشارك مع أي طرف ثالث إطلاقاً.",
      account_deletion_url: "/api/v1/auth/delete-account",
      contact_email: "support@z-coaching.com"
    });
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سياسة الخصوصية وحماية البيانات | منظومة Z للتدريب الرياضي</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif;
      background-color: #0F172A;
      color: #F8FAFC;
      line-height: 1.8;
      padding: 30px 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #1E293B;
      padding: 35px;
      border-radius: 16px;
      border: 1px solid #334155;
    }
    h1 { color: #10B981; font-size: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    h2 { color: #38BDF8; font-size: 18px; margin-top: 25px; }
    p, li { color: #CBD5E1; font-size: 15px; }
    ul { padding-right: 20px; }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      border: 1px solid #10B981;
      margin-bottom: 15px;
    }
    .warning-box {
      background: rgba(245, 158, 11, 0.1);
      border-right: 4px solid #F59E0B;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 35px;
      border-top: 1px solid #334155;
      padding-top: 15px;
      font-size: 13px;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">وثيقة معتمدة ومطابقة لمتجري Apple App Store و Google Play</div>
    <h1>سياسة الخصوصية وحماية البيانات الشخصية</h1>
    <p>تاريخ السريان: سبتمبر 2026 | منظومة Z Coaching Platform</p>

    <h2>1. الفئة العمرية المصرح لها (السن 18+)</h2>
    <div class="warning-box">
      <strong>شرط الأهلية القانونية والسن:</strong> تطبيق ومنظومة Z مخصصة حصراً للأشخاص البالغين الذين أتموا 18 عاماً فما فوق. المنظومة لا تجمع عمداً أي بيانات لأي شخص دون سن 18 عاماً. إذا تم اكتشاف تسجيل أي شخص دون السن القانوني دون موافقة كتابية صريحة من ولي الأمر، يتم حذف الحساب وبياناته فوراً.
    </div>

    <h2>2. البيانات التي يتم جمعها</h2>
    <p>لتقديم خطط التدريب والتغذية المخصصة والمتابعة الدقيقة، تجمع المنظومة:</p>
    <ul>
      <li>بيانات الهوية والاتصال: كود المشترك، الاسم، رقم الهاتف، والبريد الإلكتروني.</li>
      <li>البيانات البدنية والفسيولوجية: الوزن، الطول، قياسات محيطات الجسم، ساعات النوم، ومستوى النشاط اليومي.</li>
      <li>صور التقييم الأسبوعي: صور ملتقطة بزوايا (أمام، جانب، ظهر) لتقييم التطور العضلي وانخفاض الدهون.</li>
    </ul>

    <h2>3. حماية وسرية صور التطور الأسبوعي</h2>
    <p>نحن ندرك الأهمية البالغة لخصوصية صور المشتركين، ولذلك نلتزم بما يلي:</p>
    <ul>
      <li>تُحفظ الصور في خوادم مشفرة ومحمية بمسارات معزولة فيزيائياً.</li>
      <li>لا يطّلع على الصور إطلاقاً إلا المشترك نفسه وكوتشه التدريبي المسؤول عن خطته.</li>
      <li>يُمنع منعاً باتاً بيع أو مشاركة أو تداول صور المشتركين مع أي طرف ثالث أو شبكات إعلانية أو استغلالها تسويقياً دون موافقة كتابية موثقة ومسبقة من صاحب الشأن.</li>
    </ul>

    <h2>4. حذف الحساب وكافة البيانات نهائياً (امتثالاً لقواعد Apple 5.1.1(v))</h2>
    <p>يمتلك المشترك الحق الكامل في حذف حسابه وكافة بياناته وسجلاته وصوره نهائياً في أي وقت. يمكن تنفيذ ذلك مباشرة من داخل التطبيق عبر خيار "حذف الحساب نهائياً" في شاشة الإعدادات، أو بمراسلتنا. يتم الحذف الفوري والكامل لكافة السجلات والملفات من خوادمنا بشكل لا رجعة فيه.</p>

    <h2>5. التواصل مع مسؤول حماية البيانات</h2>
    <p>لأي استفسارات قانونية أو ممارسة حقوق الخصوصية وحذف البيانات: <br>
    البريد الإلكتروني: <strong>support@z-coaching.com</strong></p>

    <div class="footer">
      منظومة Z للتدريب الرياضي - جميع الحقوق محفوظة © 2026
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};

export const getTermsOfService = (req, res) => {
  const isHtml = req.accepts('html');
  
  if (!isHtml && req.query.format !== 'html') {
    return res.json({
      title: "شروط الاستخدام وإخلاء المسؤولية الطبي (EULA)",
      last_updated: "2026-09-01",
      min_age: 18,
      medical_disclaimer: "المنظومة لأغراض اللياقة البدنية والرياضية وليست بديلاً عن الاستشارة أو التشخيص الطبي. استشر طبيبك دائماً قبل بدء أي حمية أو تمرين مكثف.",
      user_conduct_policy: "حظر تام لرفع أي صور مخلة أو غير رياضية مع الحظر الفوري للحساب المخالف.",
      eula: "ترخيص استخدام شخصي غير تجاري وغير قابل للتحويل."
    });
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شروط الاستخدام وإخلاء المسؤولية الطبي | منظومة Z</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif;
      background-color: #0F172A;
      color: #F8FAFC;
      line-height: 1.8;
      padding: 30px 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #1E293B;
      padding: 35px;
      border-radius: 16px;
      border: 1px solid #334155;
    }
    h1 { color: #10B981; font-size: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    h2 { color: #38BDF8; font-size: 18px; margin-top: 25px; }
    p, li { color: #CBD5E1; font-size: 15px; }
    ul { padding-right: 20px; }
    .disclaimer-box {
      background: rgba(239, 68, 68, 0.1);
      border-right: 4px solid #EF4444;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .disclaimer-box strong { color: #EF4444; }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: #38BDF8;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      border: 1px solid #38BDF8;
      margin-bottom: 15px;
    }
    .footer {
      margin-top: 35px;
      border-top: 1px solid #334155;
      padding-top: 15px;
      font-size: 13px;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">اتفاقية ترخيص المستخدم النهائي (EULA) وإخلاء المسؤولية القانوني</div>
    <h1>شروط الاستخدام وإخلاء المسؤولية الطبي</h1>
    <p>تاريخ السريان: سبتمبر 2026 | منظومة Z Coaching Platform</p>

    <div class="disclaimer-box">
      <strong>إخلاء مسؤولية طبي صارم (Medical Disclaimer):</strong><br>
      المعلومات والخطط التدريبية والغذائية وحسابات السعرات المقدمة عبر المنظومة هي لأغراض اللياقة البدنية والرياضية العامة فقط، ولا تُعد بأي شكل من الأشكال بديلاً عن الاستشارة الطبية المتخصصة أو التشخيص الإكلينيكي أو العلاج الطبي. يجب على المشترك استشارة الطبيب المختص قبل البدء في أي نشاط بدني مكثف أو حمية غذائية مقيدة، لا سيما إن كان يعاني من أي أمراض مزمنة أو إصابات مفصلية. المشترك يتحمل كامل المسؤولية عن لياقته وسلامته البدنية أثناء ممارسة التمارين.
    </div>

    <h2>1. شرط السن والأهلية (18+ فقط)</h2>
    <p>باستخدامك للتطبيق، تُقر وتتعهد بأن عمرك لا يقل عن 18 عاماً ميلادياً، وأنك تتمتع بالأهلية القانونية الكاملة للموافقة على هذه الاتفاقية والالتزام ببنودها وممارسة النشاط الرياضي.</p>

    <h2>2. ميثاق المحتوى المرفوع وضوابط الصور الأسبوعية</h2>
    <p>تلتزم المنظومة بسياسة عدم التسامح المطلق (Zero-Tolerance Policy) مع أي محتوى غير لائق:</p>
    <ul>
      <li>صور المتابعة الأسبوعية مخصصة حصراً لقياس أبعاد التطور البدني العضلي بالملابس الرياضية المحتشمة المخصصة للتمرين.</li>
      <li>يُمنع منعاً باتاً رفع أو تداول أي صور مخلة أو عارية أو مسيئة.</li>
      <li>تحتفظ إدارة المنظومة بحق التعطيل الفوري والدائم لأي حساب يرتكب أي انتهاك لهذه الضوابط، دون أي التزام برد الاشتراكات.</li>
    </ul>

    <h2>3. ترخيص الاستخدام (EULA)</h2>
    <p>تمنحك المنظومة ترخيصاً شخصياً، غير حصري، وغير قابل للتحويل لاستخدام التطبيق لمتابعة برنامجك الرياضي الشخصي فقط. يُحظر تماماً نسخ أو فك تشفير أو إعادة بيع المنظومة أو محتواها الحصري.</p>

    <h2>4. سياسة التعديلات وحذف الحساب</h2>
    <p>يحق للمشترك إنهاء حسابه وحذف كافة بياناته وصوره نهائياً في أي وقت عبر زر "حذف الحساب" المتاح داخل التطبيق، أو عبر التواصل مع الإدارة.</p>

    <div class="footer">
      منظومة Z للتدريب الرياضي - جميع الحقوق محفوظة © 2026
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};

export const getDeleteAccountPage = (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>طلب حذف الحساب والبيانات الشخصية | منظومة Z</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif;
      background-color: #0F172A;
      color: #F8FAFC;
      line-height: 1.8;
      padding: 30px 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #1E293B;
      padding: 35px;
      border-radius: 16px;
      border: 1px solid #334155;
    }
    h1 { color: #EF4444; font-size: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    h2 { color: #38BDF8; font-size: 18px; margin-top: 25px; }
    p, li { color: #CBD5E1; font-size: 15px; }
    ul { padding-right: 20px; }
    .badge {
      display: inline-block;
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      border: 1px solid #EF4444;
      margin-bottom: 15px;
    }
    .card {
      background: #0F172A;
      border: 1px solid #334155;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 35px;
      border-top: 1px solid #334155;
      padding-top: 15px;
      font-size: 13px;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">امتثال لمعايير Apple App Store 5.1.1(v) و Google Play User Data Policy</div>
    <h1>طلب حذف الحساب والبيانات نهائياً</h1>
    <p>تلتزم منظومة Z بتمكين المستخدم من الحذف الكامل لحسابه وبياناته في أي وقت.</p>

    <h2>طرق حذف الحساب:</h2>
    <div class="card">
      <h3 style="color:#10B981; margin-top:0;">الطريقة الأولى: من داخل تطبيق الهاتف أو لوحة المشترك</h3>
      <p>1. افتح تطبيق الهاتف أو ادخل على لوحة المشترك.<br>
      2. انتقل إلى شاشة الإعدادات أو الملف الشخصي.<br>
      3. اضغط على زر <strong>"حذف الحساب نهائياً"</strong> وأكّد العملية برقم الهاتف المسجل.</p>
    </div>

    <div class="card">
      <h3 style="color:#38BDF8; margin-top:0;">الطريقة الثانية: طلب الحذف المباشر عبر مسؤول النظام</h3>
      <p>يمكنك مراسلة فريق الدعم الفني مباشرة لطلب الحذف الفوري عبر البريد الإلكتروني:<br>
      <strong>support@z-coaching.com</strong><br>
      مع ذكر كود المشترك ورقم الهاتف المسجل. يتم مسح كافة البيانات والصور والسجلات نهائياً خلال 24 ساعة كحد أقصى.</p>
    </div>

    <h2>ما البيانات التي يتم حذفها نهائياً؟</h2>
    <ul>
      <li>كافة صور المتابعة الأسبوعية المشفرة.</li>
      <li>سجلات الوزن والقياسات البدنية وتاريخ التطور.</li>
      <li>البرامج التدريبية والغذائية المسجلة باسم المشترك.</li>
      <li>بيانات الهوية ورقم الهاتف والبريد الإلكتروني من قاعدة البيانات.</li>
    </ul>

    <div class="footer">
      منظومة Z للتدريب الرياضي - جميع الحقوق محفوظة © 2026
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};
