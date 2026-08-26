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
  Phone
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import NewClientQuickModal from '../components/modals/NewClientQuickModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function CoachCommandCenter() {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CHECKIN' | 'CLINICAL' | 'INACTIVE' | 'RENEWAL'
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // إحصائيات سريعة للـ KPI Cards (Monochrome Minimalist)
  const stats = [
    { title: 'إجمالي المشتركين النشطين', value: '48', trend: '+12%', trendLabel: 'هذا الشهر', icon: Users },
    { title: 'متابعات تنتظر الاعتماد', value: '2', trend: 'عاجل', trendLabel: 'اليوم', icon: Clock },
    { title: 'طوارئ المفاصل والعيادة', value: '1', trend: 'طوارئ', trendLabel: 'تدخل عاجل', icon: ShieldAlert },
    { title: 'تجديدات خلال 7 أيام', value: '3', trend: 'تنبيه', trendLabel: 'باقات منتهية', icon: Hourglass },
  ];

  // المهام والإجراءات اليومية
  const [dailyActions, setDailyActions] = useState([
    {
      id: 'ACT_01',
      type: 'CHECKIN',
      clientName: 'سارة المنصوري',
      tier: 'باقة MAX',
      phone: '+966 50 123 4567',
      summary: 'نزول 1.6 كجم من الوزن والمحيطات في أسبوعين.',
      suggestedAction: 'الاستمرار بنفس العجز السعري وتثبيت الماكروز.',
      badgeText: 'متابعة أسبوعية'
    },
    {
      id: 'ACT_02',
      type: 'CLINICAL',
      clientName: 'ياسمين فهد',
      tier: 'باقة ELITE',
      phone: '+971 50 987 6543',
      summary: 'نغزة ألم في الكتف الأيمن (6/10) أثناء تمرين Overhead Press.',
      suggestedAction: 'استبدال البار بقبضة دمبل محايدة مائلة وتفعيل روتين الكفة المدورة.',
      badgeText: 'تنبيه مفصلي'
    },
    {
      id: 'ACT_03',
      type: 'INACTIVE',
      clientName: 'حسام البدري',
      tier: 'باقة MAX',
      phone: '+20 10 1234 5678',
      summary: 'لم يسجل أي تمرين أو وجبة منذ أكثر من 48 ساعة.',
      suggestedAction: 'إرسال رسالة تشجيع واطمئنان على الواتساب.',
      badgeText: 'انقطاع 48 ساعة'
    },
    {
      id: 'ACT_04',
      type: 'RENEWAL',
      clientName: 'أحمد فتحي',
      tier: 'باقة ELITE',
      phone: '+20 11 2345 6789',
      summary: 'متبقي 3 أيام على نهاية باقة الـ 16 أسبوعاً (إنجاز -13.5 كجم).',
      suggestedAction: 'إرسال عرض تجديد الدايت العكسي والبناء العضلي الصافي.',
      badgeText: 'تجديد اشتراك'
    }
  ]);

  const filteredActions = dailyActions.filter(act => activeTab === 'ALL' || act.type === activeTab);

  return (
    <AdminLayout onOpenNewClient={() => setIsNewClientModalOpen(true)}>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="لوحة التحكم والقرارات اليومية"
          description="مؤشرات الأداء المباشرة، طابور المتابعات الأسبوعية، والقرارات السريرية المطلوب اعتمادها."
          badge={<span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 800, padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px' }}>مركز العمليات</span>}
          actions={(
            <button 
              type="button" 
              onClick={() => setIsNewClientModalOpen(true)}
              style={{
                height: '38px',
                padding: '0 18px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} />
              <span>كود مشترك جديد</span>
            </button>
          )}
        />

        {/* 2. Executive KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {stats.map((st, i) => {
            const IconComponent = st.icon;
            return (
              <div 
                key={i} 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>{st.title}</span>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={17} strokeWidth={2} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif', lineHeight: 1 }}>
                    {st.value}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    <span dir="ltr" style={{ fontWeight: 800 }}>{st.trend}</span>
                    <span>{st.trendLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Balanced Dual Column Layout (70 / 30) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
          
          {/* Main Action Feed (Right in RTL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <FormSection 
              title="طابور القرارات والمتابعات اليومية" 
              description="الإجراءات والمراجعات المطلوب اعتمادها وإرسالها للمشتركين."
              actions={(
                <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                        background: activeTab === tab.id ? '#0F172A' : 'transparent',
                        color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            >
              {/* Action Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                {filteredActions.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      تم إنهاء كافة الإجراءات والمتابعات لليوم
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
                        padding: '18px 20px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12.5px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {'#' + action.id.replace('ACT_0', '')}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                                {action.clientName}
                              </strong>
                              <span style={{ fontSize: '11px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                {action.tier}
                              </span>
                              <span style={{ fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                {action.badgeText}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={11} color="#94A3B8" />
                              <span dir="ltr" style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                {action.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.65' }}>
                        <div style={{ color: '#334155', marginBottom: '6px' }}>
                          <strong style={{ color: '#0F172A' }}>الحالة:</strong> {action.summary}
                        </div>
                        <div style={{ color: '#0F172A', fontWeight: 800 }}>
                          <strong style={{ color: '#0F172A' }}>القرار المقترح:</strong> {action.suggestedAction}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                        <a
                          href={'https://wa.me/' + action.phone.replace(/\D/g, '')}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '7px 16px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <MessageCircle size={15} color="#16A34A" />
                          <span>محادثة واتساب</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setDailyActions(dailyActions.filter(a => a.id !== action.id));
                          }}
                          style={{
                            padding: '7px 18px',
                            borderRadius: '8px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)'
                          }}
                        >
                          <Check size={15} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Clinical Alerts Card */}
            <FormSection 
              title="رادار الطوارئ السريرية" 
              description="تنبيهات الآلام والمفاصل والتدخلات العاجلة."
              actions={<span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>1 حالة نشطة</span>}
            >
              <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginTop: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  ياسمين فهد (إصابة كتف أيمن)
                </strong>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px 0', lineHeight: '1.55' }}>
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
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '8px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
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
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة MAX</span>
                    <strong style={{ color: '#0F172A', fontWeight: 800 }}>
                      <span dir="ltr">67%</span> (32 مشترك)
                    </strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#0F172A', height: '100%', width: '67%', borderRadius: '6px' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>باقة ELITE</span>
                    <strong style={{ color: '#64748B', fontWeight: 800 }}>
                      <span dir="ltr">33%</span> (16 مشترك)
                    </strong>
                  </div>
                  <div style={{ width: '100%', background: '#F1F5F9', height: '6px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#64748B', height: '100%', width: '33%', borderRadius: '6px' }}></div>
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
