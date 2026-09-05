import { User, IntakeSubmission, Program } from "../models/index.js";

export const addClient = async (req, res) => {
  try {
    const { phone_number, full_name, subscription_package = 'ELITE_3_PLUS_1', subscription_price, payment_method = 'INSTAPAY' } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: "phone_number is required" });
    }

    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser) {
      if (existingUser.role === 'CLIENT') {
        return res.status(200).json({ 
          client: existingUser, 
          user: existingUser, 
          message: `المشترك مسجل بالفعل بكود #${existingUser.client_code}` 
        });
      } else {
        return res.status(400).json({ error: "رقم الهاتف مسجل بالفعل كحساب مدرب في المنظومة" });
      }
    }

    // Generate client_code (sequential starting from 1)
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

    // 3 months + 1 month free = 4 months (120 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 120);

    const newUser = await User.create({ 
      client_code: nextCode.toString(), 
      phone_number, 
      full_name,
      role: 'CLIENT',
      subscription_package: subscription_package || 'ELITE_3_PLUS_1',
      subscription_price: subscription_price || (subscription_package === 'MAX_3_PLUS_1' ? 3500 : 2500),
      payment_status: 'PAID',
      payment_method,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      subscription_status: 'ACTIVE'
    });

    return res.status(201).json({ user: newUser, client: newUser });
  } catch (err) {
    console.error("addClient error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await User.findAll({
      where: { role: 'CLIENT' },
      include: [
        {
          model: IntakeSubmission,
          as: "intakeSubmissions",
          attributes: ['id', 'status', 'answers', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ clients });
  } catch (err) {
    console.error("getClients error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await User.findOne({ where: { id, role: 'CLIENT' } });
    if (!client) {
      return res.status(404).json({ error: "المشترك غير موجود" });
    }

    // Delete related submissions and programs
    await IntakeSubmission.destroy({ where: { user_id: id } }).catch(() => {});
    if (Program) {
      await Program.destroy({ where: { user_id: id } }).catch(() => {});
    }
    await client.destroy();

    return res.status(200).json({ success: true, message: "تم حذف المشترك بنجاح" });
  } catch (err) {
    console.error("deleteClient error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
