/**
 * Culinary Recipe & Home Food Preparation Engine
 * Provides practical, delicious, chef-grade home preparation methods
 * for all diet items to ensure meals are appetizing and never dry or bland.
 */

export const CULINARY_PREP_CATALOG = {
  OATS: {
    title_ar: "طرق تحضير الشوفان الشهية (بدون ماء جاف)",
    cooking_tip: "لا تتناول الشوفان جافاً أو مسلوقاً بماء فقط؛ اطهه بالحليب أو اخلطه بالزبادي والكاكاو والقرفة ليتحول إلى حلوى صحية مشبعة.",
    prep_options: [
      {
        id: "WARM_MILK_CINNAMON_PORRIDGE",
        name_ar: "عصيدة الشوفان الدافئة بالحليب والقرفة (Warm Milk Porridge)",
        free_ingredients_ar: "كوب حليب خالي الدسم، رشة قرفة، قطرات فانيليا، سكر ستيفيا، موزة أو تفاحة مقطعة",
        technique_ar: "طهي الشوفان مع الحليب والقرفة على نار هادئة 3 دقائق حتى يتكاثف ويتضاعف حجمه، ثم تحليته بالستيفيا وتزيينه بالفاكهة."
      },
      {
        id: "OVERNIGHT_CHOCO_YOGURT",
        name_ar: "بودينغ الشوفان بالشوكولاتة والزبادي (Overnight Chocolate Oats)",
        free_ingredients_ar: "علبة زبادي يوناني أو عادي، ملعقة صغيرة كاكاو خام غير محلى، ماء خفيف، سكر دايت",
        technique_ar: "تقليب الشوفان مع الزبادي والكاكاو والستيفيا في برطمان وحفظه بالثلاجة لساعتين؛ يعطي قوام كيك الشوكولاتة الغني والبارد."
      },
      {
        id: "PROTEIN_BREAKFAST_SMOOTHIE",
        name_ar: "سموذي الشوفان المخفوق السريع (Morning Power Shake)",
        free_ingredients_ar: "حليب خالي الدسم، سكوب بروتين أو بياض بيض، نصف موزة، رشة نسكافيه أو كاكاو، مكعبات ثلج",
        technique_ar: "وضع الشوفان مع باقي المكونات في الخلاط لمدة 45 ثانية؛ وجبة إفطار سائلة سريعة ولذيذة جداً للمستعجلين."
      }
    ]
  },

  COTTAGE_CHEESE: {
    title_ar: "خلطات الجبنة القريش الشهية لكسر الملل",
    cooking_tip: "الجبنة القريش تتحول إلى جبنة كريمية فاخرة بمجرد هرسها بالشوكة مع زيت الزيتون ورشة زعتر وليمون.",
    prep_options: [
      {
        id: "LEVANTINE_THYME_SALAD",
        name_ar: "طبق القريش المتبل بزيت الزيتون والزعتر والخيار",
        free_ingredients_ar: "ملعقة زيت زيتون، رشة زعتر شامي أو كمون، طماطم وخيار مقطع، رشة ملح خفيف",
        technique_ar: "هرس القريش بالشوكة مع زيت الزيتون والزعتر حتى تنعم، وتقليبها مع قطع الطماطم والخيار لتؤكل بالشوكة أو بالخبز البلدي."
      },
      {
        id: "WHIPPED_LEMON_HERB_CREAM",
        name_ar: "الجبنة القريش المخفوقة بالليمون والنعناع (Whipped Herb Cheese)",
        free_ingredients_ar: "عصير نصف ليمونة، فلفل أسود، نعناع مجفف، رشة كزبرة، ملعقة ماء دافئ",
        technique_ar: "ضرب القريش في الكبة مع الليمون والنعناع والماء لدقيقة واحدة حتى تصبح بقوام اللبنة الكريمية الناعمة بدون أي كتل."
      },
      {
        id: "SWEET_CINNAMON_DESSERT",
        name_ar: "حلوى القريش بالقرفة والموز الدايت (Sweet Cinnamon Whip)",
        free_ingredients_ar: "رشة قرفة مطحونة، سكر ستيفيا، قطرات فانيليا، نصف موزة مهروسة",
        technique_ar: "هرس القريش مع الموز والقرفة وسكر الدايت؛ وجبة عشاء أو سناك حلو يشبه حلوى التشيز كيك بدون أي دهون مضافة."
      }
    ]
  },

  EGGS: {
    title_ar: "طرق إعداد البيض المتنوعة والشهية",
    cooking_tip: "إضافة ملعقة ماء بارد أو حليب خالي الدسم مع خفق البيض تمنحه قواماً إسفنجياً رائعاً دون زيادة سعرات.",
    prep_options: [
      {
        id: "ONE_PAN_SHAKSHOUKA",
        name_ar: "شكشوكة الطاسة العربية بالبصل والطماطم والكمون",
        free_ingredients_ar: "طماطم مقطعة مكعبات، فلفل أخضر، بصلة صغيرة، رشة كمون وفلفل أسود، مسحة زيت خفيفة",
        technique_ar: "تشويح البصل والفلفل والطماطم لدقيقتين، ثم كسر البيض فوقها وتغطية المقلاة على نار هادئة لينضج على البخار."
      },
      {
        id: "FLUFFY_GARDEN_OMELETTE",
        name_ar: "أومليت الخضار الهش المرتفع (Fluffy Cloud Omelette)",
        free_ingredients_ar: "جرجير أو سبانخ، فلفل ألوان، رشة فلفل أسود وكزبرة، ملعقة ماء بارد",
        technique_ar: "خفق البيض مع الماء والبهارات، وصبه في مقلاة ساخنة ممسوحة بزيت خفيف مع الخضار حتى يتماسك ويثنى نصفين."
      },
      {
        id: "CUMIN_LEMON_BOILED",
        name_ar: "بيض مسلوق متبل على الطريقة البلدي",
        free_ingredients_ar: "رشة كمون مطحون، رشة بابريكا مدخنة، نقطة عصير ليمون، رشة ملح خفيف",
        technique_ar: "سلق البيض 7-8 دقائق (صفار طري)، وتقطيعه نصفين مع رش الكمون والبابريكا والليمون لجعله شهياً ومريحاً للمعدة."
      }
    ]
  },

  CHICKEN_BREAST: {
    title_ar: "تتبيلات صدور الدجاج الطرية والمقاومة للجفاف",
    cooking_tip: "لا تطهِ صدور الدجاج زيادة عن 6-8 دقائق على نار متوسطة؛ الإفراط في الطهي هو السبب الوحيد في جفاف لحم الصدر.",
    prep_options: [
      {
        id: "PAN_SHAWARMA_ARABIC",
        name_ar: "شاورما الطاسة المنزلية المتبلة بالخل والليمون",
        free_ingredients_ar: "خل أبيض، عصير ليمونة، بودرة ثوم وبصل، بابريكا مدخنة، بهارات شاورما",
        technique_ar: "تقطيع الصدور شرائح رفيعة ونقعها بالتتبيلة 10 دقائق، ثم تشويحها على مقلاة ساخنة جداً في 4-5 دقائق."
      },
      {
        id: "LEMON_THYME_GRILLED",
        name_ar: "صدور الدجاج المشوية بالليمون والزعتر البري",
        free_ingredients_ar: "عصير ليمون، زعتر مجفف، فلفل أسود، مسحة زيت زيتون، رشة بابريكا",
        technique_ar: "شق الصدر طولياً (Butterfly) لضمان سرعة النضج، وتتبيله وشواؤه على الجريل 3 دقائق لكل وجه."
      },
      {
        id: "AIRFRYER_CHICKEN_KOFTA",
        name_ar: "كفتة الدجاج المشوية في القلاية الهوائية / الفرن",
        free_ingredients_ar: "بقدونس مفروم، بصل مبشور مصفى، رشة كزبرة، فلفل أسود، كمون",
        technique_ar: "فرم الصدور مع البقدونس والتوابل وتشكيلها أصابع كفتة وشواؤها في الإيرفراير 8 دقائق على 190 درجة."
      }
    ]
  },

  FISH: {
    title_ar: "طرق طهي الأسماك الخفيفة والشهية بدون زفارة",
    cooking_tip: "عصير الليمون والكمون والثوم والكزبرة اليابسة هم الرباعي الذهبي للسمك اللذيذ السريع.",
    prep_options: [
      {
        id: "RADDA_GRILLED_EGYPTIAN",
        name_ar: "سمك مشوي بالردة والليمون والثوم (بلطي / فيليه)",
        free_ingredients_ar: "تتبيلة ثوم مفروم، كمون، كزبرة يابسة، عصير ليمون وفير، رشة شطة، تغطية ردة خفيفة",
        technique_ar: "تتبيل السمك وشواؤه على الجريل أو الصاج الحامي، ثم رشه بالخل والليمون والثوم فور خروجه ساخناً."
      },
      {
        id: "OVEN_SINGARY_TRAY",
        name_ar: "صينية سمك سنجاري بالفرن مع الخضار المشوي (لايت)",
        free_ingredients_ar: "شرائح فلفل أخضر، بصل، طماطم، كرفس، شرائح ليمون، كمون وبهارات سمك",
        technique_ar: "فتح السمك من الظهر وفرد الخضار المتبل فوقه وخبزه بالفرن 15 دقيقة حتى يتحمر طبيعياً بدون زيت زائد."
      },
      {
        id: "PAN_SEARED_HERB_FILLET",
        name_ar: "فيليه مشوي سريع بالأعشاب والليمون على المقلاة",
        free_ingredients_ar: "عصير نصف ليمونة، شبت مفروم، فلفل أسود، رشة بابريكا، مسحة زيت خفيفة",
        technique_ar: "تشويح الفيليه دقيقتين ونصف لكل وجه على مقلاة ساخنة جداً وتقديمه مع عصرة ليمون طازجة."
      }
    ]
  },

  LEAN_BEEF: {
    title_ar: "أطباق اللحم البقري والكفتة الصحية اللذيذة",
    cooking_tip: "تجهيز اللحم المفروم كأصابع كفتة متبلة بالبصل والبقدونس يجعل طعمه ألذ 100 مرة من اللحم المسلوق.",
    prep_options: [
      {
        id: "CHARCOAL_STYLE_KOFTA",
        name_ar: "كفتة الحاتي المشوية دايت (عالفحم أو الإيرفراير)",
        free_ingredients_ar: "بصل مبشور ومعصور، بقدونس مفروم، بهارات لحم، رشة قرفة، فلفل أسود",
        technique_ar: "خلط المفروم مع البصل والبقدونس وعجنه جيداً وتشكيله أصابع، وشواؤه 8 دقائق في الإيرفراير أو الفرن."
      },
      {
        id: "SAVORY_MINCED_TOPPING",
        name_ar: "مفروم معصج دايت بصلصة الطماطم الخفيفة",
        free_ingredients_ar: "بصلة مفرومة، فلفل ألوان، رشة قرفة، ملعقة صلصة طماطم بيتي خفيفة",
        technique_ar: "تشويح اللحم المفروم مع البصل والتوابل بدون سمن حتى ينضج بدهونه الطبيعية، ويصب فوق الأرز أو البطاطس."
      },
      {
        id: "GRILLED_BEEF_SKEWERS",
        name_ar: "شيش كباب لحم مشوي مع الخضار",
        free_ingredients_ar: "مكعبات بصل وفلفل وطماطم، تتبيلة صويا صوص خفيف، ليمون، فلفل أسود",
        technique_ar: "وضع مكعبات اللحم في أسياخ بالتبادل مع الخضار وشواؤها حتى تصبح مقرمشة من الخارج وطرية من الداخل."
      }
    ]
  },

  RICE: {
    title_ar: "طرق طهي الأرز النثري الصحي بدون زيوت زائدة",
    cooking_tip: "نقع الأرز البسمتي أو المصري 10 دقائق وتشويحه بالبهارات الصحيحة يعطيك أرز مفلفل ونثري بأقل كمية دهون.",
    prep_options: [
      {
        id: "KABSA_SPICED_STEAM",
        name_ar: "أرز كبسة / بخاري باللومي والقرفة والزعفران",
        free_ingredients_ar: "حبة لومي أسود، عود قرفة، 2 حبة هيل، رشة كركم، ورق غار، مرقة دايت",
        technique_ar: "تشويح البهارات العطرية في المقلاة، ثم إضافة الأرز والماء المغلي وتركه ينضج نثرياً على نار هادئة جداً."
      },
      {
        id: "CARDAMOM_WHITE_BASMATI",
        name_ar: "أرز بسمتي مسلوق ومصفى بالهيل والمستكة (خفيف جداً)",
        free_ingredients_ar: "فصوص هيل، ورق غار، رشة ملح خفيف، ماء وفير",
        technique_ar: "سلق الأرز في ماء وفير كما تسلق المكرونة 9 دقائق وتصفيته بمصفاة؛ يقلل النشا ويكون خفيفاً وسريع الهضم."
      },
      {
        id: "EGYPTIAN_VERMICELLI_RICE",
        name_ar: "أرز مصري مفلفل بمسحة زيت وشعرية خفيفة",
        free_ingredients_ar: "ملعقة شعرية محمرة خفيفاً، رشة ملح، ماء مغلي مساوٍ للأرز",
        technique_ar: "تشويح الشعرية والأرز معاً حتى يسخن كل حبة، ثم سكب الماء المغلي وتغطيته على نار هادئة ليفلفل تماماً."
      }
    ]
  },

  POTATO: {
    title_ar: "طرق تحضير البطاطس والبطاطا المقرمشة والصحية",
    cooking_tip: "سلق البطاطس ثم تتبيلها وشواؤها في القلاية الهوائية يمنحك قوام الفرايز المقرمشة بمسحة زيت واحدة.",
    prep_options: [
      {
        id: "CRISPY_AIRFRYER_WEDGES",
        name_ar: "بطاطس ودجز مقرمشة بالأعشاب والبابريكا في الإيرفراير",
        free_ingredients_ar: "بابريكا مدخنة، زعتر بري، بودرة ثوم، رشة ملح، مسحة زيت خفيفة",
        technique_ar: "تقطيع البطاطس أصابع سميكة وتقليبها بالتوابل ومسحة الزيت، وشواؤها بالإيرفراير 14 دقيقة حتى تقرمش."
      },
      {
        id: "GARLIC_HERB_MASH",
        name_ar: "بيوريه البطاطس المهروسة الناعمة بالثوم والكمون",
        free_ingredients_ar: "فص ثوم مهروس، كمون، فلفل أسود، رشة بقدونس مفروم، نقطة حليب خفيف",
        technique_ar: "سلق البطاطس وهرسها بالشوكة وهي ساخنة مع التوابل ونقطة حليب حتى تصبح كريمية ودافئة."
      },
      {
        id: "CINNAMON_BAKED_SWEET",
        name_ar: "بطاطا حلوة مشوية ومهروسة برشة قرفة وفانيليا",
        free_ingredients_ar: "قرفة مطحونة، رشة فانيليا، سكر ستيفيا اختياري",
        technique_ar: "خبز البطاطا في الفرن حتى تعسل وتهرس بالشوكة مع القرفة؛ بديل ممتاز وممتع لكارب الغداء أو قبل التمرين."
      }
    ]
  },

  FOUL: {
    title_ar: "خلطات الفول المدمس الإسكندراني والعربي",
    cooking_tip: "إضافة عصير الليمون والكمون بعد التسخين مباشرة تحافظ على النكهة الطازجة وتمنع أي انتفاخ.",
    prep_options: [
      {
        id: "ALEXANDRIAN_LEMON_CUMIN",
        name_ar: "طبق الفول الإسكندراني بالكمون والليمون وزيت الزيتون",
        free_ingredients_ar: "عصير نصف ليمونة، كمون وفير، شطة وبابريكا، ملعقة زيت زيتون الخطة، بقدونس مفروم",
        technique_ar: "تسخين الفول وهرسه بالشوكة مع ملعقة ماء دافئ، وتقليبه مع الليمون والكمون وزيت الزيتون على الوجه."
      },
      {
        id: "TAHINI_SPICED_FOUL",
        name_ar: "فول بالطحينة الخام والليمون على الطريقة الشعبية",
        free_ingredients_ar: "ملعقة طحينة سمسم خام (من دهون الخطة)، ليمون، كمون، فلفل أخضر مقطع",
        technique_ar: "خلط الطحينة مع الليمون ورشة ماء حتى تبيض، وصبها فوق الفول الساخن المهروس."
      }
    ]
  }
};

