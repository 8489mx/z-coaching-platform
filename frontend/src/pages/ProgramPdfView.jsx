import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArabicExerciseName } from '../utils/exerciseTranslator';
import { API_BASE } from '../config/api';

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
      if (data.master_program) {
        setProgram(data.master_program);
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const sessions = 
    program?.adapted_training_week?.sessions ||
    program?.training_program?.weeks?.[0]?.sessions || 
    program?.training_program?.mesocycle?.weeks?.[0]?.sessions || 
    [];

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
      foods: [
        { name_ar: "جبن قريش قليل الدسم", portion_g_rounded: 200, serving_display_ar: "200 جرام" },
        { name_ar: "بيض مسلوق كامل", portion_g_rounded: 100, serving_display_ar: "2 بيضة مسلوقة" },
        { name_ar: "شوفان كامل الحبة", portion_g_rounded: 80, serving_display_ar: "80 جرام قبل الطهي" },
        { name_ar: "موز طازج", portion_g_rounded: 120, serving_display_ar: "1 حبة متوسطة" }
      ]
    },
    {
      meal_number: 2,
      meal_label: "الوجبة 2 (الغداء)",
      foods: [
        { name_ar: "صدور دجاج مشوية", portion_g_rounded: 200, serving_display_ar: "200 جرام وزن مطبوخ" },
        { name_ar: "أرز أبيض مطبوخ", portion_g_rounded: 220, serving_display_ar: "كوب ونصف مطبوخ" },
        { name_ar: "سلطة خضراء بزيت زيتون", portion_g_rounded: 150, serving_display_ar: "طبق متوسط + ملعقة زيت" }
      ]
    },
    {
      meal_number: 3,
      meal_label: "الوجبة 3 (العشاء)",
      foods: [
        { name_ar: "بياض بيض مسلوق", portion_g_rounded: 200, serving_display_ar: "5 بياض بيض" },
        { name_ar: "بطاطس مسلوقة بدون قشر", portion_g_rounded: 250, serving_display_ar: "250 جرام مسلوق" },
        { name_ar: "خيار وجزر طازج", portion_g_rounded: 150, serving_display_ar: "طبق خضار طازج" }
      ]
    }
  ];

  const meals = 
    (program?.nutrition_program?.quantized_plan?.meals && program.nutrition_program.quantized_plan.meals.length > 0)
    ? program.nutrition_program.quantized_plan.meals 
    : defaultMeals;

  const cardio = program?.cardio_program;
  const clientName = user?.full_name || "أحمد سمير";
  const clientCode = user?.client_code || targetUserId;
  const coachNotes = program?.coach_notes || "التزم بشرب الماء (3.5 لتر)، والنوم 8 ساعات، وسجل أوزانك الأسبوعية في موعد المتابعة لضمان أفضل نتائج.";

  const getExerciseVideoUrl = (ex) => {
    const query = encodeURIComponent(`${ex.name_ar || getArabicExerciseName(ex.exercise_code)} ${ex.name_en || ex.exercise_code} form technique`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <div className="pdf-view-wrapper py-4" dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#090d16', fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}>
      
      {/* Top Floating Print Controller (Hidden in Print) */}
      <div className="container d-print-none mb-3" style={{ maxWidth: '840px' }}>
        <div 
          className="card border-0 shadow-lg p-3 d-flex flex-row justify-content-between align-items-center rounded-pill" 
          style={{ backgroundColor: '#131b2e', border: '1px solid #1e293b' }}
        >
          <div className="d-flex align-items-center gap-3">
            <Link 
              to={`/user-dashboard?user_id=${targetUserId}`} 
              className="btn btn-sm rounded-pill px-3 fw-semibold text-white d-flex align-items-center gap-1"
              style={{ height: '34px', fontSize: '0.78rem', background: '#261c6a', border: 'none' }}
            >
              <i className="ti ti-arrow-right"></i>
              <span>العودة للبوابة</span>
            </Link>
            <span className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>
              معاينة الخطة المعتمدة — <span className="text-primary">{clientName}</span> ({clientCode})
            </span>
          </div>
          <button 
            type="button"
            onClick={handlePrint}
            className="btn btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
            style={{ height: '36px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', border: 'none' }}
          >
            <i className="ti ti-printer fs-6"></i>
            <span>طباعة / حفظ PDF (صفحتين)</span>
          </button>
        </div>
      </div>

      {/* Print Document Container */}
      <div className="pdf-document mx-auto" style={{ maxWidth: '800px' }}>
        
        {/* ================= PAGE 1: NUTRITION & LIFESTYLE ================= */}
        <div 
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
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: '#f1f5f9' }}>
              <div className="d-flex align-items-center gap-3">
                <img 
                  src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                  alt="Z Coaching" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px' }} 
                />
                <div>
                  <h5 className="fw-black mb-0" style={{ letterSpacing: '0.5px', color: '#261c6a', fontSize: '1.15rem' }}>Z COACHING</h5>
                  <small className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>وثيقة الخطة الغذائية ونمط الحياة المعتمدة</small>
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{clientName}</div>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>كود: <span className="font-monospace fw-bold" style={{ color: '#261c6a' }}>{clientCode}</span> | التاريخ: {new Date().toLocaleDateString('ar-EG')}</small>
              </div>
            </div>

            {/* Daily Macros Target Bar (Quiet Luxury) */}
            <div className="p-3 rounded-4 mb-3 text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #261c6a 0%, #1a134b 100%)' }}>
              <div className="row text-center align-items-center g-0">
                <div className="col">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.68rem' }}>السعرات اليومية</small>
                  <span className="fw-bold" style={{ fontSize: '1.15rem' }}>{calories}</span> <small className="text-white-50" style={{ fontSize: '0.65rem' }}>kcal</small>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.68rem' }}>البروتين</small>
                  <span className="fw-bold" style={{ fontSize: '1.15rem' }}>{protein}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.68rem' }}>الكاربوهيدرات</small>
                  <span className="fw-bold" style={{ fontSize: '1.15rem' }}>{carbs}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.68rem' }}>الدهون الصحية</small>
                  <span className="fw-bold" style={{ fontSize: '1.15rem' }}>{fats}g</span>
                </div>
                <div className="col border-end border-white border-opacity-10">
                  <small className="text-white-50 d-block" style={{ fontSize: '0.68rem' }}>شرب الماء</small>
                  <span className="fw-bold" style={{ fontSize: '1.15rem' }}>3.5L</span>
                </div>
              </div>
            </div>

            {/* Meals Schedule (Clean, Compact, No Repetition) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.86rem' }}>
                <i className="ti ti-salad me-1" style={{ color: '#261c6a' }}></i> جدول الوجبات والبدائل المرنة (Flexible Meal Plan)
              </h6>
              <span className="badge rounded-pill fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.66rem' }}>
                موزونة بدقة
              </span>
            </div>

            <div className="d-flex flex-column gap-2 mb-3">
              {meals.map((meal, mIdx) => (
                <div key={mIdx} className="p-2 px-3 border rounded-3" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold" style={{ fontSize: '0.8rem', color: '#261c6a' }}>
                      {meal.meal_label || `الوجبة ${mIdx + 1} (${mIdx === 0 ? 'الإفطار' : mIdx === 1 ? 'الغداء' : 'العشاء'})`}
                    </span>
                    <small className="text-muted" style={{ fontSize: '0.68rem' }}>موزونة قبل أو بعد الطهي</small>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {meal.foods?.map((food, fIdx) => {
                      const grams = food.portion_g_rounded || food.grams || 100;
                      return (
                        <div key={fIdx} className="bg-white border rounded-pill px-2 py-0 d-flex align-items-center gap-1 shadow-2xs" style={{ fontSize: '0.74rem', borderColor: '#e2e8f0', height: '24px' }}>
                          <span className="fw-semibold text-dark">{food.name_ar || food.name_en || 'صنف'}</span>
                          <span className="badge rounded-pill fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.65rem' }}>
                            {grams} جم
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Supplements Protocol */}
            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.86rem' }}>
                <i className="ti ti-pill me-1" style={{ color: '#261c6a' }}></i> بروتوكول المكملات الغذائية (Supplements Protocol)
              </h6>
            </div>
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div className="p-2 rounded-3 border text-center bg-white" style={{ borderColor: '#e2e8f0' }}>
                  <span className="fw-bold d-block text-dark" style={{ fontSize: '0.78rem' }}>كرياتين مونوهيدرات</span>
                  <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>5 جرام يومياً بعد التمرين</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 border text-center bg-white" style={{ borderColor: '#e2e8f0' }}>
                  <span className="fw-bold d-block text-dark" style={{ fontSize: '0.78rem' }}>واي بروتين (Whey)</span>
                  <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>1 سكوب (30 جم) بعد التمرين</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 border text-center bg-white" style={{ borderColor: '#e2e8f0' }}>
                  <span className="fw-bold d-block text-dark" style={{ fontSize: '0.78rem' }}>أوميجا 3 وفيتامين D3</span>
                  <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>كبسولة واحدة صباحاً مع الإفطار</small>
                </div>
              </div>
            </div>

            {/* Coach Custom Directives (High Contrast Legibility) */}
            <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: '#fbfaff', border: '1px solid #ede9fe', borderRight: '4px solid #261c6a' }}>
              <h6 className="fw-bold mb-1" style={{ color: '#261c6a', fontSize: '0.82rem' }}>
                <i className="ti ti-notes me-1"></i> توجيهات الكابتن للمرحلة الحالية:
              </h6>
              <p className="mb-0 text-dark fw-medium" style={{ lineHeight: '1.5', fontSize: '0.78rem' }}>
                {coachNotes}
              </p>
            </div>
          </div>

          {/* Footer Page 1 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.7rem', borderColor: '#f1f5f9' }}>
            <span>منظومة Z Coaching Master Platform — صفحة 1 من 2</span>
            <span>اعتماد الخطة: كابتن كيمو المحروقي ✓</span>
          </div>
        </div>

        {/* ================= PAGE 2: WORKOUT & CARDIO ================= */}
        <div 
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
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: '#f1f5f9' }}>
              <div className="d-flex align-items-center gap-3">
                <img 
                  src="/admin-dashboard_data/logo/z_dumbbell_flat.jpg" 
                  alt="Z Logo" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px' }} 
                />
                <div>
                  <h5 className="fw-black mb-0" style={{ letterSpacing: '0.5px', color: '#261c6a', fontSize: '1.15rem' }}>Z COACHING</h5>
                  <small className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>الجدول التدريبي المعتمد وروابط تكنيك التمارين</small>
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{clientName}</div>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>الخطة التدريبية المعتمدة | صفحة 2 من 2</small>
              </div>
            </div>

            {/* Workout Sessions Grid (Compact 2-Column) */}
            <div className="row g-2 mb-3">
              {sessions.slice(0, 4).map((sess, sIdx) => (
                <div key={sIdx} className="col-6">
                  <div className="border rounded-3 p-2 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <span className="fw-bold" style={{ fontSize: '0.78rem', color: '#261c6a' }}>
                        {sess.session_name || sess.session_code || `تمرين ${sIdx + 1}`}
                      </span>
                      <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#261c6a', fontSize: '0.64rem' }}>
                        {sess.exercises?.length || 0} تمارين
                      </span>
                    </div>

                    <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '0.72rem' }}>
                      <thead>
                        <tr className="text-muted border-bottom" style={{ fontSize: '0.66rem', borderColor: '#f1f5f9' }}>
                          <th>التمرين (فيديو)</th>
                          <th className="text-center">مجموعات</th>
                          <th className="text-center">عدات</th>
                          <th className="text-center">راحة</th>
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
                            <tr key={exIdx} className="border-bottom" style={{ borderColor: '#f8fafc' }}>
                              <td className="py-1">
                                <a 
                                  href={videoUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                  style={{ color: '#261c6a' }}
                                  title="انقر لمشاهدة فيديو التكنيك العملي"
                                >
                                  <span className="text-truncate" style={{ maxWidth: '110px' }}>{arName}</span>
                                  <i className="ti ti-video text-danger" style={{ fontSize: '0.7rem' }}></i>
                                </a>
                              </td>
                              <td className="text-center py-1 fw-bold text-dark">{sets}</td>
                              <td className="text-center py-1">{minReps === maxReps ? minReps : `${minReps}-${maxReps}`}</td>
                              <td className="text-center py-1 text-muted">{rest}ث</td>
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
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.86rem' }}>
                <i className="ti ti-activity text-danger me-1"></i> نشاط الكارديو ونطاق حرق الدهون (Cardio Zone 2)
              </h6>
            </div>
            <div className="p-2 rounded-3 border mb-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <div className="row g-2 text-center" style={{ fontSize: '0.76rem' }}>
                <div className="col-4">
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>الجلسات الأسبوعية</span>
                  <strong className="text-dark" style={{ fontSize: '0.88rem' }}>{cardio?.schedule?.sessions?.length || 3} جلسات</strong>
                </div>
                <div className="col-4">
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>المدة للجلسة</span>
                  <strong className="text-dark" style={{ fontSize: '0.88rem' }}>{cardio?.schedule?.sessions?.[0]?.duration_minutes || 30} دقيقة</strong>
                </div>
                <div className="col-4">
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>نطاق النبضات المستهدف</span>
                  <strong className="text-danger" style={{ fontSize: '0.88rem' }}>{cardio?.schedule?.sessions?.[0]?.heart_rate_target?.target_range_bpm || '120 - 135 bpm'}</strong>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="p-2 rounded-3 text-muted mb-2 border" style={{ fontSize: '0.7rem', lineHeight: '1.5', background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <strong>تعليمات التنفيذ:</strong> قم بالإحماء العام والموبيلتي لمدة 5 دقائق قبل بدء التمرين. اختر وزناً يتيح لك إتمام العدات مع الحفاظ على 1-2 عدة في الاحتياط (RPE 8-9). اضغط على اسم أي تمرين في هذا الملف لفتح فيديو الأداء الصحيح.
            </div>
          </div>

          {/* Footer Page 2 */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted" style={{ fontSize: '0.7rem', borderColor: '#f1f5f9' }}>
            <span>تم تصميم واعتماد هذه الخطة عبر منصة Z Coaching Master Platform</span>
            <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

      </div>

      {/* Strict 2-Page Print Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .pdf-view-wrapper {
            background: transparent !important;
            padding: 0 !important;
          }
          .pdf-page {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 auto 0 auto !important;
            padding: 10mm !important;
            height: 275mm !important;
            max-height: 275mm !important;
            min-height: 275mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
