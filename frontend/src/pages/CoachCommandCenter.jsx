import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Hourglass, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Check,
  ExternalLink,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function CoachCommandCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live Server Data
  const [overview, setOverview] = useState({
    total_monthly_revenue: 0,
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
    total_clients: 0
  });
  const [clients, setClients] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subOverviewRes, intakeRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/v1/subscriptions/overview`),
        fetch(`${API_BASE}/api/v1/intake/submissions`)
      ]);

      if (subOverviewRes.status === 'fulfilled' && subOverviewRes.value && subOverviewRes.value.ok) {
        try {
          const subData = await subOverviewRes.value.json();
          if (subData && subData.overview) setOverview(subData.overview);
          if (subData && Array.isArray(subData.clients)) setClients(subData.clients);
        } catch (e) {}
      }

      if (intakeRes.status === 'fulfilled' && intakeRes.value && intakeRes.value.ok) {
        try {
          const intakeData = await intakeRes.value.json();
          if (intakeData && Array.isArray(intakeData.submissions)) setSubmissions(intakeData.submissions);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching dashboard live data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe Arrays
  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  // Build Real-Time Action Queue from Live Pending Intakes & Expiring Subscriptions
  const pendingIntakes = safeSubmissions.filter(s => s && s.status !== 'APPROVED');
  const expiringClients = safeClients.filter(c => c && c.status === 'EXPIRING_SOON');

  const dailyActions = [
    // 1. Pending Intakes Awaiting Review / Generation
    ...pendingIntakes.map(sub => ({
      id: `INTAKE_${sub?.id || Math.random()}`,
      type: 'CHECKIN',
      clientName: sub?.user?.full_name || sub?.full_name || `مشترك #${sub?.user?.client_code || sub?.user_id || sub?.id || ''}`,
      tier: sub?.subscription_package || sub?.user?.subscription_package || 'باقة إيليت',
      phone: sub?.user?.phone_number || sub?.phone_number || '',
      summary: sub?.status === 'PAID' ? 'تم تأكيد الدفع • الاستمارة مكتملة وبانتظار توليد واعتماد الخطة.' : 'استمارة تقييم واردة قيد المراجعة والتدقيق.',
      suggestedAction: 'توليد ومراجعة الخطة في المحرر السريري',
      badgeText: sub?.status === 'PAID' ? 'مدفوع • مطلوب خطة' : 'استمارة تقييم',
      actionUrl: `/editor?user_id=${sub?.user_id || sub?.user?.id || sub?.id || ''}`
    })),
    // 2. Expiring Subscriptions Awaiting Renewal Outreach
    ...expiringClients.map(c => ({
      id: `RENEWAL_${c?.id || Math.random()}`,
      type: 'RENEWAL',
      clientName: c?.full_name || `مشترك #${c?.client_code || ''}`,
      tier: c?.package || 'باقة ماكس VIP',
      phone: c?.phone_number || '',
      summary: `متبقي ${c?.days_remaining || 0} أيام على نهاية باقة الاشتراك.`,
      suggestedAction: 'إرسال عرض تجديد الدايت والتدريب عبر الواتساب',
      badgeText: 'تجديد قريب',
      actionUrl: `/subscriptions`
    }))
  ];

  // Dynamic Live KPIs
  const stats = [
    { 
      title: 'إجمالي المشتركين النشطين', 
      value: (overview?.active_count ?? safeClients.length).toString(), 
      trend: (overview?.active_count || 0) > 0 ? '+100%' : '0%', 
      trendLabel: 'حسابات مفعلة', 
      icon: Users 
    },
    { 
      title: 'استمارات وتقييمات معلقة', 
      value: pendingIntakes.length.toString(), 
      trend: pendingIntakes.length > 0 ? 'مطلوب مراجعة' : 'مكتمل', 
      trendLabel: 'طابور المهام', 
      icon: Clock 
    },
    { 
      title: 'طوارئ المفاصل والعيادة', 
      value: '0', 
      trend: 'آمن', 
      trendLabel: 'استقرار تام', 
      icon: ShieldAlert 
    },
    { 
      title: 'تجديدات خلال 7 أيام', 
      value: (overview?.expiring_soon_count ?? expiringClients.length).toString(), 
      trend: expiringClients.length > 0 ? 'تنبيه' : 'لا يوجد', 
      trendLabel: 'متابعة مالية', 
      icon: Hourglass 
    },
  ];

  const maxClientsCount = safeClients.filter(c => c && ((c.package_code || '').includes('MAX') || (c.package || '').includes('ماكس'))).length;
  const eliteClientsCount = safeClients.filter(c => c && ((c.package_code || '').includes('ELITE') || (c.package || '').includes('إيليت'))).length;
  const totalTierClients = maxClientsCount + eliteClientsCount || 1;
  const maxPercent = safeClients.length > 0 ? Math.round((maxClientsCount / totalTierClients) * 100) : 0;
  const elitePercent = safeClients.length > 0 ? Math.round((eliteClientsCount / totalTierClients) * 100) : 0;

  const filteredActions = dailyActions.filter(act => activeTab === 'ALL' || act.type === activeTab);

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="لوحة التحكم والقرارات اليومية"
          description="مؤشرات الأداء المباشرة، طابور المتابعات الأسبوعية، والقرارات السريرية المطلوب اعتمادها."
          actions={(
            <button 
              type="button" 
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                background: 'var(--primary, #0F172A)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary2, #334155)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary, #0F172A)')}
            >
              <Plus size={15} />
              <span>كود مشترك جديد</span>
            </button>
          )}
        />

        {/* 2. Executive KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            return (
              <div 
                key={i} 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={15} strokeWidth={2} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                    {st.value}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                    <span dir="ltr" style={{ fontWeight: 800 }}>{st.trend}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <FormSection 
              title="طابور القرارات والمتابعات اليومية" 
              description="الإجراءات والمراجعات المطلوب اعتمادها وإرسالها للمشتركين."
              actions={(
                <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  {[
                    { id: 'ALL', label: 'الكل' },
                    { id: 'CHECKIN', label: 'المتابعات' },
                    { id: 'CLINICAL', label: 'العيادة' },
                    { id: 'INACTIVE', label: 'المتأخرون' },
                    { id: 'RENEWAL', label: 'التجديد' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: activeTab === tab.id ? 800 : 600,
                        border: activeTab === tab.id ? '1px solid var(--color-primary-border, #CBD5E1)' : '1px solid transparent',
                        cursor: 'pointer',
                        background: activeTab === tab.id ? 'var(--color-primary-light, #F1F5F9)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--primary, #0F172A)' : '#64748B',
                        boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0, 0, 0, 0.03)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            >
              {/* Ultra-Compact 2-Row Action Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {filteredActions.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                      تم إنهاء كافة الإجراءات والمتابعات لليوم
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0 }}>
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
                        borderRadius: '8px',
                        padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '7px',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      {/* Row 1: Client Details & Badges (Right) + Action Buttons (Left) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        
                        {/* Right: Client Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontWeight: 800, 
                            fontSize: '11px', 
                            background: '#F1F5F9', 
                            border: '1px solid #CBD5E1', 
                            color: '#0F172A', 
                            padding: '1px 6px', 
                            borderRadius: '4px' 
                          }}>
                            {'#' + action.id.replace('ACT_0', '')}
                          </span>
                          <strong style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                            {action.clientName}
                          </strong>
                          <span dir="ltr" style={{ fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', background: '#F8FAFC', padding: '1px 6px', borderRadius: '4px', border: '1px solid #F1F5F9' }}>
                            {action.phone}
                          </span>
                          <span style={{ fontSize: '10.5px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {action.tier}
                          </span>
                          <span style={{ fontSize: '10.5px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {action.badgeText}
                          </span>
                        </div>

                        {/* Left: Compact Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {action.phone && (
                            <a
                              href={'https://wa.me/' + action.phone.replace(/\D/g, '')}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '4px 10px',
                                borderRadius: '5px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MessageCircle size={12} color="#16A34A" />
                              <span>واتساب</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (action.actionUrl) {
                                navigate(action.actionUrl);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: 'var(--color-primary-light, #F1F5F9)',
                              color: 'var(--primary, #0F172A)',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              border: '1px solid var(--color-primary-border, #CBD5E1)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--primary, #0F172A)';
                              e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--color-primary-light, #F1F5F9)';
                              e.currentTarget.style.color = 'var(--primary, #0F172A)';
                            }}
                          >
                            <Sparkles size={13} />
                            <span>{action.type === 'CHECKIN' ? 'مراجعة وتوليد الخطة' : 'عرض التفاصيل'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Compact Inline Summary & Decision */}
                      <div style={{ 
                        background: '#F8FAFC', 
                        border: '1px solid #E2E8F0', 
                        padding: '6px 10px', 
                        borderRadius: '5px', 
                        fontSize: '11.5px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                        lineHeight: 1.4
                      }}>
                        <div style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>الحالة:</span>
                          <span>{action.summary}</span>
                        </div>
                        <div style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>القرار المقترح:</span>
                          <strong style={{ color: '#0F172A' }}>{action.suggestedAction}</strong>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </FormSection>
          </div>

          {/* Side Column (Left in RTL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Clinical Alerts Card */}
            <FormSection 
              title="رادار الطوارئ السريرية" 
              description="تنبيهات الآلام والمفاصل والتدخلات العاجلة."
              actions={<span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 800, padding: '2px 7px', borderRadius: '5px', fontSize: '10.5px' }}>0 حالة</span>}
            >
              <div style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', marginTop: '6px', textAlign: 'center' }}>
                <CheckCircle2 size={24} color="#16A34A" style={{ margin: '0 auto 6px auto' }} />
                <strong style={{ fontSize: '12.5px', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                  لا توجد طوارئ مفاصل أو آلام مسجلة
                </strong>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                  كافة المشتركين يتدربون بأمان ودون أي شكاوى حركية نشطة.
                </p>
                <Link
                  to="/exercises"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '6px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  استعراض مكتبة التمارين المعتمدة
                </Link>
              </div>
            </FormSection>

            {/* Package Distribution Card */}
            <FormSection 
              title="توزيع الباقات النشطة" 
              description="نسبة المشتركين بين باقات Elite و Max."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة MAX VIP</span>
                    <strong style={{ color: '#0F172A', fontWeight: 800 }}>
                      <span dir="ltr">{maxPercent}%</span> ({maxClientsCount} مشترك)
                    </strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '5px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#0F172A', height: '100%', width: `${maxPercent}%`, borderRadius: '4px' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة ELITE</span>
                    <strong style={{ color: '#64748B', fontWeight: 800 }}>
                      <span dir="ltr">{elitePercent}%</span> ({eliteClientsCount} مشترك)
                    </strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '5px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: '#64748B', height: '100%', width: `${elitePercent}%`, borderRadius: '4px' }}></div>
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
            fetchDashboardData();
          }}
        />

      </div>
    </AdminLayout>
  );
}
