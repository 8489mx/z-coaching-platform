import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Hourglass, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Check, 
  TrendingUp
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function CoachCommandCenter() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // إحصائيات سريعة للـ KPI Cards
  const stats = [
    { title: 'إجمالي المشتركين النشطين', value: '48', trend: '+12%', trendLabel: 'هذا الشهر', icon: Users, color: '#170c5c', bg: '#EDE9FE', border: '#C4B5FD' },
    { title: 'متابعات تنتظر الاعتماد', value: '2', trend: 'عاجل', trendLabel: 'اليوم', icon: Clock, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
    { title: 'طوارئ المفاصل والعيادة', value: '1', trend: 'طوارئ', trendLabel: 'تدخل عاجل', icon: ShieldAlert, color: '#DC2626', bg: '#FEE2E2', border: '#FECDD3' },
    { title: 'تجديدات خلال 7 أيام', value: '3', trend: 'تنبيه', trendLabel: 'باقات منتهية', icon: Hourglass, color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  ];

  // المهام والإجراءات اليومية
  const [dailyActions, setDailyActions] = useState([
    {
      id: 'ACT_01',
      type: 'CHECKIN',
      clientName: 'سارة المنصوري',
      tier: 'باقة MAX',
      phone: '+966501234567',
      summary: 'نزول 1.6 كجم من الوزن والمحيطات في أسبوعين.',
      suggestedAction: 'الاستمرار بنفس العجز السعري وتثبيت الماكروز.',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      badgeText: 'متابعة أسبوعية'
    },
    {
      id: 'ACT_02',
      type: 'CLINICAL',
      clientName: 'ياسمين فهد',
      tier: 'باقة ELITE',
      phone: '+971509876543',
      summary: 'نغزة ألم في الكتف الأيمن (6/10) أثناء تمرين Overhead Press.',
      suggestedAction: 'استبدال البار بقبضة دمبل محايدة مائلة وتفعيل روتين الكفة المدورة.',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeBorder: '#FECDD3',
      badgeText: 'تنبيه مفصلي'
    },
    {
      id: 'ACT_03',
      type: 'INACTIVE',
      clientName: 'حسام البدري',
      tier: 'باقة MAX',
      phone: '+201012345678',
      summary: 'لم يسجل أي تمرين أو وجبة منذ أكثر من 48 ساعة.',
      suggestedAction: 'إرسال رسالة تشجيع واطمئنان على الواتساب.',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      badgeBorder: '#FDE68A',
      badgeText: 'انقطاع 48 ساعة'
    },
    {
      id: 'ACT_04',
      type: 'RENEWAL',
      clientName: 'أحمد فتحي',
      tier: 'باقة ELITE',
      phone: '+201123456789',
      summary: 'متبقي 3 أيام على نهاية باقة الـ 16 أسبوعاً (إنجاز -13.5 كجم).',
      suggestedAction: 'إرسال عرض تجديد الدايت العكسي والبناء العضلي الصافي.',
      badgeColor: '#4F46E5',
      badgeBg: '#EEF2FF',
      badgeBorder: '#C7D2FE',
      badgeText: 'تجديد اشتراك'
    }
  ]);

  const filteredActions = dailyActions.filter(act => activeTab === 'ALL' || act.type === activeTab);

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div className="page-stack" dir="rtl" style={{ gap: '20px' }}>
        
        {/* 1. Page Header matching D:\zn */}
        <PageHeader
          title="لوحة التحكم والقرارات اليومية"
          description="مؤشرات الأداء المباشرة، طابور المتابعات الأسبوعية، والقرارات السريرية المطلوب اعتمادها."
          badge={<span className="nav-pill" style={{ background: '#EDE9FE', color: '#170c5c', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px' }}>مركز العمليات</span>}
          actions={(
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                height: '38px',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>كود مشترك جديد</span>
            </button>
          )}
        />

        {/* 2. Executive KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            return (
              <div 
                key={i} 
                className="dashboard-premium-card"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: st.bg, color: st.color, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={17} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                    {st.value}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: st.bg, color: st.color, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                    <span dir="ltr">{st.trend}</span>
                    <span>{st.trendLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Balanced Dual Column Layout (70 / 30) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
          
          {/* Main Action Feed (Right in RTL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <FormSection 
              title="طابور القرارات والمتابعات اليومية" 
              description="الإجراءات والمراجعات المطلوب اعتمادها وإرسالها للمشتركين."
              actions={(
                <div className="filter-chip-row" style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {[
                    { id: 'ALL', label: 'الكل' },
                    { id: 'CHECKIN', label: 'المتابعات' },
                    { id: 'CLINICAL', label: 'العيادة' },
                    { id: 'INACTIVE', label: 'الانقطاع' },
                    { id: 'RENEWAL', label: 'التجديد' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: activeTab === tab.id ? 800 : 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === tab.id ? '#170c5c' : 'transparent',
                        color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                        boxShadow: activeTab === tab.id ? '0 2px 6px rgba(23, 12, 92, 0.2)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
              className="dashboard-premium-card"
            >
              {/* Action Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                {filteredActions.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      رائع! تم إنهاء كافة الإجراءات والمتابعات لليوم
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                      كافة المراجعات والتنبيهات المندرجة تحت هذا التبويب معتمدة بنسبة 100%.
                    </p>
                  </div>
                ) : (
                  filteredActions.map(action => (
                    <div
                      key={action.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', fontFamily: 'monospace' }}>
                            {'#' + action.id.replace('ACT_0', '')}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                                {action.clientName}
                              </strong>
                              <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                {action.tier}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: action.badgeBg, color: action.badgeColor, border: `1px solid ${action.badgeBorder}` }}>
                                {action.badgeText}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>{action.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
                        <div style={{ color: '#1E293B', marginBottom: '4px' }}>
                          <strong style={{ color: '#0F172A' }}>الحالة:</strong> {action.summary}
                        </div>
                        <div style={{ color: '#0369A1', fontWeight: 800 }}>
                          <strong style={{ color: '#0F172A' }}>القرار المقترح:</strong> {action.suggestedAction}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={'https://wa.me/' + action.phone.replace(/\D/g, '')}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <MessageCircle size={14} color="#16A34A" />
                          <span>محادثة واتساب</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setDailyActions(dailyActions.filter(a => a.id !== action.id));
                          }}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            background: '#170c5c',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(23, 12, 92, 0.25)'
                          }}
                        >
                          <Check size={14} />
                          <span>اعتماد وتحديث الخطة</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </FormSection>
          </div>

          {/* Side Column (Left in RTL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Clinical Alerts Card */}
            <FormSection 
              title="رادار الطوارئ السريرية" 
              description="تنبيهات الآلام والمفاصل والتدخلات العاجلة."
              actions={<span className="nav-pill" style={{ background: '#FEE2E2', color: '#DC2626', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>1 حالة نشطة</span>}
              className="dashboard-premium-card"
            >
              <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  ياسمين فهد (إصابة كتف أيمن)
                </strong>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                  تم عزل تمارين البار واستبدالها بالدمبل المحايد تلقائياً لحماية الكفة المدورة.
                </p>
                <Link
                  to="/exercises"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#170c5c',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '8px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  استعراض بروتوكول التأهيل
                </Link>
              </div>
            </FormSection>

            {/* Package Distribution Card */}
            <FormSection 
              title="توزيع الباقات النشطة" 
              description="نسبة المشتركين بين باقات Elite و Max."
              className="dashboard-premium-card"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة MAX</span>
                    <strong style={{ color: '#C89327', fontWeight: 800 }}>32 مشترك (67%)</strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '8px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#C89327', height: '100%', width: '67%', borderRadius: '6px' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة ELITE</span>
                    <strong style={{ color: '#170c5c', fontWeight: 800 }}>16 مشترك (33%)</strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '8px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#170c5c', height: '100%', width: '33%', borderRadius: '6px' }}></div>
                  </div>
                </div>
              </div>
            </FormSection>

          </div>

        </div>

        {/* New Client Modal */}
        <NewClientQuickModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={(newClient) => {
            console.log('Client created:', newClient);
          }}
        />

      </div>
    </AdminLayout>
  );
}
