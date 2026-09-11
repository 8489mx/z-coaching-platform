import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auditDir = path.resolve(__dirname, '../../../backups/audit');

// Ensure audit log directory exists
if (!fs.existsSync(auditDir)) {
  try {
    fs.mkdirSync(auditDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create audit log directory:', e);
  }
}

/**
 * Get current date log file path (YYYY-MM-DD.log)
 */
function getDailyLogFilePath(dateStr) {
  const d = dateStr || new Date().toISOString().split('T')[0];
  return path.join(auditDir, `audit-${d}.log`);
}

/**
 * Record an administrative / security audit event to an immutable JSONL file.
 */
export function recordAuditEvent({
  event,
  req,
  status = 'SUCCESS',
  details = {},
  userId = null,
  userRole = null
}) {
  try {
    const ip = req?.headers?.['x-forwarded-for'] 
      || req?.socket?.remoteAddress 
      || req?.ip 
      || '127.0.0.1';
    
    const userAgent = req?.headers?.['user-agent'] || 'UNKNOWN';
    const effectiveUserId = userId ?? req?.user?.id ?? 'SYSTEM_OR_ANONYMOUS';
    const effectiveRole = userRole ?? req?.user?.role ?? 'UNAUTHENTICATED';

    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: String(effectiveUserId),
      userRole: effectiveRole,
      ip: String(ip).substring(0, 45),
      userAgent: String(userAgent).substring(0, 255),
      status,
      details
    };

    const filePath = getDailyLogFilePath();
    fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf-8');
    return logEntry;
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
    return null;
  }
}

/**
 * Read recent audit events from today's log or specific date
 */
export function readRecentAuditEvents({ limit = 50, dateStr = null } = {}) {
  try {
    const filePath = getDailyLogFilePath(dateStr);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const parsed = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return parsed.slice(-limit);
  } catch (err) {
    console.error('Failed to read audit log:', err);
    return [];
  }
}
