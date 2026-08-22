/**
 * Frontend Culinary Recipes & Prep Options Engine (Z-Coaching 2026)
 *
 * 100% accessible home recipes relying on cooking physics and zero-calorie seasonings.
 * Zero expensive/imported ingredients (e.g. no oat milk, no almond flour).
 */

export const CULINARY_RECIPES_DATABASE = Object.freeze({
  COTTAGE_CHEESE: {
    title_ar: "موس الجبن القريش الكريمي بالزعتر والبابريكا",
    title_en: "Whipped Savory Cottage Cheese Mousse",
    prep_time_ar: "3 دقائق",
    prep_time_minutes: 3,
    prep_options: [
      {
        id: "WHIPPED_SAVORY_CREAM",
        name_ar: "موس القريش الحادق (Whipped Savory Cream)",
        free_ingredients_ar: "ملعقتان ماء دافئ (أو رشة لبن)، رشة زعتر، كمون، بابريكا، ومكعبات خيار وطماطم",
        technique_ar: "خفق بالشوكة أو الخلاط دقيقة حتى يتحول لموس قشطة ناعم مع الخضار والتوابل وزيت الخطة."
      },
      {
        id: "SWEET_DESSERT_MOUSSE",
        name_ar: "موس التشيز كيك الحلو (Sweet Dessert Mousse)",
        free_ingredients_ar: "ملعقتان ماء دافئ، كيس سكر دايت (ستيفيا)، رشة قرفة أو فانيليا سائلة (أو كاكاو خام)",
        technique_ar: "خفق ناعم جداً بالخلاط؛ يتحول إلى قوام دانيت أو بودينغ شيكولاتة/فانيليا عالي البروتين وخالي من السكر."
      },
      {
        id: "SPICY_COTTAGE_SALAD",
        name_ar: "سلطة قريش جبنة قديمة دايت (Spicy Cottage Salad)",
        free_ingredients_ar: "رشة شطة خفيفة، كمون، طماطم مفرومة، فلفل رومي/حار مقطع ناعم مع قطرات ليمون",
        technique_ar: "هرس بالشوكة مع الخضار؛ يعطي طعم وملمس الجبنة المتبلة دون أملاح زائدة أو دهون."
      }
    ],
    cooking_tip: "السر في ضرب القريش بالماء الدافئ للتخلص من التكتلات وتحويلها لقوام كريمي غني ومحبب للسان."
  },
  EGGS: {
    title_ar: "أومليت البيض الذهبي الهش بالأعشاب",
    title_en: "Golden Herb & Veggie Omelette",
    prep_time_ar: "5 دقائق",
    prep_time_minutes: 5,
    prep_options: [
      {
        id: "CREAMY_EGG_SALAD",
        name_ar: "سلطة البيض بالخردل والزبادي (Creamy Egg Salad)",
        free_ingredients_ar: "البيض المسلوق المخصص + ملعقة زبادي عادي + نصف ملعقة مستردة خردل + بابريكا وفلفل أسود",
        technique_ar: "هرس بالشوكة وخلط المكونات، وتؤكل بالملعقة أو تفرد داخل رغيف الخبز البلدي/التوست."
      },
      {
        id: "ONE_PAN_SHAKSHOUKA",
        name_ar: "شكشوكة الطاسة السريعة (One-Pan Shakshouka)",
        free_ingredients_ar: "طماطم مقطعة، فلفل أخضر، بصلة صغيرة، رشة كمون وفلفل أسود، مسحة زيت الخطة",
        technique_ar: "تسبيك الخضار في مقلاة دقيقتين، ثم كسر البيض فوقه وتغطيته على نار هادئة حتى ينضج على البخار."
      },
      {
        id: "FLUFFY_CLOUD_OMELETTE",
        name_ar: "الأومليت الهش المرتفع (Fluffy Cloud Omelette)",
        free_ingredients_ar: "ملعقة ماء بارد، رشة كزبرة يابسة، فلفل أسود، ملح خفيف، ومسحة زيت طهي",
        technique_ar: "خفق البيض مع ملعقة ماء بارد قبل الصب؛ يتبخر الماء أثناء الطهي ليمنح الأومليت حجماً مضاعفاً وقواماً إسفنجياً."
      }
    ],
    cooking_tip: "إضافة ملعقة ماء بارد مع خفق البيض يجعل الأومليت هشاً ومنتفخاً دون الحاجة لإضافة حليب أو زبدة زائدة."
  },
  ROLLED_OATS: {
    title_ar: "بودينغ الشوفان بالقرفة بالماء الساخن (Classic Warm Oats)",
    title_en: "Classic Warm Cinnamon Oatmeal Porridge",
    prep_time_ar: "4 دقائق",
    prep_time_minutes: 4,
    prep_options: [
      {
        id: "CLASSIC_WARM_OATS",
        name_ar: "بودينغ الشوفان بالقرفة بالماء الساخن (Classic Warm Oats)",
        free_ingredients_ar: "ماء مغلي، رشة قرفة مطحونة، رشة فانيليا، سكر ستيفيا دايت، وفاكهة الخطة",
        technique_ar: "طهي الشوفان مع ماء مغلي وقرفة وستيفيا حتى يتشرب ويتضاعف حجمه 3 مرات مع إضافة الفاكهة."
      },
      {
        id: "OVERNIGHT_CHOCOLATE_OATS",
        name_ar: "شوفان الشوكولاتة والزبادي (Overnight Chocolate Oats)",
        free_ingredients_ar: "نصف كوب ماء + علبة زبادي عادي + ملعقة صغيرة كاكاو خام غير محلى + سكر دايت",
        technique_ar: "نقع الشوفان في الماء والزبادي والكاكاو والستيفيا بالثلاجة لساعة؛ يعطي قوام كيك الشوكولاتة الباردة."
      },
      {
        id: "SAVORY_OATS_SOUP",
        name_ar: "شوربة الشوفان المالحة (Savory Oats Soup)",
        free_ingredients_ar: "ماء ساخن، فلفل أسود، كمون مطحون، ورشة بهارات دجاج أو كاري",
        technique_ar: "طهي الشوفان في ماء مع بهارات الدجاج والفلفل الأسود (بديل ساخن للأرز لمن يفضل الإفطار المالح)."
      }
    ],
    cooking_tip: "طهي الشوفان بالماء المغلي ورشة القرفة يضاعف حجم الحبوب 3 أضعاف ويعطي شبعاً هائلاً دون الحاجة لألبان مستوردة."
  },
  CHICKEN_BREAST: {
    title_ar: "صدور دجاج مشوية طرية مقاومة للجفاف",
    title_en: "Juicy Herb & Lemon Grilled Chicken Breast",
    prep_time_ar: "10 دقائق",
    prep_time_minutes: 10,
    prep_options: [
      {
        id: "HOME_PAN_SHAWARMA",
        name_ar: "شاورما الطاسة المنزلية (Home Pan Shawarma)",
        free_ingredients_ar: "خل أبيض، عصير ليمون، بودرة ثوم، بودرة بصل، بابريكا مدخنة، وبهارات شاورما",
        technique_ar: "تقطيع الصدور شرائح رفيعة وتتبيلها بالخل والليمون والتوابل، وتشويحها على مقلاة ساخنة جداً في 4 دقائق."
      },
      {
        id: "GRILLED_CHICKEN_KOFTA",
        name_ar: "كفتة الفراخ المشوية في القلاية/الفرن (Chicken Kofta)",
        free_ingredients_ar: "بقدونس مفروم، بصل مبشور مصفى من الماء، بهارات دجاج، فلفل أسود، ورشة كزبرة",
        technique_ar: "فرم الصدور مع البقدونس والبصل والتوابل، وتشكيلها كأصابع كفتة وشواؤها في الإيرفراير أو الفرن 8 دقائق."
      },
      {
        id: "BUTTERFLY_LEMON_THYME",
        name_ar: "صدور الليمون والزعتر السريعة (Butterfly Cut)",
        free_ingredients_ar: "عصير ليمونة، رشة زعتر بري، فلفل أسود، ورشة ملح خفيف مع مسحة زيت الخطة",
        technique_ar: "شق الصدر عرضياً (فراشة) لتقليل السمك، وشواؤه دقيقتين لكل وجه لحبس السوائل ومنع جفاف النسيج."
      }
    ],
    cooking_tip: "ترك الدجاج يرتاح لمدة دقيقتين بعد الشواء يعيد توزيع العصارة داخل الأنسجة ويمنع جفاف الصدر نهائياً."
  }
});

export function getPrepOptionsForFood(foodCode) {
  if (!foodCode) return null;
  const upper = String(foodCode).toUpperCase();
  if (upper.includes("COTTAGE") || upper.includes("CHEESE") || upper.includes("قريش")) {
    return CULINARY_RECIPES_DATABASE.COTTAGE_CHEESE;
  }
  if (upper.includes("EGG") || upper.includes("بيض")) {
    return CULINARY_RECIPES_DATABASE.EGGS;
  }
  if (upper.includes("OAT") || upper.includes("شوفان")) {
    return CULINARY_RECIPES_DATABASE.ROLLED_OATS;
  }
  if (upper.includes("CHICKEN") || upper.includes("دجاج") || upper.includes("فراخ")) {
    return CULINARY_RECIPES_DATABASE.CHICKEN_BREAST;
  }
  return null;
}
