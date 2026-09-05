import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ActivitySquare, Scale, Ruler, Award, Activity, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Flame, Clock, FileText, MessageCircle, ChevronLeft, Check, UserCheck } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import CaseStudyModal from '../components/modals/CaseStudyModal';
import { generateWhatsAppCoachingScript } from '../utils/whatsappScriptEngine';

export default function ProgressClone() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get('user_id') || '1');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachNotes, setCoachNotes] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [caseStudyOpen, setCaseStudyOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientCheckins(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/clients`);
      const data = await res.json();
      if (data.clients && data.clients.length > 0) {
        setClients(data.clients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientCheckins = async (uid) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/history/${uid}`);
      const data = await res.json();
      if (data.checkins) {
        setCheckins(data.checkins);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveCheckin = async (checkinId) => {
    try {
      setApprovingId(checkinId);
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          coach_notes: coachNotes || 'تمت مراجعة واعتماد المتابعة الأسبوعية وتحديث الخطة النشطة بنجاح.'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل اعتماد المتابعة');

      alert('تم اعتماد التعديل وتحديث الخطة النشطة للمتدرب بنجاح!');
      fetchClientCheckins(selectedClientId);
      window.dispatchEvent(new Event('checkin_approved'));
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const activeClient = clients.find(c => String(c.id) === String(selectedClientId)) || clients[0] || { full_name: 'سارة المنصوري', client_code: '1' };

  return (
    <AdminLayout>
      <div style={{ direction: 'rtl', fontFamily: 'Alexandria, Cairo, sans-serif' }}>
        
        {/* 1. Header & Client Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                محرك التكيف والـ Auto-Regulation
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                Engine 7 Review Hub
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              مركز المتابعات الأسبوعية واعتماد التعديلات
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>المتدرب:</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                height: '40px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                padding: '0 14px',
                fontSize: '0.86rem',
                fontWeight: 700,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
              }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  #{c.client_code || c.id} - {c.full_name} ({c.subscription_package || 'باقة ماكس'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCaseStudyOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                padding: '0 14px',
                height: '40px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Award style={{ width: '14px', height: '14px', color: '#D97706' }} />
              <span>بطاقة التحول (Case Study)</span>
            </button>

            <Link
              to={`/check-in?user_id=${selectedClientId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '0 16px',
                height: '40px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>+ تسجيل متابعة جديدة</span>
            </Link>
          </div>
        </div>

        {/* 2. Main Review Stream */}
        {checkins.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '48px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <ActivitySquare style={{ width: '28px', height: '28px' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              لا توجد متابعات مسجلة لهذا المتدرب حتى الآن
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              يمكنك فتح استمارة المتابعة وتسجيل الأسبوع الأول لتفعيل خوارزمية التكيف ومقارنة المقاييس الحيوية.
            </p>
            <Link
              to={`/check-in?user_id=${selectedClientId}&week=1`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0284C7',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>تسجيل تقرير الأسبوع الأول</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {checkins.map((chk) => {
              const analysis = chk.analysis_output || {};
              const bio = chk.biofeedback || {};
              const isApproved = chk.status === 'APPROVED';

              return (
                <div 
                  key={chk.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    border: isApproved ? '1px solid #E2E8F0' : '2px solid #38BDF8',
                    padding: '24px 28px',
                    boxShadow: isApproved ? '0 1px 4px rgba(15, 23, 42, 0.03)' : '0 8px 25px rgba(2, 132, 199, 0.08)'
                  }}
                >
                  {/* Top Bar of Check-in Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, background: '#0F172A', color: '#FFFFFF', padding: '4px 10px', borderRadius: '8px' }}>
                        الأسبوع {chk.week_number}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        تاريخ التسليم: {new Date(chk.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isApproved ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check style={{ width: '13px', height: '13px' }} />
                          <span>تم الاعتماد وتحديث الخطة</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '13px', height: '13px' }} />
                          <span>في انتظار مراجعة واعتماد الكوتش</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4 Pillars Summary Grid */}
                  <div className="row g-3 mb-4">
                    
                    {/* Weight & Waist */}
                    <div className="col-12 col-md-3">
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>الوزن الحالي والتغير:</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <strong style={{ fontSize: '1.2rem', color: '#0F172A', fontFamily: 'monospace' }}>
                            {chk.average_weight_kg} كجم
                          </strong>
                          {analysis.weight_change_kg !== null && (
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: analysis.weight_change_kg <= 0 ? '#059669' : '#DC2626' }}>
                              ({analysis.weight_change_kg > 0 ? '+' : ''}{analysis.weight_change_kg} كجم)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Waist Circumference */}
                    <div className="col-12 col-md-3">
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>محيط الوسط (السرة):</span>
                        <strong style={{ fontSize: '1.2rem', color: '#0F172A', fontFamily: 'monospace' }}>
                          {chk.waist_circumference_cm ? `${chk.waist_circumference_cm} سم` : 'غير محدد'}
                        </strong>
                      </div>
                    </div>

                    {/* Nutrition Adherence */}
                    <div className="col-12 col-md-3">
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>الالتزام الغذائي:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '1.2rem', color: '#0284C7', fontFamily: 'monospace' }}>
                            {chk.nutrition_adherence_percent}%
                          </strong>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>
                            {chk.nutrition_adherence_percent >= 85 ? '(ممتاز)' : '(يحتاج انضباط)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Biofeedback Radar */}
                    <div className="col-12 col-md-3">
                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>مؤشرات التوافق الحيوي:</span>
                        <div style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 700 }}>
                          <span>الجوع: {bio.hunger_level || 3}/10</span> | <span>الطاقة: {bio.energy_level || 8}/10</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Smart Adaptation Recommendation Card (Engine 7) */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '20px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1', fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>
                      <Activity style={{ width: '18px', height: '18px' }} />
                      <span>توصية محرك التكيف التلقائي (Auto-Regulation Directive):</span>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E0F2FE', marginBottom: '10px' }}>
                      <strong style={{ color: '#0F172A', fontSize: '0.86rem', display: 'block', marginBottom: '4px' }}>
                        التشخيص: {analysis.analysis_status || 'ON_TRACK (النزول يسير وفق المعدل المستهدف)'}
                      </strong>
                      {analysis.recommendations_ar && analysis.recommendations_ar.length > 0 ? (
                        analysis.recommendations_ar.map((rec, rIdx) => (
                          <p key={rIdx} style={{ fontSize: '0.82rem', color: '#334155', margin: '3px 0' }}>
                            • {rec}
                          </p>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0 }}>
                          • الاستمرار على نفس السعرات والماكروز مع الحفاظ على خطوات الـ NEAT.
                        </p>
                      )}
                    </div>

                    {/* Joint pain alert if any */}
                    {chk.pain_reports && chk.pain_reports.length > 0 && (
                      <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '10px 14px', color: '#9F1239', fontSize: '0.8rem', fontWeight: 700 }}>
                        <AlertTriangle style={{ width: '15px', height: '15px', display: 'inline', marginLeft: '6px' }} />
                        <span>تم الإبلاغ عن ألم في {chk.pain_reports[0].joint} (شدة {chk.pain_reports[0].pain_level}/10) — تم تفعيل بروتوكول حماية المفصل.</span>
                      </div>
                    )}
                  </div>

                  {/* Coach Action & Notes */}
                  {!isApproved && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                        ملاحظات وتوجيهات الكوتش للمتدرب للأسبوع القادم:
                      </label>
                      <textarea
                        rows="2"
                        placeholder="اكتب ملاحظاتك التشجيعية وتوجيهات التعديل..."
                        value={coachNotes}
                        onChange={(e) => setCoachNotes(e.target.value)}
                        style={{ width: '100%', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '0.84rem', outline: 'none' }}
                      ></textarea>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {(() => {
                          const waScript = generateWhatsAppCoachingScript({
                            client_name: activeClient.full_name || 'يا بطل',
                            phone_number: activeClient.phone_number || '01011111110',
                            decision_scenario: analysis.analysis_status || 'ON_TRACK',
                            weight_loss_kg: 0.8,
                            waist_loss_cm: 1.5,
                            affected_joint: chk.pain_reports?.[0]?.joint || 'الركبة'
                          });

                          return (
                            <a
                              href={waScript.whatsapp_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ECFDF5',
                                color: '#059669',
                                borderRadius: '10px',
                                padding: '0 16px',
                                height: '40px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              <MessageCircle style={{ width: '15px', height: '15px' }} />
                              <span>إرسال التوجيه الذكي عبر واتساب</span>
                            </a>
                          );
                        })()}

                        <button
                          type="button"
                          disabled={approvingId === chk.id}
                          onClick={() => handleApproveCheckin(chk.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#059669',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '0 20px',
                            height: '40px',
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                          }}
                        >
                          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                          <span>{approvingId === chk.id ? 'جاري التحديث...' : 'اعتماد التعديل وتحديث الخطة فوراً'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Case Study Modal */}
        {caseStudyOpen && (
          <CaseStudyModal
            client={activeClient}
            onClose={() => setCaseStudyOpen(false)}
          />
        )}

      </div>
    </AdminLayout>
  );
}
