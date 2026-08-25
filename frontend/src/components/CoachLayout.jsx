import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, path: '/coach/dashboard' },
    { name: 'الاستبيانات الجديدة', icon: <ClipboardList size={20} />, path: '/intake/submissions' },
    { name: 'مراجعة التقييمات', icon: <CheckCircle2 size={20} />, path: '/coach/checkin-review' },
    { name: 'إدارة العملاء', icon: <Users size={20} />, path: '/customers' },
    { name: 'مكتبة التمارين', icon: <Dumbbell size={20} />, path: '/exercises' },
    { name: 'الإحصائيات المالية', icon: <BarChart3 size={20} />, path: '/coach/analytics' },
    { name: 'إعدادات النظام', icon: <Settings size={20} />, path: '/master-settings' },
  ];

  const handleLogout = () => {
    // Clear tokens/auth logic here
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-6 flex items-center justify-center border-b border-slate-100">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-l from-blue-600 to-indigo-600">
          Z-COACHING
        </h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path === '/coach/dashboard' && location.pathname === '/');
                           
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                {item.icon}
              </div>
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut size={20} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900" dir="rtl">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 relative">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="w-72 max-w-[80%] h-full relative z-10 animate-in slide-in-from-right-8 duration-300">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث عن عميل، تمرين..." 
                className="bg-transparent border-none outline-none text-sm font-bold w-full px-3 text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-900 transition bg-slate-50 hover:bg-slate-100 rounded-full">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-black text-slate-900">الكابتن مصطفى</p>
                <p className="text-xs font-bold text-slate-500">المدير العام</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                M
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
