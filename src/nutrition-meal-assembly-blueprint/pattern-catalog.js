import { NutritionMealRole } from "../nutrition-meal-distribution/index.js";
import {
  NutritionAddedFatPolicy,
  NutritionComponentRequirement,
  NutritionFoodClass,
  NutritionMealComponentSlot,
  NutritionMealPatternCode,
} from "./domain/enums.js";

const OPTIONAL_FAT_POLICY =
  NutritionAddedFatPolicy.OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS;

function slot(
  sequence,
  componentSlot,
  requirement,
  minItems,
  maxItems,
  allowedFoodClasses,
) {
  return {
    sequence,
    slot: componentSlot,
    requirement,
    min_items: minItems,
    max_items: maxItems,
    allowed_food_classes: allowedFoodClasses,
  };
}

function requiredSlot(sequence, componentSlot, maxItems, foodClasses) {
  return slot(
    sequence,
    componentSlot,
    NutritionComponentRequirement.REQUIRED,
    1,
    maxItems,
    foodClasses,
  );
}

function optionalSlot(sequence, componentSlot, foodClasses) {
  return slot(
    sequence,
    componentSlot,
    NutritionComponentRequirement.OPTIONAL,
    0,
    1,
    foodClasses,
  );
}

function addedFatSlot(sequence) {
  return optionalSlot(
    sequence,
    NutritionMealComponentSlot.ADDED_FAT,
    [NutritionFoodClass.ADDED_FAT],
  );
}

function pattern(code, mealRole, slots) {
  return {
    code,
    meal_role: mealRole,
    added_fat_policy: OPTIONAL_FAT_POLICY,
    slots,
  };
}

function classicPlateSlots() {
  return [
    requiredSlot(
      1,
      NutritionMealComponentSlot.PROTEIN_ANCHOR,
      1,
      [
        NutritionFoodClass.ANIMAL_PROTEIN,
        NutritionFoodClass.EGG,
        NutritionFoodClass.DAIRY_PROTEIN,
        NutritionFoodClass.LEGUME,
      ],
    ),
    requiredSlot(
      2,
      NutritionMealComponentSlot.CARBOHYDRATE_BASE,
      1,
      [NutritionFoodClass.STARCH],
    ),
    requiredSlot(
      3,
      NutritionMealComponentSlot.VEGETABLE,
      2,
      [NutritionFoodClass.NON_STARCH_VEGETABLE],
    ),
    addedFatSlot(4),
  ];
}

function legumePlateSlots() {
  return [
    requiredSlot(
      1,
      NutritionMealComponentSlot.PROTEIN_ANCHOR,
      1,
      [NutritionFoodClass.LEGUME],
    ),
    requiredSlot(
      2,
      NutritionMealComponentSlot.CARBOHYDRATE_BASE,
      1,
      [NutritionFoodClass.STARCH],
    ),
    requiredSlot(
      3,
      NutritionMealComponentSlot.VEGETABLE,
      2,
      [NutritionFoodClass.NON_STARCH_VEGETABLE],
    ),
    optionalSlot(
      4,
      NutritionMealComponentSlot.DAIRY_SUPPORT,
      [NutritionFoodClass.DAIRY_PROTEIN],
    ),
    addedFatSlot(5),
  ];
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

const PATTERN_CATALOG = deepFreeze([
  pattern(
    NutritionMealPatternCode.BREAKFAST_SAVORY,
    NutritionMealRole.BREAKFAST,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        2,
        [
          NutritionFoodClass.EGG,
          NutritionFoodClass.DAIRY_PROTEIN,
          NutritionFoodClass.ANIMAL_PROTEIN,
          NutritionFoodClass.LEGUME,
        ],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.VEGETABLE,
        2,
        [NutritionFoodClass.NON_STARCH_VEGETABLE],
      ),
      addedFatSlot(4),
    ],
  ),
  pattern(
    NutritionMealPatternCode.BREAKFAST_DAIRY_FRUIT,
    NutritionMealRole.BREAKFAST,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [NutritionFoodClass.DAIRY_PROTEIN],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.FRUIT,
        1,
        [NutritionFoodClass.FRUIT],
      ),
      addedFatSlot(4),
    ],
  ),
  pattern(
    NutritionMealPatternCode.BREAKFAST_LEGUME,
    NutritionMealRole.BREAKFAST,
    legumePlateSlots(),
  ),
  pattern(
    NutritionMealPatternCode.MAIN_CLASSIC,
    NutritionMealRole.MAIN_MEAL,
    classicPlateSlots(),
  ),
  pattern(
    NutritionMealPatternCode.MAIN_LEGUME,
    NutritionMealRole.MAIN_MEAL,
    legumePlateSlots(),
  ),
  pattern(
    NutritionMealPatternCode.EVENING_CLASSIC,
    NutritionMealRole.EVENING_MEAL,
    classicPlateSlots(),
  ),
  pattern(
    NutritionMealPatternCode.EVENING_LIGHT_SAVORY,
    NutritionMealRole.EVENING_MEAL,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        2,
        [
          NutritionFoodClass.EGG,
          NutritionFoodClass.DAIRY_PROTEIN,
          NutritionFoodClass.ANIMAL_PROTEIN,
        ],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.VEGETABLE,
        2,
        [NutritionFoodClass.NON_STARCH_VEGETABLE],
      ),
      addedFatSlot(4),
    ],
  ),
  pattern(
    NutritionMealPatternCode.SNACK_DAIRY_FRUIT,
    NutritionMealRole.SNACK,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [NutritionFoodClass.DAIRY_PROTEIN],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.FRUIT,
        1,
        [NutritionFoodClass.FRUIT],
      ),
      optionalSlot(
        3,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        [NutritionFoodClass.STARCH],
      ),
      addedFatSlot(4),
    ],
  ),
  pattern(
    NutritionMealPatternCode.SNACK_PROTEIN_CARB,
    NutritionMealRole.SNACK,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [
          NutritionFoodClass.DAIRY_PROTEIN,
          NutritionFoodClass.EGG,
          NutritionFoodClass.ANIMAL_PROTEIN,
        ],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      optionalSlot(
        3,
        NutritionMealComponentSlot.FRUIT,
        [NutritionFoodClass.FRUIT],
      ),
      addedFatSlot(4),
    ],
  ),
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  if (!Object.isFrozen(value)) {
    return false;
  }
  return Reflect.ownKeys(value).every((key) =>
    isDeepFrozen(value[key], seen));
}

