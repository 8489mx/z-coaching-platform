import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  Users, 
  CreditCard, 
  Dumbbell, 
  UtensilsCrossed, 
  FileEdit, 
  LineChart, 
  Settings, 
  User, 
  Phone, 
  ExternalLink,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { arabicSearchMatch } from '../../utils/searchUtils';

const SYSTEM_PAGES = [
  {
    title: 'لوحة التحكم والقرارات اليومية',
    category: 'PAGES',
    subtitle: 'الرئيسية ومتابعة مؤشرات الأداء الحية والتنبيهات',
    path: '/',
    icon: LayoutDashboard,
    keywords: 'dashboard home رئيسية قرارات لوحة قيادة تحكم'
  },
  {
    title: 'مركز استمارات العملاء ومراجعة الخطط',
    category: 'PAGES',
    subtitle: 'متابعة ملء الاستمارات وتوليد المسودات الذكية',
    path: '/intake/submissions',
    icon: ClipboardList,
    keywords: 'intake submissions استمارات استبيانات تسجيل خطة مسودة'
  },
  {
    title: 'لوحة مراجعة التقييمات الأسبوعية (Check-in Review)',
    category: 'PAGES',
    subtitle: 'مقارنة الصور، تحليل الأوزان، وتعديل الماكروز',
    path: '/coach/checkin-review',
    icon: CheckCircle2,
    keywords: 'checkin review تقييمات متابعة مراجعة أسبوعية صور وزن ماكروز'
  },
  {
    title: 'إدارة المشتركين وقاعدة البيانات (CRM)',
    category: 'PAGES',
    subtitle: 'سجل العملاء، الأكواد، وتسجيل مشترك جديد',
    path: '/customers',
    icon: Users,
    keywords: 'customers clients مشتركون عملاء كود تسجيل هاتف'
  },
  {
    title: 'إدارة الباقات والاشتراكات والمالية',
    category: 'PAGES',
    subtitle: 'متابعة الدخل، تجديد الباقات، وتجميد الاشتراكات',
    path: '/subscriptions',
    icon: CreditCard,
    keywords: 'subscriptions finance مالية باقات تجديد تجميد دخل اشتراكات'
  },
  {
    title: 'مكتبة التمارين والتكنيك الحركي',
    category: 'PAGES',
    subtitle: 'دليل التمارين مع الفيديوهات والأخطاء الشائعة',
    path: '/exercises',
    icon: Dumbbell,
    keywords: 'exercises تمارين تكنيك فيديو عضلات صدر ظهر أرجل مكتبة'
  },
  {
    title: 'محرك التغذية وحاسبة الماكروز',
    category: 'PAGES',
    subtitle: 'حساب السعرات، BMR/TDEE، وتوزيع البروتين والكارب والدهون',
    path: '/calculator',
    icon: UtensilsCrossed,
    keywords: 'calculator macros ماكروز سعرات دايت بروتين كارب دهون'
  },
  {
    title: 'منشئ ومعدل البرامج التدريبية والغذائية',
    category: 'PAGES',
    subtitle: 'تخصيص الوجبات، الجداول التدريبية، وملاحظات الكوتش',
    path: '/coach/editor',
    icon: FileEdit,
    keywords: 'editor program برنامج دايت تمرين منشئ جداول كوتش'
  },
  {
    title: 'داش الداش - إعدادات المنظومة العامة',
    category: 'PAGES',
    subtitle: 'محرر أسئلة الاستمارة، الباقات، الأغذية، والإعدادات',
    path: '/master-settings',
    icon: Settings,
    keywords: 'master settings إعدادات داش نظام باقات أغذية استمارة'
  },
  {
    title: 'التقارير المالية والإحصائيات التحليلية',
    category: 'PAGES',
    subtitle: 'تحليل الإيرادات، معدلات التجديد، والاحتفاظ بالمشتركين',
    path: '/coach/analytics',
    icon: LineChart,
    keywords: 'analytics reports تقارير إحصائيات نمو تجديد أرباح'
  },
  {
    title: 'استمارة المشترك العامة (رابط مباشر)',
    category: 'PAGES',
    subtitle: 'فتح نموذج إدخال البيانات المخصص للمشتركين الجدد',
    path: '/intake/form',
    icon: ExternalLink,
    keywords: 'form intake استمارة فورمة تعبئة رابط'
  },
];

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL | PAGES | CLIENTS | EXERCISES
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const fetchData = async () => {
        try {
          const [clientsRes, exercisesRes] = await Promise.allSettled([
            fetch(`${API_BASE}/api/v1/clients`),
            fetch(`${API_BASE}/api/v1/exercises`)
          ]);

          if (clientsRes.status === 'fulfilled') {
            const data = await clientsRes.value.json();
            if (data.clients) setClients(data.clients);
          }
          if (exercisesRes.status === 'fulfilled') {
            const data = await exercisesRes.value.json();
            if (data.exercises) setExercises(data.exercises);
          }
        } catch (e) {
          console.error('Search data fetch error:', e);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  const filteredPages = SYSTEM_PAGES.filter(p => {
    if (activeCategory !== 'ALL' && activeCategory !== 'PAGES') return false;
    if (!query.trim()) return true;
    return arabicSearchMatch(p.title, query) || 
           arabicSearchMatch(p.subtitle, query) || 
           arabicSearchMatch(p.keywords, query);
  });

  const filteredClients = clients.filter(c => {
    if (activeCategory !== 'ALL' && activeCategory !== 'CLIENTS') return false;
    if (!query.trim()) return activeCategory === 'CLIENTS';
    const codeMatch = String(c.client_code || c.id || '').includes(query.replace('#', '').trim());
    return codeMatch || 
           arabicSearchMatch(c.full_name, query) || 
           arabicSearchMatch(c.phone_number, query) ||
           arabicSearchMatch(c.subscription_package, query);
  }).map(c => ({
    title: c.full_name || `مشترك #${c.client_code || c.id}`,
    category: 'CLIENTS',
    subtitle: `كود #${c.client_code || c.id} • ${c.phone_number || ''} • ${c.subscription_package || 'باقة معتمدة'}`,
    path: `/coach/editor/${c.id || c.client_code}`,
    icon: User,
    rawClient: c
  }));

  const filteredExercises = exercises.filter(ex => {
    if (activeCategory !== 'ALL' && activeCategory !== 'EXERCISES') return false;
    if (!query.trim()) return activeCategory === 'EXERCISES';
    return arabicSearchMatch(ex.name_ar, query) || 
           arabicSearchMatch(ex.name_en, query) ||
           arabicSearchMatch(ex.muscle_group, query);
  }).map(ex => ({
    title: ex.name_ar || ex.name_en,
    category: 'EXERCISES',
    subtitle: `${ex.name_en || ''} • عضلة ${ex.muscle_group || ''} • أداة ${ex.equipment || ''}`,
    path: '/exercises',
    icon: Dumbbell,
    rawExercise: ex
  }));

  const allResults = [...filteredPages, ...filteredClients, ...filteredExercises];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item) => {
    onClose();
    if (item.path.startsWith('http')) {
      window.open(item.path, '_blank');
    } else {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        direction: 'rtl',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          animation: 'slideDown 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Search Input Bar */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            gap: '12px',
            background: '#FFFFFF'
          }}
        >
          <Search size={18} color="#0F172A" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="ابحث عن صفحة، مشترك (اسم، كود، هاتف)، أو تمرين..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '13.5px',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              color: '#0F172A',
              background: 'transparent'
            }}
          />
          {query && (
            <button 
              type="button" 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}
            >
              <X size={15} />
            </button>
          )}
          <kbd style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#64748B', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', fontFamily: 'monospace' }}>
            ESC
          </kbd>
        </div>

        {/* 2. Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '8px 18px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'PAGES', label: `صفحات النظام (${filteredPages.length})` },
            { id: 'CLIENTS', label: `المشتركين (${filteredClients.length})` },
            { id: 'EXERCISES', label: `التمارين (${filteredExercises.length})` },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedIndex(0);
              }}
              style={{
                padding: '3px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeCategory === cat.id ? '#0F172A' : 'transparent',
                color: activeCategory === cat.id ? '#FFFFFF' : '#64748B',
                boxShadow: activeCategory === cat.id ? '0 1px 3px rgba(15, 23, 42, 0.25)' : 'none',
                transition: 'background 0.12s ease, color 0.12s ease'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', maxHeight: '420px' }}>
          {allResults.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
              <Search size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>لم يتم العثور على أي نتائج مطابقة</div>
              <div style={{ fontSize: '11.5px', marginTop: '4px' }}>جرب البحث باسم صفحة أخرى، أو برقم هاتف أو كود المشترك</div>
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#F1F5F9' : 'transparent',
                    border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '3px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: isSelected ? '#0F172A' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {item.category === 'CLIENTS' && (
                      <span style={{ fontSize: '10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        مشترك CRM
                      </span>
                    )}
                    {item.category === 'EXERCISES' && (
                      <span style={{ fontSize: '10px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        تمرين
                      </span>
                    )}
                    <ChevronLeft size={14} color={isSelected ? '#0F172A' : '#CBD5E1'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Modal Footer Guide */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            fontSize: '11px',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span><kbd style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>↑</kbd> <kbd style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>↓</kbd> للتنقل</span>
            <span><kbd style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>Enter</kbd> للفتح</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 700 }}>
            <Sparkles size={12} />
            <span>البحث الفوري الذكي</span>
          </div>
        </div>

      </div>
    </div>
  );
}
