import React from 'react';

export default function MealsSection({
 nutrition,
 loading,
 formatArabicFoodSingleLine,
 onOpenSwapModal
}) {
 return (
 <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: "14px" }} id="diet-plan">
 <div className="card-body p-4">
 <div className="d-flex align-items-center justify-content-between mb-3">
 <div>
 <h5 className="fw-bold mb-0 text-dark">
 وجبات اليوم (بوحدات القياس المنزلية المقربة)
 </h5>
 <small className="text-muted">كميات مريحة للمعدة، بدون أرز في الإفطار</small>
 </div>
 <span className="badge bg-success px-3 py-2 rounded-pill">
 3 وجبات متكاملة
 </span>
 </div>

 <div className="d-flex flex-column gap-3 mt-3">
 {loading && !nutrition?.quantized_plan?.meals ? (
 <div className="text-center py-4">
 <div className="spinner-border text-success" role="status"></div>
 <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل...</p>
 </div>
 ) : (
 nutrition?.quantized_plan?.meals?.map((meal, mIdx) => (
 <div key={mIdx} className="p-3 bg-light rounded-3 border">
 <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
 <h6 className="fw-bold mb-0 text-primary">
 {mIdx === 0 ? " الوجبة 1 (الإفطار)" : mIdx === 1 ? " الوجبة 2 (الغداء)" : " الوجبة 3 (العشاء)"}
 </h6>
 <span className="badge bg-primary-subtle text-primary">
 ~{Math.round(meal.totals?.calories_kcal || meal.target?.planned_calories || meal.meal_energy_kcal || 700)} سعرة
 </span>
 </div>

 <div className="d-flex flex-column gap-2">
 {(meal.foods || meal.items)?.map((food, fIdx) => (
 <div key={fIdx} className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border">
 {/* Pure Arabic Name and Grams on a Single Line */}
 <div className="fw-bold text-dark" style={{ fontSize: "0.92rem" }}>
 {formatArabicFoodSingleLine(food)}
 </div>

 <button
 type="button"
 onClick={() => onOpenSwapModal(mIdx, fIdx, food, meal.role)}
 className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1"
 style={{ fontSize: "0.8rem", fontWeight: "bold" }}
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