function isRequiredSlot(patternValue, componentSlot) {
  return patternValue.slots.some(
    (slotValue) =>
      slotValue.slot === componentSlot &&
      slotValue.requirement === NutritionComponentRequirement.REQUIRED,
  );
}

function validateRoleRequirements(patternValue) {
  const hasRequiredProtein = isRequiredSlot(
    patternValue,
    NutritionMealComponentSlot.PROTEIN_ANCHOR,
  );
  const hasRequiredCarbohydrate = isRequiredSlot(
    patternValue,
    NutritionMealComponentSlot.CARBOHYDRATE_BASE,
  );
  const hasRequiredVegetable = isRequiredSlot(
    patternValue,
    NutritionMealComponentSlot.VEGETABLE,
  );
  const hasRequiredFruit = isRequiredSlot(
    patternValue,
    NutritionMealComponentSlot.FRUIT,
  );

  if (!hasRequiredProtein) {
    throw new TypeError(
      `Pattern ${patternValue.code} must contain a required PROTEIN_ANCHOR.`,
    );
  }
  if (
    patternValue.meal_role === NutritionMealRole.BREAKFAST &&
    (!hasRequiredCarbohydrate ||
      (!hasRequiredFruit && !hasRequiredVegetable))
  ) {
    throw new TypeError(
      `Breakfast pattern ${patternValue.code} must require carbohydrate and fruit or vegetable.`,
    );
  }
  if (
    [NutritionMealRole.MAIN_MEAL, NutritionMealRole.EVENING_MEAL].includes(
      patternValue.meal_role,
    ) &&
    (!hasRequiredCarbohydrate || !hasRequiredVegetable)
  ) {
    throw new TypeError(
      `Plate pattern ${patternValue.code} must require protein, carbohydrate, and vegetable.`,
    );
  }
  if (
    patternValue.meal_role === NutritionMealRole.SNACK &&
    !hasRequiredFruit &&
    !hasRequiredCarbohydrate
  ) {
    throw new TypeError(
      `Snack pattern ${patternValue.code} must require fruit or carbohydrate with protein.`,
    );
  }
}

function validatePatternCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new TypeError("Pattern catalog must be a non-empty array.");
  }

  const knownCodes = Object.values(NutritionMealPatternCode);
  const knownRoles = Object.values(NutritionMealRole);
  const knownSlots = Object.values(NutritionMealComponentSlot);
  const knownRequirements = Object.values(NutritionComponentRequirement);
  const knownFoodClasses = Object.values(NutritionFoodClass);
  const knownFatPolicies = Object.values(NutritionAddedFatPolicy);
  const patternCodes = new Set();

  for (const patternValue of catalog) {
    if (!isObject(patternValue)) {
      throw new TypeError("Every pattern must be an object.");
    }
    if (!knownCodes.includes(patternValue.code) ||
        patternCodes.has(patternValue.code)) {
      throw new TypeError("Pattern codes must be known and unique.");
    }
    patternCodes.add(patternValue.code);
    if (!knownRoles.includes(patternValue.meal_role)) {
      throw new TypeError(`Pattern ${patternValue.code} has an unknown role.`);
    }
    if (!knownFatPolicies.includes(patternValue.added_fat_policy) ||
        patternValue.added_fat_policy !== OPTIONAL_FAT_POLICY) {
      throw new TypeError(
        `Pattern ${patternValue.code} has an invalid added-fat policy.`,
      );
    }
    if (!Array.isArray(patternValue.slots) ||
        patternValue.slots.length === 0) {
      throw new TypeError(`Pattern ${patternValue.code} must contain slots.`);
    }

    const slotCodes = new Set();
    let requiredSlotCount = 0;
    let addedFatCount = 0;
    let proteinAnchorCount = 0;

    patternValue.slots.forEach((slotValue, index) => {
      if (!isObject(slotValue)) {
        throw new TypeError(`Pattern ${patternValue.code} has a non-object slot.`);
      }
      if (!Number.isInteger(slotValue.sequence) ||
          slotValue.sequence !== index + 1) {
        throw new TypeError(
          `Pattern ${patternValue.code} slot sequence must start at 1 and be contiguous.`,
        );
      }
      if (!knownSlots.includes(slotValue.slot) || slotCodes.has(slotValue.slot)) {
        throw new TypeError(
          `Pattern ${patternValue.code} slot codes must be known and unique.`,
        );
      }
      slotCodes.add(slotValue.slot);
      if (!knownRequirements.includes(slotValue.requirement)) {
        throw new TypeError(
          `Pattern ${patternValue.code} has an unknown slot requirement.`,
        );
      }
      if (!Number.isInteger(slotValue.min_items) || slotValue.min_items < 0 ||
          !Number.isInteger(slotValue.max_items) || slotValue.max_items <= 0 ||
          slotValue.min_items > slotValue.max_items) {
        throw new TypeError(
          `Pattern ${patternValue.code} has invalid slot item bounds.`,
        );
      }
      if (
        slotValue.requirement === NutritionComponentRequirement.REQUIRED &&
        slotValue.min_items < 1
      ) {
        throw new TypeError(
          `Pattern ${patternValue.code} required slots need at least one item.`,
        );
      }
      if (
        slotValue.requirement === NutritionComponentRequirement.OPTIONAL &&
        slotValue.min_items !== 0
      ) {
        throw new TypeError(
          `Pattern ${patternValue.code} optional slots must have min_items 0.`,
        );
      }
      if (!Array.isArray(slotValue.allowed_food_classes) ||
          slotValue.allowed_food_classes.length === 0 ||
          slotValue.allowed_food_classes.some(
            (foodClass) => !knownFoodClasses.includes(foodClass),
          ) ||
          new Set(slotValue.allowed_food_classes).size !==
            slotValue.allowed_food_classes.length) {
        throw new TypeError(
          `Pattern ${patternValue.code} must use known, unique food classes.`,
        );
      }

      if (slotValue.requirement === NutritionComponentRequirement.REQUIRED) {
        requiredSlotCount += 1;
      }
      if (slotValue.slot === NutritionMealComponentSlot.PROTEIN_ANCHOR) {
        proteinAnchorCount += 1;
      }
      if (slotValue.slot === NutritionMealComponentSlot.ADDED_FAT) {
        addedFatCount += 1;
        if (
          slotValue.requirement !== NutritionComponentRequirement.OPTIONAL ||
          slotValue.min_items !== 0 ||
          slotValue.max_items !== 1 ||
          slotValue.allowed_food_classes.length !== 1 ||
          slotValue.allowed_food_classes[0] !== NutritionFoodClass.ADDED_FAT
        ) {
          throw new TypeError(
            `Pattern ${patternValue.code} added fat must be optional 0..1 only.`,
          );
        }
      } else if (
        slotValue.allowed_food_classes.includes(NutritionFoodClass.ADDED_FAT)
      ) {
        throw new TypeError(
          `Pattern ${patternValue.code} cannot expose free added fat.`,
        );
      }
    });

    if (requiredSlotCount === 0 || proteinAnchorCount !== 1 ||
        addedFatCount !== 1) {
      throw new TypeError(
        `Pattern ${patternValue.code} must contain required components, one protein anchor, and one optional added-fat slot.`,
      );
    }
    validateRoleRequirements(patternValue);
    if (!isDeepFrozen(patternValue)) {
      throw new TypeError(`Pattern ${patternValue.code} must be deeply frozen.`);
    }
  }

  if (
    patternCodes.size !== knownCodes.length ||
    knownCodes.some((code) => !patternCodes.has(code))
  ) {
    throw new TypeError("Pattern catalog must contain every V1 pattern exactly once.");
  }
  if (!isDeepFrozen(catalog)) {
    throw new TypeError("Pattern catalog must be deeply frozen.");
  }
}

validatePatternCatalog(PATTERN_CATALOG);

export function getPatternsForMealRole(mealRole) {
  if (!Object.values(NutritionMealRole).includes(mealRole)) {
    throw new TypeError("mealRole must be a NutritionMealRole.");
  }
  return structuredClone(
    PATTERN_CATALOG.filter((patternValue) =>
      patternValue.meal_role === mealRole),
  );
}
