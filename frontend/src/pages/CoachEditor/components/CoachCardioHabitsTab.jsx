import React, { useState } from 'react';
import {
  Zap,
  ArrowRightLeft,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Pill,
  Minus,
  Footprints,
  Droplets,
  Moon,
  Activity,
  Flame
} from 'lucide-react';
import { getStandardSupplementCatalog } from '../../../utils/clinicalSupplementSafetyEngine';
import { evaluateCardioInterferenceDecoupling, CARDIO_INTENSITIES } from '../../../utils/cardioInterferenceEngine';
import { getPracticalCardioPrescription, CARDIO_TYPES } from '../../../utils/cardioZonesEngine';
import CurvedSelect from '../../../components/common/CurvedSelect';

export function CoachCardioHabitsTab({
  program,
  setCardioSwapModal,
  handleUpdateCardioParam,
  handleUpdateSupplementsInCardio,
  coachNotes,
  setCoachNotes
}) {
  const [selectedCatalogSupp, setSelectedCatalogSupp] = useState('CREATINE');

  const clientConditions = [
    ...(Array.isArray(program?.client?.injuries) ? program.client.injuries : []),
    ...(Array.isArray(program?.client?.allergies) ? program.client.allergies : []),
    ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
  ];

  const _clientMeds = [
    ...(Array.isArray(program?.client?.medications) ? program.client.medications : []),
    ...(Array.isArray(program?.client?.current_meds_supplements_list) ? program.client.current_meds_supplements_list : [])
  ];

  const _clientBiomarkers = program?.client?.biomarkers || program?.client?.lab_markers || {};

  const modality = String(program?.cardio?.modality || '');
  const zone = String(program?.cardio?.target_heart_rate_zone || '');
  const isHiitCardio = /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);

  const rawClientAge = program?.client?.age ?? program?.client_profile?.age ?? null;
  const clientAge = Number.isFinite(Number(rawClientAge)) && Number(rawClientAge) > 0 ? Number(rawClientAge) : null;
  const interferenceAudit = evaluateCardioInterferenceDecoupling({
    age: clientAge,
    cardio_type: isHiitCardio ? CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT : CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
    is_same_day: true
  });
  const practicalCardio = getPracticalCardioPrescription({
    type: isHiitCardio ? CARDIO_TYPES.HIIT_INTERVALS : CARDIO_TYPES.LISS_TALK_TEST,
    duration_minutes: Number(program.cardio?.session_duration_min) || 30,
    sessions_per_week: Number(program.cardio?.weekly_sessions) || 3,
    medicalConditions: clientConditions,
    weight_kg: program?.client?.weight_kg,
    height_cm: program?.client?.height_cm
  });
  // HIIT chosen by the coach but blocked by the engine (asthma, cardiovascular, pregnancy, BMI >= 35).
  const hiitBlocked = isHiitCardio && practicalCardio.clinical_guardrails?.hiit_banned === true;

  // Active supplements array
  const currentSupplements = Array.isArray(program?.cardio?.supplements) ? program.cardio.supplements : [];
  
  const supplementCatalog = getStandardSupplementCatalog();

  const handleAddSupplement = () => {
    if (!selectedCatalogSupp) return;
    const catItem = supplementCatalog.find(c => c.code === selectedCatalogSupp);
    if (!catItem) return;

    // Avoid duplicates
    if (currentSupplements.some(s => (s.code || s.name || s) === catItem.code)) return;

    const newSuppItem = {
      code: catItem.code,
      name: catItem.name_ar,
      dosage: catItem.standard_dosage || '',
      timing: (catItem.category === 'STIMULANT' || catItem.category === 'PERFORMANCE') ? 'قبل التمرين بـ 30 دقيقة' : 'مع وجبة الإفطار',
      category: catItem.category
    };

    const updated = [...currentSupplements, newSuppItem];
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  const handleUpdateSupplementField = (idx, field, val) => {
    const updated = currentSupplements.map((s, i) => {
      if (i === idx) {
        if (typeof s === 'string') return { code: s, name: s, [field]: val };
        return { ...s, [field]: val };
      }
      return s;
    });
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  const handleRemoveSupplement = (suppCode) => {
    const updated = currentSupplements.filter(s => (s.code || s.name || s) !== suppCode);
    if (typeof handleUpdateSupplementsInCardio === 'function') {
      handleUpdateSupplementsInCardio(updated);
    } else {
      handleUpdateCardioParam('supplements', updated);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} dir="rtl">
      
      {/* 1. Cardio Modality Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F4F0FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#673DE6'
            }}>
              <Activity size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>نظام وجهاز الكارديو:</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>تحديد النمط والشدة وبروتوكول الفصل الجزيئي لمنع الهدم</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCardioSwapModal(true)}
            style={{
              height: '34px',
              padding: '0 14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#344054',
              border: '1px solid #D0D5DD',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
              e.currentTarget.style.borderColor = '#673DE6';
              e.currentTarget.style.color = '#673DE6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D0D5DD';
              e.currentTarget.style.color = '#344054';
            }}
          >
            <ArrowRightLeft size={13} />
            <span>تبديل الجهاز / النمط</span>
          </button>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Modality Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#101828',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
              }}>
                {program.cardio?.modality || 'مشي على سير مائل (Incline Treadmill)'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              بروتوكول هوائي محسوب للهدف الاستشفائي والدهون
            </span>
          </div>

          {/* Cardio Volume Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            paddingTop: '8px',
            borderTop: '1px solid #E2E8F0'
          }}>
            {/* Control 1: Weekly Sessions Stepper */}
            <div>
              <label style={{ fontSize: '11px', color: '#475467', display: 'block', marginBottom: '4px', fontWeight: 700 }}>الجلسات أسبوعياً</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                direction: 'ltr',
                background: '#FFFFFF',
                border: '1px solid #D0D5DD',
                borderRadius: '8px',
                height: '34px',
                padding: '0 4px',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
              }}>
                <button
                  type="button"
                  onClick={() => handleUpdateCardioParam('weekly_sessions', Math.max(1, (Number(program.cardio?.weekly_sessions) || 3) - 1))}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#344054',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#101828' }} dir="rtl">
                  {program.cardio?.weekly_sessions || 3} جلسات
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateCardioParam('weekly_sessions', (Number(program.cardio?.weekly_sessions) || 3) + 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#344054',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Control 2: Duration Stepper */}
            <div>
              <label style={{ fontSize: '11px', color: '#475467', display: 'block', marginBottom: '4px', fontWeight: 700 }}>مدة الجلسة (دقيقة)</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                direction: 'ltr',
                background: '#FFFFFF',
                border: '1px solid #D0D5DD',
                borderRadius: '8px',
                height: '34px',
                padding: '0 4px',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
              }}>
                <button
                  type="button"
                  onClick={() => handleUpdateCardioParam('session_duration_min', Math.max(10, (Number(program.cardio?.session_duration_min) || 30) - 5))}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#344054',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#101828' }} dir="rtl">
                  {program.cardio?.session_duration_min || 30} دقيقة
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateCardioParam('session_duration_min', (Number(program.cardio?.session_duration_min) || 30) + 5)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#F1F5F9',
                    color: '#344054',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Control 3: Heart Rate Zone Select */}
            <div>
              <label style={{ fontSize: '11px', color: '#475467', display: 'block', marginBottom: '4px', fontWeight: 700 }}>نطاق النبض المستهدف</label>
              <CurvedSelect
                value={program.cardio?.target_heart_rate_zone || 'Zone 2'}
                onChange={(e) => handleUpdateCardioParam('target_heart_rate_zone', e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '8px',
                  border: hiitBlocked ? '1.5px solid #EF4444' : '1px solid #D0D5DD',
                  background: hiitBlocked ? '#FEF2F2' : '#FFFFFF',
                  color: hiitBlocked ? '#DC2626' : '#101828',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                }}
              >
                <option value="Zone 1">Zone 1 (استشفاء خفيف)</option>
                <option value="Zone 2">Zone 2 (حرق دهون وتحمل - موصى به)</option>
                <option value="Zone 3">Zone 3 (تحمل هوائي متوسط)</option>
                <option value="Zone 4 / HIIT">Zone 4 / HIIT (كثافة عالية)</option>
              </CurvedSelect>
            </div>
          </div>

          {/* Practical Talk-Test & AMPK-mTOR Decoupling */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px',
            paddingTop: '8px',
            borderTop: '1px solid #E2E8F0',
            alignItems: 'stretch'
          }}>
            {/* Talk Test */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              height: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#2563EB" />
                  <span>بروتوكول اختبار التحدث (Talk-Test)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475467', lineHeight: 1.5 }}>
                  {practicalCardio.talk_test_cue_ar}
                </div>
                {practicalCardio.clinical_guidance_ar && (
                  <div style={{ fontSize: '10.5px', color: '#B91C1C', fontWeight: 700, marginTop: '2px', lineHeight: 1.4 }}>
                    {practicalCardio.clinical_guidance_ar}
                  </div>
                )}
              </div>
              {interferenceAudit?.heart_rate_prescription?.range_display && (
                <div style={{
                  fontSize: '10.5px',
                  color: '#1D4ED8',
                  fontWeight: 800,
                  marginTop: '4px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'fit-content'
                }}>
                  {clientAge ? `النبض المستهدف (العمر ${clientAge} سنة): ${interferenceAudit.heart_rate_prescription.range_display}` : interferenceAudit.heart_rate_prescription.range_display}
                </div>
              )}
            </div>

            {/* AMPK-mTOR Molecular Decoupling */}
            <div style={{
              background: interferenceAudit.has_interference_risk ? '#FEF2F2' : '#F0FDF4',
              border: interferenceAudit.has_interference_risk ? '1px solid #FECACA' : '1px solid #BBF7D0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '6px',
              height: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: interferenceAudit.has_interference_risk ? '#B91C1C' : '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={14} color={interferenceAudit.has_interference_risk ? '#DC2626' : '#16A34A'} />
                  <span>الفصل الجزيئي لمنع الهدم العضلي (AMPK-mTOR)</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: interferenceAudit.has_interference_risk ? '#991B1B' : '#15803D',
                  lineHeight: 1.5
                }}>
                  {interferenceAudit.timing_verdict_ar}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supplements Schedule Section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <Pill size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>جدول المكملات الغذائية اليومية:</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>تحديد المكملات والجرعات ومواعيد التناول اليومية للمتدرب</div>
            </div>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '6px',
            background: currentSupplements.length > 0 ? '#DCFCE7' : '#F1F5F9',
            color: currentSupplements.length > 0 ? '#166534' : '#475569',
            border: currentSupplements.length > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0'
          }}>
            {currentSupplements.length} مكملات محددة
          </span>
        </div>

        {/* Add Supplement Picker */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', maxWidth: '520px' }}>
          <div style={{ flex: 1 }}>
            <CurvedSelect
              value={selectedCatalogSupp}
              onChange={(e) => setSelectedCatalogSupp(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #D0D5DD',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#101828',
                outline: 'none',
                background: '#FFFFFF',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
              }}
            >
              {supplementCatalog.map(supp => (
                <option key={supp.code} value={supp.code}>
                  {supp.name_ar} ({supp.standard_dosage})
                </option>
              ))}
            </CurvedSelect>
          </div>

          <button
            type="button"
            onClick={handleAddSupplement}
            style={{
              height: '36px',
              padding: '0 16px',
              borderRadius: '8px',
              background: '#673DE6',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
          >
            <Plus size={14} strokeWidth={2.4} />
            <span>إضافة مكمل</span>
          </button>
        </div>

        {/* Empty State vs List */}
        {currentSupplements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '14px 16px',
            color: '#64748B',
            fontSize: '12px',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Pill size={16} color="#94A3B8" />
            <span style={{ fontWeight: 600 }}>لم يتم إدراج مكملات غذائية لهذا المشترك بعد. اختر من القائمة بالأعلى لإضافة مكمل.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1fr) 36px',
              gap: '8px',
              padding: '8px 12px',
              background: '#F1F5F9',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#475467'
            }}>
              <span>اسم المكمل</span>
              <span>الجرعة المحددة</span>
              <span>موعد التناول</span>
              <span style={{ textAlign: 'center' }}>إجراء</span>
            </div>

            {/* Supplement Rows */}
            {currentSupplements.map((supp, idx) => {
              const suppName = typeof supp === 'string' ? supp : (supp.name || supp.name_ar || supp.code);
              const suppDosage = typeof supp === 'string' ? '' : (supp.dosage || supp.standard_dosage || '');
              const suppTiming = typeof supp === 'string' ? '' : (supp.timing || '');

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1fr) 36px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    border: '1px solid #EAECF0',
                    borderRadius: '8px',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#EAECF0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800 }}>{suppName}</strong>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={suppDosage}
                      onChange={(e) => handleUpdateSupplementField(idx, 'dosage', e.target.value)}
                      placeholder="مثال: 5 جم يومياً"
                      style={{
                        width: '100%',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 8px',
                        fontSize: '11.5px',
                        color: '#101828',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={suppTiming}
                      onChange={(e) => handleUpdateSupplementField(idx, 'timing', e.target.value)}
                      placeholder="مثال: بعد التمرين مباشرة"
                      style={{
                        width: '100%',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 8px',
                        fontSize: '11.5px',
                        color: '#101828',
                        background: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplement(supp.code || supp.name || supp)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all 0.12s ease'
                      }}
                      title="حذف المكمل"
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Daily Habits Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B45309'
            }}>
              <Flame size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>المؤشرات والعادات اليومية (NEAT & Hydration):</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>مستهدفات النشاط غير الرياضي، والترطيب، وساعات النوم</div>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>انقر لتعديل الأرقام مباشرة</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Steps */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Footprints size={14} color="#673DE6" />
                الخطوات اليومية المستهدفة
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#F4F0FD', color: '#673DE6', border: '1px solid #EDE8FA' }}>
                NEAT
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #D0D5DD',
              borderRadius: '8px',
              padding: '0 10px',
              height: '38px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
            }}>
              <input
                type="number"
                step="500"
                min="3000"
                max="30000"
                value={program.cardio?.neat_target_steps || 8500}
                onChange={(e) => handleUpdateCardioParam('neat_target_steps', Number(e.target.value) || 8500)}
                style={{
                  width: '68px',
                  height: '100%',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#101828',
                  outline: 'none',
                  background: 'transparent',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>خطوة / اليوم</span>
            </div>
          </div>

          {/* Water */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Droplets size={14} color="#0284C7" />
                شرب الماء اليومي
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                ترطيب
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #D0D5DD',
              borderRadius: '8px',
              padding: '0 10px',
              height: '38px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
            }}>
              <input
                type="number"
                step="0.2"
                min="1"
                max="10"
                value={program.cardio?.daily_water_target_liters || 3.8}
                onChange={(e) => handleUpdateCardioParam('daily_water_target_liters', Number(e.target.value) || 3.8)}
                style={{
                  width: '48px',
                  height: '100%',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#101828',
                  outline: 'none',
                  background: 'transparent',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>لتر / اليوم</span>
            </div>
          </div>

          {/* Sleep */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', color: '#475467', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Moon size={14} color="#4F46E5" />
                ساعات النوم المستهدفة
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
                استشفاء
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #D0D5DD',
              borderRadius: '8px',
              padding: '0 10px',
              height: '38px',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
            }}>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={program.cardio?.sleep_target_hours || 8}
                onChange={(e) => handleUpdateCardioParam('sleep_target_hours', Number(e.target.value) || 8)}
                style={{
                  width: '40px',
                  height: '100%',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#101828',
                  outline: 'none',
                  background: 'transparent',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>ساعات / ليلة</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Coach Directives & Final Plan Notes */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A'
            }}>
              <FileText size={17} />
            </div>
            <div>
              <strong style={{ fontSize: '13.5px', color: '#101828', fontWeight: 800 }}>ملاحظات وتوجيهات الكوتش الخاصة للمشترك:</strong>
              <div style={{ fontSize: '11px', color: '#64748B' }}>تظهر هذه التوجيهات بوضوح في بداية وثيقة الـ PDF وتطبيق المتدرب</div>
            </div>
          </div>
        </div>

        <textarea
          rows={4}
          placeholder="اكتب التوجيهات الختامية والنصائح المخصصة للمشترك قبل اعتماد الخطة..."
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          style={{
            width: '100%',
            borderRadius: '10px',
            border: '1px solid #D0D5DD',
            background: '#F8FAFC',
            padding: '12px 14px',
            fontSize: '12.5px',
            lineHeight: 1.7,
            color: '#101828',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'Cairo, sans-serif',
            resize: 'vertical',
            minHeight: '90px',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#673DE6'; e.currentTarget.style.background = '#FFFFFF'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#D0D5DD'; e.currentTarget.style.background = '#F8FAFC'; }}
        />
      </div>

    </div>
  );
}
