import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Search, Play, AlertTriangle, Check, X, Plus, Copy, CheckCircle2, ShieldCheck, Edit3, Upload, ArrowRightLeft, BookOpen, HeartPulse, Target, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { PageHeader } from '@/shared/components/page-header';
import { TableSearch } from '@/shared/components/table-search';
import { arabicSearchMatch } from '../utils/searchUtils';
import { getExerciseDisplayNames } from '../utils/exerciseTranslator';
import CurvedSelect from '../components/common/CurvedSelect';

// Concise Muscle Badge Formatter (1-2 words max)
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getShortMuscleName(muscleAr = '', muscleGroup = '') {
  const m = String(muscleAr || '').trim();
  const mg = String(muscleGroup || '').toUpperCase();
  
  if (m.includes('صدر علوي') || m.includes('الصدر العلوي')) return 'صدر علوي';
  if (m.includes('صدر سفلي') || m.includes('الصدر السفلي')) return 'صدر سفلي';
  if (m.includes('صدر أوسط') || m.includes('الصدر الأوسط') || m.includes('الصدر العام')) return 'صدر أوسط';
  if (m.includes('صدر') || m.includes('الصدر') || mg === 'CHEST') return 'عضلات الصدر';

  if (m.includes('لاتس') || m.includes('اللاتس')) return 'عضلات اللاتس';
  if (m.includes('ترابيس') || m.includes('الترابيس')) return 'الترابيس';
  if (m.includes('قطنية') || m.includes('القطنية')) return 'القطنية';
  if (m.includes('منتصف الظهر') || m.includes('أعلى الظهر') || m.includes('الظهر') || mg === 'BACK') return 'عضلات الظهر';

  if (m.includes('كتف جانبي') || m.includes('الكتف الجانبي')) return 'كتف جانبي';
  if (m.includes('كتف خلفي') || m.includes('الكتف الخلفي')) return 'كتف خلفي';
  if (m.includes('كتف أمامي') || m.includes('الكتف الأمامي')) return 'كتف أمامي';
  if (m.includes('كتف') || m.includes('الكتف') || m.includes('الأكتاف') || mg === 'SHOULDERS') return 'الأكتاف';

  if (m.includes('بايسبس') || m.includes('البايسبس')) return 'بايسبس';
  if (m.includes('ترايسبس') || m.includes('الترايسبس')) return 'ترايسبس';
  if (m.includes('ساعد') || m.includes('الساعد') || m.includes('المعصم')) return 'الساعد';
  if (mg === 'ARMS') return 'الذراعين';

  if (m.includes('فخذ أمامي') || m.includes('الفخذ الأمامي') || m.includes('كوادز')) return 'فخذ أمامي';
  if (m.includes('فخذ خلفي') || m.includes('الفخذ الخلفي') || m.includes('هامسترينج')) return 'فخذ خلفي';
  if (m.includes('جلوتس') || m.includes('الجلوتس') || m.includes('الأرداف')) return 'جلوتس';
  if (m.includes('سمانة') || m.includes('السمانة') || mg === 'CALVES') return 'السمانة';
  if (m.includes('أرجل') || m.includes('الأرجل') || m.includes('فخذ') || mg === 'LEGS') return 'الأرجل';

  if (m.includes('بطن') || m.includes('البطن') || m.includes('كور') || m.includes('الكور') || m.includes('خواصر') || mg === 'CORE') return 'البطن والكور';

  const words = m.split(/\s+/);
  if (words.length > 2) return words.slice(0, 2).join(' ');
  return m || 'عضلة رئيسية';
}

// Concise Equipment Badge Formatter (1-2 words max)
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function getShortEquipmentName(equipAr = '', equipment = '') {
  const e = String(equipAr || '').trim();
  const eq = String(equipment || '').toUpperCase();

  if (eq === 'BARBELL' || e.includes('بار')) return 'بار أولمبي';
  if (eq === 'DUMBBELL' || e.includes('دمبل')) return 'دمبلز';
  if (eq === 'CABLE' || e.includes('كابل')) return 'كابل';
  if (eq === 'MACHINE' || e.includes('جهاز') || e.includes('ماكينة')) return 'جهاز';
  if (eq === 'BODYWEIGHT' || e.includes('وزن الجسم') || e.includes('عقلة') || e.includes('متوازي')) return 'وزن الجسم';

  const words = e.split(/\s+/);
  if (words.length > 2) return words.slice(0, 2).join(' ');
  return e || 'أداة تمرين';
}

// Smart Injury Safety Classifier
// مقصود: ثابت أو دالة مشتركة بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export function isExerciseSafeForInjury(ex, injuryType) {
  if (!injuryType || injuryType === 'ALL') return true;

  const en = String(ex.name_en || '').toLowerCase();
  const ar = String(ex.name_ar || '').toLowerCase();
  const eq = String(ex.equipment || '').toUpperCase();

  if (injuryType === 'LOWER_BACK') {
    const badKeywords = ['deadlift', 'ديدليفت', 'squat', 'سكوات', 'bent over row', 'بار رُو', 'good morning', 'تجديف بالبار'];
    const isBad = badKeywords.some(k => en.includes(k) || ar.includes(k));
    if (isBad && !en.includes('chest-supported') && !ar.includes('مسنود') && !en.includes('goblet') && !en.includes('hack')) {
      return false;
    }
    return true;
  }

  if (injuryType === 'SHOULDER') {
    const badKeywords = ['behind the neck', 'upright row', 'تجديف عمودي', 'dips', 'متوازي'];
    const isBad = badKeywords.some(k => en.includes(k) || ar.includes(k));
    if (isBad) return false;
    return true;
  }

  if (injuryType === 'KNEE') {
    const badKeywords = ['walking lunge', 'jump squat', 'deep barbell squat', 'طعن متحرك'];
    const isBad = badKeywords.some(k => en.includes(k) || ar.includes(k));
    if (isBad) return false;
    return true;
  }

  if (injuryType === 'WRIST') {
    if (eq === 'BARBELL' && (en.includes('curl') || ar.includes('بايسبس') || en.includes('skull crusher'))) {
      return false;
    }
    return true;
  }

  return true;
}

