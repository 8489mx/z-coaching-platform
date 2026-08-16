import { User } from "../models/index.js";

const PACKAGE_DAYS = {
  "1_MONTH": 30,
  "3_MONTHS": 90,
  "6_MONTHS": 180,
  "12_MONTHS": 365,
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
      const start = c.subscription_start_date ? new Date(c.subscription_start_date) : new Date(c.createdAt);
      let end = c.subscription_end_date ? new Date(c.subscription_end_date) : null;

      if (!end) {
        end = new Date(start);
        end.setDate(end.getDate() + (PACKAGE_DAYS[c.subscription_package] || 30));
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
        totalMonthlyRevenue += Number(c.subscription_price) || 1500;
      } else {
        computedStatus = "ACTIVE";
        activeCount++;
        totalMonthlyRevenue += Number(c.subscription_price) || 1500;
      }

      return {
        id: c.id,
        client_code: c.client_code,
        full_name: c.full_name,
        phone_number: c.phone_number,
        package: c.subscription_package || "1_MONTH",
        price: Number(c.subscription_price) || 1500,
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

    const pkg = package_code || user.subscription_package || "1_MONTH";
    const daysToAdd = PACKAGE_DAYS[pkg] || 30;

    const currentEnd = user.subscription_end_date ? new Date(user.subscription_end_date) : new Date();
    const newStartDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);

    user.subscription_package = pkg;
    user.subscription_start_date = newStartDate;
    user.subscription_end_date = newEndDate;
    user.subscription_status = "ACTIVE";
    await user.save();

    return res.status(200).json({
      message: "تم تجديد الاشتراك بنجاح!",
      user
    });
  } catch (err) {
    console.error("renewSubscription error:", err);
    return res.status(500).json({ error: "فشل تجديد الاشتراك", details: err.message });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { subscription_package, subscription_price, subscription_start_date, subscription_end_date } = req.body;

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

    if (subscription_package) user.subscription_package = subscription_package;
    if (subscription_price !== undefined) user.subscription_price = Number(subscription_price);
    if (subscription_start_date) user.subscription_start_date = new Date(subscription_start_date);
    if (subscription_end_date) user.subscription_end_date = new Date(subscription_end_date);

    await user.save();

    return res.status(200).json({
      message: "تم تحديث بيانات الاشتراك بنجاح!",
      user
    });
  } catch (err) {
    console.error("updateSubscription error:", err);
    return res.status(500).json({ error: "فشل تحديث بيانات الاشتراك", details: err.message });
  }
};
