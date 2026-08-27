import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL REACT CRASH INTERCEPTED:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          dir="rtl" 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F8FAFC',
            fontFamily: 'Cairo, Tajawal, sans-serif',
            padding: '20px'
          }}
        >
          <div 
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '32px 24px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '1px solid #FECACA'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
              حدث خطأ مؤقت في تحميل الواجهة
            </h3>
            
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>
              تم رصد هذا الاستثناء وحمايته لمنع توقف المنظومة. يمكنك إعادة تحميل الصفحة للعودة للعمل مباشرة.
            </p>

            {this.state.error && (
              <div 
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '11.5px',
                  color: '#475569',
                  textAlign: 'left',
                  direction: 'ltr',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginBottom: '20px',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={15} />
                <span>إعادة تحميل الصفحة</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Home size={15} />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
