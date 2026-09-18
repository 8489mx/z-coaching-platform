import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Search, Plus, X, Play, Copy, Check, RotateCw, Flame, ShieldCheck, Layers, Edit3, Upload, ArrowRightLeft, Lock, Activity, Dumbbell, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { PageHeader } from '@/shared/components/page-header';
import defaultMobilityCatalog from '../data/mobilityCatalog.json';
import { arabicSearchMatch } from '../utils/searchUtils';
import CurvedSelect from '../components/common/CurvedSelect';

// Resilient Mobility Image Frame with graceful fallback and smooth fade-in
function MobilityImageFrame({ src, label, icon: Icon = Activity }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(src));
  }, [src]);

  return (
    <div style={{ 
      position: 'relative', 
      borderRadius: '10px', 
      overflow: 'hidden', 
      background: '#F1F5F9', 
      border: '1px solid #E2E8F0', 
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

export default function MobilityLibrary() {
  const [drills, setDrills] = useState(defaultMobilityCatalog || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('CARDIO_MODALITY');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Add Drill Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingNewDrill, setSavingNewDrill] = useState(false);
  const [newDrillData, setNewDrillData] = useState({
    name_ar: '',
    name_en: '',
    type: 'CARDIO_PROTOCOL',
    category: 'CARDIO_MODALITY',
    target_area_ar: 'القلب وحرق الدهون',
    cue_ar: '',
    video_url: '',
    equipment: 'BODYWEIGHT'
  });

  // Edit Drill Modal State (With Engine Code Invariance Protection)
  const [editingDrill, setEditingDrill] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    category: 'CARDIO_MODALITY',
    equipment: 'BODYWEIGHT',
    target_area_ar: '',
    cue_ar: '',
    video_url: '',
    image_stretch: '',
    image_contraction: ''
  });
  const [savingEditDrill, setSavingEditDrill] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchMobilityDrills();
  }, []);

  // Global Power Keyboard Shortcuts: /, Escape, R, 0-4
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if (e.key === 'Escape') {
        if (activeVideo) {
          setActiveVideo(null);
          return;
        }
        if (editingDrill) {
          setEditingDrill(null);
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
      }

      if (isInputFocused) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchMobilityDrills();
        showToast('جاري تحديث مكتبة المرونة والكارديو...');
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('CARDIO_MODALITY');
      } else if (e.key === '2') {
        e.preventDefault();
        setActiveTab('DYNAMIC_WARMUP');
      } else if (e.key === '3') {
        e.preventDefault();
        setActiveTab('STATIC_STRETCH');
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveTab('POSTURAL_PREHAB');
      } else if (e.key === '0') {
        e.preventDefault();
        setActiveTab('ALL');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, editingDrill, isAddModalOpen, searchTerm]);

  const fetchMobilityDrills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/mobility`);
      if (res.ok) {
        const data = await res.json();
        if (data.mobility_drills && data.mobility_drills.length > 0) {
          setDrills(data.mobility_drills);
        }
      }
    } catch {
      // Keep local
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('تم نسخ التوجيه بنجاح');
  };

  // Open Edit Modal for any exercise / drill
  const openEditModal = (drill) => {
    setEditingDrill(drill);
    setEditFormData({
      id: drill.id,
      name_ar: drill.name_ar || '',
      name_en: drill.name_en || '',
      category: drill.category || 'CARDIO_MODALITY',
      equipment: drill.equipment || 'BODYWEIGHT',
      target_area_ar: drill.target_area_ar || '',
      cue_ar: drill.cue_ar || '',
      video_url: drill.video_url || '',
      image_stretch: drill.image_stretch || drill.images?.[0] || `/exercises/${drill.id}/0.jpg`,
      image_contraction: drill.image_contraction || drill.images?.[1] || `/exercises/${drill.id}/1.jpg`
    });
  };

  // Upload Image Directly from Computer
  const handleUploadImageFile = (e, imageIndex) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !editingDrill) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch(`${API_BASE}/api/v1/exercises/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: editingDrill.id,
            image_index: imageIndex,
            image_base64: base64
          })
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          if (imageIndex === 0) {
            setEditFormData(prev => ({ ...prev, image_stretch: data.imageUrl }));
          } else {
            setEditFormData(prev => ({ ...prev, image_contraction: data.imageUrl }));
          }
          showToast(`تم رفع وتحديث صورة ${imageIndex === 0 ? 'البداية' : 'الأداء'} بنجاح`);
        }
      } catch (err) {
        console.error('Upload image error:', err);
        showToast('فشل رفع الصورة');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Edited Drill while Strictly Preserving Canonical ID for the Engine
  const handleSaveEditedDrill = async (e) => {
    e.preventDefault();
    if (!editingDrill) return;

    try {
      setSavingEditDrill(true);
      const updatedDrill = {
        ...editingDrill,
        ...editFormData,
        id: editingDrill.id, // Immutable Engine Code
        image_stretch: editFormData.image_stretch,
        image_contraction: editFormData.image_contraction,
        images: [
          editFormData.image_stretch,
          editFormData.image_contraction
        ],
        thumbnail: editFormData.image_stretch
      };

      const res = await fetch(`${API_BASE}/api/v1/mobility/${editingDrill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDrill)
      });

      const data = res.ok ? await res.json() : null;
      const saved = (data && data.drill) ? data.drill : updatedDrill;

      setDrills(prev => prev.map(d => d.id === editingDrill.id ? { ...d, ...saved } : d));
      showToast(`تم حفظ تعديلات ${editFormData.name_ar} بنجاح`);
      setEditingDrill(null);
    } catch (err) {
      console.error('Save edited drill error:', err);
      setDrills(prev => prev.map(d => d.id === editingDrill.id ? { ...d, ...editFormData } : d));
      showToast('تم حفظ التعديلات محلياً');
      setEditingDrill(null);
    } finally {
      setSavingEditDrill(false);
    }
  };

  const handleSaveNewDrill = async (e) => {
    e.preventDefault();
    if (!newDrillData.name_ar) return;
    try {
      setSavingNewDrill(true);
      const res = await fetch(`${API_BASE}/api/v1/mobility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDrillData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.drill) setDrills(prev => [data.drill, ...prev]);
      } else {
        setDrills(prev => [{ id: `MOB_LOCAL_${Date.now()}`, ...newDrillData }, ...prev]);
      }
      showToast(`تمت إضافة ${newDrillData.name_ar} بنجاح`);
      setIsAddModalOpen(false);
      setNewDrillData({
        name_ar: '',
        name_en: '',
        type: 'CARDIO_PROTOCOL',
        category: 'CARDIO_MODALITY',
        target_area_ar: 'القلب وحرق الدهون',
        cue_ar: '',
        video_url: '',
        equipment: 'BODYWEIGHT'
      });
    } catch {
      showToast('تمت إضافة الحركة بنجاح');
      setIsAddModalOpen(false);
    } finally {
      setSavingNewDrill(false);
    }
  };

  const tabs = [
    { id: 'CARDIO_MODALITY', label: 'أنظمة الكارديو', icon: Flame, shortcut: '1', count: drills.filter(d => d.category === 'CARDIO_MODALITY').length },
    { id: 'DYNAMIC_WARMUP', label: 'الإحماء والمرونة', icon: RotateCw, shortcut: '2', count: drills.filter(d => d.category === 'DYNAMIC_WARMUP').length },
    { id: 'STATIC_STRETCH', label: 'الإطالات والاستشفاء', icon: HeartPulse, shortcut: '3', count: drills.filter(d => d.category === 'STATIC_STRETCH').length },
    { id: 'POSTURAL_PREHAB', label: 'تصحيح القوام', icon: ShieldCheck, shortcut: '4', count: drills.filter(d => d.category === 'POSTURAL_PREHAB').length },
    { id: 'ALL', label: 'الكل', icon: Layers, shortcut: '0', count: drills.length },
  ];

  const filteredDrills = useMemo(() => {
    return drills.filter(d => {
      const matchTab = activeTab === 'ALL' || d.category === activeTab;
      const matchSearch = !searchTerm.trim() ||
        arabicSearchMatch(d.name_ar, searchTerm) ||
        arabicSearchMatch(d.name_en, searchTerm) ||
        arabicSearchMatch(d.target_area_ar, searchTerm) ||
        arabicSearchMatch(d.cue_ar, searchTerm);
      let matchArea = true;
      if (selectedArea === 'SHOULDERS') matchArea = d.target_area_ar?.includes('كتف') || d.target_area_ar?.includes('ترقوة');
      if (selectedArea === 'HIPS') matchArea = d.target_area_ar?.includes('حوض') || d.target_area_ar?.includes('ورك') || d.target_area_ar?.includes('قطنية') || d.target_area_ar?.includes('جلوتس');
      if (selectedArea === 'KNEES') matchArea = d.target_area_ar?.includes('ركبة') || d.target_area_ar?.includes('كاحل') || d.target_area_ar?.includes('ساق');
      if (selectedArea === 'CHEST') matchArea = d.target_area_ar?.includes('صدر') || d.target_area_ar?.includes('ظهر') || d.target_area_ar?.includes('لاتس');
      if (selectedArea === 'CORE') matchArea = d.target_area_ar?.includes('كور') || d.target_area_ar?.includes('بطن') || d.target_area_ar?.includes('عمود');
      if (selectedArea === 'CARDIO') matchArea = d.category === 'CARDIO_MODALITY' || d.target_area_ar?.includes('حرق') || d.target_area_ar?.includes('قلب');
      return matchTab && matchSearch && matchArea;
    });
  }, [drills, activeTab, searchTerm, selectedArea]);

  return (
    <AdminLayout>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '100%', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
        {/* 1. Header */}
        <PageHeader
          title="المرونة والاستشفاء والكارديو"
          subtitle="دليل حركات الإحماء والاستشفاء وتصحيح القوام وأنظمة الكارديو."
          actions={(
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 5px rgba(15, 23, 42, 0.2)'
              }}
            >
              <Plus size={14} />
              <span>إضافة حركة جديدة</span>
            </button>
          )}
        />

        {/* Exercise & Mobility Studio Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
          <Link
            to="/exercises"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              textDecoration: 'none',
              color: '#64748B',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.12s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <Dumbbell size={14} />
            <span>تمارين المقاومة والأجهزة</span>
          </Link>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              border: 'none',
              cursor: 'default',
              background: '#0F172A',
              color: '#FFFFFF',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HeartPulse size={14} />
            <span>بروتوكولات المرونة والتأهيل والاستشفاء ({drills.length})</span>
          </button>
        </div>

        {/* 2. Unified Control Bar (Tabs + Search + Sub-filters) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Primary Category Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
              {tabs.map((t) => {
                const Icon = t.icon;
                const isSel = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: isSel ? '#0F172A' : 'transparent',
                      color: isSel ? '#FFFFFF' : '#64748B',
                      boxShadow: isSel ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <Icon size={14} color={isSel ? '#FFFFFF' : '#64748B'} />
                    <span>{t.label}</span>
                    <span style={{
                      fontSize: '9px',
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: isSel ? '#FFFFFF' : '#64748B'
                    }}>
                      {t.shortcut}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: isSel ? '#FFFFFF' : '#475569'
                    }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Refresh & Search Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => {
                  fetchMobilityDrills();
                  showToast('تم تحديث مكتبة المرونة والكارديو');
                }}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#475569'; }}
                title="تحديث البيانات من الخادم (اختصار: R)"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>تحديث [R]</span>
              </button>

              {/* Search Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '0 10px',
                  height: '34px',
                  width: '260px',
                  gap: '6px'
                }}
              >
                <Search size={14} color="#94A3B8" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="بحث باسم الحركة أو الأداة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    width: '100%',
                    color: '#0F172A'
                  }}
                />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                    <X size={13} />
                  </button>
                ) : (
                  <span style={{ fontSize: '9.5px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', padding: '1px 5px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>/</span>
                )}
              </div>
            </div>
          </div>

          {/* Sub Filters Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>المستهدف:</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'كافة المناطق' },
                  { id: 'CARDIO', label: 'القلب وحرق الدهون' },
                  { id: 'SHOULDERS', label: 'الأكتاف' },
                  { id: 'HIPS', label: 'الحوض والقطنية' },
                  { id: 'KNEES', label: 'الركبة والكاحل' },
                  { id: 'CHEST', label: 'الصدر والظهر' },
                  { id: 'CORE', label: 'الكور والبطن' }
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedArea(a.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: selectedArea === a.id ? 800 : 600,
                      border: selectedArea === a.id ? '1px solid #0F172A' : '1px solid #CBD5E1',
                      background: selectedArea === a.id ? '#0F172A' : '#F8FAFC',
                      color: selectedArea === a.id ? '#FFFFFF' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
              عرض <strong style={{ color: '#0F172A' }}>{filteredDrills.length}</strong> حركة مطابقة
            </div>
          </div>
        </div>

        {/* 3. Spacious Standard Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
          {filteredDrills.map((drill) => {
            const isCardio = drill.category === 'CARDIO_MODALITY';
            const isWarmup = drill.category === 'DYNAMIC_WARMUP';
            const isStretch = drill.category === 'STATIC_STRETCH';
            const tagLabel = isCardio ? 'كارديو' : isWarmup ? 'إحماء ديناميكي' : isStretch ? 'إطالة ثابتة' : 'تصحيح قوام';
            return (
              <div
                key={drill.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <div>
                  {/* Balanced Executive Header: Title on Right (First to Read in RTL) & Badges on Left */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    {/* Drill Titles (Right Side in RTL) */}
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <h4 style={{ 
                        margin: '0 0 2px 0', 
                        fontSize: '14.5px', 
                        fontWeight: 800, 
                        color: '#0F172A', 
                        lineHeight: 1.25,
                        letterSpacing: '-0.01em',
                        wordBreak: 'break-word'
                      }}>
                        {drill.name_en || drill.name_ar}
                      </h4>
                      <div style={{ 
                        fontSize: '11.5px', 
                        color: '#64748B', 
                        fontWeight: 600, 
                        lineHeight: 1.3 
                      }}>
                        {drill.name_ar}
                      </div>
                    </div>

                    {/* Balanced Badges Cluster (Left Side in RTL) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                      flexShrink: 0
                    }}>
                      <span style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#0F172A',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Activity size={11} color="#0284C7" />
                        <span>{tagLabel}</span>
                      </span>

                      <span style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        <Dumbbell size={11} color="#475569" />
                        <span>{drill.equipment || 'وزن الجسم'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dual-State Accurate Exercise Preview (Start & Finish Positions) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '8px',
                    background: '#F8FAFC',
                    padding: '6px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <MobilityImageFrame
                      src={drill.image_stretch || drill.images?.[0] || `/exercises/${drill.id}/0.jpg`}
                      label="وضع البداية"
                      icon={Activity}
                    />
                    <MobilityImageFrame
                      src={drill.image_contraction || drill.images?.[1] || `/exercises/${drill.id}/1.jpg`}
                      label="وضع الانقباض"
                      icon={Activity}
                    />
                  </div>

                  {/* Technique Cue */}
                  {drill.cue_ar && (
                    <div style={{
                      background: '#F8FAFC',
                      borderRight: '3px solid #0F172A',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      color: '#334155',
                      lineHeight: 1.45,
                      marginBottom: '6px'
                    }}>
                      {drill.cue_ar}
                    </div>
                  )}
                </div>

                {/* Footer: Target & Quick Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>
                    {drill.target_area_ar}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(drill)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#0F172A',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                      title="تعديل بيانات وصور التمرين"
                    >
                      <Edit3 size={11} />
                      <span>تعديل</span>
                    </button>

                    {/* Copy Cue Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(drill.cue_ar, drill.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="نسخ التوجيه"
                    >
                      {copiedId === drill.id ? <Check size={11} color="#16A34A" /> : <Copy size={11} />}
                      <span>{copiedId === drill.id ? 'تم' : 'نسخ'}</span>
                    </button>

                    {/* Video Button */}
                    {drill.video_url && (
                      <button
                        type="button"
                        onClick={() => setActiveVideo(drill)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#0F172A',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Play size={10} fill="#FFFFFF" />
                        <span>فيديو</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Drill Modal */}
        {editingDrill && (
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
          }} dir="rtl">
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
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
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit3 size={14} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>تعديل بيانات وصور التمرين</h3>
                    <small style={{ fontSize: '11px', color: '#64748B' }}>تعديل الاسم، التوجيه الحركي، أو تغيير الصور من جهازك</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDrill(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Invariant Engine ID Banner */}
              <div style={{
                background: '#EFF6FF',
                borderBottom: '1px solid #DBEAFE',
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: '#1E40AF'
              }}>
                <Lock size={12} color="#1E40AF" />
                <span>
                  المعرف البرمجي للمحرك: <strong style={{ fontFamily: 'monospace', fontWeight: 800, background: '#DBEAFE', padding: '2px 6px', borderRadius: '8px' }}>{editingDrill.id}</strong> (محمي وثابت لضمان تطابق الخطط للمشتركين)
                </span>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEditedDrill} style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      الاسم بالإنجليزي
                    </label>
                    <input
                      type="text"
                      value={editFormData.name_en}
                      onChange={(e) => setEditFormData({ ...editFormData, name_en: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Category & Equipment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      القسم
                    </label>
                    <CurvedSelect
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="CARDIO_MODALITY">أنظمة الكارديو</option>
                      <option value="DYNAMIC_WARMUP">إحماء ومرونة ديناميكية</option>
                      <option value="STATIC_STRETCH">إطالة استشفائية ثابتة</option>
                      <option value="POSTURAL_PREHAB">تصحيح قوام</option>
                    </CurvedSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      الأداة / الجهاز
                    </label>
                    <input
                      type="text"
                      value={editFormData.equipment}
                      onChange={(e) => setEditFormData({ ...editFormData, equipment: e.target.value })}
                      style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Target Area */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    المنطقة المستهدفة والتأثير
                  </label>
                  <input
                    type="text"
                    value={editFormData.target_area_ar}
                    onChange={(e) => setEditFormData({ ...editFormData, target_area_ar: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Technique Cue */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    توجيه الأداء السليم (Coaching Cue)
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.cue_ar}
                    onChange={(e) => setEditFormData({ ...editFormData, cue_ar: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    رابط فيديو الشرح (YouTube أو فيديو مباشر)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFormData.video_url}
                    onChange={(e) => setEditFormData({ ...editFormData, video_url: e.target.value })}
                    style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Dual Image Thumbnails Settings & Preview */}
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {editFormData.image_stretch ? (
                          <img src={editFormData.image_stretch} alt="بداية" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          1. وضع البداية (0.jpg)
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
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
                        style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Image 2: Contraction Position */}
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                      <div style={{ height: '120px', background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {editFormData.image_contraction ? (
                          <img src={editFormData.image_contraction} alt="أداء" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>لا توجد صورة</span>
                        )}
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px' }}>
                          2. وضع الأداء (1.jpg)
                        </span>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#0F172A', color: '#FFFFFF', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
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
                        style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit & Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingDrill(null)}
                    style={{ padding: '8px 18px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditDrill}
                    style={{ padding: '8px 22px', borderRadius: '8px', background: '#0F172A', border: 'none', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingEditDrill ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Drill Modal */}
        {isAddModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>إضافة حركة كارديو / إطالة جديدة</h4>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>
              <form onSubmit={handleSaveNewDrill} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>الاسم بالعربي *</label>
                  <input type="text" required placeholder="مثال: قفز الحبل السريع" value={newDrillData.name_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, name_ar: e.target.value }))} style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>القسم</label>
                    <CurvedSelect value={newDrillData.category} onChange={(e) => setNewDrillData(prev => ({ ...prev, category: e.target.value }))} style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}>
                      <option value="CARDIO_MODALITY">أنظمة الكارديو</option>
                      <option value="DYNAMIC_WARMUP">إحماء ومرونة ديناميكية</option>
                      <option value="STATIC_STRETCH">إطالة استشفائية ثابتة</option>
                      <option value="POSTURAL_PREHAB">تصحيح قوام</option>
                    </CurvedSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>المنطقة المستهدفة</label>
                    <input type="text" placeholder="مثال: القلب وحرق الدهون" value={newDrillData.target_area_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, target_area_ar: e.target.value }))} style={{ width: '100%', height: '34px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>توجيه الأداء</label>
                  <textarea rows={2} placeholder="اكتب التوجيه الحركي باختصار..." value={newDrillData.cue_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, cue_ar: e.target.value }))} style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '6px 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '6px 14px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
                  <button type="submit" disabled={savingNewDrill} style={{ padding: '6px 18px', borderRadius: '8px', background: '#0F172A', border: 'none', color: '#FFFFFF', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>{savingNewDrill ? 'جاري الحفظ...' : 'حفظ'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {activeVideo && (
          <ExerciseVideoModal
            exercise={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        )}

        {/* Notification Toast */}
        {notification && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, zIndex: 99999 }}>
            {notification}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
