# دليل النشر والتشغيل الشامل على استضافة هوستنجر (Hostinger Full Deployment Guide)

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
