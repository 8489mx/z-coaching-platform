import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, MessageCircle, ExternalLink, Zap, ZoomIn } from 'lucide-react';
import { getClientTier } from '../../utils/tierBadgeHelper';
import { extractClientFastingProfile } from '../../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';

export default function IntakeAuditDetailModal({
  submission,
  onClose,
  onGenerateDraft,
  generatingId
}) {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!submission) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        if (previewImage) {
          setPreviewImage(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submission, previewImage, onClose]);

  if (!submission) return null;

  const answers = submission.answers || {};
  const clientName = submission.user?.full_name || answers.full_name || 'بدون اسم';
  const clientCode = String(submission.user?.client_code || submission.id || '').replace(/^client[-_]?/i, '');
  const clientPhone = submission.user?.phone_number || answers.phone || '';

  const handleOpenWhatsApp = () => {
    if (!clientPhone) return;
    const cleanPhone = formatWhatsAppPhone(clientPhone);
    const msg = `مرحباً يا ${clientName}، استلمت استمارتك في Z Coaching وقمت بمراجعة بياناتك وجاري تجهيز خطتك المخصصة`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const renderValue = (val) => {
    if (val === undefined || val === null || val === '') return <span style={{ color: '#94A3B8' }}>لم يُجب</span>;
    if (typeof val === 'boolean') return val ? 'نعم' : 'لا';
    if (Array.isArray(val)) {
      if (val.length === 0) return <span style={{ color: '#94A3B8' }}>لم يُجب</span>;
      return val.join('، ');
    }
    return String(val);
  };

  const FieldRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: '11.5px', color: '#64748B' }}>{label}</span>
      <strong style={{ fontSize: '11.5px', color: '#0F172A', textAlign: 'left' }}>{renderValue(value)}</strong>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '4px', height: '14px', background: '#0284C7', borderRadius: '4px', display: 'inline-block' }} />
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.60)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div 
        style={{
          background: '#F8FAFC',
          borderRadius: '16px',
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.20)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              مراجعة الاستمارة: {clientName}
            </h4>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '8px' }}>
              #{clientCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {clientPhone && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0', background: 'transparent',
                  color: '#16A34A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <MessageCircle size={14} />
                <span>واتساب</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Section title="1) القياسات والهدف">
              <FieldRow label="الجنس" value={answers.gender} />
              <FieldRow label="العمر" value={answers.age} />
              <FieldRow label="الطول (سم)" value={answers.height_cm} />
              <FieldRow label="الوزن (كجم)" value={answers.weight_kg} />
              <FieldRow label="محيط الرقبة (سم)" value={answers.circumferences?.neck_cm} />
              <FieldRow label="محيط الخصر (سم)" value={answers.circumferences?.waist_cm} />
              <FieldRow label="محيط الحوض (سم)" value={answers.circumferences?.hips_cm} />
              <FieldRow label="الهدف الأساسي" value={answers.primary_goal} />
              <FieldRow label="مستوى الحركة اليومية (NEAT)" value={answers.neat_level} />
              <FieldRow label="طبيعة العمل" value={answers.occupation_type} />
            </Section>

            <Section title="2) الملف الطبي">
              <FieldRow label="أعراض خطيرة" value={answers.dangerous_symptoms} />
              <FieldRow label="الحالات الطبية المختارة" value={answers.medical_conditions?.selected} />
              <FieldRow label="نوع السكري" value={answers.medical_conditions?.diabetes?.type} />
              <FieldRow label="يستخدم الإنسولين" value={answers.medical_conditions?.diabetes?.uses_insulin} />
              <FieldRow label="السكر التراكمي (HbA1c)" value={answers.medical_conditions?.diabetes?.hba1c} />
              <FieldRow label="أنيميا الفول (G6PD)" value={answers.medical_conditions?.favism_g6pd} />
              <FieldRow label="ارتفاع ضغط الدم" value={answers.medical_conditions?.hypertension} />
              <FieldRow label="النقرس" value={answers.medical_conditions?.gout} />
              <FieldRow label="عملية سمنة سابقة" value={answers.medical_conditions?.bariatric?.is_operated} />
              <FieldRow label="سعة الوجبة (جرام)" value={answers.medical_conditions?.bariatric?.meal_capacity_grams} />
              <FieldRow label="متلازمة الإغراق (Dumping)" value={answers.medical_conditions?.bariatric?.dumping_syndrome} />
              <FieldRow label="تكيس المبايض (PCOS)" value={answers.medical_conditions?.female_cases?.is_pcos} />
              <FieldRow label="مرضعة" value={answers.medical_conditions?.female_cases?.is_lactating} />
              <FieldRow label="ولادة حديثة" value={answers.medical_conditions?.female_cases?.is_postpartum} />
              <FieldRow label="قائمة الأدوية والمكملات" value={answers.current_meds_supplements_list} />
              <FieldRow label="تفاصيل الأدوية والمكملات" value={answers.current_meds_supplements} />
            </Section>
            
            <Section title="3) الإصابات">
              <FieldRow label="مناطق الإصابة" value={answers.injuries_map?.selected_areas} />
              <FieldRow label="إصابات الركبة" value={answers.injuries_map?.knee} />
              <FieldRow label="إصابات الظهر والعمود الفقري" value={answers.injuries_map?.spine_back} />
              <FieldRow label="إصابات الكتف" value={answers.injuries_map?.shoulder} />
              <FieldRow label="إصابات الكور" value={answers.injuries_map?.core} />
              <FieldRow label="إصابات مفاصل أخرى" value={answers.injuries_map?.other_joints} />
              <FieldRow label="طبيعة الإصابة" value={answers.injuries_map?.injury_nature} />
              <FieldRow label="يخف الألم بالراحة" value={answers.injuries_map?.pain_relieved_by_rest} />
            </Section>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Section title="4) التغذية ونمط الحياة">
              <FieldRow label="الديانة" value={answers.religion} />
              <FieldRow label="نمط الصيام المسيحي" value={answers.christianFastingStyle} />
              <FieldRow label="ممنوعات وحساسية صارمة" value={answers.strict_allergies} />
              <FieldRow label="أطعمة غير مفضلة" value={answers.disliked_foods} />
              <FieldRow label="عدد الوجبات" value={answers.meal_structure?.meals_count} />
              <FieldRow label="صيام متقطع" value={answers.meal_structure?.intermittent_fasting} />
              <FieldRow label="ميزانية الطعام" value={answers.food_budget} />
              <FieldRow label="القدرة على تحضير الطعام" value={answers.food_prep_ability} />
              <FieldRow label="سكر المشروبات" value={answers.beverage_sugar_intake} />
              <FieldRow label="نمط النوم" value={answers.sleep_schedule?.pattern} />
              <FieldRow label="متوسط ساعات النوم" value={answers.sleep_schedule?.average_hours} />
              <FieldRow label="ساعة النوم المعتادة" value={answers.sleep_schedule?.bedtime_hour} />
            </Section>

            <Section title="5) التدريب">
              <FieldRow label="بيئة التدريب" value={answers.training_environment} />
              <FieldRow label="أيام التمرين في الأسبوع" value={answers.training_logistics?.days_per_week} />
              <FieldRow label="مستوى الخبرة" value={answers.training_logistics?.experience_level} />
              <FieldRow label="يمارس رياضة أخرى" value={answers.training_logistics?.has_other_sports} />
              <FieldRow label="اسم الرياضة الأخرى" value={answers.training_logistics?.sports_name} />
              <FieldRow label="ساعات الرياضة الأخرى" value={answers.training_logistics?.hours_per_week} />
              <FieldRow label="التدريب مؤخراً" value={answers.recent_training} />
              <FieldRow label="عضلات التركيز" value={answers.focus_muscles} />
            </Section>

            <Section title="6) الملفات (المرفقات)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '8px' }}>
                {[
                  { key: 'front', title: 'الأمام', src: answers.media_uploads?.front_url },
                  { key: 'side', title: 'الجانب', src: answers.media_uploads?.side_url },
                  { key: 'back', title: 'الخلف', src: answers.media_uploads?.back_url },
                  { key: 'inbody', title: 'InBody', src: answers.media_uploads?.inbody_report_url }
                ].map(item => (
                  <div key={item.key} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', textAlign: 'center', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>{item.title}</span>
                    {item.src ? (
                      <div 
                        style={{ position: 'relative', width: '100%', flex: 1, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => setPreviewImage({ title: `صورة ${item.title}`, src: item.src })}
                      >
                        <img src={item.src} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                          <ZoomIn size={10} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '10px' }}>لم يُجب</span>
                    )}
                  </div>
                ))}
              </div>
              <FieldRow label="مرفقات طبية أخرى" value={answers.media_uploads?.medical_reports_urls?.length ? `${answers.media_uploads.medical_reports_urls.length} ملفات` : null} />
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>

          {(() => {
            const hasDraft = submission.status === 'DRAFT_GENERATED' || submission.status === 'APPROVED';
            return (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {hasDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(`/coach/editor?user_id=${clientCode}`, '_blank');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #93C5FD',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(29, 78, 216, 0.1)'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>فتح الخطة في محرر الكوتش</span>
                  </button>
                )}

                {onGenerateDraft && !hasDraft && (
                  <button
                    type="button"
                    onClick={() => onGenerateDraft(submission)}
                    disabled={generatingId === submission.id}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
                    }}
                  >
                    <Zap size={14} color="#FBBF24" />
                    {generatingId === submission.id ? 'جاري توليد الخطة ونقلك للمحرر...' : 'توليد مسودة الخطة وتخصيصها بالمحرر'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Lightbox for Zoomed Image */}
      {previewImage && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.90)',
            backdropFilter: 'blur(8px)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ maxWidth: '800px', width: '92%', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '14px' }}>{previewImage.title}</span>
              <button 
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
            <img 
              src={previewImage.src} 
              alt="Preview" 
              style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)' }} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
