import React, { useState } from 'react';
import { saveWorkoutSetOffline } from '../utils/offline-sync';
import { calculateWarmupLadder } from '../utils/warmupLadderEngine';

export default function BiomechanicalExerciseCard({
  exercise = {
    id: 'db_incline_press',
    name_ar: 'تجميع دمبلز عالي (Incline DB Press)',
    target_sets: 3,
    target_reps: '8 - 12',
    target_rir: 2,
    suggested_weight_kg: 22.5,
    cues_ar: [
      'زاوية البنش 30 درجة لحماية مفصل الكتف وتوجيه العزل لأعلى الصدر.',
      'النزول ببطء في 3 ثوانٍ مع سحب الكوع للداخل قليلاً (Scapular Plane).',
      'الدفع للأعلى دون خبط الدنابل أو إقفال مفصل الكوع بالكامل.'
    ]
  },
  clientId = 'client_1',
  onSetLogged
}) {
  const [weight, setWeight] = useState(exercise.suggested_weight_kg || '');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState(2);
  const [loggedSets, setLoggedSets] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWarmups, setShowWarmups] = useState(false);

  const warmupSets = calculateWarmupLadder(exercise.suggested_weight_kg || 0);

  const handleLogSet = async (e) => {
    e.preventDefault();
    if (!weight || !reps) return;

    const newSet = {
      set_number: loggedSets.length + 1,
      weight_kg: parseFloat(weight),
      reps: parseInt(reps, 10),
      rir: parseInt(rir, 10)
    };

    const payload = {
      client_id: clientId,
      exercise_id: exercise.id,
      ...newSet
    };

    setLoggedSets([...loggedSets, newSet]);

    setIsSyncing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await fetch('/api/v1/workouts/evaluate-progression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exercise.id,
            loggedSets: [...loggedSets, newSet]
          })
        });
      } else {
        saveWorkoutSetOffline(payload);
      }
    } catch {
      saveWorkoutSetOffline(payload);
    } finally {
      setIsSyncing(false);
      setReps('');
      if (onSetLogged) onSetLogged(newSet);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm shadow-slate-200/50 mb-4 text-slate-900" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-emerald-400 m-0">{exercise.name_ar}</h3>
          <p className="text-xs text-slate-600 mt-1 mb-0">
            المستهدف: {exercise.target_sets} مجموعات × {exercise.target_reps} تكرار (RIR {exercise.target_rir})
          </p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-mono">
          الوزن المقترح: {exercise.suggested_weight_kg} كجم
        </span>
      </div>

      {/* Visual Cues */}
      <div className="bg-slate-100/60 rounded-xl p-3 mb-3 border-r-4 border-emerald-500">
        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>توجيهات التكنيك الإكلينيكي:</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-1 pr-2 list-disc list-inside m-0">
          {exercise.cues_ar?.map((cue, idx) => (
            <li key={idx} className="leading-relaxed">{cue}</li>
          ))}
        </ul>
      </div>

      {/* Warm-up Ladder Section */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowWarmups(!showWarmups)}
          className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{showWarmups ? 'إخفاء جولات الإحماء' : 'عرض سلم الإحماء المقترح (Warm-up Ladder)'}</span>
        </button>

        {showWarmups && (
          <div className="mt-2 p-3 bg-slate-100/80 rounded-xl border border-slate-300 text-xs">
            <div className="font-bold text-amber-300 mb-2">جولات الإحماء التحضيرية:</div>
            <div className="space-y-1.5">
              {warmupSets.map((ws, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50/60 p-2 rounded-lg">
                  <span className="text-slate-900 font-mono font-bold">{ws.weight_kg} كجم × {ws.reps} عدات</span>
                  <span className="text-[11px] text-slate-600">{ws.note_ar}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logged Sets History Table */}
      {loggedSets.length > 0 && (
        <div className="mb-4">
          <table className="w-full text-xs text-center border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="py-1.5">الجولة</th>
                <th>الوزن (كجم)</th>
                <th>التكرارات</th>
                <th>الـ RIR</th>
              </tr>
            </thead>
            <tbody>
              {loggedSets.map((s, idx) => (
                <tr key={idx} className="border-t border-slate-200 bg-slate-50">
                  <td className="py-1 text-slate-600">{s.set_number}</td>
                  <td className="font-bold text-slate-900">{s.weight_kg}</td>
                  <td className="font-bold text-emerald-400">{s.reps}</td>
                  <td className="text-slate-600">{s.rir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Set Input Form */}
      <form onSubmit={handleLogSet} className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
        <div>
          <label className="block text-[10px] text-slate-600 mb-1">الوزن</label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center text-slate-900 focus:outline-none focus:border-emerald-500"
            placeholder="كجم"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-600 mb-1">العدات</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center text-slate-900 focus:outline-none focus:border-emerald-500"
            placeholder="عدات"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-600 mb-1">الـ RIR</label>
          <select
            value={rir}
            onChange={(e) => setRir(e.target.value)}
            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center text-slate-900 focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>0 (فشل تام)</option>
            <option value={1}>1 (عدة متبقية)</option>
            <option value={2}>2 (عدتان - مثالي)</option>
            <option value={3}>3 (3 عدات)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSyncing}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs py-2 rounded-lg transition cursor-pointer"
          >
            + تسجيل
          </button>
        </div>
      </form>
    </div>
  );
}
