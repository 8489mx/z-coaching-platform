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
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { arabicSearchMatch } from '../../utils/searchUtils';
import FlexibleRenewalModal from './FlexibleRenewalModal';

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
    title: 'لوحة المالية والتجديدات ومعدل الاحتفاظ (MRR)',
    category: 'PAGES',
    subtitle: 'متابعة الإيراد الشهري، اشتراكات الباقات، والمستحقين للتجديد',
    path: '/coach/financials',
    icon: LineChart,
    keywords: 'financials mrr إيرادات مالية تجديدات دخل ركود'
  },
  {
    title: 'مركز تذكيرات الواتساب الذكية',
    category: 'PAGES',
    subtitle: 'تذكيرات الشرب، التمارين، التقييم، والتجديد',
    path: '/coach/reminders',
    icon: MessageCircle,
    keywords: 'reminders whatsapp تذكير واتساب رسائل متابعة'
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
    title: 'استمارة المشترك العامة (رابط مباشر)',
    category: 'PAGES',
    subtitle: 'فتح نموذج إدخال البيانات المخصص للمشتركين الجدد',
    path: '/intake/form',
    icon: ExternalLink,
    keywords: 'form intake استمارة فورمة تعبئة رابط'
  }
];

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL | PAGES | CLIENTS | EXERCISES
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [renewalClient, setRenewalClient] = useState(null);

  // Global Keyboard Shortcut listener (Ctrl+K or Cmd+K or Ctrl+/)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === '/')) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);

      const fetchData = async () => {
        try {
          const [clientsRes, exercisesRes] = await Promise.allSettled([
            fetch(`${API_BASE}/api/v1/clients`),
            fetch(`${API_BASE}/api/v1/exercises`)
          ]);

          if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
            const data = await clientsRes.value.json();
            if (data.clients) setClients(data.clients);
          }
          if (exercisesRes.status === 'fulfilled' && exercisesRes.value.ok) {
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
    const cleanQ = query.replace('#', '').trim().toLowerCase();
    const codeMatch = String(c.client_code || c.id || '').toLowerCase().includes(cleanQ);
    return codeMatch || 
           arabicSearchMatch(c.full_name, query) || 
           arabicSearchMatch(c.name, query) || 
           arabicSearchMatch(c.phone_number, query) ||
           arabicSearchMatch(c.subscription_package, query);
  }).map(c => {
    const code = c.client_code || c.id || '1';
    const phone = c.phone_number || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('01') ? '2' + cleanPhone : cleanPhone;
    const isMax = String(c.subscription_package || c.package || '').toUpperCase().includes('MAX');

    return {
      title: c.full_name || c.name || `مشترك #${code}`,
      category: 'CLIENTS',
      subtitle: `كود #${code} • ${phone || 'بدون هاتف'} • ${isMax ? 'باقة MAX' : 'باقة ELITE'}`,
      path: `/coach/editor?user_id=${code}`,
      pdfPath: `/pdf?user_id=${code}`,
      crmPath: `/customers?search=${code}`,
      waUrl: waPhone ? `https://wa.me/${waPhone}` : null,
      icon: User,
      clientCode: code,
      isMax,
      rawClient: c
    };
  });

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

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Inline Search Trigger Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#F8FAFC',
          border: '1px solid',
          borderColor: isOpen ? '#CBD5E1' : '#E2E8F0',
          borderRadius: '6px',
          padding: '0 10px',
          height: '32px',
          width: '270px',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          backgroundColor: isOpen ? '#F1F5F9' : '#F8FAFC',
          boxShadow: isOpen ? '0 0 0 2px rgba(15, 23, 42, 0.08)' : 'none'
        }}
        onClick={() => setIsOpen(true)}
      >
        <Search size={14} color="#0F172A" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="بحث سريع عن مشترك أو صفحة..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
              inputRef.current?.blur();
            } else {
              handleKeyDown(e);
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            fontSize: '11.5px',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 600,
            color: '#0F172A',
            background: 'transparent',
            width: '100%'
          }}
        />
        {query ? (
          <button 
            type="button" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setQuery(''); 
              inputRef.current?.focus(); 
            }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex', alignItems: 'center' }}
          >
            <X size={13} />
          </button>
        ) : (
          <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#94A3B8', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '1px 5px', borderRadius: '4px', fontFamily: 'JetBrains Mono, Cairo', userSelect: 'none' }}>
            Ctrl K
          </span>
        )}
      </div>

      {/* Dropdown Results Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '520px',
            maxWidth: '92vw',
            background: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.18)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px',
            overflow: 'hidden'
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'CLIENTS', label: `المشتركين (${filteredClients.length})` },
              { id: 'PAGES', label: `صفحات النظام (${filteredPages.length})` },
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
                  background: activeCategory === cat.id ? '#0F172A' : '#FFFFFF',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#64748B',
                  border: activeCategory === cat.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  boxShadow: activeCategory === cat.id ? '0 1px 3px rgba(15, 23, 42, 0.2)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', maxHeight: '400px' }}>
            {allResults.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <Search size={28} style={{ margin: '0 auto 8px auto', opacity: 0.3 }} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>لم يتم العثور على أي نتائج مطابقة</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>جرب البحث برقم هاتف المشترك، كوده، أو اسمه</div>
              </div>
            ) : (
              allResults.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                const isClient = item.category === 'CLIENTS';

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? '#F1F5F9' : '#FFFFFF',
                      border: isSelected ? '1px solid #CBD5E1' : '1px solid #F1F5F9',
                      transition: 'all 0.1s ease',
                      marginBottom: '4px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: isSelected ? '#0F172A' : (isClient ? '#EFF6FF' : '#F8FAFC'),
                          color: isSelected ? '#FFFFFF' : (isClient ? '#1D4ED8' : '#475569'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.1s ease'
                        }}
                      >
                        <Icon size={15} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                          {isClient && (
                            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: item.isMax ? '#FFFBEB' : '#F0F9FF', color: item.isMax ? '#B45309' : '#0284C7', border: item.isMax ? '1px solid #FDE68A' : '1px solid #BAE6FD' }}>
                              {item.isMax ? 'MAX' : 'ELITE'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Quick 1-Click Action Buttons for Clients */}
                    {isClient ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => { onClose(); navigate(item.path); }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '10px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="فتح وتعديل الخطة في المحرر"
                        >
                          <FileEdit size={10} />
                          <span>الخطة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewalClient(item.rawClient)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            background: '#FEF3C7',
                            color: '#B45309',
                            border: '1px solid #FDE68A',
                            fontSize: '10px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="تجديد وتحصيل اشتراك المتدرب بمزاجك"
                        >
                          <CreditCard size={9} />
                          <span>تجديد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(item.pdfPath, '_blank')}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="عرض ملف PDF للبرنامج"
                        >
                          <ExternalLink size={9} />
                          <span>PDF</span>
                        </button>

                        {item.waUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(item.waUrl, '_blank')}
                            style={{
                              padding: '3px 7px',
                              borderRadius: '4px',
                              background: '#25D366',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title="فتح محادثة واتساب"
                          >
                            <MessageCircle size={10} />
                            <span>واتساب</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                          {item.category === 'PAGES' ? 'صفحة' : 'تمرين'}
                        </span>
                        <ChevronLeft size={13} color={isSelected ? '#0F172A' : '#CBD5E1'} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div style={{ padding: '6px 12px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94A3B8' }}>
            <span>استخدم الأسهم <strong>↑</strong> <strong>↓</strong> للتنقل و <strong>Enter</strong> للاختيار</span>
            <span>اضغط <strong>Esc</strong> للإغلاق</span>
          </div>

        </div>
      )}
      {/* Flexible Custom Renewal Modal */}
      {renewalClient && (
        <FlexibleRenewalModal
          isOpen={Boolean(renewalClient)}
          onClose={() => setRenewalClient(null)}
          client={renewalClient}
          onSuccess={() => {
            setRenewalClient(null);
          }}
        />
      )}
    </div>
  );
}
