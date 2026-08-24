import React, { useState } from 'react';
import { User, Activity, Dumbbell, Stethoscope, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export default function ClientOnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '', heightCm: '', weightKg: '', gender: 'MALE',
    experienceLevel: 'BEGINNER', trainingEnvironment: 'GYM', homeEquipment: ['BODYWEIGHT_ONLY'],
    selectedConditions: ['NONE_HEALTHY']
  });

  const availableHomeTools = [
    { id: 'DUMBBELLS', label: 'دمبلز بأوزان محددة' },
    { id: 'BANDS', label: 'أشرطة مقاومة مطاطية' },
    { id: 'BARBELL', label: 'بار حر وأوزان طارات' },
    { id: 'TREADMILL', label: 'مشاية كهربائية منزلية' },
    { id: 'STATIONARY_BIKE', label: 'دراجة ثابتة' },
    { id: 'PULLUP_BAR', label: 'عقلة / بار سحب' }
  ];

  const medicalConditionsList = [
    { id: 'TYPE_1_DIABETES', label: 'سكري نوع أول (أنسولين)' },
    { id: 'TYPE_2_DIABETES_ORAL', label: 'سكري نوع ثانٍ (أقراص)' },
    { id: 'PCOS_IR', label: 'مقاومة إنسولين / تكيس مبايض' },
    { id: 'HYPOTHYROIDISM', label: 'خمول الغدة الدرقية' },
    { id: 'HYPERTENSION', label: 'ارتفاع ضغط الدم' },
    { id: 'BARIATRIC_SURGERY', label: 'جراحة سمنة (تكميم / تحويل)' },
    { id: 'H_PYLORI_GASTRITIS', label: 'جرثومة أو قرحة المعدة / ارتجاع' },
    { id: 'IBS', label: 'متلازمة القولون العصبي' },
    { id: 'KIDNEY_STONES', label: 'حصوات الكلى والأوكسالات' },
    { id: 'RENAL_INSUFFICIENCY', label: 'قصور وظائف الكلى' },
    { id: 'CELIAC_DISEASE', label: 'مرض السيلياك (حساسية جلوتين)' },
    { id: 'G6PD_DEFICIENCY', label: 'أنيميا الفول (G6PD)' },
    { id: 'OSTEOPOROSIS', label: 'هشاشة العظام' },
    { id: 'LOWER_BACK_PAIN', label: 'انزلاق غضروفي / آلام الظهر' },
    { id: 'SHOULDER_IMPINGEMENT', label: 'التهاب أوتار الكتف' },
    { id: 'PATELLAR_TENDINITIS', label: 'خشونة صابونة الركبة' },
    { id: 'NONE_HEALTHY', label: 'سليم تماماً ولا أعاني من أي عارض' }
  ];

  const toggleCondition = (id) => {
    let updated = formData.selectedConditions.filter(c => c !== 'NONE_HEALTHY');
    if (id === 'NONE_HEALTHY') {
      updated = ['NONE_HEALTHY'];
    } else if (updated.includes(id)) {
      updated = updated.filter(c => c !== id);
    } else {
      updated.push(id);
    }
    setFormData({ ...formData, selectedConditions: updated.length ? updated : ['NONE_HEALTHY'] });
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    try {
      const client_code = localStorage.getItem('kz_client_code') || '';
      const phone_number = localStorage.getItem('kz_client_phone') || '';

      const response = await fetch('/api/v1/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code,
          phone_number,
          ...formData
        })
      });

      if (!response.ok) {
        console.error("Submission error");
      }

      setTimeout(() => {
        if(onComplete) onComplete(formData);
      }, 1500);

    } catch(err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" dir="rtl">
      
      {/* ProgressBar */}
      <div className="h-1.5 w-full bg-slate-100 fixed top-0 z-50">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full p-6 pt-12 flex flex-col">
        
        {step === 1 && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <User size={24} />
              <h2 className="text-xl font-black text-slate-900">البيانات الحيوية</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500">النوع</label>
                <div className="flex gap-2">
                  <button onClick={() => setFormData({...formData, gender: 'MALE'})} className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${formData.gender === 'MALE' ? 'bg-blue-600 text-slate-900 shadow-sm shadow-slate-200/50 shadow-blue-500/20' : 'bg-white text-slate-600 border border-slate-200'}`}>ذكر</button>
                  <button onClick={() => setFormData({...formData, gender: 'FEMALE'})} className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${formData.gender === 'FEMALE' ? 'bg-rose-600 text-slate-900 shadow-sm shadow-slate-200/50 shadow-rose-500/20' : 'bg-white text-slate-600 border border-slate-200'}`}>أنثى</button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500">العمر (سنة)</label>
                <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-center focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500">الوزن (كجم)</label>
                <input type="number" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-center focus:border-blue-500 outline-none transition" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-500">الطول (سم)</label>
                <input type="number" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 text-center focus:border-blue-500 outline-none transition" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <Dumbbell size={24} />
              <h2 className="text-xl font-black text-slate-900">المستوى وبيئة التدريب</h2>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500">المستوى التدريبي</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'BEGINNER', label: 'مبتدئ (أول مرة أتمرن)' },
                  { id: 'INTERMEDIATE', label: 'متوسط (6 أشهر - سنتين)' },
                  { id: 'ADVANCED', label: 'متقدم (أكثر من سنتين)' }
                ].map(lvl => (
                  <button key={lvl.id} onClick={() => setFormData({...formData, experienceLevel: lvl.id})} className={`p-4 rounded-xl text-right text-sm font-bold transition border ${formData.experienceLevel === lvl.id ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-white border-slate-200 text-slate-700'}`}>{lvl.label}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-500">مكان التمرين المفضل</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setFormData({...formData, trainingEnvironment: 'GYM'})} className={`p-4 rounded-xl text-center text-sm font-bold transition border ${formData.trainingEnvironment === 'GYM' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-white border-slate-200 text-slate-700'}`}>في الجيم</button>
                <button onClick={() => setFormData({...formData, trainingEnvironment: 'HOME'})} className={`p-4 rounded-xl text-center text-sm font-bold transition border ${formData.trainingEnvironment === 'HOME' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-white border-slate-200 text-slate-700'}`}>في البيت</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <Stethoscope size={24} />
              <h2 className="text-xl font-black text-slate-900">الاستبيان الطبي السريري</h2>
            </div>
            
            <p className="text-xs text-slate-600 font-bold mb-2">يرجى تحديد أي حالة طبية تعاني منها لتجنب أي تعارض في الخطة:</p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-20 custom-scrollbar">
              {medicalConditionsList.map(cond => {
                const isSelected = formData.selectedConditions.includes(cond.id);
                return (
                  <button key={cond.id} onClick={() => toggleCondition(cond.id)} className={`w-full p-3.5 rounded-xl border text-sm font-bold text-right transition flex items-center justify-between ${isSelected ? 'bg-rose-900/30 border-rose-500 text-rose-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-600'}`}>
                    <span>{cond.label}</span>
                    {isSelected && <CheckCircle2 size={18} />}
                  </button>
                )
              })}
              {/* Free Text Notes for the Coach */}
              <div className="mt-4 space-y-2 shrink-0">
                <label className="text-sm font-bold text-slate-700">هل هناك أي تفاصيل أخرى أو إصابات لم نذكرها تود إخبار الكابتن بها؟</label>
                <textarea 
                  value={formData.client_notes || ''}
                  onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
                  placeholder="اكتب هنا أي شيء تريد أن يعرفه الكابتن قبل تجهيز خطتك..."
                  className="w-full h-24 bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-sm font-bold focus:border-blue-500 outline-none resize-none shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex items-center justify-center flex-col text-center space-y-6 animate-in fade-in duration-500">
            {isGenerating ? (
              <>
                <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                <h2 className="text-xl font-black text-slate-900">جاري هندسة خطتك...</h2>
                <p className="text-sm text-slate-600 mt-2 font-bold max-w-xs leading-relaxed">يقوم المحرك الرياضي الآن بتطبيق المعادلات وتحليل بياناتك لبناء برنامجك المخصص.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Activity size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">بياناتك مكتملة!</h2>
                <p className="text-sm text-slate-600 mt-2 font-bold max-w-xs leading-relaxed">تم استلام بياناتك بنجاح وسيتم إرسالها للعقل البرمجي لبدء العمليات الحسابية.</p>
              </>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-slate-200 mt-auto flex items-center justify-between bg-slate-50">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-3 transition">
              <ChevronRight size={18} /> السابق
            </button>
          )}
          {step < 3 && (
            <button onClick={() => setStep(step + 1)} className="mr-auto flex items-center gap-2 bg-blue-600 text-slate-900 text-sm font-black px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-slate-200/50 shadow-blue-500/20 active:scale-95">
              التالي <ChevronLeft size={18} />
            </button>
          )}
          {step === 3 && (
            <button onClick={() => { setStep(4); handleFinish(); }} className="mr-auto flex items-center gap-2 bg-emerald-600 text-slate-900 text-sm font-black px-6 py-3 rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-slate-200/50 shadow-emerald-500/20 active:scale-95">
              إنهاء الاعتماد <CheckCircle2 size={18} />
            </button>
          )}
          {step === 4 && !isGenerating && (
            <button onClick={() => onComplete(formData)} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-slate-900 text-sm font-black px-6 py-4 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-slate-200/50 shadow-blue-500/20 active:scale-95">
              انطلق لخطتك الآن!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
