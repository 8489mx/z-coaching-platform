import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not standalone, show prompt after 3s
    if (isIosDevice && !window.navigator.standalone) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxWidth: '460px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        zIndex: 9999,
        direction: 'rtl',
        fontFamily: 'Alexandria, Cairo, sans-serif',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
          </div>
          <div>
            <strong style={{ fontSize: '0.88rem', display: 'block' }}>تثبيت تطبيق Z Coaching</strong>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>وصول سريع وأوفلاين بدون متجر تطبيقات</span>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {isIOS ? (
        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#CBD5E1', lineHeight: '1.5' }}>
          لتثبيت التطبيق على الآيفون: اضغط على زر المشاركة <Share2 style={{ width: '12px', height: '12px', display: 'inline' }} /> في أسفل سفاري، ثم اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> <PlusSquare style={{ width: '12px', height: '12px', display: 'inline' }} />.
        </p>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
          <button
            onClick={() => setShowPrompt(false)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', color: '#FFFFFF', cursor: 'pointer' }}
          >
            لاحقاً
          </button>
          <button
            onClick={handleInstallClick}
            style={{ background: '#0284C7', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span>تثبيت الآن</span>
          </button>
        </div>
      )}
    </div>
  );
}
