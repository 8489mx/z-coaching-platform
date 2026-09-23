import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One search box for every list the coach searches. Each screen drew its own - different widths and
 * heights, and four ways of writing the same shortcut inside the placeholder: "(اضغط /)",
 * "(اضغط / للتركيز)", "(اضغط / للبحث)..." and "[/]". The shortcut is a key badge beside the field
 * now, and each screen keeps its own state, its own ref and its own filtering.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const SCREENS_THAT_SEARCH_A_LIST = [
  "frontend/src/pages/Customers.jsx",
  "frontend/src/pages/FinancialsRenewalsDashboard.jsx",
  "frontend/src/pages/CoachCommandCenter.jsx",
  "frontend/src/pages/IntakeSubmissions.jsx",
  "frontend/src/pages/CheckinReviewDashboard.jsx",
  "frontend/src/pages/WhatsAppRemindersHub.jsx",
  "frontend/src/pages/CoachEditor/components/CoachClientsQueue.jsx",
];

test("every list search uses the one shared box", () => {
  for (const file of SCREENS_THAT_SEARCH_A_LIST) {
    const code = read(file);
    assert.match(code, /import \{ TableSearch \} from '@\/shared\/components\/table-search'/, `${file} draws its own search box`);
    assert.match(code, /<TableSearch[\s>]/, `${file} imports the shared box but does not render it`);
  }
});

test("no screen writes the shortcut into the placeholder any more", () => {
  for (const file of SCREENS_THAT_SEARCH_A_LIST) {
    const code = read(file);
    assert.doesNotMatch(code, /placeholder="[^"]*اضغط \/[^"]*"/, `${file} still explains the shortcut inside the field`);
    assert.doesNotMatch(code, /placeholder="[^"]*\[\/\][^"]*"/, `${file} still explains the shortcut inside the field`);
  }
});

test("the shared box keeps the page's own ref and clears itself", () => {
  const box = read("frontend/src/shared/components/table-search.jsx");
  assert.match(box, /inputRef = null/);
  assert.match(box, /ref=\{inputRef\}/);
  assert.match(box, /onChange\(''\)/);
  assert.match(box, /aria-label="مسح البحث"/);
});

test("the screens with a / shortcut still focus their own field", () => {
  for (const file of ["frontend/src/pages/Customers.jsx", "frontend/src/pages/CoachCommandCenter.jsx", "frontend/src/pages/IntakeSubmissions.jsx", "frontend/src/pages/FinancialsRenewalsDashboard.jsx"]) {
    const code = read(file);
    assert.match(code, /searchInputRef\.current\??\.focus\(\)/, `${file} lost its / shortcut`);
    assert.match(code, /inputRef=\{searchInputRef\}/, `${file} no longer hands its ref to the box`);
  }
});
