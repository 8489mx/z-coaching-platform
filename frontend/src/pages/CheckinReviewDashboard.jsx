import { API_BASE } from '../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  MessageCircle,
  Camera,
  TrendingDown,
  TrendingUp,
  Minus,
  Utensils,
  Activity,
  BrainCircuit,
  Save,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  HeartPulse,
  Target,
  Dumbbell,
  Trophy,
  ExternalLink,
  Plane,
  Calendar,
  FileText,
  SlidersHorizontal,
  Send,
  X
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import InteractivePhotoComparisonStudio from '../components/checkin/InteractivePhotoComparisonStudio';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import { MilestoneProgressCardModal } from '../components/checkin/MilestoneProgressCardModal';
import { CorrectMeasurementsModal } from '../components/checkin/CorrectMeasurementsModal';
import { ClientCodeBadge, ClientPackageBadge } from '../utils/tierBadgeHelper';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';
import { evaluateJointPainAndFirewall } from '../utils/biomechanicsFirewallEngine';
import { generateCheckinApprovalWhatsAppMessage } from '../utils/checkinApprovalWhatsApp';

import DeloadRecommendationCard from '../components/checkin/DeloadRecommendationCard';
import { TableSearch } from '@/shared/components/table-search';
import { RefreshButton } from '@/shared/components/refresh-button';
import { TierFilter } from '@/shared/components/tier-filter';

const DEFAULT_BASELINE_MACROS = {
  calories: 2000,
  protein: 140,
  carbs: 220,
  fats: 60
};

