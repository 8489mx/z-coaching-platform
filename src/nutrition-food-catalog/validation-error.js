export class NutritionFoodCatalogValidationError extends Error {
  /**
   * @param {import("./domain/contracts.js").NutritionFoodCatalogValidationIssue[]} issues
   */
  constructor(issues) {
    super("Nutrition food catalog validation failed.");
    this.name = "NutritionFoodCatalogValidationError";
    this.issues = issues;
  }
}
