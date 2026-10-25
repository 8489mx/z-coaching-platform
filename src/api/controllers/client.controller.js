import fs from "fs";
import path from "path";
import sequelize from "../config/database.js";
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
import { recordAuditEvent } from "../services/auditLog.service.js";

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
        },
        {
          model: Program,
          as: "programs",
          where: { status: 'ACTIVE' },
          required: false,
          attributes: ['id', 'status', 'version', 'program_data', 'updatedAt']
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

      // Extract Coaching Plan Summary (Training, Nutrition, Cardio, Goal)
      const activeProg = c.programs?.[0]?.program_data;
      const intakeAns = c.intakeSubmissions?.[0]?.answers;

      const trainingDays = activeProg?.training_program?.sessions?.length || activeProg?.training?.sessions?.length || intakeAns?.training_logistics?.days_per_week || 4;
      const rawSplit = activeProg?.training_program?.split || activeProg?.training?.split || '';
      let trainingSplit = 'علوي / سفلي';
      if (/PPL|PUSH_PULL/i.test(rawSplit)) trainingSplit = 'دفع / سحب / أرجل';
      else if (/FULL_BODY/i.test(rawSplit)) trainingSplit = 'كامل الجسم';
      else if (/BRO|BODY_PART/i.test(rawSplit)) trainingSplit = 'عضلات منفصلة';

      const nutritionCalories = activeProg?.nutrition_program?.daily_targets?.calories || activeProg?.nutrition?.targets?.calories || c.target_calories || 2150;
      const nutritionProtein = activeProg?.nutrition_program?.daily_targets?.protein || activeProg?.nutrition?.targets?.protein || 160;

      const cardioSessions = activeProg?.cardio_program?.weekly_schedule?.length || activeProg?.cardio?.frequency_per_week || 3;

      const rawGoal = c.goal || intakeAns?.primary_goal || activeProg?.client_profile?.goal || 'FAT_LOSS';
      let cleanGoal = 'تنشيف ونزول دهون';
      if (/muscle|bulk|تضخيم/i.test(rawGoal)) cleanGoal = 'تضخيم وبناء عضلي';
      else if (/recomp|ريكومب/i.test(rawGoal)) cleanGoal = 'إعادة تشكيل (ريكومب)';
      else if (/health|لياقة|صحة/i.test(rawGoal)) cleanGoal = 'صحة عامة ولياقة';

      const hasMedical = Boolean(intakeAns?.medical_conditions?.has_conditions || intakeAns?.medical_conditions?.selected?.length);

      return {
        ...c,
        days_remaining: daysRemaining,
        daysRemaining: daysRemaining,
        subscription_status: calculatedStatus,
        status: calculatedStatus,
        plan_summary: {
          trainingDays,
          trainingSplit,
          nutritionCalories,
          nutritionProtein,
          cardioSessions,
          cleanGoal,
          hasMedical
        }
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
    let client = await User.findOne({ where: { id, role: 'CLIENT' } });
    if (!client && !isNaN(id)) {
      client = await User.findOne({ where: { id: parseInt(id, 10), role: 'CLIENT' } });
    }
    if (!client) {
      const cleanCode = String(id).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
      client = await User.findOne({ where: { client_code: cleanCode, role: 'CLIENT' } });
    }

    if (!client) {
      return res.status(404).json({ error: "المشترك غير موجود" });
    }

    const clientId = client.id;
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

    // 2. حذف الجداول المرتبطة وحساب المشترك داخل معاملة ذرية متتالية
    await sequelize.transaction(async (t) => {
      await WorkoutLog.destroy({ where: { user_id: clientId }, transaction: t });
      await ProgressPhoto.destroy({ where: { user_id: clientId }, transaction: t });
      await CheckinSubmission.destroy({ where: { user_id: clientId }, transaction: t });
      await Order.destroy({ where: { client_id: clientId }, transaction: t });
      await NutritionPlan.destroy({ where: { user_id: clientId }, transaction: t });
      await WorkoutPlan.destroy({ where: { user_id: clientId }, transaction: t });
      await IntakeSubmission.destroy({ where: { user_id: clientId }, transaction: t });
      await Program.destroy({ where: { user_id: clientId }, transaction: t });
      await User.destroy({ where: { id: clientId }, transaction: t });
    });

    recordAuditEvent({
      event: 'CLIENT_DELETED_CASCADE',
      req,
      status: 'SUCCESS',
      details: {
        deletedClientId: clientId,
        deletedClientCode: targetCode
      }
    });

    return res.status(200).json({ success: true, message: "تم حذف المشترك وكافة بياناته وصوره بنجاح" });
  } catch (err) {
    console.error("deleteClient error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateClientFeatureFlags = async (req, res) => {
  try {
    const { id } = req.params;
    const { enable_rest_timer, enable_weight_logging } = req.body;

    let client = await User.findOne({ where: { id, role: 'CLIENT' } });
    if (!client && !isNaN(id)) {
      client = await User.findOne({ where: { id: parseInt(id, 10), role: 'CLIENT' } });
    }
    if (!client) {
      const cleanCode = String(id).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
      client = await User.findOne({ where: { client_code: cleanCode, role: 'CLIENT' } });
    }

    if (!client) {
      return res.status(404).json({ success: false, error: "المشترك غير موجود" });
    }

    const updates = {};
    if (typeof enable_rest_timer === 'boolean') {
      updates.enable_rest_timer = enable_rest_timer;
    }
    if (typeof enable_weight_logging === 'boolean') {
      updates.enable_weight_logging = enable_weight_logging;
    }

    await client.update(updates);

    recordAuditEvent({
      event: 'CLIENT_FEATURE_FLAGS_UPDATED',
      req,
      status: 'SUCCESS',
      details: {
        clientId: client.id,
        clientCode: client.client_code,
        flags: updates
      }
    });

    return res.status(200).json({
      success: true,
      message: "تم تحديث إعدادات الميزات للمشترك بنجاح",
      client: {
        id: client.id,
        client_code: client.client_code,
        enable_rest_timer: client.enable_rest_timer,
        enable_weight_logging: client.enable_weight_logging
      }
    });
  } catch (err) {
    console.error("updateClientFeatureFlags error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
