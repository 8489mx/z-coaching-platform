import { User } from "../models/index.js";

export const PACKAGE_CONFIG = {
  "MAX_3_PLUS_1": {
    tier: "max",
    name: "باقة ماكس MAX (4 شهور)",
    name_en: "MAX Coaching (3+1 Free)",
    duration_days: 120,
    checkin_interval_days: 7,
    price: 3500,
    features: ["متابعة أسبوعية دقيقة كل 7 أيام", "تعديل فوري للبرامج", "أولوية في طابور المراجعة"]
  },
  "ELITE_3_PLUS_1": {
    tier: "elite",
    name: "باقة إيليت ELITE (4 شهور)",
    name_en: "ELITE Transform (3+1 Free)",
    duration_days: 120,
    checkin_interval_days: 14,
    price: 2500,
    features: ["متابعة نصف شهرية كل 14 يوماً", "تحديث الخطة كل أسبوعين", "دعم كامل للمبادلات الذكية"]
  },
  "ELITE_6M_PLUS_2": {
    tier: "elite",
    name: "باقة إيليت ELITE نصف سنوية (8 شهور)",
    name_en: "ELITE Semi-Annual (6+2 Free)",
    duration_days: 240,
    checkin_interval_days: 14,
    price: 4200,
    features: ["متابعة كل 14 يوماً", "خطة تحول مستدامة", "دعم كامل للبدائل"]
  },
  "MAX_6M_PLUS_2": {
    tier: "max",
    name: "باقة ماكس MAX نصف سنوية (8 شهور)",
    name_en: "MAX Semi-Annual (6+2 Free)",
    duration_days: 240,
    checkin_interval_days: 7,
    price: 6000,
    features: ["متابعة أسبوعية", "تعديل سعرات أسبوعي", "استجابة فورية على الواتساب"]
  },
  "MAX_YEARLY": {
    tier: "max",
    name: "باقة ماكس MAX السنوية الشاملة (12 شهر)",
    name_en: "MAX Annual (12 Months)",
    duration_days: 365,
    checkin_interval_days: 7,
    price: 9500,
    features: ["متابعة سنوية كاملة", "أولوية مطلقة لكافة الخطط", "تقييمات دورية شاملة"]
  },
  "ELITE_YEARLY": {
    tier: "elite",
    name: "باقة إيليت ELITE السنوية (12 شهر)",
    name_en: "ELITE Annual (12 Months)",
    duration_days: 365,
    checkin_interval_days: 14,
    price: 6500,
    features: ["متابعة نصف شهرية", "خطة سنوية مخصصة"]
  },
  "MAX_1M_TRIAL": {
    tier: "max",
    name: "باقة ماكس MAX السريعة (شهر واحد)",
    name_en: "MAX Kickstart (1 Month)",
    duration_days: 30,
    checkin_interval_days: 7,
    price: 1200,
    features: ["متابعة أسبوعية لمدة شهر", "خطة مخصصة فورية"]
  },
  // Fallbacks
  "MAX": { tier: "max", name: "باقة ماكس MAX", duration_days: 120, checkin_interval_days: 7, price: 3500 },
  "ELITE": { tier: "elite", name: "باقة إيليت ELITE", duration_days: 120, checkin_interval_days: 14, price: 2500 }
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
      const config = PACKAGE_CONFIG[pkgCode] || PACKAGE_CONFIG["ELITE"];

      let daysRemaining = 0;
      let status = "INACTIVE";

      if (c.subscription_start_date && c.subscription_end_date) {
        const endDate = new Date(c.subscription_end_date);
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (daysRemaining > 7) {
          status = "ACTIVE";
          activeCount++;
          if (c.subscription_price) {
             const months = config.duration_days / 30;
             totalMonthlyRevenue += (c.subscription_price / months);
          }
        } else if (daysRemaining > 0 && daysRemaining <= 7) {
          status = "EXPIRING_SOON";
          expiringSoonCount++;
        } else {
          status = "EXPIRED";
          expiredCount++;
        }
      }

      return {
        ...c.toJSON(),
        package_details: config,
        days_remaining: daysRemaining,
        status
      };
    });

    return res.status(200).json({
      overview: {
        total_monthly_revenue: Math.round(totalMonthlyRevenue),
        active_count: activeCount,
        expiring_soon_count: expiringSoonCount,
        expired_count: expiredCount,
        total_clients: clients.length
      },
      clients: enrichedClients
    });

  } catch (err) {
    console.error("getSubscriptionOverview error:", err);
    return res.status(500).json({ error: "فشل استرجاع الاشتراكات" });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { package_code, price, payment_method } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ error: "Client not found" });

    const config = PACKAGE_CONFIG[package_code] || PACKAGE_CONFIG["ELITE"];
    const durationDays = config.duration_days || 120;
    const actualPrice = price || config.price;

    let startDate = new Date();
    if (user.subscription_end_date && new Date(user.subscription_end_date) > new Date()) {
       startDate = new Date(user.subscription_end_date);
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    user.subscription_package = package_code;
    user.subscription_price = actualPrice;
    user.subscription_start_date = startDate;
    user.subscription_end_date = endDate;
    user.payment_method = payment_method || "INSTAPAY";
    user.payment_status = "PAID";
    user.subscription_status = "ACTIVE";
    
    await user.save();

    return res.status(200).json({ message: "تم التجديد بنجاح!", user });
  } catch (err) {
    return res.status(500).json({ error: "فشل تجديد الاشتراك" });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { package_code, price, end_date } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ error: "Client not found" });

    if (package_code) user.subscription_package = package_code;
    if (price !== undefined) user.subscription_price = price;
    if (end_date) user.subscription_end_date = end_date;
    
    await user.save();
    return res.status(200).json({ message: "تم تعديل الاشتراك", user });
  } catch (err) {
    return res.status(500).json({ error: "فشل التعديل" });
  }
};
