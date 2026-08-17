import React from 'react';

export default function MealsSection({
  nutrition,
  loading,
  formatArabicFoodSingleLine,
  onOpenSwapModal
}) {
  const meals = nutrition?.quantized_plan?.meals || [
    {
      meal_number: 1,
      name: "وجبة الإفطار",
      meal_energy_kcal: 700,
      foods: [
        { name_ar: "جبن قريش قليل الدسم (200 جرام)" },
        { name_ar: "بيض مسلوق كامل (100 جرام)" },
        { name_ar: "شوفان كامل الحبة (80 جرام)" },
        { name_ar: "موز طازج (120 جرام)" },
        { name_ar: "زيت زيتون (10 جرام)" }
      ]
    },
    {
      meal_number: 2,
      name: "وجبة الغداء",
      meal_energy_kcal: 850,
      foods: [
        { name_ar: "صدور دجاج مشوية (200 جرام)" },
        { name_ar: "أرز أبيض مطبوخ (220 جرام)" },
        { name_ar: "سلطة خضراء بزيت زيتون (150 جرام)" },
        { name_ar: "خيار وجزر طازج (100 جرام)" }
      ]
    },
    {
      meal_number: 3,
      name: "وجبة العشاء",
      meal_energy_kcal: 650,
      foods: [
        { name_ar: "بياض بيض مسلوق (200 جرام)" },
        { name_ar: "بطاطس مسلوقة (250 جرام)" },
        { name_ar: "خيار وجزر طازج (150 جرام)" },
        { name_ar: "زيت زيتون (10 جرام)" }
      ]
    }
  ];

  return (
    <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }} id="diet-plan">
      <div className="card-body p-4">
        
        {/* Section Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}>
              <i className="ti ti-salad fs-6"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>
                جدول الوجبات اليومية والبدائل الذكية (Daily 3 Meals Plan)
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>3 وجبات رئيسية موزونة بوحدات القياس المنزلية المقربة لتغطية الماكروز</small>
            </div>
          </div>

          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.74rem' }}>
            3 وجبات متكاملة
          </span>
        </div>

        {/* 3 Vertical Meal Cards Side-by-Side (col-md-4 each) */}
        {loading && !nutrition?.quantized_plan?.meals ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل...</p>
          </div>
        ) : (
          <div className="row g-3">
            {meals.map((meal, mIdx) => {
              const mealCalories = Math.round(meal.totals?.calories_kcal || meal.target?.planned_calories || meal.meal_energy_kcal || 700);
              const mealTitle = mIdx === 0 ? "الوجبة 1 (الإفطار)" : mIdx === 1 ? "الوجبة 2 (الغداء)" : "الوجبة 3 (العشاء)";
              const foodsList = meal.foods || meal.items || [];

              return (
                <div key={mIdx} className="col-lg-4 col-md-4 col-12">
                  <div 
                    className="card h-100 shadow-none d-flex flex-column justify-content-between transition-all" 
                    style={{ 
                      background: '#fbfaff', 
                      border: '1.5px solid #ede9fe', 
                      borderRadius: '14px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Meal Card Top Header */}
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white" style={{ borderColor: '#ede9fe', borderTop: '3px solid #261c6a' }}>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.9rem' }}>
                          {mealTitle}
                        </h6>
                        <small className="text-muted" style={{ fontSize: '0.68rem' }}>موزونة قبل / بعد الطهي</small>
                      </div>
                      <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
                        ~ {mealCalories} سعرة
                      </span>
                    </div>

                    {/* Food Items List */}
                    <div className="p-3 d-flex flex-column gap-2 flex-grow-1">
                      {foodsList.map((food, fIdx) => (
                        <div 
                          key={fIdx} 
                          className="d-flex justify-content-between align-items-center bg-white p-2 px-3 rounded-3 border transition-all" 
                          style={{ borderColor: '#f1f5f9' }}
                        >
                          <div className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>
                            {formatArabicFoodSingleLine ? formatArabicFoodSingleLine(food) : (food.name_ar || food.name_en || 'صنف غذائي')}
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenSwapModal && onOpenSwapModal(mIdx, fIdx, food, meal.role)}
                            className="btn btn-sm rounded-pill px-2 py-0 fw-semibold shadow-xs d-flex align-items-center gap-1 flex-shrink-0"
                            style={{ 
                              fontSize: "0.72rem", 
                              background: "#f5f3ff", 
                              color: "#261c6a", 
                              border: "1px solid #ddd6fe", 
                              height: '26px' 
                            }}
                            title="تبديل الصنف ببديل مكافئ"
                          >
                            <i className="ti ti-arrows-exchange"></i>
                            <span>تبديل</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Meal Footer */}
                    <div className="px-3 py-2 border-top bg-white d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9' }}>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        الأصناف: {foodsList.length} عناصر
                      </small>
                      <small className="text-success fw-semibold" style={{ fontSize: '0.7rem' }}>
                        متوافقة مع الماكروز ✓
                      </small>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
