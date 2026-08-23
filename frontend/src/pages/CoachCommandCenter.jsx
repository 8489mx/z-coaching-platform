import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  ShieldAlert, 
  Hourglass, 
  Search, 
  Plus, 
  MessageCircle, 
  Check, 
  CheckCircle2, 
  BarChart3, 
  Dumbbell, 
  Calculator, 
  CreditCard, 
  LayoutDashboard, 
  Zap,
  Activity
} from 'lucide-react';

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('KZ-9421');
  const [copiedCode, setCopiedCode] = useState(false);

  const stats = [
    { title: 'إجمالي المشتركين النشطين', value: '48', change: '+18.2%', isUp: true, icon: Users, iconColor: '#0284C7', iconBg: '#E0F2FE' },
    { title: 'متابعات تنتظر الاعتماد', value: '2', change: 'اليوم', isUp: true, icon: Clock, iconColor: '#D97706', iconBg: '#FEF3C7' },
    { title: 'طوارئ المفاصل والتأهيل', value: '1', change: 'عاجل', isUp: false, icon: ShieldAlert, iconColor: '#E11D48', iconBg: '#FFE4E6' },
    { title: 'تجديدات خلال 7 أيام', value: '3', change: 'باقات منتهية', isUp: true, icon: Hourglass, iconColor: '#4F46E5', iconBg: '#EEF2FF' },
  ];

  const [actions, setActions] = useState([
    {
      id: 1,
      type: 'CHECKIN',
      client: 'سارة المنصوري',
      tier: 'باقة ماكس VIP',
      phone: '+966501234567',
      metric: 'نزول 1.6 كجم • -2 سم خصر',
      decision: 'الاستمرار بنفس العجز السعري وتثبيت الماكروز.',
      badge: 'متابعة أسبوعية',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    },
    {
      id: 2,
      type: 'CLINICAL',
      client: 'ياسمين فهد',
      tier: 'باقة إيليت',
      phone: '+971509876543',
      metric: 'نغزة ألم بالكتف الأيمن (6/10) بالتمرين',
      decision: 'استبدال البار بقبضة دمبل محايدة مائلة وتفعيل روتين الكفة المدورة.',
      badge: 'تنبيه مفصلي',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60'
    },
    {
      id: 3,
      type: 'INACTIVE',
      client: 'حسام البدري',
      tier: 'باقة ماكس VIP',
      phone: '+201012345678',
      metric: 'انقطاع 48 ساعة عن تسجيل التمارين',
      decision: 'إرسال رسالة تشجيع واطمئنان عبر الواتساب.',
      badge: 'رادار الغياب',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60'
    },
    {
      id: 4,
      type: 'RENEWAL',
      client: 'أحمد فتحي',
      tier: 'باقة إيليت',
      phone: '+201123456789',
      metric: 'الأسبوع 14 (إنجاز -13.5 كجم)',
      decision: 'إرسال عرض تجديد الدايت العكسي والبناء العضلي.',
      badge: 'تجديد اشتراك',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    }
  ]);

  const filteredActions = actions.filter(act => {
    const matchTab = activeTab === 'ALL' || act.type === activeTab;
    const matchSearch = act.client.includes(searchQuery) || act.phone.includes(searchQuery);
    return matchTab && matchSearch;
  });

  const generateNewClient = () => {
    const randomCode = 'KZ-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(randomCode);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans flex flex-row-reverse antialiased" dir="rtl">
      
      {/* 1. السايدبار الجانبي الفاخر (Sidebar) */}
      <aside className="w-64 bg-white border-l border-slate-200/80 p-5 flex flex-col justify-between hidden lg:flex shadow-[0_0_15px_rgba(0,0,0,0.02)]">
        <div className="space-y-6">
          {/* Identity */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-md shadow-blue-500/20">
              KZ
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">كابتن كريم زكريا</h1>
              <span className="text-[11px] font-medium text-slate-400">Super Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">الرئيسية والمتابعة</span>
              <nav className="space-y-1">
                <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs transition text-decoration-none">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>مركز القيادة اليومي</span>
                </Link>
                <Link to="/customers" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition text-decoration-none">
                  <Users className="w-4 h-4" />
                  <span>إدارة المشتركين</span>
                </Link>
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">البرامج والأدوات</span>
              <nav className="space-y-1">
                <Link to="/exercises" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition text-decoration-none">
                  <Dumbbell className="w-4 h-4" />
                  <span>مكتبة التمارين والأمان</span>
                </Link>
                <Link to="/calculator" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition text-decoration-none">
                  <Calculator className="w-4 h-4" />
                  <span>كتالوج الأغذية والماكروز</span>
                </Link>
                <Link to="/subscriptions" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition text-decoration-none">
                  <CreditCard className="w-4 h-4" />
                  <span>الاشتراكات والمالية</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-600">النظام متصل</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">V2.6</span>
        </div>
      </aside>

      {/* 2. المحتوى الرئيسي (Main Container) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full">
              <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="بحث بالاسم، رقم الهاتف، أو الكود (#1K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                generateNewClient();
                setIsNewClientModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm shadow-blue-600/20 transition active:scale-95 border-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء كود مشترك</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Page Title & Breadcrumb */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">مركز القيادة اليومي</h2>
              <p className="text-xs text-slate-500 mt-0.5">مسار الإجراءات والقرارات اليومية لمشتركي المنظومة</p>
            </div>
          </div>

          {/* 3. شريط كروت الإحصائيات (KPI Cards - Liner Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((st, i) => {
              const IconComp = st.icon;
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{st.title}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: st.iconBg, color: st.iconColor }}>
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">{st.value}</span>
                    <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full ' + (st.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                      {st.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. التقسيم الرئيسي 70/30 (Main Action Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* العمود الأيمن (70%): المتابعات والإجراءات اليومية */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl max-w-fit shadow-sm">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'CHECKIN', label: 'المتابعات' },
                  { id: 'CLINICAL', label: 'الشكاوى السريرية' },
                  { id: 'INACTIVE', label: 'رادار الانقطاع' },
                  { id: 'RENEWAL', label: 'التجديدات' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={'px-3.5 py-1.5 rounded-lg text-xs font-bold transition border-0 cursor-pointer ' + (
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action List */}
              <div className="space-y-3">
                {filteredActions.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">رائع! تم إنهاء كافة إجراءات اليوم بنجاح.</p>
                  </div>
                ) : (
                  filteredActions.map(action => (
                    <div
                      key={action.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                            {action.client[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 m-0">{action.client}</h4>
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {action.tier}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{action.phone}</span>
                          </div>
                        </div>

                        <span className={'text-[11px] font-bold px-3 py-1 rounded-full border ' + action.badgeClass}>
                          {action.badge}
                        </span>
                      </div>

                      {/* Content Box */}
                      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
                        <p className="text-xs text-slate-700 leading-relaxed m-0">
                          <strong className="text-slate-900 font-bold">الحالة: </strong>
                          {action.metric}
                        </p>
                        <p className="text-xs text-blue-700 font-semibold leading-relaxed m-0">
                          <strong className="text-slate-900 font-bold">القرار المقترح: </strong>
                          {action.decision}
                        </p>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <a
                          href={'https://wa.me/' + action.phone.replace(/\D/g, '')}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-sm text-decoration-none"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>محادثة واتساب</span>
                        </a>
                        <button
                          onClick={() => setActions(actions.filter(a => a.id !== action.id))}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5 border-0 cursor-pointer"
                        >
                          <span>اعتماد وتحديث الخطة</span>
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* العمود الأيسر (30%): الطوارئ وتوزيع الباقات */}
            <div className="space-y-4">
              
              {/* بطاقة الطوارئ السريرية */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 m-0">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>رادار الطوارئ السريرية</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">1 حالة</span>
                </div>
                <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 block">ياسمين فهد (إصابة كتف أيمن)</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed m-0">تم عزل تمارين البار وتفعيل الكفة المدورة والدمبل المحايد تلقائياً.</p>
                  <Link to="/exercises" className="w-full mt-2 bg-white hover:bg-slate-50 border border-rose-200 text-rose-700 text-[11px] font-bold py-1.5 rounded-lg transition shadow-sm text-center block text-decoration-none">
                    استعراض بروتوكول التأهيل
                  </Link>
                </div>
              </div>

              {/* بطاقة توزيع الباقات */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 m-0">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>توزيع المشتركين حسب الباقة</span>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">باقة ماكس (VIP MAX)</span>
                      <span className="text-slate-900 font-bold">32 مشترك (67%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">باقة إيليت (ELITE)</span>
                      <span className="text-slate-900 font-bold">16 مشترك (33%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* 5. نافذة توليد كود المشترك (Modal) */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">توليد كود مشترك جديد</h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold border-0 bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">كود المتدرب المخصص:</span>
              <span className="text-2xl font-black text-blue-600 tracking-wider font-mono">{generatedCode}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const inviteMsg = 'أهلاً بك مع كابتن كريم زكريا!\nكود الاشتراك الخاص بك هو: *' + generatedCode + '*\nرابط الدخول واستمارة التقييم:\n' + window.location.origin + '/onboarding';
                  navigator.clipboard.writeText(inviteMsg);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm shadow-blue-600/20 border-0 cursor-pointer"
              >
                {copiedCode ? 'تم نسخ رسالة الدعوة وكود المشترك بنجاح!' : 'نسخ رسالة الترحيب والواتساب'}
              </button>

              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition border-0 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
