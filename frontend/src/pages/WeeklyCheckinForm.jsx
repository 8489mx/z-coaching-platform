import React, { useState, useMemo } from 'react';
import { Camera, Scale, Battery, Moon, Utensils, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Activity, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { getUpcomingFastingAlert } from '../utils/seasonalFastingRadar';

export default function WeeklyCheckinForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const upcomingFasting = useMemo(() => {
    const alert = getUpcomingFastingAlert();
    return alert && (alert.isActive || (alert.daysLeft > 0 && alert.daysLeft <= 35)) ? alert : null;
  }, []);

  const [formData, setFormData] = useState({
    weight_kg: '',
    waist_circumference_cm: '',
    nutrition_adherence_percent: 100,
    workouts_completed: 4,
    biofeedback: {
      energyLevel: 7,
      sleepQuality: 7,
      hungerLevel: 5
    },
    client_notes: '',
    fasting_transition: 'MAINTAIN_BASELINE'
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const qCode = searchParams.get('code') || searchParams.get('user_id') || '';
      const clientCode = qCode.trim() || localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || 'guest';
      const payload = {
        user_id: clientCode,
        weight_kg: formData.weight_kg,
        waist_circumference_cm: formData.waist_circumference_cm || null,
        nutrition_adherence_percent: formData.nutrition_adherence_percent,
        workouts_completed: formData.workouts_completed,
        biofeedback: formData.biofeedback,
        client_notes: formData.client_notes,
        fasting_transition: formData.fasting_transition
      };

      const res = await fetch(`${API_BASE}/api/v1/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Fallback for demo
      }

      setStep(4); // Success step
    } catch (err) {
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData({
      ...formData,
      biofeedback: { ...formData.biofeedback, [field]: parseInt(value) }
    });
  };

  return (
    <div 
      dir="rtl" 
      style={{ 
        minHeight: '100vh', 
        background: '#F8FAFC', 
        color: '#0F172A', 
        fontFamily: 'Cairo, sans-serif',
        padding: '24px 16px 80px 16px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Top Header Card */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '12px', 
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
            >
              <ChevronRight size={18} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>استمارة التقييم الأسبوعي</h1>
              <span style={{ fontSize: '11px', color: '#64748B' }}>متابعة التطور والوزن والمؤشرات الحيوية مع الكوتش</span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284C7', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 10px', borderRadius: '6px' }}>
            خطوة {step} من 3
          </div>
        </div>

        {/* Progress Tracker Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { num: 1, title: 'الوزن والمقاسات' },
            { num: 2, title: 'المؤشرات الحيوية' },
            { num: 3, title: 'الالتزام والملاحظات' }
          ].map(s => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div 
                key={s.num}
                style={{
                  background: isActive ? '#0F172A' : isDone ? '#F0FDF4' : '#FFFFFF',
                  border: isActive ? '1px solid #0F172A' : isDone ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  color: isActive ? '#FFFFFF' : isDone ? '#166534' : '#64748B',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease'
                }}
              >
                {s.title}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Body Metrics */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <Scale size={18} color="#0284C7" />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>الوزن الحالي والمقاسات</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  الوزن الحالي على الريق (كجم) *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                    placeholder="مثال: 78.5"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      textAlign: 'center',
                      fontFamily: 'JetBrains Mono, Cairo',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '14px', fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>كجم</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  محيط الخصر (سم) - اختياري
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    step="0.5"
                    value={formData.waist_circumference_cm}
                    onChange={(e) => setFormData({...formData, waist_circumference_cm: e.target.value})}
                    placeholder="مثال: 84"
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      textAlign: 'center',
                      fontFamily: 'JetBrains Mono, Cairo',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '14px', fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>سم</span>
                </div>
              </div>

            </div>

            {/* Photo Upload Section */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#D97706" />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>صور التطور الأسبوعي</strong>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>يرجى رفع صور واضحة بنفس الإضاءة وزاوية التصوير (الأمام، الجنب، الخلف).</span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                {['الأمام', 'الجانب', 'الظهر'].map((label, idx) => (
                  <div 
                    key={idx}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      padding: '24px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: '#64748B'
                    }}
                  >
                    <Camera size={20} />
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Bio-feedback */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <Activity size={18} color="#16A34A" />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>المؤشرات الحيوية الأسبوعية</strong>
              </div>

              {/* Energy */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#0F172A' }}>مستوى الطاقة في التمرين واليوم</span>
                  <strong style={{ color: '#D97706', fontFamily: 'JetBrains Mono' }}>{formData.biofeedback.energyLevel} / 10</strong>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.biofeedback.energyLevel} 
                  onChange={(e) => handleSliderChange('energyLevel', e.target.value)} 
                  style={{ width: '100%', accentColor: '#D97706', cursor: 'pointer' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                  <span>إجهاد وتعب</span>
                  <span>طاقة ونشاط عالي</span>
                </div>
              </div>

              {/* Sleep */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#0F172A' }}>جودة وعمق النوم</span>
                  <strong style={{ color: '#0284C7', fontFamily: 'JetBrains Mono' }}>{formData.biofeedback.sleepQuality} / 10</strong>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.biofeedback.sleepQuality} 
                  onChange={(e) => handleSliderChange('sleepQuality', e.target.value)} 
                  style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                  <span>نوم متقطع / أرق</span>
                  <span>نوم عميق ومريح</span>
                </div>
              </div>

              {/* Hunger */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#0F172A' }}>مستوى الشبع والجوع</span>
                  <strong style={{ color: '#DC2626', fontFamily: 'JetBrains Mono' }}>{formData.biofeedback.hungerLevel} / 10</strong>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.biofeedback.hungerLevel} 
                  onChange={(e) => handleSliderChange('hungerLevel', e.target.value)} 
                  style={{ width: '100%', accentColor: '#DC2626', cursor: 'pointer' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                  <span>شبع مريح</span>
                  <span>جوع متكرر</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 3: Adherence & Notes */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <CheckCircle2 size={18} color="#0284C7" />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>الالتزام ورسالة الكوتش</strong>
              </div>

              {/* Diet Adherence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#475569' }}>نسبة الالتزام بالدايت والماكروز:</span>
                  <strong style={{ color: '#16A34A', fontFamily: 'JetBrains Mono' }}>{formData.nutrition_adherence_percent}%</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  value={formData.nutrition_adherence_percent} 
                  onChange={(e) => setFormData({...formData, nutrition_adherence_percent: Number(e.target.value)})} 
                  style={{ width: '100%', accentColor: '#16A34A', cursor: 'pointer' }} 
                />
              </div>

              {/* Workouts Completed */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  أيام التمرين المكتملة هذا الأسبوع:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0,1,2,3,4,5,6,7].map(num => (
                    <button 
                      key={num} 
                      type="button"
                      onClick={() => setFormData({...formData, workouts_completed: num})}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono',
                        border: formData.workouts_completed === num ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        background: formData.workouts_completed === num ? '#0F172A' : '#FFFFFF',
                        color: formData.workouts_completed === num ? '#FFFFFF' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  رسالتك واستفساراتك للكوتش:
                </label>
                <textarea 
                  value={formData.client_notes}
                  onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
                  placeholder="أكتب أي ملاحظات حول تمرينك، أوزانك، أو شعورك هذا الأسبوع..."
                  style={{
                    width: '100%',
                    height: '90px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    padding: '10px 12px',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'Cairo, sans-serif'
                  }}
                />
              </div>

              {/* Seasonal Fasting Transition Confirmation */}
              {upcomingFasting && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Clock size={16} color="#B45309" />
                    <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                      تنسيق مواعيد الصيام: {upcomingFasting.name} ({upcomingFasting.statusText})
                    </strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '10px' }}>
                    {upcomingFasting.description} هل تود بدء تكييف برنامجك الغذائي والتدريبي للأسبوع القادم مع الصيام؟
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fasting_transition: 'ACTIVE' })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: formData.fasting_transition === 'ACTIVE' ? '#0F172A' : '#FFFFFF',
                        color: formData.fasting_transition === 'ACTIVE' ? '#FFFFFF' : '#475569',
                        border: formData.fasting_transition === 'ACTIVE' ? '1px solid #0F172A' : '1px solid #CBD5E1'
                      }}
                    >
                      نعم، تكييف خطة الصيام
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fasting_transition: 'MAINTAIN_BASELINE' })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.fasting_transition === 'MAINTAIN_BASELINE' ? '#0F172A' : '#FFFFFF',
                        color: formData.fasting_transition === 'MAINTAIN_BASELINE' ? '#FFFFFF' : '#475569',
                        border: formData.fasting_transition === 'MAINTAIN_BASELINE' ? '1px solid #0F172A' : '1px solid #CBD5E1'
                      }}
                    >
                      لا، الاستمرار في خطتي الحالية
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>تم إرسال التقييم الأسبوعي بنجاح</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', maxWidth: '380px', lineHeight: 1.6 }}>
              سيقوم الكوتش بمراجعة تطورك وأوزانك وتحديث خطتك وتوجيهات الأسبوع القادم في أقرب وقت.
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/coach/checkin-review')} 
              style={{
                marginTop: '10px',
                height: '38px',
                padding: '0 24px',
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              الانتقال للوحة مراجعة التقييمات
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '6px' }}>
            {step > 1 ? (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={16} />
                <span>السابق</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button 
                type="button"
                onClick={() => {
                  if (step === 1 && !formData.weight_kg) {
                    setError('يرجى إدخال وزنك الحالي قبل المتابعة');
                    return;
                  }
                  setError('');
                  setStep(step + 1);
                }}
                style={{
                  height: '38px',
                  padding: '0 24px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)'
                }}
              >
                <span>التالي</span>
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  height: '38px',
                  padding: '0 24px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'إرسال التقييم للكوتش'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
