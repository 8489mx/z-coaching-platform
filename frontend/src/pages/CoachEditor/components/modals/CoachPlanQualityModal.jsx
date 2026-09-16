import React, { useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Check,
  Send,
  Loader2,
  Activity,
  Dumbbell,
  Utensils,
  Pill,
  HeartPulse,
  Droplets,
  ClipboardList
} from 'lucide-react';
import { auditPlanPreflightQuality, AUDIT_STATUS } from '../../../../utils/planQualityPreflightShield';

export default function CoachPlanQualityModal({
  isOpen,
  onClose,
  program,
  onApproveAndPublish,
  publishing = false
}) {
  const audit = useMemo(() => {
    if (!program) return null;
    return auditPlanPreflightQuality({ program });
  }, [program]);

  if (!isOpen || !audit) return null;

  const isReady = audit.status === AUDIT_STATUS.READY;
  const isBlocked = audit.status === AUDIT_STATUS.BLOCKED;

  const bannerBg = isReady ? '#ECFDF5' : isBlocked ? '#FEF2F2' : '#FFFBEB';
  const bannerBorder = isReady ? '#A7F3D0' : isBlocked ? '#FECACA' : '#FDE68A';
  const bannerColor = isReady ? '#059669' : isBlocked ? '#DC2626' : '#D97706';

  const getCheckIcon = (id) => {
    switch (id) {
      case 'volume_landmarks': return <Dumbbell size={15} />;
      case 'macro_caloric_feasibility': return <Utensils size={15} />;
      case 'clinical_supplement_safety': return <Pill size={15} />;
      case 'injury_contraindications': return <HeartPulse size={15} />;
      case 'diet_variety_hydration': return <Droplets size={15} />;
      case 'prescription_completeness': return <ClipboardList size={15} />;
      default: return <Activity size={15} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        dir="rtl"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: '#0F172A',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                درع الفحص الاستباقي الشامل لجودة الخطة
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                فحص تكامل الحجم التدريبي والمغذيات وسلامة المكملات وموانع الإصابات
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status Verdict Banner */}
          <div style={{
            background: bannerBg,
            border: `1px solid ${bannerBorder}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#FFFFFF',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: bannerColor,
                marginBottom: '6px',
                border: `1px solid ${bannerBorder}`
              }}>
                {isReady ? <ShieldCheck size={13} /> : isBlocked ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
                <span>{audit.status_title_ar}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                {audit.clinical_verdict_ar}
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 900,
                color: bannerColor,
                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                lineHeight: 1
              }}>
                {audit.total_score}
              </div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>من 100 نقطة</span>
            </div>
          </div>

          {/* Six Pillar Checks Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {audit.checks.map(chk => {
              const isChOk = chk.status === 'PASSED';
              const isChWarn = chk.status === 'WARNING';
              const chColor = isChOk ? '#059669' : isChWarn ? '#D97706' : '#DC2626';
              const chBg = isChOk ? '#F0FDF4' : isChWarn ? '#FFFBEB' : '#FEF2F2';

              return (
                <div
                  key={chk.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 700, fontSize: '11.5px' }}>
                      <span style={{ color: chColor }}>{getCheckIcon(chk.id)}</span>
                      <span>{chk.title_ar}</span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: chColor,
                      background: chBg,
                      padding: '1px 6px',
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                    }}>
                      {chk.score} / {chk.max_score}
                    </span>
                  </div>

                  <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(chk.score / chk.max_score) * 100}%`,
                      background: chColor,
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Blockers (if any) */}
          {audit.blockers.length > 0 && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#DC2626', fontWeight: 800, fontSize: '12px' }}>
                <ShieldAlert size={15} />
                <span>موانع حرجة تمنع النشر (Critical Deployment Blockers)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {audit.blockers.map((b, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }}></span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Warnings (if any) */}
          {audit.warnings.length > 0 && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#D97706', fontWeight: 800, fontSize: '12px' }}>
                <AlertTriangle size={15} />
                <span>تنبيهات استرشادية للتحسين (Actionable Advisories)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {audit.warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }}></span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passed Checklist */}
          {audit.passed_items.length > 0 && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#059669', fontWeight: 800, fontSize: '12px' }}>
                <CheckCircle2 size={15} />
                <span>المعايير المعتمدة والمطابقة سريرياً (Verified Clinical Landmarks)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {audit.passed_items.map((p, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={12} color="#059669" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #F1F5F9',
          background: '#F8FAFC',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق الفحص
          </button>

          {audit.is_deployable ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof onApproveAndPublish === 'function') {
                  onApproveAndPublish();
                }
              }}
              disabled={publishing}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
              }}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>اعتماد ونشر الخطة للمتدرب</span>
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 800 }}>
              يجب معالجة الموانع الحرجة أولاً للسماح بالنشر
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
