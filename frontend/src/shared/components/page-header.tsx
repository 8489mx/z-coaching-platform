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
    <div
      className={`page-header ${className}`.trim()}
      style={{
        marginBottom: '16px',
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '16px',
        padding: '14px 20px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)',
        boxSizing: 'border-box'
      }}
    >
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
                    width: '32px',
                    height: '32px',
                    borderRadius: '12px',
                    border: '1px solid #D0D5DD',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    color: '#344054',
                    fontSize: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  &rarr;
                </button>
              )}
              <h1 className="page-header-title" style={{ margin: 0, lineHeight: 1.25, display: 'flex', alignItems: 'center', fontSize: '1.35rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{title}</h1>
            </div>
          )}
          {badge && <div className="page-header-badge" style={{ display: 'flex', alignItems: 'center' }}>{badge}</div>}
        </div>
        {actions && <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
      {description && <div className="page-header-description" style={{ marginTop: '4px', fontSize: '12.5px', color: '#475467', fontWeight: 500 }}>{description}</div>}
      {navigation && <div className="page-header-navigation" style={{ marginTop: '12px' }}>{navigation}</div>}
      {children}
    </div>
  );
}
