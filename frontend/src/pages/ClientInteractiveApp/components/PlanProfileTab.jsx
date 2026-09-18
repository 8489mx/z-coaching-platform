import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileDown, 
  Zap, 
  Sparkles, 
  Droplets, 
  Clock, 
  Footprints, 
  Activity, 
  ShieldCheck, 
  ChevronLeft 
} from 'lucide-react';
import { getCaffeineCutoffTime } from '../../../utils/circadianLabTriggerEngine';

function formatPackageName(pkg) {
  if (!pkg) return 'باقة التدريب المخصص';
  const str = String(pkg).toUpperCase().trim();
  if (str.includes('MAX')) return 'باقة ماكس (4 شهور)';
  if (str.includes('ELITE')) return 'باقة النخبة (إيليت)';
  if (str.includes('PRO')) return 'باقة برو';
  if (str.includes('VIP')) return 'باقة VIP';
  return pkg;
}

export default function PlanProfileTab({
  clientData,
  setEmergencyModalOpen,
  setPdfModalOpen
}) {
  const navigate = useNavigate();

  if (!clientData) return null;

  const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
  const caffeineCutoff = getCaffeineCutoffTime(clientData?.sleep_schedule?.bedtime_hour || clientData?.bedtime_hour || '23:00');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* 1. Subscription & Account Card */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.95rem'
              }}
            >
              KZ
            </div>
            <div>
              <h2 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {clientData.name}
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                كود المشترك: #{rawCode || '882'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/renew')}
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#B45309',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} style={{ color: '#D97706' }} />
            <span>تجديد الاشتراك</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>نوع الباقة التدريبية</span>
            <strong style={{ fontSize: '0.82rem', color: '#0F172A', fontWeight: 800 }}>
              {formatPackageName(clientData.package)}
            </strong>
          </div>

          <div style={{ background: '#F0FDF4', padding: '10px 12px', borderRadius: '10px', border: '1px solid #DCFCE7' }}>
            <span style={{ fontSize: '0.68rem', color: '#166534', display: 'block' }}>سجل الالتزام المستمر</span>
            <strong style={{ fontSize: '0.82rem', color: '#15803D', fontWeight: 800 }}>
              {clientData.streak} يوم التزام متصل
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Official Documents & Daily Flexibility Actions */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block', marginBottom: '10px' }}>
          الوثائق التنفيذية وإدارة الظروف
        </strong>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Download Master PDF */}
          <button
            type="button"
            onClick={() => {
              window.open(`/program-pdf?code=${encodeURIComponent(rawCode || '1')}`, '_blank');
            }}
            style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#0284C7',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileDown size={17} />
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', lineHeight: 1.2 }}>تحميل وطباعة الخطة التنفيذية (PDF)</span>
                <span style={{ fontSize: '0.66rem', color: '#0369A1', fontWeight: 500 }}>نسخة الوثيقة الشاملة لكافة الجداول والوجبات</span>
              </div>
            </div>
            <ChevronLeft size={16} />
          </button>

          {/* Daily Flexibility Button */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#334155',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={17} style={{ color: '#F59E0B' }} />
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', lineHeight: 1.2 }}>مرونة اليوم (الظروف الطارئة)</span>
                <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 500 }}>تكييف الخطة مع السفر، العزومات، أو الإجهاد</span>
              </div>
            </div>
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* 3. Daily Health & Circadian Blueprint (المؤشرات الحيوية اليومية) */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
          المؤشرات الحيوية ونمط الحياة اليومي
        </strong>
        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginBottom: '12px' }}>
          معايير فسيولوجية لدعم الهضم والتمثيل الغذائي وجودة النوم
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Water */}
          <div 
            style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={16} style={{ color: '#0284C7', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.76rem', color: '#0369A1', display: 'block' }}>معدل الترطيب والماء المستهدف</strong>
                <span style={{ fontSize: '0.66rem', color: '#64748B' }}>موزعة بانتظام على مدار ساعات الاستيقاظ</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#0284C7', fontWeight: 800 }}>3.5 - 4.0 لتر/اليوم</strong>
          </div>

          {/* Caffeine */}
          <div 
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#D97706', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.76rem', color: '#0F172A', display: 'block' }}>ميقات إيقاف الكافيين والمنبهات</strong>
                <span style={{ fontSize: '0.66rem', color: '#64748B' }}>قبل موعد النوم بـ {caffeineCutoff.buffer_hours} ساعات لحماية مرحلة النوم العميق</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 800 }}>{caffeineCutoff.caffeine_cutoff_display_ar.replace('الساعة ', '')}</strong>
          </div>

          {/* Activity / Steps */}
          <div 
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Footprints size={16} style={{ color: '#059669', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.76rem', color: '#0F172A', display: 'block' }}>النشاط الحركي اليومي (NEAT)</strong>
                <span style={{ fontSize: '0.66rem', color: '#64748B' }}>لتعزيز حساسية الأنسولين وصحة القلب والأوعية الدموية</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800 }}>8,500 خطوة</strong>
          </div>

          {/* Fasting Protocol Badge if active */}
          {clientData.fastingProfile && (clientData.fastingProfile.isCoptic || clientData.fastingProfile.isIntermittent || clientData.fastingProfile.isRamadan) && (
            <div 
              style={{
                background: '#F5F3FF',
                border: '1px solid #DDD6FE',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.76rem', color: '#6D28D9', display: 'block' }}>بروتوكول الصيام النشط</strong>
                  <span style={{ fontSize: '0.66rem', color: '#64748B' }}>
                    {clientData.fastingProfile.isCoptic 
                      ? (clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي كامل' : 'صيام مع أسماك')
                      : (clientData.fastingProfile.isRamadan ? 'صيام شهر رمضان' : `صيام متقطع (${clientData.fastingProfile.intermittentBadge?.label || '16/8'})`)}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#6D28D9', fontWeight: 800, background: '#EDE9FE', padding: '2px 8px', borderRadius: '6px' }}>
                مفعل
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Weekly Check-in & Measurements Card */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Activity size={18} />
          </div>
          <div>
            <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800, display: 'block' }}>
              المتابعة الأسبوعية وتحديث القياسات
            </strong>
            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
              تسجيل الوزن الأسبوعي وصور التطور للتقييم والتعديل
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          يتم مراجعة استجابة جسمك أسبوعياً لتعديل السعرات، الأحمال التدريبية، ونسب المغذيات وفق معدل النزول أو البناء الفعلي.
        </p>

        <button
          type="button"
          onClick={() => {
            navigate(rawCode ? `/check-in?code=${encodeURIComponent(rawCode)}` : '/check-in');
          }}
          style={{
            width: '100%',
            background: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>الانتقال لنموذج فحص المتابعة (Check-in)</span>
          <ChevronLeft size={16} />
        </button>
      </div>

    </div>
  );
}
