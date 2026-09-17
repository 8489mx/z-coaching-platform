import React, { useState } from 'react';
import { X, Award, Download, Copy, Check, Share2, Sparkles, TrendingDown } from 'lucide-react';

export function MilestoneProgressCardModal({
  isOpen,
  onClose,
  client = {},
  activeCheckin = {},
  history = []
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const clientName = client.full_name || 'بطل المنظومة';
  const clientCode = client.client_code ? `#${client.client_code}` : '';
  const goalLabel = client.goal_label || 'خسارة دهون وبناء عضلي متوازن';

  // Compute milestones
  const historyList = Array.isArray(history) ? history : [];
  const startWeight = Number(historyList[0]?.weight_kg || client.initial_weight || client.weight || 85);
  const currentWeight = Number(activeCheckin?.weight_kg || historyList[historyList.length - 1]?.weight_kg || startWeight);
  const weightDropKg = Math.max(0, Number((startWeight - currentWeight).toFixed(1)));

  const startWaist = Number(historyList[0]?.waist_cm || client.initial_waist || client.waist || 90);
  const currentWaist = Number(activeCheckin?.waist_cm || historyList[historyList.length - 1]?.waist_cm || startWaist);
  const waistDropCm = Math.max(0, Number((startWaist - currentWaist).toFixed(1)));

  const weeksCount = Math.max(1, Number(activeCheckin?.week_number) || historyList.length || 4);

  const dietAdh = Number(activeCheckin?.diet_adherence_percentage) || 90;
  const trainAdh = Number(activeCheckin?.workout_adherence_percentage) || 92;
  const avgAdherence = Math.round((dietAdh + trainAdh) / 2);

  const sleepScore = Number(activeCheckin?.sleep_quality) || 4;
  const energyScore = Number(activeCheckin?.energy_level) || 4.5;
  const avgReadiness = Number(((sleepScore + energyScore) / 2).toFixed(1));

  // Copy text for WhatsApp
  const handleCopyWhatsApp = () => {
    const text = `منظومة Z Coaching Platform — تقرير الإنجاز الرياضي\n\n` +
      `البطل: ${clientName} ${clientCode}\n` +
      `الهدف: ${goalLabel}\n` +
      `الفترة التدريبية: ${weeksCount} أسابيع مكتملة\n\n` +
      `مؤشرات الإنجاز المعتمدة:\n` +
      `- إجمالي نزول الوزن: -${weightDropKg} كجم\n` +
      `- انخفاض محيط الخصر: -${waistDropCm} سم\n` +
      `- معدل الالتزام العام: ${avgAdherence}%\n` +
      `- مؤشر الجاهزية والتعافي: ${avgReadiness} / 5\n\n` +
      `إنجاز فسيولوجي متميز يعكس انضباطك العالي. استمر في التطور نحو هدفك القادم.\n` +
      `إشراف: كابتن زكريا — كبير المدربين الإكلينيكيين`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download SVG
  const handleDownloadSvg = () => {
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" dir="rtl" style="background:#0F172A; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#022C22" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
  </defs>

  <!-- Card Background -->
  <rect x="0" y="0" width="800" height="500" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>

  <!-- Top Accent Bar -->
  <rect x="30" y="24" width="740" height="4" rx="2" fill="url(#goldGrad)"/>

  <!-- Brand Title -->
  <text x="750" y="65" text-anchor="start" font-size="20" font-weight="900" fill="#F8FAFC" letter-spacing="1">Z COACHING PLATFORM</text>
  <text x="750" y="88" text-anchor="start" font-size="12" font-weight="700" fill="#94A3B8">شهادة التميز والإنجاز الفسيولوجي المتقدم</text>

  <!-- Client Header Box -->
  <rect x="30" y="110" width="740" height="75" rx="14" fill="rgba(30, 41, 59, 0.7)" stroke="#334155" stroke-width="1"/>
  <text x="740" y="145" text-anchor="start" font-size="18" font-weight="800" fill="#F8FAFC">${clientName} ${clientCode}</text>
  <text x="740" y="170" text-anchor="start" font-size="12" font-weight="600" fill="#38BDF8">الهدف: ${goalLabel} | الفترة التدريبية: ${weeksCount} أسابيع مكتملة</text>

  <!-- KPI Badges Grid (4 Badges) -->
  <!-- Badge 1: Weight Loss -->
  <rect x="590" y="205" width="180" height="110" rx="14" fill="url(#badgeGrad)" stroke="#334155" stroke-width="1.5"/>
  <text x="680" y="235" text-anchor="middle" font-size="12" font-weight="700" fill="#94A3B8">إجمالي نزول الوزن</text>
  <text x="680" y="275" text-anchor="middle" font-size="28" font-weight="900" fill="#10B981">-${weightDropKg} كجم</text>
  <text x="680" y="300" text-anchor="middle" font-size="11" font-weight="600" fill="#6EE7B7">كتلة دهنية مستهدفة</text>

  <!-- Badge 2: Waist Reduction -->
  <rect x="400" y="205" width="175" height="110" rx="14" fill="url(#badgeGrad)" stroke="#334155" stroke-width="1.5"/>
  <text x="487" y="235" text-anchor="middle" font-size="12" font-weight="700" fill="#94A3B8">انخفاض محيط الخصر</text>
  <text x="487" y="275" text-anchor="middle" font-size="28" font-weight="900" fill="#38BDF8">-${waistDropCm} سم</text>
  <text x="487" y="300" text-anchor="middle" font-size="11" font-weight="600" fill="#BAE6FD">انكماش الدهون الحشوية</text>

  <!-- Badge 3: Cumulative Adherence -->
  <rect x="215" y="205" width="170" height="110" rx="14" fill="url(#badgeGrad)" stroke="#334155" stroke-width="1.5"/>
  <text x="300" y="235" text-anchor="middle" font-size="12" font-weight="700" fill="#94A3B8">الالتزام التراكمي</text>
  <text x="300" y="275" text-anchor="middle" font-size="28" font-weight="900" fill="#F59E0B">${avgAdherence}%</text>
  <text x="300" y="300" text-anchor="middle" font-size="11" font-weight="600" fill="#FDE68A">انضباط غذائي وتدريبي</text>

  <!-- Badge 4: Readiness & Recovery -->
  <rect x="30" y="205" width="170" height="110" rx="14" fill="url(#badgeGrad)" stroke="#334155" stroke-width="1.5"/>
  <text x="115" y="235" text-anchor="middle" font-size="12" font-weight="700" fill="#94A3B8">مؤشر الجاهزية والتعافي</text>
  <text x="115" y="275" text-anchor="middle" font-size="28" font-weight="900" fill="#A855F7">${avgReadiness} / 5</text>
  <text x="115" y="300" text-anchor="middle" font-size="11" font-weight="600" fill="#E9D5FF">استشفاء عصبي مثالي</text>

  <!-- Motivational Box -->
  <rect x="30" y="335" width="740" height="70" rx="12" fill="rgba(15, 23, 42, 0.8)" stroke="#1E293B" stroke-width="1"/>
  <text x="740" y="365" text-anchor="start" font-size="13" font-weight="700" fill="#CBD5E1">"إنجاز فسيولوجي متميز يعكس انضباطك الصارم بالبروتوكول الرياضي والغذائي المعتمد."</text>
  <text x="740" y="388" text-anchor="start" font-size="11.5" font-weight="600" fill="#94A3B8">استمر في البناء على هذه المعايير لتحقيق كامل إمكاناتك البدنية.</text>

  <!-- Footer Signature -->
  <line x1="30" y1="430" x2="770" y2="430" stroke="#334155" stroke-width="1"/>
  <text x="750" y="465" text-anchor="start" font-size="12" font-weight="700" fill="#F8FAFC">كابتن زكريا — كبير المدربين الإكلينيكيين</text>
  <text x="50" y="465" text-anchor="end" font-size="11" font-weight="600" fill="#64748B">منظومة Z Coaching Platform المعتمدة</text>
</svg>
    `.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milestone-card-${client.client_code || 'trainee'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0F172A',
            color: '#FFFFFF',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#F59E0B" />
            <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>
              بطاقة الإنجاز التراكمي المعتمدة للمشترك
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Card Visual Preview */}
        <div style={{ padding: '20px', background: '#F1F5F9' }}>
          
          <div
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #064E3B 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Top Brand Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase' }}>
                  Z COACHING PLATFORM
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800, color: '#F8FAFC' }}>
                  شهادة التميز والإنجاز الفسيولوجي المتقدم
                </h3>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1' }}>
                {weeksCount} أسابيع مكتملة
              </span>
            </div>

            {/* Trainee Identity */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC' }}>
                {clientName} <span style={{ fontSize: '12px', color: '#94A3B8' }}>{clientCode}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#38BDF8', marginTop: '2px' }}>
                الهدف الرياضي والتغذوي المعتمد: {goalLabel}
              </div>
            </div>

            {/* KPI Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>إجمالي نزول الوزن</span>
                <strong style={{ fontSize: '20px', color: '#10B981', fontFamily: 'JetBrains Mono', display: 'block', marginTop: '2px' }}>
                  -{weightDropKg} كجم
                </strong>
                <span style={{ fontSize: '9.5px', color: '#6EE7B7' }}>كتلة دهنية صافية</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>انخفاض محيط الخصر</span>
                <strong style={{ fontSize: '20px', color: '#38BDF8', fontFamily: 'JetBrains Mono', display: 'block', marginTop: '2px' }}>
                  -{waistDropCm} سم
                </strong>
                <span style={{ fontSize: '9.5px', color: '#BAE6FD' }}>انكماش الدهون الحشوية</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>الالتزام التراكمي</span>
                <strong style={{ fontSize: '20px', color: '#F59E0B', fontFamily: 'JetBrains Mono', display: 'block', marginTop: '2px' }}>
                  {avgAdherence}%
                </strong>
                <span style={{ fontSize: '9.5px', color: '#FDE68A' }}>انضباط غذائي وتدريبي</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>الجاهزية والتعافي</span>
                <strong style={{ fontSize: '20px', color: '#A855F7', fontFamily: 'JetBrains Mono', display: 'block', marginTop: '2px' }}>
                  {avgReadiness} / 5
                </strong>
                <span style={{ fontSize: '9.5px', color: '#E9D5FF' }}>استشفاء عصبي مثالي</span>
              </div>

            </div>

            {/* Directive Quote */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#CBD5E1', lineHeight: 1.4 }}>
              "إنجاز فسيولوجي متميز يعكس انضباطك الصارم بالبروتوكول الرياضي والغذائي المعتمد. استمر في البناء على هذه المعايير نحو أهدافك القادمة."
            </div>

            {/* Signature Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#94A3B8' }}>
              <span>إشراف: كابتن زكريا — كبير المدربين الإكلينيكيين</span>
              <span>منظومة Z Coaching المعتمدة</span>
            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #BBF7D0',
                background: '#F0FDF4',
                color: '#16A34A',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              <span>{copied ? 'تم نسخ النص لواتساب' : 'نسخ نص الإنجاز لواتساب'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>تحميل البطاقة بصيغة SVG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
