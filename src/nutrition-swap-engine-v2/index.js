export {
  NUTRITION_SWAP_ENGINE_V2_VERSION,
  MealTimeCategory,
  FoodMacroType,
} from "./domain/enums.js";

export {
  SMART_SWAP_REGISTRY,
  getSmartFoodRegistryItem,
  listSmartSwapCandidates,
} from "./swap-pool-registry.js";

export { calculateSmartSwap } from "./calculate-smart-swap.js";
