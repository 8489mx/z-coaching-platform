/**
 * Client Retention & Renewal Radar Engine
 * Z Coaching Platform - Enterprise Retention Architecture
 *
 * Deterministic engine for scoring trainee subscription renewal propensity,
 * identifying churn risk factors, and generating tactical outreach actions.
 * Zero emojis, strictly Arabic RTL clinical directives.
 */

export function calculateClientRetentionHealth({
  client = {},
  checkinHistory = [],
  subscription = {},
  currentWeekNumber = 4
} = {}) {
  const history = Array.isArray(checkinHistory) ? checkinHistory : [];
  const clientName = client.full_name || client.name || 'المشترك';
  const clientCode = client.client_code || client.code || '';
  const goalLabel = client.goal_label || (client.primary_goal === 'fat_loss' ? 'خسارة دهون وتنشيف' : 'بناء عضلي وتطوير القوة');

  // 1. Adherence Component (0 - 35 points)
  // Evaluates average nutrition & workout compliance across recent checkins
  let adherenceScore = 25; // baseline
  let avgAdherence = 85;

  if (history.length > 0) {
    const recentCheckins = history.slice(-3);
    const sumAdh = recentCheckins.reduce((sum, ch) => {
      const diet = Number(ch.diet_adherence_percentage || ch.nutrition_adherence_percent) || 85;
      const workout = Number(ch.workout_adherence_percentage || ch.workout_adherence_percent) || 85;
      return sum + ((diet + workout) / 2);
    }, 0);
    avgAdherence = Math.round(sumAdh / recentCheckins.length);

    if (avgAdherence >= 90) adherenceScore = 35;
    else if (avgAdherence >= 80) adherenceScore = 28;
    else if (avgAdherence >= 70) adherenceScore = 20;
    else if (avgAdherence >= 60) adherenceScore = 12;
    else adherenceScore = 5;
  }

  // 2. Biometric Progress Component (0 - 30 points)
  // Evaluates whether trainee is making steady, measurable progress toward primary goal
  let progressScore = 20; // default reasonable
  const startWeight = Number(history[0]?.weight_kg || client.initial_weight || client.weight_kg || 80);
  const currentWeight = Number(history[history.length - 1]?.weight_kg || client.weight_kg || startWeight);
  const weightDelta = Number((startWeight - currentWeight).toFixed(1)); // positive = weight drop
  const isFatLoss = String(client.primary_goal || client.goal_type || '').toLowerCase().includes('fat') ||
    String(client.goal_label || '').includes('تنشيف') || String(client.goal_label || '').includes('خسارة');

  if (isFatLoss) {
    if (weightDelta >= 2.5) progressScore = 30;
    else if (weightDelta >= 1.5) progressScore = 25;
    else if (weightDelta >= 0.5) progressScore = 18;
    else if (weightDelta > -0.5) progressScore = 12; // stall
    else progressScore = 5; // unwanted weight gain
  } else {
    // Bulking / Recomp
    if (weightDelta <= -1.0) progressScore = 30; // healthy muscle gain
    else if (weightDelta <= 0) progressScore = 24;
    else progressScore = 15;
  }

  // 3. Consistency & Biofeedback Component (0 - 20 points)
  // Ratio of expected checkins delivered + sleep & stress scores
  let consistencyScore = 15;
  const expectedWeeks = Math.max(1, currentWeekNumber || 4);
  const checkinSubmissionRate = Math.min(1.0, history.length / expectedWeeks);

  const lastCheckin = history[history.length - 1] || {};
  const sleepVal = Number(lastCheckin.sleep_quality || lastCheckin.biofeedback?.sleep || 4);
  const energyVal = Number(lastCheckin.energy_level || lastCheckin.biofeedback?.energy || 4);
  const stressVal = Number(lastCheckin.stress_level || lastCheckin.biofeedback?.stress_level || 3);
  const biofeedbackHealth = ((sleepVal + energyVal + Math.max(1, 6 - stressVal)) / 3) >= 3.5;

  if (checkinSubmissionRate >= 0.85 && biofeedbackHealth) {
    consistencyScore = 20;
  } else if (checkinSubmissionRate >= 0.70) {
    consistencyScore = 14;
  } else {
    consistencyScore = 8;
  }

  // 4. Subscription Urgency & Expiry Component (0 - 15 points)
  let daysUntilExpiry = 14;
  if (subscription?.end_date) {
    const endMs = new Date(subscription.end_date).getTime();
    const nowMs = Date.now();
    daysUntilExpiry = Math.max(0, Math.round((endMs - nowMs) / (1000 * 60 * 60 * 24)));
  } else if (subscription?.days_left !== undefined) {
    daysUntilExpiry = Number(subscription.days_left);
  }

  let expiryScore = 10;
  let isUrgentRenewal = false;

  if (daysUntilExpiry <= 7) {
    isUrgentRenewal = true;
    expiryScore = 15;
  } else if (daysUntilExpiry <= 14) {
    expiryScore = 12;
  } else {
    expiryScore = 8;
  }

  // Total Renewal Health Score (0 - 100)
  const totalScore = Math.min(100, Math.max(0, adherenceScore + progressScore + consistencyScore + expiryScore));

  // Risk Classification
  const riskFactorsAr = [];
  let category = 'NURTURE_ENGAGE';
  let statusTitleAr = 'يحتاج دعم وتثبيت نتائج';
  let recommendedActionAr = 'التواصل المنتظم وإرسال رسالة تحفيزية لتوثيق نتائج الميزوسايكل.';

  if (avgAdherence < 75) {
    riskFactorsAr.push(`انخفاض معدل الالتزام العام إلى ${avgAdherence}%`);
  }
  if (isFatLoss && weightDelta <= 0 && history.length >= 2) {
    riskFactorsAr.push('ثبات في مسار نزول الوزن وتراجع في وتيرة النتائج');
  }
  if (sleepVal <= 2 || stressVal >= 4) {
    riskFactorsAr.push('ارتفاع مؤشرات الإجهاد العصبي أو تراجع جودة النوم');
  }
  if (checkinSubmissionRate < 0.75) {
    riskFactorsAr.push('تذبذب في مواعيد تسليم تقارير المتابعة الأسبوعية');
  }

  if (totalScore >= 80 && riskFactorsAr.length === 0) {
    category = 'HIGH_PROPENSITY';
    statusTitleAr = 'مرشح مؤكد للتجديد التلقائي';
    recommendedActionAr = 'إرسال بطاقة الإشادة بالإنجاز وتقديم عرض تجديد الميزوسايكل القادم مبكراً.';
  } else if (totalScore < 60 || riskFactorsAr.length >= 2) {
    category = 'AT_RISK';
    statusTitleAr = 'معرض لمخاطر عدم التجديد (تسرب المشترك)';
    recommendedActionAr = 'تدخل فوري من الكوتش لمراجعة الصعوبات وتعديل الخطة وتقديم دعم نفسي مكثف.';
  }

  // Personalized WhatsApp Outreach Script
  const progressTextAr = isFatLoss
    ? `حققت نزولاً ممتازاً قدره -${Math.abs(weightDelta)} كجم في الوزن الصافي`
    : `حققت تطوراً ملحوظاً في القوة العضلية والكتلة اللادهنية`;

  const whatsappMessage = `أهلاً يا ${clientName}، عاش على الالتزام في الميزوسايكل الحالي.\n\n` +
    `بمراجعة مؤشراتك، ${progressTextAr} مع متوسط التزام ${avgAdherence}%، وده يثبت انضباطك العالي.\n\n` +
    `اشتراكك الحالي متبقي عليه ${daysUntilExpiry} يوماً، ومهم جداً نثبت المرحلة اللي وصلنالها ونجهز خطة الميزوسايكل القادم بدون أي انقطاع.\n\n` +
    `جاهز نبدأ في ترتيب برنامج المرحلة الجاية وتجديد الاشتراك؟`;

  return {
    client_name: clientName,
    client_code: clientCode,
    goal_label: goalLabel,
    total_retention_score: totalScore,
    category: category,
    status_title_ar: statusTitleAr,
    days_until_expiry: daysUntilExpiry,
    is_urgent_renewal: isUrgentRenewal,
    adherence_rate: avgAdherence,
    biometric_delta_kg: weightDelta,
    risk_factors: riskFactorsAr,
    has_risks: riskFactorsAr.length > 0,
    recommended_action_ar: recommendedActionAr,
    whatsapp_outreach_message: whatsappMessage,
    score_breakdown: {
      adherence: adherenceScore,
      progress: progressScore,
      consistency: consistencyScore,
      urgency: expiryScore
    }
  };
}

export function batchEvaluateRetentionRadar(trainees = []) {
  const list = Array.isArray(trainees) ? trainees : [];
  const evaluations = list.map(t => calculateClientRetentionHealth(t));

  const highCount = evaluations.filter(e => e.category === 'HIGH_PROPENSITY').length;
  const nurtureCount = evaluations.filter(e => e.category === 'NURTURE_ENGAGE').length;
  const atRiskCount = evaluations.filter(e => e.category === 'AT_RISK').length;
  const urgentCount = evaluations.filter(e => e.is_urgent_renewal).length;

  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.total_retention_score, 0) / evaluations.length)
    : 80;

  return {
    total_trainees: evaluations.length,
    high_propensity_count: highCount,
    nurture_count: nurtureCount,
    at_risk_count: atRiskCount,
    urgent_renewal_count: urgentCount,
    average_retention_score: avgScore,
    projected_retention_rate_pct: Math.min(100, Math.round((highCount * 0.95 + nurtureCount * 0.70 + atRiskCount * 0.30) / (evaluations.length || 1) * 100)),
    evaluations: evaluations
  };
}
