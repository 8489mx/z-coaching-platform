import React, { useState, useMemo } from 'react';
import { Camera, Scale, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Activity, Clock, Trash2, MessageCircle, User, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { getUpcomingFastingAlert } from '../utils/seasonalFastingRadar';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';

function cleanArabicNumStr(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
}

export default function WeeklyCheckinForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Client Identification (URL Query > localStorage > sessionStorage)
  const initialClientCode = useMemo(() => {
    const qCode = searchParams.get('code') || searchParams.get('user_id') || '';
    if (qCode.trim() && qCode.trim().toLowerCase() !== 'guest') return qCode.trim();
    const stored = localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || '';
    return stored && stored.toLowerCase() !== 'guest' ? stored : '';
  }, [searchParams]);

  const [clientIdentifier, setClientIdentifier] = useState(initialClientCode);
  const [isEditingCode, setIsEditingCode] = useState(!initialClientCode);

  const upcomingFasting = useMemo(() => getUpcomingFastingAlert(), []);
  const coachConfig = useMemo(() => getStoredCoachConfig(), []);
  const coachWhatsApp = useMemo(() => formatWhatsAppPhone(coachConfig?.whatsappNumber || coachConfig?.supportWhatsapp || '201001060503'), [coachConfig]);

  const [formData, setFormData] = useState({
    weight_kg: '',
    // Optional: 7 morning weigh-ins and average daily calories feed the adaptive TDEE engine.
    daily_weights: ['', '', '', '', '', '', ''],
    average_daily_calories: '',
    waist_circumference_cm: '',
    nutrition_adherence_percent: 100,
    workouts_completed: 4,
    biofeedback: {
      energyLevel: 7,
      sleepQuality: 7,
      hungerLevel: 5
    },
    client_notes: '',
    fasting_transition: 'MAINTAIN_BASELINE',
    // Retrospective deep check-in fields
    lifestyle_variance: 'NORMAL_WORK',
    bowel_regularity: 'REGULAR',
    sleep_stress_composite: 3,
    menstrual_phase: 'NOT_APPLICABLE',
    // Prospective forward-looking preview fields
    next_week_travel: false,
    next_week_gym_available: true,
    next_week_realistic_days: 4,
    next_week_notes: ''
  });

  // Weekly Progress Photos (Front, Side, Back)
  const [photos, setPhotos] = useState({
    FRONT: null,
    SIDE: null,
    BACK: null
  });
  const [compressingAngle, setCompressingAngle] = useState(null);

  const handlePhotoSelect = async (angle, file) => {
    if (!file) return;
    try {
      setCompressingAngle(angle);
      const originalSizeKB = Math.round(file.size / 1024);

      // Compress locally in browser via Canvas/WebP (Zero External Dependencies)
      const compressedDataUrl = await optimizeImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
        preferredFormat: 'image/webp'
      });

      const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
      const compressedSizeKB = Math.round((base64Length * 3) / 4 / 1024);

      setPhotos(prev => ({
        ...prev,
        [angle]: {
          dataUrl: compressedDataUrl,
          originalSizeKB,
          compressedSizeKB,
          name: file.name
        }
      }));
    } catch (err) {
      console.warn('Image optimization error:', err);
    } finally {
      setCompressingAngle(null);
    }
  };

  const handleRemovePhoto = (angle) => {
    setPhotos(prev => ({
      ...prev,
      [angle]: null
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const rawCode = clientIdentifier.trim() || searchParams.get('code') || searchParams.get('user_id') || localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || '';
      const clientCode = String(rawCode).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
      
      if (!clientCode || clientCode.toLowerCase() === 'guest') {
        setError('يرجى إدخال كود المشترك أو رقم الهاتف المسجل أولاً لربط التقييم بملفك');
        setStep(1);
        setIsSubmitting(false);
        return;
      }

      const photosPayload = Object.entries(photos)
        .filter(([_, p]) => p && p.dataUrl)
        .map(([pose, p]) => ({
          pose,
          photo_url: p.dataUrl,
          notes: `حجم مضغوط: ${p.compressedSizeKB}KB (توفير ${Math.max(0, Math.round((1 - p.compressedSizeKB / p.originalSizeKB) * 100))}%)`
        }));

      const dailyWeightsComplete = formData.daily_weights.every((w) => Number(cleanArabicNumStr(w)) > 20);
      const payload = {
        user_id: clientCode,
        client_code: clientCode,
        weight_kg: Number(cleanArabicNumStr(formData.weight_kg)),
        ...(dailyWeightsComplete ? { daily_weights_kg: formData.daily_weights.map((w) => Number(cleanArabicNumStr(w))) } : {}),
        ...(formData.average_daily_calories ? { average_daily_calories: Number(cleanArabicNumStr(formData.average_daily_calories)) } : {}),
        waist_circumference_cm: formData.waist_circumference_cm ? Number(cleanArabicNumStr(formData.waist_circumference_cm)) : null,
        nutrition_adherence_percent: Number(formData.nutrition_adherence_percent),
        workouts_completed: Number(formData.workouts_completed),
        biofeedback: {
          energy_level: Number(formData.biofeedback.energyLevel),
          sleep_quality: Number(formData.biofeedback.sleepQuality),
          hunger_level: Number(formData.biofeedback.hungerLevel),
          energyLevel: Number(formData.biofeedback.energyLevel),
          sleepQuality: Number(formData.biofeedback.sleepQuality),
          hungerLevel: Number(formData.biofeedback.hungerLevel)
        },
        client_notes: formData.client_notes,
        fasting_transition: formData.fasting_transition,
        photos: photosPayload,
        // Retrospective deep check-in fields
        lifestyle_variance: formData.lifestyle_variance,
        bowel_regularity: formData.bowel_regularity,
        sleep_stress_composite: Number(formData.sleep_stress_composite),
        menstrual_phase: formData.menstrual_phase,
        // Prospective forward-looking preview fields
        next_week_travel: Boolean(formData.next_week_travel),
        next_week_gym_available: Boolean(formData.next_week_gym_available),
        next_week_realistic_days: formData.next_week_realistic_days ? Number(formData.next_week_realistic_days) : null,
        next_week_notes: formData.next_week_notes
      };

      const res = await fetch(`${API_BASE}/api/v1/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errorMsg = data?.error === 'Client not found'
          ? `تعذر العثور على حساب المشترك بالكود أو الرقم المدخل (#${clientCode}). يرجى التأكد من كتابة الكود أو رقم الهاتف المسجل لدى الكابتن والمحاولة ثانية.`
          : (data?.error || 'حدث خطأ أثناء حفظ التقييم الأسبوعي. يرجى مراجعة البيانات والمحاولة مجدداً.');
        setError(errorMsg);
        setStep(1);
        return;
      }

      // Success: persist code for future check-ins
      localStorage.setItem('kz_client_code', clientCode);
      setStep(4); // Success step
    } catch (err) {
      console.error('Submit checkin error:', err);
      setError('تعذر الاتصال بالخادم لإرسال التقييم الأسبوعي. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى دون قلق، فبياناتك وصورك محفوظة.');
      setStep(1);
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
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Body Metrics */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              
              {/* Client Identification Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditingCode ? '8px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="#0284C7" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      بيانات المشترك
                    </span>
                  </div>
                  {clientIdentifier && (
                    <button
                      type="button"
                      onClick={() => setIsEditingCode(!isEditingCode)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0284C7',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 6px'
                      }}
                    >
                      {isEditingCode ? 'إغلاق' : 'تعديل الكود أو الهاتف'}
                    </button>
                  )}
                </div>

                {isEditingCode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      أدخل كود اشتراكك (مثال: #1001) أو رقم الهاتف المسجل لربط التقييم بملفك لدى الكوتش *
                    </label>
                    <input
                      type="text"
                      value={clientIdentifier}
                      onChange={(e) => {
                        setClientIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="مثال: #1001 أو 010XXXXXXXX"
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, Cairo',
                        color: '#0F172A',
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>الكود المسجل للتقييم الأسبوعي:</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo', background: '#FFFFFF', padding: '3px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      #{clientIdentifier.replace(/^#+/, '')}
                    </span>
                  </div>
                )}
              </div>

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
                    type="text" 
                    inputMode="decimal"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: cleanArabicNumStr(e.target.value)})}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  أوزان الأيام السبعة على الريق (اختياري - يرفع دقة حساب حرقك الفعلي)
                </label>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                  لو وزنت نفسك كل يوم الصبح اكتب الأوزان السبعة؛ النظام يحسب المتوسط بدل وزن يوم واحد ليتجاهل تذبذب الماء.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {formData.daily_weights.map((w, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="decimal"
                      aria-label={`وزن اليوم ${i + 1}`}
                      value={w}
                      placeholder={String(i + 1)}
                      onChange={(e) => {
                        const next = [...formData.daily_weights];
                        next[i] = cleanArabicNumStr(e.target.value);
                        setFormData({ ...formData, daily_weights: next });
                      }}
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 2px', fontSize: '12px', fontWeight: 700, textAlign: 'center', fontFamily: 'JetBrains Mono, Cairo', color: '#0F172A', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  متوسط سعراتك اليومية هذا الأسبوع (اختياري - لو بتحسبها)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.average_daily_calories}
                  onChange={(e) => setFormData({ ...formData, average_daily_calories: cleanArabicNumStr(e.target.value) })}
                  placeholder="مثال: 2100"
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '14px', fontWeight: 700, textAlign: 'center', fontFamily: 'JetBrains Mono, Cairo', color: '#0F172A', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  محيط الخصر (سم) - اختياري
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={formData.waist_circumference_cm}
                    onChange={(e) => setFormData({...formData, waist_circumference_cm: cleanArabicNumStr(e.target.value)})}
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

            {/* Photo Upload Section with Self-Contained Local Compression */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="#D97706" />
                  <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>صور التطور الأسبوعي (3 زوايا)</strong>
                </div>
                <span style={{ fontSize: '10.5px', color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  ضغط محلي ذكي فائق الوضوح
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>يرجى رفع صور واضحة بنفس الإضاءة وزاوية التصوير للمقارنة الدقيقة قبل وبعد.</span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                {[
                  { id: 'FRONT', label: 'الأمام' },
                  { id: 'SIDE', label: 'الجانب' },
                  { id: 'BACK', label: 'الظهر' }
                ].map((item) => {
                  const photoData = photos[item.id];
                  const isCompressing = compressingAngle === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: photoData ? '1px solid #10B981' : '2px dashed #CBD5E1',
                        borderRadius: '8px',
                        background: photoData ? '#F0FDF4' : '#F8FAFC',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        minHeight: '135px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {isCompressing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <Loader2 size={22} color="#0284C7" className="animate-spin" />
                          <span style={{ fontSize: '10px', color: '#0369A1', fontWeight: 700 }}>جاري الضغط...</span>
                        </div>
                      ) : photoData ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <img
                            src={photoData.dataUrl}
                            alt={item.label}
                            style={{
                              width: '100%',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0'
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#166534' }}>
                              {item.label} (~{photoData.compressedSizeKB}KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.id)}
                              style={{
                                background: '#FEE2E2',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '3px',
                                color: '#EF4444',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="حذف الصورة"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: '#64748B'
                          }}
                        >
                          <Camera size={22} color="#94A3B8" />
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{item.label}</span>
                          <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>اضغط للرفع</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePhotoSelect(item.id, e.target.files[0]);
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
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

              {/* Retrospective: Lifestyle Variance */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  طبيعة حركة وروتين الأسبوع المنقضي:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'NORMAL_WORK', label: 'روتين عمل طبيعي' },
                    { id: 'HOME_VACATION', label: 'إجازة بالمنزل (حركة أقل)' },
                    { id: 'TRAVEL_AWAY', label: 'سفر وتنقلات' },
                    { id: 'DOUBLED_EFFORT', label: 'مجهود ونشاط مضاعف' },
                    { id: 'SICK_RECOVERY', label: 'وعكة صحية / إرهاق' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, lifestyle_variance: item.id })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.lifestyle_variance === item.id ? '#0F172A' : '#F8FAFC',
                        color: formData.lifestyle_variance === item.id ? '#FFFFFF' : '#475569',
                        border: formData.lifestyle_variance === item.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retrospective: Bowel Regularity */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  حركة الأمعاء والهضم خلال الأسبوع:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'REGULAR', label: 'منتظمة ومريحة' },
                    { id: 'IRREGULAR', label: 'متقلبة / عسر هضم' },
                    { id: 'CONSTIPATED', label: 'إمساك أو انتفاخ' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, bowel_regularity: item.id })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.bowel_regularity === item.id ? '#0F172A' : '#F8FAFC',
                        color: formData.bowel_regularity === item.id ? '#FFFFFF' : '#475569',
                        border: formData.bowel_regularity === item.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retrospective: Sleep Stress Composite */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#0F172A' }}>مؤشر الاستشفاء والضغط التراكمي (1 = إجهاد شديد، 5 = استشفاء ممتاز)</span>
                  <strong style={{ color: '#6366F1', fontFamily: 'JetBrains Mono' }}>{formData.sleep_stress_composite} / 5</strong>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { val: 1, label: '1 - إجهاد حاد' },
                    { val: 2, label: '2 - ضغط وقلق' },
                    { val: 3, label: '3 - معتدل' },
                    { val: 4, label: '4 - نوم جيد' },
                    { val: 5, label: '5 - استشفاء مثالي' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, sleep_stress_composite: item.val })}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.sleep_stress_composite === item.val ? '#6366F1' : '#FFFFFF',
                        color: formData.sleep_stress_composite === item.val ? '#FFFFFF' : '#475569',
                        border: formData.sleep_stress_composite === item.val ? '1px solid #6366F1' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retrospective: Menstrual Phase */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  المرحلة الهرمونية الحالية (خاص بالإناث):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'NOT_APPLICABLE', label: 'غير منطبق / ذكر' },
                    { id: 'FOLLICULAR', label: 'الطور الجريبي (بعد الدورة مباشرة)' },
                    { id: 'OVULATION', label: 'فترة التبويض (منتصف الشهر)' },
                    { id: 'LUTEAL', label: 'الطور الأصفري (ما قبل الدورة بأيام)' },
                    { id: 'MENSTRUATION', label: 'فترة الدورة الشهرية الحالية' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, menstrual_phase: item.id })}
                      style={{
                        padding: '10px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.menstrual_phase === item.id ? '#0F172A' : '#F8FAFC',
                        color: formData.menstrual_phase === item.id ? '#FFFFFF' : '#475569',
                        border: formData.menstrual_phase === item.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
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

              {/* Prospective: Forward-Looking Week Preview */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  <Calendar size={16} color="#0284C7" />
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>استشراف واستعدادات الأسبوع القادم</strong>
                </div>

                {/* Travel Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    هل لديك سفر أو تنقلات خارج مدينتك الأسبوع القادم؟
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, next_week_travel: true })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.next_week_travel ? '#0F172A' : '#FFFFFF',
                        color: formData.next_week_travel ? '#FFFFFF' : '#475569',
                        border: formData.next_week_travel ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      نعم، لدي سفر
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, next_week_travel: false })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: !formData.next_week_travel ? '#0F172A' : '#FFFFFF',
                        color: !formData.next_week_travel ? '#FFFFFF' : '#475569',
                        border: !formData.next_week_travel ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      لا، متواجد في مكاني
                    </button>
                  </div>
                </div>

                {/* Gym Available Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    هل الجيم / مكان التمرين متاح لك بانتظام الأسبوع القادم؟
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, next_week_gym_available: true })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: formData.next_week_gym_available ? '#0F172A' : '#FFFFFF',
                        color: formData.next_week_gym_available ? '#FFFFFF' : '#475569',
                        border: formData.next_week_gym_available ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      متاح وجاهز للتمرين
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, next_week_gym_available: false })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: !formData.next_week_gym_available ? '#0F172A' : '#FFFFFF',
                        color: !formData.next_week_gym_available ? '#FFFFFF' : '#475569',
                        border: !formData.next_week_gym_available ? '1px solid #0F172A' : '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      غير متاح / بديل منزلي
                    </button>
                  </div>
                </div>

                {/* Realistic Days Next Week */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    كم يوماً تستطيع الالتزام بالتمرين واقعياً الأسبوع القادم؟
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, next_week_realistic_days: num })}
                        style={{
                          flex: 1,
                          height: '34px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '12px',
                          fontFamily: 'JetBrains Mono',
                          border: formData.next_week_realistic_days === num ? '1px solid #0284C7' : '1px solid #CBD5E1',
                          background: formData.next_week_realistic_days === num ? '#0284C7' : '#FFFFFF',
                          color: formData.next_week_realistic_days === num ? '#FFFFFF' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Week Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    أي مناسبات، ضغوط عمل، أو ظروف خاصة بالأسبوع القادم تود إخبار الكوتش بها؟
                  </label>
                  <input
                    type="text"
                    value={formData.next_week_notes}
                    onChange={(e) => setFormData({ ...formData, next_week_notes: e.target.value })}
                    placeholder="مثال: عندي امتحانات يومين، أو عزومة عائلية في الويك إند..."
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 12px',
                      fontSize: '12px',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  />
                </div>
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
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <CheckCircle2 size={32} />
            </div>
            
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>تم إرسال التقييم الأسبوعي بنجاح</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', maxWidth: '420px', lineHeight: 1.6 }}>
                تم استلام قياساتك ومؤشراتك الحيوية وصور التطور بنجاح. يقوم الكوتش بمراجعة أدائك لتحديث الخطة وتوجيهات الأسبوع القادم.
              </p>
            </div>

            {/* Quick Metrics Summary Box */}
            <div style={{ width: '100%', maxWidth: '400px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', textAlign: 'right', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>الوزن المسجل:</span>
                <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{formData.weight_kg} كجم</strong>
              </div>
              {formData.waist_circumference_cm && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>محيط الخصر:</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{formData.waist_circumference_cm} سم</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>نسبة الالتزام بالدايت:</span>
                <strong style={{ color: '#16A34A' }}>{formData.nutrition_adherence_percent}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>جلسات التمرين المنجزة:</span>
                <strong style={{ color: '#0F172A' }}>{formData.workouts_completed} أيام</strong>
              </div>
            </div>

            {/* Actions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px', marginTop: '6px' }}>
              <a 
                href={`https://wa.me/${coachWhatsApp}?text=${encodeURIComponent(`كابتن، قمت بإرسال تقييم المتابعة الأسبوعية.\nالوزن الحالي: ${formData.weight_kg} كجم\nالالتزام بالدايت: ${formData.nutrition_adherence_percent}%\nجلسات التمرين: ${formData.workouts_completed} أيام`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  height: '42px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)'
                }}
              >
                <MessageCircle size={16} />
                <span>إشعار الكابتن عبر WhatsApp بتحديث الوزن</span>
              </a>

              <button 
                type="button" 
                onClick={() => navigate('/client/today')} 
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                العودة إلى تطبيقي اليومي
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/coach/checkin-review')} 
                style={{
                  height: '34px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#64748B',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer'
                }}
              >
                معاينة لوحة مراجعة التقييمات للكوتش
              </button>
            </div>
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
                  if (step === 1) {
                    const clean = clientIdentifier.trim().replace(/^#+/, '').replace(/^client[-_]?/i, '');
                    if (!clean || clean.toLowerCase() === 'guest') {
                      setError('يرجى إدخال كود المشترك أو رقم الهاتف المسجل للمتابعة');
                      return;
                    }
                    if (!formData.weight_kg) {
                      setError('يرجى إدخال وزنك الحالي قبل المتابعة');
                      return;
                    }
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
