import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  MessageCircle, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Scale, 
  Utensils, 
  Activity, 
  BrainCircuit, 
  Save, 
  Loader2, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function CheckinReviewDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkin, setCheckin] = useState(null);
  const [macroAdjustments, setMacroAdjustments] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [coachReply, setCoachReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('تم اعتماد التحديث بنجاح، وتم إرسال الإشعار للعميل!');
      navigate('/');
    }, 400);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0F172A' }} />
          <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>جاري سحب التقييمات المعلقة...</strong>
        </div>
      </AdminLayout>
    );
  }

  if (!checkin) {
    return (
      <AdminLayout>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={40} color="#16A34A" style={{ margin: '0 auto 12px auto' }} />
          <strong style={{ fontSize: '16px', color: '#0F172A', display: 'block', marginBottom: '4px' }}>لا توجد تقييمات معلقة</strong>
          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>لقد قمت بمراجعة واعتماد جميع أعمالك لليوم بنجاح!</p>
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            style={{ padding: '8px 20px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            العودة للرئيسية
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title={`مراجعة تقييم العميل: ${checkin.client.name}`}
          description={`التقييم الدوري للأسبوع ${checkin.week_number} • كود المشترك #${checkin.client.code} • باقة ${checkin.client.package}`}
          actions={(
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={14} />
              <span>العودة لطابور القرارات</span>
            </button>
          )}
        />

        {/* 2. Balanced 2-Column Grid (65 / 35) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '18px', alignItems: 'start' }}>
          
          {/* Right Column: Client Assessment & Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Numeric Indicators */}
            <FormSection
              title="المؤشرات الرقمية والحيوية"
              description="تطور الوزن والالتزام والنشاط مقارنة بالأسبوع الماضي."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>الوزن الحالي</span>
                  <strong style={{ fontSize: '18px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {checkin.metrics.current_weight} <span style={{ fontSize: '11px', fontWeight: 600 }}>كجم</span>
                  </strong>
                </div>

                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginBottom: '2px' }}>التغير (دلتا)</span>
                  <strong style={{ fontSize: '18px', color: '#16A34A', fontFamily: 'JetBrains Mono, Cairo', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <TrendingDown size={16} />
                    <span dir="ltr">{checkin.metrics.weight_change} كجم</span>
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>الالتزام بالدايت</span>
                  <strong style={{ fontSize: '18px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {checkin.metrics.adherence}%
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>التمرين (أيام)</span>
                  <strong style={{ fontSize: '18px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {checkin.metrics.workouts_completed} / 4
                  </strong>
                </div>
              </div>

              {/* Biofeedback strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#475569' }}>الطاقة والنشاط:</span>
                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>{checkin.biofeedback.energy} / 10</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#475569' }}>جودة النوم:</span>
                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>{checkin.biofeedback.sleep} / 10</strong>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#B45309' }}>معدل الجوع:</span>
                  <strong style={{ fontSize: '12px', color: '#B45309' }}>{checkin.biofeedback.hunger} / 10 (مرتفع)</strong>
                </div>
              </div>
            </FormSection>

            {/* Photos & Notes */}
            <FormSection
              title="صور التطور ورسالة المتدرب"
              description="مقارنة القياسات البصرية وتعليق المتدرب على أداء الأسبوع."
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px 10px', textAlign: 'center', color: '#64748B' }}>
                  <Camera size={20} style={{ margin: '0 auto 6px auto', color: '#94A3B8' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, display: 'block' }}>الأسبوع الماضي</span>
                  <small style={{ fontSize: '10px', color: '#94A3B8' }}>85.0 كجم</small>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px 10px', textAlign: 'center', color: '#0F172A' }}>
                  <Camera size={20} style={{ margin: '0 auto 6px auto', color: '#0F172A' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, display: 'block' }}>هذا الأسبوع</span>
                  <small style={{ fontSize: '10px', color: '#64748B' }}>84.5 كجم (-0.5)</small>
                </div>
              </div>

              <div style={{ marginTop: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '6px' }}>
                <strong style={{ fontSize: '11.5px', color: '#475569', display: 'block', marginBottom: '3px' }}>رسالة المتدرب:</strong>
                <p style={{ fontSize: '12px', color: '#0F172A', margin: 0, lineHeight: 1.5 }}>
                  "{checkin.client_notes}"
                </p>
              </div>
            </FormSection>

            {/* AI Engine Recommendation */}
            <FormSection
              title="تحليل المحرك السريري الذكي"
              description="توصيات النظام التكيفية المبنية على الدلتا الحسابية."
            >
              <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '12px 14px', borderRadius: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <BrainCircuit size={15} color="#0F172A" />
                  <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>توصية المحرك التكيفي</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {checkin.ai_analysis.recommendation}
                </p>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} />
                  <span>تنبيه: العميل يشتكي من الجوع الليلي؛ ينصح بتثبيت السعرات دون خفض إضافي.</span>
                </div>
              </div>
            </FormSection>

          </div>

          {/* Left Column: Decision & Macro Adjustments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <FormSection
              title="تعديل الماكروز للأسبوع القادم"
              description="ضبط السعرات والجرامات المعتمدة للبرنامج."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>السعرات الكلية</span>
                  <input
                    type="number"
                    value={macroAdjustments.calories}
                    onChange={(e) => setMacroAdjustments({ ...macroAdjustments, calories: Number(e.target.value) })}
                    style={{ width: '80px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>البروتين (g)</span>
                  <input
                    type="number"
                    value={macroAdjustments.protein}
                    onChange={(e) => setMacroAdjustments({ ...macroAdjustments, protein: Number(e.target.value) })}
                    style={{ width: '80px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>الكاربوهيدرات (g)</span>
                  <input
                    type="number"
                    value={macroAdjustments.carbs}
                    onChange={(e) => setMacroAdjustments({ ...macroAdjustments, carbs: Number(e.target.value) })}
                    style={{ width: '80px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>الدهون الصحية (g)</span>
                  <input
                    type="number"
                    value={macroAdjustments.fats}
                    onChange={(e) => setMacroAdjustments({ ...macroAdjustments, fats: Number(e.target.value) })}
                    style={{ width: '80px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none' }}
                  />
                </div>

              </div>
            </FormSection>

            {/* Coach WhatsApp Reply & Submit */}
            <FormSection
              title="رسالة الكوتش واعتماد الخطة"
              description="كتابة التوجيهات وإرسال التحديث لبرنامج المتدرب."
            >
              <div style={{ marginTop: '6px' }}>
                <textarea
                  value={coachReply}
                  onChange={(e) => setCoachReply(e.target.value)}
                  placeholder="اكتب التوجيه والرد التشجيعي للمتدرب..."
                  style={{
                    width: '100%',
                    height: '90px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.4
                  }}
                />

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    height: '38px',
                    marginTop: '10px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={15} />
                      <span>اعتماد التحديث وإرسال للعميل</span>
                    </>
                  )}
                </button>
              </div>
            </FormSection>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
