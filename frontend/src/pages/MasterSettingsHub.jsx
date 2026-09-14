import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Check, Edit3, Trash2, ChevronUp, ChevronDown, Save, CheckCircle2, Palette, RotateCcw, User, Phone, CreditCard, Globe, Award, Activity, Droplets, Footprints, Building2, Loader2, Eye } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditQuestionModal from '../components/modals/EditQuestionModal';
import EditPackageModal from '../components/modals/EditPackageModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import { THEME_PALETTES, getStoredCoachConfig, saveCoachConfig, deriveThemeColors, syncCoachConfigFromServer, persistCoachConfigToServer } from '../utils/themeAndCoachConfig';
import { arabicSearchMatch } from '../utils/searchUtils';

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

export default function MasterSettingsHub() {
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'system';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Intake Builder State
  const [questions, setQuestions] = useState([]);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  // Packages State
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

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

  const handleSaveSystemSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const saved = saveCoachConfig(coachConfig);
      await persistCoachConfigToServer(coachConfig);
      if (saved) {
        setCoachConfig(saved);
        setSaveSuccessMsg('تم حفظ وتثبيت إعدادات وهوية المنظومة سحابياً بنجاح!');
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
    fetchSystemSettings();
    fetchPackages();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const cfg = await syncCoachConfigFromServer();
      if (cfg) {
        setCoachConfig(cfg);
        setActivePalette(cfg.primaryColor || '#0F172A');
        setCustomColor(cfg.primaryColor || '#0F172A');
      }
    } catch (e) {
      console.warn('fetchSystemSettings error:', e);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages`);
      const data = await res.json();
      if (Array.isArray(data)) setPackages(data);
    } catch (e) {
      console.error('fetchPackages error:', e);
    }
  };

  const handleSavePackage = async (pkgData) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkgData)
      });
      const data = await res.json();
      if (Array.isArray(data)) setPackages(data);
      setPackageModalOpen(false);
      setEditingPackage(null);
    } catch (err) {
      alert('خطأ أثناء حفظ الباقة: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePackageActive = async (pkg) => {
    handleSavePackage({ ...pkg, active: !pkg.active });
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الباقة؟')) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/packages/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (Array.isArray(data)) setPackages(data);
    } catch (err) {
      alert('خطأ أثناء حذف الباقة: ' + err.message);
    } finally {
      setSaving(false);
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

  const sectionsList = [
    { id: 'ALL', label: 'جميع الأقسام' },
    { id: 'personal', label: '1. البيانات الشخصية والأهداف' },
    { id: 'body', label: '2. القياسات وأسلوب الحياة' },
    { id: 'medical', label: '3. الحالة الطبية والإصابات' },
    { id: 'nutrition', label: '4. التغذية والوجبات' },
    { id: 'training', label: '5. التدريب والكارديو' }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchSection = selectedSection === 'ALL' || q.section === selectedSection;
    const matchSearch = !questionSearch.trim() || 
      arabicSearchMatch(q.title_ar, questionSearch) ||
      arabicSearchMatch(q.placeholder_ar, questionSearch);
    return matchSection && matchSearch;
  });

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="إعدادات وهوية المنظومة"
          description="التحكم المركزي في هوية المنظومة، تخصيصات الكوتش، واستمارة الاشتراك."
        />

        {/* 2. Navigation Tabs Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '10px' }}>
          
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'system', label: 'تخصيص وهوية الكوتش (System & Studio)', icon: Palette },
              { id: 'packages', label: 'باقات الاشتراك والأسعار (Packages)', icon: CreditCard },
              { id: 'intake', label: 'محرر استمارة الاشتراك (Intake Builder)', icon: Layers },
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

          {/* Action Buttons */}
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
                <div style={{ display: 'flex', gap: '2px', background: '#F1F5F9', padding: '2px', borderRadius: '8px' }}>
                  {sectionsList.map(sec => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSection(sec.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
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
                        <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 7px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                          {SECTION_TRANSLATIONS[q.section] || q.section}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '1px 7px', borderRadius: '6px', fontSize: '10.5px' }}>
                          {TYPE_TRANSLATIONS[q.type] || q.type}
                        </span>
                      </td>

                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionRequired(q)}
                            style={{ padding: '2px 6px', borderRadius: '6px', border: 'none', background: q.required ? '#FEE2E2' : '#F1F5F9', color: q.required ? '#DC2626' : '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {q.required ? 'إجباري *' : 'اختياري'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionActive(q)}
                            style={{ padding: '2px 6px', borderRadius: '6px', border: 'none', background: q.active ? '#DCFCE7' : '#F1F5F9', color: q.active ? '#16A34A' : '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {q.active ? 'مفعّل' : 'مخفي'}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '8px 12px', textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button type="button" onClick={() => { setEditingQuestion(q); setQuestionModalOpen(true); }} style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ================= TAB 2: PACKAGES ================= */}
        {activeTab === 'packages' && (
          <FormSection
            title="باقات الاشتراك والأسعار المعتمدة"
            description="إدارة الباقات والعروض والشهور المجانية والمميزات لتظهر في استمارة الاشتراك وعروض التجديد."
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginTop: '6px' }}>
              {packages.map((pkg) => (
                <div key={pkg.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800 }}>{pkg.badge_ar}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <strong style={{ fontSize: '18px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{pkg.price_egp}</strong>
                        <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{pkg.name_ar}</h4>
                    <small style={{ color: '#64748B', fontSize: '11px' }}>المدة: {pkg.total_months || (Number(pkg.duration_months || 0) + Number(pkg.free_months || 0))} شهور ({pkg.duration_months} + {pkg.free_months} مجاناً)</small>
                    
                    <ul style={{ margin: '10px 0 0 0', padding: '0 16px', fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
                      {(pkg.features || []).map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: pkg.active ? '#16A34A' : '#94A3B8', cursor: 'pointer' }}>
                      <input type="checkbox" checked={pkg.active} onChange={() => handleTogglePackageActive(pkg)} />
                      <span>{pkg.active ? 'باقة نشطة' : 'معطلة'}</span>
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => { setEditingPackage(pkg); setPackageModalOpen(true); }} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>تعديل</button>
                      <button type="button" onClick={() => handleDeletePackage(pkg.id)} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* ================= TAB 3: COACH STUDIO & SYSTEM CUSTOMIZATION ================= */}
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
                    <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
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
                          borderRadius: '8px',
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px 0 32px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', textAlign: 'right' }}
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
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
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
                    style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 32px 0 10px', fontSize: '12px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
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
                  borderRadius: '8px',
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
