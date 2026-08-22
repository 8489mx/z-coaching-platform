import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config/api';

const DEFAULT_MASTER_INTAKE = {
  // Screen 1: Biometrics & Target
  gender: 'male',
  age: '',
  height_cm: '',
  weight_kg: '',
  circumferences: {
    neck_cm: '',
    waist_cm: '',
    hips_cm: '',
    chest_cm: '',
    arm_cm: '',
    thigh_cm: ''
  },
  primary_goal: 'recomposition',
  neat_level: 'moderate',

  // Screen 2: Clinical & Injury Matrix
  medical_conditions: {
    has_conditions: false,
    selected: [],
    bariatric: { is_operated: false, meal_capacity_grams: '150_200', dumping_syndrome: false },
    diabetes: { type: 'type2', uses_insulin: false, icr_ratio: '', hba1c: '' },
    favism_g6pd: false,
    renal_hepatic_issue: false,
    thyroid: 'hypo',
    gi_issues: [],
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false },
    hypertension: false,
    gout: false,
    cholecystectomy: false,
    other_notes: ''
  },
  injuries_map: {
    has_injuries: false,
    selected_areas: [],
    knee: [],
    spine_back: [],
    shoulder: [],
    core: [],
    other_joints: [],
    injury_nature: 'chronic',
    pain_relieved_by_rest: true
  },
  smoking_status: 'non_smoker',
  current_meds_supplements: '',

  // Screen 3: Nutrition & Lifestyle
  strict_allergies: [],
  other_allergies: '',
  cuisine_preference: 'egyptian_traditional',
  meal_structure: {
    meals_count: '3_meals_snack',
    intermittent_fasting: 'none'
  },
  disliked_foods: [],
  disliked_foods_text: '',

  // Screen 4: Training & Media
  training_environment: 'commercial_gym',
  training_logistics: {
    days_per_week: 4,
    experience_level: 'intermediate',
    has_other_sports: false,
    sports_name: '',
    hours_per_week: ''
  },
  focus_muscles: [],
  media_uploads: {
    front_url: '',
    side_url: '',
    back_url: '',
    inbody_report_url: '',
    medical_reports_urls: []
  }
};

const STEPS = [
  { id: 1, title: 'القياسات والأهداف', sub: 'البيانات الفسيولوجية والمحيطات' },
  { id: 2, title: 'السجل الطبي والإصابات', sub: 'الحالات الصحية والمفاصل' },
  { id: 3, title: 'التغذية والمطبخ', sub: 'الحساسيات ونمط الوجبات' },
  { id: 4, title: 'التدريب والصور', sub: 'بيئة الجيم ورفع الملفات' }
];

