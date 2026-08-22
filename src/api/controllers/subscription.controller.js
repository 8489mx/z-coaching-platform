import { User } from "../models/index.js";

export const PACKAGE_CONFIG = {
  "MAX_3_PLUS_1": {
    tier: "max",
    name: "باقة ماكس (VIP)",
    name_en: "MAX VIP Coaching (3+1 Free)",
    duration_days: 112, // 16 weeks
    checkin_interval_days: 7,
    price: 3500,
    features: ["متابعة أسبوعية دقيقة كل 7 أيام", "تعديل فوري للبرامج", "أولوية في طابور المراجعة"]
  },
  "ELITE_3_PLUS_1": {
    tier: "elite",
    name: "باقة إيليت (3 شهور + 1 مجاناً)",
    name_en: "ELITE Transform (3+1 Free)",
    duration_days: 112, // 16 weeks
    checkin_interval_days: 14,
    price: 2500,
    features: ["متابعة نصف شهرية كل 14 يوماً", "تحديث الخطة كل أسبوعين", "دعم كامل للمبادلات الذكية"]
  },
  // Aliases & legacy
  "max": { tier: "max", name: "باقة ماكس (VIP)", duration_days: 112, checkin_interval_days: 7, price: 3500 },
  "elite": { tier: "elite", name: "باقة إيليت (3 شهور + 1 مجاناً)", duration_days: 112, checkin_interval_days: 14, price: 2500 },
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
