import fs from "fs";
import path from "path";
import { 
  User, 
  IntakeSubmission, 
  Program, 
  CheckinSubmission, 
  ProgressPhoto, 
  WorkoutLog, 
  Order, 
  NutritionPlan, 
  WorkoutPlan 
} from "../models/index.js";

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

    // Generate client_code (sequential starting from 1001)
    const allClients = await User.findAll({ where: { role: 'CLIENT' }, attributes: ['client_code'] });
    let maxCode = 1000;
    for (const c of allClients) {
      const num = parseInt(c.client_code, 10);
      if (!isNaN(num) && num > maxCode) maxCode = num;
    }
    const nextCode = (maxCode + 1).toString();

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

    const now = new Date();
    const enrichedClients = clients.map(client => {
      const c = client.toJSON();
      let daysRemaining = 0;
      let calculatedStatus = c.subscription_status || 'ACTIVE';

      if (c.subscription_end_date) {
        const endDate = new Date(c.subscription_end_date);
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (c.subscription_status === 'FROZEN') {
          calculatedStatus = 'FROZEN';
        } else if (daysRemaining <= 0) {
          calculatedStatus = 'EXPIRED';
        } else if (daysRemaining <= 7) {
          calculatedStatus = 'EXPIRING_SOON';
        } else {
          calculatedStatus = 'ACTIVE';
        }
      }

      return {
        ...c,
        days_remaining: daysRemaining,
        daysRemaining: daysRemaining,
        subscription_status: calculatedStatus,
        status: calculatedStatus
      };
    });

    return res.status(200).json({ clients: enrichedClients });
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

    const targetCode = client.client_code;

    // 1. حذف المجلد الفيزيائي لصور المشترك إن وجد
    if (targetCode) {
      try {
        const clientPhotosDir = path.resolve(process.cwd(), "uploads", "progress_photos", String(targetCode));
        if (fs.existsSync(clientPhotosDir)) {
          fs.rmSync(clientPhotosDir, { recursive: true, force: true });
        }
      } catch (fsErr) {
        console.warn("Could not delete physical photos directory:", fsErr.message);
      }
    }

    // 2. حذف الجداول المرتبطة وحساب المشترك بصورة تتابعية كاملة
    await CheckinSubmission.destroy({ where: { user_id: id } }).catch(() => {});
    await ProgressPhoto.destroy({ where: { user_id: id } }).catch(() => {});
    await WorkoutLog.destroy({ where: { user_id: id } }).catch(() => {});
    await Order.destroy({ where: { client_id: id } }).catch(() => {});
    await NutritionPlan.destroy({ where: { user_id: id } }).catch(() => {});
    await WorkoutPlan.destroy({ where: { user_id: id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: id } }).catch(() => {});
    await Program.destroy({ where: { user_id: id } }).catch(() => {});
    await client.destroy();

    return res.status(200).json({ success: true, message: "تم حذف المشترك وكافة بياناته وصوره بنجاح" });
  } catch (err) {
    console.error("deleteClient error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
