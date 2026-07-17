import { BudgetLevel } from "z-coaching-intake-decision-engine";
import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodSourceType,
  NutritionFoodState,
  NutritionMarketCode,
} from "z-coaching-intake-decision-engine/nutrition-food-catalog";
import {
  NutritionFoodClass,
  NutritionMealPatternCode,
} from "z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint";

export const NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION =
  "nutrition-food-catalog-workbook-v1";

export const INPUT_ROW_START = 2;
export const INPUT_ROW_END = 1001;

export const WORKSHEET_ORDER = Object.freeze([
  "Instructions",
  "Foods",
  "Nutrition",
  "Portions",
  "Patterns",
  "Markets",
  "Tags",
  "Swap_Groups",
  "_Lists",
]);

export const DATA_WORKSHEET_NAMES = Object.freeze([
  "Foods",
  "Nutrition",
  "Portions",
  "Patterns",
  "Markets",
  "Tags",
  "Swap_Groups",
]);

export const WORKSHEET_HEADERS = Object.freeze({
  Foods: Object.freeze([
    "food_code",
    "name_ar",
    "name_en",
    "food_class",
    "food_state",
    "is_active",
    "selection_priority",
    "budget_level",
    "requires_storage",
    "requires_reheating",
    "source_type",
    "source_name",
    "source_reference",
    "source_checked_date",
  ]),
  Nutrition: Object.freeze([
    "food_code",
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
  ]),
  Portions: Object.freeze([
    "food_code",
    "minimum_g",
    "maximum_g",
    "step_g",
    "default_g",
  ]),
  Patterns: Object.freeze(["food_code", "pattern_order", "pattern_code"]),
  Markets: Object.freeze(["food_code", "market_order", "market_code"]),
  Tags: Object.freeze([
    "food_code",
    "tag_type",
    "tag_order",
    "tag_code",
  ]),
  Swap_Groups: Object.freeze([
    "food_code",
    "is_swappable",
    "group_code",
  ]),
});

export const BOOLEAN_TEXT_VALUES = Object.freeze(["TRUE", "FALSE"]);
export const TAG_TYPE_VALUES = Object.freeze([
  "IDENTITY",
  "ALLERGEN",
  "INTOLERANCE",
]);

const freezeEnumValues = (runtimeEnum) =>
  Object.freeze([...Object.values(runtimeEnum)]);

export const LIST_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: "food_class",
    header: "NutritionFoodClass",
    rangeName: "NutritionFoodClassList",
    values: freezeEnumValues(NutritionFoodClass),
  }),
  Object.freeze({
    key: "food_state",
    header: "NutritionFoodState",
    rangeName: "NutritionFoodStateList",
    values: freezeEnumValues(NutritionFoodState),
  }),
  Object.freeze({
    key: "source_type",
    header: "NutritionFoodSourceType",
    rangeName: "NutritionFoodSourceTypeList",
    values: freezeEnumValues(NutritionFoodSourceType),
  }),
  Object.freeze({
    key: "market_code",
    header: "NutritionMarketCode",
    rangeName: "NutritionMarketCodeList",
    values: freezeEnumValues(NutritionMarketCode),
  }),
  Object.freeze({
    key: "pattern_code",
    header: "NutritionMealPatternCode",
    rangeName: "NutritionMealPatternCodeList",
    values: freezeEnumValues(NutritionMealPatternCode),
  }),
  Object.freeze({
    key: "budget_level",
    header: "BudgetLevel",
    rangeName: "BudgetLevelList",
    values: freezeEnumValues(BudgetLevel),
  }),
  Object.freeze({
    key: "boolean",
    header: "Boolean",
    rangeName: "BooleanList",
    values: BOOLEAN_TEXT_VALUES,
  }),
  Object.freeze({
    key: "tag_type",
    header: "TagType",
    rangeName: "TagTypeList",
    values: TAG_TYPE_VALUES,
  }),
]);

export const INSTRUCTIONS_METADATA = Object.freeze([
  Object.freeze({
    label: "Workbook Version",
    value: NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION,
  }),
  Object.freeze({
    label: "Target Catalog Version",
    value: NUTRITION_FOOD_CATALOG_VERSION,
  }),
  Object.freeze({ label: "Nutrition Basis", value: "PER_100G" }),
  Object.freeze({
    label: "Supported Markets",
    value: Object.values(NutritionMarketCode).join(","),
  }),
]);

