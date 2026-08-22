import React, { useState } from 'react';
import ReactDOM from 'react-dom';

// Helpers to translate codes to human-readable Arabic
const GOALS_MAP = {
  FAT_LOSS: 'حرق وخسارة الدهون',
  MUSCLE_GAIN: 'زيادة الكتلة العضلية (تضخيم)',
  BODY_RECOMPOSITION: 'إعادة تشكيل الجسم (Recomp)',
  WEIGHT_MAINTENANCE: 'تثبيت الوزن الحالي',
  GENERAL_HEALTH: 'لياقة وصحة عامة',
  PERFORMANCE: 'زيادة الأداء الرياضي والقوة'
};

const ACTIVITY_MAP = {
  SEDENTARY: 'خامل (مكتبي / قليل الحركة جداً)',
  LIGHT: 'خفيف (حركة عادية / مشي قليل)',
  MODERATE: 'متوسط (حركة مستمرة أثناء اليوم)',
  HIGH: 'عالي (عمل بدني شاق ومجهد)'
};

const EXPERIENCE_MAP = {
  BEGINNER: 'مبتدئ (أقل من 6 شهور)',
  INTERMEDIATE: 'متوسط (6 شهور إلى سنتين)',
  ADVANCED: 'متقدم (أكثر من سنتين تدريب منتظم)',
  NEVER_TRAINED: 'لم يتدرب من قبل'
};

const EXCLUDED_FOODS_LABELS = {
  EGGS: 'البيض ومشتقاته',
  EGG: 'البيض ومشتقاته',
  DAIRY: 'الحليب ومنتجات الألبان والأجبان',
  MILK: 'الحليب ومنتجات الألبان والأجبان',
  FISH_SEAFOOD: 'الأسماك والمأكولات البحرية',
  FISH: 'الأسماك والمأكولات البحرية',
  SEAFOOD: 'الأسماك والمأكولات البحرية',
  PEANUTS_NUTS: 'الفول السوداني والمكسرات',
  PEANUTS: 'الفول السوداني والمكسرات',
  NUTS: 'المكسرات والفول السوداني',
  WHEAT_GLUTEN: 'القمح والجلوتين (خبز ومعجنات)',
  GLUTEN_WHEAT: 'القمح والجلوتين (خبز ومعجنات)',
  GLUTEN: 'الجلوتين والقمح',
  WHEAT: 'القمح والجلوتين',
  OATS: 'الشوفان',
  OAT: 'الشوفان',
  RED_MEAT: 'اللحوم الحمراء',
  MEAT: 'اللحوم الحمراء',
  BEEF: 'اللحوم الحمراء والبقري',
  LEGUMES: 'البقوليات (فول، عدس، حمص)',
  LEGUME: 'البقوليات (فول، عدس، حمص)',
  EGGPLANT_COOKED_VEG: 'الباذنجان والخضار المطبوخ',
  EGGPLANT: 'الباذنجان والخضار المطبوخ'
};

const DIGESTIVE_LABELS = {
  IBS: 'القولون العصبي (IBS)',
  GERD: 'ارتجاع المريء وحموضة المعدة',
  ACID_REFLUX: 'ارتجاع المريء وحموضة المعدة',
  LACTOSE: 'حساسية وعدم تحمل اللاكتوز',
  NONE: 'لا توجد مشاكل هضمية'
};

const INJURIES_LABELS = {
  LOWER_BACK: 'أسفل الظهر والفقرات القطنية',
  SPINE: 'العمود الفقري والظهر',
  LUMBAR: 'الفقرات القطنية وأسفل الظهر',
  SHOULDER: 'الكتف والمفصل الدوار (Rotator Cuff)',
  ROTATOR_CUFF: 'مفصل الكتف الدوار',
  KNEE: 'الركبة والغضاريف والأربطة',
  NECK: 'الرقبة والفقرات العنقية',
  CERVICAL_SPINE: 'الفقرات العنقية والرقبة',
  ELBOW_WRIST: 'الكوع والرسغ',
  WRIST: 'رسغ اليد والمعصم',
  ELBOW: 'مفصل الكوع',
  NONE: 'لا توجد إصابات سابقة'
};

