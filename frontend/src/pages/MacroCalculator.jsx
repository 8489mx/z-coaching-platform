import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Flame, 
  Zap, 
  Dumbbell, 
  Droplet, 
  Footprints, 
  Copy, 
  Check, 
  Save, 
  RotateCw, 
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { copyToClipboard } from '../utils/clipboardUtils';
import {
  calculateMetabolicMacroProfile,
  DAILY_ACTIVITY_FACTORS,
  WORKOUT_FREQUENCY_FACTORS,
  GOAL_CALORIE_MULTIPLIERS
} from '../utils/metabolicMacroEngine';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function MacroCalculator() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  
  // Calculator Inputs
  const [form, setForm] = useState({
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

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error(e);
    }
  };

  const metabolic = calculateMetabolicMacroProfile({
    gender: form.gender,
    age: form.age,
    weight_kg: form.weight,
    height_cm: form.height,
    body_fat_percent: form.bodyFat || null,
    daily_activity: form.dailyActivity,
    workout_frequency: form.workoutFrequency,
    goal: form.goal,
    protein_per_kg: form.proteinPerKg,
    is_muscular: form.isMuscular
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
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${selectedClient}`);
      const progData = await res.json();
      if (!res.ok) throw new Error(progData.error || 'فشل جلب برنامج المتدرب');

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
      setSaving(false);
    }
  };

  const handleCopyWhatsapp = async () => {
    const text = `🔥 أهداف السعرات والماكروز اليومية المخصصة لك:
🎯 السعرات المستهدفة: ${targetCalories} سعرة
🥩 البروتين: ${targetProteinGrams} جرام (${proteinCalories} kcal)
🍚 الكاربوهيدرات: ${targetCarbGrams} جرام (${carbsCalories} kcal)
🥑 الدهون الصحية: ${targetFatGrams} جرام (${fatCalories} kcal)
💧 احتياج الماء: ${waterTargetLiters} لتر يومياً
👟 الخطوات المستهدفة: ${stepsTarget.toLocaleString()} خطوة

بالتوفيق يا بطل! 🚀`;

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getGoalLabel = (goal) => {
    switch (goal) {
      case 'AGGRESSIVE_CUT': return 'تنشيف سريع قاسي (-25%)';
      case 'FAT_LOSS_STANDARD': return 'تنشيف وحرق دهون (-20%)';
      case 'MAINTENANCE': return 'ثبات وإعادة تشكيل (0%)';
      case 'LEAN_BULK': return 'بناء عضلي صافي (+10%)';
      case 'MAX_BULK': return 'تضخيم وزيادة وزن (+18%)';
      default: return goal;
    }
  };

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="حاسبة معدل الأيض واحتياج الماكروز السريعة"
          description="احتساب BMR و TDEE وتقسيم جرامات البروتين والكاربوهيدرات والدهون مع إمكانية التطبيق الفوري على خطة المتدرب."
        />

        {/* 2. Balanced 2-Column Cockpit Grid (50 / 50) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
          
          {/* Right Column: Physical Inputs */}
          <FormSection
            title="بيانات المتدرب والمستوى البدني"
            description="إدخال القياسات الحيوية، مستوى النشاط، ونمط التدريب."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              
              {/* Gender & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>النوع (الجنس)</label>
                  <select 
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', outline: 'none', background: '#F8FAFC' }}
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>العمر (سنة)</label>
                  <input 
                    type="number" 
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Weight, Height, BodyFat */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>الوزن (كجم)</label>
                  <input 
                    type="number" 
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>الطول (سم)</label>
                  <input 
                    type="number" 
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>نسبة الدهون %</label>
                  <input 
                    type="number" 
                    placeholder="18%"
                    value={form.bodyFat}
                    onChange={(e) => setForm({ ...form, bodyFat: Number(e.target.value) })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* NEAT & EAT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>النشاط والحركة اليومية (NEAT)</label>
                  <select 
                    value={form.dailyActivity}
                    onChange={(e) => setForm({ ...form, dailyActivity: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', background: '#F8FAFC' }}
                  >
                    <option value="SEDENTARY_DESK">مكتبي خامل (1.20)</option>
                    <option value="LIGHT_MOVEMENT">حركة خفيفة 5k-7k (1.30)</option>
                    <option value="STANDING_WALKING">وقوف ومشي 8k-11k (1.45)</option>
                    <option value="HEAVY_PHYSICAL">عمل بدني شاق (1.60)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>تكرار تمارين المقاومة (EAT)</label>
                  <select 
                    value={form.workoutFrequency}
                    onChange={(e) => setForm({ ...form, workoutFrequency: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', outline: 'none', background: '#F8FAFC' }}
                  >
                    <option value="NO_WORKOUTS">بدون تمارين (+0.00)</option>
                    <option value="DAYS_1_TO_2">1 - 2 يوم أسبوعياً (+0.075)</option>
                    <option value="DAYS_3_TO_5">3 - 5 أيام أسبوعياً (+0.150)</option>
                    <option value="DAYS_6_PLUS">6+ أيام مكثفة (+0.250)</option>
                  </select>
                </div>
              </div>

              {/* Goal */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>الهدف المستهدف</label>
                <select 
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', fontWeight: 700, color: '#0F172A', outline: 'none', background: '#F8FAFC' }}
                >
                  <option value="AGGRESSIVE_CUT">تنشيف سريع قاسي (-25% عجز سعرات)</option>
                  <option value="FAT_LOSS_STANDARD">تنشيف وحرق دهون قياسي (-20% عجز سعرات)</option>
                  <option value="MAINTENANCE">ثبات الوزن وإعادة تشكيل الجسم (0%)</option>
                  <option value="LEAN_BULK">بناء عضلي صافي وتضخيم نظيف (+10% فائض)</option>
                  <option value="MAX_BULK">تضخيم وزيادة وزن (+18% فائض)</option>
                </select>
              </div>

              {/* Protein Slider */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', margin: 0 }}>احتياج البروتين لكل كجم وزن</label>
                  <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    {form.proteinPerKg} جم / كجم
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1.6" 
                  max="2.6" 
                  step="0.1"
                  value={form.proteinPerKg}
                  onChange={(e) => setForm({ ...form, proteinPerKg: Number(e.target.value) })}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#0F172A' }}
                />
              </div>

            </div>
          </FormSection>

          {/* Left Column: Calculation Results */}
          <FormSection
            title="نتائج الطاقة والماكروز المستهدفة"
            description="التقسيم الرياضي الدقيق للسعرات والجرامات اليومية."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              
              {/* BMR and TDEE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>معدل الحرق الأساسي (BMR)</span>
                  <strong style={{ fontSize: '16px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {bmr} <span style={{ fontSize: '11px', fontWeight: 600 }}>kcal</span>
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>استهلاك الطاقة (TDEE)</span>
                  <strong style={{ fontSize: '16px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {tdee} <span style={{ fontSize: '11px', fontWeight: 600 }}>kcal</span>
                  </strong>
                </div>
              </div>

              {/* Target Calories Banner in #0F172A */}
              <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 3px 8px rgba(15, 23, 42, 0.25)' }}>
                <span style={{ fontSize: '11px', opacity: 0.85, display: 'block', marginBottom: '2px' }}>السعرات اليومية المستهدفة للخطة</span>
                <strong style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'JetBrains Mono, Cairo', letterSpacing: '-0.5px' }}>
                  {targetCalories} <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.95 }}>سعرة حرارية</span>
                </strong>
              </div>

              {/* Macros Breakdown (3 Cards) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Protein */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', display: 'block' }}>البروتين</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo', display: 'block' }}>
                    {targetProteinGrams} <span style={{ fontSize: '11px' }}>جم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, Cairo' }}>{proteinCalories} kcal</small>
                </div>

                {/* Carbs */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', display: 'block' }}>الكارب</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo', display: 'block' }}>
                    {targetCarbGrams} <span style={{ fontSize: '11px' }}>جم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, Cairo' }}>{carbsCalories} kcal</small>
                </div>

                {/* Fats */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 8px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', display: 'block' }}>الدهون</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo', display: 'block' }}>
                    {targetFatGrams} <span style={{ fontSize: '11px' }}>جم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, Cairo' }}>{fatCalories} kcal</small>
                </div>
              </div>

              {/* Water & Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplet size={14} color="#0F172A" />
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>احتياج الماء</span>
                    <strong style={{ fontSize: '12px', color: '#0F172A' }}>{waterTargetLiters} لتر / يوم</strong>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Footprints size={14} color="#16A34A" />
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>الخطوات اليومية</span>
                    <strong style={{ fontSize: '12px', color: '#0F172A' }}>{stepsTarget.toLocaleString()} خطوة</strong>
                  </div>
                </div>
              </div>

              {/* Apply to Client & Copy WhatsApp Strip */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{ height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 600, color: '#0F172A', outline: 'none' }}
                  >
                    <option value="">-- اختر متدرب لتطبيق الخطة فوراً --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.client_code || c.id}>
                        {c.full_name || `متدرب #${c.client_code}`} (#{c.client_code})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleApplyToClient}
                    disabled={saving || !selectedClient}
                    style={{
                      height: '34px',
                      padding: '0 14px',
                      borderRadius: '6px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                  >
                    <Save size={13} />
                    <span>{saving ? 'جاري التطبيق...' : 'تطبيق'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWhatsapp}
                  style={{
                    height: '32px',
                    borderRadius: '6px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#16A34A',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={13} />
                  <span>{copied ? 'تم النسخ إلى الحافظة بنجاح!' : 'نسخ ملخص الماكروز للواتساب'}</span>
                </button>
              </div>

            </div>
          </FormSection>

        </div>

      </div>
    </AdminLayout>
  );
}
