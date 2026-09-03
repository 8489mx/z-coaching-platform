import React from 'react';
import { FormSection } from '@/shared/components/form-section';

export default function CheckinMacroPlanner({ macroAdjustments = {}, setMacroAdjustments = () => {} }) {
  const pKcal = (macroAdjustments.protein || 0) * 4;
  const cKcal = (macroAdjustments.carbs || 0) * 4;
  const fKcal = (macroAdjustments.fats || 0) * 9;
  const calcTotal = pKcal + cKcal + fKcal;
  const pPct = calcTotal > 0 ? Math.round((pKcal / calcTotal) * 100) : 0;
  const cPct = calcTotal > 0 ? Math.round((cKcal / calcTotal) * 100) : 0;
  const fPct = calcTotal > 0 ? Math.round((fKcal / calcTotal) * 100) : 0;

  return (
    <FormSection
      title="تعديل الماكروز للأسبوع القادم"
      description="ضبط السعرات والجرامات اليومية المعتمدة للبرنامج."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>إجمالي السعرات:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <strong style={{ fontSize: '14px', fontFamily: 'JetBrains Mono, Cairo', color: '#0F172A' }}>
              {macroAdjustments.calories || calcTotal}
            </strong>
            <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>سعرة</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>البروتين</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px 6px', height: '30px' }}>
              <input
                type="number"
                value={macroAdjustments.protein || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newCals = (val * 4) + ((macroAdjustments.carbs || 0) * 4) + ((macroAdjustments.fats || 0) * 9);
                  setMacroAdjustments({ ...macroAdjustments, protein: val, calories: newCals });
                }}
                style={{ width: '45px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono, Cairo' }}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>جم</span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'JetBrains Mono, Cairo' }}>{pKcal} سعرة ({pPct}%)</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>الكارب</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px 6px', height: '30px' }}>
              <input
                type="number"
                value={macroAdjustments.carbs || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newCals = ((macroAdjustments.protein || 0) * 4) + (val * 4) + ((macroAdjustments.fats || 0) * 9);
                  setMacroAdjustments({ ...macroAdjustments, carbs: val, calories: newCals });
                }}
                style={{ width: '45px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono, Cairo' }}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>جم</span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'JetBrains Mono, Cairo' }}>{cKcal} سعرة ({cPct}%)</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>الدهون</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px 6px', height: '30px' }}>
              <input
                type="number"
                value={macroAdjustments.fats || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newCals = ((macroAdjustments.protein || 0) * 4) + ((macroAdjustments.carbs || 0) * 4) + (val * 9);
                  setMacroAdjustments({ ...macroAdjustments, fats: val, calories: newCals });
                }}
                style={{ width: '45px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono, Cairo' }}
              />
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>جم</span>
            </div>
            <span style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'JetBrains Mono, Cairo' }}>{fKcal} سعرة ({fPct}%)</span>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
