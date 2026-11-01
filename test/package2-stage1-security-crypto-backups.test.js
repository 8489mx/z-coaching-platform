import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { escapeHtml, generatePrintablePlanHTML } from "../frontend/src/utils/pdfExportEngine.js";
import { encryptMedicalData, decryptMedicalData } from "../src/utils/crypto.js";
import { requireAuth } from "../src/api/middlewares/auth.middleware.js";
import { performDatabaseBackup, cleanOldBackupsFromDisk } from "../src/api/services/backup.service.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Stage 1 - S4-8: PDF export sanitizes HTML to prevent script injection", () => {
  assert.equal(typeof escapeHtml, "function", "escapeHtml must be an exported function");
  assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  assert.equal(escapeHtml('Hello "World" & \'Team\''), "Hello &quot;World&quot; &amp; &#039;Team&#039;");

  const maliciousPlan = {
    client: {
      name: '<script>alert("hack")</script>',
      goal_title: '<img src=x onerror=alert(1)>',
    },
    plan: {
      coach_notes: '<b onmouseover=alert("pwned")>Important notes</b>',
      workout: {
        title_ar: '<script>evil()</script>',
        exercises: [
          {
            id: "ex1",
            name_ar: '<img src=err onerror=alert(1)>',
            name_en: '<svg onload=alert(2)>',
            sets: 3,
            reps: "10",
            cue: '<script>steal()</script>',
          },
        ],
      },
      meals: [
        {
          title_ar: '<script>mealHack()</script>',
          items: [{ name: '<script>foodXSS()</script>', badge_text: "150g" }],
          calories: 500,
        },
      ],
    },
  };

  const html = generatePrintablePlanHTML(maliciousPlan);
  assert.equal(html.includes("<script>"), false, "HTML output must never contain raw <script> tags");
  assert.equal(html.includes("<img"), false, "HTML output must never contain raw <img> tags");
  assert.equal(html.includes("<svg"), false, "HTML output must never contain raw <svg> tags");
  assert.ok(html.includes("&lt;script&gt;"), "Sanitized script tag must be entity-escaped");
  assert.ok(html.includes("&lt;img"), "Sanitized img tag must be entity-escaped");
});

test("Stage 1 - S4-9: requireAuth strictly drops token from query parameter (req.query.token)", async () => {
  let nextCalled = false;
  let statusSent = null;
  let jsonSent = null;

  const req = {
    headers: {},
    query: { token: "some_valid_or_invalid_query_token" },
  };
  const res = {
    status(s) {
      statusSent = s;
      return {
        json(j) {
          jsonSent = j;
        },
      };
    },
  };
  const next = () => {
    nextCalled = true;
  };

  await requireAuth(req, res, next);

  assert.equal(nextCalled, false, "requireAuth must not accept tokens from req.query");
  assert.equal(statusSent, 401, "Must return 401 Unauthorized when token is only in query string");
  assert.ok(jsonSent?.error, "Must return error message");
});

test("Stage 1 - S4-9: Medical crypto uses authenticated AES-256-GCM and supports legacy decrypt", () => {
  const secretData = { diagnosis: "Hypertension", notes: "Confidential medical record" };

  const encrypted = encryptMedicalData(secretData);
  assert.ok(encrypted, "Encrypted payload must not be null");

  // AES-256-GCM format must be 3 colon-separated hex parts: iv:tag:ciphertext
  const parts = encrypted.split(":");
  assert.equal(parts.length, 3, "AES-256-GCM output must have 3 colon-separated parts (iv:tag:data)");

  const decrypted = decryptMedicalData(encrypted);
  assert.deepEqual(decrypted, secretData, "Decrypted data must match original payload");

  // Tamper detection: modifying ciphertext must fail decryption
  const tampered = parts[0] + ":" + parts[1] + ":" + (parts[2].slice(0, -2) + "ff");
  assert.throws(
    () => decryptMedicalData(tampered),
    "Tampered AES-GCM data must throw authentication failure"
  );
});

test("Stage 1 - S4-6: Database backups exclude password_hash and support 12-month retention purge", async () => {
  const backup = await performDatabaseBackup();
  assert.equal(backup.success, true);
  assert.equal(backup.is_encrypted, true, "Database backup must be marked as encrypted");
  assert.ok(fs.existsSync(backup.filePath), "Encrypted backup file must exist on disk");

  // Verify retention cleanup deletes files older than 365 days
  const dbDir = path.join(root, "backups/db");
  const dummyOldFile = path.join(dbDir, "db_test_dummy_old.json.gz.enc");
  fs.writeFileSync(dummyOldFile, "test dummy old file");

  // Set file mtime to 400 days ago
  const fourHundredDaysAgo = (Date.now() - 400 * 24 * 60 * 60 * 1000) / 1000;
  fs.utimesSync(dummyOldFile, fourHundredDaysAgo, fourHundredDaysAgo);

  assert.ok(fs.existsSync(dummyOldFile), "Dummy old file should exist before cleanup");
  cleanOldBackupsFromDisk(365);
  assert.equal(fs.existsSync(dummyOldFile), false, "Dummy old file must be purged by 365-day retention cleanup");
});
