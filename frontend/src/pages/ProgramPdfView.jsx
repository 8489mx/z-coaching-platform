import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { getArabicExerciseName } from '../utils/exerciseTranslator';

const DEFAULT_SESSIONS = [
  {
    session_code: "UPPER_A",
    session_name: "تمرين اليوم 1: الجزء العلوي (Upper A)",
    exercises: [
      { name_en: "Barbell Bench Press", name_ar: "بنش برس بالبار مستوي", prescription: { sets: 3, target_min: 6, target_max: 8, rest_seconds: 90 } },
      { name_en: "Barbell Bent-Over Row", name_ar: "تجديف بالبار متني الظهر", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Overhead Press (OHP)", name_ar: "ضغط كتف بالبار واقفاً", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Lat Pulldown", name_ar: "سحب عالي للظهر قبضة واسعة", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 75 } },
      { name_en: "Dumbbell Incline Curl", name_ar: "مرجحة بايسبس بالدمبل مائل", prescription: { sets: 2, target_min: 10, target_max: 12, rest_seconds: 60 } },
      { name_en: "Overhead Triceps Ext", name_ar: "ترايسبس كابل خلف الرأس", prescription: { sets: 2, target_min: 12, target_max: 15, rest_seconds: 60 } }
    ]
  },
  {
    session_code: "LOWER_A",
    session_name: "تمرين اليوم 2: الجزء السفلي (Lower A)",
    exercises: [
      { name_en: "Barbell Back Squat", name_ar: "سكوات بالبار حر", prescription: { sets: 3, target_min: 6, target_max: 8, rest_seconds: 120 } },
      { name_en: "Romanian Deadlift (RDL)", name_ar: "ديدليفت روماني للهامسترنج", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Leg Press 45", name_ar: "دفع أرجل بالماكينة 45 درجة", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 90 } },
      { name_en: "Lying Leg Curl", name_ar: "مرجحة خلفيات الأرجل نائماً", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 60 } },
      { name_en: "Standing Calf Raise", name_ar: "رفع بطات بالماكينة واقفاً", prescription: { sets: 4, target_min: 12, target_max: 15, rest_seconds: 45 } },
      { name_en: "Hanging Leg Raise", name_ar: "رفع أرجل لعضلات البطن معلقاً", prescription: { sets: 3, target_min: 12, target_max: 15, rest_seconds: 45 } }
    ]
  },
  {
    session_code: "UPPER_B",
    session_name: "تمرين اليوم 3: الجزء العلوي (Upper B)",
    exercises: [
      { name_en: "Incline DB Bench Press", name_ar: "بنش مائل بالدمبل", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Seated Cable Row", name_ar: "سحب أرضي بالكابل للظهر", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "DB Lateral Raise", name_ar: "رفرفة جانبية بالدمبل للكتف", prescription: { sets: 4, target_min: 12, target_max: 15, rest_seconds: 60 } },
      { name_en: "Chest Supported T-Bar Row", name_ar: "سحب تي بار مدعوم الصدر", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 75 } },
      { name_en: "Hammer Curls", name_ar: "مرجحة هامر للبايسبس والساعد", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 60 } },
      { name_en: "Cable Rope Pushdown", name_ar: "ضغط ترايسبس بالحبل للأسفل", prescription: { sets: 3, target_min: 12, target_max: 15, rest_seconds: 60 } }
    ]
  },
  {
    session_code: "LOWER_B",
    session_name: "تمرين اليوم 4: الجزء السفلي (Lower B)",
    exercises: [
      { name_en: "Bulgarian Split Squat", name_ar: "سكوات بلغاري بالدمبل فردي", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Barbell Hip Thrust", name_ar: "هيب ثرست بالبار للمؤخرة", prescription: { sets: 3, target_min: 8, target_max: 10, rest_seconds: 90 } },
      { name_en: "Leg Extension", name_ar: "فرد أرجل أمامي بالماكينة", prescription: { sets: 3, target_min: 12, target_max: 15, rest_seconds: 60 } },
      { name_en: "Seated Leg Curl", name_ar: "مرجحة خلفيات بالماكينة جالساً", prescription: { sets: 3, target_min: 10, target_max: 12, rest_seconds: 60 } },
      { name_en: "Seated Calf Raise", name_ar: "رفع بطات بالماكينة جالساً", prescription: { sets: 3, target_min: 15, target_max: 20, rest_seconds: 45 } },
      { name_en: "Cable Woodchoppers", name_ar: "تقطيع خشب بالكابل للخواصر", prescription: { sets: 3, target_min: 12, target_max: 15, rest_seconds: 45 } }
    ]
  }
];

