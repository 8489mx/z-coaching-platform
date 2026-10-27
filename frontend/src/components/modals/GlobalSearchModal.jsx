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
  ExternalLink,
  ChevronLeft,
  MessageCircle
} from 'lucide-react';
import { API_BASE } from '../../config/api';
import { arabicSearchMatch } from '../../utils/searchUtils';
import { formatWhatsAppPhone } from '../../utils/whatsappRemindersEngine';
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
  const [isFocused, setIsFocused] = useState(false);
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
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onClose = () => {
    setIsOpen(false);
    setIsFocused(false);
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
    const cleanQ = query.replace(/^#+/, '').trim().toLowerCase();
    const cleanClientCode = String(c.client_code || c.id || '').replace(/^client[-_]?/i, '').replace(/^#+/, '').toLowerCase();
    const qCode = cleanQ.replace(/^client[-_]?/i, '');
    const codeMatch = cleanClientCode === qCode || cleanClientCode.includes(qCode) || String(c.client_code || c.id || '').toLowerCase().includes(cleanQ);
    return codeMatch || 
           arabicSearchMatch(c.full_name, query) || 
           arabicSearchMatch(c.name, query) || 
           arabicSearchMatch(c.phone_number, query) ||
           arabicSearchMatch(c.subscription_package, query);
  }).map(c => {
    const code = c.client_code || c.id || '1';
    const phone = c.phone_number || '';
    const cleanPhone = formatWhatsAppPhone(phone);
    const waPhone = cleanPhone || null;
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
    <div style={{ position: 'relative', width: '240px' }} ref={containerRef}>
      {/* 1 Single Clean Normal Input Box (Zero Double Boxes) */}
      <input
        ref={inputRef}
        type="text"
        className="global-search-input"
        placeholder="بحث..."
        value={query}
        onFocus={() => {
          setIsFocused(true);
          setIsOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
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
        onMouseEnter={(e) => {
          if (!isFocused) {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }
        }}
        onMouseLeave={(e) => {
          if (!isFocused) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#D0D5DD';
          }
        }}
        style={{
          width: '100%',
          height: '34px',
          minHeight: '34px',
          maxHeight: '34px',
          paddingRight: '14px',
          paddingLeft: '34px',
          paddingTop: 0,
          paddingBottom: 0,
          border: '1px solid',
          borderColor: isFocused ? '#673DE6' : '#D0D5DD',
          borderRadius: '9999px',
          backgroundColor: '#FFFFFF',
          fontSize: '12.5px',
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 500,
          color: '#111827',
          textAlign: 'right',
          direction: 'rtl',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(103, 61, 230, 0.12), 0 1px 2px rgba(16, 24, 40, 0.03)' 
            : '0 1px 2px rgba(16, 24, 40, 0.03)',
          transition: 'all 0.15s ease'
        }}
      />

      {/* Embedded Search Icon on Left / Clear Button */}
      {query ? (
        <button 
          type="button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setQuery(''); 
            inputRef.current?.focus(); 
          }}
          aria-label="مسح البحث"
          title="مسح البحث"
          style={{
            position: 'absolute',
            top: '50%',
            left: '11px',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            color: '#98A2B3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.12s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4B5563')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#98A2B3')}
        >
          <X size={15} />
        </button>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '12px',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#667085'
          }}
        >
          <Search size={14} strokeWidth={2.0} color="#667085" />
        </div>
      )}

      {/* Dropdown Results Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '520px',
            maxWidth: '92vw',
            background: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #EAECF0',
            boxShadow: '0 10px 25px -4px rgba(16, 24, 40, 0.12)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px',
            overflow: 'hidden'
          }}
        >
          {/* Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            background: '#FAFAFB',
            borderBottom: '1px solid #EAECF0',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'CLIENTS', label: `المشتركون (${filteredClients.length})` },
              { id: 'PAGES', label: `صفحات النظام (${filteredPages.length})` },
              { id: 'EXERCISES', label: `التمارين (${filteredExercises.length})` },
            ].map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#673DE6' : '#475467',
                    border: isSelected ? '1px solid #E9D7FE' : 'none',
                    boxShadow: isSelected ? '0 1px 2px rgba(16, 24, 40, 0.04)' : 'none',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Results List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px', maxHeight: '380px' }}>
            {allResults.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9999px',
                  background: '#F2F4F7',
                  border: '1px solid #EAECF0',
                  color: '#667085',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto'
                }}>
                  <Search size={18} strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                  لا توجد نتائج مطابقة للبحث
                </div>
                <div style={{ fontSize: '11.5px', color: '#667085' }}>
                  جرّب البحث باسم المشترك، كوده (#101)، أو عنوان الصفحة
                </div>
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
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      background: isSelected ? '#F4F0FD' : '#FFFFFF',
                      border: '1px solid',
                      borderColor: isSelected ? '#E9D7FE' : 'transparent',
                      transition: 'all 0.1s ease',
                      marginBottom: '2px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div 
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '9999px',
                          background: isSelected ? '#FFFFFF' : '#F2F4F7',
                          color: isSelected ? '#673DE6' : '#475467',
                          border: '1px solid',
                          borderColor: isSelected ? '#E9D7FE' : '#EAECF0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={14} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                          {isClient && (
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '9999px',
                              background: item.isMax ? '#F4F0FD' : '#F2F4F7',
                              color: item.isMax ? '#673DE6' : '#344054',
                              border: item.isMax ? '1px solid #E9D7FE' : '1px solid #EAECF0'
                            }}>
                              {item.isMax ? 'MAX' : 'ELITE'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#667085', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Quick Secondary White Action Buttons for Clients */}
                    {isClient ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => { onClose(); navigate(item.path); }}
                          style={{
                            height: '26px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            background: '#FFFFFF',
                            color: '#344054',
                            border: '1px solid #D0D5DD',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                          title="فتح وتعديل الخطة في المحرر"
                        >
                          <FileEdit size={10} color="#667085" />
                          <span>الخطة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewalClient(item.rawClient)}
                          style={{
                            height: '26px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            background: '#FFFFFF',
                            color: '#B54708',
                            border: '1px solid #FEDF89',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFAEB')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                          title="تجديد وتحصيل اشتراك المتدرب"
                        >
                          <CreditCard size={10} color="#B54708" />
                          <span>تجديد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(item.pdfPath, '_blank')}
                          style={{
                            height: '26px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            background: '#FFFFFF',
                            color: '#344054',
                            border: '1px solid #D0D5DD',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                          title="عرض ملف PDF للبرنامج"
                        >
                          <ExternalLink size={10} color="#667085" />
                          <span>PDF</span>
                        </button>

                        {item.waUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(item.waUrl, '_blank')}
                            style={{
                              height: '26px',
                              padding: '0 8px',
                              borderRadius: '9999px',
                              background: '#FFFFFF',
                              color: '#027A48',
                              border: '1px solid #D0D5DD',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#ECFDF3')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                            title="فتح محادثة واتساب"
                          >
                            <MessageCircle size={10} color="#027A48" />
                            <span>واتساب</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10.5px', color: '#667085', fontWeight: 500 }}>
                          {item.category === 'PAGES' ? 'صفحة' : 'تمرين'}
                        </span>
                        <ChevronLeft size={13} color={isSelected ? '#673DE6' : '#98A2B3'} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div style={{
            padding: '8px 12px',
            background: '#FAFAFB',
            borderTop: '1px solid #EAECF0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#667085'
          }}>
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
