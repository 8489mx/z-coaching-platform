import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Search,
  Plus,
  X,
  Play,
  Copy,
  Check,
  RotateCw,
  Flame,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { PageHeader } from '@/shared/components/page-header';
import defaultMobilityCatalog from '../data/mobilityCatalog.json';

export default function MobilityLibrary() {
  const [drills, setDrills] = useState(defaultMobilityCatalog || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('CARDIO_MODALITY');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [notification, setNotification] = useState(null);

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

  useEffect(() => {
    fetchMobilityDrills();
  }, []);

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
    { id: 'CARDIO_MODALITY', label: 'أنظمة الكارديو', icon: Flame, count: drills.filter(d => d.category === 'CARDIO_MODALITY').length },
    { id: 'DYNAMIC_WARMUP', label: 'الإحماء والمرونة', icon: RotateCw, count: drills.filter(d => d.category === 'DYNAMIC_WARMUP').length },
    { id: 'STATIC_STRETCH', label: 'الإطالات والاستشفاء', icon: HeartPulse, count: drills.filter(d => d.category === 'STATIC_STRETCH').length },
    { id: 'POSTURAL_PREHAB', label: 'تصحيح القوام', icon: ShieldCheck, count: drills.filter(d => d.category === 'POSTURAL_PREHAB').length },
    { id: 'ALL', label: 'الكل', icon: Layers, count: drills.length },
  ];

  const filteredDrills = useMemo(() => {
    return drills.filter(d => {
      const matchTab = activeTab === 'ALL' || d.category === activeTab;
      const matchSearch = !searchTerm ||
        (d.name_ar && d.name_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.name_en && d.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.target_area_ar && d.target_area_ar.includes(searchTerm)) ||
        (d.cue_ar && d.cue_ar.includes(searchTerm));
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
          title="مكتبة الكارديو والإطالات"
          subtitle="دليل أجهزة وأنظمة الكارديو وحركات الإحماء والاستشفاء"
          actions={(
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                height: '34px',
                padding: '0 14px',
                borderRadius: '6px',
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

        {/* 2. Unified Control Bar (Tabs + Search + Sub-filters) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Primary Category Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
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
                      borderRadius: '6px',
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
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: isSel ? '#FFFFFF' : '#475569'
                    }}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '0 10px',
                height: '34px',
                width: '260px',
                gap: '6px'
              }}
            >
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="بحث باسم التمرين أو الأداة..."
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
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                  <X size={13} />
                </button>
              )}
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
                      padding: '3px 9px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: selectedArea === a.id ? 800 : 600,
                      border: selectedArea === a.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
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
                  borderRadius: '10px',
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
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#0F172A',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {tagLabel}
                    </span>
                    <span style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#64748B',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600
                    }}>
                      {drill.equipment || 'وزن الجسم'}
                    </span>
                  </div>

                  {/* Titles */}
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 800, color: '#0F172A', lineHeight: 1.35 }}>
                    {drill.name_ar}
                  </h4>
                  {drill.name_en && (
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>
                      {drill.name_en}
                    </div>
                  )}

                  {/* Technique Cue */}
                  {drill.cue_ar && (
                    <div style={{
                      background: '#F8FAFC',
                      borderRight: '3px solid #0F172A',
                      padding: '8px 10px',
                      borderRadius: '6px',
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
                    <button
                      type="button"
                      onClick={() => handleCopy(drill.cue_ar, drill.id)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
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
                    {drill.video_url && (
                      <button
                        type="button"
                        onClick={() => setActiveVideo({ url: drill.video_url, name: drill.name_ar })}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '4px',
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

        {/* Add Drill Modal */}
        {isAddModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '460px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة حركة كارديو / إطالة جديدة</h4>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>
              <form onSubmit={handleSaveNewDrill} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>الاسم بالعربي *</label>
                  <input type="text" required placeholder="مثال: قفز الحبل السريع" value={newDrillData.name_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, name_ar: e.target.value }))} style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>القسم</label>
                    <select value={newDrillData.category} onChange={(e) => setNewDrillData(prev => ({ ...prev, category: e.target.value }))} style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}>
                      <option value="CARDIO_MODALITY">أنظمة الكارديو</option>
                      <option value="DYNAMIC_WARMUP">إحماء ومرونة ديناميكية</option>
                      <option value="STATIC_STRETCH">إطالة استشفائية ثابتة</option>
                      <option value="POSTURAL_PREHAB">تصحيح قوام</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>المنطقة المستهدفة</label>
                    <input type="text" placeholder="مثال: القلب وحرق الدهون" value={newDrillData.target_area_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, target_area_ar: e.target.value }))} style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>توجيه الأداء</label>
                  <textarea rows={2} placeholder="اكتب التوجيه الحركي باختصار..." value={newDrillData.cue_ar} onChange={(e) => setNewDrillData(prev => ({ ...prev, cue_ar: e.target.value }))} style={{ width: '100%', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '5px 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '5px 10px', borderRadius: '5px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
                  <button type="submit" disabled={savingNewDrill} style={{ padding: '5px 14px', borderRadius: '5px', background: '#0F172A', border: 'none', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{savingNewDrill ? 'جاري الحفظ...' : 'حفظ'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {activeVideo && (
          <ExerciseVideoModal isOpen={!!activeVideo} onClose={() => setActiveVideo(null)} videoUrl={activeVideo.url} exerciseName={activeVideo.name} />
        )}

        {/* Notification Toast */}
        {notification && (
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, zIndex: 99999 }}>
            {notification}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}