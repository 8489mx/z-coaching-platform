import { User } from "../models/index.js";

export const PACKAGE_CONFIG = {
  "MAX_3_PLUS_1": {
    tier: "max",
    name: "باقة ماكس (VIP 4 شهور)",
    name_en: "MAX VIP Coaching (3+1 Free)",
    duration_days: 120,
    checkin_interval_days: 7,
    price: 3500,
    features: ["متابعة أسبوعية دقيقة كل 7 أيام", "تعديل فوري للبرامج", "أولوية في طابور المراجعة"]
  },
  "ELITE_3_PLUS_1": {
    tier: "elite",
    name: "باقة إيليت (4 شهور)",
    name_en: "ELITE Transform (3+1 Free)",
    duration_days: 120,
    checkin_interval_days: 14,
    price: 2500,
    features: ["متابعة نصف شهرية كل 14 يوماً", "تحديث الخطة كل أسبوعين", "دعم كامل للمبادلات الذكية"]
  },
  "ELITE_6M_PLUS_2": {
    tier: "elite",
    name: "باقة إيليت نصف سنوية (8 شهور)",
    name_en: "ELITE Semi-Annual (6+2 Free)",
    duration_days: 240,
    checkin_interval_days: 14,
    price: 4200,
    features: ["متابعة كل 14 يوماً", "خطة تحول مستدامة", "دعم كامل للبدائل"]
  },
  "REHAB_CLINICAL_3M": {
    tier: "max",
    name: "باقة التأهيل والرعاية الطبية (3 شهور)",
    name_en: "Clinical Rehab & Safety (3 Months)",
    duration_days: 90,
    checkin_interval_days: 7,
    price: 3000,
    features: ["متابعة أسبوعية حذرة", "تعديل مستمر لمسارات التمارين", "تنسيق كامل مع التحاليل"]
  },
  "VIP_PRO_6M": {
    tier: "max",
    name: "باقة VIP الاحترافية (6 شهور)",
    name_en: "VIP Pro Athlete (6 Months)",
    duration_days: 180,
    checkin_interval_days: 7,
    price: 6000,
    features: ["متابعة VIP كل 7 أيام", "تعديل سعرات أسبوعي", "استجابة فورية على الواتساب"]
  },
  "LIFESTYLE_TRANSFORMATION_3M": {
    tier: "elite",
    name: "باقة تحول نمط الحياة (3 شهور)",
    name_en: "Lifestyle Transformation (3 Months)",
    duration_days: 90,
    checkin_interval_days: 14,
    price: 2800,
    features: ["متابعة نصف شهرية", "تعديل عادات ونشاط NEAT", "مرونة غذائية"]
  },
  "MAX_YEARLY_VIP": {
    tier: "max",
    name: "باقة VIP السنوية الشاملة (12 شهر)",
    name_en: "Ultimate Annual VIP (12 Months)",
    duration_days: 365,
    checkin_interval_days: 7,
    price: 9500,
    features: ["متابعة سنوية كاملة", "أولوية مطلقة لكافة الخطط", "تقييمات دورية شاملة"]
  },
  "MAX_1M_TRIAL": {
    tier: "max",
    name: "باقة التجربة السريعة (شهر واحد)",
    name_en: "Fast Kickstart (1 Month)",
    duration_days: 30,
    checkin_interval_days: 7,
    price: 1200,
    features: ["متابعة أسبوعية لمدة شهر", "خطة مخصصة فورية"]
  },
  // Aliases & legacy
  "max": { tier: "max", name: "باقة ماكس (VIP)", duration_days: 120, checkin_interval_days: 7, price: 3500 },
  "elite": { tier: "elite", name: "باقة إيليت (4 شهور)", duration_days: 120, checkin_interval_days: 14, price: 2500 },
  "1_MONTH": { tier: "elite", name: "باقة شهرية", duration_days: 30, checkin_interval_days: 7, price: 1000 },
  "3_MONTHS": { tier: "elite", name: "باقة 3 شهور", duration_days: 90, checkin_interval_days: 14, price: 2000 },
  "6_MONTHS": { tier: "max", name: "باقة 6 شهور VIP", duration_days: 180, checkin_interval_days: 7, price: 5000 },
  "12_MONTHS": { tier: "max", name: "باقة سنة كاملة VIP", duration_days: 365, checkin_interval_days: 7, price: 8000 }
};