const FOCUS_MUSCLES_LABELS = {
  CHEST: 'عضلات الصدر',
  BACK: 'عضلات الظهر',
  SHOULDERS: 'الأكتاف',
  SHOULDER: 'الأكتاف',
  ARMS: 'الذراعين (بايسبس وترايسبس)',
  LEGS_GLUTES: 'الأرجل والمؤخرة',
  LEGS: 'عضلات الأرجل',
  GLUTES: 'المؤخرة والأرداف',
  ABS_CORE: 'البطن وعضلات الكور',
  ABS: 'عضلات البطن والكور'
};

const CONDITIONS_LABELS = {
  DIABETES: 'مرض السكري',
  TYPE_2_DIABETES: 'مرض السكري النوع الثاني',
  HYPERTENSION: 'ارتفاع ضغط الدم',
  HEART_CONDITION: 'أمراض القلب والشرايين',
  CARDIOVASCULAR_DISEASE: 'أمراض الأوعية الدموية',
  THYROID_CONDITION: 'اضطرابات الغدة الدرقية',
  ANEMIA: 'الأنيميا وفقر الدم',
  ASTHMA_OR_RESPIRATORY_CONDITION: 'الربو والحساسية التنفسية',
  PCOS: 'تكيس المبايض (PCOS)',
  NONE: 'لا توجد أمراض مزمنة'
};

const DANGEROUS_SYMPTOMS_LABELS = {
  CHEST_PAIN: 'ألم أو ضغط غير معتاد في الصدر',
  FAINTING: 'دوخة شديدة أو إغماء أثناء الجهد',
  SHORTNESS_OF_BREATH: 'ضيق تنفس غير متناسب مع المجهود',
  PALPITATIONS: 'خفقان غير منتظم وتسارع نبضات',
  DOCTOR_RESTRICTION: 'تعليمات طبية صريحة بالامتناع عن بعض الأنشطة',
  NONE: 'سليم تماماً ولا توجد أعراض حرجة'
};

