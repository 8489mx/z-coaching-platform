/**
 * Z Coaching Platform - Global Theme & Coach Configuration Manager
 * Handles instant live UI theme customization, color brightness computation,
 * and Coach Profile persistence across the application.
 */

import { API_BASE } from '../config/api';

export const THEME_PALETTES = [
  {
    id: 'slate-navy',
    name: 'الكحلي المائل للرمادي (Slate Navy)',
    description: 'الافتراضي الرسمي: فخم، مريح للعين، وجاد للمنظومة',
    primary: '#0F172A',
    hover: '#334155',
    light: '#F1F5F9',
    border: '#CBD5E1',
    textOnPrimary: '#FFFFFF',
    category: 'رسمي'
  },
  {
    id: 'royal-blue',
    name: 'الأزرق الملكي (Royal Electric)',
    description: 'طاقة وثقة وحيوية رياضية عالية',
    primary: '#1E40AF',
    hover: '#1D4ED8',
    light: '#EFF6FF',
    border: '#BFDBFE',
    textOnPrimary: '#FFFFFF',
    category: 'رياضي'
  },
  {
    id: 'sky-cyan',
    name: 'الأزرق السماوي (Sky Blue)',
    description: 'عصري، نقي، ومريح للقراءة السريعة',
    primary: '#0284C7',
    hover: '#0369A1',
    light: '#F0F9FF',
    border: '#BAE6FD',
    textOnPrimary: '#FFFFFF',
    category: 'عصري'
  },
  {
    id: 'emerald-athlete',
    name: 'الأخضر الزمردي (Emerald Power)',
    description: 'صحة وحيوية ونمو ونشاط بدني',
    primary: '#065F46',
    hover: '#047857',
    light: '#ECFDF5',
    border: '#A7F3D0',
    textOnPrimary: '#FFFFFF',
    category: 'لياقة'
  },
  {
    id: 'deep-indigo',
    name: 'البنفسجي الإمبراطوري (Deep Violet)',
    description: 'فخامة وتميز واحترافية فائقة',
    primary: '#3730A3',
    hover: '#4338CA',
    light: '#EEF2FF',
    border: '#C7D2FE',
    textOnPrimary: '#FFFFFF',
    category: 'فاخر'
  },
  {
    id: 'titanium-charcoal',
    name: 'التيتانيوم الفحمي (Titanium Charcoal)',
    description: 'قوي وموجّه لأصحاب الذوق المونوكروم الداكن',
    primary: '#18181B',
    hover: '#27272A',
    light: '#F4F4F5',
    border: '#E4E4E7',
    textOnPrimary: '#FFFFFF',
    category: 'داكن'
  },
  {
    id: 'crimson-burgundy',
    name: 'العنابي الحماسي (Crimson Burgundy)',
    description: 'حماس وروح تحدي ومنافسة قوية',
    primary: '#881337',
    hover: '#9F1239',
    light: '#FFF1F2',
    border: '#FECDD3',
    textOnPrimary: '#FFFFFF',
    category: 'حماسي'
  },
  {
    id: 'amber-bronze',
    name: 'الكهرماني الدافئ (Amber Bronze)',
    description: 'دفء وتميز في واجهات المتابعة',
    primary: '#78350F',
    hover: '#92400E',
    light: '#FEF3C7',
    border: '#FDE68A',
    textOnPrimary: '#FFFFFF',
    category: 'دافئ'
  }
];

export const DEFAULT_COACH_CONFIG = {
  // Brand & Theme
  primaryColor: '#0F172A',
  hoverColor: '#334155',
  paletteId: 'slate-navy',

  // Coach Business & Client-facing Info
  coachName: 'Karim Zakaria',
  coachTitle: 'أخصائي تغذية رياضية وإعداد بدني معتمد',
  brandTitle: 'Z COACHING',
  phone: '01001060503',
  whatsappNumber: '201001060503',
  instapayAddress: 'karim@instapay',
  bankDetails: 'بنك CIB - حساب: 1000XXXXXXXX',
  instagramUrl: 'https://instagram.com/zcoaching',
  welcomeMessage: 'أهلاً بك في عائلة Z Coaching! تم تجهيز وتخصيص خطتك التدريبية والغذائية بعناية فائقة لتناسب أهدافك الحيوية.',
  signatureText: 'معاً نحو نسختك الأقوى • كابتن Karim Zakaria',

  // System Clinical Defaults
  defaultDailySteps: 8000,
  defaultWaterLiters: 3.5,
  defaultRIR: 2,
  smartAdaptationEnabled: true,
  autoSaveIntake: true
};

const STORAGE_KEY = 'z_coach_system_config';

