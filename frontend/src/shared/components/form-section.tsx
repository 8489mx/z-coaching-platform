import React, { ReactNode } from 'react';

export interface FormSectionProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  actions?: ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  actions,
}: FormSectionProps) {
  return (
    <section 
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04), 0 1px 2px rgba(16, 24, 40, 0.02)'
      }}
      className={className}
    >
      <div 
        style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: description ? 'flex-start' : 'center',
          gap: '12px'
        }}
        className={headerClassName}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {description && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div>
            {actions}
          </div>
        )}
      </div>
      <div className={bodyClassName}>
        {children}
      </div>
    </section>
  );
}