export default function FullIntakeForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_MASTER_INTAKE);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  // Read URL query params (?code=...&phone=...)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const qCode = queryParams.get('code');
    const qPhone = queryParams.get('phone');

    if (qCode) sessionStorage.setItem('z_client_code', qCode.trim());
    if (qPhone) sessionStorage.setItem('z_client_phone', qPhone.trim());

    const clientCode = sessionStorage.getItem('z_client_code');
    const clientPhone = sessionStorage.getItem('z_client_phone');

    if (!clientCode || !clientPhone) {
      navigate('/intake');
      return;
    }

    fetchInitialData(clientCode, clientPhone);
  }, [location.search]);

  const fetchInitialData = async (code, phone) => {
    try {
      setLoadingDraft(true);
      const res = await fetch(`${API_BASE}/api/v1/intake/answers?client_code=${encodeURIComponent(code)}&phone_number=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (data.submission) {
        if (['SUBMITTED', 'REVIEWED', 'LOCKED'].includes(data.submission.status)) {
          setSubmittedSuccess(data.submission);
          return;
        }
        if (data.submission.answers) {
          setFormData(prev => ({ ...prev, ...data.submission.answers }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch intake draft:', e);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (loadingDraft || submittedSuccess) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const code = sessionStorage.getItem('z_client_code');
      const phone = sessionStorage.getItem('z_client_phone');

      try {
        localStorage.setItem(`z_intake_${code}_${phone}`, JSON.stringify(formData));
        await fetch(`${API_BASE}/api/v1/intake/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_code: code,
            phone_number: phone,
            answers: formData,
            progress_percent: Math.round((currentStep / 4) * 100)
          })
        });
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('saved');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [formData, currentStep, loadingDraft, submittedSuccess]);

  const updateNested = (parent, field, val) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: val
      }
    }));
  };

  const toggleArrayItem = (arrayField, item) => {
    setFormData(prev => {
      const current = prev[arrayField] || [];
      if (current.includes(item)) {
        return { ...prev, [arrayField]: current.filter(x => x !== item) };
      } else {
        return { ...prev, [arrayField]: [...current, item] };
      }
    });
  };

  const toggleCondition = (conditionKey) => {
    setFormData(prev => {
      const med = prev.medical_conditions;
      const selected = med.selected || [];
      const isSelected = selected.includes(conditionKey);
      const newSelected = isSelected ? selected.filter(k => k !== conditionKey) : [...selected, conditionKey];
      return {
        ...prev,
        medical_conditions: {
          ...med,
          selected: newSelected,
          has_conditions: newSelected.length > 0
        }
      };
    });
  };

  const toggleInjuryArea = (areaKey) => {
    setFormData(prev => {
      const inj = prev.injuries_map;
      const selected = inj.selected_areas || [];
      const isSelected = selected.includes(areaKey);
      const newSelected = isSelected ? selected.filter(k => k !== areaKey) : [...selected, areaKey];
      return {
        ...prev,
        injuries_map: {
          ...inj,
          selected_areas: newSelected,
          has_injuries: newSelected.length > 0
        }
      };
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.height_cm || !formData.weight_kg || !formData.age) {
      alert('يرجى التأكد من ملء الطول، الوزن، والسن في الخطوة الأولى.');
      setCurrentStep(1);
      return;
    }
    if (!formData.circumferences?.waist_cm || !formData.circumferences?.neck_cm) {
      alert('يرجى إدخال محيط الرقبة والوسط بالمتر الشريطي لحساب نسبة الدهون بدقة.');
      setCurrentStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const code = sessionStorage.getItem('z_client_code');
      const phone = sessionStorage.getItem('z_client_phone');

      const res = await fetch(`${API_BASE}/api/v1/intake/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: code,
          phone_number: phone,
          answers: formData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال الاستمارة.');
      }

      setSubmittedSuccess(data.submission || { status: 'SUBMITTED' });
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white" dir="rtl">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#0284C7' }}></div>
          <h5 className="fw-bold text-dark" style={{ fontFamily: 'var(--font-sans)' }}>جاري استرجاع مسودة استمارتك بأمان...</h5>
        </div>
      </div>
    );
  }

  // Idempotent Locked Screen if already submitted
  if (submittedSuccess) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'var(--font-sans)' }}>
        <div className="z-premium-card p-4 p-sm-5 text-center" style={{ maxWidth: '580px', width: '100%', borderRadius: '24px', border: '1px solid #E7EEF3', background: '#FFFFFF', boxShadow: '0 10px 40px rgba(15, 23, 42, 0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem', border: '1px solid #A7F3D0' }}>
            <i className="ti ti-circle-check"></i>
          </div>

          <span className="badge rounded-pill px-3 py-1 fw-bold mb-2" style={{ background: '#E5F0FF', color: '#0284C7', fontSize: '0.76rem', border: '1px solid #BAE6FD' }}>
            كود المشترك: #{sessionStorage.getItem('z_client_code')}
          </span>

          <h3 className="fw-black text-dark mb-2" style={{ color: '#0F172A', fontSize: '1.5rem' }}>
            تم استلام استمارتك الصحية والرياضية بنجاح
          </h3>

          <p className="text-muted small mb-4" style={{ fontSize: '0.88rem', lineHeight: '1.7', color: '#64748B' }}>
            يقوم كابتن كريم زكريا ومحركات الذكاء الاصطناعي السبعة حالياً بمراجعة قياساتك، مصفوفة إصاباتك، وتفضيلات المطبخ لإعداد خطتك المخصصة بالجرام وميزوسايكل التمارين.
          </p>

          <div className="p-3 rounded-3 mb-4 text-start" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">حالة الملف:</span>
              <strong className="text-success">قيد المراجعة السريرية والاعتماد (SUBMITTED)</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">توقيت الإرسال:</span>
              <strong className="text-dark font-monospace">{new Date().toLocaleDateString('ar-EG')}</strong>
            </div>
          </div>

          <a 
            href="https://wa.me/201000000000" 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-lg w-100 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2 mb-2"
            style={{ background: '#16A34A', border: 'none', height: '46px', fontSize: '0.92rem' }}
          >
            <i className="ti ti-brand-whatsapp fs-5"></i>
            <span>متابعة حالة الخطة مع الكوتش عبر WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#FAFBFC', padding: '20px 10px', fontFamily: 'var(--font-sans)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* Master Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #58B4E5 0%, #0284C7 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem' }}>
              Z
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0" style={{ fontSize: '1.15rem', color: '#0F172A' }}>
                استمارة التقييم الصحي والرياضي الماستر
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                كود المشترك: <strong className="font-monospace text-primary">#{sessionStorage.getItem('z_client_code')}</strong> | هاتف: <strong className="font-monospace">{sessionStorage.getItem('z_client_phone')}</strong>
              </small>
            </div>
          </div>

          {/* Auto-save status */}
          <div className="d-flex align-items-center gap-1 small text-muted" style={{ fontSize: '0.76rem' }}>
            {saveStatus === 'saving' ? (
              <span className="text-primary"><i className="ti ti-refresh spin me-1"></i> جاري الحفظ التلقائي...</span>
            ) : (
              <span className="text-success"><i className="ti ti-check me-1"></i> مسودتك محفوظة</span>
            )}
          </div>
        </div>

        {/* 4-Step Stepper Progress Bar */}
        <div className="z-premium-card p-3 mb-4" style={{ borderRadius: '20px', border: '1px solid #E7EEF3', background: '#FFFFFF' }}>
          <div className="d-flex justify-content-between mb-2">
            {STEPS.map((s) => (
              <div 
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                style={{ 
                  cursor: 'pointer',
                  textAlign: 'center',
                  flex: 1,
                  color: currentStep === s.id ? '#0284C7' : currentStep > s.id ? '#059669' : '#94A3B8'
                }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 fw-bold"
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    fontSize: '0.82rem',
                    background: currentStep === s.id ? '#E5F0FF' : currentStep > s.id ? '#ECFDF5' : '#F1F5F9',
                    color: currentStep === s.id ? '#0284C7' : currentStep > s.id ? '#059669' : '#94A3B8',
                    border: currentStep === s.id ? '1.5px solid #0284C7' : 'none'
                  }}
                >
                  {currentStep > s.id ? <i className="ti ti-check"></i> : s.id}
                </div>
                <span className="d-none d-sm-block fw-bold" style={{ fontSize: '0.76rem' }}>{s.title}</span>
              </div>
            ))}
          </div>
          <div className="progress" style={{ height: '6px', borderRadius: '10px', background: '#F1F5F9' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${(currentStep / 4) * 100}%`,
                background: 'linear-gradient(90deg, #58B4E5 0%, #0284C7 100%)',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>

        {/* Dynamic Form Content */}
        <div className="z-premium-card p-4 p-sm-5 mb-4" style={{ borderRadius: '24px', border: '1px solid #E7EEF3', background: '#FFFFFF' }}>

          {/* =========================================================================
              SCREEN 1: القياسات الفسيولوجية ومعدل النشاط (Biometrics & Target)
              ========================================================================= */}
          {currentStep === 1 && (
            <div>
              <div className="mb-4 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="fw-black text-dark mb-1" style={{ color: '#0F172A' }}>1. القياسات الفسيولوجية ومعدل النشاط</h5>
                <small className="text-muted" style={{ fontSize: '0.82rem' }}>البيانات الأساسية لتشغيل معادلة الأيض BMR ونسبة الدهون U.S. Navy</small>
              </div>

              {/* Q1: Gender Toggle & Age, Height, Weight */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">الجنس</label>
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                    className={`btn flex-fill py-2.5 rounded-3 fw-bold ${formData.gender === 'male' ? 'btn-primary' : 'btn-light border'}`}
                    style={{ fontSize: '0.88rem' }}
                  >
                    ذكر (Male)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                    className={`btn flex-fill py-2.5 rounded-3 fw-bold ${formData.gender === 'female' ? 'btn-primary' : 'btn-light border'}`}
                    style={{ fontSize: '0.88rem' }}
                  >
                    أنثى (Female)
                  </button>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4 col-12">
                  <label className="form-label fw-bold text-dark small mb-1">السن (بالسنوات)</label>
                  <input 
                    type="number" 
                    className="form-control font-monospace" 
                    placeholder="مثال: 26"
                    value={formData.age}
                    onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0' }}
                    required 
                  />
                </div>
                <div className="col-md-4 col-12">
                  <label className="form-label fw-bold text-dark small mb-1">الطول (سم)</label>
                  <input 
                    type="number" 
                    className="form-control font-monospace" 
                    placeholder="مثال: 180"
                    value={formData.height_cm}
                    onChange={(e) => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0' }}
                    required 
                  />
                </div>
                <div className="col-md-4 col-12">
                  <label className="form-label fw-bold text-dark small mb-1">الوزن الحالي (كجم)</label>
                  <input 
                    type="number" 
                    className="form-control font-monospace" 
                    placeholder="مثال: 82.5"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0' }}
                    required 
                  />
                </div>
              </div>

              {/* Q2: Anthropometric Tape Measurements */}
              <div className="mb-4 p-3 rounded-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="ti ti-ruler text-primary fs-5"></i>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>القياسات بالمتر الشريطي (إلزامية لدقة نسبة الدهون)</h6>
                </div>
                <div className="row g-3">
                  <div className="col-md-4 col-12">
                    <label className="form-label small fw-bold text-dark mb-1">محيط الرقبة (سم) *</label>
                    <input 
                      type="number" 
                      className="form-control font-monospace bg-white" 
                      placeholder="عند أضيق نقطة"
                      value={formData.circumferences.neck_cm}
                      onChange={(e) => updateNested('circumferences', 'neck_cm', e.target.value)}
                      style={{ height: '42px', borderRadius: '10px', borderColor: '#CBD5E1' }}
                      required 
                    />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label small fw-bold text-dark mb-1">محيط الوسط / البطن (سم) *</label>
                    <input 
                      type="number" 
                      className="form-control font-monospace bg-white" 
                      placeholder="عند مستوى السرة"
                      value={formData.circumferences.waist_cm}
                      onChange={(e) => updateNested('circumferences', 'waist_cm', e.target.value)}
                      style={{ height: '42px', borderRadius: '10px', borderColor: '#CBD5E1' }}
                      required 
                    />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label small fw-bold text-dark mb-1">
                      محيط الحوض والأرداف (سم) {formData.gender === 'female' ? '*' : '(اختياري للذكور)'}
                    </label>
                    <input 
                      type="number" 
                      className="form-control font-monospace bg-white" 
                      placeholder="أعرض نقطة بالحوض"
                      value={formData.circumferences.hips_cm}
                      onChange={(e) => updateNested('circumferences', 'hips_cm', e.target.value)}
                      style={{ height: '42px', borderRadius: '10px', borderColor: '#CBD5E1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Q3: Primary Goal */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">الهدف الفسيولوجي الرئيسي</label>
                <div className="row g-2">
                  {[
                    { id: 'fat_loss', title: 'خسارة دهون حادة (Fat Loss)', desc: 'عجز سعرات مدروس مع الحفاظ التام على العضل' },
                    { id: 'lean_bulk', title: 'بناء كتلة عضلية صافية (Lean Bulk)', desc: 'فائض سعرات خفيف لتضخيم عضلي نظيف' },
                    { id: 'recomposition', title: 'إعادة تشكيل الجسم (Body Recomp)', desc: 'حرق دهون وبناء عضلات في نفس التوقيت' },
                    { id: 'general_fitness', title: 'لياقة عامة وتأهيل بدني (Fitness)', desc: 'تحسين كفاءة القلب والصحة العامة' }
                  ].map((goal) => (
                    <div className="col-sm-6 col-12" key={goal.id}>
                      <div 
                        onClick={() => setFormData(p => ({ ...p, primary_goal: goal.id }))}
                        className={`p-3 rounded-3 border h-100 ${formData.primary_goal === goal.id ? 'border-primary' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          background: formData.primary_goal === goal.id ? '#E5F0FF' : '#FFFFFF',
                          borderColor: formData.primary_goal === goal.id ? '#0284C7' : '#E2E8F0'
                        }}
                      >
                        <strong className="d-block text-dark mb-1" style={{ fontSize: '0.86rem' }}>{goal.title}</strong>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>{goal.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q4: NEAT Activity Level */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">معدل النشاط اليومي خارج الجيم (NEAT Level)</label>
                <div className="row g-2">
                  {[
                    { id: 'sedentary', title: 'خامل / عمل مكتبي', desc: 'أقل من 5,000 خطوة يومياً' },
                    { id: 'moderate', title: 'متوسط النشاط', desc: 'من 6,000 إلى 9,000 خطوة يومياً' },
                    { id: 'very_active', title: 'عالي النشاط / عمل ميداني', desc: 'أكثر من 10,000 خطوة يومياً' }
                  ].map((act) => (
                    <div className="col-md-4 col-12" key={act.id}>
                      <div 
                        onClick={() => setFormData(p => ({ ...p, neat_level: act.id }))}
                        className={`p-3 rounded-3 border text-center ${formData.neat_level === act.id ? 'border-primary' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          background: formData.neat_level === act.id ? '#E5F0FF' : '#FFFFFF',
                          borderColor: formData.neat_level === act.id ? '#0284C7' : '#E2E8F0'
                        }}
                      >
                        <strong className="d-block text-dark mb-1" style={{ fontSize: '0.84rem' }}>{act.title}</strong>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>{act.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              SCREEN 2: السجل الطبي، العمليات، ومصفوفة الإصابات (Clinical & Injury Matrix)
              ========================================================================= */}
          {currentStep === 2 && (
            <div>
              <div className="mb-4 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="fw-black text-dark mb-1" style={{ color: '#0F172A' }}>2. السجل الطبي، العمليات الجراحية، ومصفوفة الإصابات</h5>
                <small className="text-muted" style={{ fontSize: '0.82rem' }}>لتفعيل محددات الأمان السريري واستبعاد التمارين أو الأغذية الممنوعة</small>
              </div>

              {/* Q5: Medical Conditions Multi-Select Chips */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">الحالات الطبية أو العمليات السابقة (اختر ما ينطبق)</label>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {[
                    { key: 'none', label: 'سليم تماماً - لا توجد حالات خاصة' },
                    { key: 'bariatric_surgery', label: 'تكميم معدة / تحويل مسار' },
                    { key: 'diabetes', label: 'سكري / مقاومة أنسولين' },
                    { key: 'favism_g6pd', label: 'أنيميا الفول (G6PD)' },
                    { key: 'renal_hepatic', label: 'أمراض كلى أو كبد' },
                    { key: 'thyroid', label: 'اضطرابات الغدة الدرقية' },
                    { key: 'gi_tract', label: 'قولون عصبي / ارتجاع مريء' },
                    { key: 'hypertension', label: 'ضغط دم مرتفع' },
                    { key: 'gout', label: 'نقرس / يوريك أسيد مرتفع' }
                  ].map((c) => {
                    const isChecked = formData.medical_conditions.selected?.includes(c.key);
                    return (
                      <button 
                        key={c.key}
                        type="button"
                        onClick={() => {
                          if (c.key === 'none') {
                            setFormData(p => ({ ...p, medical_conditions: { ...p.medical_conditions, selected: ['none'], has_conditions: false } }));
                          } else {
                            toggleCondition(c.key);
                          }
                        }}
                        className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${isChecked ? 'btn-primary' : 'btn-light border'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Sub-questions for Bariatric */}
                {formData.medical_conditions.selected?.includes('bariatric_surgery') && (
                  <div className="p-3 rounded-3 mb-3" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                    <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '0.84rem' }}>تخصيص سعة الوجبات لمتكممي المعدة:</h6>
                    <div className="row g-2">
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">سعة الوجبة التقريبية</label>
                        <select 
                          className="form-select form-select-sm"
                          value={formData.medical_conditions.bariatric.meal_capacity_grams}
                          onChange={(e) => updateNested('medical_conditions', 'bariatric', { ...formData.medical_conditions.bariatric, meal_capacity_grams: e.target.value })}
                        >
                          <option value="under_150">أقل من 150 جم (وجبات مكثفة صغيرة جداً)</option>
                          <option value="150_200">150 إلى 200 جم (المعدل القياسي)</option>
                          <option value="over_200">أكثر من 200 جم</option>
                        </select>
                      </div>
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">هل تعاني من متلازمة الإغراق (Dumping)؟</label>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'bariatric', { ...formData.medical_conditions.bariatric, dumping_syndrome: true })}
                            className={`btn btn-sm flex-fill ${formData.medical_conditions.bariatric.dumping_syndrome ? 'btn-danger' : 'btn-light border'}`}
                          >نعم</button>
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'bariatric', { ...formData.medical_conditions.bariatric, dumping_syndrome: false })}
                            className={`btn btn-sm flex-fill ${!formData.medical_conditions.bariatric.dumping_syndrome ? 'btn-success' : 'btn-light border'}`}
                          >لا</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Sub-questions for Diabetes */}
                {formData.medical_conditions.selected?.includes('diabetes') && (
                  <div className="p-3 rounded-3 mb-3" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                    <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.84rem' }}>تخصيص بروتوكول السكري ومقاومة الأنسولين:</h6>
                    <div className="row g-2">
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">النوع</label>
                        <select 
                          className="form-select form-select-sm"
                          value={formData.medical_conditions.diabetes.type}
                          onChange={(e) => updateNested('medical_conditions', 'diabetes', { ...formData.medical_conditions.diabetes, type: e.target.value })}
                        >
                          <option value="insulin_resistance">مقاومة أنسولين (Insulin Resistance)</option>
                          <option value="type2">سكري النوع الثاني (Type 2)</option>
                          <option value="type1">سكري النوع الأول (Type 1)</option>
                        </select>
                      </div>
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">استخدام حقن الأنسولين</label>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'diabetes', { ...formData.medical_conditions.diabetes, uses_insulin: true })}
                            className={`btn btn-sm flex-fill ${formData.medical_conditions.diabetes.uses_insulin ? 'btn-warning text-dark fw-bold' : 'btn-light border'}`}
                          >نعم</button>
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'diabetes', { ...formData.medical_conditions.diabetes, uses_insulin: false })}
                            className={`btn btn-sm flex-fill ${!formData.medical_conditions.diabetes.uses_insulin ? 'btn-success' : 'btn-light border'}`}
                          >لا</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q6: Injuries Matrix Multi-Select Chips */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">مواضع الإصابات أو الآلام المفصلية الحالية</label>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {[
                    { key: 'none', label: 'لا توجد أي إصابات مفصلية' },
                    { key: 'knee', label: 'إصابات الركبة (صليبي / غضروف / صابونة)' },
                    { key: 'spine_back', label: 'العمود الفقري (انزلاق غضروفي قطني / عنقي / عرق النسا)' },
                    { key: 'shoulder', label: 'الكتف (اختناق أوتار / كفة مدورة)' },
                    { key: 'core', label: 'الجدار البطني (انفصال عضلي / فتق)' },
                    { key: 'elbow_wrist', label: 'الكوع أو المعصم' }
                  ].map((inj) => {
                    const isChecked = formData.injuries_map.selected_areas?.includes(inj.key);
                    return (
                      <button 
                        key={inj.key}
                        type="button"
                        onClick={() => {
                          if (inj.key === 'none') {
                            setFormData(p => ({ ...p, injuries_map: { ...p.injuries_map, selected_areas: ['none'], has_injuries: false } }));
                          } else {
                            toggleInjuryArea(inj.key);
                          }
                        }}
                        className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${isChecked ? 'btn-danger' : 'btn-light border'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {inj.label}
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Questions if any injury is selected */}
                {formData.injuries_map.has_injuries && (
                  <div className="p-3 rounded-3 mb-3" style={{ background: '#FFF1F2', border: '1px solid #FECDD3' }}>
                    <h6 className="fw-bold text-danger mb-2" style={{ fontSize: '0.84rem' }}>تحديد طبيعة الإصابة لضبط محرك البدائل الآمنة:</h6>
                    <div className="row g-2">
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">طبيعة الإصابة</label>
                        <select 
                          className="form-select form-select-sm"
                          value={formData.injuries_map.injury_nature}
                          onChange={(e) => updateNested('injuries_map', 'injury_nature', e.target.value)}
                        >
                          <option value="chronic">إجهاد تراكمي وتدريجي (Chronic)</option>
                          <option value="acute">حادث أو صدمة مفاجئة (Acute)</option>
                        </select>
                      </div>
                      <div className="col-md-6 col-12">
                        <label className="small text-dark mb-1">هل يهدأ الألم عند الراحة وعدم التحميل؟</label>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => updateNested('injuries_map', 'pain_relieved_by_rest', true)}
                            className={`btn btn-sm flex-fill ${formData.injuries_map.pain_relieved_by_rest ? 'btn-success' : 'btn-light border'}`}
                          >نعم يهدأ</button>
                          <button 
                            type="button" 
                            onClick={() => updateNested('injuries_map', 'pain_relieved_by_rest', false)}
                            className={`btn btn-sm flex-fill ${!formData.injuries_map.pain_relieved_by_rest ? 'btn-danger' : 'btn-light border'}`}
                          >لا يستمر</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q7: Smoking Status */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">حالة التدخين</label>
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, smoking_status: 'non_smoker' }))}
                    className={`btn flex-fill py-2 rounded-3 fw-bold ${formData.smoking_status === 'non_smoker' ? 'btn-success' : 'btn-light border'}`}
                    style={{ fontSize: '0.84rem' }}
                  >
                    غير مدخن (Non-Smoker)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, smoking_status: 'smoker' }))}
                    className={`btn flex-fill py-2 rounded-3 fw-bold ${formData.smoking_status === 'smoker' ? 'btn-danger' : 'btn-light border'}`}
                    style={{ fontSize: '0.84rem' }}
                  >
                    مدخن (Smoker)
                  </button>
                </div>
              </div>

              {/* Q8: Current Meds / Supplements */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">الأدوية أو المكملات المتوفرة لديك حالياً (اختياري)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="مثال: كرياتين، أوميجا 3، دواء ضغط، فيتامين د..."
                  value={formData.current_meds_supplements}
                  onChange={(e) => setFormData(p => ({ ...p, current_meds_supplements: e.target.value }))}
                  style={{ height: '42px', borderRadius: '10px', borderColor: '#E2E8F0', fontSize: '0.84rem' }}
                />
              </div>

            </div>
          )}

          {/* =========================================================================
              SCREEN 3: التغذية، المطبخ، والحساسيات (Nutrition & Culinary Engine)
              ========================================================================= */}
          {currentStep === 3 && (
            <div>
              <div className="mb-4 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="fw-black text-dark mb-1" style={{ color: '#0F172A' }}>3. التغذية، المطبخ، والحساسيات الغذائية</h5>
                <small className="text-muted" style={{ fontSize: '0.82rem' }}>لبناء سفرة الوجبات الدقيقة من مطبخك المفضل واستبعاد المحظورات</small>
              </div>

              {/* Q9: Strict Allergies */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">مصفوفة الحساسيات الغذائية الصارمة (حظر فوري)</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {[
                    { key: 'none', label: 'لا توجد أي حساسية غذائية' },
                    { key: 'eggs', label: 'حساسية بيض' },
                    { key: 'dairy_lactose', label: 'حساسية لاكتوز وألبان' },
                    { key: 'gluten_celiac', label: 'حساسية قمح وجلوتين / سيلياك' },
                    { key: 'peanuts_tree_nuts', label: 'حساسية مكسرات وفول سوداني' },
                    { key: 'fish_shellfish', label: 'حساسية أسماك ومأكولات بحرية' },
                    { key: 'soy', label: 'حساسية فول صويا' },
                    { key: 'sesame_seeds', label: 'حساسية سمسم وبذور' }
                  ].map((alg) => {
                    const isChecked = formData.strict_allergies.includes(alg.key);
                    return (
                      <button 
                        key={alg.key}
                        type="button"
                        onClick={() => {
                          if (alg.key === 'none') {
                            setFormData(p => ({ ...p, strict_allergies: ['none'] }));
                          } else {
                            toggleArrayItem('strict_allergies', alg.key);
                          }
                        }}
                        className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${isChecked ? 'btn-danger' : 'btn-light border'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {alg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q10: Cuisine Preference */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">نمط المطبخ والوجبات المفضل لديك</label>
                <div className="row g-2">
                  {[
                    { id: 'egyptian_traditional', title: 'مطبخ مصري منزلي', desc: 'أرز، خضار مطبوخ، دواجن ولحوم، جبن قريش' },
                    { id: 'gulf_traditional', title: 'مطبخ خليجي غني', desc: 'كبسة، مجبوس، لحوم ودواجن بتوابل شرقية' },
                    { id: 'quick_prep_western', title: 'وجبات عصرية سريعة التحضير', desc: 'شوفان، توست، زبادي يوناني، ستيك وفيليه' },
                    { id: 'keto', title: 'نظام كيتو دايت (Keto)', desc: 'دهون صحية عالية وبروتين مع كارب منعدم' },
                    { id: 'vegetarian_pescatarian', title: 'نظام نباتي مرن', desc: 'اعتماد على الأسماك، البيض، والألبان والنبات' }
                  ].map((cuis) => (
                    <div className="col-sm-6 col-12" key={cuis.id}>
                      <div 
                        onClick={() => setFormData(p => ({ ...p, cuisine_preference: cuis.id }))}
                        className={`p-3 rounded-3 border h-100 ${formData.cuisine_preference === cuis.id ? 'border-primary' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          background: formData.cuisine_preference === cuis.id ? '#E5F0FF' : '#FFFFFF',
                          borderColor: formData.cuisine_preference === cuis.id ? '#0284C7' : '#E2E8F0'
                        }}
                      >
                        <strong className="d-block text-dark mb-1" style={{ fontSize: '0.86rem' }}>{cuis.title}</strong>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>{cuis.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q11: Meal Structure & Intermittent Fasting */}
              <div className="row g-3 mb-4">
                <div className="col-md-6 col-12">
                  <label className="form-label fw-bold text-dark small mb-2">عدد الوجبات المفضل يومياً</label>
                  <select 
                    className="form-select"
                    value={formData.meal_structure.meals_count}
                    onChange={(e) => updateNested('meal_structure', 'meals_count', e.target.value)}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '0.84rem' }}
                  >
                    <option value="3_meals">3 وجبات رئيسية فقط</option>
                    <option value="3_meals_snack">3 وجبات رئيسية + سناك خفيف (الموصى به)</option>
                    <option value="4_to_5_meals">4 إلى 5 وجبات صغيرة موزعة</option>
                  </select>
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label fw-bold text-dark small mb-2">تطبيق الصيام المتقطع</label>
                  <select 
                    className="form-select"
                    value={formData.meal_structure.intermittent_fasting}
                    onChange={(e) => updateNested('meal_structure', 'intermittent_fasting', e.target.value)}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '0.84rem' }}
                  >
                    <option value="none">لا أفضله (توزيع مرن على مدار اليوم)</option>
                    <option value="16_8">نعم، صيام 16 ساعة وإفطار 8 ساعات</option>
                    <option value="14_10">نعم، صيام 14 ساعة وإفطار 10 ساعات</option>
                  </select>
                </div>
              </div>

              {/* Q12: Disliked Foods Capsules */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-2">الأطعمة غير المرغوبة (استبعاد اختياري من الوصفات)</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {['جبن قريش', 'تونة', 'كبدة', 'بيض مسلوق', 'شوفان', 'سمك سلمون'].map((food) => {
                    const isChecked = formData.disliked_foods.includes(food);
                    return (
                      <button 
                        key={food}
                        type="button"
                        onClick={() => toggleArrayItem('disliked_foods', food)}
                        className={`btn btn-sm rounded-pill px-3 py-1.5 ${isChecked ? 'btn-secondary text-white' : 'btn-light border'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {isChecked ? `✕ ${food}` : food}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              SCREEN 4: بيئة التدريب، الاستهداف، ورفع الملفات (Training & Uploads)
              ========================================================================= */}
          {currentStep === 4 && (
            <div>
              <div className="mb-4 pb-2 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                <h5 className="fw-black text-dark mb-1" style={{ color: '#0F172A' }}>4. بيئة التدريب، الأهداف الحركية، ورفع الملفات</h5>
                <small className="text-muted" style={{ fontSize: '0.82rem' }}>لبناء جدول التمارين المخصص ورفع صور القوام المشفرة</small>
              </div>

              {/* Q13: Training Environment */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">مكان التمرين والأدوات المتاحة</label>
                <div className="row g-2">
                  {[
                    { id: 'commercial_gym', title: 'جيم تجاري متكامل', desc: 'أجهزة، كابلات، وأوزان حرة كاملة' },
                    { id: 'home_gym', title: 'جيم منزلي متطور', desc: 'دمبلز قابلة للتعديل + بنش + عقلة' },
                    { id: 'minimal_equipment', title: 'أدوات منزلية خفيفة', desc: 'دمبلز وزن ثابت أو أشرطة مقاومة' },
                    { id: 'calisthenics_bands', title: 'وزن الجسم فقط (Calisthenics)', desc: 'تمارين بوزن الجسم بدون أوزان خارجية' }
                  ].map((env) => (
                    <div className="col-sm-6 col-12" key={env.id}>
                      <div 
                        onClick={() => setFormData(p => ({ ...p, training_environment: env.id }))}
                        className={`p-3 rounded-3 border h-100 ${formData.training_environment === env.id ? 'border-primary' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          background: formData.training_environment === env.id ? '#E5F0FF' : '#FFFFFF',
                          borderColor: formData.training_environment === env.id ? '#0284C7' : '#E2E8F0'
                        }}
                      >
                        <strong className="d-block text-dark mb-1" style={{ fontSize: '0.86rem' }}>{env.title}</strong>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>{env.desc}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q14: Training Logistics (Days & Level) */}
              <div className="row g-3 mb-4">
                <div className="col-md-6 col-12">
                  <label className="form-label fw-bold text-dark small mb-2">أيام التمرين المتاحة أسبوعياً</label>
                  <div className="d-flex gap-2">
                    {[3, 4, 5, 6].map((days) => (
                      <button 
                        key={days}
                        type="button"
                        onClick={() => updateNested('training_logistics', 'days_per_week', days)}
                        className={`btn flex-fill py-2 rounded-3 fw-bold font-monospace ${formData.training_logistics.days_per_week === days ? 'btn-primary' : 'btn-light border'}`}
                        style={{ fontSize: '0.9rem' }}
                      >
                        {days} أيام
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <label className="form-label fw-bold text-dark small mb-2">المستوى التدريبي الفعلي</label>
                  <select 
                    className="form-select"
                    value={formData.training_logistics.experience_level}
                    onChange={(e) => updateNested('training_logistics', 'experience_level', e.target.value)}
                    style={{ height: '44px', borderRadius: '12px', borderColor: '#E2E8F0', fontSize: '0.84rem' }}
                  >
                    <option value="beginner">مبتدئ (أقل من سنة تمرين منتظم)</option>
                    <option value="intermediate">متوسط (1 إلى 3 سنوات تمرين منتظم)</option>
                    <option value="advanced">متقدم (أكثر من 3 سنوات مع إتقان التكنيك)</option>
                  </select>
                </div>
              </div>

              {/* Q15: Focus Muscles (Max 2) */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small mb-2">عضلات التركيز والأولوية (اختر بحد أقصى عضلتين)</label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { key: 'upper_chest', label: 'الصدر العلوي (Upper Chest)' },
                    { key: 'lats_width', label: 'عرض الظهر (Lats Width)' },
                    { key: 'side_delts', label: 'الكتف الجانبي (Side Delts)' },
                    { key: 'arms', label: 'الذراعين (Arms)' },
                    { key: 'glutes_legs', label: 'الجلوتس والأرجل (Glutes / Legs)' }
                  ].map((m) => {
                    const isChecked = formData.focus_muscles.includes(m.key);
                    return (
                      <button 
                        key={m.key}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            toggleArrayItem('focus_muscles', m.key);
                          } else if (formData.focus_muscles.length < 2) {
                            toggleArrayItem('focus_muscles', m.key);
                          } else {
                            alert('يمكنك اختيار عضلتين فقط كأولوية قصوى لضمان عدم الإجهاد العضلي.');
                          }
                        }}
                        className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${isChecked ? 'btn-primary' : 'btn-light border'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q16: Secure Media Uploads (Front, Side, Back Photos) */}
              <div className="p-3 rounded-3 mb-4" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="ti ti-lock text-success fs-5"></i>
                  <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.88rem' }}>رفع صور القوام المشفرة (خاصة بالكوتش فقط)</h6>
                </div>
                <p className="text-muted small mb-3" style={{ fontSize: '0.76rem' }}>
                  تُرفع الصور بأمان تام وتُشفر على الخزينة السحابية لتقييم توزيع الدهون ونقاط الضعف العضلية (3 زوايا: أمامية، جانبية، خلفية).
                </p>

                <div className="row g-2 text-center">
                  {['أمامية (Front)', 'جانبية (Side)', 'خلفية (Back)'].map((angle, idx) => (
                    <div className="col-4" key={idx}>
                      <div className="p-3 bg-white border rounded-3 text-center" style={{ borderColor: '#CBD5E1', borderStyle: 'dashed' }}>
                        <i className="ti ti-camera fs-4 text-muted mb-1 d-block"></i>
                        <span className="fw-bold d-block text-dark" style={{ fontSize: '0.76rem' }}>{angle}</span>
                        <small className="text-success fw-bold" style={{ fontSize: '0.7rem' }}>جاهز للرفع</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-lg w-100 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{ height: '48px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', fontSize: '0.96rem' }}
              >
                {submitting ? (
                  <span>جاري معالجة وإرسال الاستمارة...</span>
                ) : (
                  <>
                    <i className="ti ti-circle-check fs-5"></i>
                    <span>إرسال الاستمارة واعتماد البيانات</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* Stepper Navigation Footer */}
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top" style={{ borderColor: '#F1F5F9' }}>
            <button 
              type="button" 
              onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
              disabled={currentStep === 1}
              className="btn btn-light rounded-pill px-4 fw-bold border"
              style={{ fontSize: '0.84rem' }}
            >
              <i className="ti ti-arrow-right me-1"></i> السابق
            </button>

            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={() => setCurrentStep(p => Math.min(4, p + 1))}
                className="btn btn-primary rounded-pill px-4 fw-bold text-white"
                style={{ fontSize: '0.84rem', background: 'linear-gradient(135deg, #58B4E5 0%, #0284C7 100%)', border: 'none' }}
              >
                <span>التالي</span> <i className="ti ti-arrow-left ms-1"></i>
              </button>
            ) : (
              <span className="small text-muted fw-bold">الخطوة الأخيرة (4 من 4)</span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
