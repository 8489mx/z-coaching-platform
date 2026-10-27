/**
 * Staff Role & Resource Ownership Governance Engine (V2)
 *
 * Implements strict, auditable authorization boundaries (RBAC & ABAC):
 * 1. Definitive staff roles (ADMIN, COACH, ASSISTANT_COACH, CLIENT/TRAINEE).
 * 2. Strict resource ownership: Clients can NEVER access, inspect, or modify another client's data.
 * 3. Privilege enforcement: Clients can NEVER perform coach/admin actions (publish, unlock lockouts, toggle freeze).
 * 4. Zero Emojis and clean executive security auditing.
 */

export const STAFF_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  COACH: "COACH",
  ASSISTANT_COACH: "ASSISTANT_COACH",
  CLIENT: "CLIENT",
  TRAINEE: "TRAINEE",
  USER: "USER"
});

export const SYSTEM_PERMISSIONS = Object.freeze({
  READ_ALL_CLIENTS: "READ_ALL_CLIENTS",
  MANAGE_STAFF: "MANAGE_STAFF",
  PUBLISH_PROGRAM: "PUBLISH_PROGRAM",
  UNLOCK_CLINICAL_LOCKOUT: "UNLOCK_CLINICAL_LOCKOUT",
  CORRECT_MEASUREMENTS: "CORRECT_MEASUREMENTS",
  TOGGLE_FREEZE: "TOGGLE_FREEZE",
  VIEW_FINANCIAL_LEDGER: "VIEW_FINANCIAL_LEDGER",
  READ_OWN_PROGRAM: "READ_OWN_PROGRAM",
  SUBMIT_OWN_CHECKIN: "SUBMIT_OWN_CHECKIN",
  LOG_OWN_WORKOUT: "LOG_OWN_WORKOUT"
});

export function normalizeRole(role) {
  const r = String(role || "CLIENT").trim().toUpperCase();
  if (r === "TRAINEE" || r === "USER") return STAFF_ROLES.CLIENT;
  return r;
}

const ROLE_PERMISSIONS = Object.freeze({
  [STAFF_ROLES.ADMIN]: Object.freeze(Object.values(SYSTEM_PERMISSIONS)),
  [STAFF_ROLES.COACH]: Object.freeze([
    SYSTEM_PERMISSIONS.READ_ALL_CLIENTS,
    SYSTEM_PERMISSIONS.PUBLISH_PROGRAM,
    SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT,
    SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS,
    SYSTEM_PERMISSIONS.TOGGLE_FREEZE,
    SYSTEM_PERMISSIONS.VIEW_FINANCIAL_LEDGER
  ]),
  [STAFF_ROLES.ASSISTANT_COACH]: Object.freeze([
    SYSTEM_PERMISSIONS.READ_ALL_CLIENTS,
    SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS
  ]),
  [STAFF_ROLES.CLIENT]: Object.freeze([
    SYSTEM_PERMISSIONS.READ_OWN_PROGRAM,
    SYSTEM_PERMISSIONS.SUBMIT_OWN_CHECKIN,
    SYSTEM_PERMISSIONS.LOG_OWN_WORKOUT
  ])
});

/**
 * Checks whether a given role holds a specific system permission.
 */
export function evaluatePermission(role, permission) {
  if (!role || !permission) return false;
  const normalizedRole = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[normalizedRole] || [];
  return perms.includes(permission);
}

/**
 * Evaluates whether a requesting user has authorization to access/modify a target client resource.
 */
export function evaluateResourceOwnership({
  requestingUser = {},
  targetClientId,
  action = SYSTEM_PERMISSIONS.READ_OWN_PROGRAM
}) {
  const role = normalizeRole(requestingUser.role);
  const requesterId = String(requestingUser.id || "");
  const requesterCode = String(requestingUser.client_code || "");
  const targetId = String(targetClientId || "").replace(/^#+/, "").replace(/^client[-_]?/i, "").trim();

  // 1. ADMIN & COACH have universal administrative purview across all clients
  if (role === STAFF_ROLES.ADMIN || role === STAFF_ROLES.COACH) {
    const hasPerm = evaluatePermission(role, action);
    if (!hasPerm) {
      return {
        is_authorized: false,
        error_code: "ROLE_PERMISSION_DENIED",
        message_ar: "هذا الإجراء غير متاح لمستوى الصلاحية الحالي",
        status_code: 403
      };
    }
    return {
      is_authorized: true,
      role,
      scope: "GLOBAL_STAFF_PURVIEW"
    };
  }

  // 2. ASSISTANT_COACH checks
  if (role === STAFF_ROLES.ASSISTANT_COACH) {
    const hasPerm = evaluatePermission(role, action);
    if (!hasPerm) {
      return {
        is_authorized: false,
        error_code: "ASSISTANT_PRIVILEGES_RESTRICTED",
        message_ar: "هذا الإجراء مقصور على الكوتش الرئيسي والإدارة",
        status_code: 403
      };
    }
    return {
      is_authorized: true,
      role,
      scope: "ASSISTANT_STAFF_PURVIEW"
    };
  }

  // 3. CLIENT / TRAINEE checks
  if (role === STAFF_ROLES.CLIENT) {
    // A client can NEVER execute staff administrative actions
    const staffOnlyActions = [
      SYSTEM_PERMISSIONS.PUBLISH_PROGRAM,
      SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT,
      SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS,
      SYSTEM_PERMISSIONS.TOGGLE_FREEZE,
      SYSTEM_PERMISSIONS.VIEW_FINANCIAL_LEDGER,
      SYSTEM_PERMISSIONS.MANAGE_STAFF,
      SYSTEM_PERMISSIONS.READ_ALL_CLIENTS
    ];

    if (staffOnlyActions.includes(action)) {
      return {
        is_authorized: false,
        error_code: "STAFF_PRIVILEGES_REQUIRED",
        message_ar: "عفواً، هذا الإجراء مقصور على الكوتش والإدارة فقط",
        status_code: 403
      };
    }

    // Client must strictly own the resource they are accessing
    const isOwner = (requesterId && requesterId === targetId) ||
                    (requesterCode && requesterCode.toLowerCase() === targetId.toLowerCase());

    if (!isOwner) {
      return {
        is_authorized: false,
        error_code: "CROSS_TENANT_ACCESS_FORBIDDEN",
        message_ar: "غير مصرح بالوصول إلى بيانات متدرب آخر",
        status_code: 403
      };
    }

    return {
      is_authorized: true,
      role: STAFF_ROLES.CLIENT,
      scope: "OWN_RESOURCE_ONLY"
    };
  }

  return {
    is_authorized: false,
    error_code: "UNKNOWN_ROLE_DENIED",
    message_ar: "مستوى الصلاحية غير معروف ومرفوض أمنياً",
    status_code: 401
  };
}
