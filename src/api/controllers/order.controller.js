import { Order, User } from "../models/index.js";

// Receive Order from Marketing Website Checkout Funnel or Client Online Renewal
export const createOrder = async (req, res) => {
  try {
    const { 
      id,
      client_code,
      client_id,
      customer_name, 
      phone_number, 
      package_tier = 'ELITE', 
      duration_months = 4, 
      payment_method = 'INSTAPAY', 
      amount_paid, 
      currency = 'EGP',
      transaction_reference 
    } = req.body;

    if (!customer_name || !phone_number || !amount_paid) {
      return res.status(400).json({ error: "customer_name, phone_number, and amount_paid are required" });
    }

    // Try to link existing client record
    let resolvedClientId = null;
    const cleanClientCode = String(client_code || client_id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    if (cleanClientCode) {
      let matched = await User.findOne({ where: { client_code: cleanClientCode } });
      if (!matched && !isNaN(cleanClientCode)) {
        matched = await User.findByPk(parseInt(cleanClientCode, 10));
      }
      if (matched) resolvedClientId = matched.id;
    }
    if (!resolvedClientId && phone_number) {
      const cleanPhone = phone_number.trim();
      let matched = await User.findOne({ where: { phone_number: cleanPhone } });
      if (!matched && cleanPhone.startsWith('0')) {
        matched = await User.findOne({ where: { phone_number: cleanPhone.substring(1) } });
      }
      if (matched) resolvedClientId = matched.id;
    }

    const orderId = id || `#RENEW-${Date.now().toString().slice(-6)}`;

    const newOrder = await Order.create({
      id: orderId,
      client_id: resolvedClientId,
      customer_name,
      phone_number: phone_number.trim(),
      package_tier: String(package_tier || 'ELITE').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE',
      duration_months: Number(duration_months) || 4,
      payment_method,
      amount_paid,
      currency,
      payment_status: 'PENDING',
      transaction_reference
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
};

// Get List of Orders for Coach Hub
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'client_code', 'subscription_status', 'plan_approval_status']
        }
      ]
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("getOrders error:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// One-Click Convert Order to Active Sequential Client
export const activateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if user already exists
    let user = null;
    if (order.client_id) {
      user = await User.findByPk(order.client_id);
    }
    if (!user && order.phone_number) {
      const cleanPhone = order.phone_number.trim();
      user = await User.findOne({ where: { phone_number: cleanPhone } });
      if (!user && cleanPhone.startsWith('0')) {
        user = await User.findOne({ where: { phone_number: cleanPhone.substring(1) } });
      }
    }

    const targetTier = String(order.package_tier || 'ELITE').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE';

    if (!user) {
      // Find highest numerical code among CLIENTS (base offset 1000)
      const allClients = await User.findAll({ where: { role: 'CLIENT' }, attributes: ['client_code'] });
      let maxCode = 1000;
      for (const c of allClients) {
        const num = parseInt(c.client_code, 10);
        if (!isNaN(num) && num > maxCode) maxCode = num;
      }
      const nextCode = (maxCode + 1).toString();

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (order.duration_months * 30));

      user = await User.create({
        client_code: nextCode.toString(),
        phone_number: order.phone_number,
        full_name: order.customer_name,
        role: 'CLIENT',
        package_tier: targetTier,
        duration_months: order.duration_months,
        subscription_package: `${targetTier}_${order.duration_months}M`,
        subscription_price: order.amount_paid,
        payment_status: 'PAID',
        payment_method: order.payment_method,
        plan_approval_status: 'CODE_GENERATED',
        subscription_status: 'ACTIVE',
        subscription_start_date: startDate,
        subscription_end_date: endDate
      });
    } else {
      // Existing client renewing via online portal
      const currentEnd = new Date(user.subscription_end_date);
      const now = new Date();
      const baseDate = (!isNaN(currentEnd.getTime()) && currentEnd > now) ? currentEnd : now;
      const addedDays = (Number(order.duration_months) || 4) * 30;
      const newEndDate = new Date(baseDate.getTime() + (addedDays * 24 * 60 * 60 * 1000));

      user.subscription_status = 'ACTIVE';
      user.subscription_end_date = newEndDate;
      user.package_tier = targetTier;
      user.subscription_package = `${targetTier}_${order.duration_months || 4}M`;
      user.subscription_price = order.amount_paid || user.subscription_price;
      user.payment_status = 'PAID';
      await user.save();
    }

    // Link client_id to order
    order.client_id = user.id;
    order.payment_status = 'COMPLETED';
    await order.save();

    return res.status(200).json({
      message: "Order activated successfully as client",
      client: user,
      order
    });
  } catch (err) {
    console.error("activateOrder error:", err);
    return res.status(500).json({ error: "Failed to activate order" });
  }
};
