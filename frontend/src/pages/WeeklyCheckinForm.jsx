import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Scale, 
  Ruler, 
  Activity, 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  HeartPulse, 
  Moon, 
  Sparkles, 
  TrendingDown, 
  Upload, 
  Utensils, 
  Zap 
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function WeeklyCheckinForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Client Selection / Identity
  const [clients, setClients] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get('user_id') || '1');
  const [currentWeek, setCurrentWeek] = useState(searchParams.get('week') || '2');

  // Step state (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // 1. Pillar 1: Objective Measurements
  const [measurements, setMeasurements] = useState({
    weight_kg: '77.2',
    waist_cm: '85',
    hips_cm: '107',
    chest_cm: '96',
    thigh_cm: '58',
    arm_cm: '31'
  });

  // 2. Pillar 2: Biofeedback & Compliance
  const [biofeedback, setBiofeedback] = useState({
    nutrition_adherence: 95, // %
    hunger_level: 4, // 1-10
    energy_level: 8, // 1-10
    sleep_quality: 8, // 1-10
    sleep_hours: 7.5,
    digestion_quality: 9, // 1-10 (10 = perfect, 1 = severe bloating)
    stress_level: 3 // 1-10
  });

  // 3. Pillar 3: Movement & Joint Pain Audit
  const [jointAudit, setJointAudit] = useState({
    has_pain: false,
    affected_joint: 'ركبة', // 'ركبة' | 'أسفل الظهر' | 'كتف' | 'معصم' | 'كاحل'
    pain_severity: 3, // 1-10
    offending_exercise: '',
    strength_progression: 'INCREASED', // 'INCREASED' | 'MAINTAINED' | 'DECREASED'
    workouts_completed: 4,
    workouts_scheduled: 4,
    notes: ''
  });

  // 4. Pillar 4: Photos
  const [photos, setPhotos] = useState({
    front: null,
    side: null,
    back: null
  });

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients && data.clients.length > 0) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error('fetchClients error:', e);
    }
  };

  const handlePhotoUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotos(prev => ({ ...prev, [type]: url }));
    }
  };

  const handleSubmitCheckin = async () => {
    try {
      setSubmitting(true);
      const payload = {
        user_id: Number(selectedUserId),
        week_number: Number(currentWeek),
        weight_kg: Number(measurements.weight_kg),
        waist_circumference_cm: Number(measurements.waist_cm),
        hip_circumference_cm: Number(measurements.hips_cm),
        nutrition_adherence_percent: Number(biofeedback.nutrition_adherence),
        workouts_completed: Number(jointAudit.workouts_completed),
        workouts_scheduled: Number(jointAudit.workouts_scheduled),
        biofeedback: {
          hunger_level: Number(biofeedback.hunger_level),
          energy_level: Number(biofeedback.energy_level),
          sleep_quality: Number(biofeedback.sleep_quality),
          sleep_hours: Number(biofeedback.sleep_hours),
          digestion_quality: Number(biofeedback.digestion_quality),
          stress_level: Number(biofeedback.stress_level)
        },
        pain_reports: jointAudit.has_pain ? [{
          joint: jointAudit.affected_joint,
          pain_level: Number(jointAudit.pain_severity),
          exercise: jointAudit.offending_exercise
        }] : [],
        client_notes: jointAudit.notes
      };

      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال المتابعة');

      setSubmitSuccess(data);
    } catch (err) {
      alert('خطأ في إرسال المتابعة: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    const analysis = submitSuccess.analysis || {};
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center font-sans" dir="rtl" style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}>
        <div style={{ maxWidth: '640px', width: '100%', background: '#FFFFFF', borderRadius: '24px', padding: '36px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)', textAlign: 'center' }}>
          
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle2 style={{ width: '36px', height: '36px' }} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
            تم استلام تقرير المتابعة الأسبوعية بنجاح!
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
            تمت معالجة بياناتك وتحليل مؤشرات النزول ومعدلات التوافق الحيوي بواسطة محرك التكيف التلقائي.
          </p>

          {/* AI Immediate Recommendation Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '20px', textAlign: 'right', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284C7', fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>
              <Sparkles style={{ width: '18px', height: '18px' }} />
              <span>التحليل الذكي اللحظي للحالة:</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #F1F5F9', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ color: '#64748B' }}>تغير الوزن المسجل:</span>
              <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                {analysis.weight_change_kg !== null ? `${analysis.weight_change_kg} كجم` : 'وزن أولي'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #F1F5F9', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ color: '#64748B' }}>حالة المسار الأيضي:</span>
              <span style={{ fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                {analysis.analysis_status || 'ON_TRACK (مسار مثالي)'}
              </span>
            </div>
            {analysis.recommendations_ar && analysis.recommendations_ar.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#334155', lineHeight: '1.6' }}>
                {analysis.recommendations_ar.map((rec, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>• {rec}</p>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ flex: 1, height: '44px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
            >
              العودة للرئيسية
            </button>
            <button
              onClick={() => { setSubmitSuccess(null); setCurrentStep(1); }}
              style={{ height: '44px', padding: '0 20px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
            >
              تعبئة أسبوع آخر
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 px-4 font-sans" dir="rtl" style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        
        {/* Top Header Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px 28px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                  استمارة المتابعة التكيفية
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                  الأسبوع {currentWeek}
                </span>
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: '6px 0 0 0' }}>
                تقرير المتابعة والقياسات الأسبوعية (Check-in)
              </h1>
            </div>

            {/* Quick Client Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>المتدرب:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ height: '36px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
              >
                {clients.length > 0 ? (
                  clients.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.client_code || c.id} - {c.full_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">#1 - سارة المنصوري</option>
                    <option value="2">#2 - طارق عبد العزيز</option>
                    <option value="3">#3 - ندى الشريف</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '2px', background: '#E2E8F0', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', top: '16px', right: '20px', width: `${((currentStep - 1) / 3) * 100}%`, height: '2px', background: '#0284C7', zIndex: 1, transition: 'width 0.3s ease' }}></div>

            {[
              { num: 1, label: 'القياسات والأوزان', icon: Scale },
              { num: 2, label: 'التوافق الحيوي والالتزام', icon: Activity },
              { num: 3, label: 'الأداء وفحص المفاصل', icon: Flame },
              { num: 4, label: 'الصور ثلاثية الأبعاد', icon: Camera }
            ].map(step => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              const StepIcon = step.icon;

              return (
                <div 
                  key={step.num} 
                  onClick={() => setCurrentStep(step.num)}
                  style={{ position: 'relative', zIndex: 2, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div 
                    style={{ 
                      width: '34px', 
                      height: '34px', 
                      borderRadius: '50%', 
                      background: isPast ? '#059669' : (isActive ? '#0284C7' : '#FFFFFF'), 
                      color: (isPast || isActive) ? '#FFFFFF' : '#64748B', 
                      border: `2px solid ${isPast ? '#059669' : (isActive ? '#0284C7' : '#CBD5E1')}`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 6px auto',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isPast ? <CheckCircle2 style={{ width: '18px', height: '18px' }} /> : <StepIcon style={{ width: '16px', height: '16px' }} />}
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#0F172A' : '#94A3B8' }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Form Step Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '30px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)', marginBottom: '24px' }}>
          
          {/* STEP 1: OBJECTIVE MEASUREMENTS */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  المحور الأول: الأرقام والقياسات الموضوعية
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  يُرجى تسجيل الوزن الصائم صباحاً بعد الحمام مباشرة، وأخذ قياسات المازورة بدقة.
                </p>
              </div>

              <div className="row g-3">
                
                {/* Weight */}
                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    الوزن الصائم الصباحي (كجم) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.weight_kg}
                      onChange={(e) => setMeasurements({ ...measurements, weight_kg: e.target.value })}
                      style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                      KG
                    </span>
                  </div>
                </div>

                {/* Waist */}
                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    محيط الوسط (عند السرة بدون شفط) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.waist_cm}
                      onChange={(e) => setMeasurements({ ...measurements, waist_cm: e.target.value })}
                      style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                      CM
                    </span>
                  </div>
                </div>

                {/* Hips */}
                <div className="col-12 col-md-4">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    محيط الحوض (أعرض نقطة)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={measurements.hips_cm}
                      onChange={(e) => setMeasurements({ ...measurements, hips_cm: e.target.value })}
                      style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>CM</span>
                  </div>
                </div>

                {/* Chest */}
                <div className="col-12 col-md-4">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    محيط الصدر
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={measurements.chest_cm}
                      onChange={(e) => setMeasurements({ ...measurements, chest_cm: e.target.value })}
                      style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>CM</span>
                  </div>
                </div>

                {/* Thigh */}
                <div className="col-12 col-md-4">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    محيط الفخذ
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={measurements.thigh_cm}
                      onChange={(e) => setMeasurements({ ...measurements, thigh_cm: e.target.value })}
                      style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>CM</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 2: BIOFEEDBACK & COMPLIANCE */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  المحور الثاني: التوافق الحيوي والالتزام (Biofeedback)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  هذه المؤشرات الحيوية تمكن النظام من معرفة هل جسمك بحاجة إلى ريفيد، أو دايت بريك، أو استمرار في العجز.
                </p>
              </div>

              {/* Nutrition Adherence % */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    نسبة الالتزام بالخطة الغذائية هذا الأسبوع:
                  </label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284C7', fontFamily: 'monospace' }}>
                    {biofeedback.nutrition_adherence}%
                  </strong>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={biofeedback.nutrition_adherence}
                  onChange={(e) => setBiofeedback({ ...biofeedback, nutrition_adherence: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                  <span>50% (تجاوزات عديدة)</span>
                  <span>85% (ملتزم بنسبة كبيرة)</span>
                  <span>100% (التزام مثالي دون خروج)</span>
                </div>
              </div>

              {/* Hunger & Energy Sliders */}
              <div className="row g-4">
                
                <div className="col-12 col-md-6">
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>مستوى الجوع:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: biofeedback.hunger_level >= 7 ? '#DC2626' : '#059669' }}>
                        {biofeedback.hunger_level} / 10 ({biofeedback.hunger_level >= 7 ? 'جوع مرتفع' : 'مقبول'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={biofeedback.hunger_level}
                      onChange={(e) => setBiofeedback({ ...biofeedback, hunger_level: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#D97706' }}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>مستوى النشاط والطاقة بالتمرين:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: biofeedback.energy_level >= 7 ? '#059669' : '#DC2626' }}>
                        {biofeedback.energy_level} / 10 ({biofeedback.energy_level >= 7 ? 'طاقة ممتازة' : 'خمول'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={biofeedback.energy_level}
                      onChange={(e) => setBiofeedback({ ...biofeedback, energy_level: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#10B981' }}
                    />
                  </div>
                </div>

                {/* Sleep & Digestion */}
                <div className="col-12 col-md-6">
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>جودة النوم وساعاته:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284C7' }}>
                        {biofeedback.sleep_hours} ساعات ({biofeedback.sleep_quality}/10)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="10"
                      step="0.5"
                      value={biofeedback.sleep_hours}
                      onChange={(e) => setBiofeedback({ ...biofeedback, sleep_hours: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#6366F1' }}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>راحة الهضم والقولون:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: biofeedback.digestion_quality >= 7 ? '#059669' : '#D97706' }}>
                        {biofeedback.digestion_quality} / 10 ({biofeedback.digestion_quality >= 7 ? 'هضم مريح' : 'انتفاخ'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={biofeedback.digestion_quality}
                      onChange={(e) => setBiofeedback({ ...biofeedback, digestion_quality: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#059669' }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: WORKOUT PERFORMANCE & JOINT PAIN */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  المحور الثالث: الأداء الرياضي وفحص سلامة المفاصل
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  حماية المفاصل ورصد تطور الأوزان يتيح للنظام استبدال أي تمرين مسبب للألم فوراً.
                </p>
              </div>

              {/* Workouts adherence */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    عدد التمارين المنفذة هذا الأسبوع:
                  </label>
                  <select
                    value={jointAudit.workouts_completed}
                    onChange={(e) => setJointAudit({ ...jointAudit, workouts_completed: Number(e.target.value) })}
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', background: '#F8FAFC' }}
                  >
                    <option value="4">4 من 4 (التزام كامل بالجدول)</option>
                    <option value="3">3 من 4 (فاتني تمرين واحد)</option>
                    <option value="2">2 من 4 (نفذت نصف الجدول)</option>
                    <option value="5">5 تمارين (إضافي)</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    تطور الأوزان والتكرارات:
                  </label>
                  <select
                    value={jointAudit.strength_progression}
                    onChange={(e) => setJointAudit({ ...jointAudit, strength_progression: e.target.value })}
                    style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', background: '#F8FAFC' }}
                  >
                    <option value="INCREASED">زيادة في الأوزان أو التكرارات (Progressive Overload)</option>
                    <option value="MAINTAINED">ثبات في الأوزان بنفس الجودة</option>
                    <option value="DECREASED">تراجع في الأوزان بسبب الإجهاد</option>
                  </select>
                </div>
              </div>

              {/* Joint Pain Checkbox */}
              <div style={{ background: jointAudit.has_pain ? '#FFF1F2' : '#F8FAFC', border: `1px solid ${jointAudit.has_pain ? '#FECDD3' : '#E2E8F0'}`, borderRadius: '16px', padding: '18px', transition: 'all 0.2s ease' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={jointAudit.has_pain}
                    onChange={(e) => setJointAudit({ ...jointAudit, has_pain: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#E11D48', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: jointAudit.has_pain ? '#9F1239' : '#0F172A' }}>
                    هل شعرت بأي ألم أو نغزة غير طبيعية في المفاصل أثناء أو بعد التمرين؟
                  </span>
                </label>

                {jointAudit.has_pain && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #FECDD3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9F1239', marginBottom: '4px' }}>
                          المفصل المتأثر:
                        </label>
                        <select
                          value={jointAudit.affected_joint}
                          onChange={(e) => setJointAudit({ ...jointAudit, affected_joint: e.target.value })}
                          style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #FDA4AF', padding: '0 10px', fontSize: '0.84rem', fontWeight: 700, background: '#FFFFFF', color: '#881337' }}
                        >
                          <option value="ركبة">الركبة (Knee)</option>
                          <option value="أسفل الظهر">أسفل الظهر (Lumbar Spine)</option>
                          <option value="كتف">مفصل الكتف (Shoulder)</option>
                          <option value="معصم">المعصم (Wrist)</option>
                          <option value="كاحل">الكاحل / وتر أكيليس (Achilles)</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9F1239', marginBottom: '4px' }}>
                          شدة الألم (1 إلى 10):
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={jointAudit.pain_severity}
                          onChange={(e) => setJointAudit({ ...jointAudit, pain_severity: Number(e.target.value) })}
                          style={{ width: '100%', accentColor: '#E11D48', marginTop: '6px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9F1239', marginBottom: '4px' }}>
                        التمرين الذي سبب الألم (إن كنت تذكره):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: هاك سكوات / تجميع دمبل عالي..."
                        value={jointAudit.offending_exercise}
                        onChange={(e) => setJointAudit({ ...jointAudit, offending_exercise: e.target.value })}
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #FDA4AF', padding: '0 12px', fontSize: '0.84rem', background: '#FFFFFF', color: '#0F172A', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  ملاحظات أو أسئلة إضافية للكوتش:
                </label>
                <textarea
                  rows="2"
                  placeholder="أي تفاصيل تود مشاركتها مع الكوتش بخصوص أسبوعك..."
                  value={jointAudit.notes}
                  onChange={(e) => setJointAudit({ ...jointAudit, notes: e.target.value })}
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #CBD5E1', padding: '10px 14px', fontSize: '0.84rem', color: '#0F172A', outline: 'none' }}
                ></textarea>
              </div>

            </div>
          )}

          {/* STEP 4: 3D PHOTOS */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  المحور الرابع: صور التقدم ثلاثية الأبعاد (3D Progress Photos)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  الصور تساعد الكوتش والمحرك البصري على رصد التفاصيل العضلية وتوزيع حرق الدهون بدقة.
                </p>
              </div>

              <div className="row g-3">
                
                {[
                  { key: 'front', title: 'صورة أمامية (Front)' },
                  { key: 'side', title: 'صورة جانبية (Side)' },
                  { key: 'back', title: 'صورة خلفية (Back)' }
                ].map(pos => (
                  <div key={pos.key} className="col-12 col-md-4">
                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '20px', textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
                      {photos[pos.key] ? (
                        <div>
                          <img 
                            src={photos[pos.key]} 
                            alt={pos.title} 
                            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} 
                          />
                          <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>✓ تم الرفع</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                            <Upload style={{ width: '20px', height: '20px' }} />
                          </div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>{pos.title}</p>
                          <small style={{ fontSize: '0.7rem', color: '#94A3B8' }}>اضغط لرفع الصورة</small>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(pos.key, e)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                ))}

              </div>

              {/* Ready to Submit Banner */}
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles style={{ width: '24px', height: '24px', color: '#059669', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#065F46', display: 'block' }}>جاهز للإرسال والتحليل الذكي!</strong>
                  <p style={{ fontSize: '0.76rem', color: '#047857', margin: 0 }}>
                    بمجرد الضغط على إرسال، سيقوم محرك التكيف بمقارنة أرقامك الحالية مع الأسبوع السابق وصياغة خطتك المحدثة.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #F1F5F9' }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
              >
                <ChevronRight style={{ width: '16px', height: '16px' }} />
                <span>السابق</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '10px 22px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)' }}
              >
                <span>التالي</span>
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitCheckin}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '10px 26px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
              >
                <Sparkles style={{ width: '18px', height: '18px' }} />
                <span>{submitting ? 'جاري التحليل والاعتماد...' : 'إرسال المتابعة للمحرك'}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
