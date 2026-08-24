import React, { useState } from 'react';
import { Camera, Scale, Battery, Moon, Utensils, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WeeklyCheckinForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    weight_kg: '',
    waist_circumference_cm: '',
    nutrition_adherence_percent: 100,
    workouts_completed: 4,
    biofeedback: {
      energyLevel: 5,
      sleepQuality: 5,
      hungerLevel: 5
    },
    client_notes: ''
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const clientCode = localStorage.getItem('kz_client_code');
      if (!clientCode) throw new Error('يرجى تسجيل الدخول أولاً');

      const payload = {
        user_id: clientCode,
        weight_kg: formData.weight_kg,
        waist_circumference_cm: formData.waist_circumference_cm || null,
        nutrition_adherence_percent: formData.nutrition_adherence_percent,
        workouts_completed: formData.workouts_completed,
        biofeedback: formData.biofeedback,
        client_notes: formData.client_notes
      };

      // استخدم مسار API الفعلي للتقييم الأسبوعي
      const res = await fetch('/api/v1/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء إرسال التقييم');

      setStep(4); // Success step
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData({
      ...formData,
      biofeedback: { ...formData.biofeedback, [field]: parseInt(value) }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pb-24" dir="rtl">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900 transition">
            <ChevronRight size={24} />
          </button>
          <h1 className="text-lg font-black text-slate-900">التقييم الأسبوعي</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-xl mx-auto mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full p-6 flex flex-col">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-4 rounded-xl text-sm font-bold mb-6 text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Body Metrics */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-blue-500">
              <Scale size={24} />
              <h2 className="text-xl font-black text-slate-900">المقاسات والوزن الحالي</h2>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-md shadow-slate-200/50">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">الوزن الحالي (كجم)</label>
                <input 
                  type="number" 
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                  placeholder="مثال: 75.5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 text-center text-xl font-black focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">محيط الخصر (سم) - اختياري</label>
                <input 
                  type="number" 
                  value={formData.waist_circumference_cm}
                  onChange={(e) => setFormData({...formData, waist_circumference_cm: e.target.value})}
                  placeholder="مثال: 82"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 text-center text-xl font-black focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-md shadow-slate-200/50">
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <Camera size={20} className="text-amber-500" />
                <h3 className="font-bold">صور التطور (الأمام، الجنب، الخلف)</h3>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4">يرجى رفع صور واضحة بإضاءة جيدة لمساعدة الكوتش في التقييم الدقيق.</p>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition">
                    <Camera size={24} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Bio-feedback */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-emerald-500">
              <Activity size={24} />
              <h2 className="text-xl font-black text-slate-900">المؤشرات الحيوية</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2"><Battery size={18} className="text-amber-500" />مستوى الطاقة والتعب</div>
                  <span className="text-amber-500">{formData.biofeedback.energyLevel} / 10</span>
                </div>
                <input type="range" min="1" max="10" value={formData.biofeedback.energyLevel} onChange={(e) => handleSliderChange('energyLevel', e.target.value)} className="w-full accent-amber-500" />
                <div className="flex justify-between text-xs text-slate-500 font-bold"><span>مرهق جداً</span><span>طاقة عالية</span></div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2"><Moon size={18} className="text-blue-500" />جودة النوم</div>
                  <span className="text-blue-500">{formData.biofeedback.sleepQuality} / 10</span>
                </div>
                <input type="range" min="1" max="10" value={formData.biofeedback.sleepQuality} onChange={(e) => handleSliderChange('sleepQuality', e.target.value)} className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-slate-500 font-bold"><span>أرق متواصل</span><span>نوم عميق</span></div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2"><Utensils size={18} className="text-rose-500" />مستوى الجوع والشراهة</div>
                  <span className="text-rose-500">{formData.biofeedback.hungerLevel} / 10</span>
                </div>
                <input type="range" min="1" max="10" value={formData.biofeedback.hungerLevel} onChange={(e) => handleSliderChange('hungerLevel', e.target.value)} className="w-full accent-rose-500" />
                <div className="flex justify-between text-xs text-slate-500 font-bold"><span>لا أشعر بالجوع</span><span>جوع شديد جداً</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Adherence & Notes */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 text-blue-500">
              <CheckCircle2 size={24} />
              <h2 className="text-xl font-black text-slate-900">الالتزام والملاحظات</h2>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-md shadow-slate-200/50">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">نسبة التزامك بالدايت والسعرات</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="0" max="100" step="5" value={formData.nutrition_adherence_percent} onChange={(e) => setFormData({...formData, nutrition_adherence_percent: e.target.value})} className="flex-1 accent-emerald-500" />
                  <span className="text-xl font-black text-emerald-400 w-16 text-left">{formData.nutrition_adherence_percent}%</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <label className="text-sm font-bold text-slate-700">عدد أيام التمرين التي أنجزتها</label>
                <div className="flex justify-between gap-2">
                  {[0,1,2,3,4,5,6,7].map(num => (
                    <button 
                      key={num} 
                      onClick={() => setFormData({...formData, workouts_completed: num})}
                      className={`flex-1 aspect-square rounded-lg font-bold text-sm transition ${formData.workouts_completed === num ? 'bg-blue-600 text-slate-900' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <label className="text-sm font-bold text-slate-700">رسالتك للكوتش (اختياري)</label>
                <textarea 
                  value={formData.client_notes}
                  onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
                  placeholder="أي ملاحظات عن أسبوعك، إصابات، استفسارات، أو عوائق واجهتك..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 text-sm focus:border-blue-500 outline-none transition h-32 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">عاش يا بطل!</h2>
            <p className="text-slate-600 font-bold max-w-xs leading-relaxed">تم استلام تقييمك الأسبوعي بنجاح. سيقوم الكوتش والمحرك الرياضي بمراجعة النتائج وتحديث خطتك إذا لزم الأمر.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-8 bg-slate-100 text-slate-900 px-8 py-4 rounded-xl font-bold w-full hover:bg-slate-300 transition">
              العودة ليومياتي
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 p-4">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-4 py-3.5 text-slate-600 hover:text-slate-900 font-bold transition flex items-center gap-1">
                <ChevronRight size={18} /> السابق
              </button>
            ) : (
              <div className="w-24" /> // Spacer
            )}
            
            {step < 3 ? (
              <button 
                onClick={() => {
                  if (step === 1 && !formData.weight_kg) {
                    setError('يرجى إدخال وزنك الحالي');
                    return;
                  }
                  setError('');
                  setStep(step + 1);
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-900 font-black py-3.5 rounded-xl transition shadow-sm shadow-slate-200/50 shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                التالي <ChevronLeft size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black py-3.5 rounded-xl transition shadow-sm shadow-slate-200/50 shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'إرسال التقييم للكوتش'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
