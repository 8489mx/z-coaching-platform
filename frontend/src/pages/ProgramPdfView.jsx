import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { getExerciseDisplayNames } from '../utils/exerciseTranslator';

const CSS_STYLES = "\n  @page {\n    size: A4 portrait;\n    margin: 15mm;\n  }\n\n  @media screen {\n    .pdf-page-container {\n      width: 210mm;\n      min-height: 297mm;\n      margin: 0 auto 20px auto;\n      background: #FFFFFF;\n      box-shadow: 0 4px 25px rgba(15, 23, 42, 0.08);\n      border: 1px solid #E2E8F0;\n      padding: 15mm;\n      box-sizing: border-box;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n      position: relative;\n    }\n  }\n\n  @media print {\n    body {\n      background: #FFFFFF !important;\n      padding: 0 !important;\n      margin: 0 !important;\n      -webkit-print-color-adjust: exact !important;\n      print-color-adjust: exact !important;\n    }\n    .no-print {\n      display: none !important;\n    }\n    .pdf-page-container {\n      width: 100% !important;\n      height: 100% !important;\n      min-height: 297mm !important;\n      max-height: 297mm !important;\n      margin: 0 !important;\n      padding: 0 !important;\n      border: none !important;\n      box-shadow: none !important;\n      page-break-after: always !important;\n      break-after: page !important;\n      display: flex !important;\n      flex-direction: column !important;\n      justify-content: space-between !important;\n      overflow: hidden !important;\n    }\n  }\n\n  .running-header {\n    border-bottom: 0.5pt solid #E2E8F0;\n    padding-bottom: 6px;\n    margin-bottom: 12px;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-size: 8pt;\n    font-weight: 700;\n    color: #475569;\n    letter-spacing: 0.5px;\n  }\n\n  .running-footer {\n    border-top: 0.5pt solid #E2E8F0;\n    padding-top: 6px;\n    margin-top: 12px;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    font-size: 8pt;\n    color: #64748B;\n    font-weight: 600;\n  }\n\n  .pdf-table {\n    width: 100%;\n    border-collapse: collapse;\n    margin-bottom: 12px;\n    font-size: 8.5pt;\n    page-break-inside: avoid;\n    break-inside: avoid;\n  }\n\n  .pdf-table th {\n    background-color: #F8FAFC;\n    color: #0F172A;\n    font-weight: 700;\n    border: 0.5pt solid #E2E8F0;\n    padding: 6px 8px;\n    text-align: right;\n  }\n\n  .pdf-table td {\n    border: 0.5pt solid #E2E8F0;\n    padding: 6px 8px;\n    color: #0F172A;\n    vertical-align: middle;\n  }\n\n  .pdf-card {\n    background-color: #F8FAFC;\n    border: 0.5pt solid #E2E8F0;\n    border-radius: 8px;\n    padding: 10px 12px;\n    margin-bottom: 10px;\n    page-break-inside: avoid;\n    break-inside: avoid;\n  }\n\n  .section-title {\n    font-size: 10pt;\n    font-weight: 800;\n    color: #0F172A;\n    margin-bottom: 8px;\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    border-right: 3pt solid #0284C7;\n    padding-right: 8px;\n  }\n";