const DEFAULT_SUPPLEMENTS = [
  { name_ar: "كرياتين مونوهيدرات", dosage: "5 جرام يومياً", timing: "بعد التمرين مع ماء أو عصير", purpose: "زيادة القوة وتضخيم الخلايا العضلية" },
  { name_ar: "واي بروتين (Whey)", dosage: "1 سكوب (30 جم)", timing: "بعد التمرين أو كوجبة خفيفة", purpose: "تغطية الاحتياج اليومي وتخليق البروتين" },
  { name_ar: "أوميجا 3 عالي التركيز", dosage: "1000 - 2000 مجم", timing: "مع وجبة تحتوي على دهون", purpose: "تقليل التهابات المفاصل وصحة القلب" },
  { name_ar: "فيتامين D3 + K2", dosage: "5000 IU", timing: "صباحاً مع وجبة الإفطار", purpose: "دعم المناعة والعظام والتستوستيرون" },
  { name_ar: "ماغنيسيوم جلايسينات", dosage: "300 مجم", timing: "قبل النوم بـ 30 دقيقة", purpose: "استرخاء الأعصاب وتحسين النوم العميق" }
];

export default function ProgramPdfView() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [user, setUser] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || '2';

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`);
      const data = await res.json();
      if (data.program) setProgram(data.program);
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

  const scrollToPage = (pageId) => {
    const el = document.getElementById(pageId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" dir="rtl" style={{ backgroundColor: '#0f172a', color: '#fff' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-white-50 mt-2 small">جاري إعداد وثيقة الـ PDF المعتمدة...</p>
        </div>
      </div>
    );
  }

  const rawSessions = 
    program?.adapted_training_week?.sessions ||
    program?.training_program?.weeks?.[0]?.sessions || 
    program?.training_program?.mesocycle?.weeks?.[0]?.sessions || 
    [];

  const sessions = rawSessions.length > 0 ? rawSessions : DEFAULT_SESSIONS;

  const targets = 
    program?.adapted_nutrition || 
    program?.nutrition_program?.targets || 
    {};

  const calories = Math.round(targets.target_calories_kcal || targets.calories_kcal || 2200);
  const protein = Math.round(targets.protein_g || 170);
  const carbs = Math.round(targets.carbohydrate_g || targets.carbs_g || 220);
  const fats = Math.round(targets.fat_g || targets.fats_g || 60);

  const defaultMeals = [
    {
      meal_number: 1,
      meal_label: "الوجبة 1 (الإفطار)",
      calories: 700,
      foods: [
        { name_ar: "جبن قريش قليل الدسم", portion_g: "200 جرام", notes: "مصدر كازين بطيء الامتصاص" },
        { name_ar: "بيض مسلوق كامل", portion_g: "2 بيضة مسلوقة", notes: "دهون صحية وفيتامينات كاملة" },
        { name_ar: "شوفان كامل الحبة", portion_g: "80 جرام", notes: "وزن جاف قبل الطهي بالماء" },
        { name_ar: "موز طازج", portion_g: "1 حبة متوسطة (120 جم)", notes: "بوتاسيوم وطاقة فورية" },
        { name_ar: "زيت زيتون بكر", portion_g: "10 جرام", notes: "دهون أحادية غير مشبعة" }
      ]
    },
    {
      meal_number: 2,
      meal_label: "الوجبة 2 (الغداء)",
      calories: 850,
      foods: [
        { name_ar: "صدور دجاج مشوية", portion_g: "180 جرام", notes: "وزن صافي بعد الطهي بدون جلد" },
        { name_ar: "أرز أبيض بسمتي مطبوخ", portion_g: "220 جرام", notes: "كوب ونصف مطبوخ بدون دهون مضافة" },
        { name_ar: "سلطة خضراء متنوعة", portion_g: "طبق متوسط (150 جم)", notes: "خيار، طماطم، جرجير، ليمون" },
        { name_ar: "زيت زيتون بكر ممتاز", portion_g: "15 جرام", notes: "يضاف فوق السلطة" }
      ]
    },
    {
      meal_number: 3,
      meal_label: "الوجبة 3 (العشاء)",
      calories: 650,
      foods: [
        { name_ar: "بياض بيض مسلوق", portion_g: "5 بياض بيض (180 جم)", notes: "بروتين عالي النقاء بدون كوليسترول" },
        { name_ar: "بطاطس مسلوقة بالفرن", portion_g: "250 جرام", notes: "مصدر كارب معقد يشبع المعدة" },
        { name_ar: "خضار طازج (خيار وجزر)", portion_g: "150 جرام", notes: "ألياف لدعم حركة الجهاز الهضمي" },
        { name_ar: "زيت زيتون بكر", portion_g: "10 جرام", notes: "ملعقة صغيرة" }
      ]
    }
  ];

  const meals = defaultMeals;
  const supplements = program?.supplements || DEFAULT_SUPPLEMENTS;
  const rawGender = (user?.gender || '').toLowerCase();
  const clientName = user?.full_name || "أحمد سمير";
  const clientCode = user?.client_code || targetUserId;
  const isFemale = rawGender === 'female' || rawGender === 'f' || rawGender === 'أنثى' || 
                   clientName.includes('سارة') || clientName.includes('مريم') || clientName.includes('نور');

  const artworkSrc = isFemale 
    ? "/admin-dashboard_data/user-dashboard/userwelcome-shap.png" 
    : "/admin-dashboard_data/user-dashboard/male-fitness-art.png";

  const coachNotes = program?.coach_notes || "التزم بالبرنامج الغذائي الموزون، واحرص على شرب 3.5 لتر ماء يومياً، والنوم العميق 8 ساعات. قم بتسجيل أوزانك على الريق أسبوعياً لتفعيل التكيف الذكي.";

  const getExerciseVideoUrl = (ex) => {
    const query = encodeURIComponent(`${ex.name_ar || getArabicExerciseName(ex.exercise_code || ex)} ${ex.name_en || ex.exercise_code || ''} form technique`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <div className="pdf-view-wrapper py-4" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#090d16', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}>
      
      {/* Sticky Top Floating Print & Navigation Controller */}
      <div 
        className="sticky-top d-print-none mb-4 px-2" 
        style={{ 
          top: '16px', 
          zIndex: 1060, 
          maxWidth: '840px', 
          margin: '0 auto' 
        }}
      >
        <div 
          className="card border-0 shadow-2xl p-2 px-3 d-flex flex-row justify-content-between align-items-center rounded-pill" 
          style={{ 
            backgroundColor: 'rgba(19, 27, 46, 0.94)', 
            backdropFilter: 'blur(12px)', 
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              onClick={() => scrollToPage('pdf-page-1')} 
              className="btn btn-sm text-white px-3 rounded-pill fw-semibold" 
              style={{ background: '#261c6a', border: '1px solid #4338ca', fontSize: '0.78rem' }}
            >
              معاينة صفحة 1 (التغذية)
            </button>
            <button 
              type="button" 
              onClick={() => scrollToPage('pdf-page-2')} 
              className="btn btn-sm text-white px-3 rounded-pill fw-semibold" 
              style={{ background: '#261c6a', border: '1px solid #4338ca', fontSize: '0.78rem' }}
            >
              معاينة صفحة 2 (التمارين)
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <a 
              href={`/user-dashboard?user_id=${targetUserId}`} 
              className="btn btn-sm text-white-50 text-decoration-none px-3"
              style={{ fontSize: '0.8rem' }}
            >
              العودة للبوابة
            </a>
            <button 
              type="button" 
              onClick={handlePrint} 
              className="btn btn-sm px-4 fw-bold rounded-pill text-white shadow-sm d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #261c6a 100%)', height: '38px', fontSize: '0.82rem', border: 'none' }}
              title="طباعة وتحميل الخطة بالكامل في ملف PDF واحد من صفحتين"
            >
              <i className="ti ti-printer fs-6"></i>
              <span>تحميل وطباعة الخطة (PDF واحد من صفحتين)</span>
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body, #root, .pdf-view-wrapper, .pdf-document {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            width: 100% !important;
          }
          .d-print-none {
            display: none !important;
          }
          .pdf-document {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .pdf-page {
            box-sizing: border-box !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 10mm 12mm !important;
            margin: 0 auto !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          #pdf-page-2 {
            page-break-before: always !important;
            break-before: page !important;
          }
          .pdf-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}} />

      {/* Print Document Container */}
      <div className="pdf-document mx-auto" style={{ maxWidth: '800px' }}>
        
        {/* ================= PAGE 1: NUTRITION & LIFESTYLE ================= */}
        <div 
          id="pdf-page-1"
          className="pdf-page bg-white p-4 mb-4 shadow-2xl position-relative d-flex flex-column justify-content-between" 
          style={{ 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0', 
            minHeight: '1040px',
            maxHeight: '1040px',
            overflow: 'hidden'
          }}
        >
          <div>
            
            {/* 1. Quiet Luxury Executive Hero Header (Identical to User Portal Hero) */}
            <div 
              className="p-3 mb-3 border rounded-4 bg-white d-flex align-items-center justify-content-between position-relative overflow-hidden" 
              style={{ 
                borderColor: '#e2e8f0', 
                borderRight: '4px solid #261c6a',
                background: '#ffffff'
              }}
            >
              {/* Right Side: Athlete Name, Program Phase, and Feature Badges */}
              <div style={{ maxWidth: '490px', zIndex: 2 }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                    alt="Z Coaching" 
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                  />
                  <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.08rem' }}>
                    {isFemale ? 'البطلة' : 'كابتن'} {clientName}
                  </h5>
                  <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.64rem' }}>
                    Z-ENGINE V2.0
                  </span>
                  <small className="text-muted" style={{ fontSize: '0.68rem' }}>كود: {clientCode}</small>
                </div>

                <p className="text-muted mb-2" style={{ fontSize: '0.74rem' }}>
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: التراكم والتجهيز) — مستوى الجهد: <strong className="text-dark">3 RIR</strong>
                </p>

                <div className="d-flex gap-1 flex-wrap">
                  <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.66rem' }}>
                    بناء عضلي وحرق دهون
                  </span>
                  <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.66rem' }}>
                    تجهيزات جيم كامل
                  </span>
                  <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.66rem' }}>
                    8,000 خطوة يومياً
                  </span>
                </div>
              </div>

              {/* Left Side: Fitness Line-Art Artwork & Phase Status Box */}
              <div className="d-flex align-items-center gap-2" style={{ zIndex: 2 }}>
                <img 
                  src={artworkSrc} 
                  alt="Fitness Art" 
                  style={{ 
                    maxHeight: '90px', 
                    maxWidth: '120px', 
                    objectFit: 'contain',
                    filter: 'invert(16%) sepia(85%) saturate(3500%) hue-rotate(248deg) brightness(85%) contrast(110%)',
                    opacity: 0.9
                  }} 
                />
                <div className="d-flex flex-column gap-1">
                  <div className="p-1 px-2 rounded-2 text-center" style={{ background: '#fbfaff', border: '1px solid #ede9fe', minWidth: '85px' }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.58rem' }}>مرحلة الخطة</span>
                    <strong className="d-block" style={{ fontSize: '0.72rem', color: '#261c6a' }}>الأسبوع 1</strong>
                  </div>
                  <div className="p-1 px-2 rounded-2 text-center" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', minWidth: '85px' }}>
                    <span className="text-muted d-block" style={{ fontSize: '0.58rem' }}>التكيف الذكي</span>
                    <strong className="d-block text-success" style={{ fontSize: '0.72rem' }}>مفعل بنجاح ✓</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Daily Macros Target Bar (Quiet Luxury Imperial Violet) */}
            <div className="p-2 px-3 rounded-4 mb-3 text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #261c6a 0%, #1a134b 100%)' }}>
              <div className="row text-center align-items-center g-0">
                <div className="col">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.64rem' }}>السعرات اليومية</small>
                  <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{calories}</span> <small className="text-white-50" style={{ fontSize: '0.6rem' }}>kcal</small>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.64rem' }}>البروتين الصافي</small>
                  <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{protein}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.64rem' }}>الكاربوهيدرات</small>
                  <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{carbs}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.64rem' }}>الدهون الصحية</small>
                  <span className="fw-bold" style={{ fontSize: '1.05rem' }}>{fats}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.64rem' }}>شرب الماء</small>
                  <span className="fw-bold" style={{ fontSize: '1.05rem' }}>3.5L</span>
                </div>
              </div>
            </div>

            {/* 3. Meals Schedule (Executive 3-Column Structured Layout) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.82rem' }}>
                <i className="ti ti-salad me-1" style={{ color: '#261c6a' }}></i> جدول الوجبات والبدائل المرنة (Flexible Meal Plan)
              </h6>
              <span className="badge rounded-pill fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.64rem' }}>
                موزونة بوحدات قياس منزلية دقيقة
              </span>
            </div>

            <div className="row g-2 mb-3">
              {meals.map((meal, mIdx) => (
                <div key={mIdx} className="col-4">
                  <div className="p-2 border rounded-3 h-100 bg-white" style={{ borderColor: '#ede9fe', borderTop: '3px solid #261c6a' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <span className="fw-bold text-dark" style={{ fontSize: '0.74rem' }}>
                        {meal.meal_label}
                      </span>
                      <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.62rem' }}>
                        ~ {meal.calories} سعرة
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-1">
                      {meal.foods?.map((f, fIdx) => (
                        <div key={fIdx} className="p-1 px-2 rounded-2 border bg-light d-flex flex-column" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-dark">{f.name_ar}</span>
                            <span className="badge bg-white text-dark border px-1" style={{ fontSize: '0.62rem' }}>{f.portion_g}</span>
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.6rem' }}>{f.notes}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Daily Supplements Protocol (5 Essential Items) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.82rem' }}>
                <i className="ti ti-pill me-1" style={{ color: '#261c6a' }}></i> بروتوكول المكملات الغذائية المعتمد (Supplements Protocol)
              </h6>
              <span className="badge rounded-pill" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.64rem' }}>
                5 مكملات موصى بها
              </span>
            </div>

            <div className="row g-2 mb-3">
              {supplements.map((sup, sIdx) => (
                <div key={sIdx} className="col">
                  <div className="p-2 rounded-3 border text-center h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
                    <span className="fw-bold d-block text-dark" style={{ fontSize: '0.72rem' }}>{sup.name_ar}</span>
                    <span className="badge rounded-pill my-1" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.6rem' }}>{sup.dosage}</span>
                    <small className="text-muted d-block" style={{ fontSize: '0.62rem', lineHeight: '1.2' }}>{sup.timing}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Coach Custom Directives */}
            <div className="p-2 px-3 rounded-3 mb-2" style={{ backgroundColor: '#fbfaff', border: '1px solid #ede9fe', borderRight: '4px solid #261c6a' }}>
              <h6 className="fw-bold mb-1" style={{ color: '#261c6a', fontSize: '0.78rem' }}>
                <i className="ti ti-notes me-1"></i> توجيهات الكابتن للمرحلة الحالية:
              </h6>
              <p className="mb-0 text-dark fw-medium" style={{ lineHeight: '1.4', fontSize: '0.74rem' }}>
                {coachNotes}
              </p>
            </div>
          </div>

          {/* Footer Page 1 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
            <span>منظومة Z Coaching Master Platform — وثيقة رقمية معتمدة (صفحة 1 من 2)</span>
            <span>اعتماد الخطة: كابتن كيمو المحروقي ✓</span>
          </div>
        </div>

        {/* ================= PAGE 2: WORKOUT & CARDIO ================= */}
        <div 
          id="pdf-page-2"
          className="pdf-page bg-white p-4 mb-4 shadow-2xl position-relative d-flex flex-column justify-content-between" 
          style={{ 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0', 
            minHeight: '1040px',
            maxHeight: '1040px',
            overflow: 'hidden'
          }}
        >
          <div>
            
            {/* Page 2 Top Header */}
            <div 
              className="p-3 mb-3 border rounded-4 bg-white d-flex align-items-center justify-content-between position-relative overflow-hidden" 
              style={{ 
                borderColor: '#e2e8f0', 
                borderRight: '4px solid #261c6a',
                background: '#ffffff'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <img 
                  src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                  alt="Z Coaching" 
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                />
                <div>
                  <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.05rem' }}>
                    الجدول التدريبي المعتمد وروابط تكنيك التمارين
                  </h5>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>المتدرب: {clientName} | كود: {clientCode} | صفحة 2 من 2</small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.7rem' }}>
                  4 أيام تدريبية مبرمجة
                </span>
              </div>
            </div>

            {/* Workout Sessions Grid (Compact 2-Column x 2-Row = 4 Sessions) */}
            <div className="row g-2 mb-3">
              {sessions.slice(0, 4).map((sess, sIdx) => (
                <div key={sIdx} className="col-6">
                  <div className="border rounded-3 p-2 h-100 bg-white" style={{ borderColor: '#ede9fe', borderTop: '3px solid #261c6a' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <span className="fw-bold" style={{ fontSize: '0.78rem', color: '#261c6a' }}>
                        {sess.session_name || sess.session_code || `تمرين اليوم ${sIdx + 1}`}
                      </span>
                      <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.64rem' }}>
                        {sess.exercises?.length || 6} تمارين
                      </span>
                    </div>

                    <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '0.72rem', tableLayout: 'fixed', width: '100%' }}>
                      <thead>
                        <tr className="text-muted border-bottom" style={{ fontSize: '0.66rem', borderColor: '#f1f5f9' }}>
                          <th style={{ width: '56%' }}>التمرين (فيديو)</th>
                          <th className="text-center" style={{ width: '14%' }}>مجموعات</th>
                          <th className="text-center" style={{ width: '15%' }}>عدات</th>
                          <th className="text-center" style={{ width: '15%' }}>راحة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sess.exercises?.map((ex, exIdx) => {
                          const arName = ex.name_ar || getArabicExerciseName(ex.exercise_code || ex);
                          const enName = ex.name_en || ex.exercise_code?.replace(/_/g, " ") || "Exercise";
                          const videoUrl = getExerciseVideoUrl(ex);
                          const sets = ex.prescription?.sets || ex.sets || 3;
                          const minReps = ex.prescription?.target_min || ex.reps || 8;
                          const maxReps = ex.prescription?.target_max || ex.reps || 12;
                          const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;

                          return (
                            <tr key={exIdx} className="border-bottom" style={{ borderColor: '#f8fafc' }}>
                              <td className="py-1" style={{ width: '56%' }}>
                                <a 
                                  href={videoUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 text-dark"
                                  style={{ fontSize: '0.72rem', lineHeight: '1.25' }}
                                  title="انقر لمشاهدة فيديو التكنيك العملي"
                                >
                                  <span>{arName}</span>
                                  <i className="ti ti-video text-danger flex-shrink-0" style={{ fontSize: '0.68rem' }}></i>
                                </a>
                              </td>
                              <td className="text-center py-1 fw-bold text-dark" style={{ width: '14%' }}>{sets}</td>
                              <td className="text-center py-1" style={{ width: '15%' }}>{minReps === maxReps ? minReps : `${minReps}-${maxReps}`}</td>
                              <td className="text-center py-1 text-muted" style={{ width: '15%' }}>{rest}ث</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Cardio Protocol Table */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.82rem' }}>
                <i className="ti ti-activity text-danger me-1"></i> نشاط الكارديو ونطاق حرق الدهون (Cardio Zone 2)
              </h6>
              <span className="badge rounded-pill" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.64rem' }}>
                الهدف: 8,000 خطوة يومياً
              </span>
            </div>

            <div className="p-2 px-3 rounded-3 mb-2 bg-light border" style={{ borderColor: '#e2e8f0' }}>
              <div className="row text-center">
                <div className="col-3">
                  <small className="text-muted d-block" style={{ fontSize: '0.62rem' }}>النوع والنشاط</small>
                  <strong className="text-dark" style={{ fontSize: '0.74rem' }}>مشي سريع / مشاية مائلة</strong>
                </div>
                <div className="col-3 border-end">
                  <small className="text-muted d-block" style={{ fontSize: '0.62rem' }}>النبض المستهدف (Zone 2)</small>
                  <strong className="text-danger" style={{ fontSize: '0.74rem' }}>115 - 134 نبضة/دقيقة</strong>
                </div>
                <div className="col-3 border-end">
                  <small className="text-muted d-block" style={{ fontSize: '0.62rem' }}>التوقيت المفضل</small>
                  <strong className="text-dark" style={{ fontSize: '0.74rem' }}>بعد التمرين أو صباحاً</strong>
                </div>
                <div className="col-3 border-end">
                  <small className="text-muted d-block" style={{ fontSize: '0.62rem' }}>المدة الأسبوعية</small>
                  <strong className="text-success" style={{ fontSize: '0.74rem' }}>120 - 150 دقيقة/أسبوع</strong>
                </div>
              </div>
            </div>

            {/* Training Guidelines */}
            <div className="p-2 px-3 rounded-3 mb-1" style={{ backgroundColor: '#fbfaff', border: '1px solid #ede9fe' }}>
              <small className="text-dark fw-semibold d-block" style={{ fontSize: '0.7rem' }}>
                تعليمات السلامة والتطور: اترك من 2 إلى 3 عدات في الاحتياط (RIR 2-3) قبل الوصول للفشل العضلي، واحرص على زيادة الأوزان تدريجياً (Progressive Overload).
              </small>
            </div>

          </div>

          {/* Footer Page 2 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
            <span>منظومة Z Coaching Master Platform — وثيقة رقمية معتمدة (صفحة 2 من 2)</span>
            <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
