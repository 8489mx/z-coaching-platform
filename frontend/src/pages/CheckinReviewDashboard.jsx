import { API_BASE } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  MessageCircle, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Scale, 
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
  Phone,
  Search,
  ArrowRight,
  UserCheck,
  Flame,
  Moon,
  HeartPulse,
  RotateCcw,
  Target,
  Clock,
  Filter,
  Check,
  Dumbbell,
  Droplets,
  Trophy,
  ExternalLink,
  Plane,
  Calendar
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';
import InteractivePhotoComparisonStudio from '../components/checkin/InteractivePhotoComparisonStudio';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../utils/tierBadgeHelper';
import { arabicSearchMatch } from '../utils/searchUtils';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { formatWhatsAppPhone } from '../utils/whatsappRemindersEngine';

import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from '../data/stressTestClientsBlueprints';

export const INITIAL_CHECKINS = Array.isArray(STRESS_TEST_CLIENTS) ? STRESS_TEST_CLIENTS.map((c) => {
  const bp = (CLINICAL_MASTER_BLUEPRINTS && CLINICAL_MASTER_BLUEPRINTS[c.client_code]) || {};
  const bpTargets = bp?.nutrition?.targets || {};
  const isFatLoss = c.primary_goal === 'fat_loss';
  const isLeanBulk = c.primary_goal === 'lean_bulk';
  const isRecomp = c.primary_goal === 'recomp';

  const baseWeight = c.weight_kg || 75;
  const baseWaist = Math.round(baseWeight * (c.gender === 'female' ? 0.95 : 1.05));
  
  // Realistic delta matching physiological primary goal
  const w1Delta = isFatLoss ? -0.7 : (isLeanBulk ? 0.3 : -0.2);
  const w2Delta = isFatLoss ? -0.6 : (isLeanBulk ? 0.2 : 0.0);
  const w3Delta = isFatLoss ? -0.8 : (isLeanBulk ? 0.3 : -0.1);

  const curWeight = Number((baseWeight + w1Delta + w2Delta + w3Delta).toFixed(1));
  const curWaist = Math.round(baseWaist - (isFatLoss ? 3 : (isRecomp ? 2 : 0)));
  const weightChangeThisWeek = w3Delta;

  const baselineMacros = {
    calories: bpTargets.calories || (isFatLoss ? 1800 : (isLeanBulk ? 2500 : 2000)),
    protein: bpTargets.protein || (isFatLoss ? 150 : (isLeanBulk ? 140 : 130)),
    carbs: bpTargets.carbs || (isFatLoss ? 170 : (isLeanBulk ? 320 : 220)),
    fats: bpTargets.fats || (isFatLoss ? 48 : (isLeanBulk ? 65 : 55))
  };

  const clientFirstName = (c.full_name || 'المتدرب').split(' ')[0];

  return {
    id: `CHK_${c.client_code}`,
    raw_id: c.id,
    user_id: c.id,
    client: {
      id: `CL_${c.client_code}`,
      name: c.full_name,
      code: c.client_code,
      package: (c.package_name || '').toUpperCase().includes('MAX') ? 'MAX' : 'ELITE',
      package_name: c.package_name || 'باقة ماكس',
      phone: c.phone_number,
      country: { name: 'مصر' },
      gender: c.gender,
      goal_type: isFatLoss ? 'CUTTING' : (isLeanBulk ? 'BULKING' : 'RECOMP'),
      target_goal: c.goal_label,
      start_weight: baseWeight,
      target_weight: isFatLoss ? (baseWeight - 8) : (baseWeight + 4)
    },
    week_number: 3,
    checkin_number: 3,
    submission_date: 'اليوم • وارد حديثاً',
    history: [
      { week: 0, weight: baseWeight, waist: baseWaist, adherence: 100, date: 'نقطة البداية', diff: 0 },
      { week: 1, weight: Number((baseWeight + w1Delta).toFixed(1)), waist: baseWaist - 1, adherence: 95, date: 'الأسبوع 1', diff: w1Delta },
      { week: 2, weight: Number((baseWeight + w1Delta + w2Delta).toFixed(1)), waist: baseWaist - 2, adherence: 90, date: 'الأسبوع 2', diff: w2Delta },
      { week: 3, weight: curWeight, waist: curWaist, adherence: 93, date: 'الأسبوع 3', diff: w3Delta }
    ],
    metrics: {
      previous_weight: Number((curWeight - weightChangeThisWeek).toFixed(1)),
      current_weight: curWeight,
      weight_change: weightChangeThisWeek,
      waist_previous: curWaist + 1,
      waist_current: curWaist,
      waist_change: -1,
      adherence: 93,
      workouts_completed: c.training_days || 4,
      workouts_target: c.training_days || 4,
      daily_steps_avg: 8200,
      strength_trend: 'INCREASED',
      strength_note: 'تطور ملحوظ في الأوزان',
      water_liters: bpTargets.water_liters || 3.5,
      off_plan_meals: 0,
      rpe_average: 8.0,
      status_badge: 'تقدم ممتاز',
      warning: null
    },
    biofeedback: {
      energy: 8,
      sleep: 8,
      hunger: 4,
      digestion_status: 'ممتاز',
      stress: 3
    },
    reflections: {
      nsv_note: 'التزام كامل بالوجبات ومواعيد التمرين دون أي تخريب.',
      struggle_note: 'لا توجد صعوبات تذكر، الطاقة ممتازة خلال اليوم.'
    },
    client_notes: 'الالتزام 100% بالخطة والأوزان في تحسن مستمر.',
    // Retrospective deep check-in fields
    lifestyle_variance: 'normal_routine',
    bowel_regularity: c.client_code === 'CL_FAT_LOSS_STALL' ? 'constipated_3plus' : 'regular_daily',
    sleep_stress_composite: c.client_code === 'CL_FAT_LOSS_STALL' ? 5 : 2,
    menstrual_phase: null,
    // Prospective forward-looking preview fields
    next_week_travel: c.client_code === 'CL_FAT_LOSS_STALL',
    next_week_gym_available: c.client_code !== 'CL_FAT_LOSS_STALL',
    next_week_realistic_days: c.training_days || 4,
    next_week_notes: c.client_code === 'CL_FAT_LOSS_STALL' ? 'مسافر لحضور مؤتمر عمل 4 أيام وهتمرن بوزن الجسم' : '',
    ai_analysis: {
      recommendation: isFatLoss
        ? 'استجابة أيضية ممتازة ومعدل نزول دهون متزن. يوصى بتثبيت السعرات والماكروز لمواصلة التقدم بنفس المعدل.'
        : (isLeanBulk
          ? 'زيادة عضلية صافية متزنة دون تراكم دهون زائدة. يوصى بالاستمرار على السعرات الحالية.'
          : 'إعادة تشكيل متميزة مع انخفاض محيط الخصر وثبات الوزن. استمر على نفس الماكروز.'),
      status_badge: 'تقدم ممتاز',
      warning: null
    },
    baseline_macros: baselineMacros,
    suggested_reply: `عاش يا ${clientFirstName}! أداء ممتاز في المتابعة، والالتزام 93% انعكس مباشرة على النتيجة. مستمرون بنفس القوة!`
  };
}) : [];