export const getSubscriptionOverview = async (req, res) => {
  try {
    const clients = await User.findAll({
      where: { role: "CLIENT" },
      order: [["id", "DESC"]]
    });

    const now = new Date();
    let totalMonthlyRevenue = 0;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    const enrichedClients = clients.map((c) => {
      const pkgCode = c.subscription_package || "ELITE_3_PLUS_1";
      const config = PACKAGE_CONFIG[pkgCode] || PACKAGE_CONFIG["ELITE_3_PLUS_1"];

      const start = c.subscription_start_date ? new Date(c.subscription_start_date) : new Date(c.createdAt);
      let end = c.subscription_end_date ? new Date(c.subscription_end_date) : null;

      if (!end) {
        end = new Date(start);
        end.setDate(end.getDate() + config.duration_days);
      }

      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let computedStatus = "ACTIVE";
      if (daysRemaining < 0) {
        computedStatus = "EXPIRED";
        expiredCount++;
      } else if (daysRemaining <= 7) {
        computedStatus = "EXPIRING_SOON";
        expiringSoonCount++;
        activeCount++;
        totalMonthlyRevenue += Number(c.subscription_price) || config.price;
      } else {
        computedStatus = "ACTIVE";
        activeCount++;
        totalMonthlyRevenue += Number(c.subscription_price) || config.price;
      }

      return {
        id: c.id,
        client_code: c.client_code,
        full_name: c.full_name,
        phone_number: c.phone_number,
        package: config.name,
        package_code: pkgCode,
        tier: config.tier,
        is_vip: config.tier === "max",
        checkin_interval_days: config.checkin_interval_days,
        price: Number(c.subscription_price) || config.price,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        days_remaining: daysRemaining,
        status: computedStatus,
      };
    });

    return res.status(200).json({
      overview: {
        total_monthly_revenue: totalMonthlyRevenue,
        active_count: activeCount,
        expiring_soon_count: expiringSoonCount,
        expired_count: expiredCount,
        total_clients: clients.length,
      },
      clients: enrichedClients
    });
  } catch (err) {
    console.error("getSubscriptionOverview error:", err);
    return res.status(500).json({ error: "فشل استرجاع بيانات الاشتراكات", details: err.message });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { package_code } = req.body || {};

    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const pkg = package_code || user.subscription_package || "ELITE_3_PLUS_1";
    const config = PACKAGE_CONFIG[pkg] || PACKAGE_CONFIG["ELITE_3_PLUS_1"];
    const daysToAdd = config.duration_days;

    const currentEnd = user.subscription_end_date ? new Date(user.subscription_end_date) : new Date();
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()));
    newEnd.setDate(newEnd.getDate() + daysToAdd);

    await user.update({
      subscription_package: pkg,
      subscription_price: config.price,
      subscription_end_date: newEnd,
      subscription_status: "ACTIVE"
    });

    return res.status(200).json({
      success: true,
      message: "تم تجديد الاشتراك بنجاح",
      user
    });
  } catch (err) {
    console.error("renewSubscription error:", err);
    return res.status(500).json({ error: "فشل تجديد الاشتراك", details: err.message });
  }
};

export const overrideClientCheckin = async (req, res) => {
  try {
    const { user_id, reason = "Super Admin Override: استثناء إداري لفتح متابعة فورية" } = req.body;
    let user = await User.findByPk(user_id);
    if (!user) {
      user = await User.findOne({ where: { client_code: String(user_id) } });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set an override flag in user metadata
    return res.status(200).json({
      success: true,
      message: "تم فتح نافذة المتابعة الاستثنائية فوراً بصلاحية Super Admin Override",
      user_id: user.id,
      checkin_url: `/check-in?user_id=${user.id}&override=true`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { package_code, price, end_date } = req.body;
    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update({
      subscription_package: package_code || user.subscription_package,
      subscription_price: price || user.subscription_price,
      subscription_end_date: end_date ? new Date(end_date) : user.subscription_end_date
    });
    return res.status(200).json({ success: true, message: "Subscription updated successfully", user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
