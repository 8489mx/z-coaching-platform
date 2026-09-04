import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Ruler, Lock, Camera, CheckCircle2, Activity, HeartPulse, Utensils, Dumbbell, Sparkles, RotateCw, User, Scale, ShieldAlert, MessageCircle, AlertCircle, FileCheck2, Info, RefreshCcw } from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';

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
  current_meds_supplements_list: [],
  current_meds_supplements: '',

  // Screen 3: Nutrition & Lifestyle
  strict_allergies: [],
  other_allergies: '',
  cuisine_preference: 'egyptian_traditional',
  meal_structure: {
    meals_count: '3_meals_snack',
    intermittent_fasting: 'none'
  },
  cravings_pattern: 'controlled',
  beverage_sugar_intake: 'zero_or_sweetener',
  sleep_schedule: {
    pattern: 'regular_night', // 'regular_night' | 'rotating_shifts' | 'night_shift' | 'irregular'
    average_hours: '7_8',
    bedtime_hour: '23:00'
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
  { id: 1, title: 'القياسات والأهداف', sub: 'البيانات الفسيولوجية والمحيطات', icon: Scale },
  { id: 2, title: 'السجل الطبي والإصابات', sub: 'الحالات الصحية والمفاصل', icon: HeartPulse },
  { id: 3, title: 'التغذية والمطبخ', sub: 'الحساسيات ونمط الوجبات', icon: Utensils },
  { id: 4, title: 'التدريب والصور', sub: 'بيئة الجيم ورفع الملفات', icon: Dumbbell }
];

