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
import { decryptMedicalData } from "../../utils/crypto.js";

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
          attributes: ['id', 'status', 'version', 'program_data', 'updatedAt', 'createdAt']
        },
        {
          model: CheckinSubmission,
          as: "checkinSubmissions",
          required: false,
          attributes: ['id', 'status', 'week_number', 'average_weight_kg', 'waist_circumference_cm', 'analysis_output', 'createdAt']
        }
      ],
      order: [['id', 'ASC']]
    });

    const now = new Date();
    // Sort clients numerically by client_code
    const sortedClients = clients.slice().sort((a, b) => {
      const codeA = parseInt(a.client_code || a.id, 10);
      const codeB = parseInt(b.client_code || b.id, 10);
      if (!isNaN(codeA) && !isNaN(codeB)) return codeA - codeB;
      return (a.client_code || '').localeCompare(b.client_code || '');
    });

    const enrichedClients = sortedClients.map(client => {
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

      // 1. Decrypt Intake Answers if encrypted
      let intakeAns = c.intakeSubmissions?.[0]?.answers;
      if (intakeAns) {
        try {
          const raw = intakeAns._isEncrypted ? intakeAns.data : intakeAns;
          const dec = typeof raw === 'string' ? decryptMedicalData(raw) : raw;
          intakeAns = dec?.answers || dec || intakeAns;
        } catch {
          // Keep raw intakeAns if decryption fails
        }
      }

      // 2. Select Latest Active Program
      const activePrograms = (c.programs || []).slice().sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      const activeProg = activePrograms[0]?.program_data;

      // 3. Training logistics & split
      const trainingDays = activeProg?.training_program?.weeks?.[0]?.sessions?.length ||
                           activeProg?.training_program?.sessions?.length ||
                           activeProg?.training?.sessions?.length ||
                           intakeAns?.training_logistics?.days_per_week || 4;

      const rawSplit = activeProg?.training_program?.split_code ||
                       activeProg?.training_program?.split ||
                       activeProg?.training?.split || '';

      let trainingSplit = 'علوي / سفلي';
      if (/PPL|PUSH_PULL/i.test(rawSplit)) trainingSplit = 'دفع / سحب / أرجل';
      else if (/FULL_BODY/i.test(rawSplit)) trainingSplit = 'كامل الجسم';
      else if (/BRO|BODY_PART|ARNOLD/i.test(rawSplit)) trainingSplit = 'عضلات منفصلة';

      // 4. Nutrition targets
      const nutritionCalories = activeProg?.nutrition_program?.targets?.target_calories ||
                                activeProg?.nutrition_program?.targets?.total_calories ||
                                activeProg?.nutrition_program?.targets?.calories_kcal ||
                                activeProg?.nutrition_program?.daily_targets?.calories ||
                                activeProg?.nutrition?.targets?.calories ||
                                c.target_calories || 2150;

      const nutritionProtein = activeProg?.nutrition_program?.targets?.protein_g ||
                               activeProg?.nutrition_program?.targets?.total_protein_g ||
                               activeProg?.nutrition_program?.daily_targets?.protein ||
                               activeProg?.nutrition?.targets?.protein || 160;

      const nutritionCarbs = activeProg?.nutrition_program?.targets?.carbohydrate_g ||
                             activeProg?.nutrition_program?.targets?.carb_g || 180;

      const nutritionFat = activeProg?.nutrition_program?.targets?.fat_g || 60;

      // 5. Cardio prescription
      const cardioSessions = activeProg?.cardio_program?.prescription?.recommended_sessions ??
                             activeProg?.cardio_program?.prescription?.sessions?.length ??
                             activeProg?.cardio_program?.weekly_schedule?.length ??
                             activeProg?.cardio?.frequency_per_week ??
                             (activeProg ? 0 : 3);

      // 6. Fitness Goal
      const rawGoal = c.goal || intakeAns?.primary_goal || activeProg?.client_profile?.goal || 'FAT_LOSS';
      let cleanGoal = 'تنشيف ونزول دهون';
      if (/muscle|bulk|hypertrophy|تضخيم/i.test(rawGoal)) cleanGoal = 'تضخيم وبناء عضلي';
      else if (/recomp|ريكومب/i.test(rawGoal)) cleanGoal = 'إعادة تشكيل (ريكومب)';
      else if (/health|لياقة|صحة/i.test(rawGoal)) cleanGoal = 'صحة عامة ولياقة';

      // 7. Clinical & Medical alert
      const hasMedical = Boolean(
        intakeAns?.medical_conditions?.has_conditions ||
        intakeAns?.medical_conditions?.selected?.length ||
        activeProg?.clinical_safety_shield?.status === 'ACTIVE' ||
        (activeProg?.client_profile?.conditions && activeProg?.client_profile?.conditions?.length > 0)
      );

      // Checkin submissions resolution & triage (authoritative source of truth)
      const allCheckins = (c.checkinSubmissions || []).slice().sort((a, b) => (Number(b.week_number) || 0) - (Number(a.week_number) || 0));
      const pendingCheckins = allCheckins.filter(ch => ch.status === 'PENDING_REVIEW');
      const latestCheckin = allCheckins[0] || null;
      let latestCheckinAnalysis = {};
      try {
        latestCheckinAnalysis = typeof latestCheckin?.analysis_output === 'string'
          ? JSON.parse(latestCheckin.analysis_output)
          : (latestCheckin?.analysis_output || {});
      } catch {
        latestCheckinAnalysis = {};
      }
      const isMeasurementCorrected = Boolean(latestCheckinAnalysis?.is_measurement_corrected);

      // Height and weight resolution (Source of Truth priority: Latest Checkin > Intake > Active Program Profile)
      const clientWeight = latestCheckin?.average_weight_kg != null
        ? Number(latestCheckin.average_weight_kg)
        : (intakeAns?.weight_kg != null
          ? Number(intakeAns.weight_kg)
          : (activeProg?.client_profile?.weight != null ? Number(activeProg.client_profile.weight) : null));

      const clientHeight = intakeAns?.height_cm != null
        ? Number(intakeAns.height_cm)
        : (activeProg?.client_profile?.height != null ? Number(activeProg.client_profile.height) : null);

      const clientAge = intakeAns?.age != null
        ? Number(intakeAns.age)
        : (activeProg?.client_profile?.age != null ? Number(activeProg.client_profile.age) : null);

      const clientGender = c.gender || intakeAns?.gender || activeProg?.client_profile?.gender || 'MALE';

      let measurementSource = { type: 'NONE', label_ar: 'لا توجد قياسات مسجلة' };
      if (latestCheckin && clientWeight) {
        measurementSource = {
          type: 'CHECKIN',
          week_number: latestCheckin.week_number,
          date: latestCheckin.createdAt,
          is_corrected: isMeasurementCorrected,
          corrected_at: latestCheckinAnalysis.measurement_corrections?.[latestCheckinAnalysis.measurement_corrections.length - 1]?.corrected_at || null,
          label_ar: `آخر متابعة (الأسبوع ${latestCheckin.week_number}) — ${clientWeight} كجم${isMeasurementCorrected ? ' (مصحح بواسطة الكوتش)' : ''}`
        };
      } else if (intakeAns?.weight_kg) {
        measurementSource = {
          type: 'INTAKE',
          date: c.intakeSubmissions?.[0]?.createdAt || null,
          is_corrected: false,
          label_ar: `استمارة المتدرب — ${clientWeight} كجم`
        };
      }

      return {
        ...c,
        weight_kg: clientWeight,
        height_cm: clientHeight,
        age: clientAge,
        gender: clientGender,
        latest_measurement_source: measurementSource,
        is_measurement_corrected: isMeasurementCorrected,
        days_remaining: daysRemaining,
        daysRemaining: daysRemaining,
        subscription_status: calculatedStatus,
        needs_first_plan: activePrograms.length === 0 || c.plan_approval_status === 'PENDING_COACH_REVIEW',
        has_pending_checkin: pendingCheckins.length > 0,
        pending_checkins_count: pendingCheckins.length,
        status: calculatedStatus,
        plan_summary: {
          trainingDays,
          trainingSplit,
          nutritionCalories,
          nutritionProtein,
          nutritionCarbs,
          nutritionFat,
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
