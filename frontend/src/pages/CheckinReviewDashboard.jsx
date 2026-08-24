import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MessageCircle, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Scale, 
  Utensils, 
  Activity, 
  ChevronRight,
  BrainCircuit,
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AdminLayout from '../components/layout/AdminLayout';

export default function CheckinReviewDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkin, setCheckin] = useState(null); // The current check-in being reviewed
  const [macroAdjustments, setMacroAdjustments] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [coachReply, setCoachReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock fetching the next pending check-in
  useEffect(() => {
    setTimeout(() => {
      setCheckin({
        id: 101,
        client: { name: 'أحمد محمود', code: 'TEST99', goal: 'FAT_LOSS', package: 'MAX' },
        week_number: 4,
        metrics: {
          current_weight: 84.5,
          previous_weight: 85.0,
          weight_change: -0.5,
          adherence: 95,
          workouts_completed: 4
        },
        biofeedback: { energy: 7, sleep: 8, hunger: 6 },
        client_notes: 'الحمدلله أسبوع ممتاز، التزمت بالدايت بس حسيت بجوع شوية بليل قبل النوم.',
        ai_analysis: {
          status: 'ON_TRACK',
          recommendation: 'العميل ينزل بمعدل صحي جداً (نصف كيلو أسبوعياً). ينصح بزيادة الألياف أو البروتين في الوجبة الأخيرة لسد الجوع الليلي دون المساس بالسعرات الكلية.'
        },
        current_macros: { calories: 1900, protein: 160, carbs: 150, fats: 55 }
      });
      
      // Initialize adjustments with current macros
      setMacroAdjustments({ calories: 1900, protein: 160, carbs: 150, fats: 55 });
      setLoading(false);
    }, 1000);
  }, []);

  const handleApprove = async () => {
    setIsSubmitting(true);
    // محاكاة إرسال الاعتماد للباك إند
    setTimeout(() => {
      setIsSubmitting(false);
      alert('تم اعتماد التحديث بنجاح، وتم إرسال الإشعار للعميل!');
      navigate('/admin/dashboard');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
        <h2 className="text-xl font-black text-slate-700">جاري سحب التقييمات المعلقة...</h2>
      </div>
    );
  }

  if (!checkin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900">لا توجد تقييمات معلقة</h2>
          <p className="text-slate-500 font-bold mt-2">لقد قمت بإنهاء جميع أعمالك لليوم!</p>
          <button onClick={() => navigate('/admin/dashboard')} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="text-slate-400 hover:text-slate-900 transition p-2 bg-slate-50 rounded-xl">
              <ChevronRight size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">مراجعة تقييم العميل</h1>
              <p className="text-xs font-bold text-slate-500">{checkin.client.name} | الأسبوع {checkin.week_number}</p>
            </div>
          </div>
          <div className="bg-amber-100 text-amber-700 font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            باقة {checkin.client.package}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Column: Client Data & Biofeedback */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Scale className="text-blue-600" size={20} /> المؤشرات الرقمية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">الوزن الحالي</p>
                <p className="text-2xl font-black">{checkin.metrics.current_weight} <span className="text-sm">كجم</span></p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 mb-1">التغير (دلتا)</p>
                <p className="text-2xl font-black text-emerald-600 flex items-center gap-1">
                  {checkin.metrics.weight_change < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />} 
                  {Math.abs(checkin.metrics.weight_change)} <span className="text-sm">كجم</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">الالتزام بالدايت</p>
                <p className="text-2xl font-black text-blue-600">{checkin.metrics.adherence}%</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">التمرين (أيام)</p>
                <p className="text-2xl font-black">{checkin.metrics.workouts_completed} / 4</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-black text-lg mb-2 flex items-center gap-2"><Activity className="text-rose-600" size={20} /> المؤشرات الحيوية</h3>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-600 text-sm">الطاقة والنشاط</span>
              <span className="font-black text-slate-900">{checkin.biofeedback.energy} / 10</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-600 text-sm">جودة النوم</span>
              <span className="font-black text-slate-900">{checkin.biofeedback.sleep} / 10</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
              <span className="font-bold text-amber-700 text-sm">معدل الجوع (مرتفع)</span>
              <span className="font-black text-amber-600">{checkin.biofeedback.hunger} / 10</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Photos & Client Message */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Camera className="text-blue-600" size={20} /> صور التطور (المقارنة)</h3>
            <div className="grid grid-cols-2 gap-2 h-48">
              <div className="bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300">
                <Camera size={24} className="mb-2" />
                <span className="text-xs font-bold">الأسبوع الماضي</span>
              </div>
              <div className="bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300">
                <Camera size={24} className="mb-2 text-blue-500" />
                <span className="text-xs font-bold text-blue-600">هذا الأسبوع</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-sm transition">تكبير الصور</button>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><MessageCircle className="text-blue-600" size={20} /> رسالة العميل</h3>
            <p className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-700 font-bold text-sm leading-relaxed">
              "{checkin.client_notes}"
            </p>
          </div>
        </div>

        {/* Left Column: AI Engine & Macro Adjustments */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg text-blue-900 mb-4 flex items-center gap-2"><BrainCircuit className="text-blue-600" size={20} /> تحليل المحرك الذكي</h3>
            <p className="text-blue-800 text-sm font-bold leading-relaxed mb-4">
              {checkin.ai_analysis.recommendation}
            </p>
            {checkin.biofeedback.hunger > 5 && (
              <div className="bg-amber-100/50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 text-xs font-bold text-amber-800">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>العميل يشتكي من الجوع، لا ينصح بتقليل السعرات أكثر هذا الأسبوع.</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Utensils className="text-blue-600" size={20} /> تعديل الماكروز للأسبوع القادم</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 text-sm">السعرات (Kcal)</span>
                <input type="number" value={macroAdjustments.calories} onChange={e => setMacroAdjustments({...macroAdjustments, calories: e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-black focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 text-sm">البروتين (g)</span>
                <input type="number" value={macroAdjustments.protein} onChange={e => setMacroAdjustments({...macroAdjustments, protein: e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-black focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 text-sm">الكارب (g)</span>
                <input type="number" value={macroAdjustments.carbs} onChange={e => setMacroAdjustments({...macroAdjustments, carbs: e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-black focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 text-sm">الدهون (g)</span>
                <input type="number" value={macroAdjustments.fats} onChange={e => setMacroAdjustments({...macroAdjustments, fats: e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center font-black focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-sm font-bold text-slate-600">رسالتك للعميل (واتساب)</label>
              <textarea 
                value={coachReply}
                onChange={e => setCoachReply(e.target.value)}
                placeholder="اكتب ردك التشجيعي هنا..." 
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold resize-none focus:border-blue-500 outline-none"
              />
            </div>

            <button 
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> اعتماد التحديث وإرسال</>}
            </button>
          </div>
        </div>

      </div>
    </div>
    </AdminLayout>
  );
}

