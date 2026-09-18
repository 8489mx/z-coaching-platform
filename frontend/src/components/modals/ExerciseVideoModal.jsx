import React, { useEffect } from 'react';
import { X, Dumbbell, AlertTriangle } from 'lucide-react';

function getYouTubeEmbedUrl(exercise) {
  if (!exercise) return '';
  const urlOrId = exercise.video_url || exercise.video_id || exercise.youtube_url || '';
  if (!urlOrId) return '';

  if (urlOrId.includes('embed/')) {
    return urlOrId.includes('?') ? `${urlOrId}&autoplay=1` : `${urlOrId}?autoplay=1`;
  }

  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
  }

  if (/^[\w-]{11}$/.test(urlOrId.trim())) {
    return `https://www.youtube-nocookie.com/embed/${urlOrId.trim()}?autoplay=1&rel=0`;
  }

  return `https://www.youtube-nocookie.com/embed/${urlOrId}?autoplay=1&rel=0`;
}

export default function ExerciseVideoModal({ exercise, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!exercise) return null;

  const embedUrl = getYouTubeEmbedUrl(exercise);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '800px',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={16} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                {exercise.name_ar || exercise.name_en}
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px', direction: 'ltr', textAlign: 'right' }}>
                {exercise.name_en}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Video Player 16:9 Aspect Ratio */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000000' }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={exercise.name_ar || exercise.name_en}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '8px' }}>
              <AlertTriangle size={32} color="#F59E0B" />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>لم يتم العثور على رابط فيديو لهذا التمرين</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            fontSize: '11.5px',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', fontSize: '10.5px' }}>
              عضلة: {exercise.muscle_group || 'عام'}
            </span>
            <span style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', fontSize: '10.5px' }}>
              أداة: {exercise.equipment || 'عام'}
            </span>
            <span style={{ color: '#94A3B8' }}>اضغط ESC للإغلاق</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 14px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
