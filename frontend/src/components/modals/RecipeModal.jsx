import React, { useEffect } from 'react';

export default function RecipeModal({
  isOpen,
  onClose,
  foodItem,
  mealName
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !foodItem) return null;

  const recipe = foodItem.recipe_details || foodItem.recipe || null;
  const foodName = foodItem.name_ar || foodItem.name_en || 'الصنف الغذائي';
  const portionDesc = foodItem.household_measurement || `${foodItem.portion_g || foodItem.grams || 100} جم`;
  const calories = Math.round(foodItem.calories_kcal || 0);
  const protein = foodItem.protein_g !== undefined ? foodItem.protein_g : '--';
  const carbs = foodItem.carb_g !== undefined ? foodItem.carb_g : '--';
  const fat = foodItem.fat_g !== undefined ? foodItem.fat_g : '--';

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1070,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '580px' }}>
        <div
          className="modal-content border-0 shadow-2xl overflow-hidden"
          style={{
            borderRadius: '24px',
            background: '#ffffff',
            boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.3), 0 0 35px rgba(38, 28, 106, 0.1)',
          }}
          dir="rtl"
        >
          {/* Header */}
          <div
            className="p-4 d-flex justify-content-between align-items-center position-relative"
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #3b2d82 60%, #0369A1 100%)',
              color: '#ffffff',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '46px',
                  height: '46px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fef08a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <i className="ti ti-chef-hat fs-3"></i>
              </div>
              <div>
                <span className="badge rounded-pill px-2 py-0 mb-1 fw-bold" style={{ background: 'rgba(255,255,255,0.2)', fontSize: '0.68rem', color: '#ffffff' }}>
                  {mealName || 'وصفة المطبخ الصحي'}
                </span>
                <h5 className="fw-bold mb-0 text-white" style={{ fontSize: '1.12rem', letterSpacing: '-0.2px' }}>
                  {recipe?.title_ar || `طريقة تحضير: ${foodName}`}
                </h5>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all"
              style={{
                width: '34px',
                height: '34px',
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
              }}
              title="إغلاق"
            >
              <i className="ti ti-x fs-6"></i>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className="px-4 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
            style={{
              background: '#faf8ff',
              borderBottom: '1px solid #F0F9FF',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-clock text-primary" style={{ fontSize: '1rem' }}></i>
              <span className="fw-semibold text-dark small" style={{ fontSize: '0.78rem' }}>
                وقت التحضير: <strong>{recipe?.prep_time_ar || recipe?.prep_time || '3 إلى 5 دقائق'}</strong>
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#E5F0FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '0.72rem' }}>
                {portionDesc}
              </span>
              {calories > 0 && (
                <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.72rem' }}>
                  {calories} سعرة (P:{protein}g, C:{carbs}g, F:{fat}g)
                </span>
              )}
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="p-4 bg-white" style={{ maxHeight: 'calc(80vh - 160px)', overflowY: 'auto' }}>
            {/* Section 1: Ingredients & Zero-Calorie Seasoning */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '24px', height: '24px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                >
                  <i className="ti ti-clipboard-list" style={{ fontSize: '0.75rem' }}></i>
                </div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>
                  المكونات والبهارات المجانية المسموحة (Zero-Calorie Seasoning):
                </h6>
              </div>

              <div
                className="p-3 rounded-3"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid #e2e8f0',
                }}
              >
                {recipe?.ingredients_breakdown && recipe.ingredients_breakdown.length > 0 ? (
                  <ul className="m-0 p-0 list-unstyled d-flex flex-column gap-2">
                    {recipe.ingredients_breakdown.map((ing, idx) => (
                      <li key={idx} className="d-flex align-items-start gap-2 small">
                        <i className="ti ti-check text-success mt-1 flex-shrink-0" style={{ fontSize: '0.85rem' }}></i>
                        <div>
                          <strong className="text-dark">{ing.name_ar}:</strong>{' '}
                          <span className="text-muted">{ing.portion_desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="m-0 p-0 list-unstyled d-flex flex-column gap-2">
                    <li className="d-flex align-items-start gap-2 small">
                      <i className="ti ti-check text-success mt-1 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark">المكون الأساسي الموزون:</strong> {portionDesc}
                      </div>
                    </li>
                    <li className="d-flex align-items-start gap-2 small">
                      <i className="ti ti-check text-success mt-1 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark">التوابل والبهارات الحرة (بدون سعرات):</strong> رشة كمون، فلفل أسود، بابريكا مدخنة، زعتر، كزبرة، بودرة ثوم، ورشة ملح خفيف.
                      </div>
                    </li>
                    <li className="d-flex align-items-start gap-2 small">
                      <i className="ti ti-check text-success mt-1 flex-shrink-0"></i>
                      <div>
                        <strong className="text-dark">الدهون المخصصة:</strong> استخدام حصة زيت الزيتون المقررة في الوجبة للطهي أو التتبيل دون أي دهون إضافية.
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            {/* Section 2: Step-by-Step Quick Prep */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '24px', height: '24px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                >
                  <i className="ti ti-flame" style={{ fontSize: '0.75rem' }}></i>
                </div>
                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>
                  طريقة التحضير السريعة خطوة بخطوة (3-Step Quick Prep):
                </h6>
              </div>

              <div className="d-flex flex-column gap-2">
                {recipe?.cooking_instructions && recipe.cooking_instructions.length > 0 ? (
                  recipe.cooking_instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-3 d-flex align-items-start gap-3"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                        style={{
                          width: '26px',
                          height: '26px',
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="text-dark small lh-base" style={{ fontSize: '0.82rem' }}>
                        {step}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-3 bg-light border text-muted small">
                    قم بتسوية الصنف بالبهارات المسموحة واستخدم حصة زيت الزيتون المقررة في الوجبة دون أي زيوت مهدرجة أو سكريات مضافة.
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Chef's Pro-Tip */}
            {recipe?.cooking_tip && (
              <div
                className="p-3 rounded-3 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fde68a',
                  borderRight: '4px solid #f59e0b',
                }}
              >
                <div className="d-flex align-items-start gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-0"
                    style={{ width: '24px', height: '24px', background: '#f59e0b', color: '#ffffff' }}
                  >
                    <i className="ti ti-bulb" style={{ fontSize: '0.78rem' }}></i>
                  </div>
                  <div>
                    <strong className="text-dark d-block mb-1" style={{ fontSize: '0.84rem' }}>
                      سر الشيف للتسوية الصحية (Chef's Hack):
                    </strong>
                    <p className="mb-0 text-dark small lh-base" style={{ fontSize: '0.80rem' }}>
                      {recipe.cooking_tip}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
            <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              <i className="ti ti-shield-check text-success"></i>
              تلتزم هذه الوصفة بدقة بعجز السعرات والماكروز المحسوبة في خطتك.
            </small>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm px-4 rounded-pill fw-bold"
              style={{
                background: '#0284C7',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.8rem',
                boxShadow: '0 2px 8px rgba(38, 28, 106, 0.25)',
              }}
            >
              تم الفهم والتطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
