import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  MessageCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2,
  Zap,
  Activity,
  ActivitySquare,
  X,
  CreditCard,
  Edit3,
  ChevronDown,
  Download
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import { copyToClipboard } from '../utils/clipboardUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import InteractivePhotoComparisonStudio from '../components/checkin/InteractivePhotoComparisonStudio';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [packageTier, setPackageTier] = useState('MAX_3_PLUS_1');
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreated, setNewlyCreated] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'

  // WhatsApp Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);

  // Transformation Studio State
  const [transformationModalClient, setTransformationModalClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const exportClientsToCSV = () => {
    if (!clients || clients.length === 0) {
      alert('لا توجد بيانات مشتركين لتصديرها حالياً.');
      return;
    }

    const headers = ['الكود', 'الاسم بالكامل', 'رقم الهاتف', 'الباقة', 'حالة الاشتراك', 'تاريخ البدء', 'تاريخ الانتهاء', 'الأيام المتبقية'];
    const rows = clients.map(c => [
      c.client_code || c.id,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone_number || ''}"`,
      c.subscription_package || c.package || 'ELITE',
      c.subscription_status || c.status || 'ACTIVE',
      c.subscription_start_date ? new Date(c.subscription_start_date).toLocaleDateString('en-CA') : '',
      c.subscription_end_date ? new Date(c.subscription_end_date).toLocaleDateString('en-CA') : '',
      c.days_remaining ?? ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Z_Coaching_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error('fetchClients error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!phone) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone.trim(),
          full_name: fullName.trim() || undefined,
          subscription_package: packageTier,
          subscription_price: packageTier === 'MAX_3_PLUS_1' ? 3500 : 2500
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewlyCreated(data.client || data.user);
        setPhone('');
        setFullName('');
        fetchClients();
      } else {
        alert(data.error || 'حدث خطأ أثناء إنشاء المشترك');
      }
    } catch (e) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  const handleSuperAdminOverrideCheckin = (clientId) => {
    window.location.href = `/check-in?user_id=${clientId}&override=true`;
  };

  // Filter Clients
  const filteredClients = clients.filter(client => {
    const term = searchTerm.trim().toLowerCase().replace(/^#+/, '');
    const cleanClientCode = String(client.client_code || client.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');

    let matchesSearch = true;
    if (term) {
      if (/^\d+$/.test(term)) {
        matchesSearch = cleanClientCode === term ||
          (term.length >= 4 && client.phone_number && client.phone_number.includes(term)) ||
          (client.full_name && client.full_name.toLowerCase().includes(term));
      } else {
        matchesSearch = (client.full_name && client.full_name.toLowerCase().includes(term)) ||
          cleanClientCode === term ||
          (client.phone_number && client.phone_number.includes(term));
      }
    }

    const pkg = (client.subscription_package || '').toUpperCase();
    const isMax = pkg.includes('MAX');
    const isElite = !isMax;

    if (tierFilter === 'MAX' && !isMax) return false;
    if (tierFilter === 'ELITE' && !isElite) return false;

    return matchesSearch;
  });

  const maxCount = clients.filter(c => (c.subscription_package || '').toUpperCase().includes('MAX')).length;
  const eliteCount = clients.length - maxCount;

  const statCards = [
    { title: 'إجمالي المشتركين', value: clients.length, unit: 'مشترك', label: 'مسجلين بالنظام', icon: Users },
    { 
      title: 'مشتركو باقة MAX', 
      value: maxCount, 
      unit: 'مشترك', 
      label: 'متابعة أسبوعية',
      badgeText: 'MAX',
      badgeColor: '#D97706'
    },
    { 
      title: 'مشتركو باقة ELITE', 
      value: eliteCount, 
      unit: 'مشترك', 
      label: 'متابعة كل أسبوعين',
      badgeText: 'ELITE',
      badgeColor: '#0284C7'
    },
    { title: 'حالة قاعدة البيانات', value: 'نشطة', label: 'مزامنة فورية', icon: ShieldCheck },
  ];

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="قاعدة بيانات المشتركين والباقات المعتمدة"
          description="إدارة حسابات المشتركين، إنشاء وتفعيل الأكواد الجديدة، وإجراء المتابعات الفورية."
        />

        {/* 2. 4-Column KPI Stats */}
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
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>{st.title}</span>
                  {st.badgeText ? (
                    <div 
                      style={{ 
                        height: '28px',
                        padding: '0 8px',
                        borderRadius: '6px', 
                        background: '#F8FAFC', 
                        border: '1px solid #E2E8F0', 
                        color: st.badgeColor, 
                        fontSize: '11px', 
                        fontWeight: 900, 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        letterSpacing: '0.5px',
                        fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                      }}
                    >
                      {st.badgeText}
                    </div>
                  ) : (
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                      {st.value}
                    </span>
                    {st.unit && (
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
                        {st.unit}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Quick Register Client Form */}
        <FormSection
          title="تسجيل مشترك جديد برقم الهاتف والباقة"
          description="توليد كود المشترك وتجهيز حسابه فوراً للبدء وتعبئة الاستمارة."
        >
          <form onSubmit={handleCreateClient} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.5fr auto', gap: '12px', alignItems: 'end', marginTop: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                رقم الهاتف (الواتساب) *
              </label>
              <input
                type="text"
                required
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', direction: 'ltr', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                اسم المشترك (اختياري)
              </label>
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                نوع الباقة المعتمدة *
              </label>
              <button
                type="button"
                onClick={() => setIsTierDropdownOpen(!isTierDropdownOpen)}
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <span>
                  {packageTier === 'MAX_3_PLUS_1' 
                    ? 'باقة MAX (متابعة أسبوعية كل 7 أيام)' 
                    : 'باقة ELITE (متابعة كل 14 يوماً)'}
                </span>
                <ChevronDown size={14} color="#64748B" style={{ transform: isTierDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {isTierDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    left: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                    zIndex: 50,
                    overflow: 'hidden',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div
                    onClick={() => {
                      setPackageTier('MAX_3_PLUS_1');
                      setIsTierDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: packageTier === 'MAX_3_PLUS_1' ? '#B45309' : '#0F172A',
                      background: packageTier === 'MAX_3_PLUS_1' ? '#FFFBEB' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (packageTier !== 'MAX_3_PLUS_1') e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (packageTier !== 'MAX_3_PLUS_1') e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>باقة MAX (متابعة أسبوعية كل 7 أيام)</span>
                    {packageTier === 'MAX_3_PLUS_1' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }} />}
                  </div>

                  <div
                    onClick={() => {
                      setPackageTier('ELITE_3_PLUS_1');
                      setIsTierDropdownOpen(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: packageTier === 'ELITE_3_PLUS_1' ? '#0369A1' : '#0F172A',
                      background: packageTier === 'ELITE_3_PLUS_1' ? '#F0F9FF' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (packageTier !== 'ELITE_3_PLUS_1') e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (packageTier !== 'ELITE_3_PLUS_1') e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>باقة ELITE (متابعة كل 14 يوماً)</span>
                    {packageTier === 'ELITE_3_PLUS_1' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7' }} />}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                height: '34px',
                padding: '0 18px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
            >
              <Plus size={14} />
              <span>إضافة المشترك فوراً</span>
            </button>
          </form>
        </FormSection>

        {/* 4. Clients Table Section */}
        <FormSection
          title="قائمة المشتركين المعتمدين"
          description="إدارة كافة المشتركين المسجلين في النظام، ومتابعة الخطط والتقييمات."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Export to Excel / CSV */}
              <button
                type="button"
                onClick={exportClientsToCSV}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                title="تصدير جدول المشتركين بترميز عربي متوافق مع Excel"
              >
                <Download size={13} color="#16A34A" />
                <span>تصدير Excel / CSV</span>
              </button>

              {/* Search Box */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '0 8px',
                  height: '32px',
                  width: '210px',
                  gap: '6px'
                }}
              >
                <Search size={13} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الهاتف، أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '11.5px',
                    width: '100%',
                    color: '#0F172A'
                  }}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Tier Filter Pills */}
              <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {[
                  { id: 'ALL', label: `الكل (${clients.length})` },
                  { id: 'MAX', label: `باقة ماكس (${maxCount})` },
                  { id: 'ELITE', label: `باقة إيليت (${eliteCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTierFilter(tab.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: tierFilter === tab.id ? '#0F172A' : 'transparent',
                      color: tierFilter === tab.id ? '#FFFFFF' : '#64748B',
                      boxShadow: tierFilter === tab.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'background 0.12s ease, color 0.12s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        >
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              جاري تحميل المشتركين...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <Users size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا يوجد مشتركون مطابقون</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي مشترك تحت هذا البحث أو الفلتر.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>الكود</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>المشترك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الهاتف</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الباقة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الاستمارة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>إجراءات الكوتش والمتابعة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const pkg = (client.subscription_package || '').toUpperCase();
                    const isMax = pkg.includes('MAX');
                    const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');

                    return (
                      <tr 
                        key={client.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Code */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontWeight: 800, 
                            fontSize: '11px', 
                            background: '#F8FAFC', 
                            border: '1px solid #E2E8F0', 
                            color: isMax ? '#B45309' : '#0284C7', 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            display: 'inline-block' 
                          }}>
                            {'#' + cleanCode}
                          </span>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <strong style={{ color: '#0F172A', fontSize: '13px', display: 'block' }}>{client.full_name || 'مشترك جديد'}</strong>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569' }}>
                            {client.phone_number}
                          </span>
                        </td>

                        {/* Tier */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ 
                            background: '#F8FAFC', 
                            border: '1px solid #E2E8F0', 
                            color: isMax ? '#B45309' : '#0284C7', 
                            padding: '3px 10px', 
                            borderRadius: '6px', 
                            fontSize: '11.5px', 
                            fontWeight: 800, 
                            fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                            display: 'inline-block'
                          }}>
                            {isMax ? 'MAX' : 'ELITE'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>
                            معتمدة ونشطة
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* WhatsApp Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => setWhatsappModalClient(client)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #86EFAC',
                                background: '#F0FDF4',
                                color: '#16A34A',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#DCFCE7';
                                e.currentTarget.style.borderColor = '#4ADE80';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F0FDF4';
                                e.currentTarget.style.borderColor = '#86EFAC';
                              }}
                              title="مركز رسائل الواتساب الذكية"
                            >
                              <MessageCircle size={13} />
                              <span>واتساب</span>
                            </button>

                            {/* Transformation Studio Button */}
                            <button
                              type="button"
                              onClick={() => setTransformationModalClient(client)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #FEF08A',
                                background: '#FEFCE8',
                                color: '#A16207',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FEF9C3';
                                e.currentTarget.style.borderColor = '#FDE047';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FEFCE8';
                                e.currentTarget.style.borderColor = '#FEF08A';
                              }}
                              title="استوديو صور التطور وكروت التحول التسويقية"
                            >
                              <Sparkles size={13} color="#A16207" />
                              <span>التحول</span>
                            </button>

                            {/* Program Editor Button */}
                            <Link
                              to={`/coach/editor/${cleanCode}`}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '5px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                              title="تعديل الخطة والوجبات والتمارين"
                            >
                              تعديل الخطة
                            </Link>

                            {/* Check-in Review Dashboard Link */}
                            <Link
                              to={`/coach/checkin-review?code=${cleanCode}`}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '5px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                              title="الانتقال لمراجعة تقييم المشترك وتعديل الماكروز"
                            >
                              مراجعة التقييم
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>

        {/* WhatsApp Modal */}
        {whatsappModalClient && (
          <WhatsAppModal
            isOpen={Boolean(whatsappModalClient)}
            onClose={() => setWhatsappModalClient(null)}
            client={whatsappModalClient}
          />
        )}

        {/* Transformation Studio Modal */}
        {transformationModalClient && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 1400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            dir="rtl"
            onClick={() => setTransformationModalClient(null)}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                width: '940px',
                maxWidth: '96vw',
                maxHeight: '94vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                border: '1px solid #CBD5E1'
              }}
            >
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#C4952D" />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                    استوديو صور التطور وكروت التحول: {transformationModalClient.full_name} (#{transformationModalClient.client_code || transformationModalClient.id})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTransformationModalClient(null)}
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: '16px' }}>
                <InteractivePhotoComparisonStudio
                  history={transformationModalClient.history || [
                    { week: 0, weight: transformationModalClient.weight_kg || 80, waist: 88, date: 'البداية', photos: { front: null, side: null, back: null } },
                    { week: 4, weight: (transformationModalClient.weight_kg ? Number((transformationModalClient.weight_kg - 3.2).toFixed(1)) : 76.8), waist: 83, date: 'التقييم الحالي', photos: { front: null, side: null, back: null } }
                  ]}
                  activeCheckin={{
                    week_number: 4,
                    submission_date: 'الأسبوع 4',
                    metrics: {
                      current_weight: (transformationModalClient.weight_kg ? Number((transformationModalClient.weight_kg - 3.2).toFixed(1)) : 76.8),
                      waist_current: 83
                    }
                  }}
                  client={transformationModalClient}
                  onClose={() => setTransformationModalClient(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Newly Created Client Success Dispatch Modal Popup (Exact Matching UI) */}
        {newlyCreated && (() => {
          const rawCode = String(newlyCreated.client_code || newlyCreated.id || '').replace(/^client[-_]?/i, '').replace('#', '');
          const isMaxTier = String(newlyCreated.subscription_package || '').toUpperCase().includes('MAX');
          const clientPhone = newlyCreated.phone_number || '';
          const clientName = newlyCreated.full_name || 'مشترك جديد';
          const formLink = `${window.location.origin}/intake/form?code=${rawCode}&phone=${encodeURIComponent(clientPhone)}`;
          
          const cleanPhoneForWa = clientPhone.replace(/\D/g, '').startsWith('01') 
            ? '2' + clientPhone.replace(/\D/g, '') 
            : clientPhone.replace(/\D/g, '');

          const waInviteMessage = `أهلاً بحضرتك يا أستاذ ${clientName}،
تم تأكيد اشتراكك وتفعيل ملفك في منظومة كابتن كريم زكريا بنجاح.

بيانات دخول استمارتك الخاصة:
- كود المشترك: #${rawCode}
- رقم الهاتف: ${clientPhone}
- الباقة: ${isMaxTier ? 'باقة ماكس MAX' : 'باقة إيليت ELITE'}

رابط استمارتك الصحية والرياضية المباشر:
${formLink}

يرجى تعبئة الاستمارة بدقة للبدء في إعداد وتصميم خطتك التدريبية والغذائية.
بالتوفيق دائماً، كابتن كريم زكريا.`;

          const waUrl = `https://wa.me/${cleanPhoneForWa}?text=${encodeURIComponent(waInviteMessage)}`;

          return (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
              onClick={() => setNewlyCreated(null)}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                style={{
                  background: '#FFFFFF',
                  width: '100%',
                  maxWidth: '480px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  fontFamily: 'Cairo, sans-serif'
                }}
              >
                {/* 1. Header with Blue Bar & Close Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '4px', height: '18px', background: '#0284C7', borderRadius: '2px', display: 'inline-block' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                      إنشاء كود مشترك وتحديد الباقة
                    </h3>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => setNewlyCreated(null)}
                    style={{ 
                      background: '#F8FAFC', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '8px', 
                      width: '32px', 
                      height: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer', 
                      color: '#64748B',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 2. Green Pill Banner */}
                <div 
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#15803D',
                    fontSize: '12.5px',
                    fontWeight: 700
                  }}
                >
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span>تم إنشاء حساب المشترك وتوليد الكود بنجاح</span>
                </div>

                {/* 3. Main Center Code Card */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {/* Code Box */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>كود المشترك المعتمد:</span>
                    <div 
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        minWidth: '85px',
                        padding: '4px 16px',
                        height: '46px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#0F172A',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      {rawCode}
                    </div>
                  </div>

                  {/* Name and Phone Row */}
                  <div 
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'space-around', 
                      alignItems: 'center', 
                      background: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '8px', 
                      padding: '8px 12px', 
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>المشترك:</span>
                      <strong style={{ color: '#0F172A' }}>{clientName}</strong>
                    </div>
                    <div style={{ width: '1px', height: '14px', background: '#CBD5E1' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>الهاتف:</span>
                      <strong dir="ltr" style={{ fontFamily: 'JetBrains Mono', color: '#0F172A' }}>{clientPhone}</strong>
                    </div>
                  </div>

                  {/* Package & Duration Row */}
                  <div style={{ borderTop: '1px solid #E2E8F0', width: '100%', paddingTop: '10px', textAlign: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                    <span>الباقة: </span>
                    <strong style={{ color: '#0F172A' }}>
                      {isMaxTier ? 'باقة ماكس (MAX)' : 'باقة إيليت (ELITE)'}
                    </strong>
                    <span style={{ margin: '0 6px', color: '#CBD5E1' }}>|</span>
                    <span>إجمالي المدة: </span>
                    <strong style={{ color: '#16A34A', fontWeight: 800 }}>4 شهور (16 أسبوعاً)</strong>
                  </div>
                </div>

                {/* 4. Action Buttons Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                  {/* Button 1: Direct WhatsApp */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      height: '42px',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={17} />
                    <span>إرسال الرابط عبر الواتساب مباشرة</span>
                  </a>

                  {/* Button 2: Copy WhatsApp Invitation */}
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(waInviteMessage);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    style={{
                      height: '40px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    <Copy size={15} />
                    <span>{copySuccess ? 'تم نسخ دعوة الواتساب والكود بنجاح!' : 'نسخ دعوة الواتساب والكود'}</span>
                  </button>

                  {/* Button 3: Open & Fill Intake Form Now */}
                  <a
                    href={formLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      height: '40px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  >
                    <Edit3 size={15} />
                    <span>فتح وتعبئة الاستمارة الآن</span>
                  </a>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </AdminLayout>
  );
}