/** Helper: Hex to RGB */
export function hexToRgb(hex) {
  let c = (hex || '#0F172A').replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 15, g: 23, b: 42 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/** Helper: RGB to Hex */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Helper: Adjust brightness (positive % = lighter, negative % = darker) */
export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  if (percent > 0) {
    return rgbToHex(
      r + (255 - r) * (percent / 100),
      g + (255 - g) * (percent / 100),
      b + (255 - b) * (percent / 100)
    );
  } else {
    const factor = 1 + (percent / 100);
    return rgbToHex(r * factor, g * factor, b * factor);
  }
}

/** Compute complementary hover, light badge background, and border from any Hex */
export function deriveThemeColors(primaryHex) {
  const match = THEME_PALETTES.find(p => p.primary.toLowerCase() === (primaryHex || '').toLowerCase());
  if (match) {
    return {
      primary: match.primary,
      hover: match.hover,
      light: match.light,
      border: match.border,
      paletteId: match.id
    };
  }

  const { r, g, b } = hexToRgb(primaryHex);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If very dark, hover is lighter; if light/medium, hover is darker
  const hover = luminance < 0.25 
    ? adjustBrightness(primaryHex, 20)
    : adjustBrightness(primaryHex, -15);

  const light = adjustBrightness(primaryHex, 94);
  const border = adjustBrightness(primaryHex, 82);

  return {
    primary: primaryHex,
    hover,
    light,
    border,
    paletteId: 'custom'
  };
}

/**
 * Apply Theme Live to DOM immediately (Realtime preview)
 */
