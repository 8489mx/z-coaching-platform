import React from 'react';
import { X } from 'lucide-react';
import { generateMasterPdfExportData } from '../../../utils/pdfExportEngine';

export default function MasterPdfModal({ 
  isOpen, 
  onClose, 
  clientName = 'أحمد محمد', 
  clientCode = '882', 
  packageTier = 'MAX', 
  currentWeek = 2 
}) {
  if (!isOpen) return null;

  const pdfData = generateMasterPdfExportData({
    client_name: clientName,
    client_code: clientCode,
    package_tier: packageTier,
    current_week: currentWeek
  });

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          direction: 'rtl'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* PDF Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: '6px' }}>
              {pdfData.branding.badge}
            </span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '0.96rem', fontWeight: 900, color: '#0F172A' }}>
              {pdfData.document_title}
            </h3>
            <small style={{ color: '#64748B', fontSize: '0.72rem' }}>{pdfData.branding.platform} • {pdfData.branding.coach_name}</small>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
          </button>
        </div>

        {/* PDF Summary Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.76rem', color: '#334155' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#0F172A' }}>خطة التغذية اليومية ({pdfData.nutrition.daily_calories} Kcal)</h4>
            <p style={{ margin: '0 0 4px 0' }}>• البروتين: {pdfData.nutrition.protein_g}g | الكارب: {pdfData.nutrition.carbs_g}g | الدهون: {pdfData.nutrition.fat_g}g</p>
            <p style={{ margin: 0, color: '#059669', fontWeight: 700 }}>• متاح عرض الكميات بالميزان أو مقاييس اليد البصرية.</p>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#0F172A' }}>الجدول التدريبي المعتمد ({pdfData.training.split_name})</h4>
            <p style={{ margin: '0 0 4px 0' }}>• معايير الشدة: إيقاف الجولات عند <strong>RIR 1-2</strong> مع شارة دروب سيت بالجولة الأخيرة.</p>
            <p style={{ margin: 0 }}>• الكارديو: {pdfData.cardio.protocol_title} ({pdfData.cardio.prescription})</p>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '12px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#166534' }}>إرشادات الالتزام الذهبية</h4>
            <ul style={{ margin: 0, paddingRight: '16px', lineHeight: 1.5 }}>
              <li>وزن الأكل بعد الطهي بالجرامات.</li>
              <li>إيقاف الكافيين قبل النوم بـ 6-8 ساعات.</li>
              <li>شرب 3.5 لتر ماء يومياً.</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => { window.print(); }}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            طباعة / حفظ كـ PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              color: '#475569',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
