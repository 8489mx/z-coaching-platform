import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArabicExerciseName } from '../utils/exerciseTranslator';

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
      const res = await fetch(`http://localhost:3000/api/v1/programs/active/${targetUserId}`);
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
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">جاري تجهيز وثيقة الخطة التدريبية والغذائية...</p>
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
      name: "وجبة الإفطار",
      foods: [
        { name_ar: "بيض مسلوق كامل", portion_g_rounded: 150 },
        { name_ar: "شوفان مطبوخ بالماء", portion_g_rounded: 80 }
      ]
    },
    {
      meal_number: 2,
      name: "وجبة الغداء",
      foods: [
        { name_ar: "صدور دجاج مشوية", portion_g_rounded: 200 },
        { name_ar: "أرز أبيض مطبوخ", portion_g_rounded: 220 },
        { name_ar: "سلطة خضراء بزيت زيتون", portion_g_rounded: 150 }
      ]
    },
    {
      meal_number: 3,
      name: "وجبة العشاء",
      foods: [
        { name_ar: "جبنة قريش", portion_g_rounded: 200 },
        { name_ar: "خبز أسمر / بلدي", portion_g_rounded: 100 }
      ]
    }
  ];

  const meals = 
    (program?.nutrition_program?.quantized_plan?.meals && program.nutrition_program.quantized_plan.meals.length > 0)
      ? program.nutrition_program.quantized_plan.meals 
      : defaultMeals;

  return (
    <div className="bg-light py-4" style={{ minHeight: '100vh', fontFamily: 'Cairo, Tajawal, sans-serif' }} dir="rtl">
      
      {/* Floating Control Bar (Hidden on Print) */}
      <div className="container d-print-none mb-4" style={{ maxWidth: '900px' }}>
        <div className="card border-0 shadow-sm p-3 rounded-4 bg-white d-flex flex-row align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              <i className="ti ti-arrow-right me-1"></i> لوحة التحكم
            </Link>
            <Link to={`/user-dashboard?user_id=${targetUserId}`} className="btn btn-light btn-sm rounded-pill px-3 border">
              واجهة المتدرب
            </Link>
          </div>
          <button 
            onClick={handlePrint}
            className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
          >
            <i className="ti ti-printer me-1"></i> طباعة / حفظ كملف PDF 📄
          </button>
        </div>
      </div>

      {/* PDF Document Container (A4 Formatted) */}
      <div className="container bg-white shadow-sm p-5 rounded-4" style={{ maxWidth: '900px', minHeight: '1100px', border: '1px solid #e2e8f0' }}>
        
        {/* 1. Header & Branding */}
        <div className="d-flex justify-content-between align-items-center pb-4 border-bottom mb-4">
          <div className="d-flex align-items-center gap-3">
            <img src="/admin-dashboard_data/logo/z_coaching_logo.jpg" alt="Z Coaching Logo" width="52" height="52" className="rounded-3 shadow-sm" />
            <div>
              <h4 className="fw-bold text-primary mb-0">Z Coaching</h4>
              <small className="text-muted">المنظومة التدريبية والغذائية المخصصة (Z-Engine V2.0)</small>
            </div>
          </div>
          <div className="text-end">
            <div className="badge bg-primary px-3 py-2 fs-6 rounded-pill">
              كود العميل: {user?.client_code || targetUserId}
            </div>
            <div className="fw-bold text-dark mt-1" style={{ fontSize: '1.1rem' }}>{user?.full_name || 'المتدرب'}</div>
            <small className="text-muted">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
          </div>
        </div>

        {/* 2. Coach Direct Notes (If Available) */}
        {program?.coach_notes && (
          <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#ecfdf5', borderRight: '4px solid #10b981' }}>
            <div className="fw-bold text-success mb-1" style={{ fontSize: '0.95rem' }}>
              <i className="ti ti-crown me-1"></i> توجيهات وملاحظات الكابتن المباشرة:
            </div>
            <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '0.92rem', lineHeight: '1.7' }}>
              {program.coach_notes}
            </p>
          </div>
        )}

        {/* 3. Daily Energy & Target Macros Box */}
        <div className="mb-4">
          <h5 className="fw-bold text-dark mb-3">
            <i className="ti ti-bolt text-primary me-2"></i> 1. أهداف الطاقة والماكروز اليومية
          </h5>
          <div className="row g-3 text-center">
            <div className="col-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">السعرات المستهدفة</div>
                <h4 className="fw-bold text-primary mb-0">{calories}</h4>
                <small className="text-muted">سعرة حرارية</small>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">البروتين</div>
                <h4 className="fw-bold text-danger mb-0">{protein}g</h4>
                <small className="text-muted">جرام يومياً</small>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">الكاربوهيدرات</div>
                <h4 className="fw-bold text-info mb-0">{carbs}g</h4>
                <small className="text-muted">جرام يومياً</small>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 bg-light rounded-3 border">
                <div className="text-muted small mb-1">الدهون الصحية</div>
                <h4 className="fw-bold text-warning mb-0">{fats}g</h4>
                <small className="text-muted">جرام يومياً</small>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Daily Nutrition Plan */}
        <div className="mb-5">
          <h5 className="fw-bold text-dark mb-3">
            <i className="ti ti-salad text-success me-2"></i> 2. خطة الوجبات المكممة
          </h5>
          <div className="row g-3">
            {meals.map((meal, mIdx) => (
              <div className="col-md-4" key={mIdx}>
                <div className="card border h-100 rounded-3 overflow-hidden">
                  <div className="bg-light p-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                    <strong className="text-dark" style={{ fontSize: '0.9rem' }}>
                      {meal.name || `الوجبة ${meal.meal_number || (mIdx + 1)}`}
                    </strong>
                    <span className="badge bg-white text-primary border" style={{ fontSize: '0.75rem' }}>
                      {meal.foods?.length || 0} أصناف
                    </span>
                  </div>
                  <div className="p-3">
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                      {meal.foods?.map((f, fIdx) => (
                        <li key={fIdx} className="d-flex justify-content-between align-items-center small pb-1 border-bottom border-light">
                          <span className="fw-semibold text-dark">{f.name_ar || f.name_en || 'صنف'}</span>
                          <span className="badge bg-light text-primary border fw-bold">
                            {f.portion_g_rounded || f.grams || 100} جم
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Weekly Workout Program */}
        <div className="mb-4">
          <h5 className="fw-bold text-dark mb-3">
            <i className="ti ti-barbell text-primary me-2"></i> 3. جدول تمارين الميزوسايكل الأسبوعي
          </h5>

          {sessions.map((sess, sIdx) => {
            const exList = sess.exercises || [];
            return (
              <div key={sIdx} className="mb-4">
                <div className="p-2 px-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-dark" style={{ fontSize: '0.95rem' }}>
                    🏋️ {sess.session_name || sess.session_code || `جلسة تدريب ${sIdx + 1}`}
                  </strong>
                  <span className="badge bg-primary text-white">
                    {exList.length} تمارين
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '45%' }}>التمرين</th>
                        <th className="text-center" style={{ width: '15%' }}>المجموعات</th>
                        <th className="text-center" style={{ width: '15%' }}>التكرارات</th>
                        <th className="text-center" style={{ width: '15%' }}>الراحة</th>
                        <th className="text-center" style={{ width: '10%' }}>RIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exList.map((ex, exIdx) => {
                        const sets = ex.prescription?.sets || ex.sets || 3;
                        const reps = ex.prescription?.target_min || ex.reps || 10;
                        const rest = ex.prescription?.rest_seconds || ex.rest_seconds || 90;
                        const rir = ex.prescription?.target_rir !== undefined 
                          ? ex.prescription.target_rir 
                          : (ex.rir !== undefined ? ex.rir : 2);

                        return (
                          <tr key={exIdx}>
                            <td>
                              <div className="fw-bold text-dark">{ex.name_en || ex.exercise_code?.replace(/_/g, ' ')}</div>
                              <small className="text-muted">{getArabicExerciseName(ex)}</small>
                            </td>
                            <td className="text-center fw-bold">{sets}</td>
                            <td className="text-center fw-bold">{reps}</td>
                            <td className="text-center text-muted">{rest} ثانية</td>
                            <td className="text-center fw-bold text-primary">{rir}</td>
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

        {/* 6. Supplements Protocol */}
        <div className="mb-4">
          <h5 className="fw-bold text-dark mb-3">
            <i className="ti ti-pill text-primary me-2"></i> 4. بروتوكول المكملات الغذائية والجرعات المعتمدة
          </h5>
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '35%' }}>المكمل الغذائي</th>
                  <th className="text-center" style={{ width: '20%' }}>الجرعة المحددة</th>
                  <th style={{ width: '45%' }}>توقيت الاستخدام وإرشادات الكابتن</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "كرياتين مونوهايدرات (Creatine Monohydrate)", dosage: "5 جرام يومياً", timing: "بعد التمرين مباشرة مع الماء أو الكارب (أو صباحاً بأيام الراحة)" },
                  { name: "واي بروتين (Whey Protein)", dosage: "1 سكوب (30 جم)", timing: "بعد التمرين مباشرة أو بين الوجبات لتعويض البروتين" },
                  { name: "أوميجا 3 (Omega-3 Fish Oil)", dosage: "2 كبسولة (1000mg)", timing: "مع وجبة الإفطار أو الغداء لامتصاص مثالي" },
                  { name: "فيتامين D3 + K2", dosage: "5000 IU", timing: "صباحاً مع وجبة الإفطار لدعم المناعة والهرمونات" },
                  { name: "ماغنيسيوم جلايسينات (Magnesium)", dosage: "350 مجم", timing: "قبل النوم بـ 45 دقيقة لنوم عميق واسترخاء العضلات" }
                ].map((sup, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold text-dark">{sup.name}</td>
                    <td className="text-center fw-bold text-primary">{sup.dosage}</td>
                    <td className="text-muted">{sup.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Footer & Guidelines */}
        <div className="pt-4 border-top text-center text-muted small mt-4">
          <p className="mb-1">💧 اشرب 3 إلى 4 لتر ماء يومياً | 🚶‍♂️ استهدف 8,000 إلى 10,000 خطوة يومياً | 😴 نم 7 إلى 8 ساعات لنوم عميق واستشفاء عضلي ممتاز</p>
          <p className="mb-0 fw-semibold text-primary">تم توليد هذه الخطة المعتمدة بواسطة منظومة Z Coaching V2.0 👑</p>
        </div>

      </div>

      {/* Print Stylesheet Overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
          }
          .d-print-none {
            display: none !important;
          }
          .container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
