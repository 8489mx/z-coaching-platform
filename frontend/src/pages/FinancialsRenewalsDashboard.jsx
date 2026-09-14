import { API_BASE } from '../config/api';
import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import { arabicSearchMatch } from '../utils/searchUtils';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, CreditCard, TrendingUp, Users, AlertCircle, Clock, CheckCircle2, Send, Search, Filter, Calendar, ArrowUpRight, Check, Plus, X, RotateCw, BadgePercent, Wallet, Receipt, ArrowRight, Pause, Play } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import FlexibleRenewalModal from '../components/modals/FlexibleRenewalModal';
import { generateWhatsAppUrl, MESSAGE_TEMPLATES, compileReminderMessage, REMINDER_CATEGORIES } from '../utils/whatsappRemindersEngine';

export default function FinancialsRenewalsDashboard() {
  const [searchParams] = useSearchParams();
  const urlParam = searchParams.get('code') || searchParams.get('client_code') || searchParams.get('search') || searchParams.get('q') || '';

  const [renewalFilter, setRenewalFilter] = useState('ALL'); // 'ALL' | 'URGENT_3D' | 'WEEK_7D' | 'OVERDUE' | 'PAID'
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [searchQuery, setSearchQuery] = useState(urlParam ? `#${urlParam}` : '');
  const [renewedMap, setRenewedMap] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (urlParam) {
      setSearchQuery(urlParam.startsWith('#') ? urlParam : `#${urlParam}`);
    }
  }, [urlParam]);

  // Live Financial Dataset from API
  const [financialsData, setFinancialsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancials();
  }, [renewedMap]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
      if (res.ok) {
        const data = await res.json();
        if (data.clients) {
          const enriched = data.clients.map((c) => {
            const isMax = getClientTier(c) === 'MAX';
            const monthlyFee = c.subscription_price ? (c.subscription_price / (c.package_details?.duration_days / 30 || 1)) : (isMax ? 2500 : 1600);
            
            let daysRemaining = c.days_remaining || 0;
            let status = c.status || 'INACTIVE';

            if (c.subscription_status === 'FROZEN') {
              status = 'FROZEN';
            }

            if (renewedMap[c.id]) {
               status = 'RENEWED';
               daysRemaining = 30;
            }

            const expiryDate = c.subscription_end_date 
              ? new Date(c.subscription_end_date) 
              : new Date(Date.now() + daysRemaining * 86400000);
            const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const formattedExpiry = !isNaN(expiryDate.getTime())
              ? `${expiryDate.getDate()} ${monthsAr[expiryDate.getMonth()]} ${expiryDate.getFullYear()}`
              : '--';

            return {
              ...c,
              isMax,
              pkgLabel: isMax ? 'MAX' : 'ELITE',
              monthlyFee,
              daysRemaining,
              status,
              formattedExpiry,
              paymentMethod: c.payment_method || 'فودافون كاش / إنستاباي'
            };
          });
          setFinancialsData(enriched);
        }
      }
    } catch (err) {
      console.error('Failed to fetch financials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations & Executive KPIs
  const totalMRR = useMemo(() => {
    return financialsData
      .filter(c => c.status !== 'OVERDUE')
      .reduce((acc, c) => acc + c.monthlyFee, 0);
  }, [financialsData]);

  const maxTierRevenue = useMemo(() => {
    return financialsData
      .filter(c => c.isMax && c.status !== 'OVERDUE')
      .reduce((acc, c) => acc + c.monthlyFee, 0);
  }, [financialsData]);

  const eliteTierRevenue = useMemo(() => {
    return financialsData
      .filter(c => !c.isMax && c.status !== 'OVERDUE')
      .reduce((acc, c) => acc + c.monthlyFee, 0);
  }, [financialsData]);

  const urgentRenewals = useMemo(() => {
    return financialsData.filter(c => c.daysRemaining > 0 && c.daysRemaining <= 3);
  }, [financialsData]);

  const overdueCount = useMemo(() => {
    return financialsData.filter(c => c.daysRemaining < 0 && c.status === 'OVERDUE').length;
  }, [financialsData]);

  const retentionRate = useMemo(() => {
    if (financialsData.length === 0) return 0;
    const renewedOrActive = financialsData.filter(c => c.status === 'ACTIVE' || c.status === 'RENEWED').length;
    return Math.round((renewedOrActive / financialsData.length) * 100);
  }, [financialsData]);

  const filteredClients = useMemo(() => {
    return financialsData.filter(c => {
      // Search
      const q = searchQuery.trim();
      const qClean = q.toLowerCase().replace(/^#+/, '');
      const codeStr = String(c.client_code || c.id || '').replace(/^client[-_]?/i, '');
      const matchSearch = !qClean || 
        codeStr === qClean ||
        codeStr.includes(qClean) ||
        arabicSearchMatch(c.full_name || c.name, q) ||
        (c.phone_number || '').includes(qClean);

      if (!matchSearch) return false;

      // Tier
      if (tierFilter === 'MAX' && !c.isMax) return false;
      if (tierFilter === 'ELITE' && c.isMax) return false;

      // Renewal Status Filter
      if (renewalFilter === 'URGENT_3D') return c.daysRemaining > 0 && c.daysRemaining <= 3 && c.status !== 'FROZEN';
      if (renewalFilter === 'WEEK_7D') return c.daysRemaining > 0 && c.daysRemaining <= 7 && c.status !== 'FROZEN';
      if (renewalFilter === 'FROZEN') return c.status === 'FROZEN';
      if (renewalFilter === 'OVERDUE') return c.daysRemaining < 0 && c.status === 'OVERDUE';
      if (renewalFilter === 'PAID') return c.status === 'ACTIVE' || c.status === 'RENEWED';

      return true;
    });
  }, [financialsData, searchQuery, tierFilter, renewalFilter]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [flexibleRenewalClient, setFlexibleRenewalClient] = useState(null);

  const handleQuickRenew = (client) => {
    setFlexibleRenewalClient(client);
  };

  const handleToggleFreeze = async (client) => {
    const isCurrentlyFrozen = client.status === 'FROZEN';
    const targetStatus = isCurrentlyFrozen ? 'ACTIVE' : 'FROZEN';
    const confirmMsg = isCurrentlyFrozen 
      ? `هل ترغب في استئناف اشتراك المشترك (${client.full_name || client.name}) وإضافة أيام التجميد لتاريخ الانتهاء الجديد؟`
      : `هل ترغب في تجميد اشتراك المشترك (${client.full_name || client.name}) مؤقتاً؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/coach/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.client_code || client.id,
          status: targetStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || (isCurrentlyFrozen ? 'تم استئناف الاشتراك بنجاح' : 'تم تجميد الاشتراك بنجاح'));
        fetchFinancials();
      } else {
        alert(data.message || 'حدث خطأ أثناء تعديل حالة التجميد');
      }
    } catch (err) {
      console.error('Toggle freeze error:', err);
      alert('تعذر الاتصال بالخادم لتعديل حالة التجميد');
    }
  };

  const handleSendRenewalWhatsApp = (client) => {
    const tpl = MESSAGE_TEMPLATES[REMINDER_CATEGORIES.RENEWAL_UPCOMING]?.template || '';
    const msg = compileReminderMessage(tpl, {
      client_name: client.full_name || client.name,
      package_name: client.pkgLabel === 'MAX' ? 'باقة MAX' : 'باقة إليت (ELITE)',
      days_left: client.daysRemaining > 0 ? client.daysRemaining : '0'
    });
    const url = generateWhatsAppUrl(client.phone_number, msg);
    showToast(`جاري فتح واتساب لتذكير ${client.full_name || client.name} بالتجديد...`);
    window.open(url, '_blank');
  };

  return (
    <AdminLayout fullWidth={true}>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '14px', 
          fontFamily: 'Cairo, sans-serif',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* 1. Header Banner */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={17} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                لوحة المالية والتجديدات ومعدل الاحتفاظ (MRR)
              </h2>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                متابعة الإيراد الشهري، اشتراكات الباقات، والمشتركين المستحقين للتجديد لمنع تسرب العملاء
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>
              إجمالي المشتركين النشطين: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>{financialsData.length}</strong>
            </span>
          </div>
        </div>

        {/* 2. Executive Financial KPI Cards (Interactive Filters) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          {/* Card 1: Total MRR -> Filter Paid */}
          <div 
            onClick={() => setRenewalFilter(renewalFilter === 'PAID' ? 'ALL' : 'PAID')}
            style={{ 
              background: '#FFFFFF', 
              border: renewalFilter === 'PAID' ? '2px solid #059669' : '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '12px 14px', 
              boxShadow: renewalFilter === 'PAID' ? '0 4px 12px rgba(5, 150, 105, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="انقر لفلترة المشتركين المسددين والنشطين"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>الإيراد الشهري المتكرر (MRR)</span>
              <div style={{ background: '#ECFDF5', padding: '4px', borderRadius: '8px' }}>
                <DollarSign size={14} color="#059669" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                {totalMRR.toLocaleString('en-US')}
              </strong>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>ج.م / شهر</span>
            </div>
            <div style={{ fontSize: '10px', color: totalMRR > 0 ? '#059669' : '#64748B', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {totalMRR > 0 ? (
                <>
                  <ArrowUpRight size={12} />
                  <span>اشتراكات مسددة نشطة (انقر للفلترة)</span>
                </>
              ) : (
                <span>لا توجد اشتراكات مسددة حالياً</span>
              )}
            </div>
          </div>

          {/* Card 2: Retention Rate -> Reset All */}
          <div 
            onClick={() => { setRenewalFilter('ALL'); setTierFilter('ALL'); }}
            style={{ 
              background: '#FFFFFF', 
              border: (renewalFilter === 'ALL' && tierFilter === 'ALL') ? '2px solid #0284C7' : '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '12px 14px', 
              boxShadow: (renewalFilter === 'ALL' && tierFilter === 'ALL') ? '0 4px 12px rgba(2, 132, 199, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="انقر لعرض كافة المشتركين"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>معدل تجديد المشتركين (Retention)</span>
              <div style={{ background: '#F0F9FF', padding: '4px', borderRadius: '8px' }}>
                <BadgePercent size={14} color="#0284C7" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                {retentionRate}%
              </strong>
              {financialsData.length === 0 ? (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>لا توجد بيانات</span>
              ) : retentionRate >= 80 ? (
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>ممتاز جداً</span>
              ) : retentionRate >= 50 ? (
                <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>مستقر</span>
              ) : (
                <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>بحاجة للمتابعة</span>
              )}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', fontFamily: 'Cairo, sans-serif' }}>
              {financialsData.length === 0 
                ? 'في انتظار تسجيل أول اشتراك (عرض الكل)' 
                : `${financialsData.filter(c => c.status === 'ACTIVE' || c.status === 'RENEWED').length} مشترك نشط ومجدد من أصل ${financialsData.length}`}
            </div>
          </div>

          {/* Card 3: Urgent Renewals -> Filter Urgent 3D */}
          <div 
            onClick={() => setRenewalFilter(renewalFilter === 'URGENT_3D' ? 'ALL' : 'URGENT_3D')}
            style={{ 
              background: '#FFFFFF', 
              border: renewalFilter === 'URGENT_3D' ? '2px solid #B45309' : '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '12px 14px', 
              boxShadow: renewalFilter === 'URGENT_3D' ? '0 4px 12px rgba(180, 83, 9, 0.15)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="انقر لفلترة التجديدات المستحقة خلال 3 أيام"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>تجديدات مستحقة (≤ 3 أيام)</span>
              <div style={{ background: '#FFFBEB', padding: '4px', borderRadius: '8px' }}>
                <Clock size={14} color="#B45309" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#B45309', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                {urgentRenewals.length}
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>
                مشتركين (<strong style={{ fontFamily: 'JetBrains Mono, Cairo, sans-serif', color: '#B45309' }}>{urgentRenewals.reduce((a,c) => a + c.monthlyFee, 0).toLocaleString('en-US')}</strong> <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span>)
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, marginTop: '4px', fontFamily: 'Cairo, sans-serif' }}>
              {urgentRenewals.length > 0 ? 'تتطلب تذكير فوري (انقر للفلترة)' : 'لا توجد اشتراكات مستحقة حالياً'}
            </div>
          </div>

          {/* Card 4: Overdue Subscriptions -> Filter Overdue */}
          <div 
            onClick={() => setRenewalFilter(renewalFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
            style={{ 
              background: '#FFFFFF', 
              border: renewalFilter === 'OVERDUE' ? '2px solid #DC2626' : '1px solid #E2E8F0', 
              borderRadius: '12px', 
              padding: '12px 14px', 
              boxShadow: renewalFilter === 'OVERDUE' ? '0 4px 12px rgba(220, 38, 38, 0.15)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="انقر لفلترة الاشتراكات المنتهية المتأخرة"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>اشتراكات منتهية تحتاج استعادة</span>
              <div style={{ background: '#FEF2F2', padding: '4px', borderRadius: '8px' }}>
                <AlertCircle size={14} color="#DC2626" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                {overdueCount}
              </strong>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>مشترك</span>
            </div>
            <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 700, marginTop: '4px' }}>
              تحتاج متابعة هاتفية (انقر للفلترة)
            </div>
          </div>

        </div>

        {/* 3. Tier Revenue Breakdown Bar (Interactive) */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div 
              onClick={() => setTierFilter(tierFilter === 'MAX' ? 'ALL' : 'MAX')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                background: tierFilter === 'MAX' ? '#FEF3C7' : 'transparent',
                border: tierFilter === 'MAX' ? '1px solid #FDE68A' : '1px solid transparent',
                transition: 'all 0.12s ease'
              }}
              title="انقر لفلترة باقة MAX فقط"
            >
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#B45309' }}>
                MAX
              </span>
              <span style={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Cairo, sans-serif' }}>
                إيراد باقة MAX: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>{maxTierRevenue.toLocaleString('en-US')}</strong> <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span> ({financialsData.filter(c => c.isMax).length} مشترك)
              </span>
            </div>

            <span style={{ color: '#CBD5E1' }}>•</span>

            <div 
              onClick={() => setTierFilter(tierFilter === 'ELITE' ? 'ALL' : 'ELITE')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                background: tierFilter === 'ELITE' ? '#E0F2FE' : 'transparent',
                border: tierFilter === 'ELITE' ? '1px solid #BAE6FD' : '1px solid transparent',
                transition: 'all 0.12s ease'
              }}
              title="انقر لفلترة باقة ELITE فقط"
            >
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '3px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0284C7' }}>
                ELITE
              </span>
              <span style={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Cairo, sans-serif' }}>
                إيراد باقة إليت: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>{eliteTierRevenue.toLocaleString('en-US')}</strong> <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span> ({financialsData.filter(c => !c.isMax).length} مشترك)
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>
            متوسط الإيراد لكل عميل (ARPU): <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>{financialsData.length > 0 ? Math.round(totalMRR / financialsData.length).toLocaleString('en-US') : 0}</strong> <span style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>ج.م</span>
          </div>
        </div>

        {/* 4. Filter Toolbar & Renewals Table */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
        }}>
          {/* Table Controls */}
          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'كافة الاشتراكات', count: financialsData.length },
                { id: 'URGENT_3D', label: 'عاجل (≤ 3 أيام)', count: urgentRenewals.length },
                { id: 'WEEK_7D', label: 'خلال أسبوع' },
                { id: 'FROZEN', label: 'مجمد مؤقتاً', count: financialsData.filter(c => c.status === 'FROZEN').length },
                { id: 'OVERDUE', label: 'منتهية متأخرة', count: overdueCount },
                { id: 'PAID', label: 'نشطة ومسددة' }
              ].map(f => {
                const isSel = renewalFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRenewalFilter(f.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: isSel ? 800 : 600,
                      border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: isSel ? '#0F172A' : '#FFFFFF',
                      color: isSel ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && (
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '0 4px',
                        borderRadius: '6px',
                        background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                        color: isSel ? '#FFFFFF' : '#0F172A'
                      }}>
                        {f.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tier & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'MAX', label: 'MAX' },
                  { id: 'ELITE', label: 'ELITE' }
                ].map(t => {
                  const isSel = tierFilter === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTierFilter(t.id)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        fontFamily: t.id !== 'ALL' ? 'JetBrains Mono, Cairo, sans-serif' : 'inherit',
                        border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSel ? '#0F172A' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : (t.id === 'MAX' ? '#B45309' : t.id === 'ELITE' ? '#0284C7' : '#64748B'),
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 8px', height: '28px', width: '160px', gap: '4px' }}>
                <Search size={12} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="بحث باسم أو كود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '11px', outline: 'none', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1.5fr 100px 105px 135px 105px 220px',
            padding: '8px 14px',
            background: '#F1F5F9',
            fontSize: '11px',
            fontWeight: 800,
            color: '#475569',
            borderBottom: '1px solid #E2E8F0'
          }}>
            <div>الكود</div>
            <div>اسم المشترك والتواصل</div>
            <div>الباقة</div>
            <div>المعدل الشهري</div>
            <div>تاريخ وموعد التجديد</div>
            <div>طريقة السداد</div>
            <div style={{ textAlign: 'center' }}>الإجراء المالي والمتابعة</div>
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                لا يوجد مشتركون مطابقون للفلتر
              </div>
            ) : (
              filteredClients.map((client) => {
                const isUrgent = client.daysRemaining > 0 && client.daysRemaining <= 3;
                const isOverdue = client.daysRemaining < 0;
                const isRenewed = client.status === 'RENEWED';
                const cleanCode = String(client.client_code || client.id || '').replace(/^client[-_]?/i, '').replace('#', '');

                return (
                  <div
                    key={client.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1.5fr 100px 105px 135px 105px 220px',
                      padding: '10px 14px',
                      alignItems: 'center',
                      borderBottom: '1px solid #F1F5F9',
                      background: isUrgent ? '#FFFDF5' : isOverdue ? '#FFF8F8' : '#FFFFFF',
                      fontSize: '11.5px',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    {/* Col 1: Code */}
                    <div>
                      <ClientCodeBadge code={client.client_code || client.id} item={client} size="sm" />
                    </div>

                    {/* Col 2: Name + Phone */}
                    <div>
                      <strong 
                        style={{ fontSize: '12px', color: '#0F172A', display: 'block', cursor: 'pointer' }}
                        onClick={() => window.open(`/customers/${cleanCode}`, '_blank')}
                        title="عرض ملف التطور الزمني للمشترك"
                      >
                        {client.full_name || client.name}
                      </strong>
                      <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {client.phone_number}
                      </span>
                    </div>

                    {/* Col 3: Package Badge */}
                    <div>
                      <ClientPackageBadge item={client} size="xs" />
                    </div>

                    {/* Col 4: Fee */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <strong style={{ fontFamily: 'JetBrains Mono, Cairo, sans-serif', fontSize: '12.5px', color: '#0F172A' }}>
                        {Math.round(client.monthlyFee).toLocaleString('en-US')}
                      </strong>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', fontFamily: 'Cairo, sans-serif' }}>ج.م/شهر</span>
                    </div>

                    {/* Col 5: Expiry & Days Left */}
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#0F172A', fontWeight: 600 }}>
                        {client.formattedExpiry}
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: isRenewed ? '#059669' : client.status === 'FROZEN' ? '#B45309' : isOverdue ? '#DC2626' : isUrgent ? '#B45309' : '#475569'
                      }}>
                        {isRenewed ? 'تم التجديد (نشط 30 يوم)' : client.status === 'FROZEN' ? 'مجمد مؤقتاً (الأيام محفوظة)' : isOverdue ? `منتهي منذ ${Math.abs(client.daysRemaining)} يوم` : `متبقي ${client.daysRemaining} يوم`}
                      </span>
                    </div>

                    {/* Col 6: Payment Method */}
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      {client.paymentMethod}
                    </div>

                    {/* Col 7: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      {isRenewed ? (
                        <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={12} />
                          <span>مسدد بنجاح</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickRenew(client)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="تسجيل سداد وتجديد الاشتراك بمزاجك"
                          >
                            <CreditCard size={11} />
                            <span>تجديد</span>
                          </button>

                          {/* Freeze / Resume Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleFreeze(client)}
                            style={{
                              padding: '3px 7px',
                              borderRadius: '8px',
                              background: client.status === 'FROZEN' ? '#F0FDF4' : '#F8FAFC',
                              color: client.status === 'FROZEN' ? '#16A34A' : '#475569',
                              border: client.status === 'FROZEN' ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title={client.status === 'FROZEN' ? 'استئناف الاشتراك وتمديد تاريخ الانتهاء' : 'تجميد الاشتراك وتثبيت الأيام المتبقية'}
                          >
                            {client.status === 'FROZEN' ? <Play size={11} /> : <Pause size={11} />}
                            <span>{client.status === 'FROZEN' ? 'استئناف' : 'تجميد'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendRenewalWhatsApp(client)}
                            style={{
                              padding: '3px 7px',
                              borderRadius: '8px',
                              background: '#25D366',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="إرسال رسالة تذكير بالتجديد عبر واتساب"
                          >
                            <Send size={11} />
                            <span>تذكير</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => window.open(`/customers/${cleanCode}`, '_blank')}
                        style={{
                          padding: '3px 7px',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="عرض ملف التطور الزمني والمقارنة البصرية للمشترك"
                      >
                        <Clock size={11} color="#475569" />
                        <span>الملف</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Floating Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            zIndex: 99999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {toast}
          </div>
        )}

        {/* Flexible Renewal Modal */}
        <FlexibleRenewalModal
          isOpen={Boolean(flexibleRenewalClient)}
          onClose={() => setFlexibleRenewalClient(null)}
          client={flexibleRenewalClient}
          onSuccess={() => {
            setFlexibleRenewalClient(null);
            fetchFinancials();
            showToast('تم تجديد وتمديد اشتراك المشترك بنجاح!');
          }}
        />

      </div>
    </AdminLayout>
  );
}