/** Safe deep merge utility to ensure no nested objects or arrays are undefined */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export default function FullIntakeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const coachConfig = useMemo(() => getStoredCoachConfig() || {}, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_MASTER_INTAKE);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(null);
  const [renderError, setRenderError] = useState(null);

  // Read URL query params (?code=...&phone=...)
  useEffect(() => {
    try {
      const queryParams = new URLSearchParams(location.search);
      const qCode = queryParams.get('code');
      const qPhone = queryParams.get('phone');

      if (qCode) sessionStorage.setItem('z_client_code', qCode.trim());
      if (qPhone) sessionStorage.setItem('z_client_phone', qPhone.trim());

      const clientCode = sessionStorage.getItem('z_client_code') || localStorage.getItem('kz_client_code') || '';
      const clientPhone = sessionStorage.getItem('z_client_phone') || localStorage.getItem('kz_client_phone') || '';

      if (clientCode) sessionStorage.setItem('z_client_code', clientCode);
      if (clientPhone) sessionStorage.setItem('z_client_phone', clientPhone);

      if (!clientCode || !clientPhone) {
        // If query param is missing and no stored session, we allow direct filling without locking out
        setLoadingDraft(false);
        return;
      }

      fetchInitialData(clientCode, clientPhone);
    } catch (err) {
      console.error('Initialization error:', err);
      setLoadingDraft(false);
    }
  }, [location.search]);

  const fetchInitialData = async (code, phone) => {
    try {
      setLoadingDraft(true);
      const res = await fetch(`${API_BASE}/api/v1/intake/client-draft?client_code=${encodeURIComponent(code)}&phone_number=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (data && data.submission) {
        if (['SUBMITTED', 'REVIEWED', 'LOCKED'].includes(data.submission.status)) {
          setSubmittedSuccess(data.submission);
          return;
        }
        if (data.submission.answers) {
          setFormData(prev => deepMerge(DEFAULT_MASTER_INTAKE, data.submission.answers));
        }
      } else {
        // Try local storage draft fallback
        const localDraft = localStorage.getItem(`z_intake_${code}_${phone}`);
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            setFormData(prev => deepMerge(DEFAULT_MASTER_INTAKE, parsed));
          } catch (e) {}
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
      const code = sessionStorage.getItem('z_client_code') || 'guest';
      const phone = sessionStorage.getItem('z_client_phone') || '0000000000';

      try {
        localStorage.setItem(`z_intake_${code}_${phone}`, JSON.stringify(formData));
        if (code !== 'guest') {
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
        }
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
        ...(prev[parent] || {}),
        [field]: val
      }
    }));
  };

  const toggleArrayItem = (arrayField, item) => {
    setFormData(prev => {
      const current = Array.isArray(prev[arrayField]) ? prev[arrayField] : [];
      if (current.includes(item)) {
        return { ...prev, [arrayField]: current.filter(x => x !== item) };
      } else {
        return { ...prev, [arrayField]: [...current, item] };
      }
    });
  };

  const toggleCondition = (conditionKey) => {
    setFormData(prev => {
      const med = prev.medical_conditions || {};
      const selected = Array.isArray(med.selected) ? med.selected : [];
      const isSelected = selected.includes(conditionKey);
      const newSelected = isSelected ? selected.filter(k => k !== conditionKey) : [...selected.filter(k => k !== 'none'), conditionKey];
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
      const inj = prev.injuries_map || {};
      const selected = Array.isArray(inj.selected_areas) ? inj.selected_areas : [];
      const isSelected = selected.includes(areaKey);
      const newSelected = isSelected ? selected.filter(k => k !== areaKey) : [...selected.filter(k => k !== 'none'), areaKey];
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
      const code = sessionStorage.getItem('z_client_code') || '1';
      const phone = sessionStorage.getItem('z_client_phone') || '01000000000';

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8FAFC' }} dir="rtl">
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <RotateCw size={36} className="animate-spin" style={{ margin: '0 auto 14px auto', color: '#0F172A' }} />
          <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>جاري استرجاع مسودة استمارتك بأمان...</h5>
        </div>
      </div>
    );
  }

  // Submitted Success / Locked View
  if (submittedSuccess) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
        <div style={{ maxWidth: '560px', width: '100%', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFFFFF', padding: '32px 24px', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #A7F3D0' }}>
            <CheckCircle2 size={36} />
          </div>

          <span style={{ display: 'inline-block', background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: '3px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, marginBottom: '12px' }}>
            كود المشترك: #{sessionStorage.getItem('z_client_code') || '1'}
          </span>

          <h3 style={{ fontWeight: 900, color: '#0F172A', fontSize: '20px', margin: '0 0 10px 0' }}>
            تم استلام استمارتك الصحية والرياضية بنجاح!
          </h3>

          <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#64748B', margin: '0 0 20px 0' }}>
            يقوم كابتن {coachConfig?.coachName || 'كريم زكريا'} حالياً بمراجعة قياساتك، مصفوفة إصاباتك، وتفضيلات المطبخ لإعداد خطتك المخصصة بالجرام وميزوسايكل التمارين.
          </p>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', textAlign: 'right', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748B' }}>حالة الملف:</span>
              <strong style={{ color: '#16A34A', fontWeight: 800 }}>قيد المراجعة والاعتماد (SUBMITTED)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>توقيت الإرسال:</span>
              <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{new Date().toLocaleDateString('en-US')}</strong>
            </div>
          </div>

          <a 
            href={`https://wa.me/${(coachConfig?.whatsappNumber || coachConfig?.supportWhatsapp || '201001060503').replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              background: '#16A34A', 
              color: '#FFFFFF', 
              height: '46px', 
              borderRadius: '8px', 
              fontWeight: 800, 
              fontSize: '13.5px', 
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' 
            }}
          >
            <MessageCircle size={18} />
            <span>متابعة حالة الخطة مع الكوتش عبر WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // Safe variables unpacking
  const gender = formData.gender || 'male';
  const circumferences = formData.circumferences || {};
  const medConditions = formData.medical_conditions || {};
  const medSelected = Array.isArray(medConditions.selected) ? medConditions.selected : [];
  const bariatric = medConditions.bariatric || {};
  const diabetes = medConditions.diabetes || {};
  const injuriesMap = formData.injuries_map || {};
  const injuriesSelected = Array.isArray(injuriesMap.selected_areas) ? injuriesMap.selected_areas : [];
  const strictAllergies = Array.isArray(formData.strict_allergies) ? formData.strict_allergies : [];
  const cuisine = formData.cuisine_preference || 'egyptian_traditional';
  const mealStructure = formData.meal_structure || {};
  const dislikedFoods = Array.isArray(formData.disliked_foods) ? formData.disliked_foods : [];
  const trainingEnv = formData.training_environment || 'commercial_gym';
  const trainingLogistics = formData.training_logistics || {};
  const focusMuscles = Array.isArray(formData.focus_muscles) ? formData.focus_muscles : [];

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px 14px', fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Master Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)' }}>
              Z
            </div>
            <div>
              <h5 style={{ fontWeight: 900, color: '#0F172A', margin: 0, fontSize: '16px' }}>
                استمارة التقييم الصحي والرياضي الماستر
              </h5>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                كود المشترك: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>#{sessionStorage.getItem('z_client_code') || '1'}</strong> | هاتف: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, monospace' }}>{sessionStorage.getItem('z_client_phone') || 'غير محدد'}</strong>
              </div>
            </div>
          </div>

          {/* Auto-save status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
            {saveStatus === 'saving' ? (
              <span style={{ color: '#0284C7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RotateCw size={13} className="animate-spin" /> جاري الحفظ التلقائي...
              </span>
            ) : (
              <span style={{ color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} strokeWidth={3} /> مسودتك محفوظة
              </span>
            )}
          </div>
        </div>

        {/* 4-Step Stepper Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {STEPS.map((s) => {
              const StepIcon = s.icon;
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <div 
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    background: isActive ? '#F1F5F9' : 'transparent',
                    border: isActive ? '1px solid #CBD5E1' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? '#0F172A' : isPast ? '#16A34A' : '#F1F5F9',
                      color: (isActive || isPast) ? '#FFFFFF' : '#64748B',
                      boxShadow: isActive ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none'
                    }}
                  >
                    {isPast ? <Check size={14} strokeWidth={3} /> : s.id}
                  </div>
                  <strong style={{ fontSize: '11.5px', color: isActive ? '#0F172A' : isPast ? '#16A34A' : '#64748B', fontWeight: isActive ? 800 : 600 }}>
                    {s.title}
                  </strong>
                </div>
              );
            })}
          </div>

          {/* Progress Track */}
          <div style={{ height: '4px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(currentStep / 4) * 100}%`,
                background: '#0F172A',
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Main Card Container */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)', marginBottom: '18px' }}>

          {/* =========================================================================
              SCREEN 1: القياسات الفسيولوجية ومعدل النشاط (Biometrics & Target)
              ========================================================================= */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: '15.5px', margin: '0 0 3px 0' }}>
                  1. القياسات الفسيولوجية ومعدل النشاط
                </h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  البيانات الأساسية لتشغيل معادلة الأيض BMR ونسبة الدهون U.S. Navy بدقة سريرية.
                </p>
              </div>

              {/* Gender Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  الجنس (Biological Sex) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      border: gender === 'male' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      background: gender === 'male' ? '#0F172A' : '#FFFFFF',
                      color: gender === 'male' ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                      boxShadow: gender === 'male' ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none'
                    }}
                  >
                    ذكر (Male)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      border: gender === 'female' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      background: gender === 'female' ? '#0F172A' : '#FFFFFF',
                      color: gender === 'female' ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                      boxShadow: gender === 'female' ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none'
                    }}
                  >
                    أنثى (Female)
                  </button>
                </div>
              </div>

              {/* Age / Height / Weight (3-Col Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '5px' }}>
                    السن (بالسنوات) *
                  </label>
                  <input 
                    type="number" 
                    placeholder="مثال: 26"
                    value={formData.age || ''}
                    onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, Cairo',
                      boxSizing: 'border-box'
                    }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '5px' }}>
                    الطول (سم) *
                  </label>
                  <input 
                    type="number" 
                    placeholder="مثال: 180"
                    value={formData.height_cm || ''}
                    onChange={(e) => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, Cairo',
                      boxSizing: 'border-box'
                    }}
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '5px' }}>
                    الوزن الحالي (كجم) *
                  </label>
                  <input 
                    type="number" 
                    placeholder="مثال: 82.5"
                    value={formData.weight_kg || ''}
                    onChange={(e) => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, Cairo',
                      boxSizing: 'border-box'
                    }}
                    required 
                  />
                </div>
              </div>

              {/* Tape Measurements Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Ruler size={16} color="#0F172A" />
                  <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                    القياسات بالمتر الشريطي (إلزامية لدقة حساب نسبة الدهون):
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      محيط الرقبة (سم) *
                    </label>
                    <input 
                      type="number" 
                      placeholder="عند أضيق نقطة"
                      value={circumferences.neck_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'neck_cm', e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        padding: '0 10px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, Cairo',
                        boxSizing: 'border-box'
                      }}
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      محيط الوسط / البطن (سم) *
                    </label>
                    <input 
                      type="number" 
                      placeholder="عند مستوى السرة"
                      value={circumferences.waist_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'waist_cm', e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        padding: '0 10px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, Cairo',
                        boxSizing: 'border-box'
                      }}
                      required 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', margin: 0 }}>
                        محيط الحوض (سم) {gender === 'female' ? '*' : ''}
                      </label>
                      {gender !== 'female' && (
                        <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>(اختياري)</span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      placeholder="أعرض نقطة بالحوض"
                      value={circumferences.hips_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'hips_cm', e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        padding: '0 10px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, Cairo',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Physiological Goal (2x2 Cards Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  الهدف الفسيولوجي الرئيسي *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'fat_loss', title: 'خسارة دهون حادة (Fat Loss)', desc: 'عجز سعرات مدروس مع الحفاظ التام على الكتلة العضلية' },
                    { id: 'lean_bulk', title: 'بناء كتلة عضلية صافية (Lean Bulk)', desc: 'فائض سعرات خفيف لتضخيم عضلي نظيف بدون دهون' },
                    { id: 'recomposition', title: 'إعادة تشكيل الجسم (Body Recomp)', desc: 'حرق دهون وبناء عضلات في نفس التوقيت' },
                    { id: 'general_fitness', title: 'لياقة عامة وتأهيل بدني (Fitness)', desc: 'تحسين كفاءة القلب والتحمل والصحة العامة' }
                  ].map((goal) => {
                    const isSelected = formData.primary_goal === goal.id;
                    return (
                      <div 
                        key={goal.id}
                        onClick={() => setFormData(p => ({ ...p, primary_goal: goal.id }))}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                          {goal.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                          {goal.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEAT Activity Level (3 Cards Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  معدل النشاط اليومي خارج الجيم (NEAT Level) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'sedentary', title: 'خامل / عمل مكتبي', desc: 'جلوس معظم اليوم أمام الشاشات أو قيادة سيارة' },
                    { id: 'moderate', title: 'متوسط النشاط', desc: 'حركة متقطعة ومشي أثناء اليوم والعمل' },
                    { id: 'very_active', title: 'عالي النشاط / عمل ميداني', desc: 'مجهود بدني مستمر أو وقوف شاق طوال اليوم' }
                  ].map((act) => {
                    const isSelected = formData.neat_level === act.id;
                    return (
                      <div 
                        key={act.id}
                        onClick={() => setFormData(p => ({ ...p, neat_level: act.id }))}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>
                          {act.title}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                          {act.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              SCREEN 2: السجل الطبي، العمليات، ومصفوفة الإصابات (Clinical & Injury Matrix)
              ========================================================================= */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: '15.5px', margin: '0 0 3px 0' }}>
                  2. السجل الطبي، العمليات الجراحية، ومصفوفة الإصابات
                </h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  لتفعيل محددات الأمان السريري واستبعاد التمارين أو الأغذية الممنوعة تلقائياً.
                </p>
              </div>

              {/* Medical Conditions Multi-Select */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  الحالات الطبية أو العمليات السابقة (اختر ما ينطبق):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
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
                    const isChecked = medSelected.includes(c.key);
                    return (
                      <button 
                        key={c.key}
                        type="button"
                        onClick={() => {
                          if (c.key === 'none') {
                            setFormData(p => ({ ...p, medical_conditions: { ...(p.medical_conditions || {}), selected: ['none'], has_conditions: false } }));
                          } else {
                            toggleCondition(c.key);
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          background: isChecked ? '#0F172A' : '#FFFFFF',
                          color: isChecked ? '#FFFFFF' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isChecked && ''}
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-bariatric Questions */}
                {medSelected.includes('bariatric_surgery') && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '12px', color: '#0369A1', marginBottom: '8px', fontWeight: 800 }}>
                      تخصيص سعة الوجبات لمتكممي المعدة:
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>
                          سعة الوجبة التقريبية
                        </label>
                        <select 
                          value={bariatric.meal_capacity_grams || '150_200'}
                          onChange={(e) => updateNested('medical_conditions', 'bariatric', { ...bariatric, meal_capacity_grams: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px' }}
                        >
                          <option value="under_150">أقل من 150 جم (وجبات مكثفة صغيرة)</option>
                          <option value="150_200">150 إلى 200 جم (المعدل القياسي)</option>
                          <option value="over_200">أكثر من 200 جم</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>
                          متلازمة الإغراق (Dumping)؟
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'bariatric', { ...bariatric, dumping_syndrome: true })}
                            style={{ height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', background: bariatric.dumping_syndrome ? '#DC2626' : '#FFFFFF', color: bariatric.dumping_syndrome ? '#FFFFFF' : '#0F172A', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                          >نعم</button>
                          <button 
                            type="button" 
                            onClick={() => updateNested('medical_conditions', 'bariatric', { ...bariatric, dumping_syndrome: false })}
                            style={{ height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', background: !bariatric.dumping_syndrome ? '#16A34A' : '#FFFFFF', color: !bariatric.dumping_syndrome ? '#FFFFFF' : '#0F172A', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                          >لا</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Injuries Matrix */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  مواضع الإصابات أو الآلام المفصلية الحالية:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { key: 'none', label: 'لا توجد أي إصابات مفصلية' },
                    { key: 'knee', label: 'إصابات الركبة (صليبي / غضروف / صابونة)' },
                    { key: 'spine_back', label: 'العمود الفقري (انزلاق غضروفي قطني / عنقي)' },
                    { key: 'shoulder', label: 'الكتف (اختناق أوتار / كفة مدورة)' },
                    { key: 'core', label: 'الجدار البطني (انفصال عضلي / فتق)' },
                    { key: 'elbow_wrist', label: 'الكوع أو المعصم' }
                  ].map((inj) => {
                    const isChecked = injuriesSelected.includes(inj.key);
                    return (
                      <button 
                        key={inj.key}
                        type="button"
                        onClick={() => {
                          if (inj.key === 'none') {
                            setFormData(p => ({ ...p, injuries_map: { ...(p.injuries_map || {}), selected_areas: ['none'], has_injuries: false } }));
                          } else {
                            toggleInjuryArea(inj.key);
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                          background: isChecked ? '#FEF2F2' : '#FFFFFF',
                          color: isChecked ? '#DC2626' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isChecked && '• '}
                        {inj.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-injury logic */}
                {injuriesMap.has_injuries && (
                  <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '12px', color: '#BE123C', marginBottom: '8px', fontWeight: 800 }}>
                      تحديد طبيعة الإصابة لضبط محرك البدائل الحركية الآمنة:
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>طبيعة الإصابة</label>
                        <select 
                          value={injuriesMap.injury_nature || 'chronic'}
                          onChange={(e) => updateNested('injuries_map', 'injury_nature', e.target.value)}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px' }}
                        >
                          <option value="chronic">إجهاد تراكمي وتدريجي (Chronic)</option>
                          <option value="acute">حادث أو صدمة مفاجئة (Acute)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>هل يهدأ الألم عند الراحة؟</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          <button 
                            type="button" 
                            onClick={() => updateNested('injuries_map', 'pain_relieved_by_rest', true)}
                            style={{ height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', background: (injuriesMap.pain_relieved_by_rest ?? true) ? '#16A34A' : '#FFFFFF', color: (injuriesMap.pain_relieved_by_rest ?? true) ? '#FFFFFF' : '#0F172A', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                          >نعم يهدأ</button>
                          <button 
                            type="button" 
                            onClick={() => updateNested('injuries_map', 'pain_relieved_by_rest', false)}
                            style={{ height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', background: !(injuriesMap.pain_relieved_by_rest ?? true) ? '#DC2626' : '#FFFFFF', color: !(injuriesMap.pain_relieved_by_rest ?? true) ? '#FFFFFF' : '#0F172A', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                          >لا يستمر</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Smoking & Meds Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    حالة التدخين *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setFormData(p => ({ ...p, smoking_status: 'non_smoker' }))}
                      style={{ height: '38px', borderRadius: '6px', border: formData.smoking_status === 'non_smoker' ? '2px solid #16A34A' : '1px solid #CBD5E1', background: formData.smoking_status === 'non_smoker' ? '#F0FDF4' : '#FFFFFF', color: formData.smoking_status === 'non_smoker' ? '#166534' : '#475569', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      غير مدخن
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData(p => ({ ...p, smoking_status: 'smoker' }))}
                      style={{ height: '38px', borderRadius: '6px', border: formData.smoking_status === 'smoker' ? '2px solid #DC2626' : '1px solid #CBD5E1', background: formData.smoking_status === 'smoker' ? '#FEF2F2' : '#FFFFFF', color: formData.smoking_status === 'smoker' ? '#991B1B' : '#475569', fontWeight: 800, fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      مدخن
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    المكملات الغذائية أو الأدوية التي تتناولها حالياً (اختر كل ما ينطبق):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {[
                      { key: 'none', label: 'لا أتناول أي مكملات أو أدوية' },
                      { key: 'creatine', label: 'كرياتين مونوهيدرات' },
                      { key: 'whey_protein', label: 'واي بروتين / مكمل بروتين' },
                      { key: 'omega3', label: 'أوميجا 3 (زيت سمك)' },
                      { key: 'vitamin_d', label: 'فيتامين د3' },
                      { key: 'multivitamin', label: 'مالتي فيتامين ومعادن' },
                      { key: 'magnesium', label: 'مغنيسيوم جلايسينات' },
                      { key: 'pre_workout', label: 'مشروب طاقة / كافيين بري وورك آوت' },
                      { key: 'hypertension_meds', label: 'أدوية ضغط الدم' },
                      { key: 'diabetes_meds', label: 'أدوية السكر أو الأنسولين' },
                      { key: 'thyroid_meds', label: 'علاج الغدة الدرقية' }
                    ].map((item) => {
                      const currentList = Array.isArray(formData.current_meds_supplements_list) ? formData.current_meds_supplements_list : [];
                      const isChecked = currentList.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (item.key === 'none') {
                              setFormData(p => ({ ...p, current_meds_supplements_list: ['none'] }));
                            } else {
                              setFormData(p => {
                                const list = Array.isArray(p.current_meds_supplements_list) ? p.current_meds_supplements_list.filter(x => x !== 'none') : [];
                                const next = list.includes(item.key) ? list.filter(x => x !== item.key) : [...list, item.key];
                                return { ...p, current_meds_supplements_list: next };
                              });
                            }
                          }}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isChecked ? '1px solid #0F172A' : '1px solid #CBD5E1',
                            background: isChecked ? '#0F172A' : '#FFFFFF',
                            color: isChecked ? '#FFFFFF' : '#475569',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && '• '}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <input 
                    type="text" 
                    placeholder="ملاحظات تفصيلية إضافية عن أسماء الأدوية أو الجرعات للكوتش (اختياري)..."
                    value={formData.current_meds_supplements || ''}
                    onChange={(e) => setFormData(p => ({ ...p, current_meds_supplements: e.target.value }))}
                    style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              SCREEN 3: التغذية، المطبخ، والحساسيات (Nutrition & Culinary Engine)
              ========================================================================= */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: '15.5px', margin: '0 0 3px 0' }}>
                  3. التغذية، المطبخ، والحساسيات الغذائية
                </h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  لبناء سفرة الوجبات الدقيقة من مطبخك المفضل واستبعاد المحظورات.
                </p>
              </div>

              {/* Strict Allergies */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  مصفوفة الحساسيات الغذائية الصارمة (حظر فوري في الوصفات):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { key: 'none', label: 'لا توجد أي حساسية غذائية' },
                    { key: 'eggs', label: 'حساسية بيض' },
                    { key: 'dairy_lactose', label: 'حساسية لاكتوز وألبان' },
                    { key: 'gluten_celiac', label: 'حساسية قمح وجلوتين / سيلياك' },
                    { key: 'peanuts_tree_nuts', label: 'حساسية مكسرات وفول سوداني' },
                    { key: 'fish_shellfish', label: 'حساسية أسماك ومأكولات بحرية' },
                    { key: 'soy', label: 'حساسية فول صويا' },
                    { key: 'sesame_seeds', label: 'حساسية سمسم وطحينة وبذور' },
                    { key: 'favism_g6pd', label: 'بقوليات وأنيميا الفول (G6PD)' },
                    { key: 'strawberries_berries', label: 'حساسية فراولة وتوت' },
                    { key: 'tropical_fruits_mango', label: 'حساسية المانجو والفواكه الاستوائية (مانجو، كيوي)' }
                  ].map((alg) => {
                    const isChecked = strictAllergies.includes(alg.key);
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
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                          background: isChecked ? '#FEF2F2' : '#FFFFFF',
                          color: isChecked ? '#DC2626' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isChecked && '• '}
                        {alg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cuisine Preferences (Cards Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  نمط المطبخ والوجبات المفضل لديك *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'egyptian_traditional', title: 'مطبخ مصري منزلي', desc: 'أرز، خضار مطبوخ، دواجن ولحوم، جبن قريش' },
                    { id: 'gulf_traditional', title: 'مطبخ خليجي غني', desc: 'كبسة، مجبوس، لحوم ودواجن بتوابل شرقية' },
                    { id: 'quick_prep_western', title: 'وجبات عصرية سريعة التحضير', desc: 'شوفان، توست، زبادي يوناني، ستيك وفيليه' },
                    { id: 'keto', title: 'نظام كيتو دايت (Keto)', desc: 'دهون صحية عالية وبروتين مع كارب منعدم' },
                    { id: 'vegetarian_pescatarian', title: 'نظام نباتي مرن', desc: 'اعتماد على الأسماك، البيض، والألبان والنبات' }
                  ].map((cuis) => {
                    const isSelected = cuisine === cuis.id;
                    return (
                      <div 
                        key={cuis.id}
                        onClick={() => setFormData(p => ({ ...p, cuisine_preference: cuis.id }))}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px'
                        }}
                      >
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                          {cuis.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                          {cuis.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Meals Count & Intermittent Fasting (2-Col Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    عدد الوجبات المفضل يومياً
                  </label>
                  <select 
                    value={mealStructure.meals_count || '3_meals_snack'}
                    onChange={(e) => updateNested('meal_structure', 'meals_count', e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px' }}
                  >
                    <option value="3_meals">3 وجبات رئيسية فقط</option>
                    <option value="3_meals_snack">3 وجبات رئيسية + سناك خفيف (الموصى به)</option>
                    <option value="4_to_5_meals">4 إلى 5 وجبات صغيرة موزعة</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    تطبيق الصيام المتقطع
                  </label>
                  <select 
                    value={mealStructure.intermittent_fasting || 'none'}
                    onChange={(e) => updateNested('meal_structure', 'intermittent_fasting', e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px' }}
                  >
                    <option value="none">لا أفضله (توزيع مرن على مدار اليوم)</option>
                    <option value="16_8">نعم، صيام 16 ساعة وإفطار 8 ساعات</option>
                    <option value="14_10">نعم، صيام 14 ساعة وإفطار 10 ساعات</option>
                  </select>
                </div>
              </div>

              {/* Cravings & Hunger Timing (Selectable Cards Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  توقيت نوبات الجوع واشتهاء السكريات (لتوظيف السناكس الذكية):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'controlled', title: 'شهية منضبطة', desc: 'لا أعاني من نوبات جوع مفاجئة، شبع طبيعي طوال اليوم' },
                    { id: 'late_night', title: 'اشتهاء مسائي ليلاً', desc: 'جوع ورغبة في الأكل والتسالي بعد العشاء وقبل النوم' },
                    { id: 'post_meal_sweets', title: 'اشتهاء السكر بعد الوجبات', desc: 'رغبة ملحة في التحلية فور الانتهاء من الغداء أو العشاء' },
                    { id: 'midday_dip', title: 'هبوط طاقة منتصف النهار', desc: 'جوع شديد وتراجع تركيز في منتصف فترة العمل أو بعد الظهر' }
                  ].map((cr) => {
                    const isSelected = (formData.cravings_pattern || 'controlled') === cr.id;
                    return (
                      <div
                        key={cr.id}
                        onClick={() => setFormData(p => ({ ...p, cravings_pattern: cr.id }))}
                        style={{
                          padding: '11px 13px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>
                          {cr.title}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#64748B', lineHeight: '1.4' }}>
                          {cr.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Beverage Sugar Allowance (Tea / Coffee / Drinks) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  استهلاك السكر اليومي في الشاي والقهوة والمشروبات (لتضمينه بدقة في السعرات):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'zero_or_sweetener', title: 'بدون سكر / بدائل دايت', desc: 'أشرب بدون سكر أو أستخدم محليات صفرية (ستيفيا / سكرالوز)' },
                    { id: '1_tsp', title: 'ملعقة صغيرة واحدة (5 جم)', desc: 'تخصيص 20 سعرة (5 جم كارب) للشاي أو القهوة يومياً' },
                    { id: '2_tsp', title: 'ملعقتين صغيرتين (10 جم)', desc: 'تخصيص 40 سعرة (10 جم كارب) للشاي أو القهوة يومياً' },
                    { id: '3_plus_tsp', title: '3 ملاعق أو أكثر', desc: 'تخصيص 60+ سعرة كارب مع توجيه للتحويل للبدائل تدريجياً' }
                  ].map((sug) => {
                    const isSelected = (formData.beverage_sugar_intake || 'zero_or_sweetener') === sug.id;
                    return (
                      <div
                        key={sug.id}
                        onClick={() => setFormData(p => ({ ...p, beverage_sugar_intake: sug.id }))}
                        style={{
                          padding: '11px 13px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>
                          {sug.title}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#64748B', lineHeight: '1.4' }}>
                          {sug.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disliked Foods Categorized Capsules */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  الأطعمة غير المرغوبة (استبعاد اختياري من جدول وجباتك):
                </label>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 10px 0' }}>
                  اضغط على أي صنف لا تستسيغه لاستبعاده فوراً من خطتك واقتراح بدائل مكافئة مكانه:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Proteins */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>مصادر بروتينية:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['جبن قريش', 'تونة', 'كبدة بقري', 'بيض مسلوق', 'سمك سلمون', 'صدور دجاج', 'لحم بقري مفروم', 'أوراك دجاج', 'سمك بلطي', 'جمبري'].map((food) => {
                        const isChecked = dislikedFoods.includes(food);
                        return (
                          <button 
                            key={food}
                            type="button"
                            onClick={() => toggleArrayItem('disliked_foods', food)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                              background: isChecked ? '#FEF2F2' : '#FFFFFF',
                              color: isChecked ? '#DC2626' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isChecked ? `استبعاد: ${food} ✕` : food}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Carbs & Legumes */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>نشويات وبقوليات:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['شوفان', 'أرز أبيض', 'بطاطا حلوة', 'بطاطس مسلوقة', 'مكرونة', 'عدس', 'حمص', 'فول مدمس', 'فاصوليا بيضاء', 'ترمس'].map((food) => {
                        const isChecked = dislikedFoods.includes(food);
                        return (
                          <button 
                            key={food}
                            type="button"
                            onClick={() => toggleArrayItem('disliked_foods', food)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                              background: isChecked ? '#FEF2F2' : '#FFFFFF',
                              color: isChecked ? '#DC2626' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isChecked ? `استبعاد: ${food} ✕` : food}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vegetables */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>خضروات:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['بروكلي', 'سبانخ', 'باذنجان', 'كوسة', 'فاصوليا خضراء', 'قرنبيط', 'مشروم', 'شمندر / بنجر'].map((food) => {
                        const isChecked = dislikedFoods.includes(food);
                        return (
                          <button 
                            key={food}
                            type="button"
                            onClick={() => toggleArrayItem('disliked_foods', food)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                              background: isChecked ? '#FEF2F2' : '#FFFFFF',
                              color: isChecked ? '#DC2626' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isChecked ? `استبعاد: ${food} ✕` : food}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>دهون صحية:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['زبدة فول سوداني', 'أفوكادو', 'زيت زيتون', 'مكسرات ولوز', 'طحينة سمسم'].map((food) => {
                        const isChecked = dislikedFoods.includes(food);
                        return (
                          <button 
                            key={food}
                            type="button"
                            onClick={() => toggleArrayItem('disliked_foods', food)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isChecked ? '1px solid #DC2626' : '1px solid #CBD5E1',
                              background: isChecked ? '#FEF2F2' : '#FFFFFF',
                              color: isChecked ? '#DC2626' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isChecked ? `استبعاد: ${food} ✕` : food}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Sleep Schedule & Shift Work Pattern */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h6 style={{ fontWeight: 900, color: '#0F172A', fontSize: '13.5px', margin: '0 0 3px 0' }}>
                    طبيعة النوم ونظام العمل (شفتات / ليلي)
                  </h6>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
                    تساعدنا في ضبط مواعيد قطع الكافيين (قبل النوم بـ 6 ساعات) وتنظيم توزيع الوجبات.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    نمط عملك ونومك المعتاد:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'regular_night', title: 'نوم ليلي منتظم', desc: 'نوم بالليل واستيقاظ صباحاً' },
                      { id: 'rotating_shifts', title: 'شفتات عمل متغيرة', desc: 'تغير أسبوعي بين صباحي وليلي' },
                      { id: 'night_shift', title: 'شفت ليلي ثابت (سهر)', desc: 'عمل ليلي ونوم بالنهار' },
                      { id: 'irregular', title: 'نوم غير منتظم / مضطرب', desc: 'مواعيد نوم عشوائية' }
                    ].map((pattern) => {
                      const isSelected = (formData.sleep_schedule?.pattern || 'regular_night') === pattern.id;
                      return (
                        <div
                          key={pattern.id}
                          onClick={() => setFormData(p => ({
                            ...p,
                            sleep_schedule: { ...(p.sleep_schedule || {}), pattern: pattern.id }
                          }))}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                            background: isSelected ? '#FFFFFF' : '#F8FAFC',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <strong style={{ fontSize: '11.5px', color: isSelected ? '#0F172A' : '#475569', fontWeight: 800 }}>
                            {pattern.title}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#64748B' }}>
                            {pattern.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      متوسط ساعات النوم اليومية:
                    </label>
                    <select
                      value={formData.sleep_schedule?.average_hours || '7_8'}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        sleep_schedule: { ...(p.sleep_schedule || {}), average_hours: e.target.value }
                      }))}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', background: '#FFFFFF', outline: 'none' }}
                    >
                      <option value="less_than_6">أقل من 6 ساعات (نوم قليل)</option>
                      <option value="6_7">من 6 إلى 7 ساعات</option>
                      <option value="7_8">من 7 إلى 8 ساعات (مثالي)</option>
                      <option value="more_than_8">أكثر من 8 ساعات</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      موعد النوم التقريبي (لحساب توقيت الكافيين):
                    </label>
                    <input
                      type="time"
                      value={formData.sleep_schedule?.bedtime_hour || '23:00'}
                      onChange={(e) => setFormData(p => ({
                        ...p,
                        sleep_schedule: { ...(p.sleep_schedule || {}), bedtime_hour: e.target.value }
                      }))}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', background: '#FFFFFF', outline: 'none' }}
                    />
                  </div>
                </div>

                {(formData.sleep_schedule?.pattern === 'rotating_shifts' || formData.sleep_schedule?.pattern === 'night_shift') && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#92400E', lineHeight: '1.4' }}>
                    <strong>توجيه بروتوكولي للشفتات:</strong> سيتم تفعيل مرونة دمج الوجبات في نافذة استيقاظك، مع قاعدة الكابتن الصارمة بقطع الكافيين قبل النوم بـ 6 ساعات أياً كان موعد نومك.
                  </div>
                )}
              </div>


            </div>
          )}

          {/* =========================================================================
              SCREEN 4: بيئة التدريب، الاستهداف، ورفع الملفات (Training & Uploads)
              ========================================================================= */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h5 style={{ fontWeight: 900, color: '#0F172A', fontSize: '15.5px', margin: '0 0 3px 0' }}>
                  4. بيئة التدريب، الأهداف الحركية، ورفع الملفات
                </h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  لبناء جدول التمارين المخصص ورفع صور القوام المشفرة لتقييم توزيع الدهون.
                </p>
              </div>

              {/* Training Environment (2x2 Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  مكان التمرين والأدوات المتاحة *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'commercial_gym', title: 'جيم تجاري متكامل', desc: 'أجهزة، كابلات، وأوزان حرة كاملة' },
                    { id: 'home_gym', title: 'جيم منزلي متطور', desc: 'دمبلز قابلة للتعديل + بنش + عقلة' },
                    { id: 'minimal_equipment', title: 'أدوات منزلية خفيفة', desc: 'دمبلز وزن ثابت أو أشرطة مقاومة' },
                    { id: 'calisthenics_bands', title: 'وزن الجسم فقط (Calisthenics)', desc: 'تمارين بوزن الجسم بدون أوزان خارجية' }
                  ].map((env) => {
                    const isSelected = trainingEnv === env.id;
                    return (
                      <div 
                        key={env.id}
                        onClick={() => setFormData(p => ({ ...p, training_environment: env.id }))}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px'
                        }}
                      >
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                          {env.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4' }}>
                          {env.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Training Days & Level */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    أيام التمرين المتاحة أسبوعياً
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[3, 4, 5, 6].map((days) => (
                      <button 
                        key={days}
                        type="button"
                        onClick={() => updateNested('training_logistics', 'days_per_week', days)}
                        style={{
                          height: '38px',
                          borderRadius: '6px',
                          border: (trainingLogistics.days_per_week || 4) === days ? '2px solid #0F172A' : '1px solid #CBD5E1',
                          background: (trainingLogistics.days_per_week || 4) === days ? '#0F172A' : '#FFFFFF',
                          color: (trainingLogistics.days_per_week || 4) === days ? '#FFFFFF' : '#475569',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {days} أيام
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    المستوى التدريبي الفعلي
                  </label>
                  <select 
                    value={trainingLogistics.experience_level || 'intermediate'}
                    onChange={(e) => updateNested('training_logistics', 'experience_level', e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px' }}
                  >
                    <option value="beginner">مبتدئ (أقل من سنة تمرين منتظم)</option>
                    <option value="intermediate">متوسط (1 إلى 3 سنوات تمرين منتظم)</option>
                    <option value="advanced">متقدم (أكثر من 3 سنوات مع إتقان التكنيك)</option>
                  </select>
                </div>
              </div>

              {/* Additional Sports Selectable Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  ممارسة رياضات أخرى بجانب الجيم:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { key: 'none', label: 'لا أمارس رياضات أخرى (حديد وجيم فقط)' },
                    { key: 'football_padel', label: 'كرة قدم / بادل' },
                    { key: 'swimming', label: 'سباحة' },
                    { key: 'running_cardio', label: 'جري وماراثون' },
                    { key: 'martial_arts', label: 'فنون قتالية وملاكمة' },
                    { key: 'crossfit', label: 'كروس فيت وتمارين وظيفية' }
                  ].map((sp) => {
                    const isChecked = (trainingLogistics.sports_name || 'none') === sp.key;
                    return (
                      <button
                        key={sp.key}
                        type="button"
                        onClick={() => {
                          updateNested('training_logistics', 'has_other_sports', sp.key !== 'none');
                          updateNested('training_logistics', 'sports_name', sp.key);
                        }}
                        style={{
                          padding: '6px 13px',
                          borderRadius: '16px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          background: isChecked ? '#0F172A' : '#FFFFFF',
                          color: isChecked ? '#FFFFFF' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isChecked && '• '}
                        {sp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Muscles */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  عضلات التركيز والأولوية (اختر بحد أقصى عضلتين):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { key: 'upper_chest', label: 'الصدر العلوي (Upper Chest)' },
                    { key: 'lats_width', label: 'عرض الظهر (Lats Width)' },
                    { key: 'side_delts', label: 'الكتف الجانبي (Side Delts)' },
                    { key: 'arms', label: 'الذراعين (Arms)' },
                    { key: 'glutes_legs', label: 'الجلوتس والأرجل (Glutes / Legs)' }
                  ].map((m) => {
                    const isChecked = focusMuscles.includes(m.key);
                    return (
                      <button 
                        key={m.key}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            toggleArrayItem('focus_muscles', m.key);
                          } else if (focusMuscles.length < 2) {
                            toggleArrayItem('focus_muscles', m.key);
                          } else {
                            alert('يمكنك اختيار عضلتين فقط كأولوية قصوى لضمان عدم الإجهاد العضلي.');
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          background: isChecked ? '#0F172A' : '#FFFFFF',
                          color: isChecked ? '#FFFFFF' : '#475569',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isChecked && ''}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secure Media Upload Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Lock size={15} color="#16A34A" />
                  <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                    رفع صور القوام المشفرة (خاصة بالكوتش فقط):
                  </strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                  تُرفع الصور بأمان تام وتُشفر على الخزينة السحابية لتقييم توزيع الدهون ونقاط الضعف العضلية (3 زوايا: أمامية، جانبية، خلفية).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['أمامية (Front)', 'جانبية (Side)', 'خلفية (Back)'].map((angle, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '16px 8px',
                        background: '#FFFFFF',
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: '8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Camera size={22} color="#94A3B8" />
                      <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>{angle}</strong>
                      <span style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700 }}>جاهز للرفع</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {submitting ? (
                  <span>جاري معالجة وإرسال الاستمارة...</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>إرسال الاستمارة واعتماد البيانات</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* Stepper Navigation Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            <button 
              type="button" 
              onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
              disabled={currentStep === 1}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: currentStep === 1 ? '#94A3B8' : '#0F172A',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ChevronRight size={16} />
              <span>السابق</span>
            </button>

            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={() => setCurrentStep(p => Math.min(4, p + 1))}
                style={{
                  height: '38px',
                  padding: '0 22px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>التالي</span>
                <ChevronLeft size={16} />
              </button>
            ) : (
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 800 }}>
                الخطوة الأخيرة (4 من 4)
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
