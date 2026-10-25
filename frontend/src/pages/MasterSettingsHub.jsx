import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, ChevronUp, ChevronDown, Save, 
  CheckCircle2, User, Phone, CreditCard, Globe, Award, Activity, 
  Droplets, Footprints, Building2, Loader2, MessageSquare, FileText, Check
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditQuestionModal from '../components/modals/EditQuestionModal';
import EditPackageModal from '../components/modals/EditPackageModal';
import { PageHeader } from '@/shared/components/page-header';
import { TableSearch } from '@/shared/components/table-search';
import { FormSection } from '@/shared/components/form-section';
import { getStoredCoachConfig, saveCoachConfig, syncCoachConfigFromServer, persistCoachConfigToServer } from '../utils/themeAndCoachConfig';
import { arabicSearchMatch } from '../utils/searchUtils';

const SECTION_TRANSLATIONS = {
  personal: 'البيانات الشخصية',
  goals: 'الأهداف الرياضية',
  measurements: 'القياسات البدنية',
  lifestyle: 'أسلوب الحياة والنشاط',
  medical: 'الحالة الطبية والإصابات',
  nutrition: 'التغذية والوجبات',
  training: 'التدريب والكارديو'
};

const TYPE_TRANSLATIONS = {
  text: 'نص قصير',
  textarea: 'نص تفصيلي',
  number: 'رقمي',
  select: 'قائمة منسدلة',
  'pill-select': 'أزرار اختيار',
  'multi-pill-select': 'اختيار متعدد',
  date: 'تاريخ',
  boolean: 'نعم / لا'
};

const sectionsList = [
  { id: 'ALL', label: 'جميع الأقسام' },
  { id: 'personal', label: 'البيانات الشخصية' },
  { id: 'goals', label: 'الأهداف' },
  { id: 'measurements', label: 'القياسات' },
  { id: 'lifestyle', label: 'أسلوب الحياة' },
  { id: 'medical', label: 'الحالة الطبية' },
  { id: 'nutrition', label: 'التغذية' },
  { id: 'training', label: 'التدريب' }
];

