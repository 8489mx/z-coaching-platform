import React from 'react';

export default function MealsSection({
  nutrition,
  loading,
  formatArabicFoodSingleLine,
  onOpenSwapModal
}) {
  const meals = nutrition?.quantized_plan?.meals || [];

  return (
    <div className="z-glass-card mb-4 z-animate-in" id="diet-plan">
      <div className="card-body p-4">
        
        {/* Section Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0 z-icon-warmth" style={{ width: '34px', height: '34px', borderRadius: '9px' }}>
              <i className="ti ti-salad fs-6"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>
                جدول الوجبات اليومية والبدائل الذكية (Daily 3 Meals Plan)
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>3 وجبات رئيسية موزونة بوحدات القياس المنزلية المقربة لتغطية الماكروز</small>
            </div>
          </div>

          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', border: 'none', fontSize: '0.74rem', boxShadow: '0 1px 3px rgba(16,185,129,0.08)' }}>
            3 وجبات متكاملة
          </span>
        </div>

        {/* 3 Vertical Meal Cards Side-by-Side (col-md-4 each) */}
        {loading && !nutrition?.quantized_plan?.meals ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل...</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-4 text-muted small bg-light rounded-3 border">
            لا توجد وجبات مسجلة في خطة هذا المتدرب بعد.
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
                    className="card h-100 shadow-none d-flex flex-column justify-content-between" 
                    style={{ 
                      background: 'rgba(251,250,255,0.5)', 
                      border: '1px solid rgba(237,233,254,0.5)', 
                      borderRadius: '14px',
                      overflow: 'hidden',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Meal Card Top Header */}
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ 
                      borderColor: 'rgba(237,233,254,0.5)', 
                      borderTop: `3px solid ${mIdx === 0 ? '#f59e0b' : mIdx === 1 ? '#10b981' : '#261c6a'}`,
                      background: 'rgba(255,255,255,0.6)'
                    }}>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: mIdx === 0 ? '#d97706' : mIdx === 1 ? '#059669' : '#261c6a', fontSize: '0.9rem' }}>
                          {mealTitle}
                        </h6>
                        <small className="text-muted" style={{ fontSize: '0.68rem' }}>موزونة قبل / بعد الطهي</small>
                      </div>
                      <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ 
                        background: mIdx === 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : mIdx === 1 ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
                        color: mIdx === 0 ? '#d97706' : mIdx === 1 ? '#059669' : '#261c6a', 
                        border: 'none', 
                        fontSize: '0.74rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}>
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
