import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  MessageCircle, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Scale, 
  Utensils, 
  Activity, 
  BrainCircuit, 
  Save, 
  Loader2, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Phone,
  Search,
  ArrowRight,
  UserCheck,
  Flame,
  Moon,
  HeartPulse,
  RotateCcw,
  Target,
  Clock,
  Filter,
  Check
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { PageHeader } from '@/shared/components/page-header';
import { FormSection } from '@/shared/components/form-section';

// 10 Realistic Multi-Client Mock Check-ins (Scalable Queue)
const INITIAL_CHECKINS = [
  {
    id: 'CHK_104_W4',
    client: {
      id: 'CL_104',
      name: 'أحمد محمود العوضي',
      code: '104',
      package: 'MAX',
      phone: '01018017523',
      country: { name: 'مصر' },
      target_goal: 'تنشيف وبناء كتلة عضلية صافية'
    },
    week_number: 4,
    submission_date: 'اليوم، 09:30 ص',
    metrics: {
      previous_weight: 85.0,
      current_weight: 84.1,
      weight_change: -0.9,
      waist_previous: 87.5,
      waist_current: 86.5,
      waist_change: -1.0,
      adherence: 95,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 10400
    },
    biofeedback: {
      energy: 8,
      sleep: 7.5,
      hunger: 7,
      recovery: 8.5,
      digestion: 'ممتاز وطبيعي'
    },
    client_notes: 'الأسبوع كان ممتاز جداً والأوزان في التمرين زادت (وصلت 90 كجم بنش بريس)، بس حسيت بجوع خفيف بعد تمرين الخميس والجمعة بالليل، وشرب المياه كان حوالي 3.5 لتر يومياً.',
    ai_analysis: {
      recommendation: 'نزول مثالي بمعدل 0.9 كجم (في نطاق 1% من وزن الجسم). للحفاظ على الكتلة العضلية والتحكم في الجوع الليلي بعد أيام التمرين العالي، ينصح بتثبيت السعرات عند 2,150 سعرة مع زيادة الكارب المعقد بمقدار 20g حول توقيت التمرين.',
      status_badge: 'استجابة أيضية ممتازة',
      warning: 'تنبيه سريري: المشترك أبلغ عن جوع ليلي؛ ينصح بتأخير موعد وجبة العشاء الغنية بالبروتين البطيء.'
    },
    baseline_macros: {
      calories: 2150,
      protein: 175,
      carbs: 210,
      fats: 55
    },
    suggested_reply: 'عاش يا أحمد! أداء بطولي الأسبوع ده ونزول 0.9 كجم مع زيادة الأوزان في التمرين دي علامة ممتازة إننا بنحرق دهون وبنبني عضل. بخصوص الجوع بعد التمرين؛ رحلتلك 20 جم كارب لوجبة بعد التمرين وثبتلك السعرات عشان تحافظ على نفس الحرق العالي. كمل بنفس القوة يا بطل!'
  },
  {
    id: 'CHK_001_W2',
    client: {
      id: 'CL_001',
      name: 'مازن الشناوي',
      code: '1',
      package: 'ELITE',
      phone: '0101184157',
      country: { name: 'مصر' },
      target_goal: 'إعادة تشكيل الجسم (Body Recomp)'
    },
    week_number: 2,
    submission_date: 'اليوم، 11:15 ص',
    metrics: {
      previous_weight: 78.8,
      current_weight: 78.4,
      weight_change: -0.4,
      waist_previous: 83.5,
      waist_current: 83.0,
      waist_change: -0.5,
      adherence: 88,
      workouts_completed: 3,
      workouts_target: 4,
      daily_steps_avg: 8200
    },
    biofeedback: {
      energy: 7,
      sleep: 6,
      hunger: 4,
      recovery: 7,
      digestion: 'جيد مع انتفاخ بسيط'
    },
    client_notes: 'ملتزم بالوجبات تماماً وشهيتي مظبوطة، بس ضغط الشغل خلاني فوت تمرين يوم الثلاثاء ونومي كان متقطع 5 ساعات بس كل يوم.',
    ai_analysis: {
      recommendation: 'معدل النزول متوازن (-0.4 كجم)، ومعدل الشبع مستقر. التحدي الأساسي هو جودة النوم واستمرارية تمرين الأرجل. ينصح بتثبيت السعرات الحالية والتركيز على تنظيم أوقات النوم ومغنيسيوم جلايسينات.',
      status_badge: 'توازن واستقرار',
      warning: 'تنبيه: قلة النوم (6/10) قد ترفع هرمون الكورتيزول وتؤخر استشفاء العضلات.'
    },
    baseline_macros: {
      calories: 1950,
      protein: 160,
      carbs: 180,
      fats: 50
    },
    suggested_reply: 'أهلاً يا مازن، نزول 400 جم والتزامك بالأكل ممتاز جداً. اللي محتاجين نركز عليه الأسبوع ده هو النوم وتثبيت 4 أيام التمرين بدون غياب. الخطة مستمرة على نفس الماكروز وهنتابع تطور محيط الخصر الأسبوع القادم!'
  },
  {
    id: 'CHK_016_W6',
    client: {
      id: 'CL_016',
      name: 'ميزون الألفي',
      code: '16',
      package: 'MAX',
      phone: '01099887766',
      country: { name: 'مصر' },
      target_goal: 'خسارة دهون الحوض والبطن'
    },
    week_number: 6,
    submission_date: 'أمس، 08:45 م',
    metrics: {
      previous_weight: 68.2,
      current_weight: 68.2,
      weight_change: 0.0,
      waist_previous: 73.5,
      waist_current: 72.0,
      waist_change: -1.5,
      adherence: 98,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 11600
    },
    biofeedback: {
      energy: 9,
      sleep: 8.5,
      hunger: 5,
      recovery: 9,
      digestion: 'ممتاز جداً'
    },
    client_notes: 'الميزان ثابت بقاله أسبوعين بس اللبس وسع جداً وشكل البطن والوسط فرق كتير وواضح في الصور ومقاس الخصر نزل سم ونص كاملين!',
    ai_analysis: {
      recommendation: 'إعادة تشكيل جسم نموذجية (Body Recomposition): ثبات الوزن ناتج عن بناء نسيج عضلي مع خسارة دهون ملحوظة (نزول 1.5 سم محيط خصر). يُوصى بعدم خفض السعرات لتجنب إبطاء الحرق والاستمرار على الخطة.',
      status_badge: 'إعادة تشكيل مثالية',
      warning: 'ملاحظة سريرية: لا تقم بخفض السعرات؛ القياسات المترية تؤكد استمرار خسارة الدهون الصافية.'
    },
    baseline_macros: {
      calories: 1750,
      protein: 140,
      carbs: 165,
      fats: 45
    },
    suggested_reply: 'عاش يا ميزون! متقلقيش خالص من ثبات الميزان؛ نزول 1.5 سم في محيط الخصر مع وسع اللبس ده دليل قاطع إنك بتبني عضل صافي وبتحرقي دهون في نفس الوقت. هنفضل على نفس السعرات عشان نحافظ على معدل حرقك العالي. استمري بنفس الحماس!'
  },
  {
    id: 'CHK_088_W3',
    client: {
      id: 'CL_088',
      name: 'عمر خالد السعيد',
      code: '88',
      package: 'MAX',
      phone: '01122334455',
      country: { name: 'مصر' },
      target_goal: 'تنشيف سريع مع الحفاظ على القوة'
    },
    week_number: 3,
    submission_date: 'أمس، 06:10 م',
    metrics: {
      previous_weight: 92.4,
      current_weight: 91.2,
      weight_change: -1.2,
      waist_previous: 95.0,
      waist_current: 93.8,
      waist_change: -1.2,
      adherence: 92,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 12000
    },
    biofeedback: {
      energy: 6.5,
      sleep: 7,
      hunger: 8,
      recovery: 7.5,
      digestion: 'طبيعي'
    },
    client_notes: 'النزول سريع ومبسوط جداً بالنتيجة، بس طاقتي في آخر جولات التمرين كانت بتقل شوية وحاسس بإرهاق عام.',
    ai_analysis: {
      recommendation: 'نزول متسارع (-1.2 كجم). لتفادي هبوط الطاقة والإجهاد العصبي، ينصح بإضافة وجبة إعادة تغذية (Refeed) بزيادة 50g كارب في يوم تمرين الأرجل.',
      status_badge: 'نزول سريع يتطلب تدعيم',
      warning: 'تنبيه: معدل الجوع 8/10 يستدعي زيادة الألياف والكارب البطيء لتجنب الشراهة.'
    },
    baseline_macros: {
      calories: 2200,
      protein: 185,
      carbs: 220,
      fats: 60
    },
    suggested_reply: 'ألف مبروك النزول القوي يا عمر، نزول 1.2 كجم في أسبوع ده إنجاز ممتاز! عشان نحافظ على طاقتك في الجيم، ضفتلك وجبة ريفيد كارب يوم تمرين الأرجل عشان نشحن الجليكوجين. استمر يا وحش!'
  },
  {
    id: 'CHK_042_W5',
    client: {
      id: 'CL_042',
      name: 'ياسمين عبد الرحمن',
      code: '42',
      package: 'ELITE',
      phone: '01233445566',
      country: { name: 'مصر' },
      target_goal: 'شد ونحت القوام وزيادة اللياقة'
    },
    week_number: 5,
    submission_date: 'اليوم، 08:00 ص',
    metrics: {
      previous_weight: 64.5,
      current_weight: 63.9,
      weight_change: -0.6,
      waist_previous: 70.0,
      waist_current: 69.2,
      waist_change: -0.8,
      adherence: 96,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 9800
    },
    biofeedback: {
      energy: 8.5,
      sleep: 8,
      hunger: 5,
      recovery: 8,
      digestion: 'ممتاز'
    },
    client_notes: 'ملتزمة بكل تفاصيل الدايت والتمرين ومرتاحة جداً مع المواعيد الجديدة، شكراً كوتش على المتابعة.',
    ai_analysis: {
      recommendation: 'استجابة فيسيولوجية مثالية ومعدل نزول صحي 600 جم مع ثبات الطاقة والنوم. الاستمرار على نفس الخطة الحالية بدون تعديل.',
      status_badge: 'تطور منتظم ومثالي',
      warning: null
    },
    baseline_macros: {
      calories: 1650,
      protein: 130,
      carbs: 155,
      fats: 42
    },
    suggested_reply: 'ممتازة جداً يا ياسمين! التزامك 96% ونزول 600 جم مع هبوط محيط الخصر دي النتيجة النموذجية اللي بندور عليها. خطتنا ماشية بالساعة ومكملين على نفس الأرقام الأسبوع ده!'
  },
  {
    id: 'CHK_019_W8',
    client: {
      id: 'CL_019',
      name: 'كريم الدسوقي',
      code: '19',
      package: 'MAX',
      phone: '01055667788',
      country: { name: 'مصر' },
      target_goal: 'كسر ثبات الوزن واستكمال التنشيف'
    },
    week_number: 8,
    submission_date: 'أمس، 10:20 م',
    metrics: {
      previous_weight: 81.5,
      current_weight: 80.7,
      weight_change: -0.8,
      waist_previous: 85.0,
      waist_current: 84.0,
      waist_change: -1.0,
      adherence: 90,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 11000
    },
    biofeedback: {
      energy: 8,
      sleep: 7,
      hunger: 6,
      recovery: 7.5,
      digestion: 'جيد'
    },
    client_notes: 'بعد تعديل الكارب الأسبوع اللي فات الميزان نزل 800 جم بعد ثبات أسبوعين، والتمرين كان قوي جداً.',
    ai_analysis: {
      recommendation: 'تم كسر مرحلة الثبات بنجاح بعد إعادة تدوير الكاربوهيدرات. ينصح بتثبيت السعرات الحالية لمدة أسبوعين إضافيين قبل أي خفض جديد.',
      status_badge: 'كسر ثبات ناجح',
      warning: null
    },
    baseline_macros: {
      calories: 2050,
      protein: 170,
      carbs: 200,
      fats: 50
    },
    suggested_reply: 'عاش يا كريم، كسرنا الثبات ونزلنا 800 جم زي ما خططنا تماماً. هنثبت على الأرقام دي الأسبوع الحالي عشان نضمن استمرار النزول بدون التأثير على الكتلة العضلية.'
  },
  {
    id: 'CHK_055_W1',
    client: {
      id: 'CL_055',
      name: 'مصطفى كامل رضوان',
      code: '55',
      package: 'ELITE',
      phone: '01199881122',
      country: { name: 'مصر' },
      target_goal: 'بداية برنامج خسارة دهون وتحسين اللياقة'
    },
    week_number: 1,
    submission_date: 'اليوم، 12:00 م',
    metrics: {
      previous_weight: 98.0,
      current_weight: 96.5,
      weight_change: -1.5,
      waist_previous: 102.0,
      waist_current: 100.5,
      waist_change: -1.5,
      adherence: 100,
      workouts_completed: 4,
      workouts_target: 4,
      daily_steps_avg: 9000
    },
    biofeedback: {
      energy: 8,
      sleep: 8,
      hunger: 5,
      recovery: 7,
      digestion: 'ممتاز'
    },
    client_notes: 'أول أسبوع عدى بسلاسة والتزمت بالجرامات بالحرف وحاسس بخفة وطاقة أفضل بكتير.',
    ai_analysis: {
      recommendation: 'نزول أسبوع أول ممتاز يتضمن سوائل محتبسة وبداية تفريغ دهون. الالتزام 100%. الاستمرار على نفس الخطة لاختبار معدل الحرق الحقيقي للأسبوع الثاني.',
      status_badge: 'انطلاقة قوية للأسبوع الأول',
      warning: null
    },
    baseline_macros: {
      calories: 2300,
      protein: 190,
      carbs: 230,
      fats: 65
    },
    suggested_reply: 'بداية ولا أروع يا درش! نزول 1.5 كجم في أول أسبوع والتزام 100% دي بداية البطل. مكملين بنفس الخطة عشان نثبت النتايج وندخل في حرق الدهون الصافي الأسبوع الجاي!'
  },
  {
    id: 'CHK_073_W4',
    client: {
      id: 'CL_073',
      name: 'نوران حسام الدين',
      code: '73',
      package: 'MAX',
      phone: '01044332211',
      country: { name: 'مصر' },
      target_goal: 'تنشيف دهون عامة مع مراعاة إصابة الركبة'
    },
    week_number: 4,
    submission_date: 'اليوم، 10:45 ص',
    metrics: {
      previous_weight: 71.0,
      current_weight: 70.5,
      weight_change: -0.5,
      waist_previous: 76.0,
      waist_current: 75.2,
      waist_change: -0.8,
      adherence: 94,
      workouts_completed: 3,
      workouts_target: 4,
      daily_steps_avg: 8500
    },
    biofeedback: {
      energy: 7.5,
      sleep: 7,
      hunger: 4,
      recovery: 7,
      digestion: 'طبيعي'
    },
    client_notes: 'الدايت ممتاز بس حسيت بوجع خفيف في صابونة الركبة الشمال في تمرين السكوات يوم الأربعاء، فبدلت السكوات بجهاز الليج بريس.',
    ai_analysis: {
      recommendation: 'نزول 0.5 كجم مستقر. ينصح باستبدال السكوات الحر بتمارين السلسلة المغلقة وتفادي الزوايا الحادة، مع الاستمرار على نفس السعرات.',
      status_badge: 'تنبيه أمان ميكانيكي',
      warning: 'تنبيه إصابة: إجهاد بالركبة اليسرى؛ ينصح باستبعاد الـ Barbell Squats وتفعيل تمارين الثبات.'
    },
    baseline_macros: {
      calories: 1700,
      protein: 135,
      carbs: 160,
      fats: 45
    },
    suggested_reply: 'عاش يا نوران على النزول، وتصرفك بتعديل السكوات كان صح جداً. عدلتلك جدول التمرين للأسبوع القادم باستبعاد السكوات الحر والتركيز على Leg Press بزاوية مريحة للركبة مع الحفاظ على الدايت بدون تغيير.'
  }
];