export function applyThemeLive(primaryHex) {
  if (!primaryHex) return;
  const colors = deriveThemeColors(primaryHex);

  const root = document.documentElement;
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary2', colors.hover);
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-dark', colors.hover);
  root.style.setProperty('--color-primary-light', colors.light);
  root.style.setProperty('--color-primary-border', colors.border);
  root.style.setProperty('--bs-primary', colors.primary);

  // Inject or update dynamic override stylesheet for deep component overrides
  let styleTag = document.getElementById('dynamic-coach-theme-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-coach-theme-style';
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    :root {
      --primary: ${colors.primary} !important;
      --primary2: ${colors.hover} !important;
      --primary-color: ${colors.primary} !important;
      --color-primary: ${colors.primary} !important;
      --color-primary-dark: ${colors.hover} !important;
      --color-primary-light: ${colors.light} !important;
      --color-primary-border: ${colors.border} !important;
      --bs-primary: ${colors.primary} !important;
    }

    /* Global Font Smoothing & Anti-Glare */
    * {
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: geometricPrecision !important;
    }

    /* 1. Global Primary Action Buttons (Crisp 4K Anti-Glare) */
    .btn-primary,
    .button-primary,
    button.btn-primary,
    .btn.btn-primary {
      background-color: ${colors.primary} !important;
      border-color: ${colors.primary} !important;
      color: #FFFFFF !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: geometricPrecision !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45) !important;
      letter-spacing: 0.3px !important;
      transform: translateZ(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12) !important;
    }

    .btn-primary:hover:not(:disabled),
    .button-primary:hover:not(:disabled),
    button.btn-primary:hover:not(:disabled),
    .btn.btn-primary:hover:not(:disabled) {
      background-color: ${colors.hover} !important;
      border-color: ${colors.hover} !important;
      color: #FFFFFF !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55) !important;
    }

    /* 2. Soft Tint Buttons & Active Tabs (Restful to the Eye) */
    .btn-soft-primary,
    .tab-soft-active,
    .theme-subtle-badge {
      background-color: ${colors.light} !important;
      border: 1px solid ${colors.border} !important;
      color: ${colors.primary} !important;
      font-weight: 800 !important;
    }

    /* 3. Active & Hover Sidebar Navigation Items (Executive High Contrast) */
    aside a.active {
      background-color: ${colors.light} !important;
      border-right: none !important;
      border: none !important;
    }

    aside a.active > div:first-child {
      background-color: ${colors.primary} !important;
      border: 1px solid ${colors.primary} !important;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25) !important;
    }

    aside a.active > div:first-child svg {
      stroke: #FFFFFF !important;
      color: #FFFFFF !important;
    }

    aside a.active > span.sidebar-nav-label,
    aside a.active > span:not(.sidebar-badge-apple) {
      color: ${colors.primary} !important;
      font-weight: 800 !important;
    }

    /* Hover state for inactive sidebar links: crisp, dark, 100% visible */
    aside a:hover:not(.active) {
      background-color: #F8FAFC !important;
      color: #0F172A !important;
    }

    aside a:hover:not(.active) > div:first-child {
      background-color: #F1F5F9 !important;
      border-color: #CBD5E1 !important;
    }

    aside a:hover:not(.active) > div:first-child svg {
      stroke: #0F172A !important;
      color: #0F172A !important;
    }

    aside a:hover:not(.active) > span.sidebar-nav-label,
    aside a:hover:not(.active) > span:not(.sidebar-badge-apple) {
      color: #0F172A !important;
    }

    /* Guaranteed pure white text on red notification badges */
    .sidebar-badge-apple,
    .sidebar-badge-apple b,
    .sidebar-badge-apple span,
    .sidebar-badge-apple *,
    aside .sidebar-badge-apple,
    aside .sidebar-badge-apple b,
    aside .sidebar-badge-apple *,
    aside a .sidebar-badge-apple,
    aside a .sidebar-badge-apple b,
    aside a .sidebar-badge-apple *,
    aside a.active .sidebar-badge-apple,
    aside a.active .sidebar-badge-apple b,
    aside a.active .sidebar-badge-apple *,
    aside a:hover .sidebar-badge-apple,
    aside a:hover .sidebar-badge-apple b,
    aside a:hover .sidebar-badge-apple * {
      background-color: #FF3B30 !important;
      background: #FF3B30 !important;
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* 4. Sidebar Brand Logo */
    aside .sidebar-brand-logo,
    aside div[style*="borderRadius: '8px'"][style*="fontSize: '16px'"] {
      background-color: ${colors.primary} !important;
      color: #FFFFFF !important;
    }

    .sidebar-flyout-tooltip {
      background: ${colors.primary} !important;
    }

    /* 3. Active Tabs and Category Buttons */
    div[style*="background: #0F172A"],
    div[style*="background: rgb(15, 23, 42)"],
    span[style*="background: #0F172A"],
    span[style*="background: rgb(15, 23, 42)"] {
      background-color: ${colors.primary} !important;
      color: #FFFFFF !important;
    }

    /* 4. Section Title Bullets & Accent Lines */
    .section-title-bullet,
    .form-section-bullet,
    span.section-title-bullet,
    span[style*="width: 3.5px"][style*="height: 16px"] {
      background-color: ${colors.primary} !important;
    }

    /* 5. Subtle Badges and Highlight Tags */
    .theme-subtle-badge,
    span[style*="background: rgb(241, 245, 249)"][style*="color: rgb(15, 23, 42)"] {
      background-color: ${colors.light} !important;
      border-color: ${colors.border} !important;
      color: ${colors.primary} !important;
    }

    /* 6. Text Highlights */
    .brand-accent-color,
    .page-header-title {
      color: ${colors.primary} !important;
    }
  `;

  return colors;
}

/** Get stored Coach Config */
export function getStoredCoachConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COACH_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('getStoredCoachConfig error:', e);
  }
  return { ...DEFAULT_COACH_CONFIG };
}

/** Save Coach Config & Broadcast Event */
export function saveCoachConfig(newConfig, syncToServer = false) {
  try {
    const updated = { ...getStoredCoachConfig(), ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applyThemeLive(updated.primaryColor);
    
    // Broadcast for immediate reaction in listening components
    window.dispatchEvent(new CustomEvent('z-coach-config-updated', { detail: updated }));
    if (syncToServer) {
      persistCoachConfigToServer(updated).catch(() => {});
    }
    return updated;
  } catch (e) {
    console.error('saveCoachConfig error:', e);
    return null;
  }
}

/** Persist Coach Config to Backend Server Storage */
export async function persistCoachConfigToServer(config) {
  try {
    const targetConfig = config || getStoredCoachConfig();
    const res = await fetch(`${API_BASE}/api/v1/admin-settings/system`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetConfig)
    });
    if (res.ok) {
      const data = await res.json();
      return data.settings || targetConfig;
    }
  } catch (e) {
    console.warn('persistCoachConfigToServer error:', e);
  }
  return null;
}

/** Synchronize Coach Config from Server to LocalStorage & DOM */
export async function syncCoachConfigFromServer() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin-settings/system`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        const local = getStoredCoachConfig();
        const merged = { ...local, ...data.settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        applyThemeLive(merged.primaryColor);
        window.dispatchEvent(new CustomEvent('z-coach-config-updated', { detail: merged }));
        return merged;
      }
    }
  } catch (err) {
    // Network or server offline - silent fallback to local storage
  }
  return getStoredCoachConfig();
}

/** Initialize Theme on App Startup */
export function initThemeOnBoot() {
  const config = getStoredCoachConfig();
  if (config && config.primaryColor) {
    applyThemeLive(config.primaryColor);
  }
  // Asynchronously synchronize latest system settings from server
  syncCoachConfigFromServer().catch(() => {});
}
