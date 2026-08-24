import React, { useState } from 'react';
import { X, Users, AlertCircle, Info, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function SmartSwapModal({ isOpen, onClose, exerciseName, onSwap, onSkip }) {
  const [step, setStep] = useState('CHOICE'); // 'CHOICE', 'SWAPPED', 'SKIPPED'
  const [swappedExercise, setSwappedExercise] = useState('');

  if (!isOpen) return null;

  const handleCrowded = () => {
    // محاكاة الاتصال بمحرك الميكانيكا الحيوية للحصول على بديل
    // في الواقع، يجب أن يكون هناك API call هنا لجلب التمرين المكافئ.
    const mockAlternative = "تمرين بديل (نفس الزاوية)";
    setSwappedExercise(mockAlternative);
    setStep('SWAPPED');
  };

  const handlePain = () => {
    setStep('SKIPPED');
  };

  const confirmSwap = () => {
    if (onSwap) onSwap(swappedExercise);
    closeModal();
  };

  const confirmSkip = () => {
    if (onSkip) onSkip();
    closeModal();
  };

  const closeModal = () => {
    setStep('CHOICE');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-black text-slate-900 line-clamp-1">
            {step === 'CHOICE' ? 'تعديل التمرين' : exerciseName}
          </h2>
          <button onClick={closeModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'CHOICE' && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-600 mb-6 text-center leading-relaxed">
                هل تواجه مشكلة في تنفيذ تمرين <span className="text-blue-600">{exerciseName}</span>؟
              </p>

              {/* Button 1: Crowded Gym */}
              <button 
                onClick={handleCrowded}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50 transition text-right group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">الجهاز مشغول (زحمة)</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">تغيير لتمرين بديل مؤقتاً لليوم فقط.</p>
                </div>
              </button>

              {/* Button 2: Pain/Injury */}
              <button 
                onClick={handlePain}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-amber-500 hover:bg-amber-50 transition text-right group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">تخطي بسبب ألم</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">لحماية مفاصلك، سنتخطى التمرين لليوم.</p>
                </div>
              </button>
            </div>
          )}

          {step === 'SWAPPED' && (
            <div className="text-center space-y-6 animate-in slide-in-from-left-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm shadow-emerald-200/50">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 mb-2">تم تجهيز البديل</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  بناءً على طلبك، قام المحرك بتبديل التمرين لليوم فقط إلى:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 font-black text-blue-600 text-lg">
                  {swappedExercise}
                </div>
              </div>
              <button onClick={confirmSwap} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                متابعة التمرين <ChevronLeft size={20} />
              </button>
            </div>
          )}

          {step === 'SKIPPED' && (
            <div className="text-center space-y-6 animate-in slide-in-from-right-4">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm shadow-amber-200/50">
                <Info size={40} />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 mb-2">تخطي آمن</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  يا بطل، حماية مفاصلك أولوية. تخطَ هذا التمرين لليوم وأكمل باقي جدولك. 
                  <br/><br/>
                  <span className="text-amber-600">يرجى كتابة تفاصيل الألم للكابتن في ملاحظات نهاية التمرين لتعديل خطتك القادمة.</span>
                </p>
              </div>
              <button onClick={confirmSkip} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
                فهمت، متابعة التمرين <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
