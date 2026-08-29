import React, { useState, useEffect } from 'react';
import { Dumbbell, Utensils, Hourglass, Video, Zap, AlertCircle, Check, RefreshCw } from 'lucide-react';

export default function ClientMobileDashboard({ client }) {
  const [activeTab, setActiveTab] = useState('WORKOUT'); // 'WORKOUT' | 'MEALS' | 'PROGRESS'
  const [restTimer, setRestTimer] = useState(0); // عداد الراحة بالثواني
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // مستمع لحالة الإنترنت (لإظهار شارة الأوفلاين)
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // تشغيل عداد الراحة
  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const handleSetComplete = (restSeconds) => {
    // 1. حفظ التمرين محلياً
    // 2. تفعيل العداد
    setRestTimer(restSeconds);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-200 font-sans pb-24" dir="rtl">
      
      {/* 1. الهيدر العلوي */}
      <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 p-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">يوميات التدريب</h1>
            <h2 className="text-xs text-slate-600">اليوم 1 من الأسبوع 3</h2>
          </div>
          {isOffline && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
              <AlertCircle size={12} /> أوفلاين
            </span>
          )}
        </div>

        {/* التابات السريعة (Tabs) */}
        <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('WORKOUT')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'WORKOUT' ? 'bg-slate-100 text-slate-900 shadow' : 'text-slate-500'}`}
          >
            <Dumbbell size={16} /> تمرين اليوم
          </button>
          <button
            onClick={() => setActiveTab('MEALS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${activeTab === 'MEALS' ? 'bg-slate-100 text-slate-900 shadow' : 'text-slate-500'}`}
          >
            <Utensils size={16} /> الوجبات
          </button>
        </div>
      </header>

      {/* 2. عداد الراحة العائم (Floating Rest Timer) */}
      {restTimer > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-slate-900 px-5 py-2.5 rounded-full shadow-sm shadow-slate-200/50 shadow-blue-600/30 font-mono text-xl font-black flex items-center gap-2 border border-blue-400 animate-pulse">
          <Hourglass size={18} />
          {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* 3. محتوى التمرين (Workout View) */}
      {activeTab === 'WORKOUT' && (
        <main className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">يوم 1: جزء علوي (Upper Body)</h3>
            <span className="text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-600">5 تمارين</span>
          </div>

          {/* كارت تمرين (مثال) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-slate-900">تجميع دمبلز على بنش مائل</h4>
                <p className="text-[10px] text-slate-500 mt-1">رتم: 2-0-1-0 | راحة: 90 ثانية</p>
              </div>
              <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-400 hover:bg-slate-300 transition">
                <Video size={16} />
              </button>
            </div>

            {/* صفوف المجموعات (Sets Rows) */}
            <div className="space-y-2">
              {/* المجموعة 1 */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                <span className="w-6 text-center text-xs text-slate-500 font-bold">1</span>
                <input type="number" defaultValue="20" className="flex-1 bg-slate-950 border border-slate-200 rounded-lg py-1.5 text-center text-xs text-slate-900" placeholder="الوزن (kg)" />
                <input type="number" defaultValue="10" className="flex-1 bg-slate-950 border border-slate-200 rounded-lg py-1.5 text-center text-xs text-slate-900" placeholder="التكرار" />
                <button 
                  onClick={() => handleSetComplete(90)} 
                  className="w-12 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-black flex items-center justify-center transition"
                >
                  <Check size={16} />
                </button>
              </div>
              
              {/* المجموعة 2 */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                <span className="w-6 text-center text-xs text-slate-500 font-bold">2</span>
                <input type="number" defaultValue="20" className="flex-1 bg-slate-950 border border-slate-200 rounded-lg py-1.5 text-center text-xs text-slate-900" />
                <input type="number" defaultValue="10" className="flex-1 bg-slate-950 border border-slate-200 rounded-lg py-1.5 text-center text-xs text-slate-900" />
                <button 
                  onClick={() => handleSetComplete(90)} 
                  className="w-12 py-1.5 bg-slate-100 text-slate-500 rounded-lg font-black flex items-center justify-center transition hover:bg-emerald-500 hover:text-slate-950"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 4. محتوى الوجبات (Meals View) */}
      {activeTab === 'MEALS' && (
        <main className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700">الماكروز اليومية</h3>
            <span className="text-[11px] bg-slate-100 px-2 py-1 rounded-md text-emerald-400">2050 kcal</span>
          </div>

          {/* شريط الماكروز */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 block">بروتين</span>
              <span className="text-xs font-black text-rose-400">160g</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 block">كارب</span>
              <span className="text-xs font-black text-blue-400">200g</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 block">دهون</span>
              <span className="text-xs font-black text-amber-400">65g</span>
            </div>
          </div>

          {/* كارت وجبة */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-black text-slate-900">الوجبة 1 (الفطار)</h4>
              <button className="text-[11px] text-blue-400 flex items-center gap-1 font-bold">
                <RefreshCw size={12} /> تبديل صنف
              </button>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 3 بيض كامل مسلوق (150 جم)
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 2 شريحة توست أسمر (60 جم)
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> خضار ورقي حر (خيار، جرجير)
              </li>
            </ul>
          </div>
        </main>
      )}
      
      {/* الزر العائم لإنهاء اليوم (Bottom Action) */}
      <div className="fixed bottom-4 left-4 right-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900 font-black py-4 rounded-2xl shadow-sm shadow-slate-200/50 shadow-blue-600/20 transition flex items-center justify-center gap-2">
          <Zap size={18} />
          <span>إرسال وإغلاق يوميات اليوم</span>
        </button>
      </div>

    </div>
  );
}