const DEFAULT_BASELINE_MACROS = {
  calories: 2000,
  protein: 140,
  carbs: 220,
  fats: 60
};

// =========================================================================
// CLEAN, MINIMAL PROGRESS CHART (Z COACHING SIGNATURE STYLE)
// =========================================================================
function ProgressTrendChart({ history = [], isMaxTier = false, targetWeight = null, client = {} }) {
  const [activeTab, setActiveTab] = useState('weight'); // 'weight' | 'waist' | 'adherence'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!history || history.length === 0) return null;

  const colorPrimary = isMaxTier ? '#C4952D' : '#0284C7';

  const startPoint = history[0];
  const startWeightVal = client.start_weight || startPoint.weight;
  const targetWeightVal = targetWeight || client.target_weight || (startWeightVal - 6);

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

  // SVG setup with generous left and top margin so badges never touch Y-axis labels
  const svgWidth = 720;
  const svgHeight = 190;
  const padLeft = 115;  // Substantial space: points start at 115, badge starts at 82, Y-axis text is at 36
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

  // Target Goal Reference Line calculation (when in weight tab)
  let targetY = null;
  if (activeTab === 'weight' && targetWeightVal && targetWeightVal >= yMin && targetWeightVal <= yMax) {
    targetY = padTop + chartH - ((targetWeightVal - yMin) / (yMax - yMin || 1)) * chartH;
  }

  const activeIdx = hoveredIdx !== null ? hoveredIdx : points.length - 1;
  const activePoint = points[activeIdx] || points[points.length - 1];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '6px'
    }}>
      
      {/* Header Bar: Clean Switcher & Simple Start/Target Hint */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Switcher Pills */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '2px', borderRadius: '6px', gap: '2px' }}>
          {[
            { id: 'weight', label: 'الوزن' },
            { id: 'waist', label: 'محيط الخصر' },
            { id: 'adherence', label: 'الالتزام' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                height: '24px',
                padding: '0 12px',
                borderRadius: '4px',
                border: 'none',
                background: activeTab === tab.id ? colorPrimary : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                userSelect: 'none',
                outline: 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simple Clean Meta Note */}
        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>البداية: <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono' }}>{startWeightVal} كجم</strong></span>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <span>المستهدف: <strong style={{ color: '#16A34A', fontFamily: 'JetBrains Mono' }}>{targetWeightVal} كجم</strong></span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: '190px', userSelect: 'none' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Soft Shaded Area Gradient */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorPrimary} stopOpacity="0.25" />
              <stop offset="65%" stopColor={colorPrimary} stopOpacity="0.04" />
              <stop offset="100%" stopColor={colorPrimary} stopOpacity="0" />
            </linearGradient>

            {/* Vertical Light-Beam Highlight Gradient */}
            <linearGradient id={beamGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorPrimary} stopOpacity="0.18" />
              <stop offset="80%" stopColor={colorPrimary} stopOpacity="0.02" />
              <stop offset="100%" stopColor={colorPrimary} stopOpacity="0" />
            </linearGradient>

            {/* Soft Card Drop Shadow for Floating Badges */}
            <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels (Safely isolated on the left) */}
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

          {/* Target Goal Line if in weight view */}
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

          {/* Vertical Light-Beam Column under Active Point */}
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

          {/* Area Fill under Spline */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradId})`}
            />
          )}

          {/* Spline Wave Curve Line */}
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

          {/* Points & Floating Badges */}
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
                {/* 1. Floating White Card Badge */}
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

                  {/* Downward Pointer Triangle */}
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

                  {/* Text inside Badge */}
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

                {/* 2. Interactive Point Dot */}
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

                {/* 3. X-Axis Label under point */}
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

    </div>
  );
}

export default function CheckinReviewDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkinList, setCheckinList] = useState(INITIAL_CHECKINS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL | MAX | ELITE
  const [macroAdjustments, setMacroAdjustments] = useState(DEFAULT_BASELINE_MACROS);
  const [coachReply, setCoachReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [showLabModal, setShowLabModal] = useState(false);

  // Live Checkins Fetcher from MariaDB
  useEffect(() => {
    const fetchLiveCheckins = async () => {
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
                  package_name: String(ch.user?.subscription_package || '').includes('MAX') ? 'باقة ماكس' : 'باقة إليت',
                  phone: ch.user?.phone_number || '',
                  country: { name: 'مصر' },
                  gender: 'male',
                  goal_type: 'FAT_LOSS',
                  target_goal: 'خسارة دهون',
                  start_weight: ch.average_weight_kg || 80,
                  target_weight: (ch.average_weight_kg || 80) - 10
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
                  warning: null
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
    };
    fetchLiveCheckins();
  }, []);

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
            name: `مشترك جديد (#${cleanTarget})`,
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

  // Sync state when switching clients
  useEffect(() => {
    if (activeCheckin) {
      setMacroAdjustments(activeCheckin?.baseline_macros || DEFAULT_BASELINE_MACROS);
      setCoachReply(activeCheckin?.suggested_reply || "");
    }
  }, [activeCheckin]);

  // Handle Escape key to close active modals safely without losing queue position
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLabModal) {
          setShowLabModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLabModal]);

  const handleApprove = async () => {
    if (!activeCheckin) return;
    setIsSubmitting(true);

    const checkinDbId = activeCheckin.raw_id;
    const clientPhone = safeClient?.phone;
    const replyMsg = coachReply;
    const approvedClientName = safeClient?.name || 'المتدرب';

    try {
      if (checkinDbId) {
        await fetch(`${API_BASE}/api/v1/checkin/${checkinDbId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coach_notes: replyMsg,
            custom_macros: macroAdjustments
          })
        });
      }
    } catch (err) {
      console.warn('Failed to persist checkin approval to database:', err);
    }

    setIsSubmitting(false);

    // Remove approved client from queue
    const remaining = checkinList.filter(item => item.id !== activeCheckin.id);
    setCheckinList(remaining);
    setApprovedCount(prev => prev + 1);

    if (selectedIdx >= remaining.length && remaining.length > 0) {
      setSelectedIdx(remaining.length - 1);
    }

    // Quick WhatsApp Option
    const shouldOpenWhatsApp = window.confirm(
      `تم اعتماد تحديث تقييم (${approvedClientName}) بنجاح وتحديث خطته في التطبيق.\n\nهل تريد فتح واتساب لإرسال رسالة التوجيه للمتدرب الآن؟`
    );

    if (shouldOpenWhatsApp && clientPhone) {
      const cleanPhone = formatWhatsAppPhone(clientPhone);
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyMsg)}`, '_blank');
    }
  };

  const handleResetDemo = () => {
    window.location.reload();
    setSelectedIdx(0);
    setSearchQuery('');
    setTierFilter('ALL');
    setApprovedCount(0);
  };

  const handleOpenDirectWhatsApp = () => {
    if (!activeCheckin?.client?.phone) return;
    const cleanPhone = formatWhatsAppPhone(activeCheckin?.client?.phone);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(coachReply)}`, '_blank');
  };

  const isMaxTier = activeCheckin?.client?.package?.toUpperCase().includes('MAX');

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="مراجعة التقييمات الدورية (Check-in Review)"
          description={`طابور اتخاذ القرارات الأسبوعية • ${checkinList.length} تقييم بانتظار المراجعة والاعتماد`}
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => window.open(`/coach/editor/${safeClient?.code || safeClient?.id || '1'}`, '_blank')}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                title="فتح خطة المتدرب بالكامل في محرر الكوتش لتعديل التمارين والوجبات"
              >
                <Dumbbell size={13} />
                <span>محرر خطة المتدرب</span>
              </button>

              <button 
                type="button" 
                onClick={handleResetDemo}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '6px',
                  background: '#F8FAFC',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
                title="إعادة ضبط قائمة التقييمات"
              >
                <RotateCcw size={13} />
                <span>إعادة ضبط القائمة</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/')}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer'
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
            border: '1px solid #E2E8F0', 
            borderRadius: '10px', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)'
          }}>
            {/* Queue Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '3px', height: '14px', background: '#0F172A', borderRadius: '2px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                    طابور المشتركين ({filteredQueue.length})
                  </strong>
                </div>
                <span style={{ fontSize: '11px', background: '#0F172A', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  معلق
                </span>
              </div>

              {/* Search Bar in Queue */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={13} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الكود..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIdx(0);
                  }}
                  style={{
                    width: '100%',
                    height: '30px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    padding: '0 28px 0 8px',
                    fontSize: '11px',
                    outline: 'none',
                    background: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'MAX', label: 'MAX' },
                  { id: 'ELITE', label: 'ELITE' }
                ].map(t => {
                  const isSelected = tierFilter === t.id;
                  let border = '1px solid #E2E8F0';
                  let background = '#F8FAFC';
                  let color = '#64748B';
                  let shadow = 'none';

                  if (isSelected) {
                    border = '1px solid #0F172A';
                    background = '#0F172A';
                    color = '#FFFFFF';
                    shadow = '0 1px 3px rgba(15, 23, 42, 0.2)';
                  } else if (t.id === 'MAX') {
                    border = '1px solid #E2E8F0';
                    background = '#F8FAFC';
                    color = '#B45309';
                  } else if (t.id === 'ELITE') {
                    border = '1px solid #E2E8F0';
                    background = '#F8FAFC';
                    color = '#0284C7';
                  }

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTierFilter(t.id);
                        setSelectedIdx(0);
                      }}
                      style={{
                        height: '24px',
                        borderRadius: '4px',
                        border,
                        background,
                        color,
                        boxShadow: shadow,
                        fontSize: '10.5px',
                        fontWeight: 800,
                        fontFamily: t.id !== 'ALL' ? 'JetBrains Mono, sans-serif' : 'inherit',
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Queue Items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredQueue.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '11.5px' }}>
                  لا يوجد متدرب مطابق للبحث
                </div>
              ) : (
                filteredQueue.map((item, idx) => {
                  const isSelected = activeCheckin && item.id === activeCheckin.id;
                  const isMax = String(item?.client?.package || '').toUpperCase().includes('MAX');
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIdx(idx)}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid #0F172A' : '1px solid #F1F5F9',
                        background: isSelected ? '#FFFFFF' : '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {/* Row 1: Code, Name, Package */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ClientCodeBadge code={item?.client?.code || '1'} item={item?.client} size="xs" />
                          <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                            {item?.client?.name || 'مشترك'}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {(item?.medical_reports_urls?.length > 0 || item?.client?.medical_reports_urls?.length > 0) && (
                            <span style={{ fontSize: '9px', background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '0px 4px', borderRadius: '3px', fontWeight: 800 }}>
                              تحاليل
                            </span>
                          )}
                          <ClientPackageBadge item={item?.client} size="xs" />
                          {(() => {
                            const fasting = extractClientFastingProfile(item?.client);
                            return (
                              <>
                                {fasting.primaryFastingBadge && (
                                  <span style={{
                                    fontSize: '9px',
                                    padding: '0px 4px',
                                    borderRadius: '3px',
                                    background: fasting.primaryFastingBadge.bg,
                                    border: `1px solid ${fasting.primaryFastingBadge.border}`,
                                    color: fasting.primaryFastingBadge.color,
                                    fontWeight: 800
                                  }}>
                                    {fasting.primaryFastingBadge.shortLabel}
                                  </span>
                                )}
                                {fasting.intermittentBadge && (
                                  <span style={{
                                    fontSize: '9px',
                                    padding: '0px 4px',
                                    borderRadius: '3px',
                                    background: fasting.intermittentBadge.bg,
                                    border: `1px solid ${fasting.intermittentBadge.border}`,
                                    color: fasting.intermittentBadge.color,
                                    fontWeight: 800
                                  }}>
                                    {fasting.intermittentBadge.shortLabel}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Row 2: Metrics Strip (Clean Right-Aligned Weights + Left Checkin Info) */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        fontSize: '11px', 
                        color: '#475569', 
                        background: isSelected ? '#F8FAFC' : '#FFFFFF', 
                        padding: '4px 8px', 
                        borderRadius: '5px', 
                        border: '1px solid #E2E8F0'
                      }}>
                        {/* Right: Current Weight + Delta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, Cairo', fontWeight: 700, color: '#0F172A' }}>
                            {item?.metrics?.current_weight || 0} كجم
                          </span>

                          <span style={{ 
                            fontFamily: 'JetBrains Mono, Cairo', 
                            fontWeight: 800, 
                            color: (item?.metrics?.weight_change || 0) < 0 ? '#16A34A' : ((item?.metrics?.weight_change || 0) === 0 ? '#0284C7' : '#DC2626')
                          }}>
                            {(item?.metrics?.weight_change || 0) < 0 ? '-' : ((item?.metrics?.weight_change || 0) === 0 ? '' : '+')}
                            {Math.abs(item?.metrics?.weight_change || 0)} كجم
                          </span>
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
                              <span>الأسبوع {item.week_number}</span>
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
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '60px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#64748B'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
                  <CheckCircle2 size={24} color="#16A34A" />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
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
                    padding: '8px 18px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
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
                CUTTING: { label: 'تنشيف وحرق دهون', bg: '#F8FAFC', border: '#CBD5E1', color: '#0F172A' },
                BULKING: { label: 'تضخيم وبناء عضلي', bg: '#F8FAFC', border: '#CBD5E1', color: '#0F172A' },
                RECOMP: { label: 'إعادة تشكيل (Recomp)', bg: '#F8FAFC', border: '#CBD5E1', color: '#0F172A' }
              }[goalType] || { label: 'تنشيف', bg: '#F8FAFC', border: '#CBD5E1', color: '#0F172A' };
              const activeChkNumber = activeCheckin.checkin_number || ((activeCheckin?.history?.length > 1) ? (activeCheckin?.history?.length - 1) : activeCheckin.week_number);

              return (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ClientCodeBadge code={safeClient.code} item={safeClient} size="md" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                          {safeClient.name}
                        </h4>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          background: goalConfig.bg, 
                          border: `1px solid ${goalConfig.border}`, 
                          color: goalConfig.color, 
                          padding: '1px 8px', 
                          borderRadius: '4px'
                        }}>
                          {goalConfig.label}
                        </span>
                      </div>
                      <small style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        الهدف: {safeClient.target_goal} • إرسال: {activeCheckin.submission_date}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClientPackageBadge item={safeClient} size="sm" />
                    {(() => {
                      const fasting = extractClientFastingProfile(safeClient);
                      return (
                        <>
                          {fasting.primaryFastingBadge && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: fasting.primaryFastingBadge.bg,
                              border: `1px solid ${fasting.primaryFastingBadge.border}`,
                              color: fasting.primaryFastingBadge.color,
                              fontWeight: 800
                            }}>
                              {fasting.primaryFastingBadge.label}
                            </span>
                          )}
                          {fasting.intermittentBadge && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: fasting.intermittentBadge.bg,
                              border: `1px solid ${fasting.intermittentBadge.border}`,
                              color: fasting.intermittentBadge.color,
                              fontWeight: 800
                            }}>
                              {fasting.intermittentBadge.label}
                            </span>
                          )}
                        </>
                      );
                    })()}
                    <span style={{ fontSize: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>المتابعة #{activeChkNumber}</span>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span>الأسبوع {activeCheckin.week_number}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(`/coach/editor/${safeClient.code || safeClient.id || '1'}`, '_blank')}
                      style={{
                        height: '26px',
                        padding: '0 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '4px',
                        background: '#F0F9FF',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="فتح خطة المتدرب بالكامل في محرر الكوتش في تبويب مستقل"
                    >
                      <Dumbbell size={12} />
                      <span>تعديل الخطة بالمحرر</span>
                      <ExternalLink size={10} color="#0284C7" />
                    </button>
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
                  title="المؤشرات الرقمية والقياسات الحيوية"
                  description="تطور الوزن ومحيط الخصر ومعدل الالتزام مقارنة بالأسبوع الماضي."
                >
                  <div dir="rtl" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                    
                    {/* Current Weight */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>الوزن الحالي</span>
                      <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
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
                      borderRadius: '8px' 
                    }}>
                      <span style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>فرق الوزن (Δ)</span>
                      <strong style={{ 
                        fontSize: '17px', 
                        color: deltaColor, 
                        fontFamily: 'JetBrains Mono, Cairo, sans-serif', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '2px' 
                      }}>
                        {(safeMetrics.weight_change || 0) < 0 ? <TrendingDown size={16} /> : ((safeMetrics.weight_change || 0) === 0 ? <Minus size={16} /> : <TrendingUp size={16} />)}
                        <span dir="ltr">{(safeMetrics.weight_change || 0) > 0 ? `+${(safeMetrics.weight_change || 0)}` : (safeMetrics.weight_change || 0)} كجم</span>
                      </strong>
                      <small style={{ fontSize: '10px', color: deltaColor, display: 'block', marginTop: '2px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                        {deltaEvaluation}
                      </small>
                    </div>

                    {/* Waist Metric */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>محيط الخصر</span>
                      <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {safeMetrics.waist_current} <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>سم</span>
                      </strong>
                      <small style={{ fontSize: '10px', color: '#16A34A', display: 'block', marginTop: '2px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                        {safeMetrics.waist_change} سم فرق مقاس
                      </small>
                    </div>

                    {/* Adherence */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px', fontFamily: 'Cairo, sans-serif' }}>الالتزام والتمارين</span>
                      <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        {safeMetrics.adherence}%
                      </strong>
                      <small style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '2px', fontFamily: 'Cairo, sans-serif' }}>
                        {safeMetrics.workouts_completed} من {safeMetrics.workouts_target} تمارين
                      </small>
                    </div>
                  </div>

                  {/* Compact Unified Biofeedback Summary Bar */}
                  <div dir="rtl" style={{ 
                    marginTop: '10px', 
                    background: '#F8FAFC', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '6px', 
                    padding: '8px 12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    flexWrap: 'wrap', 
                    gap: '10px', 
                    fontSize: '11.5px' 
                  }}>
                    <div>
                      <span style={{ color: '#64748B' }}>الطاقة:</span> <strong style={{ color: '#0F172A' }}>{safeBio.energy}/10</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>النوم:</span> <strong style={{ color: '#0F172A' }}>{safeBio.sleep}/10</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>الجوع:</span> <strong style={{ color: safeBio.hunger > 6 ? '#B45309' : '#0F172A' }}>{safeBio.hunger}/10</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>الهضم:</span> <strong style={{ color: '#0F172A' }}>{safeBio.digestion_status || 'طبيعي'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>أوزان التمرين:</span> <strong style={{ color: '#0F172A' }}>{safeMetrics.strength_trend === 'INCREASED' ? 'زيادة' : (safeMetrics.strength_trend === 'DECREASED' ? 'تراجع' : 'ثبات')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>الخطوات:</span> <strong style={{ color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>{(safeMetrics.daily_steps_avg || 8000).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>الماء:</span> <strong style={{ color: '#0F172A' }}>{safeMetrics.water_liters || 3.0} لتر</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>وجبات خارج الخطة:</span> <strong style={{ color: '#0F172A' }}>{safeMetrics.off_plan_meals || 0}</strong>
                    </div>
                    {safeBio.cycle_phase && (
                      <div style={{ color: '#9D174D', fontWeight: 600 }}>
                        <span>الدورة:</span> {safeBio.cycle_phase}
                      </div>
                    )}
                    {activeCheckin?.bowel_regularity && (
                      <div>
                        <span style={{ color: '#64748B' }}>حركة الأمعاء:</span> <strong style={{ color: activeCheckin.bowel_regularity === 'constipated_3plus' ? '#DC2626' : '#0F172A' }}>
                          {activeCheckin.bowel_regularity === 'constipated_3plus' ? 'إمساك (3 أيام+)' : (activeCheckin.bowel_regularity === 'diarrhea_upset' ? 'عسر هضم / إسهال' : 'طبيعي')}
                        </strong>
                      </div>
                    )}
                    {activeCheckin?.sleep_stress_composite !== undefined && (
                      <div>
                        <span style={{ color: '#64748B' }}>تراكم السهر:</span> <strong style={{ color: Number(activeCheckin.sleep_stress_composite) >= 4 ? '#D97706' : '#0F172A' }}>
                          {activeCheckin.sleep_stress_composite}/5
                        </strong>
                      </div>
                    )}
                    {activeCheckin?.lifestyle_variance && (
                      <div>
                        <span style={{ color: '#64748B' }}>نمط الدوام:</span> <strong style={{ color: '#0F172A' }}>
                          {activeCheckin.lifestyle_variance === 'active_spurt' ? 'حركة مضاعفة' : (activeCheckin.lifestyle_variance === 'lazy_vacation' ? 'خمول / إجازة' : 'طبيعي')}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* False Plateau Triad Alert Banner */}
                  {(() => {
                    const isConstipated = activeCheckin?.bowel_regularity === 'constipated_3plus';
                    const isHighSleepStress = Number(activeCheckin?.sleep_stress_composite || 0) >= 4;
                    const isHighAdherence = (safeMetrics.adherence || 100) >= 85;
                    const isWeightStalled = Math.abs(safeMetrics.weight_change || 0) <= 0.2;
                    const isFalsePlateau = (isConstipated || isHighSleepStress) && (isWeightStalled || activeCheckin?.analysis_output?.lock_reason === 'FALSE_PLATEAU_DETECTED' || activeCheckin?.ai_analysis?.status_badge?.includes('FALSE_PLATEAU') || activeCheckin?.ai_analysis?.recommendation?.includes('ثبات زائف'));

                    if (!isFalsePlateau) return null;

                    return (
                      <div style={{
                        marginTop: '10px',
                        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                        border: '1.5px solid #F59E0B',
                        borderRadius: '10px',
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

            {/* 3. Multi-Week Visual Progress Trajectory Curve */}
            <FormSection
              title="منحنى التطور الأسبوعي"
              description="تتبع مسار الوزن ومحيط الخصر ومعدل الالتزام عبر الأسابيع."
            >
              <ProgressTrendChart
                history={activeCheckin.history || []}
                isMaxTier={isMaxTier}
                targetWeight={safeClient.target_weight}
                client={safeClient}
              />
            </FormSection>

            {/* 4. Photos & Weekly Client Reflections */}
            <FormSection
              title="استوديو مقارنة صور التطور ورسالة المتدرب"
              description="المقارنة البصرية التفاعلية لصور التطور وتوليد كروت التحول التسويقية الاحترافية."
            >
              <div style={{ marginTop: '6px', marginBottom: '12px' }}>
                <InteractivePhotoComparisonStudio
                  history={activeCheckin.history || []}
                  activeCheckin={activeCheckin}
                  client={safeClient}
                />
              </div>

              {/* Weekly Client Reflections: Non-Scale Victory & Struggle */}
              {safeReflect && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>أبرز إنجاز هذا الأسبوع:</span>
                    <p style={{ fontSize: '11.5px', color: '#0F172A', margin: 0, lineHeight: 1.45 }}>
                      {safeReflect.nsv_note}
                    </p>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>أبرز صعوبة أو تحدٍ:</span>
                    <p style={{ fontSize: '11.5px', color: '#0F172A', margin: 0, lineHeight: 1.45 }}>
                      {safeReflect.struggle_note}
                    </p>
                  </div>
                </div>
              )}

              {/* Client Message */}
              <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <MessageCircle size={13} color="#475569" />
                  <strong style={{ fontSize: '11.5px', color: '#475569' }}>رسالة وملاحظات المتدرب:</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#0F172A', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  "{activeCheckin?.client_notes || 'لا توجد ملاحظات إضافية'}"
                </p>
              </div>

              {/* Clinical Labs & Biomarkers Quick Trigger Banner */}
              <div style={{
                marginTop: '12px',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 100%)',
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    flexShrink: 0
                  }}>
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>بروتوكول التحاليل والمؤشرات الحيوية السريرية</strong>
                      {(activeCheckin?.medical_reports_urls?.length > 0 || safeClient?.medical_reports_urls?.length > 0) ? (
                        <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                          مرفق تقرير طبي
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
                          فحص وقائي
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                      فحص CBC، الكلى، الكبد، الأيض والسكر، والفيتامينات مع بروتوكول الغذاء أولاً لتعويض النواقص غذائياً.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLabModal(true)}
                  style={{
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '6px',
                    border: '1px solid #16A34A',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#15803D')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#16A34A')}
                >
                  <Activity size={14} />
                  <span>فتح استوديو التحاليل</span>
                </button>
              </div>
            </FormSection>

            {/* 4.5 Prospective Forward-Looking Next Week Preview */}
            <FormSection
              title="استشراف وتخطيط الأسبوع القادم"
              description="الرؤية الاستباقية لظروف السفر والجيم وتوافر الأيام لضبط الخطة بدقة."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                {/* 1. Travel Status */}
                <div style={{
                  background: activeCheckin?.next_week_travel ? '#FEF3C7' : '#F8FAFC',
                  border: activeCheckin?.next_week_travel ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Plane size={14} color={activeCheckin?.next_week_travel ? '#B45309' : '#64748B'} />
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>حالة السفر والتنقل:</span>
                  </div>
                  <strong style={{ fontSize: '12.5px', color: activeCheckin?.next_week_travel ? '#B45309' : '#0F172A' }}>
                    {activeCheckin?.next_week_travel ? 'مسافر / خارج المدينة' : 'مستقر محلياً (لا يوجد سفر)'}
                  </strong>
                </div>

                {/* 2. Gym Availability */}
                <div style={{
                  background: activeCheckin?.next_week_gym_available === false ? '#FEF2F2' : '#F8FAFC',
                  border: activeCheckin?.next_week_gym_available === false ? '1px solid #FECACA' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Dumbbell size={14} color={activeCheckin?.next_week_gym_available === false ? '#DC2626' : '#16A34A'} />
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>توفر صالة التدريب (الجيم):</span>
                  </div>
                  <strong style={{ fontSize: '12.5px', color: activeCheckin?.next_week_gym_available === false ? '#DC2626' : '#16A34A' }}>
                    {activeCheckin?.next_week_gym_available === false ? 'الجيم غير متوفر (يحتاج خطة سفر/منزل)' : 'الجيم متوفر بانتظام'}
                  </strong>
                </div>

                {/* 3. Realistic Training Days */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Calendar size={14} color="#0284C7" />
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>الأيام الواقعية للتمرين:</span>
                  </div>
                  <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                    {activeCheckin?.next_week_realistic_days ? `${activeCheckin.next_week_realistic_days} أيام بالأسبوع` : 'حسب الخطة الأساسية'}
                  </strong>
                </div>
              </div>

              {activeCheckin?.next_week_notes && (
                <div style={{
                  marginTop: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                    ملاحظات وظروف الأسبوع المقبل من المتدرب:
                  </span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#0F172A', lineHeight: 1.5 }}>
                    "{activeCheckin.next_week_notes}"
                  </p>
                </div>
              )}
            </FormSection>

            {/* 5. AI Engine Recommendation Card */}
            <FormSection
              title="تحليل وتوصيات المحرك السريري الذكي"
              description="التوصيات التكيفية المبنية على الدلتا الحسابية وسرعة الأيض واستجابة المتدرب."
            >
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '12px 14px', borderRadius: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BrainCircuit size={16} color="#0F172A" />
                    <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>اقتراح المحرك التكيفي</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10.5px', background: '#E2E8F0', color: '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      {safeAi.status_badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMacroAdjustments(safeMacros);
                        setCoachReply(activeCheckin.suggested_reply);
                      }}
                      style={{
                        height: '24px',
                        padding: '0 8px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
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
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} className="flex-shrink-0" />
                    <span>{safeAi.warning}</span>
                  </div>
                )}
              </div>
            </FormSection>

            {/* 6. 1-Click Quick Decision Presets Bar for Coach */}
            <div style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '8px', 
              flexWrap: 'wrap' 
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>قرارات سريعة:</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {/* Preset 1: Keep Plan */}
                <button
                  type="button"
                  onClick={() => {
                    setMacroAdjustments(safeMacros);
                    setCoachReply(`عاش يا ${clientFirstName}! مستواك الأسبوع ده ممتاز ونتايجك ماشية على الخطة بالظبط. هنثبت على نفس السعرات والماكروز عشان نواصل التقدم بنفس الزخم. كمل بنفس القوة يا بطل!`);
                  }}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    transition: 'background-color 0.15s ease'
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
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    transition: 'background-color 0.15s ease'
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
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    transition: 'background-color 0.15s ease'
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
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    transition: 'background-color 0.15s ease'
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
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    transition: 'background-color 0.15s ease'
                  }}
                  title="تفعيل أسبوع تفريغ الأحمال والاستشفاء"
                >
                  أسبوع Deload
                </button>
              </div>
            </div>

            {/* 7. 2-Column Subgrid: Macros & Coach Approval */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
              
              {/* Macro Adjustment Panel */}
              <FormSection
                title="تعديل الماكروز للأسبوع القادم"
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
                          border: '1px solid #E2E8F0', 
                          borderRadius: '8px', 
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>السعرات الكلية اليومية</strong>
                          <span style={{ fontSize: '10.5px', color: '#64748B' }}>المستهدف المعتمد للبرنامج</span>
                        </div>

                        {/* Total Calories Integrated Input */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: '#FFFFFF', 
                            border: '1px solid #CBD5E1', 
                            borderRadius: '6px', 
                            padding: '2px 8px', 
                            height: '34px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <input
                            type="number"
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
                              color: '#0F172A', 
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
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>البروتين</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '6px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
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
                                color: '#0F172A', 
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
                            <span style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{pPct}%</span>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div 
                          style={{ 
                            background: '#FFFFFF', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>الكارب</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '6px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
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
                                color: '#0F172A', 
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
                            <span style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{cPct}%</span>
                          </div>
                        </div>

                        {/* Fats */}
                        <div 
                          style={{ 
                            background: '#FFFFFF', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            padding: '8px 6px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center', 
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>الدهون</span>

                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: '#F8FAFC', 
                              border: '1px solid #CBD5E1', 
                              borderRadius: '6px', 
                              padding: '2px 6px', 
                              height: '32px',
                              width: '100%',
                              maxWidth: '90px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <input
                              type="number"
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
                                color: '#0F172A', 
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
                            <span style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'JetBrains Mono, Cairo' }}>{fPct}%</span>
                          </div>
                        </div>

                      </div>

                      {/* 3. Reconciled Clean Status Bar (Monochrome & Elegant) */}
                      <div 
                        style={{ 
                          background: '#F8FAFC', 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '6px', 
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
                          <strong style={{ color: '#0F172A', fontSize: '12px', fontFamily: 'JetBrains Mono, Cairo' }}>
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

              {/* Coach Reply & Approval */}
              <FormSection
                title="رسالة الكوتش واعتماد الخطة"
                description="كتابة التوجيه التشجيعي وإرسال التحديث لبرنامج المتدرب."
              >
                <div style={{ marginTop: '6px' }}>
                  <textarea
                    value={coachReply}
                    onChange={(e) => setCoachReply(e.target.value)}
                    placeholder="اكتب التوجيه والرد التشجيعي للمتدرب..."
                    style={{
                      width: '100%',
                      height: '115px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.45,
                      color: '#0F172A',
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
                        height: '36px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        transition: 'background-color 0.15s ease'
                      }}
                      title="نسخ نص الرسالة"
                    >
                      <span>نسخ</span>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleOpenDirectWhatsApp}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '6px',
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
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'background-color 0.15s ease'
                      }}
                      title="فتح واتساب مباشرة بالرسالة"
                    >
                      <MessageCircle size={15} />
                      <span>واتساب</span>
                    </button>

                    {/* Open Program in Coach Editor Bridge */}
                    <button
                      type="button"
                      onClick={() => window.open(`/coach/editor/${safeClient.code || safeClient.id || '1'}`, '_blank')}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'background-color 0.15s ease'
                      }}
                      title="فتح خطة المتدرب بالكامل في محرر الكوتش لتعديل التمارين أو الأغذية في تبويب مستقل"
                    >
                      <Dumbbell size={14} />
                      <span>فتح الخطة بالمحرر</span>
                      <ExternalLink size={11} color="#64748B" />
                    </button>

                    {/* Primary Approve & Next Button */}
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        userSelect: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={15} />
                          <span>اعتماد وانتقال للمتدرب التالي</span>
                        </>
                      )}
                    </button>
                  </div>
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
                borderRadius: '12px',
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

      </div>
    </AdminLayout>
  );
}