export default function CheckinReviewDashboard() {
  const navigate = useNavigate();
  const [checkinList, setCheckinList] = useState(INITIAL_CHECKINS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL | MAX | ELITE
  const [macroAdjustments, setMacroAdjustments] = useState(INITIAL_CHECKINS[0].baseline_macros);
  const [coachReply, setCoachReply] = useState(INITIAL_CHECKINS[0].suggested_reply);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);

  // Filtered Queue for search and tier
  const filteredQueue = checkinList.filter((item) => {
    if (tierFilter === 'MAX' && !item.client.package.toUpperCase().includes('MAX')) return false;
    if (tierFilter === 'ELITE' && !item.client.package.toUpperCase().includes('ELITE')) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase().replace(/^#+/, '');
    return (
      item.client.name.toLowerCase().includes(q) ||
      String(item.client.code).includes(q) ||
      item.client.phone.includes(q)
    );
  });

  const activeCheckin = filteredQueue[selectedIdx] || filteredQueue[0] || checkinList[0];

  // Sync state when switching clients
  useEffect(() => {
    if (activeCheckin) {
      setMacroAdjustments(activeCheckin.baseline_macros);
      setCoachReply(activeCheckin.suggested_reply);
    }
  }, [activeCheckin]);

  // Global Escape key handler to return
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleApprove = async () => {
    if (!activeCheckin) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const approvedClientName = activeCheckin.client.name;
      const clientPhone = activeCheckin.client.phone;
      const replyMsg = coachReply;

      // Remove approved client from queue
      const remaining = checkinList.filter(item => item.id !== activeCheckin.id);
      setCheckinList(remaining);
      setApprovedCount(prev => prev + 1);

      if (selectedIdx >= remaining.length && remaining.length > 0) {
        setSelectedIdx(remaining.length - 1);
      }

      // Quick WhatsApp Option
      const shouldOpenWhatsApp = window.confirm(
        `تم اعتماد تحديث تقييم (${approvedClientName}) بنجاح وتحديث خطته في التطبيق!\n\nهل تريد فتح واتساب لإرسال رسالة التوجيه للمتدرب الآن؟`
      );

      if (shouldOpenWhatsApp && clientPhone) {
        let cleanPhone = clientPhone.replace(/\D/g, '');
        if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyMsg)}`, '_blank');
      }
    }, 300);
  };

  const handleResetDemo = () => {
    setCheckinList(INITIAL_CHECKINS);
    setSelectedIdx(0);
    setSearchQuery('');
    setTierFilter('ALL');
    setApprovedCount(0);
  };

  const handleOpenDirectWhatsApp = () => {
    if (!activeCheckin?.client?.phone) return;
    let cleanPhone = activeCheckin.client.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(coachReply)}`, '_blank');
  };

  const isMaxTier = activeCheckin?.client?.package?.toUpperCase().includes('MAX');

  return (
    <AdminLayout>
      <div className="page-stack" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 1. Page Header */}
        <PageHeader
          title="مراجعة التقييمات الدورية (Check-in Review)"
          description={`طابور اتخاذ القرارات الأسبوعية • ${checkinList.length} تقييم بانتظار المراجعة والاعتماد`}
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={handleResetDemo}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '6px',
                  background: '#F8FAFC',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
                title="إعادة ضبط قائمة التقييمات"
              >
                <RotateCcw size={13} />
                <span>إعادة ضبط القائمة</span>
              </button>

              <button 
                type="button" 
                onClick={() => navigate('/')}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={14} />
                <span>لوحة القيادة (Esc)</span>
              </button>
            </div>
          )}
        />

        {/* 2. Scalable Master-Detail Architecture (Queue Sidebar on Right / Workspace on Left) */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          
          {/* =========================================================================
              RIGHT SIDEBAR: The Client Queue (Scales up to 20-50 clients effortlessly)
              ========================================================================= */}
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '10px', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)'
          }}>
            {/* Queue Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '3px', height: '14px', background: '#0F172A', borderRadius: '2px', display: 'inline-block' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                    طابور المشتركين ({filteredQueue.length})
                  </strong>
                </div>
                <span style={{ fontSize: '11px', background: '#0F172A', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  معلق
                </span>
              </div>

              {/* Search Bar in Queue */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={13} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الكود..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIdx(0);
                  }}
                  style={{
                    width: '100%',
                    height: '30px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    padding: '0 28px 0 8px',
                    fontSize: '11px',
                    outline: 'none',
                    background: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'MAX', label: 'MAX' },
                  { id: 'ELITE', label: 'ELITE' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTierFilter(t.id);
                      setSelectedIdx(0);
                    }}
                    style={{
                      height: '24px',
                      borderRadius: '4px',
                      border: tierFilter === t.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      background: tierFilter === t.id ? '#0F172A' : '#FFFFFF',
                      color: tierFilter === t.id ? '#FFFFFF' : '#475569',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Queue Items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredQueue.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748B', fontSize: '11.5px' }}>
                  لا يوجد متدرب مطابق للبحث
                </div>
              ) : (
                filteredQueue.map((item, idx) => {
                  const isSelected = item.id === activeCheckin.id;
                  const isMax = item.client.package.toUpperCase().includes('MAX');
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIdx(idx)}
                      style={{
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid #0F172A' : '1px solid #F1F5F9',
                        background: isSelected ? '#FFFFFF' : '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {/* Row 1: Code, Name, Package */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontWeight: 800, 
                            fontSize: '10.5px', 
                            background: '#F0F9FF', 
                            border: '1px solid #BAE6FD', 
                            color: '#0284C7', 
                            padding: '1px 6px', 
                            borderRadius: '4px' 
                          }}>
                            #{item.client.code}
                          </span>
                          <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>
                            {item.client.name}
                          </strong>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: isMax ? '#C4952D' : '#0284C7',
                          background: '#FFFFFF',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid #E2E8F0',
                          fontFamily: 'JetBrains Mono, sans-serif'
                        }}>
                          {item.client.package}
                        </span>
                      </div>

                      {/* Row 2: Metrics Strip */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#475569', background: isSelected ? '#F8FAFC' : '#FFFFFF', padding: '4px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, Cairo', fontWeight: 700, color: '#0F172A' }}>
                          {item.metrics.current_weight} كجم
                        </span>

                        <span style={{ 
                          fontFamily: 'JetBrains Mono, Cairo', 
                          fontWeight: 800, 
                          color: item.metrics.weight_change < 0 ? '#16A34A' : (item.metrics.weight_change === 0 ? '#0284C7' : '#DC2626')
                        }}>
                          {item.metrics.weight_change < 0 ? '-' : (item.metrics.weight_change === 0 ? '' : '+')}
                          {Math.abs(item.metrics.weight_change)} كجم
                        </span>

                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                          الأسبوع {item.week_number}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================================
              LEFT WORKSPACE: The Active Client Assessment & Decision Panel
              ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Header Identity Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', padding: '2px 8px', borderRadius: '4px' }}>
                  #{activeCheckin.client.code}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                    {activeCheckin.client.name}
                  </h4>
                  <small style={{ fontSize: '11px', color: '#64748B' }}>
                    الهدف: {activeCheckin.client.target_goal} • إرسال: {activeCheckin.submission_date}
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: isMaxTier ? '#C4952D' : '#0284C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontFamily: 'JetBrains Mono, sans-serif' }}>
                  {activeCheckin.client.package}
                </span>
                <span style={{ fontSize: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  الأسبوع {activeCheckin.week_number}
                </span>
              </div>
            </div>

            {/* Numeric & Vital Indicators */}
            <FormSection
              title="المؤشرات الرقمية والقياسات الحيوية"
              description="تطور الوزن ومحيط الخصر ومعدل الالتزام مقارنة بالأسبوع الماضي."
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                
                {/* Current Weight */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>الوزن الحالي</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {activeCheckin.metrics.current_weight} <span style={{ fontSize: '11px', fontWeight: 600 }}>كجم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    السابق: {activeCheckin.metrics.previous_weight} كجم
                  </small>
                </div>

                {/* Weight Delta */}
                <div style={{ 
                  background: activeCheckin.metrics.weight_change < 0 ? '#F0FDF4' : (activeCheckin.metrics.weight_change === 0 ? '#F8FAFC' : '#FEF2F2'), 
                  border: activeCheckin.metrics.weight_change < 0 ? '1px solid #BBF7D0' : (activeCheckin.metrics.weight_change === 0 ? '1px solid #E2E8F0' : '1px solid #FECACA'), 
                  padding: '10px 12px', 
                  borderRadius: '8px' 
                }}>
                  <span style={{ fontSize: '11px', color: activeCheckin.metrics.weight_change < 0 ? '#166534' : '#475569', display: 'block', marginBottom: '2px' }}>فرق الوزن (Δ)</span>
                  <strong style={{ 
                    fontSize: '17px', 
                    color: activeCheckin.metrics.weight_change < 0 ? '#16A34A' : (activeCheckin.metrics.weight_change === 0 ? '#0284C7' : '#DC2626'), 
                    fontFamily: 'JetBrains Mono, Cairo', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '2px' 
                  }}>
                    {activeCheckin.metrics.weight_change < 0 ? <TrendingDown size={16} /> : (activeCheckin.metrics.weight_change === 0 ? <Minus size={16} /> : <TrendingUp size={16} />)}
                    <span dir="ltr">{activeCheckin.metrics.weight_change > 0 ? `+${activeCheckin.metrics.weight_change}` : activeCheckin.metrics.weight_change} كجم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                    {activeCheckin.metrics.weight_change < 0 ? 'نزول صحي ممتاز' : (activeCheckin.metrics.weight_change === 0 ? 'ثبات متوازن' : 'زيادة في الوزن')}
                  </small>
                </div>

                {/* Waist Metric */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>محيط الخصر</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {activeCheckin.metrics.waist_current} <span style={{ fontSize: '11px', fontWeight: 600 }}>سم</span>
                  </strong>
                  <small style={{ fontSize: '10px', color: '#16A34A', display: 'block', marginTop: '2px', fontWeight: 700 }}>
                    {activeCheckin.metrics.waist_change} سم فرق مقاس
                  </small>
                </div>

                {/* Adherence */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>الالتزام والتمارين</span>
                  <strong style={{ fontSize: '17px', color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>
                    {activeCheckin.metrics.adherence}%
                  </strong>
                  <small style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                    {activeCheckin.metrics.workouts_completed} من {activeCheckin.metrics.workouts_target} تمارين
                  </small>
                </div>
              </div>

              {/* Biofeedback Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>الطاقة:</span>
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>{activeCheckin.biofeedback.energy} / 10</strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>النوم:</span>
                  <strong style={{ fontSize: '11.5px', color: '#0F172A' }}>{activeCheckin.biofeedback.sleep} / 10</strong>
                </div>

                <div style={{ 
                  background: activeCheckin.biofeedback.hunger > 6 ? '#FFFBEB' : '#F8FAFC', 
                  border: activeCheckin.biofeedback.hunger > 6 ? '1px solid #FDE68A' : '1px solid #E2E8F0', 
                  padding: '8px 10px', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '11px', color: activeCheckin.biofeedback.hunger > 6 ? '#B45309' : '#475569' }}>الجوع:</span>
                  <strong style={{ fontSize: '11.5px', color: activeCheckin.biofeedback.hunger > 6 ? '#B45309' : '#0F172A' }}>
                    {activeCheckin.biofeedback.hunger} / 10 {activeCheckin.biofeedback.hunger > 6 ? '(مرتفع)' : ''}
                  </strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569' }}>الخطوات:</span>
                  <strong style={{ fontSize: '11.5px', color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
                    {activeCheckin.metrics.daily_steps_avg.toLocaleString()}
                  </strong>
                </div>
              </div>
            </FormSection>

            {/* Photos & Notes */}
            <FormSection
              title="مقارنة صور التطور ورسالة المتدرب"
              description="المقارنة البصرية وملاحظات المشترك حول أدائه وصعوبات الأسبوع."
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '18px 10px', textAlign: 'center', color: '#64748B' }}>
                  <Camera size={18} style={{ margin: '0 auto 5px auto', color: '#94A3B8' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', color: '#475569' }}>الأسبوع السابق ({activeCheckin.metrics.previous_weight} كجم)</span>
                  <small style={{ fontSize: '10.5px', color: '#94A3B8' }}>محيط الخصر: {activeCheckin.metrics.waist_previous} سم</small>
                </div>

                <div style={{ background: '#F0F9FF', border: '1px dashed #BAE6FD', borderRadius: '8px', padding: '18px 10px', textAlign: 'center', color: '#0284C7' }}>
                  <Camera size={18} style={{ margin: '0 auto 5px auto', color: '#0284C7' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 800, display: 'block', color: '#0F172A' }}>هذا الأسبوع ({activeCheckin.metrics.current_weight} كجم)</span>
                  <small style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: 700 }}>محيط الخصر: {activeCheckin.metrics.waist_current} سم ({activeCheckin.metrics.waist_change} سم)</small>
                </div>
              </div>

              <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <MessageCircle size={13} color="#475569" />
                  <strong style={{ fontSize: '11.5px', color: '#475569' }}>رسالة المتدرب للكوتش:</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#0F172A', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  "{activeCheckin.client_notes}"
                </p>
              </div>
            </FormSection>

            {/* AI Engine Recommendation Card */}
            <FormSection
              title="تحليل وتوصيات المحرك السريري الذكي"
              description="التوصيات التكيفية المبنية على الدلتا الحسابية وسرعة الأيض واستجابة المتدرب."
            >
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '12px 14px', borderRadius: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BrainCircuit size={16} color="#0F172A" />
                    <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>اقتراح المحرك التكيفي</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10.5px', background: '#E2E8F0', color: '#0F172A', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                      {activeCheckin.ai_analysis.status_badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMacroAdjustments(activeCheckin.baseline_macros);
                        setCoachReply(activeCheckin.suggested_reply);
                      }}
                      style={{
                        height: '24px',
                        padding: '0 8px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="استعادة الأرقام والرد المقترح تلقائياً"
                    >
                      <Zap size={11} />
                      <span>تطبيق المقترح</span>
                    </button>
                  </div>
                </div>
                
                <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 8px 0', lineHeight: 1.55 }}>
                  {activeCheckin.ai_analysis.recommendation}
                </p>

                {activeCheckin.ai_analysis.warning && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} className="flex-shrink-0" />
                    <span>{activeCheckin.ai_analysis.warning}</span>
                  </div>
                )}
              </div>
            </FormSection>

            {/* 2-Column Subgrid: Macros & Coach Approval */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
              
              {/* Macro Adjustment Panel */}
              <FormSection
                title="تعديل الماكروز للأسبوع القادم"
                description="ضبط السعرات والجرامات اليومية المعتمدة للبرنامج."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>السعرات الكلية</span>
                    <input
                      type="number"
                      value={macroAdjustments.calories}
                      onChange={(e) => setMacroAdjustments({ ...macroAdjustments, calories: Number(e.target.value) })}
                      style={{ width: '85px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>البروتين (g)</span>
                    </div>
                    <input
                      type="number"
                      value={macroAdjustments.protein}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const newCals = (val * 4) + (macroAdjustments.carbs * 4) + (macroAdjustments.fats * 9);
                        setMacroAdjustments({ ...macroAdjustments, protein: val, calories: newCals });
                      }}
                      style={{ width: '85px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>الكاربوهيدرات (g)</span>
                    </div>
                    <input
                      type="number"
                      value={macroAdjustments.carbs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const newCals = (macroAdjustments.protein * 4) + (val * 4) + (macroAdjustments.fats * 9);
                        setMacroAdjustments({ ...macroAdjustments, carbs: val, calories: newCals });
                      }}
                      style={{ width: '85px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>الدهون الصحية (g)</span>
                    </div>
                    <input
                      type="number"
                      value={macroAdjustments.fats}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const newCals = (macroAdjustments.protein * 4) + (macroAdjustments.carbs * 4) + (val * 9);
                        setMacroAdjustments({ ...macroAdjustments, fats: val, calories: newCals });
                      }}
                      style={{ width: '85px', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', textAlign: 'center', fontWeight: 800, fontSize: '13px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                  </div>

                  {/* Macro Distribution Summary */}
                  <div style={{ marginTop: '2px', background: '#F1F5F9', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: '#475569' }}>
                    <span>P: {macroAdjustments.protein * 4} kcal</span>
                    <span>C: {macroAdjustments.carbs * 4} kcal</span>
                    <span>F: {macroAdjustments.fats * 9} kcal</span>
                    <span style={{ color: '#0F172A', fontWeight: 800 }}>المجموع: {(macroAdjustments.protein * 4) + (macroAdjustments.carbs * 4) + (macroAdjustments.fats * 9)} kcal</span>
                  </div>

                </div>
              </FormSection>

              {/* Coach Reply & Approval */}
              <FormSection
                title="رسالة الكوتش واعتماد الخطة"
                description="كتابة التوجيه التشجيعي وإرسال التحديث لبرنامج المتدرب."
              >
                <div style={{ marginTop: '6px' }}>
                  <textarea
                    value={coachReply}
                    onChange={(e) => setCoachReply(e.target.value)}
                    placeholder="اكتب التوجيه والرد التشجيعي للمتدرب..."
                    style={{
                      width: '100%',
                      height: '115px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.45,
                      color: '#0F172A',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {/* Copy Text Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(coachReply);
                        alert('تم نسخ رسالة التوجيه للحافظة بنجاح');
                      }}
                      style={{
                        height: '36px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                      title="نسخ نص الرسالة"
                    >
                      <span>نسخ</span>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleOpenDirectWhatsApp}
                      style={{
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #86EFAC',
                        background: '#F0FDF4',
                        color: '#16A34A',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0
                      }}
                      title="فتح واتساب مباشرة بالرسالة"
                    >
                      <MessageCircle size={15} />
                      <span>واتساب</span>
                    </button>

                    {/* Primary Approve & Next Button */}
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      style={{
                        flex: 1,
                        height: '36px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0F172A')}
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Save size={15} />
                          <span>اعتماد وانتقال للمتدرب التالي</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </FormSection>

            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