export default function IntakeAuditDetailModal({
  submission,
  onClose,
  onGenerateDraft,
  generatingId
}) {
  const [previewImage, setPreviewImage] = useState(null);

  if (!submission) return null;

  const answers = submission.answers || {};
  const personal = answers.personal || {};
  const goals = answers.goals || {};
  const body = answers.body || {};
  const lifestyle = answers.lifestyle || {};
  const medical = answers.medical || {};
  const nutrition = answers.nutrition || {};
  const training = answers.training || {};
  const cardio = answers.cardio || {};
  const photos = body.photos || {};

  const clientName = submission.user?.full_name || `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'متدرب';
  const clientCode = submission.user?.client_code || '1';
  const clientPhone = submission.user?.phone_number || personal.phone || '';

  // BMI Calculation
  const heightCm = Number(body.heightCm) || 170;
  const heightM = heightCm / 100;
  const weightKg = Number(body.weightKg) || 70;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  // Age & Metabolic Calculation (Mifflin-St Jeor)
  const ageNum = Number(personal.age) || (personal.dateOfBirth ? (new Date().getFullYear() - new Date(personal.dateOfBirth).getFullYear()) : 30);
  const sexIsFemale = personal.sex === 'FEMALE';
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageNum + (sexIsFemale ? -161 : 5));
  const activityMultipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HIGH: 1.725 };
  const tdee = Math.round(bmr * (activityMultipliers[lifestyle.dailyActivity] || 1.375));

  let bmiBadge = { label: 'طبيعي', color: '#10b981', bg: '#ecfdf5' };
  if (bmi < 18.5) bmiBadge = { label: 'نقص وزن', color: '#f59e0b', bg: '#fffbeb' };
  else if (bmi >= 25 && bmi < 30) bmiBadge = { label: 'وزن زائد', color: '#f59e0b', bg: '#fffbeb' };
  else if (bmi >= 30) bmiBadge = { label: 'سمنة', color: '#ef4444', bg: '#fef2f2' };

  const getCode = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      return item.code || item.conditionCode || item.food || item.substance || item.id || item.name || '';
    }
    return String(item);
  };

  // Determine Alert Indicators for Coach Scanning
  const excludedFoodsList = (nutrition.excludedFoodsList || []).map(getCode).filter(f => f && f !== 'NONE');
  const digestiveIssuesList = (nutrition.digestiveIssuesList || []).map(getCode).filter(d => d && d !== 'NONE');
  const selectedInjuriesList = (training.selectedInjuries || []).map(getCode).filter(inj => inj && inj !== 'NONE');
  const medicalConditionsList = (medical.selectedConditions || medical.conditions || []).map(getCode).filter(c => c && c !== 'NONE');
  const dangerousSymptomsList = (medical.dangerousSymptomsList || []).map(getCode).filter(s => s && s !== 'NONE');
  const targetFocusMusclesList = (training.targetFocusMuscles || []).map(getCode).filter(m => m && m !== 'NONE');

  const hasCriticalFlags = dangerousSymptomsList.length > 0;
  const hasInjuries = selectedInjuriesList.length > 0;
  const hasExclusions = excludedFoodsList.length > 0;
  const hasDigestive = digestiveIssuesList.length > 0;

  const handleOpenWhatsApp = () => {
    if (!clientPhone) return;
    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    const msg = `مرحباً يا ${clientName}، استلمت استمارتك في Z Coaching وقمت بمراجعة بياناتك وجاري تجهيز خطتك المخصصة.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div 
      id="intake-audit-section" 
      className="card border-0 shadow-sm mt-4 bg-white w-100" 
      style={{ 
        borderRadius: '24px', 
        border: '1.5px solid #F0F9FF', 
        overflow: 'hidden',
        animation: 'z-fadeInUp 0.35s ease-out'
      }} 
      dir="rtl"
    >
      {/* 1. Card Header */}
      <div className="card-header border-bottom p-4 bg-white d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
            style={{ width: '44px', height: '44px', background: '#E5F0FF', color: '#0284C7', border: '1.5px solid #BAE6FD' }}
          >
            <i className="ti ti-clipboard-check fs-4"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.15rem' }}>
                مراجعة استمارة التقييم: {clientName}
              </h5>
              <span className="badge fw-bold" style={{ background: '#0284C7', color: '#ffffff', borderRadius: '6px', fontSize: '0.72rem' }}>
                كود #{clientCode}
              </span>
            </div>
            <small className="text-muted" style={{ fontSize: '0.78rem' }}>
              مراجعة تفصيلية لجميع إجابات واستبيانات المشترك والصور الجسدية المرفوعة
            </small>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          {clientPhone && (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1 fw-bold"
              style={{ height: '36px', fontSize: '0.78rem' }}
            >
              <i className="ti ti-brand-whatsapp fs-6"></i>
              <span>مراسلة واتساب</span>
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-sm btn-light rounded-pill px-3 d-flex align-items-center gap-1 border text-dark fw-semibold"
            style={{ height: '36px', background: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.78rem' }}
            title="إغلاق مراجعة الاستمارة"
          >
            <i className="ti ti-x fs-6"></i>
            <span>إغلاق المراجعة</span>
          </button>
        </div>
      </div>

      {/* 2. Card Body */}
      <div className="card-body p-4 bg-light">
        
        {/* TOP QUICK SCAN ALERT STRIP (ملخص التنبيهات السريع للكوتش) */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '14px', background: 'linear-gradient(135deg, #f8f9fd 0%, #f1f3fa 100%)', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem', borderRadius: '6px' }}>
                ملخص الفحص السريع:
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Food Exclusions Pill */}
              {hasExclusions ? (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style={{ background: '#ffe4e6', color: '#9f1239', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <i className="ti ti-ban fs-6"></i>
                  <span>ممنوعات طعام ({excludedFoodsList.length}):</span>
                  <span className="fw-normal">{excludedFoodsList.map(f => EXCLUDED_FOODS_LABELS[f] || f).join('، ')}</span>
                </span>
              ) : (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <i className="ti ti-check fs-6"></i>
                  <span>تغذية مرنة (لا توجد ممنوعات)</span>
                </span>
              )}

              {/* Digestive Pill */}
              {hasDigestive && (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <i className="ti ti-heart-rate-monitor fs-6"></i>
                  <span>هضمي/قولون:</span>
                  <span className="fw-normal">{digestiveIssuesList.map(d => DIGESTIVE_LABELS[d] || d).join('، ')}</span>
                </span>
              )}

              {/* Injuries Pill */}
              {hasInjuries ? (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style={{ background: '#ffedd5', color: '#9a3412', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <i className="ti ti-alert-triangle fs-6"></i>
                  <span>تنبيه إصابات:</span>
                  <span className="fw-normal">{selectedInjuriesList.map(inj => INJURIES_LABELS[inj] || inj).join('، ')}</span>
                </span>
              ) : (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <i className="ti ti-check fs-6"></i>
                  <span>سليم وبدون إصابات</span>
                </span>
              )}

              {/* Critical Health */}
              {hasCriticalFlags && (
                <span className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <i className="ti ti-shield-alert fs-6"></i>
                  <span>أعراض طبية حرجة!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Key Metrics Banner with BMR & TDEE */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-body p-3">
            <div className="row g-3 text-center align-items-center">
              <div className="col-6 col-md border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>الهدف الأساسي</span>
                <strong className="text-dark d-block text-truncate" style={{ fontSize: '0.86rem', color: '#0284C7' }}>
                  {GOALS_MAP[goals.primary] || goals.primary || 'حرق دهون'}
                </strong>
              </div>
              <div className="col-6 col-md border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>الوزن والطول</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>
                  {body.weightKg || '--'} كجم / {body.heightCm || '--'} سم
                </strong>
              </div>
              <div className="col-6 col-md border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>محيط الخصر & BMI</span>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{body.waistCm || '--'} سم</strong>
                  <span className="badge rounded-pill" style={{ background: bmiBadge.bg, color: bmiBadge.color, fontSize: '0.68rem' }}>
                    BMI {bmi}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>السن والجنس</span>
                <strong className="text-dark" style={{ fontSize: '0.88rem' }}>
                  {ageNum} سنة ({sexIsFemale ? 'أنثى' : 'ذكر'})
                </strong>
              </div>
              <div className="col-12 col-md">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>معدل الحرق التقديري</span>
                <strong className="text-dark" style={{ fontSize: '0.86rem', color: '#047857' }}>
                  BMR ~{bmr} / TDEE ~{tdee} سعرة
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Photos Review */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex align-items-center gap-2">
            <i className="ti ti-camera fs-5 text-primary" style={{ color: '#0284C7' }}></i>
            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>صور القوام المرفوعة (Front, Side, Back)</h6>
          </div>
          <div className="card-body p-3">
            <div className="row g-3">
              {/* Front Photo */}
              <div className="col-md-4">
                <div className="p-2 border rounded-3 text-center bg-light h-100 d-flex flex-column align-items-center justify-content-between">
                  <span className="badge bg-secondary mb-2" style={{ fontSize: '0.72rem' }}>صورة من الأمام</span>
                  {photos.front ? (
                    <div 
                      className="position-relative cursor-pointer w-100" 
                      style={{ maxHeight: '220px', overflow: 'hidden', borderRadius: '10px', cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ title: 'صورة من الأمام (Front)', src: photos.front })}
                    >
                      <img 
                        src={photos.front} 
                        alt="Front" 
                        className="img-fluid rounded" 
                        style={{ objectFit: 'cover', width: '100%', maxHeight: '220px' }} 
                      />
                      <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '0.68rem' }}>
                        <i className="ti ti-zoom-in me-1"></i> تكبير
                      </span>
                    </div>
                  ) : (
                    <div className="py-5 text-muted small d-flex flex-column align-items-center">
                      <i className="ti ti-photo-off fs-1 mb-1 text-secondary opacity-50"></i>
                      <span>لم يتم رفع صورة أمامية</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Photo */}
              <div className="col-md-4">
                <div className="p-2 border rounded-3 text-center bg-light h-100 d-flex flex-column align-items-center justify-content-between">
                  <span className="badge bg-secondary mb-2" style={{ fontSize: '0.72rem' }}>صورة من الجانب</span>
                  {photos.side ? (
                    <div 
                      className="position-relative cursor-pointer w-100" 
                      style={{ maxHeight: '220px', overflow: 'hidden', borderRadius: '10px', cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ title: 'صورة من الجانب (Side)', src: photos.side })}
                    >
                      <img 
                        src={photos.side} 
                        alt="Side" 
                        className="img-fluid rounded" 
                        style={{ objectFit: 'cover', width: '100%', maxHeight: '220px' }} 
                      />
                      <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '0.68rem' }}>
                        <i className="ti ti-zoom-in me-1"></i> تكبير
                      </span>
                    </div>
                  ) : (
                    <div className="py-5 text-muted small d-flex flex-column align-items-center">
                      <i className="ti ti-photo-off fs-1 mb-1 text-secondary opacity-50"></i>
                      <span>لم يتم رفع صورة جانبية</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Photo */}
              <div className="col-md-4">
                <div className="p-2 border rounded-3 text-center bg-light h-100 d-flex flex-column align-items-center justify-content-between">
                  <span className="badge bg-secondary mb-2" style={{ fontSize: '0.72rem' }}>صورة من الخلف</span>
                  {photos.back ? (
                    <div 
                      className="position-relative cursor-pointer w-100" 
                      style={{ maxHeight: '220px', overflow: 'hidden', borderRadius: '10px', cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ title: 'صورة من الخلف (Back)', src: photos.back })}
                    >
                      <img 
                        src={photos.back} 
                        alt="Back" 
                        className="img-fluid rounded" 
                        style={{ objectFit: 'cover', width: '100%', maxHeight: '220px' }} 
                      />
                      <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '0.68rem' }}>
                        <i className="ti ti-zoom-in me-1"></i> تكبير
                      </span>
                    </div>
                  ) : (
                    <div className="py-5 text-muted small d-flex flex-column align-items-center">
                      <i className="ti ti-photo-off fs-1 mb-1 text-secondary opacity-50"></i>
                      <span>لم يتم رفع صورة خلفية</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Nutrition & Excluded Foods (Prioritized Hierarchy) */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-salad fs-5 text-success"></i>
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.94rem' }}>النمط الغذائي واستبعاد الأطعمة</h6>
            </div>
            {hasExclusions && (
              <span className="badge bg-danger-subtle text-danger fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                يوجد {excludedFoodsList.length} أطعمة مستبعدة
              </span>
            )}
          </div>
          <div className="card-body p-4">
            
            {/* 1. Critical Food Exclusions (Shown First) */}
            <div className="p-3 mb-3 rounded-3" style={{ background: '#fff5f5', border: '1.5px solid #fecdd3' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="ti ti-ban text-danger fs-5"></i>
                <span className="fw-bold text-danger" style={{ fontSize: '0.88rem' }}>الأطعمة المستبعدة ومسببات الحساسية (حظر كامل):</span>
              </div>
              {hasExclusions ? (
                <div className="d-flex flex-wrap gap-2">
                  {excludedFoodsList.map((f, i) => (
                    <span key={i} className="badge px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style={{ background: '#ffffff', color: '#be123c', border: '1.5px solid #f43f5e', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <i className="ti ti-x"></i>
                      {EXCLUDED_FOODS_LABELS[f] || f}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="badge px-3 py-2 fw-semibold" style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem' }}>
                  نظام مرن وشامل لجميع أنواع الطعام (لا توجد أطعمة مستبعدة)
                </span>
              )}
            </div>

            {/* 2. Digestive & Gut Issues */}
            <div className="p-3 mb-3 rounded-3" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="ti ti-heart-rate-monitor text-warning fs-5"></i>
                <span className="fw-bold" style={{ fontSize: '0.88rem', color: '#92400e' }}>اضطرابات الجهاز الهضمي والقولون:</span>
              </div>
              {hasDigestive ? (
                <div className="d-flex flex-wrap gap-2">
                  {digestiveIssuesList.map((d, i) => (
                    <span key={i} className="badge px-3 py-2 fw-bold shadow-sm" style={{ background: '#ffffff', color: '#b45309', border: '1.5px solid #f59e0b', borderRadius: '8px', fontSize: '0.80rem' }}>
                      {DIGESTIVE_LABELS[d] || d}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="badge px-3 py-2 fw-semibold" style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem' }}>
                  الجهاز الهضمي والقولون سليم تماماً
                </span>
              )}
            </div>

            {/* 3. Routine Meal Schedule & Preferences */}
            <div className="row g-3 pt-2 border-top">
              <div className="col-md-4 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>عدد الوجبات المفضلة</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{nutrition.preferredMealCount || 3} وجبات يومياً</strong>
              </div>
              <div className="col-md-4 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>ميزانية النظام الغذائي</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>
                  {nutrition.budget === 'LOW' ? 'اقتصادية' : (nutrition.budget === 'HIGH' ? 'مفتوحة / ممتازة' : 'متوسطة متوازنة')}
                </strong>
              </div>
              <div className="col-md-4">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>حفظ وتسخين الوجبات</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>
                  {nutrition.foodStorageAvailable !== false ? 'متاح ثلاجة وميكروويف' : 'غير متاح'}
                </strong>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Training & Injuries (Prioritized Hierarchy) */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="ti ti-barbell fs-5 text-info"></i>
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.94rem' }}>البرنامج التدريبي وتخصيص التمارين</h6>
            </div>
            {hasInjuries && (
              <span className="badge bg-warning-subtle text-warning fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                تنبيه إصابات سابقة
              </span>
            )}
          </div>
          <div className="card-body p-4">
            
            {/* 1. Injury Alerts (Shown First) */}
            <div className="p-3 mb-3 rounded-3" style={{ background: hasInjuries ? '#fff7ed' : '#f0fdf4', border: `1.5px solid ${hasInjuries ? '#fed7aa' : '#bbf7d0'}` }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className={`ti ${hasInjuries ? 'ti-alert-triangle text-warning' : 'ti-shield-check text-success'} fs-5`}></i>
                <span className="fw-bold" style={{ fontSize: '0.88rem', color: hasInjuries ? '#9a3412' : '#166534' }}>
                  الإصابات الحركية ومواضع الألم والمفاصل:
                </span>
              </div>
              {hasInjuries ? (
                <div className="d-flex flex-wrap gap-2">
                  {selectedInjuriesList.map((inj, i) => (
                    <span key={i} className="badge px-3 py-2 fw-bold shadow-sm" style={{ background: '#ffffff', color: '#c2410c', border: '1.5px solid #ea580c', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <i className="ti ti-alert-circle me-1"></i>
                      {INJURIES_LABELS[inj] || inj}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="badge px-3 py-2 fw-semibold" style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem' }}>
                  سليم 100% ولا توجد إصابات مسبقة تعيق الحركة
                </span>
              )}
            </div>

            {/* 2. Focus Target Muscles */}
            {targetFocusMusclesList.length > 0 && (
              <div className="p-3 mb-3 rounded-3" style={{ background: '#E5F0FF', border: '1.5px solid #BAE6FD' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="ti ti-target text-primary fs-5" style={{ color: '#0284C7' }}></i>
                  <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>العضلات المستهدفة بالتركيز الإضافي:</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {targetFocusMusclesList.map((m, i) => (
                    <span key={i} className="badge px-3 py-2 fw-bold shadow-sm" style={{ background: '#ffffff', color: '#0284C7', border: '1.5px solid #58B4E5', borderRadius: '8px', fontSize: '0.80rem' }}>
                      {FOCUS_MUSCLES_LABELS[m] || m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Routine Training Parameters */}
            <div className="row g-3 pt-2 border-top">
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>مكان التمرين</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{training.location === 'HOME' ? 'المنزل' : 'الجيم'}</strong>
              </div>
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>أيام التمرين الأسبوعية</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{training.preferredDaysPerWeek || training.maxDaysPerWeek || 4} أيام / أسبوع</strong>
              </div>
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>مدة الجلسة التدريبية</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{training.maxSessionMinutes || 60} دقيقة</strong>
              </div>
              <div className="col-md-3">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>مستوى الخبرة</span>
                <strong className="text-dark" style={{ fontSize: '0.90rem' }}>{EXPERIENCE_MAP[training.experience] || training.experience || 'مبتدئ'}</strong>
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Health & Medical Safety */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex align-items-center gap-2">
            <i className="ti ti-shield-heart fs-5 text-danger"></i>
            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>الأمان الصحي والموانع الطبية</h6>
          </div>
          <div className="card-body p-3">
            <div className="row g-3">
              <div className="col-md-6 border-start">
                <span className="text-muted small fw-bold d-block mb-2">الأمراض والحالات الصحية المزمنة:</span>
                {medicalConditionsList.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {medicalConditionsList.map((c, i) => (
                      <span key={i} className="badge px-3 py-2 fw-semibold" style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.78rem' }}>
                        {CONDITIONS_LABELS[c.conditionCode || c] || c.conditionCode || c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="badge px-3 py-2 fw-semibold" style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem' }}>
                    لا توجد أمراض مزمنة مسجلة
                  </span>
                )}
              </div>

              <div className="col-md-6">
                <span className="text-muted small fw-bold d-block mb-2">أعراض السلامة والتحذيرات:</span>
                {dangerousSymptomsList.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {dangerousSymptomsList.map((s, i) => (
                      <span key={i} className="badge px-3 py-2 fw-semibold" style={{ background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.78rem' }}>
                        {DANGEROUS_SYMPTOMS_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="badge px-3 py-2 fw-semibold" style={{ background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem' }}>
                    سليم 100% ولا توجد أعراض حرجة
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Cardio & Lifestyle */}
        <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="card-header bg-white border-bottom p-3 d-flex align-items-center gap-2">
            <i className="ti ti-run fs-5 text-warning"></i>
            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.92rem' }}>الكارديو ونمط الحياة اليومي</h6>
          </div>
          <div className="card-body p-3">
            <div className="row g-3">
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>النشاط اليومي</span>
                <strong className="text-dark" style={{ fontSize: '0.84rem' }}>{ACTIVITY_MAP[lifestyle.dailyActivity] || lifestyle.dailyActivity || 'خفيف'}</strong>
              </div>
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>النوم اليومي</span>
                <strong className="text-dark" style={{ fontSize: '0.88rem' }}>{lifestyle.sleep?.averageHours || 7} ساعات (جيد)</strong>
              </div>
              <div className="col-md-3 border-start">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>جلسات الكارديو</span>
                <strong className="text-dark" style={{ fontSize: '0.88rem' }}>{cardio.maxSessionsPerWeek || 2} جلسات ({cardio.maxDurationMinutes || 30} دقيقة)</strong>
              </div>
              <div className="col-md-3">
                <span className="text-muted small d-block mb-1" style={{ fontSize: '0.72rem' }}>خطوات المشي اليومية</span>
                <strong className="text-dark" style={{ fontSize: '0.88rem' }}>~{cardio.averageDailySteps || 6000} خطوة/يوم</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Card Footer */}
      <div className="card-footer bg-white border-top p-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
        <button 
          type="button" 
          className="btn btn-light btn-sm rounded-pill px-4 border text-dark fw-semibold" 
          style={{ height: '38px', fontSize: '0.82rem' }} 
          onClick={onClose}
        >
          <i className="ti ti-x me-1"></i> إغلاق المراجعة
        </button>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2 shadow-sm"
            style={{ 
              height: '38px', 
              fontSize: '0.84rem',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(38, 28, 106, 0.3)'
            }}
            disabled={generatingId === submission.id}
            onClick={() => onGenerateDraft(submission)}
          >
            {generatingId === submission.id ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>جاري توليد الخطة بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <i className="ti ti-sparkles fs-6"></i>
                <span>توليد وتعديل الخطة الذكية</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox (Portal on demand) */}
      {previewImage && ReactDOM.createPortal(
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.90)', 
            backdropFilter: 'blur(8px)',
            zIndex: 20000,
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '800px', width: '92%' }}>
            <div className="modal-content bg-transparent border-0 text-center position-relative">
              <div className="d-flex justify-content-between align-items-center text-white mb-2 px-2">
                <span className="fw-bold fs-6">{previewImage.title}</span>
                <button 
                  type="button" 
                  className="btn btn-dark btn-sm rounded-circle shadow"
                  style={{ width: '36px', height: '36px' }}
                  onClick={() => setPreviewImage(null)}
                >
                  <i className="ti ti-x fs-5"></i>
                </button>
              </div>
              <img 
                src={previewImage.src} 
                alt="Preview" 
                className="img-fluid rounded-4 shadow-2xl" 
                style={{ maxHeight: '82vh', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.2)' }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
