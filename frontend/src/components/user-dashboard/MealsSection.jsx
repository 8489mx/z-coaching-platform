import React from 'react';

export default function MealsSection({
  nutrition,
  loading,
  formatArabicFoodSingleLine,
  onOpenSwapModal
}) {
  return (
    <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "16px", border: "1px solid #e2e8f0" }} id="diet-plan">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              وجبات اليوم (بوحدات القياس المنزلية المقربة)
            </h5>
            <small className="text-muted">كميات مريحة للمعدة، بدون أرز في الإفطار</small>
          </div>
          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', fontSize: '0.78rem' }}>
            3 وجبات متكاملة
          </span>
        </div>

        <div className="d-flex flex-column gap-3 mt-3">
          {loading && !nutrition?.quantized_plan?.meals ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل...</p>
            </div>
          ) : (
            nutrition?.quantized_plan?.meals?.map((meal, mIdx) => (
              <div key={mIdx} className="p-3 rounded-3 border" style={{ background: '#fbfaff', borderColor: '#ede9fe' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom" style={{ borderColor: '#ede9fe' }}>
                  <h6 className="fw-bold mb-0" style={{ color: '#261c6a', fontSize: '0.9rem' }}>
                    {mIdx === 0 ? " الوجبة 1 (الإفطار)" : mIdx === 1 ? " الوجبة 2 (الغداء)" : " الوجبة 3 (العشاء)"}
                  </h6>
                  <span className="badge rounded-pill px-2 py-1 font-monospace" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>
                    ~{Math.round(meal.totals?.calories_kcal || meal.target?.planned_calories || meal.meal_energy_kcal || 700)} سعرة
                  </span>
                </div>

                <div className="d-flex flex-column gap-2">
                  {(meal.foods || meal.items)?.map((food, fIdx) => (
                    <div key={fIdx} className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                      {/* Pure Arabic Name and Grams on a Single Line */}
                      <div className="fw-bold text-dark" style={{ fontSize: "0.88rem" }}>
                        {formatArabicFoodSingleLine(food)}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenSwapModal(mIdx, fIdx, food, meal.role)}
                        className="btn btn-sm rounded-pill px-3 py-1 fw-semibold shadow-xs"
                        style={{ fontSize: "0.78rem", background: "#f5f3ff", color: "#261c6a", border: "1px solid #ddd6fe" }}
                      >
                        <i className="ti ti-refresh me-1"></i> تبديل
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
