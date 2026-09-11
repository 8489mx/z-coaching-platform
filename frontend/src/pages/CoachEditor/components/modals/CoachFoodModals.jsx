import React from 'react';
import { ArrowRightLeft, Search, X } from 'lucide-react';
import { FOOD_DATABASE_LIST } from '../../constants/coachEditorConstants';
import { arabicSearchMatch } from '../../../../utils/searchUtils';

export function CoachSwapFoodModal({
  swapFoodModal,
  setSwapFoodModal,
  swapFoodSearch,
  setSwapFoodSearch,
  handleExecuteFoodSwap
}) {
  if (!swapFoodModal.open || !swapFoodModal.currentItem) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '520px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRightLeft size={14} color="#2563EB" />
              <span>البدائل الغذائية المتكافئة لـ ({swapFoodModal.currentItem.name})</span>
            </h4>
            <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
              الكمية الحالية: {swapFoodModal.currentItem.amount} {swapFoodModal.currentItem.unit || 'جم'} ({swapFoodModal.currentItem.cal || 0} kcal)
            </span>
          </div>
          <button type="button" onClick={() => setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="ابحث عن صنف بديل..."
            value={swapFoodSearch}
            onChange={(e) => setSwapFoodSearch(e.target.value)}
            style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
          />
          <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
        </div>

        {/* Compatible Swaps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px', paddingRight: '2px' }}>
          {FOOD_DATABASE_LIST
            .filter(f => {
              const curCat = swapFoodModal.currentItem.category;
              const matchCategory = !curCat || f.category === curCat || f.macro_type === curCat;
              const matchSearch = !swapFoodSearch || 
                arabicSearchMatch(f.name, swapFoodSearch) || 
                arabicSearchMatch(f.name_ar, swapFoodSearch) || 
                arabicSearchMatch(f.name_en, swapFoodSearch);
              return matchCategory && matchSearch;
            })
            .map((targetFood, tfIdx) => {
              let equivGrams = 100;
              if (swapFoodModal.currentItem.category === 'PROTEIN') {
                const curP = Number(swapFoodModal.currentItem.p) || 25;
                const targetP = Number(targetFood.protein_per_100g || targetFood.p || 25);
                equivGrams = Math.max(10, Math.round((curP / targetP) * 100));
              } else if (swapFoodModal.currentItem.category === 'CARB') {
                const curC = Number(swapFoodModal.currentItem.c) || 30;
                const targetC = Number(targetFood.carbs_per_100g || targetFood.c || 25);
                equivGrams = Math.max(10, Math.round((curC / targetC) * 100));
              } else if (swapFoodModal.currentItem.category === 'FAT') {
                const curF = Number(swapFoodModal.currentItem.f) || 8;
                const targetF = Number(targetFood.fat_per_100g || targetFood.f || 10);
                equivGrams = Math.max(5, Math.round((curF / targetF) * 100));
              }

              const factor = equivGrams / 100;
              const equivCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);
              const equivP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
              const equivC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
              const equivF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));

              return (
                <div
                  key={targetFood.code || tfIdx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{targetFood.name}</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                      الكمية المكافئة: <strong style={{ color: '#0F172A' }}>{equivGrams} {targetFood.serving_unit || targetFood.unit || 'جم'}</strong> ({equivCal} kcal)
                    </span>
                    <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px' }}>
                      P:{equivP}g · C:{equivC}g · F:{equivF}g
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteFoodSwap(swapFoodModal.mealId, swapFoodModal.itemIdx, targetFood)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '7px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    اختيار كبديل
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export function CoachAddFoodModal({
  addFoodModal,
  setAddFoodModal,
  foodModalSearch,
  setFoodModalSearch,
  handleAddFoodToMeal
}) {
  if (!addFoodModal.open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة صنف غذائي</h4>
          <button type="button" onClick={() => setAddFoodModal({ open: false, mealId: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
        </div>

        <input
          type="text"
          placeholder="ابحث باسم الصنف الغذائي..."
          value={foodModalSearch}
          onChange={(e) => setFoodModalSearch(e.target.value)}
          style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
          {FOOD_DATABASE_LIST
            .filter(fd => !foodModalSearch || 
              arabicSearchMatch(fd.name, foodModalSearch) || 
              arabicSearchMatch(fd.name_ar, foodModalSearch) || 
              arabicSearchMatch(fd.name_en, foodModalSearch) || 
              arabicSearchMatch(fd.code, foodModalSearch) ||
              (Array.isArray(fd.aliases) && fd.aliases.some(a => arabicSearchMatch(a, foodModalSearch))))
            .slice(0, 30)
            .map((fd) => (
              <div
                key={fd.code}
                onClick={() => handleAddFoodToMeal(addFoodModal.mealId, fd)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{fd.name}</strong>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>P: {fd.p}g • C: {fd.c}g • F: {fd.f}g</span>
                </div>
                <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