// Bidirectional Smart Alternatives Manager Component
function AlternativesManager({ currentExId, alternatives = [], onChange, allExercises = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [selectedToAdd, setSelectedToAdd] = useState('');

  const currentAlts = Array.isArray(alternatives) ? alternatives : [];

  const linkedExercises = currentAlts.map(altId => {
    const found = allExercises.find(e => e.id === altId || e.code === altId);
    return found || { id: altId, name_ar: altId, name_en: altId, equipment: 'OTHER', muscle_group: 'OTHER' };
  });

  const candidateExercises = allExercises.filter(e => {
    if (currentExId && (e.id === currentExId || e.code === currentExId)) return false;
    if (currentAlts.includes(e.id) || currentAlts.includes(e.code)) return false;
    if (selectedMuscle !== 'ALL' && e.muscle_group !== selectedMuscle) return false;
    if (searchQuery.trim()) {
      const matchNameAr = arabicSearchMatch(e.name_ar, searchQuery);
      const matchNameEn = arabicSearchMatch(e.name_en, searchQuery);
      const matchId = arabicSearchMatch(e.id, searchQuery);
      if (!matchNameAr && !matchNameEn && !matchId) return false;
    }
    return true;
  });

  const handleAdd = () => {
    if (!selectedToAdd) return;
    if (!currentAlts.includes(selectedToAdd)) {
      onChange([...currentAlts, selectedToAdd]);
    }
    setSelectedToAdd('');
  };

  const handleRemove = (altId) => {
    onChange(currentAlts.filter(id => id !== altId));
  };

  return (
    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowRightLeft size={14} color="#0284C7" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
            الربط التبادلي التلقائي للبدائل التوأم
          </span>
        </div>
        <span style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: 700, background: '#F0F9FF', padding: '2px 8px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
          {currentAlts.length} بدائل مرتبطة
        </span>
      </div>

      <p style={{ margin: '0 0 10px 0', fontSize: '10.5px', color: '#64748B', lineHeight: 1.4 }}>
        الربط التبادلي التلقائي مفعل: بمجرد اختيار تمرين كبديل هنا، سيتم إدراجه تلقائياً كبديل توأم في بطاقة التمرين المقابل بدون تكرار يدوي.
      </p>

      {/* Selector Controls */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="بحث سريع عن تمرين بديل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 140px', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '11px', outline: 'none' }}
        />
        <CurvedSelect
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          style={{ width: '120px', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11px', fontWeight: 600, color: '#334155', background: '#FFFFFF', outline: 'none' }}
        >
          <option value="ALL">كل العضلات</option>
          <option value="CHEST">الصدر</option>
          <option value="BACK">الظهر</option>
          <option value="LEGS">الأرجل</option>
          <option value="SHOULDERS">الأكتاف</option>
          <option value="ARMS">الذراعين</option>
          <option value="CORE">البطن</option>
          <option value="CALVES">السمانة</option>
        </CurvedSelect>
        <CurvedSelect
          value={selectedToAdd}
          onChange={(e) => setSelectedToAdd(e.target.value)}
          style={{ flex: '2 1 180px', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
        >
          <option value="">-- اختر تمريناً لربطه تبادلياً ({candidateExercises.length} متاح) --</option>
          {candidateExercises.map(cand => {
            const candNames = getExerciseDisplayNames(cand);
            return (
              <option key={cand.id} value={cand.id}>
                {candNames.nameEn} ({candNames.nameAr}) - {getShortEquipmentName(cand.equipment_ar, cand.equipment)}
              </option>
            );
          })}
        </CurvedSelect>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedToAdd}
          style={{
            height: '32px',
            padding: '0 12px',
            borderRadius: '8px',
            border: 'none',
            background: selectedToAdd ? '#0284C7' : '#CBD5E1',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 700,
            cursor: selectedToAdd ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={12} />
          <span>ربط بديل</span>
        </button>
      </div>

      {/* Linked Alternatives List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {linkedExercises.length === 0 ? (
          <div style={{ padding: '10px', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '8px', fontSize: '11px', color: '#64748B' }}>
            لا توجد بدائل توأم مرتبطة حالياً. اختر تمريناً من القائمة أعلاه للربط التبادلي التلقائي.
          </div>
        ) : (
          linkedExercises.map(alt => {
            const altNames = getExerciseDisplayNames(alt);
            return (
              <div
                key={alt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <ArrowRightLeft size={13} color="#0284C7" />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>
                    {altNames.nameEn}
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                    ({altNames.nameAr})
                  </span>
                  <span style={{ background: '#F1F5F9', border: '1px solid #EAECF0', padding: '1px 6px', borderRadius: '8px', fontSize: '9.5px', fontWeight: 600, color: '#475569' }}>
                    {getShortEquipmentName(alt.equipment_ar, alt.equipment)}
                  </span>
                </div>
              <button
                type="button"
                onClick={() => handleRemove(alt.id)}
                style={{
                  border: 'none',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontWeight: 700,
                  transition: 'background 0.15s ease'
                }}
                title="فك الارتباط التبادلي"
              >
                <X size={12} />
                <span>فك الارتباط</span>
              </button>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

// Resilient Exercise Image Frame with graceful fallback and smooth fade-in
function ExerciseImageFrame({ src, label, icon: Icon = Dumbbell }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(src));
  }, [src]);

  return (
    <div style={{ 
      position: 'relative', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      background: '#F1F5F9', 
      border: '1px solid #EAECF0', 
      height: '135px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
    }}>
      {/* 1. Underlying Fallback Placeholder */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '6px', 
        color: '#94A3B8',
        background: '#F8FAFC'
      }}>
        <Icon size={24} strokeWidth={1.5} color="#94A3B8" />
        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B' }}>{label}</span>
      </div>

      {/* 2. Image Element */}
      {src && !hasError && (
        <img
          src={src}
          alt=""
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth === 0) {
              setHasError(true);
            } else {
              setIsLoading(false);
            }
          }}
          onError={() => setHasError(true)}
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain', 
            borderRadius: '9px', 
            padding: '2px',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function ExerciseLibrary() {
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [injuryFilter, setInjuryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [expandedView, setExpandedView] = useState({}); // { [exId]: 'CUES' | 'MISTAKES' | 'ALTERNATIVES' | null }
  const [copiedKey, setCopiedKey] = useState(null); // 'VIDEO_1' | 'CUES_1' | 'MISTAKES_1'
  const searchInputRef = useRef(null);

  // Add Exercise Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingNewExercise, setSavingNewExercise] = useState(false);
  const [newExerciseData, setNewExerciseData] = useState({
    name_en: '',
    name_ar: '',
    muscle_group: 'CHEST',
    equipment: 'BARBELL',
    video_url: '',
    cues_ar: '',
    mistakes_ar: '',
    image_stretch: '',
    image_contraction: '',
    tempId: '',
    alternatives: []
  });

  // Edit Full Exercise Modal State
  const [editingExercise, setEditingExercise] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name_en: '',
    name_ar: '',
    muscle_group: 'CHEST',
    equipment: 'BARBELL',
    video_url: '',
    cues_ar: '',
    mistakes_ar: '',
    alternatives: []
  });
  const [savingEditExercise, setSavingEditExercise] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      if (e.key === 'Escape' || e.keyCode === 27) {
        if (activeVideo) {
          setActiveVideo(null);
          return;
        }
        if (editingExercise) {
          setEditingExercise(null);
          return;
        }
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          return;
        }
        if (searchTerm) {
          setSearchTerm('');
          return;
        }
        if (isInputActive) {
          activeEl.blur();
        }
        return;
      }

      if (isInputActive) return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fetchExercises();
        return;
      }

      const muscleKeyMap = {
        '0': 'ALL',
        '1': 'CHEST',
        '2': 'BACK',
        '3': 'LEGS',
        '4': 'CALVES',
        '5': 'SHOULDERS',
        '6': 'ARMS',
        '7': 'CORE'
      };

      if (muscleKeyMap[e.key]) {
        e.preventDefault();
        setMuscleFilter(muscleKeyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, editingExercise, isAddModalOpen, searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/exercises`);
      const data = await res.json();
      if (data.exercises) setAllExercises(data.exercises);
    } catch (e) {
      console.error('fetchExercises error:', e);
    } finally {
      setLoading(false);
    }
  };

  const muscleCategories = [
    { id: 'ALL', label: 'جميع العضلات', shortcut: '0' },
    { id: 'CHEST', label: 'عضلات الصدر', shortcut: '1' },
    { id: 'BACK', label: 'الظهر والترابيس', shortcut: '2' },
    { id: 'LEGS', label: 'الأرجل والأرداف', shortcut: '3' },
    { id: 'CALVES', label: 'السمانة وقصبة الساق', shortcut: '4' },
    { id: 'SHOULDERS', label: 'الأكتاف', shortcut: '5' },
    { id: 'ARMS', label: 'الذراعين والساعد', shortcut: '6' },
    { id: 'CORE', label: 'البطن والكور', shortcut: '7' },
  ];

  const toggleCardView = (exId, type) => {
    setExpandedView(prev => ({
      ...prev,
      [exId]: prev[exId] === type ? null : type
    }));
  };

  // Generic Copy Handler with visual feedback
  const handleCopyDirect = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }).catch(err => {
      console.error('Clipboard copy error:', err);
    });
  };

  // Quick Copy Exercise Video Link
  const handleShareVideoLink = (ex) => {
    let videoLink = ex.video_url || (ex.video_id ? `https://www.youtube.com/watch?v=${ex.video_id}` : '');
    
    if (!videoLink) {
      videoLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name_en + ' exercise form')}`;
    }

    handleCopyDirect(videoLink, `VIDEO_${ex.id}`);
  };

  // Open Full Edit Exercise Modal
  const openEditExerciseModal = (ex) => {
    setEditingExercise(ex);
    setEditFormData({
      id: ex.id,
      name_en: ex.name_en || '',
      name_ar: ex.name_ar || '',
      muscle_group: ex.muscle_group || 'CHEST',
      equipment: ex.equipment || 'BARBELL',
      video_url: ex.video_url || (ex.video_id ? `https://www.youtube.com/watch?v=${ex.video_id}` : ''),
      cues_ar: ex.cues_ar || '',
      mistakes_ar: ex.mistakes_ar || '',
      image_stretch: ex.image_stretch || (ex.images && ex.images[0]) || `/exercises/${ex.id}/0.jpg`,
      image_contraction: ex.image_contraction || (ex.images && ex.images[1]) || `/exercises/${ex.id}/1.jpg`,
      alternatives: Array.isArray(ex.alternatives) ? ex.alternatives.map(a => typeof a === 'object' ? (a.id || a.exercise_code) : a) : []
    });
  };

  // Handle Direct Image File Upload (supports both editing and new exercise creation)
  const handleUploadImageFile = (e, imageIndex, isNew = false) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    let targetExId = isNew ? (newExerciseData.tempId || `EX_${Date.now()}`) : editingExercise?.id;
    if (!targetExId) return;

    if (isNew && !newExerciseData.tempId) {
      setNewExerciseData(prev => ({ ...prev, tempId: targetExId }));
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch(`${API_BASE}/api/v1/exercises/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: targetExId,
            image_index: imageIndex,
            image_base64: base64
          })
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          if (isNew) {
            if (imageIndex === 0) {
              setNewExerciseData(prev => ({ ...prev, image_stretch: data.imageUrl }));
            } else {
              setNewExerciseData(prev => ({ ...prev, image_contraction: data.imageUrl }));
            }
          } else {
            if (imageIndex === 0) {
              setEditFormData(prev => ({ ...prev, image_stretch: data.imageUrl }));
            } else {
              setEditFormData(prev => ({ ...prev, image_contraction: data.imageUrl }));
            }
          }
          handleCopyDirect('تم رفع الصورة وتحديثها بنجاح', `IMG_UPLOAD_${imageIndex}`);
        }
      } catch (err) {
        console.error('Upload image error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Updated Exercise Data
  const handleSaveEditedExercise = async (e) => {
    e.preventDefault();
    if (!editingExercise) return;

    try {
      setSavingEditExercise(true);
      const updatedExercise = {
        ...editingExercise,
        ...editFormData,
        alternatives: editFormData.alternatives || [],
        images: [
          editFormData.image_stretch,
          editFormData.image_contraction
        ]
      };

      const res = await fetch(`${API_BASE}/api/v1/admin-settings/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExercise)
      });
      const data = await res.json();
      
      if (data && data.exercises) {
        setAllExercises(data.exercises);
      } else {
        const saved = (data && data.exercise) ? data.exercise : updatedExercise;
        setAllExercises(prev => prev.map(e => e.id === editingExercise.id ? { ...e, ...saved } : e));
      }
      setEditingExercise(null);
    } catch (err) {
      console.error('Save edited exercise error:', err);
      setAllExercises(prev => prev.map(e => e.id === editingExercise.id ? { ...e, ...editFormData } : e));
      setEditingExercise(null);
    } finally {
      setSavingEditExercise(false);
    }
  };

  // Handle Save Custom Exercise
  const handleSaveCustomExercise = async (e) => {
    e.preventDefault();
    if (!newExerciseData.name_en.trim() || !newExerciseData.name_ar.trim()) {
      alert('يرجى إدخال اسم التمرين بالإنجليزي والعربي');
      return;
    }

    const exId = newExerciseData.tempId || `EX_${Date.now()}`;
    const payload = {
      ...newExerciseData,
      id: exId,
      alternatives: newExerciseData.alternatives || [],
      images: [
        newExerciseData.image_stretch,
        newExerciseData.image_contraction
      ]
    };

    try {
      setSavingNewExercise(true);
      const res = await fetch(`${API_BASE}/api/v1/admin-settings/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.exercises) {
        setAllExercises(data.exercises);
      } else if (data && data.exercise) {
        setAllExercises(prev => [data.exercise, ...prev]);
      } else {
        setAllExercises(prev => [payload, ...prev]);
      }
      setIsAddModalOpen(false);
      setNewExerciseData({
        name_en: '',
        name_ar: '',
        muscle_group: 'CHEST',
        equipment: 'BARBELL',
        video_url: '',
        cues_ar: '',
        mistakes_ar: '',
        image_stretch: '',
        image_contraction: '',
        tempId: '',
        alternatives: []
      });
    } catch (err) {
      console.error('Save custom exercise error:', err);
      setAllExercises(prev => [payload, ...prev]);
      setIsAddModalOpen(false);
    } finally {
      setSavingNewExercise(false);
    }
  };

  const exercises = allExercises.filter(ex => {
    const matchMuscle = muscleFilter === 'ALL' || 
      ex.muscle_group === muscleFilter || 
      (muscleFilter === 'LEGS' && (ex.muscle_group === 'LEGS' || ex.muscle_group === 'CALVES')) ||
      (muscleFilter === 'CALVES' && (ex.muscle_group === 'CALVES' || ex.id === 'WALL_TIBIALIS_RAISE' || ex.name_ar?.includes('سمانة') || ex.name_ar?.includes('الساق')));
    const matchEquipment = equipmentFilter === 'ALL' || ex.equipment === equipmentFilter;
    const matchInjury = isExerciseSafeForInjury(ex, injuryFilter);
    const matchSearch = !searchTerm.trim() || 
      arabicSearchMatch(ex.name_ar, searchTerm) ||
      arabicSearchMatch(ex.name_en, searchTerm) ||
      arabicSearchMatch(ex.id, searchTerm) ||
      (Array.isArray(ex.aliases) && ex.aliases.some(a => arabicSearchMatch(a, searchTerm)));
    return matchMuscle && matchEquipment && matchInjury && matchSearch;
  });

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. Page Header with Add Exercise Button */}
        <PageHeader
          title="دليل التمارين الرياضية"
          description={`قاعدة بيانات تشريحية تضم ${allExercises.length} تمريناً مع شروحات التكنيك وبدائل الأجهزة المباشرة.`}
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setNewExerciseData({
                    name_en: '',
                    name_ar: '',
                    muscle_group: 'CHEST',
                    equipment: 'BARBELL',
                    video_url: '',
                    cues_ar: '',
                    mistakes_ar: '',
                    image_stretch: '',
                    image_contraction: '',
                    tempId: `EX_${Date.now()}`,
                    alternatives: []
                  });
                  setIsAddModalOpen(true);
                }}
                style={{
                  padding: '0 18px', height: '36px', borderRadius: '8px', background: '#673DE6', color: '#FFFFFF', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5025D1')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#673DE6')}
              >
                <Plus size={14} />
                <span>إضافة تمرين جديد</span>
              </button>
            </div>
          )}
        />

        {/* Exercise & Mobility Studio Switcher */}
        <div style={{ display: 'inline-flex', gap: '4px', background: '#F2F4F7', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0', width: 'fit-content' }}>
          <button
            type="button"
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'default',
              background: '#673DE6', color: '#FFFFFF', boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Dumbbell size={14} />
            <span>تمارين المقاومة والأجهزة ({allExercises.length})</span>
          </button>
          <Link
            to="/coach/mobility"
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              textDecoration: 'none',
              color: '#475467',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <HeartPulse size={14} />
            <span>المرونة والاستشفاء</span>
          </Link>
        </div>

        {/* 2. Muscle Selector & Search & Filters Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Top Row: Muscle Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'inline-flex', gap: '3px', flexWrap: 'wrap', background: '#F2F4F7', padding: '3px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
              {muscleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMuscleFilter(cat.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: muscleFilter === cat.id ? '#0F172A' : 'transparent',
                    color: muscleFilter === cat.id ? '#FFFFFF' : '#64748B',
                    boxShadow: muscleFilter === cat.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'background 0.12s ease, color 0.12s ease'
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '1px 4px',
                    borderRadius: '8px',
                    background: muscleFilter === cat.id ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: muscleFilter === cat.id ? '#FFFFFF' : '#64748B'
                  }}>
                    {cat.shortcut}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Refresh Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchExercises}
                disabled={loading}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                title="تحديث قائمة التمارين [R]"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>تحديث</span>
                <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>[R]</span>
              </button>

              {/* Unified Hostinger Search Box */}
              <TableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                inputRef={searchInputRef}
                placeholder="بحث باسم التمرين (عربي / English)..."
                width="260px"
                showShortcut={true}
                shortcutText="/"
              />
            </div>
          </div>

          {/* Secondary Filter Row: Equipment Filter + Injury Safety Filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '16px', border: '1px solid #EAECF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              
              {/* Equipment Selector */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>الأداة:</span>
                <CurvedSelect 
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  style={{ 
                    height: '32px', 
                    borderRadius: '8px', 
                    border: '1px solid #CBD5E1', 
                    padding: '0 12px', 
                    fontSize: '11.5px', 
                    fontWeight: 700, 
                    color: '#0F172A', 
                    background: '#FFFFFF', 
                    outline: 'none', 
                    cursor: 'pointer' 
                  }}
                >
                  <option value="ALL">جميع الأدوات</option>
                  <option value="BARBELL">بار أولمبي</option>
                  <option value="DUMBBELL">دمبلز</option>
                  <option value="CABLE">كابلات</option>
                  <option value="MACHINE">أجهزة</option>
                  <option value="BODYWEIGHT">وزن الجسم</option>
                </CurvedSelect>
              </div>

              {/* Injury Safety Selector */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>
                  <ShieldCheck size={14} color={injuryFilter !== 'ALL' ? '#16A34A' : '#64748B'} />
                  <span>الأمان الطبي:</span>
                </span>
                <CurvedSelect 
                  value={injuryFilter}
                  onChange={(e) => setInjuryFilter(e.target.value)}
                  style={{ 
                    height: '32px', 
                    borderRadius: '8px', 
                    border: injuryFilter !== 'ALL' ? '1px solid #86EFAC' : '1px solid #CBD5E1', 
                    padding: '0 12px', 
                    fontSize: '11.5px', 
                    fontWeight: 700, 
                    color: injuryFilter !== 'ALL' ? '#16A34A' : '#0F172A', 
                    background: injuryFilter !== 'ALL' ? '#F0FDF4' : '#FFFFFF', 
                    outline: 'none', 
                    cursor: 'pointer',
                    maxWidth: '280px'
                  }}
                >
                  <option value="ALL">الكل (الوضع الطبيعي)</option>
                  <option value="LOWER_BACK">آمن لأسفل الظهر (بدون ضغط فقرات)</option>
                  <option value="SHOULDER">آمن للكتف والروتاتور كاف</option>
                  <option value="KNEE">آمن لمفصل الركبة</option>
                  <option value="WRIST">آمن للمعصم والساعد</option>
                </CurvedSelect>
              </div>

            </div>

            {/* Results Count Badge */}
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
              عرض <strong style={{ color: '#0F172A' }}>{exercises.length}</strong> تمرين مطابق
            </div>
          </div>

        </div>

        {/* 3. Compact 3-Column Premium Exercise Cards Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            جاري تحميل التمارين الرياضية...
          </div>
        ) : exercises.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
              <Dumbbell size={18} />
            </div>
            <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد تمارين مطابقة</strong>
            <small style={{ fontSize: '11.5px', color: '#64748B' }}>جرب تغيير العضلة أو الأداة أو فلتر الأمان الطبي.</small>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
            {exercises.map((ex) => {
              const currentExpanded = expandedView[ex.id];
              const isVideoCopied = copiedKey === `VIDEO_${ex.id}`;
              const displayNames = getExerciseDisplayNames(ex);

              return (
                <div 
                  key={ex.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAECF0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div>
                    {/* Balanced Executive Header: Title Row on Top (Full Width) & Badges Sub-Row */}
                    <div style={{ marginBottom: '10px' }}>
                      
                      {/* Top Row: Full-width Exercise Title + Edit Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '13.5px', 
                          fontWeight: 800, 
                          color: '#0F172A', 
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          minWidth: 0
                        }}
                        title={displayNames.nameEn || ex.name_en}
                        >
                          {displayNames.nameEn || ex.name_en}
                        </h4>

                        <button
                          type="button"
                          onClick={() => openEditExerciseModal(ex)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#64748B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            padding: 0
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                          title="تعديل بيانات وتكنيك وفيديو التمرين"
                        >
                          <Edit3 size={11} />
                        </button>
                      </div>

                      {/* Sub-Row: Arabic Name on Right & Muscle/Equipment Badges on Left */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'nowrap' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#64748B', 
                          fontWeight: 600, 
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          minWidth: 0
                        }}
                        title={displayNames.nameAr || ex.name_ar}
                        >
                          {displayNames.nameAr || ex.name_ar}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#0F172A',
                            padding: '1.5px 6px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Target size={10} color="#0284C7" />
                            <span>{getShortMuscleName(ex.muscle_ar, ex.muscle_group)}</span>
                          </span>

                          <span style={{
                            background: '#F8FAFC',
                            border: '1px solid #EAECF0',
                            color: '#475569',
                            padding: '1.5px 6px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            whiteSpace: 'nowrap'
                          }}>
                            <Dumbbell size={10} color="#64748B" />
                            <span>{getShortEquipmentName(ex.equipment_ar, ex.equipment)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Badges for injury & alternatives if active */}
                      {(injuryFilter !== 'ALL' || (Array.isArray(ex.alternatives) && ex.alternatives.length > 0)) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '4px', justifyContent: 'flex-start' }}>
                          {Array.isArray(ex.alternatives) && ex.alternatives.length > 0 && (
                            <span style={{
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              whiteSpace: 'nowrap'
                            }}>
                              <ArrowRightLeft size={9} />
                              <span>{ex.alternatives.length} بدائل توأم</span>
                            </span>
                          )}
                          {injuryFilter !== 'ALL' && (
                            <span style={{
                              background: '#F0FDF4',
                              border: '1px solid #86EFAC',
                              color: '#16A34A',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              whiteSpace: 'nowrap'
                            }}>
                              <ShieldCheck size={9} />
                              <span>آمن للإصابة</span>
                            </span>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Dual-State Accurate Exercise Preview (Start & Finish Positions) + Video Strip */}
                    <div style={{
                      background: '#F8FAFC',
                      padding: '6px',
                      borderRadius: '14px',
                      border: '1px solid #EAECF0',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px'
                      }}>
                        <ExerciseImageFrame
                          src={ex.image_stretch || (ex.images && ex.images[0]) || `/exercises/${ex.id}/0.jpg`}
                          label="وضع البداية"
                          icon={Dumbbell}
                        />
                        <ExerciseImageFrame
                          src={ex.image_contraction || (ex.images && ex.images[1]) || `/exercises/${ex.id}/1.jpg`}
                          label="وضع الانقباض"
                          icon={Dumbbell}
                        />
                      </div>

                      {/* Video Player & Quick Link Strip directly under media */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveVideo(ex)}
                          style={{
                            flex: 1,
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid #D0D5DD',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = '#FFFFFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#0F172A'; }}
                          title="مشاهدة فيديو أداء وتكنيك التمرين"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>مشاهدة الفيديو</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareVideoLink(ex)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: isVideoCopied ? '1px solid #86EFAC' : '1px solid #D0D5DD',
                            background: isVideoCopied ? '#F0FDF4' : '#FFFFFF',
                            color: isVideoCopied ? '#16A34A' : '#64748B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => { if (!isVideoCopied) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; } }}
                          onMouseLeave={(e) => { if (!isVideoCopied) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; } }}
                          title={isVideoCopied ? 'تم نسخ الرابط' : 'نسخ رابط الفيديو للحافظة'}
                        >
                          {isVideoCopied ? <CheckCircle2 size={12} color="#16A34A" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Technique Box (with In-Header Copy Button) */}
                  {currentExpanded === 'CUES' && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRight: '3px solid #0F172A', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', color: '#334155', lineHeight: 1.45 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={11} />
                          <span>التكنيك السليم للأداء:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyDirect(ex.cues_ar, `CUES_${ex.id}`)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '8px',
                            border: copiedKey === `CUES_${ex.id}` ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                            background: copiedKey === `CUES_${ex.id}` ? '#F0FDF4' : '#FFFFFF',
                            color: copiedKey === `CUES_${ex.id}` ? '#16A34A' : '#475569',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                          title="نسخ نص التكنيك"
                        >
                          {copiedKey === `CUES_${ex.id}` ? <CheckCircle2 size={10} color="#16A34A" /> : <Copy size={10} />}
                          <span>{copiedKey === `CUES_${ex.id}` ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <p style={{ margin: 0 }}>
                        {ex.cues_ar}
                      </p>
                    </div>
                  )}

                  {/* Expandable Mistakes Box (with In-Header Copy Button) */}
                  {currentExpanded === 'MISTAKES' && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #EAECF0', borderRight: '3px solid #D97706', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', color: '#78350F', lineHeight: 1.45 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={11} />
                          <span>أخطاء شائعة لتجنب الإصابة:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyDirect(ex.mistakes_ar, `MISTAKES_${ex.id}`)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '8px',
                            border: copiedKey === `MISTAKES_${ex.id}` ? '1px solid #86EFAC' : '1px solid #FDE68A',
                            background: copiedKey === `MISTAKES_${ex.id}` ? '#F0FDF4' : '#FFFFFF',
                            color: copiedKey === `MISTAKES_${ex.id}` ? '#16A34A' : '#B45309',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                          title="نسخ نص تجنب الإصابات"
                        >
                          {copiedKey === `MISTAKES_${ex.id}` ? <CheckCircle2 size={10} color="#16A34A" /> : <Copy size={10} />}
                          <span>{copiedKey === `MISTAKES_${ex.id}` ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <p style={{ margin: 0 }}>
                        {ex.mistakes_ar}
                      </p>
                    </div>
                  )}

                  {/* Expandable Alternatives Box */}
                  {currentExpanded === 'ALTERNATIVES' && (
                    <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRight: '3px solid #0284C7', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', color: '#0C4A6E', lineHeight: 1.45 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowRightLeft size={12} />
                          <span>البدائل التوأم المباشرة (الربط التبادلي):</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>
                          {(!ex.alternatives || ex.alternatives.length === 0) ? 'لا توجد بدائل' : `${ex.alternatives.length} بديل`}
                        </span>
                      </div>
                      {(!ex.alternatives || ex.alternatives.length === 0) ? (
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
                          لا توجد بدائل توأم مرتبطة حالياً. يمكنك الضغط على زر "تعديل" لربط بدائل فورية بهذا التمرين.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {ex.alternatives.map(altId => {
                            const target = allExercises.find(e => e.id === altId || e.code === altId);
                            const targetNames = target ? getExerciseDisplayNames(target) : { nameEn: altId, nameAr: altId };
                            return (
                              <div key={altId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '5px 9px', borderRadius: '8px', border: '1px solid #E0F2FE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '11px' }}>
                                    {targetNames.nameEn}
                                  </span>
                                  <span style={{ color: '#64748B', fontSize: '10px' }}>
                                    ({targetNames.nameAr})
                                  </span>
                                </div>
                                {target && (
                                  <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', padding: '1px 6px', borderRadius: '8px', fontSize: '9.5px', fontWeight: 600, flexShrink: 0 }}>
                                    {getShortEquipmentName(target.equipment_ar, target.equipment)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unified Segmented Details Toggle Bar */}
                  <div style={{
                    background: '#F1F5F9',
                    padding: '3px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '3px',
                    marginTop: '2px'
                  }}>
                    {/* Technique Segment */}
                    <button
                      type="button"
                      onClick={() => toggleCardView(ex.id, 'CUES')}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: currentExpanded === 'CUES' ? '#0F172A' : 'transparent',
                        color: currentExpanded === 'CUES' ? '#FFFFFF' : '#475569',
                        fontSize: '11px',
                        fontWeight: currentExpanded === 'CUES' ? 800 : 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: currentExpanded === 'CUES' ? '0 1px 3px rgba(15, 23, 42, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      title="عرض / إخفاء التكنيك السليم"
                    >
                      <BookOpen size={11} />
                      <span>التكنيك</span>
                    </button>

                    {/* Mistakes Segment */}
                    <button
                      type="button"
                      onClick={() => toggleCardView(ex.id, 'MISTAKES')}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: currentExpanded === 'MISTAKES' ? '#FFFBEB' : 'transparent',
                        color: currentExpanded === 'MISTAKES' ? '#B45309' : '#64748B',
                        fontSize: '11px',
                        fontWeight: currentExpanded === 'MISTAKES' ? 800 : 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: currentExpanded === 'MISTAKES' ? '0 1px 3px rgba(180, 83, 9, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      title="عرض / إخفاء الأخطاء الشائعة لتجنب الإصابة"
                    >
                      <AlertTriangle size={11} />
                      <span>تجنب الإصابات</span>
                    </button>

                    {/* Alternatives Segment */}
                    <button
                      type="button"
                      onClick={() => toggleCardView(ex.id, 'ALTERNATIVES')}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: currentExpanded === 'ALTERNATIVES' ? '#F0F9FF' : 'transparent',
                        color: currentExpanded === 'ALTERNATIVES' ? '#0284C7' : (ex.alternatives?.length > 0 ? '#0284C7' : '#94A3B8'),
                        fontSize: '11px',
                        fontWeight: currentExpanded === 'ALTERNATIVES' ? 800 : 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: currentExpanded === 'ALTERNATIVES' ? '0 1px 3px rgba(2, 132, 199, 0.15)' : 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      title="عرض / إخفاء البدائل التوأم المرتبطة تبادلياً"
                    >
                      <ArrowRightLeft size={11} />
                      <span>البدائل{ex.alternatives?.length > 0 ? ` (${ex.alternatives.length})` : ''}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* 4. Modal: Add New Custom Exercise */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              
              {/* Modal Header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#673DE6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Dumbbell size={14} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة تمرين رياضي مخصص</h3>
                    <small style={{ fontSize: '11px', color: '#64748B' }}>إضافة تمرين جديد لقاعدة بيانات الكوتش وفيديوهات الشرح</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSaveCustomExercise} style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      اسم التمرين بالإنجليزي *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Incline Cable Fly"
                      value={newExerciseData.name_en}
                      onChange={(e) => setNewExerciseData({ ...newExerciseData, name_en: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      اسم التمرين بالعربي *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: تفتيح كابل مائل للصدر العلوي"
                      value={newExerciseData.name_ar}
                      onChange={(e) => setNewExerciseData({ ...newExerciseData, name_ar: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Muscle & Equipment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      المجموعة العضلية
                    </label>
                    <CurvedSelect
                      value={newExerciseData.muscle_group}
                      onChange={(e) => setNewExerciseData({ ...newExerciseData, muscle_group: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="CHEST">عضلات الصدر</option>
                      <option value="BACK">الظهر والترابيس</option>
                      <option value="LEGS">الأرجل والأرداف</option>
                      <option value="SHOULDERS">الأكتاف</option>
                      <option value="ARMS">الذراعين والساعد</option>
                      <option value="CORE">البطن والكور</option>
                      <option value="CALVES">السمانة</option>
                    </CurvedSelect>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      الأداة الرياضية
                    </label>
                    <CurvedSelect
                      value={newExerciseData.equipment}
                      onChange={(e) => setNewExerciseData({ ...newExerciseData, equipment: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="BARBELL">بار أولمبي</option>
                      <option value="DUMBBELL">دمبلز</option>
                      <option value="CABLE">كابلات</option>
                      <option value="MACHINE">أجهزة</option>
                      <option value="BODYWEIGHT">وزن الجسم</option>
                    </CurvedSelect>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    رابط فيديو الشرح (YouTube URL أو مقاطع Shorts)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... أو رابط Shorts"
                    value={newExerciseData.video_url}
                    onChange={(e) => setNewExerciseData({ ...newExerciseData, video_url: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Dual Image Thumbnails Settings & Preview for New Exercise */}
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                        صور أداء التمرين (البداية والنهاية)
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '1px' }}>
                        يمكنك اختيار صور من جهازك أو وضع روابط مباشرة
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setNewExerciseData({
                          ...newExerciseData,
                          image_stretch: newExerciseData.image_contraction,
                          image_contraction: newExerciseData.image_stretch
                        });
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0284C7',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="تبديل صورتي البداية والنهاية"
                    >
                      <ArrowRightLeft size={12} />
                      <span>عكس الترتيب</span>
                    </button>
                  </div>
                  
                  {/* Live Preview with Upload Triggers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {/* Image 1: Start Position */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {newExerciseData.image_stretch ? (
                          <img src={newExerciseData.image_stretch} alt="بداية" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', padding: '2px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          1. وضع البداية
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#673DE6', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>اختيار صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadImageFile(e, 0, true)}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="أو ضع مسار / رابط صورة البداية"
                        value={newExerciseData.image_stretch}
                        onChange={(e) => setNewExerciseData({ ...newExerciseData, image_stretch: e.target.value })}
                        style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #EAECF0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Image 2: Contraction Position */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {newExerciseData.image_contraction ? (
                          <img src={newExerciseData.image_contraction} alt="أداء" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', padding: '2px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          2. وضع الانقباض
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#673DE6', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>اختيار صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadImageFile(e, 1, true)}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="أو ضع مسار / رابط صورة الانقباض"
                        value={newExerciseData.image_contraction}
                        onChange={(e) => setNewExerciseData({ ...newExerciseData, image_contraction: e.target.value })}
                        style={{ width: '100%', height: '26px', borderRadius: '8px', border: '1px solid #EAECF0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bidirectional Smart Linker */}
                <AlternativesManager
                  currentExId={newExerciseData.tempId}
                  alternatives={newExerciseData.alternatives}
                  onChange={(newAlts) => setNewExerciseData(prev => ({ ...prev, alternatives: newAlts }))}
                  allExercises={allExercises}
                />

                {/* Coaching Cues */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    التكنيك السليم وملاحظات الأداء (Coaching Cues)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="شرح خطوات وضعية الجسم، زاوية الكوع، مسار الحركة والمدى الحركي..."
                    value={newExerciseData.cues_ar}
                    onChange={(e) => setNewExerciseData({ ...newExerciseData, cues_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* Mistakes */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B45309', marginBottom: '4px' }}>
                    أخطاء شائعة لتجنب الإصابة (Injury Prevention)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أخطاء التكنيك التي قد تسبب ألماً أو إصابة في المفاصل..."
                    value={newExerciseData.mistakes_ar}
                    onChange={(e) => setNewExerciseData({ ...newExerciseData, mistakes_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* Footer Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewExercise}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#673DE6', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingNewExercise ? 'جاري الحفظ...' : 'حفظ التمرين بالمكتبة'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* 5. Modal: Edit Full Existing Exercise Data */}
        {editingExercise && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              
              {/* Header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#673DE6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit3 size={14} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>تعديل بيانات وتكنيك التمرين</h3>
                    <small style={{ fontSize: '11px', color: '#64748B' }}>تعديل الاسم، التكنيك السليم، أخطاء الإصابة، أو رابط الفيديو</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingExercise(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEditedExercise} style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      اسم التمرين بالإنجليزي *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name_en}
                      onChange={(e) => setEditFormData({ ...editFormData, name_en: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      اسم التمرين بالعربي *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name_ar}
                      onChange={(e) => setEditFormData({ ...editFormData, name_ar: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Muscle & Equipment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      المجموعة العضلية
                    </label>
                    <CurvedSelect
                      value={editFormData.muscle_group}
                      onChange={(e) => setEditFormData({ ...editFormData, muscle_group: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="CHEST">عضلات الصدر</option>
                      <option value="BACK">الظهر والترابيس</option>
                      <option value="LEGS">الأرجل والأرداف</option>
                      <option value="SHOULDERS">الأكتاف</option>
                      <option value="ARMS">الذراعين والساعد</option>
                      <option value="CORE">البطن والكور</option>
                      <option value="CALVES">السمانة</option>
                    </CurvedSelect>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      الأداة الرياضية
                    </label>
                    <CurvedSelect
                      value={editFormData.equipment}
                      onChange={(e) => setEditFormData({ ...editFormData, equipment: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="BARBELL">بار أولمبي</option>
                      <option value="DUMBBELL">دمبلز</option>
                      <option value="CABLE">كابلات</option>
                      <option value="MACHINE">أجهزة</option>
                      <option value="BODYWEIGHT">وزن الجسم</option>
                    </CurvedSelect>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    رابط فيديو الشرح (YouTube URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={editFormData.video_url}
                    onChange={(e) => setEditFormData({ ...editFormData, video_url: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Dual Image Thumbnails Settings & Preview */}
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #EAECF0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                        صور أداء التمرين (البداية والنهاية)
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '1px' }}>
                        معاينة الصورتين الحركيتين للتكنيك السليم (وضع البداية والاستطالة / وضع الانقباض)
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          image_stretch: editFormData.image_contraction,
                          image_contraction: editFormData.image_stretch
                        });
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0284C7',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="تبديل صورتي البداية والنهاية"
                    >
                      <ArrowRightLeft size={12} />
                      <span>عكس الترتيب</span>
                    </button>
                  </div>
                  
                  {/* Live Preview with Upload Triggers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {/* Image 1: Start Position */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {editFormData.image_stretch ? (
                          <img src={editFormData.image_stretch} alt="بداية" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', padding: '2px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          1. وضع البداية (0.jpg)
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#673DE6', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>اختيار صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadImageFile(e, 0)}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="أو ضع مسار / رابط صورة البداية"
                        value={editFormData.image_stretch}
                        onChange={(e) => setEditFormData({ ...editFormData, image_stretch: e.target.value })}
                        style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #EAECF0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Image 2: Contraction Position */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {editFormData.image_contraction ? (
                          <img src={editFormData.image_contraction} alt="أداء" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', padding: '2px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          2. وضع الانقباض (1.jpg)
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#673DE6', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                        <Upload size={12} />
                        <span>اختيار صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadImageFile(e, 1)}
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="أو ضع مسار / رابط صورة الأداء"
                        value={editFormData.image_contraction}
                        onChange={(e) => setEditFormData({ ...editFormData, image_contraction: e.target.value })}
                        style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #EAECF0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bidirectional Smart Linker */}
                <AlternativesManager
                  currentExId={editingExercise?.id}
                  alternatives={editFormData.alternatives}
                  onChange={(newAlts) => setEditFormData(prev => ({ ...prev, alternatives: newAlts }))}
                  allExercises={allExercises}
                />

                {/* Coaching Cues */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    التكنيك السليم وملاحظات الأداء (Coaching Cues)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="شرح خطوات وضعية الجسم، زاوية الكوع، مسار الحركة والمدى الحركي..."
                    value={editFormData.cues_ar}
                    onChange={(e) => setEditFormData({ ...editFormData, cues_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* Mistakes */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B45309', marginBottom: '4px' }}>
                    أخطاء شائعة لتجنب الإصابة (Injury Prevention)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أخطاء التكنيك التي قد تسبب ألماً أو إصابة في المفاصل..."
                    value={editFormData.mistakes_ar}
                    onChange={(e) => setEditFormData({ ...editFormData, mistakes_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>

                {/* Footer Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setEditingExercise(null)}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditExercise}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#673DE6', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingEditExercise ? 'جاري الحفظ...' : 'حفظ وتحديث التمرين بالكامل'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* 6. Video Player Modal */}
        {activeVideo && (
          <ExerciseVideoModal
            exercise={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        )}

      </div>
    </AdminLayout>
  );
}
