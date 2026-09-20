import React from 'react';

/**
 * CLINICAL MASTER ENGINE - SINGLE SOURCE OF TRUTH
 * Canonical 15 Baseline Stress Test Clients
 */
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export const CANONICAL_CLIENT_TIERS = {
  '1': 'MAX',
  '2': 'ELITE',
  '3': 'MAX',
  '4': 'MAX',
  '5': 'ELITE',
  '6': 'ELITE',
  '7': 'MAX',
  '8': 'ELITE',
  '9': 'MAX',
  '10': 'MAX',
  '11': 'MAX',
  '12': 'ELITE',
  '13': 'MAX',
  '14': 'ELITE',
  '15': 'MAX'
};

// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getClientTier(item) {
  if (!item) return 'ELITE';

  // 1. Inspect package properties directly from the object FIRST
  if (typeof item === 'object') {
    const rawPkg = item.subscription_package || 
                   item.package_code || 
                   item.package_name || 
                   item.package || 
                   item.tier || 
                   item.package_tier || 
                   item.user?.subscription_package || 
                   item.user?.package || 
                   item.user?.package_name ||
                   item.client?.package || 
                   item.client?.package_name ||
                   item.answers?.subscription_package ||
                   item.answers?.package ||
                   item.answers?.package_tier;

    if (rawPkg) {
      const s = String(rawPkg).trim().toUpperCase();
      if (s.includes('MAX') || s.includes('ماكس') || s.includes('VIP') || s.includes('YEARLY') || s.includes('PRO') || s.includes('GOLD')) {
        return 'MAX';
      }
      if (s.includes('ELITE') || s.includes('إيليت') || s.includes('ايليت')) {
        return 'ELITE';
      }
    }
  }

  // 2. If item is a string, check if it directly names a package
  if (typeof item === 'string') {
    const s = item.trim().toUpperCase();
    if (s.includes('MAX') || s.includes('ماكس') || s.includes('VIP') || s.includes('YEARLY') || s.includes('PRO') || s.includes('GOLD')) {
      return 'MAX';
    }
    if (s.includes('ELITE') || s.includes('إيليت') || s.includes('ايليت')) {
      return 'ELITE';
    }
  }

  // 3. Extract clean numeric code if available
  let rawCode = '';
  if (typeof item === 'string' || typeof item === 'number') {
    rawCode = String(item);
  } else if (typeof item === 'object') {
    rawCode = item.client_code || item.clientCode || item.code || item.user_id || item.id || item.user?.client_code || item.user?.id || '';
  }

  const cleanCode = String(rawCode || '').replace(/^client[-_]?/i, '').replace('#', '').trim();

  // 4. Match against Master Engine Canonical Baseline Clients (1 to 15) ONLY if no explicit package was found
  if (cleanCode && CANONICAL_CLIENT_TIERS[cleanCode]) {
    return CANONICAL_CLIENT_TIERS[cleanCode];
  }

  return 'ELITE';
}

// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getTierColors(tierOrItem) {
  const tier = typeof tierOrItem === 'string' && (tierOrItem === 'MAX' || tierOrItem === 'ELITE')
    ? tierOrItem
    : getClientTier(tierOrItem);

  if (tier === 'MAX') {
    return {
      tier: 'MAX',
      color: '#B45309', // Deep Rich Amber Gold
      bg: '#F8FAFC',    // Normal clean background
      border: '1px solid #E2E8F0', // Normal clean border
      shadow: 'none'
    };
  }

  return {
    tier: 'ELITE',
    color: '#0284C7', // Electric Sapphire Blue
    bg: '#F8FAFC',    // Normal clean background
    border: '1px solid #E2E8F0', // Normal clean border
    shadow: 'none'
  };
}

export function ClientCodeBadge({ code, item, tier, size = 'md', style = {} }) {
  const rawCode = code || item?.client_code || item?.clientCode || item?.code || item?.user?.client_code || item?.id || '1';
  const cleanCode = String(rawCode).replace(/^client[-_]?/i, '').replace('#', '');
  const resolvedTier = tier || getClientTier(item || cleanCode);
  const colors = getTierColors(resolvedTier);

  const sizeStyles = {
    xs: { fontSize: '9.5px', padding: '1px 6px', borderRadius: '6px' },
    sm: { fontSize: '10.5px', padding: '2px 7px', borderRadius: '6px' },
    md: { fontSize: '11px', padding: '2px 8px', borderRadius: '7px' },
    lg: { fontSize: '12px', padding: '3px 10px', borderRadius: '8px' }
  };

  return (
    <span style={{
      fontFamily: 'JetBrains Mono, Cairo, sans-serif',
      fontWeight: 800,
      background: colors.bg,
      border: colors.border,
      color: colors.color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      verticalAlign: 'middle',
      boxShadow: colors.shadow,
      ...sizeStyles[size] || sizeStyles.md,
      ...style
    }}>
      #{cleanCode}
    </span>
  );
}