export function getPrepOptionsForFood(foodIdentifier = '') {
  if (!foodIdentifier) return null;
  const upper = String(foodIdentifier).toUpperCase();

  if (upper.includes('OAT') || upper.includes('شوفان')) return CULINARY_PREP_CATALOG.OATS;
  if (upper.includes('COTTAGE') || upper.includes('قريش') || upper.includes('FETA') || upper.includes('فيتا')) return CULINARY_PREP_CATALOG.COTTAGE_CHEESE;
  if (upper.includes('EGG') || upper.includes('بيض') || upper.includes('SHAKSHOUKA') || upper.includes('شكشوكة') || upper.includes('OMELETTE')) return CULINARY_PREP_CATALOG.EGGS;
  if (upper.includes('CHICKEN') || upper.includes('دجاج') || upper.includes('فراخ') || upper.includes('SHAWARMA') || upper.includes('MADHBI')) return CULINARY_PREP_CATALOG.CHICKEN_BREAST;
  if (upper.includes('FISH') || upper.includes('سمك') || upper.includes('TILAPIA') || upper.includes('بلطي') || upper.includes('HAMOUR') || upper.includes('هامور') || upper.includes('BOURI') || upper.includes('بوري') || upper.includes('KANAAD') || upper.includes('كنعد') || upper.includes('TUNA') || upper.includes('تونة')) return CULINARY_PREP_CATALOG.FISH;
  if (upper.includes('BEEF') || upper.includes('لحم') || upper.includes('KOFTA') || upper.includes('كفتة') || upper.includes('LIVER') || upper.includes('كبدة') || upper.includes('HASHI') || upper.includes('حاشي')) return CULINARY_PREP_CATALOG.LEAN_BEEF;
  if (upper.includes('RICE') || upper.includes('أرز') || upper.includes('ارز') || upper.includes('KABSA') || upper.includes('كبسة') || upper.includes('FREEKEH') || upper.includes('فريك')) return CULINARY_PREP_CATALOG.RICE;
  if (upper.includes('POTATO') || upper.includes('بطاطس') || upper.includes('بطاطا')) return CULINARY_PREP_CATALOG.POTATO;
  if (upper.includes('FOUL') || upper.includes('فول') || upper.includes('FALAFEL') || upper.includes('طعمية')) return CULINARY_PREP_CATALOG.FOUL;

  return null;
}
