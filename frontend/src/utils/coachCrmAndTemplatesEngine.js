/**
 * Coach CRM, Acquisition Channels & Directive Templates Engine (V2)
 *
 * Implements authoritative client acquisition tracking and standardized coach directives:
 * 1. Definitive Acquisition Channels (Instagram, TikTok, YouTube, Website, Referral, Direct Coach).
 * 2. Referral Tracking & Lightweight Communication / Interaction Log.
 * 3. Standardized Reusable Directive Templates with strict Client vs Internal Coach separation.
 * 4. Zero Emojis and executive Arabic rigor.
 */

export const ACQUISITION_CHANNELS = Object.freeze({
  INSTAGRAM: { code: 'INSTAGRAM', name_ar: 'إنستغرام' },
  TIKTOK: { code: 'TIKTOK', name_ar: 'تيك توك' },
  YOUTUBE: { code: 'YOUTUBE', name_ar: 'يوتيوب' },
  WEBSITE: { code: 'WEBSITE', name_ar: 'الموقع الإلكتروني الرسمي' },
  REFERRAL: { code: 'REFERRAL', name_ar: 'إحالة متدرب سابق أو صديق' },
  DIRECT_COACH: { code: 'DIRECT_COACH', name_ar: 'تواصل مباشر مع الكابتن' },
  OTHER: { code: 'OTHER', name_ar: 'قناة أخرى' }
});

export const INTERACTION_TYPES = Object.freeze({
  WELCOME_CALL: { code: 'WELCOME_CALL', name_ar: 'مكالمة ترحيب وضبط الأهداف' },
  CHECKIN_FEEDBACK: { code: 'CHECKIN_FEEDBACK', name_ar: 'ملاحظات صوتية على التقييم' },
  MOTIVATION_MESSAGE: { code: 'MOTIVATION_MESSAGE', name_ar: 'رسالة متابعة وتحفيز' },
  RENEWAL_FOLLOWUP: { code: 'RENEWAL_FOLLOWUP', name_ar: 'متابعة تجديد الاشتراك' },
  GENERAL_INQUIRY: { code: 'GENERAL_INQUIRY', name_ar: 'استفسار تدريبي أو غذائي' }
});

export const COACH_DIRECTIVE_TEMPLATES = Object.freeze([
  {
    id: 'COOKED_WEIGHT_STANDARD',
    category: 'NUTRITION',
    title_ar: 'قاعدة الوزن بعد الطهي حصراً',
    client_facing_ar: 'كافة أوزان البروتينات (الدجاج، اللحم، السمك) والنشويات (الأرز، البطاطا، المكرونة) في خطتك الغذائية موزونة بعد الطهي وجاهزة للأكل مباشرة على الميزان الرقمي.',
    internal_rationale_ar: 'توحيد مرجع الوزن بعد الطهي لمنع التباين الحجمي الناتج عن درجات سحب المياه أو اختلاف نسب الطهي.',
    tags: ['nutrition', 'portions', 'kitchen']
  },
  {
    id: 'FLEXIBLE_MEAL_SCHEDULE',
    category: 'NUTRITION',
    title_ar: 'مرونة توزيع الوجبات والدمج',
    client_facing_ar: 'المواعيد المكتوبة للوجبات استرشادية؛ يمكنك تقديم أو تأخير أي وجبة حسب جدول عملك اليومي، أو دمج وجبتين في وجبة واحدة، طالما التزمت بالماكروز اليومية الإجمالية.',
    internal_rationale_ar: 'تعزيز استدامة الالتزام ومنع التسرب الناتج عن الصرامة الزمنية طالما تحققت ميزانية الطاقة الأسبوعية.',
    tags: ['nutrition', 'timing', 'adherence']
  },
  {
    id: 'RIR_INTENSITY_PRESERVATION',
    category: 'TRAINING',
    title_ar: 'الانضباط باحتياطي التكرارات RIR',
    client_facing_ar: 'التزم بإيقاف كل مجموعة عند معدل الـ RIR المستهدف (عدات في الاحتياط قبل الفشل) وتجنب الوصول للفشل العضلي التام في الجولات الأولى لحماية جهازك العصبي المركزي.',
    internal_rationale_ar: 'إدارة الإجهاد الجهازى (Systemic Fatigue) وضمان استدامة الحمل الخطي عبر أسابيع الميزوسايكل.',
    tags: ['training', 'rir', 'intensity']
  },
  {
    id: 'DELOAD_WEEK_EXECUTION',
    category: 'TRAINING',
    title_ar: 'استراتيجية أسبوع التفريغ والاستشفاء (Deload)',
    client_facing_ar: 'أسبوع الديلود مصمم خصيصاً لتجديد أوتارك ومفاصلك ومخازن الجليكوجين؛ نقوم بتخفيض عدد المجموعات الإجمالية بنسبة 40-50% مع الإبقاء على نفس أوزانك المعتادة.',
    internal_rationale_ar: 'تبديد الإجهاد المتراكم (Fatigue Dissipation) وإعادة حساسية الألياف العضلية للمحفز التدريبي الجديد.',
    tags: ['training', 'deload', 'recovery']
  },
  {
    id: 'CAFFEINE_SLEEP_WINDOW',
    category: 'LIFESTYLE',
    title_ar: 'فاصل أمان الكافيين والنوم العميق',
    client_facing_ar: 'أوقف كافة المنبهات والقهوة ومشروبات الطاقة قبل موعد نومك المعتاد بـ 8 ساعات على الأقل، لضمان جودة مرحلة النوم العميق (Slow-wave sleep) وتعظيم إفراز هرمون النمو.',
    internal_rationale_ar: 'حماية مستقبلات الأدينوزين وتقليل الاستثارة الودية لتحسين كفاءة الاستشفاء العضلي الليلي.',
    tags: ['lifestyle', 'caffeine', 'sleep']
  },
  {
    id: 'HYDRATION_BASELINE',
    category: 'LIFESTYLE',
    title_ar: 'المعيار المعتمد لشرب الماء اليومي',
    client_facing_ar: 'احرص على توزيع استهلاك 3.5 إلى 4.5 لتر ماء على مدار ساعات استيقاظك للحفاظ على تروية الخلايا العضلية واستقرار ضغط الدم ومنع احتباس السوائل الكاذب.',
    internal_rationale_ar: 'الحفاظ على حجم البلازما وتحسين نقل المغذيات الخلوية ومنع التقلبات الوهمية في ميزان المتابعة الصباحي.',
    tags: ['lifestyle', 'water', 'hydration']
  }
]);

