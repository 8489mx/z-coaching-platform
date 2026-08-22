import React, { useState } from 'react';
import RecipeModal from '../modals/RecipeModal';

export default function MealsSection({
  nutrition,
  loading,
  formatArabicFoodSingleLine,
  onOpenSwapModal
}) {
  const meals = nutrition?.quantized_plan?.meals || [];
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipeFood, setSelectedRecipeFood] = useState(null);
  const [activeRecipeMealName, setActiveRecipeMealName] = useState('');

  const handleOpenRecipe = (food, mealName) => {
    setSelectedRecipeFood(food);
    setActiveRecipeMealName(mealName);
    setRecipeModalOpen(true);
  };

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
                جدول الوجبات اليومية والبدائل ووصفات التحضير (Daily Culinary Meals & Recipes)
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>وجبات موزونة بالجرامات والمكاييل المنزلية مع بطاقات الوصفات وسر الشيف للتسوية الصحية</small>
            </div>
          </div>

          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#059669', border: 'none', fontSize: '0.74rem', boxShadow: '0 1px 3px rgba(16,185,129,0.08)' }}>
            وجبات تفاعلية متكاملة
          </span>
        </div>

        {/* 3 Vertical Meal Cards Side-by-Side (col-md-4 each) */}
        {loading && !nutrition?.quantized_plan?.meals ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2 small">جاري تحميل الوجبات والبدائل والوصفات...</p>
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
              const currentMealName = meal.meal_name_ar || mealTitle;

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
                      borderTop: `3px solid ${mIdx === 0 ? '#f59e0b' : mIdx === 1 ? '#10b981' : '#0284C7'}`,
                      background: 'rgba(255,255,255,0.75)'
                    }}>
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: mIdx === 0 ? '#d97706' : mIdx === 1 ? '#059669' : '#0284C7', fontSize: '0.92rem' }}>
                          {currentMealName}
                        </h6>
                        <small className="text-muted d-block mt-0" style={{ fontSize: '0.72rem' }}>
                          {meal.recipe_title_ar ? meal.recipe_title_ar.split('(')[0].trim() : 'موزونة بمكاييل المطبخ اليومية'}
                        </small>
                      </div>
                      <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ 
                        background: mIdx === 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : mIdx === 1 ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #E5F0FF, #F0F9FF)', 
                        color: mIdx === 0 ? '#d97706' : mIdx === 1 ? '#059669' : '#0284C7', 
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
                          className="bg-white p-2 px-3 rounded-3 border transition-all" 
                          style={{ borderColor: '#f1f5f9' }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="flex-grow-1">
                              <div 
                                className="fw-bold text-dark cursor-pointer d-flex align-items-center gap-1"
                                style={{ fontSize: "0.84rem" }}
                                onClick={() => handleOpenRecipe(food, currentMealName)}
                                title="اضغط لعرض طريقة التحضير وسر الشيف"
                              >
                                <span>{food.name_ar || food.name_en || 'صنف غذائي'}</span>
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: "0.74rem", lineHeight: '1.3' }}>
                                {food.household_measurement || (formatArabicFoodSingleLine ? formatArabicFoodSingleLine(food) : `${food.portion_g || 100} جم`)}
                              </div>
                              {food.protein_g !== undefined && (
                                <div className="d-flex gap-2 mt-1" style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                  <span className="badge bg-light text-dark py-0 px-1 border">{food.protein_g} جم بروتين</span>
                                  <span className="badge bg-light text-dark py-0 px-1 border">{food.carb_g} جم كارب</span>
                                  <span className="badge bg-light text-dark py-0 px-1 border">{food.fat_g} جم دهون</span>
                                </div>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0 mt-1">
                              {/* Recipe Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenRecipe(food, currentMealName)}
                                className="btn btn-sm rounded-pill px-2 py-0 fw-semibold shadow-xs d-flex align-items-center gap-1"
                                style={{ 
                                  fontSize: "0.70rem", 
                                  background: "#fffbeb", 
                                  color: "#d97706", 
                                  border: "1px solid #fde68a", 
                                  height: '26px' 
                                }}
                                title="عرض طريقة التحضير والبهارات الحرة وسر الشيف"
                              >
                                <i className="ti ti-chef-hat"></i>
                                <span>الوصفة</span>
                              </button>

                              {/* Swap Button */}
                              <button
                                type="button"
                                onClick={() => onOpenSwapModal && onOpenSwapModal(mIdx, fIdx, food, meal.role)}
                                className="btn btn-sm rounded-pill px-2 py-0 fw-semibold shadow-xs d-flex align-items-center gap-1"
                                style={{ 
                                  fontSize: "0.70rem", 
                                  background: "#E5F0FF", 
                                  color: "#0284C7", 
                                  border: "1px solid #BAE6FD", 
                                  height: '26px' 
                                }}
                                title="تبديل الصنف ببديل مكافئ بنفس الماكروز"
                              >
                                <i className="ti ti-arrows-exchange"></i>
                                <span>تبديل</span>
                              </button>
                            </div>
                          </div>
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

      {/* Interactive Recipe Modal */}
      <RecipeModal 
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        foodItem={selectedRecipeFood}
        mealName={activeRecipeMealName}
      />
    </div>
  );
}
