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
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
      }}
      className={className}
    >
      <div 
        style={{ 
          marginBottom: '14px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: '12px'
        }}
        className={headerClassName}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="section-title-bullet" style={{ width: '3.5px', height: '16px', background: 'var(--primary, #0F172A)', borderRadius: '2px', display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--primary, #0F172A)' }}>
              {title}
            </h3>
          </div>
          {description && (
            <p style={{ margin: '3px 0 0 0', paddingRight: '11px', fontSize: '12px', color: '#64748B' }}>
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
