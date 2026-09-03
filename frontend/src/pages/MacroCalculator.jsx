import React, { useState, useEffect } from 'react';
import { Calculator, Flame, Zap, Dumbbell, Droplet, Footprints, Activity, Copy, Check, Save, RotateCw, MessageCircle, Sparkles, UtensilsCrossed, Search, Plus, Edit2, Trash2, X, Apple, Fish, Beef, Wheat, ShieldAlert, Info, CheckCircle2, Layers, Scale, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { copyToClipboard } from '../utils/clipboardUtils';
import { calculateMetabolicMacroProfile, DAILY_ACTIVITY_FACTORS, WORKOUT_FREQUENCY_FACTORS, GOAL_CALORIE_MULTIPLIERS } from '../utils/metabolicMacroEngine';
import { DEFAULT_FOOD_CATALOG } from '../data/defaultFoodsCatalog';

export default function MacroCalculator() {
  // Navigation Tabs: 'CATALOG' (Food Library) or 'CALCULATOR' (Macro Engine)
  const [activeTab, setActiveTab] = useState('CATALOG');

  // --- FOOD CATALOG STATES ---
  const [foods, setFoods] = useState(DEFAULT_FOOD_CATALOG);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [copiedFoodId, setCopiedFoodId] = useState(null);
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' (Compact Cards) or 'TABLE' (Dense Table)

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

  const handleCopyFoodNutrition = (food) => {
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
      const q = searchTerm.toLowerCase().trim();
      const matchNameAr = f.name_ar && f.name_ar.toLowerCase().includes(q);
      const matchNameEn = f.name_en && f.name_en.toLowerCase().includes(q);
      const matchCategory = f.category_ar && f.category_ar.toLowerCase().includes(q);
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

  const bmr = metabolic.bmr_kcal;
  const tdee = metabolic.tdee_kcal;
  const targetCalories = metabolic.target_calories_kcal;
  const targetProteinGrams = metabolic.macro_targets.protein_g;
  const targetFatGrams = metabolic.macro_targets.fat_g;
  const targetCarbGrams = metabolic.macro_targets.carbs_g;
  const proteinCalories = targetProteinGrams * 4;
  const fatCalories = targetFatGrams * 9;
  const carbsCalories = targetCarbGrams * 4;
  const waterTargetLiters = metabolic.water_target_liters.toFixed(1);
  const stepsTarget = metabolic.steps_target;

  const handleApplyToClient = async () => {
    if (!selectedClient) {
      alert('يرجى اختيار متدرب أولاً');
      return;
    }

    try {
      setCalcSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${selectedClient}`);
      const progData = await res.json();
      
      const master = progData.master_program || {};
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
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Page Header with Main Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UtensilsCrossed size={22} color="#0284C7" />
              <span>مكتبة التغذية والأطعمة ومحرك الماكروز</span>
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              قاعدة بيانات الأغذية الكاملة، الماكروز الدقيقة لكل 100 جرام، وحاسبة معدل الأيض والتوزيع الرياضي.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setActiveTab('CATALOG')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'CATALOG' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'CATALOG' ? '#0F172A' : '#64748B',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: activeTab === 'CATALOG' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <UtensilsCrossed size={14} color={activeTab === 'CATALOG' ? '#0284C7' : '#64748B'} />
              <span>مكتبة الأطعمة والماكروز ({foods.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CALCULATOR')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'CALCULATOR' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'CALCULATOR' ? '#0F172A' : '#64748B',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: activeTab === 'CALCULATOR' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Calculator size={14} color={activeTab === 'CALCULATOR' ? '#0284C7' : '#64748B'} />
              <span>حاسبة معدل الأيض والأهداف</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: FOOD CATALOG & NUTRITION LIBRARY */}
        {/* ========================================================================= */}
        {activeTab === 'CATALOG' && (
          <div>
            {/* Filter & Control Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
              
              {/* Top Search & Actions Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '9px' }} />
                  <input
                    type="text"
                    placeholder="ابحث عن أي صنف طعام (دجاج، أرز، شوفان، سلمون...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 30px 0 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', left: '8px', top: '7px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Food State Filter */}
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="ALL">جميع حالات الطهي</option>
                    <option value="COOKED">مطبوخ ومجهز (Cooked)</option>
                    <option value="RAW">طازج / نيء (Raw)</option>
                  </select>

                  {/* Add Food Button */}
                  <button
                    type="button"
                    onClick={openAddFoodModal}
                    style={{
                      height: '32px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)'
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
                        padding: '4px 9px',
                        borderRadius: '5px',
                        border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSelected ? '#0F172A' : '#FFFFFF',
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
                        borderRadius: '4px',
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
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCw size={22} className="animate-spin" color="#0284C7" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>جاري تحميل مكتبة الأغذية...</div>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={28} color="#94A3B8" style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginBottom: '2px' }}>لا توجد أطعمة مطابقة للبحث</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>جرب تغيير تصنيف البحث أو إضافة صنف طعام جديد.</div>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)', minHeight: '350px' }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
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
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Column 1: Food Name + State + Category Badges */}
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                              <span style={{ color: '#0F172A', fontSize: '13px', fontWeight: 800 }}>
                                {food.name_ar}
                              </span>
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: food.food_state === 'COOKED' ? '#F1F5F9' : '#FEF2F2',
                                border: `1px solid ${food.food_state === 'COOKED' ? '#CBD5E1' : '#FECACA'}`,
                                color: food.food_state === 'COOKED' ? '#334155' : '#DC2626'
                              }}>
                                {food.food_state === 'COOKED' ? 'مطبوخ' : 'طازج'}
                              </span>
                              <span style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: food.macro_type === 'PROTEIN' ? '#F0F9FF' : food.macro_type === 'CARBS' ? '#FFFBEB' : food.macro_type === 'FATS' ? '#F0FDF4' : '#F8FAFC',
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
                              background: '#F8FAFC', border: '1px solid #E2E8F0',
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
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
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
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
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
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
            
            {/* Left Column: Metabolic & Goals Input Form */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} color="#0284C7" />
                <span>بيانات المتدرب والمستوى البدني</span>
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#64748B' }}>
                إدخال القياسات الحيوية، مستوى النشاط، ونمط التدريب.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    النوع (الجنس)
                  </label>
                  <select
                    value={calcForm.gender}
                    onChange={(e) => setCalcForm({ ...calcForm, gender: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    العمر (سنة)
                  </label>
                  <input
                    type="number"
                    value={calcForm.age}
                    onChange={(e) => setCalcForm({ ...calcForm, age: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    الوزن (كجم)
                  </label>
                  <input
                    type="number"
                    value={calcForm.weight}
                    onChange={(e) => setCalcForm({ ...calcForm, weight: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    الطول (سم)
                  </label>
                  <input
                    type="number"
                    value={calcForm.height}
                    onChange={(e) => setCalcForm({ ...calcForm, height: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    نسبة الدهون %
                  </label>
                  <input
                    type="number"
                    value={calcForm.bodyFat}
                    onChange={(e) => setCalcForm({ ...calcForm, bodyFat: Number(e.target.value) })}
                    placeholder="اختياري"
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    النشاط والحركة اليومية (NEAT)
                  </label>
                  <select
                    value={calcForm.dailyActivity}
                    onChange={(e) => setCalcForm({ ...calcForm, dailyActivity: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                  >
                    {Object.entries(DAILY_ACTIVITY_FACTORS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label_ar} (x{v.factor})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    تكرار تمارين المقاومة (EAT)
                  </label>
                  <select
                    value={calcForm.workoutFrequency}
                    onChange={(e) => setCalcForm({ ...calcForm, workoutFrequency: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', outline: 'none' }}
                  >
                    {Object.entries(WORKOUT_FREQUENCY_FACTORS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label_ar} (+{v.factor})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  الهدف المستهدف
                </label>
                <select
                  value={calcForm.goal}
                  onChange={(e) => setCalcForm({ ...calcForm, goal: e.target.value })}
                  style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 800, color: '#0284C7', background: '#F0F9FF', outline: 'none' }}
                >
                  {Object.entries(GOAL_CALORIE_MULTIPLIERS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label_ar}</option>
                  ))}
                </select>
              </div>

              {/* Protein Slider */}
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                    احتياج البروتين لكل كجم وزن
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#0284C7', background: '#E0F2FE', padding: '1px 6px', borderRadius: '4px' }}>
                    {calcForm.proteinPerKg} جم / كجم
                  </span>
                </div>
                <input
                  type="range"
                  min="1.4"
                  max="3.0"
                  step="0.1"
                  value={calcForm.proteinPerKg}
                  onChange={(e) => setCalcForm({ ...calcForm, proteinPerKg: parseFloat(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

            </div>

            {/* Right Column: Calculated Results & Sync Action */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#DC2626" />
                <span>نتائج الطاقة والماكروز المستهدفة</span>
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#64748B' }}>
                التقسيم الرياضي الدقيق للسعرات والجرامات اليومية.
              </p>

              {/* BMR & TDEE Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>معدل الحرق الأساسي (BMR)</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>{bmr} <small style={{ fontSize: '10px' }}>kcal</small></div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>استهلاك الطاقة (TDEE)</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>{tdee} <small style={{ fontSize: '10px' }}>kcal</small></div>
                </div>
              </div>

              {/* Highlight Target Calories */}
              <div style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.9 }}>السعرات اليومية المستهدفة للخطة</div>
                <div style={{ fontSize: '24px', fontWeight: 900 }}>
                  {targetCalories} <span style={{ fontSize: '13px', fontWeight: 700 }}>سعرة حرارية</span>
                </div>
              </div>

              {/* Macro 3-Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#0284C7' }}>البروتين</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{targetProteinGrams} <small style={{ fontSize: '10px' }}>جم</small></div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>{proteinCalories} kcal</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#D97706' }}>الكارب</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{targetCarbGrams} <small style={{ fontSize: '10px' }}>جم</small></div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>{carbsCalories} kcal</div>
                </div>

                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#16A34A' }}>الدهون</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{targetFatGrams} <small style={{ fontSize: '10px' }}>جم</small></div>
                  <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>{fatCalories} kcal</div>
                </div>
              </div>

              {/* Water & Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplet size={14} color="#0284C7" />
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700 }}>احتياج الماء</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>{waterTargetLiters} لتر / يوم</div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="#16A34A" />
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700 }}>جلسة الكارديو</div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>30 دقيقة / 4 أيام</div>
                  </div>
                </div>
              </div>

              {/* Sync to Client Program */}
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  تطبيق هذه الماكروز فوراً على خطة متدرب:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{ flex: 1, height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 600, outline: 'none' }}
                  >
                    <option value="">-- اختر متدرب لتطبيق الخطة فوراً --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email || c.phone_number})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyToClient}
                    disabled={calcSaving}
                    style={{
                      padding: '0 12px',
                      height: '34px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Save size={13} />
                    <span>{calcSaving ? 'جاري...' : 'تطبيق'}</span>
                  </button>
                </div>
              </div>

              {/* Copy WhatsApp Summary */}
              <button
                type="button"
                onClick={handleCopyCalcSummary}
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '6px',
                  border: calcCopied ? '1px solid #86EFAC' : '1px solid #86EFAC',
                  background: calcCopied ? '#F0FDF4' : '#F0FDF4',
                  color: '#16A34A',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {calcCopied ? <Check size={14} /> : <MessageCircle size={14} />}
                <span>{calcCopied ? 'تم نسخ التقرير بنجاح' : 'نسخ ملخص الماكروز للواتساب'}</span>
              </button>

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
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      style={{ width: '100%', height: '32px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '32px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Macro Type, Category & State */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      نوع الماكرو الأساسي
                    </label>
                    <select
                      value={foodFormData.macro_type}
                      onChange={(e) => setFoodFormData({ ...foodFormData, macro_type: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="PROTEIN">بروتين (Protein)</option>
                      <option value="CARBS">كاربوهيدرات (Carbs)</option>
                      <option value="FATS">دهون صحية (Fats)</option>
                      <option value="VEGGIE">خضروات (Vegetables)</option>
                      <option value="FRUIT">فواكه (Fruits)</option>
                    </select>
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
                      style={{ width: '100%', height: '32px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                      حالة الطهي
                    </label>
                    <select
                      value={foodFormData.food_state}
                      onChange={(e) => setFoodFormData({ ...foodFormData, food_state: e.target.value })}
                      style={{ width: '100%', height: '32px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="COOKED">مطبوخ ومجهز</option>
                      <option value="RAW">طازج / نيء</option>
                    </select>
                  </div>
                </div>

                {/* Macro Inputs (per 100g) */}
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                    القيم الغذائية لكل 100 جرام:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '6px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                        السعرات (kcal)
                      </label>
                      <input
                        type="number"
                        value={foodFormData.calories_per_100g}
                        onChange={(e) => setFoodFormData({ ...foodFormData, calories_per_100g: Number(e.target.value) })}
                        style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 4px', fontSize: '11.5px', fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '6px 8px', fontSize: '11px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0 14px', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingFood}
                    style={{ padding: '0 18px', height: '34px', borderRadius: '6px', border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
