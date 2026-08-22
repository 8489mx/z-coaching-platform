/**
 * Error raised when an Excel workbook cannot be safely mapped to food catalog
 * records. Domain validation errors are deliberately not wrapped by this type.
 */
export class NutritionFoodCatalogWorkbookValidationError extends Error {
  /**
   * @param {Array<{
   *   sheet: string|null,
   *   row: number|null,
   *   column: string|null,
   *   code: string,
   *   message: string,
   * }>} issues
   */
  constructor(issues) {
    super("Nutrition food catalog workbook validation failed.");
    this.name = "NutritionFoodCatalogWorkbookValidationError";
    this.issues = issues;
  }
}
