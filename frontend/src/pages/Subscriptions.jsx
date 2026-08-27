import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  Wallet, 
  Users, 
  Hourglass, 
  AlertTriangle, 
  Edit3, 
  PauseCircle, 
  PlayCircle, 
  RotateCw, 
  MessageCircle, 
  Plus, 
  X,
  CheckCircle2
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import EditSubscriptionModal from '../components/modals/EditSubscriptionModal';
import { arabicSearchMatch } from '../utils/searchUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function Subscriptions() {
  const [overview, setOverview] = useState({
    total_monthly_revenue: 0,
    active_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
    total_clients: 0
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [editClient, setEditClient] = useState(null);
  const [editForm, setEditForm] = useState({
    subscription_package: '1_MONTH',
    subscription_price: 1500,
    subscription_start_date: '',
    subscription_end_date: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/overview`);
      const data = await res.json();
      if (data.overview) setOverview(data.overview);
      if (data.clients) setClients(data.clients);
    } catch (e) {
      console.error('fetchSubscriptions error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (client) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في تجديد اشتراك ${client.full_name || 'المشترك'}؟`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/renew/${client.client_code || client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_code: client.package || '1_MONTH' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تجديد الاشتراك');

      alert('تم تجديد الاشتراك بنجاح!');
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء التجديد');
    }
  };

  const handleOpenEdit = (client) => {
    setEditClient(client);
    setEditForm({
      subscription_package: client.package || '1_MONTH',
      subscription_price: client.price || 1500,
      subscription_start_date: client.start_date || '',
      subscription_end_date: client.end_date || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editClient) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/update/${editClient.client_code || editClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث الاشتراك');

      alert('تم تحديث بيانات الاشتراك بنجاح!');
      setEditClient(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGiftDays = async (client, days) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/coach/add-gift-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.client_code || client.id, days })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `تمت إضافة ${days} يوماً هدية بنجاح`);
        fetchSubscriptions();
      } else {
        alert(data.message || 'حدث خطأ أثناء إضافة الأيام');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleFreeze = async (client) => {
    const isCurrentlyFrozen = client.status === 'FROZEN' || client.subscription_status === 'FROZEN';
    const nextStatus = isCurrentlyFrozen ? 'ACTIVE' : 'FROZEN';
    try {
      const res = await fetch(`${API_BASE}/api/v1/coach/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.client_code || client.id, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || (nextStatus === 'FROZEN' ? 'تم تجميد الاشتراك بنجاح' : 'تم استئناف الاشتراك بنجاح'));
        fetchSubscriptions();
      } else {
        alert(data.message || 'حدث خطأ أثناء تعديل حالة التجميد');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendWhatsAppReminder = (client) => {
    const phone = (client.phone_number || '').replace(/[^0-9]/g, '');
    if (!phone) {
      alert('لا يوجد رقم هاتف مسجل لهذا المشترك');
      return;
    }
    const name = client.full_name || 'بطلنا';
    const message = encodeURIComponent(
      `مرحباً يا ${name}! \nنود تذكيرك بأن اشتراكك في Z Coaching أوشك على الانتهاء.\nلتجديد الاشتراك والاستمرار في تحقيق أهدافك، يرجى التواصل معنا أو تأكيد التجديد.\nبالتوفيق يا بطل!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getPackageLabel = (pkg) => {
    switch (pkg) {
      case '1_MONTH': return 'باقة شهر واحد (1M)';
      case '3_MONTHS': return 'باقة ELITE (3 شهور + 1 مجاناً)';
      case 'MAX_3_PLUS_1': return 'باقة MAX (3 شهور + 1 مجاناً)';
      case '6_MONTHS': return 'باقة 6 شهور (6M)';
      case '12_MONTHS': return 'باقة سنة كاملة';
      default: return (pkg || 'باقة ELITE').replace(/_VIP/gi, '').replace(/باقة ماكس VIP/g, 'باقة MAX');
    }
  };

  const filteredClients = clients.filter(c => {
    if (filter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
    if (filter === 'EXPIRING_SOON' && c.status !== 'EXPIRING_SOON') return false;
    if (filter === 'EXPIRED' && c.status !== 'EXPIRED') return false;

    if (!searchTerm.trim()) return true;
    const raw = searchTerm.trim().toLowerCase();

    if (raw.startsWith('#')) {
      const codeQuery = raw.replace(/^#+/, '').trim();
      if (!codeQuery) return true;
      const displayedCode = String(c.client_code || c.id || '').trim().toLowerCase();
      const cleanCode = displayedCode.replace(/^client[-_]?/i, '');
      return displayedCode === codeQuery || cleanCode === codeQuery || displayedCode === `client-${codeQuery}`;
    }

    return (
      arabicSearchMatch(c.full_name, searchTerm) ||
      arabicSearchMatch(c.phone_number, searchTerm) ||
      arabicSearchMatch(c.client_code || c.id, searchTerm) ||
      arabicSearchMatch(c.email, searchTerm)
    );
  });

  const statCards = [
    { title: 'الدخل الشهري الفعّال', value: `${Number(overview.total_monthly_revenue || 0).toLocaleString()} ج.م`, label: 'تدفق نقدي صحي', icon: Wallet },
    { title: 'مشتركون نشطون حالياً', value: overview.active_count || clients.filter(c => c.status === 'ACTIVE').length, label: 'سارية ومفعلة', icon: Users },
    { title: 'قاربت على الانتهاء', value: overview.expiring_soon_count || 0, label: 'خلال 7 أيام', icon: Hourglass },
    { title: 'اشتراكات منتهية', value: overview.expired_count || 0, label: 'مطلوب تجديدها', icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="إدارة الباقات والاشتراكات والمالية"
          description="متابعة التدفق المالي، تجديد الباقات، تجميد الاشتراكات، وإضافة الأيام الترويجية."
          actions={(
            <button 
              type="button" 
              onClick={fetchSubscriptions}
              style={{
                height: '36px',
                padding: '0 16px',
                fontSize: '12.5px',
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
              <RotateCw size={14} />
              <span>تحديث البيانات المالية</span>
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

        {/* 3. Subscriptions List Section */}
        <FormSection
          title="سجل الاشتراكات والتجديدات"
          description="كافة اشتراكات المتدربين مع خيارات التجديد الفوري والتجميد وإضافة أيام مجانية."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                  placeholder="بحث في الاشتراكات..."
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

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', padding: '3px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {[
                  { id: 'ALL', label: `الكل (${clients.length})` },
                  { id: 'ACTIVE', label: `النشطة (${overview.active_count || clients.filter(c => c.status === 'ACTIVE').length})` },
                  { id: 'EXPIRING_SOON', label: `قاربت على الانتهاء (${overview.expiring_soon_count || 0})` },
                  { id: 'EXPIRED', label: `المنتهية (${overview.expired_count || 0})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: filter === tab.id ? '#0F172A' : 'transparent',
                      color: filter === tab.id ? '#FFFFFF' : '#64748B',
                      boxShadow: filter === tab.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
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
              جاري تحميل الاشتراكات...
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <CheckCircle2 size={18} />
              </div>
              <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد اشتراكات مطابقة</strong>
              <small style={{ fontSize: '11.5px', color: '#64748B' }}>لم يتم العثور على أي مشترك تحت هذا الفلتر أو البحث.</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: '85px' }}>الكود</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>المشترك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>الباقة والسعر</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>تاريخ البداية والانتهاء</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>حالة الاشتراك</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>الإجراءات المالية</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const cleanCode = String(client.client_code || client.id).replace(/^client[-_]?/i, '');
                    const isFrozen = client.status === 'FROZEN' || client.subscription_status === 'FROZEN';
                    const isExp = client.status === 'EXPIRED';
                    const isSoon = client.status === 'EXPIRING_SOON';

                    return (
                      <tr 
                        key={client.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Code */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '11px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', padding: '2px 7px', borderRadius: '4px', display: 'inline-block' }}>
                            {'#' + cleanCode}
                          </span>
                        </td>

                        {/* Name & Phone */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <strong style={{ color: '#0F172A', fontSize: '13px', display: 'block' }}>{client.full_name || 'مشترك جديد'}</strong>
                          <span dir="ltr" style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                            {client.phone_number}
                          </span>
                        </td>

                        {/* Package & Price */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {(() => {
                            const isMax = String(client.package || '').includes('MAX') || String(client.package || '').includes('ماكس');
                            return (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                                <span style={{
                                  background: '#F1F5F9',
                                  border: '1px solid #E2E8F0',
                                  color: isMax ? '#C4952D' : '#0284C7',
                                  padding: '1px 7px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  fontFamily: 'JetBrains Mono, Cairo, sans-serif'
                                }}>
                                  {isMax ? 'MAX' : 'ELITE'}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {client.price ? `${client.price} ج.م` : (isMax ? '4500 ج.م' : '3000 ج.م')}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Start and End */}
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
                          <div>من: <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{client.start_date || '2026-08-21'}</span></div>
                          <div>إلى: <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{client.end_date || '2026-12-19'}</span></div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {isFrozen ? (
                            <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              مجمّد
                            </span>
                          ) : isExp ? (
                            <span style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              منتهي
                            </span>
                          ) : isSoon ? (
                            <span style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block' }}>
                              قارب على الانتهاء ({client.days_remaining} يوم)
                            </span>
                          ) : (
                            <span style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                              نشط ({client.days_remaining ? `${client.days_remaining} يوم` : '115 يوم'})
                            </span>
                          )}
                        </td>

                        {/* Financial Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'left' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            
                            {/* Gift Days Pills */}
                            <button type="button" onClick={() => handleAddGiftDays(client, 7)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }} title="إضافة 7 أيام هدية">+7ي</button>
                            <button type="button" onClick={() => handleAddGiftDays(client, 14)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }} title="إضافة 14 يوماً هدية">+14ي</button>
                            <button type="button" onClick={() => handleAddGiftDays(client, 30)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }} title="إضافة شهر كامل هدية">+30ي</button>

                            {/* Freeze Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleFreeze(client)}
                              style={{ padding: '4px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              title={isFrozen ? 'استئناف الاشتراك' : 'تجميد الاشتراك'}
                            >
                              {isFrozen ? 'استئناف' : 'تجميد'}
                            </button>

                            {/* Renew Button */}
                            <button
                              type="button"
                              onClick={() => handleRenew(client)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                            >
                              <RotateCw size={10} />
                              <span>تجديد</span>
                            </button>

                            {/* WhatsApp Reminder if Expiring */}
                            {(isSoon || isExp) && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder(client)}
                                style={{ padding: '4px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#16A34A', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                title="إرسال تذكير واتساب"
                              >
                                <MessageCircle size={12} />
                              </button>
                            )}

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

        {/* Edit Subscription Modal */}
        {editClient && (
          <EditSubscriptionModal
            isOpen={Boolean(editClient)}
            onClose={() => setEditClient(null)}
            client={editClient}
            formData={editForm}
            setFormData={setEditForm}
            onSave={handleSaveEdit}
            saving={saving}
          />
        )}

      </div>
    </AdminLayout>
  );
}
