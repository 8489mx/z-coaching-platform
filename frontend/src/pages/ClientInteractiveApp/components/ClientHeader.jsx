import React from 'react';
import { RotateCcw } from 'lucide-react';

function formatPackageName(pkg) {
  if (!pkg) return 'باقة التدريب المخصص';
  const str = String(pkg).toUpperCase().trim();
  if (str.includes('MAX')) return 'باقة MAX';
  if (str.includes('ELITE')) return 'باقة ELITE';
  if (str.includes('PRO')) return 'باقة برو';
  if (str.includes('VIP')) return 'باقة VIP';
  return pkg;
}

export default function ClientHeader({
  clientData,
  isOffline,
  syncStatus,
  isSyncing,
  handleTriggerSync
}) {
  if (!clientData) return null;

  return (
    <>
      {/* Top App Header - Ultra Slim Executive Single-Row Bar (~44px) */}
      <header 
        style={{
          background: '#FFFFFF',
          color: '#0F172A',
          padding: '10px 16px',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Identity & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.82rem',
                flexShrink: 0
              }}
            >
              KZ
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {clientData.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '9.5px', 
                  color: clientData.package?.includes('ELITE') ? '#0284C7' : '#D97706', 
                  background: clientData.package?.includes('ELITE') ? '#F0F9FF' : '#FFFBEB', 
                  border: `1px solid ${clientData.package?.includes('ELITE') ? '#BAE6FD' : '#FDE68A'}`,
                  padding: '1px 5px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {formatPackageName(clientData.package)}
                </span>
                <span style={{ 
                  fontSize: '9.5px', 
                  color: '#059669', 
                  background: '#ECFDF5', 
                  border: '1px solid #A7F3D0', 
                  padding: '1px 5px', 
                  borderRadius: '6px', 
                  fontWeight: 700 
                }}>
                  {clientData.streak} يوم التزام
                </span>
                {clientData.fastingProfile?.isCoptic && (
                  <span style={{ 
                    fontSize: '9.5px', 
                    color: '#7C3AED', 
                    background: '#F5F3FF', 
                    border: '1px solid #DDD6FE', 
                    padding: '1px 5px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي' : 'صيام مع سمك'}
                  </span>
                )}
                {clientData.fastingProfile?.isRamadan && (
                  <span style={{ 
                    fontSize: '9.5px', 
                    color: '#B45309', 
                    background: '#FFFBEB', 
                    border: '1px solid #FDE68A', 
                    padding: '1px 5px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    صيام رمضان
                  </span>
                )}
                {clientData.fastingProfile?.isIntermittent && (
                  <span style={{ 
                    fontSize: '9.5px', 
                    color: '#0369A1', 
                    background: '#F0F9FF', 
                    border: '1px solid #BAE6FD', 
                    padding: '1px 5px', 
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
      </header>

      {/* Offline Gym Mode Reliability Banner */}
      {isOffline && (
        <div style={{
          margin: '10px 16px 0 16px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRight: '4px solid #F59E0B',
          borderRadius: '10px',
          padding: '8px 12px',
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
        <div style={{ margin: '10px 16px 0 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '0.72rem', color: '#475569', lineHeight: '1.4' }}>
          <strong style={{ color: '#0F172A' }}>تنبيه علاجي (Eltroxin):</strong> حظر تناول الألبان، مكملات الكالسيوم أو الحديد لمدة 4 ساعات من جرعة الصباح لضمان الامتصاص الكامل.
        </div>
      )}
    </>
  );
}
