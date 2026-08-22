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
  Filter, 
  FileText,
  Zap,
  ActivitySquare
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import WhatsAppModal from '../components/modals/WhatsAppModal';
import { copyToClipboard } from '../utils/clipboardUtils';

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
    // Search match
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (client.full_name && client.full_name.toLowerCase().includes(term)) ||
      (client.phone_number && client.phone_number.includes(term)) ||
      (client.client_code && String(client.client_code).includes(term.replace('#', '')));

    // Tier match
    const pkg = (client.subscription_package || '').toUpperCase();
    const isMax = pkg.includes('MAX');
    const isElite = !isMax;

    if (tierFilter === 'MAX' && !isMax) return false;
    if (tierFilter === 'ELITE' && !isElite) return false;

    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div style={{ direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                إدارة المشتركين والباقات
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                Super Admin Override Enabled
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              قاعدة بيانات المشتركين والباقات المعتمدة
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#065F46', fontWeight: 800 }}>
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#059669' }} />
              <span>صلاحية التجاوز الإداري الكاملة مفعلة للكوتش</span>
            </div>
          </div>
        </div>

        {/* Quick Add Client Modal/Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px 24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
            + تسجيل مشترك جديد برقم الهاتف والباقة
          </h2>

          <form onSubmit={handleCreateClient} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                رقم الهاتف (الواتساب) *
              </label>
              <input
                type="text"
                required
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.88rem', direction: 'ltr', outline: 'none' }}
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                اسم المشترك (اختياري)
              </label>
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.88rem', outline: 'none' }}
              />
            </div>

            <div style={{ flex: '1 1 220px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                نوع الباقة المعتمدة *
              </label>
              <select
                value={packageTier}
                onChange={(e) => setPackageTier(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
              >
                <option value="MAX_3_PLUS_1">باقة ماكس VIP (متابعة أسبوعية كل 7 أيام) - 16 أسبوعاً</option>
                <option value="ELITE_3_PLUS_1">باقة إيليت (متابعة كل 14 يوماً) - 16 أسبوعاً</option>
              </select>
            </div>

            <button
              type="submit"
              style={{ height: '42px', padding: '0 24px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>إضافة المشترك فوراً</span>
            </button>
          </form>
        </div>

        {/* Filters Bar */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px 20px', border: '1px solid #E2E8F0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="بحث بالاسم، الهاتف، أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 36px 0 12px', fontSize: '0.84rem', outline: 'none', background: '#F8FAFC' }}
            />
          </div>

          {/* Tier Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>تصفية حسب الباقة:</span>
            
            <button
              type="button"
              onClick={() => setTierFilter('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: tierFilter === 'ALL' ? 800 : 600,
                background: tierFilter === 'ALL' ? '#0F172A' : '#F1F5F9',
                color: tierFilter === 'ALL' ? '#FFFFFF' : '#475569',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              الكل ({clients.length})
            </button>

            <button
              type="button"
              onClick={() => setTierFilter('MAX')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: tierFilter === 'MAX' ? 800 : 600,
                background: tierFilter === 'MAX' ? '#D97706' : '#FEF3C7',
                color: tierFilter === 'MAX' ? '#FFFFFF' : '#92400E',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Crown style={{ width: '13px', height: '13px' }} />
              <span>باقة ماكس VIP</span>
            </button>

            <button
              type="button"
              onClick={() => setTierFilter('ELITE')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: tierFilter === 'ELITE' ? 800 : 600,
                background: tierFilter === 'ELITE' ? '#0284C7' : '#E0F2FE',
                color: tierFilter === 'ELITE' ? '#FFFFFF' : '#0369A1',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>باقة إيليت</span>
            </button>
          </div>

        </div>

        {/* Clients Table */}
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, fontSize: '0.78rem' }}>
                  <th style={{ padding: '14px 16px' }}>الكود</th>
                  <th style={{ padding: '14px 16px' }}>المشترك</th>
                  <th style={{ padding: '14px 16px' }}>الهاتف</th>
                  <th style={{ padding: '14px 16px' }}>الباقة ودورية المتابعة</th>
                  <th style={{ padding: '14px 16px' }}>مدة الاشتراك</th>
                  <th style={{ padding: '14px 16px' }}>حالة الاستمارة</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>إجراءات الكوتش والتجاوز الإداري</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const pkg = (client.subscription_package || '').toUpperCase();
                  const isMax = pkg.includes('MAX');

                  return (
                    <tr key={client.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      
                      {/* Code */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'monospace', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                          #{client.client_code || client.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#0F172A', display: 'block' }}>{client.full_name || 'مشترك جديد'}</strong>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>
                        {client.phone_number}
                      </td>

                      {/* Tier & Frequency */}
                      <td style={{ padding: '14px 16px' }}>
                        {isMax ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
                              <Crown style={{ width: '12px', height: '12px' }} />
                              <span>ماكس (VIP)</span>
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                              متابعة أسبوعية (7 أيام)
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800 }}>
                              إيليت
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                              متابعة كل 14 يوماً
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '0.8rem' }}>
                        16 أسبوعاً (3+1 مجاناً)
                      </td>

                      {/* Intake status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
                          ✓ معتمدة ونشطة
                        </span>
                      </td>

                      {/* Coach Super Admin Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          
                          {/* Super Admin Override Button */}
                          <button
                            type="button"
                            onClick={() => handleSuperAdminOverrideCheckin(client.id)}
                            style={{
                              background: '#0F172A',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="فتح متابعة استثنائية فوراً دون قيود"
                          >
                            <Zap style={{ width: '12px', height: '12px', color: '#38BDF8' }} />
                            <span>متابعة فورية (Override)</span>
                          </button>

                          {/* Coach Program Editor */}
                          <Link
                            to={`/coach/editor/${client.id}`}
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FileText style={{ width: '12px', height: '12px' }} />
                            <span>تعديل الخطة</span>
                          </Link>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => setWhatsappModalClient(client)}
                            style={{
                              background: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              borderRadius: '8px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <MessageCircle style={{ width: '13px', height: '13px' }} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp Hub Modal */}
        {whatsappModalClient && (
          <WhatsAppModal 
            client={whatsappModalClient} 
            onClose={() => setWhatsappModalClient(null)} 
          />
        )}

      </div>
    </AdminLayout>
  );
}
