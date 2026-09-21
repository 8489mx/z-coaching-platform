import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Ruler, Lock, Camera, CheckCircle2, HeartPulse, Utensils, Dumbbell, RotateCw, Scale, ShieldAlert, MessageCircle, Upload, Trash2 } from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { optimizeImageFile, optimizeMultipleFiles } from '../utils/imageOptimizer';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';
import CurvedSelect from '../components/common/CurvedSelect';
import { HEALTH_DATA_CONSENT_TEXT_AR, hasHealthDataConsent, buildHealthDataConsent } from '../config/healthDataConsent';

const DEFAULT_MASTER_INTAKE = {
  // Mandatory health-data processing consent (PDPL), given before any answer leaves the device.
  health_data_consent: { accepted: false, version: '', accepted_at: '' },

  // Screen 1: Biometrics & Target
  gender: 'male',
  age: '',
  height_cm: '',
  weight_kg: '',
  circumferences: {
    neck_cm: '',
    waist_cm: '',
    hips_cm: ''
  },
  primary_goal: 'recomposition',
  neat_level: 'moderate',
  average_daily_steps: 'unknown',
  occupation_type: 'DESK_OFFICE',

  // Screen 2: Clinical & Injury Matrix
  dangerous_symptoms: ['NONE'],
  medical_conditions: {
    has_conditions: false,
    selected: [],
    bariatric: { is_operated: false, meal_capacity_grams: '150_200', dumping_syndrome: false },
    diabetes: { type: 'type2', uses_insulin: false, hba1c: '' },
    favism_g6pd: false,
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false },
    hypertension: false,
    gout: false
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
  current_meds_supplements_list: [],
  current_meds_supplements: '',

  // Screen 3: Nutrition & Lifestyle
  religion: 'MUSLIM',
  christianFastingStyle: 'PESCATARIAN_ALLOWED',
  strict_allergies: [],
  food_budget: 'MEDIUM',
  food_prep_ability: 'FULL_KITCHEN',
  meal_structure: {
    meals_count: '3_meals_snack',
    intermittent_fasting: 'none'
  },
  beverage_sugar_intake: 'zero_or_sweetener',
  sleep_schedule: {
    pattern: 'regular_night', // 'regular_night' | 'rotating_shifts' | 'night_shift' | 'irregular'
    average_hours: '7_8',
    bedtime_hour: '23:00'
  },
  disliked_foods: [],

  // Screen 4: Training & Media
  training_environment: 'commercial_gym',
  training_logistics: {
    days_per_week: 4,
    experience_level: 'intermediate',
    has_other_sports: false,
    sports_name: '',
    hours_per_week: ''
  },
  recent_training: 'ACTIVE',
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

function cleanArabicNumStr(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
}

export default function FullIntakeForm() {
  const _navigate = useNavigate();
  const location = useLocation();
  const coachConfig = useMemo(() => getStoredCoachConfig() || {}, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_MASTER_INTAKE);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(null);
  const [_renderError, _setRenderError] = useState(null);

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
          setFormData(_prev => deepMerge(DEFAULT_MASTER_INTAKE, data.submission.answers));
        }
      } else {
        // Try local storage draft fallback
        const localDraft = localStorage.getItem(`z_intake_${code}_${phone}`);
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            setFormData(_prev => deepMerge(DEFAULT_MASTER_INTAKE, parsed));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to fetch intake draft:', e);
    } finally {
      setLoadingDraft(false);
    }
  };

  const consentGiven = hasHealthDataConsent(formData);

  // Auto-Save Effect (the server draft starts only after the health-data consent)
  useEffect(() => {
    if (loadingDraft || submittedSuccess) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const code = sessionStorage.getItem('z_client_code') || 'guest';
      const phone = sessionStorage.getItem('z_client_phone') || '0000000000';

      try {
        localStorage.setItem(`z_intake_${code}_${phone}`, JSON.stringify(formData));
        if (code !== 'guest' && consentGiven) {
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
      } catch {
        setSaveStatus('saved');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [formData, currentStep, loadingDraft, submittedSuccess, consentGiven]);

  const toggleHealthDataConsent = () => {
    setFormData(prev => ({
      ...prev,
      health_data_consent: hasHealthDataConsent(prev)
        ? { accepted: false, version: '', accepted_at: '' }
        : buildHealthDataConsent()
    }));
  };

  const goToStep = (step) => {
    if (step > 1 && !consentGiven) {
      setCurrentStep(1);
      return;
    }
    setCurrentStep(step);
  };

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

  const handleLabReportsUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const optimizedUrls = await optimizeMultipleFiles(files, { maxWidth: 1800, maxHeight: 1800, quality: 0.84 });
      if (optimizedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          media_uploads: {
            ...(prev.media_uploads || {}),
            medical_reports_urls: [
              ...(prev.media_uploads?.medical_reports_urls || []),
              ...optimizedUrls
            ]
          }
        }));
      }
    } catch (err) {
      console.warn('Error optimizing lab report files:', err);
    }
  };

  const handleSingleMediaUpload = async (field, e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      const optimizedUrl = await optimizeImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      if (optimizedUrl) {
        setFormData(prev => ({
          ...prev,
          media_uploads: {
            ...(prev.media_uploads || {}),
            [field]: optimizedUrl
          }
        }));
      }
    } catch (err) {
      console.warn(`Error optimizing media upload for ${field}:`, err);
    }
  };

  const handleRemoveMedia = (field) => {
    setFormData(prev => ({
      ...prev,
      media_uploads: {
        ...(prev.media_uploads || {}),
        [field]: ''
      }
    }));
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
    if (!consentGiven) {
      alert('يجب الموافقة على معالجة البيانات الصحية في بداية الاستمارة قبل الإرسال.');
      setCurrentStep(1);
      return;
    }
    if (!formData.height_cm || !formData.weight_kg || !formData.age) {
      alert('يرجى التأكد من ملء الطول، الوزن، والسن في الخطوة الأولى.');
      setCurrentStep(1);
      return;
    }
    if (!formData.circumferences?.waist_cm) {
      alert('يرجى إدخال محيط الخصر (الوسط) للتمكن من حساب نسبة الدهون والمتابعة بدقة.');
      setCurrentStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const rawCode = sessionStorage.getItem('z_client_code') || localStorage.getItem('kz_client_code') || '1';
      const code = String(rawCode).replace(/^#+/, '').trim();
      const phone = sessionStorage.getItem('z_client_phone') || localStorage.getItem('kz_client_phone') || '01000000000';

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
            كود المشترك: #{String(sessionStorage.getItem('z_client_code') || localStorage.getItem('kz_client_code') || '1').replace(/^#+/, '')}
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
            href={`https://wa.me/${formatWhatsAppPhone(coachConfig?.whatsappNumber || coachConfig?.supportWhatsapp || '201001060503')}`} 
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
  const _diabetes = medConditions.diabetes || {};
  const injuriesMap = formData.injuries_map || {};
  const injuriesSelected = Array.isArray(injuriesMap.selected_areas) ? injuriesMap.selected_areas : [];
  const strictAllergies = Array.isArray(formData.strict_allergies) ? formData.strict_allergies : [];
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
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <div 
                  key={s.id}
                  onClick={() => goToStep(s.id)}
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
          <div style={{ height: '6px', width: '100%', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(currentStep / 4) * 100}%`,
                background: '#0F172A',
                height: '100%',
                borderRadius: '9999px',
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

              {/* Mandatory health-data processing consent (PDPL) */}
              <div style={{ background: consentGiven ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${consentGiven ? '#BBF7D0' : '#FDE68A'}`, borderRadius: '12px', padding: '14px' }}>
                <div
                  role="checkbox"
                  aria-checked={consentGiven}
                  tabIndex={0}
                  onClick={toggleHealthDataConsent}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleHealthDataConsent(); } }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
                >
                  <span style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '8px', border: `2px solid ${consentGiven ? '#16A34A' : '#94A3B8'}`, background: consentGiven ? '#16A34A' : '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                    {consentGiven && <Check size={14} color="#FFFFFF" />}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#0F172A', lineHeight: 1.8, fontWeight: 600 }}>
                    <strong style={{ display: 'block', fontWeight: 900, marginBottom: '2px' }}>
                      <Lock size={13} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                      موافقة إلزامية على معالجة البيانات الصحية
                    </strong>
                    {HEALTH_DATA_CONSENT_TEXT_AR}
                  </span>
                </div>
                {!consentGiven && (
                  <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#92400E', fontWeight: 700 }}>
                    لن يتم حفظ أو إرسال أي بيانات، ولن تنتقل للخطوة التالية، قبل الموافقة.
                  </p>
                )}
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
                    type="text" 
                    inputMode="numeric"
                    placeholder="مثال: 26"
                    value={formData.age || ''}
                    onChange={(e) => setFormData(p => ({ ...p, age: cleanArabicNumStr(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
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
                    type="text" 
                    inputMode="numeric"
                    placeholder="مثال: 180"
                    value={formData.height_cm || ''}
                    onChange={(e) => setFormData(p => ({ ...p, height_cm: cleanArabicNumStr(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
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
                    type="text" 
                    inputMode="decimal"
                    placeholder="مثال: 82.5"
                    value={formData.weight_kg || ''}
                    onChange={(e) => setFormData(p => ({ ...p, weight_kg: cleanArabicNumStr(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', margin: 0 }}>
                        محيط الرقبة (سم)
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>(اختياري)</span>
                    </div>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="عند أضيق نقطة"
                      value={circumferences.neck_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'neck_cm', cleanArabicNumStr(e.target.value))}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px',
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

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      محيط الخصر (إلزامي) *
                    </label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="عند مستوى السرة"
                      value={circumferences.waist_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'waist_cm', cleanArabicNumStr(e.target.value))}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px',
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
                        محيط الحوض (سم)
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>(اختياري)</span>
                    </div>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="أعرض نقطة بالحوض"
                      value={circumferences.hips_cm || ''}
                      onChange={(e) => updateNested('circumferences', 'hips_cm', cleanArabicNumStr(e.target.value))}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px',
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
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '6px', fontWeight: 600 }}>
                  قياسهما يجعل حساب نسبة الدهون والسعرات أدق
                </div>
              </div>

              {/* Primary Physiological Goal (2x2 Cards Grid) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  الهدف الفسيولوجي الرئيسي *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'fat_loss', title: 'نزول دهون ووزن', desc: 'تخس وتنشّف مع الحفاظ على عضلاتك' },
                    { id: 'lean_bulk', title: 'زيادة عضل ووزن', desc: 'عضلاتك تكبر بزيادة وزن محسوبة من غير كرش' },
                    { id: 'recomposition', title: 'نزول دهون مع شد وبناء عضل', desc: 'الوزن ممكن يفضل قريب، بس الدهون بتنزل والعضل بيزيد والشكل بيتغير' },
                    { id: 'general_fitness', title: 'صحة ولياقة عامة', desc: 'طاقة أحسن ونفَس أطول وحركة أسهل' },
                    { id: 'coach_decides', title: 'مش متأكد، سيب الكوتش يحدد', desc: 'بنحدد الهدف الأنسب ليك من قياساتك، والكوتش يراجعه معاك' }
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
                <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#334155', fontWeight: 700, lineHeight: '1.5' }}>
                  مهما كان اختيارك، هنوصلك لأفضل فورمة ممكنة.
                </p>
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

              {/* Average daily steps (from the phone's health app when known) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  متوسط خطواتك في اليوم
                </label>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  تلاقيها في تطبيق الصحة على موبايلك (متوسط آخر أسبوع). لو مش عارف اختار "مش عارف".
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { id: 'under_3000', title: 'أقل من 3000' },
                    { id: '3000_6000', title: '3000 - 6000' },
                    { id: '6000_9000', title: '6000 - 9000' },
                    { id: 'over_9000', title: 'أكتر من 9000' },
                    { id: 'unknown', title: 'مش عارف' }
                  ].map((opt) => {
                    const isSelected = formData.average_daily_steps === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setFormData(p => ({ ...p, average_daily_steps: opt.id }))}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                          background: isSelected ? '#F1F5F9' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0F172A'
                        }}
                      >
                        {opt.title}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Occupation Type (نوع وظيفتك أو عملك الأساسي لضبط النشاط المهني) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  طبيعة وظيفتك أو عملك الأساسي (تحديد خط الأساس لنشاط NEAT) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'DESK_OFFICE', title: 'مكتبي ثابت', desc: 'جلوس مستمر أمام الكمبيوتر أو المكتب' },
                    { id: 'FIELD_MOBILE', title: 'ميداني متحرك', desc: 'حركة مستمرة وتنقلات وإشراف' },
                    { id: 'MANUAL_LABOR', title: 'عمل بدني شاق', desc: 'جهد عضلي ورفع أحمال طوال اليوم' },
                    { id: 'STUDENT', title: 'طالب جامعي / دراسي', desc: 'حضور محاضرات ودراسة مكتبية' },
                    { id: 'UNEMPLOYED', title: 'لا أعمل حالياً / عمل منزلي', desc: 'نمط حياة منزلي مرن' }
                  ].map((occ) => {
                    const isSelected = (formData.occupation_type || 'DESK_OFFICE') === occ.id;
                    return (
                      <div
                        key={occ.id}
                        onClick={() => setFormData(p => ({ ...p, occupation_type: occ.id }))}
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
                          {occ.title}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                          {occ.desc}
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

              {/* Dangerous Cardiovascular / Exertional Symptoms */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldAlert size={16} color="#DC2626" />
                  <strong style={{ fontSize: '12.5px', color: '#991B1B', fontWeight: 800 }}>
                    فحص الأمان القلبي والوعائي أثناء المجهود البدني:
                  </strong>
                </div>
                <p style={{ fontSize: '11px', color: '#7F1D1D', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  هل تعاني من أي من هذه الأعراض أثناء ممارسة الرياضة أو بذل مجهود؟ (اختر ما ينطبق)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { key: 'NONE', label: 'لا توجد أي أعراض مقلقة (طبيعي)' },
                    { key: 'CHEST_PAIN', label: 'ألم أو ضغط في الصدر' },
                    { key: 'FAINTING', label: 'دوخة شديدة أو إغماء' },
                    { key: 'SHORTNESS_OF_BREATH', label: 'ضيق تنفس غير طبيعي' },
                    { key: 'PALPITATIONS', label: 'خفقان قلب غير منتظم' }
                  ].map((symptom) => {
                    const currentList = Array.isArray(formData.dangerous_symptoms) ? formData.dangerous_symptoms : ['NONE'];
                    const isChecked = currentList.includes(symptom.key);
                    return (
                      <button
                        key={symptom.key}
                        type="button"
                        onClick={() => {
                          if (symptom.key === 'NONE') {
                            setFormData(p => ({ ...p, dangerous_symptoms: ['NONE'] }));
                          } else {
                            const withoutNone = currentList.filter(k => k !== 'NONE');
                            const next = withoutNone.includes(symptom.key)
                              ? withoutNone.filter(k => k !== symptom.key)
                              : [...withoutNone, symptom.key];
                            setFormData(p => ({ ...p, dangerous_symptoms: next.length === 0 ? ['NONE'] : next }));
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isChecked ? '1px solid #DC2626' : '1px solid #FCA5A5',
                          background: isChecked ? '#DC2626' : '#FFFFFF',
                          color: isChecked ? '#FFFFFF' : '#7F1D1D',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {symptom.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medical Conditions Multi-Select */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                  هل تعاني من أي حالة طبية مشخصة؟
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button type="button" onClick={() => {
                    setFormData(p => ({ ...p, medical_conditions: { ...(p.medical_conditions || {}), has_conditions: true, selected: p.medical_conditions?.selected?.filter(s => s !== 'none') || [] } }));
                  }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: medConditions.has_conditions === true ? '2px solid #2563EB' : '1px solid #CBD5E1', background: medConditions.has_conditions === true ? '#EFF6FF' : '#FFF', color: medConditions.has_conditions === true ? '#1E3A8A' : '#475569', fontWeight: 800, transition: 'all 0.15s ease' }}>نعم</button>
                  <button type="button" onClick={() => {
                    setFormData(p => ({ ...p, medical_conditions: { ...(p.medical_conditions || {}), has_conditions: false, selected: ['none'] } }));
                  }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: medConditions.has_conditions === false ? '2px solid #2563EB' : '1px solid #CBD5E1', background: medConditions.has_conditions === false ? '#EFF6FF' : '#FFF', color: medConditions.has_conditions === false ? '#1E3A8A' : '#475569', fontWeight: 800, transition: 'all 0.15s ease' }}>لا</button>
                </div>

                {medConditions.has_conditions && (
                  <>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      اختر الحالات الطبية أو العمليات التي تنطبق عليك:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { key: 'bariatric_surgery', label: 'تكميم معدة / تحويل مسار' },
                        { key: 'diabetes', label: 'سكري / مقاومة أنسولين' },
                        { key: 'favism_g6pd', label: 'أنيميا الفول (G6PD)' },
                        { key: 'renal', label: 'أمراض الكلى / ضعف وظائف الكلى' },
                        { key: 'hepatic', label: 'أمراض الكبد / دهون على الكبد' },
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
                            onClick={() => toggleCondition(c.key)}
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
                        <CurvedSelect 
                          value={bariatric.meal_capacity_grams || '150_200'}
                          onChange={(e) => updateNested('medical_conditions', 'bariatric', { ...bariatric, meal_capacity_grams: e.target.value })}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px' }}
                        >
                          <option value="under_150">أقل من 150 جم (وجبات مكثفة صغيرة)</option>
                          <option value="150_200">150 إلى 200 جم (المعدل القياسي)</option>
                          <option value="over_200">أكثر من 200 جم</option>
                        </CurvedSelect>
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
              </>)}
              </div>

              {/* Injuries Matrix */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                  هل لديك إصابة أو ألم حالي بالمفاصل؟
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button type="button" onClick={() => {
                    setFormData(p => ({ ...p, injuries_map: { ...(p.injuries_map || {}), has_injuries: true, selected_areas: p.injuries_map?.selected_areas?.filter(s => s !== 'none') || [] } }));
                  }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: injuriesMap.has_injuries === true ? '2px solid #2563EB' : '1px solid #CBD5E1', background: injuriesMap.has_injuries === true ? '#EFF6FF' : '#FFF', color: injuriesMap.has_injuries === true ? '#1E3A8A' : '#475569', fontWeight: 800, transition: 'all 0.15s ease' }}>نعم</button>
                  <button type="button" onClick={() => {
                    setFormData(p => ({ ...p, injuries_map: { ...(p.injuries_map || {}), has_injuries: false, selected_areas: ['none'] } }));
                  }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: injuriesMap.has_injuries === false ? '2px solid #2563EB' : '1px solid #CBD5E1', background: injuriesMap.has_injuries === false ? '#EFF6FF' : '#FFF', color: injuriesMap.has_injuries === false ? '#1E3A8A' : '#475569', fontWeight: 800, transition: 'all 0.15s ease' }}>لا</button>
                </div>

                {injuriesMap.has_injuries && (
                  <>
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
                    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                      <strong style={{ display: 'block', fontSize: '12px', color: '#BE123C', marginBottom: '8px', fontWeight: 800 }}>
                        تحديد طبيعة الإصابة لضبط محرك البدائل الحركية الآمنة:
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>طبيعة الإصابة</label>
                          <CurvedSelect 
                            value={injuriesMap.injury_nature || 'chronic'}
                            onChange={(e) => updateNested('injuries_map', 'injury_nature', e.target.value)}
                            style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px' }}
                          >
                            <option value="chronic">إجهاد تراكمي وتدريجي (Chronic)</option>
                            <option value="acute">حادث أو صدمة مفاجئة (Acute)</option>
                          </CurvedSelect>
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
                  </>
                )}
              </div>

              {/* Current Meds & Supplements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              {/* 4. Recent Bloodwork & Lab Reports Upload Box (اختياري) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <HeartPulse size={16} color="#0284C7" />
                  <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>
                    الفحوصات والتحاليل المخبرية الحديثة (اختياري):
                  </strong>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                  إذا قمت بإجراء تحاليل دم حديثة (خلال آخر 6 أشهر) أو تقرير InBody، يمكنك إرفاق الصور أو ملف PDF هنا ليفحصها الكوتش ويضبط خطتك بدقة إكلينيكية.
                </p>

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '11.5px', color: '#1E3A8A', fontWeight: 700 }}>
                  التقارير والتحاليل قابلة للتخطي الآن، ويمكنك رفعها لاحقاً.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(15,23,42,0.1)'
                  }}>
                    <Upload size={14} color="#C4952D" />
                    <span>اختيار ملف أو صورة من جهازك (JPG / PNG / PDF)</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleLabReportsUpload}
                    />
                  </label>

                  {(formData.media_uploads?.medical_reports_urls?.length > 0) && (
                    <span style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} />
                      تم إرفاق {formData.media_uploads.medical_reports_urls.length} ملف بنجاح
                    </span>
                  )}
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

              {/* Meals Count & Intermittent Fasting (2-Col Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    عدد الوجبات المفضل يومياً
                  </label>
                  <CurvedSelect 
                    value={mealStructure.meals_count || '3_meals_snack'}
                    onChange={(e) => updateNested('meal_structure', 'meals_count', e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px' }}
                  >
                    <option value="3_meals">3 وجبات</option>
                    <option value="3_meals_snack">3 وجبات + سناك</option>
                    <option value="4_to_5_meals">4 إلى 5 وجبات</option>
                  </CurvedSelect>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    تطبيق الصيام المتقطع
                  </label>
                  <CurvedSelect 
                    value={mealStructure.intermittent_fasting || 'none'}
                    onChange={(e) => updateNested('meal_structure', 'intermittent_fasting', e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px' }}
                  >
                    <option value="none">بدون صيام متقطع</option>
                    <option value="16_8">صيام 16/8</option>
                    <option value="14_10">صيام 14/10</option>
                  </CurvedSelect>
                </div>
              </div>

              {/* Food Budget & Kitchen Prep Logistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    الميزانية الأسبوعية لتسوق الأكل الصحي *
                  </label>
                  <CurvedSelect 
                    value={formData.food_budget || 'MEDIUM'}
                    onChange={(e) => setFormData(p => ({ ...p, food_budget: e.target.value }))}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px', background: '#FFFFFF' }}
                  >
                    <option value="LOW">اقتصادية (بيض، تونة، دجاج، قريش)</option>
                    <option value="MEDIUM">متوسطة (دواجن، لحوم، أسماك)</option>
                    <option value="HIGH">مرتفعة (ستيك، سلمون، مكملات)</option>
                  </CurvedSelect>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    قدرتك على تحضير وتجهيز الوجبات *
                  </label>
                  <CurvedSelect 
                    value={formData.food_prep_ability || 'FULL_KITCHEN'}
                    onChange={(e) => setFormData(p => ({ ...p, food_prep_ability: e.target.value }))}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px', background: '#FFFFFF' }}
                  >
                    <option value="FULL_KITCHEN">مطبخ متكامل (أطبخ بنفسي)</option>
                    <option value="REHEAT_ONLY">تسخين فقط (وجبات جاهزة)</option>
                    <option value="NO_KITCHEN">اعتماد على مطاعم صحية</option>
                  </CurvedSelect>
                </div>
              </div>

              {/* Seasonal & Religious Dietary Fasting Preference */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    تفضيلات الصيام الموسمي والديني (لتكييف الوجبات تلقائياً):
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    تبدأ خطتك الحالية اعتيادية وتتكيف تلقائياً عند حلول المواسم
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: formData.religion === 'CHRISTIAN' ? '1fr 1fr' : '1fr', gap: '14px' }}>
                  <div>
                    <CurvedSelect
                      value={formData.religion || 'MUSLIM'}
                      onChange={(e) => setFormData(p => ({ ...p, religion: e.target.value }))}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px', background: '#FFFFFF' }}
                    >
                      <option value="MUSLIM">صيام رمضان (توقيت ليلي)</option>
                      <option value="CHRISTIAN">صيام مسيحي</option>
                      <option value="OTHER">نظام اعتيادي (بدون صيام ديني)</option>
                    </CurvedSelect>
                  </div>

                  {formData.religion === 'CHRISTIAN' && (
                    <div>
                      <CurvedSelect
                        value={formData.christianFastingStyle || 'PESCATARIAN_ALLOWED'}
                        onChange={(e) => setFormData(p => ({ ...p, christianFastingStyle: e.target.value }))}
                        style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12.5px', background: '#FFFFFF' }}
                      >
                        <option value="PESCATARIAN_ALLOWED">نباتي مع سمك (المفضل)</option>
                        <option value="STRICT_VEGAN">نباتي صرف (بدون سمك)</option>
                      </CurvedSelect>
                    </div>
                  )}
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
                            {isChecked ? `${food} (مستبعد)` : food}
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
                            {isChecked ? `${food} (مستبعد)` : food}
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
                            {isChecked ? `${food} (مستبعد)` : food}
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
                            {isChecked ? `${food} (مستبعد)` : food}
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
                    <CurvedSelect
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
                    </CurvedSelect>
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

              {/* Training Days, Level & Recent Background */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    أيام التمرين المتاحة أسبوعياً
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button 
                        key={days}
                        type="button"
                        onClick={() => updateNested('training_logistics', 'days_per_week', days)}
                        style={{
                          height: '38px',
                          borderRadius: '8px',
                          border: (trainingLogistics.days_per_week || 4) === days ? '2px solid #0F172A' : '1px solid #CBD5E1',
                          background: (trainingLogistics.days_per_week || 4) === days ? '#0F172A' : '#FFFFFF',
                          color: (trainingLogistics.days_per_week || 4) === days ? '#FFFFFF' : '#475569',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
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
                  <CurvedSelect 
                    value={trainingLogistics.experience_level || 'intermediate'}
                    onChange={(e) => updateNested('training_logistics', 'experience_level', e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', background: '#FFFFFF' }}
                  >
                    <option value="beginner">مبتدئ (أقل من سنة)</option>
                    <option value="intermediate">متوسط (1 إلى 3 سنوات)</option>
                    <option value="advanced">متقدم (أكثر من 3 سنوات)</option>
                  </CurvedSelect>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    آخر عهد لك بالتمرين المنتظم *
                  </label>
                  <CurvedSelect 
                    value={formData.recent_training || 'ACTIVE'}
                    onChange={(e) => setFormData(p => ({ ...p, recent_training: e.target.value }))}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', background: '#FFFFFF' }}
                  >
                    <option value="ACTIVE">أتمرن حالياً بانتظام</option>
                    <option value="INCONSISTENT">متقطع في آخر 6 شهور</option>
                    <option value="NONE_LAST_4_WEEKS">منقطع منذ 1 إلى 3 شهور</option>
                    <option value="RETURNING_AFTER_LONG_BREAK">عودة بعد انقطاع طويل</option>
                  </CurvedSelect>
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

                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
                  <strong style={{ display: 'block', fontSize: '11.5px', color: '#1E3A8A', fontWeight: 700 }}>
                    الصور والتقارير قابلة للتخطي الآن، ويمكنك رفعها لاحقاً من داخل التطبيق أو إرسالها للكوتش.
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { field: 'front_url', title: 'أمامية (Front)' },
                    { field: 'side_url', title: 'جانبية (Side)' },
                    { field: 'back_url', title: 'خلفية (Back)' }
                  ].map((angle) => {
                    const uploadedUrl = formData.media_uploads?.[angle.field];
                    return (
                      <div 
                        key={angle.field}
                        style={{
                          padding: uploadedUrl ? '8px' : '14px 8px',
                          background: '#FFFFFF',
                          border: uploadedUrl ? '1.5px solid #16A34A' : '1.5px dashed #CBD5E1',
                          borderRadius: '8px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          position: 'relative'
                        }}
                      >
                        {uploadedUrl ? (
                          <>
                            <div style={{ width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden', background: '#0F172A' }}>
                              <img 
                                src={uploadedUrl} 
                                alt={angle.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            </div>
                            <strong style={{ fontSize: '11px', color: '#0F172A', fontWeight: 800 }}>
                              {angle.title}
                            </strong>
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                              <label style={{ flex: 1, padding: '4px 0', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, color: '#334155', cursor: 'pointer', textAlign: 'center' }}>
                                تغيير
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }} 
                                  onChange={(e) => handleSingleMediaUpload(angle.field, e)} 
                                />
                              </label>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveMedia(angle.field)}
                                style={{ padding: '4px 8px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label style={{ cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <Camera size={22} color="#94A3B8" />
                            <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>{angle.title}</strong>
                            <span style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700, padding: '2px 8px', background: '#ECFDF5', borderRadius: '6px' }}>
                              اختيار صورة
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={(e) => handleSingleMediaUpload(angle.field, e)} 
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* InBody Report Section */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
                        تقرير InBody أو فحص نسبة الدهون (اختياري):
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        إذا كان لديك فحص جهاز InBody أو DEXA حديث يمكنك إرفاقه هنا لمطابقة السوائل والكتلة العضلية.
                      </span>
                    </div>

                    {formData.media_uploads?.inbody_report_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} />
                          تم إرفاق تقرير InBody
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedia('inbody_report_url')}
                          style={{ padding: '4px 8px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#DC2626', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}>
                        <Upload size={13} color="#C4952D" />
                        <span>إرفاق تقرير InBody</span>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          style={{ display: 'none' }} 
                          onChange={(e) => handleSingleMediaUpload('inbody_report_url', e)} 
                        />
                      </label>
                    )}
                  </div>
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
                onClick={() => goToStep(Math.min(4, currentStep + 1))}
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
