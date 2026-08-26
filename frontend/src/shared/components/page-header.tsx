import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
  hideTitle?: boolean;
  onBack?: () => void;
  navigation?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
  hideTitle = false,
  onBack,
  navigation,
  children,
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`.trim()} style={{ marginBottom: '20px' }}>
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px', minHeight: '34px' }}>
        <div className="page-header-copy" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!hideTitle && (
            <div className="page-header-title-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="العودة"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    color: '#475569',
                    fontSize: '1rem',
                  }}
                >
                  &rarr;
                </button>
              )}
              <h1 className="page-header-title" style={{ margin: 0, lineHeight: 1.2, display: 'flex', alignItems: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>{title}</h1>
            </div>
          )}
          {badge && <div className="page-header-badge" style={{ display: 'flex', alignItems: 'center' }}>{badge}</div>}
        </div>
        {actions && <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
      {description && <div className="page-header-description" style={{ marginTop: '4px', fontSize: '13px', color: '#64748B' }}>{description}</div>}
      {navigation && <div className="page-header-navigation" style={{ marginTop: '12px' }}>{navigation}</div>}
      {children}
    </div>
  );
}
