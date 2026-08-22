import React, { useState } from 'react';
import { calculateEquivalentSwap, getEligibleSwaps, GOLD_FOOD_CATALOG } from '../../utils/foodSwapEngine';

export default function ClientDayCockpit({
  todayPlan,
  foodCatalog = GOLD_FOOD_CATALOG,
  onLogSet = () => {},
  onSubmitCheckin = () => {}
}) {
  const [portionMode, setPortionMode] = useState('GRAMS'); // 'GRAMS' | 'HAND_PORTIONS'
  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [waterCount, setWaterCount] = useState(0);

  // Quick Check-in State (3 Inputs)
  const [checkinForm, setCheckinForm] = useState({
    weight: '',
    waist: '',
    adherence: 95
  });

  const handleSwapConfirm = (targetFoodId) => {
    const swapResult = calculateEquivalentSwap({
      sourceFoodId: activeSwapItem.id,
      sourceGrams: activeSwapItem.grams,
      targetFoodId,
      foodCatalog,
      displayMode: portionMode
    });

    if (swapResult.success) {
      alert(`تم التبديل بنجاح إلى: ${swapResult.target_food.calculated_grams} جم من ${swapResult.target_food.name}`);
      setActiveSwapItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="font-black text-base text-white">يومك التدريبي والغذائي</h2>
          <p className="text-xs text-slate-400">{todayPlan?.day_title || 'خطة اليوم النشطة'}</p>
        </div>

        {/* Hand Portions vs Grams Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setPortionMode('GRAMS')}
            className={`px-3 py-1 rounded-md font-bold transition-colors ${
              portionMode === 'GRAMS' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            ميزان
          </button>
          <button
            onClick={() => setPortionMode('HAND_PORTIONS')}
            className={`px-3 py-1 rounded-md font-bold transition-colors ${
              portionMode === 'HAND_PORTIONS' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            باليد
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Prehab Banner if available */}
        {todayPlan?.prehab?.has_prehab && (
          <section className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-sm">
              <span>تجهيز المفاصل</span>
              <h4>روتين تجهيز المفاصل وتصحيح القوام ({todayPlan.prehab.total_duration_minutes} دقائق)</h4>
            </div>
            <div className="space-y-2">
              {todayPlan.prehab.exercises.map((drill, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <p className="font-bold text-slate-200">{drill.name_ar}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{drill.cue}</p>
                  </div>
                  <span className="text-indigo-400 font-bold px-2 py-1 bg-indigo-950 rounded border border-indigo-800">
                    {drill.reps || `${drill.hold_seconds} ثانية`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workout Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-black text-slate-200 mb-3 flex items-center gap-2">
            <span>التمارين</span> جدول تمارين اليوم
          </h3>
          <div className="space-y-3">
            {todayPlan?.workout?.exercises?.map((ex, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-bold text-sm text-white">{ex.name_ar}</h5>
                    <p className="text-xs text-slate-400">{ex.sets} مجموعات × {ex.reps} تكرار</p>
                  </div>
                  {/* RIR Target Badge */}
                  <span className="px-2 py-1 bg-emerald-950 text-emerald-400 text-[11px] font-bold rounded border border-emerald-800">
                    RIR {ex.target_rir ?? 2} (متبقي عدتين)
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onLogSet(ex.id)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded transition-colors"
                  >
                    تسجيل الجولة
                  </button>
                  <a
                    href={ex.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded border border-slate-800"
                  >
                    شرح بالفيديو
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Meal Cards */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-black text-slate-200 mb-3 flex items-center gap-2">
            <span>الوجبات</span> كروت الوجبات الذكية
          </h3>
          <div className="space-y-3">
            {todayPlan?.meals?.map((meal, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-bold text-sm text-white">{meal.title_ar}</h5>
                  <span className="text-xs text-amber-400 font-bold">{meal.calories} Kcal</span>
                </div>
                <div className="space-y-2 mt-2">
                  {meal.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900 last:border-0">
                      <div>
                        <span className="text-slate-200 font-medium">{item.name_ar}</span>
                        <p className="text-slate-400 text-[11px]">
                          {portionMode === 'GRAMS' ? `${item.grams} جم (مطبوخ)` : item.hand_portion}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSwapItem(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold transition-colors"
                      >
                        تبديل
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Water Tracker */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-sm text-white">شرب الماء اليومي</h4>
            <p className="text-xs text-slate-400 mt-0.5">الإجمالي: {(waterCount * 0.25).toFixed(2)} لتر</p>
          </div>
          <button
            onClick={() => setWaterCount((c) => c + 1)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            +250 مل
          </button>
        </section>

        {/* Trigger Weekly Checkin Button */}
        <button
          onClick={() => setShowCheckinModal(true)}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl transition-colors shadow-lg shadow-amber-500/10"
        >
          تسليم المتابعة الأسبوعية (3 أسئلة فقط)
        </button>
      </div>

      {/* 3-Question Check-in Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-black text-lg text-white">المتابعة الأسبوعية السريعة</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">متوسط وزنك هذا الأسبوع (كجم):</label>
                <input
                  type="number"
                  step="0.1"
                  value={checkinForm.weight}
                  onChange={(e) => setCheckinForm({ ...checkinForm, weight: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  placeholder="مثال: 82.4"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">محيط الخصر عند السرة (سم):</label>
                <input
                  type="number"
                  step="0.5"
                  value={checkinForm.waist}
                  onChange={(e) => setCheckinForm({ ...checkinForm, waist: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  placeholder="مثال: 88"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">نسبة التزامك بالدايت والتمرين:</label>
                <select
                  value={checkinForm.adherence}
                  onChange={(e) => setCheckinForm({ ...checkinForm, adherence: +e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value={100}>100% (التزام مثالي)</option>
                  <option value={90}>90% (وجبة واحدة خارج الخطة)</option>
                  <option value={75}>75% (تخريب طفيف)</option>
                  <option value={50}>50% أو أقل (أسبوع ملخبط)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onSubmitCheckin(checkinForm);
                  setShowCheckinModal(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-lg"
              >
                إرسال للكوتش
              </button>
              <button
                onClick={() => setShowCheckinModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-400 font-bold text-xs rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Food Swap Modal */}
      {activeSwapItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-white">البدائل المتكافئة لـ ({activeSwapItem.name_ar})</h4>
              <button onClick={() => setActiveSwapItem(null)} className="text-slate-400 text-sm">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getEligibleSwaps(activeSwapItem.id, foodCatalog).map((swapFood) => (
                <div
                  key={swapFood.id}
                  onClick={() => handleSwapConfirm(swapFood.id)}
                  className="p-3 bg-slate-950 hover:bg-indigo-950/50 border border-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{swapFood.name_ar}</span>
                    <span className="text-indigo-400 font-bold">اختيار</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{swapFood.hand_portion_equivalent}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
