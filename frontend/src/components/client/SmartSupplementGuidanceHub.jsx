import React, { useState, useMemo } from 'react';
import { Pill, Sun, Moon, Zap, Dumbbell, AlertTriangle, CheckCircle2, ShieldAlert, Info, Search, Clock, Sparkles, Activity, HeartPulse, Flame, HelpCircle } from 'lucide-react';

export const SUPPLEMENTS_CATALOG = [
  // 1. الفيتامينات والمناعة (Vitamins & Immunity)
  {
    id: 'vit_d3_k2',
    name: 'فيتامين د3 + ك2 (Vitamin D3 + K2)',
    category: 'Vitamins',
    timingCategory: 'MORNING',
    bestTime: 'مع وجبة الإفطار أو الغداء (تحتوي على دهون)',
    dosage: '1000 - 5000 IU يومياً (حسب التحليل)',
    purpose: 'صحة العظام، تقوية المناعة، وتوازن الهرمونات الذكورية والأنثوية.',
    absorptionRules: 'فيتامين ذائب في الدهون (Fat-Soluble)؛ يجب تناوله مع وجبة تحتوي على دهون صحية (بيض، زيت زيتون، أفوكادو) لزيادة الامتصاص بنسبة 50%.',
    synergies: ['Omega-3', 'Magnesium'],
    conflicts: ['لا يؤخذ على معدة فارغة تماماً'],
    warnings: 'يجب فحص مستوى فيتامين D دورياً لتجنب الجرعات الزائدة المفرطة.',
    tag: 'مناعة وعظام'
  },
  {
    id: 'omega_3',
    name: 'أوميجا 3 - زيت السمك (Omega-3 Fish Oil)',
    category: 'Vitamins',
    timingCategory: 'MORNING',
    bestTime: 'مع أكبر وجبة دهنية في اليوم (غداء أو إفطار)',
    dosage: '1000 - 3000 مجم (تركيز EPA + DHA لا يقل عن 1000 مجم)',
    purpose: 'تقليل الالتهابات العضلية والمفصلية، صحة القلب، وتحسين حساسية الإنسولين.',
    absorptionRules: 'يؤخذ مع الأكل لتقليل طعم السمك ولتحقيق أعلى امتصاص مع الدهون الطبيعية.',
    synergies: ['Vitamin D3', 'Curcumin'],
    conflicts: ['تناوله على معدة فارغة يسبب تجشؤ وغثيان'],
    warnings: 'يجب الحذر واستشارة الطبيب لمن يتناولون مسيلات الدم (Blood Thinners).',
    tag: 'مفاصل وقلب'
  },
  {
    id: 'multivitamin',
    name: 'الفيتامينات المتعددة (Daily Multivitamin)',
    category: 'Vitamins',
    timingCategory: 'MORNING',
    bestTime: 'صباحاً بعد وجبة الإفطار بنصف ساعة',
    dosage: 'كبسولة أو قرص واحد يومياً مع كوب ماء كبير',
    purpose: 'سد النواقص الدقيقة من الفيتامينات والمعادن النادرة في النظام الغذائي.',
    absorptionRules: 'لا تتناوله على الريق لتجنب تهيج المعدة أو الغثيان المصاحب لبعض المعادن مثل الزنك والحديد.',
    synergies: ['وجبة متكاملة متوازنة'],
    conflicts: ['الشاي والقهوة لمدة 45 دقيقة بعد تناوله'],
    warnings: 'اختر أنواعاً خالية من الجرعات المفرطة للحديد إن لم تكن مصاباً بالأنيميا.',
    tag: 'صحة عامة'
  },
  {
    id: 'vitamin_c',
    name: 'فيتامين سي (Vitamin C - Ascorbic Acid)',
    category: 'Vitamins',
    timingCategory: 'MORNING',
    bestTime: 'الصباح أو مع وجبة تحتوي على مصادر حديد نباتي',
    dosage: '500 - 1000 مجم يومياً',
    purpose: 'مضاد أكسدة قوي، تصنيع الكولاجين للأوتار والمفاصل، وتعزيز امتصاص الحديد.',
    absorptionRules: 'فيتامين ذائب في الماء؛ يمكن تناوله مع أو بدون طعام مع وفرة من المياه.',
    synergies: ['Iron (الحديد)', 'Collagen'],
    conflicts: ['الجرعات العالية جداً (>2000 مجم) قد تسبب اضطراباً معوياً'],
    warnings: 'مرضى حصوات الكلى من نوع الأوكسالات يجب أن يلتزموا بجرعات معتدلة.',
    tag: 'مناعة وأوتار'
  },
  {
    id: 'b_complex',
    name: 'فيتامين ب المركب (Vitamin B-Complex)',
    category: 'Vitamins',
    timingCategory: 'MORNING',
    bestTime: 'صباحاً مع الإفطار',
    dosage: 'كبسولة واحدة يومياً',
    purpose: 'إنتاج الطاقة الحيوية، تحسين وظائف الجهاز العصبي، والتمثيل الغذائي للكاربوهيدرات والبروتين.',
    absorptionRules: 'يؤخذ صباحاً لأنه يعطي دفعة نشاط للجهاز العصبي، وتناوله ليلاً قد يسبب أرقاً.',
    synergies: ['الكاربوهيدرات المعقدة'],
    conflicts: ['تناوله قبل النوم مباشرة'],
    warnings: 'قد يغير لون البول إلى الأصفر الفاتح اللامع وهو أمر طبيعي تماماً وغير ضار.',
    tag: 'طاقة وأعصاب'
  },
  {
    id: 'iron',
    name: 'الحديد (Iron Bisglycinate)',
    category: 'Minerals',
    timingCategory: 'MORNING',
    bestTime: 'بين الوجبات أو على معدة شبه فارغة مع فيتامين سي',
    dosage: 'حسب تحليل الهيموجلوبين ومخزون الحديد (Ferritin)',
    purpose: 'علاج الأنيميا ونقل الأكسجين للعضلات وتحسين النفس واللياقة البدنية.',
    absorptionRules: 'أفضل امتصاص يكون مع فيتامين سي أو عصير ليمون/برتقال.',
    synergies: ['Vitamin C'],
    conflicts: ['الكالسيوم / منتجات الألبان', 'الشاي والقهوة', 'الزنك'],
    warnings: 'افصل بين الحديد والقهوة/الشاي/الكالسيوم بساعتين على الأقل لأنها تمنع امتصاصه تماماً.',
    tag: 'أنيميا ولياقة'
  },

  // 2. المعادن الأساسية والاستشفاء (Minerals & Recovery)
  {
    id: 'magnesium_glycinate',
    name: 'ماغنسيوم جلايسينات (Magnesium Glycinate)',
    category: 'Minerals',
    timingCategory: 'NIGHT',
    bestTime: 'قبل النوم بـ 45 - 60 دقيقة',
    dosage: '200 - 400 مجم عنصر ماغنسيوم',
    purpose: 'استرخاء الجهاز العصبي والعضلي، تقليل الشد العضلي الليلي، وتحسين جودة النوم العميق (Deep Sleep).',
    absorptionRules: 'صيغة الجلايسينات متحدة مع حمض أميني مهدئ ولا تسبب إسهالاً كباقي الأنواع.',
    synergies: ['Zinc', 'Vitamin B6', 'L-Theanine'],
    conflicts: ['تناوله مع أطعمة غنية جداً بالفايتات في نفس اللحظة'],
    warnings: 'أفضل صيغة للاستشفاء الرياضي والنوم (تجنب أكسيد الماغنسيوم Magnesium Oxide لضعف امتصاصه).',
    tag: 'نوم واستشفاء'
  },
  {
    id: 'zinc',
    name: 'الزنك (Zinc Picolinate / Glycinate)',
    category: 'Minerals',
    timingCategory: 'NIGHT',
    bestTime: 'مساءً بعد العشاء (وجبة خالية من الألبان)',
    dosage: '15 - 30 مجم يومياً',
    purpose: 'دعم إنتاج التستوستيرون الطبيعي، تقوية المناعة، سرعة التئام الأنسجة، وتخليق البروتين.',
    absorptionRules: 'لا تتناوله على معدة فارغة تماماً لتجنب الغثيان، وابتعد عن الكالسيوم.',
    synergies: ['Magnesium', 'Vitamin B6'],
    conflicts: ['الكالسيوم ومنتجات الألبان', 'الحديد'],
    warnings: 'الكالسيوم ينافس الزنك على نفس بوابات الامتصاص؛ افصل بين الزنك ومنتجات الألبان بساعتين.',
    tag: 'هرمونات ومناعة'
  },
  {
    id: 'calcium',
    name: 'الكالسيوم (Calcium Citrate / Carbonate)',
    category: 'Minerals',
    timingCategory: 'DAY',
    bestTime: 'مع وجبة الغداء أو العشاء',
    dosage: '500 - 1000 مجم (يفضل استيفاؤه من الغذاء)',
    purpose: 'كثافة العظام، انقباض الألياف العضلية، والإشارات العصبية.',
    absorptionRules: 'صيغة السيترات تمتص مع أو بدون طعام، بينما الكاربونات تحتاج حمض المعدة مع الوجبة.',
    synergies: ['Vitamin D3', 'Vitamin K2'],
    conflicts: ['الزنك', 'الحديد'],
    warnings: 'لا تتناول الكالسيوم مع مكمل الزنك أو الحديد في نفس الكوب إطلاقاً.',
    tag: 'عظام ومفاصل'
  },
  {
    id: 'electrolytes',
    name: 'محلول الأملاح والإلكترولايت (Hydration Electrolytes)',
    category: 'Minerals',
    timingCategory: 'WORKOUT',
    bestTime: 'أثناء التمرين في الأيام الحارة أو التمارين الشاقة، أو صباحاً على الريق',
    dosage: 'مغلف واحد مخفف في 750 مل ماء',
    purpose: 'منع الهبوط والدوخة والتقلصات العضلية، والحفاظ على ضغط الدم والترطيب العضلي.',
    absorptionRules: 'يحتوي على توازن الصوديوم والبوتاسيوم والماغنسيوم لسرعة امتصاص الماء في الخلايا.',
    synergies: ['الماء الوفير', 'الكارب السريع أثناء التمرين'],
    conflicts: ['شربه دفعة واحدة بتركيز مفرط'],
    warnings: 'مرضى ضغط الدم المرتفع يجب عليهم مراجعة كمية الصوديوم في المغلف.',
    tag: 'ترطيب وطاقة'
  },

  // 3. مكملات الأداء الرياضي والبناء العضلي (Sports Nutrition & Performance)
  {
    id: 'creatine',
    name: 'كرياتين مونوهيدرات (Creatine Monohydrate)',
    category: 'Sports',
    timingCategory: 'WORKOUT',
    bestTime: 'أي وقت ثابت يومياً (يفضل بعد التمرين أو مع أكبر وجبة كاربوهيدرات)',
    dosage: '3 - 5 جم يومياً باستمرار (بدون الحاجة لفترة تحميل إجبارية)',
    purpose: 'زيادة مخازن الطاقة الخلوية (ATP)، زيادة القوة الانفجارية، الامتلاء العضلي، وتحسين وظائف المخ.',
    absorptionRules: 'أفضل امتصاص يحدث عندما يُفرز الإنسولين، لذا تناوله مع عصير أو وجبة بعد التمرين يسرع وصوله للعضلات.',
    synergies: ['Carbohydrates', 'Whey Protein', 'الماء الوفير (3-4 لتر)'],
    conflicts: ['عدم شرب كمية كافية من الماء'],
    warnings: 'مكمل آمن تماماً ومدروس عبر آلاف الأبحاث؛ لا يسبب تساقط الشعر لدى الأصحاء ولا يضر الكلى السليمة.',
    tag: 'بناء عضلي وقوة'
  },
  {
    id: 'whey_protein',
    name: 'واي بروتين (Whey Protein Isolate / Concentrate)',
    category: 'Sports',
    timingCategory: 'WORKOUT',
    bestTime: 'بعد التمرين مباشرة أو بين الوجبات لسد الاحتياج اليومي للبروتين',
    dosage: '1 - 2 سكوب (25 - 50 جم بروتين صافي)',
    purpose: 'توفير أحماض أمينية سريعة الامتصاص لتفعيل مسار البناء العضلي (mTOR) وترميم الألياف.',
    absorptionRules: 'يمتص خلال 30-60 دقيقة؛ صيغة الـ Isolate خالية تقريباً من اللاكتوز ومثالية لمن يعانون حساسية خفيفة.',
    synergies: ['الكرياتين', 'الشوفان أو الفاكهة'],
    conflicts: ['لا يستبدل الوجبات الصلبة المتكاملة بالكامل'],
    warnings: 'يُحسب ضمن إجمالي جرامات البروتين اليومية وليس مكملاً سحرياً بمفرده.',
    tag: 'بروتين واستشفاء'
  },
  {
    id: 'casein_protein',
    name: 'كازين بروتين (Micellar Casein)',
    category: 'Sports',
    timingCategory: 'NIGHT',
    bestTime: 'قبل النوم بـ 30 دقيقة أو قبل فترات الصيام الطويلة',
    dosage: '1 سكوب (25 - 30 جم بروتين)',
    purpose: 'بروتين بطيء الامتصاص يغذي العضلات بالأحماض الأمينية على مدار 6-8 ساعات أثناء النوم لمنع الهدم.',
    absorptionRules: 'يتحول في المعدة إلى هلام بطيء الهضم، مما يمنح شعوراً طويلاً بالشبع والاستشفاء المستمر.',
    synergies: ['زبدة الفول السوداني أو المكسرات'],
    conflicts: ['غير مناسب لمن يعانون من حساسية شديدة لبروتين الحليب'],
    warnings: 'قوامه كثيف؛ يحتاج كمية ماء أو حليب أكبر للخلط.',
    tag: 'استشفاء ليلي'
  },
  {
    id: 'caffeine_preworkout',
    name: 'الكافيين ومحفزات الطاقة (Caffeine / Pre-Workout)',
    category: 'Sports',
    timingCategory: 'WORKOUT',
    bestTime: 'قبل التمرين بـ 30 - 45 دقيقة فقط',
    dosage: '150 - 300 مجم كافيين (حسب التحمل)',
    purpose: 'رفع التركيز الذهني، تأخير الشعور بالإجهاد المركزي، وزيادة النبض وتدفق الدم للعضلات.',
    absorptionRules: 'يصل لأعلى تركيز في الدم بعد 45 دقيقة من تناوله.',
    synergies: ['L-Theanine (لمنع التوتر ورعشة اليد)', 'L-Citrulline'],
    conflicts: ['تناوله قبل النوم بأقل من 6-8 ساعات'],
    warnings: 'يجب قطعه قبل موعد النوم بـ 6 إلى 8 ساعات على الأقل للحفاظ على هرمون النوم (الميلاتونين).',
    tag: 'طاقة وتركيز'
  },
  {
    id: 'citrulline_malate',
    name: 'سيترولين مالات (L-Citrulline Malate)',
    category: 'Sports',
    timingCategory: 'WORKOUT',
    bestTime: 'قبل التمرين بـ 30 - 45 دقيقة',
    dosage: '6 - 8 جم (بنسبة 2:1)',
    purpose: 'تحفيز أكسيد النيتريك (Nitric Oxide)، توسيع الأوعية الدموية، ضخ دم هائل للعضلات (Pump)، وتخفيف حمض اللاكتيك.',
    absorptionRules: 'يتحول في الكلى إلى أرجينين بكفاءة أعلى بكثير من تناول الأرجينين المباشر.',
    synergies: ['Caffeine', 'Beta-Alanine'],
    conflicts: ['أدوية ضغط الدم المنخفض الشديد'],
    warnings: 'آمن وغير منبه، ممتاز لمن يتمرنون في المساء بدون كافيين.',
    tag: 'ضخ دم وباور'
  },
  {
    id: 'beta_alanine',
    name: 'بيتا ألانين (Beta-Alanine)',
    category: 'Sports',
    timingCategory: 'WORKOUT',
    bestTime: 'يومياً بانتظام (قبل التمرين أو مقسم على جرعتين)',
    dosage: '3.2 - 6.4 جم يومياً',
    purpose: 'زيادة الكارنوزين العضلي لتقليل الحرقان العضلي وزيادة عدد العدات في المجموعات الطويلة (8-15 عدة).',
    absorptionRules: 'يعمل بالتراكم اليومي داخل العضلات مثل الكرياتين.',
    synergies: ['Creatine', 'Citrulline'],
    conflicts: ['تناول جرعة كبيرة دفعة واحدة يسبب وخز الجلد الحاد'],
    warnings: 'شعور الوخز أو التنميل في الوجه واليدين (Paresthesia) طبيعي تماماً وغير ضار، ويمكن تقليله بتقسيم الجرعة.',
    tag: 'تحمل عضلي'
  },

  // 4. المهدئات الطبيعية والمفاصل (Adaptogens & Joints)
  {
    id: 'ashwagandha',
    name: 'الأشواغاندا (Ashwagandha KSM-66)',
    category: 'Recovery',
    timingCategory: 'NIGHT',
    bestTime: 'مساءً مع العشاء أو قبل النوم',
    dosage: '300 - 600 مجم من المستخلص المعياري',
    purpose: 'خفض هرمون التوتر (الكورتيزول)، تقليل القلق، تحسين جودة النوم، ودعم التستوستيرون في حالات الإجهاد.',
    absorptionRules: 'مكمل أدابتوجين (Adaptogen) يمتص جيداً مع وجبة خفيفة.',
    synergies: ['Magnesium Glycinate'],
    conflicts: ['تناولها مع أدوية مهدئة قوية بدون إشراف'],
    warnings: 'يفضل استخدامها في دورات (8-12 أسبوع ثم راحة أسبوعين) ولا تناسب من يعانون من فرط نشاط الغدة الدرقية.',
    tag: 'تقليل كورتيزول'
  },
  {
    id: 'collagen_peptides',
    name: 'ببتيدات الكولاجين المتحلل (Hydrolyzed Collagen Peptides)',
    category: 'Recovery',
    timingCategory: 'MORNING',
    bestTime: 'قبل تمارين المرونة أو التأهيل بـ 45 دقيقة مع فيتامين سي',
    dosage: '10 - 15 جم',
    purpose: 'تقوية الأوتار، الأربطة، غضاريف الركبة والمفاصل، وتحسين مرونة الجلد.',
    absorptionRules: 'أثبتت الدراسات أن تناول الكولاجين مع 50 مجم فيتامين C قبل تحميل الوتر بـ 45 دقيقة يضاعف تصنيع الكولاجين داخل المفصل.',
    synergies: ['Vitamin C'],
    conflicts: ['لا يعتمد عليه كمصدر وحيد لبناء العضلات لافتقاره للأحماض الأمينية الأساسية الكاملة'],
    warnings: 'ابحث عن الكولاجين المتحلل (Peptides Type I & III) لسهولة الامتصاص.',
    tag: 'مفاصل وأوتار'
  },
  {
    id: 'digestive_enzymes',
    name: 'الإنزيمات الهاضمة (Digestive Enzymes)',
    category: 'Digestion',
    timingCategory: 'MEALS',
    bestTime: 'مع أول لقمة من الوجبات الكبيرة أو الدسمة',
    dosage: 'كبسولة واحدة مع الوجبة',
    purpose: 'تفكيك البروتينات والدهون والكاربوهيدرات، ومنع الانتفاخ والغازات وعسر الهضم في فترات التضخيم وزيادة الأكل.',
    absorptionRules: 'يجب أن تؤخذ في بداية الوجبة لتمتزج مع الطعام في المعدة.',
    synergies: ['وجبات التضخيم العالية'],
    conflicts: ['تناولها بعد انتهاء الوجبة بساعات طويلة يفقدها فاعليتها'],
    warnings: 'تستخدم عند الحاجة في الوجبات الثقيلة لراحة الجهاز الهضمي.',
    tag: 'هضم وامتصاص'
  },
  {
    id: 'probiotics',
    name: 'البروبيوتيك - البكتيريا النافعة (Probiotics)',
    category: 'Digestion',
    timingCategory: 'MORNING',
    bestTime: 'صباحاً قبل الإفطار بـ 20 دقيقة مع ماء فاتر',
    dosage: '10 - 50 مليار CFU',
    purpose: 'إعادة توازن بكتيريا الأمعاء النافعة (Microbiome)، تحسين الامتصاص، ومكافحة الانتفاخات المزمنة.',
    absorptionRules: 'تؤخذ في وقت حموضة المعدة فيه منخفضة لتصل البكتيريا حية إلى الأمعاء.',
    synergies: ['الألياف الطبيعية (Prebiotics)'],
    conflicts: ['المضادات الحيوية (يجب الفصل بينهما بـ 3 ساعات)'],
    warnings: 'احفظها في الثلاجة إذا كانت العبوة تتطلب ذلك للحفاظ على حيوية المستعمرات.',
    tag: 'صحة القولون'
  },
  {
    id: 'berberine',
    name: 'البربرين (Berberine HCL)',
    category: 'Digestion',
    timingCategory: 'MEALS',
    bestTime: 'قبل الوجبات عالية الكاربوهيدرات بـ 15 دقيقة',
    dosage: '500 مجم مرتين إلى 3 مرات يومياً',
    purpose: 'تحسين حساسية الإنسولين، تنظيم سكر الدم، وتوجيه الكاربوهيدرات إلى العضلات بدلاً من تخزينها كدهون.',
    absorptionRules: 'يعمل بآلية مشابهة للميتفورمين الطبيعي (تفعيل إنزيم AMPK).',
    synergies: ['وجبات الكاربوهيدرات المرتفعة / أيام الـ Refeed'],
    conflicts: ['أدوية السكري القوية بدون إشراف طبي لمنع هبوط السكر'],
    warnings: 'مفيد جداً لحالات مقاومة الإنسولين وتكيس المبايض (PCOS).',
    tag: 'حساسية إنسولين'
  }
];

