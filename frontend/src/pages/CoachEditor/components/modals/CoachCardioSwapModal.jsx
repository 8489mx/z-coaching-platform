import React from 'react';
import { X } from 'lucide-react';
import { CARDIO_MODALITY_OPTIONS } from '../../constants/coachEditorConstants';

export function CoachCardioSwapModal({
  cardioSwapModal,
  setCardioSwapModal,
  handleSelectCardioModality
}) {
  if (!cardioSwapModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '460px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>اختيار نمط الكارديو</h4>
          <button type="button" onClick={() => setCardioSwapModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
          {CARDIO_MODALITY_OPTIONS.map((opt) => (
            <div
              key={opt.id}
              onClick={() => handleSelectCardioModality(opt)}
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{opt.name}</strong>
                <span style={{ fontSize: '10px', color: '#64748B' }}>{opt.desc}</span>
              </div>
              <button type="button" style={{ padding: '3px 8px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '7px', fontSize: '10.5px', fontWeight: 700 }}>اختيار</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