export default function MasterSettingsHub() {
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'system';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [_loading, setLoading] = useState(false);
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

  // Coach Studio & System Config State
  const [coachConfig, setCoachConfig] = useState(getStoredCoachConfig());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  const handleSaveSystemSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const saved = saveCoachConfig(coachConfig);
      await persistCoachConfigToServer(coachConfig);
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
    fetchSystemSettings();
    fetchPackages();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const cfg = await syncCoachConfigFromServer();
      if (cfg) {
        setCoachConfig(cfg);
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

  const filteredQuestions = questions.filter(q => {
    const matchSection = selectedSection === 'ALL' || q.section === selectedSection;
    const matchSearch = !questionSearch.trim() || 
      arabicSearchMatch(q.title_ar, questionSearch) ||
      arabicSearchMatch(q.placeholder_ar, questionSearch);
    return matchSection && matchSearch;
  });

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: 'Cairo, sans-serif' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="إعدادات وهوية المنظومة"
          description="التحكم المركزي في هوية المنظومة، تخصيصات الكوتش، واستمارة الاشتراك."
        />

        {/* 2. Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          padding: '8px 14px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.03)'
        }}>
          
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'system', label: 'تخصيص وهوية الكوتش (System & Studio)', icon: User },
              { id: 'packages', label: 'باقات الاشتراك والأسعار (Packages)', icon: CreditCard },
              { id: 'intake', label: 'محرر استمارة الاشتراك (Intake Builder)', icon: Layers },
            ].map(tab => {
              const Icon = tab.icon;
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isSel ? 700 : 600,
                    border: isSel ? '1px solid #673DE6' : '1px solid #EAECF0',
                    cursor: 'pointer',
                    background: isSel ? '#673DE6' : '#FFFFFF',
                    color: isSel ? '#FFFFFF' : '#344054',
                    boxShadow: isSel ? '0 2px 6px rgba(103, 61, 230, 0.22)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel) {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel) {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#EAECF0';
                    }
                  }}
                >
                  <Icon size={14} />
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
              style={{
                padding: '0 16px',
                height: '34px',
                borderRadius: '8px',
                background: '#673DE6',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(103, 61, 230, 0.22)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
            >
              <Plus size={14} />
              <span>إضافة باقة جديدة</span>
            </button>
          )}

          {activeTab === 'intake' && (
            <button
              type="button"
              onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}
              style={{
                padding: '0 16px',
                height: '34px',
                borderRadius: '8px',
                background: '#673DE6',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(103, 61, 230, 0.22)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
            >
              <Plus size={14} />
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
                <TableSearch
                  value={questionSearch}
                  onChange={setQuestionSearch}
                  placeholder="ابحث في الأسئلة..."
                  width="200px"
                  showShortcut={false}
                />
                <div style={{ display: 'inline-flex', gap: '3px', background: '#F2F4F7', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
                  {sectionsList.map(sec => {
                    const isSel = selectedSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedSection(sec.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: isSel ? 700 : 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: isSel ? '#673DE6' : 'transparent',
                          color: isSel ? '#FFFFFF' : '#475569',
                          boxShadow: isSel ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {sec.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          >
            <div style={{ overflowX: 'auto', border: '1px solid #EAECF0', borderRadius: '12px', marginTop: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #EAECF0', color: '#475467', fontWeight: 600, fontSize: '12px' }}>
                    <th style={{ padding: '12px 16px', width: '75px', textAlign: 'center' }}>الترتيب</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>نص السؤال</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '150px' }}>القسم</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '130px' }}>نوع الحقل</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '150px' }}>الإلزامية والتفعيل</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '100px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px 16px', textAlign: 'center', color: '#667085', fontSize: '13px' }}>
                        لا توجد أسئلة مطابقة للقسم أو البحث المحدد
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q, idx) => (
                      <tr 
                        key={q.id || idx} 
                        style={{ borderBottom: '1px solid #F2F4F7', transition: 'background 0.12s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* 1. Order */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '12px', color: '#475467' }}>
                              #{idx + 1}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <button 
                                type="button" 
                                onClick={() => handleMoveQuestion(idx, 'up')} 
                                disabled={idx === 0} 
                                style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: 0, color: idx === 0 ? '#CBD5E1' : '#64748B' }}
                                title="تحريك لأعلى"
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleMoveQuestion(idx, 'down')} 
                                disabled={idx === questions.length - 1} 
                                style={{ border: 'none', background: 'transparent', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', padding: 0, color: idx === questions.length - 1 ? '#CBD5E1' : '#64748B' }}
                                title="تحريك لأسفل"
                              >
                                <ChevronDown size={12} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 2. Title & Placeholder */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <strong style={{ color: '#101828', fontSize: '13px', display: 'block' }}>
                            {q.title_ar}
                          </strong>
                          {q.placeholder_ar && (
                            <span style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                              {q.placeholder_ar}
                            </span>
                          )}
                        </td>

                        {/* 3. Section Badge */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            background: '#F4F0FD',
                            border: '1px solid #DDD6FE',
                            color: '#673DE6',
                            padding: '2px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-block'
                          }}>
                            {SECTION_TRANSLATIONS[q.section] || q.section}
                          </span>
                        </td>

                        {/* 4. Type Badge */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            background: '#F8FAFC',
                            border: '1px solid #EAECF0',
                            color: '#475467',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}>
                            {TYPE_TRANSLATIONS[q.type] || q.type}
                          </span>
                        </td>

                        {/* 5. Required & Active Toggles */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleQuestionRequired(q)}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: q.required ? '1px solid #FECDCA' : '1px solid #EAECF0',
                                background: q.required ? '#FEF3F2' : '#F8FAFC',
                                color: q.required ? '#B42318' : '#667085',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              title="انقر لتبديل درجة الإلزامية"
                            >
                              {q.required ? 'إجباري *' : 'اختياري'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleQuestionActive(q)}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: q.active ? '1px solid #A6F4C7' : '1px solid #EAECF0',
                                background: q.active ? '#ECFDF3' : '#F8FAFC',
                                color: q.active ? '#027A48' : '#94A3B8',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              title="انقر لتبديل حالة الظهور"
                            >
                              {q.active ? 'مفعّل' : 'مخفي'}
                            </button>
                          </div>
                        </td>

                        {/* 6. Actions */}
                        <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button 
                              type="button" 
                              onClick={() => { setEditingQuestion(q); setQuestionModalOpen(true); }}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid #D0D5DD',
                                background: '#FFFFFF',
                                color: '#475467',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.color = '#673DE6';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#475467';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              }}
                              title="تعديل السؤال"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteQuestion(q.id)}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid #FECDCA',
                                background: '#FEF3F2',
                                color: '#B42318',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FEE2E2';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FEF3F2';
                              }}
                              title="حذف السؤال"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '10px' }}>
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  style={{ 
                    background: '#FFFFFF', 
                    border: '1px solid #EAECF0', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    gap: '14px', 
                    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                    transition: 'box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      {pkg.badge_ar ? (
                        <span style={{
                          background: '#F4F0FD',
                          border: '1px solid #DDD6FE',
                          color: '#673DE6',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {pkg.badge_ar}
                        </span>
                      ) : <span />}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <strong style={{ fontSize: '20px', color: '#101828', fontFamily: 'JetBrains Mono, Cairo', fontWeight: 800 }}>
                          {pkg.price_egp}
                        </strong>
                        <span style={{ fontSize: '11.5px', color: '#667085', fontWeight: 600 }}>ج.م</span>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: '#101828' }}>
                      {pkg.name_ar}
                    </h4>

                    <span style={{ color: '#667085', fontSize: '11.5px', display: 'block', marginBottom: '10px' }}>
                      المدة: {pkg.total_months || (Number(pkg.duration_months || 0) + Number(pkg.free_months || 0))} شهور 
                      {pkg.free_months > 0 ? ` (${pkg.duration_months} أساسي + ${pkg.free_months} مجاناً)` : ''}
                    </span>
                    
                    <ul style={{ margin: 0, padding: '0 18px', fontSize: '12px', color: '#475467', lineHeight: 1.7 }}>
                      {(pkg.features || []).map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F2F4F7' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: pkg.active ? '#027A48' : '#94A3B8', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={pkg.active} 
                        onChange={() => handleTogglePackageActive(pkg)} 
                        style={{ width: '15px', height: '15px', accentColor: '#673DE6' }}
                      />
                      <span>{pkg.active ? 'باقة نشطة' : 'معطلة'}</span>
                    </label>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        onClick={() => { setEditingPackage(pkg); setPackageModalOpen(true); }}
                        style={{
                          height: '30px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #D0D5DD',
                          background: '#FFFFFF',
                          color: '#344054',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                        }}
                      >
                        تعديل
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeletePackage(pkg.id)}
                        style={{
                          height: '30px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #FECDCA',
                          background: '#FEF3F2',
                          color: '#B42318',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* ================= TAB 3: COACH STUDIO & SYSTEM CONFIG ================= */}
        {activeTab === 'system' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Feedback Alert if saved */}
            {saveSuccessMsg && (
              <div 
                style={{ 
                  background: '#ECFDF3', 
                  border: '1px solid #A6F4C7', 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  color: '#027A48', 
                  fontWeight: 700, 
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(2, 122, 72, 0.08)'
                }}
              >
                <CheckCircle2 size={18} color="#027A48" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* 1. Coach Personal & Client-Facing Profile */}
            <FormSection
              title="الملف التعريفي للكوتش وهوية المنصة"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '4px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                    اسم الكوتش الرسمي (يظهر في الهيدر والتقارير) *
                  </label>
                  <input
                    type="text"
                    value={coachConfig.coachName || ''}
                    onChange={(e) => setCoachConfig({ ...coachConfig, coachName: e.target.value })}
                    placeholder="مثال: كريم زكريا / Karim Zakaria"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF', color: '#101828' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                    المسمى المهني والتخصص والشهادات *
                  </label>
                  <input
                    type="text"
                    value={coachConfig.coachTitle || ''}
                    onChange={(e) => setCoachConfig({ ...coachConfig, coachTitle: e.target.value })}
                    placeholder="مثال: أخصائي تغذية رياضية وإعداد بدني معتمد"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF', color: '#101828' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                    اسم المنصة / البراند التجاري *
                  </label>
                  <input
                    type="text"
                    value={coachConfig.brandTitle || ''}
                    onChange={(e) => setCoachConfig({ ...coachConfig, brandTitle: e.target.value })}
                    placeholder="مثال: Z COACHING"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: '#FFFFFF', color: '#101828' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                    رقم الواتساب الرسمي المباشر للدعم والتنبيهات *
                  </label>
                  <input
                    type="text"
                    value={coachConfig.whatsappNumber || ''}
                    onChange={(e) => setCoachConfig({ ...coachConfig, whatsappNumber: e.target.value })}
                    placeholder="2010XXXXXXXX"
                    dir="ltr"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 14px', fontSize: '13px', fontFamily: 'JetBrains Mono, Cairo', outline: 'none', boxSizing: 'border-box', textAlign: 'right', background: '#FFFFFF', color: '#101828' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#344054', marginBottom: '4px' }}>
                    رابط إنستغرام أو صفحة السوشيال ميديا
                  </label>
                  <input
                    type="text"
                    value={coachConfig.instagramUrl || ''}
                    onChange={(e) => setCoachConfig({ ...coachConfig, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/yourhandle"
                    dir="ltr"
                    style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D0D5DD', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', textAlign: 'right', background: '#FFFFFF', color: '#101828' }}
                  />
                </div>

              </div>
            </FormSection>

            {/* 5. Action Save Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              padding: '12px 20px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)'
            }}>
              <button
                type="button"
                onClick={fetchSystemSettings}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '8px',
                  border: '1px solid #D0D5DD',
                  background: '#FFFFFF',
                  color: '#344054',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                إلغاء التغييرات
              </button>

              <button
                type="button"
                onClick={handleSaveSystemSettings}
                disabled={saving}
                style={{
                  height: '38px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: saveSuccessMsg ? '#027A48' : '#673DE6',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(103, 61, 230, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!saveSuccessMsg) e.currentTarget.style.background = '#5025D1';
                }}
                onMouseLeave={(e) => {
                  if (!saveSuccessMsg) e.currentTarget.style.background = '#673DE6';
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : saveSuccessMsg ? (
                  <>
                    <CheckCircle2 size={15} />
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

        {/* Floating Toast Notification */}
        {saveSuccessMsg && (
          <div 
            style={{ 
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999999,
              background: '#673DE6',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 30px rgba(103, 61, 230, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <Check size={16} strokeWidth={3} />
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
