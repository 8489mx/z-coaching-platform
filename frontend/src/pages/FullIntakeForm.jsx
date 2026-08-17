import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import '../onboarding.css';

import Step1Personal from '../components/intake/Step1Personal';
import Step2Body from '../components/intake/Step2Body';
import Step3Medical from '../components/intake/Step3Medical';
import Step4Nutrition from '../components/intake/Step4Nutrition';
import Step5Training from '../components/intake/Step5Training';
import Step6Review from '../components/intake/Step6Review';

const DEFAULT_INTAKE = {
  personal: { firstName: '', lastName: '', dateOfBirth: '', sex: 'MALE', residenceCountry: 'EG', guardianConsent: null },
  goals: { primary: 'FAT_LOSS', secondaryTraining: 'GENERAL_STRENGTH' },
  body: { heightCm: 170, weightKg: 70, waistCm: 80, weightTrend: 'STABLE', measurementQuality: 'HIGH', progressPhotosAvailable: true },
  lifestyle: { 
    dailyActivity: 'LIGHT', 
    workSchedule: { type: 'FIXED', physicallyDemandingDays: [] },
    sleep: { averageHours: 7, quality: 'GOOD' },
    stressLevel: 'MODERATE'
  },
  medical: {
    conditions: [],
    dangerousSymptoms: { chestPainOrPressure: 'NO', fainting: 'NO', unusualShortnessOfBreath: 'NO', abnormalPalpitations: 'NO', otherDangerousSymptomsPresent: 'NO', otherDangerousSymptoms: [] },
    medications: [], eatingDisorderHistory: 'NONE', pregnancyStatus: 'NOT_PREGNANT', menstrualStatus: 'REGULAR', unclassifiedText: []
  },
  nutrition: {
    preferredMealCount: 3, unavailableEatingWindows: [], budget: 'MEDIUM', foodStorageAvailable: true, foodReheatingAvailable: true,
    allergies: [], medicalExclusions: [], dislikedFoods: [], intolerances: [], digestiveIssues: []
  },
  training: {
    location: 'GYM', equipment: [], maxDaysPerWeek: 4, preferredDaysPerWeek: 4,
    trainingScheduleAvailabilityType: 'FLEXIBLE', availableTrainingDays: [], unavailableTrainingDays: [],
    maxSessionMinutes: 60, experience: 'BEGINNER', recentTraining: 'NONE_LAST_4_WEEKS', injuries: [], medicalMovementRestrictions: []
  },
  cardio: {
    additionalSports: [], averageDailySteps: 5000, walkingAbility: 'EASY', maxSessionsPerWeek: 2, maxDurationMinutes: 30
  },
  unclassifiedNotes: []
};

const TABS = [
  { id: 'personal', title: 'البيانات الشخصية والأهداف', icon: 'bi-person' },
  { id: 'body', title: 'القياسات الجسدية وأسلوب الحياة', icon: 'bi-rulers' },
  { id: 'medical', title: 'الحالة الطبية والموانع', icon: 'bi-heart-pulse' },
  { id: 'nutrition', title: 'التغذية المفضلة والحساسية', icon: 'bi-egg-fried' },
  { id: 'training', title: 'التدريب والإصابات والكارديو', icon: 'bi-bicycle' },
  { id: 'review', title: 'المراجعة وإرسال الاستمارة', icon: 'bi-send' }
];

