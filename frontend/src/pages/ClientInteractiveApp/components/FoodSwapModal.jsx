import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FOOD_DATABASE, listEquivalentFoodSwaps } from '../../../utils/foodSwapEngine';
import { arabicSearchMatch } from '../../../utils/searchUtils';
import { isFoodAllowedDuringFast } from '../../../utils/fastingCalendarEngine';

export default function FoodSwapModal({
  activeSwapItem,
  onClose,
  onExecuteSwap,
  clinicalProfile,
  fastingContext = null
}) {
  const [clientSwapSearch, setClientSwapSearch] = useState('');

  if (!activeSwapItem) return null;

  const handleClose = () => {
    setClientSwapSearch('');
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 20px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
          direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '6px' }}>
              محرك المبادلات الذكية (Clinical Smart Swaps)
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
              بدائل مكافئة لـ: {activeSwapItem.name}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
          </button>
        </div>

        {/* Current Item */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>الصنف الحالي بالخطة:</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{activeSwapItem.name}</strong>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
              {activeSwapItem.amount} {activeSwapItem.unit} ({Math.round(activeSwapItem.cal)} Kcal)
            </span>
          </div>
        </div>

        {/* Search & Filter Controls for Smart Swaps */}
        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="ابحث باسم أي صنف بديل تحبه..."
            value={clientSwapSearch}
            onChange={(e) => setClientSwapSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              padding: '0 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Calculated Swap Alternatives List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '45vh', overflowY: 'auto' }}>
          {(() => {
            const currentItemCode = activeSwapItem.code || '';
            const currentItemObj = FOOD_DATABASE[currentItemCode] || Object.values(FOOD_DATABASE).find(f => f.name_ar === activeSwapItem.name) || {};
            const currentMacroType = currentItemObj.macro_type || (activeSwapItem.p > activeSwapItem.c && activeSwapItem.p > activeSwapItem.f ? 'PROTEIN' : (activeSwapItem.c > 5 ? 'CARBS' : 'FATS'));
            const currentPortion = Number(activeSwapItem.amount) || 100;

            // Only foods of the same taste group with close energy and fat (swapExchangeRules),
            // closest energy first; search text and fasting narrow the list.
            const fromCode = currentItemObj.code ? currentItemObj.code : (currentMacroType === 'PROTEIN' ? 'CHICKEN_BREAST' : (currentMacroType === 'CARBS' ? 'BASMATI_RICE_COOKED' : 'EXTRA_VIRGIN_OLIVE_OIL'));
            const accept = (f) => {
              if (!f.name_ar) return false;
              // During a religious fast only fast-compatible foods are offered.
              if (fastingContext?.active && !isFoodAllowedDuringFast(f, fastingContext)) return false;
              if (clientSwapSearch.trim()) {
                const matchNameAr = arabicSearchMatch(f.name_ar, clientSwapSearch);
                const matchNameEn = arabicSearchMatch(f.name_en, clientSwapSearch);
                const matchCode = arabicSearchMatch(f.code, clientSwapSearch);
                const matchAliases = Array.isArray(f.aliases)
                  ? f.aliases.some(a => arabicSearchMatch(a, clientSwapSearch))
                  : (typeof f.aliases === 'string' && arabicSearchMatch(f.aliases, clientSwapSearch));
                return matchNameAr || matchNameEn || matchCode || matchAliases;
              }
              return true;
            };
            const swapResults = listEquivalentFoodSwaps(fromCode, currentPortion, clinicalProfile, accept);

            if (swapResults.length === 0) {
              return (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
                  {clientSwapSearch.trim() ? 'لا توجد بدائل مطابقة للبحث بنفس نوع الأكل وقيمة قريبة.' : 'الصنف ده مالوش بديل بنفس نوع الأكل وقيمة قريبة؛ خليه زي ما هو.'}
                </div>
              );
            }

            return swapResults.slice(0, 25).map((swapResult, sIdx) => {
              const targetFood = FOOD_DATABASE[swapResult.replacement_food.code] || {};
              const isMatchingTaste = Boolean(targetFood.taste_profile && currentItemObj.taste_profile && targetFood.taste_profile === currentItemObj.taste_profile);

              return (
                <div 
                  key={targetFood.code || sIdx}
                  style={{
                    background: isMatchingTaste ? '#FFFFFF' : '#FAFAFA',
                    border: isMatchingTaste ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {swapResult.replacement_food.name_ar}
                      </strong>
                      {isMatchingTaste && (
                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '6px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                          تناسق وجبة مثالي
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                      الكمية المكافئة: {swapResult.replacement_food.portion_g} جم
                    </span>
                    <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }} dir="ltr">
                      <span>{swapResult.replacement_food.macros.calories_kcal} kcal</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <span>P: {swapResult.replacement_food.macros.protein_g}g</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <span>C: {swapResult.replacement_food.macros.carbs_g}g</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <span>F: {swapResult.replacement_food.macros.fat_g}g</span>
                    </div>
                    {swapResult.clinical_note && (
                      <small style={{ display: 'block', fontSize: '0.66rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                        {swapResult.clinical_note}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onExecuteSwap(swapResult);
                      setClientSwapSearch('');
                    }}
                    style={{
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    تبديل الآن
                  </button>
                </div>
              );
            });
          })()}
        </div>

      </div>
    </div>
  );
}
