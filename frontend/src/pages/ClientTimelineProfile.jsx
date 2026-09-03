import React, { useState } from 'react';
import { User, Activity, TrendingUp, TrendingDown, Calendar, Settings2, ChevronRight, Target, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import AdminLayout from '../components/layout/AdminLayout';

export default function ClientTimelineProfile() {
  const navigate = useNavigate();
  const { id } = useParams(); // Client ID
  
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [clientData, setClientData] = useState({
    id: id || '101',
    name: 'أحمد محمود',
    package: 'MAX',
    daysRemaining: 180,
    currentPhase: 'FAT_LOSS', // 'FAT_LOSS', 'DIET_BREAK', 'LEAN_BULK', 'MINI_CUT'
    startDate: '2026-05-01',
    macros: { calories: 1800, protein: 160, carbs: 140, fats: 60 }
  });

  const phases = [
    { id: 'FAT_LOSS', label: 'تنشيف (Cut)', desc: 'عجز سعرات لحرق الدهون', icon: <TrendingDown size={18} /> },
    { id: 'DIET_BREAK', label: 'صيانة (Diet Break)', desc: 'ثبات السعرات لراحة الجهاز العصبي', icon: <Activity size={18} /> },
    { id: 'LEAN_BULK', label: 'تضخيم صافي (Lean Bulk)', desc: 'فائض سعرات خفيف لبناء العضل', icon: <TrendingUp size={18} /> },
    { id: 'MINI_CUT', label: 'تنشيف سريع (Mini-Cut)', desc: 'حرق دهون سريع للعودة للتضخيم', icon: <TrendingDown size={18} /> }
  ];

  const handlePhaseChange = (newPhaseId) => {
    // In a real app, this would hit the engine API to recalculate macros
    setClientData({ ...clientData, currentPhase: newPhaseId });
    setIsChangingPhase(false);
    alert('تم تغيير مرحلة العميل بنجاح! سيقوم المحرك بحساب السعرات الجديدة وتحديث خطته فوراً.');
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/customers')} className="text-slate-400 hover:text-slate-900 transition p-2 bg-slate-50 rounded-xl">
              <ChevronRight size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">ملف العميل الدقيق (CRM)</h1>
              <p className="text-xs font-bold text-slate-500">متابعة الفترات (Periodization)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Client Identity Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">
              {clientData.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{clientData.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-1 rounded-md">باقة {clientData.package}</span>
                <span className="text-sm font-bold text-slate-500 flex items-center gap-1"><Calendar size={14} /> متبقي {clientData.daysRemaining} يوم</span>
              </div>
            </div>
          </div>
          <button className="bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-800 transition">
            <User size={16} /> المراسلة
          </button>
        </div>

        {/* Periodization Control */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="text-blue-600" size={24} />
              <h3 className="font-black text-lg text-slate-900">المرحلة الحالية (Current Phase)</h3>
            </div>
            {!isChangingPhase && (
              <button onClick={() => setIsChangingPhase(true)} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition">
                <ArrowRightLeft size={16} /> نقل لمرحلة جديدة
              </button>
            )}
          </div>

          {isChangingPhase ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-sm font-bold text-slate-600 mb-4">اختر المرحلة الفسيولوجية الجديدة للعميل. سيقوم المحرك بتغيير التدريب والماكروز تلقائياً (Reverse Dieting / Cuts):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phases.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handlePhaseChange(p.id)}
                    className="flex flex-col items-start p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-right"
                  >
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      {p.icon}
                      <span className="font-black text-slate-900">{p.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{p.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setIsChangingPhase(false)} className="mt-4 w-full text-slate-500 font-bold text-sm hover:text-slate-900 transition">إلغاء</button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-slate-900 mb-1">{phases.find(p => p.id === clientData.currentPhase)?.label}</h4>
                <p className="text-sm font-bold text-slate-500">السعرات الحالية: {clientData.macros.calories} Kcal (البروتين: {clientData.macros.protein}g)</p>
              </div>
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                <Settings2 size={24} />
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline placeholder */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-blue-600" size={24} />
            <h3 className="font-black text-lg text-slate-900">سجل التطور (Timeline)</h3>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-slate-200">
            {/* Timeline Item 1 */}
            <div className="relative flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border-4 border-white z-10">
                <CheckCircle2 size={20} />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-900">تقييم أسبوعي (الأسبوع 12)</h4>
                  <span className="text-xs font-bold text-slate-500">منذ يومين</span>
                </div>
                <p className="text-sm font-bold text-slate-600">الوزن: 84.5 كجم (-0.5). تم تعديل الكارب بناءً على اقتراح المحرك.</p>
              </div>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="relative flex gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 border-4 border-white z-10">
                <Target size={20} />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-900">تغيير المرحلة (بدء التنشيف)</h4>
                  <span className="text-xs font-bold text-slate-500">منذ 3 أشهر</span>
                </div>
                <p className="text-sm font-bold text-slate-600">تم تحديد السعرات إلى 1800 Kcal وإضافة كارديو 3 مرات.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </AdminLayout>
  );
}

