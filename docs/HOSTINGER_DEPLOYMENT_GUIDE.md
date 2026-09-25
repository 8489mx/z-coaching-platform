# دليل النشر والتشغيل الشامل على استضافة هوستنجر (Hostinger Full Deployment Guide)

## رفع تحديث على سيرفر شغال (خمس خطوات)

السيرفر شغال بـ PM2 خلف nginx (`ecosystem.config.cjs`، `deploy/nginx/z-coaching.conf`). التحديث ده مفيهوش أي تعديل على قاعدة البيانات، فمفيش هجرة ولا نسخة احتياطية مطلوبة قبله.

```bash
cd ~/z-coaching-platform        # 1. مجلد المشروع على السيرفر
git pull origin main            # 2. جلب آخر نسخة
npm ci                          # 3. تحديث الحزم
npm --prefix frontend ci && npm --prefix frontend run build   # 4. بناء الموقع
pm2 restart z-coaching-platform # 5. إعادة تشغيل الخادم
```

**تأكد إن كله تمام بعد الخطوة الخامسة:**

```bash
pm2 status                                  # لازم z-coaching-platform حالته online
curl -s http://127.0.0.1:3000/api/v1/health # لازم يرد HEALTHY
git log --oneline -1                        # لازم يطابق آخر كوميت على GitHub
pm2 logs z-coaching-platform --lines 30     # آخر 30 سطر، لازم من غير أخطاء
```

**لو حصلت مشكلة بعد النشر:** `git reset --hard <كود الكوميت القديم>` ثم إعادة البناء وإعادة التشغيل بنفس الخطوات 4 و5.

---

يوضح هذا الدليل الخطوات التفصيلية لرفع وتشغيل منصة **Z Coaching Platform** (الفرونت إند، الباك إند، وقاعدة بيانات MySQL) على استضافة **Hostinger**.

---

## الخيار الأول (الموصى به والأبسط): التشغيل الموحد (Unified Node.js App)
في هذا الخيار، يقوم خادم Node.js (Express) بتشغيل الباك إند وتقديم ملفات الفرونت إند المجمعة (`frontend/dist`) والاتصال بقاعدة بيانات MySQL على نفس الاستضافة مع منع أي مشاكل CORS تلقائياً.

### 1. إعداد قاعدة بيانات MySQL على هوستنجر (hPanel):
1. ادخل على لوحة تحكم هوستنجر (`hPanel`) -> **Databases** -> **MySQL Databases**.
2. أنشئ قاعدة بيانات جديدة باسم مثل: `u123456_zcoach`.
3. أنشئ مستخدم للقاعدة مع كلمة مرور قوية.
4. احتفظ بالبيانات التالية:
   - **DB_HOST**: `localhost` أو `127.0.0.1`
   - **DB_NAME**: اسم القاعدة المنشأة
   - **DB_USER**: اسم المستخدم
   - **DB_PASSWORD**: كلمة المرور

### 2. بناء الفرونت إند محلياً أو على السيرفر:
قبل رفع الملفات، قم ببناء الفرونت إند لإنتاج مجلد `frontend/dist`:
```bash
npm --prefix frontend run build
```

### 3. إعداد متغيرات البيئة (`.env`):
أنشئ ملف `.env` في المجلد الرئيسي للسيرفر بناءً على `.env.example`:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456_zcoach
DB_USER=u123456_zcoach_user
DB_PASSWORD=كلمة_مرور_القاعدة
JWT_SECRET=z_coaching_production_secret_key_2026
```

### 4. تشغيل تطبيق Node.js على هوستنجر:
- من لوحة `hPanel` -> **Advanced** -> **Node.js** (أو عبر Terminal / SSH):
  - **Node.js version**: اختر 18.x أو 20.x أو 22.x
  - **Application startup file**: `src/api/server.js`
  - **Run `npm install`**.
- شغّل التطبيق وسيعمل النظام بالكامل على نطاقك الرئيسي.

---

## الخيار الثاني: فصل الفرونت إند عن الباك إند (Subdomain / Static Hosting)
إذا كنت تفضل رفع ملفات الفرونت إند في `public_html` وتشغيل الباك إند على نطاق فرعي (مثل `api.yourdomain.com`):
1. ارفع محتويات مجلد `frontend/dist` إلى مجلد `public_html`.
2. تأكد من وجود ملف `.htaccess` في `public_html` لدعم مسارات React Router.
3. اضبط نطاق الباك إند في ملف `frontend/.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
4. أعد بناء الفرونت إند وارفعه.
