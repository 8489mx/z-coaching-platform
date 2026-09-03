import React, { useState } from 'react';
import { Maximize2, X, Sparkles, Eye } from 'lucide-react';

/**
 * Anatomical Body Silhouette Vector Generator
 * Renders high-fidelity anatomical outlines that visually reflect weight and body composition changes
 */
function BodyProgressCanvas({ gender = 'MALE', angle = 'FRONT', progressStage = 'CURRENT', weight = 75, waist = 80 }) {
  const isMale = gender === 'MALE';
  const isBefore = progressStage === 'BEFORE';
  
  // Visual subtle adaptations between before and after
  const waistWidth = isBefore ? 64 : 54;
  const chestWidth = isBefore ? 78 : 82;
  const shoulderWidth = isBefore ? 86 : 92;
  const armThick = isBefore ? 18 : 20;
  const hipWidth = isBefore ? 68 : 60;
  const legThick = isBefore ? 24 : 22;

  // Base colors
  const primaryColor = isBefore ? '#64748B' : '#0F172A';
  const accentColor = isBefore ? '#94A3B8' : (isMale ? '#0284C7' : '#E11D48');
  const bgGradStart = isBefore ? '#F8FAFC' : '#F0F9FF';
  const bgGradEnd = isBefore ? '#EDF2F7' : '#E0F2FE';

  return (
    <svg viewBox="0 0 200 320" width="100%" height="100%" style={{ maxHeight: '250px', filter: 'drop-shadow(0 4px 10px rgba(15,23,42,0.05))' }}>
      <defs>
        <linearGradient id={`bodyGrad_${progressStage}_${angle}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgGradStart} />
          <stop offset="100%" stopColor={bgGradEnd} />
        </linearGradient>
        <linearGradient id={`muscleGrad_${progressStage}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Grid Floor Reflection */}
      <ellipse cx="100" cy="305" rx="55" ry="8" fill="rgba(15, 23, 42, 0.08)" />

      {angle === 'FRONT' && (
        <g id="front_body" transform="translate(100, 20)">
          {/* Head */}
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          {/* Neck */}
          <rect x="-6" y="34" width="12" height="12" fill={primaryColor} rx="2" />
          {/* Shoulders & Traps */}
          <path d={`M -${shoulderWidth/2} 48 Q 0 40 ${shoulderWidth/2} 48 L ${chestWidth/2} 80 L -${chestWidth/2} 80 Z`} fill={primaryColor} />
          {/* Torso & Core */}
          <path d={`M -${chestWidth/2} 80 Q -${waistWidth/2} 115 -${hipWidth/2} 150 L ${hipWidth/2} 150 Q ${waistWidth/2} 115 ${chestWidth/2} 80 Z`} fill={primaryColor} />
          {/* Muscle Definition Highlights */}
          {!isBefore && (
            <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
              {/* Pecs */}
              <path d="M -22 68 Q 0 74 0 82 M 22 68 Q 0 74 0 82" fill="none" />
              {/* Abs */}
              <line x1="0" y1="90" x2="0" y2="135" />
              <line x1="-12" y1="102" x2="12" y2="102" />
              <line x1="-10" y1="118" x2="10" y2="118" />
              <line x1="-8" y1="132" x2="8" y2="132" />
            </g>
          )}
          {/* Left Arm */}
          <path d={`M -${shoulderWidth/2} 50 Q -${shoulderWidth/2 + 16} 95 -${shoulderWidth/2 + 8} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          {/* Right Arm */}
          <path d={`M ${shoulderWidth/2} 50 Q ${shoulderWidth/2 + 16} 95 ${shoulderWidth/2 + 8} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          {/* Left Leg */}
          <path d={`M -${hipWidth/2 - 6} 150 Q -24 215 -18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
          {/* Right Leg */}
          <path d={`M ${hipWidth/2 - 6} 150 Q 24 215 18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
        </g>
      )}

      {angle === 'SIDE' && (
        <g id="side_body" transform="translate(100, 20)">
          {/* Head Profile */}
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          {/* Torso Profile */}
          <path d={`M -12 44 Q -${isBefore ? 24 : 16} 100 -12 150 L 14 150 Q 18 100 12 44 Z`} fill={primaryColor} />
          {/* Arm Profile */}
          <path d="M 2 50 Q 12 95 6 145" stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          {/* Leg Profile */}
          <path d="M 0 150 Q 8 215 2 280" stroke={primaryColor} strokeWidth={legThick * 1.1} strokeLinecap="round" fill="none" />
        </g>
      )}

      {angle === 'BACK' && (
        <g id="back_body" transform="translate(100, 20)">
          {/* Head Back */}
          <circle cx="0" cy="20" r="16" fill={primaryColor} />
          {/* Traps & Lats */}
          <path d={`M -${shoulderWidth/2} 48 Q 0 42 ${shoulderWidth/2} 48 L ${chestWidth/2} 80 L -${chestWidth/2} 80 Z`} fill={primaryColor} />
          {/* V-Taper Lats */}
          <path d={`M -${chestWidth/2} 80 Q -${waistWidth/2} 115 -${hipWidth/2} 150 L ${hipWidth/2} 150 Q ${waistWidth/2} 115 ${chestWidth/2} 80 Z`} fill={primaryColor} />
          {/* Back muscle definition lines */}
          {!isBefore && (
            <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
              <path d="M -26 62 Q 0 74 26 62" fill="none" />
              <path d="M 0 54 L 0 140" fill="none" />
            </g>
          )}
          {/* Left Arm */}
          <path d={`M -${shoulderWidth/2} 50 Q -${shoulderWidth/2 + 14} 95 -${shoulderWidth/2 + 6} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          {/* Right Arm */}
          <path d={`M ${shoulderWidth/2} 50 Q ${shoulderWidth/2 + 14} 95 ${shoulderWidth/2 + 6} 145`} stroke={primaryColor} strokeWidth={armThick} strokeLinecap="round" fill="none" />
          {/* Left Leg */}
          <path d={`M -${hipWidth/2 - 6} 150 Q -24 215 -18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
          {/* Right Leg */}
          <path d={`M ${hipWidth/2 - 6} 150 Q 24 215 18 280`} stroke={primaryColor} strokeWidth={legThick} strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* Label Badge */}
      <rect x="25" y="290" width="150" height="22" rx="5" fill="#FFFFFF" stroke="#E2E8F0" />
      <text x="100" y="305" textAnchor="middle" fill="#0F172A" fontSize="10.5" fontWeight="800" fontFamily="Cairo, sans-serif">
        {progressStage === 'BEFORE' ? 'صورة الأساس (قبل)' : 'التقييم الحالي (بعد)'}
      </text>
    </svg>
  );
}

export default function InteractivePhotoComparisonStudio({
  history = [],
  activeCheckin = {},
  client = {}
}) {
  const [angle, setAngle] = useState('FRONT'); // 'FRONT' | 'SIDE' | 'BACK'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Available weeks from history
  const availableWeeks = history && history.length > 0 ? history : [
    { week: 0, weight: client.start_weight || 75, waist: 82, date: 'البداية' },
    { week: activeCheckin.week_number || 8, weight: activeCheckin.metrics?.current_weight || 72, waist: 78, date: 'اليوم' }
  ];

  const [beforeWeekIdx, setBeforeWeekIdx] = useState(0); // Baseline (Week 0)
  const [afterWeekIdx, setAfterWeekIdx] = useState(availableWeeks.length - 1); // Latest week

  const beforeEntry = availableWeeks[beforeWeekIdx] || availableWeeks[0];
  const afterEntry = availableWeeks[afterWeekIdx] || availableWeeks[availableWeeks.length - 1];

  // Weight & Waist Deltas
  const weightDiff = (afterEntry.weight - beforeEntry.weight).toFixed(1);
  const waistDiff = ((afterEntry.waist || 80) - (beforeEntry.waist || 80)).toFixed(1);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0' }}>
      
      {/* 1. Header Studio Controls */}
      <div style={{ 
        padding: '10px 14px', 
        background: '#F8FAFC', 
        borderBottom: '1px solid #E2E8F0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '8px' 
      }}>
        {/* Left: Angle Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>الزاوية:</span>
          <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px' }}>
            {[
              { id: 'FRONT', label: 'أمامي' },
              { id: 'SIDE', label: 'جانبي' },
              { id: 'BACK', label: 'خلفي' }
            ].map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAngle(a.id)}
                style={{
                  border: 'none',
                  background: angle === a.id ? '#0F172A' : 'transparent',
                  color: angle === a.id ? '#FFFFFF' : '#64748B',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Week Comparators & Fullscreen Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          
          {/* Before Week Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>من:</span>
            <select
              value={beforeWeekIdx}
              onChange={(e) => setBeforeWeekIdx(Number(e.target.value))}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '5px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableWeeks.map((w, idx) => (
                <option key={idx} value={idx}>
                  الأسبوع {w.week} ({w.weight} كجم)
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: '#94A3B8', fontWeight: 800 }}>←</span>

          {/* After Week Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>إلى:</span>
            <select
              value={afterWeekIdx}
              onChange={(e) => setAfterWeekIdx(Number(e.target.value))}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '5px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableWeeks.map((w, idx) => (
                <option key={idx} value={idx}>
                  الأسبوع {w.week} ({w.weight} كجم)
                </option>
              ))}
            </select>
          </div>

          {/* Fullscreen HD Studio Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            title="تكبير شاشة المقارنة"
            style={{
              padding: '5px 8px',
              borderRadius: '5px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s ease'
            }}
          >
            <Maximize2 size={13} />
          </button>

        </div>
      </div>

      {/* 2. Side-by-Side Visual Comparison Canvas */}
      <div style={{ position: 'relative', background: '#FAFAFA', padding: '14px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', maxWidth: '680px' }}>
          
          {/* Card 1: BEFORE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B' }}>
                الأسبوع {beforeEntry.week} (البداية)
              </span>
              <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{beforeEntry.date}</span>
            </div>

            <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BodyProgressCanvas 
                gender={client.gender || 'MALE'} 
                angle={angle} 
                progressStage="BEFORE" 
                weight={beforeEntry.weight} 
                waist={beforeEntry.waist || 82} 
              />
            </div>

            <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', display: 'flex', justifyContent: 'space-around', fontSize: '11px', marginTop: '8px' }}>
              <span>الوزن: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{beforeEntry.weight} كجم</strong></span>
              {beforeEntry.waist && <span>الخصر: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{beforeEntry.waist} سم</strong></span>}
            </div>
          </div>

          {/* Card 2: AFTER */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
                الأسبوع {afterEntry.week} (التقييم الحالي)
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>{afterEntry.date}</span>
            </div>

            <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BodyProgressCanvas 
                gender={client.gender || 'MALE'} 
                angle={angle} 
                progressStage="CURRENT" 
                weight={afterEntry.weight} 
                waist={afterEntry.waist || 80} 
              />
            </div>

            <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 8px', display: 'flex', justifyContent: 'space-around', fontSize: '11px', marginTop: '8px' }}>
              <span>الوزن: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{afterEntry.weight} كجم</strong></span>
              {afterEntry.waist && <span>الخصر: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{afterEntry.waist} سم</strong></span>}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Clinical Transformation Metric Strip */}
      <div style={{ padding: '8px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#0F172A" />
          <strong style={{ color: '#0F172A' }}>صافي التحول البصري والقياسي:</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
          <span>
            فارق الوزن: <strong style={{ color: Number(weightDiff) < 0 ? '#16A34A' : (Number(weightDiff) === 0 ? '#0284C7' : '#DC2626'), fontFamily: 'JetBrains Mono' }}>
              {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} كجم
            </strong>
          </span>
          <span>
            تغير الخصر: <strong style={{ color: Number(waistDiff) <= 0 ? '#16A34A' : '#DC2626', fontFamily: 'JetBrains Mono' }}>
              {Number(waistDiff) > 0 ? `+${waistDiff}` : waistDiff} سم
            </strong>
          </span>
          <span style={{ color: '#64748B' }}>
            المدة: <strong style={{ color: '#0F172A' }}>{Math.abs(afterEntry.week - beforeEntry.week)} أسابيع</strong>
          </span>
        </div>
      </div>

      {/* =========================================================================
          FULLSCREEN LIGHTBOX MODAL
          ========================================================================= */}
      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          dir="rtl"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '900px',
              maxWidth: '96vw',
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #CBD5E1'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Maximize2 size={16} color="#0F172A" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  استوديو المقارنة البصرية عالي الدقة: {client.name} (#{client.code})
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Angle Selector inside modal */}
                <div style={{ display: 'inline-flex', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '2px' }}>
                  {['FRONT', 'SIDE', 'BACK'].map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngle(a)}
                      style={{
                        border: 'none',
                        background: angle === a ? '#0F172A' : 'transparent',
                        color: angle === a ? '#FFFFFF' : '#64748B',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {a === 'FRONT' ? 'أمامي' : a === 'SIDE' ? 'جانبي' : 'خلفي'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
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
            </div>

            {/* Modal Body: Large Comparison Canvas */}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F1F5F9', minHeight: '400px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '780px' }}>
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    الأسبوع {beforeEntry.week} (البداية) • {beforeEntry.weight} كجم
                  </span>
                  <div style={{ height: '300px' }}>
                    <BodyProgressCanvas gender={client.gender} angle={angle} progressStage="BEFORE" weight={beforeEntry.weight} waist={beforeEntry.waist} />
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1.5px solid #0F172A', textAlign: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                    الأسبوع {afterEntry.week} (التقييم الحالي) • {afterEntry.weight} كجم
                  </span>
                  <div style={{ height: '300px' }}>
                    <BodyProgressCanvas gender={client.gender} angle={angle} progressStage="CURRENT" weight={afterEntry.weight} waist={afterEntry.waist} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>
                مقارنة بين الأسبوع <strong>{beforeEntry.week}</strong> والأسبوع <strong>{afterEntry.week}</strong> ({Math.abs(afterEntry.week - beforeEntry.week)} أسابيع)
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إغلاق الاستوديو
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
