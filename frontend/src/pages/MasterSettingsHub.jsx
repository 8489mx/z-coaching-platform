import React, { useState, useEffect } from 'react';
import { Settings, Layers, Video, Crown, Salad, Sliders, Plus, Search, Check, X, Edit3, Trash2, ExternalLink, ShieldCheck, Database, FileText, ChevronUp, ChevronDown, Save, CheckCircle2, Palette, RotateCcw, User, Phone, CreditCard, Globe, MessageSquare, Award, Activity, Droplets, Footprints, Eye, Send, Building2, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditQuestionModal from '../components/modals/EditQuestionModal';
import EditExerciseModal from '../components/modals/EditExerciseModal';
import EditPackageModal from '../components/modals/EditPackageModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import { THEME_PALETTES, getStoredCoachConfig, saveCoachConfig, applyThemeLive, deriveThemeColors } from '../utils/themeAndCoachConfig';

const SECTION_TRANSLATIONS = {
  personal: '1. البيانات الشخصية والأهداف',
  body: '2. القياسات وأسلوب الحياة',
  medical: '3. الحالة الطبية والإصابات',
  nutrition: '4. التغذية والوجبات',
  training: '5. التدريب والكارديو'
};

const TYPE_TRANSLATIONS = {
  text: 'نص قصير',
  textarea: 'نص تفصيلي',
  number: 'رقمي',
  select: 'قائمة اختيارات',
  date: 'تاريخ'
};

const DEFAULT_FOODS = [
  { id: 'CHICKEN_BREAST', name_ar: 'صدور دجاج مشوية', category_ar: 'مصادر بروتين', calories: 165, protein: 31, carbs: 0, fats: 3.6, unit: '100 جرام' },
  { id: 'WHITE_RICE', name_ar: 'أرز أبيض بسمتي مطبوخ', category_ar: 'كاربوهيدرات معقدة', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, unit: '100 جرام' },
  { id: 'WHOLE_EGG', name_ar: 'بيض كامل مسلوق', category_ar: 'بروتين ودهون صحية', calories: 143, protein: 12.6, carbs: 0.7, fats: 9.5, unit: '100 جرام (حبتين)' },
  { id: 'EGG_WHITES', name_ar: 'بياض بيض مسلوق', category_ar: 'بروتين نقي', calories: 52, protein: 11, carbs: 0.7, fats: 0.2, unit: '100 جرام' },
  { id: 'OATS', name_ar: 'شوفان كامل الحبة (جاف)', category_ar: 'كارب معقد وألياف', calories: 389, protein: 16.9, carbs: 66.3, fats: 6.9, unit: '100 جرام' },
  { id: 'COTTAGE_CHEESE', name_ar: 'جبن قريش قليل الدسم', category_ar: 'كازين وبروتين', calories: 98, protein: 12.5, carbs: 3.4, fats: 4.3, unit: '100 جرام' },
  { id: 'OLIVE_OIL', name_ar: 'زيت زيتون بكر ممتاز', category_ar: 'دهون غير مشبعة', calories: 884, protein: 0, carbs: 0, fats: 100, unit: '100 جرام (10 ملاعق)' },
  { id: 'POTATO_BAKED', name_ar: 'بطاطس مسلوقة / مشوية', category_ar: 'كاربوهيدرات عالية الشبع', calories: 87, protein: 1.9, carbs: 20.1, fats: 0.1, unit: '100 جرام' },
  { id: 'TUNA_WATER', name_ar: 'تونة قطع في محلول مائي', category_ar: 'بروتين خالي الدهون', calories: 116, protein: 26, carbs: 0, fats: 1, unit: '100 جرام' },
  { id: 'BANANA', name_ar: 'موز طازج', category_ar: 'فاكهة وبوتاسيوم', calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3, unit: '100 جرام (حبة متوسطة)' }
];

const DEFAULT_PACKAGES = [
  {
    id: "ELITE_3_PLUS_1",
    name_ar: "باقة إيليت",
    name_en: "Elite Package",
    badge_ar: "عرض خاص 3 شهور + 1 مجاناً",
    duration_months: 3,
    free_months: 1,
    total_months: 4,
    price_egp: 2500,
    features: [
      "خطة تغذية ذكية مع توزين الماكروز بالجرام",
      "جدول تمارين تفاعلي بالأوزان ومستوى الجهد RIR",
      "متابعة أسبوعية وتكيف تلقائي للخطة",
      "دعم مستمر وإرسال التنبيهات عبر الواتساب"
    ],
    active: true,
    is_featured: true,
    order: 1
  },
  {
    id: "MAX_3_PLUS_1",
    name_ar: "باقة MAX",
    name_en: "MAX Package",
    badge_ar: "أقصى اهتمام ومتابعة",
    duration_months: 3,
    free_months: 1,
    total_months: 4,
    price_egp: 3500,
    features: [
      "كل مميزات باقة إيليت بالكامل",
      "مراجعة وتدقيق تكنيك التمارين بالفيديو",
      "تعديلات فورية غير محدودة على الوجبات والتمارين",
      "أولوية التواصل المباشر والمكالمات مع الكابتن"
    ],
    active: true,
    is_featured: true,
    order: 2
  }
];

export default function MasterSettingsHub() {
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'intake';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Intake Builder State
  const [questions, setQuestions] = useState([]);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  // Exercise Manager State
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('ALL');
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);

  // Packages State
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  // Foods State
  const [foods, setFoods] = useState(DEFAULT_FOODS);
  const [foodSearch, setFoodSearch] = useState('');

  // Coach Studio & System Theme State
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const [activePalette, setActivePalette] = useState(() => {
    const cfg = getStoredCoachConfig();
    return cfg.primaryColor || '#0F172A';
  });
  const [customColor, setCustomColor] = useState(() => {
    const cfg = getStoredCoachConfig();
    return cfg.primaryColor || '#0F172A';
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Realtime Live Preview Palette Handler
  const handleSelectPalette = (palette) => {
    setActivePalette(palette.primary);
    setCustomColor(palette.primary);
    const updated = {
      ...coachConfig,
      primaryColor: palette.primary,
      hoverColor: palette.hover,
      paletteId: palette.id
    };
    setCoachConfig(updated);
    saveCoachConfig(updated);
  };

  // Realtime Custom Color Picker Handler
  const handleCustomColorChange = (newHex) => {
    setCustomColor(newHex);
    setActivePalette(newHex);
    const derived = deriveThemeColors(newHex);
    const updated = {
      ...coachConfig,
      primaryColor: derived.primary,
      hoverColor: derived.hover,
      paletteId: 'custom'
    };
    setCoachConfig(updated);
    saveCoachConfig(updated);
  };

  const handleResetDefaultTheme = () => {
    const defaultPalette = THEME_PALETTES[0]; // Slate Navy #0F172A
    handleSelectPalette(defaultPalette);
  };

  const handleSaveSystemSettings = (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const saved = saveCoachConfig(coachConfig);
      if (saved) {
        setCoachConfig(saved);
        setSaveSuccessMsg('تم حفظ وتثبيت إعدادات وهوية المنظومة بنجاح!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchIntakeSchema();
    fetchExercises();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages`);
      const data = await res.json();
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages);
      }
    } catch (e) {
      console.error('fetchPackages error:', e);
    }
  };

  const fetchIntakeSchema = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/intake-schema`);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch (e) {
      console.error('fetchIntakeSchema error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/exercises`);
      const data = await res.json();
      if (data.exercises && data.exercises.length > 0) {
        setExercises(data.exercises);
      }
    } catch (e) {
      console.error('fetchExercises error:', e);
    }
  };

  // Question CRUD Handlers
  const handleSaveQuestion = async (qData) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/intake-schema/question/${qData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qData)
      });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      alert('تم حفظ وتحديث السؤال بنجاح');
    } catch (err) {
      alert('خطأ أثناء حفظ السؤال: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQuestionRequired = async (q) => {
    handleSaveQuestion({ ...q, required: !q.required });
  };

  const handleToggleQuestionActive = async (q) => {
    handleSaveQuestion({ ...q, active: !q.active });
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال من الاستمارة؟')) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/intake-schema/question/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      alert('تم حذف السؤال بنجاح');
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveQuestion = (index, direction) => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setQuestions(updated);
  };

  // Exercise CRUD Handlers
  const handleSaveExercise = async (exData) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exData)
      });
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises);
      setExerciseModalOpen(false);
      setEditingExercise(null);
      alert('تم حفظ بيانات ورابط التمرين بنجاح');
    } catch (err) {
      alert('خطأ أثناء حفظ التمرين: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التمرين من المكتبة؟')) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/exercises/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises);
      alert('تم حذف التمرين بنجاح');
    } catch (err) {
      alert('خطأ أثناء حذف التمرين: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Package CRUD Handlers
  const handleSavePackage = async (pkgData) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkgData)
      });
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
      setPackageModalOpen(false);
      setEditingPackage(null);
      alert('تم حفظ بيانات الباقة والأسعار بنجاح');
    } catch (err) {
      alert('خطأ أثناء حفظ الباقة: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
      alert('تم حذف الباقة بنجاح');
    } catch (err) {
      alert('خطأ أثناء حذف الباقة: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePackageActive = async (pkg) => {
    handleSavePackage({ ...pkg, active: !pkg.active });
  };

  const sectionsList = [
    { id: 'ALL', label: 'جميع الأقسام' },
    { id: 'personal', label: '1. البيانات الشخصية والأهداف' },
    { id: 'body', label: '2. القياسات وأسلوب الحياة' },
    { id: 'medical', label: '3. الحالة الطبية والإصابات' },
    { id: 'nutrition', label: '4. التغذية والوجبات' },
    { id: 'training', label: '5. التدريب والكارديو' }
  ];

  const muscleCategories = [
    { id: 'ALL', label: 'جميع العضلات' },
    { id: 'CHEST', label: 'عضلات الصدر' },
    { id: 'BACK', label: 'عضلات الظهر' },
    { id: 'LEGS', label: 'الأرجل والأرداف' },
    { id: 'SHOULDERS', label: 'الأكتاف' },
    { id: 'ARMS', label: 'الذراعين' },
    { id: 'CORE', label: 'البطن والكور' }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchSection = selectedSection === 'ALL' || q.section === selectedSection;
    const matchSearch = !questionSearch.trim() || 
      q.title_ar?.toLowerCase().includes(questionSearch.trim().toLowerCase()) ||
      q.placeholder_ar?.toLowerCase().includes(questionSearch.trim().toLowerCase());
    return matchSection && matchSearch;
  });

  const filteredExercises = exercises.filter(e => {
    const matchMuscle = muscleFilter === 'ALL' || e.muscle_group === muscleFilter;
    const matchSearch = !exerciseSearch.trim() || 
      e.name_ar?.toLowerCase().includes(exerciseSearch.trim().toLowerCase()) ||
      e.name_en?.toLowerCase().includes(exerciseSearch.trim().toLowerCase());
    return matchMuscle && matchSearch;
  });

  const filteredFoods = foods.filter(f => {
    return !foodSearch.trim() || 
      f.name_ar.toLowerCase().includes(foodSearch.trim().toLowerCase()) ||
      f.category_ar.toLowerCase().includes(foodSearch.trim().toLowerCase());
  });

  const statCards = [
    { title: 'أسئلة الاستمارة', value: questions.length, label: `${questions.filter(q => q.required).length} إجباري`, icon: Layers },
    { title: 'تمارين معتمدة', value: exercises.length, label: `${exercises.filter(e => e.video_url || e.video_id).length} بروابط يوتيوب`, icon: Video },
    { title: 'أصناف غذائية وبدائل', value: `${foods.length}+`, label: 'ماكروز دقيقة', icon: Salad },
    { title: 'نظام الحفظ والمزامنة', value: '100%', label: 'Hostinger Ready ', icon: Database },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="لوحة تحكم المنظومة الرئيسية — «داش الداش»"
          description="التحكم المركزي في استمارة الاشتراك، مكتبة التمارين، الباقات وقواعد بيانات النظام."
        />

        {/* 2. 4-Column Balanced KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {statCards.map((st, i) => {
            const Icon = st.icon;
            return (
              <div 
                key={i} 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                    {st.value}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Navigation Tabs Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '10px' }}>
          
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'intake', label: 'محرر استمارة الاشتراك (Intake)', icon: Layers },
              { id: 'exercises', label: 'مكتبة التمارين والفيديو (Exercises)', icon: Video },
              { id: 'packages', label: 'إدارة الباقات والأسعار (Packages)', icon: Crown },
              { id: 'foods', label: 'جدول الأغذية والماكروز (Foods)', icon: Salad },
              { id: 'system', label: 'تخصيص وهوية الكوتش (System & Studio)', icon: Palette },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    border: activeTab === tab.id ? '1px solid var(--color-primary-border, #CBD5E1)' : '1px solid transparent',
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--color-primary-light, #F1F5F9)' : 'transparent',
                    color: activeTab === tab.id ? (coachConfig?.primaryColor || 'var(--primary, #0F172A)') : '#475569',
                    boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0, 0, 0, 0.03)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* New Item Action Button */}
          {activeTab === 'intake' && (
            <button
              type="button"
              onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}
              style={{ padding: '6px 14px', borderRadius: '6px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} />
              <span>إضافة سؤال جديد</span>
            </button>
          )}

          {activeTab === 'exercises' && (
            <button
              type="button"
              onClick={() => { setEditingExercise(null); setExerciseModalOpen(true); }}
              style={{ padding: '6px 14px', borderRadius: '6px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} />
              <span>إضافة تمرين جديد</span>
            </button>
          )}

          {activeTab === 'packages' && (
            <button
              type="button"
              onClick={() => { setEditingPackage(null); setPackageModalOpen(true); }}
              style={{ padding: '6px 14px', borderRadius: '6px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} />
              <span>إضافة باقة جديدة</span>
            </button>
          )}
        </div>

        {/* ================= TAB 1: INTAKE BUILDER ================= */}
        {activeTab === 'intake' && (
          <FormSection
            title="محرر أسئلة استمارة الاشتراك"
            description="التحكم في الأسئلة، الأقسام، الحقول الإلزامية والاختيارية، وإعادة الترتيب."
            actions={(
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0 8px', height: '32px', width: '180px', gap: '6px' }}>
                  <Search size={13} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="ابحث في الأسئلة..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '11px', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '2px', background: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
                  {sectionsList.map(sec => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSection(sec.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedSection === sec.id ? '#0F172A' : 'transparent',
                        color: selectedSection === sec.id ? '#FFFFFF' : '#64748B',
                        transition: 'background 0.12s ease, color 0.12s ease'
                      }}
                    >
                      {sec.label.split('.')[1] || sec.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          >
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '8px 12px', width: '70px' }}>الترتيب</th>
                    <th style={{ padding: '8px 12px' }}>نص السؤال</th>
                    <th style={{ padding: '8px 12px' }}>القسم</th>
                    <th style={{ padding: '8px 12px' }}>نوع الحقل</th>
                    <th style={{ padding: '8px 12px' }}>الإلزامية والتفعيل</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q, idx) => (
                    <tr key={q.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '11px', color: '#64748B' }}>#{idx + 1}</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button type="button" onClick={() => handleMoveQuestion(idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}><ChevronUp size={12} /></button>
                            <button type="button" onClick={() => handleMoveQuestion(idx, 'down')} disabled={idx === questions.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}><ChevronDown size={12} /></button>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <strong style={{ color: '#0F172A', fontSize: '12.5px', display: 'block' }}>{q.title_ar}</strong>
                        <small style={{ color: '#94A3B8', fontSize: '10.5px' }}>ID: {q.id} {q.placeholder_ar ? `(${q.placeholder_ar})` : ''}</small>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                          {SECTION_TRANSLATIONS[q.section] || q.section}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '1px 7px', borderRadius: '4px', fontSize: '10.5px' }}>
                          {TYPE_TRANSLATIONS[q.type] || q.type}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionRequired(q)}
                            style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', background: q.required ? '#FEE2E2' : '#F1F5F9', color: q.required ? '#DC2626' : '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {q.required ? 'إجباري *' : 'اختياري'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionActive(q)}
                            style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', background: q.active ? '#DCFCE7' : '#F1F5F9', color: q.active ? '#16A34A' : '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {q.active ? 'مفعّل' : 'مخفي'}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button type="button" onClick={() => { setEditingQuestion(q); setQuestionModalOpen(true); }} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ================= TAB 2: EXERCISES & VIDEOS ================= */}
        {activeTab === 'exercises' && (
          <FormSection
            title="مكتبة التمارين وروابط الفيديو"
            description="إدارة التمارين وروابط شروحات اليوتيوب المعتمدة."
          >
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '8px 12px' }}>التمرين</th>
                    <th style={{ padding: '8px 12px' }}>العضلة</th>
                    <th style={{ padding: '8px 12px' }}>الأداة</th>
                    <th style={{ padding: '8px 12px' }}>فيديو التكنيك</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExercises.map((ex, idx) => (
                    <tr key={ex.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{ex.name_ar}</strong>
                        <small style={{ color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>{ex.name_en}</small>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                          {ex.muscle_ar || ex.muscle_group}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>
                        {ex.equipment_ar || ex.equipment}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {(ex.video_url || ex.video_id) ? (
                          <a
                            href={ex.video_url || `https://www.youtube.com/watch?v=${ex.video_id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}
                          >
                            <Video size={12} />
                            <span>معاينة الفيديو</span>
                          </a>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '11px' }}>لا يوجد رابط</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button type="button" onClick={() => { setEditingExercise(ex); setExerciseModalOpen(true); }} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button type="button" onClick={() => handleDeleteExercise(ex.id)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ================= TAB 3: PACKAGES ================= */}
        {activeTab === 'packages' && (
          <FormSection
            title="باقات الاشتراك والأسعار المعتمدة"
            description="إدارة الباقات والعروض والشهور المجانية والمميزات."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '6px' }}>
              {packages.map((pkg) => (
                <div key={pkg.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800 }}>{pkg.badge_ar}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <strong style={{ fontSize: '18px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{pkg.price_egp}</strong>
                        <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{pkg.name_ar}</h4>
                    <small style={{ color: '#64748B', fontSize: '11px' }}>المدة: {pkg.total_months} شهور ({pkg.duration_months} + {pkg.free_months} مجاناً)</small>
                    
                    <ul style={{ margin: '10px 0 0 0', padding: '0 16px', fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                      {(pkg.features || []).map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: pkg.active ? '#16A34A' : '#94A3B8', cursor: 'pointer' }}>
                      <input type="checkbox" checked={pkg.active} onChange={() => handleTogglePackageActive(pkg)} />
                      <span>{pkg.active ? 'باقة نشطة' : 'معطلة'}</span>
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => { setEditingPackage(pkg); setPackageModalOpen(true); }} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>تعديل</button>
                      <button type="button" onClick={() => handleDeletePackage(pkg.id)} style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* ================= TAB 4: FOODS ================= */}
        {activeTab === 'foods' && (
          <FormSection
            title="جدول الأغذية وقاعدة بيانات الماكروز"
            description="القيم الغذائية المعتمدة للأطعمة وبدائل التغذية."
          >
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '8px 12px' }}>الصنف الغذائي</th>
                    <th style={{ padding: '8px 12px' }}>التصنيف</th>
                    <th style={{ padding: '8px 12px' }}>السعرات</th>
                    <th style={{ padding: '8px 12px' }}>بروتين (g)</th>
                    <th style={{ padding: '8px 12px' }}>كارب (g)</th>
                    <th style={{ padding: '8px 12px' }}>دهون (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoods.map((f, idx) => (
                    <tr key={f.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{f.name_ar}</strong>
                        <small style={{ color: '#94A3B8' }}>{f.unit}</small>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 7px', borderRadius: '4px', fontSize: '10.5px' }}>
                          {f.category_ar}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{f.calories} kcal</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{f.protein}g</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono, Cairo' }}>{f.carbs}g</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#16A34A', fontFamily: 'JetBrains Mono, Cairo' }}>{f.fats}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ================= TAB 5: COACH STUDIO & SYSTEM CUSTOMIZATION ================= */}
        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Feedback Alert if saved */}
            {saveSuccessMsg && (
              <div 
                style={{ 
                  background: '#F8FAFC', border: '1px solid #E2E8F0', 
                  padding: '10px 16px', 
                  borderRadius: '8px', 
                  color: '#166534', 
                  fontWeight: 700, 
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(22, 101, 52, 0.08)'
                }}
              >
                <CheckCircle2 size={16} color="#16A34A" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* 1. Theme Color Studio (Live Instant Preview) */}
            <FormSection
              title="تخصيص هوية وألوان الواجهة (Realtime Brand Theme)"
              description="اختر لون الهوية الرسمي لمنظومتك. سيتم تطبيق التغييرات ومعاينتها فوراً على أزرار وشارات النظام بالكامل."
              actions={(
                <button
                  type="button"
                  onClick={handleResetDefaultTheme}
                  style={{
                    height: '30px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="استعادة الكحلي المائل للرمادي"
                >
                  <RotateCcw size={12} />
                  <span>استعادة الافتراضي (Slate Navy)</span>
                </button>
              )}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start', marginTop: '6px' }}>
                
                {/* Right: Palettes Grid + Custom Hex */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Curated Palettes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      بالتات ألوان منتقاة بعناية (Curated Palettes):
                    </label>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {THEME_PALETTES.map((pal) => {
                        const isSelected = activePalette.toLowerCase() === pal.primary.toLowerCase();
                        return (
                          <div
                            key={pal.id}
                            onClick={() => handleSelectPalette(pal)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: isSelected ? `2px solid ${pal.primary}` : '1px solid #E2E8F0',
                              background: isSelected ? pal.light : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? `0 2px 8px ${pal.primary}25` : '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {/* Swatch Circle */}
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: pal.primary,
                                  border: '2px solid #FFFFFF',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                                  flexShrink: 0
                                }}
                              />
                              <div>
                                <strong style={{ display: 'block', fontSize: '11.5px', color: '#0F172A', fontWeight: 800 }}>
                                  {pal.name}
                                </strong>
                                <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>
                                  {pal.description}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: pal.primary,
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Color Wheel & Hex */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      أو تخصيص لون حر مباشر (Custom Hex Picker):
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', flexShrink: 0 }}>
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            width: '54px',
                            height: '54px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          placeholder="#0F172A"
                          style={{
                            width: '100%',
                            height: '34px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            padding: '0 10px',
                            fontSize: '12px',
                            fontFamily: 'JetBrains Mono, Cairo',
                            fontWeight: 700,
                            outline: 'none',
                            textTransform: 'uppercase',
                            background: '#FFFFFF',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        <span>يعمل فوراً في المعاينة</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Left: Interactive Realtime UI Preview Widget */}
                <div 
                  style={{ 
                    background: '#FFFFFF', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '10px', 
                    padding: '16px',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={15} color={coachConfig.primaryColor || '#0F172A'} />
                      <strong style={{ fontSize: '12px', color: '#0F172A' }}>المعاينة الحية الفورية (Live UI Preview)</strong>
                    </div>
                    <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      مباشر الآن
                    </span>
                  </div>

                  {/* Sample Action Button */}
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '6px' }}>1. أزرار الإجراءات والقرارات:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Soft Style Button */}
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          height: '36px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: deriveThemeColors(coachConfig.primaryColor).light,
                          border: `1px solid ${deriveThemeColors(coachConfig.primaryColor).border}`,
                          color: coachConfig.primaryColor || '#0F172A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>توليد الخطة</span>
                      </button>

                      {/* Primary Solid Button */}
                      <button
                        type="button"
                        className="btn-primary"
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: coachConfig.primaryColor || '#0F172A',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'geometricPrecision',
                          transform: 'translateZ(0)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)', letterSpacing: '0.3px' }}>
                          اعتماد الخطة وإرسالها للمشترك
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Sample Filter Tab & Badge */}
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>2. التبويبات والشارات النشطة:</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: coachConfig.primaryColor || '#0F172A',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'geometricPrecision',
                          transform: 'translateZ(0)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)' }}>نشط (Active)</span>
                      </span>

                      <span
                        style={{
                          background: deriveThemeColors(coachConfig.primaryColor).light,
                          border: `1px solid ${deriveThemeColors(coachConfig.primaryColor).border}`,
                          color: coachConfig.primaryColor || '#0F172A',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}
                      >
                        باقة MAX
                      </span>
                    </div>
                  </div>

                  {/* Sample Coach Signature Badge */}
                  <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '10px 12px' }}>
                    <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>معاينة تذييل التقارير للعميل:</span>
                    <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
                      {coachConfig.signatureText || 'معاً نحو نسختك الأقوى • كابتن Karim Zakaria'}
                    </strong>
                    <small style={{ fontSize: '10.5px', color: coachConfig.primaryColor || '#0F172A', fontWeight: 700 }}>
                      {coachConfig.brandTitle || 'Z COACHING'} • {coachConfig.coachTitle || 'أخصائي تغذية رياضية'}
                    </small>
                  </div>

                </div>

              </div>
            </FormSection>

            {/* 2. Coach Personal & Client-Facing Profile */}
            <FormSection
              title="الملف التعريفي للكوتش وتفاصيل التواصل للعملاء"
              description="هذه البيانات تظهر لمتدربيك في رسائل الواتساب، شاشة الترحيب، تذييل الجداول، وبيانات استقبال التحويلات."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '6px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    اسم الكوتش الرسمي (يظهر في الهيدر والتقارير) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.coachName}
                      onChange={(e) => setCoachConfig({ ...coachConfig, coachName: e.target.value })}
                      placeholder="مثال: كريم زكريا / Karim Zakaria"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <User size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    المسمى المهني والتخصص والشهادات *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.coachTitle}
                      onChange={(e) => setCoachConfig({ ...coachConfig, coachTitle: e.target.value })}
                      placeholder="مثال: أخصائي تغذية رياضية وإعداد بدني معتمد ISSA"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Award size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    اسم المنصة / البراند التجاري *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.brandTitle}
                      onChange={(e) => setCoachConfig({ ...coachConfig, brandTitle: e.target.value })}
                      placeholder="مثال: Z COACHING"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Building2 size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    رقم الواتساب الرسمي المباشر للدعم والتنبيهات *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.whatsappNumber}
                      onChange={(e) => setCoachConfig({ ...coachConfig, whatsappNumber: e.target.value })}
                      placeholder="2010XXXXXXXX"
                      dir="ltr"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
                    />
                    <Phone size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    معرف إنستاباي للدفع السريع (InstaPay Address) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.instapayAddress}
                      onChange={(e) => setCoachConfig({ ...coachConfig, instapayAddress: e.target.value })}
                      placeholder="مثال: coach@instapay أو رقم الهاتف"
                      dir="ltr"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
                    />
                    <CreditCard size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    رابط إنستغرام أو صفحة السوشيال ميديا
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={coachConfig.instagramUrl}
                      onChange={(e) => setCoachConfig({ ...coachConfig, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/yourhandle"
                      dir="ltr"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
                    />
                    <Globe size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    بيانات الحساب البنكي أو المحافظ الذكية (تظهر للمشترك عند خطوة تأكيد الدفع)
                  </label>
                  <input
                    type="text"
                    value={coachConfig.bankDetails}
                    onChange={(e) => setCoachConfig({ ...coachConfig, bankDetails: e.target.value })}
                    placeholder="مثال: بنك CIB - حساب: 1000XXXXXXXXXX | محفظة فودافون كاش: 010XXXXXXXX"
                    style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    رسالة الترحيب والتوجيه الافتراضية للمتدرب الجديد
                  </label>
                  <textarea
                    value={coachConfig.welcomeMessage}
                    onChange={(e) => setCoachConfig({ ...coachConfig, welcomeMessage: e.target.value })}
                    rows={2}
                    placeholder="اكتب الترحيب الذي يظهر للمشترك عند فتح حسابه..."
                    style={{ width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    توقيع الاعتماد والشعار النصي في أسفل الخطط والتقارير
                  </label>
                  <input
                    type="text"
                    value={coachConfig.signatureText}
                    onChange={(e) => setCoachConfig({ ...coachConfig, signatureText: e.target.value })}
                    placeholder="مثال: معاً نحو نسختك الأقوى • كابتن كريم زكريا"
                    style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

              </div>
            </FormSection>

            {/* 3. System Defaults */}
            <FormSection
              title="المعايير والخيارات الافتراضية للخطط"
              description="القيم المبدئية التي تُقترح تلقائياً للخطوات والماء ومستوى الشدة (RIR) عند إنشاء خطط المتدربين."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '6px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    هدف الخطوات اليومي الافتراضي
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={coachConfig.defaultDailySteps}
                      onChange={(e) => setCoachConfig({ ...coachConfig, defaultDailySteps: Number(e.target.value) })}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Footprints size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    شرب الماء اليومي الافتراضي (لتر)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={coachConfig.defaultWaterLiters}
                      onChange={(e) => setCoachConfig({ ...coachConfig, defaultWaterLiters: Number(e.target.value) })}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Droplets size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                    مستوى الجهد المتبقي الافتراضي (RIR)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={coachConfig.defaultRIR}
                      onChange={(e) => setCoachConfig({ ...coachConfig, defaultRIR: Number(e.target.value) })}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Activity size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '11px' }} />
                  </div>
                </div>

              </div>
            </FormSection>

            {/* 4. Action Save Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px 18px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
              <button
                type="button"
                onClick={handleResetDefaultTheme}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إلغاء التغييرات
              </button>

              <button
                type="button"
                onClick={handleSaveSystemSettings}
                disabled={saving}
                className="btn-primary"
                style={{
                  height: '40px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: saveSuccessMsg ? '#059669' : undefined,
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري التثبيت...</span>
                  </>
                ) : saveSuccessMsg ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تم الحفظ والتطبيق بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>حفظ إعدادات وتخصيصات الكوتش</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ================= FLOATING TOAST NOTIFICATION BANNER ================= */}
        {saveSuccessMsg && (
          <div 
            style={{ 
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '50px',
              fontSize: '13.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              fontFamily: 'Cairo, Tajawal, sans-serif'
            }}
          >
            <div 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#10B981', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFFFFF', 
                flexShrink: 0 
              }}
            >
              <Check size={15} strokeWidth={3} />
            </div>
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Modals */}
        {questionModalOpen && (
          <EditQuestionModal
            isOpen={questionModalOpen}
            onClose={() => { setQuestionModalOpen(false); setEditingQuestion(null); }}
            question={editingQuestion}
            onSave={handleSaveQuestion}
            loading={saving}
          />
        )}

        {exerciseModalOpen && (
          <EditExerciseModal
            isOpen={exerciseModalOpen}
            onClose={() => { setExerciseModalOpen(false); setEditingExercise(null); }}
            exercise={editingExercise}
            onSave={handleSaveExercise}
            loading={saving}
          />
        )}

        {packageModalOpen && (
          <EditPackageModal
            isOpen={packageModalOpen}
            onClose={() => { setPackageModalOpen(false); setEditingPackage(null); }}
            packageData={editingPackage}
            onSave={handleSavePackage}
            saving={saving}
          />
        )}

      </div>
    </AdminLayout>
  );
}
