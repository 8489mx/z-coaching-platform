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
import AdminLayout from '../components/layout/AdminLayout';
import { generateWhatsAppCoachingScript } from '../utils/whatsappScriptEngine';

export default function CoachCommandCenter() {
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
    </AdminLayout>
  );
}
