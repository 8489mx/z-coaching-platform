import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';
import { SlidersHorizontal, AlertCircle, Save, X, History } from 'lucide-react';

export function CorrectMeasurementsModal({
  isOpen,
  onClose,
  checkin,
  client = {},
  onSaved
}) {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (checkin) {
      setWeight(checkin.average_weight_kg ?? checkin.metrics?.current_weight ?? '');
      setWaist(checkin.waist_circumference_cm ?? checkin.metrics?.waist_current ?? '');
      const analysisObj = typeof checkin.analysis_output === 'string'
        ? JSON.parse(checkin.analysis_output)
        : (checkin.analysis_output || {});
      setHip(analysisObj.hip_circumference_cm ?? '');
      setReason('');
      setErrorMsg('');
    }
  }, [checkin, isOpen]);

  if (!isOpen || !checkin) return null;

  const currentWeight = checkin.average_weight_kg ?? checkin.metrics?.current_weight ?? '--';
  const currentWaist = checkin.waist_circumference_cm ?? checkin.metrics?.waist_current ?? '--';

  const analysisObj = typeof checkin.analysis_output === 'string'
    ? JSON.parse(checkin.analysis_output)
    : (checkin.analysis_output || {});
  const corrections = Array.isArray(analysisObj.measurement_corrections)
    ? analysisObj.measurement_corrections
    : [];

  const handleSave = async (e) => {
    e.preventDefault();
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 20 || numWeight > 300) {
      setErrorMsg('يرجى إدخال وزن حقيقي وصالح بين 20 و 300 كجم');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      const token = localStorage.getItem('token');
      const checkinId = checkin.id || checkin.checkin_id;

      const res = await fetch(`${API_BASE}/api/v1/checkin/${checkinId}/measurements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          average_weight_kg: numWeight,
          waist_circumference_cm: waist ? parseFloat(waist) : null,
          hip_circumference_cm: hip ? parseFloat(hip) : null,
          correction_reason: reason.trim() || 'تصحيح قراءة القياس بواسطة الكوتش'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر حفظ القياسات المصححة');
      }

      if (onSaved) {
        onSaved(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ القياسات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F4F0FD',
                color: '#673DE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                تصحيح وتوثيق قياسات المتابعة
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                المتدرب: {client.full_name || client.name || client.client_code || 'المشترك'} (متابعة أسبوع {checkin.week_number})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              border: 'none',
              background: '#F1F5F9',
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

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '9999px',
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#B91C1C',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Stored Info */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#475569'
            }}
          >
            <span>الوزن المسجل حالياً: <strong style={{ color: '#0F172A' }}>{currentWeight} كجم</strong></span>
            <span>محيط الخصر: <strong style={{ color: '#0F172A' }}>{currentWaist} سم</strong></span>
          </div>

          {/* Input: Weight */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              الوزن المصحح (كجم) *
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="مثال: 81.8"
              required
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '9999px',
                border: '1px solid #CBD5E1',
                padding: '0 12px',
                fontSize: '13px',
                fontWeight: 700,
                outline: 'none',
                fontFamily: 'JetBrains Mono, Cairo, sans-serif'
              }}
            />
          </div>

          {/* Grid: Waist & Hip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                محيط الخصر (سم)
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="مثال: 88"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '9999px',
                  border: '1px solid #CBD5E1',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                محيط الأرداف (سم)
              </label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                placeholder="مثال: 104"
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '9999px',
                  border: '1px solid #CBD5E1',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              سبب التصحيح والتوثيق
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تم التأكد من وزن المتدرب بعد مراجعة قراءة الميزان"
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '9999px',
                border: '1px solid #CBD5E1',
                padding: '0 12px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Previous Corrections Audit */}
          {corrections.length > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                <History size={13} />
                <span>سجل التصحيحات السابقة ({corrections.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {corrections.map((c, i) => (
                  <div key={i} style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '3px' }}>
                    <span>من {c.previous_weight_kg} إلى {c.corrected_weight_kg} كجم: {c.reason}</span>
                    <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>{new Date(c.corrected_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '9999px',
                border: 'none',
                background: '#673DE6',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                cursor: saving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(103, 61, 230, 0.25)'
              }}
            >
              <Save size={14} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ وتوثيق القياسات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
