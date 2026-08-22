import React, { useState } from 'react';

export default function QuickChecklistWidget({
  dailyPlan = {
    meals: ['وجبة الإفطار', 'وجبة الغداء', 'سناك ما بعد التمرين', 'وجبة العشاء'],
    waterTargetLiters: 3.0,
    workoutTitle: 'تمرين اليوم: علوي A'
  },
  onCheckinUpdate
}) {
  const [completedMeals, setCompletedMeals] = useState({});
  const [workoutDone, setWorkoutDone] = useState(false);
  const [waterCups, setWaterCups] = useState(0);
  const [sleptWell, setSleptWell] = useState(null);

  const toggleMeal = (idx) => {
    const next = { ...completedMeals, [idx]: !completedMeals[idx] };
    setCompletedMeals(next);
    triggerSync(next, workoutDone, waterCups, sleptWell);
  };

  const toggleWorkout = () => {
    const next = !workoutDone;
    setWorkoutDone(next);
    triggerSync(completedMeals, next, waterCups, sleptWell);
  };

  const addWaterCup = () => {
    const next = waterCups + 1;
    setWaterCups(next);
    triggerSync(completedMeals, workoutDone, next, sleptWell);
  };

  const triggerSync = (meals, wDone, water, sleep) => {
    if (onCheckinUpdate) {
      onCheckinUpdate({
        mealsLogged: Object.values(meals).filter(Boolean).length,
        workoutCompleted: wDone,
        waterLiters: +(water * 0.25).toFixed(1),
        sleptWell: sleep
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white mb-5 shadow-lg" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2 m-0">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            <span>تسجيل اليوم السريع (10 ثوانٍ)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-0">علّم على ما أنجزته بنقرة واحدة دون الحاجة لحسابات معقدة</p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
          {Object.values(completedMeals).filter(Boolean).length} / {dailyPlan.meals.length} وجبات
        </span>
      </div>

      {/* 1. قائمة الوجبات السريعة */}
      <div className="space-y-2 mb-4">
        {dailyPlan.meals.map((meal, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => toggleMeal(idx)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition active:scale-[0.99] cursor-pointer ${
              completedMeals[idx]
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <span>{meal}</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              completedMeals[idx] ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600 text-transparent'
            }`}>
              تم
            </span>
          </button>
        ))}
      </div>

      {/* 2. زر إنجاز التمرين السريع */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleWorkout}
          className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition active:scale-[0.99] cursor-pointer ${
            workoutDone
              ? 'bg-blue-950/50 border-blue-500/60 text-blue-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{dailyPlan.workoutTitle}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
            workoutDone ? 'bg-blue-500 text-slate-950' : 'bg-slate-700 text-slate-300'
          }`}>
            {workoutDone ? 'تم بالوزن المعتاد' : 'اضغط عند الإتمام'}
          </span>
        </button>
      </div>

      {/* 3. شريط الماء والنوم السريع */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
        <button
          type="button"
          onClick={addWaterCup}
          className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between cursor-pointer"
        >
          <span className="text-slate-300">كوب ماء (+250ml)</span>
          <span className="font-mono font-bold text-sky-400">{(waterCups * 0.25).toFixed(1)}L</span>
        </button>

        <div className="bg-slate-800/60 border border-slate-700 p-2 rounded-xl flex items-center justify-between">
          <span className="text-[11px] text-slate-300">جودة النوم:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { setSleptWell(true); triggerSync(completedMeals, workoutDone, waterCups, true); }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${sleptWell === true ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}
            >
              ممتاز
            </button>
            <button
              type="button"
              onClick={() => { setSleptWell(false); triggerSync(completedMeals, workoutDone, waterCups, false); }}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${sleptWell === false ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              قليل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
