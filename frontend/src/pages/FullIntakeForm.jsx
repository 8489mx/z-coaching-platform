import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../onboarding.css';

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
  { id: 'body', title: 'القياسات الجسدية', icon: 'bi-rulers' },
  { id: 'lifestyle', title: 'أسلوب الحياة والنوم', icon: 'bi-brightness-high' },
  { id: 'medical', title: 'الحالة الطبية', icon: 'bi-heart-pulse' },
  { id: 'nutrition', title: 'التغذية المفضلة', icon: 'bi-egg-fried' },
  { id: 'training', title: 'التدريب والإمكانيات', icon: 'bi-bicycle' },
  { id: 'cardio', title: 'الكارديو والنشاط', icon: 'bi-activity' },
  { id: 'review', title: 'المراجعة والإرسال', icon: 'bi-check-circle' }
];

export default function FullIntakeForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  
  // Extract URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const phoneParam = params.get('phone');
    if (codeParam) sessionStorage.setItem('z_client_code', codeParam);
    if (phoneParam) sessionStorage.setItem('z_client_phone', phoneParam);
    
    if (!codeParam) {
      // If entering without URL params, treat as a fresh intake
      sessionStorage.removeItem('z_client_code');
      sessionStorage.removeItem('z_client_phone');
    }
  }, []);

  // Initialize state
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
    }
  };

  // Auto-save logic (debounced)
  useEffect(() => {
    const code = sessionStorage.getItem('z_client_code');
    const phone = sessionStorage.getItem('z_client_phone');
    if (!code) return;

    setSaveStatus('saving');
    
    const handler = setTimeout(() => {
      const storageKey = `z_intake_${code}_${phone}`;
      localStorage.setItem(storageKey, JSON.stringify(formData));
      setSaveStatus('saved');
      
      // Clear 'saved' text after 2 seconds
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);

    return () => clearTimeout(handler);
  }, [formData]);

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const updateNested = (section, subSection, field, value) => {
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
  };

  const addArrayItem = (section, arrayField, defaultObj) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [arrayField]: [...prev[section][arrayField], defaultObj]
      }
    }));
  };

  const updateArrayItem = (section, arrayField, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[section][arrayField]];
      newArray[index] = { ...newArray[index], [field]: value };
      return {
        ...prev,
        [section]: { ...prev[section], [arrayField]: newArray }
      };
    });
  };

  const removeArrayItem = (section, arrayField, index) => {
    setFormData(prev => {
      const newArray = [...prev[section][arrayField]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [section]: { ...prev[section], [arrayField]: newArray }
      };
    });
  };

  // ---------------------------------------------------------
  // Render Sections
  // ---------------------------------------------------------
  
  const renderPersonal = () => (
    <div className="step-content">
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">الاسم الأول</label>
          <input type="text" className="form-control" value={formData.personal.firstName || ''} onChange={e => updateField('personal', 'firstName', e.target.value)} placeholder="مثال: أحمد" required />
        </div>
        <div className="form-group">
          <label className="form-label">اسم العائلة</label>
          <input type="text" className="form-control" value={formData.personal.lastName || ''} onChange={e => updateField('personal', 'lastName', e.target.value)} placeholder="مثال: محمد" required />
        </div>
      </div>
      
      <div className="section-divider"></div>
      <h3 className="section-title">البيانات الشخصية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">تاريخ الميلاد</label>
          <input type="date" className="form-control" 
            value={formData.personal.dateOfBirth} 
            onChange={e => updateField('personal', 'dateOfBirth', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">الجنس</label>
          <div className="choices-grid">
            <div className={`choice-pill ${formData.personal.sex === 'MALE' ? 'selected' : ''}`} onClick={() => updateField('personal', 'sex', 'MALE')}>
              <div className="choice-title">ذكر</div>
            </div>
            <div className={`choice-pill ${formData.personal.sex === 'FEMALE' ? 'selected' : ''}`} onClick={() => updateField('personal', 'sex', 'FEMALE')}>
              <div className="choice-title">أنثى</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">بلد الإقامة</label>
          <input type="text" className="form-control" placeholder="مثل: EG, SA, AE"
            value={formData.personal.residenceCountry} 
            onChange={e => updateField('personal', 'residenceCountry', e.target.value.toUpperCase())} />
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأهداف</h3>
      <div className="form-group">
        <label className="form-label">الهدف الأساسي</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            {v:'FAT_LOSS', l:'خسارة الدهون'}, 
            {v:'MUSCLE_GAIN', l:'بناء العضلات'}, 
            {v:'WEIGHT_MAINTENANCE', l:'المحافظة على الوزن'},
            {v:'GENERAL_HEALTH', l:'تحسين الصحة العامة'},
            {v:'PERFORMANCE', l:'تحسين الأداء الرياضي'},
            {v:'OTHER', l:'أخرى'}
          ].map(g => (
            <div key={g.v} className={`choice-pill ${formData.goals.primary === g.v ? 'selected' : ''}`} onClick={() => updateField('goals', 'primary', g.v)}>
              <div className="choice-title">{g.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">الهدف التدريبي الثانوي</label>
        <select className="form-control" value={formData.goals.secondaryTraining} onChange={e => updateField('goals', 'secondaryTraining', e.target.value)}>
          <option value="GENERAL_STRENGTH">القوة العامة (General Strength)</option>
          <option value="HYPERTROPHY">تضخيم عضلي (Hypertrophy)</option>
          <option value="ENDURANCE">قوة التحمل (Endurance)</option>
          <option value="POWERLIFTING">رفع أثقال (Powerlifting)</option>
        </select>
      </div>
    </div>
  );

  const renderBody = () => (
    <div className="step-content">
      <h3 className="section-title">القياسات الجسدية الحالية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">الطول (سم)</label>
          <input type="number" className="form-control" value={formData.body.heightCm} onChange={e => updateField('body', 'heightCm', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">الوزن (كجم)</label>
          <input type="number" className="form-control" value={formData.body.weightKg} onChange={e => updateField('body', 'weightKg', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">محيط الخصر (سم) - اختياري ولكن مهم</label>
          <input type="number" className="form-control" value={formData.body.waistCm} onChange={e => updateField('body', 'waistCm', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">دقة القياسات المتوفرة لديك</label>
          <select className="form-control" value={formData.body.measurementQuality} onChange={e => updateField('body', 'measurementQuality', e.target.value)}>
            <option value="LOW">منخفضة (تخمين فقط)</option>
            <option value="MEDIUM">متوسطة</option>
            <option value="HIGH">عالية (ميزان دقيق وشريط قياس)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">اتجاه وزنك مؤخراً</label>
          <select className="form-control" value={formData.body.weightTrend} onChange={e => updateField('body', 'weightTrend', e.target.value)}>
            <option value="LOSING">وزني ينزل مؤخراً</option>
            <option value="STABLE">وزني ثابت</option>
            <option value="GAINING">وزني يزداد مؤخراً</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">هل ستوفر صور لتتبع التطور؟</label>
          <div className="choices-grid">
            <div className={`choice-pill ${formData.body.progressPhotosAvailable === true ? 'selected' : ''}`} onClick={() => updateField('body', 'progressPhotosAvailable', true)}>
              <div className="choice-title">نعم، سأوفر صور</div>
            </div>
            <div className={`choice-pill ${formData.body.progressPhotosAvailable === false ? 'selected' : ''}`} onClick={() => updateField('body', 'progressPhotosAvailable', false)}>
              <div className="choice-title">لا، أرفض التصوير</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLifestyle = () => (
    <div className="step-content">
      <h3 className="section-title">النشاط اليومي والعمل</h3>
      <div className="form-group">
        <label className="form-label">مستوى نشاطك اليومي (خارج الجيم)</label>
        <div className="choices-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[{v:'SEDENTARY', l:'خامل (جلوس معظم اليوم)'}, {v:'LIGHT', l:'خفيف (مشي قليل)'}, {v:'MODERATE', l:'متوسط (حركة مستمرة)'}, {v:'HIGH', l:'عالي (عمل بدني)'}, {v:'VERY_HIGH', l:'عالي جداً (عمل شاق مستمر)'}].map(l => (
            <div key={l.v} className={`choice-pill ${formData.lifestyle.dailyActivity === l.v ? 'selected' : ''}`} onClick={() => updateField('lifestyle', 'dailyActivity', l.v)}>
              <div className="choice-title">{l.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-2-col mt-4">
        <div className="form-group">
          <label className="form-label">نوع جدول العمل</label>
          <select className="form-control" value={formData.lifestyle.workSchedule.type} onChange={e => updateNested('lifestyle', 'workSchedule', 'type', e.target.value)}>
            <option value="FIXED">ثابت (مواعيد محددة)</option>
            <option value="VARIABLE">متغير أو مرن</option>
            <option value="SHIFT_BASED">نظام شفتات / ورديات</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">مستوى التوتر العام</label>
          <select className="form-control" value={formData.lifestyle.stressLevel} onChange={e => updateField('lifestyle', 'stressLevel', e.target.value)}>
            <option value="LOW">منخفض</option>
            <option value="MODERATE">متوسط</option>
            <option value="HIGH">عالي</option>
            <option value="SEVERE">شديد</option>
          </select>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">النوم</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">متوسط ساعات النوم يومياً</label>
          <input type="number" step="0.5" className="form-control" value={formData.lifestyle.sleep.averageHours} onChange={e => updateNested('lifestyle', 'sleep', 'averageHours', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">جودة النوم</label>
          <select className="form-control" value={formData.lifestyle.sleep.quality} onChange={e => updateNested('lifestyle', 'sleep', 'quality', e.target.value)}>
            <option value="POOR">سيئة (أستيقظ متعباً)</option>
            <option value="FAIR">مقبولة</option>
            <option value="GOOD">جيدة (نوم عميق)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderMedical = () => (
    <div className="step-content">
      <div className="alert" style={{background: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #ffeeba'}}>
        <strong>تنبيه طبي هام:</strong> يرجى الإجابة بدقة لضمان تصميم خطة آمنة لك. إذا كنت تعاني من حالات حرجة، يجب استشارة الطبيب قبل البدء بأي برنامج رياضي أو غذائي.
      </div>
      
      <h3 className="section-title">حالات طبية مزمنة (إن وجدت)</h3>
      <div className="array-builder">
        {formData.medical.conditions.map((cond, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('medical', 'conditions', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">المرض / الحالة</label>
                <select className="form-control" value={cond.conditionCode} onChange={e => updateArrayItem('medical', 'conditions', idx, 'conditionCode', e.target.value)}>
                  <option value="DIABETES">السكري (بشكل عام)</option>
                  <option value="INSULIN_RESISTANCE">مقاومة الأنسولين</option>
                  <option value="HYPERTENSION">ارتفاع ضغط الدم</option>
                  <option value="HEART_CONDITION">أمراض القلب</option>
                  <option value="KIDNEY_CONDITION">أمراض الكلى</option>
                  <option value="LIVER_CONDITION">أمراض الكبد</option>
                  <option value="THYROID_CONDITION">مشاكل الغدة الدرقية</option>
                  <option value="ANEMIA">أنيميا (فقر الدم)</option>
                  <option value="ASTHMA_OR_RESPIRATORY_CONDITION">ربو أو أمراض تنفسية</option>
                  <option value="DIAGNOSED_DIGESTIVE_CONDITION">أمراض الجهاز الهضمي (مشخصة)</option>
                  <option value="PCOS">تكيس المبايض (PCOS)</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">استقرار الحالة</label>
                <select className="form-control" value={cond.stability} onChange={e => updateArrayItem('medical', 'conditions', idx, 'stability', e.target.value)}>
                  <option value="STABLE">مستقرة ومتحكم بها</option>
                  <option value="UNSTABLE">غير مستقرة</option>
                  <option value="UNKNOWN">غير معروف</option>
                </select>
              </div>
              {cond.conditionCode === 'OTHER' && (
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label">تفاصيل الحالة</label>
                  <input type="text" className="form-control" value={cond.otherConditionText || ''} onChange={e => updateArrayItem('medical', 'conditions', idx, 'otherConditionText', e.target.value)} />
                </div>
              )}
            </div>
            <div className="form-group mt-3">
              <label className="form-label">تعليمات الطبيب المعالج (إن وجدت)</label>
              {(cond.physicianInstructions || []).map((inst, instIdx) => (
                <div key={instIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" className="form-control" value={inst} onChange={e => {
                    const newInst = [...(cond.physicianInstructions || [])];
                    newInst[instIdx] = e.target.value;
                    updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
                  }} placeholder="مثال: يمنع رفع أوزان ثقيلة..." />
                  <button className="btn btn-danger" onClick={() => {
                    const newInst = [...(cond.physicianInstructions || [])];
                    newInst.splice(instIdx, 1);
                    updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
                  }}><i className="bi bi-x"></i></button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm mt-1" onClick={() => {
                const newInst = [...(cond.physicianInstructions || []), ''];
                updateArrayItem('medical', 'conditions', idx, 'physicianInstructions', newInst);
              }}>+ إضافة تعليمات</button>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('medical', 'conditions', { conditionCode: 'THYROID_CONDITION', stability: 'STABLE', physicianInstructions: [] })}>
          + إضافة حالة طبية
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أعراض تحذيرية</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">ألم أو ضغط بالصدر؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.chestPainOrPressure} onChange={e => updateNested('medical', 'dangerousSymptoms', 'chestPainOrPressure', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">إغماء أو دوار شديد؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.fainting} onChange={e => updateNested('medical', 'dangerousSymptoms', 'fainting', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ضيق تنفس غير معتاد؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.unusualShortnessOfBreath} onChange={e => updateNested('medical', 'dangerousSymptoms', 'unusualShortnessOfBreath', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">خفقان قلب غير طبيعي؟</label>
          <select className="form-control" value={formData.medical.dangerousSymptoms.abnormalPalpitations} onChange={e => updateNested('medical', 'dangerousSymptoms', 'abnormalPalpitations', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
        </div>
        <div className="form-group" style={{gridColumn: '1 / -1'}}>
          <label className="form-label">هل توجد أي أعراض تحذيرية أخرى؟</label>
          <select className="form-control mb-2" value={formData.medical.dangerousSymptoms.otherDangerousSymptomsPresent} onChange={e => updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptomsPresent', e.target.value)}>
            <option value="NO">لا</option><option value="YES">نعم</option>
          </select>
          {formData.medical.dangerousSymptoms.otherDangerousSymptomsPresent === 'YES' && (
            <div>
              {(formData.medical.dangerousSymptoms.otherDangerousSymptoms || []).map((sym, symIdx) => (
                <div key={symIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" className="form-control" value={sym} onChange={e => {
                    const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || [])];
                    newSym[symIdx] = e.target.value;
                    updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
                  }} placeholder="اذكر العرض التحذيري" />
                  <button className="btn btn-danger" onClick={() => {
                    const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || [])];
                    newSym.splice(symIdx, 1);
                    updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
                  }}><i className="bi bi-x"></i></button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const newSym = [...(formData.medical.dangerousSymptoms.otherDangerousSymptoms || []), ''];
                updateNested('medical', 'dangerousSymptoms', 'otherDangerousSymptoms', newSym);
              }}>+ إضافة عرض آخر</button>
            </div>
          )}
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأدوية الحالية (Medications)</h3>
      <div className="form-group">
        <label className="form-label">قائمة الأدوية (أضف دواء تلو الآخر)</label>
        {(formData.medical.medications || []).map((med, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="text" className="form-control" value={med} onChange={e => {
              const newMeds = [...(formData.medical.medications || [])];
              newMeds[idx] = e.target.value;
              updateField('medical', 'medications', newMeds);
            }} placeholder="اسم الدواء والجرعة" />
            <button className="btn btn-danger" onClick={() => {
              const newMeds = [...(formData.medical.medications || [])];
              newMeds.splice(idx, 1);
              updateField('medical', 'medications', newMeds);
            }}><i className="bi bi-x"></i></button>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => {
          const newMeds = [...(formData.medical.medications || []), ''];
          updateField('medical', 'medications', newMeds);
        }}>+ إضافة دواء</button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أسئلة أخرى</h3>
      <div className="grid-2-col">
        {formData.personal.sex === 'FEMALE' && (
          <>
            <div className="form-group">
              <label className="form-label">حالة الحمل (للنساء)</label>
              <select className="form-control" value={formData.medical.pregnancyStatus} onChange={e => updateField('medical', 'pregnancyStatus', e.target.value)}>
                <option value="NOT_PREGNANT">لست حاملاً</option>
                <option value="PREGNANT">حامل</option>
                <option value="BREASTFEEDING">مرضعة (Breastfeeding)</option>
                <option value="POSSIBLY_PREGNANT">قد أكون حاملاً</option>
                <option value="NOT_APPLICABLE">لا ينطبق</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">انتظام الدورة الشهرية (Menstrual Status)</label>
              <select className="form-control" value={formData.medical.menstrualStatus} onChange={e => updateField('medical', 'menstrualStatus', e.target.value)}>
                <option value="REGULAR">منتظمة</option>
                <option value="IRREGULAR">غير منتظمة</option>
                <option value="ABSENT">منقطعة</option>
                <option value="NOT_APPLICABLE">لا ينطبق</option>
              </select>
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">تاريخ مع اضطرابات الأكل</label>
          <select className="form-control" value={formData.medical.eatingDisorderHistory} onChange={e => updateField('medical', 'eatingDisorderHistory', e.target.value)}>
            <option value="NONE">لا يوجد</option>
            <option value="PAST_RECOVERED">سابق وتم التعافي</option>
            <option value="CURRENT_ACTIVE">نشط حالياً</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNutrition = () => (
    <div className="step-content">
      <h3 className="section-title">الخيارات المفضلة للوجبات</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">عدد الوجبات المفضل يومياً</label>
          <div className="choices-grid">
            {[2, 3, 4, 5, 6].map(count => (
              <div key={count} className={`choice-pill ${formData.nutrition.preferredMealCount === count ? 'selected' : ''}`} onClick={() => updateField('nutrition', 'preferredMealCount', count)}>
                <div className="choice-title">{count} وجبات</div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">الميزانية المتوفرة للدايت</label>
          <select className="form-control" value={formData.nutrition.budget} onChange={e => updateField('nutrition', 'budget', e.target.value)}>
            <option value="LOW">اقتصادية (Low)</option>
            <option value="MEDIUM">متوسطة (Medium)</option>
            <option value="HIGH">عالية (High)</option>
            <option value="UNLIMITED">مفتوحة (Unlimited)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">هل تمتلك ثلاجة لتخزين الأكل؟</label>
          <select className="form-control" value={String(formData.nutrition.foodStorageAvailable)} onChange={e => updateField('nutrition', 'foodStorageAvailable', e.target.value === 'true')}>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">هل تمتلك وسيلة تسخين (ميكروويف/بوتاجاز) في مكان العمل؟</label>
          <select className="form-control" value={String(formData.nutrition.foodReheatingAvailable)} onChange={e => updateField('nutrition', 'foodReheatingAvailable', e.target.value === 'true')}>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">حساسية الطعام والممنوعات (Allergies)</h3>
      <div className="array-builder">
        {formData.nutrition.allergies.map((allergy, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('nutrition', 'allergies', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">المادة أو الصنف</label>
                <select className="form-control" value={allergy.substance} onChange={e => updateArrayItem('nutrition', 'allergies', idx, 'substance', e.target.value)}>
                  <option value="DAIRY">منتجات الألبان (Dairy)</option>
                  <option value="NUTS">المكسرات (Nuts)</option>
                  <option value="GLUTEN">الجلوتين (Gluten)</option>
                  <option value="SEAFOOD">المأكولات البحرية</option>
                  <option value="EGGS">البيض</option>
                  <option value="SESAME">السمسم</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">هل هي حساسية مشخصة طبياً؟</label>
                <select className="form-control" value={String(allergy.medicallyConfirmed)} onChange={e => updateArrayItem('nutrition', 'allergies', idx, 'medicallyConfirmed', e.target.value === 'true')}>
                  <option value="true">نعم، تم تشخيصها</option>
                  <option value="false">لا، مجرد شك/تجنب شخصي</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'allergies', { substance: 'DAIRY', medicallyConfirmed: true })}>
          + إضافة حساسية طعام
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">عدم تحمل الطعام (Intolerances)</h3>
      <div className="array-builder">
        {formData.nutrition.intolerances.map((intol, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('nutrition', 'intolerances', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">الصنف أو المادة</label>
                <select className="form-control" value={intol.substance} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'substance', e.target.value)}>
                  <option value="LACTOSE">اللاكتوز (Lactose)</option>
                  <option value="GLUTEN">الجلوتين (Gluten)</option>
                  <option value="FODMAP">الفودماب (FODMAP)</option>
                  <option value="HISTAMINE">الهيستامين (Histamine)</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">الحدة (Severity)</label>
                <select className="form-control" value={intol.severity} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'severity', e.target.value)}>
                  <option value="MILD">خفيفة</option>
                  <option value="MODERATE">متوسطة</option>
                  <option value="SEVERE">شديدة</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">هل تم التشخيص طبياً؟</label>
                <select className="form-control" value={String(intol.medicallyDiagnosed)} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'medicallyDiagnosed', e.target.value === 'true')}>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">ملاحظات إضافية</label>
                <input type="text" className="form-control" value={intol.notes || ''} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'notes', e.target.value)} placeholder="مثال: يسبب لي انتفاخ شديد" />
              </div>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'intolerances', { substance: 'LACTOSE', severity: 'MILD', medicallyDiagnosed: false, notes: '' })}>
          + إضافة عدم تحمل طعام
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">مشاكل الهضم (Digestive Issues)</h3>
      <div className="array-builder">
        {formData.nutrition.digestiveIssues.map((issue, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('nutrition', 'digestiveIssues', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">المشكلة</label>
                <select className="form-control" value={issue.name} onChange={e => updateArrayItem('nutrition', 'digestiveIssues', idx, 'name', e.target.value)}>
                  <option value="BLOATING">انتفاخ (Bloating)</option>
                  <option value="ACID_REFLUX">حموضة / ارتجاع مريء (Acid Reflux)</option>
                  <option value="IBS">قولون عصبي (IBS)</option>
                  <option value="CONSTIPATION">إمساك (Constipation)</option>
                  <option value="DIARRHEA">إسهال (Diarrhea)</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">الحدة (Severity)</label>
                <select className="form-control" value={issue.severity} onChange={e => updateArrayItem('nutrition', 'digestiveIssues', idx, 'severity', e.target.value)}>
                  <option value="MILD">خفيفة</option>
                  <option value="MODERATE">متوسطة</option>
                  <option value="SEVERE">شديدة</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'digestiveIssues', { name: 'BLOATING', severity: 'MILD' })}>
          + إضافة مشكلة هضم
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأطعمة المكروهة أو المستبعدة</h3>
      <div className="form-group">
        <label className="form-label">أطعمة لا تفضلها (Disliked Foods)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(formData.nutrition.dislikedFoods || []).map((food, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="text" className="form-control" style={{ border: 'none', background: 'transparent', width: '150px', padding: '0' }} value={food} onChange={e => {
                const newFoods = [...(formData.nutrition.dislikedFoods || [])];
                newFoods[idx] = e.target.value;
                updateField('nutrition', 'dislikedFoods', newFoods);
              }} placeholder="اسم الطعام" />
              <button className="btn btn-sm btn-danger ms-2" style={{ padding: '0.1rem 0.4rem' }} onClick={() => {
                const newFoods = [...(formData.nutrition.dislikedFoods || [])];
                newFoods.splice(idx, 1);
                updateField('nutrition', 'dislikedFoods', newFoods);
              }}><i className="bi bi-x"></i></button>
            </div>
          ))}
          <button className="btn-add-outline" style={{ padding: '0.5rem', marginTop: '0' }} onClick={() => {
            const newFoods = [...(formData.nutrition.dislikedFoods || []), ''];
            updateField('nutrition', 'dislikedFoods', newFoods);
          }}>+ إضافة طعام</button>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أوقات الصيام أو منع الأكل</h3>
      <div className="form-group">
        <label className="form-label">إذا كنت تصوم أو لديك أوقات لا تستطيع الأكل فيها، أضفها هنا</label>
        {(formData.nutrition.unavailableEatingWindows || []).map((window, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <label className="form-label" style={{fontSize: '0.85rem'}}>من الساعة</label>
              <input type="time" className="form-control" value={window.start} onChange={e => {
                const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
                newWin[idx] = { ...newWin[idx], start: e.target.value };
                updateField('nutrition', 'unavailableEatingWindows', newWin);
              }} />
            </div>
            <div>
              <label className="form-label" style={{fontSize: '0.85rem'}}>إلى الساعة</label>
              <input type="time" className="form-control" value={window.end} onChange={e => {
                const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
                newWin[idx] = { ...newWin[idx], end: e.target.value };
                updateField('nutrition', 'unavailableEatingWindows', newWin);
              }} />
            </div>
            <button className="btn btn-danger mt-4" onClick={() => {
              const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
              newWin.splice(idx, 1);
              updateField('nutrition', 'unavailableEatingWindows', newWin);
            }}><i className="bi bi-trash"></i> حذف</button>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => {
          const newWin = [...(formData.nutrition.unavailableEatingWindows || []), { start: '09:00', end: '12:00' }];
          updateField('nutrition', 'unavailableEatingWindows', newWin);
        }}>+ إضافة وقت منع</button>
      </div>

    </div>
  );

  const renderTraining = () => (
    <div className="step-content">
      <h3 className="section-title">إمكانيات التدريب</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">مكان التمرين</label>
          <div className="choices-grid">
            <div className={`choice-pill ${formData.training.location === 'GYM' ? 'selected' : ''}`} onClick={() => updateField('training', 'location', 'GYM')}>
              <div className="choice-title">في الجيم</div>
            </div>
            <div className={`choice-pill ${formData.training.location === 'HOME' ? 'selected' : ''}`} onClick={() => updateField('training', 'location', 'HOME')}>
              <div className="choice-title">في المنزل</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">خبرتك في التمرين (رفع الأثقال)</label>
          <select className="form-control" value={formData.training.experience} onChange={e => updateField('training', 'experience', e.target.value)}>
            <option value="NEVER_TRAINED">لم أتدرب من قبل (Never Trained)</option>
            <option value="BEGINNER">مبتدئ (أقل من سنة)</option>
            <option value="INTERMEDIATE">متوسط (1 إلى 3 سنوات)</option>
            <option value="ADVANCED">متقدم (أكثر من 3 سنوات)</option>
          </select>
        </div>
      </div>

      <div className="grid-2-col">
        <div className="form-group" style={{gridColumn: '1 / -1'}}>
          <label className="form-label">مرونة أيام التدريب (Schedule Availability)</label>
          <select className="form-control" value={formData.training.trainingScheduleAvailabilityType} onChange={e => updateField('training', 'trainingScheduleAvailabilityType', e.target.value)}>
            <option value="FLEXIBLE">مرن تماماً (أي أيام)</option>
            <option value="VARIABLE">متغير (حسب ظروف العمل)</option>
            <option value="FIXED_AVAILABLE_DAYS">أيام محددة فقط متاح فيها</option>
            <option value="FIXED_UNAVAILABLE_DAYS">أيام محددة غير متاح فيها أبداً</option>
          </select>
        </div>
        {(formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' || formData.training.trainingScheduleAvailabilityType === 'FIXED_UNAVAILABLE_DAYS') && (
          <div className="form-group" style={{gridColumn: '1 / -1'}}>
            <label className="form-label">{formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'اختر الأيام المتاحة' : 'اختر الأيام غير المتاحة (الممنوعة)'}</label>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
                const arrKey = formData.training.trainingScheduleAvailabilityType === 'FIXED_AVAILABLE_DAYS' ? 'availableTrainingDays' : 'unavailableTrainingDays';
                const isSelected = (formData.training[arrKey] || []).includes(day);
                return (
                  <div key={day} className={`choice-pill ${isSelected ? 'selected' : ''}`} style={{padding: '0.5rem 1rem', minHeight: 'auto'}} onClick={() => {
                    let newArr = [...(formData.training[arrKey] || [])];
                    if (isSelected) newArr = newArr.filter(d => d !== day);
                    else newArr.push(day);
                    updateField('training', arrKey, newArr);
                  }}>
                    <div className="choice-title">{day}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">أيام التمرين المفضلة أسبوعياً</label>
          <input type="number" min="1" max="6" className="form-control" value={formData.training.preferredDaysPerWeek} onChange={e => {
            const val = Number(e.target.value);
            updateField('training', 'preferredDaysPerWeek', val);
            if (val > formData.training.maxDaysPerWeek) updateField('training', 'maxDaysPerWeek', val);
          }} />
        </div>
        <div className="form-group">
          <label className="form-label">الحد الأقصى للأيام التي يمكنك توفيرها</label>
          <input type="number" min="1" max="7" className="form-control" value={formData.training.maxDaysPerWeek} onChange={e => updateField('training', 'maxDaysPerWeek', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">أقصى مدة للحصة الواحدة (بالدقائق)</label>
          <input type="number" min="15" max="180" step="15" className="form-control" value={formData.training.maxSessionMinutes} onChange={e => updateField('training', 'maxSessionMinutes', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">انتظامك في التمرين آخر 4 أسابيع؟</label>
          <select className="form-control" value={formData.training.recentTraining} onChange={e => updateField('training', 'recentTraining', e.target.value)}>
            <option value="NONE_LAST_4_WEEKS">منقطع تماماً</option>
            <option value="IRREGULAR">متقطع (يوم أو يومين فقط)</option>
            <option value="CONSISTENT_LIGHT">منتظم لكن أوزان خفيفة</option>
            <option value="CONSISTENT_HARD">منتظم وشاق</option>
          </select>
        </div>
      </div>
      
      {formData.training.location === 'HOME' && (
        <>
          <div className="section-divider"></div>
          <h3 className="section-title">المعدات المتاحة في المنزل</h3>
          <p style={{fontSize:'0.85rem', color:'#64748b'}}>حدد ما تملكه لكي نبني خطة مناسبة لمنزلك</p>
          <div className="array-builder">
            {formData.training.equipment.map((eq, idx) => (
              <div key={idx} className="array-item">
                <button className="btn-remove" onClick={() => removeArrayItem('training', 'equipment', idx)}><i className="bi bi-trash"></i></button>
                <div className="grid-2-col" style={{width: '100%'}}>
                  <div className="form-group" style={{marginBottom: 0}}>
                    <label className="form-label">نوع المعدة</label>
                    <select className="form-control" value={eq.equipmentCode} onChange={e => updateArrayItem('training', 'equipment', idx, 'equipmentCode', e.target.value)}>
                      <option value="BODYWEIGHT">وزن الجسم فقط</option>
                      <option value="DUMBBELLS">دمبلز (Dumbbells)</option>
                      <option value="BARBELL_AND_PLATES">بار وأوزان (Barbell & Plates)</option>
                      <option value="ADJUSTABLE_BENCH">دكة قابلة للتعديل (Adjustable Bench)</option>
                      <option value="FLAT_BENCH">دكة مستوية (Flat Bench)</option>
                      <option value="RESISTANCE_BANDS">أستيك مقاومة (Bands)</option>
                      <option value="PULL_UP_BAR">عقلة (Pull-up Bar)</option>
                      <option value="SQUAT_RACK">حامل سكوات (Squat Rack)</option>
                      <option value="SMITH_MACHINE">جهاز سميث (Smith Machine)</option>
                      <option value="CABLE_STATION">جهاز كابل (Cable Station)</option>
                      <option value="SELECTORIZED_MACHINES">أجهزة جيم كاملة (Machines)</option>
                      <option value="KETTLEBELLS">كيتل بيل (Kettlebells)</option>
                      <option value="FOAM_ROLLER">فوم رولر (Foam Roller)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{marginBottom: 0}}>
                    <label className="form-label">وزنها/مقاومتها</label>
                    <select className="form-control" value={eq.loadCapacity} onChange={e => updateArrayItem('training', 'equipment', idx, 'loadCapacity', e.target.value)}>
                      <option value="LIGHT">خفيفة جداً (أقل من 5 كجم)</option>
                      <option value="MEDIUM">متوسطة (5-15 كجم)</option>
                      <option value="HEAVY">ثقيلة</option>
                      <option value="ADJUSTABLE">قابلة للتعديل بأوزان متعددة</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-add-outline" onClick={() => addArrayItem('training', 'equipment', { equipmentCode: 'DUMBBELLS', loadCapacity: 'LIGHT' })}>
              + إضافة معدة رياضية
            </button>
          </div>
        </>
      )}

      <div className="section-divider"></div>
      <h3 className="section-title">الإصابات والآلام (Injuries)</h3>
      <div className="array-builder">
        {formData.training.injuries.map((injury, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('training', 'injuries', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">منطقة الإصابة أو الألم</label>
                <input type="text" className="form-control" value={injury.area} onChange={e => updateArrayItem('training', 'injuries', idx, 'area', e.target.value)} placeholder="مثال: الركبة اليمنى" />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">مستوى الألم (0 إلى 10)</label>
                <input type="number" min="0" max="10" className="form-control" value={injury.painLevel} onChange={e => updateArrayItem('training', 'injuries', idx, 'painLevel', Number(e.target.value))} />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">تأثيرها على الحركة</label>
                <select className="form-control" value={injury.movementImpact} onChange={e => updateArrayItem('training', 'injuries', idx, 'movementImpact', e.target.value)}>
                  <option value="NONE">لا تأثير (NONE)</option>
                  <option value="LIMITS">تحد من الحركة (LIMITS)</option>
                  <option value="PREVENTS">تمنع الحركة تماماً (PREVENTS)</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">تزداد سوءاً مع التمرين؟</label>
                <select className="form-control" value={String(injury.worsening)} onChange={e => updateArrayItem('training', 'injuries', idx, 'worsening', e.target.value === 'true')}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">هل يصاحبها تنميل أو ضعف؟</label>
                <select className="form-control" value={String(injury.numbnessOrWeakness)} onChange={e => updateArrayItem('training', 'injuries', idx, 'numbnessOrWeakness', e.target.value === 'true')}>
                  <option value="false">لا</option>
                  <option value="true">نعم</option>
                </select>
              </div>
            </div>
            
            <div className="form-group mt-3" style={{marginBottom: 0}}>
              <label className="form-label">الموانع الطبية لهذه الإصابة (إن وجدت)</label>
              {(injury.medicalRestrictions || []).map((rest, restIdx) => (
                <div key={restIdx} className="grid-2-col" style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', position: 'relative'}}>
                  <button className="btn btn-sm btn-danger" style={{position: 'absolute', left: '10px', top: '10px'}} onClick={() => {
                    const newRests = [...(injury.medicalRestrictions || [])];
                    newRests.splice(restIdx, 1);
                    updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
                  }}><i className="bi bi-x"></i></button>
                  
                  <div className="form-group" style={{marginBottom: 0}}>
                    <label className="form-label" style={{fontSize: '0.85rem'}}>الحركة الممنوعة</label>
                    <select className="form-control" value={rest.movement} onChange={e => {
                      const newRests = [...(injury.medicalRestrictions || [])];
                      newRests[restIdx] = { ...newRests[restIdx], movement: e.target.value };
                      updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
                    }}>
                      <option value="SQUAT">سكوات (SQUAT)</option>
                      <option value="HINGE">انحناء (HINGE)</option>
                      <option value="PUSH">دفع (PUSH)</option>
                      <option value="PULL">سحب (PULL)</option>
                      <option value="OVERHEAD">فوق الرأس (OVERHEAD)</option>
                      <option value="ALL_TRAINING">تمرين الأثقال بالكامل</option>
                      <option value="ALL_CARDIO">الكارديو بالكامل</option>
                    </select>
                  </div>
                  <div className="form-group" style={{marginBottom: 0}}>
                    <label className="form-label" style={{fontSize: '0.85rem'}}>المصدر</label>
                    <select className="form-control" value={rest.source} onChange={e => {
                      const newRests = [...(injury.medicalRestrictions || [])];
                      newRests[restIdx] = { ...newRests[restIdx], source: e.target.value };
                      updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
                    }}>
                      <option value="PHYSICIAN">طبيب معالج</option>
                      <option value="PHYSIOTHERAPIST">علاج طبيعي</option>
                      <option value="OTHER_LICENSED_CLINICIAN">مختص آخر</option>
                    </select>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const newRests = [...(injury.medicalRestrictions || []), { movement: 'SQUAT', instruction: 'AVOID', source: 'PHYSICIAN' }];
                updateArrayItem('training', 'injuries', idx, 'medicalRestrictions', newRests);
              }}>+ إضافة مانع طبي</button>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('training', 'injuries', { area: '', painLevel: 0, movementImpact: 'NONE', worsening: false, numbnessOrWeakness: false, affectedMovements: [], medicalRestrictions: [] })}>
          + إضافة إصابة
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">موانع حركة طبية عامة (Medical Movement Restrictions)</h3>
      <div className="array-builder">
        {formData.training.medicalMovementRestrictions.map((rest, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('training', 'medicalMovementRestrictions', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">الحركة الممنوعة</label>
                <select className="form-control" value={rest.movement} onChange={e => updateArrayItem('training', 'medicalMovementRestrictions', idx, 'movement', e.target.value)}>
                  <option value="SQUAT">سكوات (SQUAT)</option>
                  <option value="HINGE">انحناء (HINGE)</option>
                  <option value="PUSH">دفع (PUSH)</option>
                  <option value="PULL">سحب (PULL)</option>
                  <option value="OVERHEAD">فوق الرأس (OVERHEAD)</option>
                  <option value="ALL_TRAINING">تمرين الأثقال بالكامل</option>
                  <option value="ALL_CARDIO">الكارديو بالكامل</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">المصدر</label>
                <select className="form-control" value={rest.source} onChange={e => updateArrayItem('training', 'medicalMovementRestrictions', idx, 'source', e.target.value)}>
                  <option value="PHYSICIAN">طبيب معالج</option>
                  <option value="PHYSIOTHERAPIST">علاج طبيعي</option>
                  <option value="OTHER_LICENSED_CLINICIAN">مختص آخر</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('training', 'medicalMovementRestrictions', { movement: 'SQUAT', instruction: 'AVOID', source: 'PHYSICIAN' })}>
          + إضافة مانع طبي عام
        </button>
      </div>

    </div>
  );

  const renderCardio = () => (
    <div className="step-content">
      <h3 className="section-title">نشاط الكارديو (Cardio)</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">متوسط خطواتك اليومية الحالية</label>
          <input type="number" step="1000" className="form-control" value={formData.cardio.averageDailySteps} onChange={e => updateField('cardio', 'averageDailySteps', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">القدرة على المشي لفترات</label>
          <select className="form-control" value={formData.cardio.walkingAbility} onChange={e => updateField('cardio', 'walkingAbility', e.target.value)}>
            <option value="EASY">سهل ومريح (يمكنني المشي لساعات)</option>
            <option value="MODERATE_DIFFICULTY">صعوبة متوسطة</option>
            <option value="PAINFUL">مؤلم أو غير ممكن لظروف طبية</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">أقصى عدد جلسات كارديو يمكنك إضافتها أسبوعياً</label>
          <input type="number" min="0" max="7" className="form-control" value={formData.cardio.maxSessionsPerWeek} onChange={e => updateField('cardio', 'maxSessionsPerWeek', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">أقصى مدة لجلسة الكارديو (بالدقائق)</label>
          <input type="number" min="10" max="60" step="5" className="form-control" value={formData.cardio.maxDurationMinutes} onChange={e => updateField('cardio', 'maxDurationMinutes', Number(e.target.value))} />
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">رياضات إضافية تمارسها (Additional Sports)</h3>
      <div className="array-builder">
        {formData.cardio.additionalSports.map((sport, idx) => (
          <div key={idx} className="array-item">
            <button className="btn-remove" onClick={() => removeArrayItem('cardio', 'additionalSports', idx)}><i className="bi bi-trash"></i></button>
            <div className="grid-2-col" style={{width: '100%'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">نوع الرياضة</label>
                <select className="form-control" value={sport.sportCode} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'sportCode', e.target.value)}>
                  <option value="FOOTBALL">كرة القدم</option>
                  <option value="SWIMMING">سباحة</option>
                  <option value="BASKETBALL">كرة سلة</option>
                  <option value="MARTIAL_ARTS">فنون قتالية</option>
                  <option value="CROSSFIT">كروس فيت</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">أيام الممارسة</label>
                <select className="form-control" value={sport.days} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'days', Number(e.target.value))}>
                  <option value={1}>يوم واحد</option>
                  <option value={2}>يومين</option>
                  <option value={3}>3 أيام</option>
                  <option value={4}>4 أيام أو أكثر</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">المدة في المرة (بالدقائق)</label>
                <input type="number" min="15" max="180" step="15" className="form-control" value={sport.minutesPerSession} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'minutesPerSession', Number(e.target.value))} />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">الشدة (Intensity)</label>
                <select className="form-control" value={sport.intensity} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'intensity', e.target.value)}>
                  <option value="LIGHT">خفيفة (للتسلية)</option>
                  <option value="MODERATE">متوسطة</option>
                  <option value="VIGOROUS">عالية/تنافسية</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label className="form-label">مستوى المشاركة</label>
                <select className="form-control" value={sport.participationLevel} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'participationLevel', e.target.value)}>
                  <option value="RECREATIONAL">ترفيهي (Recreational)</option>
                  <option value="COMPETITIVE">تنافسي (Competitive)</option>
                </select>
              </div>
              {sport.sportCode === 'OTHER' && (
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label">اسم الرياضة</label>
                  <input type="text" className="form-control" value={sport.otherSportText || ''} onChange={e => updateArrayItem('cardio', 'additionalSports', idx, 'otherSportText', e.target.value)} />
                </div>
              )}
            </div>
          </div>
        ))}
        <button className="btn-add-outline" onClick={() => addArrayItem('cardio', 'additionalSports', { sportCode: 'FOOTBALL', days: 1, minutesPerSession: 60, intensity: 'MODERATE', participationLevel: 'RECREATIONAL' })}>
          + إضافة رياضة أخرى
        </button>
      </div>
    </div>
  );

  const [submitting, setSubmitting] = useState(false);

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
      const code = sessionStorage.getItem('z_client_code') || 'CLIENT-AHMED-SAMIR';
      const phone = sessionStorage.getItem('z_client_phone') || '01000000000';

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

      const res = await fetch('http://localhost:3000/api/v1/programs/generate-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          client_code: code,
          phone_number: phone,
          full_name: `${formData.personal.firstName} ${formData.personal.lastName}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.details ? data.details : 'فشل توليد وحفظ الخطة'));
      }

      const storageKey = `z_intake_${code}_${phone}`;
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem('z_client_code');
      sessionStorage.removeItem('z_client_phone');

      sessionStorage.setItem('z_active_client_id', data.user?.id || 1);
      sessionStorage.setItem('z_active_client_code', data.user?.client_code || code);
      sessionStorage.setItem('z_active_client_name', data.user?.full_name || 'أحمد سمير');

      navigate(`/user-dashboard?user_id=${data.user?.client_code || code}`);
    } catch (err) {
      alert('حدث خطأ أثناء معالجة البيانات: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderReview = () => (
    <div className="step-content" style={{textAlign: 'center', padding: '4rem 2rem'}}>
      <div style={{fontSize: '4.5rem', marginBottom: '1rem', color: '#00b4d8'}}><i className="bi bi-check2-circle"></i></div>
      <h3 style={{fontSize: '1.85rem', fontWeight: 'bold', color: '#0f172a'}}>هل أنت جاهز لتوليد خطتك التدريبية والغذائية؟</h3>
      <p style={{color: '#64748b', margin: '1rem auto 2.5rem', maxWidth: '540px', lineHeight: '1.7', fontSize: '1.05rem'}}>
        تم حفظ جميع بياناتك بنجاح. سيقوم محرك الذكاء الرياضي (Z-Engine V2) بتحليل أكثر من 70 نقطة بيانات صممتها بدقة لتوليد أقصى تطور لجسمك وهدفك.
      </p>
      
      <button 
        className="btn btn-primary" 
        style={{padding: '1.1rem 3.5rem', fontSize: '1.2rem', borderRadius: '40px'}} 
        disabled={submitting}
        onClick={handleSubmitIntake}
      >
        {submitting ? 'جاري بناء الميزوسايكل والدايت المكمم...' : 'إرسال وتوليد الخطة الذكية الآن'}
      </button>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'personal': return renderPersonal();
      case 'body': return renderBody();
      case 'lifestyle': return renderLifestyle();
      case 'medical': return renderMedical();
      case 'nutrition': return renderNutrition();
      case 'training': return renderTraining();
      case 'cardio': return renderCardio();
      case 'review': return renderReview();
      default: return null;
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
              <p style={{margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8'}}>كود: {sessionStorage.getItem('z_client_code') || 'جديد'}</p>
            </div>
            <button 
              onClick={handleResetForm} 
              className="btn btn-outline-danger btn-sm rounded-pill" 
              style={{fontSize: '0.72rem', padding: '3px 10px'}} 
              title="تفريغ الاستمارة والبدء من جديد"
            >
              استمارة جديدة
            </button>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
            {TABS.map(tab => (
              <div key={tab.id} 
                   className={`intake-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                   onClick={() => setActiveTab(tab.id)}>
                <i className={`bi ${tab.icon}`} style={{fontSize: '1.25rem'}}></i>
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
                  <><i className="bi bi-arrow-repeat" style={{animation: 'spin 1s linear infinite'}}></i> جاري الحفظ...</>
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
            <button className="btn btn-secondary" disabled={activeTab === TABS[0].id} 
              onClick={() => {
                const idx = TABS.findIndex(t => t.id === activeTab);
                if (idx > 0) setActiveTab(TABS[idx - 1].id);
              }}>
              السابق
            </button>
            <button className="btn btn-primary" disabled={activeTab === TABS[TABS.length - 1].id}
              onClick={() => {
                const idx = TABS.findIndex(t => t.id === activeTab);
                if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
              }}>
              التالي
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