// =========================================================================
// CLEAN, MINIMAL PROGRESS CHART (Z COACHING SIGNATURE STYLE)
// =========================================================================
// استوديو التحليل البياني والتاريخي المتقدم بقمرة المدرب (Coach Long-Term Analytics Studio)
// =========================================================================
function ProgressTrendChart({ history = [], isMaxTier = false, targetWeight = null, client = {}, activeCheckin = {} }) {
  const [activeTab, setActiveTab] = useState('weight'); // 'weight' | 'waist' | 'adherence' | 'biofeedback'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!history || history.length === 0) return null;

  const colorPrimary = isMaxTier ? '#C4952D' : '#0284C7';

  const startPoint = history[0];
  const latestPoint = history[history.length - 1];
  const startWeightVal = Number(client.start_weight || startPoint.weight || 75);
  const currentWeightVal = Number(latestPoint.weight || startWeightVal);
  const targetWeightVal = Number(targetWeight || client.target_weight || (startWeightVal - 6));

  const totalWeightDelta = +(currentWeightVal - startWeightVal).toFixed(1);
  const startWaistVal = Number(startPoint.waist || 0);
  const currentWaistVal = Number(latestPoint.waist || startWaistVal);
  const totalWaistDelta = startWaistVal > 0 ? (currentWaistVal - startWaistVal) : 0;

  const avgAdherence = Math.round(
    history.reduce((sum, h) => sum + (Number(h.adherence) || 0), 0) / (history.length || 1)
  );

  // Biofeedback composite
  const bio = activeCheckin?.biofeedback || {};
  const sleepVal = Number(bio.sleep_quality || 4);
  const energyVal = Number(bio.energy_in_gym || 4);
  const hungerVal = Number(bio.hunger_level || 3);
  const stressVal = Number(bio.stress_level || 2);
  const recoveryScore = Math.round(((sleepVal + energyVal + Math.max(1, 6 - stressVal)) / 15) * 10);

  // Chart data extraction based on activeTab
  const data = history.map((item, index) => {
    let val = item.weight;
    let unit = 'كجم';
    let label = 'الوزن';
    if (activeTab === 'waist') {
      val = item.waist;
      unit = 'سم';
      label = 'محيط الخصر';
    } else if (activeTab === 'adherence') {
      val = item.adherence;
      unit = '%';
      label = 'الالتزام';
    }
    return {
      index,
      week: item.week,
      label: item.week === 0 ? 'البداية' : `أسبوع ${item.week}`,
      value: val,
      unit,
      metricLabel: label,
      date: item.date,
      diff: item.diff,
      raw: item
    };
  });

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  const yPad = range === 0 ? 2.5 : Math.max(1.8, range * 0.6);
  const yMin = Math.max(0, minVal - yPad);
  const yMax = maxVal + yPad;

  // SVG setup
  const svgWidth = 720;
  const svgHeight = 190;
  const padLeft = 115;
  const padRight = 45;
  const padTop = 52;
  const padBottom = 30;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? padLeft + chartW / 2 : padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((d.value - yMin) / (yMax - yMin || 1)) * chartH;
    return { ...d, x, y };
  });

  // Smooth Cubic Spline generator
  const generateSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5.5;
      const cp1y = p1.y + (p2.y - p0.y) / 5.5;
      const cp2x = p2.x - (p3.x - p1.x) / 5.5;
      const cp2y = p2.y - (p3.y - p1.y) / 5.5;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const gradId = `clean-area-grad-${isMaxTier ? 'max' : 'elite'}-${activeTab}`;
  const beamGradId = `clean-beam-grad-${isMaxTier ? 'max' : 'elite'}`;
  const shadowFilterId = `clean-shadow-${isMaxTier ? 'max' : 'elite'}`;

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${padTop + chartH} L ${points[0].x},${padTop + chartH} Z`
    : '';

  let targetY = null;
  if (activeTab === 'weight' && targetWeightVal && targetWeightVal >= yMin && targetWeightVal <= yMax) {
    targetY = padTop + chartH - ((targetWeightVal - yMin) / (yMax - yMin || 1)) * chartH;
  }

  const activeIdx = hoveredIdx !== null ? hoveredIdx : points.length - 1;
  const activePoint = points[activeIdx] || points[points.length - 1];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAECF0',
      borderRadius: '24px',
      padding: '16px 20px',
      marginTop: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      direction: 'rtl'
    }}>
      {/* 4 Analytical KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #EAECF0',
          borderRadius: '20px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            التغير التراكمي للوزن
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: totalWeightDelta <= 0 ? '#16A34A' : '#D97706', fontFamily: 'JetBrains Mono, Cairo' }}>
            {totalWeightDelta > 0 ? `+${totalWeightDelta}` : totalWeightDelta} كجم
          </div>
          <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            من أصل {startWeightVal} كجم
          </span>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #EAECF0',
          borderRadius: '20px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            تغير محيط الخصر
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: totalWaistDelta <= 0 ? '#0284C7' : '#D97706', fontFamily: 'JetBrains Mono, Cairo' }}>
            {startWaistVal > 0 ? `${totalWaistDelta > 0 ? `+${totalWaistDelta}` : totalWaistDelta} سم` : 'مستقر'}
          </div>
          <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            انكماش الدهون الحشوية
          </span>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #EAECF0',
          borderRadius: '20px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            متوسط الالتزام العام
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: avgAdherence >= 85 ? '#16A34A' : '#EAB308', fontFamily: 'JetBrains Mono, Cairo' }}>
            {avgAdherence}%
          </div>
          <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            {avgAdherence >= 90 ? 'انضباط فسيولوجي استثنائي' : 'التزام جيد جداً'}
          </span>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #EAECF0',
          borderRadius: '20px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            مؤشر الجاهزية والتعافي
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: recoveryScore >= 7 ? '#8B5CF6' : '#EAB308', fontFamily: 'JetBrains Mono, Cairo' }}>
            {recoveryScore} / 10
          </div>
          <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
            {recoveryScore >= 8 ? 'استشفاء عضلي وعصبي ممتاز' : 'جاهزية متوازنة'}
          </span>
        </div>
      </div>

      {/* Header Bar: Clean Switcher & Simple Start/Target Hint */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Switcher Pills */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '9999px', gap: '3px' }}>
          {[
            { id: 'weight', label: 'مسار الوزن' },
            { id: 'waist', label: 'محيط الخصر' },
            { id: 'adherence', label: 'الالتزام التراكمي' },
            { id: 'biofeedback', label: 'نبض التعافي والاستشفاء' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                height: '26px',
                padding: '0 12px',
                borderRadius: '9999px',
                border: 'none',
                background: activeTab === tab.id ? colorPrimary : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                userSelect: 'none',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simple Clean Meta Note */}
        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>البداية: <strong style={{ color: '#101828', fontFamily: 'JetBrains Mono' }}>{startWeightVal} كجم</strong></span>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <span>المستهدف: <strong style={{ color: '#16A34A', fontFamily: 'JetBrains Mono' }}>{targetWeightVal} كجم</strong></span>
        </div>
      </div>

      {/* VIEW 1: SVG Canvas Area for weight, waist, adherence */}
      {activeTab !== 'biofeedback' ? (
        <div style={{ position: 'relative', width: '100%', height: '190px', userSelect: 'none' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colorPrimary} stopOpacity="0.25" />
                <stop offset="65%" stopColor={colorPrimary} stopOpacity="0.04" />
                <stop offset="100%" stopColor={colorPrimary} stopOpacity="0" />
              </linearGradient>

              <linearGradient id={beamGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colorPrimary} stopOpacity="0.18" />
                <stop offset="80%" stopColor={colorPrimary} stopOpacity="0.02" />
                <stop offset="100%" stopColor={colorPrimary} stopOpacity="0" />
              </linearGradient>

              <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.08" />
              </filter>
            </defs>

            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = padTop + chartH * pct;
              const gridVal = (yMax - pct * (yMax - yMin)).toFixed(activeTab === 'adherence' ? 0 : 1);
              return (
                <g key={i}>
                  <line
                    x1={45}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                    strokeDasharray={pct === 1 ? 'none' : '3 3'}
                  />
                  <text
                    x={36}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="#94A3B8"
                    fontFamily="JetBrains Mono, Cairo"
                    fontWeight="600"
                  >
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {targetY !== null && (
              <g>
                <line
                  x1={45}
                  y1={targetY}
                  x2={svgWidth - padRight}
                  y2={targetY}
                  stroke="#10B981"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <text
                  x={svgWidth - padRight - 4}
                  y={targetY - 5}
                  textAnchor="end"
                  fontSize="9"
                  fill="#10B981"
                  fontFamily="Cairo, sans-serif"
                  fontWeight="700"
                >
                  الهدف ({targetWeightVal} كجم)
                </text>
              </g>
            )}

            {activePoint && (
              <rect
                x={activePoint.x - 16}
                y={activePoint.y}
                width="32"
                height={padTop + chartH - activePoint.y}
                fill={`url(#${beamGradId})`}
                rx="4"
              />
            )}

            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradId})`}
              />
            )}

            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={colorPrimary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((p, i) => {
              const isActive = i === activeIdx;
              const badgeW = 66;
              const badgeH = 22;
              const badgeX = p.x - badgeW / 2;
              const badgeY = p.y - 30;

              return (
                <g 
                  key={i} 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <g filter={`url(#${shadowFilterId})`}>
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeW}
                      height={badgeH}
                      rx="5"
                      fill="#FFFFFF"
                      stroke={isActive ? colorPrimary : '#E2E8F0'}
                      strokeWidth={isActive ? '1.5' : '1'}
                    />
                    <polygon
                      points={`${p.x - 3.5},${badgeY + badgeH} ${p.x + 3.5},${badgeY + badgeH} ${p.x},${badgeY + badgeH + 3.5}`}
                      fill="#FFFFFF"
                      stroke={isActive ? colorPrimary : '#E2E8F0'}
                      strokeWidth="0.8"
                    />
                    <line
                      x1={p.x - 3}
                      y1={badgeY + badgeH}
                      x2={p.x + 3}
                      y2={badgeY + badgeH}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={p.x}
                      y={badgeY + 14.5}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="JetBrains Mono, Cairo"
                      fontWeight="700"
                      fill={isActive ? colorPrimary : '#0F172A'}
                    >
                      {p.value} {p.unit}
                    </text>
                  </g>

                  {isActive ? (
                    <g>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5.5"
                        fill="#FFFFFF"
                        stroke={colorPrimary}
                        strokeWidth="2.2"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="2"
                        fill={colorPrimary}
                      />
                    </g>
                  ) : (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#FFFFFF"
                      stroke={colorPrimary}
                      strokeWidth="1.8"
                    />
                  )}

                  <text
                    x={p.x}
                    y={padTop + chartH + 16}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={isActive ? colorPrimary : '#64748B'}
                    fontWeight={isActive ? '700' : '600'}
                    fontFamily="Cairo, sans-serif"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        /* VIEW 2: Recovery & Biofeedback Pulse Breakdown */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '10px 0'
        }}>
          {[
            { label: 'جودة النوم والراحة الليلية', score: sleepVal, max: 5, color: '#0284C7', desc: 'استشفاء عضلي ونوم عميق' },
            { label: 'مستوى الطاقة بالتمرين', score: energyVal, max: 5, color: '#16A34A', desc: 'كفاءة الجهد والجاهزية البدنية' },
            { label: 'التحكم في الشهية والجوع', score: hungerVal, max: 5, color: '#D97706', desc: 'استقرار الشبع والالتزام بالدايت' },
            { label: 'مقاومة الإجهاد والتوتر', score: Math.max(1, 6 - stressVal), max: 5, color: '#8B5CF6', desc: 'تنظيم الاستشفاء ومقاومة الإجهاد' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: '#F8FAFC',
              border: '1px solid #EAECF0',
              borderRadius: '24px',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#101828' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono' }}>{item.score} / {item.max}</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: `${(item.score / item.max) * 100}%`, height: '100%', background: item.color, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block', lineHeight: 1.3 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trajectory Interpretation Footer Bar */}
      <div style={{
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        color: '#64748B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
          <span>المتبقي للوصول للهدف: <strong style={{ color: '#101828', fontFamily: 'JetBrains Mono' }}>{Math.abs(currentWeightVal - targetWeightVal).toFixed(1)} كجم</strong></span>
        </div>
        <div>
          <span>معدل التغير الأسبوعي: <strong style={{ color: '#101828', fontFamily: 'JetBrains Mono' }}>{Math.abs(totalWeightDelta / (history.length || 1)).toFixed(2)} كجم/أسبوع</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function CheckinReviewDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Starts empty. The screen used to open on fifteen demo clients (STRESS_TEST_CLIENTS) and keep
  // them whenever the server had no pending check-in, so the coach could review and approve a
  // client who does not exist.
  const [checkinList, setCheckinList] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL | MAX | ELITE
  const [macroAdjustments, setMacroAdjustments] = useState(DEFAULT_BASELINE_MACROS);
  const [coachReply, setCoachReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_approvedCount, setApprovedCount] = useState(0);
  const [showLabModal, setShowLabModal] = useState(false);
  const [approvalToast, setApprovalToast] = useState(null);
  // A failed approval must stay visible: the check-in stays in the queue until the server confirms.
  const [approveError, setApproveError] = useState(null);
  const [inspectionTab, setInspectionTab] = useState('PHOTOS'); // 'PHOTOS' | 'CHART' | 'LABS'
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isEditMeasurementsOpen, setIsEditMeasurementsOpen] = useState(false);
  const [clearanceConfirmed, setClearanceConfirmed] = useState(false);
  const [clearanceNotes, setClearanceNotes] = useState('');
  const [isUnlockingClinical, setIsUnlockingClinical] = useState(false);
  const [clinicalUnlockMessage, setClinicalUnlockMessage] = useState(null);

  // Live Checkins Fetcher from MariaDB
  // The loader sits outside the effect so the coach can ask for it again without reloading the page.
  const fetchLiveCheckins = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs/checkin/pending`);
      if (res.ok) {
        const data = await res.json();
        if (data.checkins && Array.isArray(data.checkins) && data.checkins.length > 0) {
          const liveMapped = data.checkins.map(ch => {
            const userPhotos = ch.user?.progressPhotos || [];
            const weekPhotos = userPhotos.filter(p => Number(p.week_number) === Number(ch.week_number));
            const currentWeekPhotos = {
              front: (weekPhotos.find(p => String(p.pose).toUpperCase() === 'FRONT') || {}).photo_url || null,
              side: (weekPhotos.find(p => String(p.pose).toUpperCase() === 'SIDE') || {}).photo_url || null,
              back: (weekPhotos.find(p => String(p.pose).toUpperCase() === 'BACK') || {}).photo_url || null,
            };

            // Build comprehensive multi-week progression history
            const allUserCheckins = (ch.user?.checkinSubmissions || []).slice().sort((a, b) => (Number(a.week_number) || 0) - (Number(b.week_number) || 0));
            let clientHistory = [];
            if (allUserCheckins.length > 0) {
              clientHistory = allUserCheckins.map(pc => {
                const pcPhotos = userPhotos.filter(p => Number(p.week_number) === Number(pc.week_number));
                return {
                  week: Number(pc.week_number) || 1,
                  weight: Number(pc.average_weight_kg) || 0,
                  waist: Number(pc.waist_circumference_cm) || 0,
                  adherence: Number(pc.nutrition_adherence_percent) || 100,
                  date: `الأسبوع ${pc.week_number}`,
                  photos: {
                    front: (pcPhotos.find(p => String(p.pose).toUpperCase() === 'FRONT') || {}).photo_url || null,
                    side: (pcPhotos.find(p => String(p.pose).toUpperCase() === 'SIDE') || {}).photo_url || null,
                    back: (pcPhotos.find(p => String(p.pose).toUpperCase() === 'BACK') || {}).photo_url || null,
                  }
                };
              });
            } else {
              clientHistory = [{
                week: ch.week_number || 1,
                weight: ch.average_weight_kg || 0,
                waist: ch.waist_circumference_cm || 0,
                adherence: ch.nutrition_adherence_percent || 100,
                date: `الأسبوع ${ch.week_number || 1}`,
                photos: currentWeekPhotos
              }];
            }

            return {
              id: `CHK_${ch.id}`,
              raw_id: ch.id,
              user_id: ch.user_id,
              client: {
                id: `CL_${ch.user_id}`,
                name: ch.user?.full_name || `مشترك #${ch.user?.client_code || ch.user_id}`,
                code: ch.user?.client_code || String(ch.user_id),
                package: String(ch.user?.subscription_package || 'MAX').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE',
                package_name: String(ch.user?.subscription_package || '').includes('MAX') ? 'باقة MAX' : 'باقة ELITE',
                phone: ch.user?.phone_number || '',
                country: { name: 'مصر' },
                gender: 'male',
                goal_type: 'FAT_LOSS',
                target_goal: 'خسارة دهون',
                start_weight: ch.average_weight_kg || 80,
                target_weight: (ch.average_weight_kg || 80) - 10,
                injuries: ch.user?.injuries || []
              },
              week_number: ch.week_number || 1,
              checkin_number: ch.week_number || 1,
              submission_date: new Date(ch.createdAt).toLocaleDateString('en-US'),
              photos: currentWeekPhotos,
              history: clientHistory,
              metrics: {
                previous_weight: ch.average_weight_kg || 0,
                current_weight: ch.average_weight_kg || 0,
                weight_change: ch.weight_change_kg || 0,
                waist_previous: ch.waist_circumference_cm || 0,
                waist_current: ch.waist_circumference_cm || 0,
                waist_change: 0,
                adherence: ch.nutrition_adherence_percent || 100,
                workouts_completed: ch.workouts_completed || 0,
                workouts_target: ch.workouts_scheduled || 4,
                daily_steps_avg: 8000,
                strength_trend: 'MAINTAINED',
                strength_note: 'أداء مستقر',
                off_plan_meals: 0,
                water_liters: 3
              },
              biofeedback: ch.biofeedback || {
                energy: 4, sleep: 4, hunger: 3, recovery: 4,
                stress_level: 3, digestion_status: 'good', cycle_phase: null
              },
              pain_reports: ch.pain_reports || [],
              analysis_output: ch.analysis_output || {},
              is_deload_recommended: ch.analysis_output?.is_deload_recommended || false,
              reflections: {
                nsv_note: 'الالتزام الكامل بالخطة',
                struggle_note: ch.coach_notes || 'لا يوجد صعوبات'
              },
              client_notes: ch.coach_notes || '',
              lifestyle_variance: ch.lifestyle_variance || 'normal_routine',
              bowel_regularity: ch.bowel_regularity || 'regular_daily',
              sleep_stress_composite: ch.sleep_stress_composite || (ch.biofeedback?.sleep_stress_composite ?? 2),
              menstrual_phase: ch.menstrual_phase || null,
              next_week_travel: Boolean(ch.next_week_travel),
              next_week_gym_available: ch.next_week_gym_available !== undefined ? Boolean(ch.next_week_gym_available) : true,
              next_week_realistic_days: ch.next_week_realistic_days || null,
              next_week_notes: ch.next_week_notes || '',
              ai_analysis: {
                recommendation: ch.analysis_output?.coach_action || 'الاستمرار بالخطة الحالية مع مراقبة مؤشرات الأسبوع القادم.',
                status_badge: ch.analysis_status || 'ON_TRACK',
                warning: null,
                ...(ch.analysis_output || {})
              },
              baseline_macros: { calories: 2000, protein: 140, carbs: 220, fats: 60 },
              suggested_reply: `أهلاً بحضرتك يا بطل، تسلم إيدك على تقرير الأسبوع والالتزام. استمر على نفس الخطة والتركيز، وبالتوفيق دائماً.`
            };
          });
          setCheckinList(liveMapped);
        }
      }
    } catch (e) {
      console.warn('Failed to load live checkins:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveCheckins();
  }, [fetchLiveCheckins]);

  // Read URL query params on mount or param change
  useEffect(() => {
    const targetCode = searchParams.get('code') || searchParams.get('client_id');
    if (targetCode) {
      const cleanTarget = String(targetCode).replace(/^#+/, '').trim();
      const existingIdx = checkinList.findIndex((item) => 
        String(item?.client?.code || '').toLowerCase() === cleanTarget.toLowerCase() ||
        String(item?.client?.id || '').toLowerCase() === cleanTarget.toLowerCase() ||
        String(item?.id || '').toLowerCase() === cleanTarget.toLowerCase() ||
        arabicSearchMatch(item?.client?.name, cleanTarget)
      );

      if (existingIdx !== -1) {
        setSelectedIdx(existingIdx);
      } else {
        // Dynamically create the new client baseline check-in (Week 0 - New Trainee)
        const newClientEntry = {
          id: `CHK_${cleanTarget}_W0`,
          is_new_client: true,
          client: {
            id: `CL_${cleanTarget}`,
            name: 'مشترك جديد',
            code: cleanTarget,
            package: 'MAX',
            phone: '010XXXXXXXX',
            country: { name: 'مصر' },
            gender: 'MALE',
            goal_type: 'CUTTING',
            target_goal: 'خسارة دهون وتنشيف عضلي',
            start_weight: 85.0,
            target_weight: 77.0
          },
          week_number: 0,
          submission_date: 'مشترك جديد (الأسبوع التأسيسي)',
          history: [
            { week: 0, weight: 85.0, waist: 92.0, adherence: 100, date: 'نقطة البداية', diff: 0 }
          ],
          metrics: {
            previous_weight: 85.0,
            current_weight: 85.0,
            weight_change: 0,
            waist_previous: 92.0,
            waist_current: 92.0,
            waist_change: 0,
            adherence: 100,
            workouts_completed: 0,
            workouts_target: 4,
            daily_steps_avg: 8000,
            strength_trend: 'STABLE',
            strength_note: 'بداية البرنامج (الأسبوع الأول)',
            off_plan_meals: 0,
            water_liters: 3.0
          },
          biofeedback: {
            energy: 8,
            sleep: 8,
            hunger: 5,
            recovery: 8,
            stress_level: 3,
            digestion_status: 'طبيعي وممتاز',
            cycle_phase: null
          },
          reflections: {
            nsv_note: 'المشترك في مرحلة التأسيس الأولى واستلام الخطة.',
            struggle_note: 'بانتظار إتمام الأسبوع الأول لإجراء أول تقييم ومقارنة للوزن.'
          },
          client_notes: 'تم الاشتراك وتأكيد الباقة بنجاح، بانتظار استلام جدول الوجبات والتمارين للأسبوع الأول.',
          ai_analysis: {
            recommendation: 'مشترك جديد (الأسبوع التأسيسي): يوصى باعتماد سعرات العجز المعتدل (-350 سعرة) مع تثبيت البروتين عند 2.0 جم/كجم، وبدء أول 4 أيام تمرين تدريجياً لتقييم الاستجابة العضلية.',
            status_badge: 'مشترك جديد - مرحلة التأسيس',
            warning: 'ملاحظة: موعد أول تقييم أسبوعي سيكون بعد 7 أيام من بدء الخطة.'
          },
          baseline_macros: {
            calories: 1950,
            protein: 160,
            carbs: 180,
            fats: 50
          },
          suggested_reply: `أهلاً بك يا بطل في Z Coaching! تم اعتماد وتفعيل خطتك للأسبوع الأول (1950 سعرة، 160 جم بروتين، 180 جم كارب، 50 جم دهون). التزم بالوجبات ومواعيد التمرين، وموعدنا في أول تقييم أسبوعي بعد 7 أيام لنقيس التطور والنزول معاً!`
        };

        setCheckinList(prev => [newClientEntry, ...prev]);
        setSelectedIdx(0);
      }
    }
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Filtered Queue for search and tier
  const filteredQueue = checkinList.filter((item) => {
    if (tierFilter === 'MAX' && !String(item?.client?.package || '').toUpperCase().includes('MAX')) return false;
    if (tierFilter === 'ELITE' && !String(item?.client?.package || '').toUpperCase().includes('ELITE')) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.trim();
    const cleanClientCode = String(item?.client?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');

    // 1. If searching pure numbers (e.g. 12, 1, 5, #12): Match exact client code or full phone
    const qNum = q.replace(/^#+/, '');
    if (/^\d+$/.test(qNum)) {
      if (cleanClientCode === qNum) return true;
      if (qNum.length >= 4 && item?.client?.phone && item?.client?.phone?.includes(qNum)) return true;
      return arabicSearchMatch(item?.client?.name, qNum);
    }

    // 2. General name / text search with Arabic normalization
    return (
      arabicSearchMatch(item?.client?.name, q) ||
      cleanClientCode.toLowerCase() === q.toLowerCase().replace(/^#+/, '') ||
      (item?.client?.phone && item?.client?.phone?.includes(q))
    );
  });

  const activeCheckin = filteredQueue[selectedIdx] || filteredQueue[0] || checkinList[0];

  const safeClient = activeCheckin?.client || {};
  const safeMetrics = activeCheckin?.metrics || {};
  const safeBio = activeCheckin?.biofeedback || {};
  const safeReflect = activeCheckin?.reflections || {};
  const safeAi = activeCheckin?.ai_analysis || {
    status_badge: safeMetrics?.status_badge || 'مستقر',
    recommendation: 'الاستمرار على نفس الخطة مع مراقبة مؤشرات الأسبوع القادم.',
    warning: null
  };
  const safeMacros = activeCheckin?.baseline_macros || DEFAULT_BASELINE_MACROS;
  const clientFirstName = String(safeClient?.name || 'المتدرب').split(' ')[0];

  const handlePrevCheckin = () => {
    if (selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const handleNextCheckin = () => {
    if (selectedIdx < filteredQueue.length - 1) {
      setSelectedIdx(selectedIdx + 1);
    }
  };

  // Sync state when switching clients
  useEffect(() => {
    if (activeCheckin) {
      setMacroAdjustments(activeCheckin?.baseline_macros || DEFAULT_BASELINE_MACROS);
      setCoachReply(activeCheckin?.suggested_reply || "");
    }
  }, [activeCheckin]);

  // Auto dismiss approval toast after 7 seconds
  useEffect(() => {
    if (!approvalToast) return;
    const timer = setTimeout(() => {
      setApprovalToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [approvalToast]);

  // Handle Keyboard shortcuts safely without losing queue position or interfering with input typing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'Escape') {
        if (showLabModal) {
          setShowLabModal(false);
        }
      } else if (e.key === 'ArrowRight' || e.key === ']' || (e.altKey && e.key === 'ArrowUp')) {
        handlePrevCheckin();
      } else if (e.key === 'ArrowLeft' || e.key === '[' || (e.altKey && e.key === 'ArrowDown')) {
        handleNextCheckin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLabModal, selectedIdx, filteredQueue.length]);

  const buildSmartWhatsAppSummary = (notes = coachReply) => {
    if (!activeCheckin) return '';
    return generateCheckinApprovalWhatsAppMessage({
      clientName: safeClient?.name,
      clientCode: safeClient?.code,
      weekNumber: activeCheckin?.week_number || activeCheckin?.checkin_number || 1,
      currentWeight: safeMetrics?.current_weight,
      weightDiff: safeMetrics?.weight_change,
      waistCurrent: safeMetrics?.waist_current,
      waistDiff: safeMetrics?.waist_change,
      macros: macroAdjustments,
      cardioTarget: activeCheckin?.cardio_target || activeCheckin?.cardio || '',
      coachNotes: typeof notes === 'string' ? notes : '',
      appBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://zakaria.fit'
    });
  };

  const handleUnlockClinicalSafety = async () => {
    if (!activeCheckin?.raw_id) return;
    if (!clearanceConfirmed) {
      setApproveError('يجب تأكيد استلام التقرير والتصريح الطبي قبل فك القفل السريري.');
      return;
    }
    if (!String(clearanceNotes || '').trim()) {
      setApproveError('يجب تدوين ملاحظات التصريح الطبي وإخلاء المسؤولية قبل فك القفل السريري.');
      return;
    }
    setIsUnlockingClinical(true);
    setApproveError(null);
    setClinicalUnlockMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/checkin/${activeCheckin.raw_id}/unlock-clinical-safety`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medical_clearance_confirmed: true,
          clearance_notes: clearanceNotes.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApproveError(data.error || 'تعذر فك القفل السريري.');
        setIsUnlockingClinical(false);
        return;
      }
      setCheckinList(prev => prev.map(item => item.id === activeCheckin.id ? {
        ...item,
        analysis_output: {
          ...(item.analysis_output || {}),
          training_locked: false,
          clinical_unlock: data.clinical_unlock
        }
      } : item));
      setClinicalUnlockMessage(data.message || 'تم فك القفل السريري وتوثيق التصريح الطبي بنجاح.');
    } catch (err) {
      console.warn('Clinical unlock error:', err);
      setApproveError('تعذر الاتصال بالخادم لفك القفل السريري.');
    } finally {
      setIsUnlockingClinical(false);
    }
  };

  const handleApprove = async (applyAdaptation = false) => {
    if (!activeCheckin) return;
    if (!String(coachReply || '').trim()) {
      setApproveError('يرجى كتابة ملاحظة وتوجيه الكوتش للمتدرب قبل اعتماد المراجعة.');
      return;
    }
    if (!activeCheckin) return;
    setIsSubmitting(true);

    const checkinDbId = activeCheckin.raw_id;
    const clientPhone = safeClient?.phone;
    const replyMsg = coachReply;
    const approvedClientName = safeClient?.name || 'المتدرب';

    setApproveError(null);
    try {
      if (checkinDbId) {
        const res = await fetch(`${API_BASE}/api/v1/checkin/${checkinDbId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coach_notes: replyMsg,
            apply_program_adaptation: Boolean(applyAdaptation),
            ...(applyAdaptation ? { custom_macros: macroAdjustments } : {})
          })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setApproveError(data.error || 'لم يتم حفظ الاعتماد على الخادم. المتابعة ما زالت في الطابور، حاول مرة أخرى.');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to persist checkin approval to database:', err);
      setApproveError('تعذر الاتصال بالخادم، لم يتم اعتماد المتابعة. حاول مرة أخرى.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    // Remove approved client from queue
    const remaining = checkinList.filter(item => item.id !== activeCheckin.id);
    setCheckinList(remaining);
    setApprovedCount(prev => prev + 1);

    if (selectedIdx >= remaining.length && remaining.length > 0) {
      setSelectedIdx(remaining.length - 1);
    }

    // Trigger non-blocking luxury floating toast with smart WhatsApp action
    const smartWhatsAppSummary = buildSmartWhatsAppSummary(replyMsg);
    setApprovalToast({
      clientName: approvedClientName,
      phone: clientPhone,
      reply: smartWhatsAppSummary
    });
  };

  const _handleResetDemo = () => {
    window.location.reload();
    setSelectedIdx(0);
    setSearchQuery('');
    setTierFilter('ALL');
    setApprovedCount(0);
  };

  const handleOpenDirectWhatsApp = () => {
    if (!activeCheckin?.client?.phone) return;
    const cleanPhone = formatWhatsAppPhone(activeCheckin?.client?.phone);
    const textToSend = coachReply?.trim() ? coachReply : buildSmartWhatsAppSummary();
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`, '_blank');
  };

  const isMaxTier = activeCheckin?.client?.package?.toUpperCase().includes('MAX');

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="مراجعة التقييمات الأسبوعية"
          description={`طابور مراجعة الشيك إن • ${checkinList.length} تقييم بانتظار المراجعة والاعتماد`}
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshButton onClick={fetchLiveCheckins} />
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{
                height: '34px',
                padding: '0 16px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                color: '#344054',
                border: '1px solid #D0D5DD',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronRight size={14} />
              <span>لوحة القيادة (Esc)</span>
            </button>
            </div>
          )}
        />

        {/* 2. Scalable Master-Detail Architecture (Queue Sidebar on Right / Workspace on Left) */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          
          {/* =========================================================================
              RIGHT SIDEBAR: The Client Queue (Scales up to 20-50 clients effortlessly)
              ========================================================================= */}
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #EAECF0', 
            borderRadius: '24px', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)'
          }}>
            {/* Queue Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #EAECF0', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#101828', fontWeight: 800 }}>
                    طابور المشتركين
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, fontFamily: 'JetBrains Mono, Cairo' }}>
                    ({filteredQueue.length})
                  </span>
                </div>
                <span style={{ 
                  fontSize: '10.5px', 
                  background: '#F1F5F9', 
                  color: '#475569', 
                  border: '1px solid #E2E8F0', 
                  padding: '2px 8px', 
                  borderRadius: '9999px', 
                  fontWeight: 700 
                }}>
                  معلق
                </span>
              </div>

              {/* Search Bar in Queue */}
              <div style={{ marginBottom: '8px' }}>
                <TableSearch
                  value={searchQuery}
                  onChange={(next) => { setSearchQuery(next); setSelectedIdx(0); }}
                  placeholder="بحث بالاسم أو الكود"
                  width="100%"
                  showShortcut={false}
                />
              </div>

              {/* The same package filter the other screens use. */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <TierFilter
                  value={tierFilter}
                  onChange={(next) => { setTierFilter(next); setSelectedIdx(0); }}
                  fullWidth
                />
              </div>
            </div>

            {/* Scrollable Queue Items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredQueue.length === 0 ? (
                <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                  لا يوجد متدرب مطابق للبحث
                </div>
              ) : (
                filteredQueue.map((item, idx) => {
                  const isSelected = idx === selectedIdx;
                  const rawName = item?.client?.name || 'مشترك';
                  const cleanName = rawName.replace(/\s*\(\s*#?[A-Za-z0-9_-]+\s*\)\s*/g, '').trim() || rawName;

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setSelectedIdx(idx)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #673DE6' : '1px solid #EAECF0',
                        background: isSelected ? '#FAF7FD' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: isSelected ? '0 2px 6px rgba(103, 61, 230, 0.08)' : '0 1px 2px rgba(16, 24, 40, 0.02)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.background = '#F8FAFC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#EAECF0';
                          e.currentTarget.style.background = '#FFFFFF';
                        }
                      }}
                    >
                      {/* Row 1: Code, Name, Package */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                          <ClientCodeBadge code={item?.client?.code || '1'} item={item?.client} size="xs" />
                          <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cleanName}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {(item?.medical_reports_urls?.length > 0 || item?.client?.medical_reports_urls?.length > 0) && (
                            <span style={{ fontSize: '9px', background: '#ECFDF5', color: '#15803D', border: '1px solid #A7F3D0', padding: '1px 5px', borderRadius: '9999px', fontWeight: 800 }}>
                              تحاليل
                            </span>
                          )}
                          <ClientPackageBadge item={item?.client} size="xs" />
                        </div>
                      </div>

                      {/* Row 2: Metrics Strip (Clean, Seamless, No clunky box border) */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        fontSize: '11px', 
                        paddingTop: '2px'
                      }}>
                        {/* Right: Current Weight + Delta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, Cairo', fontWeight: 800, fontSize: '12px', color: '#101828' }}>
                            {item?.metrics?.current_weight || 0} كجم
                          </span>

                          {(() => {
                            const delta = item?.metrics?.weight_change || 0;
                            if (delta === 0) {
                              return (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#64748B',
                                  background: '#F1F5F9',
                                  border: '1px solid #E2E8F0',
                                  padding: '1px 6px',
                                  borderRadius: '9999px'
                                }}>
                                  ثبات
                                </span>
                              );
                            }
                            return (
                              <span style={{ 
                                fontFamily: 'JetBrains Mono, Cairo', 
                                fontWeight: 800,
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                background: delta < 0 ? '#ECFDF5' : '#FEF2F2',
                                border: delta < 0 ? '1px solid #D1FAE5' : '1px solid #FEE2E2',
                                color: delta < 0 ? '#16A34A' : '#DC2626'
                              }}>
                                <span dir="ltr">{delta > 0 ? `+${delta}` : delta} كجم</span>
                              </span>
                            );
                          })()}
                        </div>

                        {/* Left: Checkin Number & Week */}
                        {(() => {
                          const chkNumber = item.checkin_number || ((item?.history?.length > 1) ? (item?.history?.length - 1) : item.week_number);
                          return (
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#64748B', 
                              fontWeight: 600, 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '3px',
                              whiteSpace: 'nowrap'
                            }}>
                              <span>متابعة {chkNumber}</span>
                              <span style={{ color: '#CBD5E1' }}>•</span>
                              <span>أسبوع {item.week_number}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================================
              LEFT WORKSPACE: The Active Client Assessment & Decision Panel
              ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!activeCheckin ? (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #EAECF0',
                borderRadius: '24px',
                padding: '60px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#64748B'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#101828' }}>
                  <CheckCircle2 size={24} color="#16A34A" />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#101828' }}>
                  لا توجد متابعة محددة للمراجعة
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '380px', lineHeight: 1.5 }}>
                  يرجى اختيار متدرب من القائمة الجانبية أو انتظار ورود متابعات أسبوعية جديدة من المشتركين.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    marginTop: '8px',
                    padding: '8px 20px', background: '#673DE6', color: '#FFFFFF', border: 'none', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  العودة لغرفة القيادة
                </button>
              </div>
            ) : (
              <>
            {/* 1. Header Identity Card & Goal Badge */}
            {(() => {
              const goalType = safeClient.goal_type || 'CUTTING';
              const goalConfig = {
                CUTTING: { label: 'نزول دهون ووزن', bg: '#F8FAFC', border: '#CBD5E1', color: '#101828' },
                BULKING: { label: 'زيادة عضل ووزن', bg: '#F8FAFC', border: '#CBD5E1', color: '#101828' },
                RECOMP: { label: 'نزول دهون مع شد وبناء عضل (Recomp)', bg: '#F8FAFC', border: '#CBD5E1', color: '#101828' }
              }[goalType] || { label: 'تنشيف', bg: '#F8FAFC', border: '#CBD5E1', color: '#101828' };
              const activeChkNumber = activeCheckin.checkin_number || ((activeCheckin?.history?.length > 1) ? (activeCheckin?.history?.length - 1) : activeCheckin.week_number);

              return (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #EAECF0',
                  borderRadius: '24px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(16, 24, 40, 0.03)'
                }}>
                  {/* Deck 1: Identity & Pager */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ClientCodeBadge code={safeClient.code} item={safeClient} size="md" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#101828' }}>
                          {safeClient.name}
                        </h4>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 800, 
                          background: goalConfig.bg, 
                          border: `1px solid ${goalConfig.border}`, 
                          color: goalConfig.color, 
                          padding: '2px 8px', 
                          borderRadius: '9999px'
                        }}>
                          {goalConfig.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <ClientPackageBadge item={safeClient} size="sm" />
                      {(() => {
                        const fasting = extractClientFastingProfile(safeClient);
                        return (
                          <>
                            {fasting.primaryFastingBadge && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: fasting.primaryFastingBadge.bg,
                                border: `1px solid ${fasting.primaryFastingBadge.border}`,
                                color: fasting.primaryFastingBadge.color,
                                fontWeight: 800
                              }}>
                                {fasting.primaryFastingBadge.label}
                              </span>
                            )}
                          </>
                        );
                      })()}

                      {/* Review Pager */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #EAECF0', padding: '2px 4px', borderRadius: '9999px' }}>
                        <button
                          type="button"
                          disabled={selectedIdx <= 0}
                          onClick={handlePrevCheckin}
                          style={{
                            height: '26px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            border: '1px solid #D0D5DD',
                            background: selectedIdx <= 0 ? '#F1F5F9' : '#FFFFFF',
                            color: selectedIdx <= 0 ? '#94A3B8' : '#101828',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: selectedIdx <= 0 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="المتدرب السابق (اختصار: Alt + ArrowUp أو ])"
                        >
                          <ChevronRight size={12} />
                          <span>السابق</span>
                        </button>
                        <span dir="ltr" style={{ fontSize: '10.5px', color: '#475467', fontWeight: 800, padding: '0 6px', fontFamily: 'JetBrains Mono, monospace' }}>
                          {selectedIdx + 1} / {filteredQueue.length}
                        </span>
                        <button
                          type="button"
                          disabled={selectedIdx >= filteredQueue.length - 1}
                          onClick={handleNextCheckin}
                          style={{
                            height: '26px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            border: '1px solid #D0D5DD',
                            background: selectedIdx >= filteredQueue.length - 1 ? '#F1F5F9' : '#FFFFFF',
                            color: selectedIdx >= filteredQueue.length - 1 ? '#94A3B8' : '#101828',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: selectedIdx >= filteredQueue.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="المتدرب التالي (اختصار: Alt + ArrowDown أو [)"
                        >
                          <span>التالي</span>
                          <ChevronLeft size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deck 2: Goal Context & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        الهدف: <strong style={{ color: '#101828' }}>{safeClient.target_goal}</strong>
                      </span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        تاريخ الإرسال: <span dir="ltr" style={{ color: '#101828', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{activeCheckin.submission_date}</span>
                      </span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ fontSize: '11px', background: '#F8FAFC', border: '1px solid #EAECF0', color: '#101828', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>المتابعة #{activeChkNumber}</span>
                        <span style={{ color: '#94A3B8' }}>•</span>
                        <span>الأسبوع {activeCheckin.week_number}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`/coach/editor/${safeClient.code || safeClient.id || '1'}`, '_blank')}
                        style={{
                          height: '32px',
                          padding: '0 14px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          background: '#673DE6',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
                        title="فتح خطة المتدرب بالكامل في محرر الكوتش في تبويب مستقل"
                      >
                        <Dumbbell size={13} />
                        <span>محرر الخطة</span>
                        <ExternalLink size={10} color="#D8B4FE" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLabModal(true)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          background: '#FFFFFF',
                          color: '#0284C7',
                          border: '1px solid #BAE6FD',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F0F9FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        title="استعراض ومراجعة التحاليل الطبية المخبرية ودرع الأمان السريري"
                      >
                        <HeartPulse size={13} color="#0284C7" />
                        <span>التحاليل السريرية</span>
                      </button>

                      {safeClient?.phone && (
                        <button
                          type="button"
                          onClick={handleOpenDirectWhatsApp}
                          style={{
                            height: '32px',
                            padding: '0 12px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '9999px',
                            background: '#F0FDF4',
                            color: '#166534',
                            border: '1px solid #BBF7D0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#DCFCE7')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                          title="محادثة المتدرب مباشرة على واتساب"
                        >
                          <MessageCircle size={13} />
                          <span>واتساب</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. Numeric & Vital Indicators (Clean & Streamlined) */}
            {(() => {
              const goalType = safeClient.goal_type || 'CUTTING';
              let deltaEvaluation = '';
              let deltaColor = '#16A34A';

              if (goalType === 'CUTTING') {
                if ((safeMetrics.weight_change || 0) < 0) {
                  deltaEvaluation = 'نزول دهون ممتاز';
                  deltaColor = '#16A34A';
                } else if ((safeMetrics.weight_change || 0) === 0) {
                  deltaEvaluation = 'ثبات متوازن';
                  deltaColor = '#0284C7';
                } else {
                  deltaEvaluation = 'زيادة بالوزن';
                  deltaColor = '#DC2626';
                }
              } else if (goalType === 'BULKING') {
                if ((safeMetrics.weight_change || 0) > 0) {
                  deltaEvaluation = 'زيادة عضلية ممتازة';
                  deltaColor = '#16A34A';
                } else if ((safeMetrics.weight_change || 0) === 0) {
                  deltaEvaluation = 'ثبات';
                  deltaColor = '#D97706';
                } else {
                  deltaEvaluation = 'نزول غير مرغوب بالتضخيم';
                  deltaColor = '#DC2626';
                }
              } else {
                if ((safeMetrics.weight_change || 0) === 0 && safeMetrics.waist_change < 0) {
                  deltaEvaluation = 'إعادة تشكيل ممتازة';
                  deltaColor = '#16A34A';
                } else if ((safeMetrics.weight_change || 0) < 0) {
                  deltaEvaluation = 'نزول دهون تدريجي';
                  deltaColor = '#0284C7';
                } else {
                  deltaEvaluation = 'زيادة عضلية متزنة';
                  deltaColor = '#16A34A';
                }
              }

              return (
                <FormSection
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                          <Activity size={15} />
                        </div>
                        <span>المؤشرات الرقمية والقياسات الحيوية</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditMeasurementsOpen(true)}
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          borderRadius: '9999px',
                          background: '#F4F0FD',
                          border: '1px solid #DDD6FE',
                          color: '#673DE6',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 2px rgba(103, 61, 230, 0.08)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE9FE')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#F4F0FD')}
                        title="تصحيح وتوثيق قراءة الميزان والقياسات الحيوية"
                      >
                        <SlidersHorizontal size={13} />
                        <span>تعديل القياسات</span>
                      </button>
                    </div>
                  }
                  description="تطور الوزن ومحيط الخصر ومعدل الالتزام مقارنة بالأسبوع الماضي."
                >
                  <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                    
                    {/* Current Weight */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>الوزن الحالي</span>
                        {Boolean(activeCheckin?.analysis_output?.is_measurement_corrected || activeCheckin?.is_measurement_corrected) && (
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#673DE6', background: '#EDE9FE', border: '1px solid #DDD6FE', padding: '1px 5px', borderRadius: '9999px' }}>
                            مصحح
                          </span>
                        )}
                      </div>
                      <strong style={{ fontSize: '17px', color: '#101828', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {safeMetrics.current_weight} <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>كجم</span>
                      </strong>
                      <small style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginTop: '2px', fontFamily: 'Cairo, sans-serif' }}>
                        السابق: {safeMetrics.previous_weight} كجم
                      </small>
                    </div>

                    {/* Weight Delta */}
                    <div style={{ 
                      background: deltaColor === '#16A34A' ? '#F0FDF4' : (deltaColor === '#0284C7' ? '#F0F9FF' : '#FEF2F2'), 
                      border: deltaColor === '#16A34A' ? '1px solid #BBF7D0' : (deltaColor === '#0284C7' ? '1px solid #BAE6FD' : '1px solid #FECACA'), 
                      padding: '10px 12px', 
                      borderRadius: '12px' 
                    }}>
                      <span style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>فرق الوزن (Δ)</span>
                      <strong style={{ 
                        fontSize: '17px', 
                        color: deltaColor, 
                        fontFamily: 'JetBrains Mono, Cairo, sans-serif', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontWeight: 800
                      }}>
                        {(safeMetrics.weight_change || 0) < 0 ? <TrendingDown size={16} /> : ((safeMetrics.weight_change || 0) === 0 ? <Minus size={16} /> : <TrendingUp size={16} />)}
                        <span dir="ltr">{(safeMetrics.weight_change || 0) > 0 ? `+${(safeMetrics.weight_change || 0)}` : (safeMetrics.weight_change || 0)}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>كجم</span>
                      </strong>
                      <small style={{ fontSize: '10px', color: deltaColor, display: 'block', marginTop: '2px', fontWeight: 800, fontFamily: 'Cairo, sans-serif' }}>
                        {deltaEvaluation}
                      </small>
                    </div>

                    {/* Waist Metric */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', padding: '10px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>محيط الخصر</span>
                      <strong style={{ fontSize: '17px', color: '#101828', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {safeMetrics.waist_current} <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>سم</span>
                      </strong>
                      <small style={{ fontSize: '10px', color: '#16A34A', display: 'block', marginTop: '2px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                        {safeMetrics.waist_change} سم فرق مقاس
                      </small>
                    </div>

                    {/* Adherence */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', padding: '10px 12px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>الالتزام والتمارين</span>
                      <strong style={{ fontSize: '17px', color: '#101828', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {safeMetrics.adherence}%
                      </strong>
                      <small style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '2px', fontFamily: 'Cairo, sans-serif' }}>
                        {safeMetrics.workouts_completed} من {safeMetrics.workouts_target} تمارين
                      </small>
                    </div>
                  </div>

                  {/* Structured Biofeedback 3-Card Grid */}
                  <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {/* بطاقة 1: الاستشفاء والأداء البدني */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '24px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #EAECF0' }}>
                        <Dumbbell size={14} color="#0F172A" />
                        <strong style={{ fontSize: '11.5px', color: '#101828' }}>الاستشفاء والأداء البدني</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>أوزان التمرين:</span>
                          <strong style={{ color: safeMetrics.strength_trend === 'INCREASED' ? '#16A34A' : (safeMetrics.strength_trend === 'DECREASED' ? '#DC2626' : '#0F172A') }}>
                            {safeMetrics.strength_trend === 'INCREASED' ? 'زيادة ملحوظة' : (safeMetrics.strength_trend === 'DECREASED' ? 'تراجع' : 'ثبات')}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>مستوى الطاقة:</span>
                          <strong style={{ color: '#101828' }}>{safeBio.energy}/10</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>جودة النوم:</span>
                          <strong style={{ color: '#101828' }}>{safeBio.sleep}/10</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>تراكم السهر:</span>
                          <strong style={{ color: Number(activeCheckin?.sleep_stress_composite || 0) >= 4 ? '#D97706' : '#0F172A' }}>
                            {activeCheckin?.sleep_stress_composite !== undefined ? `${activeCheckin.sleep_stress_composite}/5` : 'طبيعي'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* بطاقة 2: العادات اليومية والتغذية */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '24px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #EAECF0' }}>
                        <Utensils size={14} color="#0F172A" />
                        <strong style={{ fontSize: '11.5px', color: '#101828' }}>العادات اليومية والتغذية</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>متوسط الخطوات:</span>
                          <strong style={{ color: '#101828', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                            {(safeMetrics.daily_steps_avg || 8000).toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>استهلاك الماء:</span>
                          <strong style={{ color: '#101828' }}>{safeMetrics.water_liters || 3.0} لتر</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>مستوى الجوع:</span>
                          <strong style={{ color: safeBio.hunger > 6 ? '#B45309' : '#0F172A' }}>{safeBio.hunger}/10</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>وجبات خارج الخطة:</span>
                          <strong style={{ color: (safeMetrics.off_plan_meals || 0) > 0 ? '#D97706' : '#16A34A' }}>
                            {safeMetrics.off_plan_meals || 0}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* بطاقة 3: الحالة الفسيولوجية والهضم */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '24px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #EAECF0' }}>
                        <HeartPulse size={14} color="#0F172A" />
                        <strong style={{ fontSize: '11.5px', color: '#101828' }}>الحالة الفسيولوجية والهضم</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>كفاءة الهضم:</span>
                          <strong style={{ color: '#101828' }}>{safeBio.digestion_status || 'طبيعي'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>حركة الأمعاء:</span>
                          <strong style={{ color: activeCheckin?.bowel_regularity === 'constipated_3plus' ? '#DC2626' : '#0F172A' }}>
                            {activeCheckin?.bowel_regularity === 'constipated_3plus' ? 'إمساك (3+ أيام)' : (activeCheckin?.bowel_regularity === 'diarrhea_upset' ? 'عسر هضم' : 'منتظم')}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>
                            {safeBio.cycle_phase ? 'مرحلة الدورة:' : 'نمط الدوام:'}
                          </span>
                          <strong style={{ color: safeBio.cycle_phase ? '#9D174D' : '#0F172A' }}>
                            {safeBio.cycle_phase || (activeCheckin?.lifestyle_variance === 'active_spurt' ? 'حركة مضاعفة' : (activeCheckin?.lifestyle_variance === 'lazy_vacation' ? 'خمول / إجازة' : 'طبيعي'))}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px' }}>مستوى الإجهاد والتوتر:</span>
                          <strong style={{ color: Number(safeBio.stress_level || 0) > 6 ? '#B45309' : '#0F172A' }}>
                            {safeBio.stress_level ? `${safeBio.stress_level}/10` : 'معتدل'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Early-deload recommendation (coach approves with one tap) */}
                  <DeloadRecommendationCard key={activeCheckin?.raw_id} checkinId={activeCheckin?.raw_id} analysisOutput={activeCheckin?.analysis_output} />

                  {/* False Plateau Triad Alert Banner */}
                  {(() => {
                    const isConstipated = activeCheckin?.bowel_regularity === 'constipated_3plus';
                    const isHighSleepStress = Number(activeCheckin?.sleep_stress_composite || 0) >= 4;
                    const _isHighAdherence = (safeMetrics.adherence || 100) >= 85;
                    const isWeightStalled = Math.abs(safeMetrics.weight_change || 0) <= 0.2;
                    const isFalsePlateau = (isConstipated || isHighSleepStress) && (isWeightStalled || activeCheckin?.analysis_output?.lock_reason === 'FALSE_PLATEAU_DETECTED' || activeCheckin?.ai_analysis?.status_badge?.includes('FALSE_PLATEAU') || activeCheckin?.ai_analysis?.recommendation?.includes('ثبات زائف'));

                    if (!isFalsePlateau) return null;

                    return (
                      <div style={{
                        marginTop: '10px',
                        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                        border: '1.5px solid #F59E0B',
                        borderRadius: '24px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}>
                        <AlertTriangle size={18} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ fontSize: '11.5px', color: '#92400E', lineHeight: 1.5 }}>
                          <strong style={{ color: '#78350F', display: 'block', fontSize: '12.5px', marginBottom: '2px' }}>
                            تنبيه سريري: رصد ثالوث الثبات الزائف (False Plateau Triad Detected)
                          </strong>
                          ثبات الوزن هنا ظاهري ومؤقت ناتج عن احتباس السوائل وتراكم الفضلات بسبب {isConstipated ? 'الإمساك لأكثر من 3 أيام' : 'إجهاد وقلة النوم'} مع التزام عالي بالخطة ({safeMetrics.adherence}%). يوصى بتثبيت السعرات والماكروز وعدم تقليل السعرات لتجنب إدخال المشترك في عجز حاد غير حقيقي.
                        </div>
                      </div>
                    );
                  })()}
                </FormSection>
              );
            })()}

            {/* 3. Unified Inspection Workspace with Fast Interactive Tabs */}
            <FormSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                    <Camera size={15} />
                  </div>
                  <span>استوديو الفحص والمقارنة البصرية</span>
                </div>
              }
              description="التحليل البصري التفاعلي لصور التطور، مسار المنحنى الرقمي، والفحوصات المخبرية في مساحة موحدة مدمجة."
            >
              {/* Inspection Tab Switcher Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #EAECF0', paddingBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setInspectionTab('PHOTOS')}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: inspectionTab === 'PHOTOS' ? '1px solid #673DE6' : '1px solid #CBD5E1',
                    background: inspectionTab === 'PHOTOS' ? '#673DE6' : '#FFFFFF',
                    color: inspectionTab === 'PHOTOS' ? '#FFFFFF' : '#475569',
                    boxShadow: inspectionTab === 'PHOTOS' ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Camera size={14} />
                  <span>مقارنة صور التطور</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectionTab('CHART')}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: inspectionTab === 'CHART' ? '1px solid #673DE6' : '1px solid #CBD5E1',
                    background: inspectionTab === 'CHART' ? '#673DE6' : '#FFFFFF',
                    color: inspectionTab === 'CHART' ? '#FFFFFF' : '#475569',
                    boxShadow: inspectionTab === 'CHART' ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Activity size={14} />
                  <span>استوديو التحليل البياني والتاريخي</span>
                </button>

                {(() => {
                  const hasReports = (activeCheckin?.medical_reports_urls?.length > 0 || safeClient?.medical_reports_urls?.length > 0);
                  return (
                    <button
                      type="button"
                      onClick={() => setInspectionTab('LABS')}
                      style={{
                        height: '32px',
                        padding: '0 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: inspectionTab === 'LABS' ? '1px solid #673DE6' : '1px solid #CBD5E1',
                        background: inspectionTab === 'LABS' ? '#673DE6' : '#FFFFFF',
                        color: inspectionTab === 'LABS' ? '#FFFFFF' : (hasReports ? '#1E293B' : '#94A3B8'),
                        boxShadow: inspectionTab === 'LABS' ? '0 1px 3px rgba(103, 61, 230, 0.2)' : 'none',
                        opacity: hasReports ? 1 : 0.85,
                        transition: 'all 0.15s ease'
                      }}
                      title={hasReports ? "عرض الفحوصات والتحاليل المرفقة" : "لا توجد تقارير طبية مرفقة لهذا المتدرب"}
                    >
                      <HeartPulse size={14} color={hasReports ? (inspectionTab === 'LABS' ? '#FFFFFF' : '#16A34A') : '#94A3B8'} />
                      <span>الفحوصات والتحاليل الطبية</span>
                      {hasReports ? (
                        <span style={{ 
                          fontSize: '9.5px', 
                          background: inspectionTab === 'LABS' ? 'rgba(255,255,255,0.25)' : '#DCFCE7', 
                          color: inspectionTab === 'LABS' ? '#FFFFFF' : '#166534', 
                          padding: '1px 6px', 
                          borderRadius: '9999px', 
                          fontWeight: 800 
                        }}>
                          مرفق تقرير
                        </span>
                      ) : (
                        <span style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 600 }}>
                          (لا توجد مرفقات)
                        </span>
                      )}
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(true)}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#101828',
                    transition: 'all 0.15s ease'
                  }}
                  title="تصدير بطاقة الإنجاز التراكمي للمشترك لمشاركتها عبر واتساب"
                >
                  <Trophy size={14} color="#D97706" />
                  <span>تصدير بطاقة الإنجاز</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const clientCode = safeClient?.client_code || safeClient?.id || '1';
                    window.open(`/coach/mesocycle-debrief/${clientCode}`, '_blank');
                  }}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #D0D5DD', background: '#FFFFFF', color: '#344054',
                    transition: 'all 0.15s ease'
                  }}
                  title="فتح تقرير المراجعة السريرية للميزوسايكل بصيغة PDF للطباعة"
                >
                  <FileText size={14} color="#38BDF8" />
                  <span>تقرير ختام الميزوسايكل (PDF)</span>
                </button>
              </div>

              {/* Tab 1: Photos Studio */}
              {inspectionTab === 'PHOTOS' && (
                <div style={{ minHeight: '340px' }}>
                  <InteractivePhotoComparisonStudio
                    history={activeCheckin.history || []}
                    activeCheckin={activeCheckin}
                    client={safeClient}
                  />
                </div>
              )}

              {/* Tab 2: Trajectory Chart */}
              {inspectionTab === 'CHART' && (
                <div style={{ minHeight: '340px' }}>
                  <ProgressTrendChart
                    history={activeCheckin.history || []}
                    isMaxTier={isMaxTier}
                    targetWeight={safeClient.target_weight}
                    client={safeClient}
                    activeCheckin={activeCheckin}
                  />
                </div>
              )}

              {/* Tab 3: Clinical Labs & Biomarkers */}
              {inspectionTab === 'LABS' && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)', 
                  border: '1px solid #86EFAC', 
                  borderRadius: '20px', 
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '24px',
                        background: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16A34A',
                        flexShrink: 0
                      }}>
                        <HeartPulse size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#101828' }}>بروتوكول الفحوصات المخبرية والمؤشرات السريرية</strong>
                          {(activeCheckin?.medical_reports_urls?.length > 0 || safeClient?.medical_reports_urls?.length > 0) ? (
                            <span style={{ fontSize: '10.5px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                              مرفق تقرير معتمد
                            </span>
                          ) : (
                            <span style={{ fontSize: '10.5px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                              فحص استرشادي
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                          متابعة وظائف الكلى، إنزيمات الكبد، صورة الدم الكاملة CBC، مقاومة الأنسولين، والفيتامينات مع التغذية العلاجية المعوضة.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLabModal(true)}
                      style={{
                        height: '36px',
                        padding: '0 16px',
                        borderRadius: '20px',
                        border: '1px solid #16A34A',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#15803D')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#16A34A')}
                    >
                      <Activity size={15} />
                      <span>فتح استوديو التحاليل المتقدم</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>الحالة الطبية العامة</span>
                      <strong style={{ fontSize: '12px', color: '#101828' }}>
                        {safeClient.medical_conditions?.length > 0 ? safeClient.medical_conditions.join('، ') : 'سليم ولا توجد موانع طبية'}
                      </strong>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>التقارير المرفوعة</span>
                      <strong style={{ fontSize: '12px', color: (activeCheckin?.medical_reports_urls?.length > 0 || safeClient?.medical_reports_urls?.length > 0) ? '#16A34A' : '#64748B' }}>
                        {(activeCheckin?.medical_reports_urls?.length || safeClient?.medical_reports_urls?.length || 0)} تقرير متاح بالفحص
                      </strong>
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>توجيه البروتوكول</span>
                      <strong style={{ fontSize: '12px', color: '#101828' }}>الغذاء أولاً والتدخل المحسوب</strong>
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* 4. Unified Weekly Context & Forward Outlook */}
            <FormSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                    <Calendar size={15} />
                  </div>
                  <span>سياق الأسبوع واستشراف القادم</span>
                </div>
              }
              description="إنجازات وملاحظات المتدرب في الأسبوع الحالي ورؤيته الاستباقية لظروف الأسبوع القادم."
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'stretch' }}>
                {/* Column 1: Current Week Feedback & Reflection */}
                <div style={{ 
                  background: '#F8FAFC', 
                  border: '1px solid #EAECF0', 
                  borderRadius: '24px', 
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid #EAECF0' }}>
                    <Trophy size={14} color="#0F172A" />
                    <strong style={{ fontSize: '12px', color: '#101828' }}>إنجازات وملاحظات الأسبوع المنقضي</strong>
                  </div>

                  {safeReflect && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '8px 10px' }}>
                        <span style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700, display: 'block', marginBottom: '2px' }}>أبرز إنجاز (NSV):</span>
                        <p style={{ fontSize: '11.5px', color: '#101828', margin: 0, lineHeight: 1.45 }}>
                          {safeReflect.nsv_note || 'لا توجد ملاحظة مسجلة'}
                        </p>
                      </div>
                      <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '8px 10px' }}>
                        <span style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 700, display: 'block', marginBottom: '2px' }}>أبرز تحدٍ أو صعوبة:</span>
                        <p style={{ fontSize: '11.5px', color: '#101828', margin: 0, lineHeight: 1.45 }}>
                          {safeReflect.struggle_note || 'لا توجد صعوبة مسجلة'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', padding: '10px 12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <MessageCircle size={13} color="#475569" />
                      <strong style={{ fontSize: '11px', color: '#475569' }}>رسالة المتدرب الإضافية:</strong>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#101828', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                      "{activeCheckin?.client_notes || 'لا توجد ملاحظات إضافية'}"
                    </p>
                  </div>
                </div>

                {/* Column 2: Forward-Looking Next Week Preview */}
                <div style={{ 
                  background: '#F8FAFC', 
                  border: '1px solid #EAECF0', 
                  borderRadius: '24px', 
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid #EAECF0' }}>
                    <Calendar size={14} color="#0F172A" />
                    <strong style={{ fontSize: '12px', color: '#101828' }}>استشراف وظروف الأسبوع القادم</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {/* Travel */}
                    <div style={{
                      background: activeCheckin?.next_week_travel ? '#FEF3C7' : '#FFFFFF',
                      border: activeCheckin?.next_week_travel ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                      borderRadius: '9999px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Plane size={12} color={activeCheckin?.next_week_travel ? '#B45309' : '#64748B'} />
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>السفر:</span>
                      </div>
                      <strong style={{ fontSize: '11px', color: activeCheckin?.next_week_travel ? '#B45309' : '#0F172A' }}>
                        {activeCheckin?.next_week_travel ? 'مسافر خارج المدينة' : 'مستقر محلياً'}
                      </strong>
                    </div>

                    {/* Gym */}
                    <div style={{
                      background: activeCheckin?.next_week_gym_available === false ? '#FEF2F2' : '#FFFFFF',
                      border: activeCheckin?.next_week_gym_available === false ? '1px solid #FECACA' : '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Dumbbell size={12} color={activeCheckin?.next_week_gym_available === false ? '#DC2626' : '#16A34A'} />
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>صالة الجيم:</span>
                      </div>
                      <strong style={{ fontSize: '11px', color: activeCheckin?.next_week_gym_available === false ? '#DC2626' : '#16A34A' }}>
                        {activeCheckin?.next_week_gym_available === false ? 'غير متوفرة' : 'متوفرة بانتظام'}
                      </strong>
                    </div>

                    {/* Realistic Days */}
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #EAECF0',
                      borderRadius: '9999px',
                      padding: '8px 10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <Target size={12} color="#0284C7" />
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>أيام التمرين:</span>
                      </div>
                      <strong style={{ fontSize: '11px', color: '#101828' }}>
                        {activeCheckin?.next_week_realistic_days ? `${activeCheckin.next_week_realistic_days} أيام` : 'كامل الخطة'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '9999px', padding: '10px 12px', flex: 1 }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      ملاحظات واستعدادات الأسبوع المقبل:
                    </span>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#101828', lineHeight: 1.5 }}>
                      {activeCheckin?.next_week_notes ? `"${activeCheckin.next_week_notes}"` : 'جاهز للالتزام التام بالخطة.'}
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 5. AI Engine Recommendation Cockpit & Quick Decision Bar */}
            <FormSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <BrainCircuit size={15} />
                  </div>
                  <span>تحليل وتوصيات المحرك السريري وقمرة اتخاذ القرار</span>
                </div>
              }
              description="التوصيات التكيفية المبنية على الدلتا الحسابية وسرعة الأيض، مع قرارات وتعديلات سريعة بنقرة واحدة."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                {/* 5.1 AI Recommendation Card */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '12px 14px', borderRadius: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BrainCircuit size={16} color="#0F172A" />
                      <strong style={{ fontSize: '12.5px', color: '#101828' }}>اقتراح المحرك التكيفي</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10.5px', background: '#E2E8F0', color: '#101828', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                        {safeAi.status_badge}
                      </span>
                      {/* S3-7 Option C: rapid loss hidden under POOR_ADHERENCE stays visible to the coach. */}
                      {safeAi.is_rapid_loss ? (
                        <span style={{ fontSize: '10.5px', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                          تنبيه: نزول حاد (&gt;1.5%)
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setMacroAdjustments(safeMacros);
                          setCoachReply(activeCheckin.suggested_reply);
                        }}
                        style={{
                          height: '26px',
                          padding: '0 10px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: '#F4F0FD', color: '#673DE6', border: '1px solid #EDE8FA', borderRadius: '9999px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          userSelect: 'none',
                          outline: 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                        title="استعادة الأرقام والرد المقترح تلقائياً"
                      >
                        <Zap size={11} />
                        <span>تطبيق المقترح</span>
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 8px 0', lineHeight: 1.55 }}>
                    {safeAi.recommendation}
                  </p>

                  {safeAi.warning && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: '12px', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={13} className="flex-shrink-0" />
                      <span>{safeAi.warning}</span>
                    </div>
                  )}
                </div>

                {/* 5.1.B Biomechanical Joint Firewall & Deload Tuning Box */}
                {(() => {
                  const bio = activeCheckin?.biofeedback || {};
                  const painReports = Array.isArray(activeCheckin?.pain_reports) ? activeCheckin.pain_reports : [];
                  const firstPain = painReports[0] || {};
                  let rawJoint = firstPain.location || firstPain.joint || bio.joint_pain_location || bio.joint_location || activeCheckin?.ai_analysis?.joint_pain_location;
                  let painScore = Number(firstPain.score || firstPain.severity || bio.pain_score || activeCheckin?.ai_analysis?.pain_score || 0);
                  const fatigueScore = Number(bio.fatigue_score || bio.fatigue || activeCheckin?.ai_analysis?.fatigue_score || 0);
                  const weekNum = Number(activeCheckin?.week_number || 1);

                  // If no explicit pain report in checkin, check client recorded injuries
                  if (!rawJoint && Array.isArray(activeCheckin?.client?.injuries) && activeCheckin.client.injuries.length > 0) {
                    const injStr = activeCheckin.client.injuries.join(' ').toLowerCase();
                    if (injStr.includes('ظهر') || injStr.includes('فقرات') || injStr.includes('l4') || injStr.includes('l5') || injStr.includes('غضروف') || injStr.includes('disc')) {
                      rawJoint = 'LOWER_BACK';
                      painScore = Math.max(painScore, 5);
                    } else if (injStr.includes('كتف') || injStr.includes('impingement') || injStr.includes('rotator')) {
                      rawJoint = 'SHOULDER';
                      painScore = Math.max(painScore, 5);
                    } else if (injStr.includes('ركبة') || injStr.includes('صابونة') || injStr.includes('patellar')) {
                      rawJoint = 'KNEE_PATELLAR';
                      painScore = Math.max(painScore, 5);
                    } else if (injStr.includes('كوع') || injStr.includes('elbow')) {
                      rawJoint = 'ELBOW';
                      painScore = Math.max(painScore, 5);
                    }
                  }

                  let normalizedJoint = rawJoint ? String(rawJoint).toUpperCase() : null;
                  if (normalizedJoint) {
                    if (normalizedJoint.includes('BACK') || normalizedJoint.includes('ظهر') || normalizedJoint.includes('قطنية')) normalizedJoint = 'LOWER_BACK';
                    else if (normalizedJoint.includes('SHOULDER') || normalizedJoint.includes('كتف')) normalizedJoint = 'SHOULDER';
                    else if (normalizedJoint.includes('KNEE') || normalizedJoint.includes('ركبة')) normalizedJoint = 'KNEE_PATELLAR';
                    else if (normalizedJoint.includes('ELBOW') || normalizedJoint.includes('كوع')) normalizedJoint = 'ELBOW';
                  }

                  const firewallResult = normalizedJoint && painScore >= 3 ? evaluateJointPainAndFirewall({
                    jointLocation: normalizedJoint,
                    painScore
                  }) : null;

                  const isDeloadTriggered = activeCheckin?.is_deload_recommended || 
                    activeCheckin?.ai_analysis?.is_deload_recommended || 
                    (weekNum >= 4 && fatigueScore >= 7) || 
                    activeCheckin?.ai_analysis?.status_badge?.includes('FATIGUE');

                  if (!firewallResult?.firewall_active && !isDeloadTriggered) return null;

                  const jointLabelMap = {
                    LOWER_BACK: 'أسفل الظهر والفقرات القطنية (L4/L5)',
                    SHOULDER: 'مفصل الكتف ومحفظة الروتاتور كف',
                    KNEE_PATELLAR: 'مفصل الركبة ووتر الصابونة',
                    ELBOW: 'مفصل الكوع وأوتار الترايسبس'
                  };

                  return (
                    <div style={{
                      background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                      border: '1.5px solid #22C55E',
                      borderRadius: '20px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={18} color="#15803D" />
                          <strong style={{ fontSize: '13px', color: '#166534' }}>
                            درع الأمان البيوميكانيكي وهندسة الاستشفاء العصبي
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {firewallResult?.firewall_active && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#DC2626',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}>
                              جدار حماية المفصل نشط
                            </span>
                          )}
                          {isDeloadTriggered && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#D97706',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}>
                              أسبوع تفريغ أحمال تلقائي (Deload)
                            </span>
                          )}
                        </div>
                      </div>

                      {firewallResult?.firewall_active && (
                        <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '24px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '11.5px', color: '#166534', marginBottom: '6px', lineHeight: 1.5 }}>
                            <strong>المفصل المتأثر:</strong> {jointLabelMap[normalizedJoint] || normalizedJoint} (مستوى الألم: {painScore}/10).
                            <span style={{ display: 'block', color: '#B91C1C', marginTop: '2px' }}>
                              تم عزل الحركات ذات الحمل القصي واستبدالها تلقائياً ببدائل بيوميكانيكية آمنة في أسبوع التدريب القادم:
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(firewallResult.immediate_swaps || []).slice(0, 2).map((sw, sIdx) => (
                              <div key={sIdx} style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRadius: '12px', padding: '6px 10px', fontSize: '11px', color: '#101828' }}>
                                <strong style={{ color: '#15803D', display: 'block', marginBottom: '2px' }}>
                                  البديل الموصى به: {sw.name_ar}
                                </strong>
                                <span style={{ color: '#475569' }}>
                                  الميزة الحركية: {sw.biomechanical_advantage_ar}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isDeloadTriggered && (
                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '20px', padding: '10px 12px', fontSize: '11.5px', color: '#92400E', lineHeight: 1.5 }}>
                          <strong style={{ color: '#B45309', display: 'block', marginBottom: '2px' }}>
                            بروتوكول تفريغ الأحمال المعتمد (Auto-Deload Week):
                          </strong>
                          تم خفض مجموعات العمل بنسبة 40% تلقائياً مع رفع RIR إلى 4 لإتاحة التعافي العصبي والمفصلي الكامل بعد تراكم الأحمال، مع الحفاظ على التكنيك والأوزان دون هبوط.
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            let note = `أهلاً يا ${clientFirstName}! `;
                            if (firewallResult?.firewall_active) {
                              note += `بناءً على الألم المسجل في ${jointLabelMap[normalizedJoint] || normalizedJoint}، قمنا بتفعيل جدار الحماية البيوميكانيكي وتعديل التمارين ذات الحمل القصي إلى بدائل آمنة تدعم الشفاء. `;
                            }
                            if (isDeloadTriggered) {
                              note += `كما تم اعتماد أسبوع تفريغ أحمال تلقائي (Deload) بخفض المجموعات بنسبة 40% ورفع معدل RIR إلى 4 لتجديد طاقة الجهاز العصبي والمفاصل والعودة بقوة مضاعفة. `;
                            }
                            note += `التزم بالبدائل والراحة المقررة، ومستمرون بكل عزم!`;
                            setCoachReply(note);
                          }}
                          style={{
                            height: '30px',
                            padding: '0 12px',
                            borderRadius: '9999px',
                            background: '#15803D',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ShieldCheck size={13} />
                          <span>إدراج التوجيه البيوميكانيكي والديلود في الرد</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 5.2 1-Click Quick Decision Presets Bar for Coach */}
                <div style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #EAECF0', 
                  borderRadius: '24px', 
                  padding: '12px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '10px', 
                  flexWrap: 'wrap' 
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#101828' }}>قرارات وتعديلات سريعة بنقرة واحدة:</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Preset 1: Keep Plan */}
                    <button
                      type="button"
                      onClick={() => {
                        setMacroAdjustments(safeMacros);
                        setCoachReply(`عاش يا ${clientFirstName}! مستواك الأسبوع ده ممتاز ونتايجك ماشية على الخطة بالظبط. هنثبت على نفس السعرات والماكروز عشان نواصل التقدم بنفس الزخم. كمل بنفس القوة يا بطل!`);
                      }}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        background: '#F8FAFC',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                      title="تثبيت السعرات والماكروز الحالية"
                    >
                      تثبيت الخطة
                    </button>

                    {/* Preset 2: Deficit -150 */}
                    <button
                      type="button"
                      onClick={() => {
                        const p = safeMacros.protein;
                        const c = Math.max(100, safeMacros.carbs - 25);
                        const f = Math.max(35, safeMacros.fats - 5);
                        const newCals = (p * 4) + (c * 4) + (f * 9);
                        setMacroAdjustments({ calories: newCals, protein: p, carbs: c, fats: f });
                        setCoachReply(`أداء ممتاز يا ${clientFirstName}! بناءً على قراءة الأسبوع، عملنا عجز تدريجي بسيط بمقدار 150 سعرة (خصم 25 جم كارب و 5 جم دهون) لتنشيط معدل الحرق واستمرار نزول الدهون بدون التأثير على طاقتك. ركز على شرب الماء والخطوات!`);
                      }}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        transition: 'all 0.15s ease'
                      }}
                      title="خصم 150 سعرة لكسر الثبات وتنشيط الحرق"
                    >
                      عجز (-150 سعرة)
                    </button>

                    {/* Preset 3: Surplus +150 */}
                    <button
                      type="button"
                      onClick={() => {
                        const p = safeMacros.protein + 5;
                        const c = safeMacros.carbs + 30;
                        const f = safeMacros.fats;
                        const newCals = (p * 4) + (c * 4) + (f * 9);
                        setMacroAdjustments({ calories: newCals, protein: p, carbs: c, fats: f });
                        setCoachReply(`عاش يا ${clientFirstName}! عشان نغذي البناء العضلي ونرفع كفاءة الطاقة في الجيم، زودنالك 150 سعرة إضافية (30 جم كارب و 5 جم بروتين). استغل الطاقة دي في كسر أوزان جديدة في التمرين!`);
                      }}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        transition: 'all 0.15s ease'
                      }}
                      title="زيادة 150 سعرة لدعم البناء أو التضخيم"
                    >
                      زيادة (+150 سعرة)
                    </button>

                    {/* Preset 4: Refeed Day */}
                    <button
                      type="button"
                      onClick={() => {
                        setCoachReply(`أداء بطولي يا ${clientFirstName}! ضفتلك يوم إعادة شحن (Refeed Day) بزيادة 80 جم كارب مع تقليل الدهون في يوم تمرينك الأثقل، عشان نشحن مخازن الجليكوجين ونحفز هرمون اللبتين ومعدل الأيض. التزم بالوجبة حول التمرين يا وحش!`);
                      }}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        border: '1px solid #DDD6FE',
                        transition: 'all 0.15s ease'
                      }}
                      title="تفعيل بروتوكول يوم إعادة التغذية Refeed"
                    >
                      يوم Refeed
                    </button>

                    {/* Preset 5: Deload Week */}
                    <button
                      type="button"
                      onClick={() => {
                        setCoachReply(`ممتاز جداً يا ${clientFirstName}! الأسبوع ده هيكون أسبوع استشفاء وتفريغ أحمال (Deload Week)؛ هنقلل مجموعات التمرين بنسبة 40% مع الحفاظ على أوزانك وثبتنا السعرات عند مستوى الصيانة، عشان نريح المفاصل والجهاز العصبي ونرجع الأسبوع اللي بعده بأعلى طاقة!`);
                      }}
                      style={{
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        background: '#F0F9FF',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD',
                        transition: 'all 0.15s ease'
                      }}
                      title="تفعيل أسبوع تفريغ الأحمال والاستشفاء"
                    >
                      أسبوع Deload
                    </button>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 7. 2-Column Subgrid: Macros & Coach Approval */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
              
              {/* Macro Adjustment Panel */}
              <FormSection
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                      <SlidersHorizontal size={15} />
                    </div>
                    <span>تعديل الماكروز للأسبوع القادم</span>
                  </div>
                }
                description="ضبط السعرات والجرامات اليومية المعتمدة للبرنامج."
              >
                {(() => {
                  const pKcal = (macroAdjustments.protein || 0) * 4;
                  const cKcal = (macroAdjustments.carbs || 0) * 4;
                  const fKcal = (macroAdjustments.fats || 0) * 9;
                  const calcTotal = pKcal + cKcal + fKcal;
                  const pPct = calcTotal > 0 ? Math.round((pKcal / calcTotal) * 100) : 0;
                  const cPct = calcTotal > 0 ? Math.round((cKcal / calcTotal) * 100) : 0;
                  const fPct = calcTotal > 0 ? Math.round((fKcal / calcTotal) * 100) : 0;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', fontFamily: 'Cairo, sans-serif' }}>
                      
                      {/* 1. Daily Total Calories Hero Box */}
                      <div 
                        style={{ 
                          background: '#F8FAFC', 
                          border: '1px solid #EAECF0', 
                          borderRadius: '20px', 
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12px', color: '#101828', display: 'block' }}>السعرات الكلية اليومية</strong>
                          <span style={{ fontSize: '10.5px', color: '#64748B' }}>المستهدف المعتمد للبرنامج</span>
                        </div>

                        {/* Total Calories Integrated Input */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#FFFFFF', 
                            border: '1px solid #CBD5E1', 
                            borderRadius: '9999px', 
                            padding: '2px 8px', 
                            height: '34px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <input
                            type="number"
                            className="no-spinner bare-input inline-pill-input clean-inline-input"
                            value={macroAdjustments.calories || ''}
                            onChange={(e) => setMacroAdjustments({ ...macroAdjustments, calories: Number(e.target.value) })}
                            style={{ 
                              width: '65px', 
                              border: 'none', 
                              outline: 'none', 
                              background: 'transparent',
                              textAlign: 'center', 
                              fontWeight: 800, 
                              fontSize: '15px', 
                              color: '#101828', 
                              fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                              padding: 0,
                              MozAppearance: 'textfield'
                            }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginRight: '4px', userSelect: 'none' }}>سعرة</span>
                        </div>
                      </div>

                      {/* 2. 3-Column Macro Grams & Percentage Cards (Clean & Elegant) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        
                        {/* Protein */}
                        <div 
                          style={{ 
                            background: '#FFFFFF', 
                            border: '1px solid #EAECF0', 
                            borderRadius: '20px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828' }}>البروتين</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '9999px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
                              className="no-spinner bare-input inline-pill-input clean-inline-input"
                              value={macroAdjustments.protein || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newCals = (val * 4) + (macroAdjustments.carbs * 4) + (macroAdjustments.fats * 9);
                                setMacroAdjustments({ ...macroAdjustments, protein: val, calories: newCals });
                              }}
                              style={{ 
                                width: '100%', 
                                border: 'none', 
                                outline: 'none', 
                                background: 'transparent',
                                textAlign: 'center', 
                                fontWeight: 800, 
                                fontSize: '15px', 
                                color: '#101828', 
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                padding: 0,
                                MozAppearance: 'textfield'
                              }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginRight: '2px', userSelect: 'none', flexShrink: 0 }}>جم</span>
                          </div>

                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, Cairo' }}>{pKcal} سعرة</span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ color: '#101828', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{pPct}%</span>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div 
                          style={{ 
                            background: '#FFFFFF', 
                            border: '1px solid #EAECF0', 
                            borderRadius: '20px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828' }}>الكارب</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '9999px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
                              className="no-spinner bare-input inline-pill-input clean-inline-input"
                              value={macroAdjustments.carbs || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newCals = (macroAdjustments.protein * 4) + (val * 4) + (macroAdjustments.fats * 9);
                                setMacroAdjustments({ ...macroAdjustments, carbs: val, calories: newCals });
                              }}
                              style={{ 
                                width: '100%', 
                                border: 'none', 
                                outline: 'none', 
                                background: 'transparent',
                                textAlign: 'center', 
                                fontWeight: 800, 
                                fontSize: '15px', 
                                color: '#101828', 
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                padding: 0,
                                MozAppearance: 'textfield'
                              }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginRight: '2px', userSelect: 'none', flexShrink: 0 }}>جم</span>
                          </div>

                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, Cairo' }}>{cKcal} سعرة</span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ color: '#101828', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{cPct}%</span>
                          </div>
                        </div>

                        {/* Fats */}
                        <div 
                          style={{ 
                            background: '#FFFFFF', 
                            border: '1px solid #EAECF0', 
                            borderRadius: '20px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#101828' }}>الدهون</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '9999px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
                              className="no-spinner bare-input inline-pill-input clean-inline-input"
                              value={macroAdjustments.fats || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newCals = (macroAdjustments.protein * 4) + (macroAdjustments.carbs * 4) + (val * 9);
                                setMacroAdjustments({ ...macroAdjustments, fats: val, calories: newCals });
                              }}
                              style={{ 
                                width: '100%', 
                                border: 'none', 
                                outline: 'none', 
                                background: 'transparent',
                                textAlign: 'center', 
                                fontWeight: 800, 
                                fontSize: '15px', 
                                color: '#101828', 
                                fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                                padding: 0,
                                MozAppearance: 'textfield'
                              }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', marginRight: '2px', userSelect: 'none', flexShrink: 0 }}>جم</span>
                          </div>

                          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, Cairo' }}>{fKcal} سعرة</span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ color: '#101828', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{fPct}%</span>
                          </div>
                        </div>

                      </div>

                      {/* 3. Reconciled Clean Status Bar (Monochrome & Elegant) */}
                      <div 
                        style={{ 
                          background: '#F8FAFC', 
                          border: '1px solid #EAECF0', 
                          borderRadius: '20px', 
                          padding: '7px 12px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          fontSize: '11px', 
                          color: '#475569', 
                          fontWeight: 700
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#64748B' }}>المجموع المحسوب:</span>
                          <strong style={{ color: '#101828', fontSize: '12px', fontFamily: 'JetBrains Mono, Cairo' }}>
                            {calcTotal} سعرة
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px' }}>
                          <span style={{ color: '#334155', fontWeight: 700 }}>بروتين {pKcal}</span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ color: '#334155', fontWeight: 700 }}>كارب {cKcal}</span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ color: '#334155', fontWeight: 700 }}>دهون {fKcal}</span>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </FormSection>

              {/* Clinical Safety Lockout & Unlock Card (FIX-09) */}
              {activeCheckin?.analysis_output?.training_locked === true && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '20px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#991B1B' }}>
                      قفل أمان سريري نشط — إيقاف مؤقت للتمرين لحين توثيق التصريح الطبي
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: '9999px' }}>
                      يتطلب تصريح طبيب
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, color: '#7F1D1D', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clearanceConfirmed}
                      onChange={(e) => setClearanceConfirmed(e.target.checked)}
                    />
                    <span>أؤكد استلام التقرير والتصريح الطبي الرسمي باستئناف التدريب لهذا المتدرب</span>
                  </label>
                  <input
                    type="text"
                    value={clearanceNotes}
                    onChange={(e) => setClearanceNotes(e.target.value)}
                    placeholder="اكتب ملخص التصريح الطبي وتوصية الطبيب المعالج..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '9999px',
                      border: '1px solid #FCA5A5',
                      background: '#FFFFFF',
                      fontSize: '11.5px',
                      color: '#101828',
                      fontFamily: 'Cairo, sans-serif',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleUnlockClinicalSafety}
                      disabled={isUnlockingClinical}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isUnlockingClinical ? 'جاري توثيق التصريح...' : 'فك القفل السريري وتوثيق التصريح الطبي'}
                    </button>
                  </div>
                </div>
              )}
              {clinicalUnlockMessage && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '8px 12px', fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>
                  {clinicalUnlockMessage}
                </div>
              )}

              {/* Period Compliance Summary Bar (ملخص التزام الفترة قبل القرار) */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '8px'
              }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>تغير الوزن</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: Number(safeMetrics?.weight_change || 0) <= 0 ? '#16A34A' : '#D97706', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {Number(safeMetrics?.weight_change || 0) > 0 ? `+${safeMetrics?.weight_change}` : (safeMetrics?.weight_change || 0)} كجم
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>التزام التغذية</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#101828', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {safeMetrics?.adherence ?? 100}%
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>حصص التمرين</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#101828', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {safeMetrics?.workouts_completed ?? 0} / {safeMetrics?.workouts_target ?? 4}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '12px', padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>فرق السعرات</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#673DE6', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {(() => {
                      const diff = (Number(macroAdjustments?.calories) || 0) - (Number(activeCheckin?.baseline_macros?.calories) || 2000);
                      return diff > 0 ? `+${diff}` : diff;
                    })()} سعرة
                  </div>
                </div>
              </div>

              {/* Coach Reply & Approval */}
              <FormSection
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '9999px', background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#673DE6' }}>
                      <Send size={15} />
                    </div>
                    <span>رسالة الكوتش واعتماد الخطة</span>
                  </div>
                }
                description="كتابة التوجيه التشجيعي وإرسال التحديث لبرنامج المتدرب."
              >
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>نص الرسالة الموجهة للمتدرب:</span>
                    <button
                      type="button"
                      onClick={() => setCoachReply(buildSmartWhatsAppSummary(coachReply))}
                      style={{
                        height: '30px',
                        padding: '0 12px',
                        borderRadius: '9999px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        color: '#101828',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F1F5F9';
                        e.currentTarget.style.borderColor = '#94A3B8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8FAFC';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }}
                      title="توليد ملخص أسبوعي منظم وشامل للواتساب"
                    >
                      <Zap size={12} color="#16A34A" />
                      <span>توليد ملخص الواتساب الذكي</span>
                    </button>
                  </div>
                  <textarea
                    value={coachReply}
                    onChange={(e) => setCoachReply(e.target.value)}
                    placeholder="اكتب التوجيه والرد التشجيعي للمتدرب..."
                    style={{
                      width: '100%',
                      height: '115px',
                      padding: '10px 12px',
                      borderRadius: '9999px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.5,
                      color: '#101828',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {/* Copy Text Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(coachReply);
                        alert('تم نسخ رسالة التوجيه للحافظة بنجاح');
                      }}
                      style={{
                        height: '38px',
                        padding: '0 14px',
                        borderRadius: '9px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        color: '#334155',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      title="نسخ نص الرسالة"
                    >
                      <span>نسخ</span>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleOpenDirectWhatsApp}
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        borderRadius: '9px',
                        border: '1px solid #86EFAC',
                        background: '#F0FDF4',
                        color: '#16A34A',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#DCFCE7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                      title="فتح واتساب مباشرة بالرسالة"
                    >
                      <MessageCircle size={15} />
                      <span>واتساب</span>
                    </button>

                    {/* Primary Approve & Next Button */}
                    <button
                      type="button"
                      onClick={() => handleApprove(false)}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        height: '38px',
                        background: '#FFFFFF',
                        color: '#101828',
                        border: '1px solid #CBD5E1',
                        borderRadius: '9px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      title="اعتماد مراجعة المتابعة وحفظ ملاحظات الكوتش دون تعديل أرقام البرنامج الحالي"
                    >
                      <span>اعتماد المراجعة فقط</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(true)}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        height: '38px',
                        background: '#673DE6',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '9px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={15} />
                          <span>اعتماد وتحديث الخطة</span>
                        </>
                      )}
                    </button>
                  </div>
                  {approveError && (
                    <div role="alert" style={{ marginTop: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '8px 10px', fontSize: '12px', fontWeight: 700, color: '#B91C1C' }}>
                      {approveError}
                    </div>
                  )}
                </div>
              </FormSection>

            </div>
              </>
            )}

          </div>

        </div>

        {/* نافذة استوديو فحص التحاليل والمؤشرات الحيوية السريرية */}
        {showLabModal && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setShowLabModal(false)}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                width: '1100px',
                maxWidth: '98vw',
                height: '92vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                border: '1px solid #CBD5E1'
              }}
            >
              <LabBiomarkersReviewStudio
                client={safeClient}
                initialValues={activeCheckin?.biomarkers || safeClient?.biomarkers || {}}
                medicalReportsUrls={activeCheckin?.medical_reports_urls || safeClient?.medical_reports_urls || []}
                onSave={(savedData) => {
                  if (savedData?.clinicalResult) {
                    const { dietaryModifications, wholeFoodInterventions } = savedData.clinicalResult;
                    
                    // تطبيق سقف البروتين إن وجد مؤشر لإجهاد كلوي
                    if (dietaryModifications?.protein_cap_g_per_kg && (safeClient?.start_weight || safeClient?.weight_kg)) {
                      const clientWeight = safeClient.start_weight || safeClient.weight_kg || 80;
                      const capG = Math.round(dietaryModifications.protein_cap_g_per_kg * clientWeight);
                      setMacroAdjustments(prev => {
                        if (prev.protein > capG) {
                          const diff = prev.protein - capG;
                          return {
                            ...prev,
                            protein: capG,
                            carbs: prev.carbs + Math.round((diff * 4) / 4)
                          };
                        }
                        return prev;
                      });
                    }

                    // تحديث رسالة التوجيه التشجيعي ببروتوكول الغذاء أولاً
                    if (wholeFoodInterventions && wholeFoodInterventions.length > 0) {
                      const foodText = wholeFoodInterventions.map(f => `• ${f.food_title_ar}: ${f.rationale_ar}`).join('\n');
                      setCoachReply(prev => {
                        const base = prev ? `${prev}\n\n` : '';
                        return `${base}توجيهات التغذية السريرية وبروتوكول الغذاء أولاً:\n${foodText}`;
                      });
                    }
                  }
                  setShowLabModal(false);
                }}
                onClose={() => setShowLabModal(false)}
              />
            </div>
          </div>
        )}

        {/* إشعار عائم راقٍ باعتماد التقييم مع إمكانية فتح واتساب بنقرة واحدة */}
        {approvalToast && (
          <div 
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              zIndex: 9999,
              background: '#673DE6',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '12px 18px',
              boxShadow: '0 10px 30px rgba(103, 61, 230, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '480px',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
            dir="rtl"
          >
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                تم اعتماد تقييم {approvalToast.clientName} بنجاح
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                تم تحديث الخطة في تطبيق المتدرب وحفظ الماكروز.
              </div>
            </div>
            {approvalToast.phone && (
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = formatWhatsAppPhone(approvalToast.phone);
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(approvalToast.reply)}`, '_blank');
                  setApprovalToast(null);
                }}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '9999px',
                  background: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageCircle size={13} />
                <span>إرسال واتساب</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setApprovalToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="إغلاق"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Milestone Progress Card Modal */}
        {isMilestoneModalOpen && (
          <MilestoneProgressCardModal
            isOpen={isMilestoneModalOpen}
            onClose={() => setIsMilestoneModalOpen(false)}
            client={safeClient}
            activeCheckin={activeCheckin}
            history={activeCheckin?.history || []}
          />
        )}

        {/* Correct Measurements Modal */}
        {isEditMeasurementsOpen && activeCheckin && (
          <CorrectMeasurementsModal
            isOpen={isEditMeasurementsOpen}
            onClose={() => setIsEditMeasurementsOpen(false)}
            checkin={activeCheckin}
            client={safeClient}
            onSaved={(data) => {
              if (data?.checkin) {
                const newW = data.checkin.average_weight_kg;
                const newDelta = data.checkin.weight_change_kg;
                const newWaist = data.checkin.waist_circumference_cm;
                setCheckinList(prev => prev.map(item => {
                  if (item.id === activeCheckin.id || item.checkin_id === activeCheckin.id) {
                    return {
                      ...item,
                      average_weight_kg: newW,
                      weight_change_kg: newDelta,
                      waist_circumference_cm: newWaist,
                      analysis_output: data.checkin.analysis_output,
                      is_measurement_corrected: true,
                      metrics: {
                        ...(item.metrics || {}),
                        current_weight: newW,
                        weight_change: newDelta,
                        waist_current: newWaist || item.metrics?.waist_current
                      }
                    };
                  }
                  return item;
                }));
              }
            }}
          />
        )}

      </div>
    </AdminLayout>
  );
}