const CRM_PREFIX = '[CRM_META:';

/**
 * Strips existing CRM_META block safely considering nested brackets.
 */
function stripCrmMeta(notes = '') {
  if (!notes || typeof notes !== 'string') return '';
  const idx = notes.indexOf(CRM_PREFIX);
  if (idx === -1) return notes.trim();

  const after = notes.slice(idx + CRM_PREFIX.length);
  let depth = 0;
  let endIdx = -1;

  for (let i = 0; i < after.length; i++) {
    if (after[i] === '{') depth++;
    else if (after[i] === '}') {
      depth--;
      if (depth === 0) {
        const closeBracketIdx = after.indexOf(']', i);
        endIdx = closeBracketIdx !== -1 ? closeBracketIdx + 1 : i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) {
    return notes.replace(/\[CRM_META:[\s\S]*?\]/g, '').trim();
  }

  const before = notes.slice(0, idx);
  const remaining = after.slice(endIdx);
  return (before + remaining).trim();
}

/**
 * Parses structured CRM metadata from client notes using balanced JSON extraction.
 */
export function parseClientCrmMeta(notes = '') {
  const defaultMeta = {
    acquisition_channel: ACQUISITION_CHANNELS.OTHER.code,
    referral_code: null,
    referred_by: null,
    interactions: []
  };

  if (!notes || typeof notes !== 'string') return defaultMeta;

  const idx = notes.indexOf(CRM_PREFIX);
  if (idx === -1) return defaultMeta;

  const after = notes.slice(idx + CRM_PREFIX.length);
  let depth = 0;
  let jsonStr = null;

  for (let i = 0; i < after.length; i++) {
    if (after[i] === '{') depth++;
    else if (after[i] === '}') {
      depth--;
      if (depth === 0) {
        jsonStr = after.slice(0, i + 1);
        break;
      }
    }
  }

  if (!jsonStr) return defaultMeta;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    return {
      acquisition_channel: parsed.acquisition_channel || defaultMeta.acquisition_channel,
      referral_code: parsed.referral_code || null,
      referred_by: parsed.referred_by || null,
      interactions: Array.isArray(parsed.interactions) ? parsed.interactions : []
    };
  } catch {
    return defaultMeta;
  }
}

/**
 * Serializes CRM metadata into client notes without touching existing text.
 */
export function serializeClientCrmMeta(existingNotes = '', crmMeta = {}) {
  const current = parseClientCrmMeta(existingNotes);
  const updated = {
    acquisition_channel: crmMeta.acquisition_channel || current.acquisition_channel,
    referral_code: crmMeta.referral_code !== undefined ? crmMeta.referral_code : current.referral_code,
    referred_by: crmMeta.referred_by !== undefined ? crmMeta.referred_by : current.referred_by,
    interactions: Array.isArray(crmMeta.interactions) ? crmMeta.interactions : current.interactions
  };

  const tag = `${CRM_PREFIX}${JSON.stringify(updated)}]`;
  const cleanExisting = stripCrmMeta(existingNotes);

  return cleanExisting ? `${cleanExisting}\n\n${tag}` : tag;
}

/**
 * Appends a lightweight communication log entry to client CRM metadata.
 */
export function appendClientInteractionLog(existingNotes = '', {
  type = 'GENERAL_INQUIRY',
  summary = '',
  logged_by = 'COACH',
  timestamp = new Date()
} = {}) {
  const currentMeta = parseClientCrmMeta(existingNotes);
  const cleanSummary = String(summary || '').replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();

  const newEntry = {
    id: `INT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: String(type).toUpperCase(),
    summary: cleanSummary || 'تم التواصل والمتابعة',
    logged_by: String(logged_by),
    timestamp: (timestamp instanceof Date ? timestamp : new Date(timestamp)).toISOString()
  };

  const updatedInteractions = [newEntry, ...(currentMeta.interactions || [])].slice(0, 50);

  return serializeClientCrmMeta(existingNotes, {
    ...currentMeta,
    interactions: updatedInteractions
  });
}

/**
 * Separates client-facing text from internal coach rationale across directives.
 * Solves K-05: Strict Boundary between trainee-facing content and internal staff rationale.
 */
export function separateClientFacingDirectives(templateIds = []) {
  if (!Array.isArray(templateIds)) return { client_text: '', internal_records: [] };

  const matched = COACH_DIRECTIVE_TEMPLATES.filter(t => templateIds.includes(t.id));
  const clientLines = matched.map(m => `• ${m.title_ar}: ${m.client_facing_ar}`);
  
  return {
    client_text: clientLines.join('\n\n'),
    internal_records: matched.map(m => ({
      id: m.id,
      title: m.title_ar,
      rationale: m.internal_rationale_ar,
      category: m.category
    }))
  };
}
