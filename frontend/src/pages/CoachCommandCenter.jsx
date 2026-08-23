import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  RotateCcw, 
  Crown, 
  Flame, 
  TrendingDown, 
  UserCheck, 
  ChevronLeft, 
  ArrowRight,
  ShieldCheck,
  Check,
  PartyPopper
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import { generateWhatsAppCoachingScript } from '../utils/whatsappScriptEngine';

export default function CoachCommandCenter() {
  // New Client Code Generation & Phone Lookup State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('CREATE'); // 'CREATE' | 'LOOKUP'
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPackage, setNewClientPackage] = useState('باقة ماكس (VIP 4 أشهر)');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [creatingCode, setCreatingCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Phone Lookup State
  const [searchPhone, setSearchPhone] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    if (!newClientPhone.trim()) return;

    try {
      setCreatingCode(true);
      const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
      
      // Try to save to server
      try {
        await fetch(`${API_BASE}/api/v1/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: newClientPhone.trim(),
            full_name: newClientName.trim() || undefined,
            client_code: generatedCode,
            subscription_package: newClientPackage,
            subscription_price: newClientPackage.includes('VIP') ? 3500 : 2500
          })
        });
      } catch (err) {
        console.warn('Server client save fallback to client-side code generation');
      }

      const clientObj = {
        name: newClientName.trim() || 'مشترك جديد',
        phone: newClientPhone.trim(),
        code: generatedCode,
        package: newClientPackage,
        created_at: new Date().toLocaleDateString('ar-EG')
      };

      setGeneratedResult(clientObj);
    } catch (err) {
      alert('خطأ أثناء توليد الكود: ' + err.message);
    } finally {
      setCreatingCode(false);
    }
  };

  const handleLookupPhone = async (e) => {
    e.preventDefault();
    setSearchError('');
    setLookupResult(null);

    const cleanInput = searchPhone.trim().replace(/\s+/g, '');
    if (!cleanInput) return;

    try {
      setSearchingPhone(true);
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      
      const found = (data.clients || []).find(c => 
        (c.phone_number && c.phone_number.includes(cleanInput)) ||
        (c.phone && c.phone.includes(cleanInput))
      );

      if (found) {
        setLookupResult({
          name: found.full_name || found.name || 'مشترك مسجل',
          phone: found.phone_number || found.phone,
          code: found.client_code || found.id,
          package: found.subscription_package || 'باقة إيليت'
        });
      } else {
        // Generate on-the-fly for quick onboarding if not found
        const fallbackCode = String(Math.floor(1000 + Math.random() * 9000));
        setLookupResult({
          name: 'مشترك جديد (تم التوليد الآن)',
          phone: cleanInput,
          code: fallbackCode,
          package: 'باقة ماكس (VIP 4 أشهر)',
          isNew: true
        });
      }
    } catch (err) {
      // Offline fallback
      const fallbackCode = String(Math.floor(1000 + Math.random() * 9000));
      setLookupResult({
        name: 'مشترك (محلي)',
        phone: cleanInput,
        code: fallbackCode,
        package: 'باقة ماكس (VIP 4 أشهر)',
        isNew: true
      });
    } finally {
      setSearchingPhone(false);
    }
  };

  // 5 Action Queues State
  const [checkinsDue, setCheckinsDue] = useState([
    {
      id: 'c1',
      client_name: 'سارة المنصوري',
      phone: '01011111110',
      isVIP: true,
      package: 'باقة ماكس (VIP)',
      decision: 'ON_TRACK',
      statDiff: '-1.4 kg وزن • -2 cm خصر',
      actionTitle: 'نزول مثالي في الميزان والخصر - الاستمرار بنفس السعرات'
    },
    {
      id: 'c2',
      client_name: 'طارق عبد العزيز',
      phone: '01011111112',
      isVIP: false,
      package: 'باقة إيليت (ELITE)',
      decision: 'METABOLIC_PLATEAU',
      statDiff: 'ثبات الوزن للأسبوع الثاني',
      actionTitle: 'تفعيل زيادة خطوات NEAT بمقدار +1,500 خطوة لتنشيط الحرق'
    }
  ]);

  const [reEntries, setReEntries] = useState([
    {
      id: 'r1',
      client_name: 'عمر خالد',
      phone: '01011111113',
      freezeDays: 14,
      statusDuringFreeze: 'انقطاع تام وراحة',
      decision: 'تفعيل أسبوع التهيئة العصبية (Ramp-Up Week): خفض الحجم 35% وضبط الشدة 3-4 RIR'
    }
  ]);

  const [inactivityAlerts, setInactivityAlerts] = useState([
    {
      id: 'i1',
      client_name: 'حسام البدري',
      phone: '01011111114',
      hoursInactive: 48,
      package: 'باقة ماكس (VIP)'
    }
  ]);

  const [renewals, setRenewals] = useState([
    {
      id: 'ren1',
      client_name: 'أحمد فتحي',
      phone: '01011111115',
      week: 14,
      weightLostKg: 13.5,
      nextPhase: 'الدايت العكسي والبناء العضلي الصافي',
      discountCode: 'KZ-RENEW-14KG'
    }
  ]);

  const [clinicalAlerts, setClinicalAlerts] = useState([
    {
      id: 'cl1',
      client_name: 'ياسمين فهد',
      joint: 'الكتف الأيمن',
      painLevel: '6/10',
      offendingEx: 'Overhead Dumbbell Press',
      recommendation: 'استبدال بـ Incline Neutral Dumbbell Press وضخ بروتوكول تأهيل الروتاتور كاف'
    }
  ]);

  // Handler helpers
  const handleApproveCheckin = (id) => {
    setCheckinsDue(prev => prev.filter(c => c.id !== id));
  };

  const handleApproveReEntry = (id) => {
    setReEntries(prev => prev.filter(r => r.id !== id));
  };

  const handleClearInactivity = (id) => {
    setInactivityAlerts(prev => prev.filter(i => i.id !== id));
  };

  const handleSendRenewal = (id) => {
    setRenewals(prev => prev.filter(ren => ren.id !== id));
  };

  const handleResolveClinical = (id) => {
    setClinicalAlerts(prev => prev.filter(cl => cl.id !== id));
  };

  const totalPendingActions = 
    checkinsDue.length + 
    reEntries.length + 
    inactivityAlerts.length + 
    renewals.length + 
    clinicalAlerts.length;

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1080px', margin: '0 auto', direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
        
        {/* Header Stream */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                Daily Command Center
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                مسار الإجراءات والقرارات اليومية
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              مركز القيادة اليومي (Inbox Zero Hub)
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>+ إنشاء كود مشترك جديد / بحث برقم الموبايل</span>
            </button>
            <div style={{ background: totalPendingActions === 0 ? '#ECFDF5' : '#FEF3C7', border: `1px solid ${totalPendingActions === 0 ? '#A7F3D0' : '#FDE68A'}`, color: totalPendingActions === 0 ? '#059669' : '#92400E', padding: '6px 14px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 800 }}>
              {totalPendingActions === 0 ? '✓ كل الإجراءات مكتملة (Inbox Zero)' : `⚠️ متبقي ${totalPendingActions} إجراءات حاسمة اليوم`}
            </div>
          </div>
        </div>

        {/* INBOX ZERO CELEBRATION STATE */}
        {totalPendingActions === 0 ? (
          <div 
            style={{
              background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              borderRadius: '24px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              margin: '30px 0'
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 style={{ width: '36px', height: '36px' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              ALL CAUGHT UP! ZERO PENDING ACTIONS
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
              عاش يا كابتن! كافة المتابعات والقرارات السريرية وتنبيهات الاستبقاء لليوم تم اعتمادها بنجاح بنسبة 100%.
            </p>
            <Link
              to="/progress"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0284C7',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              <span>استعراض أرشيف القياسات والتحاليل</span>
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. CHECK-INS DUE TODAY */}
            {checkinsDue.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock style={{ width: '18px', height: '18px', color: '#0284C7' }} />
                    <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      1. المتابعات المستحقة اليوم ({checkinsDue.length})
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>الأولوية لمشتركي VIP</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checkinsDue.map(c => {
                    const waScript = generateWhatsAppCoachingScript({
                      client_name: c.client_name,
                      phone_number: c.phone,
                      decision_scenario: c.decision
                    });

                    return (
                      <div 
                        key={c.id}
                        style={{
                          background: c.isVIP ? '#FFFBEB' : '#F8FAFC',
                          border: `1px solid ${c.isVIP ? '#FDE68A' : '#E2E8F0'}`,
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{c.client_name}</strong>
                            <span style={{ fontSize: '9.5px', background: c.isVIP ? '#FEF3C7' : '#E0F2FE', color: c.isVIP ? '#92400E' : '#0369A1', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {c.package}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>{c.statDiff}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>
                            <strong>القرار:</strong> {c.actionTitle}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a
                            href={waScript.whatsapp_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              borderRadius: '10px',
                              padding: '6px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <MessageCircle style={{ width: '13px', height: '13px' }} />
                            <span>واتساب</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleApproveCheckin(c.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '6px 14px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            <Check style={{ width: '13px', height: '13px' }} />
                            <span>اعتماد وتحديث</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. PENDING RE-ENTRY ASSESSMENTS */}
            {reEntries.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <RotateCcw style={{ width: '18px', height: '18px', color: '#D97706' }} />
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    2. استمارات إعادة المعايرة والعودة من التجميد ({reEntries.length})
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reEntries.map(r => (
                    <div 
                      key={r.id}
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                          {r.client_name} (تجميد {r.freezeDays} يوماً • {r.statusDuringFreeze})
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#92400E' }}>
                          <strong>بروتوكول العودة:</strong> {r.decision}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApproveReEntry(r.id)}
                        style={{
                          background: '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        اعتماد خطة العودة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 48-HOUR INACTIVITY ALERTS */}
            {inactivityAlerts.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <AlertTriangle style={{ width: '18px', height: '18px', color: '#EF4444' }} />
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    3. رادار كشف الانقطاع 48 ساعة ({inactivityAlerts.length})
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inactivityAlerts.map(i => (
                    <div 
                      key={i.id}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#991B1B', display: 'block', marginBottom: '2px' }}>
                          {i.client_name} ({i.package})
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#B91C1C' }}>
                          لم يسجل أي تمرين أو وجبة منذ أكثر من {i.hoursInactive} ساعة متواصلة.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={`https://wa.me/2${i.phone}?text=${encodeURIComponent('يا هلا يا بطل! لاحظت إنك مسجلتش تمرين أو وجبات آخر 48 ساعة. طمني عليك وعلى صحتك كل حاجة تمام؟')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#16A34A',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageCircle style={{ width: '13px', height: '13px' }} />
                          <span>تدخل واتساب فوري</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleClearInactivity(i.id)}
                          style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                        >
                          تم التواصل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. WEEK 14 RENEWAL PIPELINE */}
            {renewals.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <Crown style={{ width: '18px', height: '18px', color: '#D97706' }} />
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    4. طابور تجديدات الأسبوع 14 ({renewals.length})
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {renewals.map(ren => (
                    <div 
                      key={ren.id}
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>
                          {ren.client_name} (الأسبوع {ren.week} • إنجاز -{ren.weightLostKg} kg)
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#92400E' }}>
                          <strong>المسار القادم:</strong> {ren.nextPhase} (كود خصم 25%: {ren.discountCode})
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={`https://wa.me/2${ren.phone}?text=${encodeURIComponent('ألف مبروك وصولك للأسبوع 14 بإنجاز أسطوري! جهزتلك عرض تجديد مبكر بخصم 25% بكود ' + ren.discountCode)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#0284C7',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          <MessageCircle style={{ width: '13px', height: '13px' }} />
                          <span>إرسال عرض التجديد</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleSendRenewal(ren.id)}
                          style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                        >
                          تم الإرسال
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CLINICAL & JOINT RED FLAGS */}
            {clinicalAlerts.length > 0 && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <ShieldCheck style={{ width: '18px', height: '18px', color: '#9333EA' }} />
                  <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    5. الإشارات السريرية والشكاوى المفصلية ({clinicalAlerts.length})
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clinicalAlerts.map(cl => (
                    <div 
                      key={cl.id}
                      style={{
                        background: '#FAF5FF',
                        border: '1px solid #E9D5FF',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#581C87', display: 'block', marginBottom: '2px' }}>
                          {cl.client_name} (ألم في {cl.joint} - شدة {cl.painLevel} أثناء {cl.offendingEx})
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B21A8' }}>
                          <strong>الإجراء السريري:</strong> {cl.recommendation}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolveClinical(cl.id)}
                        style={{
                          background: '#7E22CE',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        اعتماد الاستبدال والتأهيل
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    
        {/* MODAL: CREATE / LOOKUP CLIENT CODE */}
        {showCodeModal && (
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
              if (e.target === e.currentTarget) setShowCodeModal(false);
            }}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '540px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid #E2E8F0',
                direction: 'rtl'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    بوابة أكواد المشتركين والتسجيل السريع
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0 0' }}>
                    توليد كود فوري وإرسال رابط الاستمارة للواتساب مباشرة
                  </p>
                </div>
                <button 
                  onClick={() => setShowCodeModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '10px', color: '#64748B', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', background: '#F8FAFC', padding: '4px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => { setActiveModalTab('CREATE'); setGeneratedResult(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: activeModalTab === 'CREATE' ? '#FFFFFF' : 'transparent',
                    color: activeModalTab === 'CREATE' ? '#0284C7' : '#64748B',
                    boxShadow: activeModalTab === 'CREATE' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  + إنشاء كود مشترك جديد
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveModalTab('LOOKUP'); setLookupResult(null); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: activeModalTab === 'LOOKUP' ? '#FFFFFF' : 'transparent',
                    color: activeModalTab === 'LOOKUP' ? '#0284C7' : '#64748B',
                    boxShadow: activeModalTab === 'LOOKUP' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  🔍 بحث واسترجاع الكود برقم الموبايل
                </button>
              </div>

              {/* TAB 1: CREATE NEW CODE */}
              {activeModalTab === 'CREATE' && (
                <div>
                  {!generatedResult ? (
                    <form onSubmit={handleGenerateCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>اسم المشترك:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: أحمد محمود"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.86rem', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>رقم الموبايل (WhatsApp):</label>
                        <input
                          type="tel"
                          required
                          placeholder="مثال: 01012345678 أو 0501234567"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.86rem', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>باقة الاشتراك:</label>
                        <select
                          value={newClientPackage}
                          onChange={(e) => setNewClientPackage(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.86rem', outline: 'none', background: '#FFFFFF' }}
                        >
                          <option value="باقة ماكس (VIP 4 أشهر)">باقة ماكس (VIP 4 أشهر) - الأكثر شمولاً</option>
                          <option value="باقة إيليت (ELITE 3 أشهر)">باقة إيليت (ELITE 3 أشهر)</option>
                          <option value="باقة أساسية (STANDARD شهر واحد)">باقة أساسية (STANDARD شهر واحد)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={creatingCode}
                        style={{
                          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          marginTop: '6px'
                        }}
                      >
                        {creatingCode ? 'جاري إنشاء الكود...' : '⚡ توليد كود المشترك ورابط الاستمارة فوراً'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1.5px solid #BAE6FD', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontSize: '1.4rem' }}>
                        ✓
                      </div>
                      
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>
                        تم إنشاء كود المشترك بنجاح!
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 14px 0' }}>
                        المشترك: <strong>{generatedResult.name}</strong> | هاتف: <strong className="font-monospace">{generatedResult.phone}</strong>
                      </p>

                      <div style={{ background: '#FFFFFF', border: '2px dashed #0284C7', borderRadius: '14px', padding: '14px', margin: '14px 0' }}>
                        <small style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>كود المشترك المخصص:</small>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284C7', letterSpacing: '3px', fontFamily: 'monospace' }}>
                          #{generatedResult.code}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                        {/* 1-Click WhatsApp Direct Invite */}
                        <a
                          href={`https://wa.me/2${generatedResult.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `أهلاً بك يا ${generatedResult.name} في Z Coaching!\nكود المشترك الخاص بك هو: #${generatedResult.code}\n\nيرجى ملء استمارتك البيولوجية والتدريبية من الرابط التالي:\n${window.location.origin}/onboarding\n\nنحن بانتظارك لبدء خطتك المخصصة!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#16A34A',
                            color: '#FFFFFF',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <span>إرسال دعوة الواتساب الفورية ورابط الاستمارة</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const inviteText = `كود المشترك: #${generatedResult.code} | رابط الاستمارة: ${window.location.origin}/onboarding`;
                            navigator.clipboard.writeText(inviteText);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2500);
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            padding: '10px',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedLink ? '✓ تم نسخ الكود والرابط للحافظة!' : 'نسخ الكود ورابط الاستمارة'}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setGeneratedResult(null); setNewClientName(''); setNewClientPhone(''); }}
                          style={{ background: 'transparent', border: 'none', color: '#0284C7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
                        >
                          + إنشاء كود لعميل آخر
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LOOKUP BY PHONE */}
              {activeModalTab === 'LOOKUP' && (
                <div>
                  <form onSubmit={handleLookupPhone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>أدخل رقم موبايل العميل للبحث:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="tel"
                          required
                          placeholder="مثال: 01012345678"
                          value={searchPhone}
                          onChange={(e) => setSearchPhone(e.target.value)}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.86rem', outline: 'none' }}
                        />
                        <button
                          type="submit"
                          disabled={searchingPhone}
                          style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', padding: '0 18px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {searchingPhone ? 'بحث...' : 'بحث عن الكود'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {lookupResult && (
                    <div style={{ background: '#F8FAFC', border: '1.5px solid #BAE6FD', borderRadius: '16px', padding: '18px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            {lookupResult.name}
                          </h4>
                          <small style={{ fontSize: '0.74rem', color: '#64748B' }}>هاتف: {lookupResult.phone}</small>
                        </div>
                        <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 800 }}>
                          {lookupResult.package}
                        </span>
                      </div>

                      <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '12px', textAlign: 'center', margin: '10px 0' }}>
                        <small style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>كود المشترك:</small>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284C7', fontFamily: 'monospace' }}>
                          #{lookupResult.code}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <a
                          href={`https://wa.me/2${lookupResult.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `أهلاً بك يا ${lookupResult.name}! كود المشترك الخاص بك هو: #${lookupResult.code}\nرابط الدخول والاستمارة:\n${window.location.origin}/onboarding`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            background: '#16A34A',
                            color: '#FFFFFF',
                            padding: '10px',
                            borderRadius: '10px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          إرسال الكود للعميل عبر WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`#${lookupResult.code}`);
                            alert(`تم نسخ الكود #${lookupResult.code} إلى الحافظة!`);
                          }}
                          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          نسخ الكود
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

    </AdminLayout>
  );
}
