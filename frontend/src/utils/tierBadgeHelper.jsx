import React from 'react';

/**
 * CLINICAL MASTER ENGINE - SINGLE SOURCE OF TRUTH
 * Canonical 15 Baseline Stress Test Clients
 */
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
