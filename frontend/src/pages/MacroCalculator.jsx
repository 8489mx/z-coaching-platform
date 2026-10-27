import React, { useState, useEffect } from 'react';
import { Calculator, Flame, Droplet, Activity, Check, Save, RotateCw, MessageCircle, UtensilsCrossed, Search, Plus, Edit2, Trash2, X, Scale, ShieldCheck, Target } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { copyToClipboard } from '../utils/clipboardUtils';
import { calculateMetabolicMacroProfile, DAILY_ACTIVITY_FACTORS, WORKOUT_FREQUENCY_FACTORS, GOAL_CALORIE_MULTIPLIERS } from '../utils/metabolicMacroEngine';
import { DEFAULT_FOOD_CATALOG } from '../data/defaultFoodsCatalog';
import { arabicSearchMatch } from '../utils/searchUtils';
import CurvedSelect from '../components/common/CurvedSelect';
import { TableSearch } from '@/shared/components/table-search';
import { PageHeader } from '@/shared/components/page-header';

export default function MacroCalculator() {
  // Navigation Tabs: 'CATALOG' (Food Library) or 'CALCULATOR' (Macro Engine)
  const [activeTab, setActiveTab] = useState('CATALOG');

  // --- FOOD CATALOG STATES ---
  const [foods, setFoods] = useState(DEFAULT_FOOD_CATALOG);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [_copiedFoodId, setCopiedFoodId] = useState(null);
  const [_viewMode, _setViewMode] = useState('GRID'); // 'GRID' (Compact Cards) or 'TABLE' (Dense Table)

  // Food Modals (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' or 'EDIT'
  const [foodFormData, setFoodFormData] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    macro_type: 'PROTEIN',
    category_ar: 'لحوم ودواجن',
    food_state: 'COOKED',
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.5,
    fiber_per_100g: 0,
    yield_factor: 1.0,
    serving_unit_ar: 'جرام',
    is_gluten_free: true,
    is_dairy: false,
    allergens: [],
    notes_ar: ''
  });
  const [savingFood, setSavingFood] = useState(false);

  // --- CALCULATOR STATES ---
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const activeClient = clients.find(c => String(c.id) === String(selectedClient));
  const [calcForm, setCalcForm] = useState({
    gender: 'MALE',
    age: 26,
    weight: 85,
    height: 178,
    bodyFat: 18,
    dailyActivity: 'STANDING_WALKING',
    workoutFrequency: 'DAYS_3_TO_5',
    goal: 'FAT_LOSS_STANDARD',
    proteinPerKg: 2.2,
    isMuscular: false
  });
  const [calcCopied, setCalcCopied] = useState(false);
  const [calcSaving, setCalcSaving] = useState(false);

  // Fetch initial data on mount
  useEffect(() => {
    fetchFoods();
    fetchClients();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoadingFoods(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/foods`);
      const data = await res.json();
      if (data.foods && Array.isArray(data.foods)) {
        setFoods(data.foods);
      }
    } catch (e) {
      console.error('Failed to fetch food catalog:', e);
    } finally {
      setLoadingFoods(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error(e);
    }
  };

  // --- FOOD ACTIONS ---
  const openAddFoodModal = () => {
    setModalMode('ADD');
    setFoodFormData({
      id: `FOOD_${Date.now()}`,
      name_ar: '',
      name_en: '',
      macro_type: 'PROTEIN',
      category_ar: 'لحوم ودواجن',
      food_state: 'COOKED',
      calories_per_100g: 100,
      protein_per_100g: 20,
      carbs_per_100g: 0,
      fat_per_100g: 2,
      fiber_per_100g: 0,
      yield_factor: 1.0,
      serving_unit_ar: 'جرام',
      is_gluten_free: true,
      is_dairy: false,
      allergens: [],
      notes_ar: ''
    });
    setIsModalOpen(true);
  };

  const openEditFoodModal = (food) => {
    setModalMode('EDIT');
    setFoodFormData({
      id: food.id,
      name_ar: food.name_ar || '',
      name_en: food.name_en || '',
      macro_type: food.macro_type || 'PROTEIN',
      category_ar: food.category_ar || 'عام',
      food_state: food.food_state || 'COOKED',
      calories_per_100g: food.calories_per_100g || 0,
      protein_per_100g: food.protein_per_100g || 0,
      carbs_per_100g: food.carbs_per_100g || 0,
      fat_per_100g: food.fat_per_100g || 0,
      fiber_per_100g: food.fiber_per_100g || 0,
      yield_factor: food.yield_factor || 1.0,
      serving_unit_ar: food.serving_unit_ar || 'جرام',
      is_gluten_free: Boolean(food.is_gluten_free),
      is_dairy: Boolean(food.is_dairy),
      allergens: Array.isArray(food.allergens) ? food.allergens : [],
      notes_ar: food.notes_ar || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!foodFormData.name_ar.trim()) {
      alert('يرجى كتابة اسم الصنف بالعربي');
      return;
    }

    try {
      setSavingFood(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(foodFormData)
      });
      const data = await res.json();
      if (data.success && data.foods) {
        setFoods(data.foods);
        setIsModalOpen(false);
      } else {
        alert(data.error || 'فشل حفظ الصنف');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setSavingFood(false);
    }
  };

  const handleDeleteFood = async (id, nameAr) => {
    if (!window.confirm(`هل أنت متأكد من حذف (${nameAr}) من مكتبة الأطعمة؟`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/foods/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && data.foods) {
        setFoods(data.foods);
      }
    } catch (err) {
      console.error(err);
      alert('فشل حذف الصنف');
    }
  };

  const _handleCopyFoodNutrition = (food) => {
    const text = `*${food.name_ar}* (${food.name_en || ''})\n` +
      `*القيم لكل 100 جرام (${food.food_state === 'COOKED' ? 'مطبوخ' : 'نيء'}):*\n` +
      `السعرات: ${food.calories_per_100g} kcal | بروتين: ${food.protein_per_100g}g | كارب: ${food.carbs_per_100g}g | دهون: ${food.fat_per_100g}g | ألياف: ${food.fiber_per_100g || 0}g\n` +
      `\nمنظومة Z-Coaching التغذوية`;

    copyToClipboard(text);
    setCopiedFoodId(food.id);
    setTimeout(() => setCopiedFoodId(null), 2500);
  };

  // Filtered Foods
  const filteredFoods = foods.filter((f) => {
    // 1. Strict Category Filter
    if (categoryFilter !== 'ALL' && f.macro_type !== categoryFilter) {
      return false;
    }

    // 2. Strict State Filter
    if (stateFilter !== 'ALL' && f.food_state !== stateFilter) {
      return false;
    }

    // 3. Search Term
    if (searchTerm && searchTerm.trim() !== '') {
      const matchNameAr = arabicSearchMatch(f.name_ar, searchTerm);
      const matchNameEn = arabicSearchMatch(f.name_en, searchTerm);
      const matchCategory = arabicSearchMatch(f.category_ar, searchTerm);
      if (!matchNameAr && !matchNameEn && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  // Category counts
  const categoryCounts = {
    ALL: foods.length,
    PROTEIN: foods.filter(f => f.macro_type === 'PROTEIN').length,
    CARBS: foods.filter(f => f.macro_type === 'CARBS').length,
    FATS: foods.filter(f => f.macro_type === 'FATS').length,
    VEGGIE: foods.filter(f => f.macro_type === 'VEGGIE').length,
    FRUIT: foods.filter(f => f.macro_type === 'FRUIT').length
  };

  // --- METABOLIC CALCULATOR CALCULATIONS ---
  const metabolic = calculateMetabolicMacroProfile({
    gender: calcForm.gender,
    age: calcForm.age,
    weight_kg: calcForm.weight,
    height_cm: calcForm.height,
    body_fat_percent: calcForm.bodyFat || null,
    daily_activity: calcForm.dailyActivity,
    workout_frequency: calcForm.workoutFrequency,
    goal: calcForm.goal,
    protein_per_kg: calcForm.proteinPerKg,
    is_muscular: calcForm.isMuscular
  });

  const bmr = metabolic.bmr_kcal ?? 0;
  const tdee = metabolic.tdee_kcal ?? 0;
  const targetCalories = metabolic.target_calories_kcal ?? 0;
  const targetProteinGrams = metabolic.macro_targets.protein_g ?? 0;
  const targetFatGrams = metabolic.macro_targets.fat_g ?? 0;
  const targetCarbGrams = metabolic.macro_targets.carbs_g ?? 0;
  const proteinCalories = targetProteinGrams * 4;
  const fatCalories = targetFatGrams * 9;
  const carbsCalories = targetCarbGrams * 4;
  const waterTargetLiters = (metabolic.water_target_liters ?? 0).toFixed(1);
  const totalMacroCalories = (proteinCalories + carbsCalories + fatCalories) || targetCalories || 1;
  const proteinPct = Math.round((proteinCalories / totalMacroCalories) * 100);
  const carbsPct = Math.round((carbsCalories / totalMacroCalories) * 100);
  const fatPct = Math.max(0, 100 - (proteinPct + carbsPct));
  const calorieDiff = targetCalories - tdee;

  const handleApplyToClient = async () => {
    if (metabolic.is_valid === false || !targetCalories) {
      alert(metabolic.error_ar || 'بيانات القياسات الأساسية غير مكتملة (الوزن والطول والعمر مطلوبة قبل تطبيق الخطة)');
      return;
    }
    if (!selectedClient) {
      alert('يرجى اختيار متدرب أولاً');
      return;
    }

    try {
      setCalcSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${selectedClient}`);
      const progData = await res.json();
      
      const master = progData.master_program || {};
      if (!master.nutrition) master.nutrition = {};
      master.nutrition.targets = {
        ...(master.nutrition.targets || {}),
        calories: targetCalories,
        target_calories_kcal: targetCalories,
        protein: targetProteinGrams,
        protein_g: targetProteinGrams,
        carbs: targetCarbGrams,
        carbs_g: targetCarbGrams,
        carbohydrate_g: targetCarbGrams,
        fats: targetFatGrams,
        fat_g: targetFatGrams,
        fats_g: targetFatGrams
      };
      if (!master.nutrition_program) master.nutrition_program = {};
      master.nutrition_program.targets = {
        ...(master.nutrition_program.targets || {}),
        calories_kcal: targetCalories,
        target_calories_kcal: targetCalories,
        protein_g: targetProteinGrams,
        carbohydrate_g: targetCarbGrams,
        carbs_g: targetCarbGrams,
        fat_g: targetFatGrams,
        fats_g: targetFatGrams
      };
      master.nutrition_program.macro_targets = {
        ...(master.nutrition_program.macro_targets || {}),
        calories_kcal: targetCalories,
        target_calories_kcal: targetCalories,
        protein_g: targetProteinGrams,
        carbohydrate_g: targetCarbGrams,
        carb_g: targetCarbGrams,
        carbs_g: targetCarbGrams,
        fat_g: targetFatGrams,
        fats_g: targetFatGrams
      };
      if (!master.nutrition_program) master.nutrition_program = {};
      if (!master.nutrition_program.stages) master.nutrition_program.stages = {};

      master.nutrition_program.stages.energy_target = {
        target_calories_kcal: targetCalories,
        bmr_kcal: bmr,
        tdee_kcal: tdee
      };

      master.nutrition_program.stages.macro_targets = {
        protein_g: targetProteinGrams,
        carbs_g: targetCarbGrams,
        carbohydrate_g: targetCarbGrams,
        fats_g: targetFatGrams,
        fat_g: targetFatGrams
      };

      const updateRes = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_code: selectedClient,
          program_data: master,
          master_program: master
        })
      });

      if (!updateRes.ok) throw new Error('فشل تحديث الخطة في السيرفر');
      alert(`تم تحديث وتطبيق أهداف السعرات والماكروز الجديدة على خطة المتدرب #${selectedClient} بنجاح!`);
    } catch (e) {
      alert('خطأ: ' + e.message);
    } finally {
      setCalcSaving(false);
    }
  };

  const handleCopyCalcSummary = () => {
    const summary = `*خطة السعرات والماكروز المستهدفة*\n\n` +
      `*السعرات المستهدفة:* ${targetCalories} سعرة حرارية\n` +
      `*البروتين اليومي:* ${targetProteinGrams} جم (${proteinCalories} kcal)\n` +
      `*الكاربوهيدرات:* ${targetCarbGrams} جم (${carbsCalories} kcal)\n` +
      `*الدهون الصحية:* ${targetFatGrams} جم (${fatCalories} kcal)\n\n` +
      `*احتياج الماء:* ${waterTargetLiters} لتر / يوم\n` +
      `*جلسة الكارديو:* 30 دقيقة مشي مائل / عجلة (4 مرات أسبوعياً)\n\n` +
      `*معدل الحرق الأساسي (BMR):* ${bmr} kcal\n` +
      `*استهلاك الطاقة اليومي (TDEE):* ${tdee} kcal\n\n` +
      `منظومة Z-Coaching الاحترافية`;

    copyToClipboard(summary);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1240px', margin: '0 auto', width: '100%', fontFamily: 'Cairo, sans-serif' }}>
        
        {/* Unified Premium Page Header */}
        <PageHeader
          title="الأغذية والماكروز"
          description="قاعدة بيانات الأغذية الكاملة للماكروز وحاسبة الاحتياج الرياضي اليومي المعتمدة سريرياً."
          badge={(
            <span style={{
              background: '#F4F0FD',
              color: '#673DE6',
              border: '1px solid #EDE8FA',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {activeTab === 'CATALOG' ? `قاعدة الأغذية (${foods.length})` : 'محرك الطاقة السريري'}
            </span>
          )}
          actions={(
            <div style={{ display: 'inline-flex', background: '#F2F4F7', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('CATALOG')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'CATALOG' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'CATALOG' ? '#101828' : '#475467',
                  fontSize: '12px',
                  fontWeight: activeTab === 'CATALOG' ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'CATALOG' ? '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <UtensilsCrossed size={14} color={activeTab === 'CATALOG' ? '#673DE6' : '#64748B'} />
                <span>قاعدة الأطعمة ({foods.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CALCULATOR')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'CALCULATOR' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'CALCULATOR' ? '#101828' : '#475467',
                  fontSize: '12px',
                  fontWeight: activeTab === 'CALCULATOR' ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'CALCULATOR' ? '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Calculator size={14} color={activeTab === 'CALCULATOR' ? '#673DE6' : '#64748B'} />
                <span>حاسبة الاحتياج اليومي</span>
              </button>
            </div>
          )}
        />

        {/* ========================================================================= */}
        {/* TAB 1: FOOD CATALOG & NUTRITION LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === 'CATALOG' && (
          <div>
            {/* Filter & Control Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
              
              {/* Top Search & Actions Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <TableSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="ابحث عن أي صنف طعام (دجاج، أرز، شوفان، سلمون...)"
                  width="380px"
                  showShortcut={false}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Food State Filter (Curved Segmented Control) */}
                  <div style={{ display: 'inline-flex', background: '#F2F4F7', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0', gap: '2px' }}>
                    {[
                      { id: 'ALL', label: 'جميع الحالات' },
                      { id: 'COOKED', label: 'مطبوخ' },
                      { id: 'RAW', label: 'طازج / نيء' }
                    ].map((st) => {
                      const isAct = stateFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStateFilter(st.id)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 12px',
                            fontSize: '11.5px',
                            fontWeight: isAct ? 700 : 500,
                            borderRadius: '8px',
                            background: isAct ? '#FFFFFF' : 'transparent',
                            color: isAct ? '#101828' : '#475467',
                            boxShadow: isAct ? '0 1px 2px rgba(16, 24, 40, 0.06)' : 'none',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Food Button */}
                  <button
                    type="button"
                    onClick={openAddFoodModal}
                    style={{
                      height: '32px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#673DE6', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)'
                    }}
                  >
                    <Plus size={13} />
                    <span>إضافة صنف جديد</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { key: 'ALL', label: 'الكل', count: categoryCounts.ALL },
                  { key: 'PROTEIN', label: 'البروتين', color: '#0284C7', count: categoryCounts.PROTEIN },
                  { key: 'CARBS', label: 'النشويات', color: '#D97706', count: categoryCounts.CARBS },
                  { key: 'FATS', label: 'الدهون الصحية', color: '#16A34A', count: categoryCounts.FATS },
                  { key: 'VEGGIE', label: 'الخضروات', color: '#059669', count: categoryCounts.VEGGIE },
                  { key: 'FRUIT', label: 'الفواكه', color: '#E11D48', count: categoryCounts.FRUIT }
                ].map((cat) => {
                  const isSelected = categoryFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategoryFilter(cat.key)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSelected ? '#101828' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap',
                        userSelect: 'none'
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                        fontSize: '9.5px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        fontWeight: 800
                      }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Foods Data Table */}
            {loadingFoods ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #EAECF0', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCw size={22} className="animate-spin" color="#0284C7" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>جاري تحميل مكتبة الأغذية...</div>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #EAECF0', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={28} color="#94A3B8" style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>لا توجد أطعمة مطابقة للبحث</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>جرب تغيير تصنيف البحث أو إضافة صنف طعام جديد.</div>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)', minHeight: '350px' }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECF0', color: '#475569', fontWeight: 800 }}>
                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '40%' }}>الصنف الغذائي والتصنيف</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '16%' }}>السعرات (لكل 100g)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '30%' }}>الماكروز الصافية (P | C | F | Fib)</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', width: '14%' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoods.map((food) => {
                      return (
                        <tr
                          key={food.id}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F9FA')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Column 1: Food Name + State + Category Badges */}
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                              <span style={{ color: '#101828', fontSize: '13px', fontWeight: 800 }}>
                                {food.name_ar}
                              </span>
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '8px',
                                background: food.food_state === 'COOKED' ? '#F1F5F9' : '#FEF2F2',
                                border: `1px solid ${food.food_state === 'COOKED' ? '#D0D5DD' : '#FECACA'}`,
                                color: food.food_state === 'COOKED' ? '#334155' : '#DC2626'
                              }}>
                                {food.food_state === 'COOKED' ? 'مطبوخ' : 'طازج'}
                              </span>
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                background: food.macro_type === 'PROTEIN' ? '#F0F9FF' : food.macro_type === 'CARBS' ? '#FFFBEB' : food.macro_type === 'FATS' ? '#F0FDF4' : '#F8F9FA',
                                border: `1px solid ${food.macro_type === 'PROTEIN' ? '#BAE6FD' : food.macro_type === 'CARBS' ? '#FDE68A' : food.macro_type === 'FATS' ? '#BBF7D0' : '#E2E8F0'}`,
                                color: food.macro_type === 'PROTEIN' ? '#0369A1' : food.macro_type === 'CARBS' ? '#B45309' : food.macro_type === 'FATS' ? '#15803D' : '#475569'
                              }}>
                                {food.category_ar}
                              </span>
                            </div>
                            {food.name_en && (
                              <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 500 }}>
                                {food.name_en}
                              </div>
                            )}
                          </td>

                          {/* Column 2: Calories per 100g */}
                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            <span style={{
                              background: '#F8F9FA', border: '1px solid #EAECF0',
                              color: '#92400E',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 900,
                              fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>{food.calories_per_100g}</span>
                              <small style={{ fontSize: '9px', fontWeight: 700, color: '#B45309' }}>kcal</small>
                            </span>
                          </td>

                          {/* Column 3: Complete Macros Group (P | C | F | Fib) */}
                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', direction: 'ltr' }}>
                              <span style={{
                                width: '56px',
                                background: '#F8F9FA', border: '1px solid #EAECF0',
                                color: '#0369A1',
                                padding: '3px 0',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }} title="بروتين Protein">
                                <small style={{ fontSize: '9.5px', fontWeight: 800, color: '#0284C7' }}>P</small>
                                <span>{food.protein_per_100g}g</span>
                              </span>
                              <span style={{
                                width: '56px',
                                background: '#FFF7ED',
                                border: '1px solid #FED7AA',
                                color: '#C2410C',
                                padding: '3px 0',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }} title="كاربوهيدرات Carbs">
                                <small style={{ fontSize: '9.5px', fontWeight: 800, color: '#D97706' }}>C</small>
                                <span>{food.carbs_per_100g}g</span>
                              </span>
                              <span style={{
                                width: '56px',
                                background: '#F8F9FA', border: '1px solid #EAECF0',
                                color: '#15803D',
                                padding: '3px 0',
                                borderRadius: '5px',
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }} title="دهون صحية Fats">
                                <small style={{ fontSize: '9.5px', fontWeight: 800, color: '#16A34A' }}>F</small>
                                <span>{food.fat_per_100g}g</span>
                              </span>
                              <span style={{
                                width: '56px',
                                background: '#F8F9FA',
                                border: '1px solid #EAECF0',
                                color: '#64748B',
                                padding: '3px 0',
                                borderRadius: '5px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px'
                              }} title="ألياف Fiber">
                                <small style={{ fontSize: '9.5px', fontWeight: 700, color: '#94A3B8' }}>Fib</small>
                                <span>{food.fiber_per_100g || 0}g</span>
                              </span>
                            </div>
                          </td>

                          {/* Column 4: Quick Actions (Edit & Delete only) */}
                          <td style={{ padding: '9px 14px', textAlign: 'left' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditFoodModal(food)}
                                style={{
                                  height: '28px',
                                  padding: '0 10px',
                                  borderRadius: '5px',
                                  border: '1px solid #CBD5E1',
                                  background: '#FFFFFF',
                                  color: '#334155',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Edit2 size={12} />
                                <span>تعديل</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteFood(food.id, food.name_ar)}
                                style={{
                                  height: '28px',
                                  padding: '0 8px',
                                  borderRadius: '5px',
                                  border: '1px solid #FEE2E2',
                                  background: '#FFF5F5',
                                  color: '#DC2626',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="حذف الصنف"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: METABOLIC RATE & MACRO TARGET CALCULATOR */}
        {/* ========================================================================= */}
        {activeTab === 'CALCULATOR' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
            
            {/* Column 1: Metabolic & Goals Input Form (Right Column in RTL) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '16px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Header with Quick Autofill Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #F2F4F7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#F4F0FD',
                      border: '1px solid #EDE8FA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#673DE6',
                      flexShrink: 0
                    }}>
                      <Scale size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                        بيانات المتدرب والمستوى البدني
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#667085' }}>
                        القياسات الحيوية، مستوى النشاط ونمط التدريب
                      </p>
                    </div>
                  </div>

                  {/* Auto-fill from Client Profile */}
                  {clients.length > 0 && (
                    <div style={{ minWidth: '150px' }}>
                      <CurvedSelect
                        value=""
                        onChange={(e) => {
                          const cId = e.target.value;
                          if (!cId) return;
                          const cl = clients.find(c => String(c.id) === String(cId));
                          if (cl) {
                            setSelectedClient(cl.id);
                            setCalcForm(prev => ({
                              ...prev,
                              gender: cl.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
                              age: Number(cl.age) > 0 ? Number(cl.age) : '',
                              weight: Number(cl.weight_kg || cl.weight) > 0 ? Number(cl.weight_kg || cl.weight) : '',
                              height: Number(cl.height_cm || cl.height) > 0 ? Number(cl.height_cm || cl.height) : '',
                              bodyFat: Number(cl.body_fat_percent || cl.body_fat) > 0 ? Number(cl.body_fat_percent || cl.body_fat) : null
                            }));
                          }
                        }}
                        style={{
                          height: '32px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: '#F9FAFB',
                          color: '#344054'
                        }}
                      >
                        <option value="">استيراد من متدرب...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.first_name} {c.last_name}
                          </option>
                        ))}
                      </CurvedSelect>
                    </div>
                  )}
                </div>

                {/* Measurement Source of Truth Banner */}
                {activeClient && (
                  <div style={{
                    marginBottom: '14px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: activeClient.is_measurement_corrected ? '#F4F0FD' : '#F0F9FF',
                    border: `1px solid ${activeClient.is_measurement_corrected ? '#DDD6FE' : '#BAE6FD'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: activeClient.is_measurement_corrected ? '#5B21B6' : '#0369A1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={15} />
                      <span>
                        المتدرب المحدد: <strong>{activeClient.full_name || `${activeClient.first_name || ''} ${activeClient.last_name || ''}`.trim() || activeClient.client_code}</strong>
                      </span>
                      <span>•</span>
                      <span>{activeClient.latest_measurement_source?.label_ar || `الوزن المسجل: ${activeClient.weight_kg || '--'} كجم`}</span>
                    </div>
                    {activeClient.is_measurement_corrected && (
                      <span style={{
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800
                      }}>
                        قراءة مصححة بواسطة الكوتش
                      </span>
                    )}
                  </div>
                )}

                {/* Section 1: Biological Profile */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#344054', marginBottom: '8px' }}>
                    1. القياسات الحيوية والشخصية
                  </div>

                  {/* Row: Gender & Age */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        النوع (الجنس)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', height: '38px' }}>
                        {[
                          { id: 'MALE', label: 'ذكر' },
                          { id: 'FEMALE', label: 'أنثى' }
                        ].map((g) => {
                          const isAct = calcForm.gender === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setCalcForm({ ...calcForm, gender: g.id })}
                              style={{
                                border: isAct ? '1px solid #673DE6' : '1px solid #D0D5DD',
                                borderRadius: '8px',
                                background: isAct ? '#673DE6' : '#FFFFFF',
                                color: isAct ? '#FFFFFF' : '#344054',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                boxShadow: isAct ? '0 1px 3px rgba(103, 61, 230, 0.25)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        العمر (سنة)
                      </label>
                      <input
                        type="number"
                        value={calcForm.age}
                        onChange={(e) => setCalcForm({ ...calcForm, age: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 12px',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#101828',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row: Weight, Height, Body Fat */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        الوزن (كجم)
                      </label>
                      <input
                        type="number"
                        value={calcForm.weight}
                        onChange={(e) => setCalcForm({ ...calcForm, weight: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 12px',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#101828',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        الطول (سم)
                      </label>
                      <input
                        type="number"
                        value={calcForm.height}
                        onChange={(e) => setCalcForm({ ...calcForm, height: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 12px',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#101828',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        نسبة الدهون (%)
                      </label>
                      <input
                        type="number"
                        value={calcForm.bodyFat || ''}
                        onChange={(e) => setCalcForm({ ...calcForm, bodyFat: e.target.value ? Number(e.target.value) : null })}
                        placeholder="اختياري"
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 12px',
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#101828',
                          textAlign: 'center',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#F2F4F7' }} />

                {/* Section 2: Daily Activity & Training */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#344054', marginBottom: '8px' }}>
                    2. النشاط الحركي والتمارين
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        النشاط والحركة اليومية (NEAT)
                      </label>
                      <CurvedSelect
                        value={calcForm.dailyActivity}
                        onChange={(e) => setCalcForm({ ...calcForm, dailyActivity: e.target.value })}
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#101828',
                          outline: 'none',
                          background: '#FFFFFF'
                        }}
                      >
                        {Object.entries(DAILY_ACTIVITY_FACTORS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label_ar}</option>
                        ))}
                      </CurvedSelect>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                        تكرار تمارين المقاومة (EAT)
                      </label>
                      <CurvedSelect
                        value={calcForm.workoutFrequency}
                        onChange={(e) => setCalcForm({ ...calcForm, workoutFrequency: e.target.value })}
                        style={{
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          padding: '0 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#101828',
                          outline: 'none',
                          background: '#FFFFFF'
                        }}
                      >
                        {Object.entries(WORKOUT_FREQUENCY_FACTORS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label_ar}</option>
                        ))}
                      </CurvedSelect>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#F2F4F7' }} />

                {/* Section 3: Goal & Protein Requirement */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#344054', marginBottom: '8px' }}>
                    3. الهدف الغذائي وتوزيع البروتين
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                      الهدف المستهدف
                    </label>
                    <CurvedSelect
                      value={calcForm.goal}
                      onChange={(e) => setCalcForm({ ...calcForm, goal: e.target.value })}
                      style={{
                        width: '100%',
                        height: '38px',
                        borderRadius: '8px',
                        border: '1px solid #D0D5DD',
                        padding: '0 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#101828',
                        background: '#FFFFFF',
                        outline: 'none'
                      }}
                    >
                      {Object.entries(GOAL_CALORIE_MULTIPLIERS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label_ar}</option>
                      ))}
                    </CurvedSelect>
                  </div>

                  {/* Protein Requirement Control */}
                  <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: '12px', border: '1px solid #EAECF0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#344054' }}>
                        معدل البروتين اليومي لكل كجم وزن
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#673DE6', background: '#F4F0FD', border: '1px solid #EDE8FA', padding: '2px 8px', borderRadius: '6px' }}>
                          {calcForm.proteinPerKg} جم / كجم
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#667085', fontWeight: 600 }}>
                          (= {targetProteinGrams} جم)
                        </span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '10px' }}>
                      {[
                        { val: 1.6, label: '1.6', note: 'محافظة' },
                        { val: 1.8, label: '1.8', note: 'معتدل' },
                        { val: 2.0, label: '2.0', note: 'بناء عضلي' },
                        { val: 2.2, label: '2.2', note: 'تنشيف' },
                        { val: 2.5, label: '2.5', note: 'متقدم' }
                      ].map(p => {
                        const isAct = calcForm.proteinPerKg === p.val;
                        return (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setCalcForm(prev => ({ ...prev, proteinPerKg: p.val }))}
                            style={{
                              padding: '5px 4px',
                              borderRadius: '8px',
                              border: isAct ? '1px solid #673DE6' : '1px solid #D0D5DD',
                              background: isAct ? '#673DE6' : '#FFFFFF',
                              color: isAct ? '#FFFFFF' : '#344054',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '1px',
                              boxShadow: isAct ? '0 1px 3px rgba(103, 61, 230, 0.25)' : 'none',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 800 }}>{p.label}</span>
                            <span style={{ fontSize: '9px', fontWeight: 600, opacity: isAct ? 0.9 : 0.7 }}>{p.note}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Range Slider in pure RTL matching preset buttons */}
                    <div style={{ margin: '6px 0 2px 0' }}>
                      <input
                        type="range"
                        min="1.4"
                        max="3.0"
                        step="0.1"
                        value={calcForm.proteinPerKg}
                        onChange={(e) => setCalcForm({ ...calcForm, proteinPerKg: parseFloat(e.target.value) })}
                        style={{
                          width: '100%',
                          cursor: 'pointer',
                          accentColor: '#673DE6',
                          margin: '4px 0'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#98A2B3', fontWeight: 600 }}>
                        <span>1.4 جم (الحد الأدنى)</span>
                        <span>2.2 جم (الهدف المعياري)</span>
                        <span>3.0 جم (الحد الرياضي)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Column 2: Calculated Results & Sync Action (Left Column in RTL) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '16px',
              padding: '22px 24px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #F2F4F7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#FEF3F2',
                      border: '1px solid #FEE4E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D92D20',
                      flexShrink: 0
                    }}>
                      <Flame size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                        التقرير الرياضي لتوزيع السعرات والماكروز
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#667085' }}>
                        التقسيم الرياضي الدقيق للسعرات والجرامات اليومية
                      </p>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#673DE6',
                    background: '#F4F0FD',
                    border: '1px solid #EDE8FA',
                    padding: '3px 9px',
                    borderRadius: '8px'
                  }}>
                    {GOAL_CALORIE_MULTIPLIERS[calcForm.goal]?.label_ar || 'خطة التغذية'}
                  </span>
                </div>

                {/* Hero Box: Target Calories & Metabolic Equation */}
                <div style={{
                  background: 'linear-gradient(135deg, #F4F0FD 0%, #EDE8FA 100%)',
                  border: '1.5px solid #D6BBFB',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 4px rgba(103, 61, 230, 0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#673DE6', marginBottom: '2px' }}>
                        السعرات اليومية المستهدفة للخطة
                      </div>
                      <div style={{ fontSize: metabolic.is_valid && targetCalories ? '28px' : '18px', fontWeight: 900, color: metabolic.is_valid && targetCalories ? '#101828' : '#64748B', lineHeight: 1.1 }}>
                        {metabolic.is_valid && targetCalories ? (
                          <>
                            <bdi dir="ltr">{targetCalories}</bdi> <span style={{ fontSize: '13px', fontWeight: 700, color: '#475467' }}>سعرة حرارية / اليوم</span>
                          </>
                        ) : (
                          <span>بيانات القياسات الأساسية غير مكتملة</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {calorieDiff < 0 ? (
                        <span style={{ background: '#FEF3F2', color: '#B42318', border: '1px solid #FECDCA', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          عجز: {Math.abs(calorieDiff)} سعرة
                        </span>
                      ) : calorieDiff > 0 ? (
                        <span style={{ background: '#ECFDF3', color: '#027A48', border: '1px solid #A6F4C5', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          فائض: +{calorieDiff} سعرة
                        </span>
                      ) : (
                        <span style={{ background: '#F2F4F7', color: '#344054', border: '1px solid #EAECF0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          صيانة (0 عجز)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-strip with BMR, TDEE, and Methodology */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #E4D9FB', paddingTop: '10px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#475467', fontWeight: 600 }}>
                      <span>الحرق الأساسي (BMR): <strong style={{ color: '#101828' }}>{metabolic.is_valid && bmr ? `${bmr} سعرة` : '--'}</strong></span>
                      <span style={{ color: '#D0D5DD', margin: '0 3px' }}>|</span>
                      <span>الاستهلاك الكلي (TDEE): <strong style={{ color: '#101828' }}>{metabolic.is_valid && tdee ? `${tdee} سعرة` : '--'}</strong></span>
                    </div>
                    <span style={{ background: '#FFFFFF', padding: '1px 8px', borderRadius: '6px', border: '1px solid #D6BBFB', fontWeight: 700, color: '#673DE6', fontSize: '10px' }}>
                      {calcForm.bodyFat ? 'معادلة Katch-McArdle السريرية (LBM)' : 'معادلة Mifflin-St Jeor السريرية'}
                    </span>
                  </div>
                </div>

                {/* Macro Ratio Visual Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#344054' }}>
                    <span>النسبة المئوية لتوزيع السعرات (Macro Ratio):</span>
                    <span style={{ color: '#667085', fontSize: '10.5px' }}>
                      بروتين {proteinPct}% • كارب {carbsPct}% • دهون {fatPct}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', height: '8px', borderRadius: '8px', overflow: 'hidden', gap: '2px', background: '#F2F4F7' }}>
                    <div style={{ width: `${proteinPct}%`, background: '#0284C7', borderRadius: '9999px 0 0 9999px', transition: 'width 0.3s ease' }} title={`البروتين: ${proteinPct}%`} />
                    <div style={{ width: `${carbsPct}%`, background: '#D97706', transition: 'width 0.3s ease' }} title={`الكارب: ${carbsPct}%`} />
                    <div style={{ width: `${fatPct}%`, background: '#16A34A', borderRadius: '0 9999px 9999px 0', transition: 'width 0.3s ease' }} title={`الدهون: ${fatPct}%`} />
                  </div>
                </div>

                {/* 3 Unified Clean Macro Pillar Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {/* Protein */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderTop: '3px solid #0284C7', padding: '12px 10px', borderRadius: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#026AA2' }}>البروتين</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px' }}>{proteinPct}%</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#101828' }}>
                      {targetProteinGrams} <small style={{ fontSize: '11px', fontWeight: 700 }}>جم</small>
                    </div>
                    <div style={{ fontSize: '10px', color: '#667085', fontWeight: 600, marginTop: '2px' }}>{proteinCalories} سعرة</div>
                  </div>

                  {/* Carbs */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderTop: '3px solid #D97706', padding: '12px 10px', borderRadius: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#B54708' }}>الكارب</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>{carbsPct}%</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#101828' }}>
                      {targetCarbGrams} <small style={{ fontSize: '11px', fontWeight: 700 }}>جم</small>
                    </div>
                    <div style={{ fontSize: '10px', color: '#667085', fontWeight: 600, marginTop: '2px' }}>{carbsCalories} سعرة</div>
                  </div>

                  {/* Fats */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderTop: '3px solid #16A34A', padding: '12px 10px', borderRadius: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#027A48' }}>الدهون</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>{fatPct}%</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#101828' }}>
                      {targetFatGrams} <small style={{ fontSize: '11px', fontWeight: 700 }}>جم</small>
                    </div>
                    <div style={{ fontSize: '10px', color: '#667085', fontWeight: 600, marginTop: '2px' }}>{fatCalories} سعرة</div>
                  </div>
                </div>

                {/* Hydration & Cardio Guidance Strip */}
                <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '10px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplet size={14} color="#0284C7" />
                    <span style={{ color: '#475467' }}>احتياج الماء اليومي: <strong style={{ color: '#101828' }}>{waterTargetLiters} لتر / يوم</strong></span>
                  </div>
                  <span style={{ color: '#D0D5DD' }}>|</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="#673DE6" />
                    <span style={{ color: '#475467' }}>جلسة الكارديو: <strong style={{ color: '#101828' }}>30 دقيقة (4 أيام أسبوعياً)</strong></span>
                  </div>
                </div>

              </div>

              {/* Action Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F2F4F7' }}>
                {/* Sync to Client */}
                <div style={{ background: '#F9FAFB', padding: '10px 12px', borderRadius: '12px', border: '1px solid #EAECF0' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#344054', marginBottom: '6px' }}>
                    تطبيق هذه الماكروز فوراً على خطة متدرب:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <CurvedSelect
                      value={selectedClient}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setSelectedClient(cId);
                        if (!cId) return;
                        const cl = clients.find(c => String(c.id) === String(cId));
                        if (cl) {
                          setCalcForm(prev => ({
                            ...prev,
                            gender: cl.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
                            age: Number(cl.age) > 0 ? Number(cl.age) : '',
                            weight: Number(cl.weight_kg || cl.weight) > 0 ? Number(cl.weight_kg || cl.weight) : '',
                            height: Number(cl.height_cm || cl.height) > 0 ? Number(cl.height_cm || cl.height) : '',
                            bodyFat: Number(cl.body_fat_percent || cl.body_fat) > 0 ? Number(cl.body_fat_percent || cl.body_fat) : null
                          }));
                        }
                      }}
                      style={{ flex: 1, height: '36px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 12px', fontSize: '11.5px', fontWeight: 600, outline: 'none', background: '#FFFFFF' }}
                    >
                      <option value="">-- اختر متدرب لتطبيق الخطة فوراً --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} ({c.email || c.phone_number})
                        </option>
                      ))}
                    </CurvedSelect>
                    <button
                      type="button"
                      onClick={handleApplyToClient}
                      disabled={calcSaving}
                      style={{
                        padding: '0 18px',
                        height: '36px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#673DE6',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
                    >
                      <Save size={13} />
                      <span>{calcSaving ? 'جاري...' : 'تطبيق'}</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp Summary */}
                <button
                  type="button"
                  onClick={handleCopyCalcSummary}
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    border: calcCopied ? '1px solid #A6F4C5' : '1px solid #A6F4C5',
                    background: calcCopied ? '#ECFDF3' : '#ECFDF3',
                    color: '#027A48',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#D1FADF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFDF3'; }}
                >
                  {calcCopied ? <Check size={14} color="#027A48" /> : <MessageCircle size={14} color="#027A48" />}
                  <span>{calcCopied ? 'تم نسخ التقرير للحافظة بنجاح' : 'نسخ ملخص الماكروز للواتساب'}</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ADD / EDIT FOOD ITEM MODAL */}
        {/* ========================================================================= */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #CBD5E1'
            }}>
              
              {/* Modal Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EAECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UtensilsCrossed size={16} color="#0284C7" />
                  <span>{modalMode === 'ADD' ? 'إضافة صنف طعام جديد إلى المكتبة' : 'تعديل بيانات صنف الطعام والماكروز'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: 0 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveFood} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      اسم الصنف بالعربي *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: صدور دجاج مشوية"
                      value={foodFormData.name_ar}
                      onChange={(e) => setFoodFormData({ ...foodFormData, name_ar: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      الاسم بالإنجليزي
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grilled Chicken Breast"
                      value={foodFormData.name_en}
                      onChange={(e) => setFoodFormData({ ...foodFormData, name_en: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Macro Type, Category & State */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      نوع الماكرو الأساسي
                    </label>
                    <CurvedSelect
                      value={foodFormData.macro_type}
                      onChange={(e) => setFoodFormData({ ...foodFormData, macro_type: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="PROTEIN">بروتين (Protein)</option>
                      <option value="CARBS">كاربوهيدرات (Carbs)</option>
                      <option value="FATS">دهون صحية (Fats)</option>
                      <option value="VEGGIE">خضروات (Vegetables)</option>
                      <option value="FRUIT">فواكه (Fruits)</option>
                    </CurvedSelect>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      التصنيف الفرعي
                    </label>
                    <input
                      type="text"
                      placeholder="لحوم، حبوب، مكسرات..."
                      value={foodFormData.category_ar}
                      onChange={(e) => setFoodFormData({ ...foodFormData, category_ar: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      حالة الطهي
                    </label>
                    <CurvedSelect
                      value={foodFormData.food_state}
                      onChange={(e) => setFoodFormData({ ...foodFormData, food_state: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="COOKED">مطبوخ ومجهز</option>
                      <option value="RAW">طازج / نيء</option>
                    </CurvedSelect>
                  </div>
                </div>

                {/* Macro Inputs (per 100g) */}
                <div style={{ background: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828', marginBottom: '8px' }}>
                    القيم الغذائية لكل 100 جرام:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '6px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#101828', marginBottom: '2px' }}>
                        السعرات (kcal)
                      </label>
                      <input
                        type="number"
                        value={foodFormData.calories_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, calories_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#0284C7', marginBottom: '2px' }}>
                        بروتين (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={foodFormData.protein_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, protein_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#D97706', marginBottom: '2px' }}>
                        كارب (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={foodFormData.carbs_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, carbs_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#16A34A', marginBottom: '2px' }}>
                        دهون (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={foodFormData.fat_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, fat_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>
                        ألياف (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={foodFormData.fiber_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, fiber_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes & Tips */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    ملاحظات الكوتش وفوائد الصنف (تظهر للمتدرب)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="نصائح تناول الصنف، الفوائد الهرمونية، وقت التناول المقترح..."
                    value={foodFormData.notes_ar}
                    onChange={(e) => setFoodFormData({ ...foodFormData, notes_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '6px 8px', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0 14px', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingFood}
                    style={{ padding: '0 18px', height: '34px', borderRadius: '8px', border: 'none', background: '#101828', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Save size={13} />
                    <span>{savingFood ? 'جاري الحفظ...' : 'حفظ الصنف في المكتبة'}</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
