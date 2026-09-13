export class IntakeValidationError extends Error {
  constructor(issues = [], message = null, code = "INVALID_CLIENT_INTAKE", field = null, value = undefined) {
    const defaultMsg = Array.isArray(issues) && issues.length > 0
      ? `Client intake validation failed with ${issues.length} issue(s).`
      : "Client intake validation failed.";
    super(message || defaultMsg);
    this.name = "IntakeValidationError";
    this.code = code;
    this.field = field;
    this.value = value;
    this.issues = Array.isArray(issues) ? issues : (field ? [{ path: field, code, message: this.message }] : []);
  }
}
