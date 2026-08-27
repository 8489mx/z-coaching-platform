import { Order, User } from "../models/index.js";

// Receive Order from Marketing Website Checkout Funnel
export const createOrder = async (req, res) => {
  try {
    const { 
      id, // e.g. #KZ-4819
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

    const orderId = id || `#KZ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await Order.create({
      id: orderId,
      customer_name,
      phone_number: phone_number.trim(),
      package_tier: package_tier.toUpperCase(),
      duration_months: Number(duration_months) || 4,
      payment_method,
      amount_paid,
      currency,
      payment_status: payment_method === 'CARD' ? 'COMPLETED' : 'PENDING',
      transaction_reference
    });

    return res.status(201).json({
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
    let user = await User.findOne({ where: { phone_number: order.phone_number } });

    if (!user) {
      // Find last sequential client code
      const lastUser = await User.findOne({
        where: { role: 'CLIENT' },
        order: [['id', 'DESC']]
      });

      let nextCode = 1;
      if (lastUser && lastUser.client_code) {
        const parsed = parseInt(lastUser.client_code, 10);
        if (!isNaN(parsed)) {
          nextCode = parsed + 1;
        }
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (order.duration_months * 30));

      user = await User.create({
        client_code: nextCode.toString(),
        phone_number: order.phone_number,
        full_name: order.customer_name,
        role: 'CLIENT',
        package_tier: order.package_tier,
        duration_months: order.duration_months,
        subscription_package: `${order.package_tier}_${order.duration_months}M`,
        subscription_price: order.amount_paid,
        payment_status: 'PAID',
        payment_method: order.payment_method,
        plan_approval_status: 'CODE_GENERATED',
        subscription_status: 'ACTIVE',
        subscription_start_date: startDate,
        subscription_end_date: endDate
      });
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