export const TIMING_CATEGORIES = [
  { id: 'ALL', label: 'كافة المكملات', icon: Pill },
  { id: 'MORNING', label: '☀️ الصباح والإفطار', icon: Sun },
  { id: 'WORKOUT', label: '🏋️‍♂️ حول التمرين', icon: Dumbbell },
  { id: 'NIGHT', label: '🌙 المساء والنوم', icon: Moon },
  { id: 'MEALS', label: '🍽️ مع الوجبات', icon: Flame }
];

export const GOLDEN_INTERACTION_RULES = [
  {
    pair: ['الزنك', 'الكالسيوم / منتجات الألبان'],
    type: 'CONFLICT',
    title: 'تعارض امتصاص حاد',
    desc: 'الكالسيوم يغلق بوابات امتصاص الزنك في الأمعاء؛ افصل بين مكمل الزنك والجبن/اللبن أو الكالسيوم بساعتين على الأقل.'
  },
  {
    pair: ['الحديد', 'الشاي والقهوة'],
    type: 'CONFLICT',
    title: 'ترسيب ومنع الامتصاص',
    desc: 'مادة التانين والبوليفينول في الشاي والقهوة ترسب الحديد بنسبة تصل لـ 70%؛ اشرب القهوة بعد وجبة الحديد بساعة على الأقل.'
  },
  {
    pair: ['الكافيين', 'الماغنسيوم قبل النوم'],
    type: 'TIMING',
    title: 'تعاكس التأثير العصبي',
    desc: 'الكافيين منبه مركزي والماغنسيوم مهدئ للأعصاب؛ اقطع الكافيين قبل موعد النوم بـ 6-8 ساعات على الأقل.'
  },
  {
    pair: ['فيتامين D3', 'أوميجا 3 / الدهون الصحية'],
    type: 'SYNERGY',
    title: 'تآزر امتصاص خارق',
    desc: 'فيتامين D3 يذوب في زيت السمك والدهون الصحية، مما يرفع امتصاصه ودخوله لمجرى الدم بنسبة تزيد عن 50%.'
  },
  {
    pair: ['الكرياتين', 'الكاربوهيدرات والبروتين'],
    type: 'SYNERGY',
    title: 'زيادة التخزين العضلي',
    desc: 'إفراز هرمون الإنسولين الطبيعي بعد وجبة الكارب والبروتين يفتح خلايا العضلات لامتصاص الكرياتين وتخزينه كـ Phosphocreatine أسرع.'
  },
  {
    pair: ['الكولاجين', 'فيتامين سي'],
    type: 'SYNERGY',
    title: 'بناء الأوتار والغضاريف',
    desc: 'فيتامين C هو العامل المساعد الإلزامي (Co-factor) لربط ألياف الكولاجين داخل الأوتار والمفاصل.'
  }
];