export const ARABIC_INSTRUCTIONS = Object.freeze([
  "كل القيم الغذائية في Sheet Nutrition تُكتب لكل 100 جرام، وليست Per Serving.",
  "Food State جزء من هوية الطعام، ويجب توثيق الحالة المستخدمة في القيم الغذائية.",
  "استخدم food_code نفسه حرفيًا للربط بين جميع الشيتات.",
  "Portion Rule يحدد حدود الجرامات وخطوة الزيادة، ولا يمثل كمية مختارة للعميل.",
  "اكتب Identity وAllergen وIntolerance Tags في صفوف منفصلة مع الحفاظ على ترتيب كل نوع.",
  "لا تُدخل أي طعام دون مصدر موثق ومرجع وتاريخ مراجعة.",
  "استخدم صفًا واحدًا لكل طعام في Foods وNutrition وPortions وSwap_Groups.",
  "القالب الحالي فارغ ومخصص لإدخال البيانات؛ ولا يحتوي مكتبة أطعمة إنتاجية.",
]);

export const WORKBOOK_PROPERTIES = Object.freeze({
  creator: "Z Coaching",
  lastModifiedBy: "Z Coaching",
  company: "Z System's",
  title: "Nutrition Food Catalog V1",
  subject: "Food catalog data-entry template",
  fixedDate: "2025-01-01T00:00:00.000Z",
});

export const COLUMN_WIDTHS = Object.freeze({
  Foods: Object.freeze([20, 28, 28, 25, 18, 14, 19, 17, 20, 21, 31, 28, 42, 22]),
  Nutrition: Object.freeze([20, 18, 16, 14, 22, 14]),
  Portions: Object.freeze([20, 16, 16, 14, 16]),
  Patterns: Object.freeze([20, 17, 34]),
  Markets: Object.freeze([20, 16, 18]),
  Tags: Object.freeze([20, 18, 15, 30]),
  Swap_Groups: Object.freeze([20, 18, 30]),
});

export const DROPDOWN_COLUMNS = Object.freeze({
  Foods: Object.freeze({
    food_class: "food_class",
    food_state: "food_state",
    is_active: "boolean",
    budget_level: "budget_level",
    requires_storage: "boolean",
    requires_reheating: "boolean",
    source_type: "source_type",
  }),
  Patterns: Object.freeze({ pattern_code: "pattern_code" }),
  Markets: Object.freeze({ market_code: "market_code" }),
  Tags: Object.freeze({ tag_type: "tag_type" }),
  Swap_Groups: Object.freeze({ is_swappable: "boolean" }),
});

export const NUMERIC_COLUMNS = Object.freeze({
  Foods: Object.freeze({
    selection_priority: Object.freeze({ type: "whole", minimum: 1 }),
  }),
  Nutrition: Object.freeze({
    calories_kcal: Object.freeze({ type: "decimal", minimum: 0, maximum: 1000 }),
    protein_g: Object.freeze({ type: "decimal", minimum: 0, maximum: 100 }),
    fat_g: Object.freeze({ type: "decimal", minimum: 0, maximum: 100 }),
    carbohydrate_g: Object.freeze({ type: "decimal", minimum: 0, maximum: 100 }),
    fiber_g: Object.freeze({ type: "decimal", minimum: 0, maximum: 100 }),
  }),
  Portions: Object.freeze({
    minimum_g: Object.freeze({ type: "whole", minimum: 1 }),
    maximum_g: Object.freeze({ type: "whole", minimum: 1 }),
    step_g: Object.freeze({ type: "whole", minimum: 1 }),
    default_g: Object.freeze({ type: "whole", minimum: 1 }),
  }),
  Patterns: Object.freeze({
    pattern_order: Object.freeze({ type: "whole", minimum: 1 }),
  }),
  Markets: Object.freeze({
    market_order: Object.freeze({ type: "whole", minimum: 1 }),
  }),
  Tags: Object.freeze({
    tag_order: Object.freeze({ type: "whole", minimum: 1 }),
  }),
});
