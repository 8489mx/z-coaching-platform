import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Wallet, 
  Activity, 
  ChevronRight,
  ArrowUpRight,
  Loader2,
  RefreshCcw,
  Clock,
  ShieldCheck,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function CoachAnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/v1/subscriptions/overview');
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'تعذر جلب البيانات من الخادم');
      
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0F172A' }} />
          <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>جاري تحليل بيانات المشتركين...</strong>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#DC2626" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '13px', color: '#DC2626', fontWeight: 700, marginBottom: '16px' }}>{error}</p>
          <button 
            type="button" 
            onClick={fetchAnalytics}
            style={{ padding: '8px 18px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCcw size={14} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { overview = {}, clients = [] } = data || {};
  const expiringClients = clients.filter(c => c.status === 'EXPIRING_SOON');

  const total = overview.total_clients || clients.length || 1;
  const activePct = Math.round(((overview.active_count || 0) / total) * 100);
  const expiringPct = Math.round(((overview.expiring_soon_count || 0) / total) * 100);
  const expiredPct = Math.round(((overview.expired_count || 0) / total) * 100);

  const statCards = [
    { title: 'الإيرادات الشهرية المتوقعة', value: `${(overview.total_monthly_revenue || 0).toLocaleString()} ج.م`, label: 'تدفق نقدي صحي', icon: Wallet },
    { title: 'العملاء النشطين (Active)', value: overview.active_count || 0, label: 'معدل تفاعل ممتاز', icon: Users },
    { title: 'اشتراكات تنتهي قريباً', value: overview.expiring_soon_count || 0, label: 'أقل من 7 أيام', icon: Clock },
    { title: 'إجمالي قاعدة البيانات', value: overview.total_clients || clients.length, label: 'تاريخ المنصة', icon: ShieldCheck },
  ];

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="إحصائيات الأداء المالي واستقرار المشتركين"
          description="تحليل التدفقات النقدية، نسب الاستبقاء (Retention)، ومتابعة المشتركين القاربين على التجديد."
          actions={(
            <button 
              type="button" 
              onClick={fetchAnalytics}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
            >
              <RefreshCcw size={13} />
              <span>تحديث الأرقام</span>
            </button>
          )}
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

        {/* 3. Retention Pipeline Section */}
        <FormSection
          title="مؤشر الاستقرار والاحتفاظ (Retention Pipeline)"
          description="توزيع المشتركين حسب حالتهم الحالية لضمان استمرارية التجديدات وتفادي الانسحاب."
        >
          <div style={{ marginTop: '8px' }}>
            {/* Multi-segment Progress Bar */}
            <div style={{ height: '12px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${activePct}%`, background: '#16A34A', transition: 'width 0.3s ease' }} title={`نشط ومستقر: ${overview.active_count || 0}`} />
              <div style={{ width: `${expiringPct}%`, background: '#D97706', transition: 'width 0.3s ease' }} title={`قارب على الانتهاء: ${overview.expiring_soon_count || 0}`} />
              <div style={{ width: `${expiredPct}%`, background: '#DC2626', transition: 'width 0.3s ease' }} title={`منتهي: ${overview.expired_count || 0}`} />
            </div>

            {/* Legend Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#166534', fontWeight: 700, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '4px 10px', borderRadius: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }} />
                <span>مستقر ونشط: {overview.active_count || 0} ({activePct}%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#B45309', fontWeight: 700, background: '#FFFBEB', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }} />
                <span>خطر الانسحاب (قارب على الانتهاء): {overview.expiring_soon_count || 0} ({expiringPct}%)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#991B1B', fontWeight: 700, background: '#FEF2F2', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
                <span>منتهي: {overview.expired_count || 0} ({expiredPct}%)</span>
              </div>
            </div>
          </div>
        </FormSection>

        {/* 4. Expiring Soon Action List */}
        {expiringClients.length > 0 && (
          <FormSection
            title="قائمة التجديدات العاجلة (متبقي أقل من 7 أيام)"
            description="التواصل السريع مع المشتركين لتقديم عروض التجديد والاستمرار."
            actions={(
              <span style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {expiringClients.length} متدربين
              </span>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {expiringClients.map(client => {
                const phone = (client.phone_number || '').replace(/[^0-9]/g, '');
                const name = client.full_name || 'بطلنا';
                const message = encodeURIComponent(`مرحباً يا ${name}! نود تذكيرك بأن اشتراكك في Z Coaching أوشك على الانتهاء (${client.days_remaining} يوم متبقي). لتجديد اشتراكك والحصول على عرض الاستمرار، تواصل معنا!`);
                const waUrl = `https://wa.me/${phone}?text=${message}`;

                return (
                  <div 
                    key={client.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>{client.full_name || `مشترك #${client.client_code}`}</strong>
                      <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>
                        المتبقي: {client.days_remaining} أيام • باقة: {client.package || 'إيليت'}
                      </span>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '5px 12px',
                        borderRadius: '5px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                    >
                      <MessageCircle size={12} />
                      <span>إرسال عرض تجديد واتساب</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </FormSection>
        )}

      </div>
    </AdminLayout>
  );
}
