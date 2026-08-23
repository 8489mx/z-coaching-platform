import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Activity, 
  Hourglass, 
  Search, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  BarChart3, 
  Flame, 
  TrendingDown, 
  ChevronLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText 
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';

export default function CoachCommandCenter() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // إحصائيات سريعة للـ KPI Cards
  const stats = [
    { title: 'إجمالي المشتركين النشطين', value: '48', change: '+12% هذا الشهر', icon: Users, color: '#0284C7', bg: '#E0F2FE' },
    { title: 'متابعات تنتظر الاعتماد', value: '2', change: 'اليوم', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
    { title: 'طوارئ المفاصل والعيادة', value: '1', change: 'تدخل عاجل', icon: ShieldAlert, color: '#E11D48', bg: '#FFE4E6' },
    { title: 'تجديدات خلال 7 أيام', value: '3', change: 'باقات منتهية', icon: Hourglass, color: '#4F46E5', bg: '#EEF2FF' },
  ];

  // المهام والإجراءات اليومية
  const [dailyActions, setDailyActions] = useState([
    {
      id: 'ACT_01',
      type: 'CHECKIN',
      clientName: 'سارة المنصوري',
      tier: 'VIP MAX',
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
      tier: 'ELITE',
      phone: '+971509876543',
      summary: 'نغزة ألم في الكتف الأيمن (6/10) أثناء تمرين Overhead Press.',
      suggestedAction: 'استبدال البار بقبضة دمبل محايدة مائلة وتفعيل روتين الكفة المدورة.',
      badgeColor: '#E11D48',
      badgeBg: '#FFF1F2',
      badgeBorder: '#FECDD3',
      badgeText: 'تنبيه مفصلي'
    },
    {
      id: 'ACT_03',
      type: 'INACTIVE',
      clientName: 'حسام البدري',
      tier: 'VIP MAX',
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
      tier: 'ELITE',
      phone: '+201123456789',
      summary: 'متبقي 3 أيام على نهاية باقة الـ 14 أسبوعاً (إنجاز -13.5 كجم).',
      suggestedAction: 'إرسال عرض تجديد الدايت العكسي والبناء العضلي الصافي.',
      badgeColor: '#4F46E5',
      badgeBg: '#EEF2FF',
      badgeBorder: '#C7D2FE',
      badgeText: 'تجديد اشتراك'
    }
  ]);

  const filteredActions = dailyActions.filter(act => {
    const matchesTab = activeTab === 'ALL' || act.type === activeTab;
    const cleanSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !cleanSearch || 
      act.clientName.toLowerCase().includes(cleanSearch) || 
      act.phone.includes(cleanSearch);
    return matchesTab && matchesSearch;
  });

  const generateNewClient = () => {
    const randomCode = 'KZ-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(randomCode);
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1180px', margin: '0 auto', direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
        
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                Command Cockpit
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                مسار الإجراءات والقرارات اليومية
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              مركز الإجراءات والقرارات اليومية
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '240px',
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => {
                generateNewClient();
                setIsNewClientModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>كود مشترك جديد</span>
            </button>
          </div>
        </div>

        {/* 3. شريط كروت الإحصائيات (KPI Metric Cards) */}
        <div className="row g-3 mb-4">
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            return (
              <div key={i} className="col-6 col-lg-3">
                <div 
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComponent style={{ width: '18px', height: '18px' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>{st.value}</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: st.color }}>{st.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. الهيكل التفاعلي 70/30 (Main Action Grid) */}
        <div className="row g-4">
          
          {/* العمود الرئيسي (70%): طابور المتابعات والقرارات */}
          <div className="col-lg-8">
            
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#FFFFFF', padding: '6px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'CHECKIN', label: 'المتابعات' },
                { id: 'CLINICAL', label: 'الشكاوى السريرية' },
                { id: 'INACTIVE', label: 'رادار الانقطاع' },
                { id: 'RENEWAL', label: 'التجديدات' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab.id ? '#0284C7' : 'transparent',
                    color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredActions.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#FFFFFF', border: '1.5px dashed #CBD5E1', borderRadius: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <CheckCircle2 style={{ width: '28px', height: '28px' }} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}>
                    رائع! تم إنهاء كافة الإجراءات والمتابعات لليوم
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
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
                      borderRadius: '18px',
                      padding: '18px',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                          {action.clientName[0]}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                              {action.clientName}
                            </h4>
                            <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {action.tier}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontFamily: 'monospace' }}>{action.phone}</span>
                        </div>
                      </div>

                      <span 
                        style={{ 
                          fontSize: '0.74rem', 
                          fontWeight: 800, 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          background: action.badgeBg, 
                          color: action.badgeColor, 
                          border: '1px solid ' + action.badgeBorder
                        }}
                      >
                        {action.badgeText}
                      </span>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px', fontSize: '0.82rem', lineHeight: '1.6' }}>
                      <div style={{ color: '#334155', marginBottom: '4px' }}>
                        <strong style={{ color: '#0F172A' }}>الحالة:</strong> {action.summary}
                      </div>
                      <div style={{ color: '#0284C7', fontWeight: 700 }}>
                        <strong style={{ color: '#0F172A' }}>القرار المقترح:</strong> {action.suggestedAction}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                      <a
                        href={'https://wa.me/' + action.phone.replace(/\D/g, '')}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '7px 14px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <MessageCircle style={{ width: '14px', height: '14px', color: '#16A34A' }} />
                        <span>محادثة واتساب</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setDailyActions(dailyActions.filter(a => a.id !== action.id));
                        }}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)'
                        }}
                      >
                        <Check style={{ width: '14px', height: '14px' }} />
                        <span>اعتماد وتحديث الخطة</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* العمود الجانبي (30%): ملخص الطوارئ وتوزيع الباقات */}
          <div className="col-lg-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* بطاقة الطوارئ السريرية السريعة */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px', color: '#E11D48' }} />
                    <span>رادار الطوارئ السريرية</span>
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    1 حالة نشطة
                  </span>
                </div>
                <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                    ياسمين فهد (إصابة كتف أيمن)
                  </span>
                  <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '0 0 10px 0', lineHeight: '1.5' }}>
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
                      color: '#0F172A',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      padding: '8px',
                      borderRadius: '10px',
                      textDecoration: 'none'
                    }}
                  >
                    استعراض بروتوكول التأهيل
                  </Link>
                </div>
              </div>

              {/* بطاقة توزيع الباقات */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                  <span>توزيع الباقات النشطة</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>باقة ماكس (VIP MAX 360°)</span>
                      <span style={{ color: '#0284C7', fontWeight: 800 }}>32 مشترك (67%)</span>
                    </div>
                    <div style={{ width: '100%', background: '#F1F5F9', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#0284C7', height: '100%', width: '67%', borderRadius: '10px' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>باقة إيليت (ELITE)</span>
                      <span style={{ color: '#4F46E5', fontWeight: 800 }}>16 مشترك (33%)</span>
                    </div>
                    <div style={{ width: '100%', background: '#F1F5F9', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#4F46E5', height: '100%', width: '33%', borderRadius: '10px' }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 5. نافذة إنشاء كود المشترك الجديد (Modal) */}
        {isNewClientModalOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsNewClientModalOpen(false);
            }}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid #E2E8F0',
                direction: 'rtl'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  توليد كود مشترك جديد
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  style={{ background: '#F1F5F9', border: 'none', width: '28px', height: '28px', borderRadius: '8px', color: '#64748B', fontSize: '1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', border: '1.5px dashed #0284C7', borderRadius: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block', fontWeight: 700, marginBottom: '4px' }}>
                  كود المتدرب المخصص:
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0284C7', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {generatedCode}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const inviteMsg = 'أهلاً بك مع كابتن كريم زكريا!\nكود الاشتراك الخاص بك هو: *' + generatedCode + '*\nرابط الدخول واستمارة التقييم:\n' + window.location.origin + '/onboarding';
                    navigator.clipboard.writeText(inviteMsg);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2500);
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {copiedCode ? 'تم نسخ رسالة الدعوة وكود المشترك بنجاح!' : 'نسخ رسالة الترحيب والواتساب'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  style={{
                    width: '100%',
                    background: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 700,
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
