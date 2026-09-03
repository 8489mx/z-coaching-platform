import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Activity, Target } from 'lucide-react';

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