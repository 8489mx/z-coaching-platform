import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { getCaffeineCutoffTime } from '../../../utils/circadianLabTriggerEngine';

export default function ClientHeader({
  clientData,
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
      {/* Top App Header */}
      <header 
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '16px 18px 14px 18px',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        {/* Top Client & Status Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              KZ
            </div>
            <div>
              <h1 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
                {clientData.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  color: clientData.package?.includes('ELITE') ? '#38BDF8' : '#F59E0B', 
                  background: clientData.package?.includes('ELITE') ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                  border: `1px solid ${clientData.package?.includes('ELITE') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  padding: '1px 7px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {clientData.package}
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                  {clientData.streak} يوم التزام
                </span>
                {clientData.fastingProfile?.isCoptic && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#C4B5FD', 
                    background: 'rgba(196, 181, 253, 0.12)', 
                    border: '1px solid rgba(196, 181, 253, 0.25)', 
                    padding: '1px 7px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي صرف' : 'صيام مع أسماك'}
                  </span>
                )}
                {clientData.fastingProfile?.isRamadan && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#FDE68A', 
                    background: 'rgba(253, 230, 138, 0.12)', 
                    border: '1px solid rgba(253, 230, 138, 0.25)', 
                    padding: '1px 7px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    صيام رمضان
                  </span>
                )}
                {clientData.fastingProfile?.isIntermittent && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#7DD3FC', 
                    background: 'rgba(125, 211, 252, 0.12)', 
                    border: '1px solid rgba(125, 211, 252, 0.25)', 
                    padding: '1px 7px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.fastingProfile.intermittentBadge?.shortLabel || 'متقطع'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clean Quick Actions & Sync Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Sync Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: syncStatus?.is_fully_synced ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.15)',
                border: `1px solid ${syncStatus?.is_fully_synced ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.35)'}`,
                borderRadius: '6px',
                padding: '3px 7px',
                fontSize: '10px',
                fontWeight: 700,
                color: syncStatus?.is_fully_synced ? '#86EFAC' : '#FDE047'
              }}
              title={syncStatus?.status_badge_ar}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: syncStatus?.is_fully_synced ? '#22C55E' : '#EAB308' }}></div>
              <span>{syncStatus?.is_fully_synced ? 'متزامن' : `${syncStatus?.pending_count} محلي`}</span>
            </div>

            {!syncStatus?.is_fully_synced && (
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                style={{
                  background: '#38BDF8',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '8px',
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
                <span>{isSyncing ? 'مزامنة...' : 'مزامنة'}</span>
              </button>
            )}

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                padding: '5px 9px',
                color: '#E2E8F0',
                fontSize: '0.72rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="المعدل الاسترشادي لاستهلاك الماء يومياً"
            >
              الماء المستهدف: 3.5 - 4.0 لتر/اليوم
            </div>

            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                padding: '5px 9px',
                color: '#E2E8F0',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="تكييف الخطة وظروف السفر والعزومات"
            >
              مرونة اليوم
            </button>

            <button
              type="button"
              onClick={() => {
                const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
                window.open(`/pdf?code=${encodeURIComponent(rawCode || '1')}`, '_blank');
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '5px 9px',
                color: '#38BDF8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="استعراض وطباعة وثيقة الخطة التنفيذية الرسمية A4 PDF"
            >
              الخطة التنفيذية (PDF)
            </button>

            <button
              type="button"
              onClick={() => navigate('/renew')}
              style={{
                background: 'rgba(217, 119, 6, 0.18)',
                border: '1px solid rgba(217, 119, 6, 0.35)',
                borderRadius: '8px',
                padding: '5px 9px',
                color: '#FDE68A',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="تجديد الاشتراك أونلاين"
            >
              تجديد
            </button>
          </div>
        </div>

        {/* Clean Muted Status Line (Circadian & NEAT) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94A3B8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '8px', marginBottom: '10px' }}>
          <span>{getCaffeineCutoffTime("23:00").directive_ar}</span>
          <span style={{ color: '#CBD5E1', fontWeight: 600 }}>8,500 خطوة (مستقر)</span>
        </div>

        {/* Days Selector Strip */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                style={{
                  flex: '0 0 auto',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 800 : 500,
                  background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#0F172A' : '#94A3B8',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {dayName}
              </button>
            );
          })}
        </div>
      </header>

      {/* Clinical Medication Safety Notice (Unobtrusive - Only for thyroid medication users) */}
      {clientData.clinicalProfile?.takes_thyroid_med && (
        <div style={{ margin: '12px 16px 0 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '0.72rem', color: '#475569', lineHeight: '1.4' }}>
          <strong style={{ color: '#0F172A' }}>تنبيه علاجي (Eltroxin):</strong> حظر تناول الألبان، مكملات الكالسيوم أو الحديد لمدة 4 ساعات من جرعة الصباح لضمان الامتصاص الكامل.
        </div>
      )}

      {/* Active Fasting Mode Status Banner */}
      {clientData.fastingProfile && (clientData.fastingProfile.isCoptic || clientData.fastingProfile.isIntermittent || clientData.fastingProfile.isRamadan) && (
        <div style={{
          margin: '10px 16px 0 16px',
          background: '#FFFFFF',
          border: `1px solid ${clientData.fastingProfile.isCoptic ? '#DDD6FE' : (clientData.fastingProfile.isRamadan ? '#FDE68A' : '#BAE6FD')}`,
          borderRight: `4px solid ${clientData.fastingProfile.isCoptic ? '#7C3AED' : (clientData.fastingProfile.isRamadan ? '#D97706' : '#0284C7')}`,
          borderRadius: '10px',
          padding: '9px 12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <strong style={{ fontSize: '0.76rem', color: '#0F172A' }}>
              {clientData.fastingProfile.isCoptic 
                ? (clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'نمط الصيام المسيحي (نباتي صرف خالي من الأسماك)' : 'نمط الصيام المسيحي (نباتي مع السماح بالأسماك)')
                : (clientData.fastingProfile.isRamadan 
                    ? 'نمط صيام شهر رمضان المبارك (مواقيت الإفطار والسحور)'
                    : `نمط الصيام المتقطع (${clientData.fastingProfile.intermittentBadge?.label || '16/8'})`)}
            </strong>
            <span style={{ 
              fontSize: '0.68rem', 
              color: clientData.fastingProfile.isCoptic ? '#6D28D9' : (clientData.fastingProfile.isRamadan ? '#B45309' : '#0369A1'), 
              fontWeight: 700 
            }}>
              بروتوكول نشط
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4, display: 'block' }}>
            {clientData.fastingProfile.isCoptic
              ? 'الخطة التغذوية مهيأة لتأمين كامل احتياجك من البروتين والأحماض الأمينية النباتية المركبة دون الإخلال بهدفك.'
              : (clientData.fastingProfile.isRamadan
                  ? 'تمت جدولة الوجبات وتوزيع كميات الماء والسوائل بين وجبتي الإفطار والسحور لدعم الاستشفاء والأداء التدريبي.'
                  : 'نافذة الإطعام نشطة؛ حافظ على مواعيد تناول وجباتك ضمن الساعات المحددة مع استمرار الترطيب بالماء على مدار اليوم.')}
          </span>
        </div>
      )}
    </>
  );
}
