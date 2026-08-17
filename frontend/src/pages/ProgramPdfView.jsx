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
      <div className="d-flex align-items-center justify-content-center min-vh-100" dir="rtl">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2 small">جاري إعداد وثيقة الـ PDF المضغوطة المعتمدة...</p>
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
        { name_ar: "بيض مسلوق كامل", portion_g_rounded: 150, serving_display_ar: "3 بيضات كاملة" },
        { name_ar: "شوفان مطبوخ", portion_g_rounded: 80, serving_display_ar: "80 جرام قبل الطهي" }
      ]
    },
    {
      meal_number: 2,
      meal_label: "الوجبة 2 (الغداء)",
      foods: [
        { name_ar: "صدور دجاج مشوية", portion_g_rounded: 200, serving_display_ar: "200 جرام وزن مطبوخ" },
        { name_ar: "أرز أبيض مطبوخ", portion_g_rounded: 220, serving_display_ar: "كوب ونصف مطبوخ" },
        { name_ar: "سلطة خضراء مع زيت زيتون", portion_g_rounded: 150, serving_display_ar: "طبق متوسط + ملعقة زيت" }
      ]
    },
    {
      meal_number: 3,
      meal_label: "الوجبة 3 (العشاء)",
      foods: [
        { name_ar: "جبنة قريش", portion_g_rounded: 200, serving_display_ar: "قطعة كبيرة 200 جرام" },
        { name_ar: "خبز بلدي / أسمر", portion_g_rounded: 100, serving_display_ar: "رغيف بلدي متوسط" }
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
  const coachNotes = program?.coach_notes || "التزم بشرب الماء، والنوم 8 ساعات، وسجل أوزان التمارين أسبوعياً لتفعيل التكيف الذكي.";

  // Helper to build YouTube search link for any exercise
  const getExerciseVideoUrl = (ex) => {
    const query = encodeURIComponent(`${ex.name_ar || getArabicExerciseName(ex.exercise_code)} ${ex.name_en || ex.exercise_code} form technique`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <div className="pdf-view-wrapper bg-secondary bg-opacity-10 py-4" dir="rtl" style={{ minHeight: '100vh', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      
      {/* Top Floating Print Controller (Hidden in Print) */}
      <div className="container d-print-none mb-3" style={{ maxWidth: '850px' }}>
        <div className="card border-0 shadow-sm p-3 bg-white d-flex flex-row justify-content-between align-items-center rounded-4">
          <div className="d-flex align-items-center gap-2">
            <Link to={`/coach/editor?user_id=${targetUserId}`} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              <i className="ti ti-arrow-right me-1"></i> العودة للمحرر
            </Link>
            <span className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
              معاينة الخطة المعتمدة — {clientName} ({clientCode})
            </span>
          </div>
          <button 
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', border: 'none' }}
          >
            <i className="ti ti-printer me-1"></i> طباعة / حفظ PDF صفحتين
          </button>
        </div>
      </div>

      {/* Print Document Container */}
      <div className="pdf-document mx-auto" style={{ maxWidth: '820px' }}>
        
        {/* ================= PAGE 1: NUTRITION & LIFESTYLE ================= */}
        <div className="pdf-page bg-white p-4 mb-4 shadow-sm rounded-4 position-relative" style={{ minHeight: '1100px' }}>
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              <img src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" alt="Z Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              <div>
                <h4 className="fw-black mb-0 text-dark" style={{ letterSpacing: '1px' }}>Z COACHING</h4>
                <small className="text-muted fw-semibold" style={{ fontSize: '0.74rem' }}>وثيقة الخطة الغذائية ونمط الحياة المعتمدة</small>
              </div>
            </div>
            <div className="text-end">
              <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{clientName}</div>
              <small className="text-muted">كود: <span className="font-monospace fw-bold text-primary">{clientCode}</span> | التاريخ: {new Date().toLocaleDateString('ar-EG')}</small>
            </div>
          </div>

          {/* Daily Macros Target Bar */}
          <div className="p-3 rounded-4 mb-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center text-center">
              <div>
                <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>السعرات اليومية</small>
                <span className="fw-bold fs-5 text-warning">{calories}</span> <small className="text-white-50">kcal</small>
              </div>
              <div className="border-end border-secondary border-opacity-50 ps-3"></div>
              <div>
                <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>البروتين</small>
                <span className="fw-bold fs-5 text-info">{protein}</span> <small className="text-white-50">جم</small>
              </div>
              <div className="border-end border-secondary border-opacity-50 ps-3"></div>
              <div>
                <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>الكاربوهيدرات</small>
                <span className="fw-bold fs-5 text-success">{carbs}</span> <small className="text-white-50">جم</small>
              </div>
              <div className="border-end border-secondary border-opacity-50 ps-3"></div>
              <div>
                <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>الدهون الصحية</small>
                <span className="fw-bold fs-5 text-danger">{fats}</span> <small className="text-white-50">جم</small>
              </div>
              <div className="border-end border-secondary border-opacity-50 ps-3"></div>
              <div>
                <small className="text-white-50 d-block" style={{ fontSize: '0.75rem' }}>الماء اليومي</small>
                <span className="fw-bold fs-5 text-primary">3.5</span> <small className="text-white-50">لتر</small>
              </div>
            </div>
          </div>

          {/* Meals Schedule Table */}
          <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom" style={{ fontSize: '0.92rem' }}>
            <i className="ti ti-salad text-success me-1"></i> جدول الوجبات والبدائل المرنة (Flexible Meal Plan)
          </h6>

          <div className="row g-2 mb-3">
            {meals.map((meal, mIdx) => (
              <div key={mIdx} className="col-12">
                <div className="p-2 border rounded-3 bg-light bg-opacity-50">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-primary px-2 py-1" style={{ fontSize: '0.75rem' }}>
                      {meal.meal_label || `الوجبة ${mIdx + 1}`}
                    </span>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>موزونة قبل أو بعد الطهي حسب الصنف</small>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {meal.foods?.map((food, fIdx) => (
                      <div key={fIdx} className="bg-white border rounded px-2 py-1 small d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                        <span className="fw-semibold text-dark">{food.name_ar || food.food_code}</span>
                        <span className="badge bg-light text-muted border">{food.serving_display_ar || `${food.portion_g_rounded || food.grams || 100} جرام`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Supplements Protocol */}
          <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom" style={{ fontSize: '0.92rem' }}>
            <i className="ti ti-pill text-primary me-1"></i> بروتوكول المكملات الغذائية (Supplements Protocol)
          </h6>
          <div className="row g-2 mb-3">
            <div className="col-4">
              <div className="p-2 bg-light rounded-3 border text-center">
                <span className="fw-bold d-block text-dark small">كرياتين مونوهيدرات</span>
                <small className="text-muted" style={{ fontSize: '0.74rem' }}>5 جرام يومياً بعد التمرين مع ماء كافي</small>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 bg-light rounded-3 border text-center">
                <span className="fw-bold d-block text-dark small">واي بروتين (Whey)</span>
                <small className="text-muted" style={{ fontSize: '0.74rem' }}>سكوب واحد (30 جم) عند الحاجة بعد التمرين</small>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 bg-light rounded-3 border text-center">
                <span className="fw-bold d-block text-dark small">أوميجا 3 وفيتامين D3</span>
                <small className="text-muted" style={{ fontSize: '0.74rem' }}>كبسولة واحدة صباحاً مع وجبة الإفطار</small>
              </div>
            </div>
          </div>

          {/* Coach Custom Directives */}
          <div className="p-3 bg-primary bg-opacity-10 border border-primary-subtle rounded-3 mb-2">
            <h6 className="fw-bold text-primary mb-1" style={{ fontSize: '0.85rem' }}>
              <i className="ti ti-notes me-1"></i> توجيهات الكابتن للمرحلة الأولى:
            </h6>
            <p className="mb-0 text-dark small" style={{ lineHeight: '1.6', fontSize: '0.82rem' }}>
              {coachNotes}
            </p>
          </div>

          {/* Footer Page 1 */}
          <div className="d-flex justify-content-between align-items-center pt-2 mt-auto border-top text-muted" style={{ fontSize: '0.72rem' }}>
            <span>منظومة Z Coaching V2.0 — صفحة 1 من 2</span>
            <span>اعتماد الكابتن: كيمو المحروقي</span>
          </div>
        </div>

        {/* ================= PAGE 2: WORKOUT & CARDIO ================= */}
        <div className="pdf-page bg-white p-4 mb-4 shadow-sm rounded-4 position-relative" style={{ minHeight: '1100px' }}>
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              <img src="/admin-dashboard_data/logo/z_clean_symbol.jpg?v=2" alt="Z Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              <div>
                <h4 className="fw-black mb-0 text-dark" style={{ letterSpacing: '1px' }}>Z COACHING</h4>
                <small className="text-muted fw-semibold" style={{ fontSize: '0.74rem' }}>وثيقة الخطة التدريبية والكارديو (اضغط على اسم التمرين لمشاهدة فيديو التكنيك)</small>
              </div>
            </div>
            <div className="text-end">
              <div className="fw-bold text-dark" style={{ fontSize: '0.94rem' }}>{clientName}</div>
              <small className="text-muted">الجدول التدريبي المعتمد | صفحة 2 من 2</small>
            </div>
          </div>

          {/* Workout Sessions */}
          <div className="row g-2 mb-3">
            {sessions.map((sess, sIdx) => (
              <div key={sIdx} className="col-md-6 col-12">
                <div className="card border rounded-3 p-2 h-100 bg-light bg-opacity-25">
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                    <span className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                      {sess.day_label || `اليوم ${sIdx + 1}`}: {sess.session_code}
                    </span>
                    <span className="badge bg-secondary-subtle text-dark" style={{ fontSize: '0.7rem' }}>
                      {sess.exercises?.length || 0} تمارين
                    </span>
                  </div>

                  <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '0.76rem' }}>
                    <thead>
                      <tr className="text-muted border-bottom" style={{ fontSize: '0.7rem' }}>
                        <th>التمرين (رابط الفيديو)</th>
                        <th className="text-center">المجموعات</th>
                        <th className="text-center">العدات</th>
                        <th className="text-center">الراحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sess.exercises?.map((ex, exIdx) => {
                        const arName = ex.name_ar || getArabicExerciseName(ex.exercise_code);
                        const videoUrl = getExerciseVideoUrl(ex);
                        const sets = ex.prescription?.sets || 3;
                        const minReps = ex.prescription?.target_min || 8;
                        const maxReps = ex.prescription?.target_max || 12;
                        const rest = ex.prescription?.rest_seconds || 90;

                        return (
                          <tr key={exIdx} className="border-bottom border-light">
                            <td className="py-1">
                              <a 
                                href={videoUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-primary fw-bold text-decoration-none d-inline-flex align-items-center gap-1"
                                title="اضغط لمشاهدة فيديو التكنيك والأداء الصحيح على يوتيوب"
                              >
                                <span>{arName}</span>
                                <i className="ti ti-video text-danger" style={{ fontSize: '0.75rem' }}></i>
                              </a>
                            </td>
                            <td className="text-center py-1 fw-bold">{sets}</td>
                            <td className="text-center py-1">{minReps}-{maxReps}</td>
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
          <h6 className="fw-bold text-dark mb-2 pb-1 border-bottom" style={{ fontSize: '0.92rem' }}>
            <i className="ti ti-activity text-danger me-1"></i> نشاط الكارديو ونطاق حرق الدهون (Cardio Zone 2)
          </h6>
          <div className="p-3 bg-light rounded-3 border mb-3">
            <div className="row g-2 text-center" style={{ fontSize: '0.8rem' }}>
              <div className="col-4">
                <span className="text-muted d-block small">الجلسات الأسبوعية</span>
                <strong className="text-dark fs-6">{cardio?.schedule?.sessions?.length || 2} جلسات</strong>
              </div>
              <div className="col-4">
                <span className="text-muted d-block small">المدة للجلسة</span>
                <strong className="text-dark fs-6">{cardio?.schedule?.sessions?.[0]?.duration_minutes || 30} دقيقة</strong>
              </div>
              <div className="col-4">
                <span className="text-muted d-block small">نطاق النبضات المستهدف</span>
                <strong className="text-danger fs-6">{cardio?.schedule?.sessions?.[0]?.heart_rate_target?.target_range_bpm || '120 - 135 bpm'}</strong>
              </div>
            </div>
          </div>

          {/* Guidelines and Disclaimer */}
          <div className="p-2 bg-light rounded-3 text-muted mb-3" style={{ fontSize: '0.72rem', lineHeight: '1.6' }}>
            <strong>تعليمات تنفيذ التمارين:</strong> قم بالإحماء العام والموبيلتي لمدة 5 دقائق قبل بدء التمرين. اختر وزناً يتيح لك الوصول للعدات المستهدفة مع بقاء عدة أو عدتين في الاحتياط (RPE 8-9). اضغط على اسم أي تمرين في هذا الملف لفتح فيديو الأداء الصحيح.
          </div>

          {/* Footer Page 2 */}
          <div className="d-flex justify-content-between align-items-center pt-2 mt-auto border-top text-muted" style={{ fontSize: '0.72rem' }}>
            <span>تم تصميم واعتماد هذه الخطة عبر منصة Z Coaching V2.0</span>
            <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </div>

      </div>

      {/* Print-specific style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
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
            border-radius: 0 !important;
            page-break-after: always !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            min-height: 275mm !important;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
