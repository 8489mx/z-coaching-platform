import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Send, 
  Dumbbell, 
  Utensils, 
  FileText, 
  User, 
  Activity, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';

export default function CoachEditor() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const submissionId = searchParams.get('submission_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('NUTRITION');
  
  const [user, setUser] = useState(null);
  const [program, setProgram] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDraftProgram();
  }, [userId]);

  const fetchDraftProgram = async () => {
    try {
      setLoading(true);
      // استخدام مسار جلب البرنامج (يجب التأكد من توافقه مع الباك إند الفعلي)
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${userId}`);
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setProgram(data.master_program);
        setCoachNotes(data.master_program?.coach_notes || '');
      } else {
        showNotification('حدث خطأ أثناء جلب المسودة', 'error');
      }
    } catch (err) {
      showNotification('تعذر الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const updatedProgram = { ...program, coach_notes: coachNotes };
      
      const res = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: userId,
          program_data: updatedProgram,
          coach_notes: coachNotes
        })
      });

      if (res.ok) {
        setProgram(updatedProgram);
        showNotification('تم حفظ المسودة بنجاح');
      } else {
        showNotification('فشل حفظ المسودة', 'error');
      }
    } catch (err) {
      showNotification('خطأ في الاتصال', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndPublish = async () => {
    try {
      setPublishing(true);
      
      // حفظ التعديلات أولاً
      await handleSaveDraft();

      // إذا كان هناك submissionId، نقوم بالاعتماد من خلاله
      let endpoint = `${API_BASE}/api/intake/${submissionId}/approve-and-publish`;
      let method = 'POST';
      let body = JSON.stringify({ coach_notes: coachNotes });

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        showNotification('تم اعتماد الخطة ونشرها للعميل بنجاح!', 'success');
        setTimeout(() => {
          navigate('/admin/dashboard'); // العودة للرئيسية بعد النشر
        }, 1500);
      } else {
        showNotification('حدث خطأ أثناء الاعتماد', 'error');
      }
    } catch (err) {
      showNotification('خطأ في الاتصال', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4" dir="rtl">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <h2 className="text-xl font-black text-slate-700">جاري تحميل مسودة العميل...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (!program) {
    return (
      <AdminLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4" dir="rtl">
          <AlertTriangle size={48} className="text-rose-500" />
          <h2 className="text-xl font-black text-slate-700">لم يتم العثور على مسودة لهذا العميل</h2>
          <button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <ChevronRight size={18} /> العودة
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto pb-24 font-sans" dir="rtl">
        
        {/* Header / Client Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-md shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{user?.full_name || 'عميل جديد'}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm font-bold">
                <span className="text-slate-600">كود: {user?.client_code || userId}</span>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                  <Zap size={12} /> {user?.subscription_package?.includes('MAX') ? 'MAX' : 'ELITE'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <Activity className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] text-slate-500 font-bold">حالة الخطة</p>
              <p className="text-xs text-slate-900 font-black">مسودة قيد المراجعة</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1.5 border border-slate-200 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'NUTRITION', icon: <Utensils size={18} />, label: 'الدايت والماكروز' },
            { id: 'WORKOUT', icon: <Dumbbell size={18} />, label: 'جدول التمرين' },
            { id: 'NOTES', icon: <FileText size={18} />, label: 'ملاحظات الكوتش' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-slate-900 shadow-sm shadow-slate-200/50 shadow-blue-500/20' 
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Content Area */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[400px]">
          
          {activeTab === 'NUTRITION' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-blue-500 mb-4 border-b border-slate-200 pb-3">
                <Target size={24} />
                <h3 className="text-lg font-black text-slate-900">الماكروز اليومية المقترحة</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-xs font-bold text-slate-500 block mb-1">السعرات</span>
                  <span className="text-xl font-black text-emerald-400">{program?.nutrition?.targets?.calories || 0} kcal</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-xs font-bold text-slate-500 block mb-1">بروتين</span>
                  <span className="text-xl font-black text-blue-400">{program?.nutrition?.targets?.protein || 0}g</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-xs font-bold text-slate-500 block mb-1">كارب</span>
                  <span className="text-xl font-black text-rose-400">{program?.nutrition?.targets?.carbs || 0}g</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-xs font-bold text-slate-500 block mb-1">دهون</span>
                  <span className="text-xl font-black text-amber-400">{program?.nutrition?.targets?.fats || 0}g</span>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-bold text-slate-600 mb-4">هيكل الوجبات (يمكن تعديله لاحقاً من نظام الدايت)</h4>
                <div className="space-y-3">
                  {program?.nutrition?.meals?.map((meal, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{meal.name || `وجبة ${idx+1}`}</span>
                      <span className="text-xs text-slate-500 font-bold">{meal.macros?.calories || 0} kcal</span>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-sm italic">لم يتم توليد وجبات مفصلة بعد.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WORKOUT' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex items-center gap-2 text-blue-500 mb-4 border-b border-slate-200 pb-3">
                <Dumbbell size={24} />
                <h3 className="text-lg font-black text-slate-900">جدول التدريب (أيام الأسبوع)</h3>
              </div>
              <div className="space-y-4">
                {program?.training?.sessions?.map((session, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <h4 className="font-black text-slate-900 text-sm mb-3">يوم {idx+1}: {session.name}</h4>
                    <div className="space-y-2">
                      {session.exercises?.map((ex, eIdx) => (
                        <div key={eIdx} className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{ex.name}</span>
                          <span className="text-slate-500 font-bold">{ex.sets} مجموعات × {ex.reps} تكرار</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )) || (
                  <p className="text-slate-500 text-sm italic">لم يتم توليد جدول تمرين بعد.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-blue-500 mb-4 border-b border-slate-200 pb-3">
                <FileText size={24} />
                <h3 className="text-lg font-black text-slate-900">توجيهات الكوتش الخاصة (للعميل)</h3>
              </div>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="اكتب هنا أي ملاحظات، تعليمات خاصة للإحماء، أو نصائح للالتزام بالخطة..."
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 text-sm font-bold focus:border-blue-500 outline-none resize-none transition"
              />
              <p className="text-[10px] text-slate-500 font-bold">هذه الملاحظات ستظهر للعميل في واجهة التطبيق الخاصة به.</p>
            </div>
          )}

        </div>
      </div>

      {/* Floating Action Bar (Cross-platform friendly) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-50/90 backdrop-blur-lg border-t border-slate-200 p-4 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="flex-1 md:flex-none md:w-48 bg-slate-100 hover:bg-slate-300 text-slate-900 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm border border-slate-300"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">حفظ كمسودة</span>
            <span className="sm:hidden">حفظ</span>
          </button>
          
          <button 
            onClick={handleApproveAndPublish}
            disabled={saving || publishing}
            className="flex-[2] md:flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black py-3.5 rounded-xl transition shadow-sm shadow-slate-200/50 shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            {publishing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span>اعتماد ونشر للعميل</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 ${
          notification.type === 'error' ? 'bg-rose-500 text-slate-900' : 'bg-emerald-500 text-slate-950'
        }`}>
          <CheckCircle2 size={18} />
          {notification.msg}
        </div>
      )}
    </AdminLayout>
  );
}
