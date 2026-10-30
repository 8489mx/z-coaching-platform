/* Guard for audit finding S4-4: progress photos were served by
   express.static behind requireAuth only, so ANY authenticated account
   could fetch ANY client's photo by guessing its URL
   (/uploads/progress_photos/<code>/w<week>_<pose>_<timestamp>.<ext>),
   bypassing the photo controller's ownership checks. Serving now goes
   through an ownership-checked handler: the folder's client code is
   resolved to a user (client_code, then numeric id, then phone — the
   same lookup the photo controller uses), and the file is served only
   to its owner or a COACH/ADMIN. URLs are unchanged, so existing
   clients keep working. Anything outside progress_photos/, an unknown
   owner, a missing file, or a traversal attempt is a 404; a known
   owner's file requested by another client is a 403. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createUploadFileHandler, parseProgressPhotoPath } from "../src/api/utils/uploadAccess.js";

function fixtureDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "upload-access-"));
  const folder = path.join(dir, "progress_photos", "CLIENT_105");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, "w1_front_123.webp"), "fake-image-bytes");
  fs.writeFileSync(path.join(dir, "secret.txt"), "top-secret");
  return dir;
}

const users = {
  CLIENT_105: { id: 105, role: "CLIENT" },
  200: { id: 200, role: "CLIENT" },
  300: { id: 300, role: "COACH" },
  400: { id: 400, role: "ADMIN" },
};

function makeHandler(dir) {
  return createUploadFileHandler({
    uploadsRoot: dir,
    resolveOwner: async (code) => users[code] || null,
    isStaff: async (userId) => ["COACH", "ADMIN"].includes(users[userId]?.role),
  });
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    sentFile: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    sendFile(filePath, _opts, cb) { this.sentFile = filePath; cb(null); return this; },
  };
  return res;
}

test("parseProgressPhotoPath accepts only the progress-photo shape", () => {
  assert.deepEqual(parseProgressPhotoPath("progress_photos/CLIENT_105/w1_front_1.webp"), {
    clientCode: "CLIENT_105",
    filename: "w1_front_1.webp",
  });
  assert.equal(parseProgressPhotoPath("progress_photos/CLIENT_105/sub/w1.webp"), null);
  assert.equal(parseProgressPhotoPath("other/CLIENT_105/w1.webp"), null);
  assert.equal(parseProgressPhotoPath("progress_photos/CLIENT_105/.hidden"), null);
  assert.equal(parseProgressPhotoPath("progress_photos/CLIENT_105/w1_front_1.txt"), null);
  // Express hands the handler the mount-stripped path with a leading slash.
  assert.deepEqual(parseProgressPhotoPath("/progress_photos/CLIENT_105/w1.webp"), {
    clientCode: "CLIENT_105",
    filename: "w1.webp",
  });
});

test("the owner can fetch their own photo", async () => {
  const dir = fixtureDir();
  const handler = makeHandler(dir);
  const req = { user: { id: 105 }, path: "/progress_photos/CLIENT_105/w1_front_123.webp" };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.sentFile, path.join(dir, "progress_photos", "CLIENT_105", "w1_front_123.webp"));
});

test("another client gets 403 and no file", async () => {
  const dir = fixtureDir();
  const handler = makeHandler(dir);
  const req = { user: { id: 200 }, path: "/progress_photos/CLIENT_105/w1_front_123.webp" };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.sentFile, null);
});

test("coach and admin can fetch a client's photo", async () => {
  const dir = fixtureDir();
  const handler = makeHandler(dir);
  for (const staffId of [300, 400]) {
    const res = mockRes();
    await handler({ user: { id: staffId }, path: "/progress_photos/CLIENT_105/w1_front_123.webp" }, res);
    assert.equal(res.statusCode, 200, `staff ${staffId} must be served`);
    assert.ok(res.sentFile);
  }
});

test("unknown owner, missing file, and non-photo paths are 404", async () => {
  const dir = fixtureDir();
  const handler = makeHandler(dir);
  const cases = [
    { user: { id: 105 }, path: "/progress_photos/NO_SUCH_CODE/w1_front_1.webp" },
    { user: { id: 105 }, path: "/progress_photos/CLIENT_105/w9_front_999.webp" },
    { user: { id: 105 }, path: "/other/w1.webp" },
    { user: { id: 105 }, path: "/" },
  ];
  for (const req of cases) {
    const res = mockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 404, req.path);
    assert.equal(res.sentFile, null, req.path);
  }
});

test("traversal attempts never escape the uploads root", async () => {
  const dir = fixtureDir();
  const handler = makeHandler(dir);
  const res = mockRes();
  await handler(
    { user: { id: 105 }, path: "/progress_photos/CLIENT_105/../../secret.txt" },
    res,
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.sentFile, null);
  assert.ok(!res.sentFile || !res.sentFile.includes("secret.txt"));
});

test("server.js no longer serves /uploads with bare express.static", () => {
  const serverSrc = fs.readFileSync(
    new URL("../src/api/server.js", import.meta.url), "utf8",
  );
  assert.ok(!serverSrc.includes("express.static(uploadsPath)"), "bare static serving of /uploads must be gone");
  assert.ok(serverSrc.includes("createUploadFileHandler"), "server must wire the ownership-checked handler");
});