export default function FullIntakeForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [saveStatus, setSaveStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const phoneParam = params.get('phone');
    if (codeParam) sessionStorage.setItem('z_client_code', codeParam);
    if (phoneParam) sessionStorage.setItem('z_client_phone', phoneParam);
    
    if (!codeParam) {
      sessionStorage.removeItem('z_client_code');
      sessionStorage.removeItem('z_client_phone');
    }
  }, []);

  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const phoneParam = params.get('phone');
    
    if (codeParam && phoneParam) {
      const storageKey = `z_intake_${codeParam}_${phoneParam}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_INTAKE;
  });

  const handleResetForm = () => {
    if (window.confirm('هل تريد مسح البيانات والبدء باستمارة جديدة فارغة؟')) {
      setFormData(DEFAULT_INTAKE);
      sessionStorage.removeItem('z_client_code');
      sessionStorage.removeItem('z_client_phone');
      setActiveTab('personal');
      setSubmittedSuccess(null);
    }
  };

  // Debounced local & server auto-save
  useEffect(() => {
    const code = sessionStorage.getItem('z_client_code');
    const phone = sessionStorage.getItem('z_client_phone') || formData.personal?.phone;
    if (!code && !phone) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      // 1. Save locally in localStorage
      const storageKey = `z_intake_${code || 'draft'}_${phone || 'phone'}`;
      localStorage.setItem(storageKey, JSON.stringify(formData));
      
      // 2. Calculate progress percent
      let progress = 20;
      if (formData.personal?.firstName && formData.personal?.lastName) progress += 10;
      if (formData.body?.heightCm && formData.body?.weightKg) progress += 20;
      if (formData.medical) progress += 15;
      if (formData.nutrition?.preferredMealCount) progress += 15;
      if (formData.training?.preferredDaysPerWeek) progress += 15;
      progress = Math.min(progress, 95);

      // 3. Sync draft to backend
      try {
        await fetch(`${API_BASE}/api/v1/intake/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            client_code: code || undefined,
            phone_number: phone || '01000000000',
            full_name: `${formData.personal?.firstName || ''} ${formData.personal?.lastName || ''}`.trim() || undefined,
            progress_percent: progress
          })
        });
      } catch (e) {
        // silent fail on network glitch
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = useCallback((section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  }, []);

  const updateNested = useCallback((section, subSection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value
        }
      }
    }));
  }, []);

  const addArrayItem = useCallback((section, field, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...(prev[section][field] || []), defaultItem]
      }
    }));
  }, []);

  const updateArrayItem = useCallback((section, field, index, itemField, value) => {
    setFormData(prev => {
      const newArray = [...(prev[section][field] || [])];
      newArray[index] = {
        ...newArray[index],
        [itemField]: value
      };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  }, []);

  const removeArrayItem = useCallback((section, field, index) => {
    setFormData(prev => {
      const newArray = [...(prev[section][field] || [])];
      newArray.splice(index, 1);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  }, []);

  const handleSubmitIntake = async () => {
    if (!formData.personal.firstName || !formData.personal.lastName) {
      alert('يرجى التأكد من إدخال الاسم الأول واسم العائلة في قسم البيانات الشخصية.');
      setActiveTab('personal');
      return;
    }
    if (!formData.personal.dateOfBirth) {
      alert('يرجى إدخال تاريخ الميلاد، فهو ضروري لحساب العمر في الخطة.');
      setActiveTab('personal');
      return;
    }

    try {
      setSubmitting(true);
      const code = sessionStorage.getItem('z_client_code') || '';
      const phone = sessionStorage.getItem('z_client_phone') || formData.personal.phone || '01000000000';

      const payload = JSON.parse(JSON.stringify(formData));
      if (payload.lifestyle?.workSchedule?.type === 'STANDARD') {
        payload.lifestyle.workSchedule.type = 'FIXED';
      }
      if (payload.lifestyle?.workSchedule?.type === 'NIGHT_SHIFT') {
        payload.lifestyle.workSchedule.type = 'SHIFT_BASED';
      }
      if (!['FIXED', 'VARIABLE', 'SHIFT_BASED'].includes(payload.lifestyle?.workSchedule?.type)) {
        payload.lifestyle.workSchedule.type = 'FIXED';
      }
      if (payload.training?.location === 'GYM') {
        payload.training.equipment = (payload.training.equipment || []).map(eq => ({
          ...eq,
          otherEquipmentText: eq.otherEquipmentText || null
        }));
      }

      const res = await fetch(`${API_BASE}/api/v1/intake/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          client_code: code || undefined,
          phone_number: phone,
          full_name: `${formData.personal.firstName} ${formData.personal.lastName}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.details ? data.details : 'فشل إرسال الاستمارة'));
      }

      if (code && phone) {
        const storageKey = `z_intake_${code}_${phone}`;
        localStorage.removeItem(storageKey);
      }
      sessionStorage.removeItem('z_client_code');
      sessionStorage.removeItem('z_client_phone');

      setSubmittedSuccess({
        client_code: data.client_code || data.user?.client_code || 'جديد',
        full_name: `${formData.personal.firstName} ${formData.personal.lastName}`
      });

    } catch (err) {
      alert('حدث خطأ أثناء إرسال الاستمارة: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="onboarding-layout d-flex align-items-center justify-content-center min-vh-100 p-3" dir="rtl" style={{ background: '#f8fafc' }}>
        <div className="card border-0 shadow-sm p-4 p-md-5 text-center" style={{ maxWidth: '600px', width: '100%', borderRadius: '24px' }}>
          <div className="mb-3 text-success" style={{ fontSize: '5rem' }}>
            <i className="ti ti-circle-check"></i>
          </div>
          
          <h2 className="fw-bold text-dark mb-2">تم استلام استمارتك بنجاح!</h2>
          <p className="text-muted mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
            أهلاً بك يا <strong>{submittedSuccess.full_name}</strong>. تم إرسال جميع إجاباتك وبياناتك بنجاح إلى كابتن كيمو.
            <br />
            يقوم الكابتن الآن بمراجعة حالتك الصحية والبدنية، وتأكيد اشتراكك، وتصميم خطتك التدريبية والغذائية المخصصة لك بالكامل.
          </p>

          <div className="p-3 bg-light rounded-4 border mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">كود المشترك الخاص بك:</span>
              <span className="badge bg-dark font-monospace px-3 py-2 fs-6">{submittedSuccess.client_code}</span>
            </div>
          </div>

          <div className="d-grid gap-2">
            <a 
              href="https://wa.me/201099687766" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-success py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: '1rem' }}
            >
              <i className="ti ti-brand-whatsapp fs-5"></i>
              <span>متابعة حالة الخطة مع الكابتن عبر الواتساب</span>
            </a>

            <button 
              type="button" 
              className="btn btn-outline-secondary py-2 rounded-pill mt-2"
              onClick={handleResetForm}
            >
              تقديم استمارة جديدة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <Step1Personal 
            formData={formData} 
            updateField={updateField} 
            updateNested={updateNested} 
          />
        );
      case 'body':
        return (
          <Step2Body 
            formData={formData} 
            updateField={updateField} 
            updateNested={updateNested} 
          />
        );
      case 'medical':
        return (
          <Step3Medical 
            formData={formData} 
            updateField={updateField} 
            updateNested={updateNested} 
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'nutrition':
        return (
          <Step4Nutrition 
            formData={formData} 
            updateField={updateField} 
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'training':
        return (
          <Step5Training 
            formData={formData} 
            updateField={updateField} 
            addArrayItem={addArrayItem}
            updateArrayItem={updateArrayItem}
            removeArrayItem={removeArrayItem}
          />
        );
      case 'review':
        return (
          <Step6Review 
            submitting={submitting} 
            onSubmit={handleSubmitIntake} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-layout" dir="rtl">
      <div className="intake-layout">
        
        {/* Sidebar Tabs */}
        <div className="intake-sidebar">
          <div className="intake-sidebar-header d-flex justify-content-between align-items-center">
            <div>
              <h2 className="intake-sidebar-title">ملف العميل</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                كود: {sessionStorage.getItem('z_client_code') || 'جديد'}
              </p>
            </div>
            <button 
              type="button"
              onClick={handleResetForm} 
              className="btn btn-outline-danger btn-sm rounded-pill" 
              style={{ fontSize: '0.72rem', padding: '3px 10px' }} 
              title="تفريغ الاستمارة والبدء من جديد"
            >
              استمارة جديدة
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {TABS.map(tab => (
              <div 
                key={tab.id} 
                className={`intake-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`} style={{ fontSize: '1.25rem' }}></i>
                <span>{tab.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="intake-content-area">
          <div className="intake-header">
            <h2 className="intake-header-title">{TABS.find(t => t.id === activeTab)?.title}</h2>
            
            {/* Auto-save indicator */}
            {saveStatus && (
              <div className={`auto-save-indicator ${saveStatus}`}>
                {saveStatus === 'saving' ? (
                  <><i className="bi bi-arrow-repeat spin"></i> جاري الحفظ...</>
                ) : (
                  <><i className="bi bi-check-circle"></i> تم الحفظ التلقائي</>
                )}
              </div>
            )}
          </div>
          
          <div className="intake-body">
            {renderActiveTab()}
          </div>
          
          <div className="intake-footer">
            <button 
              type="button"
              className="btn btn-secondary" 
              disabled={activeTab === TABS[0].id} 
              onClick={() => {
                const idx = TABS.findIndex(t => t.id === activeTab);
                if (idx > 0) setActiveTab(TABS[idx - 1].id);
              }}
            >
              السابق
            </button>
            <button 
              type="button"
              className="btn btn-primary" 
              disabled={activeTab === TABS[TABS.length - 1].id}
              onClick={() => {
                const idx = TABS.findIndex(t => t.id === activeTab);
                if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
              }}
            >
              التالي
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
