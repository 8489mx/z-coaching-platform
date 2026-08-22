import React from 'react';

export default function Step6Review({
  formData = {},
  submitting,
  onSubmit,
  readOnly = false
}) {
  if (readOnly) {
    const personal = formData.personal || {};
    const body = formData.body || {};
    const nutrition = formData.nutrition || {};
    const training = formData.training || {};
    const medical = formData.medical || {};

    return (
      <div className="py-2" dir="rtl">
        <div className="row g-3">
          {/* Personal & Goals */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100 bg-white rounded-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="ti ti-user text-primary fs-5"></i>
                البيانات الشخصية
              </h6>
              <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                <li><strong className="text-dark">الاسم:</strong> {personal.firstName} {personal.lastName}</li>
                <li><strong className="text-dark">السن:</strong> {personal.age || 25} سنة ({personal.sex === 'FEMALE' ? 'أنثى' : 'ذكر'})</li>
                <li><strong className="text-dark">رقم الهاتف:</strong> {personal.phone || '-'}</li>
                <li><strong className="text-dark">الهدف الأساسي:</strong> {formData.goals?.primary === 'FAT_LOSS' ? 'حرق وخسارة الدهون' : 'بناء وزيادة العضلات'}</li>
              </ul>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100 bg-white rounded-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="ti ti-ruler text-success fs-5"></i>
                القياسات الجسدية
              </h6>
              <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                <li><strong className="text-dark">الطول:</strong> {body.heightCm || 170} سم</li>
                <li><strong className="text-dark">الوزن:</strong> {body.weightKg || 70} كجم</li>
                <li><strong className="text-dark">محيط الخصر:</strong> {body.waistCm ? `${body.waistCm} سم` : '-'}</li>
              </ul>
            </div>
          </div>

          {/* Nutrition Preferences */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100 bg-white rounded-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="ti ti-salad text-warning fs-5"></i>
                النظام الغذائي والممنوعات
              </h6>
              <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                <li><strong className="text-dark">عدد الوجبات:</strong> {nutrition.preferredMealCount || 3} وجبات يومياً</li>
                <li><strong className="text-dark">الممنوعات والحساسيات:</strong> {(nutrition.excludedFoodsList || []).filter(f => f !== 'NONE').join('، ') || 'لا توجد أطعمة مستبعدة'}</li>
                <li><strong className="text-dark">مشاكل الجهاز الهضمي:</strong> {(nutrition.digestiveIssuesList || []).filter(d => d !== 'NONE').join('، ') || 'سليم تماماً'}</li>
              </ul>
            </div>
          </div>

          {/* Training & Injuries */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3 h-100 bg-white rounded-4 border">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="ti ti-barbell text-info fs-5"></i>
                التدريب والإصابات
              </h6>
              <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                <li><strong className="text-dark">مكان التمرين:</strong> {training.location === 'HOME' ? 'المنزل' : 'الجيم'}</li>
                <li><strong className="text-dark">أيام التمرين:</strong> {training.preferredDaysPerWeek || 4} أيام / أسبوع</li>
                <li><strong className="text-dark">الإصابات المسجلة:</strong> {(training.selectedInjuries || []).map(i => (typeof i === 'string' ? i : i.code)).filter(c => c !== 'NONE').join('، ') || 'لا توجد إصابات'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content text-center py-5 px-3">
      <div className="mb-3 text-primary" style={{ fontSize: '4.5rem' }}>
        <i className="ti ti-circle-check"></i>
      </div>
      <h3 className="fw-bold text-dark mb-3" style={{ fontSize: '1.75rem' }}>
        هل أنت جاهز لإرسال استمارتك للكابتن؟
      </h3>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '560px', lineHeight: '1.8', fontSize: '1rem' }}>
        تم حفظ جميع بياناتك وإجاباتك بدقة. سيقوم الكابتن بمراجعة ملفك الصحي والبدني، وتأكيد باقة اشتراكك، وتصميم خطتك التدريبية والغذائية المخصصة لك بالكامل.
      </p>
      
      <button 
        type="button"
        className="btn btn-primary shadow-sm" 
        style={{ 
          padding: '1rem 3.5rem', 
          fontSize: '1.15rem', 
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
          border: 'none',
          fontWeight: '700'
        }} 
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? (
          <><span className="spinner-border spinner-border-sm me-2" role="status"></span> جاري إرسال الاستمارة...</>
        ) : (
          <><i className="ti ti-send me-2"></i> إرسال الاستمارة للكابتن للمراجعة</>
        )}
      </button>
    </div>
  );
}