export function ClientPackageBadge({ item, tier, size = 'md', style = {} }) {
  const resolvedTier = tier || getClientTier(item);
  const colors = getTierColors(resolvedTier);

  const sizeStyles = {
    xs: { fontSize: '9.5px', padding: '1px 6px', borderRadius: '6px' },
    sm: { fontSize: '10px', padding: '2px 7px', borderRadius: '6px' },
    md: { fontSize: '11px', padding: '2px 8px', borderRadius: '7px' },
    lg: { fontSize: '12px', padding: '3px 10px', borderRadius: '8px' }
  };

  return (
    <span style={{
      fontFamily: 'JetBrains Mono, Cairo, sans-serif',
      fontWeight: 900,
      background: colors.bg,
      border: colors.border,
      color: colors.color,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      verticalAlign: 'middle',
      ...sizeStyles[size] || sizeStyles.md,
      ...style
    }}>
      {resolvedTier}
    </span>
  );
}

/**
 * Universal Country Detector based on explicit country string or international phone prefix
 */
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getClientCountryInfo(phone = '', explicitCountry = '') {
  if (explicitCountry) {
    const c = String(explicitCountry).trim().toLowerCase();
    if (c.includes('مصر') || c.includes('egypt')) return { name: 'مصر' };
    if (c.includes('سعود') || c.includes('saudi') || c.includes('ksa')) return { name: 'السعودية' };
    if (c.includes('إمارات') || c.includes('امارات') || c.includes('uae') || c.includes('emirates')) return { name: 'الإمارات' };
    if (c.includes('كويت') || c.includes('kuwait')) return { name: 'الكويت' };
    if (c.includes('قطر') || c.includes('qatar')) return { name: 'قطر' };
    if (c.includes('عمان') || c.includes('oman')) return { name: 'عُمان' };
    if (c.includes('بحرين') || c.includes('bahrain')) return { name: 'البحرين' };
    if (c.includes('أردن') || c.includes('اردن') || c.includes('jordan')) return { name: 'الأردن' };
    if (c.includes('عراق') || c.includes('iraq')) return { name: 'العراق' };
    if (c.includes('لبنان') || c.includes('lebanon')) return { name: 'لبنان' };
    if (c.includes('فلسطين') || c.includes('palestine')) return { name: 'فلسطين' };
    if (c.includes('مغرب') || c.includes('morocco')) return { name: 'المغرب' };
    if (c.includes('تونس') || c.includes('tunisia')) return { name: 'تونس' };
    if (c.includes('جزائر') || c.includes('algeria')) return { name: 'الجزائر' };
    if (c.includes('ليبيا') || c.includes('libya')) return { name: 'ليبيا' };
    if (c.includes('سودان') || c.includes('sudan')) return { name: 'السودان' };
    if (c.includes('يمن') || c.includes('yemen')) return { name: 'اليمن' };
    if (c.includes('أمريكا') || c.includes('امريكا') || c.includes('usa') || c.includes('united states')) return { name: 'أمريكا' };
    if (c.includes('بريطانيا') || c.includes('uk') || c.includes('england')) return { name: 'بريطانيا' };
    if (c.includes('ألمانيا') || c.includes('المانيا') || c.includes('germany')) return { name: 'ألمانيا' };
    if (c.includes('كندا') || c.includes('canada')) return { name: 'كندا' };
    return { name: explicitCountry };
  }

  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('966')) return { name: 'السعودية' };
  if (clean.startsWith('971')) return { name: 'الإمارات' };
  if (clean.startsWith('965')) return { name: 'الكويت' };
  if (clean.startsWith('974')) return { name: 'قطر' };
  if (clean.startsWith('968')) return { name: 'عُمان' };
  if (clean.startsWith('973')) return { name: 'البحرين' };
  if (clean.startsWith('962')) return { name: 'الأردن' };
  if (clean.startsWith('964')) return { name: 'العراق' };
  if (clean.startsWith('961')) return { name: 'لبنان' };
  if (clean.startsWith('970') || clean.startsWith('972')) return { name: 'فلسطين' };
  if (clean.startsWith('212')) return { name: 'المغرب' };
  if (clean.startsWith('216')) return { name: 'تونس' };
  if (clean.startsWith('213')) return { name: 'الجزائر' };
  if (clean.startsWith('218')) return { name: 'ليبيا' };
  if (clean.startsWith('249')) return { name: 'السودان' };
  if (clean.startsWith('967')) return { name: 'اليمن' };
  if (clean.startsWith('44')) return { name: 'بريطانيا' };
  if (clean.startsWith('49')) return { name: 'ألمانيا' };
  if (clean.startsWith('33')) return { name: 'فرنسا' };
  if (clean.startsWith('39')) return { name: 'إيطاليا' };
  if (clean.startsWith('90')) return { name: 'تركيا' };
  if (clean.startsWith('1')) return { name: 'أمريكا / كندا' };
  if (clean.startsWith('20') || clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('012') || clean.startsWith('015')) return { name: 'مصر' };
  
  return { name: 'مصر' };
}

/**
 * Relative / Clean Time Ago Formatter
 */
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function formatTimeAgo(dateStr) {
  if (!dateStr) return 'اليوم';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'اليوم';
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'الآن';
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'اليوم';
  }
}

