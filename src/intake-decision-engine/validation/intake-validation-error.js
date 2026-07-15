export class IntakeValidationError extends Error {
  constructor(issues) {
    super(`Client intake validation failed with ${issues.length} issue(s).`);
    this.name = "IntakeValidationError";
    this.code = "INVALID_CLIENT_INTAKE";
    this.issues = issues;
  }
}
