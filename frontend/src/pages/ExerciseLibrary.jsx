import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Search, 
  Play, 
  AlertTriangle, 
  Check, 
  X, 
  Layers,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../config/api';
import AdminLayout from '../components/layout/AdminLayout';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

export default function ExerciseLibrary() {
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleFilter, setMuscleFilter] = useState('ALL');
  const [equipmentFilter, setEquipmentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, []);

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
    { id: 'ALL', label: 'جميع العضلات' },
    { id: 'CHEST', label: 'عضلات الصدر' },
    { id: 'BACK', label: 'الظهر والترابيس' },
    { id: 'LEGS', label: 'الأرجل والأرداف' },
    { id: 'CALVES', label: 'السمانة وقصبة الساق' },
    { id: 'SHOULDERS', label: 'الأكتاف' },
    { id: 'ARMS', label: 'الذراعين والساعد' },
    { id: 'CORE', label: 'البطن والكور' },
  ];

  const exercises = allExercises.filter(ex => {
    const matchMuscle = muscleFilter === 'ALL' || ex.muscle_group === muscleFilter;
    const matchEquipment = equipmentFilter === 'ALL' || ex.equipment === equipmentFilter;
    const matchSearch = !searchTerm.trim() || 
      ex.name_ar?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      ex.name_en?.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchMuscle && matchEquipment && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="مكتبة التمارين والفيديوهات الرياضية"
          description="استعراض شروحات التكنيك السليم للتمارين الرياضية، العضلات المستهدفة، وتجنب الإصابات."
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>الأداة:</span>
              <select 
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                style={{ height: '34px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '11.5px', fontWeight: 700, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
              >
                <option value="ALL">جميع الأدوات</option>
                <option value="BARBELL">بار أولمبي</option>
                <option value="DUMBBELL">دمبلز</option>
                <option value="CABLE">كابلات</option>
                <option value="MACHINE">أجهزة</option>
                <option value="BODYWEIGHT">وزن الجسم</option>
              </select>
            </div>
          )}
        />

        {/* 2. Muscle Selector & Search Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Muscle Pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            {muscleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMuscleFilter(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: muscleFilter === cat.id ? '#0F172A' : 'transparent',
                  color: muscleFilter === cat.id ? '#FFFFFF' : '#64748B',
                  boxShadow: muscleFilter === cat.id ? '0 2px 5px rgba(15, 23, 42, 0.25)' : 'none',
                  transition: 'background 0.12s ease, color 0.12s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '0 8px',
              height: '34px',
              width: '240px',
              gap: '6px'
            }}
          >
            <Search size={13} color="#94A3B8" />
            <input
              type="text"
              placeholder="بحث باسم التمرين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '11.5px',
                width: '100%',
                color: '#0F172A'
              }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 3. Compact Exercise Cards Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            جاري استرجاع قائمة التمارين والتكنيك...
          </div>
        ) : exercises.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
              <Dumbbell size={18} />
            </div>
            <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '2px' }}>لا توجد تمارين مطابقة</strong>
            <small style={{ fontSize: '11.5px', color: '#64748B' }}>جرب تغيير العضلة أو الأداة أو البحث عن كلمة أخرى.</small>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {exercises.map((ex) => (
              <div 
                key={ex.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  {/* Card Header & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '1px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                      {ex.muscle_ar}
                    </span>
                    <span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '1px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 600 }}>
                      {ex.equipment_ar}
                    </span>
                  </div>

                  {/* Exercise Title */}
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                    {ex.name_en}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '10px' }}>
                    {ex.name_ar}
                  </div>

                  {/* Coaching Cues Box */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRight: '3px solid #0F172A', padding: '8px 10px', borderRadius: '6px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <Check size={11} />
                      <span>التكنيك السليم للأداء:</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#334155', lineHeight: 1.4 }}>
                      {ex.cues_ar}
                    </p>
                  </div>

                  {/* Mistakes Box */}
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRight: '3px solid #D97706', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <AlertTriangle size={11} />
                      <span>أخطاء شائعة لتجنب الإصابة:</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#78350F', lineHeight: 1.4 }}>
                      {ex.mistakes_ar}
                    </p>
                  </div>
                </div>

                {/* Footer Video Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    onClick={() => setActiveVideo(ex)}
                    style={{
                      height: '30px',
                      padding: '0 12px',
                      borderRadius: '5px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 5px rgba(15, 23, 42, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                  >
                    <Play size={11} />
                    <span>مشاهدة الفيديو التوضيحي</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Video Modal */}
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
