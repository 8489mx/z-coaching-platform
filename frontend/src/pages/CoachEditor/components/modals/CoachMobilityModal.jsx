import React from 'react';
import { X } from 'lucide-react';
import { arabicSearchMatch } from '../../../../utils/searchUtils';

export function CoachMobilityModal({
  mobilityModal,
  setMobilityModal,
  mobilityModalSearch,
  setMobilityModalSearch,
  allMobilityList,
  handleAddMobilityToSession
}) {
  if (!mobilityModal.open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
            {mobilityModal.type === 'WARMUP' ? 'اختيار حركة إحماء ديناميكي' : 'اختيار حركة إطالة استشفائية'}
          </h4>
          <button type="button" onClick={() => setMobilityModal({ open: false, type: 'WARMUP', sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        <input
          type="text"
          placeholder="بحث باسم الحركة أو المنطقة..."
          value={mobilityModalSearch}
          onChange={(e) => setMobilityModalSearch(e.target.value)}
          style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
          {allMobilityList
            .filter(d => {
              const matchType = mobilityModal.type === 'WARMUP' 
                ? (d.category === 'DYNAMIC_WARMUP' || d.category === 'POSTURAL_PREHAB')
                : (d.category === 'STATIC_STRETCH' || d.category === 'POSTURAL_PREHAB');
              const matchSearch = !mobilityModalSearch || 
                arabicSearchMatch(d.name_ar, mobilityModalSearch) ||
                arabicSearchMatch(d.name_en, mobilityModalSearch) ||
                arabicSearchMatch(d.target_area_ar, mobilityModalSearch);
              return matchType && matchSearch;
            })
            .map((drill) => (
              <div
                key={drill.id}
                onClick={() => handleAddMobilityToSession(drill, mobilityModal.type)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{drill.name_ar}</strong>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>المنطقة: {drill.target_area_ar}</span>
                </div>
                <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>إضافة</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