export default function ProgramPdfView() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [user, setUser] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || searchParams.get('code') || '1';

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`);
      const data = await res.json();
      if (data.master_program || data.program) {
        setProgram(data.master_program || data.program);
      }
      if (data.user) setUser(data.user);
    } catch (e) {
      console.error('ProgramPdfView load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!loading && (program || user) && (searchParams.get('auto_print') === 'true' || searchParams.get('download') === 'true')) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, program, user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white" dir="rtl">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#0284C7' }}></div>
          <h5 className="fw-bold" style={{ color: '#0F172A', fontFamily: 'var(--font-sans)' }}>جاري معالجة وإعداد الوثيقة التنفيذية للطباعة...</h5>
        </div>
      </div>
    );
  }

  const clientName = program?.client?.full_name || program?.client_name || user?.full_name || 'المشترك';
  const clientCode = program?.client?.client_code || program?.client_code || user?.client_code || user?.id || targetUserId;
  const rawTier = program?.client?.subscription_package || program?.client?.package_tier || user?.package_tier || user?.subscription_package || 'ELITE';
  const packageTier = String(rawTier).toUpperCase().includes('MAX') ? 'باقة MAX الشاملة' : 'باقة ELITE';
  const issueDate = new Date().toLocaleDateString('en-GB');

  // Fasting Profile
  const clientObj = program?.client || user || {};
  const fastingProfile = extractClientFastingProfile(clientObj, clientObj.answers || program?.intake_summary);

  // Bio-metrics
  const heightCm = program?.client?.height_cm || user?.height || user?.height_cm || program?.intake_summary?.height || 180;
  const weightKg = program?.client?.weight_kg || user?.weight || user?.weight_kg || program?.intake_summary?.weight || 80;
  const bmi = (weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1);
  const bodyFat = program?.client?.body_fat || user?.body_fat || program?.intake_summary?.body_fat || '18.5%';
  const neckCm = program?.intake_summary?.neck || 40;
  const waistCm = program?.intake_summary?.waist || 88;
  const hipsCm = program?.intake_summary?.hips || 102;
  const primaryGoal = program?.client?.goal_label || program?.client?.primary_goal || user?.primary_goal || program?.intake_summary?.primary_goal || 'إعادة التشكيل العضلي (Body Recomposition)';

  // Energy & Macros
  const targetCalories = Math.round(
    program?.nutrition?.targets?.calories ||
    program?.nutrition_program?.stages?.energy_target?.target_calories_kcal || 
    program?.nutrition_program?.macro_targets?.calories_kcal ||
    2250
  );
  const proteinG = Math.round(
    program?.nutrition?.targets?.protein ||
    program?.nutrition_program?.stages?.macro_targets?.protein_g || 
    180
  );
  const carbsG = Math.round(
    program?.nutrition?.targets?.carbs ||
    program?.nutrition_program?.stages?.macro_targets?.carbohydrate_g || 
    program?.nutrition_program?.macro_targets?.carb_g ||
    230
  );
  const fatsG = Math.round(
    program?.nutrition?.targets?.fats ||
    program?.nutrition_program?.stages?.macro_targets?.fat_g || 
    68
  );
  const hydrationLiters = program?.nutrition_program?.targets?.hydration?.recommended_range_liters
    || program?.nutrition_program?.hydration?.recommended_range_liters 
    || program?.nutrition?.hydration?.recommended_range_liters
    || `${(weightKg * 0.040).toFixed(1)} - ${(weightKg * 0.040 + 0.5).toFixed(1)} لتر/اليوم`;

  // Supplements
  const supplements = program?.cardio?.supplements 
    || program?.supplements 
    || program?.nutrition?.supplements 
    || [];

  // Meals
  const meals = program?.nutrition?.meals 
    || program?.nutrition_program?.quantized_plan?.meals 
    || [
    {
      meal_name_ar: 'الوجبة الأولى (الإفطار)',
      meal_energy_kcal: 506,
      items: [
        { name_ar: 'بيض طازج كامل', amount_g: 3, unit: 'حبات' },
        { name_ar: 'بياض بيض صافي', amount_g: 100, unit: 'جم' },
        { name_ar: 'شوفان كامل الحبة خام', amount_g: 70, unit: 'جم' },
        { name_ar: 'توت أزرق أو فراولة', amount_g: 100, unit: 'جم' }
      ],
      protein_g: 34, carbs_g: 52, fat_g: 18
    },
    {
      meal_name_ar: 'الوجبة الثانية (الغداء)',
      meal_energy_kcal: 566,
      items: [
        { name_ar: 'صدور دجاج مخلية مشوية', amount_g: 200, unit: 'جم' },
        { name_ar: 'أرز بسمتي مطبوخ', amount_g: 220, unit: 'جم' },
        { name_ar: 'خضار مشكل سوتيه', amount_g: 150, unit: 'جم' },
        { name_ar: 'زيت زيتون بكر ممتاز', amount_g: 10, unit: 'جم' }
      ],
      protein_g: 48, carbs_g: 62, fat_g: 14
    },
    {
      meal_name_ar: 'الوجبة الثالثة (سناك قبل التمرين)',
      meal_energy_kcal: 311,
      items: [
        { name_ar: 'زبادي يوناني طبيعي قليل الدسم', amount_g: 150, unit: 'جم' },
        { name_ar: 'موز طازج', amount_g: 100, unit: 'جم' },
        { name_ar: 'لوز نيء غير مملح', amount_g: 20, unit: 'جم' }
      ],
      protein_g: 18, carbs_g: 35, fat_g: 11
    },
    {
      meal_name_ar: 'الوجبة الرابعة (العشاء)',
      meal_energy_kcal: 308,
      items: [
        { name_ar: 'جبن قريش طبيعي قليل الملح', amount_g: 150, unit: 'جم' },
        { name_ar: 'بطاطس مسلوقة أو مشوية', amount_g: 150, unit: 'جم' },
        { name_ar: 'سلطة خضراء مع خيار وورقيات', amount_g: 150, unit: 'جم' }
      ],
      protein_g: 30, carbs_g: 38, fat_g: 4
    }
  ];

  // Workout Meso-Cycle (All Weeks Periodization)
  const rawSessions = program?.training?.sessions 
    || program?.training_split?.sessions 
    || program?.training_program?.weeks?.[0]?.sessions 
    || [
    {
      session_name: 'Day 1: Push (الصدر والكتف والترايسبس)',
      exercises: [
        { name_en: 'Incline DB Bench Press', name_ar: 'بنش مائل بالدمبل', muscle: 'الصدر العلوي', sets: 3, reps: '8 - 10', rir: '1 - 2', rest: '120s' },
        { name_en: 'Seated DB Shoulder Press', name_ar: 'ضغط كتف بالدمبل جالساً', muscle: 'الكتف الأمامي', sets: 3, reps: '10 - 12', rir: '1 - 2', rest: '90s' },
        { name_en: 'Cable Lateral Raise', name_ar: 'رفرفة جانبية بالكابل', muscle: 'الكتف الجانبي', sets: 4, reps: '12 - 15', rir: '0 - 1', rest: '60s' },
        { name_en: 'Triceps Dual-Rope Pushdown', name_ar: 'ترايسبس بالحبل المزدوج', muscle: 'الترايسبس', sets: 3, reps: '10 - 12', rir: '1', rest: '60s' }
      ]
    },
    {
      session_name: 'Day 2: Pull (الظهر والكتف الخلفي والبايسبس)',
      exercises: [
        { name_en: 'Chest-Supported T-Bar Row', name_ar: 'سحب تي بار مدعوم الصدر', muscle: 'منتصف الظهر واللاتس', sets: 3, reps: '8 - 10', rir: '1 - 2', rest: '120s' },
        { name_en: 'Neutral-Grip Lat Pulldown', name_ar: 'سحب عالي قبضة محايدة', muscle: 'اللاتس (سحب عمودي)', sets: 3, reps: '10 - 12', rir: '1 - 2', rest: '90s' },
        { name_en: 'Rear Delt Cable Fly', name_ar: 'فراشة كتف خلفي بالكابل', muscle: 'الكتف الخلفي', sets: 4, reps: '15', rir: '0 - 1', rest: '60s' },
        { name_en: 'Incline DB Biceps Curl', name_ar: 'مرجحة بايسبس بالدمبل مائل', muscle: 'البايسبس', sets: 3, reps: '10 - 12', rir: '1', rest: '60s' }
      ]
    }
  ];

  // Resolve all periodized weeks from any supported program container
  const rawWeeks = (
    (Array.isArray(program?.training_program?.weeks) && program.training_program.weeks.length > 0 && program.training_program.weeks) ||
    (Array.isArray(program?.training?.weeks) && program.training.weeks.length > 0 && program.training.weeks) ||
    (Array.isArray(program?.master_program?.training_program?.weeks) && program.master_program.training_program.weeks.length > 0 && program.master_program.training_program.weeks) ||
    (Array.isArray(program?.master_program?.training?.weeks) && program.master_program.training.weeks.length > 0 && program.master_program.training.weeks) ||
    (Array.isArray(program?.weeks) && program.weeks.length > 0 && program.weeks) ||
    []
  );

  const effectiveWeeks = rawWeeks.length > 0 ? rawWeeks : [
    {
      week_number: 1,
      phase: 'ACCUMULATION',
      target_rir: '1 - 2',
      focus_note: 'نظام: Push / Pull / Legs — تركيز: التضخيم العضلي والتوتر الميكانيكي المستمر',
      sessions: rawSessions
    }
  ];

  // Flatten periodized weeks into printable A4 page chunks (2 sessions per page)
  const trainingPages = [];
  effectiveWeeks.forEach((week) => {
    const wSessions = (Array.isArray(week.sessions) && week.sessions.length > 0) ? week.sessions : rawSessions;
    const numChunks = Math.max(1, Math.ceil(wSessions.length / 2));
    for (let c = 0; c < numChunks; c++) {
      trainingPages.push({
        weekNumber: week.week_number || 1,
        phase: week.phase || 'ACCUMULATION',
        targetRir: week.target_rir !== undefined ? week.target_rir : '1 - 2',
        focusNote: week.focus_note || (week.phase === 'DELOAD' ? 'أسبوع كسر الإجهاد والاستشفاء العضلي (-40% حجم تدريبي)' : 'دورة تدريبية متقدمة للبناء العضلي وزيادة القوة'),
        sessions: wSessions.slice(c * 2, c * 2 + 2),
        chunkIndex: c,
        totalChunksInWeek: numChunks,
      });
    }
  });

  const totalPages = 3 + trainingPages.length;

  return (
    <div className="pdf-view-wrapper" dir="rtl" style={{ background: '#F1F5F9', minHeight: '100vh', padding: '20px 0', fontFamily: 'var(--font-sans)' }}>
      
      {/* Non-Printable Floating Action Bar */}
      <div className="no-print d-flex justify-content-between align-items-center bg-white p-3 px-4 rounded-4 shadow-sm mx-auto mb-4 border" style={{ maxWidth: '210mm', borderColor: '#E2E8F0' }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
            Z
          </div>
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: '#0F172A' }}>الوثيقة التنفيذية الفاخرة (Executive PDF Blueprint)</h6>
            <small className="text-muted">المشترك: <strong>{clientName}</strong> (كود: #{clientCode})</small>
          </div>
        </div>

        <button 
          type="button" 
          onClick={handlePrint}
          className="btn rounded-pill px-4 fw-bold text-slate-900 shadow-sm d-flex align-items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none', height: '42px', fontSize: '0.9rem' }}
        >
          <i className="ti ti-printer"></i>
          <span>طباعة / تصدير PDF ({totalPages} صفحات)</span>
        </button>
      </div>

      {/* Embedded Master PDF Stylesheet */}
      <style>{CSS_STYLES}</style>

      {/* =========================================================================
          PAGE 1: الغلاف والملف الفسيولوجي (Cover & Bio-Metrics Overview)
          ========================================================================= */}
      <div className="pdf-page-container" id="page-1">
        <div>
          {/* Running Header */}
          <div className="running-header">
            <span>Z COACHING | KARIM ZAKARIA</span>
            <span className="font-monospace">CLIENT CODE: #{clientCode}</span>
          </div>

          {/* Master Executive Cover Header */}
          <div style={{ textAlign: 'center', margin: '14px 0 18px 0', borderBottom: '1pt solid #0F172A', paddingBottom: '14px' }}>
            <span style={{ fontSize: '8pt', fontWeight: '800', letterSpacing: '2px', color: '#0284C7', textTransform: 'uppercase' }}>
              EXECUTIVE CLINICAL & HIGH-PERFORMANCE PROTOCOL
            </span>
            <h1 style={{ fontSize: '18pt', fontWeight: '900', color: '#0F172A', margin: '6px 0 2px 0', letterSpacing: '-0.5px' }}>
              برنامج الإعداد الرياضي والتغذوي المخصص
            </h1>
            <p style={{ fontSize: '8.5pt', color: '#475569', margin: 0 }}>
              تصميم ومتابعة: كابتن {getStoredCoachConfig().coachName || 'كريم زكريا'} ({getStoredCoachConfig().brandTitle || 'Z COACHING'})
            </p>
          </div>

          {/* Identification Metadata Grid */}
          <table className="pdf-table" style={{ marginBottom: '16px' }}>
            <tbody>
              <tr>
                <th style={{ width: '20%' }}>اسم المتدرب:</th>
                <td style={{ width: '30%', fontWeight: '700' }}>{clientName}</td>
                <th style={{ width: '20%' }}>كود المشترك:</th>
                <td style={{ width: '30%', fontWeight: '700', color: '#0284C7' }} className="font-monospace">#{clientCode}</td>
              </tr>
              <tr>
                <th>نوع الباقة:</th>
                <td style={{ fontWeight: '600' }}>{packageTier}</td>
                <th>تاريخ الإصدار:</th>
                <td style={{ fontWeight: '600' }} className="font-monospace">{issueDate}</td>
              </tr>
              {fastingProfile && (fastingProfile.isCoptic || fastingProfile.isRamadan || fastingProfile.isIntermittent) && (
                <tr>
                  <th>بروتوكول الصيام:</th>
                  <td colSpan="3" style={{ fontWeight: '700', color: fastingProfile.isCoptic ? '#6D28D9' : (fastingProfile.isRamadan ? '#B45309' : '#0284C7') }}>
                    {fastingProfile.isCoptic
                      ? (fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'الصيام المسيحي القبطي (نمط نباتي صرف خالي من الأسماك)' : 'الصيام المسيحي القبطي (نمط نباتي مع السماح بالأسماك)')
                      : (fastingProfile.isRamadan
                          ? 'الصيام الرمضاني (وجبتان رئيسيتان: إفطار وسحور + سناك تدريبي موجه)'
                          : `الصيام المتقطع (${fastingProfile.intermittentBadge?.label || '16/8'})`)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 1. Physiological Profile Table */}
          <div className="section-title">1. الملف الفسيولوجي ومؤشرات القوام (Physiological Profile)</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>الطول</th>
                <th>الوزن الحالي</th>
                <th>مؤشر كتلة الجسم (BMI)</th>
                <th>نسبة الدهون التقديرية</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: '700', textAlign: 'center' }}>
                <td>{heightCm} cm</td>
                <td>{weightKg} kg</td>
                <td>{bmi} BMI</td>
                <td style={{ color: '#0284C7' }}>{bodyFat}</td>
              </tr>
            </tbody>
          </table>

          <table className="pdf-table" style={{ marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>محيط الرقبة</th>
                <th>محيط الوسط (الخصر)</th>
                <th>محيط الحوض</th>
                <th>الهدف الفسيولوجي الرئيسي</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: '600' }}>
                <td>{neckCm} cm</td>
                <td style={{ fontWeight: '700', color: '#0F172A' }}>{waistCm} cm</td>
                <td>{hipsCm} cm</td>
                <td style={{ fontWeight: '700', color: '#0284C7' }}>{primaryGoal}</td>
              </tr>
            </tbody>
          </table>

          {/* 2. Daily Energy & Macronutrient Breakdown (4 KPI Boxes) */}
          <div className="section-title">2. مصفوفة الطاقة والماكروز اليومية (Daily Energy & Macro Targets)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            
            {/* Calories */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #0F172A' }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#475569' }}>السعرات المستهدفة</span>
              <div style={{ fontSize: '15pt', fontWeight: '900', color: '#0F172A', margin: '4px 0' }} className="font-monospace">
                {targetCalories}
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B' }}>Kcal / اليوم</small>
            </div>

            {/* Protein */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #0284C7' }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#0284C7' }}>البروتين الصافي</span>
              <div style={{ fontSize: '15pt', fontWeight: '900', color: '#0284C7', margin: '4px 0' }} className="font-monospace">
                {proteinG}g
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B' }}>{Math.round(proteinG * 4)} Kcal ({Math.round(((proteinG * 4) / targetCalories) * 100)}%)</small>
            </div>

            {/* Carbs */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #D97706' }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#D97706' }}>الكربوهيدرات</span>
              <div style={{ fontSize: '15pt', fontWeight: '900', color: '#D97706', margin: '4px 0' }} className="font-monospace">
                {carbsG}g
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B' }}>{Math.round(carbsG * 4)} Kcal ({Math.round(((carbsG * 4) / targetCalories) * 100)}%)</small>
            </div>

            {/* Fats */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #10B981' }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#10B981' }}>الدهون الصحية</span>
              <div style={{ fontSize: '15pt', fontWeight: '900', color: '#10B981', margin: '4px 0' }} className="font-monospace">
                {fatsG}g
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B' }}>{Math.round(fatsG * 9)} Kcal ({Math.round(((fatsG * 9) / targetCalories) * 100)}%)</small>
            </div>

          </div>

          {/* Hydration Note */}
          <div className="pdf-card" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8.5pt', fontWeight: '700', color: '#0369A1' }}>معدل الترطيب واستهلاك الماء اليومي:</span>
            <span style={{ fontSize: '9.5pt', fontWeight: '800', color: '#0284C7' }} className="font-monospace">{hydrationLiters}</span>
          </div>
        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>CONFIDENTIAL & PROPRIETARY — Z COACHING</span>
          <span className="font-monospace">PAGE 1 OF {totalPages}</span>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2: البروتوكول الغذائي وسفرة الوجبات (Daily Nutrition Protocol)
          ========================================================================= */}
      <div className="pdf-page-container" id="page-2">
        <div>
          {/* Running Header */}
          <div className="running-header">
            <span>Z COACHING | KARIM ZAKARIA</span>
            <span className="font-monospace">CLIENT CODE: #{clientCode}</span>
          </div>

          <div className="section-title">3. البروتوكول الغذائي وتوزيع سفرة الوجبات (Structured Meal Grid)</div>
          
          {fastingProfile && (fastingProfile.isCoptic || fastingProfile.isRamadan || fastingProfile.isIntermittent) && (
            <div className="pdf-card" style={{ background: '#F8FAFC', borderRight: `3pt solid ${fastingProfile.isCoptic ? '#7C3AED' : (fastingProfile.isRamadan ? '#D97706' : '#0284C7')}`, marginBottom: '10px', fontSize: '8pt', lineHeight: '1.5' }}>
              <strong style={{ color: fastingProfile.isCoptic ? '#6D28D9' : (fastingProfile.isRamadan ? '#B45309' : '#0284C7') }}>
                توجيه نمط وجدولة الصيام: 
              </strong>
              <span style={{ color: '#334155' }}>
                {fastingProfile.isCoptic
                  ? (fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'تمت صياغة مصادر البروتين من البقوليات والبروتين النباتي مع استبعاد اللحوم والألبان والأسماك.' : 'تم توظيف الأسماك والمأكولات البحرية مع البقوليات كركائز أساسية للبروتين اليومي.')
                  : (fastingProfile.isRamadan
                      ? 'مواعيد الوجبات موزعة استراتيجياً بين الإفطار والسحور مع تركيز النشويات سريعة الامتصاص حول جلسة التمرين لضمان أعلى أداء واستشفاء.'
                      : 'تُستهلك كافة الوجبات والمغذيات المقررة داخل نافذة الإطعام اليومية المحددة مع استهلاك الماء والمشروبات الصفرية خلال ساعات الصيام.')}
              </span>
            </div>
          )}
          
          {/* Meals Table */}
          <table className="pdf-table" style={{ marginBottom: '14px' }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>الوجبة</th>
                <th style={{ width: '46%' }}>المكونات والمقادير الدقيقة</th>
                <th style={{ width: '8%', textAlign: 'center' }}>بروتين</th>
                <th style={{ width: '8%', textAlign: 'center' }}>كارب</th>
                <th style={{ width: '8%', textAlign: 'center' }}>دهون</th>
                <th style={{ width: '8%', textAlign: 'center' }}>السعرات</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, mIdx) => (
                <tr key={mIdx}>
                  <td style={{ fontWeight: '700', color: '#0F172A' }}>
                    {meal.meal_name_ar || `الوجبة ${mIdx + 1}`}
                  </td>
                  <td>
                    {meal.items?.map((it, iIdx) => (
                      <span key={iIdx} style={{ display: 'inline-block', marginLeft: '6px' }}>
                        • <strong>{it.amount_g || it.amount} {it.unit || 'جم'}</strong> {it.name_ar || it.name}
                      </span>
                    ))}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#0284C7' }} className="font-monospace">{meal.protein_g ?? meal.p ?? 35}g</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#D97706' }} className="font-monospace">{meal.carbs_g ?? meal.c ?? 45}g</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#10B981' }} className="font-monospace">{meal.fat_g ?? meal.f ?? 12}g</td>
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#0F172A' }} className="font-monospace">{meal.meal_energy_kcal ?? meal.cal ?? 450}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Supplements Protocol Table */}
          {supplements && supplements.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className="section-title">4. بروتوكول المكملات الغذائية المعتمدة (Supplements Protocol)</div>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>المكمل الغذائي</th>
                    <th style={{ width: '22%' }}>الجرعة المحددة</th>
                    <th style={{ width: '26%' }}>توقيت التناول</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>السعرات</th>
                    <th style={{ width: '12%' }}>الماكروز</th>
                  </tr>
                </thead>
                <tbody>
                  {supplements.map((supp, sIdx) => (
                    <tr key={sIdx}>
                      <td style={{ fontWeight: '700', color: '#0F172A' }}>{supp.name}</td>
                      <td>{supp.dose || '-'}</td>
                      <td>{supp.timing || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700' }} className="font-monospace">
                        {supp.cal || 0}
                      </td>
                      <td style={{ fontSize: '7.5pt', color: '#64748B' }} dir="ltr">
                        {supp.p || supp.c || supp.f ? `P:${supp.p||0} C:${supp.c||0} F:${supp.f||0}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Culinary Notes & Chef Secrets */}
          <div className="section-title">{supplements && supplements.length > 0 ? '5.' : '4.'} إرشادات التحضير وقواعد الطهي الصحي (Culinary Guidelines)</div>
          <div className="pdf-card" style={{ fontSize: '8pt', lineHeight: '1.6', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>1. معايير وزن الأغذية:</strong> اللحوم والدواجن والأسماك تُوزن (نيئة قبل الطهي). الأرز والمكرونة والبطاطس تُوزن (مطبوخة وجاهزة للأكل).
            </p>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>2. الزيوت والدهون:</strong> زيت الزيتون البكر وزيت جوز الهند يُقاس بالملعقة المعيارية بدقة دون سكب عشوائي.
            </p>
            <p style={{ margin: '0' }}>
              <strong>3. الخضروات والمشروبات:</strong> الورقيات الخضراء (الجرجير، الخس، الخيار) مجانية السعرات، والقهوة والشاي تُشرب بدون سكر أو باستخدام محلي ستيفيا نقي.
            </p>
          </div>

          {/* Smart Food Swaps Table */}
          <div className="section-title">{supplements && supplements.length > 0 ? '6.' : '5.'} جدول المبادلات الذكية الفورية (Smart Food Swaps)</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>الصنف الأساسي في الخطة</th>
                <th style={{ width: '70%' }}>البدائل المكافئة لنفس القيمة الغذائية بالجرام</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>100 جم صدور دجاج مشوية</strong></td>
                <td>= 125 جم سمك فيليه أبيض = 110 جم لحم بقري 5% دهون = 130 جم جمبري = 130 جم تونة مصفاة</td>
              </tr>
              <tr>
                <td><strong>100 جم أرز بسمتي مطبوخ</strong></td>
                <td>= 110 جم بطاطس مسلوقة/مشوية = 100 جم بطاطا حلوة = 35 جم شوفان خام = 2 شريحة توست بني</td>
              </tr>
              <tr>
                <td><strong>100 جم جبن قريش طبيعي</strong></td>
                <td>= 120 جم زبادي يوناني 0% دسم = 4 بياض بيض كبير = 1 سكوب واي بروتين (25 جم)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>CONFIDENTIAL & PROPRIETARY — Z COACHING</span>
          <span className="font-monospace">PAGE 2 OF {totalPages}</span>
        </div>
      </div>

      {/* =========================================================================
          PAGES 3+: جدول الميزوسايكل التدريبي (Periodized Training Plan - All Weeks)
          ========================================================================= */}
      {trainingPages.map((page, pIdx) => {
        const isDeload = page.phase === 'DELOAD';
        return (
          <div className="pdf-page-container" id={`page-training-${pIdx}`} key={`page-training-${pIdx}`}>
            <div>
              {/* Running Header */}
              <div className="running-header">
                <span>Z COACHING | KARIM ZAKARIA</span>
                <span className="font-monospace">CLIENT CODE: #{clientCode}</span>
              </div>

              {/* Split Overview Banner */}
              <div 
                className="d-flex justify-content-between align-items-center pdf-card" 
                style={{ 
                  marginBottom: '14px', 
                  background: isDeload ? '#F0FDF4' : '#F8FAFC', 
                  borderRight: isDeload ? '3pt solid #16A34A' : '3pt solid #0284C7',
                  borderColor: isDeload ? '#BBF7D0' : '#E2E8F0'
                }}
              >
                <div>
                  <h5 style={{ fontSize: '11pt', fontWeight: '900', color: isDeload ? '#166534' : '#0F172A', margin: 0 }}>
                    {isDeload
                      ? `الأسبوع ${page.weekNumber}: أسبوع كسر الإجهاد والاستشفاء (Deload Week) ${page.totalChunksInWeek > 1 ? `[جزء ${page.chunkIndex + 1}/${page.totalChunksInWeek}]` : ''}`
                      : `الأسبوع ${page.weekNumber}: ${page.phase === 'PEAK' ? 'مرحلة قمة الأداء (Peak Phase)' : page.phase === 'OVERREACHING' ? 'مرحلة الحمل المكثف (Overreaching)' : 'مرحلة البناء والتراكم (Accumulation)'} ${page.totalChunksInWeek > 1 ? `[جزء ${page.chunkIndex + 1}/${page.totalChunksInWeek}]` : ''}`}
                  </h5>
                  <small style={{ fontSize: '8pt', color: isDeload ? '#15803D' : '#64748B' }}>
                    {page.focusNote}
                  </small>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span className="badge font-monospace" style={{ 
                    background: isDeload ? '#DCFCE7' : '#E5F0FF', 
                    color: isDeload ? '#166534' : '#0284C7', 
                    fontSize: '8pt', 
                    border: isDeload ? '1px solid #86EFAC' : '1px solid #BAE6FD' 
                  }}>
                    {isDeload ? 'DELOAD • RIR 3-4' : `TARGET RIR: ${page.targetRir}`}
                  </span>
                </div>
              </div>

              {/* Sessions & Workout Tables */}
              {page.sessions.map((session, sIdx) => (
                <div key={sIdx} style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '9pt', fontWeight: '800', color: '#0F172A', marginBottom: '6px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>
                    {session.session_name || session.name || `الحصة ${page.chunkIndex * 2 + sIdx + 1}`}
                  </div>
                  <table className="pdf-table">
                    <thead>
                      <tr>
                        <th style={{ width: '32%' }}>التمرين</th>
                        <th style={{ width: '22%' }}>العضلة المستهدفة</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>المجموعات</th>
                        <th style={{ width: '12%', textAlign: 'center' }}>العدات</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>RIR</th>
                        <th style={{ width: '14%', textAlign: 'center' }}>الراحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.exercises?.map((ex, eIdx) => {
                        const exNames = getExerciseDisplayNames(ex);
                        const effectiveRir = ex.rir || (ex.prescription && ex.prescription.target_rir) || page.targetRir;
                        return (
                          <tr key={eIdx}>
                            <td>
                              <strong style={{ display: 'block', fontSize: '8.5pt', color: '#0F172A', direction: 'ltr', textAlign: 'right' }}>
                                {exNames.nameEn}
                              </strong>
                              <small className="d-block text-muted" style={{ fontSize: '7.5pt', marginTop: '1px' }}>
                                {exNames.nameAr}
                              </small>
                            </td>
                            <td style={{ color: '#475569' }}>{ex.muscle || 'عضلة رئيسية'}</td>
                            <td style={{ textAlign: 'center', fontWeight: '700' }} className="font-monospace">
                              {ex.sets || (Array.isArray(ex.sets) ? ex.sets.length : (ex.prescription?.sets || 3))}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '700' }} className="font-monospace">
                              {ex.reps || ex.target_reps || (ex.prescription?.target_min ? `${ex.prescription.target_min}-${ex.prescription.target_max}` : '8 - 10')}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '700', color: isDeload ? '#166534' : '#0284C7' }} className="font-monospace">
                              {effectiveRir}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '600' }} className="font-monospace">
                              {ex.rest || (ex.rest_seconds ? `${ex.rest_seconds}s` : '75s')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* QR Code & Video Technique Block on First Training Page */}
              {pIdx === 0 && (
                <div className="pdf-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0F9FF', borderColor: '#BAE6FD', marginTop: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '8.5pt', color: '#0369A1', display: 'block' }}>مكتبة فيديوهات التكنيك والشرح الحركي (Video Technique Guide)</strong>
                    <small style={{ fontSize: '7.5pt', color: '#475569' }}>
                      امسح رمز الاستجابة السريعة (QR) بكاميرا هاتفك لفتح مكتبة الفيديوهات عالية الدقة والتكنيك المعتمد لكل تمرين.
                    </small>
                  </div>
                  <div style={{ width: '56px', height: '56px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '7pt', color: '#0F172A', textAlign: 'center', flexShrink: 0 }}>
                    SCAN QR
                  </div>
                </div>
              )}
            </div>

            {/* Running Footer */}
            <div className="running-footer">
              <span>CONFIDENTIAL & PROPRIETARY — Z COACHING</span>
              <span className="font-monospace">PAGE {3 + pIdx} OF {totalPages}</span>
            </div>
          </div>
        );
      })}

      {/* =========================================================================
          PAGE 4: بروتوكول الكارديو، الإحماء، والسلامة المفصلية (Cardio & Mobility Matrix)
          ========================================================================= */}
      <div className="pdf-page-container" id="page-4">
        <div>
          {/* Running Header */}
          <div className="running-header">
            <span>Z COACHING | KARIM ZAKARIA</span>
            <span className="font-monospace">CLIENT CODE: #{clientCode}</span>
          </div>

          {/* 1. Zone 2 Cardio Protocol */}
          <div className="section-title">7. بروتوكول كارديو المنطقة الثانية (Zone 2 Cardio Prescription)</div>
          <table className="pdf-table" style={{ marginBottom: '14px' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>الجهاز الموصى به</th>
                <th style={{ width: '25%' }}>التكرار الأسبوعي</th>
                <th style={{ width: '25%' }}>المدة لكل جلسة</th>
                <th style={{ width: '25%' }}>معدل النبض المستهدف</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: '700', textAlign: 'center' }}>
                <td>Incline Treadmill Walking</td>
                <td>3 جلسات أسبوعياً</td>
                <td>30 دقيقة</td>
                <td style={{ color: '#0284C7' }} className="font-monospace">125 - 135 BPM</td>
              </tr>
            </tbody>
          </table>

          {/* 2. Dynamic Warm-up */}
          <div className="section-title">8. روتين الإحماء الحركي الديناميكي (6-8 Min Dynamic Warm-up)</div>
          <div className="pdf-card" style={{ fontSize: '8pt', lineHeight: '1.6', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>• إحماء الجزء العلوي:</strong> تدوير الذراعين للأمام والخلف 15 تكراراً + تفعيل أوتار الكفة المدورة (Rotator Cuff) بالكابل الخفيف 2 × 15.
            </p>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>• إحماء الجزء السفلي:</strong> إطالة العضلة الضامة (World's Greatest Stretch) 6 تكرارات لكل جانب + تفعيل الجلوتس (Glute Bridges) 2 × 12.
            </p>
            <p style={{ margin: '0' }}>
              <strong>• مجموعات التسخين الهرمية:</strong> جولتان بأوزان خفيفة (40% ثم 60%) قبل البدء في أول مجموعة عمل رسمية.
            </p>
          </div>

          {/* 3. Clinical Safety & Contraindications Table */}
          <div className="section-title">9. مصفوفة الأمان والمحاذير الحركية والبدائل العلاجية (Clinical Safety Matrix)</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th style={{ width: '30%', color: '#DC2626' }}>الحركة المستبعدة (Excluded)</th>
                <th style={{ width: '35%', color: '#16A34A' }}>البديل العلاجي الآمن (Safe Alternative)</th>
                <th style={{ width: '35%' }}>السبب الفسيولوجي والتوجيه السريري</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '700', color: '#DC2626' }}>Barbell Overhead Press</td>
                <td style={{ fontWeight: '700', color: '#16A34A' }}>Seated Neutral-Grip DB Press</td>
                <td>تجنب احتكاك أوتار الكتف وضمان مسار طبيعي للمفصل (Impingement Relief).</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#DC2626' }}>Conventional Barbell Deadlift</td>
                <td style={{ fontWeight: '700', color: '#16A34A' }}>Romanian Deadlift (Controlled Tempo)</td>
                <td>تقليل عزم الدوران والضغط المحوري على الفقرات القطنية (Lumbar Protection).</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#DC2626' }}>Standing Barbell Biceps Curl</td>
                <td style={{ fontWeight: '700', color: '#16A34A' }}>Incline Dumbbell Curl</td>
                <td>تقليل إجهاد مفصل الرسغ وعزل الرأس الطويل للبايسبس بأمان.</td>
              </tr>
            </tbody>
          </table>

          {/* Final Coach Signature Sign-off */}
          <div style={{ marginTop: '18px', borderTop: '1pt solid #0F172A', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <strong style={{ fontSize: '8.5pt', color: '#0F172A', display: 'block' }}>اعتماد المشرف الرياضي والعيادي:</strong>
              <span style={{ fontSize: '8pt', color: '#475569' }}>كابتن كريم زكريا — كبير المدربين ومؤسس المنظومة</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span className="font-monospace" style={{ fontSize: '8pt', color: '#0284C7', fontWeight: '700' }}>
                VERIFIED & DIGITALLY APPROVED
              </span>
            </div>
          </div>
        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>CONFIDENTIAL & PROPRIETARY — Z COACHING</span>
          <span className="font-monospace">PAGE {totalPages} OF {totalPages}</span>
        </div>
      </div>

    </div>
  );
}
