import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Zap,
  ActivitySquare,
  X,
  CreditCard,
  Edit3
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import { copyToClipboard } from '../utils/clipboardUtils';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [packageTier, setPackageTier] = useState('MAX_3_PLUS_1');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreated, setNewlyCreated] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'

  // WhatsApp Hub State
  const [whatsappModalClient, setWhatsappModalClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

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
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (client.full_name && client.full_name.toLowerCase().includes(term)) ||
      (client.phone_number && client.phone_number.includes(term)) ||
      (client.client_code && String(client.client_code).includes(term.replace('#', '')));

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
    { title: 'إجمالي المشتركين النشطين', value: clients.length, label: 'قاعدة البيانات', icon: Users },
    { title: 'مشتركو باقة MAX', value: maxCount, label: 'متابعة أسبوعية (7 أيام)', icon: Crown },
    { title: 'مشتركو باقة ELITE', value: eliteCount, label: 'متابعة كل 14 يوماً', icon: Sparkles },
    { title: 'تجاوز الكوتش الإداري', value: 'مفعل', label: 'صلاحية التدخل الفوري', icon: ShieldCheck },
  ];

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
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

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                نوع الباقة المعتمدة *
              </label>
              <select
                value={packageTier}
                onChange={(e) => setPackageTier(e.target.value)}
                style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="MAX_3_PLUS_1">باقة ماكس VIP (متابعة أسبوعية كل 7 أيام) - 16 أسبوعاً</option>
                <option value="ELITE_3_PLUS_1">باقة إيليت (متابعة كل 14 يوماً) - 16 أسبوعاً</option>
              </select>
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

          {/* Newly Created Card Flash */}
          {newlyCreated && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} color="#16A34A" />
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 700 }}>
                  تم إنشاء حساب المشترك بنجاح! الكود: <strong>#{newlyCreated.client_code || newlyCreated.id}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.protocol}//${window.location.hostname}:5173/intake/form?code=${newlyCreated.client_code}&phone=${newlyCreated.phone_number}`;
                  copyToClipboard(link);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                style={{ padding: '3px 10px', background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '4px', fontSize: '11px', color: '#166534', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={12} />
                <span>{copySuccess ? 'تم النسخ!' : 'نسخ رابط الاستمارة'}</span>
              </button>
            </div>
          )}
        </FormSection>

        {/* 4. Clients Table Section */}
        <FormSection
          title="قائمة المشتركين المعتمدين"
          description="إدارة كافة المشتركين المسجلين في النظام، ومتابعة الخطط والتقييمات."
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
                    <th style={{ padding: '10px 14px' }}>الكود</th>
                    <th style={{ padding: '10px 14px' }}>المشترك</th>
                    <th style={{ padding: '10px 14px' }}>الهاتف</th>
                    <th style={{ padding: '10px 14px' }}>الباقة ودورية المتابعة</th>
                    <th style={{ padding: '10px 14px' }}>مدة الاشتراك</th>
                    <th style={{ padding: '10px 14px' }}>حالة الاستمارة</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>إجراءات الكوتش والتجاوز الإداري</th>
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
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '2px 7px', borderRadius: '4px' }}>
                            {'#' + cleanCode}
                          </span>
                        </td>

                        {/* Name */}
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: '#0F172A', fontSize: '13px', display: 'block' }}>{client.full_name || 'مشترك جديد'}</strong>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '10px 14px' }}>
                          <span dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: '#475569' }}>
                            {client.phone_number}
                          </span>
                        </td>

                        {/* Tier */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: isMax ? '#F1F5F9' : '#F8FAFC', border: isMax ? '1px solid #CBD5E1' : '1px solid #E2E8F0', color: isMax ? '#0F172A' : '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                              {isMax ? 'باقة MAX' : 'باقة ELITE'}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                              {isMax ? 'متابعة أسبوعية (7 أيام)' : 'متابعة كل 14 يوماً'}
                            </span>
                          </div>
                        </td>

                        {/* Duration */}
                        <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '11.5px' }}>
                          16 أسبوعاً (3+1 مجاناً)
                        </td>

                        {/* Status */}
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '1px 7px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                            ✓ معتمدة ونشطة
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
                                padding: '4px 8px',
                                borderRadius: '5px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="مركز رسائل الواتساب الذكية"
                            >
                              <MessageCircle size={12} color="#16A34A" />
                              <span>واتساب</span>
                            </button>

                            {/* Program Editor Button */}
                            <Link
                              to={`/coach/editor/${cleanCode}`}
                              style={{
                                padding: '4px 9px',
                                borderRadius: '5px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontSize: '11px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={11} />
                              <span>تعديل الخطة</span>
                            </Link>

                            {/* Super Admin Override Button */}
                            <button
                              type="button"
                              onClick={() => handleSuperAdminOverrideCheckin(client.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '5px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                              title="تسجيل تقييم نيابة عن المشترك"
                            >
                              <Zap size={11} />
                              <span>متابعة فورية</span>
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
        </FormSection>

        {/* WhatsApp Modal */}
        {whatsappModalClient && (
          <WhatsAppModal
            isOpen={Boolean(whatsappModalClient)}
            onClose={() => setWhatsappModalClient(null)}
            client={whatsappModalClient}
          />
        )}

      </div>
    </AdminLayout>
  );
}
