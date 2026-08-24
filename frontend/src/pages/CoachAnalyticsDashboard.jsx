import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Wallet, 
  Activity, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AdminLayout from '../components/layout/AdminLayout';

export default function CoachAnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/v1/subscriptions/overview');
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'تعذر جلب البيانات من الخادم');
      
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
        <h2 className="text-xl font-black text-slate-700">جاري تحليل بيانات المشتركين...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle size={48} className="text-rose-500 mb-4" />
        <p className="text-slate-900 font-bold mb-6">{error}</p>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 bg-blue-600 text-slate-900 px-6 py-3 rounded-xl font-bold">
          <RefreshCcw size={18} /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const { overview, clients } = data;
  const expiringClients = clients.filter(c => c.status === 'EXPIRING_SOON');

  return (
    <AdminLayout>
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="text-slate-600 hover:text-slate-900 transition p-2 bg-slate-50 rounded-xl">
              <ChevronRight size={24} />
            </button>
            <div className="flex items-center gap-3 text-blue-500">
              <BarChart3 size={24} />
              <h1 className="text-xl font-black text-slate-900">إحصائيات الأداء المالي</h1>
            </div>
          </div>
          <button onClick={fetchAnalytics} className="text-slate-600 hover:text-slate-900 p-2">
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600">الإيرادات الشهرية المتوقعة</span>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Wallet size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-emerald-400">{overview.total_monthly_revenue.toLocaleString()} ج.م</h2>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-500">
                <ArrowUpRight size={14} /> <span>تدفق نقدي صحي</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600">العملاء النشطين (Active)</span>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{overview.active_count} <span className="text-sm text-slate-500 font-bold">بطل</span></h2>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-blue-500">
                <Activity size={14} /> <span>معدل تفاعل مرتفع</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-amber-500/30 p-6 rounded-2xl shadow-md shadow-amber-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600">اشتراكات تنتهي قريباً</span>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-amber-500">{overview.expiring_soon_count} <span className="text-sm text-slate-500 font-bold">عملاء</span></h2>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-amber-500">
                <AlertTriangle size={14} /> <span>(أقل من 7 أيام على الانتهاء)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-600">إجمالي قاعدة البيانات</span>
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{overview.total_clients} <span className="text-sm text-slate-500 font-bold">حساب</span></h2>
              <div className="flex items-center gap-1 mt-2 text-xs font-bold text-slate-500">
                <span>تاريخ المنصة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Pipeline (Visual Bar) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md shadow-slate-200/50">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="font-black text-lg text-slate-900">مؤشر الاستقرار (Retention Pipeline)</h3>
          </div>
          
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
            {overview.active_count > 0 && (
              <div style={{ width: `${(overview.active_count / overview.total_clients) * 100}%` }} className="bg-emerald-500 h-full transition-all" title="نشط ومستقر" />
            )}
            {overview.expiring_soon_count > 0 && (
              <div style={{ width: `${(overview.expiring_soon_count / overview.total_clients) * 100}%` }} className="bg-amber-500 h-full transition-all" title="ينتهي قريباً" />
            )}
            {overview.expired_count > 0 && (
              <div style={{ width: `${(overview.expired_count / overview.total_clients) * 100}%` }} className="bg-rose-500 h-full transition-all" title="منتهي" />
            )}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs font-bold">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-slate-600">مستقر ({overview.active_count})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> <span className="text-slate-600">خطر الانسحاب ({overview.expiring_soon_count})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /> <span className="text-slate-600">منتهي ({overview.expired_count})</span></div>
          </div>
        </div>

        {/* Expiring Soon Action List */}
        {expiringClients.length > 0 && (
          <div className="bg-white border border-amber-500/30 p-6 rounded-2xl shadow-md shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                <h3 className="font-black text-lg text-slate-900">قائمة الانتظار (تجديدات عاجلة)</h3>
              </div>
              <span className="bg-amber-500/20 text-amber-500 text-xs font-bold px-3 py-1 rounded-full">
                {expiringClients.length} عملاء
              </span>
            </div>

            <div className="space-y-3">
              {expiringClients.map(client => (
                <div key={client.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-amber-500/50 transition">
                  <div>
                    <h4 className="font-bold text-slate-900">{client.full_name || client.client_code}</h4>
                    <p className="text-xs text-slate-600 font-bold mt-1">المتبقي: <span className="text-amber-500">{client.days_remaining} أيام</span> | الباقة: {client.tier?.toUpperCase()}</p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg transition">
                    إرسال خصم واتساب
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
    </AdminLayout>
  );
}