export default function SmartSupplementGuidanceHub() {
  const [activeTiming, setActiveTiming] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filter Catalog
  const filteredSupplements = useMemo(() => {
    return SUPPLEMENTS_CATALOG.filter(item => {
      const matchTiming = activeTiming === 'ALL' || item.timingCategory === activeTiming;
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTiming && matchSearch;
    });
  }, [activeTiming, searchQuery]);

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '16px 12px', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: '16px',
        padding: '24px 20px',
        color: '#FFFFFF',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#93C5FD',
              fontSize: '11px',
              fontWeight: 800
            }}>
              <Pill size={14} />
              <span>الدليل الاسترشادي الطبي والرياضي</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
              • مبني على أحدث أبحاث الامتصاص والتوقيتات
            </span>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
            دليل وتوقيتات المكملات والفيتامينات الذكي 💊
          </h1>
          <p style={{ fontSize: '12.5px', color: '#CBD5E1', margin: 0, lineHeight: 1.6, maxWidth: '680px' }}>
            دليلك الشامل لمعرفة التوقيت المثالي لكل مكمل، قواعد أقصى امتصاص في الأمعاء، وما لا يجب خلطه معاً لتستفيد من كل قرص تتناوله بنسبة 100%.
          </p>
        </div>

        {/* Decorative ambient shape */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Golden Rules Quick Grid */}
      <div style={{
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <ShieldAlert size={16} color="#D97706" />
          <strong style={{ fontSize: '13px', color: '#92400E' }}>
            القواعد الذهبية للامتصاص وتجنب التعارضات:
          </strong>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '10px'
        }}>
          {GOLDEN_INTERACTION_RULES.map((rule, idx) => (
            <div 
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid #FEF3C7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: rule.type === 'CONFLICT' ? '#DC2626' : (rule.type === 'SYNERGY' ? '#059669' : '#D97706') }}>
                  {rule.title}
                </span>
                <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600 }}>
                  {rule.pair.join(' ⚡ ')}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Timing Filters & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* Timing Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {TIMING_CATEGORIES.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTiming === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTiming(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 600,
                  background: isActive ? '#0F172A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(15,23,42,0.18)' : 'none'
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '280px' }}>
          <Search size={14} color="#94A3B8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مكمل أو فيتامين..."
            style={{
              width: '100%',
              padding: '7px 32px 7px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              outline: 'none',
              background: '#FFFFFF',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Supplements Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSupplements.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: isExpanded ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                padding: '14px 16px',
                transition: 'all 0.15s ease',
                boxShadow: isExpanded ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              {/* Card Header Trigger */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: item.timingCategory === 'MORNING' ? '#FEF3C7' : (item.timingCategory === 'WORKOUT' ? '#EFF6FF' : (item.timingCategory === 'MEALS' ? '#FFF1F2' : '#F5F3FF')),
                    border: item.timingCategory === 'MORNING' ? '1px solid #FDE68A' : (item.timingCategory === 'WORKOUT' ? '1px solid #BFDBFE' : (item.timingCategory === 'MEALS' ? '1px solid #FECDD3' : '1px solid #DDD6FE')),
                    color: item.timingCategory === 'MORNING' ? '#D97706' : (item.timingCategory === 'WORKOUT' ? '#2563EB' : (item.timingCategory === 'MEALS' ? '#E11D48' : '#7C3AED')),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Pill size={16} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        {item.name}
                      </h3>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 750,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#F1F5F9',
                        color: '#475569'
                      }}>
                        {item.tag}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Clock size={12} color="#059669" />
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700 }}>
                        {item.bestTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#2563EB',
                    fontWeight: 700,
                    background: '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {isExpanded ? 'إخفاء التفاصيل' : 'عرض الإرشادات الكاملة'}
                  </span>
                </div>
              </div>

              {/* Expanded Clinical Breakdown */}
              {isExpanded && (
                <div style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '12px'
                }}>
                  {/* Purpose & Dosage */}
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Activity size={13} color="#2563EB" />
                      <strong style={{ fontSize: '11.5px', color: '#1E293B' }}>الهدف والجرعة الاسترشادية:</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                      {item.purpose}
                    </p>
                    <div style={{ fontSize: '10.5px', color: '#0F172A', fontWeight: 750 }}>
                      💊 الجرعة الموصى بها: <span style={{ color: '#2563EB' }}>{item.dosage}</span>
                    </div>
                  </div>

                  {/* Absorption Rules */}
                  <div style={{ background: '#ECFDF5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <strong style={{ fontSize: '11.5px', color: '#065F46' }}>قواعد أعلى امتصاص:</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                      {item.absorptionRules}
                    </p>
                  </div>

                  {/* Synergies & Best Stack */}
                  <div style={{ background: '#F0FDF4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <Sparkles size={13} color="#16A34A" />
                      <strong style={{ fontSize: '11.5px', color: '#14532D' }}>أفضل تآزر (Stacking):</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {item.synergies.map((syn, sIdx) => (
                        <span key={sIdx} style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ✓ {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Conflicts & Warnings */}
                  <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <AlertTriangle size={13} color="#DC2626" />
                      <strong style={{ fontSize: '11.5px', color: '#991B1B' }}>تنبيهات وموانع التعارض:</strong>
                    </div>
                    <p style={{ fontSize: '10.5px', color: '#B91C1C', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                      ⚠️ {item.warnings}
                    </p>
                    {item.conflicts && item.conflicts.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#7F1D1D', fontWeight: 700 }}>
                        ⛔ لا تخلط مع: {item.conflicts.join(' ، ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredSupplements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              لا توجد نتائج مطابقة لبحثك. جرب البحث باسم مكمل آخر!
            </p>
          </div>
        )}
      </div>

      {/* Clinical Disclaimer Footer */}
      <div style={{
        marginTop: '24px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Info size={16} color="#64748B" flexShrink={0} />
        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
          <strong>إخلاء مسؤولية سريرية:</strong> هذه الإرشادات تعليمية وتثقيفية مبنية على الكيمياء الحيوية وقواعد الامتصاص الغذائي لمساعدتك على الاستفادة القصوى من مكملاتك المصرح بها، ولا تعتبر بديلاً عن الاستشارة الطبية المباشرة لحالتك الخاصة.
        </span>
      </div>

    </div>
  );
}
