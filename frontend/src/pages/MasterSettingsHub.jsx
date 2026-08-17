import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditQuestionModal from '../components/modals/EditQuestionModal';
import EditExerciseModal from '../components/modals/EditExerciseModal';
import EditPackageModal from '../components/modals/EditPackageModal';

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

// Default Foods Catalog for Food Manager Tab
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
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  // Foods State
  const [foods, setFoods] = useState(DEFAULT_FOODS);
  const [foodSearch, setFoodSearch] = useState('');

  // General Settings State
  const [systemConfig, setSystemConfig] = useState({
    coachName: 'كابتن كيمو المحروقي',
    platformTitle: 'Z COACHING MASTER PLATFORM',
    defaultDailySteps: 8000,
    defaultWaterLiters: 3.5,
    defaultRIR: 3,
    smartAdaptationEnabled: true
  });

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

  // Move Question Up / Down
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

  return (
    <AdminLayout>
      <div className="theme-body py-2" dir="rtl" style={{ fontFamily: 'Cairo, Tajawal, system-ui, sans-serif' }}>
        <div className="container-fluid">
          
          {/* Top Page Header (Quiet Luxury) */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '38px', height: '38px', background: '#f5f3ff', color: '#261c6a', border: '1.5px solid #ddd6fe' }}>
                  <i className="ti ti-settings-cog fs-5"></i>
                </div>
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.3px', fontSize: '1.3rem' }}>
                  لوحة تحكم المنظومة الرئيسية — «داش الداش»
                </h4>
                <span className="badge rounded-pill fw-bold" style={{ background: '#261c6a', color: '#ffffff', fontSize: '0.68rem', padding: '5px 10px' }}>
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: '0.82rem' }}>
                التحكم المركزي في استمارة الاشتراك، مكتبة التمارين وروابط الفيديو، وقواعد بيانات المنظومة
              </p>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <span className="badge rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.78rem' }}>
                <i className="ti ti-circle-check fs-6"></i>
                <span>جاهز للاستضافة (Hostinger Ready) ✓</span>
              </span>
            </div>
          </div>

          {/* Top 4 KPI Summary Cards (Identical to Dashboard Executive KPIs) */}
          <div className="row g-3 mb-4">
            
            {/* Card 1: Intake Questions */}
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f5f3ff', color: '#261c6a' }}
                    >
                      <i className="ti ti-forms fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#f8fafc', color: '#261c6a', fontSize: '0.68rem', border: '1px solid #ddd6fe' }}>
                      استمارة نشطة
                    </span>
                  </div>

                  <div>
                    <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      {questions.length}
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>إجمالي أسئلة الاستمارة</p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {questions.filter(q => q.required).length} إجباري | {questions.filter(q => !q.required).length} اختياري
                    </small>
                    <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                      <defs>
                        <linearGradient id="kpiGrad1" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#261c6a" />
                        </linearGradient>
                      </defs>
                      <path d="M1 14C10 14 16 4 24 7C32 10 40 2 50 3C56 5 58 2 59 1" stroke="url(#kpiGrad1)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Exercise Library */}
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', color: '#0284c7' }}
                    >
                      <i className="ti ti-barbell fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#eff6ff', color: '#0284c7', fontSize: '0.68rem', border: '1px solid #bfdbfe' }}>
                      فيديوهات تكنيك
                    </span>
                  </div>

                  <div>
                    <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      {exercises.length}
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>تمارين معتمدة بالمكتبة</p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {exercises.filter(e => e.video_url || e.video_id).length} مزود بروابط يوتيوب
                    </small>
                    <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                      <defs>
                        <linearGradient id="kpiGrad2" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>
                      <path d="M1 5C12 12 18 3 28 8C38 13 48 5 59 11" stroke="url(#kpiGrad2)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Food Database */}
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fefce8', color: '#d97706' }}
                    >
                      <i className="ti ti-salad fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#fefce8', color: '#d97706', fontSize: '0.68rem', border: '1px solid #fef08a' }}>
                      ماكروز دقيقة
                    </span>
                  </div>

                  <div>
                    <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      {foods.length}+
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>أصناف غذائية وبدائل</p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>حساب سعرات فوري</small>
                    <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                      <defs>
                        <linearGradient id="kpiGrad3" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                      <path d="M1 12C12 6 22 14 32 9C42 4 50 10 59 3" stroke="url(#kpiGrad3)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Hostinger Storage & Sync */}
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card border-0 bg-white h-100 shadow-sm" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}
                    >
                      <i className="ti ti-database-check fs-6"></i>
                    </div>
                    <span className="badge rounded-pill fw-semibold px-2 py-1" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.68rem', border: '1px solid #a7f3d0' }}>
                      Hostinger Ready
                    </span>
                  </div>

                  <div>
                    <h3 className="fw-bold text-success mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
                      100%
                    </h3>
                    <p className="text-muted small mb-0 fw-medium" style={{ fontSize: '0.78rem' }}>نظام الحفظ والمزامنة</p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light">
                    <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>data/settings/</small>
                    <svg width="48" height="14" viewBox="0 0 60 18" fill="none">
                      <defs>
                        <linearGradient id="kpiGrad4" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <path d="M1 14C10 8 20 12 30 5C40 2 50 7 59 1" stroke="url(#kpiGrad4)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Master Navigation Tabs */}
          <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <div className="card-header bg-white border-bottom p-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('intake')}
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'intake' ? 'text-white shadow-xs' : 'bg-light text-dark'}`}
                  style={{
                    background: activeTab === 'intake' ? '#261c6a' : undefined,
                    height: '38px',
                    fontSize: '0.84rem'
                  }}
                >
                  <i className="ti ti-forms me-1"></i> محرر استمارة الاشتراك (Intake Builder)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('exercises')}
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'exercises' ? 'text-white shadow-xs' : 'bg-light text-dark'}`}
                  style={{
                    background: activeTab === 'exercises' ? '#261c6a' : undefined,
                    height: '38px',
                    fontSize: '0.84rem'
                  }}
                >
                  <i className="ti ti-video me-1"></i> مكتبة التمارين وروابط الفيديو (Exercise Manager)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'packages' ? 'text-white shadow-xs' : 'bg-light text-dark'}`}
                  style={{
                    background: activeTab === 'packages' ? '#261c6a' : undefined,
                    height: '38px',
                    fontSize: '0.84rem'
                  }}
                >
                  <i className="ti ti-crown me-1"></i> إدارة الباقات والأسعار (Packages & Pricing)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('foods')}
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'foods' ? 'text-white shadow-xs' : 'bg-light text-dark'}`}
                  style={{
                    background: activeTab === 'foods' ? '#261c6a' : undefined,
                    height: '38px',
                    fontSize: '0.84rem'
                  }}
                >
                  <i className="ti ti-salad me-1"></i> جدول الأغذية والماكروز (Food Database)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`btn btn-sm rounded-pill px-4 fw-bold transition-all ${activeTab === 'system' ? 'text-white shadow-xs' : 'bg-light text-dark'}`}
                  style={{
                    background: activeTab === 'system' ? '#261c6a' : undefined,
                    height: '38px',
                    fontSize: '0.84rem'
                  }}
                >
                  <i className="ti ti-adjustments me-1"></i> إعدادات المنظومة العامة (System Defaults)
                </button>
              </div>

              {activeTab === 'intake' && (
                <button
                  type="button"
                  onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}
                  className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow-sm d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', height: '38px', fontSize: '0.82rem', border: 'none' }}
                >
                  <i className="ti ti-plus fs-6"></i>
                  <span>إضافة سؤال جديد للاستمارة</span>
                </button>
              )}

              {activeTab === 'exercises' && (
                <button
                  type="button"
                  onClick={() => { setEditingExercise(null); setExerciseModalOpen(true); }}
                  className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow-sm d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', height: '38px', fontSize: '0.82rem', border: 'none' }}
                >
                  <i className="ti ti-plus fs-6"></i>
                  <span>إضافة تمرين جديد للمكتبة</span>
                </button>
              )}

              {activeTab === 'packages' && (
                <button
                  type="button"
                  onClick={() => { setEditingPackage(null); setPackageModalOpen(true); }}
                  className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow-sm d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', height: '38px', fontSize: '0.82rem', border: 'none' }}
                >
                  <i className="ti ti-plus fs-6"></i>
                  <span>إضافة باقة اشتراك جديدة</span>
                </button>
              )}
            </div>

            {/* ================= TAB 1: INTAKE BUILDER ================= */}
            {activeTab === 'intake' && (
              <div className="card-body p-4">
                
                {/* Search & Section Filter */}
                <div className="row g-2 mb-3 align-items-center">
                  <div className="col-md-4 col-12">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#e2e8f0' }}>
                        <i className="ti ti-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 text-end"
                        style={{ borderColor: '#e2e8f0', fontSize: '0.84rem', height: '40px' }}
                        placeholder="ابحث في نصوص الأسئلة..."
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-8 col-12">
                    <div className="d-flex gap-1 flex-wrap">
                      {sectionsList.map(sec => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setSelectedSection(sec.id)}
                          className={`btn btn-sm rounded-pill px-3 fw-semibold transition-all ${selectedSection === sec.id ? 'text-white shadow-xs' : 'bg-white text-dark border'}`}
                          style={{
                            background: selectedSection === sec.id ? '#261c6a' : '#ffffff',
                            fontSize: '0.78rem',
                            height: '36px'
                          }}
                        >
                          {sec.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Questions Table Container */}
                <div className="border rounded-3 overflow-hidden bg-white shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                      <thead className="table-light">
                        <tr className="text-muted" style={{ fontSize: '0.76rem', borderBottom: '1.5px solid #e2e8f0' }}>
                          <th className="py-3 px-3" style={{ width: '5%' }}>الترتيب</th>
                          <th className="py-3 px-3" style={{ width: '38%' }}>نص السؤال</th>
                          <th className="py-3 text-center" style={{ width: '18%' }}>القسم في الاستمارة</th>
                          <th className="py-3 text-center" style={{ width: '14%' }}>نوع الحقل</th>
                          <th className="py-3 text-center" style={{ width: '15%' }}>الإلزامية والتفعيل</th>
                          <th className="py-3 text-center" style={{ width: '10%' }}>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map((q, idx) => (
                          <tr key={q.id || idx} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                            {/* Order & Move buttons */}
                            <td className="px-3">
                              <div className="d-flex align-items-center gap-1">
                                <span className="fw-bold text-muted" style={{ fontSize: '0.76rem' }}>#{idx + 1}</span>
                                <div className="d-flex flex-column">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(idx, 'up')}
                                    disabled={idx === 0}
                                    className="btn btn-sm p-0 text-muted border-0 lh-1"
                                    title="تحريك لأعلى"
                                  >
                                    <i className="ti ti-chevron-up" style={{ fontSize: '0.7rem' }}></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(idx, 'down')}
                                    disabled={idx === questions.length - 1}
                                    className="btn btn-sm p-0 text-muted border-0 lh-1"
                                    title="تحريك لأسفل"
                                  >
                                    <i className="ti ti-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Question Title */}
                            <td className="px-3">
                              <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.86rem' }}>
                                {q.title_ar}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '0.68rem' }}>
                                  ID: {q.id}
                                </span>
                                {q.placeholder_ar && (
                                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>({q.placeholder_ar})</small>
                                )}
                              </div>
                            </td>

                            {/* Section */}
                            <td className="text-center">
                              <span className="badge rounded-pill px-3 py-1 fw-semibold" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
                                {SECTION_TRANSLATIONS[q.section] || q.section}
                              </span>
                            </td>

                            {/* Type */}
                            <td className="text-center">
                              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.74rem' }}>
                                {TYPE_TRANSLATIONS[q.type] || q.type}
                              </span>
                            </td>

                            {/* Required & Active Toggles */}
                            <td className="text-center">
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuestionRequired(q)}
                                  className={`badge rounded-pill px-2 py-1 transition-all border ${q.required ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-light text-muted'}`}
                                  style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                  title="اضغط للتبديل بين إجباري واختياري"
                                >
                                  {q.required ? 'إجباري *' : 'اختياري'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleQuestionActive(q)}
                                  className={`badge rounded-pill px-2 py-1 transition-all border ${q.active ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}
                                  style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                                  title="اضغط للإخفاء أو التفعيل"
                                >
                                  {q.active ? 'مفعّل' : 'مخفي'}
                                </button>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="text-center">
                              <div className="d-flex justify-content-center align-items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setEditingQuestion(q); setQuestionModalOpen(true); }}
                                  className="btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                                  style={{ width: '32px', height: '32px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                                  title="تعديل نص وخيارات السؤال"
                                >
                                  <i className="ti ti-edit fs-6"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-danger"
                                  style={{ width: '32px', height: '32px', background: '#fff1f2', border: '1px solid #fecdd3' }}
                                  title="حذف السؤال"
                                >
                                  <i className="ti ti-trash fs-6"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 2: EXERCISES & VIDEOS ================= */}
            {activeTab === 'exercises' && (
              <div className="card-body p-4">
                
                {/* Search & Muscle Filters */}
                <div className="row g-2 mb-3 align-items-center">
                  <div className="col-md-5 col-12">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#e2e8f0' }}>
                        <i className="ti ti-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 text-end"
                        style={{ borderColor: '#e2e8f0', fontSize: '0.84rem', height: '40px' }}
                        placeholder="ابحث باسم التمرين بالعربي أو الإنجليزي..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-7 col-12">
                    <div className="d-flex gap-1 flex-wrap">
                      {muscleCategories.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMuscleFilter(m.id)}
                          className={`btn btn-sm rounded-pill px-3 fw-semibold transition-all ${muscleFilter === m.id ? 'text-white shadow-xs' : 'bg-white text-dark border'}`}
                          style={{
                            background: muscleFilter === m.id ? '#261c6a' : '#ffffff',
                            fontSize: '0.78rem',
                            height: '36px'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exercises Table Container */}
                <div className="border rounded-3 overflow-hidden bg-white shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                      <thead className="table-light">
                        <tr className="text-muted" style={{ fontSize: '0.76rem', borderBottom: '1.5px solid #e2e8f0' }}>
                          <th className="py-3 px-3" style={{ width: '32%' }}>التمرين</th>
                          <th className="py-3 text-center" style={{ width: '16%' }}>العضلة المستهدفة</th>
                          <th className="py-3 text-center" style={{ width: '16%' }}>الأداة المستخدمة</th>
                          <th className="py-3 text-center" style={{ width: '24%' }}>فيديو التكنيك (يوتيوب)</th>
                          <th className="py-3 text-center" style={{ width: '12%' }}>الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExercises.map((ex, idx) => (
                          <tr key={ex.id || idx} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                            <td className="px-3">
                              <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.86rem' }}>
                                {ex.name_ar}
                              </div>
                              <small className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                {ex.name_en || ex.id}
                              </small>
                            </td>
                            <td className="text-center">
                              <span className="badge rounded-pill px-3 py-1" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
                                {ex.muscle_ar || ex.muscle_group}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.74rem' }}>
                                {ex.equipment_ar || ex.equipment}
                              </span>
                            </td>
                            <td className="text-center">
                              {(ex.video_url || ex.video_id) ? (
                                <a
                                  href={ex.video_url || `https://www.youtube.com/watch?v=${ex.video_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm rounded-pill px-3 fw-semibold text-danger d-inline-flex align-items-center gap-1 border"
                                  style={{ background: '#fff1f2', borderColor: '#fecdd3', fontSize: '0.76rem', height: '30px' }}
                                >
                                  <i className="ti ti-brand-youtube fs-6"></i>
                                  <span>معاينة فيديو التكنيك</span>
                                </a>
                              ) : (
                                <span className="text-muted small" style={{ fontSize: '0.74rem' }}>لا يوجد رابط</span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center align-items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setEditingExercise(ex); setExerciseModalOpen(true); }}
                                  className="btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                                  style={{ width: '32px', height: '32px', background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe' }}
                                  title="تعديل بيانات ورابط التمرين"
                                >
                                  <i className="ti ti-edit fs-6"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExercise(ex.id)}
                                  className="btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-danger"
                                  style={{ width: '32px', height: '32px', background: '#fff1f2', border: '1px solid #fecdd3' }}
                                  title="حذف التمرين"
                                >
                                  <i className="ti ti-trash fs-6"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB: PACKAGES & PRICING MANAGER ================= */}
            {activeTab === 'packages' && (
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
                  <div>
                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>
                      باقات الاشتراك والأسعار المعتمدة
                    </h5>
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                      تعديل وإضافة باقات المشتركين، الأسعار، العروض والشهور المجانية، والمميزات
                    </small>
                  </div>

                  <span className="badge rounded-pill fw-semibold px-3 py-2" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.8rem' }}>
                    {packages.length} باقات مسجلة
                  </span>
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-5 text-muted small bg-light rounded-4 border">
                    لا توجد باقات اشتراك مسجلة حالياً. انقر على «إضافة باقة اشتراك جديدة» لإضافة باقة.
                  </div>
                ) : (
                  <div className="row g-3">
                    {packages.map((pkg) => {
                      const totalMonths = (pkg.duration_months || 0) + (pkg.free_months || 0);

                      return (
                        <div key={pkg.id} className="col-xl-3 col-lg-4 col-md-6 col-12">
                          <div 
                            className="card h-100 shadow-sm border position-relative d-flex flex-column justify-content-between transition-all"
                            style={{ 
                              borderRadius: '18px',
                              borderColor: pkg.is_featured ? '#261c6a' : '#e2e8f0',
                              borderWidth: pkg.is_featured ? '2px' : '1px',
                              background: pkg.active ? '#ffffff' : '#f8fafc',
                              opacity: pkg.active ? 1 : 0.75,
                              boxShadow: pkg.is_featured ? '0 10px 25px rgba(38,28,106,0.08)' : '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                          >
                            {/* Card Top */}
                            <div className="p-4 pb-2">
                              {/* Header & Badges */}
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div 
                                  className="rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    background: pkg.is_featured ? '#f5f3ff' : '#f8fafc', 
                                    color: pkg.is_featured ? '#261c6a' : '#64748b',
                                    border: '1px solid #e2e8f0'
                                  }}
                                >
                                  <i className={`ti ${pkg.is_featured ? 'ti-crown' : 'ti-award'} fs-5`}></i>
                                </div>

                                <div className="d-flex align-items-center gap-1">
                                  {pkg.badge_ar && (
                                    <span 
                                      className="badge rounded-pill fw-bold px-2 py-1"
                                      style={{ 
                                        background: pkg.is_featured ? '#ecfdf5' : '#f1f5f9', 
                                        color: pkg.is_featured ? '#059669' : '#475569',
                                        fontSize: '0.68rem',
                                        border: pkg.is_featured ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                                      }}
                                    >
                                      {pkg.badge_ar}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Title */}
                              <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>
                                {pkg.name_ar}
                              </h5>
                              <small className="text-muted font-monospace d-block mb-3" style={{ fontSize: '0.72rem' }}>
                                Code: {pkg.id}
                              </small>

                              {/* Price Box */}
                              <div className="p-3 rounded-3 mb-3" style={{ background: '#fbfaff', border: '1px solid #ede9fe' }}>
                                <div className="d-flex align-items-baseline justify-content-between mb-1">
                                  <span className="text-muted small" style={{ fontSize: '0.76rem' }}>سعر الباقة:</span>
                                  <div className="d-flex align-items-baseline gap-1">
                                    <h4 className="fw-black mb-0 font-monospace" style={{ color: '#261c6a', letterSpacing: '-0.5px' }}>
                                      {pkg.price_egp?.toLocaleString()}
                                    </h4>
                                    <span className="small text-muted" style={{ fontSize: '0.72rem' }}>ج.م</span>
                                  </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light">
                                  <span className="text-muted small" style={{ fontSize: '0.72rem' }}>المدة الإجمالية:</span>
                                  <strong className="text-dark small" style={{ fontSize: '0.78rem' }}>
                                    {totalMonths} شهور ({pkg.duration_months} + {pkg.free_months} مجاناً)
                                  </strong>
                                </div>
                              </div>

                              {/* Features list */}
                              <div className="mb-3">
                                <small className="text-muted fw-bold d-block mb-2" style={{ fontSize: '0.72rem' }}>المميزات المشمولة:</small>
                                <ul className="list-unstyled p-0 m-0 d-flex flex-column gap-1">
                                  {(pkg.features || []).map((feat, fIdx) => (
                                    <li key={fIdx} className="d-flex align-items-center gap-2 small text-secondary" style={{ fontSize: '0.78rem' }}>
                                      <i className="ti ti-check text-success fs-6 flex-shrink-0"></i>
                                      <span className="text-truncate">{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center" style={{ borderColor: '#f1f5f9', borderRadius: '0 0 18px 18px' }}>
                              {/* Toggle Active Switch */}
                              <div className="form-check form-switch mb-0">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`switch_${pkg.id}`}
                                  checked={pkg.active}
                                  onChange={() => handleTogglePackageActive(pkg)}
                                  title={pkg.active ? "باقة نشطة ومتاحة" : "باقة معطلة"}
                                />
                                <label className="form-check-label small text-muted ms-1" htmlFor={`switch_${pkg.id}`} style={{ fontSize: '0.74rem' }}>
                                  {pkg.active ? 'نشطة' : 'معطلة'}
                                </label>
                              </div>

                              {/* Edit & Delete Buttons */}
                              <div className="d-flex align-items-center gap-1">
                                <button 
                                  type="button" 
                                  onClick={() => { setEditingPackage(pkg); setPackageModalOpen(true); }}
                                  className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center border"
                                  style={{ width: '32px', height: '32px', color: '#261c6a' }}
                                  title="تعديل الباقة والأسعار"
                                >
                                  <i className="ti ti-edit fs-6"></i>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center border"
                                  style={{ width: '32px', height: '32px', color: '#dc2626' }}
                                  title="حذف الباقة"
                                >
                                  <i className="ti ti-trash fs-6"></i>
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: FOOD DATABASE ================= */}
            {activeTab === 'foods' && (
              <div className="card-body p-4">
                
                {/* Search */}
                <div className="row g-2 mb-3 align-items-center">
                  <div className="col-md-5 col-12">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0" style={{ borderColor: '#e2e8f0' }}>
                        <i className="ti ti-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 text-end"
                        style={{ borderColor: '#e2e8f0', fontSize: '0.84rem', height: '40px' }}
                        placeholder="ابحث باسم الطعام أو الفئة..."
                        value={foodSearch}
                        onChange={(e) => setFoodSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Foods Table */}
                <div className="border rounded-3 overflow-hidden bg-white shadow-xs" style={{ borderColor: '#e2e8f0' }}>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                      <thead className="table-light">
                        <tr className="text-muted" style={{ fontSize: '0.76rem', borderBottom: '1.5px solid #e2e8f0' }}>
                          <th className="py-3 px-3" style={{ width: '30%' }}>الصنف الغذائي</th>
                          <th className="py-3 text-center" style={{ width: '18%' }}>التصنيف</th>
                          <th className="py-3 text-center" style={{ width: '13%' }}>السعرات</th>
                          <th className="py-3 text-center" style={{ width: '13%' }}>بروتين (g)</th>
                          <th className="py-3 text-center" style={{ width: '13%' }}>كارب (g)</th>
                          <th className="py-3 text-center" style={{ width: '13%' }}>دهون (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFoods.map((f, idx) => (
                          <tr key={f.id || idx} className="border-bottom" style={{ borderColor: '#f1f5f9' }}>
                            <td className="px-3">
                              <div className="fw-bold text-dark">{f.name_ar}</div>
                              <small className="text-muted" style={{ fontSize: '0.72rem' }}>وحدة القياس: {f.unit}</small>
                            </td>
                            <td className="text-center">
                              <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#261c6a', border: '1px solid #ddd6fe', fontSize: '0.74rem' }}>
                                {f.category_ar}
                              </span>
                            </td>
                            <td className="text-center fw-bold text-dark">{f.calories} kcal</td>
                            <td className="text-center fw-bold text-primary">{f.protein}g</td>
                            <td className="text-center fw-bold text-warning">{f.carbs}g</td>
                            <td className="text-center fw-bold text-danger">{f.fats}g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 4: SYSTEM DEFAULTS ================= */}
            {activeTab === 'system' && (
              <div className="card-body p-4">
                <div className="row g-3" style={{ maxWidth: '700px' }}>
                  <div className="col-12">
                    <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.84rem' }}>
                      اسم الكابتن وتوقيع الاعتماد الافتراضي
                    </label>
                    <input
                      type="text"
                      className="form-control fw-semibold text-end"
                      style={{ height: '42px', borderRadius: '10px', fontSize: '0.86rem', border: '1.5px solid #e2e8f0' }}
                      value={systemConfig.coachName}
                      onChange={(e) => setSystemConfig({ ...systemConfig, coachName: e.target.value })}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.84rem' }}>
                      هدف الخطوات اليومي الافتراضي
                    </label>
                    <input
                      type="number"
                      className="form-control fw-semibold text-end"
                      style={{ height: '42px', borderRadius: '10px', fontSize: '0.86rem', border: '1.5px solid #e2e8f0' }}
                      value={systemConfig.defaultDailySteps}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultDailySteps: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-bold text-dark small mb-1" style={{ fontSize: '0.84rem' }}>
                      شرب الماء اليومي الافتراضي (لتر)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control fw-semibold text-end"
                      style={{ height: '42px', borderRadius: '10px', fontSize: '0.86rem', border: '1.5px solid #e2e8f0' }}
                      value={systemConfig.defaultWaterLiters}
                      onChange={(e) => setSystemConfig({ ...systemConfig, defaultWaterLiters: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-12 pt-3">
                    <button
                      type="button"
                      onClick={() => alert('تم حفظ إعدادات المنظومة العامة بنجاح')}
                      className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
                      style={{ 
                        height: '42px', 
                        fontSize: '0.86rem', 
                        background: 'linear-gradient(135deg, #372896 0%, #261c6a 100%)', 
                        border: 'none', 
                        boxShadow: '0 4px 14px rgba(38, 28, 106, 0.28)' 
                      }}
                    >
                      <i className="ti ti-device-floppy fs-6"></i>
                      <span>حفظ إعدادات المنظومة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

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

    </AdminLayout>
  );
}
