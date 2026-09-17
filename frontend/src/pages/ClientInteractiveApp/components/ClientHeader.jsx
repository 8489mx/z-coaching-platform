import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, FileDown, Zap, Sparkles, Droplets } from 'lucide-react';
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

export default function ClientHeader({
  clientData,
  isOffline,
  syncStatus,
  isSyncing,
  handleTriggerSync,
  setEmergencyModalOpen,
  selectedDay,
  setSelectedDay
}) {
  const navigate = useNavigate();

  if (!clientData) return null;

  return (
    <>
      {/* Top App Header - Ultra Clean Executive Light Theme */}
      <header 
        style={{
          background: '#FFFFFF',
          color: '#0F172A',
          padding: '14px 16px 12px 16px',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        {/* Row 1: Client Identity & Sync Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          {/* Identity & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.85rem',
                flexShrink: 0
              }}
            >
              KZ
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {clientData.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '10px', 
                  color: clientData.package?.includes('ELITE') ? '#0284C7' : '#D97706', 
                  background: clientData.package?.includes('ELITE') ? '#F0F9FF' : '#FFFBEB', 
                  border: `1px solid ${clientData.package?.includes('ELITE') ? '#BAE6FD' : '#FDE68A'}`,
                  padding: '1px 6px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {formatPackageName(clientData.package)}
                </span>
                <span style={{ 
                  fontSize: '10px', 
                  color: '#059669', 
                  background: '#ECFDF5', 
                  border: '1px solid #A7F3D0', 
                  padding: '1px 6px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {clientData.streak} يوم التزام
                </span>
                {clientData.fastingProfile?.isCoptic && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#7C3AED', 
                    background: '#F5F3FF', 
                    border: '1px solid #DDD6FE', 
                    padding: '1px 6px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي' : 'صيام مع سمك'}
                  </span>
                )}
                {clientData.fastingProfile?.isRamadan && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#B45309', 
                    background: '#FFFBEB', 
                    border: '1px solid #FDE68A', 
                    padding: '1px 6px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    صيام رمضان
                  </span>
                )}
                {clientData.fastingProfile?.isIntermittent && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#0369A1', 
                    background: '#F0F9FF', 
                    border: '1px solid #BAE6FD', 
                    padding: '1px 6px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.fastingProfile.intermittentBadge?.shortLabel || 'متقطع'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sync Status Badge & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: syncStatus?.is_fully_synced ? '#DCFCE7' : '#FEF3C7',
                border: `1px solid ${syncStatus?.is_fully_synced ? '#86EFAC' : '#FCD34D'}`,
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 700,
                color: syncStatus?.is_fully_synced ? '#15803D' : '#B45309'
              }}
              title={syncStatus?.status_badge_ar}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: syncStatus?.is_fully_synced ? '#16A34A' : '#D97706' }}></div>
              <span>{syncStatus?.is_fully_synced ? 'متزامن' : `${syncStatus?.pending_count} محلي`}</span>
            </div>

            {!syncStatus?.is_fully_synced && (
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                style={{
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="مزامنة التعديلات الآن"
              >
                <RotateCcw style={{ width: '10px', height: '10px', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSyncing ? '...' : 'مزامنة'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Clean 3-Action Grid Bar (Zero Horizontal Overflow) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '6px', marginBottom: '8px' }}>
          {/* Direct PDF Download */}
          <button
            type="button"
            onClick={() => {
              const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
              window.open(`/program-pdf?code=${encodeURIComponent(rawCode || '1')}`, '_blank');
            }}
            style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '8px',
              padding: '6px 4px',
              color: '#0284C7',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E0F2FE';
              e.currentTarget.style.borderColor = '#7DD3FC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F0F9FF';
              e.currentTarget.style.borderColor = '#BAE6FD';
            }}
            title="تحميل وثيقة الخطة التنفيذية الرسمية بصيغة PDF وطباعتها"
          >
            <FileDown size={13} />
            <span>تحميل الخطة (PDF)</span>
          </button>

          {/* Daily Flexibility Button */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '6px 4px',
              color: '#334155',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
            title="تكييف الخطة وظروف السفر والعزومات"
          >
            <Zap size={13} style={{ color: '#F59E0B' }} />
            <span>مرونة اليوم</span>
          </button>

          {/* Renew Button */}
          <button
            type="button"
            onClick={() => navigate('/renew')}
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '6px 4px',
              color: '#B45309',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF3C7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFBEB';
            }}
            title="تجديد الاشتراك أونلاين"
          >
            <Sparkles size={13} style={{ color: '#D97706' }} />
            <span>تجديد</span>
          </button>
        </div>

        {/* Row 3: Daily Health & Activity Indicators Micro-Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '6px', 
            fontSize: '0.7rem', 
            marginBottom: '10px' 
          }}
        >
          <div 
            style={{ 
              background: '#F0F9FF', 
              border: '1px solid #BAE6FD', 
              borderRadius: '8px', 
              padding: '5px 6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px',
              color: '#0369A1',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
            title="معدل الترطيب اليومي المستهدف: 3.5 إلى 4.0 لتر موزعة على مدار اليوم"
          >
            <Droplets size={12} style={{ color: '#0284C7', flexShrink: 0 }} />
            <span>ماء: 3.5 - 4 لتر</span>
          </div>

          <div 
            style={{ 
              background: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              padding: '5px 6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px',
              color: '#475569',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }} 
            title={getCaffeineCutoffTime("23:00").directive_ar}
          >
            <span>إيقاف كافيين: 5:00 م</span>
          </div>

          <div 
            style={{ 
              background: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              padding: '5px 6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px',
              color: '#334155',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
            title="النشاط الحركي اليومي المستهدف: 8,500 خطوة لدعم معدل الحرق وصحة القلب"
          >
            <span>نشاط: 8,500 خطوة</span>
          </div>
        </div>

        {/* Row 4: Days Selector Strip */}
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                style={{
                  flex: '1 0 auto',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 800 : 600,
                  background: isSelected ? '#0284C7' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'center'
                }}
              >
                {dayName}
              </button>
            );
          })}
        </div>
      </header>

      {/* Offline Gym Mode Reliability Banner */}
      {isOffline && (
        <div style={{
          margin: '10px 16px 0 16px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRight: '4px solid #F59E0B',
          borderRadius: '10px',
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, lineHeight: 1.4 }}>
            وضع عدم الاتصال بالإنترنت نشط — جميع التمارين الاسترشادية والبدائل محفوظة محلياً وتعمل بدون انقطاع داخل صالة الجيم.
          </span>
        </div>
      )}

      {/* Clinical Medication Safety Notice (Unobtrusive - Only for thyroid medication users) */}
      {clientData.clinicalProfile?.takes_thyroid_med && (
        <div style={{ margin: '12px 16px 0 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '0.72rem', color: '#475569', lineHeight: '1.4' }}>
          <strong style={{ color: '#0F172A' }}>تنبيه علاجي (Eltroxin):</strong> حظر تناول الألبان، مكملات الكالسيوم أو الحديد لمدة 4 ساعات من جرعة الصباح لضمان الامتصاص الكامل.
        </div>
      )}

      {/* Active Fasting Mode Status Strip */}
      {clientData.fastingProfile && (clientData.fastingProfile.isCoptic || clientData.fastingProfile.isIntermittent || clientData.fastingProfile.isRamadan) && (
        <div style={{
          margin: '8px 16px 0 16px',
          background: '#FFFFFF',
          border: `1px solid ${clientData.fastingProfile.isCoptic ? '#DDD6FE' : (clientData.fastingProfile.isRamadan ? '#FDE68A' : '#BAE6FD')}`,
          borderRight: `4px solid ${clientData.fastingProfile.isCoptic ? '#7C3AED' : (clientData.fastingProfile.isRamadan ? '#D97706' : '#0284C7')}`,
          borderRadius: '10px',
          padding: '7px 12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: clientData.fastingProfile.isCoptic ? '#7C3AED' : (clientData.fastingProfile.isRamadan ? '#D97706' : '#0284C7') }} />
            <strong style={{ fontSize: '0.74rem', color: '#0F172A' }}>
              {clientData.fastingProfile.isCoptic 
                ? (clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي' : 'صيام مع سمك')
                : (clientData.fastingProfile.isRamadan 
                    ? 'بروتوكول صيام رمضان'
                    : `صيام متقطع (${clientData.fastingProfile.intermittentBadge?.label || '16/8'})`)}
            </strong>
          </div>
          <span style={{ 
            fontSize: '0.66rem', 
            color: clientData.fastingProfile.isCoptic ? '#6D28D9' : (clientData.fastingProfile.isRamadan ? '#B45309' : '#0369A1'), 
            fontWeight: 700 
          }}>
            بروتوكول نشط
          </span>
        </div>
      )}
    </>
  );
}
