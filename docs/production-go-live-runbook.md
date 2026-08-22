# دليل التشغيل القياسي والنشر الحي (Production Go-Live Runbook)
## Z Coaching & Captain Karim Zakaria Platform

---

### 1. الروتين اليومي القياسي للكوتش (The 15-Minute Daily SOP)

| الوقت | النافذة / الإجراء | الهدف |
|---|---|---|
| **الدقيقة 0 - 5** | فتح شاشة `/today` واعتماد المتابعات المستحقة | اعتماد قرارات محرك التكيف التلقائي وإرسال رسائل الواتساب بنقرة واحدة (الأولوية لـ MAX VIP). |
| **الدقيقة 5 - 10** | مراجعة استمارات العودة من التجميد (Re-Entry) والمشتركين الجدد | اعتماد أسبوع التهيئة (Ramp-Up) أو التفعيل المباشر وتمرير الاستمارات عبر جدار الأمان السريري. |
| **الدقيقة 10 - 15** | رادار الانقطاع 48 ساعة وتجديدات الأسبوع 14 | إرسال رسائل الاطمئنان لرادار الانقطاع وعروض التجديد بخصم 25% مع كود المشترك المخصص. |
| **النتيجة** | الوصول لشاشة **🎉 ALL CAUGHT UP! INBOX ZERO** | إغلاق اللوحة والاستمتاع بباقي اليوم دون أي تراكم أو فوضى إدارية. |

---

### 2. إعدادات النشر على الدومين المباشر (Domain & PWA Configuration)

1. **الربط بالدومين الرسمي:**
   - توجيه سجلات A و CNAME إلى خادم الإنتاج مع تفعيل شهادة الأمان **SSL / HTTPS الإلزامية**.
2. **ترويسات التخزين المؤقت (Cache-Control Headers):**
   - لملفات الأصول الثابتة (`assets/*`): `Cache-Control: public, max-age=31536000, immutable`.
   - لملف `manifest.json` و `sw.js`: `Cache-Control: no-cache, no-store, must-revalidate`.
3. **تثبيت الـ PWA:**
   - جاهزية التثبيت التلقائي على هواتف Android و iOS بنقرة واحدة دون الحاجة لمتاجر التطبيقات.

---

### 3. متغيرات البيئة للإنتاج (Production Environment Schema)

```env
# Supabase Production Live Instance
VITE_SUPABASE_URL=https://your-live-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your-live-anon-key

# Master Secret for Token Signing
ZCC_MASTER_ACQUISITION_SECRET_2026=your-ultra-secure-random-32-byte-hex

# Platform Domain
VITE_PLATFORM_URL=https://zcoaching.app
```
