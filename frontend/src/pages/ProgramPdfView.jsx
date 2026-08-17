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
  const supplements = DEFAULT_SUPPLEMENTS;
  const clientName = user?.full_name || (user?.client_code ? `متدرب #${user.client_code}` : "المتدرب");
  const clientCode = user?.client_code || targetUserId;
  const rawGender = (user?.gender || program?.athlete_gender || 'male').toLowerCase();
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
            
            {/* 1. Quiet Luxury Executive Hero Header */}
            <div 
              className="p-3 mb-3 border rounded-4 d-flex align-items-center justify-content-between position-relative overflow-hidden" 
              style={{ 
                borderColor: '#ddd6fe', 
                borderRight: '5px solid #261c6a',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 50%, #f5f3ff 100%)',
                boxShadow: '0 2px 10px rgba(38, 28, 106, 0.04)'
              }}
            >
              {/* Right Side: Athlete Name, Program Phase, and Feature Badges */}
              <div style={{ maxWidth: '490px', zIndex: 2 }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                    alt="Z Coaching" 
                    style={{ width: '34px', height: '34px', objectFit: 'contain' }} 
                  />
                  <h5 className="fw-bold mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.12rem', color: '#1e144f' }}>
                    {isFemale ? 'البطلة' : 'كابتن'} {clientName}
                  </h5>
                  <span className="badge rounded-pill fw-bold" style={{ background: '#261c6a', color: '#ffffff', fontSize: '0.64rem', padding: '4px 8px' }}>
                    Z-ENGINE V2.0
                  </span>
                  <span className="badge bg-white text-secondary border font-monospace" style={{ fontSize: '0.68rem' }}>كود: {clientCode}</span>
                </div>

                <p className="text-muted mb-2 fw-medium" style={{ fontSize: '0.75rem' }}>
                  خطة الميزوسايكل المخصصة (الأسبوع 1 / مرحلة: <span style={{ color: '#261c6a', fontWeight: '700' }}>التراكم والتجهيز</span>) — مستوى الجهد المستهدف: <strong style={{ color: '#059669' }}>3 RIR</strong>
                </p>

                <div className="d-flex gap-1.5 flex-wrap" style={{ gap: '6px' }}>
                  <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#372896', border: '1px solid #c4b5fd', fontSize: '0.68rem' }}>
                    بناء عضلي وحرق دهون
                  </span>
                  <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '0.68rem' }}>
                    تجهيزات جيم تجاري كامل
                  </span>
                  <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.68rem' }}>
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
                    maxHeight: '92px', 
                    maxWidth: '120px', 
                    objectFit: 'contain',
                    filter: 'invert(16%) sepia(85%) saturate(3500%) hue-rotate(248deg) brightness(85%) contrast(110%)',
                    opacity: 0.92
                  }} 
                />
                <div className="d-flex flex-column gap-1">
                  <div className="p-1 px-2.5 rounded-3 text-center" style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', minWidth: '88px' }}>
                    <span className="text-muted d-block fw-semibold" style={{ fontSize: '0.58rem' }}>مرحلة الخطة</span>
                    <strong className="d-block" style={{ fontSize: '0.74rem', color: '#261c6a' }}>الأسبوع 1</strong>
                  </div>
                  <div className="p-1 px-2.5 rounded-3 text-center" style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', minWidth: '88px' }}>
                    <span className="text-muted d-block fw-semibold" style={{ fontSize: '0.58rem' }}>التكيف الذكي</span>
                    <strong className="d-block text-success" style={{ fontSize: '0.74rem' }}>مفعل بنجاح ✓</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Daily Macros Target Bar (Soft Luxury Gradient Cards matching Header) */}
            <div className="row g-2 mb-3">
              {/* Calories */}
              <div className="col">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)', border: '1px solid #e2e8f0', borderTop: '3.5px solid #372896' }}>
                  <small className="d-block fw-bold" style={{ fontSize: '0.64rem', color: '#372896' }}>السعرات المستهدفة</small>
                  <span className="fw-bold d-block my-0.5" style={{ fontSize: '1.18rem', color: '#1e144f' }}>{calories}</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.58rem' }}>kcal / يوم</small>
                </div>
              </div>
              {/* Protein */}
              <div className="col">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)', border: '1px solid #e2e8f0', borderTop: '3.5px solid #0284c7' }}>
                  <small className="d-block fw-bold" style={{ fontSize: '0.64rem', color: '#0284c7' }}>البروتين الصافي</small>
                  <span className="fw-bold d-block my-0.5" style={{ fontSize: '1.18rem', color: '#0284c7' }}>{protein}g</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.58rem' }}>لبناء الألياف</small>
                </div>
              </div>
              {/* Carbs */}
              <div className="col">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fffdf5 100%)', border: '1px solid #e2e8f0', borderTop: '3.5px solid #d97706' }}>
                  <small className="d-block fw-bold" style={{ fontSize: '0.64rem', color: '#d97706' }}>الكاربوهيدرات</small>
                  <span className="fw-bold d-block my-0.5" style={{ fontSize: '1.18rem', color: '#d97706' }}>{carbs}g</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.58rem' }}>طاقة التدريب</small>
                </div>
              </div>
              {/* Fats */}
              <div className="col">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)', border: '1px solid #e2e8f0', borderTop: '3.5px solid #e11d48' }}>
                  <small className="d-block fw-bold" style={{ fontSize: '0.64rem', color: '#e11d48' }}>الدهون الصحية</small>
                  <span className="fw-bold d-block my-0.5" style={{ fontSize: '1.18rem', color: '#e11d48' }}>{fats}g</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.58rem' }}>صحة الهرمونات</small>
                </div>
              </div>
              {/* Water */}
              <div className="col">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #e2e8f0', borderTop: '3.5px solid #059669' }}>
                  <small className="d-block fw-bold" style={{ fontSize: '0.64rem', color: '#059669' }}>شرب الماء</small>
                  <span className="fw-bold d-block my-0.5" style={{ fontSize: '1.18rem', color: '#059669' }}>3.5L</span>
                  <small className="d-block text-muted" style={{ fontSize: '0.58rem' }}>هيدريشن يومي</small>
                </div>
              </div>
            </div>

            {/* 3. Meals Schedule (Executive 3-Column Structured Layout with Colored Ribbons) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#e2e8f0' }}>
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: '0.86rem', color: '#1e144f' }}>
                <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', background: '#f5f3ff', color: '#261c6a' }}>
                  <i className="ti ti-salad fs-6"></i>
                </span>
                <span>جدول الوجبات والبدائل المرنة (Flexible Meal Plan)</span>
              </h6>
              <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#372896', border: '1px solid #c4b5fd', fontSize: '0.66rem' }}>
                موزونة بوحدات قياس منزلية دقيقة
              </span>
            </div>

            <div className="row g-2 mb-3">
              {meals.map((meal, mIdx) => {
                const mealColors = [
                  { borderTop: '#d97706', badgeBg: '#fffbeb', badgeText: '#b45309', badgeBorder: '#fde68a' },
                  { borderTop: '#261c6a', badgeBg: '#f5f3ff', badgeText: '#372896', badgeBorder: '#ddd6fe' },
                  { borderTop: '#7c3aed', badgeBg: '#fdf4ff', badgeText: '#86198f', badgeBorder: '#f5d0fe' }
                ];
                const curColor = mealColors[mIdx % 3];

                return (
                  <div key={mIdx} className="col-4">
                    <div className="p-2 border rounded-3 h-100 bg-white shadow-xs" style={{ borderColor: '#e2e8f0', borderTop: `4px solid ${curColor.borderTop}` }}>
                      <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1.5 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <span className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                          {meal.meal_label}
                        </span>
                        <span className="badge rounded-pill fw-bold" style={{ background: curColor.badgeBg, color: curColor.badgeText, border: `1px solid ${curColor.badgeBorder}`, fontSize: '0.64rem' }}>
                          ~ {meal.calories} سعرة
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-1">
                        {meal.foods?.map((f, fIdx) => (
                          <div key={fIdx} className="p-1 px-2 rounded-2 border bg-light d-flex flex-column" style={{ fontSize: '0.68rem', borderColor: '#f1f5f9' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold text-dark">{f.name_ar}</span>
                              <span className="badge bg-white text-dark border px-1.5 fw-bold" style={{ fontSize: '0.62rem', borderColor: '#cbd5e1' }}>{f.portion_g}</span>
                            </div>
                            <small className="text-muted" style={{ fontSize: '0.6rem' }}>{f.notes}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Daily Supplements Protocol (5 Essential Items) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#e2e8f0' }}>
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: '0.86rem', color: '#1e144f' }}>
                <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', background: '#ecfdf5', color: '#059669' }}>
                  <i className="ti ti-pill fs-6"></i>
                </span>
                <span>بروتوكول المكملات الغذائية المعتمد (Supplements Protocol)</span>
              </h6>
              <span className="badge rounded-pill fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.66rem' }}>
                5 مكملات موصى بها علمياً
              </span>
            </div>

            <div className="row g-2 mb-3">
              {supplements.map((sup, sIdx) => (
                <div key={sIdx} className="col">
                  <div className="p-2 rounded-3 border text-center h-100 bg-white" style={{ borderColor: '#e2e8f0', borderTop: '3px solid #0891b2' }}>
                    <span className="fw-bold d-block text-dark text-truncate" style={{ fontSize: '0.72rem' }}>{sup.name_ar}</span>
                    <span className="badge rounded-pill my-1 fw-bold" style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc', fontSize: '0.62rem' }}>{sup.dosage}</span>
                    <small className="text-muted d-block" style={{ fontSize: '0.6rem', lineHeight: '1.2' }}>{sup.timing}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Coach Custom Directives */}
            <div className="p-2.5 px-3 rounded-3 mb-2" style={{ background: 'linear-gradient(135deg, #fbfaff 0%, #f5f3ff 100%)', border: '1.5px solid #ddd6fe', borderRight: '5px solid #261c6a' }}>
              <h6 className="fw-bold mb-1 d-flex align-items-center gap-1" style={{ color: '#261c6a', fontSize: '0.80rem' }}>
                <i className="ti ti-notes fs-6"></i>
                <span>توجيهات الكابتن للمرحلة الحالية:</span>
              </h6>
              <p className="mb-0 text-dark fw-medium" style={{ lineHeight: '1.45', fontSize: '0.75rem' }}>
                {coachNotes}
              </p>
            </div>
          </div>

          {/* Footer Page 1 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.68rem', borderColor: '#e2e8f0' }}>
            <span>منظومة Z Coaching Master Platform — وثيقة رقمية معتمدة (صفحة 1 من 2)</span>
            <span className="fw-bold" style={{ color: '#261c6a' }}>اعتماد الخطة: كابتن Z Coaching ✓</span>
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
              className="p-3 mb-3 border rounded-4 d-flex align-items-center justify-content-between position-relative overflow-hidden" 
              style={{ 
                borderColor: '#ddd6fe', 
                borderRight: '5px solid #261c6a',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 50%, #f5f3ff 100%)',
                boxShadow: '0 2px 10px rgba(38, 28, 106, 0.04)'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <img 
                  src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                  alt="Z Coaching" 
                  style={{ width: '34px', height: '34px', objectFit: 'contain' }} 
                />
                <div>
                  <h5 className="fw-bold mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.10rem', color: '#1e144f' }}>
                    الجدول التدريبي المعتمد وروابط تكنيك التمارين
                  </h5>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    المتدرب: <strong className="text-dark">{clientName}</strong> | كود: <span className="font-monospace fw-bold">{clientCode}</span> | صفحة 2 من 2
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ background: '#261c6a', color: '#ffffff', fontSize: '0.72rem' }}>
                  {sessions.length} أيام تدريبية مبرمجة
                </span>
              </div>
            </div>

            {/* Workout Sessions Grid (Distinct Color Themed Headers) */}
            <div className="row g-2 mb-3">
              {sessions.slice(0, 4).map((sess, sIdx) => {
                const sessionThemes = [
                  { borderTop: '#261c6a', headerBg: '#f5f3ff', titleColor: '#261c6a', badgeBg: '#ede9fe', badgeText: '#372896', badgeBorder: '#c4b5fd', tableHeadBg: '#f8faff' },
                  { borderTop: '#16a34a', headerBg: '#f0fdf4', titleColor: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', badgeBorder: '#86efac', tableHeadBg: '#f6fef9' },
                  { borderTop: '#0891b2', headerBg: '#ecfeff', titleColor: '#0e7490', badgeBg: '#cffafe', badgeText: '#155e75', badgeBorder: '#7dd3fc', tableHeadBg: '#f0fdfa' },
                  { borderTop: '#ea580c', headerBg: '#fff7ed', titleColor: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', badgeBorder: '#fed7aa', tableHeadBg: '#fffaf5' }
                ];
                const theme = sessionThemes[sIdx % 4];

                return (
                  <div key={sIdx} className="col-6">
                    <div className="border rounded-3 p-2 h-100 bg-white shadow-xs" style={{ borderColor: '#e2e8f0', borderTop: `4px solid ${theme.borderTop}` }}>
                      <div className="d-flex justify-content-between align-items-center mb-1.5 p-1.5 rounded-2" style={{ background: theme.headerBg }}>
                        <span className="fw-bold" style={{ fontSize: '0.80rem', color: theme.titleColor }}>
                          {sess.session_name || sess.session_code || `تمرين اليوم ${sIdx + 1}`}
                        </span>
                        <span className="badge rounded-pill fw-bold" style={{ background: theme.badgeBg, color: theme.badgeText, border: `1px solid ${theme.badgeBorder}`, fontSize: '0.64rem' }}>
                          {sess.exercises?.length || 6} تمارين
                        </span>
                      </div>

                      <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '0.72rem', tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                          <tr className="border-bottom" style={{ fontSize: '0.68rem', borderColor: '#e2e8f0', background: theme.tableHeadBg, color: '#334155' }}>
                            <th className="py-1 px-1 fw-bold" style={{ width: '56%' }}>التمرين (فيديو)</th>
                            <th className="text-center py-1 fw-bold" style={{ width: '14%' }}>مجموعات</th>
                            <th className="text-center py-1 fw-bold" style={{ width: '15%' }}>عدات</th>
                            <th className="text-center py-1 fw-bold" style={{ width: '15%' }}>راحة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sess.exercises?.map((ex, exIdx) => {
                            const arName = ex.name_ar || getArabicExerciseName(ex.exercise_code || ex);
                            const videoUrl = getExerciseVideoUrl(ex);
                            const sets = ex.prescription?.sets || ex.sets || 3;
                            const minReps = ex.prescription?.target_min || ex.reps || 8;
                            const maxReps = ex.prescription?.target_max || ex.reps || 12;
                            const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;

                            return (
                              <tr key={exIdx} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                <td className="py-1 px-1" style={{ width: '56%' }}>
                                  <a 
                                    href={videoUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 text-dark"
                                    style={{ fontSize: '0.73rem', lineHeight: '1.25' }}
                                    title="انقر لمشاهدة فيديو التكنيك العملي"
                                  >
                                    <span className="text-truncate">{arName}</span>
                                    <span className="badge rounded-circle p-1 d-inline-flex align-items-center justify-content-center flex-shrink-0" style={{ background: '#fef2f2', color: '#dc2626', width: '16px', height: '16px' }}>
                                      <i className="ti ti-video" style={{ fontSize: '0.62rem' }}></i>
                                    </span>
                                  </a>
                                </td>
                                <td className="text-center py-1 fw-bold" style={{ width: '14%', color: '#1e293b' }}>
                                  <span className="badge bg-light text-dark border px-1.5" style={{ fontSize: '0.68rem', fontWeight: '800' }}>{sets}</span>
                                </td>
                                <td className="text-center py-1 fw-semibold text-dark" style={{ width: '15%' }}>
                                  {minReps === maxReps ? minReps : `${minReps}-${maxReps}`}
                                </td>
                                <td className="text-center py-1 text-muted" style={{ width: '15%', fontSize: '0.68rem' }}>{rest}ث</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cardio Protocol Table (Distinct Energetic Red/Coral Theme) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#e2e8f0' }}>
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: '0.86rem', color: '#be123c' }}>
                <span className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', background: '#ffe4e6', color: '#e11d48' }}>
                  <i className="ti ti-activity fs-6"></i>
                </span>
                <span>نشاط الكارديو ونطاق حرق الدهون (Cardio Zone 2)</span>
              </h6>
              <span className="badge rounded-pill fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.66rem' }}>
                الهدف اليومي: 8,000 خطوة
              </span>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-3">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)', border: '1px solid #e2e8f0', borderTop: '3px solid #0369a1' }}>
                  <small className="d-block fw-semibold" style={{ fontSize: '0.62rem', color: '#0369a1' }}>النوع والنشاط</small>
                  <strong className="d-block text-dark" style={{ fontSize: '0.74rem' }}>مشي سريع / مشاية مائلة</strong>
                </div>
              </div>
              <div className="col-3">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)', border: '1px solid #e2e8f0', borderTop: '3px solid #e11d48' }}>
                  <small className="d-block fw-semibold" style={{ fontSize: '0.62rem', color: '#be123c' }}>النبض المستهدف (Zone 2)</small>
                  <strong className="d-block" style={{ fontSize: '0.76rem', color: '#e11d48' }}>115 - 134 نبضة/د</strong>
                </div>
              </div>
              <div className="col-3">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)', border: '1px solid #e2e8f0', borderTop: '3px solid #7e22ce' }}>
                  <small className="d-block fw-semibold" style={{ fontSize: '0.62rem', color: '#7e22ce' }}>التوقيت المفضل</small>
                  <strong className="d-block text-dark" style={{ fontSize: '0.74rem' }}>بعد التمرين أو صباحاً</strong>
                </div>
              </div>
              <div className="col-3">
                <div className="p-2 rounded-3 text-center h-100 shadow-xs" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #e2e8f0', borderTop: '3px solid #059669' }}>
                  <small className="d-block fw-semibold" style={{ fontSize: '0.62rem', color: '#15803d' }}>المدة الأسبوعية</small>
                  <strong className="d-block" style={{ fontSize: '0.76rem', color: '#059669' }}>120 - 150 دقيقة</strong>
                </div>
              </div>
            </div>

            {/* Training Guidelines (Progressive Overload Banner) */}
            <div className="p-2 px-3 rounded-3 mb-1" style={{ background: 'linear-gradient(135deg, #fbfaff 0%, #f5f3ff 100%)', border: '1.5px solid #ddd6fe', borderRight: '5px solid #4f46e5' }}>
              <small className="text-dark fw-semibold d-block" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                <strong style={{ color: '#261c6a' }}>تعليمات السلامة والتطور:</strong> اترك من 2 إلى 3 عدات في الاحتياط (<strong style={{ color: '#059669' }}>RIR 2-3</strong>) قبل الوصول للفشل العضلي، واحرص على زيادة الأوزان تدريجياً (<strong style={{ color: '#261c6a' }}>Progressive Overload</strong>) أسبوعياً مع تسجيل الأداء.
              </small>
            </div>

          </div>

          {/* Footer Page 2 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.68rem', borderColor: '#e2e8f0' }}>
            <span>منظومة Z Coaching Master Platform — وثيقة رقمية معتمدة (صفحة 2 من 2)</span>
            <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
